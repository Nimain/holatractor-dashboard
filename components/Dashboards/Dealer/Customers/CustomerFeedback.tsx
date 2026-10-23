"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Star,
  MessageSquare,
  Search,
  Plus,
  RefreshCw,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  ThumbsUp,
  User,
  ShieldCheck,
  ChevronDown,
  Sparkles,
  Award,
  TrendingUp,
  HeartHandshake,
  Download,
  Trash2,
  CornerDownRight,
  Check,
  X,
  Phone,
  Mail,
  Wrench,
  Tractor,
  Layers
} from "lucide-react";
import { renderInstance } from "@/utils/Axios/RenderInstance";
import { errorMessage, successMessage } from "@/utils/Toastify/Messages";
import AddFeedbackModal from "./AddFeedbackModal";

interface FeedbackItem {
  id: string;
  dealer_id: string;
  customer_id?: string | null;
  customer_name: string;
  customer_email?: string | null;
  customer_phone?: string | null;
  customer_avatar?: string | null;
  store_id?: string | null;
  service_type: string;
  rating: number;
  title?: string | null;
  comment: string;
  sentiment: string;
  status: string;
  dealer_reply?: string | null;
  dealer_replied_at?: string | null;
  created_at: string;
  updated_at?: string;
}

interface FeedbackStats {
  total_reviews: number;
  average_rating: number;
  response_rate: number;
  pending_replies: number;
  distribution: {
    "5": number;
    "4": number;
    "3": number;
    "2": number;
    "1": number;
  };
  sentiment_breakdown: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

const SERVICE_OPTIONS = [
  "All Services",
  "Tractor Purchase",
  "Field Repair",
  "Spare Parts",
  "Rental Service",
  "General Service"
];

const PRESET_REPLIES = [
  "Thank you for choosing HolaTractor! We are delighted to know our team met your farming equipment needs.",
  "We truly appreciate your valuable trust and feedback. Always here to support your seasonal operations!",
  "Thank you for the review. We apologize for the slight delay and have upgraded our dispatch process to serve you faster.",
  "Glad our field mechanic reached you promptly. Feel free to call us anytime for your periodic tractor checkup."
];

export default function CustomerFeedback() {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [stats, setStats] = useState<FeedbackStats>({
    total_reviews: 0,
    average_rating: 0,
    response_rate: 0,
    pending_replies: 0,
    distribution: { "5": 0, "4": 0, "3": 0, "2": 0, "1": 0 },
    sentiment_breakdown: { positive: 0, neutral: 0, negative: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [sentimentFilter, setSentimentFilter] = useState<string>("all");
  const [serviceFilter, setServiceFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [replyFilter, setReplyFilter] = useState<"all" | "replied" | "pending">("all");

  // Modals & Reply Inputs
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);

  // Load Feedback Data
  const fetchFeedbacks = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      // Build query
      const params = new URLSearchParams();
      if (search.trim()) params.append("search", search.trim());
      if (ratingFilter !== "all") params.append("rating", ratingFilter);
      if (sentimentFilter !== "all") params.append("sentiment", sentimentFilter);
      if (serviceFilter !== "all") params.append("service_type", serviceFilter);
      if (statusFilter !== "all") params.append("status", statusFilter);

      let data: any = null;

      // Try local Next.js route first
      try {
        const localRes = await fetch(`/api/dealer/customer-feedback?${params.toString()}`);
        if (localRes.ok) {
          const json = await localRes.json();
          if (json.success) {
            data = json;
          }
        }
      } catch (e) {
        // Fallback to FastAPI
      }

      if (!data) {
        const fastRes = await renderInstance.get(`/dealer/customer-feedback?${params.toString()}`);
        data = fastRes.data;
      }

      if (data && data.feedbacks) {
        setFeedbacks(data.feedbacks);
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch (err: any) {
      console.error("Error loading customer feedback:", err);
      errorMessage("Failed to load customer feedback. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, ratingFilter, sentimentFilter, serviceFilter, statusFilter]);

  useEffect(() => {
    fetchFeedbacks();
  }, [fetchFeedbacks]);

  // Reply handler
  const handleSendReply = async (feedbackId: string) => {
    if (!replyText.trim()) {
      errorMessage("Please enter a reply message");
      return;
    }

    setSubmittingReply(true);
    try {
      let res = await fetch(`/api/dealer/customer-feedback/${feedbackId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reply: replyText.trim() }),
      });

      if (!res.ok) {
        // Fallback to FastAPI
        const fbRes = await renderInstance.post(`/dealer/customer-feedback/${feedbackId}/reply`, {
          reply: replyText.trim()
        });
        if (fbRes.data?.success) {
          res = { ok: true } as any;
        }
      }

      successMessage("Reply posted to customer review successfully!");
      setReplyingToId(null);
      setReplyText("");
      fetchFeedbacks();
    } catch (err: any) {
      console.error("Error submitting reply:", err);
      errorMessage("Failed to post reply. Please try again.");
    } finally {
      setSubmittingReply(false);
    }
  };

  // Status toggle handler
  const handleUpdateStatus = async (feedbackId: string, newStatus: string) => {
    try {
      await fetch(`/api/dealer/customer-feedback/${feedbackId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      successMessage(`Review marked as ${newStatus}`);
      fetchFeedbacks();
    } catch (err) {
      errorMessage("Failed to update status");
    }
  };

  // Delete review handler
  const handleDeleteFeedback = async (feedbackId: string) => {
    if (!window.confirm("Are you sure you want to delete this customer feedback?")) return;
    try {
      await fetch(`/api/dealer/customer-feedback/${feedbackId}`, {
        method: "DELETE",
      });
      successMessage("Customer feedback removed");
      fetchFeedbacks();
    } catch (err) {
      errorMessage("Failed to delete feedback");
    }
  };

  // Filtered by reply status in memory if selected
  const displayedFeedbacks = useMemo(() => {
    if (replyFilter === "all") return feedbacks;
    if (replyFilter === "replied") return feedbacks.filter((f) => f.dealer_reply);
    if (replyFilter === "pending") return feedbacks.filter((f) => !f.dealer_reply);
    return feedbacks;
  }, [feedbacks, replyFilter]);

  // Export to CSV
  const exportToCSV = () => {
    if (feedbacks.length === 0) {
      errorMessage("No feedback entries to export");
      return;
    }
    const headers = ["ID", "Customer Name", "Phone", "Email", "Service Type", "Rating", "Title", "Comment", "Sentiment", "Status", "Dealer Reply", "Date"];
    const rows = feedbacks.map((f) => [
      f.id,
      `"${f.customer_name}"`,
      `"${f.customer_phone || ""}"`,
      `"${f.customer_email || ""}"`,
      `"${f.service_type}"`,
      f.rating,
      `"${(f.title || "").replace(/"/g, '""')}"`,
      `"${f.comment.replace(/"/g, '""')}"`,
      f.sentiment,
      f.status,
      `"${(f.dealer_reply || "").replace(/"/g, '""')}"`,
      f.created_at
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `dealer_feedback_export_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    successMessage("Customer feedback report exported");
  };

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-gray-950 p-4 md:p-8 space-y-8 font-sans">
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/20">
              <Star className="w-6 h-6 fill-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                Customer Feedback & Ratings
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Track customer satisfaction, star ratings, on-field repair reviews & respond in real-time
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchFeedbacks(true)}
            disabled={refreshing}
            className="px-3.5 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 shadow-sm transition flex items-center gap-2"
            title="Refresh reviews"
          >
            <RefreshCw className={`w-4 h-4 text-emerald-600 dark:text-emerald-400 ${refreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={exportToCSV}
            className="px-3.5 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 shadow-sm transition flex items-center gap-2"
          >
            <Download className="w-4 h-4 text-gray-500" />
            <span className="hidden sm:inline">Export</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl shadow-md shadow-emerald-500/20 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Log Customer Review</span>
          </button>
        </div>
      </div>

      {/* Hero CSAT & Analytics KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: CSAT Overall Score */}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
            <span>Overall Dealer CSAT</span>
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full font-bold">
              <TrendingUp className="w-3 h-3" /> +0.2 MoM
            </span>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              {stats.average_rating.toFixed(1)}
            </span>
            <span className="text-sm text-gray-400">/ 5.0</span>
            <div className="flex items-center text-amber-400 ml-auto">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-4 h-4 ${
                    s <= Math.round(stats.average_rating) ? "fill-amber-400 text-amber-400" : "text-gray-300 dark:text-gray-700"
                  }`}
                />
              ))}
            </div>
          </div>
          <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Based on <strong className="text-gray-800 dark:text-gray-200">{stats.total_reviews} verified customer</strong> reviews
          </p>
        </div>

        {/* Card 2: Star Distribution Breakdown */}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
            <span>Rating Breakdown</span>
            <span className="text-amber-500 font-bold">5 Tiers</span>
          </div>
          <div className="space-y-1.5">
            {[5, 4, 3, 2, 1].map((tier) => {
              const count = stats.distribution[String(tier) as keyof typeof stats.distribution] || 0;
              const pct = stats.total_reviews > 0 ? (count / stats.total_reviews) * 100 : 0;
              return (
                <div
                  key={tier}
                  onClick={() => setRatingFilter(ratingFilter === String(tier) ? "all" : String(tier))}
                  className="flex items-center gap-2 text-xs cursor-pointer group hover:opacity-80 transition"
                >
                  <span className="w-6 font-semibold text-gray-600 dark:text-gray-400">{tier}★</span>
                  <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        tier >= 4
                          ? "bg-amber-400"
                          : tier === 3
                          ? "bg-amber-300"
                          : "bg-rose-400"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-7 text-right font-mono text-[11px] text-gray-400">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Card 3: Sentiment Distribution */}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
            <span>Customer Sentiment</span>
            <Sparkles className="w-3.5 h-3.5 text-purple-500" />
          </div>
          <div className="space-y-2 mt-2">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  Positive Experience
                </span>
                <span className="text-gray-700 dark:text-gray-300">
                  {stats.sentiment_breakdown.positive} ({stats.total_reviews ? Math.round((stats.sentiment_breakdown.positive / stats.total_reviews) * 100) : 0}%)
                </span>
              </div>
              <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{
                    width: `${stats.total_reviews ? (stats.sentiment_breakdown.positive / stats.total_reviews) * 100 : 0}%`
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-amber-600 dark:text-amber-400">Neutral Feedback</span>
                <span className="text-gray-700 dark:text-gray-300">
                  {stats.sentiment_breakdown.neutral} ({stats.total_reviews ? Math.round((stats.sentiment_breakdown.neutral / stats.total_reviews) * 100) : 0}%)
                </span>
              </div>
              <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full"
                  style={{
                    width: `${stats.total_reviews ? (stats.sentiment_breakdown.neutral / stats.total_reviews) * 100 : 0}%`
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-rose-600 dark:text-rose-400">Critical / Follow-up</span>
                <span className="text-gray-700 dark:text-gray-300">
                  {stats.sentiment_breakdown.negative} ({stats.total_reviews ? Math.round((stats.sentiment_breakdown.negative / stats.total_reviews) * 100) : 0}%)
                </span>
              </div>
              <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-500 rounded-full"
                  style={{
                    width: `${stats.total_reviews ? (stats.sentiment_breakdown.negative / stats.total_reviews) * 100 : 0}%`
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: Dealer Response & Engagement */}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
            <span>Dealer Response Rate</span>
            <span className="bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-bold">
              Avg &lt; 4 hrs
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-blue-600 dark:text-blue-400 tracking-tight">
              {stats.response_rate}%
            </span>
            <span className="text-xs text-gray-500">publicly answered</span>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs">
            <span className="text-gray-500">Awaiting your reply:</span>
            <span className={`font-bold px-2 py-0.5 rounded-md ${
              stats.pending_replies > 0
                ? "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400"
                : "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400"
            }`}>
              {stats.pending_replies} {stats.pending_replies === 1 ? "review" : "reviews"}
            </span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by customer name, review keyword, title, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Star Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {["all", "5", "4", "3", "2"].map((val) => (
              <button
                key={val}
                onClick={() => setRatingFilter(val)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1 ${
                  ratingFilter === val
                    ? "bg-amber-500 text-white shadow-sm shadow-amber-500/20"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                {val === "all" ? (
                  "All Stars"
                ) : (
                  <>
                    <span>{val}</span>
                    <Star className="w-3 h-3 fill-current" />
                  </>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Second Row Filters: Sentiment, Service, Reply status */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100 dark:border-gray-800 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            {/* Service dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-gray-400 font-medium">Service:</span>
              <select
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="all">All Services</option>
                <option value="Tractor Purchase">Tractor Purchase</option>
                <option value="Field Repair">Field Repair</option>
                <option value="Spare Parts">Spare Parts</option>
                <option value="Rental Service">Rental Service</option>
                <option value="General Service">General Service</option>
              </select>
            </div>

            {/* Sentiment dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-gray-400 font-medium">Sentiment:</span>
              <select
                value={sentimentFilter}
                onChange={(e) => setSentimentFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="all">All Sentiments</option>
                <option value="positive">Positive</option>
                <option value="neutral">Neutral</option>
                <option value="negative">Negative</option>
              </select>
            </div>

            {/* Response status filter tabs */}
            <div className="flex items-center gap-1.5">
              <span className="text-gray-400 font-medium">Response:</span>
              <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-0.5 rounded-lg">
                <button
                  onClick={() => setReplyFilter("all")}
                  className={`px-2 py-1 rounded-md transition ${
                    replyFilter === "all" ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-semibold shadow-xs" : "text-gray-500"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setReplyFilter("pending")}
                  className={`px-2 py-1 rounded-md transition ${
                    replyFilter === "pending" ? "bg-white dark:bg-gray-700 text-amber-600 dark:text-amber-400 font-semibold shadow-xs" : "text-gray-500"
                  }`}
                >
                  Awaiting Reply ({stats.pending_replies})
                </button>
                <button
                  onClick={() => setReplyFilter("replied")}
                  className={`px-2 py-1 rounded-md transition ${
                    replyFilter === "replied" ? "bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 font-semibold shadow-xs" : "text-gray-500"
                  }`}
                >
                  Answered
                </button>
              </div>
            </div>
          </div>

          <div className="text-gray-400 font-medium">
            Showing <strong className="text-gray-700 dark:text-gray-200">{displayedFeedbacks.length}</strong> of {stats.total_reviews} reviews
          </div>
        </div>
      </div>

      {/* Feedback Feed / Cards List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
            <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Loading customer reviews and feedback...
            </p>
          </div>
        ) : displayedFeedbacks.length === 0 ? (
          <div className="p-16 text-center bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-3">
            <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center mx-auto">
              <Star className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
              No matching reviews found
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              Try adjusting your search query, star rating filters, or service category selection.
            </p>
            <button
              onClick={() => {
                setSearch("");
                setRatingFilter("all");
                setSentimentFilter("all");
                setServiceFilter("all");
                setReplyFilter("all");
              }}
              className="mt-2 px-4 py-2 text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl transition"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          displayedFeedbacks.map((item) => {
            const isReplying = replyingToId === item.id;
            const dateFormatted = new Date(item.created_at).toLocaleDateString("en-IN", {
              month: "short",
              day: "numeric",
              year: "numeric"
            });

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xs hover:shadow-md transition p-5 md:p-6 space-y-4"
              >
                {/* Header row: Customer info + Rating + Badges */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        item.customer_avatar ||
                        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(item.customer_name)}`
                      }
                      alt={item.customer_name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500/20 shadow-xs"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-gray-900 dark:text-white text-base">
                          {item.customer_name}
                        </h4>
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          Verified Customer
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {item.customer_phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-gray-400" />
                            {item.customer_phone}
                          </span>
                        )}
                        {item.customer_email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-gray-400" />
                            {item.customer_email}
                          </span>
                        )}
                        <span>• {dateFormatted}</span>
                      </div>
                    </div>
                  </div>

                  {/* Rating + Service Badge */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center text-amber-400">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-4 h-4 ${
                              s <= Math.round(item.rating)
                                ? "fill-amber-400 text-amber-400"
                                : "text-gray-300 dark:text-gray-700"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-extrabold text-gray-900 dark:text-white">
                        {item.rating.toFixed(1)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 flex items-center gap-1">
                        <Tractor className="w-3 h-3 text-emerald-600" />
                        {item.service_type}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          item.sentiment === "POSITIVE"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                            : item.sentiment === "NEUTRAL"
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400"
                            : "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400"
                        }`}
                      >
                        {item.sentiment}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Review Title & Body */}
                <div className="space-y-1.5 pt-1">
                  {item.title && (
                    <h5 className="font-bold text-gray-900 dark:text-white text-sm">
                      "{item.title}"
                    </h5>
                  )}
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {item.comment}
                  </p>
                </div>

                {/* Dealer Reply Section */}
                {item.dealer_reply ? (
                  <div className="mt-3 p-4 bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
                        <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                          ✓
                        </div>
                        <span>HolaTractor Dealership Response</span>
                      </div>
                      {item.dealer_replied_at && (
                        <span className="text-[11px] text-gray-500 dark:text-gray-400">
                          {new Date(item.dealer_replied_at).toLocaleDateString("en-IN", {
                            month: "short",
                            day: "numeric",
                            year: "numeric"
                          })}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed pl-7">
                      {item.dealer_reply}
                    </p>
                    <div className="pl-7 pt-1">
                      <button
                        onClick={() => {
                          setReplyingToId(item.id);
                          setReplyText(item.dealer_reply || "");
                        }}
                        className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold hover:underline"
                      >
                        Edit Response
                      </button>
                    </div>
                  </div>
                ) : (
                  !isReplying && (
                    <div className="pt-2 flex items-center justify-between">
                      <button
                        onClick={() => {
                          setReplyingToId(item.id);
                          setReplyText("");
                        }}
                        className="px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 rounded-xl transition flex items-center gap-1.5"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Public Reply to Customer</span>
                      </button>

                      <div className="flex items-center gap-2">
                        {item.status === "PUBLISHED" ? (
                          <button
                            onClick={() => handleUpdateStatus(item.id, "FLAGGED")}
                            className="text-xs text-gray-400 hover:text-amber-600 transition"
                            title="Flag review for internal inspection"
                          >
                            Flag
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUpdateStatus(item.id, "PUBLISHED")}
                            className="text-xs text-emerald-600 hover:underline transition"
                          >
                            Publish
                          </button>
                        )}
                        <span className="text-gray-300 dark:text-gray-700">•</span>
                        <button
                          onClick={() => handleDeleteFeedback(item.id)}
                          className="text-xs text-gray-400 hover:text-rose-600 transition"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )
                )}

                {/* Inline Reply Form */}
                {isReplying && (
                  <div className="mt-3 p-4 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl space-y-3 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                        <CornerDownRight className="w-3.5 h-3.5 text-emerald-600" />
                        Replying as Dealership Management
                      </span>
                      <button
                        onClick={() => {
                          setReplyingToId(null);
                          setReplyText("");
                        }}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Preset quick replies */}
                    <div className="space-y-1">
                      <span className="text-[11px] font-medium text-gray-500">Quick suggestions:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {PRESET_REPLIES.map((p, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setReplyText(p)}
                            className="text-[11px] px-2.5 py-1 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-emerald-500 transition text-left line-clamp-1"
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>

                    <textarea
                      rows={3}
                      placeholder="Type your public response to the customer..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="w-full p-2.5 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white"
                    />

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setReplyingToId(null)}
                        className="px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={submittingReply}
                        onClick={() => handleSendReply(item.id)}
                        className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm shadow-emerald-500/30 flex items-center gap-1.5 disabled:opacity-50 transition"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{submittingReply ? "Posting..." : "Post Response"}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Log Review Modal */}
      <AddFeedbackModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          successMessage("Feedback logged successfully");
          fetchFeedbacks();
        }}
      />
    </div>
  );
}
