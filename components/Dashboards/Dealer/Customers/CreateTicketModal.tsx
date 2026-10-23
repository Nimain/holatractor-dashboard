"use client";

import React, { useState, useEffect } from "react";
import { 
  X, 
  Ticket, 
  User, 
  Mail, 
  Phone, 
  Tag, 
  AlertCircle, 
  Truck, 
  FileText, 
  Loader2, 
  CheckCircle2 
} from "lucide-react";
import { renderInstance } from "@/utils/Axios/RenderInstance";
import { getAuthToken, getAuthUser } from "@/utils/auth/clientAuth";
import { errorMessage, successMessage } from "@/utils/Toastify/Messages";

interface CreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const CATEGORIES = [
  "Tractor Repair",
  "Equipment Delivery",
  "Parts & Inventory",
  "Billing & Invoices",
  "Warranty & Service",
  "General Inquiry"
];

const PRIORITIES = [
  { label: "Low", value: "LOW", desc: "Routine question or minor inquiry", color: "border-blue-300 text-blue-700 bg-blue-50" },
  { label: "Medium", value: "MEDIUM", desc: "Normal operational issue", color: "border-yellow-300 text-yellow-700 bg-yellow-50" },
  { label: "High", value: "HIGH", desc: "Equipment impaired or degraded", color: "border-orange-300 text-orange-700 bg-orange-50" },
  { label: "Urgent", value: "URGENT", desc: "Field halted, harvest risk", color: "border-red-400 text-red-700 bg-red-50" },
];

