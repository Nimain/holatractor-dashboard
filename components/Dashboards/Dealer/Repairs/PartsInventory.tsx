"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Search, Plus, Package } from "lucide-react";
import { useCookie } from "next-cookie";
import { renderInstance } from "@/utils/Axios/RenderInstance";
import { errorMessage, successMessage } from "@/utils/Toastify/Messages";
import { CircularProgress } from "@mui/material";
import AddPartsModal from "./AddPartsModal";

// Type for the inventory part object
interface InventoryPart {
  id: string | number;
  part_name: string;
  part_number: string;
  description: string;
  tractor_model: string;
  quantity_in_stock: number;
  price: number;
  image?: string;
  status: number;
}

export default function PartsInventory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inventoryData, setInventoryData] = useState<InventoryPart[]>([]);
  const [loading, setLoading] = useState(true);

  const { cookie } = useCookie();
  const access_token = cookie?.get("access_token");

  const fetchInventory = useCallback(() => {
    if (!access_token) {
      errorMessage("Access token not found.");
      return;
    }
    setLoading(true);
    renderInstance.get("/dealer", { headers: { Authorization: `Bearer ${access_token}` } })
      .then((dealerRes) => {
        if (!Array.isArray(dealerRes.data) || dealerRes.data.length === 0) {
          return Promise.reject("No dealer data");
        }
        const fetchedDealerId = dealerRes.data[0].id;
        return renderInstance.get(`/dealer/tractor-parts/all?dealer_id=${fetchedDealerId}`, {
          headers: { Authorization: `Bearer ${access_token}` },
        });
      })
      .then((partsRes) => {
        const partsData = Array.isArray(partsRes.data.parts) ? partsRes.data.parts : [];
        setInventoryData(partsData);
        if (partsData.length > 0) {
          successMessage(`Loaded ${partsData.length} parts`);
        }
      })
      .catch((err) => {
        if (err !== "No dealer data") errorMessage("Error fetching inventory");
        setInventoryData([]);
      })
      .finally(() => setLoading(false));
  }, [access_token]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const filteredParts = useMemo(() => 
    inventoryData.filter(
      (part) =>
        part.part_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        part.part_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        part.tractor_model?.toLowerCase().includes(searchTerm.toLowerCase())
    ), [inventoryData, searchTerm]
  );

  // ✅ Fixed: Refetch the entire inventory to ensure sync
  const handleAddSuccess = () => {
    fetchInventory();
    setIsModalOpen(false);
  };

  if (loading && inventoryData.length === 0) {
    return (
      <div className="flex items-center justify-center p-6 h-screen bg-gray-100">
        <div className="text-center">
          <CircularProgress size={48} style={{ color: '#A10A0C' }} />
          <p className="mt-4 text-lg text-gray-600">Loading inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
            <h1 className="text-3xl font-bold text-red-600 mb-4">Parts Inventory</h1>
            <div className="rounded-lg p-8 text-white" style={{ background: `linear-gradient(135deg, #A10A0C 0%, #3B0404 100%)` }}>
                <h2 className="text-2xl font-bold mb-4">Manage Your Parts Inventory</h2>
                <button onClick={() => setIsModalOpen(true)} className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2">
                    <Plus size={20} /> Add Parts
                </button>
            </div>
        </div>
        <div className="mb-6 relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-red-500" size={20} />
            <input type="text" placeholder="Search by name, number, or model" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 border rounded-lg" />
        </div>
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            {filteredParts.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Package size={64} className="mx-auto mb-4 text-gray-300" />
                <p className="text-xl font-semibold">No parts found</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 text-red-600">
                  <tr>
                    {["S.No", "Image", "Part Name", "Part Number", "Model", "Stock", "Price", "Status"].map(h => <th key={h} className="px-6 py-4 text-left font-semibold">{h}</th>)}
                  </tr>
                </thead>
                <tbody style={{ background: `linear-gradient(135deg, #A10A0C 0%, #3B0404 100%)` }}>
                  {filteredParts.map((part, index) => (
                    <tr key={part.id} className="border-b border-red-900/30">
                      <td className="px-6 py-4 text-white font-semibold">{index + 1}</td>
                      <td className="px-6 py-4">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                          {part.image ? <img src={part.image} alt={part.part_name} className="w-full h-full object-cover rounded-full" /> : <Package className="text-red-600" size={24} />}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-white">{part.part_name}</td>
                      <td className="px-6 py-4 text-white">{part.part_number}</td>
                      <td className="px-6 py-4 text-white">{part.tractor_model}</td>
                      <td className="px-6 py-4 font-semibold text-white">{part.quantity_in_stock}</td>
                      <td className="px-6 py-4 font-semibold text-white">${Number(part.price).toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${part.status === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {part.status === 1 ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
        <AddPartsModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            onAddSuccess={handleAddSuccess} 
            inventoryData={inventoryData}
        />
      </div>
    </div>
  );
}