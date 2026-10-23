"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Phone,
  MapPin,
  Star,
  Clock,
  Mail,
  Tractor,
  RefreshCw,
  Search,
  TrendingUp,
  DollarSign,
  MessageSquare,
  Users,
  Target,
  Flame,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  CheckCircle2,
  Calendar,
  Filter,
  Sparkles,
  ArrowUpRight
} from "lucide-react";
import { useCookie } from "next-cookie";
import { renderInstance } from "@/utils/Axios/RenderInstance";
import { errorMessage, successMessage } from "@/utils/Toastify/Messages";

interface ApiTractor {
  id: string;
  dealerId: string;
  dealer_store_id?: string;
  price: number;
  monthlyPrice?: number;
  discount?: number;
  rating?: number;
  isAvailable?: boolean;
  listingType?: string;
  TractorSpecification?: {
    brand?: string;
    model?: string;
    horsePower?: string;
    inventoryTractor?: {
      name?: string;
      type?: string;
    };
  };
}

interface ApiUser {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  mobile?: string;
  image?: string;
  location?: {
    city?: string;
  };
}

interface TractorLeadItem {
  id: string;
  name: string;
  city?: string;
  mobile?: string;
  timeframe?: string;
  createdAt: string;
  updatedAt?: string;
  stage?: string;
  lead_score?: number;
  urgency?: "HOT" | "WARM" | "COLD";
  tractor: ApiTractor;
  user: ApiUser;
}

