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
import {
  Wrench,
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
  Award,
  Clock,
  Sparkles,
  Tool,
} from "lucide-react";

export interface MechanicItem {
  id: string;
  user_id: string;
  role_id: string;
  dealer_id: string | null;
  specialization: string[];
  experience_years: number;
  license_number: string;
  is_available: boolean;
  current_lat: number | null;
  current_lng: number | null;
  status: number;
  Status: number;
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

/* ── Mechanic Detail & Edit Modal ─────────────────────────────── */
function MechanicDetailModal({
  mechanic,
  open,
  onClose,
  onUpdated,
}: {
  mechanic: MechanicItem | null;
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
  const [experienceYears, setExperienceYears] = useState<number>(0);
  const [licenseNumber, setLicenseNumber] = useState("");
  const [specializationInput, setSpecializationInput] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (mechanic) {
      setFirstName(mechanic.user?.first_name || "");
      setMiddleName(mechanic.user?.middle_name || "");
      setLastName(mechanic.user?.last_name || "");
      setEmail(mechanic.user?.email || "");
      setMobile(mechanic.user?.mobile || "");
      setGender(mechanic.user?.gender || "male");
      setStatus(Number(mechanic.status ?? mechanic.Status ?? 1));
      setExperienceYears(mechanic.experience_years || 0);
      setLicenseNumber(mechanic.license_number || "");
      setSpecializationInput(
        Array.isArray(mechanic.specialization)
          ? mechanic.specialization.join(", ")
          : String(mechanic.specialization || "")
      );
      setIsAvailable(mechanic.is_available ?? true);
      setIsEditing(false);
    }
  }, [mechanic]);

  if (!mechanic) return null;

