"use client"

import { useEffect, useState } from "react"
import { Share, Camera, MapPin, Clock, Calendar, Plus, Search, Loader2, Tractor, Wrench } from "lucide-react" // Added Tractor, Wrench, Loader2
import Image from "next/image"
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
import { useParams } from "next/navigation"
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import { Icon } from "leaflet"
import { useCookie } from "next-cookie" // Assuming this is a valid client-side cookie hook

// Placeholder imports for custom components and utilities
// You should ensure these files exist in your project at the specified paths.
import { EnhancedTractorCard } from "./Modals/EnhancedTractorCard"
import { AttachmentCard } from "@/components/Dashboards/Dealer/_components/AttachmentCard"
import AddTractor from "@/components/Dashboards/Dealer/_components/AddTractor"
import AddAttachment from "@/components/Dashboards/Dealer/_components/AddAttachment"
import AlternatingAddForm from "@/components/Dashboards/Dealer/_components/AlternatingAddForm"
import { renderInstance } from "@/utils/Axios/RenderInstance"
import type { Attachment, DealerStore } from "@/utils/Types/types"
import { errorMessage, successMessage } from "@/utils/Toastify/Messages"

// Add this right after the imports and before the useReverseGeocode hook
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
    /* Ensure dialogs have higher z-index */
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
              "User-Agent": "YourAppName/1.0", // Required by Nominatim
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

const EmptyStateCard = ({ title, description }: { title: string; description: string }) => (
  <Card className="w-full max-w-sm mx-auto text-center p-8 bg-white border border-gray-200">
    <CardContent className="space-y-6">
      <div className="bg-gray-100 rounded-full p-6 mx-auto w-24 h-24 flex items-center justify-center">
        <Wrench className="w-12 h-12 text-gray-400" />
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </div>
    </CardContent>
  </Card>
)

