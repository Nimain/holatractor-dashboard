"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { 
  Ticket, 
  Search, 
  Plus, 
  RefreshCw, 
  Filter, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Phone, 
  Mail, 
  Truck, 
  MessageSquare, 
  ChevronRight,
  Flame,
  User,
  ShieldCheck,
  Tag
} from "lucide-react";
import { renderInstance } from "@/utils/Axios/RenderInstance";
import { getAuthToken, getAuthUser } from "@/utils/auth/clientAuth";
import { useCookie } from "next-cookie";
import { errorMessage, successMessage } from "@/utils/Toastify/Messages";
import CreateTicketModal from "./CreateTicketModal";
import TicketDetailsDrawer from "./TicketDetailsDrawer";

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

const CATEGORIES = [
  "ALL",
  "Tractor Repair",
  "Equipment Delivery",
  "Parts & Inventory",
  "Billing & Invoices",
  "Warranty & Service",
  "General Inquiry"
];

const PRIORITIES = ["ALL", "LOW", "MEDIUM", "HIGH", "URGENT"];

const STATUS_TABS = [
  { key: "ALL", label: "All Tickets" },
  { key: "OPEN", label: "Open" },
  { key: "IN_PROGRESS", label: "In Progress" },
  { key: "RESOLVED", label: "Resolved" },
  { key: "CLOSED", label: "Closed" },
];

