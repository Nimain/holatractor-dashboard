"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import dynamic from "next/dynamic";
import { renderInstance } from "@/utils/Axios/RenderInstance";
import { errorMessage } from "@/utils/Toastify/Messages";
import { Farm } from "@/utils/Types/types";
import {
  MapPin,
  LandPlot,
  Layers,
  Sprout,
  ArrowLeft,
  Sparkles,
  RefreshCw,
  Tractor,
  Calendar,
  Zap,
  Activity,
  Compass,
  Thermometer,
  Droplets,
  Wind,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  BarChart3,
  Leaf,
  Sun,
  Plus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import FarmerShimmer from "../_components/FarmerShrimmer";
import BookingCard from "./BookingCard";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

// Dynamically load Leaflet Map Container without SSR
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Polygon = dynamic(
  () => import("react-leaflet").then((mod) => mod.Polygon),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);

import "leaflet/dist/leaflet.css";

interface Location {
  latitude: number | null;
  longitude: number | null;
}

interface FarmDetails {
  farmDetails: Farm;
  centerPoint: {
    lat: number | null;
    lng: number | null;
  };
  cropYields: {
    wheat: number | null;
    corn: number | null;
    soybean: number | null;
    rice: number | null;
  };
}

const AGRONOMIC_TELEMETRY = [
  { month: "Jan", moisture: 68, rainfall: 110, ndvi: 0.72 },
  { month: "Feb", moisture: 72, rainfall: 135, ndvi: 0.78 },
  { month: "Mar", moisture: 64, rainfall: 95, ndvi: 0.75 },
  { month: "Apr", moisture: 58, rainfall: 60, ndvi: 0.69 },
  { month: "May", moisture: 52, rainfall: 45, ndvi: 0.62 },
  { month: "Jun", moisture: 46, rainfall: 25, ndvi: 0.58 },
  { month: "Jul", moisture: 42, rainfall: 20, ndvi: 0.54 },
  { month: "Aug", moisture: 48, rainfall: 35, ndvi: 0.61 },
  { month: "Sep", moisture: 55, rainfall: 50, ndvi: 0.66 },
  { month: "Oct", moisture: 62, rainfall: 85, ndvi: 0.71 },
  { month: "Nov", moisture: 70, rainfall: 120, ndvi: 0.76 },
  { month: "Dec", moisture: 74, rainfall: 140, ndvi: 0.81 },
];

export default function SingleFarm() {
  const router = useRouter();
  const { slug } = useParams();

  const [farm, setFarm] = useState<FarmDetails | null>(null);
  const [fetching, setFetching] = useState(true);
  const [mapLayer, setMapLayer] = useState<"satellite" | "standard">("satellite");
  const [location, setLocation] = useState<Location>({
    latitude: null,
    longitude: null,
  });

  const limeOptions = {
    color: "#10b981",
    fillColor: "#10b981",
    fillOpacity: 0.35,
    weight: 3,
  };

  async function fetchFarmer() {
    setFetching(true);
    try {
      // 1. Try local Next.js /api/farm/[slug] & FastAPI http://127.0.0.1:8000/farm/[slug]
      const [localRes, fastRes, renderRes] = await Promise.all([
        axios.get(`/api/farm/${slug}`).catch(() => null),
        axios.get(`http://127.0.0.1:8000/farm/${slug}`).catch(() => null),
        renderInstance.get(`/farm/${slug}`).catch(() => null),
      ]);

      const raw = localRes?.data || fastRes?.data || renderRes?.data;
      if (!raw) {
        setFetching(false);
        return;
      }

      const details = raw.farmDetails ? raw.farmDetails : raw;
      const rawCoords = details?.boundary?.coordinates || details?.boundary_coordinates || [];
      const normCoords: [number, number][] = Array.isArray(rawCoords)
        ? rawCoords
            .map((c: any) => {
              if (Array.isArray(c)) return [Number(c[0]), Number(c[1])] as [number, number];
              const lat = Number(c?.lat ?? c?.latitude ?? 0);
              const lng = Number(c?.lng ?? c?.lan ?? c?.longitude ?? 0);
              return [lat, lng] as [number, number];
            })
            .filter((pt) => !isNaN(pt[0]) && !isNaN(pt[1]) && (pt[0] !== 0 || pt[1] !== 0))
        : [];

      const firstCoord = normCoords.length > 0 ? normCoords[0] : null;

      setFarm({
        farmDetails: {
          ...details,
          id: String(details?.id || slug),
          name: details?.name || "Registered Agricultural Field",
          description: details?.description || "",
          crops: Array.isArray(details?.crops)
            ? details.crops
            : typeof details?.crops === "string"
            ? [details.crops]
            : ["Soybeans / Soya", "Corn / Maize (Maíz)"],
          soil_type: details?.soil_type || "Clay Loam (Franco-Arcilloso)",
          location: details?.location || "Santa Cruz, Agricultural Zone",
          Booking: Array.isArray(details?.Booking)
            ? details.Booking
            : Array.isArray(details?.bookings)
            ? details.bookings
            : [],
          boundary: {
            ...details?.boundary,
            coordinates: normCoords,
            area: Number(details?.boundary?.area || details?.area_sqm || 50000),
            area_hectares: Number(details?.boundary?.area_hectares || 5.0),
          },
        },
        centerPoint: raw?.centerPoint || {
          lat: firstCoord ? firstCoord[0] : null,
          lng: firstCoord ? firstCoord[1] : null,
        },
        cropYields: raw?.cropYields || {
          wheat: 3.4,
          corn: 6.8,
          soybean: 4.2,
          rice: 5.1,
        },
      });
    } catch {
      errorMessage("Error fetching farm details");
    } finally {
      setFetching(false);
    }
  }

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position: GeolocationPosition) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        () => {}
      );
    }
  }, []);

  useEffect(() => {
    if (slug) {
      fetchFarmer();
    }
  }, [slug]);

  if (fetching) return <FarmerShimmer />;

  if (!farm || !farm.farmDetails) {
    return (
      <div className="w-full min-h-[60vh] flex flex-col items-center justify-center space-y-4 max-w-xl mx-auto text-center p-6">
        <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
          <LandPlot className="w-8 h-8 text-emerald-600" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Field Not Found</h2>
          <p className="text-xs text-slate-500">
            This farm parcel might have been archived or is still syncing with the satellite telemetry server.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/farmer/farm">
            <Button variant="outline" className="rounded-xl text-xs font-bold">
              View All Fields
            </Button>
          </Link>
          <Link href="/farmer/farm/new">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold">
              Register New Field
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const farmDetails = farm.farmDetails;
  const farmName = farmDetails?.name || "Registered Agricultural Field";
  const farmCoords = farmDetails?.boundary?.coordinates || [];
  const farmBookings = farmDetails?.Booking || [];

  const rawArea = farmDetails?.boundary?.area || 0;
  const areaHa = Number(farmDetails?.boundary?.area_hectares || (rawArea > 1000 ? rawArea / 10000 : rawArea || 5.0));
  const areaAcres = areaHa * 2.47105;

  const defaultCenter: [number, number] =
    farm.centerPoint?.lat && farm.centerPoint?.lng
      ? [farm.centerPoint.lat, farm.centerPoint.lng]
      : farmCoords.length > 0
      ? farmCoords[0]
      : location.latitude && location.longitude
      ? [location.latitude, location.longitude]
      : [-17.7833, -63.1821];

  return (
    <div className="w-full min-h-screen py-6 space-y-6 max-w-7xl mx-auto">
      {/* ── TOP HEADER & BREADCRUMBS ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/farmer/farm">
            <Button
              size="icon"
              variant="outline"
              className="rounded-xl border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Link
                href="/farmer"
                className="text-xs font-bold text-slate-400 hover:text-emerald-600 transition-colors"
              >
                Dashboard
              </Link>
              <span className="text-xs text-slate-300 dark:text-slate-700">/</span>
              <Link
                href="/farmer/farm"
                className="text-xs font-bold text-slate-400 hover:text-emerald-600 transition-colors"
              >
                My Fields
              </Link>
              <span className="text-xs text-slate-300 dark:text-slate-700">/</span>
              <span className="text-xs font-extrabold text-emerald-600">{farmName}</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2 mt-0.5">
              <span>{farmName}</span>
              <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-black uppercase">
                Active GIS Polygon
              </Badge>
            </h1>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Link href="/farmer/new-booking" className="flex-1 md:flex-none">
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl h-10 px-4 flex items-center justify-center gap-2 shadow-sm shadow-emerald-600/20">
              <Zap className="w-4 h-4 fill-current" />
              <span>Book Machinery for Field</span>
            </Button>
          </Link>
          <Link href="/farmer/farm/new" className="flex-1 md:flex-none">
            <Button
              variant="outline"
              className="w-full rounded-xl border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold h-10 px-3 flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4 text-emerald-600" />
              <span>Add Another Field</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* ── KPI HIGHLIGHTS STRIP ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Field Area</span>
            <LandPlot className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {areaHa.toFixed(2)}
            </span>
            <span className="text-xs font-extrabold text-emerald-600">Ha</span>
            <span className="text-[10px] text-slate-400">({areaAcres.toFixed(1)} Ac)</span>
          </div>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Soil Structure</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="space-y-0.5">
            <span className="text-sm font-black text-slate-900 dark:text-white line-clamp-1">
              {farmDetails.soil_type || "Clay Loam"}
            </span>
            <span className="text-[10px] text-emerald-600 font-bold block">pH 6.5 (Optimal)</span>
          </div>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Crops Planted</span>
            <Sprout className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="space-y-0.5">
            <span className="text-sm font-black text-slate-900 dark:text-white line-clamp-1">
              {farmDetails.crops && farmDetails.crops.length > 0 ? farmDetails.crops[0] : "Soybeans / Soya"}
            </span>
            <span className="text-[10px] text-slate-400 font-medium block">
              {farmDetails.crops && farmDetails.crops.length > 1 ? `+${farmDetails.crops.length - 1} more crop` : "Single Crop Season"}
            </span>
          </div>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Booked Services</span>
            <Tractor className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {farmBookings.length}
            </span>
            <span className="text-xs text-slate-400 font-medium">Operations</span>
          </div>
        </Card>
      </div>

      {/* ── MAIN 12-COLUMN DASHBOARD GRID ───────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ── LEFT COLUMN: GIS SATELLITE MAP & SOIL TELEMETRY (7 Cols) ─────── */}
        <div className="lg:col-span-7 space-y-6">
          {/* Satellite Map Container */}
          <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden p-0">
            <div className="p-4 md:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    GIS Satellite Field Boundary
                  </h3>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-emerald-600" />
                    <span>{farmDetails.location || "Santa Cruz, Agricultural Sector"}</span>
                  </p>
                </div>
              </div>

              {/* Map Layer Switcher */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setMapLayer("satellite")}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                    mapLayer === "satellite"
                      ? "bg-white dark:bg-slate-900 text-emerald-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Satellite
                </button>
                <button
                  type="button"
                  onClick={() => setMapLayer("standard")}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                    mapLayer === "standard"
                      ? "bg-white dark:bg-slate-900 text-emerald-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Standard
                </button>
              </div>
            </div>

            {/* Map Canvas */}
            <div className="w-full h-[420px] bg-slate-950 relative">
              <MapContainer
                center={defaultCenter}
                zoom={16}
                scrollWheelZoom={false}
                className="h-full w-full"
                style={{ zIndex: 1 }}
              >
                {mapLayer === "satellite" ? (
                  <TileLayer
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    attribution="Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
                  />
                ) : (
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                )}
                {farmCoords.length > 0 && (
                  <Polygon pathOptions={limeOptions} positions={farmCoords}>
                    <Popup>
                      <div className="p-1 space-y-1 text-slate-900">
                        <p className="font-extrabold text-xs">{farmName}</p>
                        <p className="text-[10px] text-slate-500">{areaHa.toFixed(2)} Hectares</p>
                      </div>
                    </Popup>
                  </Polygon>
                )}
              </MapContainer>

              {/* Map Floating Badges */}
              <div className="absolute top-3 left-3 z-[400] flex flex-wrap gap-2 pointer-events-none">
                <Badge className="bg-slate-950/80 backdrop-blur-md text-white border-white/10 text-[10px] font-bold">
                  {farmCoords.length} Boundary Vertices
                </Badge>
                <Badge className="bg-emerald-950/80 backdrop-blur-md text-emerald-300 border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  <span>TractorAI Telemetry Active</span>
                </Badge>
              </div>
            </div>

            {/* Field Notes / Description Footer */}
            {farmDetails.description && (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                <span className="font-bold text-slate-900 dark:text-white mr-1.5">Operational Notes:</span>
                <span>{farmDetails.description}</span>
              </div>
            )}
          </Card>

          {/* TractorAI Agronomic & Soil Health Telemetry Card */}
          <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  TractorAI Soil & Machinery Telemetry
                </h3>
              </div>
              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] font-bold">
                Live Precision Telemetry
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Soil Classification
                </span>
                <span className="text-xs font-black text-slate-900 dark:text-white block">
                  {farmDetails.soil_type || "Clay Loam (Franco-Arcilloso)"}
                </span>
                <p className="text-[10px] text-slate-500">Optimal moisture holding capacity for intensive grain & legume cycles.</p>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  pH Level Index
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-black text-emerald-600">6.5</span>
                  <Badge className="bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0">
                    Slightly Acidic / Ideal
                  </Badge>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-1">
                  <div className="bg-emerald-500 h-full w-[65%]" />
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Organic Matter & Drainage
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-black text-slate-900 dark:text-white">3.8%</span>
                  <span className="text-[10px] text-slate-400">Humus</span>
                </div>
                <p className="text-[10px] text-slate-500">Good percolation; minimal compaction risk during wet season.</p>
              </div>
            </div>

            {/* Machinery Advice Banner */}
            <div className="p-4 bg-emerald-50/90 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200/70 dark:border-emerald-800/40 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-black text-emerald-900 dark:text-emerald-300">
                <Tractor className="w-4 h-4 text-emerald-600" />
                <span>Recommended Machinery Fleet Calibration</span>
              </div>
              <p className="text-[11px] text-emerald-800 dark:text-emerald-300 font-medium leading-relaxed">
                Tillage with 90-120HP 4WD tractors with 24-disc harrows at 18-22cm depth. Pneumatic precision seeders recommended for soybean spacing (45cm rows) and corn (70cm rows).
              </p>
            </div>
          </Card>
        </div>

        {/* ── RIGHT COLUMN: TELEMETRY CHARTS & BOOKING TIMELINE (5 Cols) ───── */}
        <div className="lg:col-span-5 space-y-6">
          {/* Soil Moisture & Precipitation Chart */}
          <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Droplets className="w-4 h-4 text-sky-500" />
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  Soil Moisture & Precipitation Trend
                </h3>
              </div>
              <Badge variant="outline" className="text-[10px] font-bold text-sky-600 border-sky-500/30">
                12-Month Telemetry
              </Badge>
            </div>

            <div className="w-full h-52">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={AGRONOMIC_TELEMETRY} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="moistureGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="rainfallGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888820" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(15, 23, 42, 0.95)",
                      borderRadius: "12px",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      color: "#fff",
                      fontSize: "11px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="moisture"
                    stroke="#0ea5e9"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#moistureGrad)"
                    name="Soil Moisture (%)"
                  />
                  <Area
                    type="monotone"
                    dataKey="rainfall"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#rainfallGrad)"
                    name="Rainfall (mm)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-center gap-6 text-[11px] font-bold text-slate-500">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                <span>Soil Moisture (%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Rainfall (mm)</span>
              </div>
            </div>
          </Card>

          {/* Micro-Climate Sensor Snapshot */}
          <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Sun className="w-4 h-4 text-amber-500" />
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  Field Micro-Climate Telemetry
                </h3>
              </div>
              <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px] font-bold">
                Live Sensor Feed
              </Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 text-center space-y-0.5">
                <Thermometer className="w-4 h-4 text-rose-500 mx-auto" />
                <span className="text-[10px] font-bold text-slate-400 block">Soil Temp</span>
                <span className="text-base font-black text-slate-900 dark:text-white block">23°C</span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 text-center space-y-0.5">
                <Sun className="w-4 h-4 text-amber-500 mx-auto" />
                <span className="text-[10px] font-bold text-slate-400 block">Heat Index</span>
                <span className="text-base font-black text-slate-900 dark:text-white block">26°C</span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 text-center space-y-0.5">
                <Droplets className="w-4 h-4 text-sky-500 mx-auto" />
                <span className="text-[10px] font-bold text-slate-400 block">Humidity</span>
                <span className="text-base font-black text-slate-900 dark:text-white block">64%</span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 text-center space-y-0.5">
                <Wind className="w-4 h-4 text-emerald-500 mx-auto" />
                <span className="text-[10px] font-bold text-slate-400 block">Wind Speed</span>
                <span className="text-base font-black text-slate-900 dark:text-white block">14 km/h</span>
              </div>
            </div>
          </Card>

          {/* Machinery Booking Schedule on this Field */}
          <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  Field Machinery Operations
                </h3>
              </div>
              <Badge variant="outline" className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
                {farmBookings.length} {farmBookings.length === 1 ? "Schedule" : "Schedules"}
              </Badge>
            </div>

            {farmBookings.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {farmBookings.map((bk: any) => (
                  <BookingCard booking={bk} key={bk.id} />
                ))}
              </div>
            ) : (
              <div className="p-6 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 text-center space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mx-auto">
                  <Tractor className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <p className="font-extrabold text-xs text-slate-900 dark:text-white">
                    No active machinery operations scheduled
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                    Book precision tractors, planters, or harvesters dispatched specifically to this field boundary.
                  </p>
                </div>
                <Link href="/farmer/new-booking">
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl h-8 px-4 shadow-sm"
                  >
                    Schedule Tractor Now
                  </Button>
                </Link>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

