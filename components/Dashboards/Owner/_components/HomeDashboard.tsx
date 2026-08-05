"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Check,
  TractorIcon,
  Wrench,
  User,
  MapPin,
  Store as StoreIcon,
  Search,
  Bell,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  BarChart3,
  Bot,
  Plus,
  Compass,
  Cpu,
  Fuel,
} from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/autoplay";
import "swiper/css/pagination";
import TranslatedText from "@/components/Menubar/TranslatedText";
import { OwnerDashboardTranslation } from "../OwnerDashboardTranslation";
import DeviceApiService, { type Device } from "../devices/Device";
import { useCookie } from "next-cookie";

interface Store {
  id: string;
  name: string;
  description: string;
  image: string;
  opening_time: string;
  closing_time: string;
  closing_days: string[];
  location: {
    lat: string;
    lan: string;
  };
  TractorInStore: TractorInStore[];
}

interface TractorInStore {
  id: string;
  baseTractorId: string;
  hourly_price: number;
  store_id: string;
  baseTractor: {
    id: string;
    name: string;
    description: string;
    model: string;
    type: string;
    year: string;
    images: string[];
  };
}

interface OperatorInStore {
  id: string;
  cost_per_job: number;
  cost_per_hour: number;
  cost_per_month: number;
  operator: {
    user: {
      first_name: string;
      middle_name?: string;
      last_name: string;
      image?: string;
    };
  };
}

interface Booking {
  id: string;
  user?: {
    first_name: string;
    last_name: string;
    image?: string;
  };
}

interface Tractor {
  id: string;
  name: string;
}

interface Attachment {
  id: string;
  name: string;
}

interface Location {
  latitude: number | null;
  longitude: number | null;
}

