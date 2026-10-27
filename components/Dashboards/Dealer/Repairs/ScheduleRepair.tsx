"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search,
  Calendar,
  RefreshCw,
  Wrench,
  AlertCircle,
  Clock,
  CheckCircle2,
  User,
  Phone,
  MapPin,
  Tractor,
  Flame,
  AlertTriangle,
  Filter,
  Check,
  Copy,
  Users,
  ShieldAlert
} from "lucide-react";
import { useCookie } from "next-cookie";
import { renderInstance } from "@/utils/Axios/RenderInstance";
import { errorMessage, successMessage } from "@/utils/Toastify/Messages";
import { getAuthToken, getAuthUser } from "@/utils/auth/clientAuth";
import AddScheduleRepairModal from "./AddScheduleRepair";
import AssignMechanicModal from "./AssignMechanicModal";

interface Repair {
  id: string;
  createdAt: string;
  priority_level: "HIGH" | "MEDIUM" | "LOW" | "URGENT" | string;
  status: string;
  problem_description: string;
  problem_category?: string;
  location_address?: string;
  total_cost?: number;
  user: {
    first_name: string;
    last_name: string;
    mobile: string;
    image?: string;
  };
  tractor: {
    model_name: string;
    brand?: string;
  };
  mechanic?: {
    first_name: string;
    last_name: string;
    mobile?: string;
  };
}

const TableSkeleton = () => (
  <tbody className="divide-y divide-gray-100 bg-white">
    {[...Array(5)].map((_, i) => (
      <tr key={i} className="animate-pulse">
        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-28"></div><div className="h-3 bg-gray-100 rounded w-20 mt-1.5"></div></td>
        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-36"></div><div className="h-3 bg-gray-100 rounded w-24 mt-1.5"></div></td>
        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-32"></div><div className="h-3 bg-gray-100 rounded w-44 mt-1.5"></div></td>
        <td className="px-6 py-4"><div className="h-6 bg-gray-200 rounded-full w-20"></div></td>
        <td className="px-6 py-4"><div className="h-6 bg-gray-200 rounded w-28"></div></td>
        <td className="px-6 py-4"><div className="h-6 bg-gray-200 rounded-full w-24"></div></td>
        <td className="px-6 py-4 text-right"><div className="h-8 bg-gray-200 rounded-lg w-24 ml-auto"></div></td>
      </tr>
    ))}
  </tbody>
);

