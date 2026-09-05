"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import axios from "axios";
import Image from "next/image";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { Owner } from "@/utils/Types/types";
import { errorMessage } from "@/utils/Toastify/Messages";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTrigger,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import OwnerRegister from "../Authentication/OwnerRegister";
import OwnerAction from "./OwnerAction";
import {
  Tractor,
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
} from "lucide-react";

function isValidImageUrl(url?: string | null): boolean {
  if (!url || typeof url !== "string") return false;
  const t = url.trim();
  if (t.startsWith("file://") || t.startsWith("file:/") || t === "NO" || t.toLowerCase() === "null" || t.toLowerCase() === "undefined") return false;
  return t.startsWith("http://") || t.startsWith("https://") || t.startsWith("/");
}

const OwnerSection = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [users, setUsers] = useState<Owner[]>([]);
  const [openRegister, setOpenRegister] = useState(false);
  const [newOwnerName, setNewOwnerName] = useState("");
  const [isSignUpCard, setIsSignUpCard] = useState(false);

  // Search, Filter, Sort, Pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [sortBy, setSortBy] = useState<"date" | "name" | "status">("date");
  const [sortAsc, setSortAsc] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const { language: locale } = useSelector(
    (root: RootState) => root.ActiveLanguage
  );

  const getTranslation = (locale: string, translations: any) => {
    return translations[locale] || translations["en"];
  };

  // ── Fetch Owners from FastAPI / API Route ──────────────────────────────────
  const fetchAllUsers = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      // Calls /api/owner which tries FastAPI (/api/v1/admin/owners) first
      const res = await axios.get("/api/owner", { timeout: 8000 });
      let ownerList: Owner[] = [];

      if (Array.isArray(res.data)) {
        ownerList = res.data;
      } else if (res.data?.owners && Array.isArray(res.data.owners)) {
        ownerList = res.data.owners;
      }

      setUsers(ownerList);
    } catch (err) {
      console.error("Error fetching owner list from FastAPI:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAllUsers();
  }, [fetchAllUsers]);

  const splitFullName = (fullName: string) => {
    const nameParts = fullName.trim().split(/\s+/);
    const firstName = nameParts.shift();
    const lastName = nameParts.pop();
    const middleName = nameParts.join(" ");
    return { firstName, middleName, lastName };
  };

  function handleNameChange(name: string) {
    setNewOwnerName(name);
    const { lastName } = splitFullName(name);
    if (lastName) setIsSignUpCard(true);
    else setIsSignUpCard(false);
  }

  // ── Calculated Stats ───────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.status === 1).length;
    const inactive = total - active;
    const verified = users.filter((u) => u.user?.emailVerified).length;
    return { total, active, inactive, verified };
  }, [users]);

  // ── Filtered & Sorted Owners ───────────────────────────────────────────────
  const filteredUsers = useMemo(() => {
    let list = [...users];

    // Status filter
    if (statusFilter === "active") {
      list = list.filter((u) => u.status === 1);
    } else if (statusFilter === "inactive") {
      list = list.filter((u) => u.status !== 1);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((u) => {
        const fullName = `${u.user?.first_name || ""} ${u.user?.middle_name || ""} ${u.user?.last_name || ""}`.toLowerCase();
        const email = (u.user?.email || "").toLowerCase();
        const mobile = (u.user?.mobile || "").toLowerCase();
        const id = (u.id || "").toLowerCase();
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
  }, [users, statusFilter, searchQuery, sortBy, sortAsc]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage));
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(start, start + itemsPerPage);
  }, [filteredUsers, currentPage, itemsPerPage]);

  const formatDate = (date: string | Date | undefined): string => {
    if (!date) return "N/A";
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return dateObj.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="w-full min-h-screen p-4 sm:p-6 lg:p-8 space-y-6">
      {/* ── Top Header Banner ─────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-blue-800/40">
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
          <Tractor size={320} />
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30 flex items-center gap-1.5">
                <Tractor size={13} />
                FastAPI Direct Integration
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                ● Live Database Sync
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {getTranslation(locale, {
                en: "Tractor Owners Directory",
                es: "Directorio de Propietarios de Tractores",
                ay: "Tractor Jilatanakan Yatiyawi",
                qu: "Tractor Dueñoqkuna",
                gn: "Tractor Járakuera",
              })}
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              {getTranslation(locale, {
                en: "Manage and update fleet tractor owners, assign stores, verify KYC documents, and monitor live account statuses directly with FastAPI.",
                es: "Gestione y actualice propietarios de tractores, asigne tiendas, verifique documentos KYC y supervise estados en vivo directamente con FastAPI.",
                ay: "Tractor jilatanakaru uñjaña, yatiyawinak askichaña FastAPI tuqi.",
                qu: "Tractor dueñokunata allichay, qillqakuna qhawariy FastAPI nisqawan.",
                gn: "Eñangareko ha emboheko tractor járakuerape FastAPI rupi.",
              })}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Button
              onClick={() => fetchAllUsers(true)}
              disabled={refreshing}
              variant="outline"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 rounded-xl px-4 py-2 text-xs font-semibold backdrop-blur-sm transition-all"
            >
              <RefreshCw size={14} className={`mr-2 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Syncing..." : "Sync FastAPI"}
            </Button>

            {/* Register New Owner Dialog */}
            <Dialog open={openRegister} onOpenChange={setOpenRegister}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => setOpenRegister(true)}
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl px-5 py-2 text-xs font-bold shadow-lg shadow-blue-500/25 transition-all"
                >
                  <Plus size={15} className="mr-1.5" />
                  {getTranslation(locale, {
                    en: "New Owner",
                    es: "Nuevo Propietario",
                    ay: "Machaqa Jilata",
                    qu: "Musuq Dueño",
                    gn: "Jára Pyahu",
                  })}
                </Button>
              </DialogTrigger>

              <DialogContent
                className="bg-white rounded-2xl w-[95vw] max-w-[460px] p-0 overflow-hidden shadow-2xl border border-gray-100"
                style={{ scrollbarWidth: "none" }}
              >
                <div className="bg-slate-900 p-6 text-white">
                  <p className="text-xs uppercase tracking-wider font-semibold text-blue-400 mb-1">
                    FastAPI Registration
                  </p>
                  <h2 className="text-xl font-bold">Register New Owner</h2>
                  <p className="text-xs text-slate-300 mt-1">
                    Enter the full legal name of the tractor owner to start registration.
                  </p>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <Label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                      Full Legal Name *
                    </Label>
                    <Input
                      value={newOwnerName}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="e.g. Carlos Mendoza"
                      className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none font-medium"
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
                    <OwnerRegister inPage={true} name={newOwnerName} />
                  ) : (
                    <Button
                      onClick={() => errorMessage("Please provide full name")}
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl"
                    >
                      Next Step →
                    </Button>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* ── Stat Cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Owners",
            value: stats.total,
            icon: Users,
            color: "text-blue-600",
            bg: "bg-blue-50",
            border: "border-blue-100",
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
            label: "Verified Emails",
            value: stats.verified,
            icon: ShieldCheck,
            color: "text-indigo-600",
            bg: "bg-indigo-50",
            border: "border-indigo-100",
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

      {/* ── Controls & Filter Bar ─────────────────────────────────────────── */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search input */}
        <div className="relative flex-1 min-w-[260px]">
          <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={getTranslation(locale, {
              en: "Search owner by name, email, phone, or ID...",
              es: "Buscar propietario por nombre, correo, teléfono o ID...",
              ay: "Jilata thaqaña suti, chaski, celular tuqi...",
              qu: "Dueño maskay sutinwan, chaskinwan...",
              gn: "Heka jára téra, ñanduti veve rupi...",
            })}
            className="pl-10 pr-4 py-2 text-sm bg-gray-50/70 focus:bg-white border-gray-200 rounded-xl w-full"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
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
                    ? "bg-white text-blue-700 shadow-sm font-bold"
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
                className="flex items-center gap-0.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-30 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-all shadow-xs"
                title="Next Page"
              >
                <span>Next</span>
                <ChevronRight size={13} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Desktop Table ─────────────────────────────────────────────────── */}
      <div className="hidden md:block bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200/80 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <th className="py-3.5 px-5 w-12">#</th>
                <th className="py-3.5 px-5">Owner Name & ID</th>
                <th className="py-3.5 px-5">Contact Details</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Email Verified</th>
                <th className="py-3.5 px-5">Last Updated</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw size={24} className="animate-spin text-blue-600" />
                      <p className="text-sm font-semibold">Connecting to FastAPI and loading owners...</p>
                    </div>
                  </td>
                </tr>
              ) : paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Tractor size={40} className="text-gray-300" />
                      <p className="text-base font-semibold text-gray-700">No owners found</p>
                      <p className="text-xs text-gray-400">Try changing your search keywords or filter options.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((item, idx) => {
                  const globalIdx = (currentPage - 1) * itemsPerPage + idx + 1;
                  const fullName = `${item.user?.first_name || "Owner"} ${item.user?.middle_name ? item.user.middle_name + " " : ""}${item.user?.last_name || ""}`.trim();

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-blue-50/40 transition-colors group"
                    >
                      <td className="py-4 px-5 font-mono text-xs text-gray-400">
                        {globalIdx}
                      </td>

                      {/* Owner Info & Avatar */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0">
                            {isValidImageUrl(item.user?.image) ? (
                              <Image
                                src={item.user.image!}
                                alt={fullName}
                                width={40}
                                height={40}
                                className="w-full h-full object-cover rounded-xl"
                                unoptimized
                              />
                            ) : (
                              fullName.charAt(0).toUpperCase() || "O"
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                              {fullName}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded truncate max-w-[140px]">
                                {item.id}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-4 px-5">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-xs text-gray-700">
                            <Mail size={12} className="text-gray-400" />
                            <span className="truncate max-w-[180px]">{item.user?.email || "—"}</span>
                          </div>
                          {item.user?.mobile && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                              <Phone size={12} className="text-gray-400" />
                              <span>
                                {item.user?.country_code || ""} {item.user?.mobile}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                            item.status === 1
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-red-50 text-red-600 border border-red-200"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                              item.status === 1 ? "bg-emerald-500" : "bg-red-500"
                            }`}
                          />
                          {item.status === 1 ? "Active" : "Inactive"}
                        </span>
                      </td>

                      {/* Email Verified */}
                      <td className="py-4 px-4 text-center">
                        {item.user?.emailVerified ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                            <CheckCircle size={13} /> Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                            <XCircle size={13} /> Pending
                          </span>
                        )}
                      </td>

                      {/* Updated Date */}
                      <td className="py-4 px-5 text-xs text-gray-500 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Calendar size={12} className="text-gray-400" />
                          {formatDate(item.updatedAt || item.createdAt)}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right">
                        <OwnerAction
                          index={idx}
                          name={fullName}
                          email={item.user?.email || ""}
                          emailVerified={Boolean(item.user?.emailVerified)}
                          creatDate={formatDate(item.createdAt)}
                          updateDate={formatDate(item.updatedAt)}
                          status={item.status}
                          id={item.id}
                          user={item.user}
                          screenshots={item.paymentScreenshots}
                          document={
                            item.document
                              ? {
                                  ...item.document,
                                  expire_date:
                                    item.document.expire_date instanceof Date
                                      ? item.document.expire_date.toISOString()
                                      : item.document.expire_date ?? null,
                                }
                              : undefined
                          }
                          location={item.location}
                          onUpdate={() => fetchAllUsers(true)}
                          trigger={
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-3 text-xs rounded-xl border-gray-200 hover:border-blue-500 hover:text-blue-600 gap-1.5 font-semibold transition-all bg-white"
                            >
                              <Edit size={13} />
                              Edit Profile
                            </Button>
                          }
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Mobile Cards ──────────────────────────────────────────────────── */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="text-center py-8 text-gray-500">
            <RefreshCw size={24} className="animate-spin text-blue-600 mx-auto mb-2" />
            <p className="text-xs font-semibold">Loading owners from FastAPI...</p>
          </div>
        ) : paginatedUsers.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-2xl border border-gray-200 p-6">
            <p className="text-sm font-semibold text-gray-700">No owners found</p>
          </div>
        ) : (
          paginatedUsers.map((item, idx) => {
            const fullName = `${item.user?.first_name || "Owner"} ${item.user?.middle_name ? item.user.middle_name + " " : ""}${item.user?.last_name || ""}`.trim();

            return (
              <div
                key={item.id}
                className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center font-bold text-base flex-shrink-0">
                      {isValidImageUrl(item.user?.image) ? (
                        <Image
                          src={item.user.image!}
                          alt={fullName}
                          width={44}
                          height={44}
                          className="w-full h-full object-cover rounded-xl"
                          unoptimized
                        />
                      ) : (
                        fullName.charAt(0).toUpperCase() || "O"
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-gray-900 text-sm truncate">{fullName}</h4>
                      <p className="text-xs text-gray-500 truncate">{item.user?.email}</p>
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

                  <OwnerAction
                    index={idx}
                    name={fullName}
                    email={item.user?.email || ""}
                    emailVerified={Boolean(item.user?.emailVerified)}
                    creatDate={formatDate(item.createdAt)}
                    updateDate={formatDate(item.updatedAt)}
                    status={item.status}
                    id={item.id}
                    user={item.user}
                    screenshots={item.paymentScreenshots}
                    document={
                      item.document
                        ? {
                            ...item.document,
                            expire_date:
                              item.document.expire_date instanceof Date
                                ? item.document.expire_date.toISOString()
                                : item.document.expire_date ?? null,
                          }
                        : undefined
                    }
                    location={item.location}
                    onUpdate={() => fetchAllUsers(true)}
                    trigger={
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs px-3 rounded-lg border-blue-200 text-blue-600 font-semibold"
                      >
                        Edit / View
                      </Button>
                    }
                  />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Pagination Footer ─────────────────────────────────────────────── */}
      {!loading && filteredUsers.length > 0 && (
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Left: Summary and Rows selector */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
            <span>
              Showing <span className="font-bold text-gray-900">{(currentPage - 1) * itemsPerPage + 1}</span>–
              <span className="font-bold text-gray-900">
                {Math.min(currentPage * itemsPerPage, filteredUsers.length)}
              </span>{" "}
              of <span className="font-bold text-gray-900">{filteredUsers.length}</span> owners
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
              className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl border border-blue-600 bg-blue-600 text-xs font-bold text-white hover:bg-blue-700 hover:border-blue-700 disabled:opacity-30 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:border-gray-200 disabled:text-gray-400 transition-all shadow-sm"
            >
              <span>Next Page</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerSection;