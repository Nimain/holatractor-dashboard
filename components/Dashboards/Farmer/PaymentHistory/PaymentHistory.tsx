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

interface PaymentItem {
  id: string;
  booking_id: string;
  amount: number;
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
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedPayment, setSelectedPayment] = useState<any | null>(null);

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

  const fetchPayments = async () => {
    setRefreshing(true);
    let combinedPayments: PaymentItem[] = [];

    // 1. Primary: TractorAI Simple Booking list
    try {
      const fastApiBase = (TractorAIBaseURL || "https://tractorai.sinsignal.com").replace(/\/$/, "");
      const res = await axios.get(`${fastApiBase}/simple-booking/list/${userId}`, { timeout: 8000 });
      const bList = Array.isArray(res.data) ? res.data : [];

      if (bList.length > 0) {
        combinedPayments = bList.map((b: any, idx: number) => {
          const isDone = b.bookingStatus === "Completed" || b.status === "Completed";
          const isConfirmed = b.bookingStatus === "Confirmed" || b.status === "Confirmed";
          const isRejected = b.bookingStatus === "Rejected" || b.status === "Rejected";

          let payStatus = "FarmerPENDING";
          if (isDone) payStatus = "COMPLETED";
          else if (isConfirmed) payStatus = "FarmerCONFIRMED";
          else if (isRejected) payStatus = "OwnerREJECTED";

          return {
            id: `PAY-${b.id ? String(b.id).slice(-6).toUpperCase() : `00${idx + 1}`}`,
            booking_id: b.id || `BK-${idx + 100}`,
            amount: Number(b.total_cost || b.total_amount || 120),
            status: payStatus,
            paymentType: b.payment_method || "Credit Card / Direct",
            transactionMethod: b.payment_method || "Direct Dispatch",
            receiver_name: b.store_name || "Regional Machinery Depot",
            createdAt: b.createdAt || b.start_date || new Date().toISOString(),
            service_name: b.service_name || b.operation_type || "Deep Plowing & Soil Prep",
            area: Number(b.area_hectares || b.area || 5),
            booking: {
              ...b,
              tractors: b.tractors || [],
              attachments: b.attachments || [],
            },
          };
        });
      }
    } catch (errFastApi) {
      console.warn("TractorAI booking payments fetch error:", errFastApi);
    }

    // 2. Secondary: NestJS /farmer/paymentPage/${userId}
    try {
      const headers: Record<string, string> = {};
      if (access_token) headers["Authorization"] = `Bearer ${access_token}`;

      const res = await renderInstance.get(`/farmer/paymentPage/${userId}?filter=all&page=1&limit=50`, {
        headers,
      });

      if (Array.isArray(res.data?.payments) && res.data.payments.length > 0) {
        const nestPayments = res.data.payments.map((p: any) => ({
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

        // Merge without duplicates
        const existingIds = new Set(combinedPayments.map((cp) => cp.id));
        for (const np of nestPayments) {
          if (!existingIds.has(np.id)) {
            combinedPayments.push(np);
          }
        }
      }
    } catch (errNest) {
      console.warn("NestJS payments fetch error:", errNest);
    }

    // 3. Fallback Local Storage bookings
    try {
      const localRecents = JSON.parse(localStorage.getItem("@farmer_all_recent_bookings") || "[]");
      if (Array.isArray(localRecents) && localRecents.length > 0) {
        const existingIds = new Set(combinedPayments.map((cp) => cp.booking_id));
        localRecents.forEach((lb: any, idx: number) => {
          if (lb.id && !existingIds.has(lb.id)) {
            combinedPayments.unshift({
              id: `PAY-REC-${idx + 1}`,
              booking_id: lb.id,
              amount: Number(lb.total_cost || lb.total_amount || 150),
              status: "FarmerCONFIRMED",
              paymentType: lb.payment_method || "Online Settlement",
              transactionMethod: lb.payment_method || "Card",
              receiver_name: lb.store_name || "Machinery Fleet Hub",
              createdAt: lb.createdAt || new Date().toISOString(),
              service_name: lb.service_name || "Agricultural Service",
              area: Number(lb.area_hectares || 5),
              booking: lb,
            });
          }
        });
      }
    } catch {}

    // Sort newest first
    combinedPayments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    setPayments(combinedPayments);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
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
    const completedCount = payments.filter((p) => p.status === "COMPLETED" || p.status === "PAID").length;
    const pendingCount = payments.filter((p) => p.status === "FarmerPENDING").length;
    const reviewCount = payments.filter((p) => p.status === "FarmerCONFIRMED").length;

    return {
      totalAmount,
      completedCount,
      pendingCount,
      reviewCount,
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
      "Amount (USD)",
      "Status",
      "Payment Method",
      "Receiver / Depot",
      "Date",
    ];

    const csvRows = filteredPayments.map((p) => [
      p.id,
      p.booking_id,
      `"${p.service_name || "Machinery Operation"}"`,
      `$${p.amount.toFixed(2)}`,
      p.status,
      p.paymentType,
      `"${p.receiver_name || "Machinery Store"}"`,
      new Date(p.createdAt).toLocaleDateString(),
    ]);

    const csvContent = [headers.join(","), ...csvRows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `farmer_payment_history_${Date.now()}.csv`);
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
      {/* ── HEADER ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">💳</span>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Payment & Settlement History
            </h1>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Track equipment rental invoices, operator dispatch fees, digital receipts, and real-time transaction settlements.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            onClick={fetchPayments}
            disabled={refreshing}
            className="rounded-xl border-slate-200 dark:border-slate-800 text-xs font-bold flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-emerald-600" : ""}`} />
            <span>Refresh Ledger</span>
          </Button>

          <Button
            size="sm"
            onClick={handleExportCSV}
            disabled={filteredPayments.length === 0}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-emerald-600/20"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Statement (CSV)</span>
          </Button>
        </div>
      </div>

      {/* ── METRICS SUMMARY CARDS ─────────────────────────────────────────── */}
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
              ${metrics.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
              {metrics.completedCount}
            </h3>
            <p className="text-[11px] font-semibold text-slate-400">Verified & Invoiced</p>
          </div>
        </Card>

        <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Under Store Review</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <h3 className="text-2xl font-black text-blue-600 dark:text-blue-400">
              {metrics.reviewCount}
            </h3>
            <p className="text-[11px] font-semibold text-slate-400">Awaiting Depot Confirmation</p>
          </div>
        </Card>

        <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Action</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {metrics.pendingCount}
            </h3>
            <p className="text-[11px] font-semibold text-slate-400">Requires Proof / Payment</p>
          </div>
        </Card>
      </div>

      {/* ── FILTER & SEARCH TOOLBAR ────────────────────────────────────────── */}
      <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto p-1 bg-slate-100 dark:bg-slate-800/60 rounded-2xl">
            {[
              { label: "All Ledger", value: "all", count: payments.length },
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
            <p className="font-semibold text-sm">Loading verified transactions ledger...</p>
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
                    Amount (USD)
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
                        ${payment.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
