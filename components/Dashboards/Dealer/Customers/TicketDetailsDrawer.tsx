"use client";

import React, { useState } from "react";
import { 
  X, 
  Send, 
  User, 
  Phone, 
  Mail, 
  Truck, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Tag, 
  MessageSquare, 
  Loader2,
  CheckCircle2,
  FileCheck
} from "lucide-react";
import { renderInstance } from "@/utils/Axios/RenderInstance";
import { getAuthToken } from "@/utils/auth/clientAuth";
import { errorMessage, successMessage } from "@/utils/Toastify/Messages";

interface Message {
  sender: string;
  role?: string;
  message: string;
  timestamp: string;
}

interface SupportTicket {
  id: string;
  ticket_number: string;
  dealer_id?: string;
  customer_id?: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  tractor_id?: string;
  tractor_model?: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  description: string;
  resolution_notes?: string;
  assigned_to?: string;
  messages: Message[];
  createdAt: string;
  updatedAt?: string;
}

interface TicketDetailsDrawerProps {
  ticket: SupportTicket | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export default function TicketDetailsDrawer({ 
  ticket, 
  isOpen, 
  onClose, 
  onUpdated 
}: TicketDetailsDrawerProps) {
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState(ticket?.resolution_notes || "");
  const [savingResolution, setSavingResolution] = useState(false);

  if (!isOpen || !ticket) return null;

  const handleSendReply = async (newStatus?: string) => {
    if (!replyText.trim()) {
      errorMessage("Please enter a message before sending.");
      return;
    }

    setSubmittingReply(true);
    try {
      const activeToken = getAuthToken() || "";
      const headers = activeToken ? { Authorization: `Bearer ${activeToken}` } : undefined;

      const payload = {
        sender: "Dealer Support",
        role: "dealer",
        message: replyText.trim(),
        ...(newStatus && { status: newStatus })
      };

      const res = await renderInstance.post(
        `/dealer/support-tickets/${ticket.id}/reply`,
        payload,
        { headers }
      );

      if (res.data?.success) {
        successMessage("Reply sent to customer successfully!");
        setReplyText("");
        onUpdated();
      }
    } catch (err: any) {
      console.error("Error replying to ticket:", err);
      errorMessage(err?.response?.data?.detail || "Failed to send reply.");
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleStatusChange = async (nextStatus: string) => {
    setUpdatingStatus(true);
    try {
      const activeToken = getAuthToken() || "";
      const headers = activeToken ? { Authorization: `Bearer ${activeToken}` } : undefined;

      const res = await renderInstance.patch(
        `/dealer/support-tickets/${ticket.id}`,
        { status: nextStatus },
        { headers }
      );

      if (res.data?.success) {
        successMessage(`Ticket status updated to ${nextStatus}!`);
        onUpdated();
      }
    } catch (err: any) {
      console.error("Error changing status:", err);
      errorMessage("Failed to update status.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSaveResolution = async () => {
    setSavingResolution(true);
    try {
      const activeToken = getAuthToken() || "";
      const headers = activeToken ? { Authorization: `Bearer ${activeToken}` } : undefined;

      const res = await renderInstance.patch(
        `/dealer/support-tickets/${ticket.id}`,
        { resolution_notes: resolutionNotes },
        { headers }
      );

      if (res.data?.success) {
        successMessage("Resolution notes saved successfully!");
        onUpdated();
      }
    } catch (err: any) {
      console.error("Error saving resolution notes:", err);
      errorMessage("Failed to save resolution notes.");
    } finally {
      setSavingResolution(false);
    }
  };

  const getPriorityStyle = (priority: string) => {
    switch (priority?.toUpperCase()) {
      case "URGENT": return "bg-red-600 text-white";
      case "HIGH": return "bg-orange-500 text-white";
      case "MEDIUM": return "bg-yellow-500 text-white";
      case "LOW": return "bg-blue-500 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case "OPEN": return "bg-amber-100 text-amber-800 border-amber-300";
      case "IN_PROGRESS": return "bg-blue-100 text-blue-800 border-blue-300";
      case "RESOLVED": return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "CLOSED": return "bg-slate-100 text-slate-800 border-slate-300";
      default: return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div 
        className="w-full max-w-2xl h-full bg-white shadow-2xl flex flex-col overflow-hidden animate-slideLeft border-l border-gray-200"
      >
        {/* Drawer Header */}
        <div 
          className="p-6 text-white flex items-center justify-between shadow-md"
          style={{ background: "linear-gradient(135deg, #A10A0C 0%, #3B0404 100%)" }}
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold bg-white/20 px-2.5 py-0.5 rounded">
                {ticket.ticket_number}
              </span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${getPriorityStyle(ticket.priority)}`}>
                {ticket.priority} Priority
              </span>
            </div>
            <h2 className="text-xl font-bold tracking-tight line-clamp-1">{ticket.subject}</h2>
            <p className="text-xs text-red-100 flex items-center gap-2">
              <span>{ticket.category}</span>
              <span>•</span>
              <span>Opened {new Date(ticket.createdAt).toLocaleDateString()}</span>
            </p>
          </div>

          <button 
            onClick={onClose} 
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X size={22} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Status Pipeline Buttons */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Current Ticket Status
              </span>
              <span className={`text-xs font-bold px-3 py-1 rounded-full border ${getStatusBadge(ticket.status)}`}>
                {ticket.status}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2 pt-1">
              {[
                { key: "OPEN", label: "Open", color: "hover:bg-amber-50 hover:text-amber-700" },
                { key: "IN_PROGRESS", label: "In Progress", color: "hover:bg-blue-50 hover:text-blue-700" },
                { key: "RESOLVED", label: "Resolved", color: "hover:bg-emerald-50 hover:text-emerald-700" },
                { key: "CLOSED", label: "Closed", color: "hover:bg-gray-100 hover:text-gray-700" }
              ].map(st => (
                <button
                  key={st.key}
                  onClick={() => handleStatusChange(st.key)}
                  disabled={updatingStatus || ticket.status === st.key}
                  className={`py-2 text-xs font-bold rounded-lg border transition-all text-center ${
                    ticket.status === st.key 
                      ? "bg-red-600 text-white border-red-600 shadow-sm"
                      : `bg-white text-gray-700 border-gray-200 ${st.color}`
                  } disabled:opacity-60`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Customer & Tractor Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Customer Box */}
            <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm space-y-2">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Customer Details</span>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold text-sm">
                  {ticket.customer_name?.charAt(0) || "C"}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-gray-900">{ticket.customer_name}</h4>
                  <div className="flex items-center gap-2 text-xs text-gray-600 mt-0.5">
                    {ticket.customer_phone && (
                      <a href={`tel:${ticket.customer_phone}`} className="flex items-center gap-1 hover:text-red-600">
                        <Phone size={12} /> {ticket.customer_phone}
                      </a>
                    )}
                  </div>
                </div>
              </div>
              {ticket.customer_email && (
                <a href={`mailto:${ticket.customer_email}`} className="text-xs text-gray-600 hover:text-red-600 flex items-center gap-1.5 pt-1">
                  <Mail size={12} /> {ticket.customer_email}
                </a>
              )}
            </div>

            {/* Equipment / Assignment Box */}
            <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm space-y-2">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Equipment & Handling</span>
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                <Truck size={16} className="text-red-600" />
                <span className="truncate">{ticket.tractor_model || "General Store Customer"}</span>
              </div>
              <div className="text-xs text-gray-600">
                <span className="text-gray-500">Assigned Desk:</span>{" "}
                <span className="font-medium text-gray-800">{ticket.assigned_to || "Dealer Support"}</span>
              </div>
              <div className="text-xs text-gray-500">
                <span>Category:</span> <span className="font-medium text-gray-700">{ticket.category}</span>
              </div>
            </div>
          </div>

          {/* Original Problem Description */}
          <div className="p-4 bg-red-50/50 rounded-xl border border-red-100">
            <span className="text-xs font-bold text-red-900 uppercase tracking-wider mb-1 block">Initial Customer Report</span>
            <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
          </div>

          {/* Conversation History Thread */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <MessageSquare size={16} className="text-red-600" />
                Conversation History ({ticket.messages?.length || 0})
              </h3>
              <span className="text-xs text-gray-500">Timestamped logs</span>
            </div>

            <div className="space-y-3 pt-2">
              {ticket.messages && ticket.messages.length > 0 ? (
                ticket.messages.map((m, idx) => {
                  const isDealer = m.role === "dealer" || m.sender.toLowerCase().includes("dealer") || m.sender.toLowerCase().includes("support") || m.sender.toLowerCase().includes("stark") || m.sender.toLowerCase().includes("abhi");
                  return (
                    <div 
                      key={idx} 
                      className={`flex flex-col ${isDealer ? "items-end" : "items-start"}`}
                    >
                      <div className="flex items-center gap-2 text-[11px] text-gray-500 mb-1 px-1">
                        <span className="font-bold text-gray-700">{m.sender}</span>
                        <span>•</span>
                        <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div 
                        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                          isDealer 
                            ? "bg-gradient-to-r from-red-600 to-red-800 text-white rounded-tr-none shadow-sm"
                            : "bg-gray-100 text-gray-900 rounded-tl-none border border-gray-200/80"
                        }`}
                      >
                        {m.message}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-center py-6 text-xs text-gray-400">No conversation messages logged yet.</p>
              )}
            </div>
          </div>

          {/* Resolution Notes Editor */}
          <div className="pt-2 border-t border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                <FileCheck size={14} className="text-green-600" /> Internal Resolution Notes
              </label>
              <button
                onClick={handleSaveResolution}
                disabled={savingResolution}
                className="text-xs font-bold text-red-600 hover:text-red-700 disabled:opacity-50"
              >
                {savingResolution ? "Saving..." : "Save Notes"}
              </button>
            </div>
            <textarea
              rows={2}
              placeholder="Record diagnostic findings, replacement parts issued, invoice credits, or customer feedback upon closing..."
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
            />
          </div>
        </div>

        {/* Reply Submission Box */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 space-y-3">
          <div className="relative">
            <textarea
              rows={3}
              placeholder="Type your response to the customer or field technician..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="w-full px-4 py-3 text-sm bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none shadow-inner"
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {ticket.status !== "RESOLVED" && (
                <button
                  type="button"
                  onClick={() => handleSendReply("RESOLVED")}
                  disabled={submittingReply || !replyText.trim()}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  <CheckCircle size={14} /> Send & Resolve
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => handleSendReply()}
              disabled={submittingReply || !replyText.trim()}
              className="px-5 py-2 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-2 text-sm disabled:opacity-50"
            >
              {submittingReply ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Send Reply
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
