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
import { Trash2, TrendingUp } from "lucide-react";
import Image from "next/image";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";

// --- Interfaces for API Response ---
interface BaseTractor {
  id: string;
  name: string;
  model: string;
  images: string[];
}

interface TractorInStore {
  id: string;
  hourly_price: number;
  baseTractor?: BaseTractor;
}

interface Booking {
  id: string;
  createdAt: string;
  total_cost: number;
  bookingStatus: string;
  user_id: string;
  store_id: string;
}

interface BaseAttachment {
  id: string;
  name: string;
  images: string[];
}

interface AttachmentInStore {
  id: string;
  hourly_price: number;
  baseAttachment?: BaseAttachment;
}

interface OperatorDetails {
  id: string;
}

interface OperatorInStore {
  id: string;
  status: string;
  cost_per_job: string;
  operator?: OperatorDetails;
}

interface Location {
  lat: string;
  lan: string;
}

interface Store {
  id: string;
  name: string;
  description: string;
  image: string;
  opening_time: string;
  closing_time: string;
  owner_user_id: string;
  createdAt: string;
  location?: Location;
  TractorInStore?: TractorInStore[];
  AttachmentInStore?: AttachmentInStore[];
  OperatorInStore?: OperatorInStore[];
  Booking?: Booking[];
}

// --- Props Interfaces ---
interface UserDetails {
  id?: string;
  first_name?: string | null;
  middle_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  emailVerified?: boolean | null;
  image?: string | null;
}

interface DocumentDetails {
  document_number?: string;
  attachment?: string;
  expire_date?: string | null;
}

interface LocationDetails {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  lat?: string;
  lng?: string;
}

interface OwnerActionProps {
  index: number;
  mailHover: number;
  name: string;
  email: string;
  emailVerified: boolean;
  creatDate: string;
  updateDate: string;
  status: number;
  id: string;
  screenshots: string[];
  user?: UserDetails;
  document?: DocumentDetails;
  location?: LocationDetails;
  onUpdate?: () => void;
}

