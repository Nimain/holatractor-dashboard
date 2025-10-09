"use client";

import { useState, useEffect } from "react";
import { X, Upload, Package } from "lucide-react";
import { useCookie } from "next-cookie";
import { renderInstance } from "@/utils/Axios/RenderInstance";
import { errorMessage, successMessage } from "@/utils/Toastify/Messages";
import { CircularProgress } from "@mui/material";

interface AddPartsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSuccess: () => void;
  inventoryData: any[];
}

interface PartFormData {
  part_name: string;
  part_number: string;
  category: string;
  brand: string;
  price: string;
  quantity_in_stock: string;
  dealer_id: string;
  base_id: string;
  description?: string;
  tractor_model?: string;
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

export default function AddPartsModal({ isOpen, onClose, onAddSuccess, inventoryData }: AddPartsModalProps) {
  const { cookie } = useCookie();
  const access_token = cookie?.get("access_token");

  const [loading, setLoading] = useState(false);
  const [dealerId, setDealerId] = useState<string>("");
  const [baseId, setBaseId] = useState<string>("");

  const [formData, setFormData] = useState<PartFormData>({
    part_name: "",
    part_number: "",
    category: "",
    brand: "",
    price: "",
    quantity_in_stock: "",
    dealer_id: "",
    base_id: "",
    description: "",
    tractor_model: "",

  });

  // Fetch dealer and base IDs on mount
  useEffect(() => {
    if (isOpen && access_token && !dealerId) {
      renderInstance.get("/dealer", { 
        headers: { Authorization: `Bearer ${access_token}` } 
      })
      .then((res) => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          const fetchedDealerId = res.data[0].id;
          const fetchedBaseId = res.data[0].base_id || ""; // Adjust based on your API response
          setDealerId(fetchedDealerId);
          setBaseId(fetchedBaseId);
          setFormData(prev => ({
            ...prev,
            dealer_id: fetchedDealerId,
            base_id: fetchedBaseId
          }));
        }
      })
      .catch(() => errorMessage("Failed to fetch dealer information"));
    }
  }, [isOpen, access_token, dealerId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.part_name || !formData.part_number || !formData.category || 
        !formData.brand || !formData.price || !formData.quantity_in_stock) {
      errorMessage("Please fill in all required fields");
      return;
    }

    if (!dealerId || !baseId) {
      errorMessage("Dealer information not loaded");
      return;
    }

    setLoading(true);

    // Prepare payload
    const payload = {
      part_name: formData.part_name,
      part_number: formData.part_number,
      category: formData.category,
      brand: formData.brand,
      price: parseFloat(formData.price),
      quantity_in_stock: parseInt(formData.quantity_in_stock),
      dealer_id: dealerId,
      base_id: baseId,
      ...(formData.description && { description: formData.description }),
      ...(formData.tractor_model && { tractor_model: formData.tractor_model })
    };

    try {
      await renderInstance.post("/dealer/tractor-parts", payload, {
        headers: { Authorization: `Bearer ${access_token}` }
      });
      
      successMessage("Part added successfully!");
      
      // Reset form
      setFormData({
        part_name: "",
        part_number: "",
        category: "",
        brand: "",
        price: "",
        quantity_in_stock: "",
        dealer_id: dealerId,
        base_id: baseId,
        description: "",
        tractor_model: ""
      });
      
      onAddSuccess();
    } catch (error: any) {
      errorMessage(error?.response?.data?.message || "Failed to add part");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        part_name: "",
        part_number: "",
        category: "",
        brand: "",
        price: "",
        quantity_in_stock: "",
        dealer_id: dealerId,
        base_id: baseId,
        description: "",
        tractor_model: ""
      });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-red-600 to-red-800 text-white p-6 flex justify-between items-center rounded-t-lg">
          <div className="flex items-center gap-3">
            <Package size={28} />
            <h2 className="text-2xl font-bold">Add New Part</h2>
          </div>
          <button 
            onClick={handleClose} 
            disabled={loading}
            className="hover:bg-red-700 p-2 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Part Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Part Name <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                name="part_name"
                value={formData.part_name}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="e.g., Hydraulic Pump Advanced"
                required
              />
            </div>

            {/* Part Number */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Part Number <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                name="part_number"
                value={formData.part_number}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="e.g., HP-TEST-2025-001"
                required
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Category <span className="text-red-600">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                required
              >
                <option value="">Select Category</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Brand */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Brand <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="e.g., John Deere"
                required
              />
            </div>

            {/* Tractor Model (Optional) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tractor Model
              </label>
              <input
                type="text"
                name="tractor_model"
                value={formData.tractor_model}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="e.g., 5075E"
              />
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Price ($) <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="e.g., 2500.00"
                required
              />
            </div>

            {/* Quantity in Stock */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Quantity in Stock <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                name="quantity_in_stock"
                value={formData.quantity_in_stock}
                onChange={handleInputChange}
                min="0"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="e.g., 8"
                required
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                placeholder="Additional details about the part..."
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 mt-8">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-800 text-white rounded-lg font-semibold hover:from-red-700 hover:to-red-900 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <CircularProgress size={20} style={{ color: 'white' }} />
                  Adding...
                </>
              ) : (
                <>
                  <Upload size={20} />
                  Add Part
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}