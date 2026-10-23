"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Target,
  Sparkles,
  Flame,
  Search,
  RefreshCw,
  Phone,
  MessageSquare,
  TrendingUp,
  Award,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Zap,
  Clock,
  MapPin,
  Tractor,
  DollarSign,
  ChevronRight
} from "lucide-react";
import { useCookie } from "next-cookie";
import { renderInstance } from "@/utils/Axios/RenderInstance";
import { errorMessage, successMessage } from "@/utils/Toastify/Messages";

interface ScoredLead {
  lead_id: string;
  customer_name: string;
  city: string;
  mobile: string;
  tractor_model: string;
  price: number;
  lead_score: number;
  urgency: "HOT" | "WARM" | "COLD";
  stage: string;
  timeframe: string;
  recommended_action: string;
  conversion_probability: string;
  scoring_factors: {
    urgency_weight: number;
    budget_weight: number;
    reachability_weight: number;
    intent_signal_weight: number;
  };
}

interface TierStats {
  hot_count: number;
  warm_count: number;
  cold_count: number;
  average_score: number;
  top_lead?: ScoredLead;
}

export default function LeadScoring() {
  const [scoredLeads, setScoredLeads] = useState<ScoredLead[]>([]);
  const [tierStats, setTierStats] = useState<TierStats>({
    hot_count: 0,
    warm_count: 0,
    cold_count: 0,
    average_score: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [urgencyFilter, setUrgencyFilter] = useState("all");

  const { cookie } = useCookie();
  const user = cookie?.get("user");

  const fetchLeadScoring = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const dealerId = user?.userId || "cmb7lih4v000ez5ms8nhvegf6";
      let data: any = null;

      try {
        const localRes = await fetch(`/api/dealer/leads/scoring?dealer_id=${dealerId}`);
        if (localRes.ok) {
          const json = await localRes.json();
          if (json.success) data = json;
        }
      } catch (err) {}

      if (!data) {
        const fastRes = await renderInstance.get(`/dealer/leads/scoring?dealer_id=${dealerId}`);
        data = fastRes.data;
      }

      if (data && data.scored_leads) {
        setScoredLeads(data.scored_leads);
        if (data.tier_stats) setTierStats(data.tier_stats);
        if (isRefresh) successMessage("Lead scores refreshed successfully");
      }
    } catch (err: any) {
      console.error("Error fetching lead scoring:", err);
      errorMessage("Failed to load lead scoring data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.userId]);

  useEffect(() => {
    fetchLeadScoring();
  }, [fetchLeadScoring]);

  const filteredLeads = useMemo(() => {
    return scoredLeads.filter((item) => {
      const searchMatch =
        item.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.tractor_model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.mobile.includes(searchTerm);

      if (urgencyFilter === "all") return searchMatch;
      return searchMatch && item.urgency === urgencyFilter;
    });
  }, [scoredLeads, searchTerm, urgencyFilter]);

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-gray-950 p-4 md:p-8 space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/20">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                AI Lead Scoring & Prioritization
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Machine-learning weighted lead scores based on harvest timelines, budgets, and customer engagement
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => fetchLeadScoring(true)}
          disabled={refreshing}
          className="px-3.5 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 shadow-sm transition flex items-center gap-2 self-start md:self-auto"
        >
          <RefreshCw className={`w-4 h-4 text-amber-500 ${refreshing ? "animate-spin" : ""}`} />
          <span>Recalculate Scores</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 mb-2">
            <span>Average Pipeline Score</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              {tierStats.average_score}
            </span>
            <span className="text-xs text-gray-400">/ 100</span>
          </div>
          <p className="mt-2 text-xs text-emerald-600 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> High Propensity to Purchase
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 mb-2">
            <span>Hot Inquiries (Score ≥ 75)</span>
            <Flame className="w-4 h-4 text-rose-500 fill-rose-500" />
          </div>
          <div className="text-4xl font-extrabold text-rose-600 dark:text-rose-400 tracking-tight">
            {tierStats.hot_count}
          </div>
          <p className="mt-2 text-xs text-rose-600 font-medium">
            Action within 24 hours required
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 mb-2">
            <span>Warm Prospects (55 - 74)</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-4xl font-extrabold text-amber-500 tracking-tight">
            {tierStats.warm_count}
          </div>
          <p className="mt-2 text-xs text-amber-600 font-medium">
            Follow up on financing/loan subsidy
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 mb-2">
            <span>Nurture Prospects (&lt; 55)</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-4xl font-extrabold text-blue-500 tracking-tight">
            {tierStats.cold_count}
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Enrolled in monthly WhatsApp broadcast
          </p>
        </div>
      </div>

      {/* Model Weights Breakdown Banner */}
      <div className="p-4 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent border border-amber-200/50 dark:border-amber-800/40 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500 text-white">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-900 dark:text-white">
              AI Scoring Model Weight Distribution
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Evaluated in real-time across 4 primary behavioral criteria
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="px-3 py-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 font-semibold text-gray-700 dark:text-gray-300">
            Urgency: <strong className="text-amber-600">35%</strong>
          </span>
          <span className="px-3 py-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 font-semibold text-gray-700 dark:text-gray-300">
            Equipment Budget: <strong className="text-amber-600">30%</strong>
          </span>
          <span className="px-3 py-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 font-semibold text-gray-700 dark:text-gray-300">
            Phone Reachability: <strong className="text-amber-600">20%</strong>
          </span>
          <span className="px-3 py-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 font-semibold text-gray-700 dark:text-gray-300">
            Platform Intent: <strong className="text-amber-600">15%</strong>
          </span>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search scored leads by customer name, tractor model, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2">
          {["all", "HOT", "WARM", "COLD"].map((t) => (
            <button
              key={t}
              onClick={() => setUrgencyFilter(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition ${
                urgencyFilter === t
                  ? "bg-amber-500 text-white shadow-sm shadow-amber-500/20"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200"
              }`}
            >
              {t === "all" ? "All Tiers" : t}
            </button>
          ))}
        </div>
      </div>

      {/* Leads List */}
      {loading ? (
        <div className="p-12 text-center bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
          <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Calculating lead scoring weights...
          </p>
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="p-16 text-center bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
          <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
            No leads match current filter
          </h3>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredLeads.map((item, idx) => {
            const isHot = item.urgency === "HOT";
            return (
              <div
                key={item.lead_id}
                className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xs hover:shadow-md transition space-y-4"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Customer details */}
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex flex-col items-center justify-center font-extrabold text-sm border border-amber-500/30">
                      <span>#{idx + 1}</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-gray-900 dark:text-white text-base">
                          {item.customer_name}
                        </h4>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                            isHot
                              ? "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400"
                              : "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400"
                          }`}
                        >
                          {item.urgency} PROSPECT
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          {item.city}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-mono">
                          <Phone className="w-3 h-3 text-gray-400" />
                          {item.mobile}
                        </span>
                        <span>•</span>
                        <span>Timeframe: <strong>{item.timeframe}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Score & Probability */}
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="flex items-center gap-1.5 justify-end">
                        <span className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                          {item.lead_score}
                        </span>
                        <span className="text-xs text-gray-400">/ 100</span>
                      </div>
                      <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        {item.conversion_probability}
                      </div>
                    </div>

                    <div className="w-16 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          isHot ? "bg-rose-500" : "bg-amber-400"
                        }`}
                        style={{ width: `${item.lead_score}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Machine and Next Action Box */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-gray-100 dark:border-gray-800 text-xs">
                  <div className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Tractor className="w-4 h-4 text-amber-600" />
                      <div>
                        <div className="font-bold text-gray-800 dark:text-gray-200">
                          {item.tractor_model}
                        </div>
                        <div className="text-[11px] text-gray-500">
                          Stage: {item.stage}
                        </div>
                      </div>
                    </div>
                    <div className="font-extrabold text-gray-900 dark:text-white text-sm">
                      ${item.price.toLocaleString()}
                    </div>
                  </div>

                  <div className="p-3 bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                      <div>
                        <div className="text-[10px] uppercase font-bold text-amber-600">
                          AI Recommended Follow-up
                        </div>
                        <div className="font-medium text-gray-800 dark:text-gray-200">
                          {item.recommended_action}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <a
                        href={`tel:${item.mobile}`}
                        className="p-1.5 rounded-lg bg-white dark:bg-gray-800 text-gray-700 hover:bg-gray-100 transition shadow-xs"
                        title="Call"
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      </a>
                      <a
                        href={`https://wa.me/${item.mobile.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition shadow-xs"
                        title="WhatsApp"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </a>
                    </div>
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
