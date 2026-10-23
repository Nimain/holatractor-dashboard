"use client"

import React, { useState, useEffect } from "react"
import { ArrowLeft, Share2, Camera, MapPin, Clock, Calendar, Plus, Search, Loader2, Tractor, Wrench, Check, Copy, RefreshCw, Building2 } from "lucide-react"
import Image from "next/image"
import { getSafeImageSrc, isValidImageSrc } from "@/utils/image/safeImage"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { X } from 'lucide-react'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useParams, useRouter } from "next/navigation"
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import { Icon } from "leaflet"
import { useCookie } from "next-cookie"

// Custom components and utilities
import { EnhancedTractorCard } from "./Modals/EnhancedTractorCard"
import { AttachmentCard } from "@/components/Dashboards/Dealer/_components/AttachmentCard"
import AddTractor from "@/components/Dashboards/Dealer/_components/AddTractor"
import AddAttachment from "@/components/Dashboards/Dealer/_components/AddAttachment"
import AlternatingAddForm from "@/components/Dashboards/Dealer/_components/AlternatingAddForm"
import { renderInstance } from "@/utils/Axios/RenderInstance"
import axios from "axios"
import type { Attachment, DealerStore } from "@/utils/Types/types"
import { errorMessage, successMessage } from "@/utils/Toastify/Messages"

// Map styling overlay
const MapStyles = () => (
  <style jsx global>{`
    .leaflet-container {
      z-index: 1 !important;
    }
    .leaflet-control-container {
      z-index: 2 !important;
    }
    .leaflet-popup {
      z-index: 3 !important;
    }
    .leaflet-marker-pane {
      z-index: 2 !important;
    }
    .leaflet-tile-pane {
      z-index: 1 !important;
    }
    [data-radix-dialog-overlay] {
      z-index: 9998 !important;
    }
    [data-radix-dialog-content] {
      z-index: 9999 !important;
    }
  `}</style>
)

// Reverse geocoding hook
const useReverseGeocode = (lat: string, lng: string) => {
  const [address, setAddress] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>("")

  useEffect(() => {
    if (!lat || !lng) return

    const fetchAddress = async () => {
      setLoading(true)
      setError("")
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
          {
            headers: {
              "User-Agent": "HolaTractorDealerApp/2.0",
            },
          },
        )
        if (!response.ok) {
          throw new Error("Failed to fetch address")
        }
        const data = await response.json()
        if (data.display_name) {
          setAddress(data.display_name)
        } else {
          setError("Address not found")
        }
      } catch (err) {
        console.error("Reverse geocoding error:", err)
        setError("Failed to load address")
      } finally {
        setLoading(false)
      }
    }

    const timeoutId = setTimeout(fetchAddress, 500)
    return () => clearTimeout(timeoutId)
  }, [lat, lng])

  return { address, loading, error }
}

const EmptyStateCard = ({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}) => (
  <Card className="w-full max-w-md mx-auto text-center p-8 bg-white border border-slate-200/90 rounded-2xl shadow-xs">
    <CardContent className="space-y-4 p-0">
      <div className="bg-red-50 rounded-2xl p-4 mx-auto w-16 h-16 flex items-center justify-center text-[#A10A0C]">
        <Wrench className="w-8 h-8" />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-bold text-gray-900">{title}</h3>
        <p className="text-xs text-gray-500 max-w-xs mx-auto">{description}</p>
      </div>
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          className="bg-[#A10A0C] hover:bg-[#85080A] text-white rounded-xl text-xs font-semibold px-4 h-9 shadow-sm"
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          {actionLabel}
        </Button>
      )}
    </CardContent>
  </Card>
)