export default function HomeDashboard({
  stores,
  operators,
  tractors,
  attachments,
  bookings,
  tractorsInUse,
  attachmentsInUse,
}: {
  stores: Store[];
  operators: OperatorInStore[];
  tractors: Tractor[];
  attachments: Attachment[];
  bookings: Booking[];
  tractorsInUse: number;
  attachmentsInUse: number;
}) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [currentDeviceIndex, setCurrentDeviceIndex] = useState(0);
  const [location, setLocation] = useState<Location>({
    latitude: null,
    longitude: null,
  });

  let user = null;
  try {
    const { cookie } = useCookie();
    user = cookie?.get("user");
  } catch (e) {
    // Client-side hydration fallback
  }

  const fetchDevices = async () => {
    try {
      const deviceData = await DeviceApiService.getAllDevices();
      setDevices(deviceData);
    } catch (error) {
      console.error("Error fetching devices:", error);
    }
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position: GeolocationPosition) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        }
      );
    }
    fetchDevices();
  }, []);

  const nextDevice = () => {
    if (devices.length > 0) {
      setCurrentDeviceIndex((prev) => (prev + 1) % devices.length);
    }
  };

  const prevDevice = () => {
    if (devices.length > 0) {
      setCurrentDeviceIndex(
        (prev) => (prev - 1 + devices.length) % devices.length
      );
    }
  };

  const activeDevicesCount = devices.filter(
    (d) => d.base && d.base.status === 1
  ).length;

  const currentDevice = devices[currentDeviceIndex];

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Stitch Design Main Canvas */}
      <div className="grid grid-cols-12 gap-6">
        {/* Hero Card: Store Swiper & Featured Store (8 Cols) */}
        <div className="col-span-12 lg:col-span-8 relative rounded-2xl shadow-lg border border-slate-200 overflow-hidden min-h-[320px] flex flex-col justify-end bg-slate-900 group">
          {stores.length === 0 ? (
            <div className="p-8 text-center flex flex-col items-center justify-center h-full text-white z-10 my-auto">
              <StoreIcon className="w-16 h-16 text-amber-500 mb-3 animate-pulse" />
              <h3 className="text-2xl font-bold">No Stores Available</h3>
              <p className="text-sm text-slate-300 mt-1 max-w-md">
                Get started by creating your first tractor store to manage bookings and equipment.
              </p>
              <Link href="/owner/stores/new" className="mt-4">
                <Button className="bg-amber-500 hover:bg-amber-600 text-white rounded-full font-bold px-6 py-2">
                  Create Store
                </Button>
              </Link>
            </div>
          ) : (
            <Swiper
              modules={[Autoplay, Pagination]}
              spaceBetween={0}
              slidesPerView={1}
              loop={stores.length > 1}
              pagination={{ clickable: true }}
              autoplay={{ delay: 5000 }}
              className="w-full h-full absolute inset-0"
            >
              {stores.map((storeItem, i) => (
                <SwiperSlide key={i} className="w-full h-full relative">
                  <Image
                    src={storeItem.image || "https://holaimagesdata.s3.us-west-2.amazonaws.com/web/logo/ISOLOGO_HT_BLANCO.png"}
                    alt={storeItem.name}
                    className="w-full h-full object-cover"
                    fill
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6 z-20 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
                    <div>
                      <span className="inline-block px-3 py-1 bg-amber-500/90 text-white text-xs font-semibold rounded-full mb-2 backdrop-blur-md">
                        Active Store
                      </span>
                      <h3 className="text-3xl font-extrabold text-white tracking-tight">
                        {storeItem.name}
                      </h3>
                      <p className="text-slate-200 text-sm mt-1">
                        {bookings.length === 0 ? (
                          <TranslatedText
                            greetings={OwnerDashboardTranslation.noBookingsCompleted}
                          />
                        ) : (
                          `${bookings.length} Bookings active`
                        )}
                      </p>
                    </div>

                    <Link href={`/owner/stores/${storeItem.id}`}>
                      <Button className="bg-orange-600 hover:bg-orange-500 text-white font-bold px-6 py-3 rounded-full shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center gap-2">
                        <TranslatedText
                          greetings={OwnerDashboardTranslation.openStore}
                        />
                        <ArrowRight className="w-5 h-5" />
                      </Button>
                    </Link>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          )}
        </div>

        {/* Yearly Data Chart Card (4 Cols) */}
        <div className="col-span-12 lg:col-span-4 bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="text-lg font-bold text-slate-800">Yearly Activity</h4>
              <p className="text-xs text-slate-500">Booking performance overview</p>
            </div>
            <div className="p-2 bg-amber-100 rounded-xl">
              <BarChart3 className="w-5 h-5 text-amber-600" />
            </div>
          </div>

          <div className="flex-1 flex items-end gap-2 h-36 pt-4 border-b border-slate-100 pb-2">
            <div className="flex-1 bg-orange-200 hover:bg-orange-400 rounded-t h-[40%] transition-all" />
            <div className="flex-1 bg-orange-300 hover:bg-orange-400 rounded-t h-[65%] transition-all" />
            <div className="flex-1 bg-orange-400 hover:bg-orange-500 rounded-t h-[85%] transition-all" />
            <div className="flex-1 bg-orange-500 hover:bg-orange-600 rounded-t h-[55%] transition-all" />
            <div className="flex-1 bg-orange-600 hover:bg-orange-700 rounded-t h-[95%] transition-all" />
            <div className="flex-1 bg-orange-300 hover:bg-orange-400 rounded-t h-[45%] transition-all" />
          </div>
          <div className="mt-3 flex justify-between text-xs font-semibold text-slate-400">
            <span>Jan</span>
            <span>Jun</span>
            <span>Dec</span>
          </div>
        </div>

        {/* Operator Available Section (4 Cols) */}
        <div className="col-span-12 lg:col-span-4 bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 flex flex-col items-center justify-center text-center min-h-[280px]">
          {operators.length === 0 ? (
            <>
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
                <User className="w-8 h-8 text-slate-500" />
              </div>
              <h4 className="text-lg font-bold text-slate-800">No Operator Available</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                Add operators to assign drivers to your tractor fleet.
              </p>
              <Link href="/owner/operator" className="mt-5">
                <Button className="bg-orange-600 hover:bg-orange-500 text-white rounded-full font-bold px-6 py-2 flex items-center gap-2 shadow-md">
                  <Plus className="w-4 h-4" />
                  Add Operator
                </Button>
              </Link>
            </>
          ) : (
            <div className="w-full text-left">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-bold text-slate-800">Operators ({operators.length})</h4>
                <Link href="/owner/operator" className="text-xs font-bold text-orange-600 hover:underline">
                  View All
                </Link>
              </div>
              <div className="space-y-3">
                {operators.slice(0, 3).map((op, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <Avatar className="w-10 h-10 border border-amber-500">
                      <AvatarImage src={op.operator.user.image} />
                      <AvatarFallback className="bg-amber-600 text-white font-bold">
                        {op.operator.user.first_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        {op.operator.user.first_name} {op.operator.user.last_name}
                      </p>
                      <p className="text-xs text-slate-500">Active Operator</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Operations Grid: Tractors & Attachments Cards (4 Cols) */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          {/* Tractors Card (Stitch Maroon #800000) */}
          <div className="bg-[#800000] rounded-2xl shadow-sm border border-red-950 p-6 text-white flex-1 flex flex-col justify-between hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <TractorIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-bold">Tractors</h4>
                  <p className="text-xs text-white/80">Tractor operations</p>
                </div>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-white/10 rounded-full">
                {tractorsInUse} in use
              </span>
            </div>

            <div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-4xl font-extrabold">{tractors.length}</span>
                <span className="text-sm font-medium text-white/90">Total Tractors</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2.5 mb-2 overflow-hidden">
                <div
                  className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${tractors.length > 0 ? (tractorsInUse / tractors.length) * 100 : 0}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-white/80">
                <span>0</span>
                <span>{tractorsInUse} in use</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/20">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-semibold text-white/90 flex items-center gap-1.5">
                  <Fuel className="w-4 h-4 text-amber-300" />
                  Recent Fuel Log
                </span>
                <span className="text-[10px] text-white/70">2h ago</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-white">24L consumed</span>
                <span className="text-emerald-300 font-semibold">Optimal Efficiency</span>
              </div>
            </div>
          </div>

          {/* Attachments Card (Stitch Maroon #800000) */}
          <div className="bg-[#800000] rounded-2xl shadow-sm border border-red-950 p-6 text-white flex-1 flex flex-col justify-between hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <Wrench className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-bold">Attachments</h4>
                  <p className="text-xs text-white/80">Implements for tractors</p>
                </div>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-white/10 rounded-full">
                {attachmentsInUse} in use
              </span>
            </div>

            <div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-4xl font-extrabold">{attachments.length}</span>
                <span className="text-sm font-medium text-white/90">Total Attachments</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2.5 mb-2 overflow-hidden">
                <div
                  className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${attachments.length > 0 ? (attachmentsInUse / attachments.length) * 100 : 0}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-white/80">
                <span>0</span>
                <span>{attachmentsInUse} in use</span>
              </div>
            </div>
          </div>
        </div>

        {/* Devices Monitoring Side Panel (4 Cols) */}
        <div className="col-span-12 lg:col-span-4 bg-[#800000] rounded-2xl shadow-sm border border-red-950 p-6 flex flex-col justify-between text-white">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Cpu className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="text-lg font-bold">Devices</h4>
                <p className="text-xs text-white/80">Monitoring all Devices</p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-500/80 rounded-full text-white">
              {activeDevicesCount} Active
            </span>
          </div>

          {/* White Card inside for device details */}
          <div className="bg-white rounded-xl p-4 text-slate-800 flex-1 flex flex-col justify-between">
            {currentDevice ? (
              <>
                <div className="bg-amber-50 rounded-lg p-3 mb-3 flex justify-center items-center relative border border-amber-100">
                  <span className="absolute top-2 right-2 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
                  <TractorIcon className="w-16 h-16 text-amber-600" />
                </div>
                <h5 className="text-base font-bold text-slate-900 mb-2">
                  {currentDevice.base_tractor?.name || "Tractor Device"}
                </h5>
                <div className="space-y-2 text-xs mb-4">
                  <div className="flex justify-between border-b border-slate-100 pb-1">
                    <span className="text-slate-500">IMEI:</span>
                    <span className="font-semibold text-slate-800">{currentDevice.imei}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1">
                    <span className="text-slate-500">Status:</span>
                    <span className="font-semibold text-emerald-600">Online</span>
                  </div>
                </div>

                <Link href="/owner/devicestractors">
                  <Button className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-2 rounded-lg text-xs shadow-sm">
                    View Location
                  </Button>
                </Link>
              </>
            ) : (
              <div className="text-center py-8">
                <Cpu className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-600">No Active Telemetry Device</p>
                <Link href="/owner/devicestractors" className="mt-3 inline-block">
                  <Button className="bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold px-4 py-2 rounded-lg">
                    Manage Devices
                  </Button>
                </Link>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={prevDevice}
              className="w-8 h-8 rounded-lg border border-white/30 flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-white" />
            </button>
            <button
              onClick={nextDevice}
              className="w-8 h-8 rounded-lg border border-white/30 flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Floating TractorAI Trigger Button */}
      <button className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-orange-600 to-amber-600 text-white flex items-center gap-2 px-5 py-3 rounded-full shadow-2xl border border-white/20 transition-all hover:-translate-y-1 hover:scale-105 group">
        <Bot className="w-5 h-5 text-amber-200 group-hover:rotate-12 transition-transform" />
        <span className="font-bold text-sm tracking-wide">TractorAI</span>
      </button>
    </div>
  );
}
