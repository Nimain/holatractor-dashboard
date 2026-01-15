"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { renderInstance } from "@/utils/Axios/RenderInstance";
import { useCookie } from "next-cookie";
import { errorMessage, successMessage } from "@/utils/Toastify/Messages";
import { CircularProgress } from "@mui/material";
import {
  Trash2,
  TrendingUp,
  Phone,
  Mail,
  Download,
  AlertCircle,
  Menu,
  X,
  MessageSquare,
} from "lucide-react";
import Image from "next/image";

// *** ADMIN API PATHS ***
const SUMMARY_PATH = (id: string) => `/admin/farmers/${id}/summary`;
const BOOKING_PATH = (id: string) => `/admin/farmers/${id}/bookings`;
const DELETE_PATH = (id: string) => `/admin/farmer/delete/${id}`;
const ACTIVATE_PATH = (id: string) => `/admin/farmer/activate/${id}`;
const INACTIVATE_PATH = (id: string) => `/admin/farmer/inactivate/${id}`;

interface FarmerActionProps {
  index: number;
  name: string;
  email?: string;
  emailVerified?: boolean;
  gender?: string | null;
  mobile?: string | null;
  country_code?: string | null;
  createDate: string;
  status: number;
  id: string;
  onUpdate?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean;
}

interface FarmerProfile {
  id?: string;
  name?: string;
  email?: string;
  mobile?: string | null;
  country_code?: string | null;
  image?: string | null;
  created_at?: string;
  last_activity?: string;
}

interface FarmerStats {
  activeBookings?: number;
  completedBookings?: number;
  pendingBookings?: number;
  totalLandArea?: number;
  activeFarms?: number;
  totalFarms?: number;
}

interface FarmerSummary {
  profile?: FarmerProfile;
  stats?: FarmerStats;
}

interface Booking {
  id: string;
  start_date: string;
  end_date: string | null;
  booking_hours: string;
  total_cost: number;
  booking_status: string;
  confirm: boolean;
  owner_confirm: boolean;
  tractor_name?: string;
  store_name?: string;
  payment_status: string;
  created_at: string;
}