export default function StorePage() {
  const router = useRouter()
  const [selectedTab, setSelectedTab] = useState("overview")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showAllTractors, setShowAllTractors] = useState(false)
  const [showAllAttachments, setShowAllAttachments] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [equipmentSearch, setEquipmentSearch] = useState("")
  const [copiedId, setCopiedId] = useState(false)
  const [store, setStore] = useState<DealerStore | null>(null)
  const [fetchingStore, setFetchingStore] = useState(false)
  const [allAttachments, setAllAttachments] = useState<Attachment[]>([])
  const [fetchingAttachments, setFetchingAttachments] = useState(false)

  // State for the separate attachment price dialog
  const [activeAttachmentIdForPrice, setActiveAttachmentIdForPrice] = useState<string | null>(null)
  const [attachmentPrice, setAttachmentPrice] = useState(0)
  const [adding, setAdding] = useState(false)

  // Custom marker icon setup
  const [mapIcon, setMapIcon] = useState<any>(null)

  // Use reverse geocoding hook
  const {
    address: geocodedAddress,
    loading: geocodeLoading,
    error: geocodeError,
  } = useReverseGeocode(store?.location?.lat || "", store?.location?.lan || "")

  useEffect(() => {
    if (typeof window !== "undefined") {
      setMapIcon(
        new Icon({
          iconUrl:
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQEwUaVgCulxdLINyfmLUvymRmLIod3DN-6l76heo-SX4fWtunqdkVw9yE4VI0znfObci8&usqp=CAU",
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41],
        }),
      )
    }
  }, [])

  const { slug } = useParams()
  const { cookie } = useCookie()
  const access_token = cookie?.get ? cookie.get("access_token") : null

  // Filter functions for the attachment selection modal
  const filteredAttachments = allAttachments.filter((attachment) =>
    attachment.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // API Functions
  async function fetchStore() {
    if (!slug) return
    setFetchingStore(true)
    try {
      try {
        const localRes = await axios.get(`/api/dealer/store/${slug}`, {
          headers: access_token ? { Authorization: `Bearer ${access_token}` } : {},
          timeout: 8000,
        })
        if (localRes.status === 200 && localRes.data && localRes.data.id) {
          setStore(localRes.data)
          return
        }
      } catch (localErr) {
        console.warn("Direct /api/dealer/store fetch attempt:", localErr)
      }

      try {
        const localRes = await axios.get(`/api/dealer/store/${slug}`, {
          headers: access_token ? { Authorization: `Bearer ${access_token}` } : {},
          timeout: 8000,
        })
        if (localRes.status === 200 && localRes.data && localRes.data.id) {
          setStore(localRes.data)
          return
        }
      } catch (localErr) {
        console.warn("Direct /api/dealer/store fetch attempt:", localErr)
      }

      const res = await renderInstance.get(`/dealer/store/${slug}`)
      setStore(res.data)
    } catch (err: any) {
      console.error("Error fetching store:", err)
      if (err.response && err.response.status === 404 && err.response.data?.message === "Store not found") {
        errorMessage("Store not found")
      } else {
        errorMessage("Error fetching store details")
      }
    } finally {
      setFetchingStore(false)
    }
  }

  async function fetchAttachments() {
    setFetchingAttachments(true)
    try {
      const res = await fetch("/api/attachment")
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          setAllAttachments(data)
          return
        }
      }
      const response = await renderInstance.get("/attachment", {
        headers: access_token ? { Authorization: `Bearer ${access_token}` } : {},
      })
      setAllAttachments(response.data)
    } catch (err) {
      try {
        const res = await fetch("/api/attachment")
        const data = await res.json()
        if (Array.isArray(data)) {
          setAllAttachments(data)
          return
        }
      } catch (_) {}
      errorMessage("Error fetching attachment details")
    } finally {
      setFetchingAttachments(false)
    }
  }

  function formatTimeOnly(dateTimeStr: string | number | Date) {
    if (!dateTimeStr) return "08:00"
    const date = new Date(dateTimeStr)
    if (isNaN(date.getTime())) return String(dateTimeStr)
    const hours = date.getUTCHours().toString().padStart(2, "0")
    const minutes = date.getUTCMinutes().toString().padStart(2, "0")
    return `${hours}:${minutes}`
  }

  async function handleAddAttachment() {
    if (attachmentPrice <= 0) {
      errorMessage("Please give the attachment price")
      return
    }
    if (!activeAttachmentIdForPrice) {
      errorMessage("Please select the attachment")
      return
    }
    if (!slug) {
      errorMessage("Store not available")
      return
    }

    const addAttachmentBody = {
      attachment_id: activeAttachmentIdForPrice,
      price: `${attachmentPrice}`,
      store_id: slug,
    }

    setAdding(true)
    let succeeded = false
    try {
      try {
        const res = await renderInstance.patch("/dealer/store/addAttachmentToDealerStore", addAttachmentBody, {
          headers: access_token
            ? {
                Authorization: `Bearer ${access_token}`,
              }
            : {},
        })
        if (res.data) succeeded = true
      } catch (fastApiErr) {
        console.warn("FastAPI add attachment failed, trying local API route...", fastApiErr)
        const localRes = await fetch("/api/dealer/store/addAttachmentToDealerStore", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(addAttachmentBody),
        })
        if (localRes.ok) {
          succeeded = true
        } else {
          throw fastApiErr
        }
      }

      if (succeeded) {
        successMessage("Attachment added successfully")
        fetchStore()
        setAttachmentPrice(0)
        setActiveAttachmentIdForPrice(null)
        setShowAllAttachments(false)
      }
    } catch (err: any) {
      if (err.response && err.response.status === 404) {
        if (err.response.data?.message === "Store not found") {
          errorMessage("Store not found")
        } else if (err.response.data?.message === "Attachment is not valid") {
          errorMessage("Attachment is not valid")
        } else if (err.response.data?.message === "Login user not found") {
          errorMessage("Login user not found")
        } else {
          errorMessage("Attachment or store not found")
        }
      } else if (err.response && err.response.status === 400) {
        if (err.response.data?.message === "You are not allowed for this task") {
          errorMessage("You are not allowed for this task")
        } else {
          errorMessage("Invalid request")
        }
      } else {
        errorMessage("Error adding attachment to store")
      }
    } finally {
      setAdding(false)
    }
  }

  const handleTractorAdded = () => {
    fetchStore()
    setShowAllTractors(false)
  }

  useEffect(() => {
    if (slug) {
      fetchStore()
    }
  }, [slug])

  useEffect(() => {
    fetchAttachments()
  }, [])

  useEffect(() => {
    import("leaflet").then((leaflet) => {
      delete (leaflet.Icon.Default.prototype as any)._getIconUrl
      leaflet.Icon.Default.mergeOptions({
        iconRetinaUrl: "/marker-icon-2x.png",
        iconUrl: "/marker-icon.png",
        shadowUrl: "/marker-shadow.png",
      })
    })
  }, [])

  // Get display address with improved logic
  const getDisplayAddress = () => {
    if (!store?.location) return "Location address pending"
    const addressParts = [
      store.location.address,
      store.location.city,
      store.location.state,
      store.location.zip_code,
      store.location.country,
    ].filter(Boolean)
    if (addressParts.length > 0) {
      return addressParts.join(", ")
    }
    if (geocodedAddress) {
      return geocodedAddress
    }
    if (geocodeLoading) {
      return "Resolving location address..."
    }
    return `${store.location.lat || "-17.7833"}, ${store.location.lan || "-63.1821"}`
  }

  const getAllTractors = () => {
    if (!store) return []
    const dealerStoreTractors = (store as any).TractorInDealerStore || []
    const sellTractors = (store as any).SellTractor || []
    return [...dealerStoreTractors, ...sellTractors]
  }

  // Loading and error states
  if (fetchingStore)
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center p-8 bg-white rounded-2xl border border-slate-200 shadow-sm max-w-sm">
          <Loader2 className="animate-spin h-10 w-10 text-[#A10A0C] mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900 mb-1">Loading Store</h3>
          <p className="text-xs text-gray-500">Retrieving equipment fleet & store profile...</p>
        </div>
      </div>
    )

  if (!store)
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center p-8 bg-white rounded-2xl border border-slate-200 shadow-sm max-w-md">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Store Not Found</h1>
          <p className="text-sm text-gray-500 mb-6">The requested dealer store could not be located or may have been removed.</p>
          <Button onClick={() => router.push("/dealer/viewstore")} className="bg-[#A10A0C] hover:bg-[#85080A] text-white rounded-xl">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Stores
          </Button>
        </div>
      </div>
    )

  const allStoreTractors = getAllTractors()
  const attachmentsList = store.AttachmentInDealerStore || []

  // Equipment search filter for the inventory tab
  const q = equipmentSearch.toLowerCase().trim()
  const filteredTractors = allStoreTractors.filter((t: any) => {
    if (!q) return true
    const name = (t.baseTractor?.name || t.name || "").toLowerCase()
    const model = (t.baseTractor?.model || t.model || "").toLowerCase()
    const desc = (t.baseTractor?.description || t.description || "").toLowerCase()
    return name.includes(q) || model.includes(q) || desc.includes(q)
  })
  const filteredStoreAttachments = attachmentsList.filter((a: any) => {
    if (!q) return true
    const name = (a.baseAttachment?.name || a.name || "").toLowerCase()
    const desc = (a.baseAttachment?.description || a.description || "").toLowerCase()
    return name.includes(q) || desc.includes(q)
  })

  const renderContent = () => {
    const isEmptyOverview =
      selectedTab === "overview" && allStoreTractors.length === 0 && attachmentsList.length === 0
    const isEmptyTractor = selectedTab === "tractors" && allStoreTractors.length === 0
    const isEmptyAttachment = selectedTab === "attachments" && attachmentsList.length === 0

    if (isEmptyOverview) {
      return (
        <EmptyStateCard
          title="No Equipment in Store"
          description="This store doesn't have any tractors or attachments listed yet."
          actionLabel="Add Equipment"
          onAction={() => setShowAllTractors(true)}
        />
      )
    }
    if (isEmptyTractor) {
      return (
        <EmptyStateCard
          title="No Tractors Available"
          description="Start building your fleet by adding tractors to this store."
          actionLabel="Add Tractor"
          onAction={() => setShowAllTractors(true)}
        />
      )
    }
    if (isEmptyAttachment) {
      return (
        <EmptyStateCard
          title="No Attachments Available"
          description="Add plows, seeders, trailers and other implements to your store inventory."
          actionLabel="Add Attachment"
          onAction={() => setShowAllAttachments(true)}
        />
      )
    }

    const currentStoreCity = store?.location?.name || (store as any)?.city || (geocodedAddress ? geocodedAddress.split(',')[0] : "Dealer Store")

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {selectedTab === "overview" && [
          ...filteredTractors.map((tractor, index) => (
            <div key={`tractor-${tractor.id}-${index}`}>
              <EnhancedTractorCard
                tractor={tractor}
                storeName={store?.name}
                storeCity={currentStoreCity}
              />
            </div>
          )),
          ...filteredStoreAttachments.map((attachment, index) => (
            <div key={`attachment-${attachment.id}-${index}`}>
              <AttachmentCard
                attachment={attachment.baseAttachment || attachment}
                price={attachment.price}
                storeName={store?.name}
                storeCity={currentStoreCity}
              />
            </div>
          )),
        ]}
        {selectedTab === "tractors" &&
          filteredTractors.map((tractor, index) => (
            <div key={`tractor-${tractor.id}-${index}`}>
              <EnhancedTractorCard
                tractor={tractor}
                storeName={store?.name}
                storeCity={currentStoreCity}
              />
            </div>
          ))}
        {selectedTab === "attachments" &&
          filteredStoreAttachments.map((attachment, index) => (
            <div key={`attachment-${attachment.id}-${index}`}>
              <AttachmentCard
                attachment={attachment.baseAttachment || attachment}
                price={attachment.price}
                storeName={store?.name}
                storeCity={currentStoreCity}
              />
            </div>
          ))}
      </div>
    )
  }

  const activeAttachmentForPrice = filteredAttachments.find((a) => a.id === activeAttachmentIdForPrice)

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      <MapStyles />

      {/* Top Professional Navigation Bar */}
      <div className="bg-white border-b border-slate-200/90 sticky top-0 z-30 shadow-xs">
        <div className="container mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dealer/viewstore")}
              className="text-gray-600 hover:text-gray-900 hover:bg-slate-100 rounded-xl gap-1.5 text-xs font-semibold pl-2 pr-3"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>All Stores</span>
            </Button>
            <div className="h-4 w-px bg-slate-200 hidden sm:block" />
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
              <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Active Store
              </span>
              <button
                onClick={() => {
                  if (slug) {
                    navigator.clipboard.writeText(String(slug))
                    setCopiedId(true)
                    setTimeout(() => setCopiedId(false), 2000)
                  }
                }}
                className="text-xs text-gray-500 hover:text-gray-700 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded-full flex items-center gap-1 transition-colors"
                title="Copy Store ID"
              >
                <span>ID: {String(slug).slice(0, 10)}...</span>
                {copiedId ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-gray-400" />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchStore()}
              disabled={fetchingStore}
              className="rounded-xl text-xs gap-1.5 h-8 border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${fetchingStore ? "animate-spin text-red-600" : ""}`} />
              <span className="hidden sm:inline">Sync</span>
            </Button>

            <Button
              size="sm"
              onClick={() => setShowAllTractors(true)}
              className="bg-[#A10A0C] hover:bg-[#85080A] text-white rounded-xl text-xs font-semibold gap-1.5 h-8 shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Tractor</span>
            </Button>

            <Button
              size="sm"
              onClick={() => setShowAllAttachments(true)}
              variant="outline"
              className="border-slate-300 hover:bg-slate-50 text-slate-800 rounded-xl text-xs font-semibold gap-1.5 h-8 shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Attachment</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8 max-w-7xl">
        {/* Hero Banner Section */}
        <div className="relative rounded-3xl overflow-hidden shadow-sm border border-slate-200 bg-slate-900">
          <div className="relative h-[240px] sm:h-[320px] w-full">
            <Image
              src={getSafeImageSrc(
                store.banner?.[0] || store.logo,
                "https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?w=1600&q=80"
              )}
              alt={`${store.name} banner`}
              fill
              className="object-cover"
              priority
            />
            {/* Vignette Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/45 to-black/20" />

            {/* Quick Actions Top Right */}
            <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  if (typeof navigator !== "undefined" && navigator.share) {
                    navigator.share({ title: store.name, url: window.location.href }).catch(() => {})
                  } else {
                    navigator.clipboard.writeText(window.location.href)
                    successMessage("Store link copied!")
                  }
                }}
                className="rounded-full bg-white/90 hover:bg-white text-gray-800 backdrop-blur-md shadow-md gap-1.5 text-xs font-medium h-8 px-3"
              >
                <Share2 className="h-3.5 w-3.5 text-gray-700" />
                <span className="hidden sm:inline">Share</span>
              </Button>
            </div>

            {/* Store Profile Info Overlay */}
            <div className="absolute bottom-0 left-0 w-full p-4 sm:p-6 md:p-8 flex flex-col sm:flex-row items-start sm:items-end gap-4 sm:gap-6 z-10">
              <div className="relative w-20 h-20 sm:w-28 sm:h-28 rounded-2xl ring-4 ring-white/90 shadow-2xl bg-white overflow-hidden flex-shrink-0 flex items-center justify-center">
                {isValidImageSrc(store.logo) ? (
                  <Image
                    src={getSafeImageSrc(store.logo, "https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?w=400&q=80")}
                    alt={`${store.name} logo`}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <Building2 size={36} className="text-[#A10A0C]" />
                )}
              </div>

              <div className="text-white space-y-1.5 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white drop-shadow-sm truncate">
                    {store.name}
                  </h1>
                </div>

                <p className="text-xs sm:text-sm text-slate-200/90 line-clamp-2 max-w-3xl drop-shadow-xs">
                  {store.description || "Official authorized HolaTractor dealership providing premium agricultural machinery & maintenance."}
                </p>

                {/* Pill metadata */}
                <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
                  <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-slate-200 border border-white/10">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>{formatTimeOnly(store.opening_time)} - {formatTimeOnly(store.closing_time)}</span>
                  </div>

                  <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-slate-200 border border-white/10">
                    <MapPin className="w-3.5 h-3.5 text-rose-400" />
                    <span>{store.location?.city || "Santa Cruz"}, {store.location?.country || "Bolivia"}</span>
                  </div>

                  <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-slate-200 border border-white/10">
                    <Tractor className="w-3.5 h-3.5 text-blue-400" />
                    <span>{allStoreTractors.length} Tractors</span>
                  </div>

                  <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-slate-200 border border-white/10">
                    <Wrench className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{attachmentsList.length} Attachments</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3 Metric Cards Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <Card className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:shadow-sm transition-all flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tractor Fleet</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{allStoreTractors.length}</div>
              <p className="text-xs text-slate-500">Live units in dealership</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Tractor className="w-6 h-6" />
            </div>
          </Card>

          <Card className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:shadow-sm transition-all flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Attachments & Implements</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{attachmentsList.length}</div>
              <p className="text-xs text-slate-500">Active attachments available</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Wrench className="w-6 h-6" />
            </div>
          </Card>

          <Card className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:shadow-sm transition-all flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Operating Schedule</span>
              <div className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                {formatTimeOnly(store.opening_time)} - {formatTimeOnly(store.closing_time)}
              </div>
              <p className="text-xs text-slate-500">
                Closed: {store.closing_days && store.closing_days.length > 0 ? store.closing_days.join(", ") : "None"}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
          </Card>
        </div>

        {/* Store Information & Location Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Store Location & Hours (2 columns) */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
              <CardHeader className="p-0 pb-4 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-[#A10A0C]" />
                    Store Location & Logistics
                  </CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">Physical facility location and customer access</p>
                </div>
              </CardHeader>
              <CardContent className="p-0 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                    <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Registered Address</span>
                    <p className="text-slate-800 font-medium text-xs leading-relaxed">{getDisplayAddress()}</p>
                  </div>
                  <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                    <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Hours & Schedule</span>
                    <p className="text-slate-800 font-medium text-xs">
                      Daily: {formatTimeOnly(store.opening_time)} - {formatTimeOnly(store.closing_time)}
                    </p>
                    <p className="text-slate-500 text-[11px]">
                      Closed on: {store.closing_days?.join(", ") || "Open every day"}
                    </p>
                  </div>
                </div>

                {/* Leaflet Map */}
                {store.location && store.location.lat && store.location.lan && (
                  <div className="rounded-xl overflow-hidden border border-slate-200 shadow-inner h-[240px] relative z-10">
                    {typeof window !== "undefined" && mapIcon && (
                      <MapContainer
                        center={[Number.parseFloat(store.location.lat), Number.parseFloat(store.location.lan)]}
                        zoom={14}
                        style={{ height: "100%", width: "100%", zIndex: 1 }}
                        zoomControl={true}
                      >
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Marker
                          position={[Number.parseFloat(store.location.lat), Number.parseFloat(store.location.lan)]}
                          icon={mapIcon}
                        >
                          <Popup>
                            <div className="text-center font-sans">
                              <strong className="text-slate-900">{store.name}</strong>
                              <br />
                              <span className="text-xs text-slate-600">{getDisplayAddress()}</span>
                            </div>
                          </Popup>
                        </Marker>
                      </MapContainer>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions & Store Settings (1 column) */}
          <div className="space-y-6">
            <Card className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-5">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Store Management</h3>
                <p className="text-xs text-slate-500 mt-0.5">Quick administrative actions for this facility</p>
              </div>

              <div className="space-y-2.5">
                <Button
                  onClick={() => setShowAllTractors(true)}
                  className="w-full bg-[#A10A0C] hover:bg-[#85080A] text-white rounded-xl text-xs font-semibold h-10 shadow-sm justify-start px-4 gap-2.5"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Tractor Listing</span>
                </Button>

                <Button
                  onClick={() => setShowAllAttachments(true)}
                  variant="outline"
                  className="w-full border-slate-200 hover:bg-slate-50 text-slate-800 rounded-xl text-xs font-semibold h-10 shadow-xs justify-start px-4 gap-2.5"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Attachment Listing</span>
                </Button>

                {/* Photo Update Dialog */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-medium h-10 shadow-xs justify-start px-4 gap-2.5"
                    >
                      <Camera className="h-4 w-4 text-slate-500" />
                      <span>Update Store Cover & Logo</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-white rounded-2xl max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-lg font-bold text-gray-900">Update Store Photos</DialogTitle>
                      <DialogDescription className="text-xs text-gray-500">
                        Upload a fresh cover banner or high-resolution store logo.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                      <div>
                        <Label htmlFor="banner" className="text-xs font-semibold text-gray-700">Banner Cover Image</Label>
                        <Input id="banner" type="file" accept="image/*" className="mt-1 text-xs" />
                      </div>
                      <div>
                        <Label htmlFor="logo" className="text-xs font-semibold text-gray-700">Dealership Logo</Label>
                        <Input id="logo" type="file" accept="image/*" className="mt-1 text-xs" />
                      </div>
                      <Button className="w-full bg-[#A10A0C] hover:bg-[#85080A] text-white rounded-xl text-xs font-semibold h-10">
                        Save Photos
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Dealership Details Meta */}
              <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-500">
                  <span>Store ID</span>
                  <span className="font-mono text-slate-700 text-[11px] truncate max-w-[150px]">{store.id}</span>
                </div>
                <div className="flex justify-between items-center text-slate-500">
                  <span>Facility Created</span>
                  <span className="text-slate-700">{new Date(store.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between items-center text-slate-500">
                  <span>Base System Ref</span>
                  <span className="font-mono text-slate-700 text-[11px] truncate max-w-[150px]">{store.base_id || "Default"}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Equipment Inventory Section */}
        <Card className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-6">
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-bold text-gray-900 tracking-tight">Store Equipment Inventory</h3>
                <p className="text-xs text-slate-500 mt-0.5">Manage tractors and implements registered at this store</p>
              </div>

              {/* Tabs Segmented Control */}
              <TabsList className="bg-slate-100 p-1 rounded-xl h-10 flex w-full sm:w-auto">
                <TabsTrigger
                  value="overview"
                  className="rounded-lg text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs px-3.5"
                >
                  All ({allStoreTractors.length + attachmentsList.length})
                </TabsTrigger>
                <TabsTrigger
                  value="tractors"
                  className="rounded-lg text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs px-3.5 flex items-center gap-1.5"
                >
                  <Tractor className="h-3.5 w-3.5" />
                  <span>Tractors ({allStoreTractors.length})</span>
                </TabsTrigger>
                <TabsTrigger
                  value="attachments"
                  className="rounded-lg text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs px-3.5 flex items-center gap-1.5"
                >
                  <Wrench className="h-3.5 w-3.5" />
                  <span>Attachments ({attachmentsList.length})</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Equipment Search Bar & Action Strip */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Filter store equipment by name, model or specs..."
                  value={equipmentSearch}
                  onChange={(e) => setEquipmentSearch(e.target.value)}
                  className="pl-10 h-10 bg-slate-50 border-slate-200 rounded-xl text-xs placeholder:text-slate-400 focus:bg-white"
                />
              </div>

              <div className="flex items-center gap-2">
                {selectedTab === "tractors" ? (
                  <Button
                    onClick={() => setShowAllTractors(true)}
                    className="bg-[#A10A0C] hover:bg-[#85080A] text-white rounded-xl text-xs font-semibold h-10 gap-1.5 px-4 shadow-sm"
                  >
                    <Plus className="h-4 w-4" /> Add Tractor
                  </Button>
                ) : selectedTab === "attachments" ? (
                  <Button
                    onClick={() => setShowAllAttachments(true)}
                    className="bg-[#A10A0C] hover:bg-[#85080A] text-white rounded-xl text-xs font-semibold h-10 gap-1.5 px-4 shadow-sm"
                  >
                    <Plus className="h-4 w-4" /> Add Attachment
                  </Button>
                ) : (
                  <Button
                    onClick={() => setShowAllTractors(true)}
                    className="bg-[#A10A0C] hover:bg-[#85080A] text-white rounded-xl text-xs font-semibold h-10 gap-1.5 px-4 shadow-sm"
                  >
                    <Plus className="h-4 w-4" /> Add Equipment
                  </Button>
                )}
              </div>
            </div>

            <TabsContent value="overview" className="mt-6 outline-none">
              {renderContent()}
            </TabsContent>

            <TabsContent value="tractors" className="mt-6 outline-none">
              {renderContent()}
            </TabsContent>

            <TabsContent value="attachments" className="mt-6 outline-none">
              {renderContent()}
            </TabsContent>
          </Tabs>
        </Card>
      </div>

      {/* Add Tractor Modal */}
      {showAllTractors && (
        <Dialog open={showAllTractors} onOpenChange={setShowAllTractors}>
          <DialogContent className="bg-gradient-to-br from-[#A10A0C] to-[#3B0404] max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <AddTractor alreadyTractors={allStoreTractors} onTractorAdded={handleTractorAdded} />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Add Attachment Selection Modal */}
      {showAllAttachments && (
        <Dialog open={showAllAttachments} onOpenChange={setShowAllAttachments}>
          <DialogContent className="max-w-6xl bg-gradient-to-br from-red-700 to-red-900 border-0 text-white">
            <DialogHeader className="text-white">
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-2xl font-bold">Add Attachment to Store</DialogTitle>
                  <DialogDescription className="text-red-100 mt-1">
                    Select an attachment or implement to add to your store inventory
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-6">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Search for an attachment by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-12 bg-white border-0 rounded-lg text-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-white/20"
                />
              </div>

              {/* Attachments Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-h-[70vh] overflow-y-auto pr-2">
                {filteredAttachments.length === 0 ? (
                  <div className="col-span-full py-12 text-center text-red-100 font-medium">
                    No attachments available
                  </div>
                ) : (
                  filteredAttachments.map((attachment) => {
                    const rawImg = Array.isArray(attachment.images) && attachment.images[0]
                      ? attachment.images[0]
                      : typeof attachment.images === "string" && attachment.images
                      ? attachment.images
                      : (attachment as any).image;
                    const displayImg = getSafeImageSrc(rawImg, "https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?w=800&q=80");
                    const itemPrice = Number((attachment as any).fixedPrice || (attachment as any).fixed_price || 0);

                    return (
                      <div key={attachment.id} className="bg-white rounded-lg p-4 shadow-lg text-gray-900 flex flex-col justify-between">
                        <div>
                          {/* Attachment Image */}
                          <div className="w-full h-32 bg-gray-100 rounded-lg mb-3 overflow-hidden relative flex items-center justify-center border border-gray-200">
                            <img
                              src={displayImg}
                              alt={attachment.name}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          {/* Attachment Info */}
                          <div className="space-y-1 mb-4">
                            <h3 className="font-bold text-gray-900 text-sm leading-tight line-clamp-1" title={attachment.name}>
                              {attachment.name}
                            </h3>
                            <p className="text-xs text-gray-500 line-clamp-2">
                              {attachment.description || "High quality agricultural implement."}
                            </p>
                            <div className="space-y-0.5 text-xs text-gray-600 pt-1">
                              <div className="flex justify-between items-center">
                                <span className="font-medium text-gray-500">Base Price:</span>
                                <span className="font-bold text-red-700">${itemPrice > 0 ? itemPrice.toLocaleString() : "Contact"}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Add Button */}
                        <button
                          onClick={() => {
                            setAttachmentPrice(itemPrice > 0 ? itemPrice : 100);
                            setActiveAttachmentIdForPrice(attachment.id);
                          }}
                          className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-2 px-3 rounded-lg transition-all duration-200 text-sm shadow hover:shadow-md mt-2"
                        >
                          Add To Store
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Separate Dialog for setting attachment price */}
      <Dialog
        open={!!activeAttachmentIdForPrice}
        onOpenChange={(open) => {
          if (!open) {
            setActiveAttachmentIdForPrice(null)
            setAttachmentPrice(0)
          }
        }}
      >
        {activeAttachmentForPrice && (
          <DialogContent className="bg-white rounded-2xl max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-gray-900">Add {activeAttachmentForPrice.name}</DialogTitle>
              <DialogDescription className="text-xs text-gray-500">Set the listing price for this implement in your store.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label htmlFor="attachment-price" className="text-xs font-semibold text-gray-700">Listing Price (USD)</Label>
                <Input
                  id="attachment-price"
                  type="number"
                  placeholder="Enter price"
                  value={attachmentPrice}
                  onChange={(e) => {
                    setAttachmentPrice(Number.parseFloat(e.target.value))
                  }}
                  className="mt-1"
                />
              </div>
              {adding ? (
                <div className="flex justify-center py-2">
                  <Loader2 className="h-6 w-6 animate-spin text-red-600" />
                </div>
              ) : (
                <Button onClick={handleAddAttachment} className="w-full bg-[#A10A0C] hover:bg-[#85080A] text-white rounded-xl text-xs font-semibold h-10 shadow-sm">
                  Add to Store
                </Button>
              )}
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
}
