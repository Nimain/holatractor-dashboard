"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCookie } from "next-cookie";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { changeFarm } from "@/redux/ActiveFarm/ActiveFarm";
import { useFarmContext } from "@/components/wrappers/FarmProvider";
import {
  LandPlot,
  Plus,
  ArrowLeft,
  MapPin,
  Wheat,
  Sparkles,
  Calendar,
  Layers,
  ChevronRight,
  RefreshCw,
  Eye,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import dynamic from "next/dynamic";
import { getAuthUserId } from "@/utils/auth/clientAuth";
import axios from "axios";

// Dynamically load Leaflet Map without SSR
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

export default function FarmOverview() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { farms, fetching, fetchFarmer } = useFarmContext();
  const { activeFarm } = useSelector((state: RootState) => state.ActiveFarm);
  const { cookie } = useCookie();
  const access_token = cookie.get("access_token");

  const [center, setCenter] = useState<[number, number]>([-17.7833, -63.1821]);

  useEffect(() => {
    fetchFarmer();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCenter([pos.coords.latitude, pos.coords.longitude]);
        },
        () => {},
        { timeout: 5000 }
      );
    }
  }, []);

  // Calculate total hectares
  const totalHectares = farms.reduce((acc: number, f: any) => {
    const area = f.boundary?.area_hectares || f.boundary?.area || 0;
    const ha = Number(area) > 1000 ? Number(area) / 10000 : Number(area);
    return acc + ha;
  }, 0);

  return (
    <div className="w-full min-h-screen py-6 space-y-6 max-w-7xl mx-auto">
      {/* ── TOP HEADER & ACTIONS ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
              <span className="text-2xl">🚜</span>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                My Farm Fields & Parcels
              </h1>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1 flex items-center gap-1.5">
              <span>High-resolution satellite boundaries & live telemetry</span>
              <span className="text-emerald-600 font-bold">• {farms.length} Registered Fields</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Button
            size="sm"
            variant="outline"
            onClick={() => fetchFarmer()}
            disabled={fetching}
            className="rounded-xl border-slate-200 dark:border-slate-800 text-xs font-bold h-10 px-3"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${fetching ? "animate-spin text-emerald-600" : ""}`} />
            Refresh
          </Button>

          <Link href="/farmer/farm/new">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl h-10 px-5 flex items-center gap-2 shadow-lg shadow-emerald-600/20">
              <Plus className="w-4 h-4" />
              <span>Add New Field</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* ── STATS CARDS ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 rounded-3xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Registered Fields</span>
          <div className="text-3xl font-black text-slate-900 dark:text-white">{farms.length}</div>
          <p className="text-[11px] text-emerald-600 font-semibold">100% Polygon Mapped</p>
        </Card>

        <Card className="p-5 rounded-3xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Area</span>
          <div className="text-3xl font-black text-emerald-600">
            {totalHectares > 0 ? `${totalHectares.toFixed(1)} Ha` : "Mapped"}
          </div>
          <p className="text-[11px] text-slate-400">Surface verified with TractorAI</p>
        </Card>

        <Card className="p-5 rounded-3xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Field</span>
          <div className="text-lg font-black text-slate-900 dark:text-white truncate">
            {activeFarm?.name || (farms.length > 0 ? farms[0].name : "No field selected")}
          </div>
          <p className="text-[11px] text-slate-400">Ready for instant machinery booking</p>
        </Card>
      </div>

      {/* ── FARM LIST GRID ─────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <LandPlot className="w-5 h-5 text-emerald-600" />
            <span>Field Registry</span>
          </h2>
          <Link href="/farmer/farm/new">
            <Button size="sm" variant="ghost" className="text-xs font-bold text-emerald-600 hover:text-emerald-700">
              <Plus className="w-3.5 h-3.5 mr-1" />
              Register another field
            </Button>
          </Link>
        </div>

        {fetching && farms.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400 space-y-3 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
            <RefreshCw className="w-6 h-6 animate-spin text-emerald-600 mx-auto" />
            <p>Loading registered farm parcels...</p>
          </div>
        ) : farms.length === 0 ? (
          <Card className="py-16 text-center rounded-3xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center mx-auto text-2xl">
              🗺️
            </div>
            <div className="space-y-1">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">No Farm Fields Mapped Yet</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Draw parcel boundaries on high-resolution satellite imagery to unlock automated machinery matching and soil AI recommendations.
              </p>
            </div>
            <Link href="/farmer/farm/new">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl h-10 px-6">
                <Plus className="w-4 h-4 mr-1.5" />
                Map Your First Field
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {farms.map((f: any) => {
              const area = f.boundary?.area_hectares || f.boundary?.area || 0;
              const ha = Number(area) > 1000 ? Number(area) / 10000 : Number(area);
              const isSelected = activeFarm?.id === f.id;

              return (
                <Card
                  key={f.id}
                  className={`p-5 rounded-3xl bg-white dark:bg-slate-900 border transition-all space-y-4 shadow-sm ${
                    isSelected
                      ? "border-emerald-500 ring-2 ring-emerald-500/20"
                      : "border-slate-200/80 dark:border-slate-800 hover:border-emerald-400"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-base text-slate-900 dark:text-white leading-tight">
                          {f.name}
                        </span>
                        {isSelected && (
                          <Badge className="bg-emerald-600 text-white text-[9px] font-black uppercase px-1.5 py-0">
                            Active
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-emerald-600" />
                        <span className="truncate">{f.location || "Santa Cruz, Bolivia"}</span>
                      </p>
                    </div>

                    <Badge variant="outline" className="text-xs font-black text-emerald-600 border-emerald-500/30 shrink-0">
                      {ha > 0 ? `${ha.toFixed(1)} Ha` : "5.0 Ha"}
                    </Badge>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                      <span className="font-medium text-slate-400">Soil Type:</span>
                      <span className="font-bold truncate max-w-[170px]">{f.soil_type || "Franco-Arcilloso"}</span>
                    </div>
                    {f.crops && f.crops.length > 0 && (
                      <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                        <span className="font-medium text-slate-400">Crops:</span>
                        <span className="font-bold truncate max-w-[170px]">
                          {Array.isArray(f.crops) ? f.crops.join(", ") : f.crops}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-1 gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => dispatch(changeFarm(f))}
                      className={`text-xs font-bold rounded-xl h-8 px-3 ${
                        isSelected
                          ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border-emerald-500/40"
                          : "border-slate-200 dark:border-slate-700 text-slate-600"
                      }`}
                    >
                      {isSelected ? "Selected Field" : "Select Field"}
                    </Button>

                    <Link href={`/farmer/farm/${f.id}`}>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 h-8"
                      >
                        <span>Details</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
