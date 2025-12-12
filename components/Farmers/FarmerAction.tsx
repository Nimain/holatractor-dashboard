// Updated FarmerAction with controlled open + hide trigger
"use client";

import { useState } from "react";
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

  // NEW CONTROLLED OPEN PROPS
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean;
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

  // Internal state for uncontrolled mode
  const [internalOpen, setInternalOpen] = useState(false);

  // Controlled open value
  const computedOpen = open !== undefined ? open : internalOpen;

  const handleOpen = (val: boolean) => {
    setInternalOpen(val);
    onOpenChange?.(val);
  };

  const [activeTab, setActiveTab] = useState("devices");
  const [loading, setLoading] = useState({ delete: false, active: false, inactive: false });

  const farmerActivityData = {
    activities: [
      { type: "comment", user: "Paul Sans", text: "tagged you in a comment", time: "Today 12:10 pm" },
      { type: "booking", user: "System", text: "completed a booking", time: "Today 11:30 am" },
    ],
    leaseActivities: [
      { item: "New Holland 5053 Tractor", type: "Leased", time: "Today 12:10 pm" },
      { item: "New Holland 5053 Tractor", type: "Rented", time: "Yesterday 2:30 pm" },
    ],
    stats: {
      activeBookings: { value: 20, inUse: 5, date: "20 Jul 2025" },
      completeBookings: { value: 18, date: "20 Jul 2025" },
      totalLandArea: { value: "2000 ha", date: "20 Jul 2025" },
      pendingBookings: { value: 5, inUse: 2, date: "20 Jul 2025" },
      activeForms: { value: 4, inUse: 1, date: "20 Jul 2025" },
      totalForms: { value: 8, date: "20 Jul 2025" },
    },
    devices: [
      { type: "Purchased", model: "New Holland 5053 Tractor", time: "Today 12:10 pm" },
      { type: "Leased", model: "New Holland 5053 Tractor", time: "Today 12:10 pm" },
      { type: "Rented", model: "New Holland 5053 Tractor", time: "Today 12:10 pm" },
    ],
    bookings: [
      { type: "Booked", model: "New Holland 3032 Tractor", payment: "$15", bookedOn: "15 Nov 2025" },
      { type: "Booked", model: "New Holland 3032 Tractor", payment: "$15", bookedOn: "5 Nov 2025" },
    ],
    payments: [
      { type: "Booked", model: "New Holland 3032 Tractor", payment: "$15", bookedOn: "$15", status: "paid" },
      { type: "Booked", model: "New Holland 3032 Tractor", payment: "$15", bookedOn: "$15", status: "failed" },
    ],
    forms: [
      { type: "Booked", land: "Land 1", payment: "$150", farmArea: "15 ha", bookedOn: "$15", status: "active" },
      { type: "Booked", land: "Land 1", payment: "$150", farmArea: "15 ha", bookedOn: "$15", status: "inactive" },
    ],
  } as const;

  const tabs = [
    { id: "devices", label: "Devices" },
    { id: "booking", label: "Booking" },
    { id: "payment", label: "Payment" },
    { id: "forms", label: "Forms" },
  ] as const;

  const updateFarmerStatus = async (endpoint: string, type: keyof typeof loading, success: string) => {
    setLoading((prev) => ({ ...prev, [type]: true }));
    try {
      await renderInstance.patch(endpoint, {}, { headers: { Authorization: `Bearer ${access_token}` } });
      successMessage(success);
      onUpdate?.();
    } catch (err: any) {
      errorMessage(err?.response?.data?.message || "Try again");
    } finally {
      setLoading((prev) => ({ ...prev, [type]: false }));
    }
  };

  const StatCard = ({ icon, title, value, inUse, date }: any) => (
    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">{icon}</div>
          <span className="text-sm font-medium text-gray-700">{title}</span>
        </div>
        <TrendingUp className="w-4 h-4 text-green-600" />
      </div>
      <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
      <div className="text-xs text-gray-600">
        {inUse !== undefined && `In use ${inUse} `}
        <span className="ml-2">Data as per {date}</span>
      </div>
    </div>
  );

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

      <SheetContent side="right" className="w-full sm:max-w-[90vw] md:max-w-[80vw] lg:max-w-[85vw] xl:max-w-[1400px] p-0 overflow-hidden flex flex-col">
        <div className="flex h-full overflow-hidden">
          {/* Left sidebar */}
          <div className="w-96 flex-shrink-0 bg-gray-50 p-6 overflow-y-auto border-r">
            <div className="bg-gray-100 rounded-lg p-6 mb-6">
              <div className="flex items-center gap-4 mb-4">
                <Image src="https://holaimagesdata.s3.us-west-2.amazonaws.com/web/vector-images/user_logo.webp" alt={name} width={64} height={64} className="w-16 h-16 rounded-full object-cover border-2 border-gray-300" />
                <div>
                  <h2 className="text-xl font-semibold">{name}</h2>
                  <p className="text-sm text-gray-600">Created on {creatDate}</p>
                  <p className="text-sm text-gray-600">ID: {id.slice(0, 8)}...</p>
                </div>
              </div>

              <div className="flex gap-2 mb-4">
                <Button variant="outline" size="sm" className="flex-1">Call</Button>
                <Button variant="outline" size="sm" className="flex-1">Mail</Button>
              </div>

              <p className="text-sm text-gray-600">Last Activity: {creatDate}</p>
            </div>

            {/* Activities */}
            <div className="bg-white rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Activities</h3>
              <div className="space-y-3">
                {farmerActivityData.activities.map((activity, idx) => (
                  <div key={idx} className="flex gap-3 text-sm">
                    <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center flex-shrink-0"></div>
                    <div>
                      <p><span className="font-medium">{activity.user}</span> {activity.text}</p>
                      <p className="text-gray-500 text-xs">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Lease activities */}
            <div className="bg-white rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Lease Activities</h3>
              <div className="space-y-3">
                {farmerActivityData.leaseActivities.map((lease, idx) => (
                  <div key={idx} className="flex gap-3 text-sm">
                    <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center flex-shrink-0"></div>
                    <div>
                      <p><span className="font-medium">{lease.type}</span> {lease.item}</p>
                      <p className="text-gray-500 text-xs">{lease.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* MAIN SECTION */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <SheetHeader className="p-6 border-b">
              <SheetTitle>Farmer Activity - {name}</SheetTitle>
              <SheetDescription className="text-red-600">
                {status === 1 ? `${name} is an active farmer` : `${name} is inactive. Click "Active" to activate.`}
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
                <StatCard icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>} title="Active Bookings" value={farmerActivityData.stats.activeBookings.value} inUse={farmerActivityData.stats.activeBookings.inUse} date={farmerActivityData.stats.activeBookings.date} />
                <StatCard icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} title="Complete Bookings" value={farmerActivityData.stats.completeBookings.value} date={farmerActivityData.stats.completeBookings.date} />
                <StatCard icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} title="Total Land Area" value={farmerActivityData.stats.totalLandArea.value} date={farmerActivityData.stats.totalLandArea.date} />
                <StatCard icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} title="Pending Bookings" value={farmerActivityData.stats.pendingBookings.value} inUse={farmerActivityData.stats.pendingBookings.inUse} date={farmerActivityData.stats.pendingBookings.date} />
                <StatCard icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>} title="Active Forms" value={farmerActivityData.stats.activeForms.value} inUse={farmerActivityData.stats.activeForms.inUse} date={farmerActivityData.stats.activeForms.date} />
                <StatCard icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>} title="Total Forms" value={farmerActivityData.stats.totalForms.value} date={farmerActivityData.stats.totalForms.date} />
              </div>

              <div className="bg-white rounded-lg">
                <div className="border-b border-gray-200 px-6 flex items-center justify-between">
                  <div className="flex gap-1">
                    {tabs.map((tab) => (
                      <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id ? "border-black text-black" : "border-transparent text-gray-600 hover:text-gray-900"}`}>{tab.label}</button>
                    ))}
                  </div>
                  <Button variant="outline" size="sm">Export <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" /></svg></Button>
                </div>

                <div className="p-6">
                  {activeTab === "devices" && (
                    <div className="space-y-3">
                      {farmerActivityData.devices.map((device, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="flex items-center gap-4">
                            <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 24 24"><path d="M20.5 8H19V5.5a1.5 1.5 0 0 0-1.5-1.5H14V2h-2v2H7v2h7.5a.5.5 0 0 1 .5.5V8H11c-1.1 0-2 .9-2 2v3.1A4.9 4.9 0 0 0 5 13a5 5 0 1 0 5 5h4a4 4 0 1 0 4-4h-1v-4h3.5V8zM5 20a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm13-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" /></svg>
                            <div>
                              <p className="font-medium">{device.type} {device.model}</p>
                              <p className="text-xs text-gray-500">{device.time}</p>
                            </div>
                          </div>
                          <button className="p-2 hover:bg-gray-200 rounded"><Trash2 className="w-4 h-4 text-gray-600" /></button>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === "booking" && (
                    <div className="space-y-3">
                      {farmerActivityData.bookings.map((booking, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="flex items-center gap-4">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            <div>
                              <p className="font-medium">{booking.type} {booking.model}</p>
                              <p className="text-sm text-gray-600">Payment: {booking.payment} • Booked on: {booking.bookedOn}</p>
                            </div>
                          </div>
                          <button className="p-2 hover:bg-gray-200 rounded"><Trash2 className="w-4 h-4 text-gray-600" /></button>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === "payment" && (
                    <div className="space-y-3">
                      {farmerActivityData.payments.map((payment, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="flex items-center gap-4">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                            <div>
                              <p className="font-medium">{payment.type} {payment.model}</p>
                              <p className="text-sm text-gray-600">Payment: {payment.payment} • Booked on: {payment.bookedOn}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${payment.status === "paid" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>{payment.status === "paid" ? "Paid" : "Failed"}</span>
                            <button className="p-2 hover:bg-gray-200 rounded"><Trash2 className="w-4 h-4 text-gray-600" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === "forms" && (
                    <div className="space-y-3">
                      {farmerActivityData.forms.map((form, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="flex items-center gap-4">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            <div>
                              <p className="font-medium">{form.type} Farm {form.land}</p>
                              <p className="text-sm text-gray-600">Payment: {form.payment} • Farm Area: {form.farmArea} • Booked on: {form.bookedOn}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${form.status === "active" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>{form.status === "active" ? "Active" : "Inactive"}</span>
                            <button className="p-2 hover:bg-gray-200 rounded"><Trash2 className="w-4 h-4 text-gray-600" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <SheetFooter className="flex justify-between items-center p-6 border-t mt-auto">
              <Button type="button" variant="destructive" onClick={() => updateFarmerStatus(`/farmer/delete/${id}`, "delete", "Farmer deleted successfully")} disabled={loading.delete}>
                {loading.delete ? <CircularProgress size={16} /> : "Delete"}
              </Button>
              <div className="flex gap-3">
                {status === 1 ? (
                  <Button type="button" variant="outline" onClick={() => updateFarmerStatus(`/farmer/inactivate/${id}`, "inactive", "Inactivated successfully")} disabled={loading.inactive}>
                    {loading.inactive ? <CircularProgress size={16} /> : "Inactive"}
                  </Button>
                ) : (
                  <Button type="button" className="bg-green-800 hover:bg-green-700" onClick={() => updateFarmerStatus(`/farmer/activate/${id}`, "active", "Activated successfully")} disabled={loading.active}>
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
