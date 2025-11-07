"use client"

import type React from "react"

import dynamic from "next/dynamic"
import { useState, useEffect, useMemo, memo } from "react"
import {
  Truck,
  Settings,
  Zap,
  Gauge,
  Fuel,
  Thermometer,
  Maximize,
  Minimize,
  AlertCircle,
  History,
  X,
} from "lucide-react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { renderInstance } from "@/utils/Axios/RenderInstance"
import { useCookie } from "next-cookie"
import axios from "axios"
import Image from "next/image"

// Dynamically import Leaflet components (client-only)
const MapContainer = dynamic(async () => (await import("react-leaflet")).MapContainer, { ssr: false })
const TileLayer = dynamic(async () => (await import("react-leaflet")).TileLayer, { ssr: false })
const Marker = dynamic(async () => (await import("react-leaflet")).Marker, {
  ssr: false,
})
const Popup = dynamic(async () => (await import("react-leaflet")).Popup, {
  ssr: false,
})
const Polyline = dynamic(async () => (await import("react-leaflet")).Polyline, {
  ssr: false,
})

// Custom tractor icon with image
const createTractorIcon = (imageUrl: string | null, isSelected: boolean = false) => {
  const borderColor = isSelected ? '#EF4444' : '#3B82F6'
  const borderWidth = isSelected ? '3px' : '2px'
  
  return new L.DivIcon({
    html: `<div style="
      width: 48px;
      height: 48px;
      border-radius: 50%;
      border: ${borderWidth} solid ${borderColor};
      background: ${imageUrl ? `url('${imageUrl}')` : '#1F2937'} no-repeat center center;
      background-size: cover;
      box-shadow: 0 4px 6px rgba(0,0,0,0.3);
    "></div>`,
    className: "",
    iconSize: [48, 48],
    iconAnchor: [24, 48],
  })
}

// Custom GPS history icon
const gpsHistoryIcon = L.icon({
  iconUrl: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20'%3E%3Ccircle cx='10' cy='10' r='8' fill='%233B82F6' stroke='%23FFF' stroke-width='2'/%3E%3C/svg%3E`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  popupAnchor: [0, -10],
})

// Device Base URL for GPS history
const DeviceBaseURL = "https://device.holatractor.com/"

const deviceInstance = axios.create({
  baseURL: DeviceBaseURL,
  headers: {
    "Content-Type": "application/json",
  },
})

interface Device {
  id: string
  name: string
  lat: number
  lng: number
  field: string
  status: string
  region: string
  model: string
  hourlyPrice: number
  storeImage: string | null
  tractorImage: string | null
  ownerName: string
}

interface GPSLocation {
  _id: { $oid: string }
  imei: string
  lat: number
  lon: number
  speed: number
  course: number
  timestamp: string
  created_at: string
}

interface ProcessedGPSLocation extends GPSLocation {
  fixedLat: number
  fixedLon: number
}

const fixCoordinates = (lat: number, lon: number, region: string): [number, number] => {
  let fixedLat = lat
  let fixedLon = lon

  // NE region should have positive coordinates
  if (region === "NE") {
    fixedLat = Math.abs(lat)
    fixedLon = Math.abs(lon)
  }
  // SW region should have negative coordinates
  else if (region === "SW") {
    fixedLat = -Math.abs(lat)
    fixedLon = -Math.abs(lon)
  }

  return [fixedLat, fixedLon]
}

const filterGPSByTimeRange = (history: GPSLocation[], filterType: string): GPSLocation[] => {
  const now = new Date()
  let startDate: Date

  switch (filterType) {
    case "today":
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      break
    case "yesterday":
      const yesterday = new Date(now)
      yesterday.setDate(yesterday.getDate() - 1)
      startDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate())
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      return history.filter((h) => {
        const hDate = new Date(h.timestamp)
        return hDate >= startDate && hDate < todayStart
      })
    case "week":
      startDate = new Date(now)
      startDate.setDate(startDate.getDate() - 7)
      break
    case "month":
      startDate = new Date(now)
      startDate.setDate(startDate.getDate() - 30)
      break
    default:
      return history
  }

  return history.filter((h) => new Date(h.timestamp) >= startDate)
}

