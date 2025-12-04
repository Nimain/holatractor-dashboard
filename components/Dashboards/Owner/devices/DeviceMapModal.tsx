"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  MapPin,
  Clock,
  Battery,
  Wifi,
  WifiOff,
  Truck,
  RefreshCw,
  Navigation,
  Zap,
  Radio,
  RadioIcon,
  Calendar,
  Filter,
  Globe,
} from "lucide-react"
import dynamic from "next/dynamic"
import DeviceLocationService, {
  type DeviceLocationData,
  type LocationHistoryParams,
} from "@/utils/Axios/DeviceLocationService"
import { io, type Socket } from "socket.io-client"
import React from "react"
import { useLoadScript } from "@react-google-maps/api"
import translations from "@/utils/Axios/translations"

const GoogleMap = dynamic(() => import("@react-google-maps/api").then((mod) => mod.GoogleMap), { ssr: false })
const Marker = dynamic(() => import("@react-google-maps/api").then((mod) => mod.Marker), { ssr: false })
const Polyline = dynamic(() => import("@react-google-maps/api").then((mod) => mod.Polyline), { ssr: false })
const InfoWindow = dynamic(() => import("@react-google-maps/api").then((mod) => mod.InfoWindow), { ssr: false })

interface Device {
  id: string
  device_imei: string
  device_region: "SW" | "NE" | string
  base: {
    status: number
  }
  tractorInStore: {
    baseTractor: {
      name: string
      model: string
      images?: string[]
    }
    hourly_price: number
  }
  updatedAt: string
}

interface DeviceMapModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  device: Device | null
  language?: "en" | "es"
}

interface UserLocation {
  latitude: number
  longitude: number
  accuracy?: number
}

interface LiveLocationData {
  _id: {
    $oid: string
  }
  imei: string
  lat: number
  lon: number
  speed: number
  course: number
  timestamp: string
  created_at: string
}

type DateFilter = "today" | "yesterday" | "week" | "month" | "custom"

