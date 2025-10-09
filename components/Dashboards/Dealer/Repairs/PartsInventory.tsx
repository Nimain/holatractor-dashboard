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
  "Engine",
  "Hydraulics",
  "Transmission",
  "Electrical",
  "Brakes",
  "Steering",
  "Body & Cab",
  "Tires & Wheels",
  "Attachments",
  "Filters & Fluids",
  "Belts & Chains",
  "Bearings & Seals"
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
        
        // Build query parameters
        let queryParams = `dealer_id=${fetchedDealerId}`;
        if (selectedCategory) {
          queryParams += `&category=${encodeURIComponent(selectedCategory)}`;
        }
        if (searchTerm.trim()) {
          queryParams += `&search=${encodeURIComponent(searchTerm.trim())}`;
        }
        
        return renderInstance.get(`/dealer/tractor-parts/all?${queryParams}`, {
          headers: { Authorization: `Bearer ${access_token}` },
        });
      })
      .then((partsRes) => {
        const partsData = Array.isArray(partsRes.data.parts) ? partsRes.data.parts : [];
        setInventoryData(partsData);
        console.log(partsData);
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

        {/* Search and Filter Section */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-red-500" size={20} />
            <input
              type="text"
              placeholder="Search parts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          {/* Filter Button */}
          <div className="relative">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-semibold text-gray-700"
            >
              <Filter size={20} className="text-red-600" />
              Filter by Category
              {activeFiltersCount > 0 && (
                <span className="bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Filter Dropdown */}
            {isFilterOpen && (
              <div className="absolute top-full mt-2 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 w-64 max-h-96 overflow-y-auto">
                <div className="p-3 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                  <span className="font-semibold text-gray-700">Categories</span>
                  <button
                    onClick={() => setIsFilterOpen(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="p-2">
                  {CATEGORIES.map((category) => (
                    <button
                      key={category}
                      onClick={() => handleCategorySelect(category)}
                      className={`w-full text-left px-4 py-2 rounded-md transition-colors ${
                        selectedCategory === category
                          ? "bg-red-100 text-red-700 font-semibold"
                          : "hover:bg-gray-100 text-gray-700"
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Clear Filters Button */}
          {activeFiltersCount > 0 && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 px-4 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors font-semibold text-gray-700"
            >
              <X size={18} />
              Clear
            </button>
          )}
        </div>

        {/* Active Filters Display */}
        {(selectedCategory || searchTerm) && (
          <div className="mb-4 flex flex-wrap gap-2">
            {selectedCategory && (
              <div className="flex items-center gap-2 bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
                <span>Category: {selectedCategory}</span>
                <button
                  onClick={() => setSelectedCategory("")}
                  className="hover:bg-red-200 rounded-full p-0.5"
                >
                  <X size={14} />
                </button>
              </div>
            )}
            {searchTerm && (
              <div className="flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                <span>Search: "{searchTerm}"</span>
                <button
                  onClick={() => setSearchTerm("")}
                  className="hover:bg-blue-200 rounded-full p-0.5"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Parts Table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
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
              <table className="w-full">
                <thead className="bg-gray-50 text-red-600">
                  <tr>
                    {["S.No", "Part Name", "Part Number", "Category", "Model", "Stock", "Price", "Status"].map(h => (
                      <th key={h} className="px-6 py-4 text-left font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody style={{ background: `linear-gradient(135deg, #A10A0C 0%, #3B0404 100%)` }}>
                  {inventoryData.map((part, index) => (
                    <tr key={part.id} className="border-b border-red-900/30">
                      <td className="px-6 py-4 text-white font-semibold">{index + 1}</td>
                      
                      <td className="px-6 py-4 font-medium text-white">{part.part_name}</td>
                      <td className="px-6 py-4 text-white">{part.part_number}</td>
                      <td className="px-6 py-4 text-white">
                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-white/10 text-xs">
                          {part.category || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-white">{part.tractor_model || "N/A"}</td>
                      <td className="px-6 py-4 font-semibold text-white">{part.quantity_in_stock}</td>
                      <td className="px-6 py-4 font-semibold text-white">${Number(part.price).toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          part.status === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
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