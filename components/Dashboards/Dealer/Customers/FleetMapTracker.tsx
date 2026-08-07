"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Maximize2, Minimize2, ZoomIn, ZoomOut, RotateCcw, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";

const GOOGLE_MAPS_API_KEY = "AIzaSyDjMCI0xj2Q-WTc9J7yWX-Mvh0DBM7oHbg";

interface TractorMarker {
  id: string;
  name: string;
  type: string;
  lat: number;
  lng: number;
  status: "Optimal" | "Service Due";
  locationPing: string;
  image: string;
  vin: string;
}

interface FleetMapTrackerProps {
  activeView: "live" | "history";
  tractors?: TractorMarker[];
}

const defaultTractors: TractorMarker[] = [
  {
    id: "jd-8r410",
    name: "John Deere 8R 410",
    type: "Row-Crop Tractor",
    lat: 41.2565,
    lng: -95.9345,
    status: "Service Due",
    locationPing: "Field A-12",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAqUWSzaRpPfaxoY0zy1eK7tLm4ijklEi9QPEkhQ4zLrebB6vzw-fKyeb7iQdfE-6QeGPP1Xk-Dp8SNF1ILktPw_2ziWWvcf73iHKX80E0KMttrG_vu10rdHaL8or8FtdGrC_jXoWZUIgaF7EQ1GddMKaaAqKMilbuZfZ0TMlHc_JikVRU6sIoYoe0c3WSVN1miSD4bhaxZUgS3d7HCscOK7bL6OhqaGXng1yXW1ufUPdvoaF0cfCQ",
    vin: "1RW8R410PCX910234",
  },
  {
    id: "case-340",
    name: "Case IH Magnum 340",
    type: "Row-Crop Tractor",
    lat: 41.2524,
    lng: -95.9978,
    status: "Optimal",
    locationPing: "Barn Storage",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD3d8WbqM97GS2yzatUz4ssSeBFQZhhcRqvdng5WxzDziIPDq7u7aBvo6riGeylb_4B_6cWEVfequmQATfBxGdVYTpqJR86rZOw7-a-b1zNhZdHE8vWL498d_mfAZm2VQ1sFZYtdcgm7vD_b03v__PJ7Y3LcYQpL01xckvwazZ_j-wkivT_MiWB2XreHBuFPyFUrLrr24szTZglu_C4j47HsvXn_Iqhle0F8_Cswp_-ZxhYyf_iV84",
    vin: "ZBRM340VLC901122",
  },
];

export default function FleetMapTracker({
  activeView,
  tractors = defaultTractors,
}: FleetMapTrackerProps) {
  const mapElementRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedTractor, setSelectedTractor] = useState<TractorMarker | null>(
    tractors[0] || null
  );

  const centerCoordinates = { lat: 41.2545, lng: -95.966 };

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
          zoom: 12,
          mapTypeId: window.google.maps.MapTypeId.HYBRID,
          disableDefaultUI: false,
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: true,
        });
      }

      // Clear existing markers
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];

      const bounds = new window.google.maps.LatLngBounds();

      tractors.forEach((tractor) => {
        const pos = { lat: tractor.lat, lng: tractor.lng };
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
            <div style="padding: 6px; max-width: 220px; font-family: sans-serif;">
              <h4 style="margin: 0 0 4px 0; color: #1e293b; font-size: 14px; font-weight: 700;">${tractor.name}</h4>
              <p style="margin: 0 0 4px 0; color: #64748b; font-size: 11px;">VIN: ${tractor.vin}</p>
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

      if (tractors.length > 0) {
        mapInstanceRef.current.fitBounds(bounds);
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
      mapInstanceRef.current.setZoom(12);
    }
  };

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
            src={`https://www.google.com/maps/embed/v1/place?key=${GOOGLE_MAPS_API_KEY}&q=Omaha,NE+Agricultural+Fields&zoom=12&maptype=satellite`}
          />
          <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl shadow-md border border-slate-200 flex items-center gap-2 text-xs font-bold text-slate-800">
            <Radio className="w-4 h-4 text-[#790000] animate-pulse" />
            <span>Interactive Google Map (Live GPS Fleet View)</span>
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
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
