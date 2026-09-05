"use client";

import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import {
  CreditCard,
  Download,
  Search,
  Filter,
  ArrowUpDown,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  FileText,
  Calendar as CalendarIcon,
  RefreshCw,
  Eye,
  Receipt,
  DollarSign,
  TrendingUp,
  LandPlot,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  ChevronRight,
  Globe,
  MapPin,
  Sparkles,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { useCookie } from "next-cookie";
import { renderInstance, TractorAIBaseURL } from "@/utils/Axios/RenderInstance";
import PaymentDetailsSheet from "./PaymentDetailsSheet";
import Link from "next/link";
import {
  getLiveCurrencyRates,
  BASE_CURRENCY_CONFIGS,
  CurrencyConfig,
} from "@/utils/currency/currencyService";

interface PaymentItem {
  id: string;
  booking_id: string;
  amount: number; // Base USD amount
  status: "COMPLETED" | "FarmerPENDING" | "FarmerCONFIRMED" | "OwnerREJECTED" | string;
  paymentType: string;
  transactionMethod?: string;
  receiver_name?: string;
  createdAt: string;
  booking?: any;
  service_name?: string;
  area?: number;
}

export default function PaymentHistory() {
  const [currencyMap, setCurrencyMap] = useState<Record<string, CurrencyConfig>>(BASE_CURRENCY_CONFIGS);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedCurrencyKey, setSelectedCurrencyKey] = useState<string>("AUTO");
  const [detectedCurrency, setDetectedCurrency] = useState<CurrencyConfig>(BASE_CURRENCY_CONFIGS.USD);

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
  const userId = parsedUser?.userId || parsedUser?.id || parsedUser?.sub || parsedUser?._id || "farmer_demo_01";
  const access_token = cookie.get("access_token");

  // Dynamic live rate fetch from TractorAI engine / API
  useEffect(() => {
    let mounted = true;
    getLiveCurrencyRates().then((liveRates) => {
      if (mounted && liveRates) {
        setCurrencyMap(liveRates);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Geolocation auto-detection (cached & non-blocking)
  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
      const userPhone = rawUser?.phone || rawUser?.mobile || "";
      const userCountryCode = rawUser?.country_code || rawUser?.country || "";

      if (
        tz.includes("Calcutta") ||
        tz.includes("Kolkata") ||
        tz.includes("Colombo") ||
        userCountryCode === "+91" ||
        userCountryCode === "IN" ||
        userPhone.startsWith("+91")
      ) {
        setDetectedCurrency(currencyMap.INR || BASE_CURRENCY_CONFIGS.INR);
      } else if (
        tz.includes("La_Paz") ||
        userCountryCode === "+591" ||
        userCountryCode === "BO" ||
        userPhone.startsWith("+591")
      ) {
        setDetectedCurrency(currencyMap.BOB || BASE_CURRENCY_CONFIGS.BOB);
      } else if (
        tz.includes("Lima") ||
        userCountryCode === "+51" ||
        userCountryCode === "PE" ||
        userPhone.startsWith("+51")
      ) {
        setDetectedCurrency(currencyMap.PEN || BASE_CURRENCY_CONFIGS.PEN);
      } else if (
        tz.includes("Sao_Paulo") ||
        userCountryCode === "+55" ||
        userCountryCode === "BR"
      ) {
        setDetectedCurrency(currencyMap.BRL || BASE_CURRENCY_CONFIGS.BRL);
      } else if (tz.startsWith("Europe/")) {
        setDetectedCurrency(currencyMap.EUR || BASE_CURRENCY_CONFIGS.EUR);
      }
    } catch {}

    if (typeof window !== "undefined" && navigator.geolocation) {
      const cachedGeo = sessionStorage.getItem("@farmer_geo_detected");
      if (!cachedGeo) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            try {
              sessionStorage.setItem("@farmer_geo_detected", "true");
              if (latitude >= 6.0 && latitude <= 38.0 && longitude >= 68.0 && longitude <= 98.0) {
                setDetectedCurrency(currencyMap.INR || BASE_CURRENCY_CONFIGS.INR);
              } else if (latitude >= -23.0 && latitude <= -9.0 && longitude >= -70.0 && longitude <= -57.0) {
                setDetectedCurrency(currencyMap.BOB || BASE_CURRENCY_CONFIGS.BOB);
              } else if (latitude >= -18.5 && latitude <= -0.03 && longitude >= -81.5 && longitude <= -68.5) {
                setDetectedCurrency(currencyMap.PEN || BASE_CURRENCY_CONFIGS.PEN);
              }
            } catch {}
          },
          () => {},
          { timeout: 3000, maximumAge: 600000 }
        );
      }
    }
  }, [currencyMap, rawUser]);

  const activeCurrency = selectedCurrencyKey === "AUTO"
    ? detectedCurrency
    : currencyMap[selectedCurrencyKey] || BASE_CURRENCY_CONFIGS[selectedCurrencyKey] || BASE_CURRENCY_CONFIGS.USD;

  const formatPrice = (usdAmount: number) => {
    const converted = Number(usdAmount || 0) * (activeCurrency?.rate || 1.0);
    return `${activeCurrency.symbol} ${converted.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const mapRawBookingToPayment = (b: any, idx: number): PaymentItem => {
    const isDone = b.bookingStatus === "Completed" || b.status === "Completed";
    const isConfirmed = b.bookingStatus === "Confirmed" || b.status === "Confirmed";
    const isRejected = b.bookingStatus === "Rejected" || b.status === "Rejected";

    let payStatus = "FarmerPENDING";
    if (isDone) payStatus = "COMPLETED";
    else if (isConfirmed) payStatus = "FarmerCONFIRMED";
    else if (isRejected) payStatus = "OwnerREJECTED";

    const inrRate = currencyMap.INR?.rate || 94.0;
    const bobRate = currencyMap.BOB?.rate || 6.91;
    let rawCost = Number(b.total_cost || b.total_amount || 120);
    if (b.currency === "INR" && rawCost > 2000) {
      rawCost = rawCost / inrRate;
    } else if (b.currency === "BOB" && rawCost > 500) {
      rawCost = rawCost / bobRate;
    }

    return {
      id: `PAY-${b.id || b.booking_id ? String(b.id || b.booking_id).slice(-6).toUpperCase() : `00${idx + 1}`}`,
      booking_id: b.id || b.booking_id || `BK-${idx + 100}`,
      amount: rawCost,
      status: payStatus,
      paymentType: b.payment_method || "Credit Card / Direct",
      transactionMethod: b.payment_method || "Direct Dispatch",
      receiver_name: b.store_name || b.store?.name || "Regional Machinery Depot",
      createdAt: b.createdAt || b.start_date || b.scheduled_date || new Date().toISOString(),
      service_name: b.task_name_en || b.task_name || b.service_name || b.operation_type || "Deep Plowing & Soil Prep",
      area: Number(b.hectares || b.area_hectares || b.area || 5),
      booking: {
        ...b,
        tractors: b.tractors || [],
        attachments: b.attachments || [],
      },
    };
  };

  const fetchPayments = async () => {
    setRefreshing(true);

    // 1. Instant local cache hydration (<50ms paint)
    let localRecents: any[] = [];
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
              if (Array.isArray(arr)) localRecents.push(...arr);
            } catch {}
          }
        }
      }
    } catch {}

    if (localRecents.length > 0) {
      const seen = new Set<string>();
      const quickList: PaymentItem[] = [];
      localRecents.forEach((lb: any, idx: number) => {
        const bId = lb.id || lb.booking_id;
        if (bId && !seen.has(bId)) {
          seen.add(bId);
          quickList.push(mapRawBookingToPayment(lb, idx));
        }
      });
      if (quickList.length > 0) {
        setPayments(quickList);
        setLoading(false);
      }
    }

    // 2. Parallel network fetching with tight timeouts
    let combinedPayments: PaymentItem[] = [];
    const fastApiBase = (TractorAIBaseURL || "https://tractorai.sinsignal.com").replace(/\/$/, "");
    const headers: Record<string, string> = {};
    if (access_token) headers["Authorization"] = `Bearer ${access_token}`;

    try {
      const results = await Promise.allSettled([
        axios.get(`${fastApiBase}/simple-booking/list/${userId}`, { timeout: 3500 }),
        axios.get(`http://127.0.0.1:8000/simple-booking/list/${userId}`, { timeout: 1500 }),
        renderInstance.get(`/farmer/paymentPage/${userId}?filter=all&page=1&limit=50`, { headers, timeout: 3500 }),
        axios.get(`/api/booking?farmer_id=${userId}`, { timeout: 3000 }),
      ]);

      const [remoteFastRes, localFastRes, renderRes, localApiRes] = results;

      const rawFastBookings: any[] = [];
      if (remoteFastRes.status === "fulfilled" && Array.isArray(remoteFastRes.value.data)) {
        rawFastBookings.push(...remoteFastRes.value.data);
      }
      if (localFastRes.status === "fulfilled" && Array.isArray(localFastRes.value.data)) {
        rawFastBookings.push(...localFastRes.value.data);
      }
      if (localApiRes.status === "fulfilled" && Array.isArray(localApiRes.value.data)) {
        rawFastBookings.push(...localApiRes.value.data);
      }

      if (rawFastBookings.length > 0) {
        const seen = new Set<string>();
        rawFastBookings.forEach((b: any, idx: number) => {
          const bId = b.id || b.booking_id;
          if (bId && !seen.has(bId)) {
            seen.add(bId);
            combinedPayments.push(mapRawBookingToPayment(b, idx));
          }
        });
      }

      if (renderRes.status === "fulfilled" && Array.isArray(renderRes.value.data?.payments)) {
        const nestPayments = renderRes.value.data.payments.map((p: any) => ({
          id: p.id,
          booking_id: p.booking_id || p.booking?.id || "BK-NEST",
          amount: Number(p.amount || 0),
          status: p.status || "COMPLETED",
          paymentType: p.transactionMethod || p.paymentType || "Bank Transfer",
          transactionMethod: p.transactionMethod || "Bank",
          receiver_name: p.reciever
            ? `${p.reciever.first_name || ""} ${p.reciever.last_name || ""}`.trim()
            : "Central Equipment Hub",
          createdAt: p.createdAt || new Date().toISOString(),
          service_name: p.booking?.service_name || "Field Machinery Operation",
          area: Number(p.booking?.area || 5),
          booking: p.booking || {},
        }));

        const existingIds = new Set(combinedPayments.map((cp) => cp.id));
        for (const np of nestPayments) {
          if (!existingIds.has(np.id)) {
            combinedPayments.push(np);
          }
        }
      }
    } catch {}

    // Merge with local recents
    if (localRecents.length > 0) {
      const existingIds = new Set(combinedPayments.map((cp) => cp.booking_id));
      localRecents.forEach((lb: any, idx: number) => {
        const bId = lb.id || lb.booking_id;
        if (bId && !existingIds.has(bId)) {
          existingIds.add(bId);
          combinedPayments.push(mapRawBookingToPayment(lb, idx));
        }
      });
    }

    // Sort newest first
    combinedPayments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    setPayments(combinedPayments);
    setLoading(false);
    setRefreshing(false);
    try {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("@farmer_payments_cache", JSON.stringify(combinedPayments.slice(0, 50)));
      }
    } catch {}
  };

  useEffect(() => {
    // 0. Check session cache immediately on mount (<20ms)
    try {
      if (typeof window !== "undefined") {
        const sessionCached = JSON.parse(sessionStorage.getItem("@farmer_payments_cache") || "[]");
        if (Array.isArray(sessionCached) && sessionCached.length > 0) {
          setPayments(sessionCached);
          setLoading(false);
        }
      }
    } catch {}

    fetchPayments();

    const handleBookingCreated = () => {
      fetchPayments();
    };

    window.addEventListener("farmer_booking_created", handleBookingCreated);
    return () => {
      window.removeEventListener("farmer_booking_created", handleBookingCreated);
    };
  }, [userId]);

  // Computed summary metrics
  const metrics = useMemo(() => {
    const totalAmount = payments.reduce((acc, p) => acc + (p.amount || 0), 0);
    const completedPayments = payments.filter((p) => p.status === "COMPLETED" || p.status === "PAID");
    const completedAmount = completedPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
    const pendingPayments = payments.filter((p) => p.status === "FarmerPENDING");
    const pendingAmount = pendingPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
    const reviewPayments = payments.filter((p) => p.status === "FarmerCONFIRMED");
    const reviewAmount = reviewPayments.reduce((acc, p) => acc + (p.amount || 0), 0);

    return {
      totalAmount,
      completedCount: completedPayments.length,
      completedAmount,
      pendingCount: pendingPayments.length,
      pendingAmount,
      reviewCount: reviewPayments.length,
      reviewAmount,
    };
  }, [payments]);

  // Filtered Payments
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      // Status filter
      if (statusFilter !== "all") {
        if (statusFilter === "completed" && !(p.status === "COMPLETED" || p.status === "PAID")) return false;
        if (statusFilter === "pending" && p.status !== "FarmerPENDING") return false;
        if (statusFilter === "review" && p.status !== "FarmerCONFIRMED") return false;
        if (statusFilter === "rejected" && p.status !== "OwnerREJECTED") return false;
      }

      // Date filter
      if (selectedDate) {
        const pDate = new Date(p.createdAt).toDateString();
        const sDate = selectedDate.toDateString();
        if (pDate !== sDate) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesId = p.id.toLowerCase().includes(q);
        const matchesBooking = p.booking_id.toLowerCase().includes(q);
        const matchesReceiver = (p.receiver_name || "").toLowerCase().includes(q);
        const matchesService = (p.service_name || "").toLowerCase().includes(q);
        const matchesMethod = (p.paymentType || "").toLowerCase().includes(q);

        if (!matchesId && !matchesBooking && !matchesReceiver && !matchesService && !matchesMethod) {
          return false;
        }
      }

      return true;
    });
  }, [payments, statusFilter, selectedDate, searchQuery]);

  // Export CSV function
  const handleExportCSV = () => {
    const headers = [
      "Payment ID",
      "Booking Reference",
      "Service Description",
      `Amount (${activeCurrency.code})`,
      "Exchange Rate to USD",
      "Status",
      "Payment Method",
      "Receiver / Depot",
      "Date",
    ];

    const csvRows = filteredPayments.map((p) => [
      p.id,
      p.booking_id,
      `"${p.service_name || "Machinery Operation"}"`,
      `"${formatPrice(p.amount)}"`,
      activeCurrency.rate,
      p.status,
      p.paymentType,
      `"${p.receiver_name || "Machinery Store"}"`,
      new Date(p.createdAt).toLocaleDateString(),
    ]);

    const csvContent = [headers.join(","), ...csvRows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `farmer_payment_ledger_${activeCurrency.code}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
      case "PAID":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold px-2.5 py-0.5 rounded-lg flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Settled / Paid</span>
          </Badge>
        );
      case "FarmerCONFIRMED":
        return (
          <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30 text-xs font-bold px-2.5 py-0.5 rounded-lg flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>Under Review</span>
          </Badge>
        );
      case "FarmerPENDING":
        return (
          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-xs font-bold px-2.5 py-0.5 rounded-lg flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            <span>Payment Pending</span>
          </Badge>
        );
      case "OwnerREJECTED":
        return (
          <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30 text-xs font-bold px-2.5 py-0.5 rounded-lg flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            <span>Rejected</span>
          </Badge>
        );
      default:
        return (
          <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold px-2.5 py-0.5 rounded-lg">
            {status}
          </Badge>
        );
    }
  };

  return (
    <div className="w-full min-h-screen py-6 space-y-6 max-w-7xl mx-auto">
      {/* ── HEADER & REGIONAL CURRENCY BAR ─────────────────────────────────── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">💳</span>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Payment & Settlement History
            </h1>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Real-time equipment rental invoices, operator dispatch fees, and dynamic multi-currency financial settlements.
          </p>
        </div>

        {/* Currency Selector & Quick Actions */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Location-Wise Currency Selector */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <Globe className="w-4 h-4 text-emerald-600 ml-2" />
            <Select value={selectedCurrencyKey} onValueChange={setSelectedCurrencyKey}>
              <SelectTrigger className="border-0 shadow-none text-xs font-bold h-8 rounded-xl focus:ring-0 w-36">
                <SelectValue placeholder="Select Currency" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="AUTO" className="text-xs font-bold">
                  🌍 Auto ({detectedCurrency.code} {detectedCurrency.symbol})
                </SelectItem>
                <SelectItem value="INR" className="text-xs font-bold">
                  🇮🇳 INR (₹) - India
                </SelectItem>
                <SelectItem value="BOB" className="text-xs font-bold">
                  🇧🇴 BOB (Bs.) - Bolivia
                </SelectItem>
                <SelectItem value="USD" className="text-xs font-bold">
                  🇺🇸 USD ($) - Global
                </SelectItem>
                <SelectItem value="PEN" className="text-xs font-bold">
                  🇵🇪 PEN (S/.) - Peru
                </SelectItem>
                <SelectItem value="BRL" className="text-xs font-bold">
                  🇧🇷 BRL (R$) - Brazil
                </SelectItem>
                <SelectItem value="EUR" className="text-xs font-bold">
                  🇪🇺 EUR (€) - Europe
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={fetchPayments}
            disabled={refreshing}
            className="rounded-xl border-slate-200 dark:border-slate-800 text-xs font-bold flex items-center gap-1.5 h-10"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-emerald-600" : ""}`} />
            <span>Refresh</span>
          </Button>

          <Button
            size="sm"
            onClick={handleExportCSV}
            disabled={filteredPayments.length === 0}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 h-10 shadow-sm shadow-emerald-600/20"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* ── METRICS SUMMARY CARDS (DYNAMIC CONVERSION) ─────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Dispatched</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">
              {formatPrice(metrics.totalAmount)}
            </h3>
            <p className="text-[11px] font-semibold text-slate-400">{payments.length} Total Transactions</p>
          </div>
        </Card>

        <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Completed / Settled</span>
            <div className="w-8 h-8 rounded-xl bg-green-50 dark:bg-green-950/50 flex items-center justify-center text-green-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {formatPrice(metrics.completedAmount)}
            </h3>
            <p className="text-[11px] font-semibold text-slate-400">{metrics.completedCount} Verified & Invoiced</p>
          </div>
        </Card>

        <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Under Review</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <h3 className="text-2xl font-black text-blue-600 dark:text-blue-400">
              {formatPrice(metrics.reviewAmount)}
            </h3>
            <p className="text-[11px] font-semibold text-slate-400">{metrics.reviewCount} Awaiting Depot Confirmation</p>
          </div>
        </Card>

        <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Settlement</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {formatPrice(metrics.pendingAmount)}
            </h3>
            <p className="text-[11px] font-semibold text-slate-400">{metrics.pendingCount} Requires Proof / Payment</p>
          </div>
        </Card>
      </div>

      {/* ── FILTER & SEARCH TOOLBAR ────────────────────────────────────────── */}
      <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto p-1 bg-slate-100 dark:bg-slate-800/60 rounded-2xl">
            {[
              { label: "All Transactions", value: "all", count: payments.length },
              { label: "Settled", value: "completed", count: metrics.completedCount },
              { label: "In Review", value: "review", count: metrics.reviewCount },
              { label: "Pending", value: "pending", count: metrics.pendingCount },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  statusFilter === tab.value
                    ? "bg-white dark:bg-emerald-600 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                    statusFilter === tab.value
                      ? "bg-emerald-100 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-100"
                      : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search & Date Pickers */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                placeholder="Search ID, booking, service..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-8 text-xs rounded-xl border-slate-200 dark:border-slate-800 h-9"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className={`rounded-xl border-slate-200 dark:border-slate-800 text-xs font-bold flex items-center gap-1.5 h-9 ${
                    selectedDate ? "border-emerald-600 text-emerald-600" : "text-slate-600"
                  }`}
                >
                  <CalendarIcon className="w-3.5 h-3.5" />
                  <span>{selectedDate ? format(selectedDate, "MMM dd, yyyy") : "Filter Date"}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-2xl" align="end">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                />
                {selectedDate && (
                  <div className="p-2 border-t border-slate-100 flex justify-end">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedDate(undefined)}
                      className="text-xs font-bold text-rose-500 h-7"
                    >
                      Clear Date Filter
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </Card>

      {/* ── PAYMENTS TABLE CARD ────────────────────────────────────────────── */}
      <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-400 space-y-3">
            <RefreshCw className="w-7 h-7 text-emerald-600 animate-spin mx-auto" />
            <p className="font-semibold text-sm">Loading payment transactions...</p>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="py-16 text-center space-y-4">
            <Receipt className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
            <div>
              <h3 className="font-black text-base text-slate-900 dark:text-white">No Payment Records Found</h3>
              <p className="text-xs text-slate-400 mt-1">
                {searchQuery || selectedDate || statusFilter !== "all"
                  ? "Try clearing your search query or filters to view all entries."
                  : "All completed equipment bookings and dispatch invoices will appear here."}
              </p>
            </div>
            {(searchQuery || selectedDate || statusFilter !== "all") && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedDate(undefined);
                  setStatusFilter("all");
                }}
                className="text-xs font-bold rounded-xl"
              >
                Clear All Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800">
                <TableRow>
                  <TableHead className="font-extrabold text-xs text-slate-600 dark:text-slate-300 py-3.5 pl-6">
                    Payment Reference
                  </TableHead>
                  <TableHead className="font-extrabold text-xs text-slate-600 dark:text-slate-300 py-3.5">
                    Service / Booking
                  </TableHead>
                  <TableHead className="font-extrabold text-xs text-slate-600 dark:text-slate-300 py-3.5">
                    Depot / Receiver
                  </TableHead>
                  <TableHead className="font-extrabold text-xs text-slate-600 dark:text-slate-300 py-3.5">
                    Method
                  </TableHead>
                  <TableHead className="font-extrabold text-xs text-slate-600 dark:text-slate-300 py-3.5">
                    Date & Time
                  </TableHead>
                  <TableHead className="font-extrabold text-xs text-slate-600 dark:text-slate-300 py-3.5 text-right">
                    Amount ({activeCurrency.code})
                  </TableHead>
                  <TableHead className="font-extrabold text-xs text-slate-600 dark:text-slate-300 py-3.5 text-center">
                    Status
                  </TableHead>
                  <TableHead className="font-extrabold text-xs text-slate-600 dark:text-slate-300 py-3.5 text-center pr-6">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                {filteredPayments.map((payment) => (
                  <TableRow
                    key={payment.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Payment Ref */}
                    <TableCell className="py-4 pl-6 font-mono font-bold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <Receipt className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{payment.id}</span>
                      </div>
                    </TableCell>

                    {/* Service & Booking Ref */}
                    <TableCell className="py-4">
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-900 dark:text-white block">
                          {payment.service_name}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          Ref: {payment.booking_id}
                        </span>
                      </div>
                    </TableCell>

                    {/* Depot / Receiver */}
                    <TableCell className="py-4 font-semibold text-slate-700 dark:text-slate-300">
                      {payment.receiver_name}
                    </TableCell>

                    {/* Payment Method */}
                    <TableCell className="py-4">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-bold text-[11px] text-slate-700 dark:text-slate-300">
                        {payment.paymentType}
                      </span>
                    </TableCell>

                    {/* Date */}
                    <TableCell className="py-4 text-slate-500">
                      {new Date(payment.createdAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </TableCell>

                    {/* Amount */}
                    <TableCell className="py-4 text-right">
                      <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {formatPrice(payment.amount)}
                      </span>
                    </TableCell>

                    {/* Status */}
                    <TableCell className="py-4 text-center">
                      <div className="flex justify-center">{getStatusBadge(payment.status)}</div>
                    </TableCell>

                    {/* Action Sheet */}
                    <TableCell className="py-4 pr-6 text-center">
                      {payment.booking ? (
                        <PaymentDetailsSheet
                          payment={payment as any}
                          paymentRefresh={fetchPayments}
                          currency={activeCurrency}
                        />
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleExportCSV()}
                          className="h-8 text-xs font-bold text-emerald-600 hover:text-emerald-700 rounded-xl"
                        >
                          <FileText className="w-3.5 h-3.5 mr-1" />
                          <span>Receipt</span>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}
