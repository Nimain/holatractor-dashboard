"use client"

import { useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw, History, Crosshair } from "lucide-react"

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
  const mapInstanceRef = useRef<any>(null)

  useEffect(() => {
    if (!mapRef.current) return

    // Initialize Leaflet map
    const initMap = async () => {
      try {
        // Dynamically import Leaflet to avoid SSR issues
        const L = (await import("leaflet")).default

        // Fix for default markers in Leaflet
        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
          iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
          shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
        })

        // Default center (will be updated when locations are available)
        const defaultCenter: [number, number] = [20.5937, 78.9629] // Center of India
        const defaultZoom = 5

        // Create map
        const map = L.map(mapRef.current).setView(defaultCenter, defaultZoom)

        // Add OpenStreetMap tiles
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map)

        mapInstanceRef.current = map

        console.log(" Map initialized successfully")
      } catch (error) {
        console.error(" Error initializing map:", error)
      }
    }

    initMap()

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!mapInstanceRef.current) return

    const updateMap = async () => {
      try {
        const L = (await import("leaflet")).default
        const map = mapInstanceRef.current

        // Clear existing markers and layers
        map.eachLayer((layer: any) => {
          if (layer instanceof L.Marker || layer instanceof L.Polyline || layer instanceof L.Circle) {
            map.removeLayer(layer)
          }
        })

        const markers: any[] = []
        const bounds = L.latLngBounds([])

        // Add user location marker
        if (userLocation) {
          const userMarker = L.marker([userLocation.latitude, userLocation.longitude], {
            title: t.yourLocation,
          })
            .addTo(map)
            .bindPopup(
              `<div>
                <strong>${t.yourLocation}</strong><br/>
                ${userLocation.latitude.toFixed(6)}, ${userLocation.longitude.toFixed(6)}<br/>
                ${userLocation.accuracy ? `${t.accuracy} ${userLocation.accuracy.toFixed(0)}m` : ""}
              </div>`,
            )

          // Add accuracy circle
          if (userLocation.accuracy) {
            L.circle([userLocation.latitude, userLocation.longitude], {
              radius: userLocation.accuracy,
              fillColor: "#3b82f6",
              fillOpacity: 0.1,
              color: "#3b82f6",
              weight: 1,
            }).addTo(map)
          }

          markers.push(userMarker)
          bounds.extend([userLocation.latitude, userLocation.longitude])
        }

        // Add device location marker
        if (deviceLocation) {
          const deviceIcon = L.divIcon({
            html: `<div style="background-color: ${isRealTimeTracking ? "#10b981" : "#ef4444"}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
            className: "custom-div-icon",
            iconSize: [16, 16],
            iconAnchor: [8, 8],
          })

          const deviceMarker = L.marker([deviceLocation.latitude, deviceLocation.longitude], {
            icon: deviceIcon,
            title: t.deviceLocationTitle,
          })
            .addTo(map)
            .bindPopup(
              `<div>
                <strong>${t.deviceLocationTitle}</strong><br/>
                ${deviceLocation.latitude.toFixed(6)}, ${deviceLocation.longitude.toFixed(6)}<br/>
                ${new Date(deviceLocation.timestamp).toLocaleString()}<br/>
                ${deviceLocation.speed !== undefined ? `${t.speed}: ${deviceLocation.speed.toFixed(1)} ${t.kmh}` : ""}
              </div>`,
            )

          markers.push(deviceMarker)
          bounds.extend([deviceLocation.latitude, deviceLocation.longitude])
        }

        // Add historical path
        if (historicalLocations.length > 1) {
          const pathCoords = historicalLocations.map((loc) => [loc.latitude, loc.longitude] as [number, number])

          L.polyline(pathCoords, {
            color: "#8b5cf6",
            weight: 3,
            opacity: 0.7,
            dashArray: "5, 5",
          })
            .addTo(map)
            .bindPopup(`<div><strong>Historical Path</strong><br/>${historicalLocations.length} location points</div>`)

          // Add bounds for historical locations
          historicalLocations.forEach((loc) => {
            bounds.extend([loc.latitude, loc.longitude])
          })
        }

        // Fit map to show all markers
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [20, 20] })
        }

        console.log("[v0] Map updated with locations")
      } catch (error) {
        console.error("[v0] Error updating map:", error)
      }
    }

    updateMap()
  }, [userLocation, deviceLocation, historicalLocations, isRealTimeTracking, t])

  const formatDistance = (distance: number): string => {
    if (distance < 1000) {
      return `${Math.round(distance)} ${t.meters}`
    }
    return `${(distance / 1000).toFixed(1)} ${t.kilometers}`
  }

  return (
    <div className="relative w-full h-full">
      {/* Map container */}
      <div ref={mapRef} className="w-full h-full" />

      {/* Loading overlays */}
      {locationLoading && (
        <div className="absolute top-4 left-4 bg-white/90 rounded-lg p-3 shadow-lg">
          <RefreshCw className="h-4 w-4 animate-spin mb-1" />
          <p className="text-xs">{t.gettingLocation}</p>
        </div>
      )}

      {deviceLocationLoading && (
        <div className="absolute top-4 right-4 bg-white/90 rounded-lg p-3 shadow-lg">
          <RefreshCw className="h-4 w-4 animate-spin mb-1" />
          <p className="text-xs">{t.gettingDeviceLocation}</p>
        </div>
      )}

      {/* Distance display */}
      {distance && (
        <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 bg-white/90 rounded-lg p-3 shadow-lg">
          <div className="flex items-center gap-2">
            <Crosshair className="h-4 w-4" />
            <p className="text-sm font-medium">
              {t.distance} {formatDistance(distance)}
            </p>
          </div>
        </div>
      )}

      {/* Control buttons */}
      <div className="absolute bottom-4 right-4 flex gap-2">
        <Button size="sm" variant="secondary" onClick={onRefreshLocation} disabled={locationLoading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${locationLoading ? "animate-spin" : ""}`} />
          {t.refreshLocation}
        </Button>
        <Button size="sm" variant="secondary" onClick={onRefreshDeviceLocation} disabled={deviceLocationLoading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${deviceLocationLoading ? "animate-spin" : ""}`} />
          {t.refreshDeviceLocation}
        </Button>
        <Button size="sm" variant="secondary" onClick={onViewHistory} disabled={trackingLoading}>
          <History className={`h-4 w-4 mr-1 ${trackingLoading ? "animate-spin" : ""}`} />
          {t.viewHistory}
        </Button>
      </div>

      {/* Leaflet CSS */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css"
        integrity="sha512-xodZBNTC5n17Xt2atTPuE1HxjVMSvLVW9ocqUKLsCC5CXdbqCmblAshOMAS6/keqq/sMZMZ19scR4PsZChSR7A=="
        crossOrigin=""
      />
    </div>
  )
}
