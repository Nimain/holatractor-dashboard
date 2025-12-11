"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { CheckCircle, XCircle, Trash2, TrendingUp } from "lucide-react";
import Image from "next/image";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";

// Utils
export function formatDateOnly(dateString?: string | null) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// Interfaces
interface UserDetails {
  first_name?: string | null;
  middle_name?: string | null;
  last_name?: string | null;
  gender?: string | null;
  dob?: string | null;
  email?: string | null;
  emailVerified?: boolean | null;
  mobile?: string | null;
  phoneVerified?: boolean | null;
  country_code?: string | null;
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

  const { language: locale } = useSelector(
    (root: RootState) => root.ActiveLanguage
  );

  const getTranslation = (locale: string, translations: any) => {
    return translations[locale] || translations["en"];
  };

  const [loading, setLoading] = useState<{
    delete: boolean;
    active: boolean;
    inactive: boolean;
  }>({
    delete: false,
    active: false,
    inactive: false,
  });

  // Mock data for tabs - replace with actual API calls based on owner ID
  const [ownerActivityData, setOwnerActivityData] = useState({
    activities: [
      {
        type: "comment",
        user: "Paul Sans",
        text: "tagged you in a comment",
        time: "Today 12:10 pm",
      },
      {
        type: "comment",
        user: "Paul Sans",
        text: "tagged you in a comment",
        time: "Today 12:10 pm",
      },
      {
        type: "comment",
        user: "Paul Sans",
        text: "tagged you in a comment",
        time: "Today 12:10 pm",
      },
    ],
    purchases: [
      { item: "New Holland 5053 Tractor", time: "Today 12:10 pm" },
      { item: "New Holland 5053 Tractor", time: "Today 12:10 pm" },
      { item: "New Holland 5053 Tractor", time: "Today 12:10 pm" },
      { item: "New Holland 5053 Tractor", time: "Today 12:10 pm" },
    ],
    stats: {
      totalTractor: { value: 20, inUse: 5, date: "20 Jul 2025" },
      totalBookings: { value: 20, inUse: 5, date: "20 Jul 2025" },
      totalStores: { value: 20, inUse: 5, date: "20 Jul 2025" },
      totalAttachment: { value: 20, inUse: 5, date: "20 Jul 2025" },
      totalOperators: { value: 20, inUse: 5, date: "20 Jul 2025" },
      totalFarmers: { value: 20, inUse: 5, date: "20 Jul 2025" },
    },
    stores: [
      {
        name: "Paul Sans",
        location: "Hola First Store",
        email: "paulsans05@gmail.com",
        hourly: "$15",
        monthly: "$150",
        job: "$120",
        status: "active",
      },
      {
        name: "Paul Sans",
        location: "Hola First Store",
        email: "paulsans05@gmail.com",
        hourly: "$15",
        monthly: "$150",
        job: "$120",
        status: "inactive",
      },
    ],
    bookings: [
      {
        customer: "Paul Sans",
        type: "Booked New",
        tractor: "Holland 3032 Tractor",
        payment: "$15",
        date: "15 Nov 2025",
        status: "paid",
      },
      {
        customer: "Paul Sans",
        type: "Booked New",
        tractor: "Holland 3032 Tractor",
        payment: "$15",
        date: "18 Nov 2025",
        status: "paid",
      },
    ],
    payments: [
      {
        customer: "Paul Sans",
        type: "Booked New",
        tractor: "Holland 3032 Tractor",
        payment: "$15",
        booked: "$15",
        status: "paid",
      },
      {
        customer: "Paul Sans",
        type: "Booked New",
        tractor: "Holland 3032 Tractor",
        payment: "$15",
        booked: "$15",
        status: "failed",
      },
    ],
    operators: [
      {
        name: "Paul Sans",
        location: "Hola First Store",
        email: "paulsans05@gmail.com",
        hourly: "$15",
        monthly: "$150",
        job: "$120",
        status: "active",
      },
    ],
    devices: [
      {
        name: "New Holland 3032",
        type: "Tractor",
        payment: "$15",
        booked: "$15",
        status: "active",
      },
    ],
    subscriptions: [
      {
        type: "Purchased Store",
        date: "08 Dec 2025",
        price: "$150",
        status: "active",
      },
      {
        type: "Purchased",
        item: "New Holland 3032 Tractor",
        date: "08 Dec 2025",
        price: "$105",
        status: "active",
      },
    ],
  });

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
      errorMessage(
        err?.response?.data?.message ||
          getTranslation(locale, {
            en: "Try again",
            es: "Inténtalo de nuevo",
            ay: "Wasitat yant'aña",
            qu: "Huk kutitapas ruway",
            gn: "Eha jevy",
          })
      );
    } finally {
      setLoading((prev) => ({ ...prev, [type]: false }));
    }
  };

  const DeleteOwner = () =>
    updateOwnerStatus(
      `/owner/delete_owner/${id}`,
      "delete",
      getTranslation(locale, {
        en: "Owner deleted successfully",
        es: "Propietario eliminado exitosamente",
        ay: "Jilata suma chhaqtayata",
        qu: "Dueño allinta chinkachisqa",
        gn: "Jára oñemboguete porã",
      })
    );

  const ActiveOwner = () =>
    updateOwnerStatus(
      `/owner/activate_owner/${id}`,
      "active",
      getTranslation(locale, {
        en: "Activated successfully",
        es: "Activado exitosamente",
        ay: "Suma ch'amanchata",
        qu: "Allinta llamk'achisqa",
        gn: "Oñemyendy porã",
      })
    );

  const InactiveOwner = () =>
    updateOwnerStatus(
      `/owner/inactivate_owner/${id}`,
      "inactive",
      getTranslation(locale, {
        en: "Inactivated successfully",
        es: "Desactivado exitosamente",
        ay: "Suma jani ch'amanchata",
        qu: "Allinta sayachisqa",
        gn: "Oñembogue porã",
      })
    );

  const StatCard = ({ icon, title, value, inUse, date }: any) => (
    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 relative">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium text-gray-700">{title}</span>
        </div>
        <TrendingUp className="w-4 h-4 text-green-600" />
      </div>
      <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
      <div className="text-xs text-gray-600">
        In use {inUse} <span className="ml-2">Data as per {date}</span>
      </div>
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
            {emailVerified
              ? getTranslation(locale, {
                  en: "Yes",
                  es: "Sí",
                  ay: "Jisa",
                  qu: "Arí",
                  gn: "Héẽ",
                })
              : getTranslation(locale, {
                  en: "No",
                  es: "No",
                  ay: "Janiwa",
                  qu: "Mana",
                  gn: "Nahániri",
                })}
          </div>
          <p
            className={`px-[10px] text-[14px] py-[6px] ${
              status === 1 ? "text-green-600" : "text-red-600"
            } bg-[#dfe4e2] text-center w-[140px] rounded-full`}
          >
            {status === 1
              ? getTranslation(locale, {
                  en: "Active",
                  es: "Activo",
                  ay: "Ch'aman",
                  qu: "Llamk'aq",
                  gn: "Oiko",
                })
              : getTranslation(locale, {
                  en: "Inactive",
                  es: "Inactivo",
                  ay: "Jani ch'aman",
                  qu: "Mana llamk'aq",
                  gn: "Ndoikói",
                })}
          </p>
          <p className="w-[180px] truncate" title={creatDate}>
            {mailHover === index ? creatDate : `${creatDate.slice(0, 12)}...`}
          </p>
          <p className="w-[180px] truncate" title={updateDate}>
            {mailHover === index
              ? updateDate
              : `${updateDate.slice(0, 12)}...`}
          </p>
        </div>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="w-full sm:max-w-[90vw] md:max-w-[80vw] lg:max-w-[85vw] xl:max-w-[1400px] p-0 overflow-hidden flex flex-col"
      >
        <div className="flex h-full overflow-hidden">
          {/* Left Sidebar - Fixed */}
          <div className="w-96 flex-shrink-0 bg-gray-50 p-6 overflow-y-auto border-r">
            {/* Owner Profile Card */}
            <div className="bg-gray-100 rounded-lg p-6 mb-6">
              <div className="flex items-center gap-4 mb-4">
                <Image
                  src={
                    user?.image && user.image.trim() !== ""
                      ? user.image
                      : "/pic.jpg"
                  }
                  alt={name}
                  width={64}
                  height={64}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div>
                  <h2 className="text-xl font-semibold">{name}</h2>
                  <p className="text-sm text-gray-600">
                    Created on {creatDate.split(",")[0]}
                  </p>
                  <p className="text-sm text-gray-600">ID: {id.slice(0, 8)}</p>
                </div>
              </div>
              <div className="flex gap-2 mb-4">
                <Button variant="outline" size="sm" className="flex-1">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  Call
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  Mail
                </Button>
              </div>
              <p className="text-sm text-gray-600">
                Last Activity: {creatDate}
              </p>
            </div>

            {/* Activities */}
            <div className="bg-white rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Activities</h3>
              <div className="space-y-3">
                {ownerActivityData.activities.map((activity, idx) => (
                  <div key={idx} className="flex gap-3 text-sm">
                    <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p>
                        <span className="font-medium">{activity.user}</span>{" "}
                        {activity.text}
                      </p>
                      <p className="text-gray-500 text-xs">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Purchase Activities */}
            <div className="bg-white rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">
                Purchase Activities
              </h3>
              <div className="space-y-3">
                {ownerActivityData.purchases.map((purchase, idx) => (
                  <div key={idx} className="flex gap-3 text-sm">
                    <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p>
                        <span className="font-medium">Purchased</span>{" "}
                        {purchase.item}
                      </p>
                      <p className="text-gray-500 text-xs">{purchase.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Content - Scrollable */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <SheetHeader className="p-6 border-b">
              <SheetTitle>Owner Activity - {name}</SheetTitle>
              <SheetDescription className="text-red-600">
                {status === 1
                  ? `${name} is an active operator`
                  : `${name} is inactive. Click "Active" to activate.`}
              </SheetDescription>
            </SheetHeader>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <StatCard
                  icon={
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                  }
                  title="Total Tractor"
                  value={ownerActivityData.stats.totalTractor.value}
                  inUse={ownerActivityData.stats.totalTractor.inUse}
                  date={ownerActivityData.stats.totalTractor.date}
                />
                <StatCard
                  icon={
                    <svg
                      className="w-5 h-5"
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
                  value={ownerActivityData.stats.totalBookings.value}
                  inUse={ownerActivityData.stats.totalBookings.inUse}
                  date={ownerActivityData.stats.totalBookings.date}
                />
                <StatCard
                  icon={
                    <svg
                      className="w-5 h-5"
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
                  value={ownerActivityData.stats.totalStores.value}
                  inUse={ownerActivityData.stats.totalStores.inUse}
                  date={ownerActivityData.stats.totalStores.date}
                />
                <StatCard
                  icon={
                    <svg
                      className="w-5 h-5"
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
                  title="Total Attachment"
                  value={ownerActivityData.stats.totalAttachment.value}
                  inUse={ownerActivityData.stats.totalAttachment.inUse}
                  date={ownerActivityData.stats.totalAttachment.date}
                />
                <StatCard
                  icon={
                    <svg
                      className="w-5 h-5"
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
                  value={ownerActivityData.stats.totalOperators.value}
                  inUse={ownerActivityData.stats.totalOperators.inUse}
                  date={ownerActivityData.stats.totalOperators.date}
                />
                <StatCard
                  icon={
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  }
                  title="Total Farmers"
                  value={ownerActivityData.stats.totalFarmers.value}
                  inUse={ownerActivityData.stats.totalFarmers.inUse}
                  date={ownerActivityData.stats.totalFarmers.date}
                />
              </div>

              {/* Tabs */}
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
                    Export
                    <svg
                      className="w-4 h-4 ml-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                      />
                    </svg>
                  </Button>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                  {/* Stores Tab */}
                  {activeTab === "stores" && (
                    <div className="space-y-3">
                      {ownerActivityData.stores.map((store, idx) => (
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
                                d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                              />
                            </svg>
                            <div>
                              <p className="font-medium">
                                {store.name} at {store.location}
                              </p>
                              <p className="text-sm text-gray-600">
                                {store.email}
                              </p>
                              <p className="text-xs text-gray-500">
                                Pay per hour: {store.hourly} • Pay per month:{" "}
                                {store.monthly} • Pay per job: {store.job}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-medium ${
                                store.status === "active"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-orange-100 text-orange-700"
                              }`}
                            >
                              {store.status === "active"
                                ? "Active"
                                : "Inactive"}
                            </span>
                            <button className="p-2 hover:bg-gray-200 rounded">
                              <Trash2 className="w-4 h-4 text-gray-600" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Booking Tab */}
                  {activeTab === "booking" && (
                    <div className="space-y-3">
                      {ownerActivityData.bookings.map((booking, idx) => (
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
                                {booking.customer} {booking.type}
                              </p>
                              <p className="text-sm text-gray-600">
                                {booking.tractor}
                              </p>
                              <p className="text-xs text-gray-500">
                                Payment: {booking.payment} • Booked on{" "}
                                {booking.date}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-medium ${
                                booking.status === "paid"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-orange-100 text-orange-700"
                              }`}
                            >
                              {booking.status === "paid" ? "Paid" : "Failed"}
                            </span>
                            <button className="p-2 hover:bg-gray-200 rounded">
                              <Trash2 className="w-4 h-4 text-gray-600" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Payment Tab */}
                  {activeTab === "payment" && (
                    <div className="space-y-3">
                      {ownerActivityData.payments.map((payment, idx) => (
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
                                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                              />
                            </svg>
                            <div>
                              <p className="font-medium">
                                {payment.customer} {payment.type}
                              </p>
                              <p className="text-sm text-gray-600">
                                {payment.tractor}
                              </p>
                              <p className="text-xs text-gray-500">
                                Payment: {payment.payment} • Booked on:{" "}
                                {payment.booked}
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
                      ))}
                    </div>
                  )}

                  {/* Operator Tab */}
                  {activeTab === "operator" && (
                    <div className="space-y-3">
                      {ownerActivityData.operators.map((operator, idx) => (
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
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                            <div>
                              <p className="font-medium">
                                {operator.name} at {operator.location}
                              </p>
                              <p className="text-sm text-gray-600">
                                {operator.email}
                              </p>
                              <p className="text-xs text-gray-500">
                                Pay per hour: {operator.hourly} • Pay per
                                month: {operator.monthly} • Pay per job:{" "}
                                {operator.job}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-medium ${
                                operator.status === "active"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-orange-100 text-orange-700"
                              }`}
                            >
                              {operator.status === "active"
                                ? "Active"
                                : "Inactive"}
                            </span>
                            <button className="p-2 hover:bg-gray-200 rounded">
                              <Trash2 className="w-4 h-4 text-gray-600" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Device Tab */}
                  {activeTab === "device" && (
                    <div className="space-y-3">
                      {ownerActivityData.devices.map((device, idx) => (
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
                                d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                              />
                            </svg>
                            <div>
                              <p className="font-medium">{device.name}</p>
                              <p className="text-sm text-gray-600">
                                {device.type}
                              </p>
                              <p className="text-xs text-gray-500">
                                Payment: {device.payment} • Booked on:{" "}
                                {device.booked}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-medium ${
                                device.status === "active"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-orange-100 text-orange-700"
                              }`}
                            >
                              {device.status === "active"
                                ? "Active"
                                : "Inactive"}
                            </span>
                            <button className="p-2 hover:bg-gray-200 rounded">
                              <Trash2 className="w-4 h-4 text-gray-600" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Subscription Tab */}
                  {activeTab === "subscription" && (
                    <div className="space-y-3">
                      {ownerActivityData.subscriptions.map(
                        (subscription, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center gap-4">
                              {subscription.type === "Purchased Store" ? (
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
                                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                  />
                                </svg>
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
                                    d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                  />
                                </svg>
                              )}
                              <div>
                                <p className="font-medium">
                                  {subscription.type}
                                </p>
                                {subscription.item && (
                                  <p className="text-sm text-gray-600">
                                    {subscription.item}
                                  </p>
                                )}
                                <p className="text-sm text-gray-600">
                                  on {subscription.date}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Price: {subscription.price}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span
                                className={`px-3 py-1 rounded-full text-sm font-medium ${
                                  subscription.status === "active"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-orange-100 text-orange-700"
                                }`}
                              >
                                {subscription.status === "active"
                                  ? "Active"
                                  : "Inactive"}
                              </span>
                              <button className="p-2 hover:bg-gray-200 rounded">
                                <Trash2 className="w-4 h-4 text-gray-600" />
                              </button>
                            </div>
                          </div>
                        )
                      )}
                    </div>
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
                {loading.delete ? (
                  <CircularProgress size={16} />
                ) : (
                  getTranslation(locale, {
                    en: "Delete",
                    es: "Eliminar",
                    ay: "Chhaqtayaña",
                    qu: "Chinkachiy",
                    gn: "Mboguete",
                  })
                )}
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
                      getTranslation(locale, {
                        en: "Inactive",
                        es: "Inactivo",
                        ay: "Jani ch'aman",
                        qu: "Mana llamk'aq",
                        gn: "Ndoikói",
                      })
                    )}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    className="bg-green-800 hover:bg-green-700"
                    onClick={ActiveOwner}
                    disabled={loading.active}
                  >
                    {loading.active ? (
                      <CircularProgress size={16} />
                    ) : (
                      getTranslation(locale, {
                        en: "Active",
                        es: "Activo",
                        ay: "Ch'aman",
                        qu: "Llamk'aq",
                        gn: "Oiko",
                      })
                    )}
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