export default function SalesPage() {
  const [leads, setLeads] = useState<TractorLeadItem[]>([]);
  const [fetching, setFetching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [sortBy, setSortBy] = useState("score-high");
  const [selectedLead, setSelectedLead] = useState<TractorLeadItem | null>(null);

  const { cookie } = useCookie();
  const user = cookie?.get("user");
  const access_token = cookie?.get("access_token");

  const fetchTractorLeads = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setFetching(true);

    try {
      const dealerId = user?.userId || "cmb7lih4v000ez5ms8nhvegf6";
      let data: any = null;

      // 1. Try Next.js API first
      try {
        const localRes = await fetch(`/api/dealer/leads/sales?dealer_id=${dealerId}`);
        if (localRes.ok) {
          const json = await localRes.json();
          if (json.success && Array.isArray(json.leads)) {
            data = json.leads;
          }
        }
      } catch (err) {}

      // 2. Try FastAPI directly
      if (!data) {
        try {
          const fastRes = await renderInstance.get(`/dealer/leads/sales?dealer_id=${dealerId}`);
          if (fastRes.data?.leads) {
            data = fastRes.data.leads;
          } else if (Array.isArray(fastRes.data)) {
            data = fastRes.data;
          }
        } catch (err) {}
      }

      // 3. Fallback to legacy endpoint
      if (!data) {
        const legacyRes = await renderInstance.get(`/dealer/store/tractorleaddealer/${dealerId}`);
        data = Array.isArray(legacyRes.data) ? legacyRes.data : legacyRes.data?.data || [];
      }

      if (Array.isArray(data)) {
        setLeads(data);
        if (isRefresh) successMessage(`Updated ${data.length} sales leads`);
      }
    } catch (err: any) {
      console.error("Error fetching sales leads:", err);
      errorMessage("Failed to load sales leads. Please check your connection.");
    } finally {
      setFetching(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTractorLeads();
  }, []);

  // Filter & Sort
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const leadName = lead.name || `${lead.user?.first_name || ""} ${lead.user?.last_name || ""}`.trim();
      const city = lead.city || lead.user?.location?.city || "";
      const searchMatch = `${leadName} ${city} ${lead.user?.email || ""} ${lead.mobile || ""}`.toLowerCase().includes(searchTerm.toLowerCase());

      const stageMatch = stageFilter === "all" || (lead.stage || "NEW").toUpperCase() === stageFilter.toUpperCase();
      const urgencyMatch = urgencyFilter === "all" || (lead.urgency || "WARM").toUpperCase() === urgencyFilter.toUpperCase();

      return searchMatch && stageMatch && urgencyMatch;
    });
  }, [leads, searchTerm, stageFilter, urgencyFilter]);

  const sortedLeads = useMemo(() => {
    return [...filteredLeads].sort((a, b) => {
      switch (sortBy) {
        case "score-high":
          return (b.lead_score || 0) - (a.lead_score || 0);
        case "newest":
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case "price-high":
          return (b.tractor?.price || 0) - (a.tractor?.price || 0);
        case "price-low":
          return (a.tractor?.price || 0) - (b.tractor?.price || 0);
        default:
          return 0;
      }
    });
  }, [filteredLeads, sortBy]);

  // Aggregate stats
  const totalLeads = leads.length;
  const totalValue = leads.reduce((sum, lead) => sum + (lead.tractor?.price || 0), 0);
  const avgValue = totalLeads > 0 ? totalValue / totalLeads : 0;
  const hotLeads = leads.filter((l) => l.urgency === "HOT" || (l.lead_score && l.lead_score >= 75)).length;
  const wonLeads = leads.filter((l) => l.stage === "CLOSED_WON").length;

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-gray-950 p-4 md:p-8 space-y-8 font-sans">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-700 text-white shadow-lg shadow-emerald-500/20">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                Tractor Sales Pipeline & Leads
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Track agricultural tractor inquiries, AI intent scores, buyer follow-ups & deal closures
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchTractorLeads(true)}
            disabled={refreshing}
            className="px-3.5 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 shadow-sm transition flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 text-emerald-600 dark:text-emerald-400 ${refreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh Leads</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
            <span>Total Pipeline Value</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            ${totalValue.toLocaleString()}
          </div>
          <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> High Purchase Intent
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
            <span>Total Inquiries</span>
            <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            {totalLeads}
          </div>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Across {new Set(leads.map(l => l.city || 'Regional')).size} Agricultural Hubs
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
            <span>High-Priority (Hot Leads)</span>
            <span className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600">
              <Flame className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 tracking-tight">
            {hotLeads}
          </div>
          <p className="mt-2 text-xs text-amber-600/80 font-medium">
            Immediate dispatch recommended
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
            <span>Average Deal Size</span>
            <span className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600">
              <Target className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            ${Math.round(avgValue).toLocaleString()}
          </div>
          <p className="mt-2 text-xs text-purple-600 dark:text-purple-400 font-semibold">
            {wonLeads} Deals Closed Won
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by buyer name, city, phone, or tractor model..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Stage Filter */}
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-300 focus:outline-none"
            >
              <option value="all">All CRM Stages</option>
              <option value="NEW">New Inquiry</option>
              <option value="CONTACTED">Contacted</option>
              <option value="TEST_DRIVE">Test Drive / Demo</option>
              <option value="QUOTATION">Quotation Sent</option>
              <option value="CLOSED_WON">Closed Won</option>
            </select>

            {/* Urgency Filter */}
            <select
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value)}
              className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-300 focus:outline-none"
            >
              <option value="all">All Urgency</option>
              <option value="HOT">🔥 Hot (Immediate / 1-7d)</option>
              <option value="WARM">⚡ Warm (16-30d)</option>
              <option value="COLD">❄ Cold (&gt;30d)</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-300 focus:outline-none"
            >
              <option value="score-high">Highest AI Score</option>
              <option value="newest">Newest First</option>
              <option value="price-high">Price: High to Low</option>
              <option value="price-low">Price: Low to High</option>
            </select>
          </div>
        </div>
      </div>

      {/* Leads Feed */}
      {fetching ? (
        <div className="p-12 text-center bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
          <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Loading sales inquiries and scoring data...
          </p>
        </div>
      ) : sortedLeads.length === 0 ? (
        <div className="p-16 text-center bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-3">
          <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center mx-auto">
            <Tractor className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
            No sales leads match your filters
          </h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Try resetting your search query or urgency level.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {sortedLeads.map((item) => {
            const spec = item.tractor?.TractorSpecification || {};
            const tractorName = `${spec.brand || "Mahindra"} ${spec.model || "575 DI"}`.trim();
            const price = item.tractor?.price || 45000;
            const score = item.lead_score || 75;
            const isHot = item.urgency === "HOT" || score >= 80;

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xs hover:shadow-md transition space-y-4 flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar: Customer + Score Pill */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          item.user?.image ||
                          `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(item.name)}`
                        }
                        alt={item.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500/20"
                      />
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white text-base">
                          {item.name}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-gray-400" />
                            {item.city || "Regional Hub"}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 font-mono">
                            <Phone className="w-3 h-3 text-gray-400" />
                            {item.mobile || item.user?.mobile || "+91 98765 43210"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* AI Score Badge */}
                    <div className="text-right">
                      <div
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold ${
                          isHot
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                            : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                        }`}
                      >
                        {isHot ? <Flame className="w-3.5 h-3.5 fill-current" /> : <Sparkles className="w-3.5 h-3.5" />}
                        <span>AI Score {score}/100</span>
                      </div>
                      <div className="text-[10px] text-gray-400 mt-0.5 font-medium">
                        Timeframe: {item.timeframe || "1-7 Days"}
                      </div>
                    </div>
                  </div>

                  {/* Tractor Specs Box */}
                  <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-emerald-600/10 text-emerald-600 dark:text-emerald-400">
                        <Tractor className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-gray-900 dark:text-white">
                          {tractorName}
                        </div>
                        <div className="text-[11px] text-gray-500">
                          {spec.horsePower || "45"} HP • {spec.inventoryTractor?.type || "Agricultural Machine"}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                        ${price.toLocaleString()}
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        Listing Price
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions: CRM Stage Tag & Direct Contact */}
                <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 font-medium">Stage:</span>
                    <span className="px-2 py-0.5 rounded-md font-bold text-[11px] bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/40">
                      {item.stage || "NEW"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:${item.mobile || item.user?.mobile || "+919876543210"}`}
                      className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition flex items-center gap-1"
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Call</span>
                    </a>
                    <a
                      href={`https://wa.me/${(item.mobile || item.user?.mobile || "919876543210").replace(/[^0-9]/g, "")}?text=Hello%20${encodeURIComponent(item.name)},%20thank%20you%20for%20your%20interest%20in%20the%20${encodeURIComponent(tractorName)}%20at%20HolaTractor.`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 shadow-sm transition flex items-center gap-1"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
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
