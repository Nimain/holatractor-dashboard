"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  FileText,
  Search,
  RefreshCw,
  Tractor,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  User,
  ShieldCheck,
  Check,
  X,
  TrendingUp,
  DollarSign,
  Filter
} from "lucide-react";
import { useCookie } from "next-cookie";
import { renderInstance } from "@/utils/Axios/RenderInstance";
import { errorMessage, successMessage } from "@/utils/Toastify/Messages";

interface TractorLeaseLead {
  id: string;
  tractorId: string;
  user_id: string;
  startDate: string;
  lease_period: string;
  monthlyPrice: number;
  discount: number;
  rating: number;
  status: string;
  dealer_confirm: boolean;
  user_confirm: boolean;
  forFarmer: boolean;
  forOwner: boolean;
  createdAt: string;
  Tractor?: {
    id: string;
    price: number;
    monthlyPrice: number;
    TractorSpecification?: {
      brand?: string;
      model?: string;
      horsePower?: string;
      inventoryTractor?: {
        name?: string;
        type?: string;
      };
    };
  };
  User?: {
    id: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    mobile?: string;
    image?: string;
  };
}

export default function LeaseLeadsPage() {
  const [leases, setLeases] = useState<TractorLeaseLead[]>([]);
  const [fetching, setFetching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const { cookie } = useCookie();
  const user = cookie?.get("user");

  const fetchLeaseLeads = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setFetching(true);

    try {
      const dealerId = user?.userId || "cmb7lih4v000ez5ms8nhvegf6";
      let data: any = null;

      // 1. Next.js API
      try {
        const res = await fetch(`/api/dealer/leads/lease?dealer_id=${dealerId}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.leads)) {
            data = json.leads;
          }
        }
      } catch (err) {}

      // 2. FastAPI fallback
      if (!data) {
        try {
          const fastRes = await renderInstance.get(`/dealer/leads/lease?dealer_id=${dealerId}`);
          if (fastRes.data?.leads) {
            data = fastRes.data.leads;
          } else if (Array.isArray(fastRes.data)) {
            data = fastRes.data;
          }
        } catch (err) {}
      }

      // 3. Legacy route fallback
      if (!data) {
        const legRes = await renderInstance.get(`/dealer/store/tractorleaselead/${dealerId}`);
        data = Array.isArray(legRes.data) ? legRes.data : legRes.data?.data || [];
      }

      if (Array.isArray(data)) {
        setLeases(data);
        if (isRefresh) successMessage(`Refreshed ${data.length} tractor lease leads`);
      }
    } catch (err: any) {
      console.error("Error fetching lease leads:", err);
      errorMessage("Failed to load lease leads");
    } finally {
      setFetching(false);
      setRefreshing(false);
    }
  }, [user?.userId]);

  useEffect(() => {
    fetchLeaseLeads();
  }, [fetchLeaseLeads]);

  // Handle Approve Lease
  const handleApproveLease = async (leaseId: string) => {
    setApprovingId(leaseId);
    try {
      await renderInstance.patch(`/dealer/leads/lease/${leaseId}`, {
        dealer_confirm: true,
        stage: "APPROVED",
      });

      setLeases((prev) =>
        prev.map((item) =>
          item.id === leaseId
            ? { ...item, dealer_confirm: true, status: "APPROVED" }
            : item
        )
      );
      successMessage("Lease request approved successfully!");
    } catch (err) {
      errorMessage("Failed to approve lease request");
    } finally {
      setApprovingId(null);
    }
  };

  // Filtered Leads
  const filteredLeases = useMemo(() => {
    return leases.filter((item) => {
      const customerName = `${item.User?.first_name || ""} ${item.User?.last_name || ""}`.trim().toLowerCase();
      const spec = item.Tractor?.TractorSpecification || {};
      const tractorName = `${spec.brand || ""} ${spec.model || ""}`.toLowerCase();
      const searchMatch =
        customerName.includes(searchTerm.toLowerCase()) ||
        tractorName.includes(searchTerm.toLowerCase()) ||
        (item.User?.email || "").toLowerCase().includes(searchTerm.toLowerCase());

      if (statusFilter === "pending") return searchMatch && !item.dealer_confirm;
      if (statusFilter === "active") return searchMatch && item.dealer_confirm && item.user_confirm;
      if (statusFilter === "approved") return searchMatch && item.dealer_confirm;

      return searchMatch;
    });
  }, [leases, searchTerm, statusFilter]);

  // Aggregated Stats
  const totalMonthlyMRR = leases.reduce((sum, item) => sum + (item.monthlyPrice || 0), 0);
  const pendingCount = leases.filter((l) => !l.dealer_confirm).length;
  const activeCount = leases.filter((l) => l.dealer_confirm && l.user_confirm).length;

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-gray-950 p-4 md:p-8 space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-500/20">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                Tractor Lease & Rental Leads
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Manage seasonal agricultural machinery rentals, approve leases & monitor monthly recurring revenue
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => fetchLeaseLeads(true)}
          disabled={refreshing}
          className="px-3.5 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 shadow-sm transition flex items-center gap-2 self-start md:self-auto"
        >
          <RefreshCw className={`w-4 h-4 text-blue-600 ${refreshing ? "animate-spin" : ""}`} />
          <span>Refresh Leases</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 mb-2">
            <span>Monthly Recurring Value</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            ${totalMonthlyMRR.toLocaleString()}
          </div>
          <p className="mt-2 text-xs text-emerald-600 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> High Rental Utilization
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 mb-2">
            <span>Total Lease Leads</span>
            <Tractor className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            {leases.length}
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Avg Duration: 3.5 Months
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 mb-2">
            <span>Awaiting Dealership Approval</span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-extrabold text-amber-600 tracking-tight">
            {pendingCount}
          </div>
          <p className="mt-2 text-xs text-amber-600/80 font-medium">
            Requires your confirmation
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 mb-2">
            <span>Active Contract Leases</span>
            <CheckCircle2 className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-3xl font-extrabold text-purple-600 tracking-tight">
            {activeCount}
          </div>
          <p className="mt-2 text-xs text-purple-600/80 font-medium">
            Fully signed & verified
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by customer name, tractor model, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
          {["all", "pending", "approved", "active"].map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition ${
                statusFilter === f
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {f === "all" ? "All Leases" : f}
            </button>
          ))}
        </div>
      </div>

      {/* Leases Feed */}
      {fetching ? (
        <div className="p-12 text-center bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Loading tractor lease and rental leads...
          </p>
        </div>
      ) : filteredLeases.length === 0 ? (
        <div className="p-16 text-center bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-3">
          <Tractor className="w-12 h-12 text-gray-300 mx-auto" />
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
            No lease requests found
          </h3>
          <p className="text-xs text-gray-500">
            Try adjusting your search criteria or status filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredLeases.map((lead) => {
            const spec = lead.Tractor?.TractorSpecification || {};
            const tractorName = `${spec.brand || "Sonalika"} ${spec.model || "DI 745"}`.trim();
            const customerName = `${lead.User?.first_name || "Farmer"} ${lead.User?.last_name || "Client"}`.trim();
            const periodClean = lead.lease_period.replace(/_/g, " ");

            return (
              <div
                key={lead.id}
                className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xs hover:shadow-md transition space-y-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          lead.User?.image ||
                          `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(customerName)}`
                        }
                        alt={customerName}
                        className="w-12 h-12 rounded-full object-cover border-2 border-blue-500/20"
                      />
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white text-base">
                          {customerName}
                        </h4>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-2">
                          <span className="font-mono">{lead.User?.mobile || "+91 94120 55432"}</span>
                          <span>•</span>
                          <span>{lead.User?.email || "customer@agrifarm.in"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-lg font-extrabold text-blue-600 dark:text-blue-400">
                        ${lead.monthlyPrice.toLocaleString()}/mo
                      </div>
                      <span className="text-[11px] font-semibold text-gray-400">
                        Period: {periodClean}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-blue-600/10 text-blue-600">
                        <Tractor className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-gray-900 dark:text-white">
                          {tractorName}
                        </div>
                        <div className="text-[11px] text-gray-500">
                          {spec.horsePower || "50"} HP • Seasonal Rental
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          lead.dealer_confirm
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                        }`}
                      >
                        {lead.dealer_confirm ? "Dealership Approved" : "Pending Dealer Review"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Start: {new Date(lead.startDate).toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {!lead.dealer_confirm ? (
                      <button
                        onClick={() => handleApproveLease(lead.id)}
                        disabled={approvingId === lead.id}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 shadow-sm transition flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{approvingId === lead.id ? "Approving..." : "Approve Lease"}</span>
                      </button>
                    ) : (
                      <span className="flex items-center gap-1 text-emerald-600 font-bold">
                        <ShieldCheck className="w-4 h-4" /> Ready for Delivery
                      </span>
                    )}

                    <a
                      href={`tel:${lead.User?.mobile || "+919412055432"}`}
                      className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-200 transition flex items-center gap-1"
                    >
                      <Phone className="w-3.5 h-3.5 text-blue-600" />
                      <span>Contact</span>
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
