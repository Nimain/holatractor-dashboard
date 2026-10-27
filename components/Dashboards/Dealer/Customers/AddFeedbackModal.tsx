"use client";

import React, { useState } from "react";
import { X, Star, User, Mail, Phone, Wrench, MessageSquare, Check, Sparkles } from "lucide-react";

interface AddFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  dealerId?: string;
}

const SERVICE_TYPES = [
  "Tractor Purchase",
  "Field Repair",
  "Spare Parts",
  "Rental Service",
  "General Service",
  "Implements & Attachments",
  "Warranty Claim"
];

export default function AddFeedbackModal({
  isOpen,
  onClose,
  onSuccess,
  dealerId = "",
}: AddFeedbackModalProps) {
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [serviceType, setServiceType] = useState("Tractor Purchase");
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState("PUBLISHED");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      setError("Please provide the customer name");
      return;
    }
    if (!comment.trim()) {
      setError("Please enter the feedback description or review text");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        dealer_id: dealerId,
        customer_name: customerName.trim(),
        customer_email: customerEmail.trim() || null,
        customer_phone: customerPhone.trim() || null,
        service_type: serviceType,
        rating: rating,
        title: title.trim() || `Review by ${customerName}`,
        comment: comment.trim(),
        status: status,
      };

      // Call API
      const res = await fetch("/api/dealer/customer-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to record customer feedback");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to submit feedback");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gradient-to-r from-emerald-500/10 via-amber-500/5 to-transparent">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Star className="w-5 h-5 fill-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Log Customer Feedback
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Record in-store or over-the-phone reviews & ratings
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-xs text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Rating selector */}
          <div className="bg-amber-500/5 dark:bg-amber-500/10 border border-amber-200/50 dark:border-amber-800/40 rounded-xl p-4 text-center">
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Customer Overall Rating
            </label>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => {
                const filled = (hoverRating !== null ? hoverRating : rating) >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(null)}
                    className="p-1 transition-transform hover:scale-125 focus:outline-none"
                  >
                    <Star
                      className={`w-8 h-8 transition-colors ${
                        filled
                          ? "text-amber-400 fill-amber-400 drop-shadow-sm"
                          : "text-gray-300 dark:text-gray-600"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
            <div className="mt-2 text-xs font-bold text-amber-600 dark:text-amber-400">
              {rating === 5 && "5.0 ★★★★★ - Excellent / Exceeded Expectations"}
              {rating === 4 && "4.0 ★★★★☆ - Good / Highly Satisfied"}
              {rating === 3 && "3.0 ★★★☆☆ - Average / Met Expectations"}
              {rating === 2 && "2.0 ★★☆☆☆ - Needs Improvement"}
              {rating === 1 && "1.0 ★☆☆☆☆ - Unsatisfactory"}
            </div>
          </div>

          {/* Customer Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Customer Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Chandra"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Service or Product
              </label>
              <div className="relative">
                <Wrench className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white appearance-none cursor-pointer"
                >
                  {SERVICE_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Customer Phone
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Customer Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  placeholder="ramesh@example.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Headline / Title */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Review Title / Summary
            </label>
            <input
              type="text"
              placeholder="e.g. Prompt delivery and courteous staff"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white"
            />
          </div>

          {/* Comment / Review text */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Detailed Customer Feedback <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <textarea
                required
                rows={4}
                placeholder="Write the customer's detailed feedback, experience with the tractor model, service responsiveness..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full p-3 text-sm bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white resize-none"
              />
            </div>
          </div>

          {/* Publication Status */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
              Publish directly to dealership portal
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStatus("PUBLISHED")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  status === "PUBLISHED"
                    ? "bg-emerald-600 text-white shadow-sm shadow-emerald-500/30"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200"
                }`}
              >
                Published
              </button>
              <button
                type="button"
                onClick={() => setStatus("PENDING")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  status === "PENDING"
                    ? "bg-amber-600 text-white shadow-sm shadow-amber-500/30"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200"
                }`}
              >
                Under Review
              </button>
            </div>
          </div>

          {/* Footer Action */}
          <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl shadow-md shadow-emerald-500/20 flex items-center gap-2 disabled:opacity-50 transition"
            >
              {loading ? (
                <span>Submitting...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save Feedback</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
