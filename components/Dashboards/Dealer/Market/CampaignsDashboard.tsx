"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search,
  ChevronRight,
  Plus,
  RefreshCw,
  Megaphone,
  TrendingUp,
  DollarSign,
  Users,
  Eye,
  MousePointer,
  Play,
  Pause,
  Trash2,
  Calendar,
  Sparkles,
  ExternalLink,
  Target,
  MessageCircle,
  Share2,
  CheckCircle2,
  X,
  AlertCircle
} from "lucide-react";
import { renderInstance, getAuthUser } from "@/utils/Axios/RenderInstance";
import { useCookie } from "next-cookie";
import { errorMessage, successMessage } from "@/utils/Toastify/Messages";

interface MarketingCampaign {
  id: string;
  dealer_id: string;
  name: string;
  type: string;
  channel: string;
  target_audience: string;
  status: "ACTIVE" | "PAUSED" | "COMPLETED" | "DRAFT";
  budget: number;
  spend: number;
  start_date: string;
  end_date?: string | null;
  impressions: number;
  clicks: number;
  leads_generated: number;
  conversions: number;
  revenue_generated: number;
  roi: number;
  description?: string;
  creative_image_url?: string;
  created_at: string;
}

interface CampaignStats {
  total_campaigns: number;
  active_campaigns: number;
  paused_campaigns: number;
  completed_campaigns: number;
  total_budget: number;
  total_spend: number;
  total_impressions: number;
  total_clicks: number;
  total_leads_generated: number;
  total_conversions: number;
  total_revenue_generated: number;
  avg_roi: number;
}

const CAMPAIGN_TYPES = [
  "Social Media Ads",
  "WhatsApp Broadcast",
  "Google Local Ads",
  "SMS & Voice Campaign",
  "In-Store Event & Field Demo",
  "Seasonal Discount Offer"
];

const CHANNELS = [
  "Meta (Facebook & Instagram)",
  "WhatsApp Business API",
  "Google Search & Maps Local",
  "Direct SMS / Automated Voice",
  "On-Ground Agronomist Camp"
];

