"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import axios from "axios";
import Image from "next/image";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { errorMessage, successMessage } from "@/utils/Toastify/Messages";
import { getAuthToken } from "@/utils/auth/clientAuth";
import {
  Dialog,
  DialogClose,
  DialogContent,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import AgentRegister from "../Authentication/AgentRegister";
import {
  Headphones,
  Users,
  Search,
  RefreshCw,
  Plus,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Filter,
  UserCheck,
  UserX,
  ShieldCheck,
  ArrowUpDown,
  Edit,
  X,
} from "lucide-react";

export interface AgentItem {
  id: string;
  user_id: string;
  role_id: string;
  created_by: string | null;
  status: number;
  base_id: string;
  createdAt: string | null;
  updatedAt: string | null;
  user: {
    id: string;
    first_name: string;
    middle_name: string;
    last_name: string;
    authType: string;
    gender: string;
    emailVerified: boolean;
    email: string;
    image: string | null;
    mobile: string | null;
    country_code: string;
  };
}

function isValidImageUrl(url?: string | null): boolean {
  if (!url || typeof url !== "string") return false;
  const t = url.trim();
  if (
    t.startsWith("file://") ||
    t.startsWith("file:/") ||
    t === "NO" ||
    t.toLowerCase() === "null" ||
    t.toLowerCase() === "undefined"
  ) {
    return false;
  }
  return t.startsWith("http://") || t.startsWith("https://") || t.startsWith("/");
}

/* ── Agent Detail & Edit Modal ────────────────────────────────── */
function AgentDetailModal({
  agent,
  open,
  onClose,
  onUpdated,
}: {
  agent: AgentItem | null;
  open: boolean;
  onClose: () => void;
  onUpdated?: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [gender, setGender] = useState("male");
  const [status, setStatus] = useState<number>(1);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (agent) {
      setFirstName(agent.user.first_name || "");
      setMiddleName(agent.user.middle_name || "");
      setLastName(agent.user.last_name || "");
      setEmail(agent.user.email || "");
      setMobile(agent.user.mobile || "");
      setGender(agent.user.gender || "male");
      setStatus(agent.status ?? 1);
      setIsEditing(false);
    }
  }, [agent]);

  if (!agent) return null;

  const fullName = [agent.user.first_name, agent.user.middle_name, agent.user.last_name]
    .filter(Boolean)
    .join(" ") || "Agent";

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = getAuthToken() || "";
      const res = await axios.patch(
        "/api/agent",
        {
          id: agent.id,
          user_id: agent.user_id || agent.id,
          first_name: firstName,
          middle_name: middleName,
          last_name: lastName,
          email,
          mobile,
          gender,
          status,
        },
        {
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
                "x-admin-key": token,
                "x-api-key": token,
              }
            : {},
        }
      );

      if (res.data?.success) {
        successMessage("Agent updated successfully!");
        setIsEditing(false);
        onUpdated?.();
        onClose();
      } else {
        errorMessage(res.data?.message || "Failed to update agent");
      }
    } catch (err: any) {
      errorMessage(err?.response?.data?.message || "Failed to update agent");
    } finally {
      setSaving(false);
    }
  };

  const fmtDate = (d: string | null) =>
    d
      ? new Date(d).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "N/A";

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-xl p-0 overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-2xl">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-indigo-900 to-slate-900 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
          <div className="flex items-center gap-4">
            <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-white/10 flex items-center justify-center flex-shrink-0 border border-white/20">
              {isValidImageUrl(agent.user.image) ? (
                <Image
                  src={agent.user.image!}
                  alt={fullName}
                  fill
                  sizes="56px"
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <span className="text-xl font-bold text-white">
                  {(agent.user.first_name?.[0] || "A").toUpperCase()}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 mb-1">
                <Headphones size={12} />
                Agent
              </span>
              <h3 className="text-lg font-bold text-white truncate">{fullName}</h3>
              <p className="text-xs text-slate-300 truncate">ID: {agent.id}</p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {!isEditing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-xs text-gray-400 font-semibold uppercase">Email</p>
                  <p className="text-sm font-semibold text-gray-800 mt-0.5 truncate">
                    {agent.user.email || "No email"}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-xs text-gray-400 font-semibold uppercase">Mobile</p>
                  <p className="text-sm font-semibold text-gray-800 mt-0.5">
                    {agent.user.mobile
                      ? `${agent.user.country_code || "+591"} ${agent.user.mobile}`
                      : "No phone"}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-xs text-gray-400 font-semibold uppercase">Gender</p>
                  <p className="text-sm font-semibold text-gray-800 mt-0.5 capitalize">
                    {agent.user.gender || "Not specified"}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-xs text-gray-400 font-semibold uppercase">Email Verified</p>
                  <p className="text-sm font-semibold mt-0.5 flex items-center gap-1.5">
                    {agent.user.emailVerified ? (
                      <span className="text-emerald-600 flex items-center gap-1 font-bold">
                        <CheckCircle size={14} /> Verified
                      </span>
                    ) : (
                      <span className="text-red-500 flex items-center gap-1 font-bold">
                        <XCircle size={14} /> Not Verified
                      </span>
                    )}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-xs text-gray-400 font-semibold uppercase">Status</p>
                  <p className="text-sm font-semibold mt-0.5">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full ${
                        agent.status === 1
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-red-50 text-red-600 border border-red-200"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          agent.status === 1 ? "bg-emerald-500 animate-pulse" : "bg-red-400"
                        }`}
                      />
                      {agent.status === 1 ? "Active" : "Inactive"}
                    </span>
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-xs text-gray-400 font-semibold uppercase">Auth Type</p>
                  <p className="text-sm font-semibold text-gray-800 mt-0.5 uppercase">
                    {agent.user.authType || "EMAIL"}
                  </p>
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-1 text-xs text-gray-500">
                <p>
                  <span className="font-semibold text-gray-700">Created:</span> {fmtDate(agent.createdAt)}
                </p>
                <p>
                  <span className="font-semibold text-gray-700">Updated:</span> {fmtDate(agent.updatedAt)}
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="rounded-xl px-4 text-xs font-semibold"
                >
                  Close
                </Button>
                <Button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                >
                  <Edit size={13} />
                  Edit Agent
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold text-gray-700 mb-1 block">First Name</Label>
                  <Input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="rounded-xl border-gray-200 bg-gray-50 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-gray-700 mb-1 block">Last Name</Label>
                  <Input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="rounded-xl border-gray-200 bg-gray-50 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold text-gray-700 mb-1 block">Email</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="rounded-xl border-gray-200 bg-gray-50 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-gray-700 mb-1 block">Mobile</Label>
                  <Input
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="rounded-xl border-gray-200 bg-gray-50 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold text-gray-700 mb-1 block">Gender</Label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-medium text-gray-800 outline-none"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-gray-700 mb-1 block">Account Status</Label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setStatus(1)}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                        status === 1
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                          : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      Active
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatus(0)}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                        status === 0
                          ? "bg-red-600 text-white border-red-600 shadow-sm"
                          : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      Inactive
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  disabled={saving}
                  className="rounded-xl px-4 text-xs font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-5 text-xs font-semibold shadow-sm"
                >
                  {saving ? "Saving…" : "Save Changes"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Main Agent Section Component ─────────────────────────────── */
const AgentSection = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [allAgents, setAllAgents] = useState<AgentItem[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<AgentItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Search, Filter, Sort, Pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [sortBy, setSortBy] = useState<"date" | "name" | "status">("date");
  const [sortAsc, setSortAsc] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Registration Dialog
  const [openRegister, setOpenRegister] = useState(false);
  const [newAgentName, setNewAgentName] = useState("");
  const [isSignUpCard, setIsSignUpCard] = useState(false);

  const { language: locale } = useSelector((root: RootState) => root.ActiveLanguage);

  const getTranslation = (locale: string, translations: any) => {
    return translations[locale] || translations["en"];
  };

  const splitFullName = (fullName: string) => {
    const nameParts = fullName.trim().split(/\s+/);
    const firstName = nameParts.shift() || "";
    const lastName = nameParts.pop() || "";
    const middleName = nameParts.join(" ");
    return { firstName, middleName, lastName };
  };

  const handleNameChange = (name: string) => {
    setNewAgentName(name);
    const { lastName } = splitFullName(name);
    if (lastName) setIsSignUpCard(true);
    else setIsSignUpCard(false);
  };

  // ── Fetch Agents from FastAPI / Next.js API Route ──────────
  const fetchAllAgents = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await axios.get("/api/agent", { timeout: 8000 });
      let list: AgentItem[] = [];

      if (Array.isArray(res.data)) {
        list = res.data;
      } else if (res.data?.agents && Array.isArray(res.data.agents)) {
        list = res.data.agents;
      }

      setAllAgents(list);
    } catch (err) {
      console.error("Error fetching agent list:", err);
      errorMessage("Failed to load agents from FastAPI");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAllAgents();
  }, [fetchAllAgents]);

  // Stats
  const stats = useMemo(() => {
    const total = allAgents.length;
    const active = allAgents.filter((a) => a.status === 1).length;
    const inactive = allAgents.filter((a) => a.status === 0).length;
    const verified = allAgents.filter((a) => a.user?.emailVerified).length;
    return { total, active, inactive, verified };
  }, [allAgents]);

  // Filter & Sort
  const filteredAgents = useMemo(() => {
    let list = [...allAgents];

    // Status filter
    if (statusFilter === "active") {
      list = list.filter((a) => a.status === 1);
    } else if (statusFilter === "inactive") {
      list = list.filter((a) => a.status === 0);
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((a) => {
        const fullName = `${a.user?.first_name || ""} ${a.user?.middle_name || ""} ${a.user?.last_name || ""}`.toLowerCase();
        const email = (a.user?.email || "").toLowerCase();
        const mobile = (a.user?.mobile || "").toLowerCase();
        const id = (a.id || "").toLowerCase();
        return fullName.includes(q) || email.includes(q) || mobile.includes(q) || id.includes(q);
      });
    }

    // Sort
    list.sort((a, b) => {
      if (sortBy === "name") {
        const nameA = `${a.user?.first_name || ""} ${a.user?.last_name || ""}`.toLowerCase();
        const nameB = `${b.user?.first_name || ""} ${b.user?.last_name || ""}`.toLowerCase();
        return sortAsc ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      }
      if (sortBy === "status") {
        const sA = a.status === 1 ? 1 : 0;
        const sB = b.status === 1 ? 1 : 0;
        return sortAsc ? sA - sB : sB - sA;
      }
      // date
      const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return sortAsc ? dateA - dateB : dateB - dateA;
    });

    return list;
  }, [allAgents, statusFilter, searchQuery, sortBy, sortAsc]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredAgents.length / itemsPerPage));
  const paginatedAgents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAgents.slice(start, start + itemsPerPage);
  }, [filteredAgents, currentPage, itemsPerPage]);

  const formatDate = (date: string | null | undefined): string => {
    if (!date) return "N/A";
    const dateObj = new Date(date);
    return isNaN(dateObj.getTime())
      ? "N/A"
      : dateObj.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
  };

  return (
    <div className="w-full min-h-screen p-4 sm:p-6 lg:p-8 space-y-6">
      {/* ── Top Header Banner ─────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-indigo-800/40">
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
          <Headphones size={320} />
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 flex items-center gap-1.5">
                <Headphones size={13} />
                FastAPI Direct Integration
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/10 text-slate-200 border border-white/15">
                PostgreSQL Live Sync
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Agents Directory & Network
            </h1>
            <p className="text-indigo-100/70 text-sm mt-1 max-w-xl">
              Real-time synchronization across {stats.total} registered field agents with instant FastAPI query and verification.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Refresh */}
            <Button
              onClick={() => fetchAllAgents(true)}
              disabled={refreshing}
              variant="outline"
              className="bg-white/10 hover:bg-white/20 border-white/20 text-white text-xs font-semibold rounded-xl h-10 px-3.5 backdrop-blur-sm transition-all"
            >
              <RefreshCw size={14} className={`mr-2 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>

            {/* + New Agent */}
            <Button
              onClick={() => setOpenRegister(true)}
              className="bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl h-10 px-4 shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98]"
            >
              <Plus size={16} className="mr-1.5" />
              + New Agent
            </Button>
          </div>
        </div>
      </div>

      {/* ── Stat Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Agents",
            value: stats.total,
            icon: Users,
            color: "text-indigo-600",
            bg: "bg-indigo-50",
            border: "border-indigo-100",
          },
          {
            label: "Active Accounts",
            value: stats.active,
            icon: UserCheck,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
            border: "border-emerald-100",
          },
          {
            label: "Inactive / Pending",
            value: stats.inactive,
            icon: UserX,
            color: "text-red-500",
            bg: "bg-red-50",
            border: "border-red-100",
          },
          {
            label: "Verified Accounts",
            value: stats.verified,
            icon: ShieldCheck,
            color: "text-purple-600",
            bg: "bg-purple-50",
            border: "border-purple-100",
          },
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className={`bg-white p-5 rounded-2xl border ${item.border} shadow-sm hover:shadow-md transition-all flex items-center justify-between`}
            >
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{item.label}</p>
                <p className="text-2xl sm:text-3xl font-black text-gray-900 mt-1">
                  {loading ? "..." : item.value}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-xl ${item.bg} ${item.color} flex items-center justify-center flex-shrink-0`}>
                <Icon size={24} />
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Controls & Filter Bar ─────────────────────────────────── */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search input */}
        <div className="relative flex-1 min-w-[260px]">
          <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <Input
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={getTranslation(locale, {
              en: "Search agents by name, email, phone, or ID...",
              es: "Buscar agentes por nombre, correo, teléfono o ID...",
              ay: "Aruskipiri thaqaña suti, chaski, celular...",
              qu: "Agente maskay sutinwan, chaskinwan...",
              gn: "Heka agente téra, ñanduti veve rupi...",
            })}
            className="pl-10 pr-10 py-2 text-sm bg-gray-50/70 focus:bg-white border-gray-200 rounded-xl w-full"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                setCurrentPage(1);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-700 font-semibold"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filters and Sorting */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Status Tabs */}
          <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200/60">
            {[
              { id: "all", label: "All" },
              { id: "active", label: "Active" },
              { id: "inactive", label: "Inactive" },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => {
                  setStatusFilter(st.id as any);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  statusFilter === st.id
                    ? "bg-white text-indigo-700 shadow-sm font-bold"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-medium text-gray-600">
            <ArrowUpDown size={13} className="text-gray-400" />
            <span className="text-gray-400">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-gray-800 font-semibold outline-none cursor-pointer text-xs"
            >
              <option value="date">Updated Date</option>
              <option value="name">Full Name</option>
              <option value="status">Status</option>
            </select>
            <button
              onClick={() => setSortAsc(!sortAsc)}
              title={sortAsc ? "Ascending" : "Descending"}
              className="ml-1 text-gray-500 hover:text-gray-900 font-bold"
            >
              {sortAsc ? "↑" : "↓"}
            </button>
          </div>

          {/* Items per page */}
          <div className="hidden sm:flex items-center gap-1 bg-gray-50 px-2.5 py-1.5 rounded-xl border border-gray-200 text-xs text-gray-500">
            <span>Show:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-transparent font-semibold text-gray-800 outline-none cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          {/* Top Quick Page Navigator */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-200">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="flex items-center gap-0.5 px-2 py-1 rounded-lg text-xs font-semibold text-gray-700 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                title="Previous Page"
              >
                <ChevronLeft size={13} />
                <span className="hidden lg:inline">Prev</span>
              </button>
              <span className="text-xs font-bold text-gray-800 px-1.5 whitespace-nowrap">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="flex items-center gap-0.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-30 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-all shadow-xs"
                title="Next Page"
              >
                <span>Next</span>
                <ChevronRight size={13} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Desktop Table ─────────────────────────────────────────── */}
      <div className="hidden md:block bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200/80 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <th className="py-3.5 px-5 w-12">#</th>
                <th className="py-3.5 px-5">Agent Name & ID</th>
                <th className="py-3.5 px-5">Contact Details</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Email Verified</th>
                <th className="py-3.5 px-5">Joined Date</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-gray-400">
                    <RefreshCw className="h-8 w-8 text-indigo-500 animate-spin mx-auto mb-2" />
                    <p className="text-sm font-semibold">Loading agents from FastAPI…</p>
                  </td>
                </tr>
              ) : paginatedAgents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-gray-400">
                    <Headphones className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-gray-600">No agents found</p>
                    <p className="text-xs text-gray-400 mt-0.5">Try adjusting your search or filters</p>
                  </td>
                </tr>
              ) : (
                paginatedAgents.map((item, idx) => {
                  const globalIdx = (currentPage - 1) * itemsPerPage + idx + 1;
                  const fullName = [item.user?.first_name, item.user?.middle_name, item.user?.last_name]
                    .filter(Boolean)
                    .join(" ") || "Agent";
                  const initial = (item.user?.first_name?.[0] || "A").toUpperCase();

                  return (
                    <tr
                      key={item.id || idx}
                      onClick={() => {
                        setSelectedAgent(item);
                        setModalOpen(true);
                      }}
                      className="hover:bg-indigo-50/30 transition-colors group cursor-pointer"
                    >
                      <td className="py-3.5 px-5 text-xs text-gray-400 font-semibold">{globalIdx}</td>

                      {/* Agent Name & Avatar */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="relative w-9 h-9 rounded-xl overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-700 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-sm">
                            {isValidImageUrl(item.user?.image) ? (
                              <Image
                                src={item.user?.image!}
                                alt={fullName}
                                fill
                                sizes="36px"
                                className="object-cover"
                                unoptimized
                              />
                            ) : (
                              <span>{initial}</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-gray-900 text-sm truncate group-hover:text-indigo-700 transition-colors">
                              {fullName}
                            </p>
                            <p className="text-xs text-gray-400 font-mono truncate">ID: {item.id ? item.id.substring(0, 10) + "…" : "N/A"}</p>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-5">
                        <div className="space-y-0.5 text-xs">
                          <div className="flex items-center gap-1.5 text-gray-700 truncate max-w-[220px]">
                            <Mail size={12} className="text-gray-400 flex-shrink-0" />
                            <span className="truncate">{item.user?.email || "No email"}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-500">
                            <Phone size={12} className="text-gray-400 flex-shrink-0" />
                            <span>
                              {item.user?.mobile
                                ? `${item.user?.country_code || "+591"} ${item.user?.mobile}`
                                : "No phone"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-full border ${
                            item.status === 1
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-red-50 text-red-600 border border-red-200"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              item.status === 1 ? "bg-emerald-500 animate-pulse" : "bg-red-400"
                            }`}
                          />
                          {item.status === 1 ? "Active" : "Inactive"}
                        </span>
                      </td>

                      {/* Email Verified */}
                      <td className="py-3.5 px-4 text-center">
                        {item.user?.emailVerified ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                            <CheckCircle size={13} /> Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-400">
                            <XCircle size={13} /> Unverified
                          </span>
                        )}
                      </td>

                      {/* Joined Date */}
                      <td className="py-3.5 px-5 text-xs text-gray-500">
                        {formatDate(item.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-5 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAgent(item);
                            setModalOpen(true);
                          }}
                          className="h-7 text-xs px-3 rounded-lg border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-semibold"
                        >
                          Edit / View
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Mobile & Tablet Cards ─────────────────────────────────── */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="py-16 text-center text-gray-400 bg-white rounded-2xl border border-gray-100 p-6">
            <RefreshCw className="h-8 w-8 text-indigo-500 animate-spin mx-auto mb-2" />
            <p className="text-sm font-semibold">Loading agents…</p>
          </div>
        ) : paginatedAgents.length === 0 ? (
          <div className="py-16 text-center text-gray-400 bg-white rounded-2xl border border-gray-100 p-6">
            <Headphones className="h-10 w-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-600">No agents found</p>
          </div>
        ) : (
          paginatedAgents.map((item, idx) => {
            const fullName = [item.user?.first_name, item.user?.middle_name, item.user?.last_name]
              .filter(Boolean)
              .join(" ") || "Agent";
            const initial = (item.user?.first_name?.[0] || "A").toUpperCase();

            return (
              <div
                key={item.id || idx}
                onClick={() => {
                  setSelectedAgent(item);
                  setModalOpen(true);
                }}
                className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-700 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {isValidImageUrl(item.user?.image) ? (
                        <Image
                          src={item.user?.image!}
                          alt={fullName}
                          fill
                          sizes="40px"
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <span>{initial}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-gray-900 text-sm truncate">{fullName}</h4>
                      <p className="text-xs text-gray-500 truncate">{item.user?.email || "No email"}</p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold flex-shrink-0 ${
                      item.status === 1
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-red-50 text-red-600 border border-red-200"
                    }`}
                  >
                    {item.status === 1 ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                  <span>Joined: {formatDate(item.createdAt)}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedAgent(item);
                      setModalOpen(true);
                    }}
                    className="h-7 text-xs px-3 rounded-lg border-indigo-200 text-indigo-700 font-semibold"
                  >
                    Edit / View
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Pagination Footer ─────────────────────────────────────── */}
      {!loading && filteredAgents.length > 0 && (
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Left: Summary and Rows selector */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
            <span>
              Showing <span className="font-bold text-gray-900">{(currentPage - 1) * itemsPerPage + 1}</span>–
              <span className="font-bold text-gray-900">
                {Math.min(currentPage * itemsPerPage, filteredAgents.length)}
              </span>{" "}
              of <span className="font-bold text-gray-900">{filteredAgents.length}</span> agents
            </span>
            <span className="text-gray-300 hidden sm:inline">|</span>
            <span className="text-xs text-gray-500 hidden sm:inline">
              Page <span className="font-bold text-gray-900">{currentPage}</span> of{" "}
              <span className="font-bold text-gray-900">{totalPages}</span>
            </span>
            <div className="flex items-center gap-1.5 ml-1">
              <span className="text-xs text-gray-400">Rows:</span>
              {[10, 20, 50, 100].map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => {
                    setItemsPerPage(size);
                    setCurrentPage(1);
                  }}
                  className={`px-2 py-0.5 rounded-md text-xs font-semibold transition-all ${
                    itemsPerPage === size
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Right: Explicit Previous, Page Number Pills, Next Page */}
          <div className="flex items-center gap-1.5 flex-wrap justify-center">
            {/* Previous */}
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-xs"
            >
              <ChevronLeft size={14} />
              <span>Previous</span>
            </button>

            {/* Page Number Pills */}
            <div className="flex items-center gap-1">
              {(() => {
                const pills: (number | "...")[] = [];
                if (totalPages <= 7) {
                  for (let i = 1; i <= totalPages; i++) pills.push(i);
                } else {
                  pills.push(1);
                  if (currentPage > 3) pills.push("...");
                  for (
                    let i = Math.max(2, currentPage - 1);
                    i <= Math.min(totalPages - 1, currentPage + 1);
                    i++
                  ) {
                    pills.push(i);
                  }
                  if (currentPage < totalPages - 2) pills.push("...");
                  pills.push(totalPages);
                }
                return pills.map((p, idx) =>
                  p === "..." ? (
                    <span
                      key={`ell-${idx}`}
                      className="w-6 h-8 flex items-center justify-center text-gray-400 text-xs font-bold"
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setCurrentPage(p as number)}
                      className={`min-w-[30px] h-8 px-1.5 flex items-center justify-center rounded-xl text-xs font-bold transition-all ${
                        p === currentPage
                          ? "bg-slate-900 text-white shadow-xs ring-2 ring-slate-900/10"
                          : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-300"
                      }`}
                    >
                      {p}
                    </button>
                  )
                );
              })()}
            </div>

            {/* Next Page Button */}
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl border border-indigo-600 bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-700 hover:border-indigo-700 disabled:opacity-30 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:border-gray-200 disabled:text-gray-400 transition-all shadow-sm"
            >
              <span>Next Page</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── Add Agent Dialog ──────────────────────────────────────── */}
      <Dialog open={openRegister} onOpenChange={setOpenRegister}>
        <DialogContent className="bg-white p-0 rounded-2xl border border-gray-100 shadow-2xl max-w-[460px] overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-900 to-slate-900 p-6 text-white relative">
            <p className="text-xs uppercase tracking-wider font-semibold text-indigo-300 mb-1">Agent Network</p>
            <h2 className="text-xl font-bold">Register New Agent</h2>
            <p className="text-xs text-slate-300 mt-1">Enter the full legal name to start agent onboarding.</p>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <Label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Full Legal Name *
              </Label>
              <Input
                value={newAgentName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Maria Fernanda Lopez"
                className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          <div className="p-5 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
            <DialogClose asChild>
              <Button
                variant="outline"
                className="px-4 py-2 text-xs font-semibold text-slate-600 rounded-xl bg-white"
              >
                Cancel
              </Button>
            </DialogClose>
            {isSignUpCard ? (
              <AgentRegister name={newAgentName} inPage={true} />
            ) : (
              <Button
                onClick={() => {
                  if (!newAgentName.trim()) {
                    errorMessage("Please provide a name");
                    return;
                  }
                  successMessage("Agent registration initiated");
                  setOpenRegister(false);
                  setNewAgentName("");
                }}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl"
              >
                Continue →
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Detail / Edit Modal ───────────────────────────────────── */}
      <AgentDetailModal
        agent={selectedAgent}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onUpdated={() => fetchAllAgents(true)}
      />
    </div>
  );
};

export default AgentSection;