const OwnerAction = ({
  index,
  name,
  mailHover,
  email,
  emailVerified,
  creatDate,
  updateDate,
  status,
  id,
  screenshots,
  user,
  document,
  location,
  onUpdate,
}: OwnerActionProps) => {
  const { cookie } = useCookie();
  const access_token = cookie.get("access_token");
  const [activeTab, setActiveTab] = useState("stores");
  const [sheetOpen, setSheetOpen] = useState(false);

  // State for fetched data
  const [loadingData, setLoadingData] = useState(false);
  const [storeData, setStoreData] = useState<Store[]>([]);

  // Calculated Stats State
  const [stats, setStats] = useState({
    totalStores: { value: 0, inUse: 0 },
    totalTractor: { value: 0, inUse: 0 },
    totalBookings: { value: 0, inUse: 0 },
    totalAttachment: { value: 0, inUse: 0 },
    totalOperators: { value: 0, inUse: 0 },
  });

  // Flattened lists for Tabs
  const [flattenedBookings, setFlattenedBookings] = useState<any[]>([]);
  const [flattenedOperators, setFlattenedOperators] = useState<any[]>([]);
  const [flattenedDevices, setFlattenedDevices] = useState<any[]>([]);

  const [loading, setLoading] = useState<{
    delete: boolean;
    active: boolean;
    inactive: boolean;
  }>({
    delete: false,
    active: false,
    inactive: false,
  });

  // --- Fetch Data ---
  const fetchOwnerStoreDetails = async () => {
    if (!user?.id) return;

    setLoadingData(true);
    try {
      const response = await renderInstance.get(
        `/store/byowners?owner_user_id=${user.id}`,
        {
          headers: { Authorization: `Bearer ${access_token}` },
        }
      );

      const stores: Store[] = response.data;
      setStoreData(stores);
      processStatsAndTabs(stores);
    } catch (error) {
      console.error("Error fetching store details:", error);
      errorMessage("Failed to load owner details");
    } finally {
      setLoadingData(false);
    }
  };

  // --- Process Data Logic ---
  const processStatsAndTabs = (stores: Store[]) => {
    // 1. Calculate Stats
    const totalStoresCount = stores.length;

    const totalTractorsCount = stores.reduce((sum, store) => {
      return sum + (store.TractorInStore?.length || 0);
    }, 0);

    const totalAttachmentsCount = stores.reduce((sum, store) => {
      return sum + (store.AttachmentInStore?.length || 0);
    }, 0);

    const totalBookingsCount = stores.reduce((sum, store) => {
      return sum + (store.Booking?.length || 0);
    }, 0);

    const totalOperatorsCount = stores.reduce((sum, store) => {
      return sum + (store.OperatorInStore?.length || 0);
    }, 0);

    // Calculate In Use (Active Bookings)
    const activeStatus = ["Open", "Arriving", "Started", "Accepted", "Arrived"];

    const activeBookingsCount = stores.reduce((sum, store) => {
      const activeBookings =
        store.Booking?.filter((b) => activeStatus.includes(b.bookingStatus)) ||
        [];
      return sum + activeBookings.length;
    }, 0);

    // Assuming Operators "Active" status means in use/available
    const activeOperatorsCount = stores.reduce((sum, store) => {
      const activeOps =
        store.OperatorInStore?.filter((op) => op.status === "Active") || [];
      return sum + activeOps.length;
    }, 0);

    setStats({
      totalStores: { value: totalStoresCount, inUse: totalStoresCount },
      totalTractor: { value: totalTractorsCount, inUse: activeBookingsCount },
      totalBookings: { value: totalBookingsCount, inUse: activeBookingsCount },
      totalAttachment: { value: totalAttachmentsCount, inUse: 0 },
      totalOperators: { value: totalOperatorsCount, inUse: activeOperatorsCount },
    });

    // 2. Flatten Data for Tabs

    // Bookings
    const allBookings = stores
      .flatMap(
        (store) =>
          store.Booking?.map((b) => ({
            ...b,
            storeName: store.name,
            customerName: `User ID: ${b.user_id.slice(0, 6)}...`,
          })) || []
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    setFlattenedBookings(allBookings);

    // Operators
    const allOperators = stores.flatMap(
      (store) =>
        store.OperatorInStore?.map((op) => ({
          ...op,
          storeName: store.name,
          name: `Operator ${op.id.slice(0, 5)}`,
        })) || []
    );
    setFlattenedOperators(allOperators);

    // Devices (Tractors)
    const allDevices = stores.flatMap(
      (store) =>
        store.TractorInStore?.map((t) => ({
          id: t.id,
          name: t.baseTractor?.name || "Unknown Tractor",
          model: t.baseTractor?.model || "N/A",
          image:
            t.baseTractor?.images && t.baseTractor.images.length > 0
              ? t.baseTractor.images[0]
              : null,
          storeName: store.name,
          type: "Tractor",
          hourly_price: t.hourly_price,
        })) || []
    );
    setFlattenedDevices(allDevices);
  };

  useEffect(() => {
    if (sheetOpen) {
      fetchOwnerStoreDetails();
    }
  }, [sheetOpen]);

  // --- Helper Date Formatter ---
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const tabs = [
    { id: "stores", label: "Stores" },
    { id: "booking", label: "Booking" },
    { id: "operator", label: "Operator" },
    { id: "device", label: "Tractors" },
  ];

  const updateOwnerStatus = async (
    endpoint: string,
    type: keyof typeof loading,
    success: string
  ) => {
    setLoading((prev) => ({ ...prev, [type]: true }));
    try {
      await renderInstance.patch(
        endpoint,
        {},
        {
          headers: { Authorization: `Bearer ${access_token}` },
        }
      );
      successMessage(success);
      onUpdate?.();
    } catch (err: any) {
      errorMessage(err?.response?.data?.message || "Something went wrong");
    } finally {
      setLoading((prev) => ({ ...prev, [type]: false }));
    }
  };

  const DeleteOwner = () =>
    updateOwnerStatus(`/owner/delete_owner/${id}`, "delete", "Owner deleted");
  const ActiveOwner = () =>
    updateOwnerStatus(
      `/owner/activate_owner/${id}`,
      "active",
      "Activated successfully"
    );
  const InactiveOwner = () =>
    updateOwnerStatus(
      `/owner/inactivate_owner/${id}`,
      "inactive",
      "Inactivated successfully"
    );

  const StatCard = ({ icon, title, value, inUse }: any) => (
    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 relative">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
            {icon}
          </div>
          <span className="text-sm font-medium text-gray-700">{title}</span>
        </div>
        <TrendingUp className="w-4 h-4 text-green-600" />
      </div>
      <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
      <div className="text-xs text-gray-600">Active/In-Use: {inUse}</div>
    </div>
  );

  return (
    <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
      <SheetTrigger asChild>
        <div className="text-[18px] flex items-center justify-between gap-[10px] bg-[#ededed] p-[20px] rounded cursor-pointer hover:bg-white transition-all duration-500">
          <p className="w-[100px]">{index + 1}</p>
          <p className="w-[140px] truncate" title={name}>
            {mailHover === index ? name : `${name.slice(0, 5)}...`}
          </p>
          <p
            className={`transition truncate ${
              index === mailHover ? "w-fit" : "w-[140px]"
            }`}
            title={email}
          >
            {mailHover === index ? email : `${email.slice(0, 5)}...`}
          </p>
          <div
            className={`px-[10px] text-[14px] py-[6px] ${
              emailVerified ? "text-green-600" : "text-red-600"
            } bg-[#dfe4e2] text-center w-[140px] rounded-full`}
          >
            {emailVerified ? "Yes" : "No"}
          </div>
          <p
            className={`px-[10px] text-[14px] py-[6px] ${
              status === 1 ? "text-green-600" : "text-red-600"
            } bg-[#dfe4e2] text-center w-[140px] rounded-full`}
          >
            {status === 1 ? "Active" : "Inactive"}
          </p>
          <p className="w-[180px] truncate" title={creatDate}>
            {mailHover === index ? creatDate : `${creatDate.slice(0, 12)}...`}
          </p>
          <p className="w-[180px] truncate" title={updateDate}>
            {mailHover === index ? updateDate : `${updateDate.slice(0, 12)}...`}
          </p>
        </div>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="w-full sm:max-w-[90vw] md:max-w-[80vw] lg:max-w-[85vw] xl:max-w-[1400px] p-0 overflow-hidden flex flex-col bg-white"
      >
        <div className="flex h-full overflow-hidden">
          {/* Left Sidebar */}
          <div className="w-96 flex-shrink-0 bg-gray-50 p-6 overflow-y-auto border-r">
            {/* Owner Profile Card */}
            <div className="bg-gray-100 rounded-lg p-6 mb-6">
              <div className="flex items-center gap-4 mb-4">
                <Image
                  src={
                    user?.image && user.image.trim() !== ""
                      ? user.image
                      : "https://holaimagesdata.s3.us-west-2.amazonaws.com/web/vector-images/user_logo.webp"
                  }
                  alt={name}
                  width={64}
                  height={64}
                  className="w-16 h-16 rounded-full object-cover border-2 border-gray-300"
                />
                <div>
                  <h2 className="text-xl font-semibold">{name}</h2>
                  <p className="text-sm text-gray-600">Joined: {creatDate}</p>
                  <p className="text-sm text-gray-600 text-xs mt-1 break-all">
                    ID: {id}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 mb-4">
                <Button variant="outline" size="sm" className="flex-1">
                  Mail
                </Button>
              </div>
            </div>

            {/* Store Summary List */}
            <div className="bg-white rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Quick Stores</h3>
              <div className="space-y-3">
                {loadingData ? (
                  <p className="text-sm text-gray-500">Loading stores...</p>
                ) : (
                  storeData.slice(0, 5).map((store, idx) => (
                    <div
                      key={idx}
                      className="flex gap-3 text-sm border-b pb-2"
                    >
                      <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                        <span className="font-bold text-gray-600">
                          {idx + 1}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{store.name}</p>
                        <p className="text-gray-500 text-xs">
                          Since: {formatDate(store.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                {storeData.length === 0 && !loadingData && (
                  <p className="text-sm text-gray-500">No stores found.</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <SheetHeader className="p-6 border-b">
              <SheetTitle>Owner Activity - {name}</SheetTitle>
              <SheetDescription
                className={`${
                  status === 1 ? "text-green-600" : "text-red-600"
                }`}
              >
                {status === 1 ? `Active Account` : `Inactive Account`}
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto p-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <StatCard
                  icon={
                    <svg
                      className="w-5 h-5 text-orange-600"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M20.5 8H19V5.5a1.5 1.5 0 0 0-1.5-1.5H14V2h-2v2H7v2h7.5a.5.5 0 0 1 .5.5V8H11c-1.1 0-2 .9-2 2v3.1A4.9 4.9 0 0 0 5 13a5 5 0 1 0 5 5h4a4 4 0 1 0 4-4h-1v-4h3.5V8zM5 20a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm13-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
                    </svg>
                  }
                  title="Total Tractors"
                  value={loadingData ? "..." : stats.totalTractor.value}
                  inUse={loadingData ? "..." : stats.totalTractor.inUse}
                />
                <StatCard
                  icon={
                    <svg
                      className="w-5 h-5 text-orange-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  }
                  title="Total Bookings"
                  value={loadingData ? "..." : stats.totalBookings.value}
                  inUse={loadingData ? "..." : stats.totalBookings.inUse}
                />
                <StatCard
                  icon={
                    <svg
                      className="w-5 h-5 text-orange-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                  }
                  title="Total Stores"
                  value={loadingData ? "..." : stats.totalStores.value}
                  inUse={loadingData ? "..." : stats.totalStores.inUse}
                />
                <StatCard
                  icon={
                    <svg
                      className="w-5 h-5 text-orange-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                      />
                    </svg>
                  }
                  title="Total Attachments"
                  value={loadingData ? "..." : stats.totalAttachment.value}
                  inUse={loadingData ? "..." : stats.totalAttachment.inUse}
                />
                <StatCard
                  icon={
                    <svg
                      className="w-5 h-5 text-orange-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                  }
                  title="Total Operators"
                  value={loadingData ? "..." : stats.totalOperators.value}
                  inUse={loadingData ? "..." : stats.totalOperators.inUse}
                />
              </div>

              {/* Tabs */}
              <div className="bg-white rounded-lg border">
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
                </div>

                {/* Tab Content */}
                <div className="p-6">
                  {loadingData ? (
                    <div className="flex justify-center p-8">
                      <CircularProgress />
                    </div>
                  ) : (
                    <>
                      {/* Stores Tab */}
                      {activeTab === "stores" && (
                        <div className="space-y-3">
                          {storeData.length === 0 ? (
                            <p className="text-gray-500 text-center">
                              No stores found
                            </p>
                          ) : (
                            storeData.map((store, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                              >
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 bg-gray-200 rounded-md overflow-hidden relative">
                                    {store.image ? (
                                      <Image
                                        src={store.image}
                                        alt={store.name}
                                        fill
                                        className="object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        IMG
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <p className="font-medium">{store.name}</p>
                                    <p className="text-sm text-gray-600 line-clamp-1">
                                      {store.description}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      Created: {formatDate(store.createdAt)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}

                      {/* Booking Tab */}
                      {activeTab === "booking" && (
                        <div className="space-y-3">
                          {flattenedBookings.length === 0 ? (
                            <p className="text-gray-500 text-center">
                              No bookings found
                            </p>
                          ) : (
                            flattenedBookings.map((booking, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                              >
                                <div className="flex items-center gap-4">
                                  <svg
                                    className="w-8 h-8 text-gray-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                  </svg>
                                  <div>
                                    <p className="font-medium">
                                      {booking.customerName} -{" "}
                                      {booking.bookingType || "Booking"}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      Store: {booking.storeName}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      Cost: ${booking.total_cost || 0} • Date:{" "}
                                      {formatDate(booking.createdAt)}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span
                                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                                      booking.bookingStatus === "Finished" ||
                                      booking.bookingStatus === "Paid"
                                        ? "bg-green-100 text-green-700"
                                        : booking.bookingStatus === "Rejected"
                                        ? "bg-red-100 text-red-700"
                                        : "bg-orange-100 text-orange-700"
                                    }`}
                                  >
                                    {booking.bookingStatus}
                                  </span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}

                      {/* Operator Tab */}
                      {activeTab === "operator" && (
                        <div className="space-y-3">
                          {flattenedOperators.length === 0 ? (
                            <p className="text-gray-500 text-center">
                              No operators found
                            </p>
                          ) : (
                            flattenedOperators.map((operator, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                              >
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
                                    O
                                  </div>
                                  <div>
                                    <p className="font-medium">
                                      {operator.name}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      Cost/Job: ${operator.cost_per_job}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      Store: {operator.storeName}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span
                                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                                      operator.status === "Active"
                                        ? "bg-blue-100 text-blue-700"
                                        : "bg-gray-100 text-gray-700"
                                    }`}
                                  >
                                    {operator.status}
                                  </span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}

                      {/* Device / Tractor Tab */}
                      {activeTab === "device" && (
                        <div className="space-y-3">
                          {flattenedDevices.length === 0 ? (
                            <p className="text-gray-500 text-center">
                              No tractors found
                            </p>
                          ) : (
                            flattenedDevices.map((device, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                              >
                                <div className="flex items-center gap-4">
                                  {device.image ? (
                                    <div className="w-12 h-12 relative rounded-md overflow-hidden">
                                      <Image
                                        src={device.image}
                                        alt={device.name}
                                        fill
                                        className="object-cover"
                                      />
                                    </div>
                                  ) : (
                                    <svg
                                      className="w-8 h-8 text-gray-400"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                                      />
                                    </svg>
                                  )}

                                  <div>
                                    <p className="font-medium">{device.name}</p>
                                    <p className="text-sm text-gray-600">
                                      Model: {device.model}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      Store: {device.storeName} • $
                                      {device.hourly_price}/hr
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                                    Listed
                                  </span>
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

            {/* Footer Actions */}
            <SheetFooter className="flex justify-between items-center p-6 border-t mt-auto">
              <Button
                type="button"
                variant="destructive"
                onClick={DeleteOwner}
                disabled={loading.delete}
              >
                {loading.delete ? <CircularProgress size={16} /> : "Delete"}
              </Button>

              <div className="flex gap-3">
                {status === 1 ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={InactiveOwner}
                    disabled={loading.inactive}
                  >
                    {loading.inactive ? (
                      <CircularProgress size={16} />
                    ) : (
                      "Inactive"
                    )}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    className="bg-green-800 hover:bg-green-700"
                    onClick={ActiveOwner}
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

export default OwnerAction;