export default function StorePage() {
  const [selectedTab, setSelectedTab] = useState("overview")
  const [showAddDialog, setShowAddDialog] = useState(false)
  // API State Management
  const [showAllTractors, setShowAllTractors] = useState(false)
  const [showAllAttachments, setShowAllAttachments] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
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

  // Filter functions
  const filteredAttachments = allAttachments.filter((attachment) =>
    attachment.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // API Functions
  function fetchStore() {
    setFetchingStore(true)
    renderInstance
      .get(`/dealer/store/${slug}`)
      .then((res) => {
        console.log("Store data:", res.data)
        setStore(res.data)
      })
      .catch((err) => {
        console.error("Error fetching store:", err)
        if (err.response && err.response.status === 404 && err.response.data.message === "Store not found") {
          errorMessage("Store not found")
        } else {
          errorMessage("Error fetching store details")
        }
      })
      .finally(() => {
        setFetchingStore(false)
      })
  }

  function fetchAttachments() {
    setFetchingAttachments(true)
    renderInstance
      .get("/attachment", {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      })
      .then((res) => {
        setAllAttachments(res.data)
      })
      .catch((err) => {
        errorMessage("Error fetching attachment details")
      })
      .finally(() => {
        setFetchingAttachments(false)
      })
  }

  function formatTimeOnly(dateTimeStr: string | number | Date) {
    const date = new Date(dateTimeStr)
    const hours = date.getUTCHours().toString().padStart(2, "0")
    const minutes = date.getUTCMinutes().toString().padStart(2, "0")
    return `${hours}:${minutes}`
  }

  function handleAddAttachment() {
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
    renderInstance
      .patch("/dealer/store/addAttachmentToDealerStore", addAttachmentBody, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      })
      .then(() => {
        successMessage("Added")
        fetchStore()
        setAttachmentPrice(0)
        setActiveAttachmentIdForPrice(null) // Close the price dialog
        setShowAllAttachments(false) // Close the main attachment selection dialog
      })
      .catch((err) => {
        if (err.response && err.response.status === 404) {
          if (err.response.data.message === "Store not found") {
            errorMessage("Store not found")
          }
          if (err.response.data.message === "Attachment is not valid") {
            errorMessage("Attachment is not valid")
          }
          if (err.response.data.message === "Login user not found") {
            errorMessage("Login user not found")
          }
        } else if (err.response && err.response.status === 400) {
          if (err.response.data.message === "You are not allowed for this task") {
            errorMessage("You are not allowed for this task")
          }
        } else {
          errorMessage("Error updating store details")
        }
      })
      .finally(() => {
        setAdding(false)
      })
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
    if (!store?.location) return "Location not available"
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
      return (
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading address...</span>
        </div>
      )
    }
    if (geocodeError) {
      return (
        <div className="space-y-1">
          <div className="font-medium">Location Coordinates:</div>
          <div className="text-sm text-gray-600">
            Latitude: {store.location.lat}° | Longitude: {store.location.lan}°
          </div>
          <div className="text-sm text-gray-500 italic">(Unable to load address - {geocodeError})</div>
        </div>
      )
    }
    return (
      <div className="space-y-1">
        <div className="font-medium">Location Coordinates:</div>
        <div className="text-sm text-gray-600">
          Latitude: {store.location.lat}° | Longitude: {store.location.lan}°
        </div>
        <div className="text-sm text-gray-500 italic">(Address details not available)</div>
      </div>
    )
  }

  const getAllTractors = () => {
    if (!store) return []
    const dealerStoreTractors = store.TractorInDealerStore || []
    const sellTractors = store.SellTractor || []
    return [...dealerStoreTractors, ...sellTractors]
  }

  // Loading and error states
  if (fetchingStore)
    return (
      <div className="min-h-screen bg-[#222222]">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-t-transparent mx-auto mb-4"></div>
              <p className="text-white text-lg">Getting store details...</p>
            </div>
          </div>
        </div>
      </div>
    )

  if (!store)
    return (
      <div className="min-h-screen bg-[#222222]">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-red-600 mb-4">Store Not Found</h1>
            <p className="text-white">The requested store could not be found.</p>
          </div>
        </div>
      </div>
    )

  const allStoreTractors = getAllTractors()

  const renderContent = () => {
    const isEmptyOverview =
      selectedTab === "overview" && allStoreTractors.length === 0 && store.AttachmentInDealerStore.length === 0
    const isEmptyTractor = selectedTab === "tractors" && allStoreTractors.length === 0
    const isEmptyAttachment = selectedTab === "attachments" && store.AttachmentInDealerStore.length === 0

    if (isEmptyOverview) {
      return <EmptyStateCard title="No Equipment Available" description="This store doesn't have any equipment yet." />
    }
    if (isEmptyTractor) {
      return <EmptyStateCard title="No Tractors Available" description="This store doesn't have any tractors yet." />
    }
    if (isEmptyAttachment) {
      return (
        <EmptyStateCard title="No Attachments Available" description="This store doesn't have any attachments yet." />
      )
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {selectedTab === "overview" &&
          store && [
            ...allStoreTractors.map((tractor, index) => (
              <div key={`tractor-${tractor.id}-${index}`}>
                <EnhancedTractorCard tractor={tractor} />
              </div>
            )),
            ...store.AttachmentInDealerStore.map((attachment, index) => (
              <div key={`attachment-${attachment.id}-${index}`}>
                <AttachmentCard attachment={attachment.baseAttachment} />
              </div>
            )),
          ]}
        {selectedTab === "tractors" &&
          store &&
          allStoreTractors.map((tractor, index) => (
            <div key={`tractor-${tractor.id}-${index}`}>
              <EnhancedTractorCard tractor={tractor} />
            </div>
          ))}
        {selectedTab === "attachments" &&
          store &&
          store.AttachmentInDealerStore.map((attachment) => (
            <div key={attachment.id}>
              <AttachmentCard attachment={attachment.baseAttachment} />
            </div>
          ))}
      </div>
    )
  }

  const getAddComponent = () => {
    switch (selectedTab) {
      case "overview":
        return <AlternatingAddForm tractors={allStoreTractors} attachments={store.AttachmentInDealerStore} />
      case "tractors":
        return <AddTractor alreadyTractors={allStoreTractors} onTractorAdded={handleTractorAdded} />
      case "attachments":
        return <AddAttachment alreadyAttachments={store.AttachmentInDealerStore} />
      default:
        return null
    }
  }

  const activeAttachmentForPrice = filteredAttachments.find((a) => a.id === activeAttachmentIdForPrice)

  return (
    <div className="min-h-screen bg-[#222222]">
      <MapStyles />
      <div className="container mx-auto px-4 py-8">
        {/* Hero Banner Section */}
        <div className="mb-8">
          <div className="relative overflow-hidden rounded-lg shadow-lg">
            <Image
              src={store.banner?.[0] || store.logo || "/placeholder.svg?height=300&width=1200"}
              alt={`${store.name} banner`}
              width={1200}
              height={300}
              className="w-full h-[300px] object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-40"></div>
            {/* Share Button */}
            <div className="absolute top-4 right-4">
              <Button variant="secondary" size="icon" className="rounded-full bg-white">
                <Share className="h-4 w-4" />
              </Button>
            </div>
            {/* Store Header */}
            <div className="absolute bottom-0 left-0 w-full p-6">
              <div className="flex items-end space-x-4">
                <Image
                  src={store.logo || "/placeholder.svg?height=120&width=120"}
                  alt={`${store.name} logo`}
                  width={120}
                  height={120}
                  className="rounded-full border-4 border-white object-cover shadow-lg"
                />
                <div className="text-white">
                  <h1 className="text-4xl font-bold mb-2">{store.name}</h1>
                  <p className="text-lg opacity-90">{store.description}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Store Information Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Store Information Card */}
          <div className="lg:col-span-2">
            <Card className="bg-gradient-to-br from-[#A10A0C] to-[#3B0404] border border-gray-200">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-white flex items-center gap-2">
                  Store Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start p-3 bg-[#3B0404] rounded-lg">
                  <MapPin className="h-5 w-5 text-white mt-0.5 mr-3" />
                  <div className="text-white">
                    {store.location.name && <div className="font-medium">{store.location.name}</div>}
                    <div className="mt-1">{getDisplayAddress()}</div>
                  </div>
                </div>
                <div className="flex items-center p-3 bg-[#3B0404] rounded-lg">
                  <Clock className="h-5 w-5 text-white mr-3" />
                  <span className="text-white">{`Open: ${formatTimeOnly(store.opening_time)} - ${formatTimeOnly(store.closing_time)}`}</span>
                </div>
                <div className="flex items-center p-3 bg-[#3B0404] rounded-lg">
                  <Calendar className="h-5 w-5 text-white mr-3" />
                  <span className="text-white">{`Closed on: ${store.closing_days.join(", ")}`}</span>
                </div>
                {store.location && store.location.lat && store.location.lan && (
                  <div className="mt-4">
                    <h3 className="text-lg font-medium text-white mb-3">Store Location</h3>
                    <div
                      className="h-[250px] w-full rounded-lg overflow-hidden border border-gray-200 relative"
                      style={{ zIndex: 1 }}
                    >
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
                              <div className="text-center">
                                <strong>{store.name}</strong>
                                <br />
                                {store.description}
                                <br />
                                <small>{geocodedAddress || `${store.location.lat}, ${store.location.lan}`}</small>
                              </div>
                            </Popup>
                          </Marker>
                        </MapContainer>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions Card */}
          <div>
            <Card className="bg-gradient-to-br from-[#A10A0C] to-[#3B0404] border border-gray-200">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-white">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="w-full bg-[#F76A1E] hover:bg-[#F76A1E] text-white">
                      <Camera className="mr-2 h-4 w-4" />
                      Update Photos
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-white">
                    <DialogHeader>
                      <DialogTitle>Update Store Photos</DialogTitle>
                      <DialogDescription>Upload a new banner or logo for your store.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="banner">Banner Image</Label>
                        <Input id="banner" type="file" accept="image/*" className="mt-1" />
                      </div>
                      <div>
                        <Label htmlFor="logo">Logo Image</Label>
                        <Input id="logo" type="file" accept="image/*" className="mt-1" />
                      </div>
                      <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                        Upload Photos
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                  <DialogTrigger asChild>
                    <Button className="w-full bg-[#F76A1E] text-white">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Equipment
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md bg-white">
                    <DialogHeader>
                      <DialogTitle>Add Equipment</DialogTitle>
                      <DialogDescription>Add new tractors or attachments to your store.</DialogDescription>
                    </DialogHeader>
                    <div className="p-4">{getAddComponent()}</div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Equipment Tabs */}
        <Card className="bg-gradient-to-br from-[#A10A0C] to-[#3B0404] border border-gray-200">
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="p-6">
            <TabsList className="grid w-full grid-cols-3 bg-[#3B0404]">
              <TabsTrigger
                value="overview"
                className="flex items-center gap-2 text-white data-[state=active]:bg-[#F76A1E] data-[state=active]:text-white"
              >
                <span>Overview</span>
              </TabsTrigger>
              <TabsTrigger
                value="tractors"
                className="flex items-center gap-2 text-white data-[state=active]:bg-[#F76A1E] data-[state=active]:text-white"
              >
                <Tractor className="h-4 w-4" />
                <span>Tractors ({allStoreTractors.length})</span>
              </TabsTrigger>
              <TabsTrigger
                value="attachments"
                className="flex items-center gap-2 text-white data-[state=active]:bg-[#F76A1E] data-[state=active]:text-white"
              >
                <Wrench className="h-4 w-4" />
                <span>Attachments ({store.AttachmentInDealerStore.length})</span>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="mt-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-2xl font-semibold text-white mb-2">All Equipment</h3>
                  <p className="text-white">Overview of all tractors and attachments in your store</p>
                </div>
                <div className="p-6 bg-white rounded-lg">{renderContent()}</div>
              </div>
            </TabsContent>
            <TabsContent value="tractors" className="mt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-semibold text-white mb-2">Tractors</h3>
                    <p className="text-white">Manage your tractor inventory</p>
                  </div>
                  <Button
                    onClick={() => setShowAllTractors(true)}
                    className="bg-[#F76A1E] hover:bg-[#F76A1E] text-white"
                  >
                    <Plus className="mr-2 h-4 w-4" /> Add Tractor
                  </Button>
                </div>
                <div className="p-6 bg-white rounded-lg">{renderContent()}</div>
              </div>
            </TabsContent>
            <TabsContent value="attachments" className="mt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-semibold text-white mb-2">Attachments</h3>
                    <p className="text-white">Manage your attachment inventory</p>
                  </div>
                  <Button
                    onClick={() => setShowAllAttachments(true)}
                    className="bg-[#F76A1E] hover:bg-[#F76A1E] text-white"
                  >
                    <Plus className="mr-2 h-4 w-4" /> Add Attachment
                  </Button>
                </div>
                <div className="p-6 bg-white rounded-lg">{renderContent()}</div>
              </div>
            </TabsContent>
          </Tabs>
        </Card>

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
    <DialogContent className="max-w-6xl bg-gradient-to-br from-red-700 to-red-900 border-0">
      <DialogHeader className="text-white">
        <div className="flex items-center justify-between">
          <div>
            <DialogTitle className="text-2xl font-bold">Add Tractor to Store</DialogTitle>
            <DialogDescription className="text-red-100 mt-1">
              Select a Tractor to add to your store inventory
            </DialogDescription>
          </div>
          <button 
            onClick={() => setShowAllAttachments(false)}
            className="bg-red-800/50 hover:bg-red-800 rounded-full p-2 transition-colors"
          >
            {/* <X className="w-6 h-6 text-white" /> */}
          </button>
        </div>
      </DialogHeader>
      
      <div className="space-y-6">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Search for the tractor"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 h-12 bg-white border-0 rounded-lg text-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-white/20"
          />
        </div>

        {/* Tractor Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-h-[70vh] overflow-y-auto pr-2">
          {filteredAttachments.map((attachment) => (
            <div key={attachment.id} className="bg-white rounded-lg p-4 shadow-lg">
              {/* Placeholder Image */}
              <div className="w-full h-32 bg-gray-200 rounded-lg mb-3 flex items-center justify-center">
                <div className="w-16 h-16 bg-gray-300 rounded"></div>
              </div>
              
              {/* Tractor Info */}
              <div className="space-y-1 mb-4">
                <h3 className="font-bold text-gray-900 text-sm leading-tight">
                  {attachment.name}
                </h3>
                <div className="space-y-0.5 text-xs text-gray-600">
                  <div className="flex">
                    <span className="font-medium w-12">Model:</span>
                    <span>{attachment.model || 'M108'}</span>
                  </div>
                  <div className="flex">
                    <span className="font-medium w-12">Type:</span>
                    <span>{attachment.type || 'Large'}</span>
                  </div>
                </div>
              </div>
              
              {/* Add Button */}
              <button
                onClick={() => {
                  setActiveAttachmentIdForPrice(attachment.id);
                }}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 text-sm shadow-md hover:shadow-lg"
              >
                Add To Store
              </button>
            </div>
          ))}
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
              setActiveAttachmentIdForPrice(null) // Close and reset activeAttachmentIdForPrice
              setAttachmentPrice(0) // Reset price
            }
          }}
        >
          {activeAttachmentForPrice && ( // Only render content if an attachment is active
            <DialogContent className="bg-white">
              <DialogHeader>
                <DialogTitle>Add {activeAttachmentForPrice.name} to Store</DialogTitle>
                <DialogDescription>Set the price for this attachment in your store.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="attachment-price">Price</Label>
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
                  <div className="flex justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  </div>
                ) : (
                  <Button onClick={handleAddAttachment} className="w-full bg-blue-600 hover:bg-blue-700">
                    Add to Store
                  </Button>
                )}
              </div>
            </DialogContent>
          )}
        </Dialog>
      </div>
    </div>
  )
}
