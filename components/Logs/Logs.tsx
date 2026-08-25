"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import axios from "axios";
import { useCookie } from "next-cookie";
import { Avatar } from "@mui/material";
import { errorMessage, successMessage } from "@/utils/Toastify/Messages";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Activity,
  ShieldCheck,
  Search,
  RefreshCw,
  Download,
  Calendar,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  Tractor,
  FileText,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  KeyRound,
  Filter,
  Sparkles,
  Users,
} from "lucide-react";

export interface LogItem {
  id: string;
  action: string;
  email?: string;
  user_id?: string;
  details?: string;
  created_at: string;
  user_profile?: {
    id?: string;
    first_name?: string;
    last_name?: string;
    image?: string;
  } | null;
}

export interface LogStats {
  totalLogs: number;
  authLogs: number;
  bookingLogs: number;
  uniqueUsers: number;
}

const LogsSection = () => {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Stats
  const [stats, setStats] = useState<LogStats>({
    totalLogs: 0,
    authLogs: 0,
    bookingLogs: 0,
    uniqueUsers: 0,
  });

  // Modal inspection
  const [selectedLog, setSelectedLog] = useState<LogItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch Logs
  const fetchLogs = useCallback(
    async (isBackground = false) => {
      if (!isBackground) setLoading(true);
      try {
        const res = await axios.get("/api/admin/logs", {
          params: {
            page,
            pageSize,
            q: searchQuery,
            category,
          },
          timeout: 8000,
        });

        if (res.data?.success) {
          setLogs(res.data.data || []);
          setTotalCount(res.data.pagination?.total || 0);
          setTotalPages(res.data.pagination?.totalPages || 1);
          if (res.data.stats) {
            setStats(res.data.stats);
          }
        }
      } catch (err: any) {
        console.warn("Fetch logs notice:", err?.message);
      } finally {
        if (!isBackground) setLoading(false);
      }
    },
    [page, pageSize, searchQuery, category]
  );

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Auto-refresh interval
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchLogs(true);
    }, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchLogs]);

  // Reset page when search or category changes
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setPage(1);
  };

  const handleCategoryChange = (cat: string) => {
    setCategory(cat);
    setPage(1);
  };

  // Copy ID to clipboard
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Delete Log
  const handleDeleteLog = async (logId: string) => {
    if (!window.confirm("Are you sure you want to delete this log entry?")) return;
    setDeletingId(logId);
    try {
      const res = await axios.delete(`/api/admin/logs?id=${logId}`);
      if (res.data?.success) {
        successMessage("Log entry removed");
        setLogs((prev) => prev.filter((l) => l.id !== logId));
        setTotalCount((c) => Math.max(0, c - 1));
      }
    } catch (err: any) {
      errorMessage(err?.response?.data?.error || "Error deleting log");
    } finally {
      setDeletingId(null);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (logs.length === 0) {
      errorMessage("No logs to export");
      return;
    }

    const headers = ["ID", "Action", "Email", "User ID", "Details", "Timestamp"];
    const rows = logs.map((l) => [
      l.id,
      `"${l.action?.replace(/"/g, '""') || ""}"`,
      `"${l.email?.replace(/"/g, '""') || ""}"`,
      `"${l.user_id?.replace(/"/g, '""') || ""}"`,
      `"${l.details?.replace(/"/g, '""') || ""}"`,
      `"${l.created_at || ""}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `holatractor_audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    successMessage("Exported logs to CSV");
  };

  // Format Date
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return String(dateStr);
    }
  };

  // Time Ago
  const timeAgo = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      const diffSec = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
      if (diffSec < 60) return "Just now";
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
      return `${Math.floor(diffSec / 86400)}d ago`;
    } catch {
      return "";
    }
  };

  // Badge Category Styling
  const getActionBadge = (action: string) => {
    const act = (action || "").toLowerCase();
    if (act.includes("login") || act.includes("auth") || act.includes("token")) {
      return {
        bg: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200/60 dark:border-blue-800/60",
        icon: <KeyRound className="w-3 h-3 text-blue-500" />,
        label: action,
      };
    }
    if (act.includes("booking") || act.includes("order")) {
      return {
        bg: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/60",
        icon: <Calendar className="w-3 h-3 text-emerald-500" />,
        label: action,
      };
    }
    if (act.includes("tractor") || act.includes("attachment") || act.includes("store")) {
      return {
        bg: "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200/60 dark:border-indigo-800/60",
        icon: <Tractor className="w-3 h-3 text-indigo-500" />,
        label: action,
      };
    }
    if (act.includes("reject") || act.includes("error") || act.includes("delete")) {
      return {
        bg: "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200/60 dark:border-rose-800/60",
        icon: <AlertCircle className="w-3 h-3 text-rose-500" />,
        label: action,
      };
    }
    if (act.includes("operator") || act.includes("job") || act.includes("driver")) {
      return {
        bg: "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200/60 dark:border-purple-800/60",
        icon: <Users className="w-3 h-3 text-purple-500" />,
        label: action,
      };
    }
    return {
      bg: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700",
      icon: <Activity className="w-3 h-3 text-slate-500" />,
      label: action || "Event",
    };
  };

  return (
    <div className="w-full py-4 space-y-6 max-w-7xl mx-auto">
      {/* 1. Header with Live Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-900 to-indigo-800 text-white flex items-center justify-center shadow-md shadow-indigo-900/20">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
                Audit & Activity Log Stream
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                  {stats.totalLogs.toLocaleString()} Recorded Events
                </span>
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Complete forensic audit trail of logins, machinery leases, booking state transitions, and administrative operations.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Live stream toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all ${
              autoRefresh
                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 border-emerald-200 dark:border-emerald-800"
                : "bg-white dark:bg-slate-900 text-slate-600 border-slate-200 dark:border-slate-800 hover:bg-slate-50"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                autoRefresh ? "bg-emerald-500 animate-ping" : "bg-slate-400"
              }`}
            />
            {autoRefresh ? "Live Stream (10s)" : "Enable Live Stream"}
          </button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchLogs()}
            disabled={loading}
            className="rounded-xl border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 gap-2 h-9 px-3.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-indigo-600" : ""}`} />
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="rounded-xl border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 gap-2 h-9 px-3.5"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* 2. Metrics KPI Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center font-bold">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Logged</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">
              {stats.totalLogs.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Auth & Logins</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">
              {stats.authLogs.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center font-bold">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Bookings & Leases</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">
              {stats.bookingLogs.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Active Accounts</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">
              {stats.uniqueUsers.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search action, email, details, user ID..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 rounded-xl h-10 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto justify-end">
          {[
            { id: "all", label: "All Events" },
            { id: "auth", label: "Auth & Security" },
            { id: "booking", label: "Bookings" },
            { id: "machinery", label: "Fleet & Stores" },
            { id: "operator", label: "Drivers & Jobs" },
            { id: "admin", label: "Admin Ops" },
          ].map((c) => (
            <button
              key={c.id}
              onClick={() => handleCategoryChange(c.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                category === c.id
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              {c.label}
            </button>
          ))}

          {/* Page Size Selector */}
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="h-9 px-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium focus:outline-none"
          >
            <option value={15}>15 / page</option>
            <option value={30}>30 / page</option>
            <option value={50}>50 / page</option>
            <option value={100}>100 / page</option>
          </select>
        </div>
      </div>

      {/* 4. Logs Activity Table */}
      {loading ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-4 shadow-sm">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
          <p className="text-sm font-medium text-slate-500">Querying database audit logs...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 mx-auto flex items-center justify-center">
            <Activity className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Audit Logs Found</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
              {searchQuery
                ? `No event logs match the query "${searchQuery}".`
                : "No activity logs have been recorded in this category."}
            </p>
          </div>
          {searchQuery && (
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setCategory("all");
              }}
              className="rounded-xl"
            >
              Reset Filters
            </Button>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                  <th className="py-3.5 px-4">Event & Action</th>
                  <th className="py-3.5 px-4">User / Actor</th>
                  <th className="py-3.5 px-4">Activity Details</th>
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {logs.map((item) => {
                  const badge = getActionBadge(item.action);
                  const isCopied = copiedId === item.id;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Action Badge */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border ${badge.bg}`}
                          >
                            {badge.icon}
                            <span>{item.action || "System Event"}</span>
                          </span>
                        </div>
                      </td>

                      {/* User Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <Avatar
                            src={item.user_profile?.image}
                            alt={item.email || "User"}
                            sx={{ width: 28, height: 28, fontSize: "11px" }}
                          >
                            {item.email ? item.email.charAt(0).toUpperCase() : "U"}
                          </Avatar>
                          <div className="truncate max-w-[200px]">
                            <p className="font-semibold text-slate-900 dark:text-white text-xs truncate">
                              {item.user_profile?.first_name
                                ? `${item.user_profile.first_name} ${item.user_profile.last_name || ""}`
                                : item.email || "System Actor"}
                            </p>
                            {item.email && (
                              <p className="text-[11px] text-slate-400 truncate">{item.email}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Details */}
                      <td className="py-3.5 px-4">
                        <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2 max-w-lg leading-relaxed">
                          {item.details || "No additional metadata logged for this event."}
                        </p>
                      </td>

                      {/* Timestamp */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="text-xs">
                          <p className="font-medium text-slate-800 dark:text-slate-200">
                            {timeAgo(item.created_at)}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {formatDate(item.created_at)}
                          </p>
                        </div>
                      </td>

                      {/* Inspect & Delete */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedLog(item)}
                            className="h-8 px-2.5 text-xs font-semibold gap-1 text-slate-600 hover:bg-slate-100"
                            title="Inspect Log Event"
                          >
                            <Eye className="w-3.5 h-3.5" /> Inspect
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopy(item.id, item.id)}
                            className="h-8 w-8 p-0 text-slate-400 hover:text-slate-700"
                            title="Copy Log ID"
                          >
                            {isCopied ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteLog(item.id)}
                            disabled={deletingId === item.id}
                            className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            title="Purge Log"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Pagination Controls Footer */}
      {totalCount > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm text-xs">
          <div className="text-slate-500">
            Showing <span className="font-semibold text-slate-800 dark:text-slate-200">{(page - 1) * pageSize + 1}</span> to{" "}
            <span className="font-semibold text-slate-800 dark:text-slate-200">{Math.min(page * pageSize, totalCount)}</span> of{" "}
            <span className="font-semibold text-slate-800 dark:text-slate-200">{totalCount.toLocaleString()}</span> entries
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="rounded-xl h-8 px-3 gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Prev
            </Button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
              .map((p, idx, arr) => {
                const prev = arr[idx - 1];
                return (
                  <span key={p} className="flex items-center">
                    {prev && p - prev > 1 && <span className="px-1 text-slate-400">...</span>}
                    <Button
                      variant={page === p ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPage(p)}
                      className={`rounded-xl h-8 w-8 p-0 text-xs font-semibold ${
                        page === p
                          ? "bg-slate-900 hover:bg-slate-800 text-white shadow-sm"
                          : "border-slate-200 text-slate-700"
                      }`}
                    >
                      {p}
                    </Button>
                  </span>
                );
              })}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className="rounded-xl h-8 px-3 gap-1"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* 6. Log Inspector Modal */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-xl p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
              <Activity className="w-5 h-5 text-indigo-600" />
              Event Forensic Inspector
            </DialogTitle>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4 pt-2 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Action:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedLog.action}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Log Record ID:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">{selectedLog.id}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">User Email:</span>
                  <span className="font-semibold text-indigo-600">{selectedLog.email || "N/A"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">User Identifier:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">{selectedLog.user_id || "N/A"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Recorded At:</span>
                  <span>{formatDate(selectedLog.created_at)}</span>
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold uppercase text-slate-600">Event Payload & Description</Label>
                <div className="p-3.5 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs mt-1.5 leading-relaxed break-words max-h-48 overflow-auto">
                  {selectedLog.details || "No additional payload message."}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button
                  variant="outline"
                  onClick={() => setSelectedLog(null)}
                  className="rounded-xl"
                >
                  Close
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleCopy(JSON.stringify(selectedLog, null, 2), selectedLog.id)}
                  className="rounded-xl gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy JSON
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LogsSection;