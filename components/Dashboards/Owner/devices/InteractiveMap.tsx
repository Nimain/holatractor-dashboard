"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw, History, Crosshair } from "lucide-react"
import { getGoogleMapsTractorIcon } from "@/utils/map/tractorIcon"

const GOOGLE_MAPS_API_KEY =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
  process.env.GOOGLE_MAPS_API_KEY ||
  "AIzaSyDjMCI0xj2Q-WTc9J7yWX-Mvh0DBM7oHbg"

interface UserLocation {
  latitude: number
  longitude: number
  accuracy?: number
}

interface DeviceLocation {
  latitude: number
  longitude: number
  timestamp: string
  speed?: number
  accuracy?: number
  course?: number
}

interface InteractiveMapProps {
  userLocation: UserLocation | null
  deviceLocation: DeviceLocation | null
  historicalLocations: DeviceLocation[]
  isRealTimeTracking: boolean
  distance: number | null
  onRefreshLocation: () => void
  onRefreshDeviceLocation: () => void
  onViewHistory: () => void
  locationLoading: boolean
  deviceLocationLoading: boolean
  trackingLoading: boolean
  translations: any
}

export default function InteractiveMap({
  userLocation,
  deviceLocation,
  historicalLocations,
  isRealTimeTracking,
  distance,
  onRefreshLocation,
  onRefreshDeviceLocation,
  onViewHistory,
  locationLoading,
  deviceLocationLoading,
  trackingLoading,
  translations: t,
}: InteractiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const userMarkerRef = useRef<google.maps.Marker | null>(null)
  const deviceMarkerRef = useRef<google.maps.Marker | null>(null)
  const polylineRef = useRef<google.maps.Polyline | null>(null)
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false)

  // Load Google Maps script
  useEffect(() => {
    if (typeof window === "undefined") return

    if (window.google && window.google.maps) {
      setGoogleMapsLoaded(true)
      return
    }

    const existingScript = document.getElementById("google-maps-script")
    if (existingScript) {
      existingScript.addEventListener("load", () => setGoogleMapsLoaded(true))
      return
    }

    const script = document.createElement("script")
    script.id = "google-maps-script"
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=geometry,places`
    script.async = true
    script.defer = true
    script.onload = () => setGoogleMapsLoaded(true)
    document.head.appendChild(script)
  }, [])

  // Initialize Map
  useEffect(() => {
    if (!googleMapsLoaded || !mapRef.current || !window.google?.maps) return

    if (!mapInstanceRef.current) {
      const defaultCenter = { lat: 20.5937, lng: 78.9629 }
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        center: defaultCenter,
        zoom: 5,
        mapTypeId: "hybrid" as any,
        zoomControl: true,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
      })
    }
  }, [googleMapsLoaded])

  // Update Markers & Polylines
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google?.maps) return

    const map = mapInstanceRef.current
    const bounds = new window.google.maps.LatLngBounds()
    let hasBounds = false

    // User Location Marker
    if (userLocation) {
      const userPos = { lat: userLocation.latitude, lng: userLocation.longitude }
      if (!userMarkerRef.current) {
        userMarkerRef.current = new window.google.maps.Marker({
          position: userPos,
          map,
          title: t?.yourLocation || "Your Location",
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: "#3B82F6",
            fillOpacity: 1,
            strokeColor: "#FFFFFF",
            strokeWeight: 2,
          },
        })
      } else {
        userMarkerRef.current.setPosition(userPos)
        userMarkerRef.current.setMap(map)
      }
      bounds.extend(userPos)
      hasBounds = true
    } else if (userMarkerRef.current) {
      userMarkerRef.current.setMap(null)
    }

    // Device Location Marker
    if (deviceLocation && deviceLocation.latitude && deviceLocation.longitude) {
      const devPos = { lat: deviceLocation.latitude, lng: deviceLocation.longitude }
      const course = deviceLocation.course || 0
      const isMoving = (deviceLocation.speed || 0) > 0.5
      const tractorIcon = getGoogleMapsTractorIcon({
        course,
        isLive: isRealTimeTracking,
        isMoving,
        status: "Active",
        size: 56,
      })

      if (!deviceMarkerRef.current) {
        deviceMarkerRef.current = new window.google.maps.Marker({
          position: devPos,
          map,
          title: t?.deviceLocationTitle || "Device Location",
          icon: tractorIcon,
          zIndex: 999,
        })
      } else {
        deviceMarkerRef.current.setPosition(devPos)
        deviceMarkerRef.current.setIcon(tractorIcon)
        deviceMarkerRef.current.setMap(map)
      }
      bounds.extend(devPos)
      hasBounds = true
    } else if (deviceMarkerRef.current) {
      deviceMarkerRef.current.setMap(null)
    }

    // Historical Polyline
    if (polylineRef.current) {
      polylineRef.current.setMap(null)
      polylineRef.current = null
    }

    if (historicalLocations && historicalLocations.length > 1) {
      const path = historicalLocations
        .filter((l) => l.latitude && l.longitude)
        .map((l) => ({ lat: l.latitude, lng: l.longitude }))

      if (path.length > 1) {
        polylineRef.current = new window.google.maps.Polyline({
          path,
          geodesic: true,
          strokeColor: "#8B5CF6",
          strokeOpacity: 0.8,
          strokeWeight: 4,
          map,
        })
        path.forEach((p) => bounds.extend(p))
        hasBounds = true
      }
    }

    if (hasBounds) {
      map.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 })
    }
  }, [userLocation, deviceLocation, historicalLocations, isRealTimeTracking, t])

  const formatDistance = (distance: number): string => {
    if (distance < 1000) {
      return `${Math.round(distance)} ${t?.meters || "m"}`
    }
    return `${(distance / 1000).toFixed(1)} ${t?.kilometers || "km"}`
  }

  return (
    <div className="relative w-full h-full min-h-[400px]">
      {/* Google Map Container */}
      <div ref={mapRef} className="w-full h-full min-h-[400px] rounded-xl overflow-hidden" />

      {/* Loading overlays */}
      {locationLoading && (
        <div className="absolute top-4 left-4 bg-white/90 dark:bg-slate-900/90 rounded-lg p-3 shadow-lg z-10 backdrop-blur-sm">
          <RefreshCw className="h-4 w-4 animate-spin mb-1 text-orange-600" />
          <p className="text-xs">{t?.gettingLocation || "Getting location..."}</p>
        </div>
      )}

      {deviceLocationLoading && (
        <div className="absolute top-4 right-4 bg-white/90 dark:bg-slate-900/90 rounded-lg p-3 shadow-lg z-10 backdrop-blur-sm">
          <RefreshCw className="h-4 w-4 animate-spin mb-1 text-orange-600" />
          <p className="text-xs">{t?.gettingDeviceLocation || "Getting device location..."}</p>
        </div>
      )}

      {/* Distance display */}
      {distance && (
        <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 bg-white/90 dark:bg-slate-900/90 rounded-lg p-3 shadow-lg z-10 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <Crosshair className="h-4 w-4 text-orange-600" />
            <p className="text-sm font-medium">
              {t?.distance || "Distance"}: {formatDistance(distance)}
            </p>
          </div>
        </div>
      )}

      {/* Control buttons */}
      <div className="absolute bottom-4 right-4 flex gap-2 z-10">
        <Button size="sm" variant="secondary" onClick={onRefreshLocation} disabled={locationLoading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${locationLoading ? "animate-spin" : ""}`} />
          {t?.refreshLocation || "Refresh Location"}
        </Button>
        <Button size="sm" variant="secondary" onClick={onRefreshDeviceLocation} disabled={deviceLocationLoading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${deviceLocationLoading ? "animate-spin" : ""}`} />
          {t?.refreshDeviceLocation || "Refresh Device"}
        </Button>
        <Button size="sm" variant="secondary" onClick={onViewHistory} disabled={trackingLoading}>
          <History className={`h-4 w-4 mr-1 ${trackingLoading ? "animate-spin" : ""}`} />
          {t?.viewHistory || "View History"}
        </Button>
      </div>
    </div>
  )
}

