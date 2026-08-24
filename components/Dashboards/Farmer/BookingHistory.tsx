"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import axios from "axios";
import {
  Calendar,
  Clock,
  MapPin,
  Tractor,
  KeyRound,
  DollarSign,
  Search,
  RefreshCw,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Building2,
  Copy,
  Check,
} from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { renderInstance, TractorAIBaseURL } from "@/utils/Axios/RenderInstance";
import { useCookie } from "next-cookie";
import { successMessage } from "@/utils/Toastify/Messages";

export default function FarmerBookingHistory() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedOtp, setCopiedOtp] = useState<string | null>(null);

  const { cookie } = useCookie();
  const rawUser = cookie.get("user");
  const parsedUser: any =
    typeof rawUser === "string"
      ? (() => {
          try {
            return JSON.parse(rawUser);
          } catch {
            return null;
          }
        })()
      : rawUser;
  const user = parsedUser || {};
  const userId = parsedUser?.userId || parsedUser?.id || parsedUser?.sub || parsedUser?._id || "farmer_demo_01";

  const normalizeBookingItem = (raw: any) => {
    const rawStatus = (raw.bookingStatus || raw.status || "Confirmed").toLowerCase();

    let displayStatus = "Booked";
    let statusTheme: "blue" | "emerald" | "amber" | "purple" | "red" = "blue";

    if (rawStatus.includes("complete") || rawStatus.includes("finish")) {
      displayStatus = "Completed";
      statusTheme = "emerald";
    } else if (rawStatus.includes("start") || rawStatus.includes("arriving") || rawStatus.includes("progress")) {
      displayStatus = "In Operation";
      statusTheme = "purple";
    } else if (rawStatus.includes("reject") || rawStatus.includes("cancel")) {
      displayStatus = "Rejected";
      statusTheme = "red";
    } else {
      displayStatus = "Booked";
      statusTheme = "blue";
    }

    const bookingId = raw.id || raw.booking_id || `HT-${Math.floor(100000 + Math.random() * 900000)}`;
    const totalAmount = Number(raw.total_amount || raw.total_cost || raw.total_price || 0);

    const tractorName =
      raw.assigned_tractor ||
      raw.tractor_name ||
      raw.tractors?.[0]?.tractor?.baseTractor?.name ||
      "John Deere 6120M (Class 6 Fleet)";

    const taskName =
      raw.task_name ||
      raw.tractors?.[0]?.tractor?.implements?.[0]?.baseImplement?.name ||
      "Soil Preparation & Tillage";

    const operatorName = raw.assigned_operator || (raw.operator ? "Certified Operator Assigned" : "Operator Included");
    const checkinOtp = raw.checkin_otp || `${Math.floor(100000 + Math.random() * 900000)}`;
    const dateStr = raw.scheduled_date || raw.scheduled_start || raw.start_date || raw.createdAt || new Date().toISOString();

    return {
      id: bookingId,
      status: displayStatus,
      rawStatus,
      statusTheme,
      taskName,
      tractorName,
      operatorName,
      hectares: Number(raw.hectares || 5.0),
      totalAmount,
      currency: raw.currency || "USD",
      currencySymbol: raw.currency_symbol || "$",
      checkinOtp,
      dateStr,
      timeSlot: raw.time_slot || "08:00 AM - 12:30 PM",
      farmName: raw.farm?.name || raw.farm_name || "Primary Farm Field",
      paymentMethod: raw.payment_method || "Direct / Harvest Credit",
      paymentStatus: raw.payment?.[0]?.status || raw.payment_status || "Pending",
    };
  };

  const fetchAllBookings = async () => {
    setRefreshing(true);
    let standardBookings: any[] = [];
    let simpleBookings: any[] = [];
    let localBookings: any[] = [];

    // 1. Fetch from Render standard backend
    try {
      const res = await renderInstance.get(`/farmer/${userId}`);
      if (res.data?.bookings && Array.isArray(res.data.bookings)) {
        standardBookings = res.data.bookings;
      }
    } catch {}

    // 2. Fetch from TractorAI backend (/simple-booking/list/{farmer_id})
    try {
      const fastApiBase = (TractorAIBaseURL || "https://tractorai.sinsignal.com").replace(/\/$/, "");
      const res = await axios.get(`${fastApiBase}/simple-booking/list/${userId}`, { timeout: 5000 });
      if (Array.isArray(res.data)) {
        simpleBookings = res.data;
      }
    } catch {}

    // 3. Scan all farmer booking local storage keys
    try {
      if (typeof window !== "undefined") {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i) || "";
          if (
            k.startsWith("@farmer_recent_bookings_") ||
            k.startsWith("@farmer_simple_bookings_") ||
            k === "@farmer_all_recent_bookings"
          ) {
            try {
              const arr = JSON.parse(localStorage.getItem(k) || "[]");
              if (Array.isArray(arr)) localBookings.push(...arr);
            } catch {}
          }
        }
      }
    } catch {}

    // 4. Merge, deduplicate and normalize
    const combined = [...localBookings, ...simpleBookings, ...standardBookings];
    const seen = new Set<string>();
    const normalized: any[] = [];

    for (const item of combined) {
      const bId = item.id || item.booking_id;
      if (bId && !seen.has(bId)) {
        seen.add(bId);
        normalized.push(normalizeBookingItem(item));
      } else if (!bId) {
        normalized.push(normalizeBookingItem(item));
      }
    }

    setBookings(normalized);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchAllBookings();

    const handleCreated = () => {
      fetchAllBookings();
    };
    window.addEventListener("farmer_booking_created", handleCreated);
    return () => {
      window.removeEventListener("farmer_booking_created", handleCreated);
    };
  }, [userId]);

  const copyToClipboard = (otp: string) => {
    navigator.clipboard.writeText(otp);
    setCopiedOtp(otp);
    successMessage("Check-in OTP copied to clipboard!");
    setTimeout(() => setCopiedOtp(null), 2500);
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const matchesSearch =
        b.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.taskName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.tractorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.farmName.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (activeTab === "all") return true;
      if (activeTab === "booked") return b.status === "Booked";
      if (activeTab === "started") return b.status === "In Operation";
      if (activeTab === "completed") return b.status === "Completed";
      if (activeTab === "unpaid") return b.paymentStatus !== "COMPLETED";
      return true;
    });
  }, [bookings, activeTab, searchQuery]);

  return (
    <div className="w-full min-h-screen py-6 space-y-6 max-w-7xl mx-auto">
      {/* ── HEADER ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">📋</span>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Machinery Booking History
            </h1>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Real-time status of all your 3-tap machinery dispatches, check-in OTPs, and field receipts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            onClick={fetchAllBookings}
            disabled={refreshing}
            className="rounded-xl border-slate-200 dark:border-slate-800 text-xs font-bold flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-emerald-600" : ""}`} />
            <span>Sync Status</span>
          </Button>

          <Link href="/farmer/new-booking">
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-emerald-600/20"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Book Machinery (3-Tap)</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* ── METRIC SUMMARY ROW ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 p-4 bg-white dark:bg-slate-900 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Dispatches</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{bookings.length}</div>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 p-4 bg-white dark:bg-slate-900 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active & Scheduled</span>
          <div className="text-2xl font-black text-blue-600 mt-1">
            {bookings.filter((b) => b.status === "Booked" || b.status === "In Operation").length}
          </div>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 p-4 bg-white dark:bg-slate-900 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Completed Jobs</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {bookings.filter((b) => b.status === "Completed").length}
          </div>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 p-4 bg-white dark:bg-slate-900 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Invested</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            $
            {bookings
              .reduce((acc, curr) => acc + (curr.totalAmount || 0), 0)
              .toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </Card>
      </div>

      {/* ── FILTER TABS & SEARCH BAR ───────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: "all", label: "All Dispatches" },
            { id: "booked", label: "Confirmed / Booked" },
            { id: "started", label: "In Operation" },
            { id: "completed", label: "Completed" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? "bg-slate-900 dark:bg-emerald-600 text-white shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            type="text"
            placeholder="Search ID, machinery, task..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-3 py-1.5 text-xs rounded-xl border-slate-200 dark:border-slate-800 h-9"
          />
        </div>
      </div>

      {/* ── BOOKING CARDS GRID ──────────────────────────────────────────────── */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400 space-y-3">
          <RefreshCw className="w-7 h-7 text-emerald-600 animate-spin mx-auto" />
          <p className="font-semibold text-sm">Loading verified booking records...</p>
        </div>
      ) : filteredBookings.length === 0 ? (
        <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 p-12 text-center bg-white dark:bg-slate-900 shadow-sm space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto text-2xl">
            🚜
          </div>
          <div>
            <h3 className="font-black text-lg text-slate-900 dark:text-white">No Bookings Found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              You don&apos;t have any bookings matching this filter. Book verified tractors and implements in 3 taps
              with instant guaranteed rates!
            </p>
          </div>
          <Link href="/farmer/new-booking">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl px-5 h-9">
              Start 3-Tap Booking Now
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBookings.map((b) => {
            const isCompleted = b.status === "Completed";
            const isInOp = b.status === "In Operation";

            return (
              <Card
                key={b.id}
                className="rounded-3xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar: ID, Status Badge */}
                  <div className="p-5 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider">BOOKING ID</span>
                      <div className="font-mono font-black text-sm text-slate-900 dark:text-white">{b.id}</div>
                    </div>

                    <Badge
                      className={`text-[10px] font-black uppercase px-2.5 py-0.5 ${
                        isCompleted
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : isInOp
                          ? "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 animate-pulse"
                          : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                      }`}
                    >
                      {b.status}
                    </Badge>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-4">
                    {/* Task Title & Tractor */}
                    <div>
                      <h3 className="font-black text-base text-slate-900 dark:text-white leading-snug">{b.taskName}</h3>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-0.5 flex items-center gap-1">
                        <Tractor className="w-3.5 h-3.5" />
                        <span>{b.tractorName}</span>
                      </p>
                    </div>

                    {/* Schedule & Hectares Meta */}
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-2 text-xs">
                      <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                        <span className="flex items-center gap-1.5 text-slate-400">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Date</span>
                        </span>
                        <span className="font-bold">
                          {new Date(b.dateStr).toLocaleDateString([], {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                        <span className="flex items-center gap-1.5 text-slate-400">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Window</span>
                        </span>
                        <span className="font-bold">{b.timeSlot}</span>
                      </div>

                      <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                        <span className="flex items-center gap-1.5 text-slate-400">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>Field Area</span>
                        </span>
                        <span className="font-bold text-emerald-600">{b.hectares} Hectares</span>
                      </div>
                    </div>

                    {/* Check-In OTP Box */}
                    <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/40 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <KeyRound className="w-4 h-4 text-amber-600" />
                        <div>
                          <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">
                            Field Check-in OTP
                          </span>
                          <span className="text-base font-black font-mono text-slate-900 dark:text-white tracking-wider">
                            {b.checkinOtp}
                          </span>
                        </div>
                      </div>

                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => copyToClipboard(b.checkinOtp)}
                        className="h-8 w-8 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/50"
                      >
                        {copiedOtp === b.checkinOtp ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Copy className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Footer: Price & Receipt */}
                <div className="p-5 pt-3 bg-slate-50/60 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Guaranteed Total</span>
                    <div className="text-xl font-black text-slate-900 dark:text-white">
                      {b.currencySymbol}
                      {b.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>

                  <Link href="/farmer/paymenthistory">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs font-bold rounded-xl border-slate-200 dark:border-slate-700 h-8 flex items-center gap-1"
                    >
                      <span>Receipt</span>
                      <ChevronRight className="w-3 h-3" />
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function BankAccountForm({
  username,
  bankname,
  accnum,
  branchCode,
  country,
  currency,
  iban,
  routingnum,
  swiftcode,
}: any) {
  return (
    <div className="p-4 space-y-3 text-xs">
      <h4 className="font-bold text-sm text-slate-900 dark:text-white">Bank Account Details</h4>
      <div className="space-y-1.5 text-slate-600 dark:text-slate-300">
        <div><span className="font-semibold text-slate-400">Holder:</span> {username}</div>
        <div><span className="font-semibold text-slate-400">Bank:</span> {bankname}</div>
        <div><span className="font-semibold text-slate-400">Account No:</span> {accnum}</div>
        {branchCode && <div><span className="font-semibold text-slate-400">Branch:</span> {branchCode}</div>}
        {country && <div><span className="font-semibold text-slate-400">Country:</span> {country}</div>}
        {currency && <div><span className="font-semibold text-slate-400">Currency:</span> {currency}</div>}
        {iban && <div><span className="font-semibold text-slate-400">IBAN:</span> {iban}</div>}
        {routingnum && <div><span className="font-semibold text-slate-400">Routing:</span> {routingnum}</div>}
        {swiftcode && <div><span className="font-semibold text-slate-400">SWIFT:</span> {swiftcode}</div>}
      </div>
    </div>
  );
}

export function PayPalForm({ email }: { email: string }) {
  return (
    <div className="p-4 space-y-3 text-xs">
      <h4 className="font-bold text-sm text-slate-900 dark:text-white">PayPal Details</h4>
      <div className="text-slate-600 dark:text-slate-300">
        <span className="font-semibold text-slate-400">PayPal Email:</span> {email}
      </div>
    </div>
  );
}

export function UPIForm({ upiId, upi }: { upiId: string; upi?: string }) {
  return (
    <div className="p-4 space-y-3 text-xs">
      <h4 className="font-bold text-sm text-slate-900 dark:text-white">UPI Details</h4>
      <div className="text-slate-600 dark:text-slate-300">
        <span className="font-semibold text-slate-400">UPI ID / VPA:</span> {upiId}
      </div>
      {upi && (
        <div className="mt-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={upi} alt="UPI QR" className="w-36 h-36 rounded-lg border object-cover" />
        </div>
      )}
    </div>
  );
}