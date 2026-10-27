"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  TrendingUp,
  DollarSign,
  Users,
  Target,
  BarChart,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Layers,
  Sparkles,
  CheckCircle2,
  Filter,
  Download,
  Share2
} from "lucide-react";
import { useCookie } from "next-cookie";
import { renderInstance } from "@/utils/Axios/RenderInstance";
import { errorMessage, successMessage } from "@/utils/Toastify/Messages";

interface FunnelStage {
  stage: string;
  count: number;
  conversion_pct: number;
  dropoff: number;
}

interface WeeklyTrendItem {
  day: string;
  sales: number;
  deals: number;
}

interface ChannelItem {
  name: string;
  leads: number;
  converted: number;
  rate: string;
  color: string;
}

interface ConversionSummary {
  overall_conversion_rate: number;
  total_leads_in_pipeline: number;
  sales_leads_count: number;
  lease_leads_count: number;
  closed_deals_count: number;
  avg_sales_cycle_days: number;
  sales_revenue_won: number;
  lease_mrr_won: number;
}

export default function ConversionRates() {
  const [summary, setSummary] = useState<ConversionSummary>({
    overall_conversion_rate: 25.0,
    total_leads_in_pipeline: 28,
    sales_leads_count: 12,
    lease_leads_count: 16,
    closed_deals_count: 7,
    avg_sales_cycle_days: 11,
    sales_revenue_won: 223800.0,
    lease_mrr_won: 19200.0,
  });
  const [funnel, setFunnel] = useState<FunnelStage[]>([]);
  const [weeklyTrend, setWeeklyTrend] = useState<WeeklyTrendItem[]>([]);
  const [channels, setChannels] = useState<ChannelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timePeriod, setTimePeriod] = useState("30D");

  const { cookie } = useCookie();
  const user = cookie?.get("user");

  const fetchConversionData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const dealerId = user?.userId || "cmb7lih4v000ez5ms8nhvegf6";
      let data: any = null;

      try {
        const localRes = await fetch(`/api/dealer/leads/conversion?dealer_id=${dealerId}&period=${timePeriod}`);
        if (localRes.ok) {
          const json = await localRes.json();
          if (json.success) data = json;
        }
      } catch (err) {}

      if (!data) {
        const fastRes = await renderInstance.get(`/dealer/leads/conversion?dealer_id=${dealerId}&period=${timePeriod}`);
        data = fastRes.data;
      }

      if (data) {
        if (data.summary) setSummary(data.summary);
        if (data.funnel) setFunnel(data.funnel);
        if (data.weekly_trend) setWeeklyTrend(data.weekly_trend);
        if (data.channels) setChannels(data.channels);
        if (isRefresh) successMessage("Conversion analytics updated");
      }
    } catch (err: any) {
      console.error("Error fetching conversion analytics:", err);
      errorMessage("Failed to load conversion metrics");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.userId, timePeriod]);

  useEffect(() => {
    fetchConversionData();
  }, [fetchConversionData]);

  // Export report
  const handleExport = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [
        "Conversion Analytics Report",
        `Overall Conversion Rate,${summary.overall_conversion_rate}%`,
        `Total Leads In Pipeline,${summary.total_leads_in_pipeline}`,
        `Closed Deals,${summary.closed_deals_count}`,
        `Sales Revenue Won,$${summary.sales_revenue_won}`,
        `Lease MRR Won,$${summary.lease_mrr_won}`,
        "",
        "Stage,Count,Conversion %,Dropoff",
        ...funnel.map((f) => `"${f.stage}",${f.count},${f.conversion_pct}%,${f.dropoff}`),
      ].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `dealership_conversion_report_${timePeriod}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    successMessage("Conversion report downloaded");
  };

  const maxWeeklySale = Math.max(...(weeklyTrend.map((d) => d.sales) || [50000]), 1000);
  const peakDay = weeklyTrend.length > 0
    ? weeklyTrend.reduce((max, item) => (item.sales > max.sales ? item : max), weeklyTrend[0])
    : null;

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-gray-950 p-4 md:p-8 space-y-8 font-sans">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-rose-500 to-red-600 text-white shadow-lg shadow-rose-500/20">
              <BarChart className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                Conversion Rates & Funnel Analytics
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Measure lead velocities, stage-by-stage drop-offs, won revenue, and sales channel ROI
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-1 shadow-sm text-xs font-semibold">
            {["7D", "30D", "3M", "1Y"].map((p) => (
              <button
                key={p}
                onClick={() => setTimePeriod(p)}
                className={`px-3 py-1.5 rounded-lg transition ${
                  timePeriod === p
                    ? "bg-rose-600 text-white shadow-xs"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <button
            onClick={() => fetchConversionData(true)}
            disabled={refreshing}
            className="p-2.5 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 shadow-sm transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 text-rose-500 ${refreshing ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={handleExport}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md shadow-rose-500/20 transition flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* KPI Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 mb-2">
            <span>Overall Conversion Rate</span>
            <span className="flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
              <ArrowUpRight className="w-3 h-3" /> +3.2%
            </span>
          </div>
          <div className="text-4xl font-extrabold text-rose-600 dark:text-rose-400 tracking-tight">
            {summary.overall_conversion_rate}%
          </div>
          <p className="mt-2 text-xs text-gray-500">
            {summary.closed_deals_count} won from {summary.total_leads_in_pipeline} total prospects
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 mb-2">
            <span>Sales Revenue Won</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            ${summary.sales_revenue_won.toLocaleString()}
          </div>
          <p className="mt-2 text-xs text-emerald-600 font-semibold">
            From {summary.sales_leads_count} purchase leads
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 mb-2">
            <span>Lease MRR Added</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-3xl font-extrabold text-blue-600 dark:text-blue-400 tracking-tight">
            ${summary.lease_mrr_won.toLocaleString()}/mo
          </div>
          <p className="mt-2 text-xs text-gray-500">
            From {summary.lease_leads_count} rental leads
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 mb-2">
            <span>Average Sales Velocity</span>
            <Target className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            {summary.avg_sales_cycle_days} Days
          </div>
          <p className="mt-2 text-xs text-purple-600 font-semibold">
            Inquiry to tractor handover
          </p>
        </div>
      </div>

      {/* Main Grid: Funnel Stages + Weekly Trend Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Funnel Pipeline (7 Cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-base">
                Full Lead Conversion Funnel
              </h3>
              <p className="text-xs text-gray-500">
                Conversion health & drop-off metrics across each stage
              </p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600">
              5 Key Milestones
            </span>
          </div>

          <div className="space-y-4 pt-2">
            {funnel.map((f, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center text-[10px] font-bold">
                      {idx + 1}
                    </div>
                    <span className="text-gray-800 dark:text-gray-200">{f.stage}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-gray-900 dark:text-white font-extrabold">
                      {f.count} leads
                    </span>
                    <span className="text-rose-600 dark:text-rose-400 font-mono text-[11px] w-12 text-right">
                      {f.conversion_pct}%
                    </span>
                  </div>
                </div>

                <div className="h-3 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-rose-500 to-orange-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(f.conversion_pct, 6)}%` }}
                  />
                </div>

                {f.dropoff > 0 && (
                  <div className="text-[10px] text-gray-400 pl-7">
                    ↓ {f.dropoff} drop-offs to next stage
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Trend Chart (5 Cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-base">
                  Weekly Sales Velocity
                </h3>
                <p className="text-xs text-gray-500">
                  Deal volume by day of week
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> +18.4%
              </span>
            </div>

            {/* Custom Bar Visualizer */}
            <div className="pt-8 pb-4">
              <div className="flex items-end justify-between gap-2 h-44 border-b border-gray-100 dark:border-gray-800 pb-2">
                {weeklyTrend.map((item, i) => {
                  const heightPct = (item.sales / maxWeeklySale) * 100;
                  const isPeak = item.sales === maxWeeklySale;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2 group relative">
                      {/* Tooltip on hover */}
                      <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[10px] py-1 px-2 rounded-md whitespace-nowrap z-10 font-mono shadow-md">
                        ${(item.sales / 1000).toFixed(1)}k ({item.deals} deals)
                      </div>

                      <div className="w-full flex justify-center h-36 items-end">
                        <div
                          className={`w-full max-w-[28px] rounded-t-lg transition-all duration-500 ${
                            isPeak
                              ? "bg-gradient-to-t from-rose-600 to-orange-400 shadow-md shadow-rose-500/30"
                              : "bg-rose-500/30 dark:bg-rose-500/20 group-hover:bg-rose-500/50"
                          }`}
                          style={{ height: `${heightPct}%` }}
                        />
                      </div>
                      <span className={`text-[11px] font-semibold ${isPeak ? "text-rose-600" : "text-gray-400"}`}>
                        {item.day}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl flex items-center justify-between text-xs">
            <span className="text-gray-500">Peak Conversion Day:</span>
            <span className="font-extrabold text-rose-600 dark:text-rose-400">
              {peakDay && peakDay.sales > 0
                ? `${peakDay.day} ($${peakDay.sales.toLocaleString()} across ${peakDay.deals} deal${peakDay.deals === 1 ? "" : "s"})`
                : "No peak day recorded yet"}
            </span>
          </div>
        </div>
      </div>

      {/* Channel Attribution Breakdown */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white text-base">
              Customer Acquisition Channel Performance
            </h3>
            <p className="text-xs text-gray-500">
              Effectiveness and conversion rates by inquiry channel
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {channels.map((ch, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 space-y-2 hover:bg-white dark:hover:bg-gray-800 transition"
            >
              <div className="text-xs font-bold text-gray-800 dark:text-gray-200 line-clamp-1">
                {ch.name}
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-extrabold text-gray-900 dark:text-white">
                  {ch.rate}
                </span>
                <span className="text-xs text-gray-400">conversion</span>
              </div>
              <div className="text-[11px] text-gray-500 pt-1 border-t border-gray-200/50 dark:border-gray-700/50 flex justify-between">
                <span>Leads: {ch.leads}</span>
                <span className="font-semibold text-emerald-600">Won: {ch.converted}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
