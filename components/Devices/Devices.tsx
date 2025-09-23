"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import {
  Truck,
  Settings,
  Zap,
  Activity,
  Gauge,
  Fuel,
  Thermometer,
  Clock,
  MapPin,
  Maximize,
  Minimize,
} from "lucide-react";

// Import Leaflet dynamically (client-only)
const MapContainer = dynamic(
  async () => (await import("react-leaflet")).MapContainer,
  { ssr: false }
);
const TileLayer = dynamic(
  async () => (await import("react-leaflet")).TileLayer,
  { ssr: false }
);
const Marker = dynamic(async () => (await import("react-leaflet")).Marker, {
  ssr: false,
});
const Popup = dynamic(async () => (await import("react-leaflet")).Popup, {
  ssr: false,
});

import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icon issue
const tractorIcon = new L.DivIcon({
  html: `<div style="
    width: 50px;
    height: 50px;
    border-radius: 50%;
    border: 2px solid red;
    background: url('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRZSo_RjI-OzXbMKg4si2R_K7yfI2HPC4Jb0Q&s') 
                no-repeat center center;
    background-size: cover;
  "></div>`,
  className: "",
  iconSize: [50, 50],
  iconAnchor: [25, 50],
});

function DeviceSection() {
  const [selectedTractor, setSelectedTractor] = useState("JD-8420");
  const [isFullscreen, setIsFullscreen] = useState(false);

  const tractors = [
    {
      id: "JD-8420",
      name: "John Deere 8420",
      lat: 40.7128,
      lng: -74.006,
      field: "North Field",
      status: "Active",
    },
    {
      id: "NH-7630",
      name: "New Holland 7630",
      lat: 40.7228,
      lng: -74.01,
      field: "South Field",
      status: "Maintenance",
    },
    {
      id: "MF-7720",
      name: "Massey Ferguson 7720",
      lat: 40.7328,
      lng: -74.02,
      field: "East Field",
      status: "Active",
    },
  ];

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-950 via-red-900 to-black relative overflow-hidden">
      <div className="relative z-10 flex h-screen">
        {/* Left: Leaflet Map */}
        <div className={`${isFullscreen ? "w-full" : "flex-1"} relative`}>
          {/* Fullscreen Toggle Button */}
          <button
            onClick={toggleFullscreen}
            className="absolute top-4 right-4 z-[1000] bg-black/30 backdrop-blur-md border border-white/20 hover:bg-black/50 text-white p-3 rounded-lg transition-all duration-300 shadow-lg"
          >
            {isFullscreen ? (
              <Minimize className="w-6 h-6" />
            ) : (
              <Maximize className="w-6 h-6" />
            )}
          </button>

          <MapContainer
            center={[40.7128, -74.006]}
            zoom={13}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://osm.org">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {tractors.map((tractor) => (
              <Marker
                key={tractor.id}
                position={[tractor.lat, tractor.lng]}
                icon={tractorIcon}
                eventHandlers={{ click: () => setSelectedTractor(tractor.id) }}
              >
                <Popup>
                  <div className="text-sm">
                    <strong>{tractor.name}</strong>
                    <br /> {tractor.field} <br /> {tractor.status}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* Right: Control Panel - Hidden in fullscreen mode */}
        {!isFullscreen && (
          <div className="w-80 relative flex flex-col">
            {/* Glassmorphism background */}
            <div className="absolute inset-0 bg-white/10 backdrop-blur-2xl border-l border-white/20 shadow-[inset_0_0_30px_rgba(255,255,255,0.15)] rounded-none" />

            {/* Inner content */}
            <div className="relative z-10 flex flex-col h-full">
              {/* Header */}
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white drop-shadow-sm">
                    Tractor Control
                  </h2>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_6px_2px_rgba(34,197,94,0.8)]"></div>
                    <span className="text-green-400 text-sm font-medium">
                      LIVE
                    </span>
                  </div>
                </div>
              </div>

              {/* Tractor Selector */}
              <div className="p-6 border-b border-white/5 overflow-y-auto flex-1 custom-scrollbar">
                <h3 className="text-white font-semibold mb-4 flex items-center">
                  <Truck className="w-5 h-5 mr-2 text-red-400" />
                  Active Tractors
                </h3>
                <div className="space-y-2">
                  {tractors.map((tractor) => (
                    <div
                      key={tractor.id}
                      onClick={() => setSelectedTractor(tractor.id)}
                      className={`p-3 rounded-xl cursor-pointer transition-all duration-300 ${
                        selectedTractor === tractor.id
                          ? "bg-gradient-to-r from-red-500/30 to-red-400/10 border border-red-400/40 shadow-lg shadow-red-500/20 backdrop-blur-md"
                          : "bg-white/10 hover:bg-white/20 border border-white/10 hover:border-white/20 backdrop-blur-sm"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-white font-medium text-sm">
                            {tractor.id}
                          </p>
                          <p className="text-gray-300 text-xs">
                            {tractor.field}
                          </p>
                        </div>
                        <div
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            tractor.status === "Active"
                              ? "bg-green-400/20 text-green-300 border border-green-400/30"
                              : "bg-yellow-400/20 text-yellow-300 border border-yellow-400/30"
                          }`}
                        >
                          {tractor.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Status Cards */}
                <div className="mt-6 space-y-3">
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 shadow-inner shadow-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-300 text-sm">Fuel Level</span>
                      <Fuel className="w-4 h-4 text-blue-400" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-white/10 rounded-full h-2 overflow-hidden">
                        <div className="bg-blue-400 h-2 rounded-full w-3/4 shadow-[0_0_6px_2px_rgba(96,165,250,0.6)]"></div>
                      </div>
                      <span className="text-white text-sm font-medium">
                        75%
                      </span>
                    </div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 shadow-inner shadow-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-300 text-sm">Engine Temp</span>
                      <Thermometer className="w-4 h-4 text-orange-400" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-white text-lg font-bold">89°C</span>
                      <span className="text-green-400 text-sm">Normal</span>
                    </div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 shadow-inner shadow-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-300 text-sm">Speed</span>
                      <Gauge className="w-4 h-4 text-green-400" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-white text-lg font-bold">
                        12 km/h
                      </span>
                      <span className="text-green-400 text-sm">Active</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-6 border-t border-white/10 space-y-3">
                <button className="w-full bg-gradient-to-r from-red-500/80 to-red-600/70 hover:from-red-500 hover:to-red-500 text-white font-medium py-3 px-4 rounded-xl transition-all duration-300 shadow-lg shadow-red-500/30 border border-red-400/40 flex items-center justify-center">
                  <Zap className="w-5 h-5 mr-2" />
                  Send Command
                </button>
                <button className="w-full bg-white/10 hover:bg-white/20 text-white font-medium py-3 px-4 rounded-xl transition-all duration-300 border border-white/20 flex items-center justify-center backdrop-blur-md">
                  <Settings className="w-5 h-5 mr-2" />
                  Settings
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DeviceSection;
