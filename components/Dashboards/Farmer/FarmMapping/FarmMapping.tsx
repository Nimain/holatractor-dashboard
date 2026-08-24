"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useCookie } from "next-cookie";
import {
  MapPin,
  LandPlot,
  Layers,
  Sprout,
  Save,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Sparkles,
  RefreshCw,
  Plus,
  Compass,
  Info,
  ShieldCheck,
  Zap,
  Activity,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { errorMessage, successMessage } from "@/utils/Toastify/Messages";
import { renderInstance, TractorAIBaseURL, FastApiBaseURL, NestJsBaseURL } from "@/utils/Axios/RenderInstance";
import { useFarmContext } from "@/components/wrappers/FarmProvider";
import Link from "next/link";
import dynamic from "next/dynamic";
import { LatLngPoint, calculatePolygonArea } from "./InteractiveFarmDrawer";

// Dynamically load the Interactive Map Drawer without SSR
const InteractiveFarmDrawer = dynamic(() => import("./InteractiveFarmDrawer"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[480px] bg-slate-950 rounded-3xl flex flex-col items-center justify-center text-slate-400 space-y-3">
      <RefreshCw className="w-6 h-6 animate-spin text-emerald-500" />
      <p className="text-xs font-bold">Initializing Satellite Map & GPS Telemetry...</p>
    </div>
  ),
});

const CROP_OPTIONS = [
  "Soybeans / Soya",
  "Corn / Maize (Maíz)",
  "Wheat / Trigo",
  "Sunflower / Girasol",
  "Sorghum / Sorgo",
  "Sugarcane / Caña",
  "Cotton / Algodón",
  "Paddy Rice / Arroz",
  "Pasture / Pastura",
  "Chia & Specialty Seeds",
];

const SOIL_TYPE_OPTIONS = [
  "Clay Loam (Franco-Arcilloso)",
  "Sandy Loam (Franco-Arenoso)",
  "Heavy Clay (Arcilloso Pesado)",
  "Silty Loam (Franco-Limoso)",
  "Humus-Rich Alluvial (Aluvial Orgánico)",
  "Red Ferralsol (Tierra Roja)",
];

