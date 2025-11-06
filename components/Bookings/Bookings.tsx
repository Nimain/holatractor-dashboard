"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { renderInstance } from "@/utils/Axios/RenderInstance";
import { errorMessage } from "@/utils/Toastify/Messages";
import { Booking } from "@/utils/Types/types";
import { Backdrop, CircularProgress } from "@mui/material";
import NewBooking from "./NewBooking";
import Image from "next/image";
import NullImage from "@/assets/AnimateIcons/Tractor.svg";
import { useCookie } from "next-cookie";

const Bookings = () => {
  const [activeHover, setActiveHover] = useState("");
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [openModal, setOpenModal] = useState(false);
  const [activeTab, setActiveTab] = useState("booking");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;

  const router = useRouter();
  const { cookie } = useCookie();
  const access_token = cookie.get("access_token");

  function fetchBookings() {
    if (!access_token) {
      errorMessage("User not authenticated.");
      setLoading(false);
      router.push("/login");
      return;
    }

    setLoading(true);
    renderInstance
      .get("/booking", {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      })
      .then((res) => {
        const sortedBookings = [...res.data].sort((a, b) => {
          const dateA = new Date(a.createdAt || a.start_date).getTime();
          const dateB = new Date(b.createdAt || b.start_date).getTime();
          return dateB - dateA;
        });
        setAllBookings(sortedBookings);
      })
      .catch((err) => {
        if (err.response && err.response.status === 401) {
          errorMessage("Your session has expired. Please log in again.");
          cookie.remove("access_token");
          router.push("/login");
        } else {
          errorMessage("Error fetching booking list");
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }

  useEffect(() => {
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [access_token, router]);

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
      return durationMap[lowerDuration] || duration;
    }

    return `${duration} days`;
  };

  const handleBookingClick = async (bookingId: string) => {
    if (!access_token) {
      errorMessage("User not authenticated.");
      router.push("/login");
      return;
    }

    try {
      setLoading(true);
      setActiveTab("booking");
      const res = await renderInstance.get(`/booking/${bookingId}`, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });
      setSelectedBooking(res.data);
      setOpenModal(true);
    } catch (err: any) {
      if (err.response && err.response.status === 401) {
        errorMessage("Your session has expired. Please log in again.");
        cookie.remove("access_token");
        router.push("/login");
      } else {
        errorMessage("Error fetching booking details");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedBooking(null);
    setActiveTab("booking");
  };

  // Pagination calculations
  const totalPages = Math.ceil(allBookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentBookings = allBookings.slice(startIndex, endIndex);

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
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
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

      <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-10">
        <p className="text-lg md:text-xl font-bold">
          Total Bookings: {allBookings.length}
        </p>
        <NewBooking />
      </div>

      {/* Desktop Table Header */}
      <div className="hidden lg:flex text-base md:text-lg font-semibold items-center justify-between gap-3 bg-[#ededed] p-4 md:p-5 rounded cursor-pointer">
        <p className="w-12 relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400">
          Sn
        </p>

        <div className="w-44 relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400 flex items-center justify-between group">
          <p>Booking ID</p>
        </div>

        <div className="w-28 relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400">
          Start Date
        </div>

        <div className="w-24 relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400">
          Duration
        </div>

        <div className="w-24 relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400">
          Value
        </div>
      </div>

      <div className="flex flex-col gap-3 mt-4 md:mt-5">
        {allBookings.length === 0 ? (
          <div className="w-full h-full min-h-[60vh] flex items-center justify-center">
            <Image
              src={NullImage}
              alt="No bookings found"
              className="w-64 md:w-96 lg:w-[500px] h-auto object-cover"
              width={400}
              height={400}
              unoptimized={true}
            />
          </div>
        ) : (
          <>
            {currentBookings.map((details, index) => (
              <div
                onClick={() => handleBookingClick(details.id)}
                className="bg-[#ededed] hover:bg-white transition-all duration-300 rounded-lg cursor-pointer"
                key={details.id}
              >
                {/* Desktop View */}
                <div className="hidden lg:flex text-base items-center justify-between gap-3 px-5 py-4">
                  <p className="w-12">{startIndex + index + 1}</p>
                  <p className="w-44 truncate" title={details.id}>
                    {formatId(details.id)}
                  </p>
                  <div className="w-28">{formatDate(details.start_date)}</div>
                  <p className="w-24">{formatDuration(details.booking_hours)}</p>
                  <p className="w-24">${details.total_cost}</p>
                </div>

                {/* Mobile View */}
                <div className="lg:hidden p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-xs text-gray-600 mb-1">Booking #{startIndex + index + 1}</p>
                      <p className="text-sm font-semibold truncate" title={details.id}>
                        {formatId(details.id)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-600 mb-1">Value</p>
                      <p className="text-lg font-bold text-green-600">${details.total_cost}</p>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-gray-300">
                    <div>
                      <p className="text-xs text-gray-600">Start Date</p>
                      <p className="font-medium">{formatDate(details.start_date)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-600">Duration</p>
                      <p className="font-medium">{formatDuration(details.booking_hours)}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8 mb-4">
                <button
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 ${
                    currentPage === 1
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-gray-800 text-white hover:bg-gray-900"
                  }`}
                >
                  <ChevronLeftIcon />
                  <span className="hidden sm:inline">Previous</span>
                </button>

                <div className="flex items-center gap-2 flex-wrap justify-center">
                  {getPageNumbers().map((page, index) => (
                    <button
                      key={index}
                      onClick={() => typeof page === "number" && handlePageClick(page)}
                      disabled={page === "..."}
                      className={`min-w-[40px] h-[40px] rounded-lg font-semibold transition-all duration-300 ${
                        page === currentPage
                          ? "bg-gray-800 text-white shadow-lg"
                          : page === "..."
                          ? "bg-transparent text-gray-400 cursor-default"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 ${
                    currentPage === totalPages
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-gray-800 text-white hover:bg-gray-900"
                  }`}
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRightIcon />
                </button>
              </div>
            )}

            <div className="text-center text-gray-600 text-sm mt-2">
              Showing {startIndex + 1} to {Math.min(endIndex, allBookings.length)} of {allBookings.length} bookings
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      {openModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center overflow-y-auto p-4"
          onClick={handleCloseModal}
          style={{ animation: "fadeIn 0.3s ease-out" }}
        >
          <style jsx>{`
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes slideUp {
              from {
                opacity: 0;
                transform: translateY(20px) scale(0.95);
              }
              to {
                opacity: 1;
                transform: translateY(0) scale(1);
              }
            }
          `}</style>

          <div
            className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl my-8 flex flex-col"
            onClick={(e) => e.stopPropagation()}
            style={{
              animation: "slideUp 0.4s ease-out",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
              maxHeight: "calc(100vh - 4rem)",
            }}
          >
            {selectedBooking && (
              <div className="flex flex-col h-full">
                {/* Header - Sticky */}
                <div className="relative bg-white border-b-2 border-gray-200 p-4 md:p-8 flex-shrink-0">
                  <div className="flex items-center justify-between mb-4">
                    <h1 className="text-xl md:text-3xl font-bold text-gray-800 flex items-center gap-2 md:gap-3">
                      <span className="text-2xl md:text-4xl">📋</span>
                      <span className="hidden sm:inline">Booking Details</span>
                      <span className="sm:hidden">Details</span>
                    </h1>
                    <button
                      onClick={handleCloseModal}
                      className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition-all duration-300 hover:rotate-90 text-xl font-bold"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="text-gray-600 text-xs md:text-sm font-medium break-all">
                    ID: {selectedBooking.id}
                  </p>

                  {/* Tab Navigation */}
                  <div className="mt-4 md:mt-6">
                    <div className="flex gap-2 flex-wrap">
                      {[
                        { key: "booking", icon: "📅", label: "Booking" },
                        { key: "farmer", icon: "👨‍🌾", label: "Farmer" },
                        { key: "store", icon: "🏪", label: "Store" },
                        { key: "owner", icon: "👤", label: "Owner" },
                        { key: "payment", icon: "💳", label: "Payment" },
                      ].map((tab) => (
                        <button
                          key={tab.key}
                          onClick={() => setActiveTab(tab.key)}
                          className={`px-3 md:px-5 py-2 md:py-3 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 text-sm md:text-base ${
                            activeTab === tab.key
                              ? "bg-gray-800 text-white shadow-lg"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          <span className="text-base md:text-lg">{tab.icon}</span>
                          <span>{tab.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50" style={{ maxHeight: "calc(100vh - 20rem)" }}>
                  {/* Booking Details Tab */}
                  {activeTab === "booking" && (
                    <div className="space-y-4 md:space-y-6" style={{ animation: "fadeIn 0.3s ease-out" }}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                        {[
                          {
                            icon: "🆔",
                            iconColor: "text-blue-600",
                            label: "Booking ID",
                            value: selectedBooking.id || "N/A",
                            breakAll: true,
                          },
                          {
                            icon: "📅",
                            iconColor: "text-green-600",
                            label: "Start Date",
                            value: formatDate(selectedBooking.start_date),
                          },
                          {
                            icon: "📅",
                            iconColor: "text-red-600",
                            label: "End Date",
                            value: selectedBooking.end_date ? formatDate(selectedBooking.end_date) : "N/A",
                          },
                          {
                            icon: "⏱️",
                            iconColor: "text-purple-600",
                            label: "Duration",
                            value: formatDuration(selectedBooking.booking_hours),
                          },
                        ].map((item, idx) => (
                          <div
                            key={idx}
                            className="bg-white rounded-xl p-4 md:p-6 hover:shadow-lg transition-all duration-300 border-2 border-gray-200"
                          >
                            <p className="text-xs md:text-sm font-semibold text-gray-500 mb-2 flex items-center gap-2">
                              <span className={item.iconColor}>{item.icon}</span> {item.label}
                            </p>
                            <p className={`text-sm md:text-lg font-bold text-gray-800 ${item.breakAll ? "break-all" : ""}`}>
                              {item.value}
                            </p>
                          </div>
                        ))}

                        <div className="bg-white rounded-xl p-4 md:p-6 hover:shadow-lg transition-all duration-300 border-2 border-gray-200">
                          <p className="text-xs md:text-sm font-semibold text-gray-500 mb-2 flex items-center gap-2">
                            <span className="text-yellow-600">📊</span> Status
                          </p>
                          <p className="text-sm md:text-lg font-bold text-gray-800">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs md:text-sm font-bold ${
                              selectedBooking.bookingStatus === "Finished"
                                ? "bg-green-100 text-green-700"
                                : "bg-blue-100 text-blue-700"
                            }`}>
                              {selectedBooking.bookingStatus || "N/A"}
                            </span>
                          </p>
                        </div>

                        <div className="bg-white rounded-xl p-4 md:p-6 hover:shadow-lg transition-all duration-300 border-2 border-gray-200">
                          <p className="text-xs md:text-sm font-semibold text-gray-500 mb-2 flex items-center gap-2">
                            <span className="text-green-600">💰</span> Total Cost
                          </p>
                          <p className="text-xl md:text-2xl font-bold text-green-600">
                            ${selectedBooking.total_cost}
                          </p>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl p-4 md:p-6 hover:shadow-lg transition-all duration-300 border-2 border-gray-200">
                        <p className="text-xs md:text-sm font-semibold text-gray-500 mb-2 flex items-center gap-2">
                          <span className="text-red-600">📍</span> Farm Details
                        </p>
                        <p className="text-sm md:text-lg font-bold text-gray-800">
                          {selectedBooking.farm?.name || "N/A"} 
                          {selectedBooking.farm?.type && ` (${selectedBooking.farm.type})`}
                        </p>
                        {selectedBooking.farm?.description && (
                          <p className="text-xs md:text-sm text-gray-600 mt-2">
                            {selectedBooking.farm.description}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Farmer Details Tab */}
                  {activeTab === "farmer" && (
                    <div style={{ animation: "fadeIn 0.3s ease-out" }}>
                      {selectedBooking.user && selectedBooking.user.Farmer && selectedBooking.user.Farmer.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                          {[
                            {
                              icon: "🆔",
                              iconColor: "text-blue-600",
                              label: "Farmer ID",
                              value: selectedBooking.user.id,
                              breakAll: true,
                            },
                            {
                              icon: "👨‍🌾",
                              iconColor: "text-green-600",
                              label: "Name",
                              value: `${selectedBooking.user.first_name || ""} ${selectedBooking.user.middle_name || ""} ${selectedBooking.user.last_name || ""}`.trim() || "N/A",
                            },
                            {
                              icon: "📧",
                              iconColor: "text-purple-600",
                              label: "Email",
                              value: selectedBooking.user.email || "N/A",
                              breakAll: true,
                            },
                            {
                              icon: "📱",
                              iconColor: "text-orange-600",
                              label: "Phone",
                              value: selectedBooking.user.mobile 
                                ? `${selectedBooking.user.country_code || ""}${selectedBooking.user.mobile}`
                                : "N/A",
                            },
                            {
                              icon: "💵",
                              iconColor: "text-green-600",
                              label: "Currency",
                              value: selectedBooking.user.Farmer[0]?.currency 
                                ? `${selectedBooking.user.Farmer[0].currency} (${selectedBooking.user.Farmer[0].currency_code})`
                                : "N/A",
                            },
                            {
                              icon: "📊",
                              iconColor: "text-blue-600",
                              label: "Status",
                              value: selectedBooking.user.Farmer[0]?.Status === 1 ? "Active" : "Inactive",
                            },
                          ].map((item, idx) => (
                            <div
                              key={idx}
                              className="bg-white rounded-xl p-4 md:p-6 hover:shadow-lg transition-all duration-300 border-2 border-gray-200"
                            >
                              <p className="text-xs md:text-sm font-semibold text-gray-500 mb-2 flex items-center gap-2">
                                <span className={item.iconColor}>{item.icon}</span> {item.label}
                              </p>
                              <p className={`text-sm md:text-lg font-bold text-gray-800 ${item.breakAll ? "break-all" : ""}`}>
                                {item.value}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12 md:py-16 text-gray-400 bg-white rounded-xl border-2 border-gray-200">
                          <span className="text-4xl md:text-6xl mb-4">🚫</span>
                          <p className="text-lg md:text-xl font-semibold">Information not present</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Store Details Tab */}
                  {activeTab === "store" && (
                    <div style={{ animation: "fadeIn 0.3s ease-out" }}>
                      {selectedBooking.store ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                          {[
                            {
                              icon: "🆔",
                              iconColor: "text-blue-600",
                              label: "Store ID",
                              value: selectedBooking.store.id,
                              breakAll: true,
                            },
                            {
                              icon: "🏪",
                              iconColor: "text-green-600",
                              label: "Store Name",
                              value: selectedBooking.store.name || "N/A",
                            },
                          ].map((item, idx) => (
                            <div
                              key={idx}
                              className="bg-white rounded-xl p-4 md:p-6 hover:shadow-lg transition-all duration-300 border-2 border-gray-200"
                            >
                              <p className="text-xs md:text-sm font-semibold text-gray-500 mb-2 flex items-center gap-2">
                                <span className={item.iconColor}>{item.icon}</span> {item.label}
                              </p>
                              <p className={`text-sm md:text-lg font-bold text-gray-800 ${item.breakAll ? "break-all" : ""}`}>
                                {item.value}
                              </p>
                            </div>
                          ))}

                          <div className="bg-white rounded-xl p-4 md:p-6 hover:shadow-lg transition-all duration-300 border-2 border-gray-200 md:col-span-2">
                            <p className="text-xs md:text-sm font-semibold text-gray-500 mb-2 flex items-center gap-2">
                              <span className="text-purple-600">📝</span> Description
                            </p>
                            <p className="text-sm md:text-base text-gray-700">
                              {selectedBooking.store.description || "N/A"}
                            </p>
                          </div>

                          {selectedBooking.store.location && (
                            <>
                              <div className="bg-white rounded-xl p-4 md:p-6 hover:shadow-lg transition-all duration-300 border-2 border-gray-200">
                                <p className="text-xs md:text-sm font-semibold text-gray-500 mb-2 flex items-center gap-2">
                                  <span className="text-blue-600">🏙️</span> City
                                </p>
                                <p className="text-sm md:text-lg font-bold text-gray-800">
                                  {selectedBooking.store.location.city || "N/A"}
                                </p>
                              </div>

                              <div className="bg-white rounded-xl p-4 md:p-6 hover:shadow-lg transition-all duration-300 border-2 border-gray-200">
                                <p className="text-xs md:text-sm font-semibold text-gray-500 mb-2 flex items-center gap-2">
                                  <span className="text-indigo-600">🗺️</span> State
                                </p>
                                <p className="text-sm md:text-lg font-bold text-gray-800">
                                  {selectedBooking.store.location.state || "N/A"}
                                </p>
                              </div>

                              <div className="bg-white rounded-xl p-4 md:p-6 hover:shadow-lg transition-all duration-300 border-2 border-gray-200">
                                <p className="text-xs md:text-sm font-semibold text-gray-500 mb-2 flex items-center gap-2">
                                  <span className="text-orange-600">📮</span> Zip Code
                                </p>
                                <p className="text-sm md:text-lg font-bold text-gray-800">
                                  {selectedBooking.store.location.zip_code || "N/A"}
                                </p>
                              </div>

                              <div className="bg-white rounded-xl p-4 md:p-6 hover:shadow-lg transition-all duration-300 border-2 border-gray-200">
                                <p className="text-xs md:text-sm font-semibold text-gray-500 mb-2 flex items-center gap-2">
                                  <span className="text-green-600">🌍</span> Country
                                </p>
                                <p className="text-sm md:text-lg font-bold text-gray-800">
                                  {selectedBooking.store.location.country || "N/A"}
                                </p>
                              </div>
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12 md:py-16 text-gray-400 bg-white rounded-xl border-2 border-gray-200">
                          <span className="text-4xl md:text-6xl mb-4">🚫</span>
                          <p className="text-lg md:text-xl font-semibold">Information not present</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Store Owner Tab */}
                  {activeTab === "owner" && (
                    <div style={{ animation: "fadeIn 0.3s ease-out" }}>
                      {selectedBooking.store?.owner ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                          {[
                            {
                              icon: "🆔",
                              iconColor: "text-blue-600",
                              label: "Owner ID",
                              value: selectedBooking.store.owner.id,
                              breakAll: true,
                            },
                            {
                              icon: "👤",
                              iconColor: "text-green-600",
                              label: "Owner Name",
                              value: selectedBooking.store.owner.user 
                                ? `${selectedBooking.store.owner.user.first_name || ""} ${selectedBooking.store.owner.user.middle_name || ""} ${selectedBooking.store.owner.user.last_name || ""}`.trim() 
                                : "N/A",
                            },
                            {
                              icon: "📧",
                              iconColor: "text-purple-600",
                              label: "Email",
                              value: selectedBooking.store.owner.user?.email || "N/A",
                              breakAll: true,
                            },
                            {
                              icon: "📱",
                              iconColor: "text-orange-600",
                              label: "Phone",
                              value: selectedBooking.store.owner.user?.mobile 
                                ? `${selectedBooking.store.owner.user.country_code || ""}${selectedBooking.store.owner.user.mobile}`
                                : "N/A",
                            },
                            {
                              icon: "📊",
                              iconColor: "text-blue-600",
                              label: "Status",
                              value: selectedBooking.store.owner.status === 1 ? "Active" : "Inactive",
                            },
                          ].map((item, idx) => (
                            <div
                              key={idx}
                              className="bg-white rounded-xl p-4 md:p-6 hover:shadow-lg transition-all duration-300 border-2 border-gray-200"
                            >
                              <p className="text-xs md:text-sm font-semibold text-gray-500 mb-2 flex items-center gap-2">
                                <span className={item.iconColor}>{item.icon}</span> {item.label}
                              </p>
                              <p className={`text-sm md:text-lg font-bold text-gray-800 ${item.breakAll ? "break-all" : ""}`}>
                                {item.value}
                              </p>
                            </div>
                          ))}

                          {selectedBooking.store.owner.user?.image && (
                            <div className="bg-white rounded-xl p-4 md:p-6 hover:shadow-lg transition-all duration-300 border-2 border-gray-200 md:col-span-2">
                              <p className="text-xs md:text-sm font-semibold text-gray-500 mb-3 flex items-center gap-2">
                                <span className="text-indigo-600">🖼️</span> Profile Image
                              </p>
                              <img 
                                src={selectedBooking.store.owner.user.image} 
                                alt="Owner Profile" 
                                className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-gray-200"
                              />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12 md:py-16 text-gray-400 bg-white rounded-xl border-2 border-gray-200">
                          <span className="text-4xl md:text-6xl mb-4">🚫</span>
                          <p className="text-lg md:text-xl font-semibold">Information not present</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Payment & Rating Tab */}
                  {activeTab === "payment" && (
                    <div className="space-y-4 md:space-y-6" style={{ animation: "fadeIn 0.3s ease-out" }}>
                      {/* Payment Details Section */}
                      <div className="bg-white rounded-2xl p-4 md:p-6 border-2 border-gray-200">
                        <h3 className="text-lg md:text-xl font-bold mb-4 flex items-center gap-2 text-gray-800">
                          <span className="text-xl md:text-2xl">💳</span> Payment Details
                        </h3>
                        {selectedBooking.payment && selectedBooking.payment.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                            {selectedBooking.payment.map((pay: any, idx: number) => (
                              <div key={idx} className="md:col-span-2 space-y-3">
                                <div className="bg-gray-50 rounded-xl p-4 hover:shadow-md transition-all duration-300 border border-gray-200">
                                  <p className="text-xs md:text-sm font-semibold text-gray-500 mb-2 flex items-center gap-2">
                                    <span className="text-blue-600">📊</span> Payment Status
                                  </p>
                                  <p className="text-sm md:text-lg font-bold">
                                    <span className={`inline-block px-3 py-1 rounded-full text-xs md:text-sm font-bold ${
                                      pay.payment_status === "COMPLETED"
                                        ? "bg-green-100 text-green-700"
                                        : pay.payment_status === "PENDING"
                                        ? "bg-yellow-100 text-yellow-700"
                                        : "bg-gray-100 text-gray-700"
                                    }`}>
                                      {pay.payment_status || "Pending"}
                                    </span>
                                  </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div className="bg-gray-50 rounded-xl p-4 hover:shadow-md transition-all duration-300 border border-gray-200">
                                    <p className="text-xs md:text-sm font-semibold text-gray-500 mb-2 flex items-center gap-2">
                                      <span className="text-purple-600">💰</span> Payment Method
                                    </p>
                                    <p className="text-sm md:text-lg font-bold text-gray-800">
                                      {pay.payment_method || "N/A"}
                                    </p>
                                  </div>

                                  <div className="bg-gray-50 rounded-xl p-4 hover:shadow-md transition-all duration-300 border border-gray-200">
                                    <p className="text-xs md:text-sm font-semibold text-gray-500 mb-2 flex items-center gap-2">
                                      <span className="text-green-600">💵</span> Amount Paid
                                    </p>
                                    <p className="text-xl md:text-2xl font-bold text-green-600">
                                      {pay.amount_paid ? `${pay.amount_paid}` : "N/A"}
                                    </p>
                                  </div>
                                </div>

                                <div className="bg-gray-50 rounded-xl p-4 hover:shadow-md transition-all duration-300 border border-gray-200">
                                  <p className="text-xs md:text-sm font-semibold text-gray-500 mb-2 flex items-center gap-2">
                                    <span className="text-orange-600">🔖</span> Transaction ID
                                  </p>
                                  <p className="text-xs md:text-sm font-bold text-gray-800 break-all">
                                    {pay.transaction_id || "N/A"}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-8 md:py-12 text-gray-400 bg-gray-50 rounded-xl border border-gray-200">
                            <span className="text-4xl md:text-5xl mb-3">💳</span>
                            <p className="text-base md:text-lg font-semibold">No payment information</p>
                          </div>
                        )}
                      </div>

                      {/* Cost Breakdown Section */}
                      <div className="bg-white rounded-2xl p-4 md:p-6 border-2 border-gray-200">
                        <h3 className="text-lg md:text-xl font-bold mb-4 flex items-center gap-2 text-gray-800">
                          <span className="text-xl md:text-2xl">💰</span> Cost Breakdown
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                          {[
                            { label: "Base Cost", value: selectedBooking.total_tractor_cost, icon: "🚜" },
                            { label: "Attachment Cost", value: selectedBooking.total_attachment_cost, icon: "🔧" },
                            { label: "Service Cost", value: selectedBooking.total_service_cost, icon: "⚙️" },
                            { label: "Service Charge", value: selectedBooking.total_service_charge, icon: "💼" },
                            { label: "Tax", value: selectedBooking.total_tax, icon: "🧾" },
                            { label: "Distance Cost", value: selectedBooking.total_distance_cost, icon: "📍" },
                          ].map((item, idx) => (
                            <div key={idx} className="bg-gray-50 rounded-xl p-4 hover:shadow-md transition-all duration-300 border border-gray-200">
                              <p className="text-xs md:text-sm font-semibold text-gray-500 mb-2 flex items-center gap-2">
                                <span>{item.icon}</span> {item.label}
                              </p>
                              <p className="text-base md:text-lg font-bold text-gray-800">
                                ${item.value || 0}
                              </p>
                            </div>
                          ))}
                          
                          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 hover:shadow-lg transition-all duration-300 border-2 border-green-200 md:col-span-2">
                            <p className="text-xs md:text-sm font-semibold text-green-700 mb-2 flex items-center gap-2">
                              <span>💵</span> Total Cost
                            </p>
                            <p className="text-2xl md:text-3xl font-bold text-green-600">
                              ${selectedBooking.total_cost}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Rating & Review Section */}
                      <div className="bg-white rounded-2xl p-4 md:p-6 border-2 border-gray-200">
                        <h3 className="text-lg md:text-xl font-bold mb-4 flex items-center gap-2 text-gray-800">
                          <span className="text-xl md:text-2xl">⭐</span> Rating & Review
                        </h3>
                        {selectedBooking.rating && selectedBooking.rating.length > 0 ? (
                          <div className="space-y-4">
                            {selectedBooking.rating.map((ratingItem: any, idx: number) => (
                              <div
                                key={idx}
                                className="bg-gray-50 rounded-xl p-4 md:p-6 hover:shadow-md transition-all duration-300 border border-gray-200"
                              >
                                <div className="flex flex-col sm:flex-row items-start justify-between mb-4 gap-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                                      {ratingItem.rating || "?"}
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-1 mb-1">
                                        {[...Array(5)].map((_, i) => (
                                          <span
                                            key={i}
                                            className={`text-base md:text-lg ${
                                              i < (ratingItem.rating || 0)
                                                ? "text-yellow-400"
                                                : "text-gray-300"
                                            }`}
                                          >
                                            ⭐
                                          </span>
                                        ))}
                                      </div>
                                      <p className="text-xs md:text-sm text-gray-500">
                                        {ratingItem.rating ? `${ratingItem.rating} out of 5 stars` : "Not rated"}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-left sm:text-right">
                                    <p className="text-xs text-gray-400 mb-1">Reviewer</p>
                                    <p className="text-xs md:text-sm font-semibold text-gray-700 break-all">
                                      {ratingItem.user_id?.slice(0, 8).toUpperCase() || "Anonymous"}
                                    </p>
                                  </div>
                                </div>

                                {ratingItem.review && (
                                  <div className="bg-white rounded-lg p-3 md:p-4 mb-3 border border-gray-200">
                                    <p className="text-xs md:text-sm text-gray-700 leading-relaxed italic">
                                      &ldquo;{ratingItem.review}&rdquo;
                                    </p>
                                  </div>
                                )}

                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                  <span>📅</span>
                                  <span>
                                    Reviewed on {ratingItem.createdAt ? formatDate(ratingItem.createdAt) : "Unknown date"}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-8 md:py-12 text-gray-400 bg-gray-50 rounded-xl border border-gray-200">
                            <span className="text-4xl md:text-6xl mb-4">📝</span>
                            <p className="text-base md:text-xl font-semibold">No reviews yet</p>
                            <p className="text-xs md:text-sm mt-2">Be the first to leave a review!</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Button - Sticky */}
                <div className="sticky bottom-0 bg-white border-t-2 border-gray-200 p-4 md:p-6 flex-shrink-0">
                  <button
                    onClick={handleCloseModal}
                    className="w-full bg-gray-800 hover:bg-gray-900 text-white py-3 md:py-4 px-4 md:px-6 rounded-xl font-bold text-base md:text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3"
                  >
                    <span className="text-xl md:text-2xl">✓</span>
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