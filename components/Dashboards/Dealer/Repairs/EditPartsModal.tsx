"use client";

import React, { useState, useEffect } from "react";
import { X, Save, Package } from "lucide-react";
import { renderInstance } from "@/utils/Axios/RenderInstance";
import { errorMessage, successMessage } from "@/utils/Toastify/Messages";
import { getAuthToken } from "@/utils/auth/clientAuth";
import { CircularProgress } from "@mui/material";

export interface InventoryPart {
  id: string;
  part_name: string;
  part_number: string;
  category: string;
  brand?: string;
  tractor_model?: string;
  description?: string;
  price: number | string;
  quantity_in_stock: number | string;
  status?: number;
  dealer_id?: string;
  base_id?: string;
}

interface EditPartsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateSuccess: () => void;
  part: InventoryPart | null;
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

export default function EditPartsModal({ isOpen, onClose, onUpdateSuccess, part }: EditPartsModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    part_name: "",
    part_number: "",
    category: "",
    brand: "",
    price: "",
    quantity_in_stock: "",
    description: "",
    tractor_model: "",
    status: 1,
  });

  useEffect(() => {
    if (part && isOpen) {
      setFormData({
        part_name: part.part_name || "",
        part_number: part.part_number || "",
        category: part.category || "",
        brand: part.brand || "",
        price: part.price !== undefined ? String(part.price) : "",
        quantity_in_stock: part.quantity_in_stock !== undefined ? String(part.quantity_in_stock) : "",
        description: part.description || "",
        tractor_model: part.tractor_model || "",
        status: part.status !== undefined ? Number(part.status) : 1,
      });
    }
  }, [part, isOpen]);

  if (!isOpen || !part) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.part_name || !formData.part_number || !formData.category || !formData.price || !formData.quantity_in_stock) {
      errorMessage("Please fill in all required fields");
      return;
    }

    setLoading(true);

    try {
      const activeToken = getAuthToken() || "";
      const headers = activeToken ? { Authorization: `Bearer ${activeToken}` } : undefined;

      const payload = {
        part_name: formData.part_name.trim(),
        part_number: formData.part_number.trim(),
        category: formData.category,
        brand: formData.brand.trim() || undefined,
        price: parseFloat(formData.price),
        quantity_in_stock: parseInt(formData.quantity_in_stock, 10),
        tractor_model: formData.tractor_model.trim() || undefined,
        description: formData.description.trim() || undefined,
        status: Number(formData.status),
      };

      await renderInstance.put(`/dealer/tractor-parts/${part.id}`, payload, { headers });
      successMessage("Part updated successfully!");
      onUpdateSuccess();
      onClose();
    } catch (err: any) {
      console.error("Error updating part:", err);
      errorMessage(err?.response?.data?.detail || "Failed to update part. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-red-50 to-orange-50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-600 text-white rounded-xl shadow-md">
              <Package size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Edit Tractor Part</h2>
              <p className="text-xs text-gray-500">Update part inventory, pricing and details</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 rounded-lg p-1.5 hover:bg-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Part Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="part_name"
                value={formData.part_name}
                onChange={handleInputChange}
                required
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                placeholder="e.g., Hydraulic Pump"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Part Number / SKU <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="part_number"
                value={formData.part_number}
                onChange={handleInputChange}
                required
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                placeholder="e.g., HP-JD-2025"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
              >
                <option value="">Select Category</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Brand / Manufacturer
              </label>
              <input
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                placeholder="e.g., John Deere, Bosch"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Price ($) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                required
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Stock Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                name="quantity_in_stock"
                value={formData.quantity_in_stock}
                onChange={handleInputChange}
                required
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                placeholder="10"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
              >
                <option value={1}>Active</option>
                <option value={0}>Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Compatible Tractor Models
            </label>
            <input
              type="text"
              name="tractor_model"
              value={formData.tractor_model}
              onChange={handleInputChange}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
              placeholder="e.g., JD 7520, MF 285"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleInputChange}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
              placeholder="Technical specifications, warranty, or application notes..."
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-xl shadow-md hover:shadow-lg disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {loading ? (
                <>
                  <CircularProgress size={18} color="inherit" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Update Part</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
