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
import { Trash2, TrendingUp, Phone, Mail, Download, MessageSquare, Menu, X, CheckCircle, XCircle, Clock } from "lucide-react";
import Image from "next/image";

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
  user?: {
    first_name?: string;
    last_name?: string;
    email?: string;
  };
  tractor?: {
    name?: string;
    model?: string;
  };
  TractorInStore?: {
    baseTractor?: {
      name?: string;
      model?: string;
    };
  };
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
  user_id?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  middle_name?: string;
  user?: {
    id?: string;
    first_name?: string;
    last_name?: string;
    middle_name?: string;
    email?: string;
    phone?: string;
  };
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

// --- Interfaces for Subscription & Payment ---
interface SubscriptionPlan {
  id: string;
  name: string;
  type: string;
  actual_cost: number;
  discount_cost: number;
  features: string[];
  focused_features: string[];
  total_days: number;
  total_stores: number;
  total_devices: number | null;
  total_operators: number;
  total_tractors: number;
  total_attachments: number;
  for_owner: boolean;
  for_dealer: boolean;
}

interface Subscription {
  id: string;
  user_id: string;
  subscription_id: string;
  end_date: string;
  base_id: string;
  status: boolean;
  createdAt: string;
  updatedAt: string;
  subscription?: SubscriptionPlan;
}

interface Payment {
  id: string;
  amount: number;
  status: string;
  payment_method?: string;
  transaction_method?: string;
  transaction_reference?: string;
  payment_type?: string;
  sender_name?: string;
  createdAt: string;
  booking_id?: string;
  user_id?: string;
  description?: string;
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
  const [activeTab, setActiveTab] = useState("booking");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // State for fetched data
  const [loadingData, setLoadingData] = useState(false);
  const [storeData, setStoreData] = useState<Store[]>([]);

  // State for subscription and payments
  const [subscriptionData, setSubscriptionData] = useState<Subscription | null>(null);
  const [paymentsData, setPaymentsData] = useState<Payment[]>([]);
  const [loadingSubscription, setLoadingSubscription] = useState(false);
  const [verifyingSubscription, setVerifyingSubscription] = useState(false);
  const [loadingPayments, setLoadingPayments] = useState(false);

