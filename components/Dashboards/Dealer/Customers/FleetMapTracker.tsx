"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Maximize2, Minimize2, ZoomIn, ZoomOut, RotateCcw, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";

const GOOGLE_MAPS_API_KEY = "AIzaSyDjMCI0xj2Q-WTc9J7yWX-Mvh0DBM7oHbg";

export interface TractorMarker {
  id: string;
  name: string;
  type: string;
  lat: number;
  lng: number;
  status: "Optimal" | "Service Due";
  locationPing: string;
  image?: string;
  vin?: string;
  hours?: string;
}

interface FleetMapTrackerProps {
  activeView: "live" | "history";
  tractors?: TractorMarker[];
  customerCity?: string;
}

export default function FleetMapTracker({
  activeView,
  tractors = [],
  customerCity,
}: FleetMapTrackerProps) {
  const mapElementRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedTractor, setSelectedTractor] = useState<TractorMarker | null>(
    tractors[0] || null
  );

  // Compute dynamic center coordinates based on actual fleet
  const centerCoordinates =
    tractors.length > 0 && tractors[0].lat && tractors[0].lng
      ? { lat: Number(tractors[0].lat), lng: Number(tractors[0].lng) }
      : { lat: -17.7639, lng: -63.1309 };

  // Keep selectedTractor in sync when tractors prop updates
  useEffect(() => {
    if (tractors.length > 0) {
      setSelectedTractor((prev) => {
        if (!prev) return tractors[0];
        const match = tractors.find((t) => t.id === prev.id);
        return match || tractors[0];
      });
    }
  }, [tractors]);

  // Load Google Maps Script
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.google && window.google.maps) {
      setMapLoaded(true);
      return;
    }

    const existingScript = document.getElementById("google-maps-fleet-script");
    if (existingScript) {
      existingScript.addEventListener("load", () => setMapLoaded(true));
      existingScript.addEventListener("error", () => setMapError(true));
      return;
    }

    const script = document.createElement("script");
    script.id = "google-maps-fleet-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=geometry`;
    script.async = true;
    script.defer = true;
    script.onload = () => setMapLoaded(true);
    script.onerror = () => setMapError(true);
    document.head.appendChild(script);
  }, []);

  // Initialize Map and Markers
  useEffect(() => {
    if (!mapLoaded || !mapElementRef.current || !window.google?.maps) return;

    try {
      if (!mapInstanceRef.current) {
        mapInstanceRef.current = new window.google.maps.Map(mapElementRef.current, {
          center: centerCoordinates,
          zoom: 13,
          mapTypeId: window.google.maps.MapTypeId.HYBRID,
          disableDefaultUI: false,
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: true,
        });
      } else {
        mapInstanceRef.current.setCenter(centerCoordinates);
      }

      // Clear existing markers
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];

      const bounds = new window.google.maps.LatLngBounds();

      tractors.forEach((tractor) => {
        const pos = { lat: Number(tractor.lat), lng: Number(tractor.lng) };
        bounds.extend(pos);

        const marker = new window.google.maps.Marker({
          position: pos,
          map: mapInstanceRef.current,
          title: tractor.name,
          icon: {
            url:
              tractor.status === "Service Due"
                ? "https://maps.google.com/mapfiles/ms/icons/red-dot.png"
                : "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
          },
        });

        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 8px; max-width: 240px; font-family: sans-serif;">
              <h4 style="margin: 0 0 4px 0; color: #1e293b; font-size: 14px; font-weight: 700;">${tractor.name}</h4>
              ${tractor.vin ? `<p style="margin: 0 0 4px 0; color: #64748b; font-size: 11px;">VIN: ${tractor.vin}</p>` : ""}
              ${tractor.hours ? `<p style="margin: 0 0 4px 0; color: #64748b; font-size: 11px;">Engine Hours: ${tractor.hours}</p>` : ""}
              <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: 600; color: ${
                tractor.status === "Service Due" ? "#e11d48" : "#059669"
              };">
                Status: ${tractor.status} (${tractor.locationPing})
              </p>
            </div>
          `,
        });

        marker.addListener("click", () => {
          setSelectedTractor(tractor);
          infoWindow.open(mapInstanceRef.current, marker);
        });

        markersRef.current.push(marker);
      });

      if (tractors.length > 1) {
        mapInstanceRef.current.fitBounds(bounds);
      } else if (tractors.length === 1) {
        mapInstanceRef.current.setCenter({
          lat: Number(tractors[0].lat),
          lng: Number(tractors[0].lng),
        });
        mapInstanceRef.current.setZoom(14);
      }
    } catch (e) {
      console.error("Error initializing Google Maps:", e);
      setMapError(true);
    }
  }, [mapLoaded, tractors]);

  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      const zoom = mapInstanceRef.current.getZoom() || 12;
      mapInstanceRef.current.setZoom(zoom + 1);
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      const zoom = mapInstanceRef.current.getZoom() || 12;
      mapInstanceRef.current.setZoom(zoom - 1);
    }
  };

  const handleReset = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setCenter(centerCoordinates);
      mapInstanceRef.current.setZoom(13);
    }
  };

  // Dynamic query for embed fallback
  const fallbackQuery = encodeURIComponent(
    tractors[0]
      ? `${tractors[0].lat},${tractors[0].lng}`
      : customerCity || "Santa Cruz, Bolivia"
  );

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-slate-900 ${
        isFullscreen ? "fixed inset-0 z-[200] rounded-none h-screen" : "h-96"
      }`}
    >
      {/* Map Container */}
      <div ref={mapElementRef} className="w-full h-full" />

      {/* Fallback Google Map Iframe if JS API key is restricted or offline */}
      {(!mapLoaded || mapError) && (
        <div className="absolute inset-0 w-full h-full bg-slate-900 flex items-center justify-center">
          <iframe
            title="Google Fleet Map"
            width="100%"
            height="100%"
            style={{ border: 0, opacity: 0.9 }}
            loading="lazy"
            allowFullScreen
            src={`https://www.google.com/maps/embed/v1/place?key=${GOOGLE_MAPS_API_KEY}&q=${fallbackQuery}&zoom=13&maptype=satellite`}
          />
          <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl shadow-md border border-slate-200 flex items-center gap-2 text-xs font-bold text-slate-800">
            <Radio className="w-4 h-4 text-[#790000] animate-pulse" />
            <span>
              Live GPS Fleet Telemetry {customerCity ? `(${customerCity})` : ""}
            </span>
          </div>
        </div>
      )}

      {/* Top Map Overlay Controls */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <Button
          onClick={handleZoomIn}
          variant="outline"
          size="sm"
          className="bg-white/90 backdrop-blur-md hover:bg-white text-slate-700 h-9 w-9 p-0 rounded-xl shadow-md border-slate-200"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button
          onClick={handleZoomOut}
          variant="outline"
          size="sm"
          className="bg-white/90 backdrop-blur-md hover:bg-white text-slate-700 h-9 w-9 p-0 rounded-xl shadow-md border-slate-200"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </Button>
        <Button
          onClick={handleReset}
          variant="outline"
          size="sm"
          className="bg-white/90 backdrop-blur-md hover:bg-white text-slate-700 h-9 w-9 p-0 rounded-xl shadow-md border-slate-200"
          title="Reset Map View"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
        <Button
          onClick={() => setIsFullscreen(!isFullscreen)}
          variant="outline"
          size="sm"
          className="bg-white/90 backdrop-blur-md hover:bg-white text-slate-700 h-9 w-9 p-0 rounded-xl shadow-md border-slate-200"
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? (
            <Minimize2 className="w-4 h-4" />
          ) : (
            <Maximize2 className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Bottom Floating Tractor Pill Info */}
      {selectedTractor && (
        <div className="absolute bottom-4 left-4 right-4 sm:right-auto z-10 bg-white/95 backdrop-blur-md px-4 py-3 rounded-2xl shadow-xl border border-slate-200 flex items-center gap-3 max-w-md">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-[#790000] font-bold shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-900 truncate">
              {selectedTractor.name}
            </p>
            <p className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  selectedTractor.status === "Service Due"
                    ? "bg-rose-500"
                    : "bg-emerald-500"
                }`}
              />
              {selectedTractor.locationPing} • {selectedTractor.status}
              {selectedTractor.hours ? ` • ${selectedTractor.hours}` : ""}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
