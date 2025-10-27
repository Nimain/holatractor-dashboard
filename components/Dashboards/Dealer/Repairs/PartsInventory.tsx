"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Search, Plus, Package, Filter, X } from "lucide-react";
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
  status: number;
  category?: string;
}

const CATEGORIES = [
  "Engine", "Hydraulics", "Transmission", "Electrical", "Brakes", "Steering",
  "Body & Cab", "Tires & Wheels", "Attachments", "Filters & Fluids",
  "Belts & Chains", "Bearings & Seals"
];

export default function PartsInventory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [inventoryData, setInventoryData] = useState<InventoryPart[]>([]);
  const [loading, setLoading] = useState(true);
  const [dealerId, setDealerId] = useState<string>("");

  const { cookie } = useCookie();
  const access_token = cookie?.get("access_token");

  const fetchInventory = useCallback(() => {
    if (!access_token) {
      errorMessage("Access token not found.");
      setLoading(false);
      return;
    }
    setLoading(true);
    
    renderInstance.get("/dealer", { headers: { Authorization: `Bearer ${access_token}` } })
      .then((dealerRes) => {
        if (!Array.isArray(dealerRes.data) || dealerRes.data.length === 0) {
          return Promise.reject("No dealer data");
        }
        const fetchedDealerId = dealerRes.data[0].id;
        setDealerId(fetchedDealerId);
        
        let queryParams = `dealer_id=${fetchedDealerId}`;
        if (selectedCategory) queryParams += `&category=${encodeURIComponent(selectedCategory)}`;
        if (searchTerm.trim()) queryParams += `&search=${encodeURIComponent(searchTerm.trim())}`;
        
        return renderInstance.get(`/dealer/tractor-parts/all?${queryParams}`, {
          headers: { Authorization: `Bearer ${access_token}` },
        });
      })
      .then((partsRes) => {
        const partsData = Array.isArray(partsRes.data.parts) ? partsRes.data.parts : [];
        setInventoryData(partsData);
      })
      .catch((err) => {
        if (err !== "No dealer data") errorMessage("Error fetching inventory");
        setInventoryData([]);
      })
      .finally(() => setLoading(false));
  }, [access_token, selectedCategory, searchTerm]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleAddSuccess = () => {
    setIsModalOpen(false);
    successMessage("Part added successfully! Refreshing list...");
    setTimeout(() => {
      fetchInventory();
    }, 500);
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setIsFilterOpen(false);
  };

  const clearFilters = () => {
    setSelectedCategory("");
    setSearchTerm("");
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategory) count++;
    if (searchTerm.trim()) count++;
    return count;
  }, [selectedCategory, searchTerm]);

  if (loading && inventoryData.length === 0) {
    return (
      <div className="flex items-center justify-center p-4 h-screen bg-gray-100">
        <div className="text-center">
          <CircularProgress size={48} style={{ color: '#A10A0C' }} />
          <p className="mt-4 text-lg text-gray-600">Loading inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-2 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3 sm:mb-4 px-1">Parts Inventory</h1>
          <div className="rounded-lg p-4 sm:p-6 lg:p-8 text-white" style={{ background: `linear-gradient(135deg, #A10A0C 0%, #3B0404 100%)` }}>
            <h2 className="text-xl sm:text-2xl font-bold mb-4">Manage Your Parts Inventory</h2>
            <button onClick={() => setIsModalOpen(true)} className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 sm:px-6 sm:py-3 rounded-lg font-semibold flex items-center gap-2 text-sm sm:text-base">
              <Plus size={20} /> Add Parts
            </button>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="mb-4 sm:mb-6 flex flex-col md:flex-row gap-3 sm:gap-4">
          <div className="relative flex-grow md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-red-500" size={20} />
            <input
              type="text"
              placeholder="Search by name or part number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-semibold text-gray-700"
              >
                <Filter size={20} className="text-red-600" />
                <span>Filter</span>
                {activeFiltersCount > 0 && (
                  <span className="bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
              {isFilterOpen && (
                <div className="absolute top-full mt-2 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 w-64 max-h-80 overflow-y-auto">
                  <div className="p-3 border-b flex justify-between items-center sticky top-0 bg-gray-50">
                    <span className="font-semibold text-gray-700">Categories</span>
                    <button onClick={() => setIsFilterOpen(false)} className="text-gray-500 hover:text-gray-700">
                      <X size={18} />
                    </button>
                  </div>
                  <div className="p-2">
                    {CATEGORIES.map((cat) => (
                      <button key={cat} onClick={() => handleCategorySelect(cat)} className={`w-full text-left px-4 py-2 rounded-md transition-colors ${selectedCategory === cat ? "bg-red-100 text-red-700 font-semibold" : "hover:bg-gray-100 text-gray-700"}`}>
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {activeFiltersCount > 0 && (
              <button onClick={clearFilters} className="flex items-center gap-2 px-4 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors font-semibold text-gray-700">
                <X size={18} /> Clear
              </button>
            )}
          </div>
        </div>

        {/* Active Filters Display */}
        {(selectedCategory || searchTerm) && (
          <div className="mb-4 flex flex-wrap gap-2">
            {selectedCategory && (
              <div className="flex items-center gap-2 bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
                <span>Category: {selectedCategory}</span>
                <button onClick={() => setSelectedCategory("")} className="hover:bg-red-200 rounded-full p-0.5"><X size={14} /></button>
              </div>
            )}
            {searchTerm && (
              <div className="flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                <span>Search: "{searchTerm}"</span>
                <button onClick={() => setSearchTerm("")} className="hover:bg-blue-200 rounded-full p-0.5"><X size={14} /></button>
              </div>
            )}
          </div>
        )}

        {/* Inventory Display */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <CircularProgress size={40} style={{ color: '#A10A0C' }} />
            </div>
          ) : inventoryData.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Package size={64} className="mx-auto mb-4 text-gray-300" />
              <p className="text-xl font-semibold">No parts found</p>
              <p className="text-sm text-gray-400 mt-2">
                {activeFiltersCount > 0 ? "Try adjusting your filters" : "Add your first part to get started"}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 text-red-600">
                    <tr>
                      {["Part Name", "Part Number", "Category", "Model", "Stock", "Price", "Status"].map(h => (
                        <th key={h} className="px-6 py-4 text-left font-semibold text-sm">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-gradient-to-r from-[#A10A0C] to-[#3B0404]">
                    {inventoryData.map((part) => (
                      <tr key={part.id} className="hover:bg-white/20">
                        <td className="px-6 py-4 font-medium text-white whitespace-nowrap">{part.part_name}</td>
                        <td className="px-6 py-4 text-white">{part.part_number}</td>
                        <td className="px-6 py-4 text-white">
                          <span className="inline-flex items-center px-2 py-1 rounded-md bg-red-50 text-red-700 text-xs font-medium">
                            {part.category || "N/A"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-white">{part.tractor_model || "N/A"}</td>
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
              </div>
              
              {/* Mobile/Tablet Card View */}
              <div className="lg:hidden">
                <div className="space-y-3 p-2 sm:p-4">
                  {inventoryData.map((part) => (
                    <div key={part.id} className="bg-white p-4 rounded-lg shadow border border-gray-200">
                      <div className="flex justify-between items-start mb-3 ">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-gray-900">{part.part_name}</h3>
                          <p className="text-sm text-gray-500">{part.part_number}</p>
                        </div>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${part.status === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {part.status === 1 ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <div>
                          <p className="text-gray-500">Category</p>
                          <p className="font-medium text-gray-800">{part.category || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Model</p>
                          <p className="font-medium text-gray-800">{part.tractor_model || 'N/A'}</p>
                        </div>
                        <div className="border-t col-span-2 my-2"></div>
                        <div className="text-left">
                          <p className="text-gray-500">Stock</p>
                          <p className="text-lg font-bold text-red-600">{part.quantity_in_stock}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-gray-500">Price</p>
                          <p className="text-lg font-bold text-red-600">${Number(part.price).toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
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