interface BookingsResponse {
  bookings: Booking[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const FarmerAction = ({
  index,
  name,
  createDate,
  status,
  id,
  onUpdate,
  open,
  onOpenChange,
  showTrigger = true,
}: FarmerActionProps) => {
  const { cookie } = useCookie();
  const access_token = cookie.get("access_token");

  const [internalOpen, setInternalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const computedOpen = open !== undefined ? open : internalOpen;

  const [activeTab, setActiveTab] = useState("devices");
  const [loading, setLoading] = useState({
    delete: false,
    active: false,
    inactive: false,
  });

  const [loadingData, setLoadingData] = useState(false);
  const [farmerSummary, setFarmerSummary] = useState<FarmerSummary | null>(null);
  const [farmerBookings, setFarmerBookings] = useState<Booking[]>([]);
  const [dataError, setDataError] = useState<string | null>(null);

  const [farmerStats, setFarmerStats] = useState({
    activeBookings: { value: 0, inUse: 0, date: "" },
    completeBookings: { value: 0, date: "" },
    totalLandArea: { value: "0 ha", date: "" },
    pendingBookings: { value: 0, inUse: 0, date: "" },
    activeFarms: { value: 0, inUse: 0, date: "" },
    totalFarms: { value: 0, date: "" },
  });

  const handleOpen = (val: boolean) => {
    setInternalOpen(val);
    onOpenChange?.(val);
    if (val) setDataError(null);
  };

  const fetchFarmerDetails = async () => {
    if (!id) {
      setDataError("Farmer ID is missing");
      return;
    }

    if (!access_token) {
      setDataError("Authentication required. Please log in as admin.");
      console.error("❌ Cannot fetch - no admin token available");
      return;
    }

    setLoadingData(true);
    setDataError(null);
    setFarmerSummary(null);
    setFarmerBookings([]);

    try {
      const headers = {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      };

      console.log("=== FETCHING FARMER DETAILS (ADMIN) ===");
      console.log("Farmer ID:", id);
      console.log("Base URL:", renderInstance.defaults.baseURL);

      // ---- SUMMARY ----
      let summary: FarmerSummary | null = null;
      let summaryError: any = null;
      try {
        const summaryRes = await renderInstance.get(SUMMARY_PATH(id), { headers });
        const responseData = summaryRes.data;

        console.log("📦 RAW SUMMARY RESPONSE:", JSON.stringify(responseData, null, 2));

        // Handle the correct response structure: { profile: {...}, stats: {...} }
        // NOT an array - it's a direct object
        summary = {
          profile: responseData.profile || {},
          stats: responseData.stats || {}
        };

        setFarmerSummary(summary);
        console.log("✓ SUMMARY SUCCESS", summary);
      } catch (err: any) {
        summaryError = err;
        console.log("✗ SUMMARY FAILED", err?.response?.status || err.message);
        console.log("Error details:", err?.response?.data);
      }

      // ---- BOOKINGS ----
      let bookings: Booking[] = [];
      let bookingsError: any = null;
      try {
        const bookingRes = await renderInstance.get(BOOKING_PATH(id), { headers });
        const responseData: BookingsResponse = bookingRes.data;

        console.log("📦 RAW BOOKINGS RESPONSE:", JSON.stringify(responseData, null, 2));

        // Handle response structure: { bookings: [...], pagination: {...} }
        const rawBookings = responseData.bookings || [];
        bookings = rawBookings.map((b: any) => ({
          id: b.id,
          start_date: b.start_date,
          end_date: b.end_date,
          booking_hours: b.booking_hours,
          total_cost: b.total_cost,
          booking_status: (b.booking_status || "").toLowerCase(),
          confirm: b.confirm,
          owner_confirm: b.owner_confirm,
          tractor_name: b.tractor_name || "N/A",
          store_name: b.store_name || "N/A",
          payment_status: b.payment_status || "Unpaid",
          created_at: b.created_at,
        }));

        setFarmerBookings(bookings);
        console.log("✓ BOOKINGS SUCCESS - Count:", bookings.length);
      } catch (err: any) {
        bookingsError = err;
        console.log("✗ BOOKINGS FAILED", err?.response?.status || err.message);
        console.log("Error details:", err?.response?.data);
      }

      console.log("=== FETCH RESULTS ===");
      console.log("Summary loaded:", !!summary, summary);
      console.log("Bookings loaded:", bookings.length);

      // Don't show error if at least one endpoint succeeded
      if (!summary && bookings.length === 0 && (summaryError || bookingsError)) {
        const errorMsg = "Could not load farmer data. Check console for details.";
        console.error("❌ BOTH ENDPOINTS FAILED");
        setDataError(errorMsg);
      } else {
        setDataError(null);
        processFarmerStats(summary, bookings);
      }
    } catch (error: any) {
      console.error("❌ UNEXPECTED ERROR (ADMIN FETCH):", error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "An unexpected error occurred";
      setDataError(message);
      errorMessage(message);
    } finally {
      setLoadingData(false);
      console.log("=== FETCH COMPLETE (ADMIN) ===");
    }
  };

  const processFarmerStats = (summary: FarmerSummary | null, bookings: Booking[]) => {
    console.log("Processing farmer stats...");
    const stats = summary?.stats || {};

    const activeStatuses = ["open", "arriving", "started", "accepted", "arrived"];
    const activeBookingsCount = bookings.filter((b) =>
      activeStatuses.includes(b.booking_status)
    ).length;

    const completedCount = bookings.filter((b) => b.booking_status === "completed").length;

    const pendingCount = bookings.filter(
      (b) => b.booking_status === "pending" || b.booking_status === "requested"
    ).length;

    const currentDate = new Date().toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    const processedStats = {
      activeBookings: {
        value: stats.activeBookings ?? activeBookingsCount,
        inUse: activeBookingsCount,
        date: currentDate,
      },
      completeBookings: {
        value: stats.completedBookings ?? completedCount,
        date: currentDate,
      },
      totalLandArea: {
        value: `${stats.totalLandArea || 0} ha`,
        date: currentDate,
      },
      pendingBookings: {
        value: stats.pendingBookings ?? pendingCount,
        inUse: pendingCount,
        date: currentDate,
      },
      activeFarms: {
        value: stats.activeFarms ?? 0,
        inUse: stats.activeFarms ?? 0,
        date: currentDate,
      },
      totalFarms: {
        value: stats.totalFarms ?? 0,
        date: currentDate,
      },
    };

    console.log("Processed stats:", processedStats);
    setFarmerStats(processedStats);
  };

  useEffect(() => {
    if (computedOpen && access_token) {
      fetchFarmerDetails();
    }
  }, [computedOpen, id, access_token]);

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  const tabs = [
    { id: "devices", label: "Devices" },
    { id: "booking", label: "Booking" },
    { id: "payment", label: "Payment" },
    { id: "forms", label: "Forms" },
  ] as const;

  const updateFarmerStatus = async (
    endpoint: string,
    type: keyof typeof loading,
    success: string
  ) => {
    if (!access_token) {
      errorMessage("Authentication required - please log in as admin");
      console.error("❌ Cannot update status - no admin token");
      return;
    }

    console.log("=== UPDATE FARMER STATUS (ADMIN) ===");
    console.log("Endpoint:", endpoint);
    console.log("Type:", type);
    console.log("Farmer ID:", id);

    setLoading((prev) => ({ ...prev, [type]: true }));

    try {
      const headers = {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      };

      const response = await renderInstance.patch(endpoint, {}, { headers });
      console.log("✓ SUCCESS:", response.data);
      successMessage(success);
      onUpdate?.();
      handleOpen(false);
    } catch (err: any) {
      console.error("❌ UPDATE FAILED:", err?.response || err);
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Operation failed. Please try again.";
      errorMessage(message);
    } finally {
      setLoading((prev) => ({ ...prev, [type]: false }));
      console.log("=== UPDATE COMPLETE (ADMIN) ===");
    }
  };

  const DeleteFarmer = () => updateFarmerStatus(DELETE_PATH(id), "delete", "Farmer deleted successfully");
  const ActiveFarmer = () => updateFarmerStatus(ACTIVATE_PATH(id), "active", "Farmer activated successfully");
  const InactiveFarmer = () => updateFarmerStatus(INACTIVATE_PATH(id), "inactive", "Farmer inactivated successfully");

  const StatCard = ({ icon, title, value, inUse, date }: any) => (
    <div className="bg-gradient-to-br from-zinc-100 via-zinc-50 to-zinc-200 rounded-lg p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
            {icon}
          </div>
        </div>
        <TrendingUp className="w-4 h-4 text-green-600" />
      </div>
      <div className="mb-1">
        <p className="text-sm font-medium text-gray-700 mb-2">{title}</p>
        <div className="text-3xl font-bold text-gray-900">{value}</div>
      </div>
      <div className="text-xs text-gray-600 mt-3">
        {inUse !== undefined && `In use ${inUse} • `}
        {date && `Data as per ${date}`}
      </div>
    </div>
  );

  const devicesData = farmerBookings
    .filter((b) => b.tractor_name && b.tractor_name !== "N/A")
    .map((b) => ({
      type: b.booking_status === "completed" ? "Rented" : "Booked",
      model: b.tractor_name || "Unknown Tractor",
      time: formatDate(b.created_at),
      booking: b,
    }));

  const paymentsData = farmerBookings.map((b) => ({
    // type: "Booking",
    model: b.tractor_name || "N/A",
    payment: `$${b.total_cost}`,
    bookedOn: formatDate(b.created_at),
    status: b.payment_status === "Unpaid" ? "failed" : "paid",
  }));

  return (
    <Sheet open={computedOpen} onOpenChange={handleOpen}>
      {showTrigger && (
        <SheetTrigger asChild>
          <button className="p-2 hover:bg-gray-100 rounded" aria-label="Open farmer details">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
        </SheetTrigger>
      )}

      <SheetContent
        side="right"
        className="w-full sm:max-w-[90vw] md:max-w-[80vw] lg:max-w-[85vw] xl:max-w-[1400px] p-0 overflow-hidden flex flex-col"
      >
        <div className="flex h-full overflow-hidden">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div
            className={`
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
            lg:translate-x-0
            fixed lg:relative
            w-80 h-full
            flex-shrink-0 bg-gray-50 p-4 sm:p-6 overflow-y-auto border-r
            transition-transform duration-300 ease-in-out
            z-40
          `}
          >
            <div className="bg-gray-100 rounded-lg p-4 sm:p-6 mb-6">
              <div className="flex items-center gap-3 sm:gap-4 mb-4">
                <Image
                  src={
                    farmerSummary?.profile?.image ||
                    "https://holaimagesdata.s3.us-west-2.amazonaws.com/web/vector-images/user_logo.webp"
                  }
                  alt={name}
                  width={64}
                  height={64}
                  className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-gray-300"
                />
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg sm:text-xl font-semibold truncate">
                    {farmerSummary?.profile?.name || name}
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-600 truncate">Created on {createDate}</p>
                  <p className="text-xs text-gray-500 truncate">ID: {id.slice(0, 8)}...</p>
                </div>
              </div>

              <div className="flex gap-2 mb-4">
                <Button variant="outline" size="sm" className="flex-1">
                  <Phone className="w-4 h-4 mr-2" />
                  Call
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <Mail className="w-4 h-4 mr-2" />
                  Mail
                </Button>
              </div>

              <p className="text-sm text-gray-600">
                Last Activity: {farmerSummary?.profile?.last_activity ? formatDate(farmerSummary.profile.last_activity) : createDate}
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Recent Activities</h3>
              <div className="space-y-3">
                {farmerBookings.length === 0 ? (
                  <p className="text-sm text-gray-500">No recent activities</p>
                ) : (
                  farmerBookings.slice(0, 3).map((booking, idx) => (
                    <div key={idx} className="flex gap-3 text-sm pb-3 border-b last:border-b-0">
                      <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <p>
                          <span className="font-medium capitalize">{booking.booking_status}</span>{" "}
                          {booking.tractor_name}
                        </p>
                        <p className="text-gray-500 text-xs">{formatDate(booking.created_at)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {sidebarOpen && (
            <div
              className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          <div className="flex-1 flex flex-col overflow-hidden">
            <SheetHeader className="p-6 border-b">
              <SheetTitle>Farmer Activity - {farmerSummary?.profile?.name || name}</SheetTitle>
              <SheetDescription className={status === 1 ? "text-green-600" : "text-red-600"}>
                {status === 1
                  ? `${name} is an active farmer`
                  : `${name} is inactive. Click "Active" to activate.`}
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto p-6">
              {dataError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800">Error Loading Data</p>
                    <p className="text-sm text-red-600 mt-1">{dataError}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
                <StatCard
                  icon={
                    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  }
                  title="Active Bookings"
                  value={loadingData ? "..." : farmerStats.activeBookings.value}
                  inUse={loadingData ? "..." : farmerStats.activeBookings.inUse}
                  date={farmerStats.activeBookings.date}
                />
                <StatCard
                  icon={
                    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                  title="Complete Bookings"
                  value={loadingData ? "..." : farmerStats.completeBookings.value}
                  date={farmerStats.completeBookings.date}
                />
                <StatCard
                  icon={
                    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                  title="Total Land Area"
                  value={loadingData ? "..." : farmerStats.totalLandArea.value}
                  date={farmerStats.totalLandArea.date}
                />
                <StatCard
                  icon={
                    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                  title="Pending Bookings"
                  value={loadingData ? "..." : farmerStats.pendingBookings.value}
                  inUse={loadingData ? "..." : farmerStats.pendingBookings.inUse}
                  date={farmerStats.pendingBookings.date}
                />
                <StatCard
                  icon={
                    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  }
                  title="Active Farms"
                  value={loadingData ? "..." : farmerStats.activeFarms.value}
                  inUse={loadingData ? "..." : farmerStats.activeFarms.inUse}
                  date={farmerStats.activeFarms.date}
                />
                <StatCard
                  icon={
                    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  }
                  title="Total Farms"
                  value={loadingData ? "..." : farmerStats.totalFarms.value}
                  date={farmerStats.totalFarms.date}
                />
              </div>

              <div className="bg-white rounded-lg">
                <div className="border-b border-gray-200 px-6 flex items-center justify-between">
                  <div className="flex gap-1">
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                            ? "border-black text-black"
                            : "border-transparent text-gray-600 hover:text-gray-900"
                          }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>

                <div className="p-6">
                  {loadingData ? (
                    <div className="flex justify-center p-8">
                      <CircularProgress />
                    </div>
                  ) : (
                    <>
                      {activeTab === "devices" && (
                        <div className="space-y-3">
                          {devicesData.length === 0 ? (
                            <p className="text-gray-500 text-center text-sm py-8">No devices found</p>
                          ) : (
                            devicesData.map((device, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                              >
                                <div className="flex items-center gap-4">
                                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  <div>
                                    <p className="font-medium">
                                      {device.booking?.tractor_name || "N/A"}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      Payment: ${device.booking?.total_cost} • Duration:{" "}
                                      {device.booking?.booking_hours} • Store:{" "}
                                      {device.booking?.store_name || "N/A"} • Booked on:{" "}
                                      {formatDate(device.booking?.created_at || "")}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span
                                    className={`px-3 py-1 rounded-full text-sm font-medium ${["open", "arriving", "started", "accepted", "arrived"].includes(
                                      device.booking?.booking_status || ""
                                    )
                                        ? "bg-green-100 text-green-700"
                                        : "bg-gray-100 text-gray-700"
                                      }`}
                                  >
                                    {device.booking?.booking_status}
                                  </span>
                                  <button className="p-2 hover:bg-gray-200 rounded">
                                    <Trash2 className="w-4 h-4 text-gray-600" />
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}

                      {activeTab === "payment" && (
                        <div className="space-y-3">
                          {paymentsData.length === 0 ? (
                            <p className="text-gray-500 text-center text-sm py-8">No payment records found</p>
                          ) : (
                            paymentsData.map((payment, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                              >
                                <div className="flex items-center gap-4">
                                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h6m4 0h2m-7 4h6a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                  </svg>
                                  <div>
                                    <p className="font-medium">{payment.model}</p>
                                    <p className="text-sm text-gray-600">
                                      Payment: {payment.payment} • Booked on: {payment.bookedOn}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span
                                    className={`px-3 py-1 rounded-full text-sm font-medium ${payment.status === "paid"
                                        ? "bg-green-100 text-green-700"
                                        : "bg-orange-100 text-orange-700"
                                      }`}
                                  >
                                    {payment.status === "paid" ? "Paid" : "Failed"}
                                  </span>
                                  <button className="p-2 hover:bg-gray-200 rounded">
                                    <Trash2 className="w-4 h-4 text-gray-600" />
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}

                      {activeTab === "forms" && (
                        <div className="space-y-3">
                          <p className="text-gray-500 text-center text-sm py-8">No forms data available</p>
                        </div>
                      )}

                      {activeTab === "booking" && (
                        <div className="space-y-3">
                          {farmerBookings.length === 0 ? (
                            <p className="text-gray-500 text-center text-sm py-8">No bookings found</p>
                          ) : (
                            farmerBookings.map((booking, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                              >
                                <div className="flex items-center gap-4">
                                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  <div>
                                    <p className="font-medium">{booking.tractor_name || "Tractor"}</p>
                                    <p className="text-sm text-gray-600">
                                      ${booking.total_cost} • {booking.booking_hours} • Store: {booking.store_name} • {formatDate(booking.created_at)}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span
                                    className={`px-3 py-1 rounded-full text-sm font-medium ${["open", "arriving", "started", "accepted", "arrived"].includes(booking.booking_status)
                                        ? "bg-green-100 text-green-700"
                                        : "bg-gray-100 text-gray-700"
                                      }`}
                                  >
                                    {booking.booking_status}
                                  </span>
                                  <button className="p-2 hover:bg-gray-200 rounded">
                                    <Trash2 className="w-4 h-4 text-gray-600" />
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            <SheetFooter className="flex justify-between items-center p-6 border-t mt-auto">
              <Button
                type="button"
                variant="destructive"
                onClick={DeleteFarmer}
                disabled={loading.delete}
              >
                {loading.delete ? <CircularProgress size={16} /> : "Delete"}
              </Button>
              <div className="flex gap-3">
                {status === 1 ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={InactiveFarmer}
                    disabled={loading.inactive}
                  >
                    {loading.inactive ? <CircularProgress size={16} /> : "Inactive"}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    className="bg-green-800 hover:bg-green-700"
                    onClick={ActiveFarmer}
                    disabled={loading.active}
                  >
                    {loading.active ? <CircularProgress size={16} /> : "Active"}
                  </Button>
                )}
              </div>
            </SheetFooter>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default FarmerAction;