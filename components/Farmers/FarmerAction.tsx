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
import { Trash2, TrendingUp, Phone, Mail, Download, AlertCircle } from "lucide-react";
import Image from "next/image";

interface FarmerActionProps {
  index: number;
  name: string;
  email?: string;
  emailVerified?: boolean;
  gender?: string | null;
  mobile?: string | null;
  country_code?: string | null;
  creatDate: string;
  status: number;
  id: string;
  onUpdate?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean;
}

interface FarmerSummary {
  profile?: {
    id?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    mobile?: string;
    country_code?: string;
    image?: string;
    last_activity?: string;
  };
  stats?: {
    activeBookings?: number;
    completeBookings?: number;
    pendingBookings?: number;
    totalLandArea?: number;
    activeFarms?: number;
    totalFarms?: number;
  };
}

interface Booking {
  id: string;
  start_date: string;
  end_date: string;
  booking_hours: string;
  total_cost: number;
  bookingStatus: string;
  confirm: boolean;
  owner_confirm: boolean;
  tractor_name?: string;
  payment_status: string;
  created_at: string;
}

const FarmerAction = ({
  index,
  name,
  creatDate,
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
  const computedOpen = open !== undefined ? open : internalOpen;

  const handleOpen = (val: boolean) => {
    setInternalOpen(val);
    onOpenChange?.(val);
    // Reset error when opening
    if (val) {
      setDataError(null);
    }
  };

  const [activeTab, setActiveTab] = useState("devices");
  const [loading, setLoading] = useState({ delete: false, active: false, inactive: false });

  const [loadingData, setLoadingData] = useState(false);
  const [farmerSummary, setFarmerSummary] = useState<FarmerSummary | null>(null);
  const [farmerBookings, setFarmerBookings] = useState<Booking[]>([]);
  const [dataError, setDataError] = useState<string | null>(null);

  const [farmerStats, setFarmerStats] = useState({
    activeBookings: { value: 0, inUse: 0, date: "" },
    completeBookings: { value: 0, date: "" },
    totalLandArea: { value: "0 ha", date: "" },
    pendingBookings: { value: 0, inUse: 0, date: "" },
    activeForms: { value: 0, inUse: 0, date: "" },
    totalForms: { value: 0, date: "" },
  });

  const fetchFarmerDetails = async () => {
    if (!id) {
      setDataError("Farmer ID is missing");
      return;
    }

    if (!access_token) {
      setDataError("Authentication token is missing. Please log in again.");
      return;
    }

    setLoadingData(true);
    setDataError(null);
    setFarmerSummary(null);
    setFarmerBookings([]);

    try {
      const headers = { 
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json'
      };

      console.log('Fetching farmer details for ID:', id);
      console.log('Using token:', access_token?.substring(0, 20) + '...');

      const [summaryResponse, bookingsResponse] = await Promise.allSettled([
        renderInstance.get(`/admin/farmers/${id}/summary`, { headers }),
        renderInstance.get(`/admin/farmers/${id}/bookings`, { headers }),
      ]);

      // Handle summary response
      let summary: FarmerSummary | null = null;
      if (summaryResponse.status === 'fulfilled') {
        summary = summaryResponse.value.data;
        setFarmerSummary(summary);
        console.log('Summary loaded successfully:', summary);
      } else {
        console.error('Summary fetch failed:', summaryResponse.reason?.response?.data || summaryResponse.reason);
      }

      // Handle bookings response
      let bookings: Booking[] = [];
      if (bookingsResponse.status === 'fulfilled') {
        bookings = bookingsResponse.value.data.bookings || [];
        setFarmerBookings(bookings);
        console.log('Bookings loaded successfully:', bookings.length, 'bookings');
      } else {
        console.error('Bookings fetch failed:', bookingsResponse.reason?.response?.data || bookingsResponse.reason);
      }

      // If both failed, show error
      if (summaryResponse.status === 'rejected' && bookingsResponse.status === 'rejected') {
        const errorMsg = summaryResponse.reason?.response?.data?.message || 
                        summaryResponse.reason?.message ||
                        "Farmer not found or you don't have permission to view this farmer's details";
        
        const errorDetails = summaryResponse.reason?.response?.status 
          ? ` (Status: ${summaryResponse.reason.response.status})`
          : '';
        
        setDataError(errorMsg + errorDetails);
        errorMessage(errorMsg);
      } else if (summaryResponse.status === 'rejected' && bookingsResponse.status === 'fulfilled') {
        // Only bookings loaded, show warning but process data
        setDataError("Could not load farmer summary, showing bookings data only");
        processFarmerStats(summary, bookings);
      } else {
        // Process stats if at least one succeeded
        processFarmerStats(summary, bookings);
      }

    } catch (error: any) {
      console.error('Unexpected error:', error);
      const message = error?.response?.data?.message || 
                     error?.message || 
                     "An unexpected error occurred while loading farmer details";
      setDataError(message);
      errorMessage(message);
    } finally {
      setLoadingData(false);
    }
  };

  const processFarmerStats = (summary: FarmerSummary | null, bookings: Booking[]) => {
    const stats = summary?.stats || {};

    const activeStatuses = ["Open", "Arriving", "Started", "Accepted", "Arrived"];
    const activeBookingsCount = bookings.filter((b) => activeStatuses.includes(b.bookingStatus)).length;
    const completedCount = bookings.filter((b) => b.bookingStatus === "Completed").length;
    const pendingCount = bookings.filter(
      (b) => b.bookingStatus === "Pending" || b.bookingStatus === "Requested"
    ).length;

    const currentDate = new Date().toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    setFarmerStats({
      activeBookings: {
        value: stats.activeBookings ?? activeBookingsCount,
        inUse: activeBookingsCount,
        date: currentDate,
      },
      completeBookings: {
        value: stats.completeBookings ?? completedCount,
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
      activeForms: {
        value: stats.activeFarms || 0,
        inUse: stats.activeFarms || 0,
        date: currentDate,
      },
      totalForms: {
        value: stats.totalFarms || 0,
        date: currentDate,
      },
    });
  };

  useEffect(() => {
    if (computedOpen) {
      fetchFarmerDetails();
    }
  }, [computedOpen, id]);

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

  const updateFarmerStatus = async (endpoint: string, type: keyof typeof loading, success: string) => {
    if (!access_token) {
      errorMessage("Authentication required");
      return;
    }

    setLoading((prev) => ({ ...prev, [type]: true }));
    try {
      await renderInstance.patch(
        endpoint, 
        {}, 
        { 
          headers: { 
            Authorization: `Bearer ${access_token}`,
            'Content-Type': 'application/json'
          } 
        }
      );
      successMessage(success);
      onUpdate?.();
      handleOpen(false);
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || "Operation failed. Please try again.";
      errorMessage(message);
    } finally {
      setLoading((prev) => ({ ...prev, [type]: false }));
    }
  };

  const StatCard = ({ icon, title, value, inUse, date }: any) => (
    <div className="bg-gradient-to-br from-zinc-100 via-zinc-50 to-zinc-200 rounded-lg p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">{icon}</div>
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
      type: b.bookingStatus === "Completed" ? "Rented" : "Booked",
      model: b.tractor_name || "Unknown Tractor",
      time: formatDate(b.created_at),
    }));

  const paymentsData = farmerBookings.map((b) => ({
    type: "Booking",
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
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          </button>
        </SheetTrigger>
      )}

      <SheetContent
        side="right"
        className="w-full sm:max-w-[90vw] md:max-w-[80vw] lg:max-w-[85vw] xl:max-w-[1400px] p-0 overflow-hidden flex flex-col"
      >
        <div className="flex h-full overflow-hidden">
          {/* Left Sidebar */}
          <div className="w-96 flex-shrink-0 bg-gray-50 p-6 overflow-y-auto border-r">
            <div className="bg-gray-100 rounded-lg p-6 mb-6">
              <div className="flex items-center gap-4 mb-4">
                <Image
                  src={
                    farmerSummary?.profile?.image ||
                    "https://holaimagesdata.s3.us-west-2.amazonaws.com/web/vector-images/user_logo.webp"
                  }
                  alt={name}
                  width={64}
                  height={64}
                  className="w-16 h-16 rounded-full object-cover border-2 border-gray-300"
                />
                <div>
                  <h2 className="text-xl font-semibold">{name}</h2>
                  <p className="text-sm text-gray-600">Created on {creatDate}</p>
                  <p className="text-sm text-gray-600">ID: {id.slice(0, 8)}...</p>
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
                Last Activity: {farmerSummary?.profile?.last_activity || creatDate}
              </p>
            </div>

            {/* Recent Activities */}
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
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p>
                          <span className="font-medium">{booking.bookingStatus}</span> {booking.tractor_name || "Tractor"}
                        </p>
                        <p className="text-gray-500 text-xs">{formatDate(booking.created_at)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <SheetHeader className="p-6 border-b">
              <SheetTitle>Farmer Activity - {name}</SheetTitle>
              <SheetDescription className={status === 1 ? "text-green-600" : "text-red-600"}>
                {status === 1 ? `${name} is an active farmer` : `${name} is inactive. Click "Active" to activate.`}
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto p-6">
              {/* Error Display */}
              {dataError && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg mb-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">Error Loading Farmer Details</p>
                    <p className="text-sm mt-1">{dataError}</p>
                    {(dataError.includes("Farmer not found") || dataError.includes("404")) && (
                      <div className="mt-3 text-xs bg-white p-3 rounded border border-red-300">
                        <p className="font-semibold mb-2 text-red-800">⚠️ HTTP 404 - Farmer Not Found</p>
                        <p className="mb-2 text-gray-700">This farmer record doesn't exist in the database:</p>
                        <code className="block bg-gray-100 p-2 rounded text-gray-800 mb-3 break-all">
                          Farmer ID: {id}
                        </code>
                        <p className="font-medium mb-1 text-gray-800">Possible reasons:</p>
                        <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
                          <li>This farmer was deleted from the database</li>
                          <li>The farmer ID is incorrect or outdated</li>
                          <li>Database was reset/cleared (common in development)</li>
                          <li>Wrong endpoint - may need farmer's own auth token, not admin token</li>
                        </ul>
                        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-300 rounded">
                          <p className="text-yellow-800 font-medium text-xs">💡 Backend Note:</p>
                          <p className="text-yellow-700 text-xs mt-1">
                            The API comment says "need farmer auth" - this endpoint might require the farmer's own 
                            authentication token, not an admin token. Consider creating a separate admin endpoint 
                            or using the farmer's token if available.
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="flex gap-2 mt-3">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={fetchFarmerDetails}
                        disabled={loadingData}
                      >
                        {loadingData ? <CircularProgress size={14} /> : "Retry"}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          console.group('🔍 Farmer Detail Debug Info');
                          console.log('Farmer ID:', id);
                          console.log('Farmer Name:', name);
                          console.log('Created Date:', creatDate);
                          console.log('Status:', status === 1 ? 'Active' : 'Inactive');
                          console.log('Token exists:', !!access_token);
                          console.log('Token preview:', access_token?.substring(0, 40) + '...');
                          console.log('API Endpoints:');
                          console.log('  - Summary:', `/admin/farmers/${id}/summary`);
                          console.log('  - Bookings:', `/admin/farmers/${id}/bookings`);
                          console.log('Full error:', dataError);
                          console.groupEnd();
                          alert('✅ Debug info logged to console (Press F12 to view)');
                        }}
                      >
                        Show Debug Info
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
                <StatCard
                  icon={
                    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
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
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  }
                  title="Complete Bookings"
                  value={loadingData ? "..." : farmerStats.completeBookings.value}
                  date={farmerStats.completeBookings.date}
                />
                <StatCard
                  icon={
                    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  }
                  title="Total Land Area"
                  value={loadingData ? "..." : farmerStats.totalLandArea.value}
                  date={farmerStats.totalLandArea.date}
                />
                <StatCard
                  icon={
                    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
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
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  }
                  title="Active Forms"
                  value={loadingData ? "..." : farmerStats.activeForms.value}
                  inUse={loadingData ? "..." : farmerStats.activeForms.inUse}
                  date={farmerStats.activeForms.date}
                />
                <StatCard
                  icon={
                    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  }
                  title="Total Forms"
                  value={loadingData ? "..." : farmerStats.totalForms.value}
                  date={farmerStats.totalForms.date}
                />
              </div>

              {/* Tabs Section */}
              <div className="bg-white rounded-lg">
                <div className="border-b border-gray-200 px-6 flex items-center justify-between">
                  <div className="flex gap-1">
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                          activeTab === tab.id
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
                                  <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M20.5 8H19V5.5a1.5 1.5 0 0 0-1.5-1.5H14V2h-2v2H7v2h7.5a.5.5 0 0 1 .5.5V8H11c-1.1 0-2 .9-2 2v3.1A4.9 4.9 0 0 0 5 13a5 5 0 1 0 5 5h4a4 4 0 1 0 4-4h-1v-4h3.5V8zM5 20a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm13-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
                                  </svg>
                                  <div>
                                    <p className="font-medium">
                                      {device.type} {device.model}
                                    </p>
                                    <p className="text-xs text-gray-500">{device.time}</p>
                                  </div>
                                </div>
                                <button className="p-2 hover:bg-gray-200 rounded">
                                  <Trash2 className="w-4 h-4 text-gray-600" />
                                </button>
                              </div>
                            ))
                          )}
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
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                  </svg>
                                  <div>
                                    <p className="font-medium">
                                      {booking.bookingStatus} {booking.tractor_name || "N/A"}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      Payment: ${booking.total_cost} • Duration: {booking.booking_hours} • Booked on:{" "}
                                      {formatDate(booking.created_at)}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span
                                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                                      ["Open", "Arriving", "Started", "Accepted", "Arrived"].includes(booking.bookingStatus)
                                        ? "bg-green-100 text-green-700"
                                        : "bg-gray-100 text-gray-700"
                                    }`}
                                  >
                                    {booking.bookingStatus}
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
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                                    />
                                  </svg>
                                  <div>
                                    <p className="font-medium">
                                      {payment.type} {payment.model}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      Payment: {payment.payment} • Booked on: {payment.bookedOn}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span
                                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                                      payment.status === "paid"
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
                    </>
                  )}
                </div>
              </div>
            </div>

            <SheetFooter className="flex justify-between items-center p-6 border-t mt-auto">
              <Button
                type="button"
                variant="destructive"
                onClick={() => updateFarmerStatus(`/farmer/delete/${id}`, "delete", "Farmer deleted successfully")}
                disabled={loading.delete}
              >
                {loading.delete ? <CircularProgress size={16} /> : "Delete"}
              </Button>
              <div className="flex gap-3">
                {status === 1 ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => updateFarmerStatus(`/farmer/inactivate/${id}`, "inactive", "Inactivated successfully")}
                    disabled={loading.inactive}
                  >
                    {loading.inactive ? <CircularProgress size={16} /> : "Inactive"}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    className="bg-green-800 hover:bg-green-700"
                    onClick={() => updateFarmerStatus(`/farmer/activate/${id}`, "active", "Activated successfully")}
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