export default function SupportTickets() {
  const { cookie } = useCookie();
  const cookieToken = cookie?.get("access_token");

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedPriority, setSelectedPriority] = useState("ALL");

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    const activeToken = getAuthToken() || cookieToken || "";
    const headers = activeToken ? { Authorization: `Bearer ${activeToken}` } : undefined;

    try {
      const authUser = getAuthUser();
      const dealerId = authUser?.dealer_id || authUser?.userId;

      let queryParams: string[] = [];
      if (dealerId) queryParams.push(`dealer_id=${dealerId}`);
      if (selectedStatus !== "ALL") queryParams.push(`status=${selectedStatus}`);
      if (selectedCategory !== "ALL") queryParams.push(`category=${encodeURIComponent(selectedCategory)}`);
      if (selectedPriority !== "ALL") queryParams.push(`priority=${selectedPriority}`);
      if (searchTerm.trim()) queryParams.push(`search=${encodeURIComponent(searchTerm.trim())}`);

      const queryStr = queryParams.length > 0 ? `?${queryParams.join("&")}` : "";
      const res = await renderInstance.get(`/dealer/support-tickets${queryStr}`, { headers });

      const list = Array.isArray(res.data?.tickets) ? res.data.tickets : [];
      setTickets(list);

      // If drawer is open and viewing a ticket, refresh its instance
      if (selectedTicket) {
        const updated = list.find((t: SupportTicket) => t.id === selectedTicket.id);
        if (updated) setSelectedTicket(updated);
      }
    } catch (err: any) {
      console.error("Error fetching support tickets:", err);
      // Fallback try without filters
      try {
        const fallbackRes = await renderInstance.get("/dealer/support-tickets", { headers });
        setTickets(Array.isArray(fallbackRes.data?.tickets) ? fallbackRes.data.tickets : []);
      } catch (fallbackErr) {
        setTickets([]);
      }
    } finally {
      setLoading(false);
    }
  }, [cookieToken, selectedStatus, selectedCategory, selectedPriority, searchTerm, selectedTicket]);

  useEffect(() => {
    fetchTickets();
  }, [selectedStatus, selectedCategory, selectedPriority]);

  // Overall metric counts
  const totalCount = tickets.length;
  const openCount = tickets.filter(t => t.status?.toUpperCase() === "OPEN").length;
  const inProgressCount = tickets.filter(t => t.status?.toUpperCase() === "IN_PROGRESS").length;
  const resolvedCount = tickets.filter(t => t.status?.toUpperCase() === "RESOLVED").length;
  const urgentCount = tickets.filter(t => t.priority?.toUpperCase() === "URGENT" || t.priority?.toUpperCase() === "HIGH").length;

  const handleOpenDrawer = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setIsDrawerOpen(true);
  };

  const getPriorityStyle = (priority: string) => {
    switch (priority?.toUpperCase()) {
      case "URGENT": return "bg-red-600 text-white shadow-sm ring-1 ring-red-400";
      case "HIGH": return "bg-orange-500 text-white";
      case "MEDIUM": return "bg-yellow-500 text-white";
      case "LOW": return "bg-blue-500 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case "OPEN": return "bg-amber-50 text-amber-800 border-amber-300";
      case "IN_PROGRESS": return "bg-blue-50 text-blue-800 border-blue-300";
      case "RESOLVED": return "bg-emerald-50 text-emerald-800 border-emerald-300";
      case "CLOSED": return "bg-slate-100 text-slate-700 border-slate-300";
      default: return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const term = searchTerm.toLowerCase();
      const num = t.ticket_number?.toLowerCase() || "";
      const name = t.customer_name?.toLowerCase() || "";
      const email = t.customer_email?.toLowerCase() || "";
      const phone = t.customer_phone?.toLowerCase() || "";
      const subj = t.subject?.toLowerCase() || "";
      const tractor = t.tractor_model?.toLowerCase() || "";

      const matchesSearch = !term || num.includes(term) || name.includes(term) || email.includes(term) || phone.includes(term) || subj.includes(term) || tractor.includes(term);
      const matchesStatus = selectedStatus === "ALL" || t.status?.toUpperCase() === selectedStatus;
      const matchesCategory = selectedCategory === "ALL" || t.category === selectedCategory;
      const matchesPriority = selectedPriority === "ALL" || t.priority?.toUpperCase() === selectedPriority;

      return matchesSearch && matchesStatus && matchesCategory && matchesPriority;
    });
  }, [tickets, searchTerm, selectedStatus, selectedCategory, selectedPriority]);

  return (
    <div className="min-h-screen bg-gray-100/70 p-3 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Hero Header */}
        <div 
          className="rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #A10A0C 0%, #3B0404 100%)" }}
        >
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold mb-3">
                <Ticket size={14} /> Customer Care & Field Assistance
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
                Customer Support Tickets
              </h1>
              <p className="mt-2 text-red-100 text-sm sm:text-base max-w-2xl">
                Resolve farmer questions, manage machinery warranty claims, dispatch field technicians, and track resolution timelines.
              </p>
            </div>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3.5 rounded-xl font-bold flex items-center gap-2.5 shadow-lg hover:shadow-xl transition-all transform hover:scale-105 text-sm sm:text-base self-start md:self-auto"
            >
              <Plus size={20} />
              <span>Open New Ticket</span>
            </button>
          </div>

          <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-24 translate-x-24"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
        </div>

        {/* KPI Metrics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200/90 shadow-sm">
            <div className="flex items-center justify-between text-gray-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Tickets</span>
              <Ticket className="text-red-600" size={18} />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-gray-900">
              {loading ? "..." : totalCount}
            </div>
            <p className="text-xs text-gray-500 mt-1">All recorded issues</p>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200/90 shadow-sm">
            <div className="flex items-center justify-between text-gray-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Open Tickets</span>
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-600">
              {loading ? "..." : openCount}
            </div>
            <p className="text-xs text-gray-500 mt-1">Awaiting technician</p>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200/90 shadow-sm">
            <div className="flex items-center justify-between text-gray-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">In Progress</span>
              <Clock className="text-blue-600" size={18} />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-blue-600">
              {loading ? "..." : inProgressCount}
            </div>
            <p className="text-xs text-gray-500 mt-1">Under investigation</p>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200/90 shadow-sm">
            <div className="flex items-center justify-between text-gray-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Resolved</span>
              <CheckCircle2 className="text-emerald-600" size={18} />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600">
              {loading ? "..." : resolvedCount}
            </div>
            <p className="text-xs text-gray-500 mt-1">Closed successfully</p>
          </div>

          <div className="col-span-2 lg:col-span-1 bg-white p-4 sm:p-5 rounded-2xl border border-gray-200/90 shadow-sm">
            <div className="flex items-center justify-between text-gray-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Urgent Attention</span>
              <Flame className="text-red-600" size={18} />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-red-600">
              {loading ? "..." : urgentCount}
            </div>
            <p className="text-xs text-gray-500 mt-1">High & urgent priority</p>
          </div>
        </div>

        {/* Filter Tabs & Search Controls */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-sm space-y-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {STATUS_TABS.map(tab => {
              const isActive = selectedStatus === tab.key;
              const count = tab.key === "ALL" 
                ? tickets.length 
                : tickets.filter(t => t.status?.toUpperCase() === tab.key).length;

              return (
                <button
                  key={tab.key}
                  onClick={() => setSelectedStatus(tab.key)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                    isActive
                      ? "bg-red-600 text-white shadow-md shadow-red-200"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] ${
                    isActive ? "bg-white/20 text-white" : "bg-white text-gray-600"
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Bar, Category & Priority Dropdowns */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-1 border-t border-gray-100">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search ticket #, customer name, email, phone, tractor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-8 py-2.5 text-sm bg-gray-50/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:bg-white outline-none transition-all"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm("")} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Category Filter */}
              <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200">
                <Tag size={14} className="text-red-600" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-gray-700 outline-none cursor-pointer"
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>Category: {c}</option>
                  ))}
                </select>
              </div>

              {/* Priority Filter */}
              <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200">
                <AlertTriangle size={14} className="text-orange-600" />
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-gray-700 outline-none cursor-pointer"
                >
                  {PRIORITIES.map(p => (
                    <option key={p} value={p}>Priority: {p}</option>
                  ))}
                </select>
              </div>

              {/* Refresh Button */}
              <button
                onClick={fetchTickets}
                disabled={loading}
                title="Refresh Tickets"
                className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 disabled:opacity-50 transition-colors shadow-sm"
              >
                <RefreshCw size={16} className={loading ? "animate-spin text-red-600" : ""} />
              </button>
            </div>
          </div>
        </div>

        {/* Tickets Table / List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 text-xs font-bold text-gray-700 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Ticket</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Subject & Category</th>
                  <th className="px-6 py-4">Machine / Model</th>
                  <th className="px-6 py-4">Priority</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={7} className="px-6 py-4">
                        <div className="h-5 bg-gray-100 rounded w-full"></div>
                      </td>
                    </tr>
                  ))
                ) : filteredTickets.length > 0 ? (
                  filteredTickets.map((t) => (
                    <tr 
                      key={t.id} 
                      onClick={() => handleOpenDrawer(t)}
                      className="hover:bg-red-50/40 cursor-pointer transition-colors group"
                    >
                      {/* Ticket # */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-mono text-xs font-bold text-red-700 bg-red-50 px-2 py-1 rounded inline-block">
                          {t.ticket_number}
                        </div>
                        <div className="text-[11px] text-gray-400 mt-1">
                          {new Date(t.createdAt).toLocaleDateString()}
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-500 to-red-700 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                            {t.customer_name?.charAt(0) || "C"}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 group-hover:text-red-700 transition-colors">
                              {t.customer_name}
                            </div>
                            <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                              {t.customer_phone ? (
                                <span>{t.customer_phone}</span>
                              ) : (
                                <span>{t.customer_email || "Customer"}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Subject & Category */}
                      <td className="px-6 py-4 max-w-xs">
                        <div className="font-semibold text-gray-900 line-clamp-1">{t.subject}</div>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-700 mt-1">
                          {t.category}
                        </span>
                      </td>

                      {/* Machine / Model */}
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-700 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Truck size={14} className="text-gray-400" />
                          <span className="truncate max-w-[150px]">{t.tractor_model || "General"}</span>
                        </div>
                      </td>

                      {/* Priority */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${getPriorityStyle(t.priority)}`}>
                          {t.priority}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadge(t.status)}`}>
                          {t.status}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDrawer(t);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-600 text-red-700 hover:text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
                        >
                          <MessageSquare size={13} />
                          <span>View Thread</span>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-16 text-gray-500">
                      <Ticket size={48} className="mx-auto text-gray-300 mb-3" />
                      <p className="text-base font-bold text-gray-700">No support tickets found</p>
                      <p className="text-xs text-gray-400 mt-1">Try adjusting your filters or open a new customer ticket</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile & Tablet Card View */}
          <div className="lg:hidden divide-y divide-gray-100">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="p-4 space-y-2 animate-pulse">
                  <div className="h-4 bg-gray-100 rounded w-1/3"></div>
                  <div className="h-4 bg-gray-100 rounded w-2/3"></div>
                  <div className="h-4 bg-gray-100 rounded w-1/2"></div>
                </div>
              ))
            ) : filteredTickets.length > 0 ? (
              filteredTickets.map((t) => (
                <div
                  key={t.id}
                  onClick={() => handleOpenDrawer(t)}
                  className="p-4 hover:bg-gray-50 cursor-pointer space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded">
                      {t.ticket_number}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold uppercase ${getPriorityStyle(t.priority)}`}>
                        {t.priority}
                      </span>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold border ${getStatusBadge(t.status)}`}>
                        {t.status}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">{t.subject}</h3>
                    <p className="text-xs text-gray-500 line-clamp-2 mt-1">{t.description}</p>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-600 pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold text-[10px]">
                        {t.customer_name?.charAt(0) || "C"}
                      </div>
                      <span className="font-semibold text-gray-800">{t.customer_name}</span>
                    </div>
                    <span className="text-red-600 font-bold flex items-center gap-1">
                      View Thread <ChevronRight size={14} />
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Ticket size={40} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm font-bold text-gray-700">No support tickets found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateTicketModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={() => {
          setIsCreateModalOpen(false);
          fetchTickets();
        }}
      />

      <TicketDetailsDrawer
        ticket={selectedTicket}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedTicket(null);
        }}
        onUpdated={() => {
          fetchTickets();
        }}
      />
    </div>
  );
}