export default function CampaignsDashboard() {
  const cookie = useCookie();
  const rawCookieUser = cookie?.get ? cookie.get("user") : null;
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

  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);
  const [stats, setStats] = useState<CampaignStats>({
    total_campaigns: 0,
    active_campaigns: 0,
    paused_campaigns: 0,
    completed_campaigns: 0,
    total_budget: 0,
    total_spend: 0,
    total_impressions: 0,
    total_clicks: 0,
    total_leads_generated: 0,
    total_conversions: 0,
    total_revenue_generated: 0,
    avg_roi: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState("all");

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState(CAMPAIGN_TYPES[0]);
  const [formChannel, setFormChannel] = useState(CHANNELS[0]);
  const [formAudience, setFormAudience] = useState("Tractor Owners & Farmers");
  const [formBudget, setFormBudget] = useState("15000");
  const [formDescription, setFormDescription] = useState("");

  const fetchCampaigns = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const qParams: Record<string, string> = {};
      if (targetDealerId) qParams.dealer_id = targetDealerId;

      const res = await renderInstance.get("/dealer/marketing/campaigns", {
        params: qParams,
      });

      const data = res.data;
      if (data && Array.isArray(data.campaigns)) {
        setCampaigns(data.campaigns);
        if (data.stats) setStats(data.stats);
        if (isRefresh) successMessage("Marketing campaigns refreshed");
      } else {
        setCampaigns([]);
      }
    } catch (err: any) {
      console.error("FastAPI error loading campaigns:", err);
      // Fallback via Next API proxy
      try {
        const query = targetDealerId ? `?dealer_id=${encodeURIComponent(targetDealerId)}` : "";
        const localRes = await fetch(`/api/dealer/marketing/campaigns${query}`);
        if (localRes.ok) {
          const json = await localRes.json();
          if (json.success && Array.isArray(json.campaigns)) {
            setCampaigns(json.campaigns);
            if (json.stats) setStats(json.stats);
            return;
          }
        }
      } catch {}
      errorMessage("Failed to load marketing campaigns");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [targetDealerId]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  // Toggle Pause/Active directly with FastAPI
  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === "ACTIVE" ? "PAUSED" : "ACTIVE";
    try {
      await renderInstance.patch(`/dealer/marketing/campaigns/${encodeURIComponent(id)}`, {
        status: nextStatus,
      });

      setCampaigns((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: nextStatus as any } : c))
      );
      successMessage(`Campaign marked as ${nextStatus}`);
      fetchCampaigns();
    } catch (err) {
      console.error("Error toggling campaign status:", err);
      errorMessage("Failed to update campaign status");
    }
  };

  // Delete Campaign directly with FastAPI
  const handleDeleteCampaign = async (id: string) => {
    if (!window.confirm("Are you sure you want to remove this marketing campaign?")) return;
    try {
      await renderInstance.delete(`/dealer/marketing/campaigns/${encodeURIComponent(id)}`);
      setCampaigns((prev) => prev.filter((c) => c.id !== id));
      successMessage("Campaign removed");
      fetchCampaigns();
    } catch (err) {
      console.error("Error deleting campaign:", err);
      errorMessage("Failed to delete campaign");
    }
  };

  // Handle Create Campaign directly with FastAPI
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      errorMessage("Please enter a campaign name");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        dealer_id: targetDealerId || undefined,
        name: formName.trim(),
        type: formType,
        channel: formChannel,
        target_audience: formAudience.trim(),
        budget: parseFloat(formBudget) || 10000,
        description: formDescription.trim(),
      };

      const res = await renderInstance.post("/dealer/marketing/campaigns", payload);

      if (res.status === 200 || res.status === 201) {
        successMessage("Ad campaign launched successfully!");
        setIsCreateModalOpen(false);
        setFormName("");
        setFormDescription("");
        fetchCampaigns();
      } else {
        throw new Error(res.data?.detail || "Failed to create campaign");
      }
    } catch (err: any) {
      errorMessage(err.response?.data?.detail || err.message || "Failed to launch campaign");
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered campaigns
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((item) => {
      const searchMatch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.target_audience.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.channel.toLowerCase().includes(searchTerm.toLowerCase());

      const statusMatch =
        statusFilter === "all" || item.status.toLowerCase() === statusFilter.toLowerCase();
      const channelMatch =
        channelFilter === "all" || item.channel.toLowerCase().includes(channelFilter.toLowerCase());

      return searchMatch && statusMatch && channelMatch;
    });
  }, [campaigns, searchTerm, statusFilter, channelFilter]);

  return (
    <div className="w-full max-w-9xl mx-auto p-4 sm:p-8 bg-slate-50/60 dark:bg-gray-950 min-h-screen space-y-8 font-sans">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-rose-600 to-red-600 text-white shadow-lg shadow-rose-500/20">
              <Megaphone className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                Dealer Marketing & Ad Campaigns
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Run multi-channel promotions across Meta Ads, WhatsApp Broadcasts, Google Local, and Field Camps
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchCampaigns(true)}
            disabled={refreshing}
            className="px-3.5 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 shadow-sm transition flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 text-rose-600 ${refreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-700 hover:to-orange-700 rounded-xl shadow-md shadow-rose-500/20 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Launch New Campaign</span>
          </button>
        </div>
      </div>

      {/* KPI Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 mb-2">
            <span>Budget & Ad Spend</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            ${stats.total_spend.toLocaleString()}
          </div>
          <div className="mt-2 text-xs text-gray-500 flex items-center justify-between">
            <span>Total Budget: ${stats.total_budget.toLocaleString()}</span>
            <span className="font-semibold text-emerald-600">
              {stats.total_budget ? Math.round((stats.total_spend / stats.total_budget) * 100) : 0}% used
            </span>
          </div>
          <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mt-1.5">
            <div
              className="h-full bg-emerald-500 rounded-full"
              style={{
                width: `${stats.total_budget ? Math.min((stats.total_spend / stats.total_budget) * 100, 100) : 0}%`,
              }}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 mb-2">
            <span>Active Campaigns</span>
            <Sparkles className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-3xl font-extrabold text-rose-600 tracking-tight">
            {stats.active_campaigns}
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Out of {stats.total_campaigns} Total Campaigns ({stats.paused_campaigns} paused)
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 mb-2">
            <span>Farmer Inquiries (Leads)</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-3xl font-extrabold text-blue-600 tracking-tight">
            {stats.total_leads_generated}
          </div>
          <p className="mt-2 text-xs text-blue-600/80 font-semibold flex items-center gap-1">
            <MousePointer className="w-3 h-3" /> {stats.total_clicks.toLocaleString()} ad clicks
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 mb-2">
            <span>Attributed Sales Revenue</span>
            <TrendingUp className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-3xl font-extrabold text-purple-600 tracking-tight">
            ${(stats.total_revenue_generated / 1000).toFixed(0)}k
          </div>
          <p className="mt-2 text-xs text-purple-600 font-semibold">
            Avg ROI: {stats.avg_roi}% return
          </p>
        </div>
      </div>

      {/* Launch Banner Callout */}
      <div className="bg-gradient-to-r from-rose-800 via-red-700 to-orange-700 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5" /> High-Yield Seasonal Promotion
          </div>
          <h2 className="text-2xl font-bold tracking-tight">
            Boost Tractor Inquiries with Targeted Multi-Channel Ads
          </h2>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs font-medium text-red-100">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Instant WhatsApp Opt-in
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400"></span> Facebook & Instagram Retargeting
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span> On-Ground Agronomist Demos
            </span>
          </div>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-6 py-3 bg-white text-rose-800 hover:bg-rose-50 rounded-xl font-bold text-sm shadow-md transition flex items-center gap-2 whitespace-nowrap"
        >
          <span>Launch Campaign</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Search and Filters Toolbar */}
      <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search campaigns by name, target audience, or channel..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none dark:text-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {["all", "ACTIVE", "PAUSED", "COMPLETED"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition ${
                statusFilter === s
                  ? "bg-rose-600 text-white shadow-sm shadow-rose-500/20"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200"
              }`}
            >
              {s === "all" ? "All Campaigns" : s.toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Campaigns Feed / Cards */}
      {loading ? (
        <div className="p-12 text-center bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
          <RefreshCw className="w-8 h-8 text-rose-500 animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Loading marketing campaigns from server...
          </p>
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <div className="p-16 text-center bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-3">
          <Megaphone className="w-12 h-12 text-gray-300 mx-auto" />
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
            No campaigns found
          </h3>
          <p className="text-xs text-gray-500">
            Try adjusting your search criteria or launch your first ad campaign.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCampaigns.map((camp) => {
            const isActive = camp.status === "ACTIVE";
            const spendPct = camp.budget > 0 ? Math.round((camp.spend / camp.budget) * 100) : 0;

            return (
              <div
                key={camp.id}
                className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xs hover:shadow-md transition space-y-4"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Creative image + Campaign Title */}
                  <div className="flex items-start gap-4">
                    <img
                      src={
                        camp.creative_image_url ||
                        "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=300&auto=format&fit=crop&q=80"
                      }
                      alt={camp.name}
                      className="w-20 h-20 rounded-xl object-cover shrink-0 border border-gray-200 dark:border-gray-700 shadow-xs"
                    />

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-gray-900 dark:text-white text-base">
                          {camp.name}
                        </h4>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isActive
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                              : camp.status === "PAUSED"
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                              : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                          }`}
                        >
                          {camp.status}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mt-1">
                        <span className="font-semibold text-rose-600 dark:text-rose-400">
                          {camp.channel}
                        </span>
                        <span>•</span>
                        <span>Target: <strong>{camp.target_audience}</strong></span>
                      </div>

                      {camp.description && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1.5 line-clamp-2 max-w-2xl">
                          {camp.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Budget + ROI */}
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-6">
                    <div className="space-y-1 min-w-[130px]">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Spend / Budget:</span>
                        <span className="font-bold text-gray-800 dark:text-gray-200">
                          ${camp.spend.toLocaleString()} / ${camp.budget.toLocaleString()}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-rose-500 rounded-full"
                          style={{ width: `${Math.min(spendPct, 100)}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-right text-gray-400">{spendPct}% utilized</div>
                    </div>

                    <div className="text-right">
                      <div className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                        +{camp.roi}%
                      </div>
                      <span className="text-[10px] font-semibold text-gray-400 uppercase">
                        Campaign ROI
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleStatus(camp.id, camp.status)}
                        className={`p-2 rounded-xl transition ${
                          isActive
                            ? "bg-amber-50 text-amber-600 hover:bg-amber-100 dark:bg-amber-950/40"
                            : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/40"
                        }`}
                        title={isActive ? "Pause Campaign" : "Resume Campaign"}
                      >
                        {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>

                      <button
                        onClick={() => handleDeleteCampaign(camp.id)}
                        className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-rose-600 transition"
                        title="Delete Campaign"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Bottom Metrics Bar */}
                <div className="pt-3 border-t border-gray-100 dark:border-gray-800 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                    <Eye className="w-3.5 h-3.5 text-blue-500" />
                    <span>Impressions: <strong className="text-gray-900 dark:text-white">{camp.impressions.toLocaleString()}</strong></span>
                  </div>

                  <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                    <MousePointer className="w-3.5 h-3.5 text-purple-500" />
                    <span>Clicks: <strong className="text-gray-900 dark:text-white">{camp.clicks.toLocaleString()}</strong></span>
                  </div>

                  <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                    <Users className="w-3.5 h-3.5 text-amber-500" />
                    <span>Inquiries Generated: <strong className="text-gray-900 dark:text-white">{camp.leads_generated}</strong></span>
                  </div>

                  <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Won Revenue: <strong className="text-emerald-600 dark:text-emerald-400">${camp.revenue_generated.toLocaleString()}</strong></span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Campaign Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gradient-to-r from-rose-500/10 via-orange-500/5 to-transparent">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-orange-600 flex items-center justify-center text-white shadow-md shadow-rose-500/20">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    Launch New Marketing Campaign
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Set up digital ads, WhatsApp broadcasts or field demos
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Campaign Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rabi Wheat Sowing 50HP Tractor Subsidy"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Campaign Channel
                  </label>
                  <select
                    value={formChannel}
                    onChange={(e) => setFormChannel(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none dark:text-white"
                  >
                    {CHANNELS.map((ch) => (
                      <option key={ch} value={ch}>{ch}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Campaign Type
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none dark:text-white"
                  >
                    {CAMPAIGN_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Target Farmer Audience
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Cotton & Paddy Farmers (5+ Acres)"
                    value={formAudience}
                    onChange={(e) => setFormAudience(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Budget ($)
                  </label>
                  <input
                    type="number"
                    min="1000"
                    step="500"
                    placeholder="15000"
                    value={formBudget}
                    onChange={(e) => setFormBudget(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none dark:text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Ad Description / Copy
                </label>
                <textarea
                  rows={3}
                  placeholder="Offer details, warranty terms, 0% financing highlight or WhatsApp opt-in message..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full p-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none dark:text-white resize-none"
                />
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={submitting}
                  className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-700 hover:to-orange-700 rounded-xl shadow-md shadow-rose-500/20 flex items-center gap-2 disabled:opacity-50 transition"
                >
                  {submitting ? "Launching..." : "Launch Ad Campaign"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