export function DeviceMapModal({ open, onOpenChange, device, language = "en" }: DeviceMapModalProps) {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "AIzaSyDjMCI0xj2Q-WTc9J7yWX-Mvh0DBM7oHbg",
  })

  const [userLocation, setUserLocation] = useState<UserLocation | null>(null)
  const [deviceLocations, setDeviceLocations] = useState<DeviceLocationData[]>([])
  const [currentLocation, setCurrentLocation] = useState<DeviceLocationData | null>(null)
  const [locationLoading, setLocationLoading] = useState(false)
  const [deviceLoading, setDeviceLoading] = useState(false)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [showRoute, setShowRoute] = useState(true)
  const [isLiveTracking, setIsLiveTracking] = useState(false)
  const [socket, setSocket] = useState<Socket | null>(null)
  const [liveLocationCount, setLiveLocationCount] = useState(0)
  const mapRef = useRef<any>(null)
  const [mapKey, setMapKey] = useState(0)
  const [mapStyle, setMapStyle] = useState<"osm" | "carto" | "transport">("transport")
  const [selectedInfoWindow, setSelectedInfoWindow] = useState<string | null>(null)

  // Date filtering state
  const [selectedFilter, setSelectedFilter] = useState<DateFilter>("today")
  const [customStartDate, setCustomStartDate] = useState("")
  const [customEndDate, setCustomEndDate] = useState("")
  const [showDatePicker, setShowDatePicker] = useState(false)

  const t = translations[language]

  // Helper function to adjust live location coordinates based on device region
  const adjustLiveLocationCoordinates = (data: LiveLocationData, deviceRegion: string): LiveLocationData => {
    let adjustedLat = data.lat
    let adjustedLon = data.lon

    if (deviceRegion === "SW") {
      adjustedLat = Math.abs(data.lat) * -1
      adjustedLon = Math.abs(data.lon) * -1
    } else {
      adjustedLat = Math.abs(data.lat)
      adjustedLon = Math.abs(data.lon)
    }

    return {
      ...data,
      lat: adjustedLat,
      lon: adjustedLon,
    }
  }

  // Socket.IO connection for live tracking
  useEffect(() => {
    if (open && device && isLiveTracking) {
      // console.log(
      //   "[DeviceMapModal] Connecting to Socket.IO for live tracking, IMEI:",
      //   device.device_imei,
      //   "Region:",
      //   device.device_region,
      // )

      const socketInstance = io("https://device.holatractor.com", {
        transports: ["websocket", "polling"],
        autoConnect: true,
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 20000,
        withCredentials: false,
        extraHeaders: {
          "Access-Control-Allow-Origin": "*",
        },
        query: {
          imei: device.device_imei,
        },
      })

      socketInstance.on("connect", () => {
        // console.log("[DeviceMapModal] Socket.IO connected successfully")
        socketInstance.emit("join-device", device.device_imei)
      })

      socketInstance.on("connect_error", (error) => {
        console.error("[DeviceMapModal] Socket.IO connection error:", error)
      })

      socketInstance.on("disconnect", (reason) => {
        console.log("[DeviceMapModal] Socket.IO disconnected:", reason)
      })

      socketInstance.on("location-update", (data: LiveLocationData) => {
        console.log("[DeviceMapModal] Received live location update:", data, "Device region:", device.device_region)

        if (data.imei === device.device_imei) {
          // Adjust coordinates based on device region
          const adjustedData = adjustLiveLocationCoordinates(data, device.device_region)

          const newLocation: DeviceLocationData = {
            id: adjustedData._id.$oid,
            imei: adjustedData.imei,
            lat: adjustedData.lat,
            lon: adjustedData.lon,
            latitude: adjustedData.lat,
            longitude: adjustedData.lon,
            speed: adjustedData.speed,
            course: adjustedData.course,
            timestamp: adjustedData.timestamp,
            created_at: adjustedData.created_at,
          }

          console.log("[DeviceMapModal] Processed live location with region adjustment:", newLocation)

          setCurrentLocation(newLocation)
          setDeviceLocations((prev) => [newLocation, ...prev.slice(0, 99)])
          setLiveLocationCount((prev) => prev + 1)

          if (mapRef.current && adjustedData.lat && adjustedData.lon) {
            mapRef.current.panTo({ lat: adjustedData.lat, lng: adjustedData.lon })
          }
        }
      })

      setSocket(socketInstance)

      return () => {
        console.log("[DeviceMapModal] Cleaning up Socket.IO connection")
        socketInstance.disconnect()
        setSocket(null)
      }
    }
  }, [open, device, isLiveTracking])

  // Initialize map and load data when modal opens
  useEffect(() => {
    if (open && device) {
      console.log(
        "[DeviceMapModal] Modal opened with device IMEI:",
        device.device_imei,
        "Region:",
        device.device_region,
      )
      setMapLoaded(false) // Reset map loaded state
      setMapKey((prev) => prev + 1) // Force re-render of map

      // Load locations first, then set map as loaded
      const initializeModal = async () => {
        getCurrentLocation()
        await loadDeviceLocationWithFilter()
        // Small delay to ensure map container is ready
        setTimeout(() => {
          setMapLoaded(true)
        }, 100)
      }

      initializeModal()
    }

    if (!open) {
      setIsLiveTracking(false)
      setLiveLocationCount(0)
      if (socket) {
        socket.disconnect()
        setSocket(null)
      }
    }
  }, [open, device])

  // Auto-zoom to device location when available
  useEffect(() => {
    if (mapRef.current && currentLocation && currentLocation.lat && currentLocation.lon) {
      const lat = Number(currentLocation.lat)
      const lon = Number(currentLocation.lon)

      if (!isNaN(lat) && !isNaN(lon) && lat !== 0 && lon !== 0) {
        console.log("[DeviceMapModal] Auto-zooming to device location:", { lat, lon, region: device?.device_region })
        mapRef.current.panTo({ lat, lng: lon })
        mapRef.current.setZoom(16) // Zoom closer to the device
      }
    }
  }, [currentLocation, mapLoaded, device?.device_region])

  // Load device location when filter changes
  useEffect(() => {
    if (open && device) {
      loadDeviceLocationWithFilter()
    }
  }, [selectedFilter, customStartDate, customEndDate])

  const toggleLiveTracking = () => {
    if (isLiveTracking) {
      setIsLiveTracking(false)
      setLiveLocationCount(0)
      if (socket) {
        socket.disconnect()
        setSocket(null)
      }
    } else {
      setIsLiveTracking(true)
    }
  }

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      console.error("Geolocation is not supported")
      return
    }

    setLocationLoading(true)

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5000,
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords
        setUserLocation({ latitude, longitude, accuracy })
        setLocationLoading(false)
      },
      (error) => {
        console.error("Error getting location:", error)
        setLocationLoading(false)
      },
      options,
    )
  }

  const loadDeviceLocationWithFilter = async () => {
    if (!device || !device.device_imei) {
      console.error("[DeviceMapModal] No device or IMEI available")
      return
    }

    setDeviceLoading(true)
    try {
      console.log(
        "[DeviceMapModal] Loading device location with filter:",
        selectedFilter,
        "for IMEI:",
        device.device_imei,
        "Region:",
        device.device_region,
      )

      let params: LocationHistoryParams = {}

      switch (selectedFilter) {
        case "today":
          params = { filter: "today" }
          break
        case "yesterday":
          params = { filter: "yesterday" }
          break
        case "week":
          params = { filter: "week" }
          break
        case "month":
          params = { filter: "month" }
          break
        case "custom":
          if (customStartDate && customEndDate) {
            params = { start_date: customStartDate, end_date: customEndDate }
          } else {
            params = { filter: "today" } // fallback to today
          }
          break
        default:
          params = { filter: "today" }
      }

      // Pass device region to the API service
      const [current, history] = await Promise.all([
        DeviceLocationService.getCurrentDeviceLocation(device.device_imei, device.device_region),
        DeviceLocationService.getDeviceLocationHistory(device.device_imei, params, device.device_region),
      ])

      console.log("[DeviceMapModal] API Response - Current:", current)
      console.log("[DeviceMapModal] API Response - History:", history, "Count:", history?.length)
      console.log("[DeviceMapModal] Device region applied:", device.device_region)

      // Debug current location coordinates
      if (current) {
        console.log("[DeviceMapModal] Current location coordinates (region-adjusted):", {
          lat: current.lat,
          lon: current.lon,
          latitude: current.latitude,
          longitude: current.longitude,
          region: device.device_region,
          lat_type: typeof current.lat,
          lon_type: typeof current.lon,
          lat_valid: current.lat && current.lat !== 0 && !isNaN(current.lat),
          lon_valid: current.lon && current.lon !== 0 && !isNaN(current.lon),
        })
      }

      // Set current location with validation
      if (
        current &&
        current.lat &&
        current.lon &&
        current.lat !== 0 &&
        current.lon !== 0 &&
        !isNaN(current.lat) &&
        !isNaN(current.lon)
      ) {
        console.log("[DeviceMapModal] Setting valid current location with region adjustment:", current)
        setCurrentLocation(current)
      } else {
        console.warn("[DeviceMapModal] Invalid or missing current location:", current)
        setCurrentLocation(null)
      }

      // Process location history with detailed debugging
      if (Array.isArray(history) && history.length > 0) {
        console.log("[DeviceMapModal] Processing location history with region adjustment, count:", history.length)
        console.log("[DeviceMapModal] First location sample (region-adjusted):", history[0])

        const validLocations = history.filter((location, index) => {
          const isValid =
            location.lat &&
            location.lon &&
            location.lat !== 0 &&
            location.lon !== 0 &&
            !isNaN(location.lat) &&
            !isNaN(location.lon)

          if (!isValid) {
            console.warn(`[DeviceMapModal] Invalid location at index ${index}:`, {
              lat: location.lat,
              lon: location.lon,
              region: device.device_region,
              lat_type: typeof location.lat,
              lon_type: typeof location.lon,
            })
          }

          return isValid
        })

        console.log("[DeviceMapModal] Valid locations after filtering and region adjustment:", validLocations.length)
        console.log("[DeviceMapModal] Sample valid locations:", validLocations.slice(0, 3))
        setDeviceLocations(validLocations)
      } else {
        console.log("[DeviceMapModal] No valid history data received")
        setDeviceLocations([])
      }
    } catch (error) {
      console.error("[DeviceMapModal] Error loading device location:", error)
      setDeviceLocations([])
      setCurrentLocation(null)
    } finally {
      setDeviceLoading(false)
    }
  }

  const handleFilterChange = (filter: DateFilter) => {
    setSelectedFilter(filter)
    if (filter !== "custom") {
      setShowDatePicker(false)
    } else {
      setShowDatePicker(true)
      // Set default dates for custom range
      if (!customStartDate) {
        setCustomStartDate(DeviceLocationService.getTodayDate())
      }
      if (!customEndDate) {
        setCustomEndDate(DeviceLocationService.getTodayDate())
      }
    }
  }

  const formatTime = (dateString: string) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return language === "es" ? "Ahora mismo" : "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  const getAccuracyText = (accuracy?: number) => {
    if (!accuracy) return ""
    if (accuracy < 10) return "Very High"
    if (accuracy < 50) return "High"
    if (accuracy < 100) return "Medium"
    return "Low"
  }

  const getAccuracyColor = (accuracy?: number) => {
    if (!accuracy) return "text-muted-foreground"
    if (accuracy < 10) return "text-green-600"
    if (accuracy < 50) return "text-yellow-600"
    if (accuracy < 100) return "text-orange-600"
    return "text-red-600"
  }

  const routePath = React.useMemo(() => {
    if (!Array.isArray(deviceLocations) || deviceLocations.length === 0) {
      return []
    }

    const validPoints = deviceLocations
      .filter((location) => location.lat && location.lon && location.lat !== 0 && location.lon !== 0)
      .map((location) => ({ lat: Number(location.lat), lng: Number(location.lon) }))

    console.log(
      "[DeviceMapModal] Route path points for filter:",
      selectedFilter,
      "Count:",
      validPoints.length,
      "Device region:",
      device?.device_region,
    )
    return validPoints
  }, [deviceLocations, selectedFilter, device?.device_region])

  const getMapStyleOptions = () => {
    switch (mapStyle) {
      case "carto":
        return { mapTypeId: "terrain" }
      case "osm":
        return { mapTypeId: "satellite" }
      case "transport":
      default:
        return { mapTypeId: "roadmap" }
    }
  }

  if (!device) {
    console.log("[DeviceMapModal] No device provided to modal")
    return null
  }

  if (!isLoaded) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-center h-96">
            <RefreshCw className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading Google Maps...</span>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const isOnline = device.base.status === 1
  let mapCenter: { lat: number; lng: number } = { lat: 21.9368, lng: 86.7441 } // Default center (India)
  let mapZoom = 15 // Default zoom

  // Determine map center with debugging and region awareness
  if (currentLocation && currentLocation.lat && currentLocation.lon) {
    const lat = Number(currentLocation.lat)
    const lon = Number(currentLocation.lon)

    console.log("[DeviceMapModal] Setting map center to current location (region-adjusted):", {
      lat,
      lon,
      region: device.device_region,
    })

    if (!isNaN(lat) && !isNaN(lon) && lat !== 0 && lon !== 0) {
      mapCenter = { lat, lng: lon }
      mapZoom = 16 // Zoom closer when device location is available
      console.log(
        "[DeviceMapModal] Map center set to:",
        mapCenter,
        "with zoom:",
        mapZoom,
        "for region:",
        device.device_region,
      )
    } else {
      console.warn("[DeviceMapModal] Invalid current location coordinates for map center:", { lat, lon })
    }
  } else if (userLocation) {
    mapCenter = { lat: userLocation.latitude, lng: userLocation.longitude }
    mapZoom = 16 // Zoom closer for user location too
    console.log("[DeviceMapModal] Map centered on user location:", mapCenter, "with zoom:", mapZoom)
  } else {
    // Adjust default center based on device region
    if (device.device_region === "SW") {
      mapCenter = { lat: -21.9368, lng: -86.7441 } // Southwest coordinates (negative)
    }
    console.log("[DeviceMapModal] Using default map center for region", device.device_region, ":", mapCenter)
  }

  console.log("[DeviceMapModal] Final render state:", {
    device_imei: device.device_imei,
    device_region: device.device_region,
    currentLocation: currentLocation
      ? {
          lat: currentLocation.lat,
          lon: currentLocation.lon,
          hasCoords: !!(currentLocation.lat && currentLocation.lon),
        }
      : null,
    deviceLocationsCount: deviceLocations.length,
    mapCenter: mapCenter,
    userLocation: userLocation
      ? {
          lat: userLocation.latitude,
          lon: userLocation.longitude,
        }
      : null,
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {t.title}
            {isLiveTracking && (
              <Badge variant="default" className="ml-2 animate-pulse">
                <Radio className="h-3 w-3 mr-1" />
                {t.liveTracking}
              </Badge>
            )}
            {/* Region indicator */}
            <Badge variant="outline" className="ml-2">
              <Globe className="h-3 w-3 mr-1" />
              {device.device_region}
            </Badge>
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {device.tractorInStore.baseTractor?.name} - {device.tractorInStore.baseTractor?.model}
            {device.device_imei && <span className="ml-2 font-mono text-xs">IMEI: {device.device_imei}</span>}
            {device.device_region && (
              <span className="ml-2 text-xs">
                {t.region} {device.device_region === "SW" ? t.southwest : t.northeast}
              </span>
            )}
            {isLiveTracking && liveLocationCount > 0 && (
              <span className="ml-2 text-green-600">
                • {t.liveUpdates} {liveLocationCount}
              </span>
            )}
          </p>
        </DialogHeader>

        {/* Date Filter Controls */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="space-y-4">
              {/* Filter Selection */}
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <label className="text-sm font-medium">{t.dateFilter}</label>
                  <select
                    value={selectedFilter}
                    onChange={(e) => handleFilterChange(e.target.value as DateFilter)}
                    className="px-3 py-1 text-sm bg-background border rounded-md shadow-sm"
                  >
                    <option value="today">{t.today}</option>
                    <option value="yesterday">{t.yesterday}</option>
                    <option value="week">{t.week}</option>
                    <option value="month">{t.month}</option>
                    <option value="custom">{t.custom}</option>
                  </select>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    <label className="text-sm font-medium">{t.region}</label>
                    <Badge variant={device.device_region === "SW" ? "destructive" : "default"}>
                      {device.device_region} {device.device_region === "SW" ? "(-)" : "(+)"}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">{t.mapStyle}</label>
                    <select
                      value={mapStyle}
                      onChange={(e) => setMapStyle(e.target.value as "osm" | "carto" | "transport")}
                      className="px-3 py-1 text-sm bg-background border rounded-md shadow-sm"
                    >
                      <option value="transport">{t.roads}</option>
                      <option value="carto">{t.streets}</option>
                      <option value="osm">{t.standard}</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Custom Date Range */}
              {showDatePicker && selectedFilter === "custom" && (
                <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <label className="text-sm font-medium">{t.startDate}:</label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="px-2 py-1 text-sm bg-background border rounded-md"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">{t.endDate}:</label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="px-2 py-1 text-sm bg-background border rounded-md"
                    />
                  </div>
                </div>
              )}

              {/* Control Buttons and Status */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {deviceLocations.length} {t.locationCount}
                  </Badge>
                  {selectedFilter && (
                    <Badge variant="secondary">
                      {selectedFilter === "custom" && customStartDate && customEndDate
                        ? `${customStartDate} to ${customEndDate}`
                        : t[selectedFilter as keyof typeof t] || selectedFilter}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Button size="sm" variant="outline" onClick={getCurrentLocation} disabled={locationLoading}>
                    <RefreshCw className={`h-4 w-4 mr-1 ${locationLoading ? "animate-spin" : ""}`} />
                    {t.refreshLocation}
                  </Button>
                  <Button size="sm" variant="outline" onClick={loadDeviceLocationWithFilter} disabled={deviceLoading}>
                    <MapPin className={`h-4 w-4 mr-1 ${deviceLoading ? "animate-spin" : ""}`} />
                    {t.loadDeviceLocation}
                  </Button>
                  <Button
                    size="sm"
                    variant={isLiveTracking ? "destructive" : "default"}
                    onClick={toggleLiveTracking}
                    className={isLiveTracking ? "animate-pulse" : ""}
                  >
                    <RadioIcon className="h-4 w-4 mr-1" />
                    {isLiveTracking ? t.stopLiveTracking : t.startLiveTracking}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Map Section */}
          <Card>
            <CardContent className="p-0">
              <div className="h-96 bg-muted rounded-lg relative overflow-hidden">
                {!mapLoaded ? (
                  <div className="flex items-center justify-center h-full">
                    <RefreshCw className="h-8 w-8 animate-spin" />
                    <span className="ml-2">Loading map...</span>
                  </div>
                ) : (
                  <GoogleMap
                    key={mapKey}
                    center={mapCenter}
                    zoom={mapZoom}
                    mapContainerStyle={{ height: "100%", width: "100%" }}
                    options={getMapStyleOptions()}
                    onLoad={(map) => {
                      mapRef.current = map
                    }}
                    onUnmount={() => {
                      mapRef.current = null
                    }}
                  >
                    {/* User location marker */}
                    {userLocation && (
                      <Marker
                        position={{ lat: userLocation.latitude, lng: userLocation.longitude }}
                        title={t.yourLocation}
                        onClick={() => setSelectedInfoWindow("userLocation")}
                      >
                        {selectedInfoWindow === "userLocation" && (
                          <InfoWindow onCloseClick={() => setSelectedInfoWindow(null)}>
                            <div className="text-center text-xs">
                              <strong>{t.yourLocation}</strong>
                              <br />
                              <div>
                                Lat: {userLocation.latitude.toFixed(6)}, Lon: {userLocation.longitude.toFixed(6)}
                              </div>
                              {userLocation.accuracy && (
                                <span className={getAccuracyColor(userLocation.accuracy)}>
                                  {t.accuracy} {getAccuracyText(userLocation.accuracy)}
                                </span>
                              )}
                            </div>
                          </InfoWindow>
                        )}
                      </Marker>
                    )}

                    {/* Device current location marker */}
                    {currentLocation && currentLocation.lat && currentLocation.lon && (
                      <Marker
                        position={{ lat: Number(currentLocation.lat), lng: Number(currentLocation.lon) }}
                        title={t.deviceLocation}
                        onClick={() => setSelectedInfoWindow("deviceCurrent")}
                      >
                        {selectedInfoWindow === "deviceCurrent" && (
                          <InfoWindow onCloseClick={() => setSelectedInfoWindow(null)}>
                            <div className="text-center text-xs">
                              <strong>{t.deviceLocation}</strong>
                              <br />
                              <div className="font-mono">
                                Lat: {Number(currentLocation.lat).toFixed(6)}, Lon:{" "}
                                {Number(currentLocation.lon).toFixed(6)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {t.region} {device.device_region}{" "}
                                {device.device_region === "SW" ? "(SW coords)" : "(NE coords)"}
                              </div>
                              {currentLocation.speed && (
                                <div>
                                  {t.speed} {Number(currentLocation.speed).toFixed(1)} km/h
                                </div>
                              )}
                              {currentLocation.course && (
                                <div>
                                  {t.course} {currentLocation.course}°
                                </div>
                              )}
                              <div className="text-xs text-muted-foreground">
                                {formatTime(currentLocation.timestamp || currentLocation.created_at)}
                              </div>
                            </div>
                          </InfoWindow>
                        )}
                      </Marker>
                    )}

                    {/* Route polyline */}
                    {showRoute && routePath.length > 1 && (
                      <Polyline
                        path={routePath}
                        options={{
                          strokeColor: "#0000FF",
                          strokeWeight: 3,
                          strokeOpacity: 0.7,
                        }}
                      />
                    )}

                    {/* Route history markers (showing first 10 points) */}
                    {showRoute &&
                      routePath.length > 0 &&
                      routePath.slice(0, 10).map((point, index) => (
                        <Marker
                          key={`route-point-${index}`}
                          position={point}
                          title={`Route Point ${index + 1}`}
                          onClick={() => setSelectedInfoWindow(`routePoint-${index}`)}
                        >
                          {selectedInfoWindow === `routePoint-${index}` && (
                            <InfoWindow onCloseClick={() => setSelectedInfoWindow(null)}>
                              <div className="text-xs">
                                <div>
                                  <strong>Route Point {index + 1}</strong>
                                </div>
                                <div className="font-mono">
                                  Lat: {point.lat.toFixed(6)}, Lon: {point.lng.toFixed(6)}
                                </div>
                                <div className="text-muted-foreground">
                                  {t.region} {device.device_region}
                                </div>
                                {deviceLocations[index] && (
                                  <>
                                    <div>
                                      {t.speed} {Number(deviceLocations[index].speed || 0).toFixed(1)} km/h
                                    </div>
                                    <div className="text-muted-foreground">
                                      {formatTime(
                                        deviceLocations[index].timestamp || deviceLocations[index].created_at,
                                      )}
                                    </div>
                                  </>
                                )}
                              </div>
                            </InfoWindow>
                          )}
                        </Marker>
                      ))}
                  </GoogleMap>
                )}

                {/* Live tracking status indicator */}
                {isLiveTracking && (
                  <div className="absolute bottom-2 left-2">
                    <Badge variant="default" className="bg-green-600 animate-pulse">
                      <div className="w-2 h-2 bg-white rounded-full mr-2 animate-ping"></div>
                      {socket?.connected ? t.connected : t.disconnected}
                    </Badge>
                  </div>
                )}

                {/* Loading indicator for device data */}
                {deviceLoading && (
                  <div className="absolute top-2 right-2">
                    <Badge variant="secondary">
                      <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                      Loading...
                    </Badge>
                  </div>
                )}

                {/* Region indicator on map */}
                <div className="absolute top-2 left-2">
                  <Badge variant={device.device_region === "SW" ? "destructive" : "default"} className="text-xs">
                    <Globe className="h-3 w-3 mr-1" />
                    {device.device_region} {device.device_region === "SW" ? "(-lat,-lon)" : "(+lat,+lon)"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Device Info */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4 mb-6">
                <Avatar className="h-16 w-16">
                  {device.tractorInStore.baseTractor?.images?.[0] ? (
                    <AvatarImage
                      src={device.tractorInStore.baseTractor.images[0] || "/placeholder.svg"}
                      alt={device.tractorInStore.baseTractor.name}
                    />
                  ) : (
                    <AvatarFallback>
                      <Truck className="h-8 w-8" />
                    </AvatarFallback>
                  )}
                </Avatar>

                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-1">{device.tractorInStore.baseTractor.name}</h3>
                  <p className="text-muted-foreground mb-2">
                    {t.model} {device.tractorInStore.baseTractor.model}
                  </p>
                  <p className="text-sm text-muted-foreground font-mono">
                    {t.imei} {device.device_imei}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t.coordinateSystem} {device.device_region === "SW" ? t.southwest : t.northeast}
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <Badge variant={isOnline ? "default" : "secondary"} className="flex items-center gap-1">
                    {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                    {isOnline ? t.online : t.offline}
                  </Badge>
                  <Badge variant={device.device_region === "SW" ? "destructive" : "default"}>
                    <Globe className="h-3 w-3 mr-1" />
                    {device.device_region}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">{t.lastSeen}</p>
                    <p className="text-sm font-medium">
                      {currentLocation
                        ? formatTime(currentLocation.timestamp || currentLocation.created_at)
                        : formatTime(device.updatedAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Battery className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">{t.battery}</p>
                    <p className="text-sm font-medium">
                      {currentLocation?.battery_level ? `${currentLocation.battery_level}%` : "85%"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">{t.speed}</p>
                    <p
                      className={`text-sm font-medium ${isLiveTracking && currentLocation?.speed && currentLocation.speed > 0 ? "text-green-600 animate-pulse" : ""}`}
                    >
                      {currentLocation?.speed ? `${currentLocation.speed.toFixed(1)} km/h` : "0 km/h"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-lg">💰</span>
                  <div>
                    <p className="text-xs text-muted-foreground">{t.hourlyRate}</p>
                    <p className="text-sm font-medium text-green-600">${device.tractorInStore.hourly_price}/hr</p>
                  </div>
                </div>
              </div>

              {/* Location History Summary */}
              {Array.isArray(deviceLocations) && deviceLocations.length > 0 && (
                <div className="mb-6 p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    {t.locationHistory}
                    {isLiveTracking && (
                      <Badge variant="outline" className="text-xs">
                        Live: {liveLocationCount} updates
                      </Badge>
                    )}
                    <Badge variant="secondary" className="text-xs">
                      {selectedFilter === "custom" && customStartDate && customEndDate
                        ? `${customStartDate} to ${customEndDate}`
                        : t[selectedFilter as keyof typeof t] || selectedFilter}
                    </Badge>
                    <Badge variant={device.device_region === "SW" ? "destructive" : "default"} className="text-xs">
                      {device.device_region} coords
                    </Badge>
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {deviceLocations.length} {t.locationCount}
                    {isLiveTracking && " (updating in real-time)"}
                    {device.device_region === "SW" && " with negative coordinates"}
                  </p>
                </div>
              )}

              {/* No data message */}
              {!deviceLoading && (!deviceLocations || deviceLocations.length === 0) && (
                <div className="mb-6 p-4 bg-muted rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">{t.noLocationData}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Try selecting a different date range or check if the device is active.
                    {device.device_region === "SW" &&
                      " Note: This device uses SW region coordinates (negative values)."}
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  className={`flex-1 ${isLiveTracking ? "bg-green-600 hover:bg-green-700" : ""}`}
                  onClick={toggleLiveTracking}
                >
                  <Navigation className="h-4 w-4 mr-2" />
                  {isLiveTracking ? t.stopLiveTracking : t.startLiveTracking}
                </Button>
                <Button variant="outline" className="flex-1 bg-transparent">
                  {t.viewDetails}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
