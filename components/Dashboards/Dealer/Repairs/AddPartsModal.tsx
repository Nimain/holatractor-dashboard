"use client";
import { useState, useEffect, useCallback } from "react";
import { Search, Package, X, ArrowLeft } from "lucide-react";
import { useCookie } from "next-cookie";
import { renderInstance } from "@/utils/Axios/RenderInstance";
import { errorMessage, successMessage } from "@/utils/Toastify/Messages";
import { CircularProgress } from "@mui/material";

// Type for the parts already in the main inventory
interface InventoryPart {
    id: string | number;
    part_number: string;
}

// Type for the parts available to be added
interface AvailablePart {
    id: string | number;
    part_name: string;
    part_number: string;
    description?: string;
    tractor_model?: string;
    category?: string;
    brand?: string;
    image?: string;
}

// Type for the modal's props
interface AddPartsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddSuccess: () => void;
    inventoryData: InventoryPart[]; // Prop to receive current inventory
}

export default function AddPartsModal({ isOpen, onClose, onAddSuccess, inventoryData }: AddPartsModalProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [availableParts, setAvailableParts] = useState<AvailablePart[]>([]);
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);
    const [selectedPart, setSelectedPart] = useState<AvailablePart | null>(null);
    const [stockCost, setStockCost] = useState({ stock: "", cost: "" });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { cookie } = useCookie();
    const access_token = cookie?.get("access_token");

    const fetchAvailableParts = useCallback(() => {
        if (!access_token) return;
        setLoading(true);
        const params = new URLSearchParams();
        if (searchTerm) params.append("search", searchTerm);
        
        renderInstance.get(`/dealer/tractor-parts/all?${params.toString()}`, { headers: { Authorization: `Bearer ${access_token}` } })
            .then(response => {
                const allParts = Array.isArray(response.data.parts) ? response.data.parts : [];
                
                const inventoryPartNumbers = new Set(inventoryData.map(p => p.part_number));
                
                const trulyAvailableParts = allParts.filter(
                    (part: AvailablePart) => !inventoryPartNumbers.has(part.part_number)
                );

                setAvailableParts(trulyAvailableParts);
            })
            .catch(error => {
                errorMessage("Error fetching available parts");
                console.error("❌ Error fetching parts:", error);
            })
            .finally(() => setLoading(false));
    }, [access_token, searchTerm, inventoryData]);

    useEffect(() => {
        if (isOpen && step === 1) {
            fetchAvailableParts();
        }
    }, [isOpen, step, fetchAvailableParts]);
    
    const handleAddToInventory = () => {
        if (!stockCost.stock || !stockCost.cost || !selectedPart) {
            return errorMessage("Please enter both stock and price.");
        }
        if (!access_token) return errorMessage("User not authenticated.");

        setIsSubmitting(true);
        renderInstance.get("/dealer", { headers: { Authorization: `Bearer ${access_token}` } })
            .then(dealerRes => {
                if (!Array.isArray(dealerRes.data) || dealerRes.data.length === 0) throw new Error("Dealer not found");
                
                // ✅ Fixed: Matches the exact API structure from your screenshot
                const postData = {
                    part_name: selectedPart.part_name,
                    part_number: selectedPart.part_number,
                    category: selectedPart.category || "Other",
                    brand: selectedPart.brand || "Unknown",
                    price: parseFloat(stockCost.cost),
                    quantity_in_stock: parseInt(stockCost.stock),
                    dealer_id: dealerRes.data[0].id,
                    base_id: selectedPart.id.toString()  // ✅ This is the key field that was missing!
                };
                
                console.log("📤 Sending data:", postData);
                return renderInstance.post("/dealer/tractor-parts", postData, { headers: { Authorization: `Bearer ${access_token}` } });
            })
            .then((response) => {
                console.log("✅ Response:", response.data);
                successMessage("Part added to inventory!");
                onAddSuccess();  // This triggers the parent to refresh
                handleClose();
            })
            .catch(error => {
                console.error("❌ Full error:", error.response?.data);
                errorMessage(error.response?.data?.message || "Error adding part");
            })
            .finally(() => setIsSubmitting(false));
    };

    const handleClose = () => {
        setStep(1);
        setSelectedPart(null);
        setStockCost({ stock: "", cost: "" });
        setSearchTerm("");
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="rounded-lg max-w-6xl w-full max-h-[90vh] flex flex-col" style={{ background: `linear-gradient(135deg, #A10A0C 0%, #3B0404 100%)` }}>
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-red-900/30">
                    <div className="flex items-center gap-4">
                        {step === 2 && <button onClick={() => setStep(1)} className="text-white hover:text-gray-300"><ArrowLeft size={24} /></button>}
                        <div>
                            <h2 className="text-2xl font-bold text-white">{step === 1 ? "Select a Part to Add" : "Enter Stock & Price"}</h2>
                        </div>
                    </div>
                    <button onClick={handleClose} className="text-white hover:text-gray-300"><X size={24} /></button>
                </div>

                {/* Modal Body */}
                <div className="flex-grow overflow-y-auto">
                    {step === 1 ? (
                        <div>
                            {/* Search Bar */}
                            <div className="p-6 border-b border-red-900/30">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-red-500" size={20} />
                                    <input type="text" placeholder="Search available parts by name or number..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 py-3 border rounded-lg" />
                                </div>
                            </div>
                            {/* Parts Grid */}
                            <div className="p-6">
                                {loading ? <div className="text-center text-white p-10"><CircularProgress style={{ color: 'white' }}/></div> : 
                                availableParts.length === 0 ? <div className="text-center text-white p-10 font-semibold">No new parts available to add.</div> :
                                (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {availableParts.map((part) => (
                                            <div key={part.id} className="bg-white rounded-lg p-4 shadow-lg flex flex-col">
                                                <div className="h-28 flex items-center justify-center bg-gray-50 rounded-lg mb-4 p-2">
                                                    {part.image ? <img src={part.image} alt={part.part_name} className="max-h-full max-w-full object-contain" /> : <Package className="text-gray-400" size={40}/>}
                                                </div>
                                                <h3 className="text-sm font-semibold text-gray-800 h-10 line-clamp-2">{part.part_name}</h3>
                                                <p className="text-xs text-gray-500 mb-4">#{part.part_number}</p>
                                                <button onClick={() => { setSelectedPart(part); setStep(2); }} className="w-full mt-auto bg-orange-500 text-white py-2 rounded-lg font-semibold hover:bg-orange-600">Select</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="p-8">
                            {selectedPart && (
                                <div className="max-w-xl mx-auto bg-white p-6 rounded-lg">
                                    <h3 className="text-xl font-bold text-gray-800 mb-1">{selectedPart.part_name}</h3>
                                    <p className="text-sm text-gray-500 mb-6">Part Number: {selectedPart.part_number}</p>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Stock Quantity</label>
                                            <input type="number" min="1" value={stockCost.stock} onChange={(e) => setStockCost({ ...stockCost, stock: e.target.value })} placeholder="e.g., 50" className="w-full p-3 border rounded-lg" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Price ($)</label>
                                            <input type="number" min="0" step="0.01" value={stockCost.cost} onChange={(e) => setStockCost({ ...stockCost, cost: e.target.value })} placeholder="e.g., 450.00" className="w-full p-3 border rounded-lg" />
                                        </div>
                                        <button onClick={handleAddToInventory} disabled={isSubmitting || !stockCost.stock || !stockCost.cost} className="w-full mt-4 bg-orange-500 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-orange-600 disabled:bg-gray-400">
                                            {isSubmitting ? (<><CircularProgress size={20} style={{ color: 'white' }} /> Adding...</>) : "Add to Inventory"}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}