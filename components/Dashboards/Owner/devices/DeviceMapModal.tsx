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
  Route,
  Zap,
  Radio,
  RadioIcon,
} from "lucide-react"
import dynamic from "next/dynamic"
import DeviceApiService, { type Device, type DeviceLocationData } from "./Device"
import { io, type Socket } from "socket.io-client"
import {
  isValidLocation,
  assessLocationQuality,
  validateAndTransformCoordinates,
  type Region,
} from "@/utils/coordinate-transform"
import React from "react"

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false })
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), { ssr: false })
const Polyline = dynamic(() => import("react-leaflet").then((mod) => mod.Polyline), { ssr: false })

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

export function DeviceMapModal({ open, onOpenChange, device, language = "en" }: DeviceMapModalProps) {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null)
  const [deviceLocations, setDeviceLocations] = useState<DeviceLocationData[]>([])
  const [currentLocation, setCurrentLocation] = useState<DeviceLocationData | null>(null)
  const [locationLoading, setLocationLoading] = useState(false)
  const [deviceLoading, setDeviceLoading] = useState(false)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [showRoute, setShowRoute] = useState(false)
  const [isLiveTracking, setIsLiveTracking] = useState(false)
  const [socket, setSocket] = useState<Socket | null>(null)
  const [liveLocationCount, setLiveLocationCount] = useState(0)
  const mapRef = useRef<any>(null)
  const [deviceRegion, setDeviceRegion] = useState<Region>("SW") // Default to SW, can be configured
  const [mapKey, setMapKey] = useState(0)
  const [mapStyle, setMapStyle] = useState<"osm" | "carto" | "transport">("transport")

  const translations = {
    en: {
      title: "Device Location Tracking",
      gettingLocation: "Getting Your Location...",
      loadingDeviceLocation: "Loading Device Location...",
      locationError: "Unable to get location",
      tryAgain: "Try Again",
      yourLocation: "Your Current Location",
      deviceLocation: "Device Location",
      accuracy: "Accuracy:",
      refreshLocation: "Refresh Location",
      loadDeviceLocation: "Load Device Location",
      showRoute: "Show Route",
      hideRoute: "Hide Route",
      online: "Online",
      offline: "Offline",
      lastSeen: "Last seen:",
      battery: "Battery",
      speed: "Speed:",
      course: "Course:",
      altitude: "Altitude:",
      satellites: "Satellites:",
      hourlyRate: "Hourly Rate:",
      startTracking: "Start Tracking",
      viewDetails: "View Details",
      model: "Model:",
      imei: "IMEI:",
      noLocationData: "No location data available",
      locationHistory: "Location History",
      startLiveTracking: "Start Live Tracking",
      stopLiveTracking: "Stop Live Tracking",
      liveTracking: "Live Tracking",
      connected: "Connected",
      disconnected: "Disconnected",
      liveUpdates: "Live Updates:",
    },
    es: {
      title: "Seguimiento de Ubicación del Dispositivo",
      gettingLocation: "Obteniendo Tu Ubicación...",
      loadingDeviceLocation: "Cargando Ubicación del Dispositivo...",
      locationError: "No se pudo obtener la ubicación",
      tryAgain: "Intentar de Nuevo",
      yourLocation: "Tu Ubicación Actual",
      deviceLocation: "Ubicación del Dispositivo",
      accuracy: "Precisión:",
      refreshLocation: "Actualizar Ubicación",
      loadDeviceLocation: "Cargar Ubicación del Dispositivo",
      showRoute: "Mostrar Ruta",
      hideRoute: "Ocultar Ruta",
      online: "En línea",
      offline: "Desconectado",
      lastSeen: "Visto por última vez:",
      battery: "Batería",
      speed: "Velocidad:",
      course: "Rumbo:",
      altitude: "Altitud:",
      satellites: "Satélites:",
      hourlyRate: "Tarifa por Hora:",
      startTracking: "Iniciar Seguimiento",
      viewDetails: "Ver Detalles",
      model: "Modelo:",
      imei: "IMEI:",
      noLocationData: "No hay datos de ubicación disponibles",
      locationHistory: "Historial de Ubicación",
      startLiveTracking: "Iniciar Seguimiento en Vivo",
      stopLiveTracking: "Detener Seguimiento en Vivo",
      liveTracking: "Seguimiento en Vivo",
      connected: "Conectado",
      disconnected: "Desconectado",
      liveUpdates: "Actualizaciones en Vivo:",
    },
  }

  const t = translations[language]

  useEffect(() => {
    if (open && device && isLiveTracking) {
      console.log("[v0] Connecting to Socket.IO for live tracking")

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
        console.log("[v0] Socket.IO connected successfully")
        // Join room for specific device IMEI
        socketInstance.emit("join-device", device.device_imei)
      })

      socketInstance.on("connect_error", (error) => {
        console.error("[v0] Socket.IO connection error:", error)
        if (error.message.includes("CORS") || error.message.includes("blocked")) {
          console.log("[v0] CORS error detected, trying polling transport only")
          socketInstance.io.opts.transports = ["polling"]
          socketInstance.connect()
        }
      })

      socketInstance.on("disconnect", (reason) => {
        console.log("[v0] Socket.IO disconnected:", reason)
      })

      socketInstance.on("reconnect", (attemptNumber) => {
        console.log("[v0] Socket.IO reconnected after", attemptNumber, "attempts")
      })

      socketInstance.on("reconnect_error", (error) => {
        console.error("[v0] Socket.IO reconnection error:", error)
      })

      // Listen for live location updates
      socketInstance.on("location-update", (data: LiveLocationData) => {
        console.log("[v0] Received live location update:", data)

        if (data.imei === device.device_imei) {
          // Validate and transform coordinates using the new validation function
          const validatedCoords = validateAndTransformCoordinates(data.lat, data.lon, deviceRegion)

          if (!validatedCoords) {
            console.warn("[v0] Received invalid live location coordinates:", { lat: data.lat, lon: data.lon })
            return
          }

          // Convert MongoDB format to our format with validated coordinates
          const rawLocation = {
            id: data._id.$oid,
            imei: data.imei,
            lat: validatedCoords.latitude,
            lon: validatedCoords.longitude,
            latitude: validatedCoords.latitude,
            longitude: validatedCoords.longitude,
            speed: data.speed,
            course: data.course,
            timestamp: data.timestamp,
            created_at: data.created_at,
          }

          // Additional validation using existing function
          if (!isValidLocation(rawLocation)) {
            console.warn("[v0] Location failed secondary validation:", rawLocation)
            return
          }

          // Assess location quality
          const quality = assessLocationQuality(rawLocation)
          if (quality.quality === "poor") {
            console.warn("[v0] Poor quality live location:", quality.reason)
            // Still process but log the issue
          }

          const newLocation: DeviceLocationData = rawLocation

          // Update current location
          setCurrentLocation(newLocation)

          // Add to location history (keep last 100 points)
          setDeviceLocations((prev) => [newLocation, ...prev.slice(0, 99)])

          // Increment live update counter
          setLiveLocationCount((prev) => prev + 1)

          // Center map on new location if map is available and coordinates are valid
          if (mapRef.current && validatedCoords.latitude && validatedCoords.longitude) {
            mapRef.current.setView([validatedCoords.latitude, validatedCoords.longitude], 15)
          }
        }
      })

      setSocket(socketInstance)

      return () => {
        console.log("[v0] Cleaning up Socket.IO connection")
        socketInstance.disconnect()
        setSocket(null)
      }
    }
  }, [open, device, isLiveTracking])

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

  useEffect(() => {
    setMapLoaded(true)

    if (open && device) {
      setMapKey((prev) => prev + 1)
      getCurrentLocation()
      loadDeviceLocation()
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

        if (error.code === 1) {
          console.log("[v0] Geolocation permission denied by user")
          return
        }

        const lowAccuracyOptions = {
          enableHighAccuracy: false,
          timeout: 15000,
          maximumAge: 30000,
        }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude, accuracy } = position.coords
            setUserLocation({ latitude, longitude, accuracy })
          },
          (error) => {
            console.error("Low accuracy location also failed:", error)
          },
          lowAccuracyOptions,
        )
      },
      options,
    )
  }

  const loadDeviceLocation = async () => {
    if (!device) return

    setDeviceLoading(true)
    try {
      console.log("[v0] Loading device location for IMEI:", device.device_imei)

      const [current, history] = await Promise.all([
        DeviceApiService.getCurrentDeviceLocation(device.device_imei),
        DeviceApiService.getDeviceLocationHistory(device.device_imei, { limit: 50 }),
      ])

      console.log("[v0] Raw API Response - Current:", current)
      console.log("[v0] Raw API Response - History:", history)
      console.log("[v0] History is array:", Array.isArray(history))
      console.log("[v0] History length:", history?.length)
      console.log("[v0] Full API response structure:", JSON.stringify({ current, history }, null, 2))

      if (current) {
        console.log("[v0] Processing current location:", current)

        const lat = current.lat || current.latitude || current.Lat || current.Latitude
        const lon = current.lon || current.longitude || current.Lon || current.Longitude

        console.log("[v0] Extracted coordinates - lat:", lat, "lon:", lon)
        console.log("[v0] Coordinate types - lat:", typeof lat, "lon:", typeof lon)
        console.log("[v0] Coordinate validation - lat valid:", lat != null && !isNaN(lat) && lat !== 0)
        console.log("[v0] Coordinate validation - lon valid:", lon != null && !isNaN(lon) && lon !== 0)

        if (lat != null && lon != null && !isNaN(lat) && !isNaN(lon) && lat !== 0 && lon !== 0) {
          const transformedCurrent = {
            ...current,
            lat: Number.parseFloat(lat),
            lon: Number.parseFloat(lon),
            latitude: Number.parseFloat(lat),
            longitude: Number.parseFloat(lon),
          }
          console.log("[v0] Setting current location:", transformedCurrent)
          setCurrentLocation(transformedCurrent)
        } else {
          console.warn("[v0] Invalid current location coordinates:", { lat, lon, raw: current })
          setCurrentLocation(null)
        }
      } else {
        console.log("[v0] No current location data received")
        setCurrentLocation(null)
      }

      if (Array.isArray(history) && history.length > 0) {
        console.log("[v0] Processing location history, count:", history.length)
        console.log("[v0] First 3 history items:", history.slice(0, 3))

        const validLocations = history
          .map((location, index) => {
            console.log(`[v0] Processing location ${index}:`, location)

            const lat = location.lat || location.latitude || location.Lat || location.Latitude
            const lon = location.lon || location.longitude || location.Lon || location.Longitude

            console.log(`[v0] Location ${index} coordinates - lat:`, lat, "lon:", lon, "types:", typeof lat, typeof lon)

            if (lat != null && lon != null && !isNaN(lat) && !isNaN(lon) && lat !== 0 && lon !== 0) {
              const processed = {
                ...location,
                lat: Number.parseFloat(lat),
                lon: Number.parseFloat(lon),
                latitude: Number.parseFloat(lat),
                longitude: Number.parseFloat(lon),
                id: location.id || location._id?.$oid || `loc_${index}`,
              }
              console.log(`[v0] Valid location ${index}:`, processed)
              return processed
            } else {
              console.warn(`[v0] Skipping location ${index} - invalid coordinates:`, { lat, lon, raw: location })
              return null
            }
          })
          .filter((location): location is DeviceLocationData => location !== null)

        console.log("[v0] Valid locations after processing:", validLocations.length)
        console.log("[v0] Sample valid location:", validLocations[0])
        console.log("[v0] All valid locations:", validLocations)

        setDeviceLocations(validLocations)
      } else {
        console.warn("[v0] History response is not a valid array:", history)
        console.log("[v0] History type:", typeof history)
        console.log("[v0] History value:", history)
        setDeviceLocations([])
      }
    } catch (error) {
      console.error("[v0] Error loading device location:", error)
      console.error("[v0] Error details:", error.message, error.stack)
      setDeviceLocations([])
      setCurrentLocation(null)
    } finally {
      setDeviceLoading(false)
    }
  }

  const formatTime = (dateString: string) => {
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
    console.log("[v0] Creating route path from deviceLocations:", deviceLocations.length)

    if (!Array.isArray(deviceLocations) || deviceLocations.length === 0) {
      console.log("[v0] No device locations available for route")
      return []
    }

    const validPoints = deviceLocations
      .map((location, index) => {
        const lat = location.lat || location.latitude
        const lon = location.lon || location.longitude

        console.log(`[v0] Processing route point ${index}:`, { lat, lon, location })

        if (
          lat != null &&
          lon != null &&
          typeof lat === "number" &&
          typeof lon === "number" &&
          !isNaN(lat) &&
          !isNaN(lon) &&
          Math.abs(lat) <= 90 &&
          Math.abs(lon) <= 180 &&
          !(lat === 0 && lon === 0)
        ) {
          const point: [number, number] = [Number(lat), Number(lon)]
          console.log(`[v0] Valid route point ${index}:`, point)
          return point
        } else {
          console.warn(`[v0] Invalid route point ${index}:`, { lat, lon, type_lat: typeof lat, type_lon: typeof lon })
          return null
        }
      })
      .filter((point): point is [number, number] => point !== null)

    console.log("[v0] Final route path points:", validPoints.length)
    console.log("[v0] Sample route points:", validPoints.slice(0, 3))

    return validPoints
  }, [deviceLocations])

  if (!device) return null

  const isOnline = device.base.status === 1

  let mapCenter: [number, number] = [21.9368, 86.7441] // Default center

  if (currentLocation) {
    const lat = currentLocation.lat || currentLocation.latitude
    const lon = currentLocation.lon || currentLocation.longitude

    if (lat != null && lon != null && !isNaN(lat) && !isNaN(lon)) {
      mapCenter = [Number.parseFloat(lat), Number.parseFloat(lon)]
      console.log("[v0] Map centered on current location:", mapCenter)
    }
  } else if (userLocation) {
    mapCenter = [userLocation.latitude, userLocation.longitude]
    console.log("[v0] Map centered on user location:", mapCenter)
  }

  console.log("[v0] Final map center:", mapCenter)
  console.log("[v0] Current location for map:", currentLocation)
  console.log("[v0] Device locations count:", deviceLocations.length)

  const getTileLayerConfig = () => {
    switch (mapStyle) {
      case "transport":
        return {
          url: "https://{s}.tile.thunderforest.com/transport/{z}/{x}/{y}.png?apikey=YOUR_API_KEY",
          attribution:
            '&copy; <a href="https://www.thunderforest.com/">Thunderforest</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          fallbackUrl: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        }
      case "carto":
        return {
          url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          fallbackUrl: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        }
      default:
        return {
          url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          fallbackUrl: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        }
    }
  }

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
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {device.tractorInStore.baseTractor?.name} - {device.tractorInStore.baseTractor?.model}
            {isLiveTracking && liveLocationCount > 0 && (
              <span className="ml-2 text-green-600">
                • {t.liveUpdates} {liveLocationCount}
              </span>
            )}
          </p>
        </DialogHeader>

        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Map Style:</label>
                <select
                  value={mapStyle}
                  onChange={(e) => setMapStyle(e.target.value as "osm" | "carto" | "transport")}
                  className="px-3 py-1 text-sm bg-background border rounded-md shadow-sm"
                >
                  <option value="transport">Roads</option>
                  <option value="carto">Streets</option>
                  <option value="osm">Standard</option>
                </select>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Button size="sm" variant="outline" onClick={getCurrentLocation} disabled={locationLoading}>
                  <RefreshCw className={`h-4 w-4 mr-1 ${locationLoading ? "animate-spin" : ""}`} />
                  {t.refreshLocation}
                </Button>
                <Button size="sm" variant="outline" onClick={loadDeviceLocation} disabled={deviceLoading}>
                  <MapPin className={`h-4 w-4 mr-1 ${deviceLoading ? "animate-spin" : ""}`} />
                  {t.loadDeviceLocation}
                </Button>
                <Button size="sm" variant={showRoute ? "default" : "outline"} onClick={() => setShowRoute(!showRoute)}>
                  <Route className="h-4 w-4 mr-1" />
                  {showRoute ? t.hideRoute : t.showRoute}
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
                  <MapContainer
                    key={mapKey}
                    center={mapCenter}
                    zoom={15}
                    style={{ height: "100%", width: "100%" }}
                    ref={mapRef}
                  >
                    <TileLayer
                      attribution={getTileLayerConfig().attribution}
                      url={getTileLayerConfig().url}
                      onError={() => {
                        console.log("[v0] Primary tile layer failed, falling back to OpenStreetMap")
                      }}
                    />

                    {/* User location marker */}
                    {userLocation && (
                      <Marker position={[userLocation.latitude, userLocation.longitude]}>
                        <Popup>
                          <div className="text-center">
                            <strong>{t.yourLocation}</strong>
                            <br />
                            <div className="text-xs">
                              Lat: {userLocation.latitude.toFixed(6)}, Lon: {userLocation.longitude.toFixed(6)}
                            </div>
                            {userLocation.accuracy && (
                              <span className={getAccuracyColor(userLocation.accuracy)}>
                                {t.accuracy} {getAccuracyText(userLocation.accuracy)}
                              </span>
                            )}
                          </div>
                        </Popup>
                      </Marker>
                    )}

                    {/* Device location marker */}
                    {currentLocation &&
                      (() => {
                        const lat = currentLocation.lat || currentLocation.latitude
                        const lon = currentLocation.lon || currentLocation.longitude

                        console.log("[v0] Rendering device marker at:", lat, lon)

                        if (
                          lat != null &&
                          lon != null &&
                          typeof lat === "number" &&
                          typeof lon === "number" &&
                          !isNaN(lat) &&
                          !isNaN(lon) &&
                          Math.abs(lat) <= 90 &&
                          Math.abs(lon) <= 180
                        ) {
                          return (
                            <Marker position={[Number(lat), Number(lon)]}>
                              <Popup>
                                <div className="text-center">
                                  <strong>{t.deviceLocation}</strong>
                                  <br />
                                  <div className="text-sm space-y-1">
                                    <div className="text-xs font-mono">
                                      Lat: {Number(lat).toFixed(6)}, Lon: {Number(lon).toFixed(6)}
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
                                </div>
                              </Popup>
                            </Marker>
                          )
                        }

                        console.warn("[v0] Cannot render device marker - invalid coordinates:", { lat, lon })
                        return null
                      })()}

                    {/* Route polyline */}
                    {showRoute && routePath.length > 1 && (
                      <Polyline positions={routePath} color="blue" weight={3} opacity={0.7} smoothFactor={1} />
                    )}

                    {/* Route history markers */}
                    {showRoute &&
                      routePath.length > 0 &&
                      routePath.slice(0, 10).map((point, index) => (
                        <Marker key={`route-point-${index}`} position={point}>
                          <Popup>
                            <div className="text-sm">
                              <div>
                                <strong>Route Point {index + 1}</strong>
                              </div>
                              <div className="text-xs font-mono">
                                Lat: {point[0].toFixed(6)}, Lon: {point[1].toFixed(6)}
                              </div>
                              {deviceLocations[index] && (
                                <>
                                  <div>
                                    {t.speed} {Number(deviceLocations[index].speed || 0).toFixed(1)} km/h
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {formatTime(deviceLocations[index].timestamp || deviceLocations[index].created_at)}
                                  </div>
                                </>
                              )}
                            </div>
                          </Popup>
                        </Marker>
                      ))}
                  </MapContainer>
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
                </div>

                <Badge variant={isOnline ? "default" : "secondary"} className="flex items-center gap-1">
                  {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                  {isOnline ? t.online : t.offline}
                </Badge>
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

              {Array.isArray(deviceLocations) && deviceLocations.length > 0 && (
                <div className="mb-6 p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    {t.locationHistory}
                    {isLiveTracking && (
                      <Badge variant="outline" className="text-xs">
                        Live: {liveLocationCount} updates
                      </Badge>
                    )}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {deviceLocations.length} location points recorded
                    {isLiveTracking && " (updating in real-time)"}
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
