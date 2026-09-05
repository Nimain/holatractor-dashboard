"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
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
  Calendar,
  Filter,
  Globe,
  Layers,
  Maximize2,
  Minimize2,
  LocateFixed,
} from "lucide-react"
import DeviceLocationService, {
  type DeviceLocationData,
  type LocationHistoryParams,
} from "@/utils/Axios/DeviceLocationService"
import { getGoogleMapsTractorIcon } from "@/utils/map/tractorIcon"
import { io, type Socket } from "socket.io-client"

const GOOGLE_MAPS_API_KEY =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
  process.env.GOOGLE_MAPS_API_KEY ||
  "AIzaSyDjMCI0xj2Q-WTc9J7yWX-Mvh0DBM7oHbg"

interface Device {
  id: string
  device_imei: string
  device_region?: "SW" | "NE" | string
  base?: {
    status?: number
  }
  tractorInStore?: {
    baseTractor?: {
      name?: string
      model?: string
      images?: string[]
    }
    hourly_price?: number
    lat?: string | null
    lan?: string | null
  }
  updatedAt?: string
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

type DateFilter = "today" | "yesterday" | "week" | "month" | "custom" | "all"
type GoogleMapType = "roadmap" | "satellite" | "hybrid" | "terrain"

export function DeviceMapModal({
  open,
  onOpenChange,
  device,
  language = "en",
}: DeviceMapModalProps) {
  const mapElementRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const deviceMarkerRef = useRef<google.maps.Marker | null>(null)
  const userMarkerRef = useRef<google.maps.Marker | null>(null)
  const polylineRef = useRef<google.maps.Polyline | null>(null)
  const waypointMarkersRef = useRef<google.maps.Marker[]>([])
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null)

  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false)
  const [googleMapsError, setGoogleMapsError] = useState(false)
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null)
  const [deviceLocations, setDeviceLocations] = useState<DeviceLocationData[]>([])
  const [currentLocation, setCurrentLocation] = useState<DeviceLocationData | null>(null)
  const [locationLoading, setLocationLoading] = useState(false)
  const [deviceLoading, setDeviceLoading] = useState(false)
  const [showRoute, setShowRoute] = useState(true)
  const [isLiveTracking, setIsLiveTracking] = useState(false)
  const [socket, setSocket] = useState<Socket | null>(null)
  const [liveLocationCount, setLiveLocationCount] = useState(0)
  const [mapType, setMapType] = useState<GoogleMapType>("hybrid")
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Date filtering state
  const [selectedFilter, setSelectedFilter] = useState<DateFilter>("today")
  const [customStartDate, setCustomStartDate] = useState("")
  const [customEndDate, setCustomEndDate] = useState("")
  const [showDatePicker, setShowDatePicker] = useState(false)

  const translations = {
    en: {
      title: "Device Telemetry & Location",
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
      course: "Heading:",
      altitude: "Altitude:",
      satellites: "Satellites:",
      hourlyRate: "Hourly Rate:",
      startTracking: "Start Live Tracking",
      stopLiveTracking: "Stop Live Tracking",
      liveTracking: "Live Tracking",
      connected: "Connected",
      disconnected: "Disconnected",
      liveUpdates: "Live Updates:",
      dateFilter: "Date Filter:",
      today: "Today",
      yesterday: "Yesterday",
      week: "This Week",
      month: "This Month",
      custom: "Custom Range",
      startDate: "Start Date",
      endDate: "End Date",
      applyFilter: "Apply Filter",
      locationCount: "locations found",
      filterUpdated: "Location history updated",
      mapStyle: "Map Style:",
      roads: "Roadmap",
      satellite: "Satellite",
      hybrid: "Hybrid",
      terrain: "Terrain",
      region: "Region:",
      coordinateSystem: "Coordinate System:",
      southwest: "Southwest (Negative Coordinates)",
      northeast: "Northeast (Positive Coordinates)",
      model: "Model:",
      imei: "IMEI:",
      recenter: "Recenter",
    },
    es: {
      title: "Telemetría y Ubicación del Dispositivo",
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
      startTracking: "Iniciar Seguimiento en Vivo",
      stopLiveTracking: "Detener Seguimiento en Vivo",
      liveTracking: "Seguimiento en Vivo",
      connected: "Conectado",
      disconnected: "Desconectado",
      liveUpdates: "Actualizaciones en Vivo:",
      dateFilter: "Filtro de Fecha:",
      today: "Hoy",
      yesterday: "Ayer",
      week: "Esta Semana",
      month: "Este Mes",
      custom: "Rango Personalizado",
      startDate: "Fecha de Inicio",
      endDate: "Fecha de Fin",
      applyFilter: "Aplicar Filtro",
      locationCount: "ubicaciones encontradas",
      filterUpdated: "Historial de ubicación actualizado",
      mapStyle: "Estilo del Mapa:",
      roads: "Mapa Vial",
      satellite: "Satélite",
      hybrid: "Híbrido",
      terrain: "Terreno",
      region: "Región:",
      coordinateSystem: "Sistema de Coordenadas:",
      southwest: "Suroeste (Coordenadas Negativas)",
      northeast: "Noreste (Coordenadas Positivas)",
      model: "Modelo:",
      imei: "IMEI:",
      recenter: "Recentrar",
    },
  }

  const t = translations[language]

  // Safe device property helpers
  const isOnline = device?.base?.status === 1 || Boolean((device as any)?.online)
  const tractorName =
    device?.tractorInStore?.baseTractor?.name ||
    (device as any)?.base_tractor?.name ||
    (device as any)?.name ||
    "Tractor Device"
  const tractorModel =
    device?.tractorInStore?.baseTractor?.model || (device as any)?.model || "N/A"
  const tractorImage =
    device?.tractorInStore?.baseTractor?.images?.[0] ||
    (device as any)?.image ||
    (device as any)?.images?.[0]
  const hourlyPrice =
    device?.tractorInStore?.hourly_price ?? (device as any)?.hourly_price ?? 0
  const deviceImei = device?.device_imei || (device as any)?.imei || ""
  const deviceRegion = device?.device_region || (device as any)?.region || "SW"

  // Load Google Maps Script
  useEffect(() => {
    if (typeof window === "undefined") return

    if (window.google && window.google.maps) {
      setGoogleMapsLoaded(true)
      return
    }

    const existingScript = document.getElementById("google-maps-script")
    if (existingScript) {
      existingScript.addEventListener("load", () => setGoogleMapsLoaded(true))
      existingScript.addEventListener("error", () => setGoogleMapsError(true))
      return
    }

    const script = document.createElement("script")
    script.id = "google-maps-script"
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=geometry,places`
    script.async = true
    script.defer = true
    script.onload = () => {
      console.log("[DeviceMapModal] Google Maps script loaded successfully")
      setGoogleMapsLoaded(true)
    }
    script.onerror = () => {
      console.error("[DeviceMapModal] Failed to load Google Maps script")
      setGoogleMapsError(true)
    }
    document.head.appendChild(script)
  }, [])

  // Helper function to adjust coordinates based on device region
  const adjustLiveLocationCoordinates = (
    data: LiveLocationData,
    region: string
  ): LiveLocationData => {
    let adjustedLat = data.lat
    let adjustedLon = data.lon

    if (region === "SW") {
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

  // Socket.IO for live tracking
  useEffect(() => {
    if (open && device && isLiveTracking && deviceImei) {
      const socketInstance = io("https://device.holatractor.com", {
        transports: ["websocket", "polling"],
        autoConnect: true,
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 20000,
        query: {
          imei: deviceImei,
        },
      })

      socketInstance.on("connect", () => {
        socketInstance.emit("join-device", deviceImei)
      })

      socketInstance.on("location-update", (data: LiveLocationData) => {
        if (data.imei === deviceImei) {
          const adjustedData = adjustLiveLocationCoordinates(data, deviceRegion)
          const newLocation: DeviceLocationData = {
            id: adjustedData._id?.$oid || `loc-${Date.now()}`,
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

          setCurrentLocation(newLocation)
          setDeviceLocations((prev) => [newLocation, ...prev.slice(0, 99)])
          setLiveLocationCount((prev) => prev + 1)

          if (mapInstanceRef.current && adjustedData.lat && adjustedData.lon) {
            const pos = new window.google.maps.LatLng(adjustedData.lat, adjustedData.lon)
            mapInstanceRef.current.panTo(pos)
          }
        }
      })

      setSocket(socketInstance)

      return () => {
        socketInstance.disconnect()
        setSocket(null)
      }
    }
  }, [open, device, isLiveTracking, deviceImei, deviceRegion])

  // Get user location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) return
    setLocationLoading(true)
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
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    )
  }

  // Load device location history
  const loadDeviceLocationWithFilter = useCallback(async () => {
    if (!device || !deviceImei) return

    setDeviceLoading(true)
    try {
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
        case "all":
          params = {}
          break
        case "custom":
          if (customStartDate && customEndDate) {
            params = { start_date: customStartDate, end_date: customEndDate }
          } else {
            params = { filter: "today" }
          }
          break
        default:
          params = { filter: "today" }
      }

      const [current, history] = await Promise.all([
        DeviceLocationService.getCurrentDeviceLocation(deviceImei, deviceRegion),
        DeviceLocationService.getDeviceLocationHistory(deviceImei, params, deviceRegion),
      ])

      if (
        current &&
        current.lat &&
        current.lon &&
        current.lat !== 0 &&
        current.lon !== 0 &&
        !isNaN(Number(current.lat)) &&
        !isNaN(Number(current.lon))
      ) {
        setCurrentLocation(current)
      } else {
        setCurrentLocation(null)
      }

      if (Array.isArray(history) && history.length > 0) {
        const validLocations = history.filter(
          (loc) =>
            loc.lat &&
            loc.lon &&
            loc.lat !== 0 &&
            loc.lon !== 0 &&
            !isNaN(Number(loc.lat)) &&
            !isNaN(Number(loc.lon))
        )
        setDeviceLocations(validLocations)
      } else {
        setDeviceLocations([])
      }
    } catch (error) {
      console.error("[DeviceMapModal] Error loading device location:", error)
      setDeviceLocations([])
      setCurrentLocation(null)
    } finally {
      setDeviceLoading(false)
    }
  }, [device, deviceImei, deviceRegion, selectedFilter, customStartDate, customEndDate])

  // Initialize modal data when opened
  useEffect(() => {
    if (open && device) {
      getCurrentLocation()
      loadDeviceLocationWithFilter()
    }

    if (!open) {
      setIsLiveTracking(false)
      setLiveLocationCount(0)
      if (socket) {
        socket.disconnect()
        setSocket(null)
      }
    }
  }, [open, device, loadDeviceLocationWithFilter])

  // Compute Route Path Points
  const routePoints = React.useMemo(() => {
    if (!Array.isArray(deviceLocations) || deviceLocations.length === 0) {
      return []
    }
    return deviceLocations
      .filter((loc) => loc.lat && loc.lon && loc.lat !== 0 && loc.lon !== 0)
      .map((loc) => ({
        lat: Number(loc.lat),
        lng: Number(loc.lon),
      }))
  }, [deviceLocations])

  // Compute Initial / Target Map Center
  const mapCenter = React.useMemo(() => {
    if (currentLocation && currentLocation.lat && currentLocation.lon) {
      const lat = Number(currentLocation.lat)
      const lng = Number(currentLocation.lon)
      if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
        return { lat, lng }
      }
    }
    if (routePoints.length > 0) {
      return routePoints[0]
    }
    if (userLocation) {
      return { lat: userLocation.latitude, lng: userLocation.longitude }
    }
    if (deviceRegion === "SW") {
      return { lat: -17.7833, lng: -63.1821 } // Santa Cruz, Bolivia
    }
    return { lat: 21.9368, lng: 86.7441 }
  }, [currentLocation, routePoints, userLocation, deviceRegion])

  // Initialize and Update Google Map
  useEffect(() => {
    if (!open || !googleMapsLoaded || !mapElementRef.current || !window.google?.maps) {
      return
    }

    try {
      // 1. Initialize Map Instance if not created
      if (!mapInstanceRef.current) {
        mapInstanceRef.current = new window.google.maps.Map(mapElementRef.current, {
          center: mapCenter,
          zoom: 15,
          mapTypeId: mapType as any,
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }],
            },
          ],
        })

        infoWindowRef.current = new window.google.maps.InfoWindow()
      } else {
        mapInstanceRef.current.setMapTypeId(mapType as any)
      }

      const map = mapInstanceRef.current

      // Trigger resize after modal animation
      const resizeTimer = setTimeout(() => {
        window.google.maps.event.trigger(map, "resize")
      }, 200)

      // 2. User Location Marker
      if (userLocation) {
        const userPos = { lat: userLocation.latitude, lng: userLocation.longitude }
        if (!userMarkerRef.current) {
          userMarkerRef.current = new window.google.maps.Marker({
            position: userPos,
            map: map,
            title: t.yourLocation,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: "#3B82F6",
              fillOpacity: 1,
              strokeColor: "#FFFFFF",
              strokeWeight: 2.5,
            },
          })
        } else {
          userMarkerRef.current.setPosition(userPos)
          userMarkerRef.current.setMap(map)
        }
      } else if (userMarkerRef.current) {
        userMarkerRef.current.setMap(null)
      }

      // 3. Tractor Device Current Location Marker
      const activeLat = Number(currentLocation?.lat || routePoints[0]?.lat)
      const activeLng = Number(currentLocation?.lon || routePoints[0]?.lng)

      if (!isNaN(activeLat) && !isNaN(activeLng) && activeLat !== 0 && activeLng !== 0) {
        const tractorPos = { lat: activeLat, lng: activeLng }
        const course = Number(currentLocation?.course || 0)
        const isMoving = Number(currentLocation?.speed || 0) > 0.5

        const tractorIcon = getGoogleMapsTractorIcon({
          course,
          isLive: isLiveTracking,
          isMoving,
          status: isOnline ? "Active" : "Offline",
          size: 64,
        })

        if (!deviceMarkerRef.current) {
          deviceMarkerRef.current = new window.google.maps.Marker({
            position: tractorPos,
            map: map,
            title: tractorName,
            icon: tractorIcon,
            zIndex: 999,
          })

          deviceMarkerRef.current.addListener("click", () => {
            if (infoWindowRef.current) {
              infoWindowRef.current.setContent(`
                <div style="padding: 8px; font-family: sans-serif; color: #1e293b; max-width: 240px;">
                  <h4 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 700; color: #0f172a;">${tractorName}</h4>
                  <p style="margin: 0 0 6px 0; font-size: 12px; color: #64748b;">IMEI: <strong>${deviceImei}</strong></p>
                  <div style="font-size: 11px; line-height: 1.5; border-top: 1px solid #e2e8f0; padding-top: 4px;">
                    <div>Status: <span style="font-weight: 700; color: ${isOnline ? "#16a34a" : "#dc2626"}">${isOnline ? "Online" : "Offline"}</span></div>
                    <div>Speed: <strong>${(currentLocation?.speed || 0).toFixed(1)} km/h</strong></div>
                    <div>Lat: ${activeLat.toFixed(6)}, Lng: ${activeLng.toFixed(6)}</div>
                    <div>Last update: <em>${formatTime(currentLocation?.timestamp || currentLocation?.created_at || "")}</em></div>
                  </div>
                </div>
              `)
              infoWindowRef.current.open(map, deviceMarkerRef.current)
            }
          })
        } else {
          deviceMarkerRef.current.setPosition(tractorPos)
          deviceMarkerRef.current.setIcon(tractorIcon)
          deviceMarkerRef.current.setMap(map)
        }
      } else if (deviceMarkerRef.current) {
        deviceMarkerRef.current.setMap(null)
      }

      // 4. Route Polyline & Waypoints
      if (polylineRef.current) {
        polylineRef.current.setMap(null)
        polylineRef.current = null
      }
      waypointMarkersRef.current.forEach((m) => m.setMap(null))
      waypointMarkersRef.current = []

      if (showRoute && routePoints.length > 1) {
        polylineRef.current = new window.google.maps.Polyline({
          path: routePoints,
          geodesic: true,
          strokeColor: "#F97316",
          strokeOpacity: 0.9,
          strokeWeight: 5,
          map: map,
        })

        // Add small waypoint dots along the route
        routePoints.slice(0, 20).forEach((point, idx) => {
          const isLatest = idx === 0
          const isStart = idx === routePoints.length - 1

          const dotMarker = new window.google.maps.Marker({
            position: point,
            map: map,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: isLatest || isStart ? 6 : 4,
              fillColor: isLatest ? "#EF4444" : isStart ? "#10B981" : "#F97316",
              fillOpacity: 1,
              strokeColor: "#FFFFFF",
              strokeWeight: 2,
            },
          })
          waypointMarkersRef.current.push(dotMarker)
        })

        // Auto-fit bounds to include the whole route
        const bounds = new window.google.maps.LatLngBounds()
        routePoints.forEach((p) => bounds.extend(p))
        if (userLocation) {
          bounds.extend({ lat: userLocation.latitude, lng: userLocation.longitude })
        }
        map.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 })
      } else if (!isNaN(activeLat) && !isNaN(activeLng) && activeLat !== 0) {
        map.panTo({ lat: activeLat, lng: activeLng })
      }

      return () => {
        clearTimeout(resizeTimer)
      }
    } catch (err) {
      console.error("[DeviceMapModal] Error rendering Google Map:", err)
    }
  }, [
    open,
    googleMapsLoaded,
    mapCenter,
    mapType,
    currentLocation,
    routePoints,
    showRoute,
    userLocation,
    isLiveTracking,
    isOnline,
    tractorName,
    deviceImei,
    t,
  ])

  // Format timestamp helper
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

  const handleFilterChange = (filter: DateFilter) => {
    setSelectedFilter(filter)
    if (filter !== "custom") {
      setShowDatePicker(false)
    } else {
      setShowDatePicker(true)
      if (!customStartDate) {
        setCustomStartDate(DeviceLocationService.getTodayDate())
      }
      if (!customEndDate) {
        setCustomEndDate(DeviceLocationService.getTodayDate())
      }
    }
  }

  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.panTo(mapCenter)
      mapInstanceRef.current.setZoom(16)
    }
  }

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

  if (!device) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`${
          isFullscreen
            ? "max-w-[98vw] h-[96vh] w-[98vw]"
            : "max-w-5xl max-h-[92vh] w-full"
        } overflow-hidden flex flex-col p-6 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-2xl transition-all duration-200`}
      >
        <DialogHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white">
              <div className="p-2 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
                <MapPin className="h-5 w-5" />
              </div>
              {t.title}
              {isLiveTracking && (
                <Badge variant="default" className="ml-2 bg-emerald-600 text-white animate-pulse">
                  <Radio className="h-3 w-3 mr-1" />
                  {t.liveTracking}
                </Badge>
              )}
              <Badge variant="outline" className="ml-2 font-mono text-xs">
                <Globe className="h-3 w-3 mr-1" />
                {deviceRegion}
              </Badge>
            </DialogTitle>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            <span className="font-semibold text-slate-800 dark:text-slate-200">{tractorName}</span> •{" "}
            <span>{tractorModel}</span>
            {deviceImei && <span className="ml-2 font-mono">IMEI: {deviceImei}</span>}
            {isLiveTracking && liveLocationCount > 0 && (
              <span className="ml-2 text-emerald-600 font-semibold">
                • {t.liveUpdates} {liveLocationCount}
              </span>
            )}
          </p>
        </DialogHeader>

        {/* Date Filter & Control Bar */}
        <div className="py-2.5 flex items-center justify-between gap-3 flex-wrap border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
              <Filter className="h-3.5 w-3.5" /> Filter:
            </span>
            {(["today", "yesterday", "week", "month", "custom", "all"] as DateFilter[]).map(
              (filter) => (
                <Button
                  key={filter}
                  size="sm"
                  variant={selectedFilter === filter ? "default" : "outline"}
                  onClick={() => handleFilterChange(filter)}
                  className={`text-xs h-7 px-2.5 rounded-full ${
                    selectedFilter === filter
                      ? "bg-orange-600 text-white hover:bg-orange-700"
                      : "text-slate-600 dark:text-slate-300"
                  }`}
                >
                  {t[filter as keyof typeof t] || filter}
                </Button>
              )
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowRoute(!showRoute)}
              className="text-xs h-7 px-2.5 rounded-full"
            >
              <Route className="h-3.5 w-3.5 mr-1" />
              {showRoute ? t.hideRoute : t.showRoute}
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={loadDeviceLocationWithFilter}
              disabled={deviceLoading}
              className="text-xs h-7 px-2.5 rounded-full"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1 ${deviceLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>

            <Button
              size="sm"
              variant={isLiveTracking ? "destructive" : "default"}
              onClick={toggleLiveTracking}
              className={`text-xs h-7 px-3 rounded-full font-semibold ${
                isLiveTracking
                  ? "bg-red-600 hover:bg-red-700 text-white animate-pulse"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white"
              }`}
            >
              <RadioIcon className="h-3.5 w-3.5 mr-1" />
              {isLiveTracking ? t.stopLiveTracking : t.startTracking}
            </Button>
          </div>
        </div>

        {/* Custom Date Pickers */}
        {showDatePicker && (
          <div className="flex items-center gap-3 py-2 bg-slate-50 dark:bg-slate-900/50 px-3 rounded-lg text-xs">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <span>{t.startDate}:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="border rounded px-2 py-1 bg-white dark:bg-slate-900 text-xs"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <span>{t.endDate}:</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="border rounded px-2 py-1 bg-white dark:bg-slate-900 text-xs"
              />
            </div>
            <Button
              size="sm"
              onClick={loadDeviceLocationWithFilter}
              className="bg-orange-600 hover:bg-orange-700 text-white h-7 text-xs rounded-full px-3"
            >
              {t.applyFilter}
            </Button>
          </div>
        )}

        {/* Map Canvas & Telemetry Info */}
        <div className="flex-1 overflow-y-auto space-y-4 pt-2">
          <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 min-h-[380px] h-[48vh]">
            {!googleMapsLoaded ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-500">
                <RefreshCw className="h-8 w-8 animate-spin text-orange-600 mb-2" />
                <span className="text-sm font-semibold">Loading Google Maps...</span>
              </div>
            ) : googleMapsError ? (
              <div className="flex flex-col items-center justify-center h-full text-red-500">
                <p className="text-sm font-semibold">Failed to load Google Maps.</p>
              </div>
            ) : (
              <>
                <div ref={mapElementRef} className="w-full h-full" />

                {/* Floating Map Controls */}
                <div className="absolute top-3 right-3 z-10 flex flex-col gap-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-1.5 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-1">
                    {(["hybrid", "satellite", "roadmap", "terrain"] as GoogleMapType[]).map(
                      (type) => (
                        <button
                          key={type}
                          onClick={() => setMapType(type)}
                          className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all capitalize ${
                            mapType === type
                              ? "bg-orange-600 text-white shadow-sm"
                              : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                          }`}
                        >
                          {type}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Recenter button */}
                <button
                  onClick={handleRecenter}
                  className="absolute bottom-4 right-4 z-10 p-2.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md hover:bg-orange-500 hover:text-white rounded-full shadow-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 transition-all"
                  title={t.recenter}
                >
                  <LocateFixed className="h-5 w-5" />
                </button>
              </>
            )}
          </div>

          {/* Telemetry Stats Card */}
          <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl overflow-hidden bg-white dark:bg-slate-900">
            <CardContent className="p-4">
              <div className="flex items-center justify-between flex-wrap gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 rounded-xl border border-slate-200">
                    {tractorImage ? (
                      <AvatarImage src={tractorImage} alt={tractorName} className="object-cover" />
                    ) : (
                      <AvatarFallback className="bg-amber-100 text-amber-800">
                        <Truck className="h-6 w-6" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">
                      {tractorName}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {t.model} {tractorModel} • <span className="font-mono">{deviceImei}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge
                    variant={isOnline ? "default" : "secondary"}
                    className={`flex items-center gap-1 ${
                      isOnline ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                    {isOnline ? t.online : t.offline}
                  </Badge>
                  <Badge variant="outline" className="text-xs font-semibold">
                    ${hourlyPrice}/hr
                  </Badge>
                </div>
              </div>

              {/* 4-Grid Telemetry Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3">
                <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <Clock className="h-4 w-4 text-slate-400 shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-400 font-medium">{t.lastSeen}</p>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {currentLocation
                        ? formatTime(currentLocation.timestamp || currentLocation.created_at)
                        : formatTime(device?.updatedAt || "")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <Battery className="h-4 w-4 text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-400 font-medium">{t.battery}</p>
                    <p className="text-xs font-bold text-emerald-600">
                      {currentLocation?.battery_level ? `${currentLocation.battery_level}%` : "92%"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <Zap className="h-4 w-4 text-blue-600 shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-400 font-medium">{t.speed}</p>
                    <p
                      className={`text-xs font-bold ${
                        (currentLocation?.speed || 0) > 0.5 ? "text-emerald-600 animate-pulse" : "text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {currentLocation?.speed ? `${currentLocation.speed.toFixed(1)} km/h` : "0.0 km/h"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <Navigation className="h-4 w-4 text-orange-600 shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-400 font-medium">{t.course}</p>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {currentLocation?.course ? `${currentLocation.course}°` : "0°"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}