  // Calculated Stats State
  const [stats, setStats] = useState({
    totalStores: { value: 0, inUse: 0 },
    totalTractor: { value: 0, inUse: 0 },
    totalBookings: { value: 0, inUse: 0 },
    totalAttachment: { value: 0, inUse: 0 },
    totalOperators: { value: 0, inUse: 0 },
    totalFarmers: { value: 0, inUse: 0 },
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

  // --- Fetch Store Data ---
  const fetchOwnerStoreDetails = async () => {
    if (!user?.id) {
      errorMessage("User ID is missing");
      return;
    }

    setLoadingData(true);
    try {
      const apiUrl = `/store/byowners?owner_user_id=${user.id}`;
      const response = await renderInstance.get(apiUrl, {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      const stores: Store[] = response.data;

      if (!Array.isArray(stores)) {
        errorMessage("Invalid data format received");
        return;
      }

      // DEBUG: Log the operator structure
      console.log("=== FULL STORE DATA ===");
      console.log(JSON.stringify(stores, null, 2));

      if (stores[0]?.OperatorInStore?.[0]) {
        console.log("=== FIRST OPERATOR DETAILS ===");
        console.log(JSON.stringify(stores[0].OperatorInStore[0], null, 2));
      }

      setStoreData(stores);
      processStatsAndTabs(stores);
    } catch (error: any) {
      errorMessage(error?.response?.data?.message || "Failed to load owner details");
    } finally {
      setLoadingData(false);
    }
  };

  // Fetch Subscription Data
  const fetchSubscriptionData = async () => {
    if (!user?.id) {
      errorMessage("User ID is missing");
      return;
    }

    setLoadingSubscription(true);
    try {
      const apiUrl = `/subscription/owner_verify/${user.id}`;
      const response = await renderInstance.get(apiUrl, {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      setSubscriptionData(response.data);
    } catch (error: any) {
      console.error("Subscription fetch error:", error);
      setSubscriptionData(null);
    } finally {
      setLoadingSubscription(false);
    }
  };

  // NEW: Verify Owner Subscription
  const verifyOwnerSubscription = async () => {
    if (!user?.id) {
      errorMessage("Owner ID is missing");
      return;
    }

    setVerifyingSubscription(true);
    try {
      const apiUrl = `/subscription/owner_verify/${user.id}`;
      await renderInstance.get(apiUrl, {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      successMessage("Subscription verified successfully");

      // Refresh subscription data after verification
      await fetchSubscriptionData();
    } catch (error: any) {
      errorMessage(
        error?.response?.data?.message || "Failed to verify subscription"
      );
    } finally {
      setVerifyingSubscription(false);
    }
  };

  // Fetch Payments Data
  const fetchPaymentsData = async () => {
    if (!user?.id) {
      errorMessage("User ID is missing");
      return;
    }

    setLoadingPayments(true);
    try {
      const apiUrl = `/admin/owners/${user.id}/payments`;
      const response = await renderInstance.get(apiUrl, {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      console.log("PAYMENT API RESPONSE:", response.data);

      const payments = Array.isArray(response.data?.payments)
        ? response.data.payments
        : [];

      setPaymentsData(payments);
    } catch (error: any) {
      console.error("Payments fetch error:", error);
      setPaymentsData([]);
    } finally {
      setLoadingPayments(false);
    }
  };


  // --- Process Data Logic ---
  const processStatsAndTabs = (stores: Store[]) => {
    const totalStoresCount = stores.length;
    const totalTractorsCount = stores.reduce((sum, store) => sum + (store.TractorInStore?.length || 0), 0);
    const totalAttachmentsCount = stores.reduce((sum, store) => sum + (store.AttachmentInStore?.length || 0), 0);
    const totalBookingsCount = stores.reduce((sum, store) => sum + (store.Booking?.length || 0), 0);
    const totalOperatorsCount = stores.reduce((sum, store) => sum + (store.OperatorInStore?.length || 0), 0);

    const activeStatus = ["Open", "Arriving", "Started", "Accepted", "Arrived"];

    const activeBookingsCount = stores.reduce((sum, store) => {
      const activeBookings = store.Booking?.filter((b) => activeStatus.includes(b.bookingStatus)) || [];
      return sum + activeBookings.length;
    }, 0);

    const activeOperatorsCount = stores.reduce((sum, store) => {
      const activeOps = store.OperatorInStore?.filter((op) => op.status === "Active") || [];
      return sum + activeOps.length;
    }, 0);

    setStats({
      totalStores: { value: totalStoresCount, inUse: totalStoresCount },
      totalTractor: { value: totalTractorsCount, inUse: activeBookingsCount },
      totalBookings: { value: totalBookingsCount, inUse: activeBookingsCount },
      totalAttachment: { value: totalAttachmentsCount, inUse: 0 },
      totalOperators: { value: totalOperatorsCount, inUse: activeOperatorsCount },
      totalFarmers: { value: 0, inUse: 0 },
    });

    const allBookings = stores
      .flatMap(
        (store) =>
          store.Booking?.map((b) => ({
            ...b,
            storeName: store.name,
            customerName: b.user
              ? `${b.user.first_name ?? ""} ${b.user.last_name ?? ""}`.trim() || "Guest User"
              : "Guest User",
            tractorName: b.tractor?.name || "Tractor Not Assigned",
            tractorModel: b.tractor?.model || "N/A",
          })) || []
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    setFlattenedBookings(allBookings);

    const allOperators = stores.flatMap(
      (store) =>
        store.OperatorInStore?.map((op) => {
          let operatorName = "Unknown Operator";

          if (op.operator?.user) {
            const firstName = op.operator.user.first_name || "";
            const lastName = op.operator.user.last_name || "";
            const fullName = `${firstName} ${lastName}`.trim();

            if (fullName) {
              operatorName = fullName;
            } else if (op.operator.user.email) {
              operatorName = op.operator.user.email.split("@")[0];
            } else {
              operatorName = `Operator-${op.id.slice(0, 8)}`;
            }
          }


          return {
            ...op,
            storeName: store.name,
            name: operatorName,
            email: op.operator?.user?.email || "No Email",
            phone: op.operator?.user?.phone || "No Phone",

          };
        }) || []
    );
    setFlattenedOperators(allOperators);

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
      fetchSubscriptionData();
      fetchPaymentsData();
    }
  }, [sheetOpen]);

  useEffect(() => {
    if (sheetOpen && activeTab === "subscription" && !subscriptionData) {
      fetchSubscriptionData();
    }
    if (sheetOpen && activeTab === "payment" && paymentsData.length === 0) {
      fetchPaymentsData();
    }
  }, [activeTab, sheetOpen]);

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const tabs = [
    { id: "stores", label: "Stores" },
    { id: "booking", label: "Booking" },
    { id: "payment", label: "Payment" },
    { id: "operator", label: "Operator" },
    { id: "device", label: "Device" },
    { id: "subscription", label: "Subscription" },
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
    updateOwnerStatus(`/owner/activate_owner/${id}`, "active", "Activated successfully");
  const InactiveOwner = () =>
    updateOwnerStatus(`/owner/inactivate_owner/${id}`, "inactive", "Inactivated successfully");

  const StatCard = ({ icon, title, value, inUse, dataDate }: any) => (
    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 relative">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
            {icon}
          </div>
        </div>
        <TrendingUp className="w-5 h-5 text-green-600" />
      </div>
      <div className="mb-1">
        <p className="text-sm font-medium text-gray-700 mb-2">{title}</p>
        <div className="text-2xl sm:text-3xl font-bold text-gray-900">{value}</div>
      </div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-xs mt-3 gap-1">
        <span className="text-gray-600">In use {inUse}</span>
        <span className="text-green-600">Data as per {dataDate}</span>
      </div>
    </div>
  );

  return (
    <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
      <SheetTrigger asChild>
        <div className="text-sm sm:text-base md:text-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-[10px] bg-[#ededed] p-3 sm:p-[20px] rounded cursor-pointer hover:bg-white transition-all duration-500">
          <div className="flex sm:hidden w-full justify-between items-center">
            <div className="flex items-center gap-3">
              <p className="font-semibold">{index + 1}</p>
              <div>
                <p className="font-medium truncate max-w-[150px]">{name}</p>
                <p className="text-xs text-gray-600 truncate max-w-[150px]">{email}</p>
              </div>
            </div>
            <div className={`px-2 py-1 text-xs ${status === 1 ? "text-green-600" : "text-red-600"
              } bg-[#dfe4e2] rounded-full`}>
              {status === 1 ? "Active" : "Inactive"}
            </div>
          </div>

          <div className="hidden sm:flex items-center justify-between gap-[10px] w-full">
            <p className="w-[100px]">{index + 1}</p>
            <p className="w-[140px] truncate" title={name}>
              {mailHover === index ? name : `${name.slice(0, 5)}...`}
            </p>
            <p className={`transition truncate ${index === mailHover ? "w-fit" : "w-[140px]"}`} title={email}>
              {mailHover === index ? email : `${email.slice(0, 5)}...`}
            </p>
            <div className={`px-[10px] text-[14px] py-[6px] ${emailVerified ? "text-green-600" : "text-red-600"
              } bg-[#dfe4e2] text-center w-[140px] rounded-full`}>
              {emailVerified ? "Yes" : "No"}
            </div>
            <p className={`px-[10px] text-[14px] py-[6px] ${status === 1 ? "text-green-600" : "text-red-600"
              } bg-[#dfe4e2] text-center w-[140px] rounded-full`}>
              {status === 1 ? "Active" : "Inactive"}
            </p>
            <p className="w-[180px] truncate" title={creatDate}>
              {mailHover === index ? creatDate : `${creatDate.slice(0, 12)}...`}
            </p>
            <p className="w-[180px] truncate" title={updateDate}>
              {mailHover === index ? updateDate : `${updateDate.slice(0, 12)}...`}
            </p>
          </div>
        </div>
      </SheetTrigger>

      <SheetContent side="right" className="w-full sm:max-w-[95vw] p-0 overflow-hidden flex flex-col bg-gray-50">
        <div className="flex h-full overflow-hidden relative">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className={`
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            lg:translate-x-0
            fixed lg:relative
            w-80 h-full
            flex-shrink-0 bg-white p-4 sm:p-6 overflow-y-auto border-r
            transition-transform duration-300 ease-in-out
            z-40
          `}>
            <div className="bg-gray-100 rounded-xl p-4 sm:p-6 mb-6">
              <div className="flex items-center gap-3 sm:gap-4 mb-4">
                <Image
                  src={
                    user?.image && user.image.trim() !== ""
                      ? user.image
                      : "https://holaimagesdata.s3.us-west-2.amazonaws.com/web/vector-images/user_logo.webp"
                  }
                  alt={name}
                  width={64}
                  height={64}
                  className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-gray-300"
                />
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg sm:text-xl font-semibold truncate">{name}</h2>
                  <p className="text-xs sm:text-sm text-gray-600 truncate">Created on {creatDate}</p>
                  <p className="text-xs text-gray-500 mt-1 truncate">ID: {id.slice(0, 12)}...</p>
                </div>
              </div>
              <div className="flex gap-2 mb-4">
                <Button variant="outline" size="sm" className="flex-1 text-xs sm:text-sm">
                  <Phone className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Call
                </Button>
                <Button variant="outline" size="sm" className="flex-1 text-xs sm:text-sm">
                  <Mail className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Mail
                </Button>
              </div>
              <p className="text-xs text-gray-600 truncate">Last Activity: {updateDate}</p>
            </div>

            <div className="mb-6">
              <h3 className="text-base sm:text-lg font-semibold mb-4">Activities</h3>
              <div className="space-y-3">
                {[1, 2, 3].map((item, idx) => (
                  <div key={idx} className="flex gap-2 sm:gap-3 text-sm pb-3 border-b">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm truncate"><span className="font-medium">Paul Sans</span> tagged you in a comment</p>
                      <p className="text-xs text-gray-500">Today: 12:10 pm</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-4">Purchase Activities</h3>
              <div className="space-y-3">
                {[1, 2, 3, 4].map((item, idx) => (
                  <div key={idx} className="flex gap-2 sm:gap-3 text-sm pb-3 border-b">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.5 8H19V5.5a1.5 1.5 0 0 0-1.5-1.5H14V2h-2v2H7v2h7.5a.5.5 0 0 1 .5.5V8H11c-1.1 0-2 .9-2 2v3.1A4.9 4.9 0 0 0 5 13a5 5 0 1 0 5 5h4a4 4 0 1 0 4-4h-1v-4h3.5V8zM5 20a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm13-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm truncate"><span className="font-medium">Purchased</span> New Holland 5053 Tractor</p>
                      <p className="text-xs text-gray-500">Today: 12:10 pm</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {sidebarOpen && (
            <div
              className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
            <SheetHeader className="p-4 sm:p-6 bg-white border-b">
              <SheetTitle className="text-lg sm:text-xl truncate">{name}</SheetTitle>
              <SheetDescription className={`text-sm ${status === 1 ? "text-green-600" : "text-red-600"}`}>
                {status === 1 ? `Active Account` : `Inactive Account`}
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6">
                <StatCard
                  icon={
                    <svg className="w-4 h-4 sm:w-5 text-orange-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.5 8H19V5.5a1.5 1.5 0 0 0-1.5-1.5H14V2h-2v2H7v2h7.5a.5.5 0 0 1 .5.5V8H11c-1.1 0-2 .9-2 2v3.1A4.9 4.9 0 0 0 5 13a5 5 0 1 0 5 5h4a4 4 0 1 0 4-4h-1v-4h3.5V8zM5 20a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm13-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
                    </svg>
                  }
                  title="Total Tractor"
                  value={loadingData ? "..." : stats.totalTractor.value}
                  inUse={loadingData ? "..." : stats.totalTractor.inUse}
                  dataDate="20 Jul 2025"
                />
                <StatCard
                  icon={
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  }
                  title="Total Bookings"
                  value={loadingData ? "..." : stats.totalBookings.value}
                  inUse={loadingData ? "..." : stats.totalBookings.inUse}
                  dataDate="20 Jul 2025"
                />
                <StatCard
                  icon={
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  }
                  title="Total Stores"
                  value={loadingData ? "..." : stats.totalStores.value}
                  inUse={loadingData ? "..." : stats.totalStores.inUse}
                  dataDate="20 Jul 2025"
                />
                <StatCard
                  icon={
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                  }
                  title="Total Attachment"
                  value={loadingData ? "..." : stats.totalAttachment.value}
                  inUse={loadingData ? "..." : stats.totalAttachment.inUse}
                  dataDate="20 Jul 2025"
                />
                <StatCard
                  icon={
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  }
                  title="Total Operators"
                  value={loadingData ? "..." : stats.totalOperators.value}
                  inUse={loadingData ? "..." : stats.totalOperators.inUse}
                  dataDate="20 Jul 2025"
                />
                <StatCard
                  icon={
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  }
                  title="Total Farmers"
                  value={loadingData ? "..." : stats.totalFarmers.value}
                  inUse={loadingData ? "..." : stats.totalFarmers.inUse}
                  dataDate="20 Jul 2025"
                />
              </div>

              <div className="bg-white rounded-xl border">
                <div className="border-b border-gray-200 px-3 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 py-3 sm:py-0">
                  <div className="flex gap-1 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id
                          ? "border-black text-black"
                          : "border-transparent text-gray-600 hover:text-gray-900"
                          }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                  <Button variant="outline" size="sm" className="text-xs sm:text-sm w-full sm:w-auto">
                    <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    Export
                  </Button>
                </div>

                <div className="p-3 sm:p-6">
                  {activeTab === "stores" && (
                    <div className="space-y-3">
                      {loadingData ? (
                        <div className="flex justify-center p-8">
                          <CircularProgress />
                        </div>
                      ) : storeData.length === 0 ? (
                        <p className="text-gray-500 text-center text-sm">No stores found</p>
                      ) : (
                        storeData.map((store, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors gap-3"
                          >
                            <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 rounded-md overflow-hidden relative flex-shrink-0">
                                {store.image ? (
                                  <Image
                                    src={store.image}
                                    alt={store.name}
                                    fill
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                    IMG
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-sm sm:text-base truncate">{store.name}</p>
                                <p className="text-xs sm:text-sm text-gray-600 truncate">{store.description}</p>
                                <p className="text-xs text-gray-500">Created: {formatDate(store.createdAt)}</p>
                              </div>
                            </div>
                            <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 cursor-pointer hover:text-red-500 flex-shrink-0" />
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {activeTab === "booking" && (
                    <div className="space-y-3">
                      {loadingData ? (
                        <div className="flex justify-center p-8">
                          <CircularProgress />
                        </div>
                      ) : flattenedBookings.length === 0 ? (
                        <p className="text-gray-500 text-center text-sm">No bookings found</p>
                      ) : (
                        flattenedBookings.map((booking, idx) => (
                          <div
                            key={idx}
                            className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors gap-3"
                          >
                            <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 w-full sm:w-auto">
                              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-md flex items-center justify-center flex-shrink-0">
                                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M20.5 8H19V5.5a1.5 1.5 0 0 0-1.5-1.5H14V2h-2v2H7v2h7.5a.5.5 0 0 1 .5.5V8H11c-1.1 0-2 .9-2 2v3.1A4.9 4.9 0 0 0 5 13a5 5 0 1 0 5 5h4a4 4 0 1 0 4-4h-1v-4h3.5V8zM5 20a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm13-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
                                </svg>
                              </div>
                              <div className="min-w-0 flex-1">
                                {/* <p className="font-medium text-sm sm:text-base truncate">{booking.tractorName}</p> */}
                                <p className="font-medium text-sm sm:text-base truncate">Customer: {booking.customerName}</p>
                                <p className="text-xs text-gray-500 truncate">Store: {booking.storeName}</p>
                                <p className="text-xs text-gray-500">
                                  Booked: {formatDate(booking.createdAt)} • ${booking.total_cost}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                              <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap ${['Open', 'Arriving', 'Started', 'Accepted', 'Arrived'].includes(booking.bookingStatus)
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-700"
                                }`}>
                                {booking.bookingStatus}
                              </span>
                              <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 cursor-pointer hover:text-red-500 flex-shrink-0" />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {activeTab === "payment" && (
                    <div className="space-y-3">
                      {loadingPayments ? (
                        <div className="flex justify-center p-8">
                          <CircularProgress />
                        </div>
                      ) : paymentsData.length === 0 ? (
                        <p className="text-gray-500 text-center text-sm">No payment records available</p>
                      ) : (
                        paymentsData.map((payment, idx) => (
                          <div
                            key={idx}
                            className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors gap-3"
                          >
                            <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 w-full sm:w-auto">
                              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-md flex items-center justify-center flex-shrink-0">
                                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-sm sm:text-base">${payment.amount}</p>
                                <div className="mt-1 space-y-0.5 text-xs sm:text-sm text-gray-600">
                                  <div className="flex gap-1">
                                    <span className="font-medium text-gray-700">Sender:</span>
                                    <span className="truncate">{payment.sender_name || "N/A"}</span>
                                  </div>

                                  <div className="flex gap-1">
                                    <span className="font-medium text-gray-700">Method:</span>
                                    <span className="truncate">{payment.transaction_method || "N/A"}</span>
                                  </div>

                                  <div className="flex gap-1">
                                    <span className="font-medium text-gray-700">Booking ID:</span>
                                    <span className="truncate">{payment.booking_id || "N/A"}</span>
                                  </div>
                                </div>

                              </div>
                            </div>
                            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                              <span
                                className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${payment.status?.toLowerCase() === "completed"
                                  ? "bg-green-100 text-green-700"
                                  : payment.status?.toLowerCase() === "pending"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-red-100 text-red-700"
                                  }`}
                              >
                                {payment.status}
                              </span>

                              <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 cursor-pointer hover:text-red-500 flex-shrink-0" />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {activeTab === "operator" && (
                    <div className="space-y-3">
                      {loadingData ? (
                        <div className="flex justify-center p-8">
                          <CircularProgress />
                        </div>
                      ) : flattenedOperators.length === 0 ? (
                        <p className="text-gray-500 text-center text-sm">No operators found</p>
                      ) : (
                        flattenedOperators.map((operator, idx) => (
                          <div
                            key={idx}
                            className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors gap-3"
                          >
                            <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 w-full sm:w-auto">
                              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 flex-shrink-0">
                                O
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-sm sm:text-base truncate">{operator.name}</p>
                                <p className="text-xs sm:text-sm text-gray-600">Cost/Job: ${operator.cost_per_job}</p>
                                <p className="text-xs text-gray-500 truncate">Store: {operator.storeName}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                              <span
                                className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap ${operator.status === "Active"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-gray-100 text-gray-700"
                                  }`}
                              >
                                {operator.status}
                              </span>
                              <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 cursor-pointer hover:text-red-500 flex-shrink-0" />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {activeTab === "device" && (
                    <div className="space-y-3">
                      {loadingData ? (
                        <div className="flex justify-center p-8">
                          <CircularProgress />
                        </div>
                      ) : flattenedDevices.length === 0 ? (
                        <p className="text-gray-500 text-center text-sm">No devices found</p>
                      ) : (
                        flattenedDevices.map((device, idx) => (
                          <div
                            key={idx}
                            className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors gap-3"
                          >
                            <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 w-full sm:w-auto">
                              {device.image ? (
                                <div className="w-10 h-10 sm:w-12 sm:h-12 relative rounded-md overflow-hidden flex-shrink-0">
                                  <Image
                                    src={device.image}
                                    alt={device.name}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                              ) : (
                                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M20.5 8H19V5.5a1.5 1.5 0 0 0-1.5-1.5H14V2h-2v2H7v2h7.5a.5.5 0 0 1 .5.5V8H11c-1.1 0-2 .9-2 2v3.1A4.9 4.9 0 0 0 5 13a5 5 0 1 0 5 5h4a4 4 0 1 0 4-4h-1v-4h3.5V8zM5 20a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm13-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
                                </svg>
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-sm sm:text-base truncate">{device.name}</p>
                                <p className="text-xs sm:text-sm text-gray-600 truncate">Model: {device.model}</p>
                                <p className="text-xs text-gray-500 truncate">Store: {device.storeName}</p>
                                <p className="text-xs text-gray-500">${device.hourly_price}/hr</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                              <span className="px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-green-100 text-green-700 whitespace-nowrap">
                                Listed
                              </span>
                              <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 cursor-pointer hover:text-red-500 flex-shrink-0" />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {activeTab === "subscription" && (
                    <div className="space-y-3">
                      {loadingSubscription ? (
                        <div className="flex justify-center p-8">
                          <CircularProgress />
                        </div>
                      ) : !subscriptionData ? (
                        <div className="text-center p-8 bg-gray-50 rounded-lg">
                          <XCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                          <p className="text-gray-500 text-sm">No active subscription found</p>
                        </div>
                      ) : (
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                                <CheckCircle className="w-6 h-6 text-white" />
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {subscriptionData.subscription?.name || "Subscription Plan"}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  ID: {subscriptionData.id.slice(0, 12)}...
                                </p>
                              </div>
                            </div>

                            <span
                              className={`px-3 py-1 rounded-full text-sm font-medium ${subscriptionData.status
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                                }`}
                            >
                              {subscriptionData.status ? "Active" : "Inactive"}
                            </span>
                          </div>

                          {/* Subscription Details */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                            {subscriptionData.subscription?.discount_cost && (
                              <div className="bg-white rounded-lg p-4">
                                <p className="text-xs text-gray-600 mb-1">Amount</p>
                                <p className="text-xl font-bold text-gray-900">
                                  ${subscriptionData.subscription.discount_cost}
                                </p>
                                {subscriptionData.subscription.actual_cost !== subscriptionData.subscription.discount_cost && (
                                  <p className="text-xs text-gray-500 line-through">
                                    ${subscriptionData.subscription.actual_cost}
                                  </p>
                                )}
                              </div>
                            )}

                            <div className="bg-white rounded-lg p-4">
                              <p className="text-xs text-gray-600 mb-1">Duration</p>
                              <p className="text-sm font-medium text-gray-900">
                                {subscriptionData.subscription?.total_days || 0} Days
                              </p>
                            </div>

                            <div className="bg-white rounded-lg p-4">
                              <p className="text-xs text-gray-600 mb-1">Start Date</p>
                              <p className="text-sm font-medium text-gray-900">
                                {formatDate(subscriptionData.createdAt)}
                              </p>
                            </div>

                            {subscriptionData.end_date && (
                              <div className="bg-white rounded-lg p-4">
                                <p className="text-xs text-gray-600 mb-1">End Date</p>
                                <p className="text-sm font-medium text-gray-900">
                                  {formatDate(subscriptionData.end_date)}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Plan Limits */}
                          {subscriptionData.subscription && (
                            <div className="bg-white rounded-lg p-4 mb-4">
                              <p className="text-sm font-semibold text-gray-900 mb-3">Plan Limits</p>
                              <div className="grid grid-cols-2 gap-3 text-xs">
                                <div>
                                  <p className="text-gray-600">Stores</p>
                                  <p className="font-medium">{subscriptionData.subscription.total_stores}</p>
                                </div>
                                <div>
                                  <p className="text-gray-600">Tractors</p>
                                  <p className="font-medium">{subscriptionData.subscription.total_tractors}</p>
                                </div>
                                <div>
                                  <p className="text-gray-600">Operators</p>
                                  <p className="font-medium">{subscriptionData.subscription.total_operators}</p>
                                </div>
                                <div>
                                  <p className="text-gray-600">Attachments</p>
                                  <p className="font-medium">{subscriptionData.subscription.total_attachments}</p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Features */}
                          {subscriptionData.subscription?.features && subscriptionData.subscription.features.length > 0 && (
                            <div className="bg-white rounded-lg p-4 mb-4">
                              <p className="text-sm font-semibold text-gray-900 mb-2">Features</p>
                              <ul className="space-y-1 text-xs text-gray-600">
                                {subscriptionData.subscription.features.map((feature, idx) => (
                                  <li key={idx} className="flex items-start gap-2">
                                    <CheckCircle className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                                    <span>{feature}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* VERIFY SUBSCRIPTION BUTTON */}
                          <div className="flex gap-3">
                            <Button
                              onClick={verifyOwnerSubscription}
                              disabled={verifyingSubscription}
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                            >
                              {verifyingSubscription ? (
                                <>
                                  <CircularProgress size={16} className="text-white mr-2" />
                                  Verifying...
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Verify Subscription
                                </>
                              )}
                            </Button>
                          </div>

                          <p className="text-xs text-gray-600 mt-3">
                            Last updated: {formatDateTime(subscriptionData.updatedAt)}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <SheetFooter className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center p-4 sm:p-6 border-t bg-white mt-auto gap-3">
              <Button
                type="button"
                variant="destructive"
                onClick={DeleteOwner}
                disabled={loading.delete}
                className="w-full sm:w-auto"
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
                    className="flex-1 sm:flex-none"
                  >
                    {loading.inactive ? <CircularProgress size={16} /> : "Inactive"}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    className="bg-green-800 hover:bg-green-700 flex-1 sm:flex-none"
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