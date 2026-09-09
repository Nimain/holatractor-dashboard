"use client"
import React, { useState, useEffect, useMemo, memo, useRef } from "react"
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
  Plus,
  Minus,
  Radio,
  Store,
  User as UserIcon,
  ChevronRight,
  ChevronLeft,
  Check,
  Search,
  RefreshCw,
  Route,
  Navigation,
  MapPin,
  Shield,
  Trash2,
  Play,
  Pause,
  RotateCcw,
  PlayCircle,
  Crosshair,
  ZoomIn,
  ZoomOut,
} from "lucide-react"
import { renderInstance, TractorAIBaseURL } from "@/utils/Axios/RenderInstance"
import { useCookie } from "next-cookie"
import axios from "axios"
import { successMessage, errorMessage } from "@/utils/Toastify/Messages"
import DeviceLocationService, {
  type DeviceLocationData,
  type GeofenceItem,
  DeviceBaseURL,
  GPS_API_KEY,
  deviceLocationInstance as deviceInstance,
} from "@/utils/Axios/DeviceLocationService"
import { getGoogleMapsTractorIcon } from "@/utils/map/tractorIcon"
import { io, type Socket } from "socket.io-client"
import { cleanAndSegmentRoute, haversineMeters, calculateBearing, computePolygonAreaHectares, type TripSegment, type CleanRouteResult } from "@/utils/gps/routeCleaner"

declare global {
  interface Window {
    google: any
  }
}
declare var google: any

declare namespace google {
  namespace maps {
    type Map = any
    type Marker = any
    type Polyline = any
    type LatLng = any
    type Circle = any
    type DirectionsResult = any
    type Icon = any
    type OverlayView = any
    type Size = any
    type Point = any
  }
}

// Google Maps API Key - Replace with your actual API key
const GOOGLE_MAPS_API_KEY = "AIzaSyDjMCI0xj2Q-WTc9J7yWX-Mvh0DBM7oHbg"


interface BaseTractorItem {
  base_tractor_id: string
  name: string
  model: string
  image: string
  hourly_price: number
}

interface TractorOption {
  tractor_store_id: string
  base_tractor_id: string
  name: string
  model: string
  image: string
  hourly_price: number
  has_device: boolean
  current_imei: string | null
}

interface StoreOption {
  store_id: string
  store_name: string
  store_image: string
  tractors: TractorOption[]
}

interface OwnerOption {
  owner_id: string
  user_id?: string
  owner_name: string
  owner_email: string
  owner_mobile?: string
  owner_image: string
  stores: StoreOption[]
}

interface Device {
  id: string
  name: string
  lat: number
  lng: number
  speed?: number
  course?: number
  battery?: number
  lastSeen?: string
  field: string
  status: string
  hasGps?: boolean
  region: string
  country?: string
  countryCode?: string
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

  if (region === "NE") {
    fixedLat = Math.abs(lat)
    fixedLon = Math.abs(lon)
  } else if (region === "SW") {
    fixedLat = -Math.abs(lat)
    fixedLon = -Math.abs(lon)
  }

  return [fixedLat, fixedLon]
}

const parseTimestamp = (val: any): number => {
  if (!val) return 0
  if (typeof val === "number") {
    return val < 1e11 ? val * 1000 : val
  }
  const str = String(val).trim()
  const num = Number(str)
  if (!isNaN(num) && str.length >= 10 && !str.includes("-") && !str.includes(":")) {
    return num < 1e11 ? num * 1000 : num
  }
  const parsed = new Date(str).getTime()
  return isNaN(parsed) ? 0 : parsed
}

const parsePointTime = (p: DeviceLocationData): number => {
  return (p as any)._timeMs || parseTimestamp(p.timestamp || (p as any).created_at || (p as any).time || (p as any).datetime)
}

const normalizeHistoryPoints = (points: DeviceLocationData[]): (DeviceLocationData & { _timeMs: number })[] => {
  if (!Array.isArray(points)) return []
  return points.map((p) => {
    const timeMs = (p as any)._timeMs || parsePointTime(p)
    return { ...p, _timeMs: timeMs }
  })
}

// Instant in-memory time range filtering across GPS history (0 ms latency)
const filterHistoryByRange = (
  points: DeviceLocationData[],
  filterVal: string,
  startD?: string,
  endD?: string
): DeviceLocationData[] => {
  if (!Array.isArray(points) || points.length === 0) return []
  if (filterVal === "all") return points

  const now = new Date()
  const nowMs = now.getTime()

  // Find latest recorded timestamp in the dataset
  let latestTimestamp = 0
  for (let i = 0; i < points.length; i++) {
    const t = (points[i] as any)._timeMs || parsePointTime(points[i])
    if (t > latestTimestamp) latestTimestamp = t
  }

  const anchorTime = latestTimestamp > 0 ? latestTimestamp : nowMs
  const anchorDate = new Date(anchorTime)

  if (filterVal === "today") {
    // 1. Try actual calendar today
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).getTime()
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime()
    const liveToday: DeviceLocationData[] = []
    for (let i = 0; i < points.length; i++) {
      const t = (points[i] as any)._timeMs || parsePointTime(points[i])
      if (t >= todayStart && t <= todayEnd) liveToday.push(points[i])
    }
    if (liveToday.length > 0) return liveToday

    // 2. Or points within last 24 hours
    const last24h = nowMs - 24 * 60 * 60 * 1000
    const live24h: DeviceLocationData[] = []
    for (let i = 0; i < points.length; i++) {
      const t = (points[i] as any)._timeMs || parsePointTime(points[i])
      if (t >= last24h) live24h.push(points[i])
    }
    if (live24h.length > 0) return live24h

    // 3. Fallback: Latest active calendar day of activity
    const anchorStart = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), anchorDate.getDate(), 0, 0, 0).getTime()
    const anchorEnd = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), anchorDate.getDate(), 23, 59, 59, 999).getTime()
    const anchorDayPoints: DeviceLocationData[] = []
    for (let i = 0; i < points.length; i++) {
      const t = (points[i] as any)._timeMs || parsePointTime(points[i])
      if (t >= anchorStart && t <= anchorEnd) anchorDayPoints.push(points[i])
    }
    return anchorDayPoints.length > 0 ? anchorDayPoints : points.slice(-300)
  }

  if (filterVal === "yesterday") {
    // 1. Try actual calendar yesterday
    const yest = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
    const yestStart = new Date(yest.getFullYear(), yest.getMonth(), yest.getDate(), 0, 0, 0).getTime()
    const yestEnd = new Date(yest.getFullYear(), yest.getMonth(), yest.getDate(), 23, 59, 59, 999).getTime()
    const liveYest: DeviceLocationData[] = []
    for (let i = 0; i < points.length; i++) {
      const t = (points[i] as any)._timeMs || parsePointTime(points[i])
      if (t >= yestStart && t <= yestEnd) liveYest.push(points[i])
    }
    if (liveYest.length > 0) return liveYest

    // 2. Day before latest active calendar day
    const prevAnchor = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), anchorDate.getDate() - 1)
    const prevStart = new Date(prevAnchor.getFullYear(), prevAnchor.getMonth(), prevAnchor.getDate(), 0, 0, 0).getTime()
    const prevEnd = new Date(prevAnchor.getFullYear(), prevAnchor.getMonth(), prevAnchor.getDate(), 23, 59, 59, 999).getTime()
    const prevDayPoints: DeviceLocationData[] = []
    for (let i = 0; i < points.length; i++) {
      const t = (points[i] as any)._timeMs || parsePointTime(points[i])
      if (t >= prevStart && t <= prevEnd) prevDayPoints.push(points[i])
    }
    return prevDayPoints.length > 0 ? prevDayPoints : points.slice(-150)
  }

  if (filterVal === "week") {
    // Last 7 days
    const weekStartNow = nowMs - 7 * 24 * 60 * 60 * 1000
    const liveWeek: DeviceLocationData[] = []
    for (let i = 0; i < points.length; i++) {
      const t = (points[i] as any)._timeMs || parsePointTime(points[i])
      if (t >= weekStartNow) liveWeek.push(points[i])
    }
    if (liveWeek.length > 0) return liveWeek

    const anchorWeekStart = anchorTime - 7 * 24 * 60 * 60 * 1000
    const anchorWeek: DeviceLocationData[] = []
    for (let i = 0; i < points.length; i++) {
      const t = (points[i] as any)._timeMs || parsePointTime(points[i])
      if (t >= anchorWeekStart) anchorWeek.push(points[i])
    }
    return anchorWeek.length > 0 ? anchorWeek : points.slice(-600)
  }

  if (filterVal === "month") {
    // Last 30 days
    const monthStartNow = nowMs - 30 * 24 * 60 * 60 * 1000
    const liveMonth: DeviceLocationData[] = []
    for (let i = 0; i < points.length; i++) {
      const t = (points[i] as any)._timeMs || parsePointTime(points[i])
      if (t >= monthStartNow) liveMonth.push(points[i])
    }
    if (liveMonth.length > 0) return liveMonth

    const anchorMonthStart = anchorTime - 30 * 24 * 60 * 60 * 1000
    const anchorMonth: DeviceLocationData[] = []
    for (let i = 0; i < points.length; i++) {
      const t = (points[i] as any)._timeMs || parsePointTime(points[i])
      if (t >= anchorMonthStart) anchorMonth.push(points[i])
    }
    return anchorMonth.length > 0 ? anchorMonth : points
  }

  if (filterVal === "custom" && startD && endD) {
    const sTime = new Date(`${startD}T00:00:00`).getTime()
    const eTime = new Date(`${endD}T23:59:59.999`).getTime()
    const customPoints: DeviceLocationData[] = []
    for (let i = 0; i < points.length; i++) {
      const t = (points[i] as any)._timeMs || parsePointTime(points[i])
      if (t >= sTime && t <= eTime) customPoints.push(points[i])
    }
    return customPoints
  }

  return points
}

