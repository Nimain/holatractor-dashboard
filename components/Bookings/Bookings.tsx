"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import MoreVertIcon from "@mui/icons-material/MoreVert";
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
        setAllBookings(res.data);
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

      const lowerDuration = duration.toLowerCase().trim();
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

  const DetailRow = ({ label, value, fullWidth = false }: any) => (
    <div className={fullWidth ? "w-full" : "w-1/2"}>
      <p className="text-gray-600 text-sm font-semibold mb-1">{label}</p>
      <p className="text-base break-words">
        {value || "Information not present"}
      </p>
    </div>
  );

  return (
    <div className="py-[40px] w-full">
      <Backdrop
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading}
      >
        {loading && <CircularProgress />}
      </Backdrop>

      <div className="w-full flex items-center justify-between gap-[20px] mb-[40px]">
        <p className="text-[20px] font-bold">
          Total Bookings: {allBookings.length}
        </p>
        <NewBooking />
      </div>

      <div className="text-[20px] font-[600] flex items-center justify-between gap-[10px] bg-[#ededed] p-[20px] rounded cursor-pointer">
        <p className="w-[50px] relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400">
          Sn
        </p>

        <div
          className="w-[180px] relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400 flex items-center justify-between group"
          onMouseEnter={() => setActiveHover("Booking ID")}
          onMouseLeave={() => setActiveHover("")}
        >
          <p>{activeHover === "Booking ID" ? "Book..." : "Booking ID"}</p>
          <div className="flex items-center gap-[6px] opacity-0 transition-all duration-500 group-hover:opacity-100">
            <div className="rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all duration-500 hover:bg-gray-300">
              <ArrowUpwardIcon fontSize="small" />
            </div>
            <div className="rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all duration-500 hover:bg-gray-300">
              <MoreVertIcon fontSize="small" />
            </div>
          </div>
        </div>

        <div className="w-[110px] relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400 flex items-center justify-between group">
          Start Date
          <div className="flex items-center gap-[6px] opacity-0 transition-all duration-500 group-hover:opacity-100">
            <div className="rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all duration-500 hover:bg-gray-300">
              <ArrowUpwardIcon fontSize="small" />
            </div>
            <div className="rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all duration-500 hover:bg-gray-300">
              <MoreVertIcon fontSize="small" />
            </div>
          </div>
        </div>

        <div
          className="w-[100px] relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400 flex items-center justify-between group whitespace-nowrap"
          onMouseEnter={() => setActiveHover("Duration")}
          onMouseLeave={() => setActiveHover("")}
        >
          <p>{activeHover === "Duration" ? "Dur..." : "Duration"}</p>
          <div className="flex items-center gap-[6px] opacity-0 transition-all duration-500 group-hover:opacity-100">
            <div className="rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all duration-500 hover:bg-gray-300">
              <ArrowUpwardIcon fontSize="small" />
            </div>
            <div className="rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all duration-500 hover:bg-gray-300">
              <MoreVertIcon fontSize="small" />
            </div>
          </div>
        </div>

        <div className="w-[100px] relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400 flex items-center justify-between group">
          Value
          <div className="flex items-center gap-[6px] opacity-0 transition-all duration-500 group-hover:opacity-100">
            <div className="rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all duration-500 hover:bg-gray-300">
              <ArrowUpwardIcon fontSize="small" />
            </div>
            <div className="rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all duration-500 hover:bg-gray-300">
              <MoreVertIcon fontSize="small" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-[5px] mt-[20px]">
        {allBookings.length === 0 ? (
          <div className="w-full h-full min-h-[80vh] flex items-center justify-center">
            <Image
              src={NullImage}
              alt="No bookings found"
              className="w-[400px] lg:w-[700px] h-auto object-cover"
              width={400}
              height={400}
              unoptimized={true}
            />
          </div>
        ) : (
          allBookings.map((details, index) => (
            <div
              onClick={() => handleBookingClick(details.id)}
              className="text-[18px] flex items-center justify-between gap-[10px] px-[20px] py-[20px] rounded cursor-pointer bg-[#ededed] hover:bg-white transition-all duration-500"
              key={index}
            >
              <p className="w-[50px]">{index + 1}</p>
              <p className="w-[180px] truncate" title={details.id}>
                {formatId(details.id)}
              </p>
              <div className="w-[110px]">{formatDate(details.start_date)}</div>
              <p className="w-[100px]">
                {formatDuration(details.booking_hours)}
              </p>
              <p className="w-[100px]">${details.total_cost}</p>
            </div>
          ))
        )}
      </div>

      {/* Clean White Modal */}
      {openModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center overflow-y-auto"
          onClick={handleCloseModal}
          style={{ animation: "fadeIn 0.3s ease-out" }}
        >
          <style jsx>{`
            @keyframes fadeIn {
              from {
                opacity: 0;
              }
              to {
                opacity: 1;
              }
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
            className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl my-8"
            onClick={(e) => e.stopPropagation()}
            style={{
              animation: "slideUp 0.4s ease-out",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
            }}
          >
            {selectedBooking && (
              <div className="flex flex-col h-full">
                {/* Clean White Header */}
                <div className="relative bg-white border-b-2 border-gray-200 p-8">
                  <div className="flex items-center justify-between mb-4">
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                      <span className="text-4xl">📋</span>
                      Booking Details
                    </h1>
                    <button
                      onClick={handleCloseModal}
                      className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition-all duration-300 hover:rotate-90 text-xl font-bold"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="text-gray-600 text-sm font-medium">
                    ID: {formatId(selectedBooking.id)}
                  </p>

                  {/* Tab Navigation */}
                  <div className="mt-6">
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
                          className={`px-5 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                            activeTab === tab.key
                              ? "bg-gray-800 text-white shadow-lg"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          <span className="text-lg">{tab.icon}</span>
                          <span className="hidden sm:inline">{tab.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
                  {/* Booking Details Tab */}
                  {activeTab === "booking" && (
                    <div
                      className="space-y-6"
                      style={{ animation: "fadeIn 0.3s ease-out" }}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            value: selectedBooking.end_date
                              ? formatDate(selectedBooking.end_date)
                              : "N/A",
                          },
                          {
                            icon: "⏱️",
                            iconColor: "text-purple-600",
                            label: "Duration",
                            value: formatDuration(
                              selectedBooking.booking_hours
                            ),
                          },
                        ].map((item, idx) => (
                          <div
                            key={idx}
                            className="bg-white rounded-xl p-6 hover:shadow-lg transition-all duration-300 border-2 border-gray-200"
                          >
                            <p className="text-sm font-semibold text-gray-500 mb-2 flex items-center gap-2">
                              <span className={item.iconColor}>
                                {item.icon}
                              </span>{" "}
                              {item.label}
                            </p>
                            <p
                              className={`text-lg font-bold text-gray-800 ${
                                item.breakAll ? "break-all" : ""
                              }`}
                            >
                              {item.value}
                            </p>
                          </div>
                        ))}

                        <div className="bg-white rounded-xl p-6 hover:shadow-lg transition-all duration-300 border-2 border-gray-200">
                          <p className="text-sm font-semibold text-gray-500 mb-2 flex items-center gap-2">
                            <span className="text-yellow-600">📊</span> Status
                          </p>
                          <p className="text-lg font-bold text-gray-800">
                            <span
                              className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${
                                selectedBooking.booking_status === "FINISHED"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              {selectedBooking.booking_status === "FINISHED"
                                ? "Finished"
                                : selectedBooking.booking_status || "N/A"}
                            </span>
                          </p>
                        </div>

                        <div className="bg-white rounded-xl p-6 hover:shadow-lg transition-all duration-300 border-2 border-gray-200">
                          <p className="text-sm font-semibold text-gray-500 mb-2 flex items-center gap-2">
                            <span className="text-green-600">💰</span> Total
                            Cost
                          </p>
                          <p className="text-2xl font-bold text-green-600">
                            ${selectedBooking.total_cost}
                          </p>
                        </div>

                        <div className="bg-white rounded-xl p-6 hover:shadow-lg transition-all duration-300 border-2 border-gray-200">
                          <p className="text-sm font-semibold text-gray-500 mb-2 flex items-center gap-2">
                            <span className="text-orange-600">🚜</span>{" "}
                            Equipment Type
                          </p>
                          <p className="text-lg font-bold text-gray-800">
                            {selectedBooking.equipment_type || "N/A"}
                          </p>
                        </div>

                        <div className="bg-white rounded-xl p-6 hover:shadow-lg transition-all duration-300 border-2 border-gray-200">
                          <p className="text-sm font-semibold text-gray-500 mb-2 flex items-center gap-2">
                            <span className="text-blue-600">🔢</span> Equipment
                            Count
                          </p>
                          <p className="text-lg font-bold text-gray-800">
                            {selectedBooking.equipment_count || "N/A"}
                          </p>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl p-6 hover:shadow-lg transition-all duration-300 border-2 border-gray-200">
                        <p className="text-sm font-semibold text-gray-500 mb-2 flex items-center gap-2">
                          <span className="text-red-600">📍</span> Booking
                          Location
                        </p>
                        <p className="text-lg font-bold text-gray-800">
                          {selectedBooking.booking_location ||
                            "Information not present"}
                        </p>
                      </div>

                      <div className="bg-white rounded-xl p-6 hover:shadow-lg transition-all duration-300 border-2 border-gray-200">
                        <p className="text-sm font-semibold text-gray-500 mb-2 flex items-center gap-2">
                          <span className="text-indigo-600">📝</span>{" "}
                          Description
                        </p>
                        <p className="text-base text-gray-700 leading-relaxed">
                          {selectedBooking.description ||
                            "Information not present"}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Farmer Details Tab */}
                  {activeTab === "farmer" && (
                    <div style={{ animation: "fadeIn 0.3s ease-out" }}>
                      {selectedBooking.farmer_id ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {[
                            {
                              icon: "🆔",
                              iconColor: "text-blue-600",
                              label: "Farmer ID",
                              value: selectedBooking.farmer_id,
                              breakAll: true,
                            },
                            {
                              icon: "👨‍🌾",
                              iconColor: "text-green-600",
                              label: "Name",
                              value: selectedBooking.farmer_name || "N/A",
                            },
                            {
                              icon: "📧",
                              iconColor: "text-purple-600",
                              label: "Email",
                              value: selectedBooking.farmer_email || "N/A",
                              breakAll: true,
                            },
                            {
                              icon: "📱",
                              iconColor: "text-orange-600",
                              label: "Phone",
                              value: selectedBooking.farmer_phone || "N/A",
                            },
                          ].map((item, idx) => (
                            <div
                              key={idx}
                              className="bg-white rounded-xl p-6 hover:shadow-lg transition-all duration-300 border-2 border-gray-200"
                            >
                              <p className="text-sm font-semibold text-gray-500 mb-2 flex items-center gap-2">
                                <span className={item.iconColor}>
                                  {item.icon}
                                </span>{" "}
                                {item.label}
                              </p>
                              <p
                                className={`text-lg font-bold text-gray-800 ${
                                  item.breakAll ? "break-all" : ""
                                }`}
                              >
                                {item.value}
                              </p>
                            </div>
                          ))}

                          <div className="bg-white rounded-xl p-6 hover:shadow-lg transition-all duration-300 border-2 border-gray-200 md:col-span-2">
                            <p className="text-sm font-semibold text-gray-500 mb-2 flex items-center gap-2">
                              <span className="text-red-600">📍</span> Location
                            </p>
                            <p className="text-lg font-bold text-gray-800">
                              {selectedBooking.farmer_location || "N/A"}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-gray-400 bg-white rounded-xl border-2 border-gray-200">
                          <span className="text-6xl mb-4">🚫</span>
                          <p className="text-xl font-semibold">
                            Information not present
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Store Details Tab */}
                  {activeTab === "store" && (
                    <div style={{ animation: "fadeIn 0.3s ease-out" }}>
                      {selectedBooking.store_id ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {[
                            {
                              icon: "🆔",
                              iconColor: "text-blue-600",
                              label: "Store ID",
                              value: selectedBooking.store_id,
                              breakAll: true,
                            },
                            {
                              icon: "🏪",
                              iconColor: "text-green-600",
                              label: "Store Name",
                              value: selectedBooking.store_name || "N/A",
                            },
                            {
                              icon: "📧",
                              iconColor: "text-purple-600",
                              label: "Email",
                              value: selectedBooking.store_email || "N/A",
                              breakAll: true,
                            },
                            {
                              icon: "📱",
                              iconColor: "text-orange-600",
                              label: "Phone",
                              value: selectedBooking.store_phone || "N/A",
                            },
                          ].map((item, idx) => (
                            <div
                              key={idx}
                              className="bg-white rounded-xl p-6 hover:shadow-lg transition-all duration-300 border-2 border-gray-200"
                            >
                              <p className="text-sm font-semibold text-gray-500 mb-2 flex items-center gap-2">
                                <span className={item.iconColor}>
                                  {item.icon}
                                </span>{" "}
                                {item.label}
                              </p>
                              <p
                                className={`text-lg font-bold text-gray-800 ${
                                  item.breakAll ? "break-all" : ""
                                }`}
                              >
                                {item.value}
                              </p>
                            </div>
                          ))}

                          <div className="bg-white rounded-xl p-6 hover:shadow-lg transition-all duration-300 border-2 border-gray-200 md:col-span-2">
                            <p className="text-sm font-semibold text-gray-500 mb-2 flex items-center gap-2">
                              <span className="text-red-600">📍</span> Address
                            </p>
                            <p className="text-lg font-bold text-gray-800">
                              {selectedBooking.store_address || "N/A"}
                            </p>
                          </div>

                          <div className="bg-white rounded-xl p-6 hover:shadow-lg transition-all duration-300 border-2 border-gray-200">
                            <p className="text-sm font-semibold text-gray-500 mb-2 flex items-center gap-2">
                              <span className="text-blue-600">🏙️</span> City
                            </p>
                            <p className="text-lg font-bold text-gray-800">
                              {selectedBooking.store_city || "N/A"}
                            </p>
                          </div>

                          <div className="bg-white rounded-xl p-6 hover:shadow-lg transition-all duration-300 border-2 border-gray-200">
                            <p className="text-sm font-semibold text-gray-500 mb-2 flex items-center gap-2">
                              <span className="text-indigo-600">🗺️</span> State
                            </p>
                            <p className="text-lg font-bold text-gray-800">
                              {selectedBooking.store_state || "N/A"}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-gray-400 bg-white rounded-xl border-2 border-gray-200">
                          <span className="text-6xl mb-4">🚫</span>
                          <p className="text-xl font-semibold">
                            Information not present
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Store Owner Tab */}
                  {activeTab === "owner" && (
                    <div style={{ animation: "fadeIn 0.3s ease-out" }}>
                      {selectedBooking.store_owner_id ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {[
                            {
                              icon: "🆔",
                              iconColor: "text-blue-600",
                              label: "Owner ID",
                              value: selectedBooking.store_owner_id,
                              breakAll: true,
                            },
                            {
                              icon: "👤",
                              iconColor: "text-green-600",
                              label: "Owner Name",
                              value: selectedBooking.store_owner_name || "N/A",
                            },
                            {
                              icon: "📧",
                              iconColor: "text-purple-600",
                              label: "Email",
                              value: selectedBooking.store_owner_email || "N/A",
                              breakAll: true,
                            },
                            {
                              icon: "📱",
                              iconColor: "text-orange-600",
                              label: "Phone",
                              value: selectedBooking.store_owner_phone || "N/A",
                            },
                          ].map((item, idx) => (
                            <div
                              key={idx}
                              className="bg-white rounded-xl p-6 hover:shadow-lg transition-all duration-300 border-2 border-gray-200"
                            >
                              <p className="text-sm font-semibold text-gray-500 mb-2 flex items-center gap-2">
                                <span className={item.iconColor}>
                                  {item.icon}
                                </span>{" "}
                                {item.label}
                              </p>
                              <p
                                className={`text-lg font-bold text-gray-800 ${
                                  item.breakAll ? "break-all" : ""
                                }`}
                              >
                                {item.value}
                              </p>
                            </div>
                          ))}

                          <div className="bg-white rounded-xl p-6 hover:shadow-lg transition-all duration-300 border-2 border-gray-200 md:col-span-2">
                            <p className="text-sm font-semibold text-gray-500 mb-2 flex items-center gap-2">
                              <span className="text-red-600">📍</span> Address
                            </p>
                            <p className="text-lg font-bold text-gray-800">
                              {selectedBooking.store_owner_address || "N/A"}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-gray-400 bg-white rounded-xl border-2 border-gray-200">
                          <span className="text-6xl mb-4">🚫</span>
                          <p className="text-xl font-semibold">
                            Information not present
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Payment & Rating Tab */}
                  {activeTab === "payment" && (
                    <div
                      className="space-y-6"
                      style={{ animation: "fadeIn 0.3s ease-out" }}
                    >
                      {/* Payment Details Section */}
                      <div className="bg-white rounded-2xl p-6 border-2 border-gray-200">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-800">
                          <span className="text-2xl">💳</span> Payment Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-gray-50 rounded-xl p-4 hover:shadow-md transition-all duration-300 border border-gray-200">
                            <p className="text-sm font-semibold text-gray-500 mb-2 flex items-center gap-2">
                              <span className="text-blue-600">📊</span> Payment
                              Status
                            </p>
                            <p className="text-lg font-bold">
                              <span
                                className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${
                                  selectedBooking.payment_status === "COMPLETED"
                                    ? "bg-green-100 text-green-700"
                                    : selectedBooking.payment_status ===
                                      "PENDING"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-gray-100 text-gray-700"
                                }`}
                              >
                                {selectedBooking.payment_status || "Pending"}
                              </span>
                            </p>
                          </div>

                          <div className="bg-gray-50 rounded-xl p-4 hover:shadow-md transition-all duration-300 border border-gray-200">
                            <p className="text-sm font-semibold text-gray-500 mb-2 flex items-center gap-2">
                              <span className="text-purple-600">💰</span>{" "}
                              Payment Method
                            </p>
                            <p className="text-lg font-bold text-gray-800">
                              {selectedBooking.payment_method || "N/A"}
                            </p>
                          </div>

                          <div className="bg-gray-50 rounded-xl p-4 hover:shadow-md transition-all duration-300 border border-gray-200">
                            <p className="text-sm font-semibold text-gray-500 mb-2 flex items-center gap-2">
                              <span className="text-orange-600">🔖</span>{" "}
                              Transaction ID
                            </p>
                            <p className="text-sm font-bold text-gray-800 break-all">
                              {selectedBooking.transaction_id || "N/A"}
                            </p>
                          </div>

                          <div className="bg-gray-50 rounded-xl p-4 hover:shadow-md transition-all duration-300 border border-gray-200">
                            <p className="text-sm font-semibold text-gray-500 mb-2 flex items-center gap-2">
                              <span className="text-green-600">💵</span> Amount
                              Paid
                            </p>
                            <p className="text-2xl font-bold text-green-600">
                              {selectedBooking.amount_paid
                                ? `${selectedBooking.amount_paid}`
                                : "N/A"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Rating & Review Section */}
                      <div className="bg-white rounded-2xl p-6 border-2 border-gray-200">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-800">
                          <span className="text-2xl">⭐</span> Rating & Review
                        </h3>
                        {selectedBooking.rating &&
                        selectedBooking.rating.length > 0 ? (
                          <div className="space-y-4">
                            {selectedBooking.rating.map(
                              (ratingItem: any, idx: number) => (
                                <div
                                  key={idx}
                                  className="bg-gray-50 rounded-xl p-6 hover:shadow-md transition-all duration-300 border border-gray-200"
                                >
                                  <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                      <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-white font-bold text-xl">
                                        {ratingItem.rating || "?"}
                                      </div>
                                      <div>
                                        <div className="flex items-center gap-1 mb-1">
                                          {[...Array(5)].map((_, i) => (
                                            <span
                                              key={i}
                                              className={`text-lg ${
                                                i < (ratingItem.rating || 0)
                                                  ? "text-yellow-400"
                                                  : "text-gray-300"
                                              }`}
                                            >
                                              ⭐
                                            </span>
                                          ))}
                                        </div>
                                        <p className="text-sm text-gray-500">
                                          {ratingItem.rating
                                            ? `${ratingItem.rating} out of 5 stars`
                                            : "Not rated"}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-xs text-gray-400 mb-1">
                                        Reviewer
                                      </p>
                                      <p className="text-sm font-semibold text-gray-700">
                                        {ratingItem.user_id
                                          ?.slice(0, 8)
                                          .toUpperCase() || "Anonymous"}
                                      </p>
                                    </div>
                                  </div>

                                  {ratingItem.review && (
                                    <div className="bg-white rounded-lg p-4 mb-3 border border-gray-200">
                                      <p className="text-gray-700 leading-relaxed italic">
                                        &ldquo;{ratingItem.review}&rdquo;
                                      </p>
                                    </div>
                                  )}

                                  <div className="flex items-center gap-2 text-xs text-gray-400">
                                    <span>📅</span>
                                    <span>
                                      Reviewed on{" "}
                                      {ratingItem.createdAt
                                        ? formatDate(ratingItem.createdAt)
                                        : "Unknown date"}
                                    </span>
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-12 text-gray-400 bg-gray-50 rounded-xl border border-gray-200">
                            <span className="text-6xl mb-4">📝</span>
                            <p className="text-xl font-semibold">
                              No reviews yet
                            </p>
                            <p className="text-sm mt-2">
                              Be the first to leave a review!
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Button */}
                <div className="sticky bottom-0 bg-white border-t-2 border-gray-200 p-6">
                  <button
                    onClick={handleCloseModal}
                    className="w-full bg-gray-800 hover:bg-gray-900 text-white py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3"
                  >
                    <span className="text-2xl">✓</span>
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