export default function CreateTicketModal({ isOpen, onClose, onCreated }: CreateTicketModalProps) {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [tractors, setTractors] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    customer_id: "",
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    tractor_id: "",
    tractor_model: "",
    subject: "",
    category: "Tractor Repair",
    priority: "MEDIUM",
    description: "",
    assigned_to: "Dealer Support Team"
  });

  useEffect(() => {
    if (isOpen) {
      const activeToken = getAuthToken() || "";
      const headers = activeToken ? { Authorization: `Bearer ${activeToken}` } : undefined;

      // Fetch customers for autocomplete / selection
      renderInstance.get("/dealer/customers", { headers })
        .then((res) => {
          const list = Array.isArray(res.data) ? res.data : (res.data?.customers || []);
          setCustomers(list);
        })
        .catch(() => setCustomers([]));

      // Fetch tractors for selection
      renderInstance.get("/dealer/tractors", { headers })
        .then((res) => {
          const list = Array.isArray(res.data?.tractors) ? res.data.tractors : [];
          setTractors(list);
        })
        .catch(() => setTractors([]));
    }
  }, [isOpen]);

  const handleCustomerSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const custId = e.target.value;
    if (!custId) {
      setFormData(prev => ({ ...prev, customer_id: "", customer_name: "", customer_email: "", customer_phone: "" }));
      return;
    }
    const found = customers.find(c => c.id === custId);
    if (found) {
      const fullName = `${found.first_name || ""} ${found.last_name || ""}`.trim();
      setFormData(prev => ({
        ...prev,
        customer_id: found.id,
        customer_name: fullName || "Registered Customer",
        customer_email: found.email || "",
        customer_phone: found.mobile || ""
      }));
    }
  };

  const handleTractorSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tId = e.target.value;
    if (!tId) {
      setFormData(prev => ({ ...prev, tractor_id: "", tractor_model: "" }));
      return;
    }
    const found = tractors.find(t => t.id === tId);
    if (found) {
      setFormData(prev => ({
        ...prev,
        tractor_id: found.id,
        tractor_model: `${found.brand || ""} ${found.name || found.model || ""}`.trim()
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customer_name.trim() || !formData.subject.trim() || !formData.description.trim()) {
      errorMessage("Please fill in Customer Name, Subject, and Description.");
      return;
    }

    const authUser = getAuthUser();
    const dealerId = authUser?.dealer_id || authUser?.userId || "cmb7lih4v000ez5ms8nhvegf6";

    const payload = {
      ...formData,
      dealer_id: dealerId,
      priority: formData.priority.toUpperCase()
    };

    setLoading(true);
    try {
      const activeToken = getAuthToken() || "";
      const headers = activeToken ? { Authorization: `Bearer ${activeToken}` } : undefined;

      const res = await renderInstance.post("/dealer/support-tickets", payload, { headers });
      if (res.data?.success) {
        successMessage(`Support ticket ${res.data?.ticket?.ticket_number || ""} opened successfully!`);
        onCreated();
        onClose();
        // Reset form
        setFormData({
          customer_id: "",
          customer_name: "",
          customer_email: "",
          customer_phone: "",
          tractor_id: "",
          tractor_model: "",
          subject: "",
          category: "Tractor Repair",
          priority: "MEDIUM",
          description: "",
          assigned_to: "Dealer Support Team"
        });
      } else {
        errorMessage(res.data?.message || "Failed to create support ticket.");
      }
    } catch (err: any) {
      console.error("Error creating ticket:", err);
      errorMessage(err?.response?.data?.detail || err?.response?.data?.message || "Error submitting ticket.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden my-8 border border-gray-100 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div 
          className="px-6 py-5 text-white flex items-center justify-between shadow-md"
          style={{ background: "linear-gradient(135deg, #A10A0C 0%, #3B0404 100%)" }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md">
              <Ticket className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Open Customer Support Ticket</h2>
              <p className="text-xs text-red-100">Log customer issue, track communication, and dispatch assistance</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Customer Selection or Input */}
          <div className="bg-gray-50/70 p-4 rounded-xl border border-gray-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                <User size={14} className="text-red-600" /> Customer Information <span className="text-red-500">*</span>
              </label>
              {customers.length > 0 && (
                <span className="text-xs text-gray-500">Pick from {customers.length} registered customers</span>
              )}
            </div>

            {customers.length > 0 && (
              <select
                value={formData.customer_id}
                onChange={handleCustomerSelect}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
              >
                <option value="">-- Choose registered customer (or type below) --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.first_name} {c.last_name} ({c.mobile || c.email || "No contact"})
                  </option>
                ))}
              </select>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <input
                  type="text"
                  placeholder="Customer Name *"
                  required
                  value={formData.customer_name}
                  onChange={(e) => setFormData(p => ({ ...p, customer_name: e.target.value }))}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                />
              </div>
              <div>
                <input
                  type="email"
                  placeholder="Email Address"
                  value={formData.customer_email}
                  onChange={(e) => setFormData(p => ({ ...p, customer_email: e.target.value }))}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                />
              </div>
              <div>
                <input
                  type="tel"
                  placeholder="Mobile Phone"
                  value={formData.customer_phone}
                  onChange={(e) => setFormData(p => ({ ...p, customer_phone: e.target.value }))}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Category & Equipment Reference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Tag size={14} className="text-red-600" /> Category <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(p => ({ ...p, category: e.target.value }))}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Truck size={14} className="text-red-600" /> Tractor / Machine Reference
              </label>
              {tractors.length > 0 ? (
                <select
                  value={formData.tractor_id}
                  onChange={handleTractorSelect}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                >
                  <option value="">-- General Equipment / Store Customer --</option>
                  {tractors.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.brand} {t.name || t.model} ({t.hp ? `${t.hp} HP` : "Standard"})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="e.g., John Deere 5075E"
                  value={formData.tractor_model}
                  onChange={(e) => setFormData(p => ({ ...p, tractor_model: e.target.value }))}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                />
              )}
            </div>
          </div>

          {/* Priority Selection */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <AlertCircle size={14} className="text-red-600" /> Urgency Level <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {PRIORITIES.map((p) => {
                const isSelected = formData.priority === p.value;
                return (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, priority: p.value }))}
                    className={`p-3 rounded-xl border text-left transition-all relative ${
                      isSelected 
                        ? `${p.color} ring-2 ring-red-500 border-red-500 shadow-sm font-bold`
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">{p.label}</span>
                      {isSelected && <CheckCircle2 size={16} className="text-red-600" />}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1 line-clamp-1">{p.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Ticket Subject <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Hydraulic Cylinder Pressure Loss in Field 3"
              value={formData.subject}
              onChange={(e) => setFormData(p => ({ ...p, subject: e.target.value }))}
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none font-medium"
            />
          </div>

          {/* Issue Description */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Detailed Description <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              placeholder="Describe symptoms, field location, operating hours, recent maintenance, or customer concerns..."
              value={formData.description}
              onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
            />
          </div>

          {/* Assigned Technician or Department */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Assigned Specialist / Department
            </label>
            <input
              type="text"
              placeholder="e.g., Abhi Mohapatra (Lead Field Tech) or Parts Dispatch Desk"
              value={formData.assigned_to}
              onChange={(e) => setFormData(p => ({ ...p, assigned_to: e.target.value }))}
              className="w-full px-3.5 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Opening Ticket...
                </>
              ) : (
                <>
                  <Ticket size={16} />
                  Open Support Ticket
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
