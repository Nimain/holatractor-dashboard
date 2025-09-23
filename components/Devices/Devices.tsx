"use client"

import dynamic from "next/dynamic"
import { useState } from "react"
import { Truck, Settings, Zap, Activity, Gauge, Fuel, Thermometer, Clock, MapPin } from "lucide-react"

// Import Leaflet dynamically (client-only)
const MapContainer = dynamic(
  async () => (await import("react-leaflet")).MapContainer,
  { ssr: false }
)
const TileLayer = dynamic(
  async () => (await import("react-leaflet")).TileLayer,
  { ssr: false }
)
const Marker = dynamic(
  async () => (await import("react-leaflet")).Marker,
  { ssr: false }
)
const Popup = dynamic(
  async () => (await import("react-leaflet")).Popup,
  { ssr: false }
)

import L from "leaflet"
import "leaflet/dist/leaflet.css"

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
})


function DeviceSection() {
  const [selectedTractor, setSelectedTractor] = useState("JD-8420")

  const tractors = [
    { id: "JD-8420", name: "John Deere 8420", lat: 40.7128, lng: -74.006, field: "North Field", status: "Active" },
    { id: "NH-7630", name: "New Holland 7630", lat: 40.7228, lng: -74.01, field: "South Field", status: "Maintenance" },
    { id: "MF-7720", name: "Massey Ferguson 7720", lat: 40.7328, lng: -74.02, field: "East Field", status: "Active" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-950 via-red-900 to-black relative overflow-hidden">
      <div className="relative z-10 flex h-screen">
        {/* Left: Leaflet Map */}
        <div className="flex-1 relative">
          <MapContainer center={[40.7128, -74.006]} zoom={13} style={{ height: "100%", width: "100%" }}>
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

        {/* Right: Control Panel */}
        <div className="w-80 bg-black/20 backdrop-blur-xl border-l border-red-500/20 flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-red-500/20">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Tractor Control</h2>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-400 text-sm font-medium">LIVE</span>
              </div>
            </div>
          </div>

          {/* Tractor Selector */}
          <div className="p-6 border-b border-red-500/10 overflow-y-auto">
            <h3 className="text-white font-semibold mb-4 flex items-center">
              <Truck className="w-5 h-5 mr-2 text-red-400" />
              Active Tractors
            </h3>
            <div className="space-y-2">
              {tractors.map((tractor) => (
                <div
                  key={tractor.id}
                  onClick={() => setSelectedTractor(tractor.id)}
                  className={`p-3 rounded-lg cursor-pointer transition-all duration-300 ${
                    selectedTractor === tractor.id
                      ? "bg-red-500/20 border border-red-500/40 shadow-lg shadow-red-500/10"
                      : "bg-white/5 hover:bg-white/10 border border-white/10"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-white font-medium text-sm">{tractor.id}</p>
                      <p className="text-gray-400 text-xs">{tractor.field}</p>
                    </div>
                    <div
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        tractor.status === "Active"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-yellow-500/20 text-yellow-400"
                      }`}
                    >
                      {tractor.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-6 border-t border-red-500/10 space-y-3 mt-auto">
            <button className="w-full bg-red-600 hover:bg-red-500 text-white font-medium py-3 px-4 rounded-lg transition-all duration-300 shadow-lg shadow-red-500/25 flex items-center justify-center">
              <Zap className="w-5 h-5 mr-2" />
              Send Command
            </button>
            <button className="w-full bg-white/10 hover:bg-white/20 text-white font-medium py-3 px-4 rounded-lg transition-all duration-300 border border-white/20 flex items-center justify-center">
              <Settings className="w-5 h-5 mr-2" />
              Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DeviceSection