const HistoryModalContent: React.FC<{
  gpsHistory: GPSLocation[]
  selectedDevice: Device | undefined
  mapCenter: [number, number]
  selectedFilter: string
}> = memo(({ gpsHistory, selectedDevice, mapCenter, selectedFilter }) => {
  const filteredHistory = useMemo(() => {
    return filterGPSByTimeRange(gpsHistory, selectedFilter)
  }, [gpsHistory, selectedFilter])

  const processedLocations = useMemo(() => {
    if (!selectedDevice || filteredHistory.length === 0) {
      return []
    }

    return filteredHistory.map((location) => {
      const [fixedLat, fixedLon] = fixCoordinates(location.lat, location.lon, selectedDevice.region)
      return {
        ...location,
        fixedLat,
        fixedLon,
      }
    })
  }, [filteredHistory, selectedDevice])

  const historyPath = useMemo(() => {
    return processedLocations.map((loc) => [loc.fixedLat, loc.fixedLon] as [number, number])
  }, [processedLocations])

  return (
    <div className="space-y-4">
      {/* Map with History Path */}
      <div className="h-96 rounded-lg overflow-hidden border border-white/20">
        <MapContainer
          center={historyPath.length > 0 ? historyPath[0] : mapCenter}
          zoom={15}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://osm.org">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {historyPath.length > 0 && <Polyline positions={historyPath} color="#3B82F6" weight={4} opacity={0.8} />}
          
          {/* Show markers for start and end points */}
          {processedLocations.length > 0 && (
            <>
              <Marker
                position={[processedLocations[processedLocations.length - 1].fixedLat, processedLocations[processedLocations.length - 1].fixedLon]}
                icon={gpsHistoryIcon}
              >
                <Popup>
                  <div className="text-xs">
                    <strong className="text-green-600">Start Point</strong>
                    <br />Time: {new Date(processedLocations[processedLocations.length - 1].timestamp).toLocaleString()}
                    <br />Speed: {processedLocations[processedLocations.length - 1].speed} km/h
                  </div>
                </Popup>
              </Marker>
              <Marker
                position={[processedLocations[0].fixedLat, processedLocations[0].fixedLon]}
                icon={gpsHistoryIcon}
              >
                <Popup>
                  <div className="text-xs">
                    <strong className="text-red-600">End Point</strong>
                    <br />Time: {new Date(processedLocations[0].timestamp).toLocaleString()}
                    <br />Speed: {processedLocations[0].speed} km/h
                  </div>
                </Popup>
              </Marker>
            </>
          )}
        </MapContainer>
      </div>

      {/* Coordinate Analysis Warning */}
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-yellow-500 font-semibold text-sm">Coordinate Information</h4>
            <p className="text-yellow-200 text-xs mt-1">
              Region: <strong>{selectedDevice?.region}</strong> | 
              Raw coordinates are being converted: NE → Positive (+), SW → Negative (-)
            </p>
            <p className="text-yellow-200 text-xs mt-1">
              If markers appear off-road, the raw GPS data from the device may need calibration.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white/5 rounded-lg p-4 border border-white/10">
        <div className="flex justify-between items-center">
          <div>
            <h4 className="text-white font-semibold">Route Summary</h4>
            <p className="text-gray-400 text-sm mt-1">{filteredHistory.length} GPS points recorded</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-blue-400">{filteredHistory.length}</p>
            <p className="text-gray-400 text-sm">locations visited</p>
          </div>
        </div>
      </div>

      {/* Time Range */}
      {filteredHistory.length > 0 && (
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <h4 className="text-white font-semibold mb-2">Time Range</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-400 text-xs">Start Time</p>
              <p className="text-white text-sm">
                {new Date(filteredHistory[filteredHistory.length - 1].timestamp).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-xs">End Time</p>
              <p className="text-white text-sm">{new Date(filteredHistory[0].timestamp).toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      {/* Sample Coordinates for Debugging */}
      <div className="bg-white/5 rounded-lg p-4 border border-white/10">
        <h4 className="text-white font-semibold mb-3">Sample GPS Coordinates (First 3)</h4>
        <div className="space-y-2 text-xs">
          {processedLocations.slice(0, 3).map((location, index) => (
            <div key={location._id.$oid} className="bg-white/5 p-2 rounded border border-white/10">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-gray-400">Raw:</span>
                  <span className="text-white ml-2">{location.lat.toFixed(6)}, {location.lon.toFixed(6)}</span>
                </div>
                <div>
                  <span className="text-gray-400">Fixed:</span>
                  <span className="text-blue-400 ml-2">{location.fixedLat.toFixed(6)}, {location.fixedLon.toFixed(6)}</span>
                </div>
              </div>
              <span className="text-gray-500 text-xs block mt-1">
                {new Date(location.timestamp).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
})
HistoryModalContent.displayName = "HistoryModalContent"

export default function DeviceSection() {
  const [selectedTractor, setSelectedTractor] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false)
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [mapCenter, setMapCenter] = useState<[number, number]>([40.7128, -74.006])

  // History modal states
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false)
  const [historyLoading, setHistoryLoading] = useState<boolean>(false)
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [gpsHistory, setGpsHistory] = useState<GPSLocation[]>([])
  const [selectedFilter, setSelectedFilter] = useState<string>("today")

  const { cookie } = useCookie()
  const access_token = cookie.get("access_token")

  // Fetch devices from API
  useEffect(() => {
    fetchDevices()
  }, [])

  const fetchDevices = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await renderInstance.get("/store/getalluniversaldevices", {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      })

      if (response.data.success && response.data.data) {
        const transformedDevices: Device[] = response.data.data.map((device: any) => {
          const rawLat = Number.parseFloat(device.tractorInStore?.store?.location?.lat || "0")
          const rawLon = Number.parseFloat(device.tractorInStore?.store?.location?.lan || "0")
          const region = device.device_region || "NE"

          return {
            id: device.device_imei,
            name: device.tractorInStore?.baseTractor?.name || "Unknown Tractor",
            lat: rawLat,
            lng: rawLon,
            field: device.tractorInStore?.store?.name || "Unknown Store",
            status: device.base?.status === 1 ? "Active" : "Maintenance",
            region: region,
            model: device.tractorInStore?.baseTractor?.model || "N/A",
            hourlyPrice: device.tractorInStore?.hourly_price || 0,
            storeImage: device.tractorInStore?.store?.image || null,
            tractorImage: device.tractorInStore?.baseTractor?.images?.[0] || null,
            ownerName:
              `${device.tractorInStore?.store?.owner?.user?.first_name || ""} ${device.tractorInStore?.store?.owner?.user?.last_name || ""}`.trim() ||
              "Unknown",
          }
        })

        setDevices(transformedDevices)
        if (transformedDevices.length > 0) {
          setSelectedTractor(transformedDevices[0].id)
          setMapCenter([transformedDevices[0].lat, transformedDevices[0].lng])
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch devices")
    } finally {
      setLoading(false)
    }
  }

  const fetchGPSHistory = async (deviceImei: string) => {
    try {
      setHistoryLoading(true)
      setHistoryError(null)

      const response = await deviceInstance.get(`/api/device/${deviceImei}/locations`)

      if (response.data && Array.isArray(response.data)) {
        setGpsHistory(response.data)
      } else {
        setGpsHistory([])
      }
    } catch (err: any) {
      setHistoryError(err.message || "Failed to fetch GPS history")
    } finally {
      setHistoryLoading(false)
    }
  }

  const handleShowHistory = () => {
    if (selectedTractor) {
      setShowHistoryModal(true)
      setSelectedFilter("today")
      fetchGPSHistory(selectedTractor)
    }
  }

  const toggleFullscreen = () => setIsFullscreen(!isFullscreen)

  const getSelectedDevice = (): Device | undefined => {
    return devices.find((d) => d.id === selectedTractor)
  }

  const handleMarkerClick = (deviceId: string) => {
    setSelectedTractor(deviceId)
    const device = devices.find((d) => d.id === deviceId)
    if (device) {
      setMapCenter([device.lat, device.lng])
    }
  }

  const selectedDevice = getSelectedDevice()

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-950 via-red-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading devices...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-950 via-red-900 to-black flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 max-w-md w-full">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-white text-xl font-bold text-center mb-2">Error Loading Devices</h2>
          <p className="text-gray-300 text-center mb-4">{error}</p>
          <button
            onClick={fetchDevices}
            className="w-full bg-gradient-to-r from-red-500/80 to-red-600/70 hover:from-red-500 hover:to-red-500 text-white font-medium py-3 px-4 rounded-xl"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // No devices state
  if (devices.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-950 via-red-900 to-black flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 max-w-md w-full text-center">
          <Truck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-white text-xl font-bold mb-2">No Devices Found</h2>
          <p className="text-gray-300 mb-4">There are no devices available at the moment.</p>
          <button
            onClick={fetchDevices}
            className="w-full bg-gradient-to-r from-red-500/80 to-red-600/70 hover:from-red-500 hover:to-red-500 text-white font-medium py-3 px-4 rounded-xl"
          >
            Refresh
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-red-950 via-red-900 to-black flex flex-col md:flex-row relative overflow-hidden">
        {/* MAP SECTION */}
        <div
          className={`relative transition-all duration-500 ${
            isFullscreen ? "w-full h-screen" : "w-full md:flex-1 h-[60vh] md:h-screen"
          }`}
        >
          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="absolute top-3 right-3 z-[1000] bg-black/30 backdrop-blur-md border border-white/20 hover:bg-black/50 text-white p-2 rounded-lg transition-all duration-300 shadow-lg"
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>

          {/* Map Container */}
          <MapContainer
            center={mapCenter}
            zoom={13}
            style={{ height: "100%", width: "100%" }}
            key={mapCenter.join(",")}
          >
            <TileLayer
              attribution='&copy; <a href="https://osm.org">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {devices.map((device) => (
              <Marker
                key={device.id}
                position={[device.lat, device.lng]}
                icon={createTractorIcon(device.tractorImage, selectedTractor === device.id)}
                eventHandlers={{ click: () => handleMarkerClick(device.id) }}
              >
                <Popup>
                  <div className="text-sm">
                    {device.tractorImage && (
                      <Image 
                        src={device.tractorImage} 
                        alt={device.name}
                        width={150}
                        height={100}
                        className="rounded mb-2 object-cover"
                      />
                    )}
                    <strong>{device.name}</strong>
                    <br /> {device.field}
                    <br /> Status: {device.status}
                    <br /> Model: {device.model}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* CONTROL PANEL */}
        {!isFullscreen && (
          <div className="w-full md:w-80 flex-shrink-0 bg-white/5 md:bg-transparent backdrop-blur-xl border-t md:border-t-0 md:border-l border-white/10 relative z-10">
            <div className="flex flex-col h-full max-h-[80vh] md:max-h-screen overflow-y-auto p-4 sm:p-6 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-xl sm:text-2xl font-bold text-white">Tractor Control</h2>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-400 text-sm">LIVE</span>
                </div>
              </div>

              {/* Active Tractors */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-semibold flex items-center">
                    <Truck className="w-5 h-5 mr-2 text-red-400" /> Active Devices ({devices.length})
                  </h3>
                  <button onClick={fetchDevices} className="text-xs text-gray-400 hover:text-white transition-colors">
                    Refresh
                  </button>
                </div>
                <div className="space-y-2">
                  {devices.map((device) => (
                    <div
                      key={device.id}
                      onClick={() => handleMarkerClick(device.id)}
                      className={`p-3 rounded-xl cursor-pointer transition-all duration-300 ${
                        selectedTractor === device.id
                          ? "bg-gradient-to-r from-red-500/30 to-red-400/10 border-2 border-red-400/60"
                          : "bg-white/10 hover:bg-white/20 border border-white/10"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        {device.tractorImage && (
                          <Image
                            src={device.tractorImage}
                            alt={device.name}
                            width={48}
                            height={48}
                            className="rounded-full object-cover border-2 border-white/20"
                          />
                        )}
                        <div className="flex-1">
                          <p className="text-white text-sm font-medium">{device.name}</p>
                          <p className="text-gray-300 text-xs">{device.field}</p>
                          <p className="text-gray-400 text-xs mt-1">IMEI: {device.id}</p>
                        </div>
                        <div className="text-right">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium block mb-1 ${
                              device.status === "Active"
                                ? "bg-green-400/20 text-green-300"
                                : "bg-yellow-400/20 text-yellow-300"
                            }`}
                          >
                            {device.status}
                          </span>
                          <span className="text-xs text-gray-400">{device.region}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Selected Device Details */}
              {selectedDevice && (
                <>
                  <div className="bg-white/10 p-4 rounded-xl border border-white/20">
                    {selectedDevice.tractorImage && (
                      <Image
                        src={selectedDevice.tractorImage}
                        alt={selectedDevice.name}
                        width={300}
                        height={200}
                        className="rounded-lg mb-3 w-full object-cover"
                      />
                    )}
                    <h4 className="text-white font-semibold mb-2">Device Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-300">Model:</span>
                        <span className="text-white">{selectedDevice.model}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Hourly Price:</span>
                        <span className="text-white">${selectedDevice.hourlyPrice}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Region:</span>
                        <span className="text-white">{selectedDevice.region}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Owner:</span>
                        <span className="text-white">{selectedDevice.ownerName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Location:</span>
                        <span className="text-white text-xs">
                          {selectedDevice.lat.toFixed(4)}, {selectedDevice.lng.toFixed(4)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* STATUS CARDS */}
                  <div className="space-y-3">
                    <div className="bg-white/10 p-4 rounded-xl border border-white/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-300 text-sm">Fuel Level</span>
                        <Fuel className="w-4 h-4 text-blue-400" />
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-white/10 rounded-full h-2">
                          <div className="bg-blue-400 h-2 rounded-full w-3/4"></div>
                        </div>
                        <span className="text-white text-sm font-medium">75%</span>
                      </div>
                    </div>

                    <div className="bg-white/10 p-4 rounded-xl border border-white/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-300 text-sm">Engine Temp</span>
                        <Thermometer className="w-4 h-4 text-orange-400" />
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-white text-lg font-bold">89°C</span>
                        <span className="text-green-400 text-sm">Normal</span>
                      </div>
                    </div>

                    <div className="bg-white/10 p-4 rounded-xl border border-white/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-300 text-sm">Speed</span>
                        <Gauge className="w-4 h-4 text-green-400" />
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-white text-lg font-bold">12 km/h</span>
                        <span className="text-green-400 text-sm">Active</span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* ACTION BUTTONS */}
              <div className="space-y-3">
                <button
                  onClick={handleShowHistory}
                  className="w-full bg-gradient-to-r from-blue-500/80 to-blue-600/70 hover:from-blue-500 hover:to-blue-500 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center"
                >
                  <History className="w-5 h-5 mr-2" /> View GPS History
                </button>
                <button className="w-full bg-gradient-to-r from-red-500/80 to-red-600/70 hover:from-red-500 hover:to-red-500 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center">
                  <Zap className="w-5 h-5 mr-2" /> Send Command
                </button>
                <button className="w-full bg-white/10 hover:bg-white/20 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center">
                  <Settings className="w-5 h-5 mr-2" /> Settings
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* GPS HISTORY MODAL */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-white/20">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center space-x-3">
                <History className="w-6 h-6 text-blue-400" />
                <div>
                  <h3 className="text-xl font-bold text-white">GPS History</h3>
                  <p className="text-sm text-gray-400">{selectedDevice?.name}</p>
                </div>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-auto p-6">
              {historyLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                    <p className="text-white">Loading GPS history...</p>
                  </div>
                </div>
              ) : historyError ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <p className="text-white mb-4">{historyError}</p>
                    <button
                      onClick={() => selectedTractor && fetchGPSHistory(selectedTractor)}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              ) : gpsHistory.length === 0 ? (
                <div className="flex items-center justify-center h-64">
                  <p className="text-gray-400">No GPS history available</p>
                </div>
              ) : (
                <>
                  <div className="mb-6 pb-6 border-b border-white/10">
                    <h4 className="text-white font-semibold mb-3">Filter History</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: "Today", value: "today" },
                        { label: "Yesterday", value: "yesterday" },
                        { label: "Last 7 Days", value: "week" },
                        { label: "Last 30 Days", value: "month" },
                      ].map((filter) => (
                        <button
                          key={filter.value}
                          onClick={() => setSelectedFilter(filter.value)}
                          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                            selectedFilter === filter.value
                              ? "bg-blue-500/80 text-white border border-blue-400"
                              : "bg-white/10 text-gray-300 border border-white/20 hover:bg-white/20"
                          }`}
                        >
                          {filter.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <HistoryModalContent
                    gpsHistory={gpsHistory}
                    selectedDevice={selectedDevice}
                    mapCenter={mapCenter}
                    selectedFilter={selectedFilter}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}