  const fullName =
    [mechanic.user?.first_name, mechanic.user?.middle_name, mechanic.user?.last_name]
      .filter(Boolean)
      .join(" ") || "Mechanic";

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = getAuthToken() || "";
      const specList = specializationInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await axios.patch(
        "/api/mechanic",
        {
          id: mechanic.id,
          user_id: mechanic.user_id || mechanic.id,
          first_name: firstName,
          middle_name: middleName,
          last_name: lastName,
          email,
          mobile,
          gender,
          status,
          experience_years: Number(experienceYears),
          license_number: licenseNumber,
          specialization: specList,
          is_available: isAvailable,
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

      if (res.data.success || res.status === 200) {
        successMessage("Mechanic updated successfully");
        setIsEditing(false);
        const updatedItem = {
          ...mechanic,
          status,
          Status: status,
          experience_years: Number(experienceYears),
          license_number: licenseNumber,
          specialization: specList,
          is_available: isAvailable,
          user: {
            ...mechanic.user,
            first_name: firstName,
            middle_name: middleName,
            last_name: lastName,
            email,
            mobile,
            gender,
          },
        };
        onUpdated?.(updatedItem);
        onClose();
      } else {
        errorMessage(res.data.message || "Failed to update mechanic");
      }
    } catch (err: any) {
      console.error("Error updating mechanic:", err);
      errorMessage(err.response?.data?.message || err.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-white w-[95vw] max-w-[560px] max-h-[92vh] overflow-hidden p-0 rounded-3xl border-0 shadow-2xl flex flex-col">
        {/* Header Gradient */}
        <div className="bg-gradient-to-br from-rose-600 via-rose-700 to-amber-700 p-6 relative overflow-hidden flex-shrink-0 text-white">
          <div className="absolute inset-0 bg-black/15 pointer-events-none" />
          <div className="absolute -top-10 -right-10 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute right-6 bottom-3 opacity-10 pointer-events-none">
            <Wrench size={120} />
          </div>

          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center rounded-xl bg-white/20 hover:bg-white/30 text-white transition-all"
          >
            <X size={16} />
          </button>

          <div className="relative z-10 flex items-center gap-4">
            <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-white/20 border-2 border-white/40 flex items-center justify-center text-white font-bold text-xl flex-shrink-0 shadow-md">
              {isValidImageUrl(mechanic.user?.image) ? (
                <Image
                  src={mechanic.user?.image!}
                  alt={fullName}
                  fill
                  sizes="64px"
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <span>{(mechanic.user?.first_name?.[0] || "M").toUpperCase()}</span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide bg-white/25 text-white border border-white/30 flex items-center gap-1">
                  <Wrench size={10} />
                  Certified Mechanic
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    mechanic.user?.emailVerified
                      ? "bg-emerald-500/30 text-white border border-emerald-400/40"
                      : "bg-amber-500/30 text-white border border-amber-400/40"
                  }`}
                >
                  {mechanic.user?.emailVerified ? "● Verified" : "○ Unverified"}
                </span>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white text-rose-900 hover:bg-rose-50 shadow-sm transition-all ml-auto flex items-center gap-1"
                  >
                    <Edit size={10} />
                    Edit Profile
                  </button>
                )}
              </div>
              <h2 className="text-xl font-black text-white truncate">{fullName}</h2>
              <p className="text-xs text-rose-100/80 font-mono truncate">ID: {mechanic.id}</p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {isEditing ? (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider block mb-1">
                    First Name
                  </Label>
                  <Input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="text-xs font-medium"
                  />
                </div>
                <div>
                  <Label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider block mb-1">
                    Last Name
                  </Label>
                  <Input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="text-xs font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider block mb-1">
                    Email Address
                  </Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="text-xs font-medium"
                  />
                </div>
                <div>
                  <Label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider block mb-1">
                    Mobile Phone
                  </Label>
                  <Input
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="text-xs font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider block mb-1">
                    Status
                  </Label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(Number(e.target.value))}
                    className="w-full text-xs font-semibold px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-rose-500 bg-gray-50/50"
                  >
                    <option value={1}>Active</option>
                    <option value={0}>Inactive</option>
                  </select>
                </div>
                <div>
                  <Label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider block mb-1">
                    Experience (Yrs)
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    max="50"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(Number(e.target.value))}
                    className="text-xs font-medium"
                  />
                </div>
                <div>
                  <Label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider block mb-1">
                    Available
                  </Label>
                  <select
                    value={isAvailable ? "1" : "0"}
                    onChange={(e) => setIsAvailable(e.target.value === "1")}
                    className="w-full text-xs font-semibold px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-rose-500 bg-gray-50/50"
                  >
                    <option value="1">Available (On-Call)</option>
                    <option value="0">Busy / Off</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider block mb-1">
                    License Number
                  </Label>
                  <Input
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    placeholder="e.g. MEC-2025-001"
                    className="text-xs font-medium"
                  />
                </div>
                <div>
                  <Label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider block mb-1">
                    Gender
                  </Label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-rose-500 bg-gray-50/50"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <Label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider block mb-1">
                  Specialization Skills (comma-separated)
                </Label>
                <Input
                  value={specializationInput}
                  onChange={(e) => setSpecializationInput(e.target.value)}
                  placeholder="Engine, Hydraulics, Electrical, Transmission"
                  className="text-xs font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <Button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  disabled={saving}
                  variant="outline"
                  className="text-xs h-9 rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold h-9 rounded-xl shadow-md transition-all"
                >
                  {saving ? "Saving to FastAPI..." : "Save to FastAPI"}
                </Button>
              </div>
            </form>
          ) : (
            <>
              {/* Quick 4-Grid Status Overview */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  {
                    label: "Status",
                    value: (mechanic.status ?? mechanic.Status) === 1 ? "Active" : "Inactive",
                    color:
                      (mechanic.status ?? mechanic.Status) === 1 ? "text-emerald-700 bg-emerald-50 border-emerald-100" : "text-rose-700 bg-rose-50 border-rose-100",
                  },
                  {
                    label: "Experience",
                    value: `${mechanic.experience_years || 0} Years`,
                    color: "text-amber-700 bg-amber-50 border-amber-100",
                  },
                  {
                    label: "License",
                    value: mechanic.license_number || "Pending",
                    color: "text-blue-700 bg-blue-50 border-blue-100",
                  },
                  {
                    label: "Field Readiness",
                    value: mechanic.is_available ? "Available" : "Assigned",
                    color: mechanic.is_available
                      ? "text-teal-700 bg-teal-50 border-teal-100"
                      : "text-slate-700 bg-slate-50 border-slate-100",
                  },
                ].map((st, i) => (
                  <div key={i} className={`p-3 rounded-2xl border text-center ${st.color}`}>
                    <p className="text-[10px] font-bold uppercase tracking-wider opacity-70 mb-0.5">{st.label}</p>
                    <p className="text-xs font-black truncate">{st.value}</p>
                  </div>
                ))}
              </div>

              {/* Specialization Pills */}
              <div className="bg-rose-50/60 border border-rose-100 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-rose-900 uppercase tracking-wider">
                  <Award size={14} className="text-rose-600" />
                  <span>Technical Specializations</span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {mechanic.specialization && mechanic.specialization.length > 0 ? (
                    mechanic.specialization.map((spec, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-xl text-xs font-bold bg-white text-rose-700 border border-rose-200 shadow-xs flex items-center gap-1"
                      >
                        <Sparkles size={11} className="text-rose-500" />
                        {spec}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-500 italic">General Agricultural Machinery Repair</span>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-gray-50 border border-gray-100 rounded-2xl divide-y divide-gray-100 text-xs">
                <div className="p-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-500 flex-shrink-0 shadow-xs">
                    <Mail size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase">Email Address</p>
                    <p className="font-semibold text-gray-900 truncate">{mechanic.user?.email || "No email"}</p>
                  </div>
                </div>

                <div className="p-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-500 flex-shrink-0 shadow-xs">
                    <Phone size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase">Mobile Phone</p>
                    <p className="font-semibold text-gray-900 truncate">
                      {mechanic.user?.mobile
                        ? `${mechanic.user?.country_code || "+91"} ${mechanic.user?.mobile}`
                        : "No mobile number"}
                    </p>
                  </div>
                </div>

                <div className="p-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-500 flex-shrink-0 shadow-xs">
                    <Calendar size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase">Registered Date</p>
                    <p className="font-semibold text-gray-900 truncate">
                      {mechanic.createdAt
                        ? new Date(mechanic.createdAt).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Technical System Reference */}
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-3.5 text-xs flex justify-between items-center">
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Dealer ID</span>
                <span className="font-mono font-medium text-gray-700 truncate max-w-[240px]">
                  {mechanic.dealer_id || "Direct Holatractor Network"}
                </span>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Register New Mechanic Modal ──────────────────────────────── */
function MechanicRegisterModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [experienceYears, setExperienceYears] = useState(3);
  const [specialization, setSpecialization] = useState("Engine, Hydraulics");
  const [creating, setCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const specList = specialization
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await axios.post("/api/mechanic", {
        first_name: firstName,
        last_name: lastName,
        email,
        mobile,
        license_number: licenseNumber,
        experience_years: Number(experienceYears),
        specialization: specList,
      });

      if (res.status === 201 || res.data?.id) {
        successMessage("New mechanic successfully registered!");
        onCreated();
        onClose();
        setFirstName("");
        setLastName("");
        setEmail("");
        setMobile("");
        setLicenseNumber("");
      } else {
        errorMessage(res.data?.message || "Failed to register mechanic");
      }
    } catch (err: any) {
      console.error("Error creating mechanic:", err);
      errorMessage(err?.response?.data?.message || "Registration failed");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-white w-[95vw] max-w-[500px] p-0 rounded-3xl overflow-hidden border-0 shadow-2xl">
        <div className="bg-gradient-to-r from-rose-600 via-rose-700 to-amber-700 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center rounded-xl bg-white/20 hover:bg-white/30 text-white transition-all"
          >
            <X size={16} />
          </button>
          <div className="flex items-center gap-2 mb-1">
            <Wrench size={16} />
            <span className="text-xs font-bold uppercase tracking-wider text-rose-100">Technician Onboarding</span>
          </div>
          <h2 className="text-xl font-black">Register New Mechanic</h2>
          <p className="text-xs text-rose-100/80 mt-0.5">
            Add a certified field technician to the HolaTractor maintenance network.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider block mb-1">
                First Name
              </Label>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="e.g. Carlos"
                required
              />
            </div>
            <div>
              <Label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider block mb-1">
                Last Name
              </Label>
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="e.g. Ramirez"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider block mb-1">
                Email Address
              </Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="carlos@holatractor.com"
                required
              />
            </div>
            <div>
              <Label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider block mb-1">
                Mobile Number
              </Label>
              <Input
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="9876543210"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider block mb-1">
                License / Cert #
              </Label>
              <Input
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                placeholder="MEC-2025-010"
              />
            </div>
            <div>
              <Label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider block mb-1">
                Experience (Years)
              </Label>
              <Input
                type="number"
                min="0"
                value={experienceYears}
                onChange={(e) => setExperienceYears(Number(e.target.value))}
              />
            </div>
          </div>

          <div>
            <Label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider block mb-1">
              Specializations (comma separated)
            </Label>
            <Input
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              placeholder="Engine, Hydraulics, Electrical, Transmission"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
            <Button
              type="button"
              onClick={onClose}
              disabled={creating}
              variant="outline"
              className="text-xs h-9 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={creating}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold h-9 rounded-xl shadow-md transition-all"
            >
              {creating ? "Registering..." : "Create Mechanic"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ── Main Mechanic Section ───────────────────────────────────── */
const MechanicSection = () => {
  const [allMechanics, setAllMechanics] = useState<MechanicItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [sortBy, setSortBy] = useState<"date" | "name" | "status" | "experience">("date");
  const [sortAsc, setSortAsc] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Modals
  const [selectedMechanic, setSelectedMechanic] = useState<MechanicItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [openRegister, setOpenRegister] = useState(false);

  // Redux language
  const language = useSelector((state: RootState) => state.language?.language);
  const locale = (language || "en") as string;

  const fetchAllMechanics = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await axios.get("/api/mechanic");
      let list: MechanicItem[] = [];

      if (Array.isArray(res.data)) {
        list = res.data;
      } else if (res.data && Array.isArray(res.data.mechanics)) {
        list = res.data.mechanics;
      }

      setAllMechanics(list);
    } catch (err) {
      console.error("Error fetching mechanic list:", err);
      errorMessage("Failed to load mechanics from FastAPI");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleMechanicUpdated = useCallback(
    (updatedItem?: any) => {
      if (updatedItem) {
        setAllMechanics((prev) =>
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
      fetchAllMechanics(true);
    },
    [fetchAllMechanics]
  );

  useEffect(() => {
    fetchAllMechanics();
  }, [fetchAllMechanics]);

  // Stats calculation
  const stats = useMemo(() => {
    const total = allMechanics.length;
    const active = allMechanics.filter((m) => (m.status ?? m.Status) === 1).length;
    const inactive = allMechanics.filter((m) => (m.status ?? m.Status) === 0).length;
    const verified = allMechanics.filter((m) => m.user?.emailVerified || m.license_number).length;
    return { total, active, inactive, verified };
  }, [allMechanics]);

  // Filter & Sort
  const filteredMechanics = useMemo(() => {
    let list = [...allMechanics];

    // Status filter
    if (statusFilter === "active") {
      list = list.filter((m) => (m.status ?? m.Status) === 1);
    } else if (statusFilter === "inactive") {
      list = list.filter((m) => (m.status ?? m.Status) === 0);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((m) => {
        const fullName = `${m.user?.first_name || ""} ${m.user?.middle_name || ""} ${m.user?.last_name || ""}`.toLowerCase();
        const email = (m.user?.email || "").toLowerCase();
        const mobile = (m.user?.mobile || "").toLowerCase();
        const id = (m.id || "").toLowerCase();
        const license = (m.license_number || "").toLowerCase();
        const specs = (m.specialization || []).join(" ").toLowerCase();
        return (
          fullName.includes(q) ||
          email.includes(q) ||
          mobile.includes(q) ||
          id.includes(q) ||
          license.includes(q) ||
          specs.includes(q)
        );
      });
    }

    // Sort
    list.sort((a, b) => {
      if (sortBy === "name") {
        const nameA = `${a.user?.first_name || ""} ${a.user?.last_name || ""}`.toLowerCase();
        const nameB = `${b.user?.first_name || ""} ${b.user?.last_name || ""}`.toLowerCase();
        return sortAsc ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      }
      if (sortBy === "experience") {
        const expA = a.experience_years || 0;
        const expB = b.experience_years || 0;
        return sortAsc ? expA - expB : expB - expA;
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
  }, [allMechanics, statusFilter, searchQuery, sortBy, sortAsc]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredMechanics.length / itemsPerPage));
  const paginatedMechanics = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredMechanics.slice(start, start + itemsPerPage);
  }, [filteredMechanics, currentPage, itemsPerPage]);

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
      <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-amber-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-rose-800/40">
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
          <Wrench size={320} />
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-400/30 flex items-center gap-1.5">
                <Wrench size={13} />
                FastAPI Direct Integration
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/10 text-slate-200 border border-white/15">
                PostgreSQL Live Sync
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                Certified Field Technicians
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Mechanics Directory & Field Technicians
            </h1>
            <p className="text-rose-100/70 text-sm mt-1 max-w-xl">
              Real-time directory covering {stats.total} certified agricultural technicians, engine specialists, and equipment maintenance personnel.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Refresh */}
            <Button
              onClick={() => fetchAllMechanics(true)}
              disabled={refreshing}
              variant="outline"
              className="bg-white/10 hover:bg-white/20 border-white/20 text-white text-xs font-semibold rounded-xl h-10 px-3.5 backdrop-blur-sm transition-all"
            >
              <RefreshCw size={14} className={`mr-2 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>

            {/* + New Mechanic */}
            <Button
              onClick={() => setOpenRegister(true)}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl h-10 px-4 shadow-lg shadow-rose-600/20 transition-all active:scale-[0.98]"
            >
              <Plus size={16} className="mr-1.5" />
              + New Mechanic
            </Button>
          </div>
        </div>
      </div>

      {/* ── Stat Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Mechanics",
            value: stats.total,
            icon: Wrench,
            color: "text-rose-600",
            bg: "bg-rose-50",
            border: "border-rose-100",
          },
          {
            label: "Active Technicians",
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
            label: "Certified & Verified",
            value: stats.verified,
            icon: ShieldCheck,
            color: "text-amber-600",
            bg: "bg-amber-50",
            border: "border-amber-100",
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
              <div
                className={`w-12 h-12 rounded-xl ${item.bg} ${item.color} flex items-center justify-center flex-shrink-0`}
              >
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
            placeholder="Search mechanics by name, specialization, license, phone, or ID..."
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
                    ? "bg-white text-rose-700 shadow-sm font-bold"
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
              <option value="name">Mechanic Name</option>
              <option value="experience">Experience</option>
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
                className="flex items-center gap-0.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-30 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-all shadow-xs"
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
                <th className="py-3.5 px-5">Mechanic Name & ID</th>
                <th className="py-3.5 px-5">Specialization & Exp</th>
                <th className="py-3.5 px-5">Contact Details</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">License & Avail</th>
                <th className="py-3.5 px-5">Joined Date</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-gray-400">
                    <RefreshCw className="h-8 w-8 text-rose-500 animate-spin mx-auto mb-2" />
                    <p className="text-sm font-semibold">Loading certified mechanics from FastAPI…</p>
                  </td>
                </tr>
              ) : paginatedMechanics.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-gray-400">
                    <Wrench className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-gray-600">No mechanics found</p>
                    <p className="text-xs text-gray-400 mt-0.5">Try adjusting your search or filters</p>
                  </td>
                </tr>
              ) : (
                paginatedMechanics.map((item, idx) => {
                  const globalIdx = (currentPage - 1) * itemsPerPage + idx + 1;
                  const fullName =
                    [item.user?.first_name, item.user?.middle_name, item.user?.last_name]
                      .filter(Boolean)
                      .join(" ") || "Mechanic";
                  const initial = (item.user?.first_name?.[0] || "M").toUpperCase();
                  const itemStatus = Number(item.status ?? item.Status ?? 1);

                  return (
                    <tr
                      key={item.id || idx}
                      onClick={() => {
                        setSelectedMechanic(item);
                        setModalOpen(true);
                      }}
                      className="hover:bg-rose-50/30 transition-colors group cursor-pointer"
                    >
                      <td className="py-3.5 px-5 text-xs text-gray-400 font-semibold">{globalIdx}</td>

                      {/* Mechanic Name & Avatar */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="relative w-9 h-9 rounded-xl overflow-hidden bg-gradient-to-br from-rose-600 to-amber-700 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-sm">
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
                            <p className="font-bold text-gray-900 text-sm truncate group-hover:text-rose-700 transition-colors">
                              {fullName}
                            </p>
                            <p className="text-xs text-gray-400 font-mono truncate">
                              ID: {item.id ? item.id.substring(0, 10) + "…" : "N/A"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Specialization & Experience */}
                      <td className="py-3.5 px-5">
                        <div className="space-y-1">
                          <div className="flex flex-wrap gap-1 max-w-[220px]">
                            {item.specialization && item.specialization.length > 0 ? (
                              item.specialization.map((spec, sIdx) => (
                                <span
                                  key={sIdx}
                                  className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200"
                                >
                                  {spec}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-gray-400 italic">General Technician</span>
                            )}
                          </div>
                          <p className="text-[11px] text-gray-500 font-medium">
                            {item.experience_years ? `${item.experience_years} years exp.` : "Entry level"}
                          </p>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-5">
                        <div className="space-y-0.5 text-xs">
                          <div className="flex items-center gap-1.5 text-gray-700 truncate max-w-[200px]">
                            <Mail size={12} className="text-gray-400 flex-shrink-0" />
                            <span className="truncate">{item.user?.email || "No email"}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-500">
                            <Phone size={12} className="text-gray-400 flex-shrink-0" />
                            <span>
                              {item.user?.mobile
                                ? `${item.user?.country_code || "+91"} ${item.user?.mobile}`
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
                              : "bg-red-50 text-red-600 border-red-200"
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

                      {/* License & Available */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="space-y-0.5">
                          <span className="inline-block px-2 py-0.5 text-[10px] font-mono font-bold bg-gray-100 text-gray-700 rounded-md border border-gray-200">
                            {item.license_number || "NO LIC"}
                          </span>
                          <p className="text-[10px] font-semibold text-emerald-600">
                            {item.is_available ? "● On Call" : "○ Dispatched"}
                          </p>
                        </div>
                      </td>

                      {/* Joined Date */}
                      <td className="py-3.5 px-5 text-xs text-gray-500">
                        {formatDate(item.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-5 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMechanic(item);
                            setModalOpen(true);
                          }}
                          className="h-8 px-2.5 text-xs font-bold text-rose-700 hover:bg-rose-100 rounded-lg"
                        >
                          <Edit size={13} className="mr-1" />
                          View / Edit
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

      {/* ── Mobile Cards ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
        {loading ? (
          <div className="col-span-full py-12 text-center text-gray-400 bg-white rounded-2xl border">
            <RefreshCw className="h-7 w-7 text-rose-500 animate-spin mx-auto mb-2" />
            <p className="text-xs font-semibold">Loading mechanics from FastAPI…</p>
          </div>
        ) : paginatedMechanics.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-400 bg-white rounded-2xl border">
            <Wrench className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-gray-600">No mechanics found</p>
          </div>
        ) : (
          paginatedMechanics.map((item, idx) => {
            const fullName =
              [item.user?.first_name, item.user?.middle_name, item.user?.last_name]
                .filter(Boolean)
                .join(" ") || "Mechanic";
            const initial = (item.user?.first_name?.[0] || "M").toUpperCase();
            const itemStatus = Number(item.status ?? item.Status ?? 1);

            return (
              <div
                key={item.id || idx}
                onClick={() => {
                  setSelectedMechanic(item);
                  setModalOpen(true);
                }}
                className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs hover:shadow-md transition-all space-y-3 cursor-pointer"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-gradient-to-br from-rose-600 to-amber-700 text-white flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-sm">
                      {isValidImageUrl(item.user?.image) ? (
                        <Image
                          src={item.user?.image!}
                          alt={fullName}
                          fill
                          sizes="44px"
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <span>{initial}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 text-sm truncate">{fullName}</p>
                      <p className="text-xs text-gray-400 font-mono truncate">
                        ID: {item.id ? item.id.substring(0, 10) + "…" : "N/A"}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 text-[11px] font-bold rounded-full border flex-shrink-0 ${
                      itemStatus === 1
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-red-50 text-red-600 border-red-200"
                    }`}
                  >
                    {itemStatus === 1 ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1">
                  {item.specialization && item.specialization.length > 0 ? (
                    item.specialization.map((spec, sIdx) => (
                      <span
                        key={sIdx}
                        className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200"
                      >
                        {spec}
                      </span>
                    ))
                  ) : null}
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-gray-50 text-gray-600 border border-gray-200">
                    {item.experience_years || 0} yrs exp
                  </span>
                </div>

                <div className="space-y-1 text-xs pt-2 border-t border-gray-100 text-gray-600">
                  <div className="flex items-center gap-2 truncate">
                    <Mail size={12} className="text-gray-400 flex-shrink-0" />
                    <span className="truncate">{item.user?.email || "No email"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={12} className="text-gray-400 flex-shrink-0" />
                    <span>
                      {item.user?.mobile
                        ? `${item.user?.country_code || "+91"} ${item.user?.mobile}`
                        : "No phone"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] font-mono text-gray-400">
                    Lic: {item.license_number || "None"}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-7 px-2 font-bold text-rose-700 border-rose-200 hover:bg-rose-50 rounded-lg"
                  >
                    View Details
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Bottom Pagination Bar ─────────────────────────────────── */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-gray-500 font-medium">
          Showing{" "}
          <span className="font-bold text-gray-800">
            {filteredMechanics.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}
          </span>{" "}
          to{" "}
          <span className="font-bold text-gray-800">
            {Math.min(currentPage * itemsPerPage, filteredMechanics.length)}
          </span>{" "}
          of <span className="font-bold text-gray-800">{filteredMechanics.length}</span> mechanics
        </p>

        {/* Page buttons */}
        <div className="flex items-center gap-1 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="text-xs font-semibold h-8 px-2.5 rounded-xl border-gray-200"
          >
            <ChevronLeft size={14} className="mr-1" />
            Previous
          </Button>

          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum = i + 1;
            if (totalPages > 5 && currentPage > 3) {
              pageNum = currentPage - 3 + i;
              if (pageNum > totalPages) pageNum = totalPages - (4 - i);
            }
            return (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${
                  currentPage === pageNum
                    ? "bg-rose-600 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {pageNum}
              </button>
            );
          })}

          <Button
            size="sm"
            variant="outline"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="text-xs font-semibold h-8 px-2.5 rounded-xl border-gray-200"
          >
            Next
            <ChevronRight size={14} className="ml-1" />
          </Button>
        </div>
      </div>

      {/* Detail & Edit Modal */}
      <MechanicDetailModal
        mechanic={selectedMechanic}
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedMechanic(null);
        }}
        onUpdated={handleMechanicUpdated}
      />

      {/* Register Modal */}
      <MechanicRegisterModal
        open={openRegister}
        onClose={() => setOpenRegister(false)}
        onCreated={() => fetchAllMechanics(true)}
      />
    </div>
  );
};

export default MechanicSection;
