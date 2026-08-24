"use client";

import React, { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Polygon,
  Polyline,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import {
  Layers,
  Undo2,
  Trash2,
  MapPin,
  Sparkles,
  Locate,
  CheckCircle2,
  PlusCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface LatLngPoint {
  lat: number;
  lng: number;
}

interface InteractiveFarmDrawerProps {
  points: LatLngPoint[];
  onChangePoints: (points: LatLngPoint[]) => void;
  center: [number, number];
  onCenterChange?: (center: [number, number]) => void;
}

// ── SPHERICAL AREA CALCULATION (m² & Hectares) ───────────────────────────────
export function calculatePolygonArea(coords: LatLngPoint[]): { sqm: number; hectares: number; acres: number } {
  if (coords.length < 3) return { sqm: 0, hectares: 0, acres: 0 };
  const radius = 6378137; // Earth radius in meters
  let area = 0;
  const len = coords.length;
  for (let i = 0; i < len; i++) {
    const p1 = coords[i];
    const p2 = coords[(i + 1) % len];
    const lat1 = (p1.lat * Math.PI) / 180;
    const lat2 = (p2.lat * Math.PI) / 180;
    const lon1 = (p1.lng * Math.PI) / 180;
    const lon2 = (p2.lng * Math.PI) / 180;
    area += (lon2 - lon1) * (2 + Math.sin(lat1) + Math.sin(lat2));
  }
  const sqm = Math.abs((area * radius * radius) / 2.0);
  const hectares = Math.round((sqm / 10000) * 100) / 100;
  const acres = Math.round((sqm / 4046.86) * 100) / 100;
  return { sqm: Math.round(sqm), hectares, acres };
}

// Map Click Listener
function MapClickHandler({ onAddPoint }: { onAddPoint: (pt: LatLngPoint) => void }) {
  useMapEvents({
    click(e) {
      onAddPoint({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

// Map Recenter Controller
function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

// Custom Div Icon for vertex points
const getVertexIcon = (index: number) => {
  return L.divIcon({
    className: "farm-vertex-marker",
    html: `<div style="background: #059669; color: #ffffff; width: 22px; height: 22px; border-radius: 50%; border: 2.5px solid #ffffff; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 900; box-shadow: 0 4px 10px rgba(0,0,0,0.35); cursor: pointer;">${index + 1}</div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
};

export default function InteractiveFarmDrawer({
  points,
  onChangePoints,
  center,
  onCenterChange,
}: InteractiveFarmDrawerProps) {
  const [mapType, setMapType] = useState<"satellite" | "street">("satellite");
  const [locating, setLocating] = useState(false);

  const areaMetrics = calculatePolygonArea(points);

  const handleAddPoint = (pt: LatLngPoint) => {
    onChangePoints([...points, pt]);
  };

  const handleUndo = () => {
    if (points.length > 0) {
      onChangePoints(points.slice(0, -1));
    }
  };

  const handleClear = () => {
    onChangePoints([]);
  };

  const handleLocateMe = () => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      setLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newCenter: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          if (onCenterChange) onCenterChange(newCenter);
          setLocating(false);
        },
        () => {
          setLocating(false);
        },
        { timeout: 5000 }
      );
    }
  };

  const handleCreateSamplePolygon = () => {
    const lat = center[0];
    const lng = center[1];
    const offset = 0.0025; // ~270m box -> ~7.5 Hectares
    const sampleBox: LatLngPoint[] = [
      { lat: lat + offset, lng: lng - offset },
      { lat: lat + offset, lng: lng + offset },
      { lat: lat - offset, lng: lng + offset },
      { lat: lat - offset, lng: lng - offset },
    ];
    onChangePoints(sampleBox);
  };

  return (
    <div className="w-full h-full min-h-[480px] flex flex-col rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800 bg-slate-950 relative shadow-inner">
      {/* ── TOP CONTROL BAR OVERLAY ─────────────────────────────────────────── */}
      <div className="absolute top-3 left-3 right-3 z-[1000] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-800 shadow-lg">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setMapType(mapType === "satellite" ? "street" : "satellite")}
            className="h-8 px-2.5 text-xs font-bold text-slate-200 hover:text-white hover:bg-slate-800 rounded-xl flex items-center gap-1.5"
          >
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>{mapType === "satellite" ? "Satellite ESRI" : "Street Map"}</span>
          </Button>

          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={handleLocateMe}
            disabled={locating}
            className="h-8 px-2.5 text-xs font-bold text-slate-200 hover:text-white hover:bg-slate-800 rounded-xl flex items-center gap-1.5"
          >
            <Locate className={`w-3.5 h-3.5 text-emerald-400 ${locating ? "animate-spin" : ""}`} />
            <span>My Location</span>
          </Button>

          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={handleCreateSamplePolygon}
            className="h-8 px-2.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40 rounded-xl flex items-center gap-1.5"
            title="Auto-generate standard parcel box near current center"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Auto-Box</span>
          </Button>
        </div>

        {/* Action buttons (Undo / Clear) */}
        <div className="flex items-center gap-2 pointer-events-auto bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-800 shadow-lg">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={handleUndo}
            disabled={points.length === 0}
            className="h-8 px-2.5 text-xs font-bold text-slate-200 hover:text-white hover:bg-slate-800 rounded-xl flex items-center gap-1 disabled:opacity-40"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span>Undo ({points.length})</span>
          </Button>

          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={handleClear}
            disabled={points.length === 0}
            className="h-8 px-2.5 text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-xl flex items-center gap-1 disabled:opacity-40"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </Button>
        </div>
      </div>

      {/* ── LEAFLET MAP CANVAS ──────────────────────────────────────────────── */}
      <div className="flex-1 w-full h-full min-h-[420px] relative">
        <MapContainer
          center={center}
          zoom={15}
          scrollWheelZoom={true}
          style={{ width: "100%", height: "100%" }}
        >
          <MapController center={center} />
          <MapClickHandler onAddPoint={handleAddPoint} />

          {/* Tile Layer */}
          {mapType === "satellite" ? (
            <TileLayer
              attribution='&copy; <a href="https://www.esri.com/">Esri World Imagery</a>'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={19}
            />
          ) : (
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />
          )}

          {/* Draw Polygon if 3 or more points */}
          {points.length >= 3 && (
            <Polygon
              positions={points.map((p) => [p.lat, p.lng])}
              pathOptions={{
                color: "#10b981",
                fillColor: "#059669",
                fillOpacity: 0.35,
                weight: 3,
                dashArray: "4, 4",
              }}
            />
          )}

          {/* Draw Polyline if 2 points */}
          {points.length === 2 && (
            <Polyline
              positions={points.map((p) => [p.lat, p.lng])}
              pathOptions={{
                color: "#10b981",
                weight: 3,
                dashArray: "4, 4",
              }}
            />
          )}

          {/* Vertex Markers */}
          {points.map((pt, index) => (
            <Marker
              key={`${pt.lat}_${pt.lng}_${index}`}
              position={[pt.lat, pt.lng]}
              icon={getVertexIcon(index)}
            />
          ))}
        </MapContainer>
      </div>

      {/* ── BOTTOM LIVE METRIC STATUS BAR ──────────────────────────────────── */}
      <div className="bg-slate-900/95 backdrop-blur-md p-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 z-[1000]">
        <div className="flex items-center gap-2">
          <Badge
            className={`text-xs font-bold px-2.5 py-1 rounded-xl flex items-center gap-1.5 ${
              points.length >= 3
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
            }`}
          >
            {points.length >= 3 ? (
              <CheckCircle2 className="w-3.5 h-3.5" />
            ) : (
              <PlusCircle className="w-3.5 h-3.5" />
            )}
            <span>
              {points.length >= 3
                ? `Polygon Complete (${points.length} Vertices)`
                : `Click map to place points (${points.length}/3 minimum)`}
            </span>
          </Badge>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Calculated Area</span>
            <span className="font-black text-sm text-emerald-400">
              {areaMetrics.hectares > 0 ? `${areaMetrics.hectares} Ha` : "0.0 Ha"}
            </span>
          </div>

          <div className="text-right border-l border-slate-800 pl-4 hidden sm:block">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Square Meters</span>
            <span className="font-mono font-bold text-slate-200">
              {areaMetrics.sqm.toLocaleString()} m²
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
