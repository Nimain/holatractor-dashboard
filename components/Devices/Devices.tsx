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

const filterGPSByTimeRange = (history: GPSLocation[], filterType: string): GPSLocation[] => {
  if (!Array.isArray(history) || history.length === 0) return []
  const now = new Date()
  let startDate: Date

  switch (filterType) {
    case "today":
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      break
    case "yesterday": {
      const yesterday = new Date(now)
      yesterday.setDate(yesterday.getDate() - 1)
      startDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate())
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const filtered = history.filter((h) => {
        const hDate = new Date(h.timestamp || h.created_at)
        return hDate >= startDate && hDate < todayStart
      })
      return filtered.length > 0 ? filtered : history.slice(0, 50)
    }
    case "week":
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case "month":
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      break
    case "all":
    default:
      return history
  }

  const filtered = history.filter((h) => new Date(h.timestamp || h.created_at) >= startDate)
  return filtered.length > 0 ? filtered : history.slice(0, 50)
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



export default function DeviceSection() {
  const [selectedTractor, setSelectedTractor] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false)
  const [devices, setDevices] = useState<Device[]>([])
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
  const [customStartDate, setCustomStartDate] = useState<string>(DeviceLocationService.getTodayDate())
  const [customEndDate, setCustomEndDate] = useState<string>(DeviceLocationService.getTodayDate())
  const [motionFilter, setMotionFilter] = useState<"all" | "moving" | "stopped">("all")
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false)
  const [showRoutePath, setShowRoutePath] = useState<boolean>(true)
  const [mapType, setMapType] = useState<"roadmap" | "satellite" | "hybrid">("hybrid")
  const [historyLoading, setHistoryLoading] = useState<boolean>(false)
  const [historyLocations, setHistoryLocations] = useState<DeviceLocationData[]>([])
  const historyPolylineRef = useRef<google.maps.Polyline | null>(null)
  const startMarkerRef = useRef<google.maps.Marker | null>(null)
  const waypointMarkersRef = useRef<google.maps.Marker[]>([])

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

  // Calculate live route telemetry analytics for the filtered history
  const routeStats = useMemo(() => {
    if (!displayHistoryLocations || displayHistoryLocations.length === 0) {
      return { distanceKm: 0, maxSpeed: 0, avgSpeed: 0, count: 0, movingPoints: 0, stoppedPoints: 0 }
    }

    let totalDist = 0
    let maxSpeed = 0
    let sumSpeed = 0
    let moving = 0
    let stopped = 0

    for (let i = 0; i < displayHistoryLocations.length; i++) {
      const pt = displayHistoryLocations[i]
      const sp = Number(pt.speed || 0)
      if (sp > maxSpeed) maxSpeed = sp
      sumSpeed += sp
      if (sp > 0) moving++
      else stopped++

      if (i > 0) {
        const prev = displayHistoryLocations[i - 1]
        const R = 6371 // km
        const dLat = (pt.lat - prev.lat) * (Math.PI / 180)
        const dLon = (pt.lon - prev.lon) * (Math.PI / 180)
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(prev.lat * (Math.PI / 180)) *
            Math.cos(pt.lat * (Math.PI / 180)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        const d = R * c
        if (!isNaN(d) && d < 150) {
          totalDist += d
        }
      }
    }

    return {
      distanceKm: Number(totalDist.toFixed(2)),
      maxSpeed: Math.round(maxSpeed),
      avgSpeed: Math.round(sumSpeed / displayHistoryLocations.length),
      count: displayHistoryLocations.length,
      movingPoints: moving,
      stoppedPoints: stopped,
    }
  }, [displayHistoryLocations])


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
  }, [])


  // Load main map route for selected tractor with current filter
  const loadMainMapRoute = async (
    deviceImei: string,
    filterVal = selectedFilter,
    startD = customStartDate,
    endD = customEndDate
  ) => {
    if (!deviceImei) return
    setHistoryLoading(true)
    try {
      const dev = devices.find((d) => d.id === deviceImei)
      const devRegion = dev?.region || "SW"

      console.log("[Devices Main Map] Loading route history for:", deviceImei, "Filter:", filterVal, "Region:", devRegion, "Dates:", startD, endD)

      const params: any = {}
      if (filterVal === "custom") {
        params.start_date = startD
        params.end_date = endD
        params.range = undefined
        params.filter = undefined
      } else if (filterVal !== "all") {
        params.range = filterVal
        params.filter = filterVal
      }

      const historyData = await DeviceLocationService.getDeviceLocationHistory(
        deviceImei,
        params,
        devRegion
      )

      setHistoryLocations(historyData || [])
    } catch (err) {
      console.warn("[Devices Main Map] Error loading route history:", err)
      setHistoryLocations([])
    } finally {
      setHistoryLoading(false)
    }
  }

  // Reload main map route whenever selected tractor or filter changes
  useEffect(() => {
    if (selectedTractor) {
      loadMainMapRoute(selectedTractor, selectedFilter, customStartDate, customEndDate)
    } else {
      setHistoryLocations([])
    }
  }, [selectedTractor, selectedFilter, customStartDate, customEndDate])


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

        // Smoothly animate Google Maps marker position and heading rotation
        const marker = markersRef.current.get(data.imei)
        if (marker && window.google) {
          const newPos = new window.google.maps.LatLng(fixedLat, fixedLon)
          marker.setPosition(newPos)
          marker.setIcon(
            getGoogleMapsTractorIcon({
              course: courseVal,
              isSelected: selectedTractor === data.imei,
              isLive: true,
              isMoving: speedVal > 0.5,
              status: "Active",
              size: 72,
            })
          )
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
                status: "Active",
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

      // 2. Direct FastAPI localhost /api/v1/admin/devices/options
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
    if (!ownerSearchTerm.trim()) return deviceOptions
    const term = ownerSearchTerm.toLowerCase().trim()
    const cleanDigits = term.replace(/\D/g, "")

    return deviceOptions.filter((o) => {
      const nameMatch = o.owner_name.toLowerCase().includes(term)
      const emailMatch = o.owner_email.toLowerCase().includes(term)
      const mob = (o.owner_mobile || "").toLowerCase()
      const mobDigits = mob.replace(/\D/g, "")
      const mobileMatch = mob.includes(term) || (cleanDigits.length >= 3 && mobDigits.includes(cleanDigits))
      const storeMatch = o.stores.some((s) => s.store_name.toLowerCase().includes(term))
      const tractorMatch = o.stores.some((s) =>
        s.tractors.some(
          (t) =>
            t.name.toLowerCase().includes(term) ||
            t.model.toLowerCase().includes(term) ||
            (t.current_imei && t.current_imei.toLowerCase().includes(term))
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
        if (localRes.data?.success && Array.isArray(localRes.data?.data) && localRes.data.data.length > 0) {
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
          if (response.data?.success && Array.isArray(response.data?.data)) {
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
          const rawLat = Number.parseFloat(device.tractorInStore?.store?.location?.lat || "0")
          const rawLon = Number.parseFloat(device.tractorInStore?.store?.location?.lan || "0")
          const region = device.device_region || "SW"

          return {
            id: device.device_imei,
            name: device.tractorInStore?.baseTractor?.name || "Unknown Tractor",
            lat: rawLat,
            lng: rawLon,
            speed: 0,
            course: 0,
            battery: 0,
            lastSeen: device.updatedAt || new Date().toISOString(),
            field: device.tractorInStore?.store?.name || "Unknown Store",
            status: "Not Connected",
            hasGps: false,
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
          setMapCenter({ lat: transformedDevices[0].lat, lng: transformedDevices[0].lng })
        }

        // Concurrently fetch real-time GPS locations from device.holatractor.com for all devices
        try {
          const gpsPromises = transformedDevices.map(async (dev) => {
            try {
              const gpsData = await DeviceLocationService.getCurrentDeviceLocation(dev.id, dev.region)
              if (gpsData && gpsData.lat && gpsData.lon && !isNaN(gpsData.lat) && !isNaN(gpsData.lon) && gpsData.lat !== 0 && gpsData.lon !== 0) {
                return {
                  id: dev.id,
                  lat: Number(gpsData.lat),
                  lng: Number(gpsData.lon),
                  speed: gpsData.speed || 0,
                  course: gpsData.course || 0,
                  battery: gpsData.battery_level || 85,
                  lastSeen: gpsData.timestamp || gpsData.created_at,
                  status: "Active",
                  hasGps: true,
                }
              }
            } catch (err) {
              console.warn(`[Devices] Device ${dev.id} not responding to GPS query:`, err)
            }
            return {
              id: dev.id,
              status: "Not Connected",
              hasGps: false,
            }
          })

          const resolvedGps = await Promise.all(gpsPromises)
          setDevices((prev) =>
            prev.map((d) => {
              const gps = resolvedGps.find((r) => r && r.id === d.id)
              if (gps) {
                return { ...d, ...gps }
              }
              return d
            })
          )

          // If selected tractor resolved to a valid GPS location, center map there
          const firstGps = resolvedGps.find((r) => r && r.hasGps && r.lat && r.lng)
          if (firstGps && firstGps.lat && firstGps.lng) {
            setMapCenter({ lat: firstGps.lat, lng: firstGps.lng })
          }
        } catch (gpsError) {
          console.warn("[Devices] Failed to resolve initial GPS from device.holatractor.com:", gpsError)
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
        setDevices((prev) =>
          prev.map((d) =>
            d.id === dev.id
              ? {
                  ...d,
                  lat: Number(latest.lat),
                  lng: Number(latest.lon),
                  speed: latest.speed || d.speed,
                  course: latest.course || d.course,
                  battery: latest.battery_level || d.battery,
                  lastSeen: latest.timestamp || latest.created_at,
                  status: "Active",
                  hasGps: true,
                }
              : d
          )
        )
        if (googleMapRef.current) {
          googleMapRef.current.panTo({ lat: Number(latest.lat), lng: Number(latest.lon) })
          googleMapRef.current.setZoom(16)
        }
        // Refresh route history as well
        loadMainMapRoute(dev.id, selectedFilter, customStartDate, customEndDate)
        successMessage(`✅ Ping successful: ${latest.speed || 0} km/h • Battery ${latest.battery_level || 85}% • Lat ${latest.lat.toFixed(4)}, Lon ${latest.lon.toFixed(4)}`)
      } else {
        setDevices((prev) =>
          prev.map((d) => (d.id === dev.id ? { ...d, status: "Not Connected", hasGps: false } : d))
        )
        errorMessage("Device is offline / No GPS response received.")
      }
    } catch (err: any) {
      setDevices((prev) =>
        prev.map((d) => (d.id === dev.id ? { ...d, status: "Not Connected", hasGps: false } : d))
      )
      errorMessage(err?.message || "Device ping timed out.")
    } finally {
      setPinging(false)
    }
  }


  const toggleFullscreen = () => setIsFullscreen(!isFullscreen)

  const getSelectedDevice = (): Device | undefined => {
    return devices.find((d) => d.id === selectedTractor)
  }

  const handleMarkerClick = (deviceId: string) => {
    setSelectedTractor(deviceId)
    const device = devices.find((d) => d.id === deviceId)
    if (device && googleMapRef.current) {
      googleMapRef.current.panTo({ lat: device.lat, lng: device.lng })
      googleMapRef.current.setZoom(16)
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

  // Update marker for ONLY the selected tractor on the map
  useEffect(() => {
    if (!googleMapRef.current || !mapsLoaded || typeof window === "undefined" || !window.google?.maps?.Marker) return

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.setMap(null))
    markersRef.current.clear()

    const selectedDev = devices.find((d) => d.id === selectedTractor) || devices[0]
    if (!selectedDev) return

    const marker = new window.google.maps.Marker({
      position: { lat: selectedDev.lat, lng: selectedDev.lng },
      map: googleMapRef.current,
      icon: getGoogleMapsTractorIcon({
        course: selectedDev.course || 0,
        isSelected: true,
        isLive: isSocketConnected,
        isMoving: (selectedDev.speed || 0) > 0.5,
        status: selectedDev.status,
        size: 72,
      }),
      title: `${selectedDev.name} (IMEI: ${selectedDev.id})`,
      zIndex: 100,
    })

    const infoWindow = new window.google.maps.InfoWindow({
      content: `
        <div style="color: #000; padding: 8px; font-family: system-ui, -apple-system, sans-serif; max-width: 220px;">
          ${selectedDev.tractorImage ? `<img src="${selectedDev.tractorImage}" style="width: 100%; height: 90px; object-fit: cover; border-radius: 6px; margin-bottom: 8px;" />` : ""}
          <div style="font-weight: 700; font-size: 14px; color: #0F172A; margin-bottom: 2px;">${selectedDev.name}</div>
          <div style="font-size: 12px; color: #475569; margin-bottom: 4px;">${selectedDev.field}</div>
          <div style="display: flex; gap: 4px; margin-bottom: 6px;">
            <span style="font-size: 10px; font-weight: 600; padding: 2px 6px; border-radius: 4px; background: ${selectedDev.status === "Active" ? "#DCFCE7; color: #166534;" : "#FEF3C7; color: #92400E;"}">${selectedDev.status}</span>
            <span style="font-size: 10px; font-weight: 600; padding: 2px 6px; border-radius: 4px; background: #F1F5F9; color: #475569;">${selectedDev.region}</span>
          </div>
          <div style="font-size: 11px; color: #334155; line-height: 1.4;">
            <strong>Speed:</strong> ${(selectedDev.speed || 0).toFixed(1)} km/h<br/>
            <strong>Heading:</strong> ${selectedDev.course || 0}°<br/>
            <strong>Battery:</strong> ${selectedDev.battery || 85}%<br/>
            <span style="font-size: 10px; color: #64748B; font-family: monospace;">Lat: ${selectedDev.lat.toFixed(5)}, Lon: ${selectedDev.lng.toFixed(5)}</span>
          </div>
        </div>
      `,
    })

    marker.addListener("click", () => {
      infoWindow.open(googleMapRef.current, marker)
    })

    markersRef.current.set(selectedDev.id, marker)
  }, [devices, mapsLoaded, selectedTractor, isSocketConnected])

  // Draw Route History Polyline directly on the Main Map for selected tractor
  useEffect(() => {
    if (!googleMapRef.current || !mapsLoaded || !window.google) return

    // Clear previous route polyline and markers
    if (historyPolylineRef.current) {
      historyPolylineRef.current.setMap(null)
      historyPolylineRef.current = null
    }
    if (startMarkerRef.current) {
      startMarkerRef.current.setMap(null)
      startMarkerRef.current = null
    }
    waypointMarkersRef.current.forEach((m) => m.setMap(null))
    waypointMarkersRef.current = []

    if (!selectedTractor) return

    const selectedDev = devices.find((d) => d.id === selectedTractor)

    if (!showRoutePath || displayHistoryLocations.length === 0) {
      // If no route points for this filter, focus on device current position
      if (selectedDev && selectedDev.lat !== 0 && selectedDev.lng !== 0) {
        googleMapRef.current.panTo({ lat: selectedDev.lat, lng: selectedDev.lng })
        googleMapRef.current.setZoom(16)
      }
      return
    }

    const path = displayHistoryLocations.map((loc) => ({ lat: loc.lat, lng: loc.lon }))

    if (path.length > 0) {
      // Draw smooth blue route polyline
      historyPolylineRef.current = new window.google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: "#3B82F6",
        strokeOpacity: 0.85,
        strokeWeight: 4,
        map: googleMapRef.current,
      })

      // Add Start Point Marker (oldest point at path.length - 1)
      if (path.length > 1) {
        const startPoint = path[path.length - 1]
        const startLoc = displayHistoryLocations[displayHistoryLocations.length - 1]
        startMarkerRef.current = new window.google.maps.Marker({
          position: startPoint,
          map: googleMapRef.current,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: "#10B981",
            fillOpacity: 1,
            strokeColor: "#FFFFFF",
            strokeWeight: 2,
          },
          title: `Start Point (${new Date(startLoc.timestamp).toLocaleTimeString()})`,
          zIndex: 50,
        })
      }

      // Add small waypoint dots for intermediate locations
      if (path.length > 2) {
        const step = Math.max(1, Math.floor(path.length / 25))
        for (let i = 1; i < path.length - 1; i += step) {
          const pt = path[i]
          const loc = displayHistoryLocations[i]
          const wpMarker = new window.google.maps.Marker({
            position: pt,
            map: googleMapRef.current,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 3.5,
              fillColor: "#60A5FA",
              fillOpacity: 0.9,
              strokeColor: "#FFFFFF",
              strokeWeight: 1,
            },
            title: `Waypoint #${i + 1} • ${(loc.speed || 0).toFixed(1)} km/h • ${new Date(loc.timestamp).toLocaleTimeString()}`,
            zIndex: 30,
          })
          waypointMarkersRef.current.push(wpMarker)
        }
      }

      // Fit map bounds to show complete tractor route and adjust zoom dynamically
      const bounds = new window.google.maps.LatLngBounds()
      path.forEach((p) => bounds.extend(p))

      const ne = bounds.getNorthEast()
      const sw = bounds.getSouthWest()
      const latDiff = Math.abs(ne.lat() - sw.lat())
      const lngDiff = Math.abs(ne.lng() - sw.lng())

      if (path.length > 1 && (latDiff > 0.0003 || lngDiff > 0.0003)) {
        googleMapRef.current.fitBounds(bounds, { top: 80, right: 60, bottom: 90, left: 60 })
      } else {
        googleMapRef.current.panTo(path[0])
        googleMapRef.current.setZoom(16)
      }
    }
  }, [displayHistoryLocations, showRoutePath, selectedTractor, mapsLoaded, devices])


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
                      selectedDevice.hasGps || selectedDevice.status === "Active"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                    }`}
                  >
                    {selectedDevice.hasGps || selectedDevice.status === "Active" ? "Connected" : "Not Connected"}
                  </span>
                </div>
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
              {/* Map Type Switcher */}
              <div className="flex items-center gap-1 border-r border-slate-700/80 pr-1.5 mr-0.5">
                <button
                  onClick={() => setMapType("hybrid")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    mapType === "hybrid" || mapType === "satellite"
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                  title="Satellite View with Road Overlays"
                >
                  🛰️ Satellite
                </button>
                <button
                  onClick={() => setMapType("roadmap")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    mapType === "roadmap"
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                  title="Standard Street Map"
                >
                  🗺️ Map
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
              ].map((f) => (
                <button
                  key={f.value}
                  onClick={() => {
                    setSelectedFilter(f.value)
                    setShowDatePicker(false)
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    selectedFilter === f.value
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  {f.label}
                </button>
              ))}

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
              <div className="px-3 py-1 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700/80 shadow-lg text-[11px] text-slate-300 flex items-center gap-3 font-semibold pointer-events-auto">
                <span className="flex items-center gap-1 text-blue-300">
                  <Route className="w-3.5 h-3.5" />
                  {historyLoading ? (
                    <span className="flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin text-blue-400" /> Querying route...
                    </span>
                  ) : (
                    <span>{routeStats.count} Waypoints</span>
                  )}
                </span>

                <span className="text-slate-600">•</span>

                <span className="flex items-center gap-1 text-emerald-300">
                  <span>🛣️</span>
                  <span>{routeStats.distanceKm} km</span>
                </span>

                <span className="text-slate-600">•</span>

                <span className="flex items-center gap-1 text-amber-300">
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
                        selectedDevice.hasGps || selectedDevice.status === "Active"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                          : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                      }`}
                    >
                      {selectedDevice.hasGps || selectedDevice.status === "Active" ? "GPS Active" : "Not Connected"}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Speed</span>
                    <span className={`text-sm font-bold font-mono ${
                      (selectedDevice.speed || 0) > 0 ? "text-emerald-400" : "text-white"
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
                    <span className="text-sm font-bold text-blue-400 font-mono">
                      {historyLoading ? "Loading..." : `${historyLocations.length} Waypoints`}
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
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-semibold flex items-center text-sm">
                    <Truck className="w-4 h-4 mr-2 text-emerald-400" /> Active Fleet ({devices.length})
                  </h3>
                  <button onClick={fetchDevices} className="text-xs text-slate-400 hover:text-white flex items-center transition-colors">
                    <RefreshCw className="w-3 h-3 mr-1" /> Refresh
                  </button>
                </div>
                <div className="space-y-2">
                  {devices.map((device) => {
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
                            <span className="text-[10px] text-gray-400 uppercase font-mono">{device.region}</span>
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
                          (selectedDevice.speed || 0) > 0 ? "text-emerald-400 animate-pulse" : "text-white"
                        }`}>
                          {(selectedDevice.speed || 0).toFixed(1)} km/h
                        </span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          (selectedDevice.speed || 0) > 0
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                            : "bg-slate-700 text-slate-300"
                        }`}>
                          {(selectedDevice.speed || 0) > 0 ? "In Motion" : "Stationary"}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
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
                  className="w-full bg-gradient-to-r from-blue-500/80 to-blue-600/70 hover:from-blue-500 hover:to-blue-500 disabled:opacity-50 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center"
                >
                  <History className="w-5 h-5 mr-2" /> {showRoutePath ? "Hide Route on Map" : "Show Route on Map"}
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
                      <UserIcon className="w-4 h-4 mr-2 text-emerald-400" /> Step 1: Select Owner ({deviceOptions.length}
                      {totalOwnersCount > deviceOptions.length ? ` of ${totalOwnersCount}` : ""})
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
                    {optionsLoading && deviceOptions.length === 0 ? (
                      <div className="py-16 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent mx-auto mb-3"></div>
                        <p className="text-slate-400 text-xs font-medium">Searching owners in database...</p>
                      </div>
                    ) : deviceOptions.length === 0 ? (
                      <div className="py-12 text-center text-slate-400 text-sm">
                        No owners matching &quot;{ownerSearchTerm}&quot; found.
                      </div>
                    ) : (
                      deviceOptions.map((owner) => {
                            const isSelected = selectedOwner?.owner_id === owner.owner_id
                            const totalTractors = owner.stores.reduce((acc, s) => acc + s.tractors.length, 0)
                            return (
                              <div
                                key={owner.owner_id}
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
                                  {owner.owner_image ? (
                                    <img
                                      src={owner.owner_image}
                                      alt={owner.owner_name}
                                      className="w-10 h-10 rounded-full object-cover border border-slate-600"
                                    />
                                  ) : (
                                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20 flex items-center justify-center text-sm">
                                      {owner.owner_name.slice(0, 2).toUpperCase()}
                                    </div>
                                  )}
                                  <div>
                                    <h5 className="text-sm font-semibold text-white">{owner.owner_name}</h5>
                                    <div className="flex flex-wrap items-center gap-x-2 text-xs text-slate-400 mt-0.5">
                                      {owner.owner_email && <span>{owner.owner_email}</span>}
                                      {owner.owner_mobile && (
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
                                      {owner.stores.length} {owner.stores.length === 1 ? "Store" : "Stores"}
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