"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import Image from "next/image";
import { Dialog, DialogContent } from "../ui/dialog";
import {
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
  Users,
  Shield,
  Tractor,
  Wheat,
  Wrench,
  Truck,
  UserCog,
  BadgeCheck,
  BadgeX,
  Phone,
  Mail,
  Calendar,
  CircleDot,
  Download,
  FilterIcon,
  SortAsc,
  SortDesc,
} from "lucide-react";
import { getAuthToken } from "@/utils/auth/clientAuth";

/* ── Types ─────────────────────────────────────────────── */
type UserRole = "farmer" | "owner" | "agent" | "dealer" | "operator" | "mechanic" | "admin";

interface AdminUser {
  id: string;
  user_id: string;
  role: UserRole;
  first_name: string;
  middle_name: string;
  last_name: string;
  email: string;
  mobile: string | null;
  country_code: string;
  gender: string;
  image: string | null;
  authType: string;
  emailVerified: boolean;
  Status: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
  // Mechanic-specific
  specialization?: string | null;
  experience_years?: number | null;
  license_number?: string | null;
  is_available?: boolean | null;
}

interface UsersResponse {
  users: AdminUser[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
  role: UserRole;
}

/* ── Role Config ─────────────────────────────────────────── */
const ROLE_CONFIG: Record<
  UserRole,
  {
    label: string;
    plural: string;
    icon: React.ElementType;
    color: string;
    gradient: string;
    bg: string;
    badge: string;
  }
> = {
  farmer: {
    label: "Farmer",
    plural: "Farmers",
    icon: Wheat,
    color: "text-emerald-600",
    gradient: "from-emerald-500 to-teal-500",
    bg: "bg-emerald-50",
    badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  owner: {
    label: "Owner",
    plural: "Owners",
    icon: Tractor,
    color: "text-blue-600",
    gradient: "from-blue-500 to-cyan-500",
    bg: "bg-blue-50",
    badge: "bg-blue-100 text-blue-700 border-blue-200",
  },
  agent: {
    label: "Agent",
    plural: "Agents",
    icon: UserCog,
    color: "text-purple-600",
    gradient: "from-purple-500 to-violet-500",
    bg: "bg-purple-50",
    badge: "bg-purple-100 text-purple-700 border-purple-200",
  },
  dealer: {
    label: "Dealer",
    plural: "Dealers",
    icon: Truck,
    color: "text-orange-600",
    gradient: "from-orange-500 to-amber-500",
    bg: "bg-orange-50",
    badge: "bg-orange-100 text-orange-700 border-orange-200",
  },
  operator: {
    label: "Operator",
    plural: "Operators",
    icon: Users,
    color: "text-cyan-600",
    gradient: "from-cyan-500 to-sky-500",
    bg: "bg-cyan-50",
    badge: "bg-cyan-100 text-cyan-700 border-cyan-200",
  },
  mechanic: {
    label: "Mechanic",
    plural: "Mechanics",
    icon: Wrench,
    color: "text-rose-600",
    gradient: "from-rose-500 to-pink-500",
    bg: "bg-rose-50",
    badge: "bg-rose-100 text-rose-700 border-rose-200",
  },
  admin: {
    label: "Admin",
    plural: "Admins",
    icon: Shield,
    color: "text-slate-600",
    gradient: "from-slate-600 to-slate-800",
    bg: "bg-slate-50",
    badge: "bg-slate-100 text-slate-700 border-slate-200",
  },
};

const ALL_ROLES: UserRole[] = ["farmer", "owner", "agent", "dealer", "operator", "mechanic", "admin"];

function isValidImageUrl(url?: string | null): boolean {
  if (!url || typeof url !== "string") return false;
  const t = url.trim();
  if (t.startsWith("file://") || t.startsWith("file:/") || t === "NO" || t.toLowerCase() === "null" || t.toLowerCase() === "undefined") return false;
  return t.startsWith("http://") || t.startsWith("https://") || t.startsWith("/");
}

/* ── Avatar ────────────────────────────────────────────── */
function Avatar({ user, size = 40, role }: { user: AdminUser; size?: number; role: UserRole }) {
  const cfg = ROLE_CONFIG[role];
  const initials = `${user.first_name[0] || ""}${user.last_name[0] || ""}`.toUpperCase() || "U";
  if (isValidImageUrl(user.image)) {
    return (
      <Image
        src={user.image!}
        alt={user.first_name}
        width={size}
        height={size}
        className="rounded-full object-cover ring-2 ring-white"
        style={{ width: size, height: size }}
        unoptimized
      />
    );
  }
  return (
    <div
      className={`rounded-full bg-gradient-to-br ${cfg.gradient} flex items-center justify-center text-white font-bold ring-2 ring-white`}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials}
    </div>
  );
}

/* ── Pagination ────────────────────────────────────────── */
function Pagination({
  page,
  totalPages,
  total,
  perPage,
  onPage,
  onPerPageChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  perPage: number;
  onPage: (p: number) => void;
  onPerPageChange?: (size: number) => void;
}) {
  const start = Math.max(1, (page - 1) * perPage + 1);
  const end = Math.min(page * perPage, total);

  const pages: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("...");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-3.5 px-2 border-t border-gray-100">
      {/* Left: Summary & Per Page */}
      <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-gray-500">
        <span>
          Showing <span className="text-gray-900 font-bold">{start}–{end}</span> of{" "}
          <span className="text-gray-900 font-bold">{total}</span> users
        </span>
        <span className="text-gray-300 hidden sm:inline">|</span>
        <span className="text-xs text-gray-500 hidden sm:inline">
          Page <span className="font-bold text-gray-900">{page}</span> of <span className="font-bold text-gray-900">{totalPages}</span>
        </span>
        {onPerPageChange && (
          <div className="flex items-center gap-1.5 ml-1">
            <span className="text-xs text-gray-400">Rows:</span>
            {[10, 20, 50, 100].map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => onPerPageChange(size)}
                className={`px-2 py-0.5 rounded-md text-xs font-semibold transition-all ${
                  perPage === size
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right: Explicit Previous, Numbers, Next */}
      <div className="flex items-center gap-1.5 flex-wrap justify-center">
        {/* Previous Button */}
        <button
          type="button"
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-xs"
        >
          <ChevronLeft size={14} />
          <span>Previous</span>
        </button>

        {/* Page Pills */}
        <div className="flex items-center gap-1">
          {pages.map((p, i) =>
            p === "..." ? (
              <span key={`ellipsis-${i}`} className="w-6 h-8 flex items-center justify-center text-gray-400 text-xs font-bold">…</span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => onPage(p as number)}
                className={`min-w-[30px] h-8 px-1.5 flex items-center justify-center rounded-xl text-xs font-bold transition-all ${
                  p === page
                    ? "bg-slate-900 text-white shadow-sm ring-2 ring-slate-900/10"
                    : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-300"
                }`}
              >
                {p}
              </button>
            )
          )}
        </div>

        {/* Next Page Button */}
        <button
          type="button"
          onClick={() => onPage(page + 1)}
          disabled={page >= totalPages}
          className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl border border-blue-600 bg-blue-600 text-xs font-bold text-white hover:bg-blue-700 hover:border-blue-700 disabled:opacity-30 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:border-gray-200 disabled:text-gray-400 transition-all shadow-sm"
        >
          <span>Next Page</span>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

/* ── User Detail Modal ─────────────────────────────────── */
function UserDetailModal({
  user,
  open,
  onClose,
  onUpdated,
}: {
  user: AdminUser | null;
  open: boolean;
  onClose: () => void;
  onUpdated?: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [status, setStatus] = useState<number>(1);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || "");
      setLastName(user.last_name || "");
      setEmail(user.email || "");
      setMobile(user.mobile || "");
      setStatus(user.Status ?? 1);
      setIsEditing(false);
    }
  }, [user]);

  if (!user) return null;
  const cfg = ROLE_CONFIG[user.role];
  const Icon = cfg.icon;
  const fullName = [user.first_name, user.middle_name, user.last_name].filter(Boolean).join(" ");
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const endpointMap: Record<UserRole, string> = {
        farmer: "/api/farmer",
        owner: "/api/owner",
        agent: "/api/agent",
        dealer: "/api/dealer",
        operator: "/api/operator",
        mechanic: "/api/mechanic",
        admin: "/api/admin/users",
      };
      const endpoint = endpointMap[user.role] || `/api/${user.role}`;

      await axios.patch(
        endpoint,
        {
          id: user.id,
          user_id: user.user_id || user.id,
          role: user.role,
          first_name: firstName,
          last_name: lastName,
          email,
          mobile,
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
      setIsEditing(false);
      onUpdated?.();
      onClose();
    } catch (err: any) {
      console.error(`Failed to update ${user.role}:`, err);
      alert(err?.response?.data?.message || `Failed to update ${user.role}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-white w-[95vw] max-w-[520px] max-h-[92vh] overflow-hidden p-0 rounded-2xl border-0 shadow-2xl">
        {/* Header */}
        <div className={`bg-gradient-to-br ${cfg.gradient} p-6 relative overflow-hidden`}>
          <div className="absolute inset-0 bg-black/10" />
          <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center rounded-xl bg-white/20 hover:bg-white/30 text-white transition-all"
          >
            <X size={16} />
          </button>
          <div className="relative z-10 flex items-center gap-4">
            <Avatar user={user} size={72} role={user.role} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide bg-white/25 text-white border border-white/30 flex items-center gap-1">
                  <Icon size={10} />
                  {cfg.label}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                    user.emailVerified
                      ? "bg-emerald-500/30 text-white border border-emerald-400/40"
                      : "bg-amber-500/30 text-white border border-amber-400/40"
                  }`}
                >
                  {user.emailVerified ? "● Verified" : "○ Pending"}
                </span>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white text-gray-900 hover:bg-gray-100 shadow-sm transition-all ml-auto"
                  >
                    Edit {cfg.label}
                  </button>
                )}
              </div>
              <h2 className="text-xl font-bold text-white leading-tight truncate">{fullName}</h2>
              <p className="text-white/75 text-xs mt-0.5 truncate">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto max-h-[calc(92vh-180px)]" style={{ scrollbarWidth: "none" }}>
          {isEditing ? (
            <form onSubmit={handleSave} className="space-y-3.5">
              <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3 text-xs text-blue-800">
                <p className="font-semibold">Editing Owner Profile (FastAPI Live Sync)</p>
                <p className="text-[11px] text-blue-600 mt-0.5">Changes will be updated in FastAPI and PostgreSQL database immediately.</p>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider block mb-1">First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="w-full text-xs font-medium px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-blue-500 bg-gray-50/50"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider block mb-1">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="w-full text-xs font-medium px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-blue-500 bg-gray-50/50"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider block mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full text-xs font-medium px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-blue-500 bg-gray-50/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider block mb-1">Mobile</label>
                  <input
                    type="text"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="w-full text-xs font-medium px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-blue-500 bg-gray-50/50"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider block mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(Number(e.target.value))}
                    className="w-full text-xs font-semibold px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-blue-500 bg-gray-50/50"
                  >
                    <option value={1}>Active</option>
                    <option value={0}>Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  disabled={saving}
                  className="px-3.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm"
                >
                  {saving ? "Saving to FastAPI..." : "Save to FastAPI"}
                </button>
              </div>
            </form>
          ) : (
            <>
              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { label: "Status", value: user.Status === 1 ? "Active" : "Inactive", ok: user.Status === 1 },
                  { label: "Auth Type", value: user.authType, ok: true },
                  { label: "Gender", value: user.gender || "—", ok: true },
                ].map(({ label, value, ok }) => (
                  <div key={label} className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-center">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
                    <p className={`font-bold text-sm ${ok ? "text-gray-800" : "text-red-500"}`}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Mechanic extra info */}
              {user.role === "mechanic" && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl divide-y divide-amber-100">
                  {[
                    {
                      label: "Specialization",
                      value: Array.isArray(user.specialization)
                        ? user.specialization.join(", ") || "—"
                        : user.specialization || "—",
                    },
                    { label: "Experience", value: user.experience_years != null ? `${user.experience_years} years` : "—" },
                    { label: "License #", value: user.license_number || "—" },
                    { label: "Available", value: user.is_available ? "✅ Yes" : "❌ No" },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between items-center px-4 py-2.5">
                      <span className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider">{label}</span>
                      <span className="text-sm font-semibold text-gray-800">{value}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Contact */}
              <div className="bg-gray-50 border border-gray-100 rounded-xl divide-y divide-gray-100">
                {[
                  { icon: Mail, label: "Email", value: user.email },
                  { icon: Phone, label: "Mobile", value: user.mobile ? `${user.country_code} ${user.mobile}` : "—" },
                  { icon: Calendar, label: "Joined", value: fmt(user.createdAt) },
                  { icon: CircleDot, label: "Last Update", value: fmt(user.updatedAt) },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                      <Icon size={13} className="text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
                      <p className="text-sm font-medium text-gray-800 truncate">{value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* ID */}
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-3.5">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">User ID</p>
                <p className="font-mono text-xs text-gray-700 break-all">{user.id}</p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Main Component ────────────────────────────────────── */
const AdminUsersSection = () => {
  const [activeRole, setActiveRole] = useState<UserRole>("farmer");
  const [data, setData] = useState<UsersResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [sortField, setSortField] = useState<"name" | "date" | "status">("date");
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [roleCounts, setRoleCounts] = useState<Partial<Record<UserRole, number>>>({});
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const [perPage, setPerPage] = useState(20);

  // Auth headers
  const getHeaders = useCallback(() => {
    const token = getAuthToken() || "";
    return token
      ? {
          Authorization: `Bearer ${token}`,
          "x-admin-key": token,
          "x-api-key": token,
        }
      : {};
  }, []);

  const fetchUsers = useCallback(
    async (role: UserRole, pg: number, q: string, customPerPage?: number, isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      try {
        const pSize = customPerPage ?? perPage;
        const params = new URLSearchParams({
          role,
          page: String(pg),
          per_page: String(pSize),
          ...(q ? { search: q } : {}),
        });
        const res = await axios.get<UsersResponse>(`/api/admin/users?${params.toString()}`, {
          headers: getHeaders(),
          timeout: 8000,
        });
        setData(res.data);
        // Update role count cache
        setRoleCounts((prev) => ({ ...prev, [role]: res.data.total }));
      } catch (err) {
        console.error("Failed to fetch users:", err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [getHeaders, perPage]
  );

  // Prefetch all role counts on mount
  useEffect(() => {
    const prefetchCounts = async () => {
      for (const role of ALL_ROLES) {
        try {
          const res = await axios.get<UsersResponse>(`/api/admin/users?role=${role}&page=1&per_page=1`, {
            headers: getHeaders(),
            timeout: 5000,
          });
          setRoleCounts((prev) => ({ ...prev, [role]: res.data.total }));
        } catch {}
      }
    };
    prefetchCounts();
  }, [getHeaders]);

  // Fetch on role/page/search/perPage change
  useEffect(() => {
    fetchUsers(activeRole, page, search, perPage);
  }, [activeRole, page, search, perPage, fetchUsers]);

  // Search debounce
  const handleSearchChange = (val: string) => {
    setSearchInput(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(val);
      setPage(1);
    }, 380);
  };

  const handleRoleChange = (role: UserRole) => {
    setActiveRole(role);
    setPage(1);
    setSearch("");
    setSearchInput("");
    setData(null);
  };

  const handleSort = (field: "name" | "date" | "status") => {
    if (sortField === field) setSortAsc((a) => !a);
    else { setSortField(field); setSortAsc(true); }
  };

  // Client-side sort
  const sortedUsers = (data?.users || []).slice().sort((a, b) => {
    let cmp = 0;
    if (sortField === "name") cmp = `${a.first_name}${a.last_name}`.localeCompare(`${b.first_name}${b.last_name}`);
    if (sortField === "date") cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    if (sortField === "status") cmp = b.Status - a.Status;
    return sortAsc ? cmp : -cmp;
  });

  const cfg = ROLE_CONFIG[activeRole];
  const Icon = cfg.icon;

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const SortIcon = ({ field }: { field: "name" | "date" | "status" }) =>
    sortField === field ? (
      sortAsc ? <SortAsc size={13} className="text-gray-600" /> : <SortDesc size={13} className="text-gray-600" />
    ) : (
      <SortAsc size={13} className="text-gray-300" />
    );

  return (
    <div className="mt-4 md:mt-6 space-y-5 px-2 md:px-0">
      {/* ── Role Tabs ─────────────────────────────────────────── */}
      <div className="overflow-x-auto scrollbar-hide -mx-2 px-2">
        <div className="flex gap-2 min-w-max pb-1">
          {ALL_ROLES.map((role) => {
            const c = ROLE_CONFIG[role];
            const TabIcon = c.icon;
            const isActive = activeRole === role;
            const count = roleCounts[role];
            return (
              <button
                key={role}
                onClick={() => handleRoleChange(role)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 border whitespace-nowrap ${
                  isActive
                    ? `bg-gradient-to-br ${c.gradient} text-white border-transparent shadow-md shadow-${role}-200/40`
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <TabIcon size={15} />
                {c.plural}
                {count !== undefined && (
                  <span
                    className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
                      isActive ? "bg-white/25 text-white" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {count > 999 ? `${Math.round(count / 1000)}k+` : count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Header Bar ─────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cfg.gradient} flex items-center justify-center shadow-sm`}>
            <Icon size={18} className="text-white" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900 text-lg leading-none">
              {cfg.plural}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {data ? `${data.total.toLocaleString()} total` : "Loading…"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder={`Search ${cfg.plural.toLowerCase()}…`}
              className="w-full pl-8 pr-8 py-2 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:bg-white transition-all"
            />
            {searchInput && (
              <button
                onClick={() => { setSearchInput(""); setSearch(""); setPage(1); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Top Quick Page Navigator */}
          {data && data.total_pages > 1 && (
            <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-200">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="flex items-center gap-0.5 px-2 py-1 rounded-lg text-xs font-semibold text-gray-700 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                title="Previous Page"
              >
                <ChevronLeft size={13} />
                <span className="hidden md:inline">Prev</span>
              </button>
              <span className="text-xs font-bold text-gray-800 px-1.5 whitespace-nowrap">
                {page} / {data.total_pages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
                disabled={page >= data.total_pages}
                className="flex items-center gap-0.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-30 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-all shadow-xs"
                title="Next Page"
              >
                <span>Next</span>
                <ChevronRight size={13} />
              </button>
            </div>
          )}

          {/* Refresh */}
          <button
            onClick={() => fetchUsers(activeRole, page, search, perPage, true)}
            disabled={refreshing}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-all disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw size={15} className={`text-gray-600 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* ── Table ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="hidden md:grid grid-cols-[2.5fr_2fr_1.2fr_1.2fr_1.4fr_1fr] gap-3 px-5 py-3.5 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <button className="flex items-center gap-1.5 hover:text-gray-800 transition-colors text-left" onClick={() => handleSort("name")}>
            User <SortIcon field="name" />
          </button>
          <span>Contact</span>
          <button className="flex items-center gap-1.5 hover:text-gray-800 transition-colors" onClick={() => handleSort("status")}>
            Status <SortIcon field="status" />
          </button>
          <span>Auth</span>
          <button className="flex items-center gap-1.5 hover:text-gray-800 transition-colors" onClick={() => handleSort("date")}>
            Joined <SortIcon field="date" />
          </button>
          <span>Details</span>
        </div>

        {/* Rows */}
        <div className="divide-y divide-gray-50">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="px-5 py-3.5 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gray-100 flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 bg-gray-100 rounded-md w-32" />
                    <div className="h-3 bg-gray-100 rounded-md w-48" />
                  </div>
                  <div className="h-6 w-16 bg-gray-100 rounded-full" />
                </div>
              </div>
            ))
          ) : sortedUsers.length === 0 ? (
            <div className="py-20 text-center">
              <div className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br ${cfg.gradient} opacity-20 flex items-center justify-center mb-4`}>
                <Icon size={32} className="text-white" />
              </div>
              <p className="text-gray-500 font-medium">No {cfg.plural.toLowerCase()} found</p>
              {search && (
                <p className="text-gray-400 text-sm mt-1">
                  Try adjusting your search "{search}"
                </p>
              )}
            </div>
          ) : (
            sortedUsers.map((user) => {
              const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ");
              const isActive = user.Status === 1;
              return (
                <div
                  key={user.id}
                  className="group hover:bg-blue-50/30 transition-all duration-150 cursor-pointer"
                  onClick={() => { setSelectedUser(user); setModalOpen(true); }}
                >
                  {/* Mobile Card */}
                  <div className="md:hidden flex items-center gap-3 px-4 py-3">
                    <Avatar user={user} size={40} role={activeRole} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 text-sm truncate">{fullName}</p>
                        {user.emailVerified ? (
                          <BadgeCheck size={14} className="text-emerald-500 flex-shrink-0" />
                        ) : (
                          <BadgeX size={14} className="text-gray-400 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <div className="flex-shrink-0 flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 text-[11px] font-semibold rounded-full border ${
                          isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-100 text-gray-500 border-gray-200"
                        }`}
                      >
                        {isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>

                  {/* Desktop Row */}
                  <div className="hidden md:grid grid-cols-[2.5fr_2fr_1.2fr_1.2fr_1.4fr_1fr] gap-3 px-5 py-3.5 items-center">
                    {/* User */}
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar user={user} size={36} role={activeRole} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-semibold text-gray-900 text-sm truncate">{fullName}</p>
                          {user.emailVerified ? (
                            <BadgeCheck size={13} className="text-emerald-500 flex-shrink-0" />
                          ) : (
                            <BadgeX size={13} className="text-gray-400 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500 truncate">{user.gender}</p>
                      </div>
                    </div>

                    {/* Contact */}
                    <div className="min-w-0">
                      <p className="text-sm text-gray-700 truncate">{user.email}</p>
                      <p className="text-xs text-gray-400">{user.mobile ? `${user.country_code} ${user.mobile}` : "No phone"}</p>
                    </div>

                    {/* Status */}
                    <div>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full border ${
                          isActive
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-gray-100 text-gray-500 border-gray-200"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-500 animate-pulse" : "bg-gray-400"}`} />
                        {isActive ? "Active" : "Inactive"}
                      </span>
                    </div>

                    {/* Auth */}
                    <div>
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg border ${cfg.badge}`}>
                        {user.authType}
                      </span>
                    </div>

                    {/* Joined */}
                    <p className="text-sm text-gray-600">{fmt(user.createdAt)}</p>

                    {/* View */}
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedUser(user); setModalOpen(true); }}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${cfg.bg} ${cfg.color} hover:opacity-80 border border-transparent hover:border-current/20`}
                    >
                      View
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {data && data.total_pages > 1 && (
          <div className="px-5 pb-4">
            <Pagination
              page={data.page}
              totalPages={data.total_pages}
              total={data.total}
              perPage={perPage}
              onPage={(p) => setPage(p)}
              onPerPageChange={(size) => {
                setPerPage(size);
                setPage(1);
              }}
            />
          </div>
        )}
      </div>

      {/* ── Detail Modal ────────────────────────────────────────── */}
      <UserDetailModal
        user={selectedUser}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onUpdated={() => fetchUsers(activeRole, page, search, perPage, true)}
      />
    </div>
  );
};

export default AdminUsersSection;
