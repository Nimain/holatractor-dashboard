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
import OperatorRegister from "../Authentication/OperatorRegister";
import {
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
  UserCheck,
  UserX,
  ShieldCheck,
  ArrowUpDown,
  Edit,
  X,
  Wrench,
  BadgeCheck,
} from "lucide-react";

export interface OperatorItem {
  id: string;
  user_id: string;
  role_id: string;
  created_by: string | null;
  status: number;
  Status: number;
  base_id: string;
  document_attachment_id?: string | null;
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

/* ── Operator Detail & Edit Modal ─────────────────────────────── */
function OperatorDetailModal({
  operator,
  open,
  onClose,
  onUpdated,
}: {
  operator: OperatorItem | null;
  open: boolean;
  onClose: () => void;
  onUpdated?: (updated?: any) => void;
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
    if (operator) {
      setFirstName(operator.user.first_name || "");
      setMiddleName(operator.user.middle_name || "");
      setLastName(operator.user.last_name || "");
      setEmail(operator.user.email || "");
      setMobile(operator.user.mobile || "");
      setGender(operator.user.gender || "male");
      setStatus(Number(operator.status ?? operator.Status ?? 1));
      setIsEditing(false);
    }
  }, [operator]);

  if (!operator) return null;

  const fullName = [operator.user.first_name, operator.user.middle_name, operator.user.last_name]
    .filter(Boolean)
    .join(" ") || "Operator";

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = getAuthToken() || "";
      const res = await axios.patch(
        "/api/operator",
        {
          id: operator.id,
          user_id: operator.user_id || operator.id,
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
        successMessage("Operator updated successfully!");
        setIsEditing(false);
        onUpdated?.({
          id: operator.id,
          user_id: operator.user_id,
          status,
          Status: status,
          user: {
            ...operator.user,
            first_name: firstName,
            middle_name: middleName,
            last_name: lastName,
            email,
            mobile,
            gender,
          },
        });
        onClose();
      } else {
        errorMessage(res.data?.message || "Failed to update operator");
      }
    } catch (err: any) {
      errorMessage(err?.response?.data?.message || "Failed to update operator");
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
        <div className="bg-gradient-to-r from-cyan-950 via-slate-900 to-blue-950 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
          <div className="flex items-center gap-4">
            <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-white/10 flex items-center justify-center flex-shrink-0 border border-white/20">
              {isValidImageUrl(operator.user.image) ? (
                <Image
                  src={operator.user.image!}
                  alt={fullName}
                  fill
                  sizes="56px"
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <span className="text-xl font-bold text-white">
                  {(operator.user.first_name?.[0] || "O").toUpperCase()}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 mb-1">
                <Users size={12} />
                Certified Operator
              </span>
              <h3 className="text-lg font-bold text-white truncate">{fullName}</h3>
              <p className="text-xs text-slate-300 truncate">ID: {operator.id}</p>
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
                    {operator.user.email || "No email"}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-xs text-gray-400 font-semibold uppercase">Mobile</p>
                  <p className="text-sm font-semibold text-gray-800 mt-0.5">
                    {operator.user.mobile
                      ? `${operator.user.country_code || "+591"} ${operator.user.mobile}`
                      : "No phone"}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-xs text-gray-400 font-semibold uppercase">Gender</p>
                  <p className="text-sm font-semibold text-gray-800 mt-0.5 capitalize">
                    {operator.user.gender || "Not specified"}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-xs text-gray-400 font-semibold uppercase">Email Verified</p>
                  <p className="text-sm font-semibold mt-0.5 flex items-center gap-1.5">
                    {operator.user.emailVerified ? (
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
                        (operator.status ?? operator.Status) === 1
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-red-50 text-red-600 border border-red-200"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          (operator.status ?? operator.Status) === 1 ? "bg-emerald-500 animate-pulse" : "bg-red-400"
                        }`}
                      />
                      {(operator.status ?? operator.Status) === 1 ? "Active" : "Inactive"}
                    </span>
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-xs text-gray-400 font-semibold uppercase">Auth Type</p>
                  <p className="text-sm font-semibold text-gray-800 mt-0.5 uppercase">
                    {operator.user.authType || "EMAIL"}
                  </p>
                </div>
              </div>

              {operator.document_attachment_id && (
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between text-xs">
                  <span className="font-semibold text-gray-600 flex items-center gap-1.5">
                    <BadgeCheck size={14} className="text-cyan-600" /> License Document ID:
                  </span>
                  <span className="font-mono text-gray-700 truncate max-w-[250px]">
                    {operator.document_attachment_id}
                  </span>
                </div>
              )}

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-1 text-xs text-gray-500">
                <p>
                  <span className="font-semibold text-gray-700">Created:</span> {fmtDate(operator.createdAt)}
                </p>
                <p>
                  <span className="font-semibold text-gray-700">Updated:</span> {fmtDate(operator.updatedAt)}
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
                  className="bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl px-4 text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                >
                  <Edit size={13} />
                  Edit Operator
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
                  className="bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl px-5 text-xs font-semibold shadow-sm"
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

/* ── Main Operator Section Component ──────────────────────────── */
const OperatorSection = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [allOperators, setAllOperators] = useState<OperatorItem[]>([]);
  const [selectedOperator, setSelectedOperator] = useState<OperatorItem | null>(null);
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
  const [newOperatorName, setNewOperatorName] = useState("");
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
    setNewOperatorName(name);
    const { lastName } = splitFullName(name);
    if (lastName) setIsSignUpCard(true);
    else setIsSignUpCard(false);
  };

  // ── Fetch Operators from FastAPI / Next.js API Route ───────
  const fetchAllOperators = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await axios.get(`/api/operator?_t=${Date.now()}`, { timeout: 8000 });
      let list: OperatorItem[] = [];

      if (Array.isArray(res.data)) {
        list = res.data;
      } else if (res.data?.operators && Array.isArray(res.data.operators)) {
        list = res.data.operators;
      }

      setAllOperators(list);
    } catch (err) {
      console.error("Error fetching operator list:", err);
      errorMessage("Failed to load operators from FastAPI");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleOperatorUpdated = useCallback(
    (updatedItem?: any) => {
      if (updatedItem) {
        setAllOperators((prev) =>
          prev.map((item) =>
            item.id === updatedItem.id || item.user_id === updatedItem.user_id
              ? {
                  ...item,
                  ...updatedItem,
                  status: updatedItem.status,
                  Status: updatedItem.Status,
                  user: { ...item.user, ...updatedItem.user },
                }
              : item
          )
        );
      }
      fetchAllOperators(true);
    },
    [fetchAllOperators]
  );

  useEffect(() => {
    fetchAllOperators();
  }, [fetchAllOperators]);

  // Stats
  const stats = useMemo(() => {
    const total = allOperators.length;
    const active = allOperators.filter((op) => (op.status ?? op.Status) === 1).length;
    const inactive = allOperators.filter((op) => (op.status ?? op.Status) === 0).length;
    const verified = allOperators.filter((op) => op.user?.emailVerified).length;
    return { total, active, inactive, verified };
  }, [allOperators]);

  // Filter & Sort
  const filteredOperators = useMemo(() => {
    let list = [...allOperators];

    // Status filter
    if (statusFilter === "active") {
      list = list.filter((op) => (op.status ?? op.Status) === 1);
    } else if (statusFilter === "inactive") {
      list = list.filter((op) => (op.status ?? op.Status) === 0);
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((op) => {
        const fullName = `${op.user?.first_name || ""} ${op.user?.middle_name || ""} ${op.user?.last_name || ""}`.toLowerCase();
        const email = (op.user?.email || "").toLowerCase();
        const mobile = (op.user?.mobile || "").toLowerCase();
        const id = (op.id || "").toLowerCase();
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
        const sA = (a.status ?? a.Status) === 1 ? 1 : 0;
        const sB = (b.status ?? b.Status) === 1 ? 1 : 0;
        return sortAsc ? sA - sB : sB - sA;
      }
      // date
      const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return sortAsc ? dateA - dateB : dateB - dateA;
    });

    return list;
  }, [allOperators, statusFilter, searchQuery, sortBy, sortAsc]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredOperators.length / itemsPerPage));
  const paginatedOperators = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredOperators.slice(start, start + itemsPerPage);
  }, [filteredOperators, currentPage, itemsPerPage]);

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
      <div className="bg-gradient-to-r from-cyan-950 via-slate-900 to-blue-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-cyan-800/40">
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
          <Users size={320} />
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 flex items-center gap-1.5">
                <Users size={13} />
                FastAPI Direct Integration
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/10 text-slate-200 border border-white/15">
                PostgreSQL Live Sync
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-500/20 text-sky-300 border border-sky-400/30">
                Heavy Machinery Fleet Drivers
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Operators Directory & Fleet Drivers
            </h1>
            <p className="text-cyan-100/70 text-sm mt-1 max-w-xl">
              Real-time directory covering {stats.total} registered heavy equipment operators, certified drivers, and telemetry-linked personnel.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Refresh */}
            <Button
              onClick={() => fetchAllOperators(true)}
              disabled={refreshing}
              variant="outline"
              className="bg-white/10 hover:bg-white/20 border-white/20 text-white text-xs font-semibold rounded-xl h-10 px-3.5 backdrop-blur-sm transition-all"
            >
              <RefreshCw size={14} className={`mr-2 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>

            {/* + New Operator */}
            <Button
              onClick={() => setOpenRegister(true)}
              className="bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold rounded-xl h-10 px-4 shadow-lg shadow-cyan-600/20 transition-all active:scale-[0.98]"
            >
              <Plus size={16} className="mr-1.5" />
              + New Operator
            </Button>
          </div>
        </div>
      </div>

      {/* ── Stat Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Operators",
            value: stats.total,
            icon: Users,
            color: "text-cyan-600",
            bg: "bg-cyan-50",
            border: "border-cyan-100",
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
            label: "Inactive / On-Leave",
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
            color: "text-sky-600",
            bg: "bg-sky-50",
            border: "border-sky-100",
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
              en: "Search operators by name, email, phone, or ID...",
              es: "Buscar operadores por nombre, correo, teléfono o ID...",
              ay: "Irpiri thaqaña suti, chaski, celular...",
              qu: "Operador maskay sutinwan, chaskinwan...",
              gn: "Heka operador téra, ñanduti veve rupi...",
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
                    ? "bg-white text-cyan-700 shadow-sm font-bold"
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
              <option value="name">Operator Name</option>
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
                className="flex items-center gap-0.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-cyan-600 text-white hover:bg-cyan-700 disabled:opacity-30 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-all shadow-xs"
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
                <th className="py-3.5 px-5">Operator Name & ID</th>
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
                    <RefreshCw className="h-8 w-8 text-cyan-500 animate-spin mx-auto mb-2" />
                    <p className="text-sm font-semibold">Loading operators from FastAPI…</p>
                  </td>
                </tr>
              ) : paginatedOperators.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-gray-400">
                    <Users className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-gray-600">No operators found</p>
                    <p className="text-xs text-gray-400 mt-0.5">Try adjusting your search or filters</p>
                  </td>
                </tr>
              ) : (
                paginatedOperators.map((item, idx) => {
                  const globalIdx = (currentPage - 1) * itemsPerPage + idx + 1;
                  const fullName = [item.user?.first_name, item.user?.middle_name, item.user?.last_name]
                    .filter(Boolean)
                    .join(" ") || "Operator";
                  const initial = (item.user?.first_name?.[0] || "O").toUpperCase();
                  const itemStatus = Number(item.status ?? item.Status ?? 1);

                  return (
                    <tr
                      key={item.id || idx}
                      onClick={() => {
                        setSelectedOperator(item);
                        setModalOpen(true);
                      }}
                      className="hover:bg-cyan-50/30 transition-colors group cursor-pointer"
                    >
                      <td className="py-3.5 px-5 text-xs text-gray-400 font-semibold">{globalIdx}</td>

                      {/* Operator Name & Avatar */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="relative w-9 h-9 rounded-xl overflow-hidden bg-gradient-to-br from-cyan-600 to-blue-800 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-sm">
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
                            <p className="font-bold text-gray-900 text-sm truncate group-hover:text-cyan-700 transition-colors">
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
                            itemStatus === 1
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-red-50 text-red-600 border border-red-200"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              itemStatus === 1 ? "bg-emerald-500 animate-pulse" : "bg-red-400"
                            }`}
                          />
                          {itemStatus === 1 ? "Active" : "Inactive"}
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
                            setSelectedOperator(item);
                            setModalOpen(true);
                          }}
                          className="h-7 text-xs px-3 rounded-lg border-cyan-200 text-cyan-700 hover:bg-cyan-50 font-semibold"
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
            <RefreshCw className="h-8 w-8 text-cyan-500 animate-spin mx-auto mb-2" />
            <p className="text-sm font-semibold">Loading operators…</p>
          </div>
        ) : paginatedOperators.length === 0 ? (
          <div className="py-16 text-center text-gray-400 bg-white rounded-2xl border border-gray-100 p-6">
            <Users className="h-10 w-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-600">No operators found</p>
          </div>
        ) : (
          paginatedOperators.map((item, idx) => {
            const fullName = [item.user?.first_name, item.user?.middle_name, item.user?.last_name]
              .filter(Boolean)
              .join(" ") || "Operator";
            const initial = (item.user?.first_name?.[0] || "O").toUpperCase();
            const itemStatus = Number(item.status ?? item.Status ?? 1);

            return (
              <div
                key={item.id || idx}
                onClick={() => {
                  setSelectedOperator(item);
                  setModalOpen(true);
                }}
                className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-br from-cyan-600 to-blue-800 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
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
                      itemStatus === 1
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-red-50 text-red-600 border border-red-200"
                    }`}
                  >
                    {itemStatus === 1 ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                  <span>Joined: {formatDate(item.createdAt)}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedOperator(item);
                      setModalOpen(true);
                    }}
                    className="h-7 text-xs px-3 rounded-lg border-cyan-200 text-cyan-700 font-semibold"
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
      {!loading && filteredOperators.length > 0 && (
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Left: Summary and Rows selector */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
            <span>
              Showing <span className="font-bold text-gray-900">{(currentPage - 1) * itemsPerPage + 1}</span>–
              <span className="font-bold text-gray-900">
                {Math.min(currentPage * itemsPerPage, filteredOperators.length)}
              </span>{" "}
              of <span className="font-bold text-gray-900">{filteredOperators.length}</span> operators
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
              className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl border border-cyan-600 bg-cyan-600 text-xs font-bold text-white hover:bg-cyan-700 hover:border-cyan-700 disabled:opacity-30 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:border-gray-200 disabled:text-gray-400 transition-all shadow-sm"
            >
              <span>Next Page</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── Add Operator Dialog ────────────────────────────────────── */}
      <Dialog open={openRegister} onOpenChange={setOpenRegister}>
        <DialogContent className="bg-white p-0 rounded-2xl border border-gray-100 shadow-2xl max-w-[460px] overflow-hidden">
          <div className="bg-gradient-to-r from-cyan-950 via-slate-900 to-blue-950 p-6 text-white relative">
            <p className="text-xs uppercase tracking-wider font-semibold text-cyan-300 mb-1">Fleet Operations</p>
            <h2 className="text-xl font-bold">Register New Operator</h2>
            <p className="text-xs text-slate-300 mt-1">Enter operator legal full name to begin certification.</p>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <Label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Operator Full Name *
              </Label>
              <Input
                value={newOperatorName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Carlos Mendoza"
                className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 outline-none transition-all font-medium"
              />
            </div>
          </div>

          <div className="p-5 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
            <DialogClose asChild>
              <Button
                onClick={() => setOpenRegister(false)}
                variant="outline"
                className="rounded-xl px-4 text-xs font-semibold border-slate-200 hover:bg-slate-100"
              >
                Cancel
              </Button>
            </DialogClose>

            {isSignUpCard ? (
              <OperatorRegister inPage={true} nameOfOperator={newOperatorName} />
            ) : (
              <Button
                onClick={() => errorMessage("Please provide first and last name for operator")}
                className="px-5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold rounded-xl shadow-md transition-all active:scale-[0.98]"
              >
                Next Step →
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Operator Detail / Edit Modal ───────────────────────────── */}
      <OperatorDetailModal
        operator={selectedOperator}
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedOperator(null);
        }}
        onUpdated={handleOperatorUpdated}
      />
    </div>
  );
};

export default OperatorSection;