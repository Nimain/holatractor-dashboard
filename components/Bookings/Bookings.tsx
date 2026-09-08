"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import SearchIcon from "@mui/icons-material/Search";
import { errorMessage } from "@/utils/Toastify/Messages";
import { Booking } from "@/utils/Types/types";
import { Backdrop, CircularProgress } from "@mui/material";
import NewBooking from "./NewBooking";
import Image from "next/image";
import NullImage from "@/assets/AnimateIcons/Tractor.svg";
import axios from "axios";
import { TractorAIBaseURL } from "@/utils/Axios/RenderInstance";

export type BookingCategoryTab = "store" | "standalone_tractor" | "standalone_attachment" | "simple_3tap";

const Bookings = () => {
  const [activeCategory, setActiveCategory] = useState<BookingCategoryTab>("store");
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [counts, setCounts] = useState<{
    store: number;
    standalone_tractor: number;
    standalone_attachment: number;
    simple_3tap: number;
  }>({
    store: 0,
    standalone_tractor: 0,
    standalone_attachment: 0,
    simple_3tap: 0,
  });
  const [loading, setLoading] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [openModal, setOpenModal] = useState(false);
  const [modalTab, setModalTab] = useState("booking");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const router = useRouter();

  async function fetchCounts() {
    try {
      const fastApiBase = (TractorAIBaseURL || "https://tractorai.sinsignal.com").replace(/\/$/, "");
      const [stRes, tractorRes, attachRes, tapRes] = await Promise.all([
        axios.get("/api/booking?type=store").catch(() => ({ data: [] })),
        axios.get("/api/booking?type=standalone_tractor").catch(() => ({ data: [] })),
        axios.get("/api/booking?type=standalone_attachment").catch(() => ({ data: [] })),
        axios.get("/api/booking?type=3tap").catch(() => ({ data: [] })),
      ]);

      const tapList = Array.isArray(tapRes.data)
        ? tapRes.data
        : Array.isArray(tapRes.data?.bookings)
        ? tapRes.data.bookings
        : [];

      setCounts({
        store: Array.isArray(stRes.data) ? stRes.data.length : 0,
        standalone_tractor: Array.isArray(tractorRes.data) ? tractorRes.data.length : 0,
        standalone_attachment: Array.isArray(attachRes.data) ? attachRes.data.length : 0,
        simple_3tap: tapList.length,
      });
    } catch {}
  }

  async function fetchBookings(category: BookingCategoryTab) {
    setLoading(true);
    try {
      let data: any[] = [];
      const fastApiBase = (TractorAIBaseURL || "https://tractorai.sinsignal.com").replace(/\/$/, "");

      if (category === "simple_3tap") {
        try {
          const res = await axios.get(`/api/booking?type=3tap`);
          if (Array.isArray(res.data) && res.data.length > 0) {
            data = res.data;
          }
        } catch {}

        // Dynamic FastAPI fallback if DB returns empty
        if (data.length === 0) {
          try {
            const fastRes = await axios.get(`${fastApiBase}/simple-booking/list/all`, { timeout: 6000 })
              .catch(() => axios.get(`${fastApiBase}/simple-booking/farmer`, { timeout: 6000 }));
            const list = Array.isArray(fastRes?.data?.bookings)
              ? fastRes.data.bookings
              : Array.isArray(fastRes?.data)
              ? fastRes.data
              : [];
            data = list.map((item: any) => ({
              id: item.id || `simple_${item.booking_id || Math.random().toString(36).substring(7)}`,
              user_id: item.user_id || item.farmer_id || "farmer_id",
              store_id: item.store_id || null,
              start_date: item.start_date || item.scheduled_date || new Date().toISOString(),
              end_date: item.end_date || null,
              booking_hours: item.booking_hours || "three_hours",
              total_cost: item.total_cost || item.total_amount || 0,
              bookingStatus: item.bookingStatus || item.status || "Open",
              bookingType: "simple_3tap",
              task_type: item.task_type || item.task_name || "Agricultural Task",
              checkin_otp: item.checkin_otp || item.otp || null,
              createdAt: item.createdAt || item.created_at || new Date().toISOString(),
              user: {
                id: item.user_id || item.farmer_id || "farmer_id",
                first_name: item.farmer_name || item.user?.first_name || "Farmer",
                last_name: item.user?.last_name || "",
                email: item.user?.email || "farmer@holatractor.com",
                mobile: item.user?.mobile || "",
              },
              store: item.store_name ? { name: item.store_name } : null,
              farm: { name: item.farm_name || "Direct Field Parcel", area_sqm: (item.hectares || 3) * 10000 },
            }));
          } catch {}
        }
      } else {
        const res = await axios.get(`/api/booking?type=${category}`);
        data = Array.isArray(res.data) ? res.data : [];
      }

      const sortedBookings = [...data].sort((a, b) => {
        const dateA = new Date(a.createdAt || a.start_date).getTime();
        const dateB = new Date(b.createdAt || b.start_date).getTime();
        return dateB - dateA;
      });
      setAllBookings(sortedBookings);
      setCurrentPage(1);
    } catch (err: any) {
      errorMessage("Error fetching booking list");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCounts();
  }, []);

  useEffect(() => {
    fetchBookings(activeCategory);
  }, [activeCategory]);

  const formatId = (id: string) => {
    if (!id) return "N/A";
    return id.slice(0, 8).toUpperCase() + "...";
  };

  const formatDate = (date: string) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDuration = (duration: string | number) => {
    if (!duration) return "N/A";
    if (typeof duration === "string") {
      const durationMap: { [key: string]: string } = {
        one_hour: "1 hr",
        two_hours: "2 hrs",
        three_hours: "3 hrs",
        four_hours: "4 hrs",
        five_hours: "5 hrs",
        six_hours: "6 hrs",
        seven_hours: "7 hrs",
        eight_hours: "8 hrs",
        nine_hours: "9 hrs",
        ten_hours: "10 hrs",
        eleven_hours: "11 hrs",
        twelve_hours: "12 hrs",
        one_day: "1 day",
        two_days: "2 days",
        three_days: "3 days",
        four_days: "4 days",
        five_days: "5 days",
        six_days: "6 days",
        seven_days: "7 days",
      };
      const lowerDuration = duration.toLowerCase().trim().replace(/_/g, "_");
      return durationMap[lowerDuration] || duration.replace(/_/g, " ");
    }
    return `${duration} days`;
  };

  const handleBookingClick = async (bookingId: string) => {
    try {
      setLoading(true);
      setModalTab("booking");
      const res = await axios.get(`/api/booking/${bookingId}`);
      setSelectedBooking(res.data);
      setOpenModal(true);
    } catch (err: any) {
      errorMessage("Error fetching booking details");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedBooking(null);
    setModalTab("booking");
  };

  // Filter Bookings
  const filteredBookings = allBookings.filter((b: any) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !query ||
      b.id?.toLowerCase().includes(query) ||
      b.user?.first_name?.toLowerCase().includes(query) ||
      b.user?.last_name?.toLowerCase().includes(query) ||
      b.user?.email?.toLowerCase().includes(query) ||
      b.store?.name?.toLowerCase().includes(query);

    const matchesStatus =
      statusFilter === "all" ||
      b.bookingStatus?.toLowerCase() === statusFilter.toLowerCase();

    return matchesQuery && matchesStatus;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentBookings = filteredBookings.slice(startIndex, endIndex);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePageClick = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push("...");
        pages.push(totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="py-6 md:py-10 w-full px-4 md:px-6">
      <Backdrop
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading}
      >
        {loading && <CircularProgress />}
      </Backdrop>

      {/* Header & New Booking Button */}
      <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Booking Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time machinery reservations and standalone equipment rentals
          </p>
        </div>
        <NewBooking />
      </div>

      {/* 4-Category Booking Selector */}
      <div className="bg-slate-100 p-1.5 rounded-2xl flex flex-wrap gap-2 mb-6 border border-slate-200">
        <button
          onClick={() => setActiveCategory("simple_3tap")}
          className={`flex-1 min-w-[170px] py-3 px-4 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-sm ${
            activeCategory === "simple_3tap"
              ? "bg-slate-900 text-white shadow-md scale-[1.01]"
              : "bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          <span className="text-base">⚡</span>
          <span>3-Tap Direct Bookings</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
              activeCategory === "simple_3tap"
                ? "bg-emerald-500 text-white"
                : "bg-slate-200 text-slate-800"
            }`}
          >
            {counts.simple_3tap}
          </span>
        </button>

        <button
          onClick={() => setActiveCategory("store")}
          className={`flex-1 min-w-[170px] py-3 px-4 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-sm ${
            activeCategory === "store"
              ? "bg-slate-900 text-white shadow-md scale-[1.01]"
              : "bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          <span className="text-base">🏪</span>
          <span>Store Machinery</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
              activeCategory === "store"
                ? "bg-emerald-500 text-white"
                : "bg-slate-200 text-slate-800"
            }`}
          >
            {counts.store}
          </span>
        </button>

        <button
          onClick={() => setActiveCategory("standalone_tractor")}
          className={`flex-1 min-w-[170px] py-3 px-4 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-sm ${
            activeCategory === "standalone_tractor"
              ? "bg-slate-900 text-white shadow-md scale-[1.01]"
              : "bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          <span className="text-base">🚜</span>
          <span>Standalone Tractor</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
              activeCategory === "standalone_tractor"
                ? "bg-emerald-500 text-white"
                : "bg-slate-200 text-slate-800"
            }`}
          >
            {counts.standalone_tractor}
          </span>
        </button>

        <button
          onClick={() => setActiveCategory("standalone_attachment")}
          className={`flex-1 min-w-[170px] py-3 px-4 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-sm ${
            activeCategory === "standalone_attachment"
              ? "bg-slate-900 text-white shadow-md scale-[1.01]"
              : "bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          <span className="text-base">⚙️</span>
          <span>Standalone Attachment</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
              activeCategory === "standalone_attachment"
                ? "bg-emerald-500 text-white"
                : "bg-slate-200 text-slate-800"
            }`}
          >
            {counts.standalone_attachment}
          </span>
        </button>
      </div>

      {/* Search & Status Filter Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="relative w-full sm:w-80">
          <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by ID, farmer, task, store..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all shadow-sm font-medium"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {["all", "Open", "Accepted", "Arriving", "Finished", "Cancelled"].map((st) => (
            <button
              key={st}
              onClick={() => {
                setStatusFilter(st);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                statusFilter === st
                  ? "bg-emerald-700 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {st === "all" ? "All Statuses" : st}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop Table Header */}
      <div className="hidden lg:flex text-sm font-bold items-center justify-between gap-3 bg-slate-100 p-4 rounded-xl text-slate-700">
        <p className="w-12 text-center">#</p>
        <p className="w-40">Booking ID</p>
        <p className="w-44">Farmer / Customer</p>
        <p className="w-48">
          {activeCategory === "simple_3tap"
            ? "Task & Service"
            : activeCategory === "store"
            ? "Assigned Store"
            : "Equipment / Parcel"}
        </p>
        <p className="w-28 text-center">Start Date</p>
        <p className="w-24 text-center">Duration</p>
        <p className="w-28 text-center">Status</p>
        <p className="w-24 text-right">Total Cost</p>
      </div>

      <div className="flex flex-col gap-2.5 mt-3">
        {filteredBookings.length === 0 ? (
          <div className="w-full h-full min-h-[50vh] flex flex-col items-center justify-center bg-slate-50/50 rounded-2xl border border-slate-100 p-8">
            <Image
              src={NullImage}
              alt="No bookings found"
              className="w-48 md:w-64 h-auto object-cover opacity-80"
              width={300}
              height={300}
              unoptimized={true}
            />
            <p className="text-slate-600 font-bold text-lg mt-4">No bookings found</p>
            <p className="text-slate-400 text-xs mt-1">Try switching tabs or clearing your search filters.</p>
          </div>
        ) : (
          <>
            {currentBookings.map((details: any, index) => {
              const status = details.bookingStatus || "Open";
              const isFinished = status === "Finished" || status === "Completed";
              const isAccepted = status === "Accepted" || status === "Arriving" || status === "Started";
              const isCancelled = status === "Cancelled" || status === "Rejected";

              return (
                <div
                  onClick={() => handleBookingClick(details.id)}
                  className="bg-white hover:shadow-md transition-all duration-300 rounded-xl cursor-pointer border border-slate-200/80 hover:border-emerald-300"
                  key={details.id}
                >
                  {/* Desktop View */}
                  <div className="hidden lg:flex text-sm items-center justify-between gap-3 px-4 py-3.5">
                    <p className="w-12 text-slate-400 font-semibold text-center">{startIndex + index + 1}</p>
                    <p className="w-40 font-mono text-xs font-bold text-slate-800 truncate" title={details.id}>
                      {formatId(details.id)}
                    </p>
                    <div className="w-44 truncate">
                      <p className="font-semibold text-slate-900 truncate">
                        {details.user?.first_name} {details.user?.last_name}
                      </p>
                      <p className="text-xs text-slate-400 truncate">{details.user?.email || details.user?.mobile}</p>
                    </div>
                    <div className="w-48 truncate">
                      <p className="font-semibold text-slate-800 truncate flex items-center gap-1.5">
                        {details.task_type && (
                          <span className="text-emerald-700 font-bold text-[11px] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 shrink-0">
                            ⚡ 3-Tap
                          </span>
                        )}
                        <span className="truncate capitalize">
                          {details.task_type ? `${details.task_type} Service` : (details.store?.name || details.farm?.name || "Independent")}
                        </span>
                      </p>
                      <p className="text-xs text-slate-500 truncate flex items-center gap-1.5 mt-0.5">
                        {details.checkin_otp ? (
                          <span className="font-mono text-emerald-800 font-bold bg-emerald-100 px-1.5 py-0.5 rounded text-[11px] shrink-0">
                            🔐 OTP: {details.checkin_otp}
                          </span>
                        ) : null}
                        <span className="truncate">
                          {details.store?.name ? `🏪 ${details.store.name}` : ""}
                          {details.BookingStandaloneTractor?.[0]?.name ? ` • 🚜 ${details.BookingStandaloneTractor[0].name}` : ""}
                          {details.BookingTractor?.[0]?.name ? ` • 🚜 ${details.BookingTractor[0].name}` : ""}
                          {details.BookingStandaloneAttachment?.[0]?.name ? ` • ⚙️ ${details.BookingStandaloneAttachment[0].name}` : ""}
                          {details.BookingAttachment?.[0]?.name ? ` • ⚙️ ${details.BookingAttachment[0].name}` : ""}
                          {!details.store?.name && !details.BookingTractor?.[0]?.name && (details.farm?.area_sqm ? `${(details.farm.area_sqm / 10000).toFixed(1)} ha parcel` : "Standard Parcel")}
                        </span>
                      </p>
                    </div>
                    <div className="w-28 text-center text-xs font-medium text-slate-600">
                      {formatDate(details.start_date)}
                    </div>
                    <div className="w-24 text-center text-xs font-semibold text-slate-700 bg-slate-100 py-1 rounded-md">
                      {formatDuration(details.booking_hours)}
                    </div>
                    <div className="w-28 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                          isFinished
                            ? "bg-emerald-100 text-emerald-800"
                            : isAccepted
                            ? "bg-blue-100 text-blue-800"
                            : isCancelled
                            ? "bg-red-100 text-red-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {status}
                      </span>
                    </div>
                    <p className="w-24 text-right font-bold text-slate-900 text-base">
                      ${details.total_cost || 0}
                    </p>
                  </div>

                  {/* Mobile View */}
                  <div className="lg:hidden p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          #{startIndex + index + 1} • {formatId(details.id)}
                        </span>
                        <p className="text-base font-bold text-slate-900 mt-1">
                          {details.user?.first_name} {details.user?.last_name}
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          {details.task_type && (
                            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                              ⚡ {details.task_type}
                            </span>
                          )}
                          {details.checkin_otp && (
                            <span className="text-[11px] font-mono font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                              🔐 {details.checkin_otp}
                            </span>
                          )}
                          <span className="text-xs text-slate-500">{details.store?.name ? `🏪 ${details.store.name}` : (details.farm?.name || "Direct Booking")}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                            isFinished
                              ? "bg-emerald-100 text-emerald-800"
                              : isAccepted
                              ? "bg-blue-100 text-blue-800"
                              : isCancelled
                              ? "bg-red-100 text-red-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {status}
                        </span>
                        <p className="text-lg font-bold text-slate-900 mt-1">${details.total_cost}</p>
                      </div>
                    </div>
                    <div className="flex justify-between text-xs pt-2 border-t border-slate-100 text-slate-600">
                      <span>Start: {formatDate(details.start_date)}</span>
                      <span>Duration: {formatDuration(details.booking_hours)}</span>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-8 mb-4 px-2">
                <p className="text-xs text-slate-500 font-medium">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredBookings.length)} of {filteredBookings.length} bookings
                </p>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      currentPage === 1
                        ? "bg-slate-100 text-slate-300 cursor-not-allowed"
                        : "bg-slate-900 text-white hover:bg-slate-800"
                    }`}
                  >
                    <ChevronLeftIcon className="text-sm" />
                    <span>Prev</span>
                  </button>

                  <div className="flex items-center gap-1">
                    {getPageNumbers().map((page, index) => (
                      <button
                        key={index}
                        onClick={() => typeof page === "number" && handlePageClick(page)}
                        disabled={page === "..."}
                        className={`min-w-[32px] h-[32px] rounded-lg text-xs font-bold transition-all ${
                          page === currentPage
                            ? "bg-slate-900 text-white shadow-sm"
                            : page === "..."
                            ? "bg-transparent text-slate-400 cursor-default"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      currentPage === totalPages
                        ? "bg-slate-100 text-slate-300 cursor-not-allowed"
                        : "bg-slate-900 text-white hover:bg-slate-800"
                    }`}
                  >
                    <span>Next</span>
                    <ChevronRightIcon className="text-sm" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Booking Details Modal */}
      {openModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 overflow-y-auto"
          onClick={handleCloseModal}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden my-auto border border-slate-100 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {selectedBooking && (
              <div className="flex flex-col h-full overflow-hidden">
                {/* Modal Header */}
                <div className="bg-slate-900 text-white p-6 relative shrink-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs uppercase tracking-wider font-semibold text-emerald-400">
                        HolaTractor Machinery Booking
                      </span>
                      <h2 className="text-xl md:text-2xl font-bold mt-0.5">Booking Details</h2>
                      <p className="text-xs text-slate-300 font-mono mt-1">ID: {selectedBooking.id}</p>
                    </div>
                    <button
                      onClick={handleCloseModal}
                      className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center text-sm font-bold transition-all"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Modal Sub-Tabs */}
                  <div className="flex gap-2 mt-5 overflow-x-auto pb-1">
                    {[
                      { key: "booking", label: "Overview", icon: "📋" },
                      { key: "farmer", label: "Farmer / Customer", icon: "👨‍🌾" },
                      { key: "store", label: "Store & Owner", icon: "🏪" },
                      { key: "equipment", label: "Equipment / Machinery", icon: "🚜" },
                      { key: "cost", label: "Cost & Invoicing", icon: "💳" },
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setModalTab(tab.key)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 ${
                          modalTab === tab.key
                            ? "bg-emerald-500 text-white shadow-sm"
                            : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                        }`}
                      >
                        <span>{tab.icon}</span>
                        <span>{tab.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Modal Scrollable Body */}
                <div className="p-6 overflow-y-auto space-y-4 bg-slate-50 flex-1">
                  {/* Tab 1: Overview */}
                  {modalTab === "booking" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(selectedBooking.task_type || selectedBooking.checkin_otp) && (
                        <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-slate-900 text-white p-5 rounded-2xl md:col-span-2 shadow-lg border border-emerald-500/30">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <span className="text-3xl p-2.5 bg-emerald-500/20 rounded-xl border border-emerald-400/30">⚡</span>
                              <div>
                                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">FastAPI 3-Tap Dispatch</span>
                                <h3 className="text-lg font-bold text-white">{selectedBooking.task_type || "Agricultural Machinery Service"}</h3>
                                <p className="text-xs text-slate-300">Automated AI machinery dispatch with verified field operator</p>
                              </div>
                            </div>
                            {selectedBooking.checkin_otp && (
                              <div className="bg-emerald-500/20 border border-emerald-400/40 px-4 py-2 rounded-xl text-right">
                                <span className="text-[10px] text-emerald-300 uppercase tracking-wider font-semibold block">Field Check-in OTP</span>
                                <span className="font-mono text-xl font-black text-emerald-300 tracking-wider">
                                  {selectedBooking.checkin_otp}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      <div className="bg-white p-4 rounded-2xl border border-slate-200">
                        <p className="text-xs font-semibold text-slate-400 uppercase">Reservation Schedule</p>
                        <p className="text-sm font-bold text-slate-900 mt-1">
                          Start Date: {formatDate(selectedBooking.start_date)}
                        </p>
                        <p className="text-sm font-bold text-slate-900">
                          End Date: {selectedBooking.end_date ? formatDate(selectedBooking.end_date) : "Open-ended"}
                        </p>
                        <p className="text-xs text-slate-500 mt-2 font-semibold">
                          Duration: {formatDuration(selectedBooking.booking_hours)}
                        </p>
                      </div>

                      <div className="bg-white p-4 rounded-2xl border border-slate-200">
                        <p className="text-xs font-semibold text-slate-400 uppercase">Status & Confirmation</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-full text-xs">
                            {selectedBooking.bookingStatus}
                          </span>
                          <span className="text-xs text-slate-500">
                            Type: {selectedBooking.bookingType || "store"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                          Owner Confirmed: {selectedBooking.owner_confirm ? "Yes" : "Pending"}
                        </p>
                      </div>

                      <div className="bg-white p-4 rounded-2xl border border-slate-200 md:col-span-2">
                        <p className="text-xs font-semibold text-slate-400 uppercase">Farm / Work Parcel</p>
                        <p className="text-base font-bold text-slate-900 mt-1">
                          {selectedBooking.farm?.name || "Independent Parcel"}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {selectedBooking.farm?.description || "Registered agricultural parcel in database."}
                        </p>
                        {selectedBooking.farm?.area_sqm > 0 && (
                          <p className="text-xs text-emerald-700 font-semibold mt-1">
                            Area: {(selectedBooking.farm.area_sqm / 10000).toFixed(2)} Hectares ({selectedBooking.farm.area_sqm} m²)
                          </p>
                        )}
                      </div>

                      {selectedBooking.store && (
                        <div className="bg-white p-4 rounded-2xl border border-slate-200 md:col-span-2">
                          <p className="text-xs font-semibold text-slate-400 uppercase">Assigned Store Machinery Hub</p>
                          <p className="text-base font-bold text-slate-900 mt-1 flex items-center gap-2">
                            <span>🏪</span> {selectedBooking.store.name}
                          </p>
                          {selectedBooking.store.description && (
                            <p className="text-xs text-slate-500 mt-0.5">{selectedBooking.store.description}</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab 2: Farmer */}
                  {modalTab === "farmer" && (
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 font-bold text-xl flex items-center justify-center">
                          {selectedBooking.user?.first_name?.[0] || "F"}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">
                            {selectedBooking.user?.first_name} {selectedBooking.user?.middle_name}{" "}
                            {selectedBooking.user?.last_name}
                          </h3>
                          <p className="text-xs text-slate-500">{selectedBooking.user?.email || "No email"}</p>
                          <p className="text-xs text-slate-500 font-semibold">{selectedBooking.user?.mobile || "No phone"}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tab 3: Store & Owner */}
                  {modalTab === "store" && (
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
                      {selectedBooking.store ? (
                        <>
                          <h3 className="text-base font-bold text-slate-900">{selectedBooking.store.name}</h3>
                          <p className="text-xs text-slate-500">{selectedBooking.store.description || "Authorized Store Hub"}</p>
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 mt-3">
                            <p className="text-xs font-semibold text-slate-500">Store Owner:</p>
                            <p className="text-sm font-bold text-slate-800">
                              {selectedBooking.store.user?.first_name} {selectedBooking.store.user?.last_name}
                            </p>
                            <p className="text-xs text-slate-500">{selectedBooking.store.user?.email}</p>
                            <p className="text-xs text-slate-500">{selectedBooking.store.user?.mobile}</p>
                          </div>
                        </>
                      ) : (
                        <p className="text-sm text-slate-500">Direct or Standalone equipment reservation without physical store assignment.</p>
                      )}
                    </div>
                  )}

                  {/* Tab 4: Equipment */}
                  {modalTab === "equipment" && (
                    <div className="space-y-3">
                      {selectedBooking.BookingStandaloneTractor?.length > 0 && (
                        <div className="bg-white p-4 rounded-2xl border border-slate-200">
                          <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Standalone Tractors</p>
                          {selectedBooking.BookingStandaloneTractor.map((t: any, idx: number) => (
                            <div key={idx} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
                              <div>
                                <p className="text-sm font-bold text-slate-900">{t.name || t.model || "Tractor"}</p>
                                <p className="text-xs text-slate-500">Model: {t.model || "Heavy Machinery"}</p>
                              </div>
                              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg">
                                Qty: {t.count || 1}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {selectedBooking.BookingStandaloneAttachment?.length > 0 && (
                        <div className="bg-white p-4 rounded-2xl border border-slate-200">
                          <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Standalone Implements / Attachments</p>
                          {selectedBooking.BookingStandaloneAttachment.map((a: any, idx: number) => (
                            <div key={idx} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
                              <div>
                                <p className="text-sm font-bold text-slate-900">{a.name || "Attachment"}</p>
                                <p className="text-xs text-slate-500">{a.description || "Farm Implement"}</p>
                              </div>
                              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg">
                                Qty: {a.count || 1}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {selectedBooking.BookingTractor?.length > 0 && (
                        <div className="bg-white p-4 rounded-2xl border border-slate-200">
                          <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Assigned Store Tractors</p>
                          {selectedBooking.BookingTractor.map((t: any, idx: number) => (
                            <div key={idx} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
                              <div>
                                <p className="text-sm font-bold text-slate-900">{t.name || t.model || "Tractor"}</p>
                                <p className="text-xs text-slate-500">Rate: ${t.hourly_price || 30}/hr</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab 5: Cost & Invoicing */}
                  {modalTab === "cost" && (
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="p-3 bg-slate-50 rounded-xl">
                          <p className="text-xs text-slate-400">Tractor Cost</p>
                          <p className="text-base font-bold text-slate-800">${selectedBooking.total_tractor_cost || 0}</p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl">
                          <p className="text-xs text-slate-400">Attachment Cost</p>
                          <p className="text-base font-bold text-slate-800">${selectedBooking.total_attachment_cost || 0}</p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl">
                          <p className="text-xs text-slate-400">Service Charges</p>
                          <p className="text-base font-bold text-slate-800">${selectedBooking.total_service_charge || 0}</p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl">
                          <p className="text-xs text-slate-400">Distance Logistics</p>
                          <p className="text-base font-bold text-slate-800">${selectedBooking.total_distance_cost || 0}</p>
                        </div>
                      </div>
                      <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex justify-between items-center">
                        <span className="font-bold text-emerald-900">Total Booking Cost</span>
                        <span className="text-2xl font-bold text-emerald-700">${selectedBooking.total_cost || 0}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="p-4 bg-white border-t border-slate-100 flex justify-end shrink-0">
                  <button
                    onClick={handleCloseModal}
                    className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                  >
                    Close Details
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Bookings;