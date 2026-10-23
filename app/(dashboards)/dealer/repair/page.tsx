"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { 
  Wrench, 
  Package, 
  Users, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  RefreshCw,
  Search,
  Plus
} from "lucide-react";
import { renderInstance } from "@/utils/Axios/RenderInstance";
import { getAuthToken } from "@/utils/auth/clientAuth";
import { useCookie } from "next-cookie";
import AddScheduleRepairModal from "@/components/Dashboards/Dealer/Repairs/AddScheduleRepair";
import AssignMechanicModal from "@/components/Dashboards/Dealer/Repairs/AssignMechanicModal";

interface Repair {
  id: string;
  createdAt: string;
  priority_level: "HIGH" | "MEDIUM" | "LOW" | "URGENT";
  user: {
    first_name: string;
    last_name: string;
    mobile: string;
  };
  tractor: {
    model_name: string;
  };
  problem_description: string;
  status: string;
  mechanic?: {
    first_name: string;
    last_name: string;
  };
}

export default function RepairOverviewPage() {
  const { cookie } = useCookie();
  const cookieToken = cookie?.get("access_token");

  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [partsCount, setPartsCount] = useState<number>(0);
  const [mechanicsCount, setMechanicsCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedRepair, setSelectedRepair] = useState<Repair | null>(null);

  const fetchOverviewData = useCallback(async () => {
    setLoading(true);
    const activeToken = getAuthToken() || cookieToken || "";
    const headers = activeToken ? { Authorization: `Bearer ${activeToken}` } : undefined;

    try {
      const [repairsRes, partsRes, mechanicsRes] = await Promise.allSettled([
        renderInstance.get("/dealer/repair-service", { headers }),
        renderInstance.get("/dealer/tractor-parts/all", { headers }),
        renderInstance.get("/dealer/mechanic", { headers }),
      ]);

      if (repairsRes.status === "fulfilled") {
        const data = repairsRes.value.data;
        const list = Array.isArray(data?.repairs)
          ? data.repairs
          : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data)
          ? data
          : [];
        setRepairs(list);
      }

      if (partsRes.status === "fulfilled") {
        const pData = partsRes.value.data;
        const count = pData?.count ?? (Array.isArray(pData?.parts) ? pData.parts.length : 0);
        setPartsCount(count);
      }

      if (mechanicsRes.status === "fulfilled") {
        const mData = mechanicsRes.value.data;
        const count = mData?.count ?? (Array.isArray(mData?.mechanics) ? mData.mechanics.length : 0);
        setMechanicsCount(count);
      }
    } catch (err) {
      console.error("Error fetching repair overview data:", err);
    } finally {
      setLoading(false);
    }
  }, [cookieToken]);

  useEffect(() => {
    fetchOverviewData();
  }, [fetchOverviewData]);

  const pendingCount = repairs.filter(
    (r) => r.status?.toUpperCase() === "PENDING"
  ).length;

  const inProgressCount = repairs.filter(
    (r) => r.status?.toUpperCase() === "IN_PROGRESS" || r.status?.toUpperCase() === "ACCEPTED"
  ).length;

  const completedCount = repairs.filter(
    (r) => r.status?.toUpperCase() === "COMPLETED"
  ).length;

  const getPriorityBadge = (priority: string) => {
    switch (priority?.toUpperCase()) {
      case "URGENT":
        return "bg-red-600 text-white";
      case "HIGH":
        return "bg-orange-500 text-white";
      case "MEDIUM":
        return "bg-yellow-500 text-white";
      case "LOW":
        return "bg-blue-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case "COMPLETED":
        return "bg-green-100 text-green-800 border-green-200";
      case "IN_PROGRESS":
      case "ACCEPTED":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "CANCELLED":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const filteredRepairs = repairs.filter((r) => {
    const term = searchTerm.toLowerCase();
    const id = r.id?.toLowerCase() || "";
    const name = `${r.user?.first_name || ""} ${r.user?.last_name || ""}`.toLowerCase();
    const model = r.tractor?.model_name?.toLowerCase() || "";
    return id.includes(term) || name.includes(term) || model.includes(term);
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Hero Banner */}
      <div 
        className="rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, #A10A0C 0%, #3B0404 100%)` }}
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold mb-3">
              <Wrench size={14} /> Comprehensive Tractor Service Hub
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
              Tractor Repair & Fleet Maintenance
            </h1>
            <p className="mt-2 text-red-100 text-sm sm:text-base max-w-2xl">
              Dispatch certified field mechanics, track live tractor repair tickets, and maintain real-time spare parts inventory.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsScheduleModalOpen(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-3 rounded-xl font-semibold flex items-center gap-2 shadow-lg transition-all hover:scale-105 text-sm"
            >
              <Calendar size={18} /> Schedule Repair
            </button>
            <Link
              href="/dealer/repair/PartsInventory"
              className="bg-white/10 hover:bg-white/20 text-white border border-white/30 px-5 py-3 rounded-xl font-semibold flex items-center gap-2 transition-colors text-sm"
            >
              <Package size={18} /> Add Part
            </Link>
          </div>
        </div>

        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-24 translate-x-24"></div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Repairs</span>
            <Wrench className="text-red-600" size={20} />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            {loading ? "..." : repairs.length}
          </div>
          <p className="text-xs text-gray-500 mt-1">Logged requests</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending</span>
            <Clock className="text-yellow-600" size={20} />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-yellow-600">
            {loading ? "..." : pendingCount}
          </div>
          <p className="text-xs text-gray-500 mt-1">Needs assignment</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">In Progress</span>
            <AlertTriangle className="text-blue-600" size={20} />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-blue-600">
            {loading ? "..." : inProgressCount}
          </div>
          <p className="text-xs text-gray-500 mt-1">Being serviced</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Spare Parts</span>
            <Package className="text-purple-600" size={20} />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-purple-600">
            {loading ? "..." : partsCount}
          </div>
          <p className="text-xs text-gray-500 mt-1">Items in catalog</p>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Mechanics</span>
            <Users className="text-green-600" size={20} />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-green-600">
            {loading ? "..." : mechanicsCount}
          </div>
          <p className="text-xs text-gray-500 mt-1">Certified experts</p>
        </div>
      </div>

      {/* Module Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link 
          href="/dealer/repair/ScheduleTractorRepair" 
          className="group bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md hover:border-red-500 transition-all flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-red-600 group-hover:text-white transition-colors">
              <Calendar size={24} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 group-hover:text-red-600 transition-colors">
              Schedule Tractor Repair
            </h3>
            <p className="text-gray-500 text-sm mt-2">
              Review incoming farmer repair requests, schedule new appointments, assign mechanics, and track repair lifecycle.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm font-semibold text-red-600 mt-6 group-hover:translate-x-1 transition-transform">
            <span>Manage Repairs</span>
            <ArrowRight size={16} />
          </div>
        </Link>

        <Link 
          href="/dealer/repair/PartsInventory" 
          className="group bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md hover:border-red-500 transition-all flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <Package size={24} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
              Parts Inventory
            </h3>
            <p className="text-gray-500 text-sm mt-2">
              Maintain genuine tractor parts catalog, filter by categories, monitor in-stock quantity, and set pricing.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm font-semibold text-purple-600 mt-6 group-hover:translate-x-1 transition-transform">
            <span>View Inventory</span>
            <ArrowRight size={16} />
          </div>
        </Link>

        <Link 
          href="/dealer/repair/Mechanics" 
          className="group bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md hover:border-red-500 transition-all flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-green-600 group-hover:text-white transition-colors">
              <Users size={24} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 group-hover:text-green-600 transition-colors">
              Certified Mechanics
            </h3>
            <p className="text-gray-500 text-sm mt-2">
              Manage your certified field mechanics, track their specializations (Engine, Hydraulics, Electrical), and phone contacts.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm font-semibold text-green-600 mt-6 group-hover:translate-x-1 transition-transform">
            <span>View Workforce</span>
            <ArrowRight size={16} />
          </div>
        </Link>
      </div>

      {/* Recent Repairs Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Recent Service Bookings</h2>
            <p className="text-sm text-gray-500 mt-0.5">Live repair requests from PostgreSQL</p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search ticket or customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
              />
            </div>
            <button
              onClick={fetchOverviewData}
              disabled={loading}
              className="p-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600 disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw size={16} className={loading ? "animate-spin text-red-600" : ""} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Ticket ID</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Priority</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Tractor</th>
                <th className="px-6 py-4">Issue</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={8} className="px-6 py-4">
                      <div className="h-4 bg-gray-100 rounded w-full"></div>
                    </td>
                  </tr>
                ))
              ) : filteredRepairs.length > 0 ? (
                filteredRepairs.slice(0, 8).map((repair) => (
                  <tr key={repair.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-mono font-medium text-xs text-gray-700">
                      {repair.id}
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-xs">
                      {new Date(repair.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${getPriorityBadge(repair.priority_level)}`}>
                        {repair.priority_level}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {repair.user ? `${repair.user.first_name || ""} ${repair.user.last_name || ""}` : "Customer"}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {repair.tractor?.model_name || "General Tractor"}
                    </td>
                    <td className="px-6 py-4 text-gray-600 max-w-xs truncate">
                      {repair.problem_description}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(repair.status)}`}>
                        {repair.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedRepair(repair);
                          setIsAssignModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors"
                      >
                        <Wrench size={12} />
                        {repair.mechanic ? "Reassign" : "Assign"}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-500">
                    No repair requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <AddScheduleRepairModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        onAddSuccess={() => {
          setIsScheduleModalOpen(false);
          fetchOverviewData();
        }}
      />

      <AssignMechanicModal
        isOpen={isAssignModalOpen}
        onClose={() => {
          setIsAssignModalOpen(false);
          setSelectedRepair(null);
        }}
        onAssignSuccess={() => {
          setIsAssignModalOpen(false);
          setSelectedRepair(null);
          fetchOverviewData();
        }}
        repairId={selectedRepair?.id || ""}
      />
    </div>
  );
}
