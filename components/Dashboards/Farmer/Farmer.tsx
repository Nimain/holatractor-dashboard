"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCookie } from "next-cookie";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import {
  Tractor,
  Sprout,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  DollarSign,
  LandPlot,
  Zap,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  Wheat,
  Activity,
  Layers,
  ArrowUpRight,
  Droplets,
  Wind,
  Sun,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { MapContainer, Polygon, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { RootState } from "@/redux/store";
import { changeFarm } from "@/redux/ActiveFarm/ActiveFarm";
import { Booking, Farm, Farmer, Logs } from "@/utils/Types/types";
import { renderInstance, TractorAIBaseURL } from "@/utils/Axios/RenderInstance";
import { errorMessage } from "@/utils/Toastify/Messages";
import FarmerShrimmer from "./_components/FarmerShrimmer";
import MandiSpotPrices from "./_components/MandiSpotPrices";
import TranslatedText from "@/components/Menubar/TranslatedText";
import {
  activeBookings,
  completedBookings,
  totalFarms,
  totalPaidTranslation,
  totalUnpaidTranslation,
  totalLandArea,
  recentBookingsTranslation,
  logTranslations,
} from "./FarmerTranslation";

interface User {
  userId: string;
  image: string;
  name: string;
  email: string;
  email_varified: boolean;
}

interface LocationCoords {
  latitude: number | null;
  longitude: number | null;
}

const QUICK_SERVICES = [
  { id: "plowing", title: "Deep Plowing", es: "Arado Profundo", icon: "🚜", hp: "75+ HP", rate: "$45/ha" },
  { id: "planting", title: "Direct Seeding", es: "Siembra Directa", icon: "🌱", hp: "85+ HP", rate: "$52/ha" },
  { id: "spraying", title: "Boom Spraying", es: "Fumigación", icon: "💧", hp: "75+ HP", rate: "$28/ha" },
  { id: "harvesting", title: "Combine Harvest", es: "Cosecha", icon: "🌽", hp: "175+ HP", rate: "$65/ha" },
];

export default function FarmerDashboard() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { cookie } = useCookie();

  const rawUser = cookie.get("user");
  const parsedUser: any =
    typeof rawUser === "string"
      ? (() => {
          try {
            return JSON.parse(rawUser);
          } catch {
            return null;
          }
        })()
      : rawUser;
  const user: User = parsedUser || {};
  const userId = parsedUser?.userId || parsedUser?.id || parsedUser?.sub || parsedUser?._id;

  const { activeFarm } = useSelector((root: RootState) => root.ActiveFarm);

  const [farmer, setFarmer] = useState<Farmer | null>(null);
  const [fetchingFarmerDetails, setFetchingFarmerDetails] = useState(false);
  const [totalPaid, setTotalPaid] = useState<number>(0);
  const [totalUnpaid, setTotalUnpaid] = useState<number>(0);
  const [completedBookingsCount, setCompletedBookingsCount] = useState<number>(0);
  const [totalBookings, setTotalBookings] = useState<number>(0);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [allLogs, setAllLogs] = useState<Logs[]>([]);

  const [location, setLocation] = useState<LocationCoords>({ latitude: -17.765, longitude: -63.178 });
  const [city, setCity] = useState("Santa Cruz de la Sierra");
  const [weather, setWeather] = useState({ temp: 28, condition: "Sunny", humidity: 62, wind: "14 km/h" });

  const limeOptions = { color: "#10b981", fillColor: "#10b981", fillOpacity: 0.35, weight: 3 };

  function fetchFarmerData() {
    if (!userId) return;

    setFetchingFarmerDetails(true);
    renderInstance
      .get(`/farmer/${userId}`)
      .then((res) => {
        if (res.data) {
          setFarmer(res.data.details || null);
          setTotalPaid(typeof res.data.totalPaid === "number" ? res.data.totalPaid : 0);
          setTotalUnpaid(typeof res.data.totalUnpaid === "number" ? res.data.totalUnpaid : 0);
          setCompletedBookingsCount(typeof res.data.completedBookings === "number" ? res.data.completedBookings : 0);
          const bList = Array.isArray(res.data.bookings) ? res.data.bookings : [];
          setBookings(bList);
          setTotalBookings(typeof res.data.totalBookings === "number" ? res.data.totalBookings : bList.length);
          const fetchedFarms = Array.isArray(res.data.farms) ? res.data.farms : [];
          setFarms(fetchedFarms);
          setAllLogs(Array.isArray(res.data.logs) ? res.data.logs : []);
          if (fetchedFarms.length > 0) {
            dispatch(changeFarm(fetchedFarms[0]));
          }
        }
      })
      .catch(async () => {
        // Direct resilient fallback to FastAPI
        try {
          const fastApiBase = (TractorAIBaseURL || "https://tractorai.sinsignal.com").replace(/\/$/, "");
          const [bookingsRes, farmsRes] = await Promise.all([
            axios.get(`${fastApiBase}/simple-booking/list/${userId}`, { timeout: 6000 }).catch(() => null),
            axios.get(`${fastApiBase}/api/v1/farms`, { timeout: 6000 }).catch(() => null),
          ]);
          const bList = Array.isArray(bookingsRes?.data) ? bookingsRes.data : [];
          const fList = Array.isArray(farmsRes?.data) ? farmsRes.data : [];
          setBookings(bList);
          setTotalBookings(bList.length);
          setFarms(fList);
          if (fList.length > 0) {
            dispatch(changeFarm(fList[0]));
          }
        } catch {}
      })
      .finally(() => {
        setFetchingFarmerDetails(false);
      });
  }

  useEffect(() => {
    fetchFarmerData();

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
        },
        () => {}
      );
    }
  }, [userId]);

  const formatDate = (date: string | Date | undefined): string => {
    if (!date) return "Recently";
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return isNaN(dateObj.getTime())
      ? "Recently"
      : dateObj.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
  };

  if (fetchingFarmerDetails) return <FarmerShrimmer />;

  const totalFarmHectares = farms.reduce((acc, f) => {
    const areaVal = Number(f.area || (f.boundary && typeof f.boundary.area === "number" ? f.boundary.area / 10000 : 0));
    return acc + (isNaN(areaVal) ? 0 : areaVal);
  }, 0);

  return (
    <div className="w-full space-y-6 pb-12">
      {/* ── HERO GREETING & 3-TAP BOOKING ACTION RIBBON ─────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900 via-emerald-800 to-slate-900 text-white p-6 md:p-8 shadow-xl border border-emerald-700/40">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 -mb-8 w-48 h-48 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5">
                🌱 Precision Agriculture Hub
              </Badge>
              <span className="text-xs text-emerald-200/70 font-semibold flex items-center gap-1">
                <MapPin className="w-3 h-3 text-emerald-400" />
                {city}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tight text-white">
              Welcome Back, {user.name || "Farmer"}!
            </h1>
            <p className="text-xs md:text-sm text-emerald-100/80 leading-relaxed">
              Schedule tractors, tillage machinery, precision seeding, and harvesting services with real-time TractorAI fleet dispatching.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
            <Link href="/farmer/new-booking" className="w-full sm:w-auto">
              <Button className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-4 px-6 rounded-2xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 text-sm active:scale-95 transition-all">
                <Zap className="w-4 h-4 fill-current" />
                Book Machinery (3-Tap)
              </Button>
            </Link>
            <Link href="/farmer/farm/new" className="w-full sm:w-auto">
              <Button
                variant="outline"
                className="w-full border-emerald-400/40 hover:border-emerald-300 bg-emerald-950/40 text-emerald-100 hover:bg-emerald-900/60 font-bold py-4 px-5 rounded-2xl text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <LandPlot className="w-4 h-4 text-emerald-400" />
                Add Field / Farm
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ── KPI METRICS CARDS ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Metric 1: Total & Active Bookings */}
        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <TranslatedText greetings={activeBookings} />
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Tractor className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">{totalBookings}</span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
              Operations
            </span>
          </div>
          <Link
            href="/farmer/bookinghistory"
            className="mt-3 text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
          >
            View history <ChevronRight className="w-3 h-3" />
          </Link>
        </Card>

        {/* Metric 2: Completed Operations */}
        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <TranslatedText greetings={completedBookings} />
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
              {completedBookingsCount}
            </span>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-full">
              Completed
            </span>
          </div>
          <p className="mt-3 text-xs text-slate-400">Verified agricultural jobs</p>
        </Card>

        {/* Metric 3: Total Invested / Paid */}
        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <TranslatedText greetings={totalPaidTranslation} />
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-xs font-bold text-slate-400">$</span>
            <span className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
              {totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <Link
            href="/farmer/paymenthistory"
            className="mt-3 text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
          >
            Payment receipts <ChevronRight className="w-3 h-3" />
          </Link>
        </Card>

        {/* Metric 4: Registered Land Area */}
        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <TranslatedText greetings={totalFarms} /> & Area
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <LandPlot className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">{farms.length}</span>
            <span className="text-xs text-slate-500">Farms</span>
            <span className="text-xs font-bold text-purple-600 bg-purple-50 dark:bg-purple-950 px-2 py-0.5 rounded-full ml-auto">
              {totalFarmHectares > 0 ? `${totalFarmHectares.toFixed(1)} Ha` : "Mapped"}
            </span>
          </div>
          <Link
            href="/farmer/farm"
            className="mt-3 text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1"
          >
            Manage farm polygons <ChevronRight className="w-3 h-3" />
          </Link>
        </Card>
      </div>

      {/* ── QUICK 3-TAP SERVICE LAUNCHER ───────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base md:text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-600" />
            Quick Service Launcher (Instant Quoting)
          </h2>
          <Link
            href="/farmer/new-booking"
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
          >
            All machinery catalog <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {QUICK_SERVICES.map((srv) => (
            <Link
              key={srv.id}
              href="/farmer/new-booking"
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-md transition-all group flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl group-hover:scale-110 transition-transform">{srv.icon}</span>
                <div>
                  <h3 className="font-extrabold text-xs text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                    {srv.title}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-semibold">{srv.es}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">{srv.rate}</span>
                <p className="text-[9px] text-slate-400 font-medium">{srv.hp}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── LIVE MANDI SPOT PRICES TICKER & COMMODITY RATES ───────────────── */}
      <MandiSpotPrices />

      {/* ── MAIN CONTENT GRID: LIVE MAP & RECENT DISPATCHES ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Live Farm Mapping & Active Field */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Registered Farm Boundaries</h3>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs font-bold text-slate-600 border-slate-300">
                  {farms.length} Registered Fields
                </Badge>
                <Link href="/farmer/farm/new">
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-7 rounded-lg">
                    Draw Polygon
                  </Button>
                </Link>
              </div>
            </div>

            {/* Leaflet Map */}
            <div className="w-full h-80 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 relative">
              {location.latitude && location.longitude ? (
                <MapContainer
                  center={
                    activeFarm?.boundary?.coordinates && activeFarm.boundary.coordinates.length > 0
                      ? (activeFarm.boundary.coordinates[0] as [number, number])
                      : [location.latitude, location.longitude]
                  }
                  zoom={15}
                  scrollWheelZoom={false}
                  style={{ width: "100%", height: "100%" }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {farms.map((f, idx) => {
                    if (!f.boundary?.coordinates || f.boundary.coordinates.length === 0) return null;
                    return (
                      <Polygon key={f.id || idx} pathOptions={limeOptions} positions={f.boundary.coordinates as any}>
                        <Popup>
                          <div className="text-xs font-sans">
                            <p className="font-bold text-slate-900">{f.name}</p>
                            <p className="text-slate-500">{f.description || "Active Farm Field"}</p>
                          </div>
                        </Popup>
                      </Polygon>
                    );
                  })}
                </MapContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                  Loading field coordinates...
                </div>
              )}
            </div>

            {/* Farm Selector Pill Bar */}
            {farms.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-1">
                {farms.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => dispatch(changeFarm(f))}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                      activeFarm?.id === f.id
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                    }`}
                  >
                    <Wheat className="w-3 h-3" />
                    <span>{f.name}</span>
                  </button>
                ))}
              </div>
            )}
          </Card>

          {/* Activity Logs Timeline */}
          <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600" />
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Recent Farm Operations & Logs</h3>
              </div>
              <Link href="/farmer/logs" className="text-xs font-bold text-emerald-600 hover:underline">
                View all
              </Link>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2">
              {allLogs.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No recent operational logs.</p>
              ) : (
                allLogs.slice(0, 5).map((log, idx) => (
                  <div
                    key={log.id || idx}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-200">{log.action}</p>
                        <p className="text-[10px] text-slate-400">{log.details}</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">{formatDate(log.createdAt)}</span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Right 1 Col: Recent Machinery Bookings & Weather Widget */}
        <div className="space-y-6">
          {/* Agronomic Weather & Advisory Widget */}
          <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-900 dark:to-slate-800 p-5 shadow-sm space-y-4 border">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Field Conditions</span>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">{city}</h3>
              </div>
              <Sun className="w-6 h-6 text-amber-500 animate-pulse" />
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-white/80 dark:bg-slate-800/80 p-2.5 rounded-xl border border-emerald-200/60 dark:border-slate-700">
                <span className="text-[10px] text-slate-400">Temp</span>
                <p className="font-black text-sm text-slate-900 dark:text-white">{weather.temp}°C</p>
              </div>
              <div className="bg-white/80 dark:bg-slate-800/80 p-2.5 rounded-xl border border-emerald-200/60 dark:border-slate-700">
                <span className="text-[10px] text-slate-400">Humidity</span>
                <p className="font-black text-sm text-slate-900 dark:text-white">{weather.humidity}%</p>
              </div>
              <div className="bg-white/80 dark:bg-slate-800/80 p-2.5 rounded-xl border border-emerald-200/60 dark:border-slate-700">
                <span className="text-[10px] text-slate-400">Wind</span>
                <p className="font-black text-sm text-slate-900 dark:text-white">{weather.wind}</p>
              </div>
            </div>

            <div className="bg-emerald-600/10 text-emerald-800 dark:text-emerald-300 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 border border-emerald-500/20">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Optimal weather window for Soil Tillage & Precision Seeding.</span>
            </div>
          </Card>

          {/* Recent Machinery Bookings */}
          <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Tractor className="w-4 h-4 text-emerald-600" />
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Recent Dispatches</h3>
              </div>
              <Link href="/farmer/bookinghistory" className="text-xs font-bold text-emerald-600 hover:underline">
                View all ({bookings.length})
              </Link>
            </div>

            <div className="space-y-3">
              {bookings.length === 0 ? (
                <div className="text-center py-8 space-y-3">
                  <p className="text-xs text-slate-400">No machinery bookings yet.</p>
                  <Link href="/farmer/new-booking">
                    <Button size="sm" className="bg-emerald-600 text-white font-bold text-xs rounded-xl">
                      Start First Booking
                    </Button>
                  </Link>
                </div>
              ) : (
                bookings.slice(0, 4).map((b: any, idx) => (
                  <div
                    key={b.id || idx}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 space-y-2 hover:border-emerald-300 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                        {b.task_type || b.store_name || "Tractor Service"}
                      </span>
                      <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold">
                        {b.bookingStatus || b.status || "Active"}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {formatDate(b.start_date || b.createdAt)}
                      </span>
                      <span className="font-black text-emerald-600 dark:text-emerald-400">
                        ${Number(b.total_cost || b.total_amount || 0).toFixed(2)}
                      </span>
                    </div>

                    {b.checkin_otp && (
                      <div className="bg-amber-50 dark:bg-amber-950/40 p-1.5 rounded-lg text-center text-[10px] font-mono font-bold text-amber-800 dark:text-amber-300 border border-amber-200">
                        Check-in OTP: {b.checkin_otp}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}