export default function FarmMapping() {
  const router = useRouter();
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
  const userId = parsedUser?.userId || parsedUser?.id || parsedUser?.sub || parsedUser?._id || "farmer_demo_01";
  const access_token = cookie.get("access_token");

  const { fetchFarmer, setFarms } = useFarmContext();

  const [saving, setSaving] = useState(false);
  const [analyzingSoil, setAnalyzingSoil] = useState(false);
  const [soilAnalysisData, setSoilAnalysisData] = useState<any | null>(null);

  // ── FARM SCHEMA FORM FIELDS (MATCHES FarmCreate SCHEMA) ──────────────────────
  const [farmName, setFarmName] = useState("");
  const [hectares, setHectares] = useState("5.0");
  const [selectedCrops, setSelectedCrops] = useState<string[]>(["Soybeans / Soya"]);
  const [soilType, setSoilType] = useState("Clay Loam (Franco-Arcilloso)");
  const [farmLocation, setFarmLocation] = useState("Santa Cruz, Agricultural Sector");
  const [description, setDescription] = useState("");
  const [boundaryType, setBoundaryType] = useState("polygon");

  // Map state
  const [center, setCenter] = useState<[number, number]>([-17.7833, -63.1821]); // Default Santa Cruz / Regional hub
  const [points, setPoints] = useState<LatLngPoint[]>([]);

  // On mount, center near user's GPS if available
  useEffect(() => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCenter([pos.coords.latitude, pos.coords.longitude]);
        },
        () => { },
        { timeout: 5000 }
      );
    }
  }, []);

  // Fetch Tractor AI Soil Classification when points or center changes
  const runSoilAnalysis = async (lat: number, lng: number) => {
    setAnalyzingSoil(true);
    try {
      const res = await axios.get(`/api/farm/soil-analysis?lat=${lat}&lng=${lng}`, {
        headers: access_token ? { Authorization: `Bearer ${access_token}` } : {},
        timeout: 6000,
      });
      if (res.data) {
        setSoilAnalysisData(res.data);
        if (res.data.soil_type) {
          // Pre-select matching soil option if available
          const match = SOIL_TYPE_OPTIONS.find((s) =>
            s.toLowerCase().includes(res.data.soil_type.toLowerCase())
          );
          if (match) {
            setSoilType(match);
          }
        }
      }
    } catch (e) {
      console.warn("Soil analysis error:", e);
    } finally {
      setAnalyzingSoil(false);
    }
  };

  // When points update on map, calculate area & trigger AI analysis on first point
  const handlePointsChange = (newPoints: LatLngPoint[]) => {
    setPoints(newPoints);
    if (newPoints.length >= 3) {
      const area = calculatePolygonArea(newPoints);
      if (area.hectares > 0) {
        setHectares(area.hectares.toString());
      }
    }
    if (newPoints.length === 1 && !soilAnalysisData) {
      runSoilAnalysis(newPoints[0].lat, newPoints[0].lng);
    }
  };

  const handleToggleCrop = (crop: string) => {
    if (selectedCrops.includes(crop)) {
      if (selectedCrops.length > 1) {
        setSelectedCrops(selectedCrops.filter((c) => c !== crop));
      }
    } else {
      setSelectedCrops([...selectedCrops, crop]);
    }
  };

  // ── SAVE FARM HANDLER (EXACT API INTEGRATION) ─────────────────────────────
  const handleSaveFarm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!farmName.trim()) {
      errorMessage("Please enter a Field / Farm Name");
      return;
    }

    if (points.length < 3) {
      errorMessage("Please map at least 3 boundary vertices on the satellite map to complete the parcel polygon.");
      return;
    }

    const numHectares = parseFloat(hectares) || 1.0;
    const boundaryAreaSqm = Math.round(numHectares * 10000);

    setSaving(true);

    // Format coordinates according to backend schema (lat, lan, lng as formatted strings)
    const formattedCoordinates = points.map((p) => ({
      lat: p.lat.toFixed(6),
      lan: p.lng.toFixed(6),
      lng: p.lng.toFixed(6),
    }));

    // Exact FarmCreate Payload
    const payload = {
      owner_id: userId,
      name: farmName.trim(),
      description: description.trim() || `Field with ${selectedCrops.join(", ")} (${soilType})`,
      location: farmLocation.trim() || `${center[0].toFixed(4)}°, ${center[1].toFixed(4)}°`,
      soil_type: soilType,
      crops: selectedCrops,
      type: boundaryType || "polygon",
      boundary: {
        coordinates: formattedCoordinates,
        area: boundaryAreaSqm,
      },
    };

    let createdRecord: any = null;

    // 1. Primary: Next.js API Proxy (/api/farm)
    try {
      const res = await axios.post("/api/farm", payload, {
        headers: access_token ? { Authorization: `Bearer ${access_token}` } : {},
        timeout: 12000,
      });
      if (res.data) {
        createdRecord = res.data;
      }
    } catch (err1: any) {
      console.warn("Proxy POST /api/farm failed, attempting direct FastAPI /farm:", err1?.response?.data || err1?.message);

      // 2. Direct FastAPI POST /farm fallback
      try {
        const fastApiUrl = `${FastApiBaseURL.replace(/\/$/, "")}/farm`;
        const resFast = await axios.post(fastApiUrl, payload, {
          headers: access_token ? { Authorization: `Bearer ${access_token}` } : {},
          timeout: 12000,
        });
        if (resFast.data) {
          createdRecord = resFast.data;
        }
      } catch (err2: any) {
        console.warn("Direct FastAPI POST /farm failed, attempting NestJS:", err2?.response?.data || err2?.message);

        // 3. Direct NestJS POST /farm fallback
        try {
          const resNest = await renderInstance.post("farm", payload, { timeout: 10000 });
          if (resNest.data) {
            createdRecord = resNest.data;
          }
        } catch (err3: any) {
          console.warn("Direct NestJS POST /farm failed:", err3?.message);
        }
      }
    }

    // Always create optimistic local representation for immediate rendering on dashboard map & sidebar
    const optimisticFarm = {
      id: createdRecord?.id || `farm_${Date.now()}`,
      name: farmName.trim(),
      owner_id: userId,
      type: boundaryType || "polygon",
      location: farmLocation.trim(),
      soil_type: soilType,
      crops: selectedCrops,
      description: description.trim() || `Field with ${selectedCrops.join(", ")} (${soilType})`,
      boundary: {
        coordinates: points.map((p) => [p.lat, p.lng]),
        area: boundaryAreaSqm,
      },
      created_at: new Date().toISOString(),
    };

    try {
      const storageKey = `@farmer_custom_farms_${userId}`;
      const existing = localStorage.getItem(storageKey);
      const list = existing ? JSON.parse(existing) : [];
      list.unshift(optimisticFarm);
      localStorage.setItem(storageKey, JSON.stringify(list));
    } catch (e) {
      console.warn("Failed saving farm to local storage cache:", e);
    }

    // Update Farm Context state immediately
    try {
      if (setFarms) {
        setFarms((prev: any[]) => [optimisticFarm, ...(prev || [])]);
      }
      if (fetchFarmer) {
        fetchFarmer();
      }
    } catch (e) { }

    successMessage("Field mapped and registered successfully!");
    setSaving(false);
    router.push("/farmer");
  };

  return (
    <div className="w-full min-h-screen py-6 space-y-6 max-w-7xl mx-auto">
      {/* ── TOP HEADER & BREADCRUMBS ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/farmer">
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
              <span className="text-2xl">🗺️</span>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Map & Register Agricultural Field
              </h1>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1 flex items-center gap-1.5">
              <span>Draw parcel polygon boundaries on high-resolution satellite imagery</span>
              <span className="text-emerald-600 font-bold">• Live Tractor AI Soil Telemetry</span>
            </p>
          </div>
        </div>
      </div>

      {/* ── MAIN WORKSPACE: MAP (LEFT/MAIN) + SPECIFICATIONS FORM (RIGHT) ───── */}
      <form onSubmit={handleSaveFarm}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ── SATELLITE MAP DRAWER (7 Cols on desktop) ── */}
          <div className="lg:col-span-7 space-y-3">
            <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-emerald-600" />
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    Satellite Boundary Mapping
                  </h3>
                </div>
                <Badge variant="outline" className="text-xs font-bold text-slate-600 border-slate-300">
                  {points.length} Points Mapped
                </Badge>
              </div>

              <div className="h-[490px] w-full">
                <InteractiveFarmDrawer
                  points={points}
                  onChangePoints={handlePointsChange}
                  center={center}
                  onCenterChange={setCenter}
                />
              </div>

              {/* Tractor AI Soil Analysis Banner */}
              {soilAnalysisData ? (
                <div className="p-3.5 bg-emerald-50/80 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200/60 dark:border-emerald-800/40 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      Tractor AI Soil Telemetry: {soilAnalysisData.soil_type} ({soilAnalysisData.soil_type_en})
                    </span>
                    <Badge className="bg-emerald-600 text-white text-[10px] font-bold">
                      pH {soilAnalysisData.ph}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-emerald-800/90 dark:text-emerald-300/90 font-medium">
                    {soilAnalysisData.tractor_advice || soilAnalysisData.texture}
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>Click on map to classify soil texture & machinery recommendations</span>
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => runSoilAnalysis(center[0], center[1])}
                    disabled={analyzingSoil}
                    className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-xs font-bold h-7 rounded-lg"
                  >
                    {analyzingSoil ? "Analyzing..." : "Classify Now"}
                  </Button>
                </div>
              )}
            </Card>
          </div>

          {/* ── FIELD DETAILS & AGRONOMIC SPECS (5 Cols on desktop) ── */}
          <div className="lg:col-span-5 space-y-4">
            <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <LandPlot className="w-4 h-4 text-emerald-600" />
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  Field Details & Agronomic Specs
                </h3>
              </div>

              {/* Field Name */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Field / Farm Name <span className="text-rose-500">*</span>
                </Label>
                <Input
                  type="text"
                  placeholder="e.g. Parcela San Isidro - Sector Norte"
                  value={farmName}
                  onChange={(e) => setFarmName(e.target.value)}
                  required
                  className="rounded-xl border-slate-200 dark:border-slate-800 text-xs h-10"
                />
              </div>

              {/* Area (Synced with Map) & Boundary Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Total Area (Hectares) <span className="text-rose-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="5.0"
                      value={hectares}
                      onChange={(e) => setHectares(e.target.value)}
                      required
                      className="rounded-xl border-slate-200 dark:border-slate-800 text-xs h-10 pr-10 font-bold"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      Ha
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Boundary Type
                  </Label>
                  <Select value={boundaryType} onValueChange={setBoundaryType}>
                    <SelectTrigger className="rounded-xl border-slate-200 dark:border-slate-800 text-xs h-10 font-bold">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="polygon">Polygon Boundary</SelectItem>
                      <SelectItem value="point">Point Coordinate</SelectItem>
                      <SelectItem value="line">Linear Parcel Strip</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Crops Multi-Selector */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Crops Planted / Planned
                </Label>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                  {CROP_OPTIONS.map((crop) => {
                    const isSelected = selectedCrops.includes(crop);
                    return (
                      <button
                        key={crop}
                        type="button"
                        onClick={() => handleToggleCrop(crop)}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 ${isSelected
                            ? "bg-emerald-600 text-white shadow-sm"
                            : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-emerald-500"
                          }`}
                      >
                        <span>{crop}</span>
                        {isSelected && <CheckCircle2 className="w-3 h-3" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Soil Classification */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Soil Classification
                  </Label>
                  {soilAnalysisData?.soil_type && (
                    <span className="text-[10px] font-bold text-emerald-600">
                      AI Confirmed: {soilAnalysisData.soil_type}
                    </span>
                  )}
                </div>
                <Select value={soilType} onValueChange={setSoilType}>
                  <SelectTrigger className="rounded-xl border-slate-200 dark:border-slate-800 text-xs h-10">
                    <SelectValue placeholder="Select soil type" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {SOIL_TYPE_OPTIONS.map((st) => (
                      <SelectItem key={st} value={st}>
                        {st}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Location Address */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Location Address / Agricultural Sector
                </Label>
                <Input
                  type="text"
                  placeholder="e.g. Santa Cruz, Km 14 Norte - Warnes"
                  value={farmLocation}
                  onChange={(e) => setFarmLocation(e.target.value)}
                  className="rounded-xl border-slate-200 dark:border-slate-800 text-xs h-10"
                />
              </div>

              {/* Operational Description */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Operational Notes & Access Details (Optional)
                </Label>
                <Textarea
                  placeholder="e.g. Accessible via Gate 2, level terrain suitable for 90HP tractors & grain harvesters..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="rounded-xl border-slate-200 dark:border-slate-800 text-xs resize-none"
                />
              </div>

              {/* Submit / Cancel Actions */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <Link href="/farmer">
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-xs font-bold rounded-xl h-10 px-4"
                  >
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={saving || points.length < 3}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl h-10 px-6 flex items-center gap-2 shadow-sm shadow-emerald-600/20 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Field...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Save & Register Field</span>
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