export default function ScheduleTractorRepair() {
  const cookie = useCookie();
  const rawCookieUser = cookie?.get ? cookie.get("user") : null;
  const rawCookieToken = cookie?.get ? cookie.get("access_token") : null;
  const cookieToken = typeof rawCookieToken === "string" ? rawCookieToken : "";
  const authUser = getAuthUser();

  const targetDealerId = useMemo(() => {
    try {
      const parsed = typeof rawCookieUser === "string" ? JSON.parse(rawCookieUser) : rawCookieUser;
      return (
        parsed?.dealer_id ||
        parsed?.dealerId ||
        (authUser as any)?.dealer_id ||
        (typeof window !== "undefined" ? localStorage.getItem("dealer_id") : null) ||
        parsed?.userId ||
        parsed?.id ||
        authUser?.userId ||
        authUser?.id ||
        ""
      );
    } catch {
      return (authUser as any)?.dealer_id || authUser?.userId || authUser?.id || "";
    }
  }, [rawCookieUser, authUser]);

  const [token, setToken] = useState<string>("");
  const [repairList, setRepairList] = useState<Repair[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedRepair, setSelectedRepair] = useState<Repair | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const rawTok = getAuthToken() || cookieToken || "";
    setToken(typeof rawTok === "string" ? rawTok : "");
  }, [cookieToken]);

  const fetchRepairs = useCallback(async () => {
    const activeToken = token || getAuthToken() || cookieToken || "";

    setLoading(true);
    setError("");

    try {
      const endpoint = "/dealer/repair-service";
      const headers = activeToken ? { Authorization: `Bearer ${activeToken}` } : undefined;
      const params: Record<string, string> = {};
      if (targetDealerId) params.dealer_id = targetDealerId;

      const res = await renderInstance.get(endpoint, { headers, params });

      let repairData = [];
      if (res.data?.repairs && Array.isArray(res.data.repairs)) {
        repairData = res.data.repairs;
      } else if (res.data?.data && Array.isArray(res.data.data)) {
        repairData = res.data.data;
      } else if (Array.isArray(res.data)) {
        repairData = res.data;
      }

      setRepairList(repairData);
    } catch (err: any) {
      console.error("Failed to fetch repairs:", err.response?.status, err.response?.data);

      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Unable to fetch repairs. Please try again.";

      setError(errorMsg);
      setRepairList([]);

      if (err.response?.status === 404) {
        errorMessage("Repair service endpoint not found.");
      } else if (err.response?.status !== 401) {
        errorMessage(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  }, [token, cookieToken, targetDealerId]);

  useEffect(() => {
    fetchRepairs();
  }, [fetchRepairs]);

  const handleAddSuccess = () => {
    setIsModalOpen(false);
    fetchRepairs();
  };

  const handleAssignMechanic = (repair: Repair) => {
    setSelectedRepair(repair);
    setIsAssignModalOpen(true);
  };

  const handleAssignSuccess = () => {
    setIsAssignModalOpen(false);
    setSelectedRepair(null);
    successMessage("Mechanic assigned successfully!");
    fetchRepairs();
  };

  const handleCopyId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // KPI Metrics Calculation
  const totalRepairs = repairList.length;
  const pendingCount = repairList.filter(
    (r) => (r.status || "").toUpperCase() === "PENDING"
  ).length;
  const assignedCount = repairList.filter(
    (r) => ["ACCEPTED", "ASSIGNED", "IN PROGRESS"].includes((r.status || "").toUpperCase())
  ).length;
  const completedCount = repairList.filter(
    (r) => (r.status || "").toUpperCase() === "COMPLETED"
  ).length;

  // Filtered repairs
  const filteredRepairs = useMemo(() => {
    return repairList.filter((repair) => {
      const customerName = `${repair.user?.first_name || ""} ${repair.user?.last_name || ""}`.trim();
      const tractorModel = repair.tractor?.model_name || "";
      const issue = repair.problem_description || "";
      const address = repair.location_address || "";
      const category = repair.problem_category || "";
      const id = repair.id || "";
      const mobile = repair.user?.mobile || "";

      const matchesSearch =
        id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tractorModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.toLowerCase().includes(searchTerm.toLowerCase()) ||
        address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mobile.includes(searchTerm);

      const statusUpper = (repair.status || "PENDING").toUpperCase();
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "PENDING" && statusUpper === "PENDING") ||
        (statusFilter === "ASSIGNED" && ["ACCEPTED", "ASSIGNED", "IN PROGRESS"].includes(statusUpper)) ||
        (statusFilter === "COMPLETED" && statusUpper === "COMPLETED");

      const priorityUpper = (repair.priority_level || "MEDIUM").toUpperCase();
      const matchesPriority =
        priorityFilter === "ALL" || priorityUpper === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [repairList, searchTerm, statusFilter, priorityFilter]);

  const getPriorityBadge = (priority: string) => {
    switch (priority?.toUpperCase()) {
      case "URGENT":
        return {
          bg: "bg-red-50 text-red-700 border-red-200",
          icon: <Flame size={12} className="text-red-600 shrink-0 fill-red-100" />
        };
      case "HIGH":
        return {
          bg: "bg-amber-50 text-amber-800 border-amber-200",
          icon: <AlertTriangle size={12} className="text-amber-600 shrink-0" />
        };
      case "MEDIUM":
        return {
          bg: "bg-blue-50 text-blue-700 border-blue-200",
          icon: <Clock size={12} className="text-blue-500 shrink-0" />
        };
      case "LOW":
        return {
          bg: "bg-slate-50 text-slate-700 border-slate-200",
          icon: <CheckCircle2 size={12} className="text-slate-500 shrink-0" />
        };
      default:
        return {
          bg: "bg-gray-50 text-gray-700 border-gray-200",
          icon: <Clock size={12} className="text-gray-500 shrink-0" />
        };
    }
  };

  const getStatusBadge = (status: string) => {
    const s = (status || "PENDING").toUpperCase();
    switch (s) {
      case "COMPLETED":
        return {
          bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
          label: "Completed",
          dot: "bg-emerald-500"
        };
      case "ACCEPTED":
      case "ASSIGNED":
        return {
          bg: "bg-purple-50 text-purple-700 border-purple-200",
          label: "Assigned",
          dot: "bg-purple-500"
        };
      case "IN PROGRESS":
        return {
          bg: "bg-sky-50 text-sky-700 border-sky-200",
          label: "In Progress",
          dot: "bg-sky-500"
        };
      case "PENDING":
      default:
        return {
          bg: "bg-amber-50 text-amber-800 border-amber-200",
          label: "Pending Action",
          dot: "bg-amber-500 animate-pulse"
        };
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/60 p-4 sm:p-6 lg:p-8 space-y-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#A10A0C] via-[#7B080A] to-[#3B0404] p-6 sm:p-8 text-white shadow-xl">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold uppercase tracking-wider text-red-100">
                <Wrench size={14} className="text-amber-300" />
                Dealership Workshop Operations
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Schedule & Manage Tractor Repairs
              </h1>
              <p className="text-sm text-red-100/90 leading-relaxed">
                Dispatch certified field mechanics, track problem diagnostics, monitor service status, and record maintenance history seamlessly.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-5 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl shadow-lg hover:shadow-orange-500/25 transition-all flex items-center gap-2 cursor-pointer transform active:scale-95"
              >
                <Calendar size={18} />
                <span>Schedule New Repair</span>
              </button>
            </div>
          </div>
        </div>

        {/* Error Alert if any */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 shadow-xs">
            <AlertCircle className="text-red-600 shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <h3 className="text-red-900 font-bold text-sm">Error Loading Repairs</h3>
              <p className="text-red-700 text-xs mt-0.5">{error}</p>
            </div>
            <button
              onClick={fetchRepairs}
              className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-xs font-semibold cursor-pointer shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        {/* Metric KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Total Work Orders</p>
              <h3 className="text-2xl font-extrabold text-gray-900 mt-0.5">{totalRepairs}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
              <Wrench size={18} />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-xs text-amber-700 font-medium">Pending Assignment</p>
              <h3 className="text-2xl font-extrabold text-amber-600 mt-0.5">{pendingCount}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Clock size={18} />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-xs text-purple-700 font-medium">In Service / Assigned</p>
              <h3 className="text-2xl font-extrabold text-purple-600 mt-0.5">{assignedCount}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Users size={18} />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-xs text-emerald-700 font-medium">Completed Repairs</p>
              <h3 className="text-2xl font-extrabold text-emerald-600 mt-0.5">{completedCount}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 size={18} />
            </div>
          </div>
        </div>

        {/* Repair History Section Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Table Header Controls */}
          <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-900 tracking-tight">
                  Repair History & Work Orders
                </h2>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
                  {filteredRepairs.length} orders
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Review machine complaints, farmer details, technician assignments, and repair status.
              </p>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Status Pill Filter */}
              <div className="inline-flex bg-gray-100 p-1 rounded-xl">
                {[
                  { key: "ALL", label: "All" },
                  { key: "PENDING", label: "Pending" },
                  { key: "ASSIGNED", label: "Assigned" },
                  { key: "COMPLETED", label: "Completed" },
                ].map((st) => (
                  <button
                    key={st.key}
                    onClick={() => setStatusFilter(st.key)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      statusFilter === st.key
                        ? "bg-white text-red-700 shadow-2xs"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              {/* Priority Select Filter */}
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="ALL">All Priorities</option>
                <option value="URGENT">🔥 Urgent</option>
                <option value="HIGH">⚡ High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>

              {/* Search Box */}
              <div className="relative w-full sm:w-64">
                <Search
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Search customer, ID, tractor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:bg-white focus:outline-none transition-all text-gray-800"
                />
              </div>

              {/* Refresh Button */}
              <button
                onClick={fetchRepairs}
                disabled={loading}
                className="p-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-gray-600 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                title="Refresh repairs"
              >
                <RefreshCw
                  size={15}
                  className={loading ? "animate-spin text-red-600" : ""}
                />
              </button>
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                  <th className="px-6 py-3.5">Work Order & Category</th>
                  <th className="px-6 py-3.5">Customer & Location</th>
                  <th className="px-6 py-3.5">Tractor & Issue Diagnostics</th>
                  <th className="px-5 py-3.5 text-center">Priority</th>
                  <th className="px-6 py-3.5">Assigned Mechanic</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>

              {loading ? (
                <TableSkeleton />
              ) : (
                <tbody className="divide-y divide-gray-100 text-sm">
                  {filteredRepairs.length > 0 ? (
                    filteredRepairs.map((repair) => {
                      const priority = getPriorityBadge(repair.priority_level);
                      const status = getStatusBadge(repair.status);
                      const customerName = `${repair.user?.first_name || ""} ${repair.user?.last_name || ""}`.trim() || "Customer";
                      const shortId = repair.id.length > 10 ? `...${repair.id.slice(-7)}` : repair.id;

                      return (
                        <tr
                          key={repair.id}
                          className="hover:bg-red-50/20 transition-colors group"
                        >
                          {/* 1. Work Order & Date */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200 flex items-center gap-1">
                                #{shortId}
                                <button
                                  onClick={(e) => handleCopyId(repair.id, e)}
                                  className="text-gray-400 hover:text-gray-700 ml-0.5"
                                  title="Copy full Repair ID"
                                >
                                  {copiedId === repair.id ? (
                                    <Check size={11} className="text-green-600" />
                                  ) : (
                                    <Copy size={11} />
                                  )}
                                </button>
                              </span>
                              {repair.problem_category && (
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-red-50 text-red-700 border border-red-200">
                                  {repair.problem_category}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1.5">
                              <Calendar size={12} className="text-gray-400 shrink-0" />
                              <span>{new Date(repair.createdAt).toLocaleDateString()}</span>
                            </div>
                          </td>

                          {/* 2. Customer & Location */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-600 to-red-800 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                                {(customerName[0] || "C").toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-bold text-gray-900 text-sm truncate">
                                  {customerName}
                                </h4>
                                <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                                  <Phone size={11} className="text-gray-400 shrink-0" />
                                  <a
                                    href={`tel:${repair.user?.mobile}`}
                                    className="hover:text-red-600 transition-colors"
                                  >
                                    {repair.user?.mobile || "No Mobile"}
                                  </a>
                                </div>
                                {repair.location_address && repair.location_address !== "Address not available" && (
                                  <div className="flex items-center gap-1 text-[11px] text-gray-400 truncate max-w-[200px] mt-0.5">
                                    <MapPin size={10} className="shrink-0" />
                                    <span className="truncate">{repair.location_address}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* 3. Tractor & Issue */}
                          <td className="px-6 py-4 max-w-xs">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900">
                              <Tractor size={14} className="text-red-600 shrink-0" />
                              <span className="truncate">{repair.tractor?.model_name || "General Machinery"}</span>
                            </div>
                            <p
                              className="text-xs text-gray-600 line-clamp-2 mt-1 leading-snug"
                              title={repair.problem_description}
                            >
                              {repair.problem_description}
                            </p>
                          </td>

                          {/* 4. Priority */}
                          <td className="px-5 py-4 text-center whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${priority.bg}`}
                            >
                              {priority.icon}
                              <span>{repair.priority_level || "MEDIUM"}</span>
                            </span>
                          </td>

                          {/* 5. Assigned Mechanic */}
                          <td className="px-6 py-4">
                            {repair.mechanic ? (
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-red-100/70 border border-red-200 text-red-700 flex items-center justify-center shrink-0">
                                  <Wrench size={13} />
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-gray-900 leading-tight">
                                    {repair.mechanic.first_name} {repair.mechanic.last_name}
                                  </p>
                                  <span className="text-[10px] text-emerald-600 font-medium">Assigned</span>
                                </div>
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 border border-dashed border-gray-300">
                                <AlertCircle size={12} className="text-amber-500" />
                                <span>Unassigned</span>
                              </span>
                            )}
                          </td>

                          {/* 6. Status */}
                          <td className="px-5 py-4 text-center whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${status.bg}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                              <span>{status.label}</span>
                            </span>
                          </td>

                          {/* 7. Action Button */}
                          <td className="px-6 py-4 text-right whitespace-nowrap">
                            <button
                              onClick={() => handleAssignMechanic(repair)}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-2xs hover:shadow-sm transition-all cursor-pointer transform active:scale-95"
                            >
                              <Wrench size={13} />
                              <span>{repair.mechanic ? "Reassign" : "Assign Mechanic"}</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="text-center py-16 text-gray-500 bg-white">
                        <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                          <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mb-1">
                            <Wrench size={26} />
                          </div>
                          <h4 className="text-base font-bold text-gray-900">No repair work orders found</h4>
                          <p className="text-xs text-gray-500 text-center">
                            {searchTerm || statusFilter !== "ALL" || priorityFilter !== "ALL"
                              ? "Try adjusting your search criteria or resetting filters."
                              : "No repair service requests logged for this dealer store yet."}
                          </p>
                          {(searchTerm || statusFilter !== "ALL" || priorityFilter !== "ALL") && (
                            <button
                              onClick={() => {
                                setSearchTerm("");
                                setStatusFilter("ALL");
                                setPriorityFilter("ALL");
                              }}
                              className="mt-2 text-xs font-bold text-red-600 hover:text-red-700 underline cursor-pointer"
                            >
                              Clear all filters
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              )}
            </table>
          </div>

          {/* Mobile & Tablet Card Layout */}
          <div className="lg:hidden divide-y divide-gray-100">
            {loading ? (
              <div className="p-6 text-center text-xs text-gray-500">
                <RefreshCw size={20} className="animate-spin text-red-600 mx-auto mb-2" />
                Loading repair history...
              </div>
            ) : filteredRepairs.length > 0 ? (
              filteredRepairs.map((repair) => {
                const priority = getPriorityBadge(repair.priority_level);
                const status = getStatusBadge(repair.status);
                const customerName = `${repair.user?.first_name || ""} ${repair.user?.last_name || ""}`.trim() || "Customer";

                return (
                  <div key={repair.id} className="p-4 space-y-3 bg-white">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                          #{repair.id.slice(-6)}
                        </span>
                        {repair.problem_category && (
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
                            {repair.problem_category}
                          </span>
                        )}
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${priority.bg}`}>
                          {priority.icon}
                          {repair.priority_level}
                        </span>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border shrink-0 ${status.bg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                        {status.label}
                      </span>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-xl space-y-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-sm text-gray-900">
                        <Tractor size={15} className="text-red-600 shrink-0" />
                        <span>{repair.tractor?.model_name || "General Machinery"}</span>
                      </div>
                      <p className="text-xs text-gray-600 leading-snug">{repair.problem_description}</p>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 truncate">{customerName}</p>
                        <p className="text-gray-500 font-mono text-[11px]">{repair.user?.mobile || "No Mobile"}</p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-[11px] text-gray-400">Mechanic</p>
                        <p className="font-semibold text-gray-800 text-xs">
                          {repair.mechanic ? `${repair.mechanic.first_name} ${repair.mechanic.last_name}` : "Unassigned"}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between gap-3 border-t border-gray-100">
                      <div className="text-[11px] text-gray-400 flex items-center gap-1">
                        <Calendar size={11} />
                        {new Date(repair.createdAt).toLocaleDateString()}
                      </div>
                      <button
                        onClick={() => handleAssignMechanic(repair)}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-700 text-white flex items-center gap-1.5 shadow-2xs"
                      >
                        <Wrench size={12} />
                        {repair.mechanic ? "Reassign" : "Assign Mechanic"}
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-xs text-gray-500">
                No repair records found matching your filters.
              </div>
            )}
          </div>
        </div>
      </div>

      <AddScheduleRepairModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddSuccess={handleAddSuccess}
      />

      <AssignMechanicModal
        isOpen={isAssignModalOpen}
        onClose={() => {
          setIsAssignModalOpen(false);
          setSelectedRepair(null);
        }}
        onAssignSuccess={handleAssignSuccess}
        repairId={selectedRepair?.id || ""}
      />
    </div>
  );
}