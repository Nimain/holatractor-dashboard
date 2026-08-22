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
} from "lucide-react"
import { renderInstance, TractorAIBaseURL } from "@/utils/Axios/RenderInstance"
import { useCookie } from "next-cookie"
import axios from "axios"
import { successMessage, errorMessage } from "@/utils/Toastify/Messages"

// Google Maps API Key - Replace with your actual API key
const GOOGLE_MAPS_API_KEY = "AIzaSyDjMCI0xj2Q-WTc9J7yWX-Mvh0DBM7oHbg"

// Device Base URL for GPS history
const DeviceBaseURL = "https://device.holatractor.com/"

const deviceInstance = axios.create({
  baseURL: DeviceBaseURL,
  headers: {
    "Content-Type": "application/json",
  },
})

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

// Load Google Maps Script
const loadGoogleMapsScript = (callback: () => void) => {
  if (typeof window !== 'undefined' && window.google) {
    callback()
    return
  }

  const existingScript = document.getElementById('google-maps-script')
  if (existingScript) {
    existingScript.addEventListener('load', callback)
    return
  }

  const script = document.createElement('script')
  script.id = 'google-maps-script'
  script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=geometry`
  script.async = true
  script.defer = true
  script.addEventListener('load', callback)
  document.head.appendChild(script)
}

const HistoryModalContent: React.FC<{
  gpsHistory: GPSLocation[]
  selectedDevice: Device | undefined
  mapCenter: { lat: number; lng: number }
  selectedFilter: string
}> = memo(({ gpsHistory, selectedDevice, mapCenter, selectedFilter }) => {
  const mapRef = useRef<HTMLDivElement>(null)
  const googleMapRef = useRef<google.maps.Map | null>(null)
  const polylineRef = useRef<google.maps.Polyline | null>(null)
  const markersRef = useRef<google.maps.Marker[]>([])

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
    return processedLocations.map((loc) => ({ lat: loc.fixedLat, lng: loc.fixedLon }))
  }, [processedLocations])

  useEffect(() => {
    if (!mapRef.current || !window.google) return

    // Initialize map
    if (!googleMapRef.current) {
      googleMapRef.current = new google.maps.Map(mapRef.current, {
        center: historyPath.length > 0 ? historyPath[0] : mapCenter,
        zoom: 15,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
      })
    }

    // Clear previous markers and polyline
    markersRef.current.forEach(marker => marker.setMap(null))
    markersRef.current = []
    if (polylineRef.current) {
      polylineRef.current.setMap(null)
    }

    // Draw polyline
    if (historyPath.length > 0) {
      polylineRef.current = new google.maps.Polyline({
        path: historyPath,
        geodesic: true,
        strokeColor: '#3B82F6',
        strokeOpacity: 0.8,
        strokeWeight: 4,
        map: googleMapRef.current,
      })

      // Add start marker (last in array - oldest)
      const startMarker = new google.maps.Marker({
        position: historyPath[historyPath.length - 1],
        map: googleMapRef.current,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#10B981',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
        },
        title: 'Start Point',
      })

      const startInfo = new google.maps.InfoWindow({
        content: `
          <div style="color: #000; padding: 5px;">
            <strong style="color: #10B981;">Start Point</strong><br/>
            Time: ${new Date(processedLocations[processedLocations.length - 1].timestamp).toLocaleString()}<br/>
            Speed: ${processedLocations[processedLocations.length - 1].speed} km/h
          </div>
        `
      })

      startMarker.addListener('click', () => {
        startInfo.open(googleMapRef.current, startMarker)
      })

      // Add end marker (first in array - newest)
      const endMarker = new google.maps.Marker({
        position: historyPath[0],
        map: googleMapRef.current,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#EF4444',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
        },
        title: 'End Point',
      })

      const endInfo = new google.maps.InfoWindow({
        content: `
          <div style="color: #000; padding: 5px;">
            <strong style="color: #EF4444;">End Point</strong><br/>
            Time: ${new Date(processedLocations[0].timestamp).toLocaleString()}<br/>
            Speed: ${processedLocations[0].speed} km/h
          </div>
        `
      })

      endMarker.addListener('click', () => {
        endInfo.open(googleMapRef.current, endMarker)
      })

      markersRef.current.push(startMarker, endMarker)

      // Fit bounds to show all markers
      const bounds = new google.maps.LatLngBounds()
      historyPath.forEach(point => bounds.extend(point))
      googleMapRef.current.fitBounds(bounds)
    }
  }, [historyPath, processedLocations, mapCenter])

  return (
    <div className="space-y-4">
      {/* Map with History Path */}
      <div className="h-96 rounded-lg overflow-hidden border border-white/20">
        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
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
          {processedLocations.slice(0, 3).map((location) => (
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
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 40.7128, lng: -74.006 })
  const [mapsLoaded, setMapsLoaded] = useState<boolean>(false)

  // History modal states
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false)
  const [historyLoading, setHistoryLoading] = useState<boolean>(false)
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [gpsHistory, setGpsHistory] = useState<GPSLocation[]>([])
  const [selectedFilter, setSelectedFilter] = useState<string>("today")

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
  const [deviceImei, setDeviceImei] = useState<string>("")
  const [deviceName, setDeviceName] = useState<string>("")
  const [deviceRegion, setDeviceRegion] = useState<string>("SW")
  const [submittingDevice, setSubmittingDevice] = useState<boolean>(false)
  const [deviceSubmitError, setDeviceSubmitError] = useState<string | null>(null)

  // Inline Quick Store Creation states
  const [showCreateStoreModal, setShowCreateStoreModal] = useState<boolean>(false)
  const [newStoreName, setNewStoreName] = useState<string>("")
  const [newStoreDescription, setNewStoreDescription] = useState<string>("")
  const [newStoreImage, setNewStoreImage] = useState<string>("")
  const [creatingStore, setCreatingStore] = useState<boolean>(false)
  const [createStoreError, setCreateStoreError] = useState<string | null>(null)

  // Inline Quick Add Tractor states
  const [showAddTractorModal, setShowAddTractorModal] = useState<boolean>(false)
  const [selectedBaseTractorId, setSelectedBaseTractorId] = useState<string>("")
  const [newTractorHourlyPrice, setNewTractorHourlyPrice] = useState<number>(20)
  const [creatingTractor, setCreatingTractor] = useState<boolean>(false)
  const [createTractorError, setCreateTractorError] = useState<string | null>(null)

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

  // Fetch devices from API
  useEffect(() => {
    fetchDevices()
  }, [])

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
          const fastApiUrl = `${(TractorAIBaseURL || "http://127.0.0.1:8000/").replace(/\/$/, "")}/api/v1/admin/devices/options?${queryParams.toString()}`
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
          const fastApiUrl = `${(TractorAIBaseURL || "http://127.0.0.1:8000/").replace(/\/$/, "")}/api/v1/admin/devices`
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
          setMapCenter({ lat: transformedDevices[0].lat, lng: transformedDevices[0].lng })
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
    if (device && googleMapRef.current) {
      googleMapRef.current.panTo({ lat: device.lat, lng: device.lng })
      googleMapRef.current.setZoom(15)
    }
  }

  // Initialize Google Map
  useEffect(() => {
    if (!mapRef.current || !mapsLoaded || !window.google) return

    if (!googleMapRef.current) {
      googleMapRef.current = new google.maps.Map(mapRef.current, {
        center: mapCenter,
        zoom: 13,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
      })
    }
  }, [mapsLoaded, mapCenter])

  // Update markers when devices change
  useEffect(() => {
    if (!googleMapRef.current || !mapsLoaded || !window.google) return

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null))
    markersRef.current.clear()

    // Add new markers
    devices.forEach((device) => {
      const isSelected = selectedTractor === device.id
      const marker = new google.maps.Marker({
        position: { lat: device.lat, lng: device.lng },
        map: googleMapRef.current,
        icon: {
          url: device.tractorImage || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><circle cx="24" cy="24" r="20" fill="%231F2937" stroke="%233B82F6" stroke-width="3"/></svg>',
          scaledSize: new google.maps.Size(48, 48),
          anchor: new google.maps.Point(24, 48),
        },
        title: device.name,
      })

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="color: #000; padding: 10px; max-width: 200px;">
            ${device.tractorImage ? `<img src="${device.tractorImage}" style="width: 100%; border-radius: 4px; margin-bottom: 8px;" />` : ''}
            <strong>${device.name}</strong><br/>
            ${device.field}<br/>
            Status: ${device.status}<br/>
            Model: ${device.model}
          </div>
        `
      })

      marker.addListener('click', () => {
        handleMarkerClick(device.id)
        infoWindow.open(googleMapRef.current, marker)
      })

      markersRef.current.set(device.id, marker)
    })
  }, [devices, mapsLoaded, selectedTractor])

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
          <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
        </div>

        {/* CONTROL PANEL */}
        {!isFullscreen && (
          <div className="w-full md:w-80 flex-shrink-0 bg-white/5 md:bg-transparent backdrop-blur-xl border-t md:border-t-0 md:border-l border-white/10 relative z-10">
            <div className="flex flex-col h-full max-h-[80vh] md:max-h-screen overflow-y-auto p-4 sm:p-6 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Tractor Control</h2>
                  <div className="flex items-center space-x-2 mt-0.5">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                    <span className="text-emerald-400 text-xs font-semibold uppercase tracking-wider">LIVE TELEMETRY</span>
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
                    <Truck className="w-4 h-4 mr-2 text-emerald-400" /> Active Devices ({devices.length})
                  </h3>
                  <button onClick={fetchDevices} className="text-xs text-slate-400 hover:text-white flex items-center transition-colors">
                    <RefreshCw className="w-3 h-3 mr-1" /> Refresh
                  </button>
                </div>
                <div className="space-y-2">
                  {devices.map((device) => (
                    <div
                      key={device.id}
                      onClick={() => handleMarkerClick(device.id)}
                      className={`p-3 rounded-xl cursor-pointer transition-all duration-300 ${
                        selectedTractor === device.id
                          ? "bg-gradient-to-r from-emerald-500/30 to-emerald-400/10 border-2 border-emerald-400/60"
                          : "bg-white/10 hover:bg-white/20 border border-white/10"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        {device.tractorImage && (
                          <img
                            src={device.tractorImage}
                            alt={device.name}
                            className="w-12 h-12 rounded-full object-cover border-2 border-white/20"
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
                      <img
                        src={selectedDevice.tractorImage}
                        alt={selectedDevice.name}
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
                <button className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-700/20">
                  <Radio className="w-5 h-5 mr-2" /> Live Tracker Ping
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

      {/* GPS HISTORY MODAL */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-slate-700/60 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-950/50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight">GPS Telemetry History</h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">{selectedDevice?.name || "Active Tracking Device"}</p>
                </div>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl p-2 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-auto p-6" style={{ scrollbarWidth: "none" }}>
              {historyLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-emerald-500 border-t-transparent mx-auto mb-4"></div>
                    <p className="text-slate-300 text-sm font-medium">Fetching real-time GPS telemetry...</p>
                  </div>
                </div>
              ) : historyError ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                    <p className="text-slate-200 text-sm mb-4">{historyError}</p>
                    <button
                      onClick={() => selectedTractor && fetchGPSHistory(selectedTractor)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-md active:scale-[0.98]"
                    >
                      Retry Connection
                    </button>
                  </div>
                </div>
              ) : gpsHistory.length === 0 ? (
                <div className="flex items-center justify-center h-64">
                  <p className="text-slate-400 text-sm">No GPS historical coordinates found for this device</p>
                </div>
              ) : (
                <>
                  <div className="mb-6 pb-6 border-b border-slate-800">
                    <h4 className="text-xs uppercase tracking-wider font-semibold text-slate-400 mb-3">Time Range Filter</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {[
                        { label: "Today", value: "today" },
                        { label: "Yesterday", value: "yesterday" },
                        { label: "Last 7 Days", value: "week" },
                        { label: "Last 30 Days", value: "month" },
                      ].map((filter) => (
                        <button
                          key={filter.value}
                          onClick={() => setSelectedFilter(filter.value)}
                          className={`px-4 py-2.5 rounded-xl font-semibold text-xs transition-all duration-200 ${
                            selectedFilter === filter.value
                              ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 border border-emerald-500"
                              : "bg-slate-800/80 text-slate-300 border border-slate-700/60 hover:bg-slate-800 hover:text-white"
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
                              <label className="block text-[11px] font-bold uppercase text-slate-300 mb-1.5">
                                Select Tractor Model from Catalog *
                              </label>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1 bg-slate-900/80 rounded-xl border border-slate-800">
                                {availableBaseTractors.map((bt) => {
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
                                })}
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
                      ) : (
                        <div className="space-y-2.5 max-h-[48vh] overflow-y-auto">
                          {selectedStore.tractors.map((tractor) => {
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
    </>
  )
}