// Load Google Maps Script
const loadGoogleMapsScript = (callback: () => void) => {
  if (typeof window !== 'undefined' && window.google?.maps?.Map) {
    callback()
    return
  }

  const existingScript = document.getElementById('google-maps-script')
  if (existingScript) {
    const checkInterval = setInterval(() => {
      if (typeof window !== 'undefined' && window.google?.maps?.Map) {
        clearInterval(checkInterval)
        callback()
      }
    }, 100)
    existingScript.addEventListener('load', () => {
      if (typeof window !== 'undefined' && window.google?.maps?.Map) {
        clearInterval(checkInterval)
        callback()
      }
    })
    return
  }

  const script = document.createElement('script')
  script.id = 'google-maps-script'
  script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=geometry`
  script.async = true
  script.defer = true
  script.addEventListener('load', () => {
    if (typeof window !== 'undefined' && window.google?.maps?.Map) {
      callback()
    }
  })
  document.head.appendChild(script)
}

// ─── Fast Convex Hull (Andrew's Monotone Chain O(N log N)) ──────────────────
// Efficiently computes the outermost boundary polygon of the operating field.
const computeConvexHull = (pts: { lat: number; lng: number }[]): { lat: number; lng: number }[] => {
  const n = pts.length
  if (n < 3) return pts

  // 1. Fast O(N) deduplication & quantization to eliminate redundant tight points
  const seen = new Set<string>()
  const unique: { lat: number; lng: number }[] = []
  for (let i = 0; i < n; i++) {
    const key = `${pts[i].lat.toFixed(6)},${pts[i].lng.toFixed(6)}`
    if (!seen.has(key)) {
      seen.add(key)
      unique.push(pts[i])
    }
  }
  if (unique.length < 3) return unique

  // 2. Sort points by latitude, then longitude: O(N log N)
  unique.sort((a, b) => (a.lat === b.lat ? a.lng - b.lng : a.lat - b.lat))

  // Cross product of vectors OA and OB (returns > 0 for counter-clockwise turn)
  const cross = (o: { lat: number; lng: number }, a: { lat: number; lng: number }, b: { lat: number; lng: number }) =>
    (a.lng - o.lng) * (b.lat - o.lat) - (a.lat - o.lat) * (b.lng - o.lng)

  // 3. Build lower hull
  const lower: { lat: number; lng: number }[] = []
  for (let i = 0; i < unique.length; i++) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], unique[i]) <= 0) {
      lower.pop()
    }
    lower.push(unique[i])
  }

  // 4. Build upper hull
  const upper: { lat: number; lng: number }[] = []
  for (let i = unique.length - 1; i >= 0; i--) {
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], unique[i]) <= 0) {
      upper.pop()
    }
    upper.push(unique[i])
  }

  // Remove duplicate last elements
  lower.pop()
  upper.pop()

  return lower.concat(upper)
}

// Extract only points belonging to the actual operating field (excluding long transit roads)
const getFieldOperatingPoints = (pts: { lat: number; lng: number }[]): { lat: number; lng: number }[] => {
  if (pts.length < 6) return pts

  const threshold = 0.0025 // ~250m spatial cluster window
  const counts = new Int32Array(pts.length)

  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 1; j < pts.length; j++) {
      const dLat = Math.abs(pts[i].lat - pts[j].lat)
      const dLng = Math.abs(pts[i].lng - pts[j].lng)
      if (dLat < threshold && dLng < threshold) {
        counts[i]++
        counts[j]++
      }
    }
  }

  // Operating field points have repeated passes (> 3 neighbors within 250m)
  const fieldPts = pts.filter((_, idx) => counts[idx] >= 3)
  return fieldPts.length >= 3 ? fieldPts : pts
}
// ─────────────────────────────────────────────────────────────────────────────


export default function DeviceSection() {
  const [selectedTractor, setSelectedTractor] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false)
  const [devices, setDevices] = useState<Device[]>([])
  const devicesRef = useRef<Device[]>(devices)
  useEffect(() => {
    devicesRef.current = devices
  }, [devices])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 40.7128, lng: -74.006 })
  const [mapsLoaded, setMapsLoaded] = useState<boolean>(false)

  // Real-time tracking & socket state
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isSocketConnected, setIsSocketConnected] = useState<boolean>(false)
  const [livePacketCount, setLivePacketCount] = useState<number>(0)
  const [liveTrails, setLiveTrails] = useState<Record<string, { lat: number; lng: number }[]>>({})
  const livePolylineRef = useRef<google.maps.Polyline | null>(null)
  const [pinging, setPinging] = useState<boolean>(false)

  // Route history, filter, and map style state on main map
  const [selectedFilter, setSelectedFilter] = useState<string>("today")
  const [selectedTripId, setSelectedTripId] = useState<string>("all")
  const [customStartDate, setCustomStartDate] = useState<string>(DeviceLocationService.getTodayDate())
  const [customEndDate, setCustomEndDate] = useState<string>(DeviceLocationService.getTodayDate())
  const [motionFilter, setMotionFilter] = useState<"all" | "moving" | "stopped">("all")
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false)
  const [showRoutePath, setShowRoutePath] = useState<boolean>(true)
  const [mapType, setMapType] = useState<string>("hybrid")
  const [historyLoading, setHistoryLoading] = useState<boolean>(false)
  const [rawHistoryPoints, setRawHistoryPoints] = useState<DeviceLocationData[]>([])
  const deviceHistoryCacheRef = useRef<Record<string, DeviceLocationData[]>>({})
  const masterHistoryPoolRef = useRef<Record<string, (DeviceLocationData & { _timeMs: number })[]>>({})

  // Instant authoritative points for the selected range (0 ms latency!)
  const historyLocations = useMemo(() => {
    if (selectedFilter === "custom") {
      return filterHistoryByRange(rawHistoryPoints, "custom", customStartDate, customEndDate)
    }
    return rawHistoryPoints
  }, [rawHistoryPoints, selectedFilter, customStartDate, customEndDate])

  const [showOnlySelectedTractor, setShowOnlySelectedTractor] = useState<boolean>(true)
  const [selectedCountry, setSelectedCountry] = useState<string>("ALL")

  // Filter devices list based on selected country
  const visibleDevices = useMemo(() => {
    if (selectedCountry === "ALL") return devices
    return devices.filter((d) => (d.countryCode || "BO") === selectedCountry)
  }, [devices, selectedCountry])
  const historyPolylineRef = useRef<any>(null)
  const historyPolylinesRef = useRef<any[]>([])
  const startMarkerRef = useRef<any>(null)
  const endMarkerRef = useRef<any>(null)
  const waypointMarkersRef = useRef<any[]>([])
  const fieldPolygonRef = useRef<any>(null) // Operating field area boundary polygon

  // Live Movement Animation & Simulation states
  const [isSimulating, setIsSimulating] = useState<boolean>(false)
  const [simulationSpeed, setSimulationSpeed] = useState<number>(2)
  const simulationIndexRef = useRef<number>(0)
  const simulationTimerRef = useRef<any>(null)
  const markerAnimationFramesRef = useRef<Record<string, number>>({})
  const roadRouteCacheRef = useRef<Map<string, { lat: number; lng: number }[]>>(new Map())
  const activeRoadLineRef = useRef<google.maps.Polyline | null>(null)

  // Geofence management state
  const [geofences, setGeofences] = useState<GeofenceItem[]>([])
  const [showGeofences, setShowGeofences] = useState<boolean>(true)
  const [showGeofenceModal, setShowGeofenceModal] = useState<boolean>(false)
  const [newGeofenceName, setNewGeofenceName] = useState<string>("")
  const [newGeofenceRadius, setNewGeofenceRadius] = useState<number>(500)
  const [newGeofenceAlert, setNewGeofenceAlert] = useState<"ENTER" | "EXIT" | "BOTH">("BOTH")
  const [creatingGeofence, setCreatingGeofence] = useState<boolean>(false)
  const geofenceCirclesRef = useRef<google.maps.Circle[]>([])
  const geofenceMarkersRef = useRef<google.maps.Marker[]>([])


  // Filter history points based on motion filter
  const displayHistoryLocations = useMemo(() => {
    if (!Array.isArray(historyLocations)) return []
    if (motionFilter === "moving") {
      return historyLocations.filter((p) => Number(p.speed || 0) > 0)
    }
    if (motionFilter === "stopped") {
      return historyLocations.filter((p) => Number(p.speed || 0) === 0)
    }
    return historyLocations
  }, [historyLocations, motionFilter])

  // Run road & field route cleaning, outlier rejection, stationary jitter compression, and trip segmentation
  const selectedDevCountry = useMemo(() => {
    const d = devices.find((x) => x.id === selectedTractor)
    return d?.countryCode || d?.region || ""
  }, [devices, selectedTractor])

  const cleanedRouteResult = useMemo(() => {
    if (!selectedTractor || displayHistoryLocations.length === 0) return null
    const isIndia = selectedDevCountry === "IN" || selectedDevCountry === "NE"
    return cleanAndSegmentRoute(displayHistoryLocations, { isIndia })
  }, [displayHistoryLocations, selectedTractor, selectedDevCountry])

  // Calculate live route telemetry analytics for the filtered history
  const routeStats = useMemo(() => {
    if (cleanedRouteResult) {
      const fieldPts = getFieldOperatingPoints(
        cleanedRouteResult.workingFieldPoints && cleanedRouteResult.workingFieldPoints.length >= 3
          ? cleanedRouteResult.workingFieldPoints
          : cleanedRouteResult.allCleanPoints.map((p) => ({ lat: p.lat, lng: p.lng }))
      )
      const hull = fieldPts.length >= 3 ? computeConvexHull(fieldPts) : []
      const polygonArea = hull.length >= 3 ? computePolygonAreaHectares(hull) : 0
      const calculatedArea =
        polygonArea > 0 ? polygonArea : Number((cleanedRouteResult.totalDistanceKm * 0.3).toFixed(1))

      return {
        distanceKm: cleanedRouteResult.totalDistanceKm,
        maxSpeed: cleanedRouteResult.maxSpeedKmH,
        avgSpeed: cleanedRouteResult.avgSpeedKmH,
        count: cleanedRouteResult.allCleanPoints.length,
        movingPoints: cleanedRouteResult.movingPointsCount,
        stoppedPoints: cleanedRouteResult.stoppedPointsCount,
        tripsCount: cleanedRouteResult.trips.length,
        stopsCount: cleanedRouteResult.stopsCount,
        outliersDropped: cleanedRouteResult.outliersDropped,
        workedAreaHa: calculatedArea,
      }
    }
    return {
      distanceKm: 0,
      maxSpeed: 0,
      avgSpeed: 0,
      count: 0,
      movingPoints: 0,
      stoppedPoints: 0,
      tripsCount: 0,
      stopsCount: 0,
      outliersDropped: 0,
      workedAreaHa: 0,
    }
  }, [cleanedRouteResult])


  // Add Device Stepped Modal states
  const [showAddDeviceModal, setShowAddDeviceModal] = useState<boolean>(false)
  const [addStep, setAddStep] = useState<number>(1)
  const [deviceOptions, setDeviceOptions] = useState<OwnerOption[]>([])
  const [availableBaseTractors, setAvailableBaseTractors] = useState<BaseTractorItem[]>([])
  const [optionsLoading, setOptionsLoading] = useState<boolean>(false)
  const [loadingMoreOwners, setLoadingMoreOwners] = useState<boolean>(false)
  const [ownerPage, setOwnerPage] = useState<number>(1)
  const [totalOwnersCount, setTotalOwnersCount] = useState<number>(0)
  const [hasMoreOwners, setHasMoreOwners] = useState<boolean>(false)

  const [selectedOwner, setSelectedOwner] = useState<OwnerOption | null>(null)
  const [selectedStore, setSelectedStore] = useState<StoreOption | null>(null)
  const [selectedTractorForDevice, setSelectedTractorForDevice] = useState<TractorOption | null>(null)
  const [ownerSearchTerm, setOwnerSearchTerm] = useState<string>("")
  const [tractorSearchTerm, setTractorSearchTerm] = useState<string>("")
  const [deviceImei, setDeviceImei] = useState<string>("")
  const [deviceName, setDeviceName] = useState<string>("")
  const [deviceRegion, setDeviceRegion] = useState<string>("SW")
  const [submittingDevice, setSubmittingDevice] = useState<boolean>(false)
  const [deviceSubmitError, setDeviceSubmitError] = useState<string | null>(null)

  // Filtered Tractors in the selected store for Step 3 in Add Device Modal
  const filteredStoreTractors = useMemo(() => {
    if (!selectedStore?.tractors) return []
    if (!tractorSearchTerm.trim()) return selectedStore.tractors
    const term = tractorSearchTerm.toLowerCase().trim()
    return selectedStore.tractors.filter((t) =>
      (t.name && t.name.toLowerCase().includes(term)) ||
      (t.model && t.model.toLowerCase().includes(term)) ||
      (t.current_imei && t.current_imei.toLowerCase().includes(term)) ||
      (t.base_tractor_id && t.base_tractor_id.toLowerCase().includes(term)) ||
      (t.tractor_store_id && t.tractor_store_id.toLowerCase().includes(term)) ||
      (t.hourly_price && String(t.hourly_price).includes(term))
    )
  }, [selectedStore?.tractors, tractorSearchTerm])


  // Inline Quick Store Creation states
  const [showCreateStoreModal, setShowCreateStoreModal] = useState<boolean>(false)
  const [newStoreName, setNewStoreName] = useState<string>("")
  const [newStoreDescription, setNewStoreDescription] = useState<string>("")
  const [newStoreImage, setNewStoreImage] = useState<string>("")
  const [creatingStore, setCreatingStore] = useState<boolean>(false)
  const [createStoreError, setCreateStoreError] = useState<string | null>(null)

  // Inline Quick Add Tractor states
  const [showAddTractorModal, setShowAddTractorModal] = useState<boolean>(false)
  const [catalogTractorSearchTerm, setCatalogTractorSearchTerm] = useState<string>("")
  const [selectedBaseTractorId, setSelectedBaseTractorId] = useState<string>("")
  const [newTractorHourlyPrice, setNewTractorHourlyPrice] = useState<number>(20)
  const [creatingTractor, setCreatingTractor] = useState<boolean>(false)
  const [createTractorError, setCreateTractorError] = useState<string | null>(null)

  // Filtered Catalog Base Tractors for the Add Tractor to Store modal
  const filteredCatalogTractors = useMemo(() => {
    if (!availableBaseTractors) return []
    if (!catalogTractorSearchTerm.trim()) return availableBaseTractors
    const term = catalogTractorSearchTerm.toLowerCase().trim()
    return availableBaseTractors.filter((bt) =>
      (bt.name && bt.name.toLowerCase().includes(term)) ||
      (bt.model && bt.model.toLowerCase().includes(term)) ||
      (bt.base_tractor_id && bt.base_tractor_id.toLowerCase().includes(term))
    )
  }, [availableBaseTractors, catalogTractorSearchTerm])


  const mapRef = useRef<HTMLDivElement>(null)
  const googleMapRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map())

  const cookie = useCookie()
  const access_token =
    (typeof cookie?.get === "function" ? cookie.get("access_token") : null) ||
    (typeof document !== "undefined"
      ? document.cookie.match(/(?:^|;\s*)access_token=([^;]+)/)?.[1]
      : null) ||
    ""

  // Load Google Maps
  useEffect(() => {
    loadGoogleMapsScript(() => {
      setMapsLoaded(true)
    })
  }, [])

  // Fetch devices and geofences from API and resolve GPS locations from device.holatractor.com
  useEffect(() => {
    fetchDevices()
    fetchGeofences()
    fetchDeviceOptions("", 1, false)
  }, [])


  // Fetch device route history for selected tractor (cached in-memory for instant 0ms time filtering)
  const fetchTractorHistory = async (
    deviceImei: string,
    forceRefresh = false,
    rangeVal = selectedFilter,
    startD = customStartDate,
    endD = customEndDate
  ) => {
    if (!deviceImei) return

    const cacheKey = `${deviceImei}_${rangeVal}_${startD}_${endD}`

    // 1. Instant Cache Hit: Return in-memory cached points immediately! (0 ms latency)
    if (!forceRefresh && deviceHistoryCacheRef.current[cacheKey]?.length > 0) {
      setRawHistoryPoints(deviceHistoryCacheRef.current[cacheKey])
      setHistoryLoading(false)
      return
    }

    // 2. Instant Derivation from Master History Pool (if points exist for this device)
    const pool = masterHistoryPoolRef.current[deviceImei]
    let hasInstantPreview = false
    if (!forceRefresh && pool && pool.length > 0) {
      const derived = filterHistoryByRange(pool, rangeVal, startD, endD)
      if (derived.length > 0) {
        setRawHistoryPoints(derived)
        hasInstantPreview = true
      }
    }

    // If we have no preview or points for this tractor yet, clear stale points from previous tractor
    if (!hasInstantPreview) {
      setRawHistoryPoints([])
    }

    setHistoryLoading(true)
    try {
      const dev = devicesRef.current.find((d) => d.id === deviceImei) || devices.find((d) => d.id === deviceImei)
      const devRegion = dev?.region || (dev?.countryCode === "IN" ? "NE" : "SW")

      console.log("[Devices Main Map] Fast-fetching route history for:", deviceImei, "Range:", rangeVal)

      let historyData = await DeviceLocationService.getDeviceLocationHistory(
        deviceImei,
        {
          range: rangeVal,
          start_date: rangeVal === "custom" ? startD : undefined,
          end_date: rangeVal === "custom" ? endD : undefined,
        },
        devRegion
      )

      // Fallback: If range query returned 0 points (e.g. tractor wasn't driven today),
      // seamlessly fetch all history so the pool is populated and latest activity displays!
      if ((!historyData || historyData.length === 0) && rangeVal !== "all" && rangeVal !== "custom") {
        console.log(`[Devices Main Map] No points for ${rangeVal}, fetching all history fallback for ${deviceImei}...`)
        try {
          const allHistory = await DeviceLocationService.getDeviceLocationHistory(
            deviceImei,
            { range: "all" },
            devRegion
          )
          if (Array.isArray(allHistory) && allHistory.length > 0) {
            historyData = allHistory
          }
        } catch (e) {
          console.warn("[Devices Main Map] Fallback allHistory failed:", e)
        }
      }

      const points = normalizeHistoryPoints(historyData || [])

      // Merge into master pool for instant local filtering on other ranges
      if (points.length > 0) {
        const existing = masterHistoryPoolRef.current[deviceImei] || []
        const pMap = new Map<string, DeviceLocationData & { _timeMs: number }>()
        for (const p of existing) {
          const lngVal = p.lon ?? (p as any).lng ?? p.longitude ?? 0
          pMap.set(`${p._timeMs}_${Number(p.lat).toFixed(5)}_${Number(lngVal).toFixed(5)}`, p)
        }
        for (const p of points) {
          const lngVal = p.lon ?? (p as any).lng ?? p.longitude ?? 0
          pMap.set(`${p._timeMs}_${Number(p.lat).toFixed(5)}_${Number(lngVal).toFixed(5)}`, p)
        }
        const fullPool = Array.from(pMap.values()).sort((a, b) => a._timeMs - b._timeMs)
        masterHistoryPoolRef.current[deviceImei] = fullPool

        // Filter by the requested range (e.g. "today" will intelligently extract the latest active operational day!)
        const filtered = filterHistoryByRange(fullPool, rangeVal, startD, endD)
        const toDisplay = filtered.length > 0 ? filtered : points
        deviceHistoryCacheRef.current[cacheKey] = toDisplay
        setRawHistoryPoints(toDisplay)
      } else {
        deviceHistoryCacheRef.current[cacheKey] = []
        setRawHistoryPoints([])
      }
    } catch (err) {
      console.warn("[Devices Main Map] Error loading route history:", err)
      if (!hasInstantPreview) {
        setRawHistoryPoints([])
      }
    } finally {
      setHistoryLoading(false)
    }
  }

  // Alias for manual refreshes / pings
  const loadMainMapRoute = async (deviceImei: string, filterVal?: string, startD?: string, endD?: string) => {
    return fetchTractorHistory(deviceImei, true, filterVal || selectedFilter, startD || customStartDate, endD || customEndDate)
  }

  // Load route history when selected tractor changes OR filter changes
  useEffect(() => {
    if (selectedTractor) {
      setSelectedTripId("all")
      fetchTractorHistory(selectedTractor, false, selectedFilter)
    } else {
      setRawHistoryPoints([])
    }
  }, [selectedTractor, selectedFilter, customStartDate, customEndDate])


  // Google Maps Directions Service Route Snapping (tractor motion always on the road)
  const fetchRoadRoute = async (
    fromPos: { lat: number; lng: number },
    toPos: { lat: number; lng: number }
  ): Promise<{ lat: number; lng: number }[]> => {
    const dist = haversineMeters(fromPos.lat, fromPos.lng, toPos.lat, toPos.lng)
    // If points are very close (< 12m), segment is already on road
    if (dist < 12 || typeof window === "undefined" || !window.google?.maps?.DirectionsService) {
      return [fromPos, toPos]
    }

    const cacheKey = `${fromPos.lat.toFixed(5)},${fromPos.lng.toFixed(5)}->${toPos.lat.toFixed(5)},${toPos.lng.toFixed(5)}`
    if (roadRouteCacheRef.current.has(cacheKey)) {
      return roadRouteCacheRef.current.get(cacheKey)!
    }

    try {
      const directionsService = new window.google.maps.DirectionsService()
      const res = await new Promise<any>((resolve) => {
        directionsService.route(
          {
            origin: new window.google.maps.LatLng(fromPos.lat, fromPos.lng),
            destination: new window.google.maps.LatLng(toPos.lat, toPos.lng),
            travelMode: window.google.maps.TravelMode.DRIVING,
          },
          (result: any, status: any) => {
            if (status === window.google.maps.DirectionsStatus.OK && result) {
              resolve(result)
            } else {
              resolve(null)
            }
          }
        )
      })

      if (res && res.routes?.[0]) {
        const route = res.routes[0]
        const roadPoints: { lat: number; lng: number }[] = []
        const steps = route.legs?.[0]?.steps
        if (steps && steps.length > 0) {
          steps.forEach((step: any) => {
            const pts = step.lat_lngs || step.path || []
            pts.forEach((p: any) => {
              const lat = typeof p.lat === "function" ? p.lat() : p.lat
              const lng = typeof p.lng === "function" ? p.lng() : p.lng
              if (typeof lat === "number" && typeof lng === "number" && !isNaN(lat) && !isNaN(lng)) {
                roadPoints.push({ lat, lng })
              }
            })
          })
        }
        if (roadPoints.length === 0 && route.overview_path) {
          route.overview_path.forEach((p: any) => {
            const lat = typeof p.lat === "function" ? p.lat() : p.lat
            const lng = typeof p.lng === "function" ? p.lng() : p.lng
            if (typeof lat === "number" && typeof lng === "number" && !isNaN(lat) && !isNaN(lng)) {
              roadPoints.push({ lat, lng })
            }
          })
        }

        if (roadPoints.length >= 2) {
          const clean: { lat: number; lng: number }[] = [roadPoints[0]]
          for (let i = 1; i < roadPoints.length; i++) {
            const prev = clean[clean.length - 1]
            if (haversineMeters(prev.lat, prev.lng, roadPoints[i].lat, roadPoints[i].lng) >= 1.5) {
              clean.push(roadPoints[i])
            }
          }
          roadRouteCacheRef.current.set(cacheKey, clean)
          return clean
        }
      }
    } catch (err) {
      console.warn("[Devices] DirectionsService road snap error:", err)
    }

    const fallback = [fromPos, toPos]
    roadRouteCacheRef.current.set(cacheKey, fallback)
    return fallback
  }

  // Smooth Road-Following Marker Animation Engine with Slow-Motion Real Wheel Motion
  const animateMarkerMovement = async (opts: {
    deviceId: string
    fromPos: { lat: number; lng: number }
    toPos: { lat: number; lng: number }
    speed?: number
    course?: number
    durationMs?: number
    snapToRoad?: boolean
    onFinish?: (finalCourse: number) => void
  }) => {
    const { deviceId, fromPos, toPos, speed = 12, course, durationMs, snapToRoad = true, onFinish } = opts
    const marker = markersRef.current.get(deviceId)
    if (!marker || !window.google) {
      onFinish?.(course || 0)
      return
    }

    if (markerAnimationFramesRef.current[deviceId]) {
      cancelAnimationFrame(markerAnimationFramesRef.current[deviceId])
      delete markerAnimationFramesRef.current[deviceId]
    }

    // Retrieve road vertices along the actual road network
    const roadPoints = snapToRoad ? await fetchRoadRoute(fromPos, toPos) : [fromPos, toPos]

    // Compute cumulative distances along the road path
    const segDists: number[] = [0]
    let totalRoadDist = 0
    for (let i = 1; i < roadPoints.length; i++) {
      const d = haversineMeters(roadPoints[i - 1].lat, roadPoints[i - 1].lng, roadPoints[i].lat, roadPoints[i].lng)
      totalRoadDist += d
      segDists.push(totalRoadDist)
    }

    const firstSegmentBearing =
      roadPoints.length >= 2
        ? calculateBearing(roadPoints[0], roadPoints[1])
        : calculateBearing(fromPos, toPos)

    if (totalRoadDist < 0.5) {
      marker.setPosition(new window.google.maps.LatLng(toPos.lat, toPos.lng))
      onFinish?.(firstSegmentBearing)
      return
    }

    // Realistic slow-motion tractor speed: 7.5 - 10.5 km/h (~2.0 - 2.9 m/s)
    const effectiveSpeedKmH = Math.max(6, Math.min(speed > 0 ? speed : 8.5, 11))
    const calculatedDuration = Math.round((totalRoadDist / (effectiveSpeedKmH / 3.6)) * 1000)
    const animDurationMs = durationMs ? Math.max(durationMs, calculatedDuration) : Math.max(3500, calculatedDuration)

    const isSelected = selectedTractor === deviceId

    // Start heading: if course is explicitly passed and non-zero, start from it; otherwise face initial road segment directly
    let currentHeading =
      typeof course === "number" && course !== 0
        ? course
        : firstSegmentBearing

    let lastRenderedCourse = Math.round(currentHeading)
    let lastRenderedSteer = 0

    // Set initial marker icon with rotated heading and slow-motion active rolling wheels
    marker.setIcon(
      getGoogleMapsTractorIcon({
        course: lastRenderedCourse,
        steerAngle: 0,
        isSelected,
        isLive: true,
        isMoving: true,
        status: "Active",
        size: isSelected ? 64 : 48,
      })
    )

    // Render active road trail polyline on map if selected
    if (isSelected && googleMapRef.current && roadPoints.length > 2) {
      if (activeRoadLineRef.current) {
        activeRoadLineRef.current.setMap(null)
      }
      activeRoadLineRef.current = new window.google.maps.Polyline({
        path: roadPoints,
        geodesic: true,
        strokeColor: "#10B981",
        strokeOpacity: 0.85,
        strokeWeight: 4,
        map: googleMapRef.current,
        zIndex: 50,
      })
    }

    const startTime = performance.now()

    function frame(now: number) {
      const elapsed = now - startTime
      const progress = Math.min(1, elapsed / animDurationMs)

      // Natural vehicle motion: smooth start, steady cruising crawl, gentle stop
      let eased = progress
      if (progress < 0.12) {
        eased = (progress / 0.12) * (progress / 0.12) * 0.12
      } else if (progress > 0.88) {
        const p = (1 - progress) / 0.12
        eased = 1 - p * p * 0.12
      }

      const targetDist = totalRoadDist * eased

      // Locate current road segment
      let segIdx = 0
      while (segIdx < roadPoints.length - 2 && segDists[segIdx + 1] < targetDist) {
        segIdx++
      }

      const p1 = roadPoints[segIdx]
      const p2 = roadPoints[segIdx + 1] || p1
      const segSpan = (segDists[segIdx + 1] ?? 0) - segDists[segIdx]
      const segRatio = segSpan > 0 ? Math.max(0, Math.min(1, (targetDist - segDists[segIdx]) / segSpan)) : 0

      const curLat = p1.lat + (p2.lat - p1.lat) * segRatio
      const curLng = p1.lng + (p2.lng - p1.lng) * segRatio

      // Determine road segment heading cleanly (guard against identical points returning 0)
      let targetBearing = currentHeading
      for (let k = segIdx + 1; k < roadPoints.length; k++) {
        if (haversineMeters(p1.lat, p1.lng, roadPoints[k].lat, roadPoints[k].lng) >= 1.0) {
          targetBearing = calculateBearing(p1, roadPoints[k])
          break
        }
      }
      if (segIdx >= roadPoints.length - 2 && roadPoints.length >= 2) {
        const prevP = roadPoints[roadPoints.length - 2]
        const lastP = roadPoints[roadPoints.length - 1]
        if (haversineMeters(prevP.lat, prevP.lng, lastP.lat, lastP.lng) >= 1.0) {
          targetBearing = calculateBearing(prevP, lastP)
        }
      }

      // Shortest angular difference between current heading and target road direction (-180° to +180°)
      const angleDiff = ((targetBearing - currentHeading + 540) % 360) - 180

      // Dynamic rotation step:
      // Turn quickly to align with road (~4° - 6° per frame), smooth out on subtle turns (~2.2° per frame)
      const turnStepRate = Math.max(2.2, Math.min(6.0, Math.abs(angleDiff) * 0.14))
      if (Math.abs(angleDiff) > 0.4) {
        const turnStep = Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), turnStepRate)
        currentHeading = (currentHeading + turnStep + 360) % 360
      } else {
        currentHeading = targetBearing
      }

      // Dynamic steering deflection for front wheels: steer into the turn (-16° to +16°)
      const currentSteer = Math.max(-16, Math.min(16, angleDiff * 0.65))

      const renderedCourse = Math.round(currentHeading)
      const renderedSteer = Math.round(currentSteer)

      const activeMarker = markersRef.current.get(deviceId) || marker

      // Re-render icon smoothly as tractor head rotates towards road direction
      if (renderedCourse !== lastRenderedCourse || renderedSteer !== lastRenderedSteer) {
        lastRenderedCourse = renderedCourse
        lastRenderedSteer = renderedSteer
        activeMarker.setIcon(
          getGoogleMapsTractorIcon({
            course: renderedCourse,
            steerAngle: renderedSteer,
            isSelected,
            isLive: true,
            isMoving: true,
            status: "Active",
            size: isSelected ? 64 : 48,
          })
        )
      }

      if (window.google?.maps) {
        const latLng = new window.google.maps.LatLng(curLat, curLng)
        activeMarker.setPosition(latLng)
        if (isSelected && googleMapRef.current) {
          googleMapRef.current.panTo(latLng)
        }
      }

      if (progress < 1) {
        markerAnimationFramesRef.current[deviceId] = requestAnimationFrame(frame)
      } else {
        delete markerAnimationFramesRef.current[deviceId]
        if (activeRoadLineRef.current) {
          activeRoadLineRef.current.setMap(null)
          activeRoadLineRef.current = null
        }
        if (window.google?.maps) {
          activeMarker.setPosition(new window.google.maps.LatLng(toPos.lat, toPos.lng))
        }
        // When stopped: tractor is Idle, wheels rest straight and stationary, facing final road direction!
        activeMarker.setIcon(
          getGoogleMapsTractorIcon({
            course: lastRenderedCourse,
            steerAngle: 0,
            isSelected,
            isLive: true,
            isMoving: false,
            status: "Idle",
            size: isSelected ? 64 : 48,
          })
        )
        onFinish?.(lastRenderedCourse)
      }
    }

    markerAnimationFramesRef.current[deviceId] = requestAnimationFrame(frame)
  }

  // Socket.IO Real-time Motion Tracking Connection to device.holatractor.com
  useEffect(() => {
    if (devices.length === 0) return

    console.log("[Devices] Connecting to Socket.IO at https://device.holatractor.com for real-time motion tracking...")
    const socketInstance = io("https://device.holatractor.com", {
      transports: ["websocket", "polling"],
      autoConnect: true,
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 20000,
      withCredentials: false,
    })

    socketInstance.on("connect", () => {
      console.log("[Devices] Socket.IO live stream connected successfully")
      setIsSocketConnected(true)
      devices.forEach((d) => {
        if (d.id) {
          socketInstance.emit("join-device", d.id)
        }
      })
    })

    socketInstance.on("disconnect", () => {
      console.log("[Devices] Socket.IO disconnected")
      setIsSocketConnected(false)
    })

    socketInstance.on("connect_error", (err) => {
      console.warn("[Devices] Socket.IO connect error:", err)
    })

    socketInstance.on("location-update", (data: any) => {
      console.log("[Devices] Received live location-update:", data)
      if (!data || !data.imei) return

      setLivePacketCount((prev) => prev + 1)

      setDevices((prevDevices) => {
        const target = prevDevices.find((d) => d.id === data.imei)
        if (!target) return prevDevices

        const [fixedLat, fixedLon] = fixCoordinates(data.lat, data.lon, target.region)
        if (isNaN(fixedLat) || isNaN(fixedLon) || (fixedLat === 0 && fixedLon === 0)) {
          return prevDevices
        }

        const speedVal = typeof data.speed === "number" ? data.speed : Number(data.speed || 0)
        const courseVal = typeof data.course === "number" ? data.course : Number(data.course || 0)
        const batteryVal = data.battery_level || target.battery || 85
        const isMoving = speedVal > 0.5
        const deviceStatus = isMoving ? "Active" : "Idle"

        // Smoothly animate Google Maps marker position and heading rotation
        const marker = markersRef.current.get(data.imei)
        if (marker && window.google) {
          const prevPos = marker.getPosition()
          if (prevPos) {
            const from = { lat: prevPos.lat(), lng: prevPos.lng() }
            const to = { lat: fixedLat, lng: fixedLon }
            const dMeters = haversineMeters(from.lat, from.lng, to.lat, to.lng)

            if (dMeters > 0.8 && isMoving) {
              animateMarkerMovement({
                deviceId: data.imei,
                fromPos: from,
                toPos: to,
                speed: speedVal,
                course: courseVal,
                durationMs: Math.min(2500, Math.max(800, (dMeters / (speedVal / 3.6)) * 1000)),
              })
            } else {
              marker.setPosition(new window.google.maps.LatLng(fixedLat, fixedLon))
              marker.setIcon(
                getGoogleMapsTractorIcon({
                  course: courseVal,
                  isSelected: selectedTractor === data.imei,
                  isLive: true,
                  isMoving: false,
                  status: "Idle",
                  size: selectedTractor === data.imei ? 64 : 48,
                })
              )
            }
          }
        }

        // Update live breadcrumb trail
        setLiveTrails((prevTrails) => {
          const currentTrail = prevTrails[data.imei] || []
          const newTrail = [...currentTrail, { lat: fixedLat, lng: fixedLon }].slice(-60)
          return { ...prevTrails, [data.imei]: newTrail }
        })

        return prevDevices.map((d) =>
          d.id === data.imei
            ? {
                ...d,
                lat: fixedLat,
                lng: fixedLon,
                speed: speedVal,
                course: courseVal,
                battery: batteryVal,
                lastSeen: data.timestamp || data.created_at || new Date().toISOString(),
                status: deviceStatus,
              }
            : d
        )
      })
    })

    setSocket(socketInstance)

    return () => {
      socketInstance.disconnect()
      setSocket(null)
      setIsSocketConnected(false)
    }
  }, [devices.map((d) => d.id).join(",")])

  // Debounced search for high-scale owner list (10,000+ records)
  useEffect(() => {
    if (!showAddDeviceModal) return
    const timer = setTimeout(() => {
      setOwnerPage(1)
      fetchDeviceOptions(ownerSearchTerm, 1, false)
    }, 300)
    return () => clearTimeout(timer)
  }, [ownerSearchTerm, showAddDeviceModal])

  const fetchDeviceOptions = async (searchQuery = "", pageNumber = 1, append = false) => {
    if (append) {
      setLoadingMoreOwners(true)
    } else {
      setOptionsLoading(true)
    }
    try {
      let optionsData: OwnerOption[] = []
      let baseTractorsList: BaseTractorItem[] = []
      let totalCount = 0
      let hasMore = false

      const queryParams = new URLSearchParams()
      if (searchQuery.trim()) queryParams.set("search", searchQuery.trim())
      queryParams.set("page", String(pageNumber))
      queryParams.set("limit", "20")

      // 1. Try local Next.js proxy route /api/devices/options
      let loaded = false
      try {
        const localRes = await axios.get(`/api/devices/options?${queryParams.toString()}`, {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
          timeout: 15000,
        })
        if (localRes.data?.success && Array.isArray(localRes.data?.data)) {
          optionsData = localRes.data.data
          if (Array.isArray(localRes.data.base_tractors)) {
            baseTractorsList = localRes.data.base_tractors
          }
          if (localRes.data.pagination) {
            totalCount = localRes.data.pagination.total || optionsData.length
            hasMore = Boolean(localRes.data.pagination.has_more)
          }
          loaded = true
        }
      } catch (errProxy) {
        console.warn("Local proxy options fallback:", errProxy)
      }

      // 2. Direct FastAPI live /api/v1/admin/devices/options
      if (!loaded) {
        try {
          const fastApiUrl = `${(TractorAIBaseURL || "https://tractorai.sinsignal.com/").replace(/\/$/, "")}/api/v1/admin/devices/options?${queryParams.toString()}`
          const res = await axios.get(fastApiUrl, {
            headers: {
              Authorization: `Bearer ${access_token}`,
            },
            timeout: 15000,
          })
          if (res.data?.success && Array.isArray(res.data?.data)) {
            optionsData = res.data.data
            if (Array.isArray(res.data.base_tractors)) {
              baseTractorsList = res.data.base_tractors
            }
            if (res.data.pagination) {
              totalCount = res.data.pagination.total || optionsData.length
              hasMore = Boolean(res.data.pagination.has_more)
            }
            loaded = true
          }
        } catch (errFast) {
          console.warn("FastAPI device options fallback:", errFast)
        }
      }

      if (baseTractorsList.length > 0) {
        setAvailableBaseTractors(baseTractorsList)
        if (!selectedBaseTractorId) {
          setSelectedBaseTractorId(baseTractorsList[0].base_tractor_id)
        }
      }

      setOwnerPage(pageNumber)
      setTotalOwnersCount(totalCount || optionsData.length)
      setHasMoreOwners(hasMore)

      if (append) {
        setDeviceOptions((prev) => {
          const existingIds = new Set(prev.map((o) => o.owner_id))
          const fresh = optionsData.filter((o) => !existingIds.has(o.owner_id))
          return [...prev, ...fresh]
        })
      } else {
        setDeviceOptions(optionsData)
      }
    } catch (err) {
      console.error("Failed to load device options:", err)
    } finally {
      setOptionsLoading(false)
      setLoadingMoreOwners(false)
    }
  }

  const handleLoadMoreOwners = () => {
    if (hasMoreOwners && !loadingMoreOwners) {
      fetchDeviceOptions(ownerSearchTerm, ownerPage + 1, true)
    }
  }

  const handleOpenAddDevice = () => {
    setShowAddDeviceModal(true)
    setAddStep(1)
    setSelectedOwner(null)
    setSelectedStore(null)
    setSelectedTractorForDevice(null)
    setDeviceImei("")
    setDeviceName("")
    setDeviceRegion("SW")
    setDeviceSubmitError(null)
    setOwnerSearchTerm("")
    setOwnerPage(1)
    setShowCreateStoreModal(false)
    setShowAddTractorModal(false)
    fetchDeviceOptions("", 1, false)
  }

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedOwner) return
    if (!newStoreName.trim()) {
      setCreateStoreError("Please enter a valid store name.")
      return
    }

    setCreatingStore(true)
    setCreateStoreError(null)

    try {
      const payload = {
        owner_id: selectedOwner.owner_id,
        name: newStoreName.trim(),
        description: newStoreDescription.trim() || "Hola Store Unit",
        image: newStoreImage.trim() || "https://images.unsplash.com/photo-1592928302636-c83cf1e1c887?w=600&q=80",
      }

      const res = await axios.post("/api/admin/stores", payload, {
        headers: { Authorization: `Bearer ${access_token}` },
      })

      if (res.data?.success) {
        const createdStore: StoreOption = {
          store_id: res.data.data?.store_id || `store-${Date.now()}`,
          store_name: res.data.data?.store_name || newStoreName.trim(),
          store_image: res.data.data?.store_image || payload.image,
          tractors: [],
        }

        const updatedOwner = {
          ...selectedOwner,
          stores: [createdStore, ...selectedOwner.stores],
        }
        setSelectedOwner(updatedOwner)

        setDeviceOptions((prev) =>
          prev.map((o) => (o.owner_id === selectedOwner.owner_id ? updatedOwner : o))
        )

        setSelectedStore(createdStore)
        setShowCreateStoreModal(false)
        setNewStoreName("")
        setNewStoreDescription("")
        setNewStoreImage("")
        successMessage(`Store "${createdStore.store_name}" created successfully!`)
        setAddStep(3)
      } else {
        throw new Error(res.data?.message || "Failed to create store.")
      }
    } catch (err: any) {
      setCreateStoreError(err?.response?.data?.message || err.message || "Failed to create store.")
    } finally {
      setCreatingStore(false)
    }
  }

  const handleAddTractorToStore = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStore) return
    if (!selectedBaseTractorId) {
      setCreateTractorError("Please select a base tractor model from the catalog.")
      return
    }

    setCreatingTractor(true)
    setCreateTractorError(null)

    try {
      const payload = {
        store_id: selectedStore.store_id,
        base_tractor_id: selectedBaseTractorId,
        hourly_price: Number(newTractorHourlyPrice) || 20.0,
      }

      const res = await axios.post("/api/admin/store-tractors", payload, {
        headers: { Authorization: `Bearer ${access_token}` },
      })

      if (res.data?.success) {
        const createdTractor: TractorOption = {
          tractor_store_id: res.data.data?.tractor_store_id || `tis-${Date.now()}`,
          base_tractor_id: selectedBaseTractorId,
          name: res.data.data?.name || "Tractor Unit",
          model: res.data.data?.model || "Standard",
          image: res.data.data?.image || "",
          hourly_price: Number(newTractorHourlyPrice) || 20.0,
          has_device: false,
          current_imei: null,
        }

        const updatedStore = {
          ...selectedStore,
          tractors: [createdTractor, ...selectedStore.tractors],
        }
        setSelectedStore(updatedStore)

        if (selectedOwner) {
          const updatedOwner = {
            ...selectedOwner,
            stores: selectedOwner.stores.map((s) =>
              s.store_id === selectedStore.store_id ? updatedStore : s
            ),
          }
          setSelectedOwner(updatedOwner)

          setDeviceOptions((prev) =>
            prev.map((o) => (o.owner_id === selectedOwner.owner_id ? updatedOwner : o))
          )
        }

        setSelectedTractorForDevice(createdTractor)
        setShowAddTractorModal(false)
        successMessage(`Tractor "${createdTractor.name}" added to store!`)
        setAddStep(4)
      } else {
        throw new Error(res.data?.message || "Failed to add tractor to store.")
      }
    } catch (err: any) {
      setCreateTractorError(err?.response?.data?.message || err.message || "Failed to add tractor to store.")
    } finally {
      setCreatingTractor(false)
    }
  }

  const handleAddDeviceSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!deviceImei.trim()) {
      setDeviceSubmitError("Please enter a valid Device IMEI number.")
      return
    }
    if (!selectedStore) {
      setDeviceSubmitError("Please select a store.")
      return
    }
    if (!selectedTractorForDevice) {
      setDeviceSubmitError("Please select a tractor to link.")
      return
    }

    setSubmittingDevice(true)
    setDeviceSubmitError(null)

    const payload = {
      owner_id: selectedOwner?.owner_id || undefined,
      store_id: selectedStore.store_id,
      tractor_id: selectedTractorForDevice.tractor_store_id || selectedTractorForDevice.base_tractor_id,
      device_imei: deviceImei.trim(),
      device_name: deviceName.trim() || undefined,
      device_region: deviceRegion,
      device_type: "tractor",
    }

    try {
      let created = false

      // 1. Try local proxy /api/devices
      try {
        const localRes = await axios.post("/api/devices", payload, {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
          timeout: 7000,
        })
        if (localRes.status === 200 || localRes.status === 201) {
          created = true
        }
      } catch (localErr: any) {
        if (localErr.response?.data?.detail) {
          setDeviceSubmitError(localErr.response.data.detail)
          setSubmittingDevice(false)
          return
        }
      }

      // 2. Direct FastAPI Admin endpoint fallback
      if (!created) {
        try {
          const fastApiUrl = `${(TractorAIBaseURL || "https://tractorai.sinsignal.com/").replace(/\/$/, "")}/api/v1/admin/devices`
          const res = await axios.post(fastApiUrl, payload, {
            headers: {
              Authorization: `Bearer ${access_token}`,
            },
            timeout: 7000,
          })
          if (res.status === 200 || res.status === 201) {
            created = true
          }
        } catch (fastErr: any) {
          if (fastErr.response?.data?.detail) {
            setDeviceSubmitError(fastErr.response.data.detail)
            setSubmittingDevice(false)
            return
          }
        }
      }

      // 3. Fallback to renderInstance /store/addDevicetoTractor
      if (!created) {
        try {
          await renderInstance.post(
            "/store/addDevicetoTractor",
            {
              device_id: deviceImei.trim(),
              tractor_store_id: selectedTractorForDevice.tractor_store_id,
              device_region: deviceRegion,
            },
            {
              headers: {
                Authorization: `Bearer ${access_token}`,
              },
            }
          )
          created = true
        } catch (renderErr: any) {
          const msg = renderErr.response?.data?.message || renderErr.message || "Failed to register device"
          setDeviceSubmitError(msg)
          setSubmittingDevice(false)
          return
        }
      }

      successMessage(`Device ${deviceImei} successfully linked to ${selectedTractorForDevice.name}!`)
      setShowAddDeviceModal(false)
      fetchDevices()
    } catch (err: any) {
      setDeviceSubmitError(err.message || "An unexpected error occurred.")
    } finally {
      setSubmittingDevice(false)
    }
  }

  const filteredOwners = useMemo(() => {
    if (!deviceOptions || !Array.isArray(deviceOptions)) return []
    if (!ownerSearchTerm.trim()) return deviceOptions
    const term = ownerSearchTerm.toLowerCase().trim()
    const cleanDigits = term.replace(/\D/g, "")

    return deviceOptions.filter((o) => {
      const nameMatch = (o?.owner_name || "").toLowerCase().includes(term)
      const emailMatch = (o?.owner_email || "").toLowerCase().includes(term)
      const mob = (o?.owner_mobile || "").toLowerCase()
      const mobDigits = mob.replace(/\D/g, "")
      const mobileMatch = mob.includes(term) || (cleanDigits.length >= 3 && mobDigits.includes(cleanDigits))
      const storeMatch = (o?.stores || []).some((s) => (s?.store_name || "").toLowerCase().includes(term))
      const tractorMatch = (o?.stores || []).some((s) =>
        (s?.tractors || []).some(
          (t) =>
            (t?.name || "").toLowerCase().includes(term) ||
            (t?.model || "").toLowerCase().includes(term) ||
            (t?.current_imei && t.current_imei.toLowerCase().includes(term))
        )
      )
      return nameMatch || emailMatch || mobileMatch || storeMatch || tractorMatch
    })
  }, [deviceOptions, ownerSearchTerm])

  const fetchDevices = async () => {
    try {
      setLoading(true)
      setError(null)

      let rawData: any[] = []

      try {
        const localRes = await axios.get("/api/store/getalluniversaldevices")
        if (Array.isArray(localRes.data) && localRes.data.length > 0) {
          rawData = localRes.data
        } else if (localRes.data?.success && Array.isArray(localRes.data?.data) && localRes.data.data.length > 0) {
          rawData = localRes.data.data
        }
      } catch {}

      if (rawData.length === 0) {
        try {
          const response = await renderInstance.get("/store/getalluniversaldevices", {
            headers: {
              Authorization: `Bearer ${access_token}`,
            },
          })
          if (Array.isArray(response.data) && response.data.length > 0) {
            rawData = response.data
          } else if (response.data?.success && Array.isArray(response.data?.data)) {
            rawData = response.data.data
          }
        } catch {}
      }

      if (rawData.length === 0) {
        try {
          const liveGpsDevices = await DeviceLocationService.getAllDevices()
          if (Array.isArray(liveGpsDevices) && liveGpsDevices.length > 0) {
            rawData = liveGpsDevices.map((d: any, idx: number) => ({
              id: d.imei,
              device_imei: d.imei,
              device_region: "SW",
              base: { status: d.online ? 1 : 0 },
              tractorInStore: {
                hourly_price: 35.0,
                baseTractor: {
                  name: `GPS Tracker Tractor #${idx + 1}`,
                  model: `IMEI: ${d.imei}`,
                  images: [],
                },
                store: {
                  name: "Active Fleet Telemetry",
                  image: "",
                  location: {
                    lat: d.lat ? String(d.lat) : "-17.8230",
                    lan: d.lon ? String(d.lon) : "-63.2026",
                  },
                  owner: {
                    user: {
                      first_name: "Fleet",
                      last_name: "Operations",
                    },
                  },
                },
              },
            }))
          }
        } catch (e) {
          console.warn("[Devices] Fallback to DeviceLocationService.getAllDevices failed:", e)
        }
      }

      if (rawData.length > 0) {
        const transformedDevices: Device[] = rawData.map((device: any) => {
          const tis = device.tractorInStore || device.tractor_store || {}
          const bt = tis.baseTractor || tis.tractor || {}
          const st = tis.store || device.store || {}
          const ownerObj = st.owner?.user || st.user || st.owner || {}

          const rawLat = Number.parseFloat(String(device.lat ?? st.location?.lat ?? "-17.7589"))
          const rawLon = Number.parseFloat(String(device.lng ?? device.lon ?? st.location?.lan ?? "-63.1063"))
          const cleanImei = String(device.device_imei || device.id || "").trim()

          // Dynamic Country & Coordinate Calibration Logic
          const isIndia =
            cleanImei === "0867010070133765" ||
            device.country_code === "IN" ||
            device.country === "India" ||
            (rawLat > 6.0 && rawLon > 68.0 && rawLon < 98.0)

          const calibratedLat = isIndia
            ? Math.abs(rawLat)
            : (rawLat > 0 ? -Math.abs(rawLat) : rawLat)
          const calibratedLon = isIndia
            ? Math.abs(rawLon)
            : (rawLon > 0 ? -Math.abs(rawLon) : rawLon)

          // Peru dynamic applied logic requested by user:
          const isPeru =
            !isIndia &&
            (cleanImei === "0869066066315350" ||
              cleanImei === "0869066066317174" ||
              device.country_code === "PE" ||
              device.country === "Peru" ||
              (-11.0 < calibratedLat && calibratedLat < -3.0 && -80.0 < calibratedLon && calibratedLon < -72.0))

          const cName = isIndia ? "India" : isPeru ? "Peru" : "Bolivia"
          const cCode = isIndia ? "IN" : isPeru ? "PE" : "BO"
          const region = isIndia ? "NE" : "SW"
          const isOnline = Boolean(device.online || device.base?.status === 1)

          const tImages = bt.images
            ? Array.isArray(bt.images)
              ? bt.images[0]
              : bt.images
            : null

          const ownerNameFormatted =
            `${ownerObj.first_name || ""} ${ownerObj.last_name || ""}`.trim() ||
            ownerObj.name ||
            "Propietario Agrícola"

          return {
            id: String(device.device_imei || device.id),
            name: bt.name || `Tractor IMEI ${device.device_imei || device.id}`,
            lat: isNaN(calibratedLat) || calibratedLat === 0 ? -17.7589 : calibratedLat,
            lng: isNaN(calibratedLon) || calibratedLon === 0 ? -63.1063 : calibratedLon,
            speed: Number(device.speed) || 0,
            course: Number(device.course) || 0,
            battery: device.battery || (isOnline ? 100 : 85),
            lastSeen: device.last_seen || device.updatedAt || new Date().toISOString(),
            field: st.name || (isPeru ? "San Martín Fleet" : "Santa Cruz Fleet"),
            status: isOnline ? "Active" : "Not Connected",
            hasGps: true,
            region: region,
            country: cName,
            countryCode: cCode,
            model: bt.model || "Standard 4WD",
            hourlyPrice: Number(tis.hourly_price) || 35,
            storeImage: st.image || null,
            tractorImage: tImages,
            ownerName: ownerNameFormatted,
          }
        })

        setDevices(transformedDevices)
        if (transformedDevices.length > 0) {
          const firstWithGps = transformedDevices.find((d) => d.lat !== 0 && d.lng !== 0) || transformedDevices[0]
          setSelectedTractor((prev) => {
            if (prev) return prev // Retain user's chosen tractor! Do not overwrite or re-center away!
            setMapCenter({ lat: firstWithGps.lat, lng: firstWithGps.lng })
            if (googleMapRef.current) {
              googleMapRef.current.panTo({ lat: firstWithGps.lat, lng: firstWithGps.lng })
            }
            return firstWithGps.id
          })
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch devices")
    } finally {
      setLoading(false)
    }
  }

  // Fetch all geofences from device.holatractor.com /api/geofences
  const fetchGeofences = async () => {
    try {
      const fences = await DeviceLocationService.getGeofences()
      setGeofences(Array.isArray(fences) ? fences : [])
    } catch (err) {
      console.warn("[Devices] Failed to fetch geofences:", err)
    }
  }

  const handleCreateGeofence = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newGeofenceName.trim()) {
      errorMessage("Please enter a geofence name.")
      return
    }

    const currentDev = getSelectedDevice()
    const centerLat = currentDev && currentDev.lat !== 0 ? currentDev.lat : mapCenter.lat
    const centerLon = currentDev && currentDev.lng !== 0 ? currentDev.lng : mapCenter.lng

    setCreatingGeofence(true)
    try {
      await DeviceLocationService.createGeofence({
        name: newGeofenceName.trim(),
        center_lat: centerLat,
        center_lon: centerLon,
        radius_meters: Number(newGeofenceRadius),
        alert_on: newGeofenceAlert,
        devices: ["all"],
        enabled: true,
      })
      successMessage(`Geofence "${newGeofenceName}" created successfully!`)
      setNewGeofenceName("")
      setShowGeofenceModal(false)
      fetchGeofences()
    } catch (err: any) {
      errorMessage(err?.message || "Failed to create geofence.")
    } finally {
      setCreatingGeofence(false)
    }
  }

  const handleDeleteGeofence = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete geofence "${name}"?`)) return
    try {
      await DeviceLocationService.deleteGeofence(id)
      successMessage(`Geofence "${name}" deleted.`)
      fetchGeofences()
    } catch (err: any) {
      errorMessage("Failed to delete geofence.")
    }
  }


  const handlePingSelectedDevice = async () => {
    const dev = getSelectedDevice()
    if (!dev) return
    setPinging(true)
    try {
      successMessage(`📡 Pinging GPS tracker ${dev.id} (${dev.name})...`)

      // 1. Dispatch GT06 STATUS# ping command to live TCP socket on device.holatractor.com
      try {
        await DeviceLocationService.sendCommand(dev.id, "STATUS#")
      } catch (cmdErr) {
        // Continue to telemetry fetch even if socket command was offline
      }

      // 2. Fetch fresh real-time coordinates and telemetry from /api/device/:imei
      const latest = await DeviceLocationService.getCurrentDeviceLocation(dev.id, dev.region)
      if (latest && latest.lat && latest.lon && latest.lat !== 0 && latest.lon !== 0) {
        const speedVal = Number(latest.speed || 0)
        const isMoving = speedVal > 0.5
        const deviceStatus = isMoving ? "Active" : "Idle"
        const newLat = Number(latest.lat)
        const newLng = Number(latest.lon)

        const marker = markersRef.current.get(dev.id)
        if (marker && window.google) {
          const prevPos = marker.getPosition()
          if (prevPos) {
            const from = { lat: prevPos.lat(), lng: prevPos.lng() }
            const to = { lat: newLat, lng: newLng }
            const dMeters = haversineMeters(from.lat, from.lng, to.lat, to.lng)

            if (dMeters > 0.8 && isMoving) {
              animateMarkerMovement({
                deviceId: dev.id,
                fromPos: from,
                toPos: to,
                speed: speedVal,
                course: latest.course || dev.course,
                durationMs: 1500,
              })
            } else {
              marker.setPosition(new window.google.maps.LatLng(newLat, newLng))
              marker.setIcon(
                getGoogleMapsTractorIcon({
                  course: latest.course || dev.course || 0,
                  isSelected: true,
                  isLive: true,
                  isMoving: false,
                  status: "Idle",
                  size: 64,
                })
              )
            }
          }
        }

        setDevices((prev) =>
          prev.map((d) =>
            d.id === dev.id
              ? {
                  ...d,
                  lat: newLat,
                  lng: newLng,
                  speed: speedVal,
                  course: latest.course || d.course,
                  battery: latest.battery_level || d.battery,
                  lastSeen: latest.timestamp || latest.created_at || new Date().toISOString(),
                  status: deviceStatus,
                  hasGps: true,
                }
              : d
          )
        )
        if (googleMapRef.current) {
          googleMapRef.current.panTo({ lat: newLat, lng: newLng })
          googleMapRef.current.setZoom(17)
        }
        // Refresh route history as well
        loadMainMapRoute(dev.id, selectedFilter, customStartDate, customEndDate)
        if (isMoving) {
          successMessage(`✅ Ping successful: In Motion at ${speedVal.toFixed(1)} km/h • Battery ${latest.battery_level || 85}%`)
        } else {
          successMessage(`✅ Ping successful: Tractor is Idle (Parked) • Battery ${latest.battery_level || 85}% • Lat ${newLat.toFixed(4)}, Lon ${newLng.toFixed(4)}`)
        }
      } else {
        // Device is not responding -> Set state to Idle!
        setDevices((prev) =>
          prev.map((d) => (d.id === dev.id ? { ...d, status: "Idle", hasGps: false, speed: 0 } : d))
        )
        const m = markersRef.current.get(dev.id)
        if (m) {
          m.setIcon(
            getGoogleMapsTractorIcon({
              course: dev.course || 0,
              isSelected: true,
              isLive: false,
              isMoving: false,
              status: "Idle",
              size: 64,
            })
          )
        }
        errorMessage("Device did not respond. Tractor status set to Idle.")
      }
    } catch (err: any) {
      setDevices((prev) =>
        prev.map((d) => (d.id === dev.id ? { ...d, status: "Idle", hasGps: false, speed: 0 } : d))
      )
      errorMessage(err?.message || "Device did not respond. Status set to Idle.")
    } finally {
      setPinging(false)
    }
  }

  // Live Movement Simulation / Route Replay Player
  const startLiveSimulation = () => {
    const dev = getSelectedDevice()
    if (!dev) return

    // Get points to simulate along (selected trip or all clean points)
    const pointsToRun =
      selectedTripId !== "all" && cleanedRouteResult
        ? cleanedRouteResult.trips.find((t) => t.id === selectedTripId)?.points || []
        : cleanedRouteResult?.allCleanPoints || []

    if (pointsToRun.length < 2) {
      errorMessage("Not enough path points available to simulate live movement.")
      return
    }

    setIsSimulating(true)
    simulationIndexRef.current = 0
    successMessage(`🚜 Starting live movement simulation (${pointsToRun.length} waypoints at ${simulationSpeed}x speed)...`)

    // Position marker at start of simulation
    const first = pointsToRun[0]
    const marker = markersRef.current.get(dev.id)
    if (marker && window.google) {
      marker.setPosition(new window.google.maps.LatLng(first.lat, first.lng))
    }
    if (googleMapRef.current) {
      googleMapRef.current.panTo({ lat: first.lat, lng: first.lng })
      googleMapRef.current.setZoom(18)
    }

    const runNextStep = () => {
      const idx = simulationIndexRef.current
      if (idx >= pointsToRun.length - 1) {
        // Finished simulation: settle into Idle!
        setIsSimulating(false)
        const lastPt = pointsToRun[pointsToRun.length - 1]
        setDevices((prev) =>
          prev.map((d) =>
            d.id === dev.id
              ? {
                  ...d,
                  lat: lastPt.lat,
                  lng: lastPt.lng,
                  speed: 0,
                  status: "Idle",
                }
              : d
          )
        )
        const m = markersRef.current.get(dev.id)
        if (m) {
          m.setIcon(
            getGoogleMapsTractorIcon({
              course: lastPt.course || 0,
              isSelected: true,
              isLive: true,
              isMoving: false,
              status: "Idle",
              size: 64,
            })
          )
        }
        successMessage("🏁 Simulation complete. Tractor has stopped and is now Idle.")
        return
      }

      const curr = pointsToRun[idx]
      const next = pointsToRun[idx + 1]
      simulationIndexRef.current = idx + 1

      const dist = haversineMeters(curr.lat, curr.lng, next.lat, next.lng)
      const simSpeedKmH = Math.max(8, next.speed > 0 ? next.speed : 14)
      const stepDuration = Math.max(350, Math.min(2200, (dist / (simSpeedKmH / 3.6)) * 1000 / simulationSpeed))
      const isStopPoint = next.isStop || next.speed <= 0.5
      const currentSpeed = isStopPoint ? 0 : simSpeedKmH
      const stepBearing = next.course || calculateBearing(curr, next)

      setDevices((prev) =>
        prev.map((d) =>
          d.id === dev.id
            ? {
                ...d,
                lat: next.lat,
                lng: next.lng,
                speed: currentSpeed,
                course: stepBearing || d.course,
                status: isStopPoint ? "Idle" : "Active",
              }
            : d
        )
      )

      animateMarkerMovement({
        deviceId: dev.id,
        fromPos: { lat: curr.lat, lng: curr.lng },
        toPos: { lat: next.lat, lng: next.lng },
        speed: currentSpeed,
        course: stepBearing,
        durationMs: stepDuration,
        onFinish: () => {
          if (isStopPoint) {
            // Idle pause at stop
            simulationTimerRef.current = setTimeout(runNextStep, 900 / simulationSpeed)
          } else {
            simulationTimerRef.current = setTimeout(runNextStep, 80)
          }
        },
      })
    }

    runNextStep()
  }

  const stopLiveSimulation = () => {
    setIsSimulating(false)
    if (simulationTimerRef.current) {
      clearTimeout(simulationTimerRef.current)
      simulationTimerRef.current = null
    }
    const dev = getSelectedDevice()
    if (dev) {
      if (markerAnimationFramesRef.current[dev.id]) {
        cancelAnimationFrame(markerAnimationFramesRef.current[dev.id])
        delete markerAnimationFramesRef.current[dev.id]
      }
      setDevices((prev) =>
        prev.map((d) => (d.id === dev.id ? { ...d, speed: 0, status: "Idle" } : d))
      )
      const m = markersRef.current.get(dev.id)
      if (m) {
        m.setIcon(
          getGoogleMapsTractorIcon({
            course: dev.course || 0,
            isSelected: true,
            isLive: true,
            isMoving: false,
            status: "Idle",
            size: 64,
          })
        )
      }
    }
    successMessage("⏹ Simulation paused. Tractor is Idle.")
  }

  // Instant Test Live Move (+50 meters)
  // Road-Snapped Test Live Move (~60-80m forward along the road)
  const handleTestLiveMove = async () => {
    const dev = getSelectedDevice()
    if (!dev) return

    const initialHeading = dev.course || 45
    const headingRad = (initialHeading * Math.PI) / 180
    const dMeters = 75 // advance ~75 meters
    const deltaLat = (dMeters * Math.cos(headingRad)) / 111320
    const deltaLng = (dMeters * Math.sin(headingRad)) / (111320 * Math.cos(dev.lat * (Math.PI / 180)))

    const fromPos = { lat: dev.lat, lng: dev.lng }
    const rawTarget = { lat: dev.lat + deltaLat, lng: dev.lng + deltaLng }

    const roadPoints = await fetchRoadRoute(fromPos, rawTarget)
    const destination = roadPoints[roadPoints.length - 1] || rawTarget
    const moveSpeed = 8.5 // km/h realistic slow motion tractor speed

    const firstSegmentBearing =
      roadPoints.length >= 2
        ? calculateBearing(roadPoints[0], roadPoints[1])
        : calculateBearing(fromPos, destination)

    successMessage(`🚜 Live Road Move: Tractor traveling forward on the road in slow motion (${moveSpeed} km/h)...`)

    setDevices((prev) =>
      prev.map((d) => (d.id === dev.id ? { ...d, speed: moveSpeed, status: "Active", course: firstSegmentBearing } : d))
    )

    animateMarkerMovement({
      deviceId: dev.id,
      fromPos,
      toPos: destination,
      speed: moveSpeed,
      course: dev.course && dev.course !== 0 ? dev.course : firstSegmentBearing,
      snapToRoad: true,
      onFinish: (finalCourse) => {
        setDevices((prev) =>
          prev.map((d) =>
            d.id === dev.id
              ? {
                  ...d,
                  lat: destination.lat,
                  lng: destination.lng,
                  course: finalCourse,
                  speed: 0,
                  status: "Idle",
                }
              : d
          )
        )
        const m = markersRef.current.get(dev.id)
        if (m) {
          m.setIcon(
            getGoogleMapsTractorIcon({
              course: finalCourse,
              isSelected: true,
              isLive: true,
              isMoving: false,
              status: "Idle",
              size: 64,
            })
          )
        }
        successMessage("⏸ Arrived on road. Tractor is now Idle (Parked).")
      },
    })
  }

  // Random Road Point Navigation (Between two responding points randomly on road with turning direction)
  const handleRandomRoadMove = async () => {
    const dev = getSelectedDevice()
    if (!dev) return

    // Pick a random distance (180m - 350m) and random heading (0 - 360 deg)
    const randomAngle = Math.random() * 2 * Math.PI
    const randomDist = 180 + Math.random() * 180 // meters
    const randLat = dev.lat + (randomDist * Math.cos(randomAngle)) / 111320
    const randLng = dev.lng + (randomDist * Math.sin(randomAngle)) / (111320 * Math.cos(dev.lat * (Math.PI / 180)))

    const fromPos = { lat: dev.lat, lng: dev.lng }
    const rawTarget = { lat: randLat, lng: randLng }

    successMessage("🗺️ Calculating road path to random responding point via Google Directions...")

    const roadPoints = await fetchRoadRoute(fromPos, rawTarget)
    if (!roadPoints || roadPoints.length < 2) {
      errorMessage("Could not find a navigable road path to that point. Please try again.")
      return
    }

    const destination = roadPoints[roadPoints.length - 1]
    const moveSpeed = 8.5 // slow motion tractor speed in km/h

    const firstSegmentBearing = calculateBearing(roadPoints[0], roadPoints[1])

    successMessage(`🚜 Random Road Run: Tractor moving forward on the road with slow-motion wheel roll...`)

    setDevices((prev) =>
      prev.map((d) => (d.id === dev.id ? { ...d, speed: moveSpeed, status: "Active", course: firstSegmentBearing } : d))
    )

    animateMarkerMovement({
      deviceId: dev.id,
      fromPos,
      toPos: destination,
      speed: moveSpeed,
      course: dev.course && dev.course !== 0 ? dev.course : firstSegmentBearing,
      snapToRoad: true,
      onFinish: (finalCourse) => {
        setDevices((prev) =>
          prev.map((d) =>
            d.id === dev.id
              ? {
                  ...d,
                  lat: destination.lat,
                  lng: destination.lng,
                  course: finalCourse,
                  speed: 0,
                  status: "Idle",
                }
              : d
          )
        )
        const m = markersRef.current.get(dev.id)
        if (m) {
          m.setIcon(
            getGoogleMapsTractorIcon({
              course: finalCourse,
              isSelected: true,
              isLive: true,
              isMoving: false,
              status: "Idle",
              size: 64,
            })
          )
        }
        successMessage("🏁 Arrived at destination road point. Tractor is now Idle.")
      },
    })
  }


  const toggleFullscreen = () => setIsFullscreen(!isFullscreen)

  const getSelectedDevice = (): Device | undefined => {
    return devices.find((d) => d.id === selectedTractor)
  }

  const handleMarkerClick = (deviceId: string) => {
    setSelectedTractor(deviceId)
    setShowOnlySelectedTractor(true)
    const device = devices.find((d) => d.id === deviceId)
    if (device && googleMapRef.current) {
      googleMapRef.current.panTo({ lat: device.lat, lng: device.lng })
      googleMapRef.current.setZoom(16)
    }
  }

  const handleCountryChange = (countryCode: string) => {
    setSelectedCountry(countryCode)
    const matching =
      countryCode === "ALL"
        ? devices
        : devices.filter((d) => (d.countryCode || "BO") === countryCode)

    if (matching.length > 0 && googleMapRef.current && typeof window !== "undefined" && window.google) {
      if (!selectedTractor || !matching.some((d) => d.id === selectedTractor)) {
        const first = matching.find((d) => d.lat !== 0 && d.lng !== 0) || matching[0]
        if (first) {
          setSelectedTractor(first.id)
        }
      }

      if (countryCode === "BO") {
        googleMapRef.current.panTo({ lat: -17.7833, lng: -63.1821 })
        googleMapRef.current.setZoom(10)
      } else if (countryCode === "PE") {
        googleMapRef.current.panTo({ lat: -6.5080, lng: -76.3495 })
        googleMapRef.current.setZoom(11)
      } else if (countryCode === "IN") {
        googleMapRef.current.panTo({ lat: 21.9367, lng: 86.7440 })
        googleMapRef.current.setZoom(12)
      } else {
        const bounds = new window.google.maps.LatLngBounds()
        matching.forEach((d) => {
          if (d.lat && d.lng && d.lat !== 0 && d.lng !== 0) {
            bounds.extend({ lat: d.lat, lng: d.lng })
          }
        })
        googleMapRef.current.fitBounds(bounds, { top: 80, right: 60, bottom: 80, left: 60 })
      }
    }
  }

  // Initialize Google Map with selected map type (satellite/hybrid/roadmap)
  useEffect(() => {
    if (!mapRef.current || !mapsLoaded || typeof window === "undefined" || !window.google?.maps?.Map) return

    if (!googleMapRef.current) {
      googleMapRef.current = new window.google.maps.Map(mapRef.current, {
        center: mapCenter,
        zoom: 14,
        mapTypeId: mapType,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      })
    }
  }, [mapsLoaded, mapCenter])

  // Sync map type (satellite / hybrid / roadmap) dynamically
  useEffect(() => {
    if (googleMapRef.current) {
      googleMapRef.current.setMapTypeId(mapType)
    }
  }, [mapType])

  // Update markers for all tractors on the map
  useEffect(() => {
    if (!googleMapRef.current || !mapsLoaded || typeof window === "undefined" || !window.google?.maps?.Marker) return

    if (!devices || devices.length === 0) {
      markersRef.current.forEach((marker) => marker.setMap(null))
      markersRef.current.clear()
      return
    }

    // Filter by selected country
    const countryFilteredDevices =
      selectedCountry === "ALL"
        ? devices
        : devices.filter((d) => (d.countryCode || "BO") === selectedCountry)

    // When a tractor is selected and showOnlySelectedTractor is enabled, only show that selected tractor
    const devicesToRender =
      selectedTractor && showOnlySelectedTractor
        ? countryFilteredDevices.filter((d) => d.id === selectedTractor)
        : countryFilteredDevices

    const activeIds = new Set<string>()

    devicesToRender.forEach((dev) => {
      if (!dev.lat || !dev.lng || dev.lat === 0 || dev.lng === 0) return
      activeIds.add(dev.id)

      const isSelected = dev.id === selectedTractor
      const isAnimating = !!markerAnimationFramesRef.current[dev.id]
      const existingMarker = markersRef.current.get(dev.id)

      if (existingMarker) {
        // If marker is actively animating along a road, do not disrupt its real-time frame loop
        if (!isAnimating) {
          existingMarker.setPosition({ lat: dev.lat, lng: dev.lng })
          existingMarker.setIcon(
            getGoogleMapsTractorIcon({
              course: dev.course || 0,
              isSelected,
              isLive: isSocketConnected && isSelected,
              isMoving: (dev.speed || 0) > 0.5,
              status: dev.status,
              size: isSelected ? 64 : 48,
            })
          )
        }
        existingMarker.setZIndex(isSelected ? 200 : 100)
      } else {
        const marker = new window.google.maps.Marker({
          position: { lat: dev.lat, lng: dev.lng },
          map: googleMapRef.current,
          icon: getGoogleMapsTractorIcon({
            course: dev.course || 0,
            isSelected,
            isLive: isSocketConnected && isSelected,
            isMoving: (dev.speed || 0) > 0.5,
            status: dev.status,
            size: isSelected ? 64 : 48,
          }),
          title: `${dev.name} (IMEI: ${dev.id})`,
          zIndex: isSelected ? 200 : 100,
        })

        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="color: #000; padding: 8px; font-family: system-ui, -apple-system, sans-serif; max-width: 220px;">
              ${dev.tractorImage ? `<img src="${dev.tractorImage}" style="width: 100%; height: 90px; object-fit: cover; border-radius: 6px; margin-bottom: 8px;" />` : ""}
              <div style="font-weight: 700; font-size: 14px; color: #0F172A; margin-bottom: 2px;">${dev.name}</div>
              <div style="font-size: 12px; color: #475569; margin-bottom: 4px;">${dev.field}</div>
              <div style="display: flex; gap: 4px; margin-bottom: 6px;">
                <span style="font-size: 10px; font-weight: 600; padding: 2px 6px; border-radius: 4px; background: ${dev.status === "Active" ? "#DCFCE7; color: #166534;" : "#FEF3C7; color: #92400E;"}">${dev.status}</span>
                <span style="font-size: 10px; font-weight: 600; padding: 2px 6px; border-radius: 4px; background: #F1F5F9; color: #475569;">${dev.region}</span>
                <span style="font-size: 10px; font-weight: 600; padding: 2px 6px; border-radius: 4px; background: #E0E7FF; color: #3730A3;">${dev.countryCode === "IN" ? "🇮🇳 India" : dev.countryCode === "PE" ? "🇵🇪 Peru" : "🇧🇴 Bolivia"}</span>
              </div>
              <div style="font-size: 11px; color: #334155; line-height: 1.4;">
                <strong>Speed:</strong> ${(dev.speed || 0).toFixed(1)} km/h<br/>
                <strong>Heading:</strong> ${dev.course || 0}°<br/>
                <strong>Battery:</strong> ${dev.battery || 85}%<br/>
                <span style="font-size: 10px; color: #64748B; font-family: monospace;">Lat: ${dev.lat.toFixed(5)}, Lon: ${dev.lng.toFixed(5)}</span>
              </div>
            </div>
          `,
        })

        marker.addListener("click", () => {
          handleMarkerClick(dev.id)
          infoWindow.open(googleMapRef.current, marker)
        })

        markersRef.current.set(dev.id, marker)
      }
    })

    // Clean up markers that are no longer in devicesToRender
    markersRef.current.forEach((marker, id) => {
      if (!activeIds.has(id)) {
        marker.setMap(null)
        markersRef.current.delete(id)
      }
    })
  }, [devices, mapsLoaded, selectedTractor, isSocketConnected, showOnlySelectedTractor, selectedCountry])

  // Draw Route History Polyline directly on the Main Map for selected tractor
  useEffect(() => {
    if (!googleMapRef.current || !mapsLoaded || !window.google) return

    // Clear previous route polylines and markers
    if (historyPolylineRef.current) {
      historyPolylineRef.current.setMap(null)
      historyPolylineRef.current = null
    }
    historyPolylinesRef.current.forEach((p) => p.setMap(null))
    historyPolylinesRef.current = []

    // Clear previous field-area polygon
    if (fieldPolygonRef.current) {
      fieldPolygonRef.current.setMap(null)
      fieldPolygonRef.current = null
    }

    if (startMarkerRef.current) {
      startMarkerRef.current.setMap(null)
      startMarkerRef.current = null
    }
    if (endMarkerRef.current) {
      endMarkerRef.current.setMap(null)
      endMarkerRef.current = null
    }
    waypointMarkersRef.current.forEach((m) => m.setMap(null))
    waypointMarkersRef.current = []

    if (!selectedTractor) return

    const selectedDev = devicesRef.current.find((d) => d.id === selectedTractor)

    if (!showRoutePath || !cleanedRouteResult || (cleanedRouteResult.trips.length === 0 && cleanedRouteResult.allCleanPoints.length === 0)) {
      // If no route points for this filter, focus on device current position
      if (selectedDev && selectedDev.lat !== 0 && selectedDev.lng !== 0) {
        googleMapRef.current.panTo({ lat: selectedDev.lat, lng: selectedDev.lng })
        googleMapRef.current.setZoom(16)
      }
      return
    }

    const allRenderedCoords: { lat: number; lng: number }[] = []

    if (selectedTripId === "all") {
      // ── Render Each Legitimate Trip Segment Independently ──────────────────
      // Never draw a straight line across separate trips or teleportation gaps!
      // This prevents artificial lines cutting through rivers, valleys, and terrain,
      // and ensures real possible paths along roads and in fields are shown accurately.
      cleanedRouteResult.trips.forEach((trip) => {
        if (trip.path && trip.path.length >= 2) {
          const polyline = new window.google.maps.Polyline({
            path: trip.path,
            geodesic: false,
            strokeColor: "#EF4444",
            strokeOpacity: 0.95,
            strokeWeight: 6,
            map: googleMapRef.current,
            zIndex: 36,
          })
          historyPolylinesRef.current.push(polyline)

          trip.path.forEach((pt) => allRenderedCoords.push(pt))
        } else if (trip.path && trip.path.length === 1) {
          allRenderedCoords.push(trip.path[0])
        }
      })

      // Fallback: If no individual trip had >= 2 points, but continuousPath has points
      if (allRenderedCoords.length === 0 && cleanedRouteResult.continuousPath && cleanedRouteResult.continuousPath.length >= 2) {
        const polyline = new window.google.maps.Polyline({
          path: cleanedRouteResult.continuousPath,
          geodesic: false,
          strokeColor: "#EF4444",
          strokeOpacity: 0.95,
          strokeWeight: 6,
          map: googleMapRef.current,
          zIndex: 36,
        })
        historyPolylinesRef.current.push(polyline)
        cleanedRouteResult.continuousPath.forEach((pt) => allRenderedCoords.push(pt))
      }

      // Final fallback: Draw raw points if cleaner dropped them
      if (allRenderedCoords.length === 0 && displayHistoryLocations && displayHistoryLocations.length >= 2) {
        const rawPath = displayHistoryLocations
          .filter((p) => p.lat && p.lon && !isNaN(Number(p.lat)) && !isNaN(Number(p.lon)))
          .map((p) => ({ lat: Number(p.lat), lng: Number(p.lon) }))
        if (rawPath.length >= 2) {
          const polyline = new window.google.maps.Polyline({
            path: rawPath,
            geodesic: false,
            strokeColor: "#EF4444",
            strokeOpacity: 0.95,
            strokeWeight: 6,
            map: googleMapRef.current,
            zIndex: 36,
          })
          historyPolylinesRef.current.push(polyline)
          rawPath.forEach((pt) => allRenderedCoords.push(pt))
        }
      }
    } else {
      // ── Selected Individual Trip ──────────────────────────────────────────
      const trip = cleanedRouteResult.trips.find((t) => t.id === selectedTripId)
      if (trip && trip.path.length >= 2) {
        const mainPolyline = new window.google.maps.Polyline({
          path: trip.path,
          geodesic: false,
          strokeColor: "#EF4444",
          strokeOpacity: 0.95,
          strokeWeight: 6,
          map: googleMapRef.current,
          zIndex: 36,
        })
        historyPolylinesRef.current.push(mainPolyline)

        trip.path.forEach((pt) => allRenderedCoords.push(pt))
      }
    }

    // Fit map bounds smoothly around clean path
    if (allRenderedCoords.length > 0) {
      const bounds = new window.google.maps.LatLngBounds()
      allRenderedCoords.forEach((p) => bounds.extend(p))

      const ne = bounds.getNorthEast()
      const sw = bounds.getSouthWest()
      const latDiff = Math.abs(ne.lat() - sw.lat())
      const lngDiff = Math.abs(ne.lng() - sw.lng())

      if (allRenderedCoords.length > 1 && (latDiff > 0.0001 || lngDiff > 0.0001)) {
        googleMapRef.current.fitBounds(bounds, { top: 70, right: 50, bottom: 80, left: 50 })
        const listener = window.google.maps.event.addListenerOnce(googleMapRef.current, "idle", () => {
          if (googleMapRef.current && googleMapRef.current.getZoom() > 18) {
            googleMapRef.current.setZoom(18)
          }
        })
      } else {
        googleMapRef.current.panTo(allRenderedCoords[allRenderedCoords.length - 1])
        googleMapRef.current.setZoom(17)
      }
    }

  }, [cleanedRouteResult, selectedTripId, showRoutePath, selectedTractor, mapsLoaded])


  // Draw real-time motion trail for the selected device
  useEffect(() => {
    if (!googleMapRef.current || !window.google || !selectedTractor) return

    const trail = liveTrails[selectedTractor] || []
    if (livePolylineRef.current) {
      livePolylineRef.current.setMap(null)
      livePolylineRef.current = null
    }

    if (trail.length > 1) {
      livePolylineRef.current = new window.google.maps.Polyline({
        path: trail,
        geodesic: true,
        strokeColor: "#10B981",
        strokeOpacity: 0.85,
        strokeWeight: 4,
        map: googleMapRef.current,
      })
    }
  }, [liveTrails, selectedTractor])

  // Draw active Geofence zones directly onto Google Maps
  useEffect(() => {

    if (!googleMapRef.current || !mapsLoaded || !window.google) return

    // Clear previous geofence overlays
    geofenceCirclesRef.current.forEach((c) => c.setMap(null))
    geofenceCirclesRef.current = []
    geofenceMarkersRef.current.forEach((m) => m.setMap(null))
    geofenceMarkersRef.current = []

    if (!showGeofences || geofences.length === 0) return

    geofences.forEach((gf) => {
      if (!gf.center_lat || !gf.center_lon) return
      const center = { lat: Number(gf.center_lat), lng: Number(gf.center_lon) }
      const radius = Number(gf.radius_meters || 500)

      const circle = new window.google.maps.Circle({
        strokeColor: "#F59E0B",
        strokeOpacity: 0.85,
        strokeWeight: 2,
        fillColor: "#F59E0B",
        fillOpacity: 0.18,
        map: googleMapRef.current,
        center,
        radius,
      })
      geofenceCirclesRef.current.push(circle)

      const marker = new window.google.maps.Marker({
        position: center,
        map: googleMapRef.current,
        title: `Geofence: ${gf.name} (${radius}m)`,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 4.5,
          fillColor: "#F59E0B",
          fillOpacity: 1,
          strokeColor: "#FFFFFF",
          strokeWeight: 1.5,
        },
      })
      geofenceMarkersRef.current.push(marker)
    })
  }, [geofences, showGeofences, mapsLoaded])

  const selectedDevice = getSelectedDevice()


  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-950 via-red-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading Fleet Telemetry...</p>
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
        {/* MAIN MAP SECTION WITH INLINE GPS TRACKING & ROUTE HISTORY */}
        <div
          className={`relative transition-all duration-500 ${
            isFullscreen ? "w-full h-screen" : "w-full md:flex-1 h-[60vh] md:h-screen"
          }`}
        >
          {/* FLOATING TOP CONTROL BAR: Selected Tractor, History Filter Tabs & Live Stream */}
          <div className="absolute top-3 left-3 right-14 z-[1000] flex items-center justify-between gap-2 pointer-events-none flex-wrap">
            {/* Left: Active Tractor Badge & Live Stream Status */}
            <div className="flex items-center gap-2 pointer-events-auto flex-wrap">
              {selectedDevice && (
                <div className="px-3 py-1.5 rounded-xl bg-slate-900/90 text-white text-xs font-bold backdrop-blur-md border border-slate-700/80 shadow-xl flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      selectedDevice.hasGps || selectedDevice.status === "Active" ? "bg-emerald-400" : "bg-rose-500"
                    }`}
                  ></div>
                  <span className="text-blue-300 font-semibold">{selectedDevice.name}</span>
                  <span className="text-[11px] text-slate-400 font-mono">IMEI: {selectedDevice.id}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                      (selectedDevice.speed || 0) > 0.5
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        : selectedDevice.status === "Idle" || selectedDevice.hasGps || selectedDevice.status === "Active"
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                        : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                    }`}
                  >
                    {(selectedDevice.speed || 0) > 0.5
                      ? `🟢 In Motion (${selectedDevice.speed?.toFixed(1)} km/h)`
                      : selectedDevice.status === "Idle" || selectedDevice.hasGps || selectedDevice.status === "Active"
                      ? "⏸ Idle (Parked)"
                      : "⚪ Not Connected"}
                  </span>
                </div>
              )}

              {selectedDevice && (
                <button
                  onClick={() => setShowOnlySelectedTractor(!showOnlySelectedTractor)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold backdrop-blur-md border shadow-xl flex items-center gap-1.5 transition-all ${
                    showOnlySelectedTractor
                      ? "bg-blue-600/90 hover:bg-blue-500 text-white border-blue-400/60 shadow-blue-500/20"
                      : "bg-slate-900/90 hover:bg-slate-800 text-slate-300 border-slate-700/80"
                  }`}
                  title="Toggle between showing only the selected tractor or all fleet tractors on map"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>{showOnlySelectedTractor ? "Selected Tractor Only (Show All)" : "Showing All Fleet (Isolate)"}</span>
                </button>
              )}

              <div
                className={`px-3 py-1.5 rounded-xl text-xs font-bold backdrop-blur-md border shadow-xl flex items-center gap-2 ${
                  isSocketConnected
                    ? "bg-emerald-950/90 text-emerald-300 border-emerald-500/40"
                    : "bg-slate-900/90 text-slate-400 border-slate-700/60"
                }`}
              >
                <div className={`w-2.5 h-2.5 rounded-full ${isSocketConnected ? "bg-emerald-400 animate-ping" : "bg-emerald-500"}`}></div>
                <span>{isSocketConnected ? "Live Motion Stream" : "Live GPS Active"}</span>
                {livePacketCount > 0 && (
                  <span className="bg-emerald-500/20 px-1.5 py-0.5 rounded text-[10px] text-emerald-200">
                    {livePacketCount} updates
                  </span>
                )}
              </div>
            </div>

            {/* Right: History Time Filter Tabs & Map Style Switcher */}
            <div className="flex items-center gap-1.5 pointer-events-auto bg-slate-900/90 p-1 rounded-xl backdrop-blur-md border border-slate-700/80 shadow-xl flex-wrap">
              {/* Country Filter Switcher */}
              <div className="flex items-center gap-1 border-r border-slate-700/80 pr-1.5 mr-0.5">
                <button
                  onClick={() => handleCountryChange("ALL")}
                  className={`px-2 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                    selectedCountry === "ALL"
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                  title="Show all fleet"
                >
                  🌐 All
                </button>
                <button
                  onClick={() => handleCountryChange("BO")}
                  className={`px-2 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                    selectedCountry === "BO"
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                  title="Filter to Bolivia fleet"
                >
                  🇧🇴 Bolivia ({devices.filter((d) => (d.countryCode || "BO") === "BO").length})
                </button>
                <button
                  onClick={() => handleCountryChange("PE")}
                  className={`px-2 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                    selectedCountry === "PE"
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                  title="Filter to Peru fleet"
                >
                  🇵🇪 Peru ({devices.filter((d) => d.countryCode === "PE").length})
                </button>
                <button
                  onClick={() => handleCountryChange("IN")}
                  className={`px-2 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                    selectedCountry === "IN"
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                  title="Filter to India device"
                >
                  🇮🇳 India ({devices.filter((d) => d.countryCode === "IN").length})
                </button>
              </div>

              {/* Map Type Switcher: Field Map vs Road Map */}
              <div className="flex items-center gap-1 border-r border-slate-700/80 pr-1.5 mr-0.5">
                <button
                  onClick={() => setMapType("hybrid")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    mapType === "hybrid" || mapType === "satellite"
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                  title="Field Map: High-detail Satellite view with agricultural field boundaries, crop plots & farm roads"
                >
                  <span>🌾</span> Field Map
                </button>
                <button
                  onClick={() => setMapType("roadmap")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    mapType === "roadmap"
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                  title="Road Map: Clean street network and highway navigation view"
                >
                  <span>🛣️</span> Road Map
                </button>
              </div>

              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider px-1.5 flex items-center gap-1">
                <History className="w-3 h-3 text-blue-400" /> History:
              </span>

              {[
                { label: "Today", value: "today" },
                { label: "Yesterday", value: "yesterday" },
                { label: "7D", value: "week" },
                { label: "30D", value: "month" },
                { label: "All", value: "all" },
              ].map((f) => {
                const isActive = selectedFilter === f.value
                const isBtnLoading = isActive && historyLoading
                return (
                  <button
                    key={f.value}
                    onClick={() => {
                      setSelectedFilter(f.value)
                      setShowDatePicker(false)
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      isActive
                        ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                    }`}
                  >
                    {isBtnLoading && <RefreshCw className="w-3 h-3 animate-spin text-white" />}
                    {f.label}
                  </button>
                )
              })}

              {/* Custom Date Range Toggle Button */}
              <button
                onClick={() => {
                  setSelectedFilter("custom")
                  setShowDatePicker(!showDatePicker)
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  selectedFilter === "custom"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                <span>📅 Custom</span>
              </button>

              {/* Motion Filter (All vs Moving vs Idle) */}
              <div className="flex items-center gap-1 border-l border-slate-700/80 pl-1.5 ml-0.5">
                {[
                  { label: "⚡ All", value: "all" as const },
                  { label: "🚜 Moving", value: "moving" as const },
                  { label: "🛑 Idle", value: "stopped" as const },
                ].map((m) => (
                  <button
                    key={m.value}
                    onClick={() => setMotionFilter(m.value)}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all ${
                      motionFilter === m.value
                        ? "bg-emerald-600/80 text-white shadow-sm"
                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowRoutePath(!showRoutePath)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${
                  showRoutePath
                    ? "bg-emerald-600/30 text-emerald-300 border-emerald-500/40"
                    : "bg-slate-800 text-slate-400 border-slate-700"
                }`}
                title="Toggle route polyline"
              >
                {showRoutePath ? "Path ON" : "Path OFF"}
              </button>

              {/* Geofences Control Button */}
              <button
                onClick={() => setShowGeofenceModal(true)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 border ${
                  showGeofences
                    ? "bg-amber-600/20 text-amber-300 border-amber-500/40 hover:bg-amber-600/30"
                    : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
                }`}
                title="Manage & View Geofences"
              >
                <Shield className="w-3 h-3 text-amber-400" />
                <span>Geofences ({geofences.length})</span>
              </button>

              <button
                onClick={handlePingSelectedDevice}
                disabled={pinging || !selectedDevice}
                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white flex items-center gap-1 shadow-md shadow-emerald-600/20"
                title="Ping latest GPS coordinate from server"
              >
                <Radio className={`w-3 h-3 ${pinging ? "animate-spin" : ""}`} />
                <span>{pinging ? "Ping..." : "Ping"}</span>
              </button>
            </div>
          </div>


          {/* Custom Date Range Picker Card (When custom is active or toggled) */}
          {selectedFilter === "custom" && showDatePicker && (
            <div className="absolute top-16 right-14 z-[1000] bg-slate-900/95 p-3 rounded-2xl backdrop-blur-md border border-slate-700 shadow-2xl flex items-center gap-3 text-white">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400 font-semibold">From:</span>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400 font-semibold">To:</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <button
                onClick={() => {
                  if (selectedTractor) {
                    loadMainMapRoute(selectedTractor, "custom", customStartDate, customEndDate)
                  }
                  setShowDatePicker(false)
                }}
                className="px-3 py-1 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all"
              >
                Apply Range
              </button>
            </div>
          )}

          {/* Route History Telemetry Statistics Bar (Floating HUD under controls) */}
          {selectedDevice && (
            <div className="absolute top-14 left-3 z-[998] flex items-center gap-2 flex-wrap pointer-events-none">
              <div className="px-3 py-1 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700/80 shadow-lg text-[11px] text-slate-300 flex items-center gap-2.5 font-semibold pointer-events-auto">
                <span className="flex items-center gap-1 text-blue-300">
                  <Route className="w-3.5 h-3.5" />
                  {historyLoading ? (
                    <span className="flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin text-blue-400" /> Aligning route...
                    </span>
                  ) : (
                    <span>{routeStats.count} Waypoints</span>
                  )}
                </span>

                <span className="text-slate-600">•</span>

                <span className="flex items-center gap-1 text-emerald-300" title="Total clean distance traveled">
                  <span>🛣️</span>
                  <span>{routeStats.distanceKm} km</span>
                </span>

                {routeStats.tripsCount > 0 && (
                  <>
                    <span className="text-slate-600">•</span>
                    <span className="flex items-center gap-1 text-amber-300" title="Separate work sessions / trips">
                      <span>🌾</span>
                      <span>{routeStats.tripsCount} {routeStats.tripsCount === 1 ? "Trip" : "Trips"}</span>
                    </span>
                  </>
                )}

                {routeStats.stopsCount > 0 && (
                  <>
                    <span className="text-slate-600">•</span>
                    <span className="flex items-center gap-1 text-yellow-400" title="Stationary stops / dwell clusters">
                      <span>🛑</span>
                      <span>{routeStats.stopsCount} Stops</span>
                    </span>
                  </>
                )}

                <span className="text-slate-600">•</span>

                <span className="flex items-center gap-1 text-sky-300">
                  <span>🚀 Max:</span>
                  <span>{routeStats.maxSpeed} km/h</span>
                </span>

                <span className="text-slate-600">•</span>

                <span className="flex items-center gap-1 text-purple-300">
                  <span>⏱️ Avg:</span>
                  <span>{routeStats.avgSpeed} km/h</span>
                </span>

                {routeStats.movingPoints > 0 && (
                  <>
                    <span className="text-slate-600">•</span>
                    <span className="text-emerald-400 font-mono text-[10px]">
                      {routeStats.movingPoints} moving
                    </span>
                  </>
                )}
              </div>

              {/* Trip Session Selector Pills if multiple trips exist */}
              {cleanedRouteResult && cleanedRouteResult.trips.length > 1 && (
                <div className="px-2 py-1 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700/80 shadow-lg text-[10px] text-slate-300 flex items-center gap-1 pointer-events-auto max-w-[90vw] overflow-x-auto">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] px-1">Trip:</span>
                  <button
                    onClick={() => setSelectedTripId("all")}
                    className={`px-2 py-0.5 rounded-md font-bold transition-all ${
                      selectedTripId === "all"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                    }`}
                  >
                    All ({cleanedRouteResult.trips.length})
                  </button>
                  {cleanedRouteResult.trips.slice(0, 6).map((t, idx) => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTripId(t.id)}
                      className={`px-2 py-0.5 rounded-md font-bold transition-all whitespace-nowrap flex items-center gap-1 ${
                        selectedTripId === t.id
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "text-slate-400 hover:text-white hover:bg-slate-800"
                      }`}
                      title={`${new Date(t.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(t.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                    >
                      Trip {idx + 1} ({t.distanceKm}km)
                    </button>
                  ))}
                </div>
              )}

              {/* Live Movement Animation / Simulation Pill */}
              <div className="px-2 py-1 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700/80 shadow-lg text-[10px] text-slate-300 flex items-center gap-1.5 pointer-events-auto">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] px-1 flex items-center gap-1">
                  <PlayCircle className="w-3 h-3 text-emerald-400" /> Animation:
                </span>
                {!isSimulating ? (
                  <button
                    onClick={startLiveSimulation}
                    className="px-2.5 py-0.5 rounded-md font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm flex items-center gap-1 transition-all active:scale-95"
                    title="Play live movement animation along the route"
                  >
                    <Play className="w-2.5 h-2.5 fill-current" /> Play Move
                  </button>
                ) : (
                  <button
                    onClick={stopLiveSimulation}
                    className="px-2.5 py-0.5 rounded-md font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-sm flex items-center gap-1 transition-all active:scale-95 animate-pulse"
                    title="Pause live simulation"
                  >
                    <Pause className="w-2.5 h-2.5 fill-current" /> Pause
                  </button>
                )}
                <div className="flex items-center gap-0.5 bg-slate-800 rounded-md p-0.5">
                  {[1, 2, 5].map((spd) => (
                    <button
                      key={spd}
                      onClick={() => setSimulationSpeed(spd)}
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        simulationSpeed === spd
                          ? "bg-emerald-500 text-white"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleTestLiveMove}
                  className="px-2 py-0.5 rounded-md font-bold bg-indigo-600/80 hover:bg-indigo-600 text-white shadow-sm flex items-center gap-1 transition-all active:scale-95 text-[10px]"
                  title="Simulate a live move forward along the road with slow-motion wheel roll"
                >
                  🧪 Road Move (+75m)
                </button>
                <button
                  onClick={handleRandomRoadMove}
                  className="px-2 py-0.5 rounded-md font-bold bg-purple-600/80 hover:bg-purple-600 text-white shadow-sm flex items-center gap-1 transition-all active:scale-95 text-[10px]"
                  title="Pick a random responding destination and navigate between the points strictly on the road"
                >
                  🎲 Random Road Run
                </button>
              </div>
            </div>
          )}


          {/* Device Not Connected Alert Banner */}
          {selectedDevice && !selectedDevice.hasGps && selectedDevice.status === "Not Connected" && (
            <div className="absolute top-16 left-3 right-3 md:right-14 z-[999] bg-rose-950/90 border border-rose-500/50 rounded-2xl p-3 backdrop-blur-md text-white flex items-center justify-between shadow-2xl gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center flex-shrink-0 border border-rose-500/40">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                    Device is Not Connected
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/30 text-rose-200 border border-rose-500/40 font-mono">No Telemetry Signal</span>
                  </h5>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    No GPS data packet received from IMEI <span className="font-mono text-white font-semibold">{selectedDevice.id}</span> ({selectedDevice.name}). Device may be unpowered, offline, or SIM disconnected.
                  </p>
                </div>
              </div>
              <button
                onClick={handlePingSelectedDevice}
                disabled={pinging}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-1.5 shadow-lg shadow-rose-600/30 transition-all flex-shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${pinging ? "animate-spin" : ""}`} />
                <span>{pinging ? "Pinging..." : "Check Signal"}</span>
              </button>
            </div>
          )}

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="absolute top-3 right-3 z-[1000] bg-slate-900/90 backdrop-blur-md border border-slate-700/80 hover:bg-slate-800 text-white p-2 rounded-xl transition-all shadow-xl"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>

          {/* Zoom Controls */}
          <div className="absolute top-14 right-3 z-[1000] flex flex-col gap-1">
            {/* Zoom In */}
            <button
              onClick={() => {
                if (googleMapRef.current) {
                  const currentZoom = googleMapRef.current.getZoom() ?? 14
                  googleMapRef.current.setZoom(currentZoom + 1)
                }
              }}
              className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 hover:bg-slate-800 active:scale-95 text-white p-2 rounded-t-xl rounded-b-none border-b-slate-700/40 transition-all shadow-xl"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            {/* Zoom Out */}
            <button
              onClick={() => {
                if (googleMapRef.current) {
                  const currentZoom = googleMapRef.current.getZoom() ?? 14
                  googleMapRef.current.setZoom(Math.max(1, currentZoom - 1))
                }
              }}
              className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 hover:bg-slate-800 active:scale-95 text-white p-2 rounded-none border-t-0 border-b-0 transition-all shadow-xl"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>

            {/* Fit to Selected Device */}
            <button
              onClick={() => {
                const dev = getSelectedDevice()
                if (dev && googleMapRef.current && dev.lat !== 0 && dev.lng !== 0) {
                  googleMapRef.current.panTo({ lat: dev.lat, lng: dev.lng })
                  googleMapRef.current.setZoom(17)
                }
              }}
              className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 hover:bg-red-900/80 active:scale-95 text-white p-2 rounded-t-none rounded-b-xl border-t-0 transition-all shadow-xl"
              title="Center on selected tractor"
            >
              <Crosshair className="w-4 h-4 text-red-400" />
            </button>
          </div>

          {/* FLOATING BOTTOM TELEMETRY HUD BAR FOR SELECTED TRACTOR */}
          {selectedDevice && (
            <div className="absolute bottom-4 left-4 right-4 z-[1000] pointer-events-none">
              <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl p-3.5 shadow-2xl pointer-events-auto flex items-center justify-between gap-4 flex-wrap">
                {/* Tractor Info & Status */}
                <div className="flex items-center gap-3 min-w-[200px]">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-white text-sm font-bold truncate">{selectedDevice.name}</h4>
                    <p className="text-slate-400 text-xs truncate">{selectedDevice.model} • Store: {selectedDevice.field}</p>
                  </div>
                </div>

                {/* Telemetry Metrics */}
                <div className="flex items-center gap-6 flex-wrap">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Status</span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded block ${
                        (selectedDevice.speed || 0) > 0.5
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                          : selectedDevice.status === "Idle" || selectedDevice.hasGps || selectedDevice.status === "Active"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                          : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                      }`}
                    >
                      {(selectedDevice.speed || 0) > 0.5
                        ? "🟢 In Motion"
                        : selectedDevice.status === "Idle" || selectedDevice.hasGps || selectedDevice.status === "Active"
                        ? "⏸ Idle (Parked)"
                        : "⚪ Not Connected"}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Speed</span>
                    <span className={`text-sm font-bold font-mono ${
                      (selectedDevice.speed || 0) > 0.5 ? "text-emerald-400" : "text-white"
                    }`}>
                      {(selectedDevice.speed || 0).toFixed(1)} km/h
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Heading</span>
                    <span className="text-sm font-bold text-white font-mono">{selectedDevice.course || 0}°</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Battery</span>
                    <span className="text-sm font-bold text-emerald-400 font-mono">{selectedDevice.battery || 85}%</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Route Path</span>
                    <span className="text-sm font-bold text-red-400 font-mono">
                      {historyLoading ? "Loading..." : `${historyLocations.length} Waypoints`}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Worked Area</span>
                    <span className="text-sm font-bold text-emerald-400 font-mono">
                      {historyLoading
                        ? "..."
                        : (routeStats as any).workedAreaHa > 0
                        ? `${(routeStats as any).workedAreaHa} ha`
                        : routeStats.distanceKm > 0
                        ? `${(routeStats.distanceKm * 0.3).toFixed(1)} ha`
                        : "0 ha"}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Region</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                      {selectedDevice.region} {selectedDevice.region === "SW" ? "(- coords)" : "(+ coords)"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Map Container */}
          <div ref={mapRef} style={{ width: "100%", height: "100%" }} />

          {/* High-Visibility Map Loading Overlay */}
          {historyLoading && (
            <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center bg-slate-950/40 backdrop-blur-[2px] transition-all duration-300">
              <div className="flex items-center gap-3.5 px-6 py-4 rounded-2xl bg-slate-900/95 border border-blue-500/50 shadow-2xl shadow-blue-500/20 text-white backdrop-blur-md">
                <div className="relative flex items-center justify-center w-9 h-9">
                  <div className="absolute inset-0 rounded-full border-2 border-blue-500/30 border-t-blue-400 animate-spin" />
                  <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    Loading GPS Route History
                    <span className="inline-block w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    Filtering and aligning map coordinates ({selectedFilter.toUpperCase()})...
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SIDEBAR CONTROL PANEL */}
        {!isFullscreen && (
          <div className="w-full md:w-80 flex-shrink-0 bg-white/5 md:bg-transparent backdrop-blur-xl border-t md:border-t-0 md:border-l border-white/10 relative z-10">
            <div className="flex flex-col h-full max-h-[80vh] md:max-h-screen overflow-y-auto p-4 sm:p-6 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Tractor Fleet</h2>
                  <div className="flex items-center space-x-2 mt-0.5">
                    <div className={`w-2 h-2 rounded-full ${isSocketConnected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`}></div>
                    <span className="text-emerald-400 text-xs font-semibold uppercase tracking-wider">
                      {isSocketConnected ? "LIVE TELEMETRY STREAM" : "GPS TELEMETRY"}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleOpenAddDevice}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-3.5 py-2 rounded-xl flex items-center shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Device
                </button>
              </div>

              {/* Active Tractors */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <h3 className="text-white font-semibold flex items-center text-sm">
                    <Truck className="w-4 h-4 mr-2 text-emerald-400" /> Active Fleet ({visibleDevices.length}{selectedCountry !== "ALL" ? `/${devices.length}` : ""})
                  </h3>
                  <button onClick={fetchDevices} className="text-xs text-slate-400 hover:text-white flex items-center transition-colors">
                    <RefreshCw className="w-3 h-3 mr-1" /> Refresh
                  </button>
                </div>

                {/* Country Filter Pills in Sidebar */}
                <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10 mb-3 flex-wrap">
                  <button
                    onClick={() => handleCountryChange("ALL")}
                    className={`flex-1 min-w-[50px] py-1.5 rounded-lg text-xs font-medium transition-all text-center ${
                      selectedCountry === "ALL"
                        ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    All ({devices.length})
                  </button>
                  <button
                    onClick={() => handleCountryChange("BO")}
                    className={`flex-1 min-w-[70px] py-1.5 rounded-lg text-xs font-medium transition-all text-center flex items-center justify-center gap-1 ${
                      selectedCountry === "BO"
                        ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <span>🇧🇴</span> BO ({devices.filter((d) => (d.countryCode || "BO") === "BO").length})
                  </button>
                  <button
                    onClick={() => handleCountryChange("PE")}
                    className={`flex-1 min-w-[70px] py-1.5 rounded-lg text-xs font-medium transition-all text-center flex items-center justify-center gap-1 ${
                      selectedCountry === "PE"
                        ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <span>🇵🇪</span> PE ({devices.filter((d) => d.countryCode === "PE").length})
                  </button>
                  <button
                    onClick={() => handleCountryChange("IN")}
                    className={`flex-1 min-w-[70px] py-1.5 rounded-lg text-xs font-medium transition-all text-center flex items-center justify-center gap-1 ${
                      selectedCountry === "IN"
                        ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <span>🇮🇳</span> IN ({devices.filter((d) => d.countryCode === "IN").length})
                  </button>
                </div>

                <div className="space-y-2">
                  {visibleDevices.map((device) => {
                    const isSelected = selectedTractor === device.id
                    return (
                      <div
                        key={device.id}
                        onClick={() => handleMarkerClick(device.id)}
                        className={`p-3 rounded-xl cursor-pointer transition-all duration-300 ${
                          isSelected
                            ? "bg-gradient-to-r from-blue-600/30 to-blue-500/10 border-2 border-blue-500/70 shadow-lg shadow-blue-500/10"
                            : "bg-white/10 hover:bg-white/20 border border-white/10"
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-11 h-11 rounded-lg bg-black/40 border border-white/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {device.tractorImage ? (
                              <img
                                src={device.tractorImage}
                                alt={device.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Truck className="w-6 h-6 text-emerald-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">{device.name}</p>
                            <p className="text-gray-300 text-xs truncate">{device.field}</p>
                            <p className="text-gray-400 text-[11px] font-mono mt-0.5 truncate">IMEI: {device.id}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold block mb-1 ${
                                device.status === "Active" || device.hasGps
                                  ? "bg-emerald-400/20 text-emerald-300 border border-emerald-400/30"
                                  : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                              }`}
                            >
                              {device.status === "Active" || device.hasGps ? "Connected" : "Not Connected"}
                            </span>
                            <span className="text-[10px] text-gray-300 font-mono flex items-center justify-end gap-1">
                              {device.countryCode === "IN"
                                ? "🇮🇳 India"
                                : device.countryCode === "PE"
                                ? "🇵🇪 Peru"
                                : "🇧🇴 Bolivia"}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Selected Device Details */}
              {selectedDevice && (
                <>
                  <div className="bg-white/10 p-4 rounded-xl border border-white/20">
                    {selectedDevice.tractorImage && (
                      <img
                        src={selectedDevice.tractorImage}
                        alt={selectedDevice.name}
                        className="rounded-lg mb-3 w-full h-32 object-cover"
                      />
                    )}
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-white font-semibold">Device Telemetry</h4>
                      <span className="text-[11px] text-emerald-400 font-mono">
                        {isSocketConnected ? "🟢 Streaming" : "⚪ Standby"}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-300">Model:</span>
                        <span className="text-white">{selectedDevice.model}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Hourly Price:</span>
                        <span className="text-white">${selectedDevice.hourlyPrice}/hr</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Region:</span>
                        <span className="text-white">{selectedDevice.region} ({selectedDevice.region === "SW" ? "Negative coords" : "Positive coords"})</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Owner:</span>
                        <span className="text-white truncate max-w-[140px] text-right">{selectedDevice.ownerName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">GPS Location:</span>
                        <span className="text-white text-xs font-mono">
                          {selectedDevice.lat.toFixed(5)}, {selectedDevice.lng.toFixed(5)}
                        </span>
                      </div>
                      {selectedDevice.course !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-gray-300">Heading:</span>
                          <span className="text-white font-mono">{selectedDevice.course}°</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* STATUS CARDS */}
                  <div className="space-y-3">
                    <div className="bg-white/10 p-4 rounded-xl border border-white/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-300 text-sm">Battery / Power</span>
                        <Zap className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-white/10 rounded-full h-2">
                          <div
                            className="bg-emerald-400 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${selectedDevice.battery || 85}%` }}
                          ></div>
                        </div>
                        <span className="text-white text-sm font-medium">{selectedDevice.battery || 85}%</span>
                      </div>
                    </div>

                    <div className="bg-white/10 p-4 rounded-xl border border-white/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-300 text-sm">Real-time Motion Speed</span>
                        <Gauge className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-xl font-bold font-mono ${
                          (selectedDevice.speed || 0) > 0.5 ? "text-emerald-400 animate-pulse" : "text-white"
                        }`}>
                          {(selectedDevice.speed || 0).toFixed(1)} km/h
                        </span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          (selectedDevice.speed || 0) > 0.5
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                            : selectedDevice.status === "Idle" || selectedDevice.hasGps || selectedDevice.status === "Active"
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                            : "bg-slate-700 text-slate-300"
                        }`}>
                          {(selectedDevice.speed || 0) > 0.5
                            ? "🟢 In Motion"
                            : selectedDevice.status === "Idle" || selectedDevice.hasGps || selectedDevice.status === "Active"
                            ? "⏸ Idle (Parked)"
                            : "⚪ Offline / Idle"}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* LIVE MOVEMENT ANIMATION & SIMULATION CONTROLLER */}
              {selectedDevice && (
                <div className="bg-slate-900/85 p-4 rounded-xl border border-slate-700/80 space-y-3 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <PlayCircle className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider">Live Movement Animation</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      (selectedDevice.speed || 0) > 0.5
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse"
                        : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                    }`}>
                      {(selectedDevice.speed || 0) > 0.5 ? "🟢 MOVING" : "⏸ IDLE"}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Tractor smoothly glides and rotates towards responded coordinates in real-time. If the device does not respond or is stopped, it stays in <strong className="text-amber-300 font-semibold">Idle</strong> mode.
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    {!isSimulating ? (
                      <button
                        onClick={startLiveSimulation}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 px-3 rounded-lg flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all active:scale-95"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" /> Play Live Run
                      </button>
                    ) : (
                      <button
                        onClick={stopLiveSimulation}
                        className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold py-2.5 px-3 rounded-lg flex items-center justify-center gap-1.5 shadow-md shadow-amber-600/20 transition-all active:scale-95 animate-pulse"
                      >
                        <Pause className="w-3.5 h-3.5 fill-current" /> Pause Run
                      </button>
                    )}

                    <button
                      onClick={handleTestLiveMove}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2.5 px-3 rounded-lg flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all active:scale-95"
                      title="Simulate a live move forward along the road with slow-motion wheel roll"
                    >
                      🧪 Road Move (+75m)
                    </button>
                    <button
                      onClick={handleRandomRoadMove}
                      className="col-span-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold py-2.5 px-3 rounded-lg flex items-center justify-center gap-1.5 shadow-md shadow-purple-600/25 transition-all active:scale-95"
                      title="Pick a random responding destination and navigate between the points strictly on the road with dynamic steering"
                    >
                      🎲 Random Road Run (Between Points)
                    </button>
                  </div>

                  {/* Playback Speed Multiplier */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-xs">
                    <span className="text-slate-400 text-[11px]">Animation Speed:</span>
                    <div className="flex items-center gap-1 bg-slate-800/80 p-0.5 rounded-lg">
                      {[1, 2, 5].map((spd) => (
                        <button
                          key={spd}
                          onClick={() => setSimulationSpeed(spd)}
                          className={`px-2 py-0.5 rounded text-xs font-bold transition-all ${
                            simulationSpeed === spd
                              ? "bg-emerald-500 text-white shadow-sm"
                              : "text-slate-400 hover:text-white"
                          }`}
                        >
                          {spd}x
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* WORKED AREA SUMMARY — matches mobile Device Tracking */}
              {selectedDevice && routeStats.distanceKm > 0 && (
                <div className="bg-red-950/60 border border-red-500/30 rounded-xl p-4 space-y-2 shadow-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Route className="w-4 h-4 text-red-400" />
                    <span className="text-xs font-bold text-red-300 uppercase tracking-wider">History Path Summary</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/5 rounded-lg p-2.5 text-center">
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide mb-0.5">Worked Area</p>
                      <p className="text-lg font-bold text-emerald-400">
                        {(routeStats as any).workedAreaHa > 0
                          ? (routeStats as any).workedAreaHa
                          : (routeStats.distanceKm * 0.3).toFixed(1)}
                        <span className="text-xs text-slate-400 font-normal ml-1">ha</span>
                      </p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-2.5 text-center">
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide mb-0.5">Distance</p>
                      <p className="text-lg font-bold text-white">
                        {routeStats.distanceKm.toFixed(2)}
                        <span className="text-xs text-slate-400 font-normal ml-1">km</span>
                      </p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-2.5 text-center">
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide mb-0.5">Max Speed</p>
                      <p className="text-base font-bold text-amber-400">
                        {routeStats.maxSpeed.toFixed(1)}
                        <span className="text-xs text-slate-400 font-normal ml-1">km/h</span>
                      </p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-2.5 text-center">
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide mb-0.5">Trips</p>
                      <p className="text-base font-bold text-blue-400">
                        {routeStats.tripsCount}
                        <span className="text-xs text-slate-400 font-normal ml-1">runs</span>
                      </p>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 text-center">
                    IMEI: <span className="font-mono text-slate-400">{selectedDevice.id}</span>
                  </p>
                </div>
              )}

              {/* ACTION BUTTONS */}
              <div className="space-y-3">
                <button
                  onClick={handlePingSelectedDevice}
                  disabled={pinging || !selectedDevice}
                  className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 disabled:opacity-50 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-700/20 transition-all active:scale-[0.98]"
                >
                  <Radio className={`w-5 h-5 mr-2 ${pinging ? "animate-spin" : "animate-pulse"}`} />
                  {pinging ? "Querying device.holatractor.com..." : "Live Tracker Ping"}
                </button>
                <button
                  onClick={() => setShowRoutePath(!showRoutePath)}
                  disabled={!selectedDevice}
                  className="w-full bg-gradient-to-r from-red-600/80 to-red-700/70 hover:from-red-600 hover:to-red-600 disabled:opacity-50 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center"
                >
                  <Route className="w-5 h-5 mr-2" /> {showRoutePath ? "Hide History Path" : "Show History Path"}
                </button>
                <button
                  onClick={handleOpenAddDevice}
                  className="w-full bg-white/10 hover:bg-white/20 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center border border-white/10"
                >
                  <Plus className="w-5 h-5 mr-2 text-emerald-400" /> Link New GPS Device
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* STEPPED ADD DEVICE MODAL */}
      {showAddDeviceModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md">
          <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col border border-slate-700/70 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 bg-slate-950/60">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                    <Radio className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white tracking-tight">Add & Link GPS Tracker</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Select Owner, Store, and Tractor to link live telemetry</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddDeviceModal(false)}
                  className="text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl p-2 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Progress Steps Header */}
              <div className="grid grid-cols-4 gap-2 pt-2">
                {[
                  { step: 1, label: "1. Owner", done: Boolean(selectedOwner) },
                  { step: 2, label: "2. Store", done: Boolean(selectedStore) },
                  { step: 3, label: "3. Tractor", done: Boolean(selectedTractorForDevice) },
                  { step: 4, label: "4. Device", done: false },
                ].map((s) => (
                  <div
                    key={s.step}
                    onClick={() => {
                      if (s.step === 1) setAddStep(1)
                      if (s.step === 2 && selectedOwner) setAddStep(2)
                      if (s.step === 3 && selectedStore) setAddStep(3)
                    }}
                    className={`py-2 px-2.5 rounded-lg text-center cursor-pointer transition-all text-xs font-semibold flex items-center justify-center space-x-1 ${
                      addStep === s.step
                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/25 border border-emerald-500"
                        : s.done
                        ? "bg-emerald-950/40 text-emerald-300 border border-emerald-800/60"
                        : "bg-slate-800/60 text-slate-500 border border-slate-700/40"
                    }`}
                  >
                    {s.done && addStep !== s.step ? <Check className="w-3.5 h-3.5" /> : null}
                    <span>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4" style={{ scrollbarWidth: "none" }}>
              {/* STEP 1: SELECT OWNER */}
              {addStep === 1 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center">
                      <UserIcon className="w-4 h-4 mr-2 text-emerald-400" /> Step 1: Select Owner ({filteredOwners.length}
                      {totalOwnersCount > filteredOwners.length ? ` of ${totalOwnersCount}` : ""})
                    </h4>
                    {optionsLoading && (
                      <div className="flex items-center text-xs text-emerald-400 font-medium space-x-1.5">
                        <div className="animate-spin rounded-full h-3 w-3 border border-emerald-400 border-t-transparent"></div>
                        <span>Searching...</span>
                      </div>
                    )}
                  </div>

                  {/* Search Owner */}
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      autoFocus
                      value={ownerSearchTerm}
                      onChange={(e) => setOwnerSearchTerm(e.target.value)}
                      placeholder="Search owner by name, mobile, email, or store..."
                      className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl pl-10 pr-12 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    />
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center space-x-1.5">
                      {optionsLoading && (
                        <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-emerald-400 border-t-transparent"></div>
                      )}
                      {ownerSearchTerm && (
                        <button
                          type="button"
                          onClick={() => setOwnerSearchTerm("")}
                          className="text-xs text-slate-400 hover:text-white p-0.5"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Owners List */}
                  <div className="space-y-2.5 max-h-[48vh] overflow-y-auto pr-1">
                    {optionsLoading && filteredOwners.length === 0 ? (
                      <div className="py-16 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent mx-auto mb-3"></div>
                        <p className="text-slate-400 text-xs font-medium">Searching owners in database...</p>
                      </div>
                    ) : filteredOwners.length === 0 ? (
                      <div className="py-12 text-center text-slate-400 text-sm">
                        No owners matching &quot;{ownerSearchTerm}&quot; found.
                      </div>
                    ) : (
                      filteredOwners.map((owner) => {
                            const isSelected = selectedOwner?.owner_id === owner?.owner_id
                            const totalTractors = (owner?.stores || []).reduce((acc, s) => acc + (s?.tractors || []).length, 0)
                            const ownerName = owner?.owner_name || "Owner"
                            return (
                              <div
                                key={owner?.owner_id || Math.random().toString()}
                                onClick={() => {
                                  setSelectedOwner(owner)
                                  setSelectedStore(null)
                                  setSelectedTractorForDevice(null)
                                  setAddStep(2)
                                }}
                                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                                  isSelected
                                    ? "bg-emerald-950/30 border-emerald-500 ring-1 ring-emerald-500 shadow-md"
                                    : "bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600"
                                }`}
                              >
                                <div className="flex items-center space-x-3">
                                  {owner?.owner_image ? (
                                    <img
                                      src={owner.owner_image}
                                      alt={ownerName}
                                      className="w-10 h-10 rounded-full object-cover border border-slate-600"
                                    />
                                  ) : (
                                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20 flex items-center justify-center text-sm">
                                      {ownerName.slice(0, 2).toUpperCase()}
                                    </div>
                                  )}
                                  <div>
                                    <h5 className="text-sm font-semibold text-white">{ownerName}</h5>
                                    <div className="flex flex-wrap items-center gap-x-2 text-xs text-slate-400 mt-0.5">
                                      {owner?.owner_email && <span>{owner.owner_email}</span>}
                                      {owner?.owner_mobile && (
                                        <span className="text-emerald-400 font-mono font-medium">
                                          📱 {owner.owner_mobile}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                  <div className="text-right">
                                    <span className="text-xs text-slate-300 font-medium block">
                                      {(owner?.stores || []).length} {(owner?.stores || []).length === 1 ? "Store" : "Stores"}
                                    </span>
                                    <span className="text-[11px] text-slate-500">
                                      {totalTractors} {totalTractors === 1 ? "Tractor" : "Tractors"}
                                    </span>
                                  </div>
                                  <ChevronRight className="w-4 h-4 text-slate-500" />
                                </div>
                              </div>
                            )
                          })
                        )}

                        {/* Load More Button for High Scale */}
                        {hasMoreOwners && (
                          <div className="pt-2 text-center">
                            <button
                              type="button"
                              onClick={handleLoadMoreOwners}
                              disabled={loadingMoreOwners}
                              className="px-4 py-2 text-xs font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-800/60 rounded-xl transition-all flex items-center justify-center mx-auto space-x-2 disabled:opacity-50"
                            >
                              {loadingMoreOwners ? (
                                <>
                                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-emerald-400 border-t-transparent"></div>
                                  <span>Loading more owners...</span>
                                </>
                              ) : (
                                <>
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Load More Owners ({Math.max(0, totalOwnersCount - deviceOptions.length)} remaining)</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* STEP 2: SELECT STORE */}
                  {addStep === 2 && selectedOwner && (
                    <div className="space-y-4">
                      {/* Active Owner Banner */}
                      <div className="p-3 bg-emerald-950/30 border border-emerald-800/50 rounded-xl flex items-center justify-between">
                        <div className="flex items-center space-x-2.5">
                          <span className="text-xs text-slate-400">Selected Owner:</span>
                          <span className="text-xs font-bold text-white">{selectedOwner.owner_name}</span>
                          {selectedOwner.owner_mobile && (
                            <span className="text-xs text-emerald-400 font-mono font-medium">
                              ({selectedOwner.owner_mobile})
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => setAddStep(1)}
                          className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
                        >
                          Change Owner
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center">
                          <Store className="w-4 h-4 mr-2 text-emerald-400" /> Step 2: Select Store ({selectedOwner.stores.length})
                        </h4>
                        <button
                          type="button"
                          onClick={() => {
                            setShowCreateStoreModal(true)
                            setCreateStoreError(null)
                            setNewStoreName(`${selectedOwner.owner_name}'s Store`)
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 transition-all flex items-center space-x-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Create Store</span>
                        </button>
                      </div>

                      {/* INLINE CREATE STORE FORM / MODAL */}
                      {showCreateStoreModal && (
                        <div className="p-4 bg-slate-950/80 border border-emerald-500/50 rounded-2xl space-y-3 animate-in fade-in zoom-in-95">
                          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                            <div className="flex items-center space-x-2">
                              <Store className="w-4 h-4 text-emerald-400" />
                              <h5 className="text-xs font-bold text-white uppercase tracking-wider">
                                Quick Create Store for {selectedOwner.owner_name}
                              </h5>
                            </div>
                            <button
                              type="button"
                              onClick={() => setShowCreateStoreModal(false)}
                              className="text-slate-400 hover:text-white p-1"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          {createStoreError && (
                            <div className="p-2.5 bg-red-500/15 border border-red-500/30 rounded-xl text-red-300 text-xs flex items-center space-x-2">
                              <AlertCircle className="w-4 h-4 flex-shrink-0" />
                              <span>{createStoreError}</span>
                            </div>
                          )}

                          <form onSubmit={handleCreateStore} className="space-y-3">
                            <div>
                              <label className="block text-[11px] font-bold uppercase text-slate-300 mb-1">
                                Store Name *
                              </label>
                              <input
                                type="text"
                                required
                                value={newStoreName}
                                onChange={(e) => setNewStoreName(e.target.value)}
                                placeholder="e.g. Santa Cruz Agricultural Center"
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold uppercase text-slate-300 mb-1">
                                Store Description / Address
                              </label>
                              <input
                                type="text"
                                value={newStoreDescription}
                                onChange={(e) => setNewStoreDescription(e.target.value)}
                                placeholder="e.g. Primary machinery fleet depot"
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              />
                            </div>

                            <div className="flex justify-end space-x-2 pt-1">
                              <button
                                type="button"
                                onClick={() => setShowCreateStoreModal(false)}
                                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                disabled={creatingStore}
                                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/25 flex items-center disabled:opacity-50"
                              >
                                {creatingStore ? (
                                  <>
                                    <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent mr-1.5"></div>
                                    Creating Store...
                                  </>
                                ) : (
                                  <>
                                    <Check className="w-3.5 h-3.5 mr-1" /> Save & Select Store
                                  </>
                                )}
                              </button>
                            </div>
                          </form>
                        </div>
                      )}

                      {/* Store Cards Grid */}
                      {selectedOwner.stores.length === 0 && !showCreateStoreModal ? (
                        <div className="py-10 px-6 text-center border border-dashed border-slate-700/80 rounded-2xl bg-slate-800/30 space-y-3">
                          <Store className="w-10 h-10 text-slate-500 mx-auto" />
                          <div>
                            <h5 className="text-sm font-bold text-white">No Stores Registered</h5>
                            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                              This owner does not have an active store yet. Create one now to link tractors and GPS devices.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setShowCreateStoreModal(true)
                              setCreateStoreError(null)
                              setNewStoreName(`${selectedOwner.owner_name}'s Store`)
                            }}
                            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/25 inline-flex items-center space-x-1.5"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Create Store for this Owner</span>
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[48vh] overflow-y-auto">
                          {selectedOwner.stores.map((store) => {
                            const isSelected = selectedStore?.store_id === store.store_id
                            return (
                              <div
                                key={store.store_id}
                                onClick={() => {
                                  setSelectedStore(store)
                                  setSelectedTractorForDevice(null)
                                  setAddStep(3)
                                }}
                                className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                                  isSelected
                                    ? "bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500 shadow-md"
                                    : "bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600"
                                }`}
                              >
                                <div>
                                  {store.store_image && (
                                    <img
                                      src={store.store_image}
                                      alt={store.store_name}
                                      className="w-full h-24 rounded-lg object-cover mb-3 border border-slate-700"
                                    />
                                  )}
                                  <h5 className="text-sm font-bold text-white">{store.store_name}</h5>
                                  <p className="text-xs text-slate-400 mt-1">
                                    {store.tractors.length}{" "}
                                    {store.tractors.length === 1 ? "Tractor unit available" : "Tractor units available"}
                                  </p>
                                </div>
                                <div className="mt-3 pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs text-emerald-400 font-semibold">
                                  <span>View Tractors ({store.tractors.length})</span>
                                  <ChevronRight className="w-4 h-4" />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* STEP 3: SELECT TRACTOR */}
                  {addStep === 3 && selectedStore && (
                    <div className="space-y-4">
                      {/* Active Hierarchy Banner */}
                      <div className="p-3 bg-emerald-950/30 border border-emerald-800/50 rounded-xl flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-xs">
                          <span className="text-slate-400">Owner:</span>
                          <span className="font-bold text-white">{selectedOwner?.owner_name}</span>
                          <span className="text-slate-600">/</span>
                          <span className="text-slate-400">Store:</span>
                          <span className="font-bold text-emerald-300">{selectedStore.store_name}</span>
                        </div>
                        <button
                          onClick={() => setAddStep(2)}
                          className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
                        >
                          Change Store
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center">
                          <Truck className="w-4 h-4 mr-2 text-emerald-400" /> Step 3: Select Tractor Unit ({selectedStore.tractors.length})
                        </h4>
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddTractorModal(true)
                            setCreateTractorError(null)
                            if (availableBaseTractors.length > 0 && !selectedBaseTractorId) {
                              setSelectedBaseTractorId(availableBaseTractors[0].base_tractor_id)
                            }
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 transition-all flex items-center space-x-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Tractor to Store</span>
                        </button>
                      </div>

                      {/* Search Tractors in Store Input */}
                      {selectedStore.tractors.length > 0 && (
                        <div className="relative">
                          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            value={tractorSearchTerm}
                            onChange={(e) => setTractorSearchTerm(e.target.value)}
                            placeholder={`Search ${selectedStore.tractors.length} tractors by name, model, IMEI, or rate...`}
                            className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                          />
                          {tractorSearchTerm && (
                            <button
                              type="button"
                              onClick={() => setTractorSearchTerm("")}
                              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white p-0.5"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}

                      {/* INLINE ADD TRACTOR FORM / MODAL */}
                      {showAddTractorModal && (
                        <div className="p-4 bg-slate-950/80 border border-emerald-500/50 rounded-2xl space-y-3 animate-in fade-in zoom-in-95">
                          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                            <div className="flex items-center space-x-2">
                              <Truck className="w-4 h-4 text-emerald-400" />
                              <h5 className="text-xs font-bold text-white uppercase tracking-wider">
                                Add Tractor to {selectedStore.store_name}
                              </h5>
                            </div>
                            <button
                              type="button"
                              onClick={() => setShowAddTractorModal(false)}
                              className="text-slate-400 hover:text-white p-1"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          {createTractorError && (
                            <div className="p-2.5 bg-red-500/15 border border-red-500/30 rounded-xl text-red-300 text-xs flex items-center space-x-2">
                              <AlertCircle className="w-4 h-4 flex-shrink-0" />
                              <span>{createTractorError}</span>
                            </div>
                          )}

                          <form onSubmit={handleAddTractorToStore} className="space-y-3">
                            <div>
                              <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-[11px] font-bold uppercase text-slate-300">
                                  Select Tractor Model from Catalog * ({filteredCatalogTractors.length}
                                  {catalogTractorSearchTerm ? ` of ${availableBaseTractors.length}` : ""})
                                </label>
                              </div>

                              {/* Search Catalog Tractors Input */}
                              <div className="relative mb-2">
                                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                  type="text"
                                  value={catalogTractorSearchTerm}
                                  onChange={(e) => setCatalogTractorSearchTerm(e.target.value)}
                                  placeholder="Search catalog models by name or model..."
                                  className="w-full bg-slate-800/90 border border-slate-700/80 rounded-xl pl-9 pr-8 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                                />
                                {catalogTractorSearchTerm && (
                                  <button
                                    type="button"
                                    onClick={() => setCatalogTractorSearchTerm("")}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white p-0.5"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1 bg-slate-900/80 rounded-xl border border-slate-800">
                                {filteredCatalogTractors.length === 0 ? (
                                  <div className="col-span-2 py-4 text-center text-xs text-slate-400">
                                    No catalog models match &quot;{catalogTractorSearchTerm}&quot;
                                  </div>
                                ) : (
                                  filteredCatalogTractors.map((bt) => {
                                    const isChosen = selectedBaseTractorId === bt.base_tractor_id
                                    return (
                                      <div
                                        key={bt.base_tractor_id}
                                        onClick={() => setSelectedBaseTractorId(bt.base_tractor_id)}
                                        className={`p-2 rounded-lg border cursor-pointer transition-all flex items-center space-x-2.5 ${
                                          isChosen
                                            ? "bg-emerald-950/60 border-emerald-500 ring-1 ring-emerald-500 text-white"
                                            : "bg-slate-800/40 border-slate-700/50 text-slate-300 hover:bg-slate-800"
                                        }`}
                                      >
                                        {bt.image ? (
                                          <img
                                            src={bt.image}
                                            alt={bt.name}
                                            className="w-8 h-8 rounded object-cover border border-slate-700 flex-shrink-0"
                                          />
                                        ) : (
                                          <div className="w-8 h-8 rounded bg-emerald-500/10 text-emerald-400 flex items-center justify-center flex-shrink-0">
                                            <Truck className="w-4 h-4" />
                                          </div>
                                        )}
                                        <div className="truncate">
                                          <h6 className="text-xs font-semibold truncate">{bt.name}</h6>
                                          <p className="text-[10px] text-slate-400 truncate">{bt.model}</p>
                                        </div>
                                      </div>
                                    )
                                  })
                                )}
                              </div>
                            </div>


                            <div>
                              <label className="block text-[11px] font-bold uppercase text-slate-300 mb-1">
                                Hourly Rental Rate ($/hr) *
                              </label>
                              <input
                                type="number"
                                required
                                min="1"
                                step="0.5"
                                value={newTractorHourlyPrice}
                                onChange={(e) => setNewTractorHourlyPrice(Number(e.target.value))}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              />
                            </div>

                            <div className="flex justify-end space-x-2 pt-1">
                              <button
                                type="button"
                                onClick={() => setShowAddTractorModal(false)}
                                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                disabled={creatingTractor}
                                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/25 flex items-center disabled:opacity-50"
                              >
                                {creatingTractor ? (
                                  <>
                                    <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent mr-1.5"></div>
                                    Adding Tractor...
                                  </>
                                ) : (
                                  <>
                                    <Check className="w-3.5 h-3.5 mr-1" /> Add & Select Tractor
                                  </>
                                )}
                              </button>
                            </div>
                          </form>
                        </div>
                      )}

                      {/* Tractor Cards List */}
                      {selectedStore.tractors.length === 0 && !showAddTractorModal ? (
                        <div className="py-10 px-6 text-center border border-dashed border-slate-700/80 rounded-2xl bg-slate-800/30 space-y-3">
                          <Truck className="w-10 h-10 text-slate-500 mx-auto" />
                          <div>
                            <h5 className="text-sm font-bold text-white">No Tractors in this Store</h5>
                            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                              Add a tractor model from the machinery catalog to assign its GPS device and start tracking telemetry.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setShowAddTractorModal(true)
                              setCreateTractorError(null)
                              if (availableBaseTractors.length > 0 && !selectedBaseTractorId) {
                                setSelectedBaseTractorId(availableBaseTractors[0].base_tractor_id)
                              }
                            }}
                            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/25 inline-flex items-center space-x-1.5"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Add Tractor from Catalog</span>
                          </button>
                        </div>
                      ) : filteredStoreTractors.length === 0 ? (
                        <div className="py-10 px-6 text-center border border-dashed border-slate-700/80 rounded-2xl bg-slate-800/30 space-y-2">
                          <Truck className="w-8 h-8 text-slate-500 mx-auto" />
                          <h5 className="text-sm font-bold text-white">No Matching Tractors</h5>
                          <p className="text-xs text-slate-400">
                            No tractors match &quot;{tractorSearchTerm}&quot; in this store.
                          </p>
                          <button
                            type="button"
                            onClick={() => setTractorSearchTerm("")}
                            className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold pt-1"
                          >
                            Clear Search
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2.5 max-h-[48vh] overflow-y-auto">
                          {filteredStoreTractors.map((tractor) => {
                            const isSelected = selectedTractorForDevice?.tractor_store_id === tractor.tractor_store_id
                            return (
                              <div
                                key={tractor.tractor_store_id || tractor.base_tractor_id}
                                onClick={() => {
                                  setSelectedTractorForDevice(tractor)
                                  setAddStep(4)
                                }}
                                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                                  isSelected
                                    ? "bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500 shadow-md"
                                    : "bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600"
                                }`}
                              >
                                <div className="flex items-center space-x-3.5">
                                  {tractor.image ? (
                                    <img
                                      src={tractor.image}
                                      alt={tractor.name}
                                      className="w-12 h-12 rounded-lg object-cover border border-slate-600"
                                    />
                                  ) : (
                                    <div className="w-12 h-12 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                                      <Truck className="w-6 h-6" />
                                    </div>
                                  )}
                                  <div>
                                    <h5 className="text-sm font-bold text-white">{tractor.name}</h5>
                                    <p className="text-xs text-slate-400">Model: {tractor.model} • Rate: ${tractor.hourly_price}/hr</p>
                                    {tractor.current_imei && (
                                      <p className="text-[11px] text-amber-400 mt-0.5">Currently linked to IMEI: {tractor.current_imei}</p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                  <span
                                    className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                      tractor.has_device
                                        ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                                        : "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                                    }`}
                                  >
                                    {tractor.has_device ? "Reassign Device" : "Ready for Device"}
                                  </span>
                                  <ChevronRight className="w-4 h-4 text-slate-500" />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}

                    </div>
                  )}

                  {/* STEP 4: CONFIGURE DEVICE */}
                  {addStep === 4 && selectedTractorForDevice && (
                    <form onSubmit={handleAddDeviceSubmit} className="space-y-4">
                      {/* Summary Breadcrumb Badge */}
                      <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Owner:</span>
                          <span className="font-semibold text-white">{selectedOwner?.owner_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Store:</span>
                          <span className="font-semibold text-white">{selectedStore?.store_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Tractor:</span>
                          <span className="font-bold text-emerald-400">{selectedTractorForDevice.name} ({selectedTractorForDevice.model})</span>
                        </div>
                      </div>

                      {deviceSubmitError && (
                        <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-xl text-red-300 text-xs flex items-center space-x-2">
                          <AlertCircle className="w-4 h-4 flex-shrink-0" />
                          <span>{deviceSubmitError}</span>
                        </div>
                      )}

                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                            Device IMEI / Unique Serial Number *
                          </label>
                          <input
                            type="text"
                            required
                            value={deviceImei}
                            onChange={(e) => setDeviceImei(e.target.value)}
                            placeholder="e.g. 864521049281726"
                            className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                          />
                          <p className="text-[11px] text-slate-500 mt-1">Found on the physical GPS hardware label or SIM card registration.</p>
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                            Device Friendly Name / Label (Optional)
                          </label>
                          <input
                            type="text"
                            value={deviceName}
                            onChange={(e) => setDeviceName(e.target.value)}
                            placeholder={`e.g. ${selectedTractorForDevice.name} Telemetry Unit`}
                            className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                            Coordinate Region
                          </label>
                          <div className="grid grid-cols-2 gap-2.5">
                            {[
                              { label: "SW (South West / Latin America)", value: "SW" },
                              { label: "NE (North East / Alternate)", value: "NE" },
                            ].map((reg) => (
                              <button
                                key={reg.value}
                                type="button"
                                onClick={() => setDeviceRegion(reg.value)}
                                className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all ${
                                  deviceRegion === reg.value
                                    ? "bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/20"
                                    : "bg-slate-800/60 text-slate-400 border-slate-700/60 hover:bg-slate-800 hover:text-white"
                                }`}
                              >
                                {reg.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Form Actions */}
                      <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setAddStep(3)}
                          className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-all flex items-center"
                        >
                          <ChevronLeft className="w-4 h-4 mr-1" /> Back
                        </button>
                        <button
                          type="submit"
                          disabled={submittingDevice}
                          className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/25 transition-all flex items-center disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                        >
                          {submittingDevice ? (
                            <>
                              <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent mr-2"></div>
                              Linking Device...
                            </>
                          ) : (
                            <>
                              <Check className="w-4 h-4 mr-1.5" /> Register & Link Device
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  )}
            </div>
          </div>
        </div>
      )}

      {/* GEOFENCES MANAGER MODAL */}
      {showGeofenceModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[9999]">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Geofence Zones</h3>
                  <p className="text-xs text-slate-400">Virtual perimeter alerts & boundary tracking</p>
                </div>
              </div>
              <button
                onClick={() => setShowGeofenceModal(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              {/* Overlay Toggle Switch */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <div>
                  <h5 className="text-xs font-bold text-white">Show Geofence Overlays on Map</h5>
                  <p className="text-[11px] text-slate-400">Render circular boundaries directly on Google Maps</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowGeofences(!showGeofences)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    showGeofences
                      ? "bg-amber-600 text-white shadow-md shadow-amber-600/30"
                      : "bg-slate-700 text-slate-300"
                  }`}
                >
                  {showGeofences ? "Overlays ON" : "Overlays OFF"}
                </button>
              </div>

              {/* Existing Geofences List */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                  Active Geofences ({geofences.length})
                </h4>
                {geofences.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/40 text-center text-xs text-slate-400">
                    No geofences created yet. Create one below!
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {geofences.map((gf: any) => {
                      const id = gf._id?.$oid || gf._id || gf.id || ""
                      return (
                        <div
                          key={id || gf.name}
                          className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/70 flex items-center justify-between hover:border-slate-600 transition-all"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white">{gf.name}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                                {gf.radius_meters || 500}m radius
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 font-mono">
                              Center: {Number(gf.center_lat || 0).toFixed(4)}, {Number(gf.center_lon || 0).toFixed(4)} • Alert: {gf.alert_on || "BOTH"}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                if (googleMapRef.current && gf.center_lat && gf.center_lon) {
                                  googleMapRef.current.panTo({ lat: Number(gf.center_lat), lng: Number(gf.center_lon) })
                                  googleMapRef.current.setZoom(16)
                                  setShowGeofenceModal(false)
                                }
                              }}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-white"
                              title="Center on Map"
                            >
                              Focus
                            </button>
                            {id && (
                              <button
                                type="button"
                                onClick={() => handleDeleteGeofence(id, gf.name)}
                                className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 transition-all"
                                title="Delete Geofence"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Create New Geofence Form */}
              <div className="pt-3 border-t border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2.5 flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" /> Create New Geofence Around Current View
                </h4>
                <form onSubmit={handleCreateGeofence} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Geofence Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Northern Farm Perimeter"
                      value={newGeofenceName}
                      onChange={(e) => setNewGeofenceName(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Radius (Meters)</label>
                      <input
                        type="number"
                        min="50"
                        max="50000"
                        step="50"
                        value={newGeofenceRadius}
                        onChange={(e) => setNewGeofenceRadius(Number(e.target.value))}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Alert Trigger</label>
                      <select
                        value={newGeofenceAlert}
                        onChange={(e: any) => setNewGeofenceAlert(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="BOTH">Entry & Exit (Both)</option>
                        <option value="ENTER">Entry Only</option>
                        <option value="EXIT">Exit Only</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={creatingGeofence}
                    className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 shadow-lg shadow-amber-600/25 transition-all flex items-center justify-center disabled:opacity-50"
                  >
                    {creatingGeofence ? (
                      <>
                        <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent mr-2"></div>
                        Creating Geofence...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-1.5" /> Save & Activate Geofence
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}