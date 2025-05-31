"use client"

import { useEffect, useState } from "react"
import {
  Share,
  CreditCard,
  Camera,
  MapPin,
  Clock,
  Calendar,
  Plus,
  Search,
  Sparkles,
  Zap,
  TrendingUp,
} from "lucide-react"
import { FaHotel, FaRegCalendarAlt } from "react-icons/fa"
import { TractorCard } from "@/components/Dashboards/Dealer/_components/TractorCard"
import { AttachmentCard } from "@/components/Dashboards/Dealer/_components/AttachmentCard"
import AddTractor from "@/components/Dashboards/Dealer/_components/AddTractor"
import AddAttachment from "@/components/Dashboards/Dealer/_components/AddAttachment"
import AlternatingAddForm from "@/components/Dashboards/Dealer/_components/AlternatingAddForm"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { renderInstance } from "@/utils/Axios/RenderInstance"
import type { Attachment, DealerStore } from "@/utils/Types/types"
import { errorMessage, successMessage } from "@/utils/Toastify/Messages"
import { useCookie } from "next-cookie"
import { CircularProgress } from "@mui/material"
import { useParams } from "next/navigation"

const EmptyStateCard = ({ title, description }: { title: any; description: any }) => (
  <div className="relative group">
    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-3xl blur-xl opacity-10 group-hover:opacity-20 transition-opacity duration-500"></div>
    <Card className="relative w-full max-w-sm mx-auto text-center p-8 bg-slate-800/90 backdrop-blur-sm border border-slate-700/50 rounded-3xl shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:scale-105">
      <CardContent className="space-y-8">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur-lg opacity-30"></div>
          <div className="relative bg-slate-700/80 rounded-2xl p-6 mx-auto w-24 h-24 flex items-center justify-center shadow-xl border border-slate-600/50">
            <CreditCard className="w-12 h-12 text-purple-400" />
          </div>
        </div>
        <div className="space-y-3">
          <h3 className="text-2xl font-bold text-white">{title}</h3>
          <p className="text-slate-300 leading-relaxed">{description}</p>
        </div>
      </CardContent>
    </Card>
  </div>
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

  const [activeAttachment, setActiveAttachment] = useState("")
  const [attachmentPrice, setAttachmentPrice] = useState(0)

  const [adding, setAdding] = useState(false)

  const { slug } = useParams()
  const { cookie } = useCookie()
  const access_token = cookie.get("access_token")

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
        setStore(res.data)
      })
      .catch((err) => {
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
    const seconds = date.getUTCSeconds().toString().padStart(2, "0")
    return `${hours}:${minutes}:${seconds}`
  }

  function handleAddAttachment() {
    if (attachmentPrice <= 0) {
      errorMessage("Please give the attachment price")
      return
    }
    if (!activeAttachment) {
      errorMessage("Please select the attachment")
      return
    }
    if (!slug) {
      errorMessage("Store not available")
      return
    }

    const addAttachmentBody = {
      attachment_id: activeAttachment,
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
        setShowAllAttachments(false)
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
        setActiveAttachment("")
        setAdding(false)
      })
  }

  // Callback function to refresh store data when tractor is added
  const handleTractorAdded = () => {
    fetchStore()
    setShowAllTractors(false)
  }

  // useEffect hooks
  useEffect(() => {
    if (slug) {
      fetchStore()
    }
  }, [slug])

  useEffect(() => {
    fetchAttachments()
  }, [])

  // Loading and error states
  if (fetchingStore)
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="absolute inset-0 bg-slate-900/50"></div>
        <div className="container mx-auto px-4 py-8 relative z-10">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur-xl opacity-50 animate-pulse"></div>
                <div className="relative animate-spin rounded-full h-16 w-16 border-4 border-transparent bg-gradient-to-r from-purple-500 to-pink-500 mx-auto mb-6">
                  <div className="absolute inset-2 bg-slate-900 rounded-full"></div>
                </div>
              </div>
              <p className="text-white text-xl font-medium">Getting store details...</p>
            </div>
          </div>
        </div>
      </div>
    )

  if (!store)
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="absolute inset-0 bg-slate-900/50"></div>
        <div className="container mx-auto px-4 py-8 relative z-10">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-red-400 mb-4">Store Not Found</h1>
            <p className="text-gray-300">The requested store could not be found.</p>
          </div>
        </div>
      </div>
    )

  const renderContent = () => {
    const isEmptyOverview =
      selectedTab === "overview" &&
      store.TractorInDealerStore.length === 0 &&
      store.AttachmentInDealerStore.length === 0

    const isEmptyTractor = selectedTab === "tractors" && store.TractorInDealerStore.length === 0
    const isEmptyAttachment = selectedTab === "attachments" && store.AttachmentInDealerStore.length === 0

    if (isEmptyOverview) {
      return (
        <EmptyStateCard title="No Equipments Available" description="This store doesn't have any equipments yet." />
      )
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {selectedTab === "overview" &&
          store && [
            ...store.TractorInDealerStore.map((tractor, index) => (
              <div
                key={`tractor-${tractor.id}-${index}`}
                className="transform hover:scale-105 transition-all duration-300"
              >
                <TractorCard tractor={tractor.baseTractor} />
              </div>
            )),
            ...store.AttachmentInDealerStore.map((attachment, index) => (
              <div
                key={`attachment-${attachment.id}-${index}`}
                className="transform hover:scale-105 transition-all duration-300"
              >
                <AttachmentCard attachment={attachment.baseAttachment} />
              </div>
            )),
          ]}
        {selectedTab === "tractors" &&
          store &&
          store.TractorInDealerStore.map((tractor) => (
            <div key={tractor.id} className="transform hover:scale-105 transition-all duration-300">
              <TractorCard tractor={tractor.baseTractor} />
            </div>
          ))}
        {selectedTab === "attachments" &&
          store &&
          store.AttachmentInDealerStore.map((attachment) => (
            <div key={attachment.id} className="transform hover:scale-105 transition-all duration-300">
              <AttachmentCard attachment={attachment.baseAttachment} />
            </div>
          ))}
      </div>
    )
  }

  const getAddComponent = () => {
    switch (selectedTab) {
      case "overview":
        return <AlternatingAddForm tractors={store.TractorInDealerStore} attachments={store.AttachmentInDealerStore} />
      case "tractors":
        return <AddTractor alreadyTractors={store.TractorInDealerStore} onTractorAdded={handleTractorAdded} />
      case "attachments":
        return <AddAttachment alreadyAttachments={store.AttachmentInDealerStore} />
      default:
        return null
    }
  }

  return (
    <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Background Pattern - positioned behind content */}
      <div className="fixed inset-0 bg-slate-900/30 pointer-events-none -z-10"></div>

      <div className=" px-4 py-8 relative">
        {/* Hero Banner Section */}
        <div className="relative mb-12">
          <div className="relative overflow-hidden rounded-3xl shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/30 via-pink-600/30 to-blue-600/30"></div>
            <Image
              src={store.banner?.[0] || store.logo || "/placeholder.svg?height=400&width=1200"}
              alt={`${store.name} banner`}
              width={1200}
              height={400}
              className="w-full h-[400px] object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>

            {/* Floating Share Button */}
            <div className="absolute top-6 right-6">
              <Button
                variant="secondary"
                size="icon"
                className="rounded-full bg-slate-800/90 backdrop-blur-sm border border-slate-700/50 hover:bg-slate-700/90 transition-all duration-300 hover:scale-110 shadow-xl text-white"
              >
                <Share className="h-5 w-5" />
              </Button>
            </div>

            {/* Store Header with Logo */}
            <div className="absolute bottom-0 left-0 w-full p-8">
              <div className="flex items-end space-x-6">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-xl opacity-40 group-hover:opacity-60 transition-opacity duration-500"></div>
                  <div className="relative transform group-hover:scale-110 transition-transform duration-500">
                    <Image
                      src={store.logo || "/placeholder.svg?height=180&width=180"}
                      alt={`${store.name} logo`}
                      width={180}
                      height={180}
                      className="rounded-full border-4 w-[180px] h-[180px] border-white/50 object-cover shadow-2xl"
                    />
                  </div>
                </div>
                <div className="text-white space-y-2">
                  <h1 className="text-5xl font-bold text-white drop-shadow-lg">{store.name}</h1>
                  <p className="text-xl text-gray-200 max-w-2xl leading-relaxed drop-shadow-md">{store.description}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Store Information Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Store Information Card */}
          <div className="lg:col-span-2 relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-3xl blur-xl opacity-10 group-hover:opacity-20 transition-opacity duration-500"></div>
            <Card className="relative bg-slate-800/90 backdrop-blur-sm border border-slate-700/50 rounded-3xl shadow-2xl hover:shadow-purple-500/20 transition-all duration-500">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl font-bold text-white flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
                    <MapPin className="h-6 w-6 text-white" />
                  </div>
                  Store Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center p-4 bg-slate-700/50 rounded-2xl border border-slate-600/50 hover:bg-slate-700/70 transition-all duration-300">
                    <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl mr-4">
                      <MapPin className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-slate-200 text-lg">
                      {[
                        store.location.address,
                        store.location.city,
                        store.location.state,
                        store.location.zip_code,
                        store.location.country,
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    </span>
                  </div>
                  <div className="flex items-center p-4 bg-slate-700/50 rounded-2xl border border-slate-600/50 hover:bg-slate-700/70 transition-all duration-300">
                    <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl mr-4">
                      <Clock className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-slate-200 text-lg">{`Open: ${formatTimeOnly(store.opening_time)} - ${formatTimeOnly(store.closing_time)}`}</span>
                  </div>
                  <div className="flex items-center p-4 bg-slate-700/50 rounded-2xl border border-slate-600/50 hover:bg-slate-700/70 transition-all duration-300">
                    <div className="p-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl mr-4">
                      <Calendar className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-slate-200 text-lg">{`Closed on: ${store.closing_days.join(", ")}`}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions Card */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-3xl blur-xl opacity-10 group-hover:opacity-20 transition-opacity duration-500"></div>
            <Card className="relative bg-slate-800/90 backdrop-blur-sm border border-slate-700/50 rounded-3xl shadow-2xl hover:shadow-purple-500/20 transition-all duration-500">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl font-bold text-white flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="w-full h-14 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-2xl shadow-lg hover:shadow-purple-500/25 transition-all duration-300 hover:scale-105">
                      <Camera className="mr-3 h-5 w-5" />
                      Update Photos
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-800/95 backdrop-blur-sm border border-slate-700/50 rounded-3xl">
                    <DialogHeader>
                      <DialogTitle className="text-white text-xl">Update Store Photos</DialogTitle>
                      <DialogDescription className="text-slate-300">
                        Upload a new banner or logo for your store.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6">
                      <div>
                        <Label htmlFor="banner" className="text-white font-medium">
                          Banner Image
                        </Label>
                        <Input
                          id="banner"
                          type="file"
                          accept="image/*"
                          className="mt-2 bg-slate-700/50 border-slate-600/50 text-white rounded-xl"
                        />
                      </div>
                      <div>
                        <Label htmlFor="logo" className="text-white font-medium">
                          Logo Image
                        </Label>
                        <Input
                          id="logo"
                          type="file"
                          accept="image/*"
                          className="mt-2 bg-slate-700/50 border-slate-600/50 text-white rounded-xl"
                        />
                      </div>
                      <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl"
                      >
                        Upload Photos
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full h-14 bg-slate-700/50 border-slate-600/50 text-white hover:bg-slate-700/70 font-semibold rounded-2xl shadow-lg hover:shadow-white/10 transition-all duration-300 hover:scale-105"
                    >
                      <Plus className="mr-3 h-5 w-5" />
                      Add Equipment
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md bg-slate-800/95 backdrop-blur-sm border border-slate-700/50 rounded-3xl">
                    <DialogHeader>
                      <DialogTitle className="text-white text-xl">Add Equipment</DialogTitle>
                      <DialogDescription className="text-slate-300">
                        Add new tractors or attachments to your store.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="p-4">{getAddComponent()}</div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Equipment Tabs */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-3xl blur-xl opacity-10 group-hover:opacity-20 transition-opacity duration-500"></div>
          <Card className="relative bg-slate-800/90 backdrop-blur-sm border border-slate-700/50 rounded-3xl shadow-2xl">
            <Tabs value={selectedTab} onValueChange={setSelectedTab} className="p-6">
              <TabsList className="grid w-full grid-cols-3 bg-slate-700/50 border border-slate-600/50 rounded-2xl p-1 gap-1">
                <TabsTrigger
                  value="overview"
                  className="flex items-center justify-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-lg text-slate-300 rounded-xl transition-all duration-300 hover:text-white hover:bg-slate-600/50 py-3 px-4 font-medium"
                >
                  <TrendingUp className="h-4 w-4" />
                  <span>Overview</span>
                </TabsTrigger>
                <TabsTrigger
                  value="tractors"
                  className="flex items-center justify-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-lg text-slate-300 rounded-xl transition-all duration-300 hover:text-white hover:bg-slate-600/50 py-3 px-4 font-medium"
                >
                  <FaHotel className="h-4 w-4" />
                  <span>Tractors</span>
                </TabsTrigger>
                <TabsTrigger
                  value="attachments"
                  className="flex items-center justify-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-lg text-slate-300 rounded-xl transition-all duration-300 hover:text-white hover:bg-slate-600/50 py-3 px-4 font-medium"
                >
                  <FaRegCalendarAlt className="h-4 w-4" />
                  <span>Attachments</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-8">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Sparkles className="h-8 w-8 text-purple-400" />
                        All Equipment
                      </h3>
                      <p className="text-slate-300 text-lg mt-2">
                        Overview of all tractors and attachments in your store
                      </p>
                    </div>
                  </div>
                  <div className="p-8 bg-slate-700/30 rounded-3xl border border-slate-600/30">{renderContent()}</div>
                </div>
              </TabsContent>

              <TabsContent value="tractors" className="mt-8">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-3xl font-bold text-white flex items-center gap-3">
                        <FaHotel className="h-8 w-8 text-blue-400" />
                        Tractors
                      </h3>
                      <p className="text-slate-300 text-lg mt-2">Manage your tractor inventory</p>
                    </div>
                    <Button
                      onClick={() => setShowAllTractors(true)}
                      className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold rounded-2xl px-6 py-3 shadow-lg hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105"
                    >
                      <Plus className="mr-2 h-5 w-5" /> Add Tractor
                    </Button>
                  </div>
                  <div className="p-8 bg-slate-700/30 rounded-3xl border border-slate-600/30">{renderContent()}</div>
                </div>
              </TabsContent>

              <TabsContent value="attachments" className="mt-8">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-3xl font-bold text-white flex items-center gap-3">
                        <FaRegCalendarAlt className="h-8 w-8 text-green-400" />
                        Attachments
                      </h3>
                      <p className="text-slate-300 text-lg mt-2">Manage your attachment inventory</p>
                    </div>
                    <Button
                      onClick={() => setShowAllAttachments(true)}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-2xl px-6 py-3 shadow-lg hover:shadow-green-500/25 transition-all duration-300 hover:scale-105"
                    >
                      <Plus className="mr-2 h-5 w-5" /> Add Attachment
                    </Button>
                  </div>
                  <div className="p-8 bg-slate-700/30 rounded-3xl border border-slate-600/30">{renderContent()}</div>
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </div>

        {/* Add Tractor Modal */}
        {showAllTractors && (
          <Dialog open={showAllTractors} onOpenChange={setShowAllTractors}>
            <DialogContent className="p-0 bg-slate-800/95 backdrop-blur-sm border border-slate-700/50 rounded-3xl max-w-4xl">
              <div className="p-6">
                <AddTractor alreadyTractors={store.TractorInDealerStore} onTractorAdded={handleTractorAdded} />
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Add Attachment Modal */}
        {showAllAttachments && (
          <Dialog open={showAllAttachments} onOpenChange={setShowAllAttachments}>
            <DialogContent className="max-w-4xl bg-slate-800/95 backdrop-blur-sm border border-slate-700/50 rounded-3xl">
              <DialogHeader>
                <DialogTitle className="text-white text-2xl">Add Attachment to Store</DialogTitle>
                <DialogDescription className="text-slate-300 text-lg">
                  Select an attachment to add to your store inventory.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    placeholder="Search attachments..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 bg-slate-700/50 border-slate-600/50 text-white placeholder-slate-400 rounded-2xl h-14 text-lg"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[60vh] overflow-y-auto pr-2">
                  {filteredAttachments.map((attachment) => (
                    <div key={attachment.id} className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur-lg opacity-10 group-hover:opacity-20 transition-opacity duration-300"></div>
                      <Card className="relative bg-slate-700/50 border border-slate-600/50 rounded-2xl hover:bg-slate-700/70 transition-all duration-300 hover:scale-105">
                        <CardHeader>
                          <CardTitle className="text-white text-xl">{attachment.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-slate-300 mb-4 leading-relaxed">{attachment.description}</p>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                onClick={() => {
                                  setActiveAttachment(attachment.id)
                                }}
                                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl"
                              >
                                Add to Store
                              </Button>
                            </DialogTrigger>
                            {activeAttachment && (
                              <DialogContent className="bg-slate-800/95 backdrop-blur-sm border border-slate-700/50 rounded-3xl">
                                <DialogHeader>
                                  <DialogTitle className="text-white text-xl">
                                    Add {attachment.name} to Store
                                  </DialogTitle>
                                  <DialogDescription className="text-slate-300">
                                    Set the price for this attachment in your store.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-6">
                                  <div>
                                    <Label htmlFor="attachment-price" className="text-white font-medium">
                                      Price
                                    </Label>
                                    <Input
                                      id="attachment-price"
                                      type="number"
                                      placeholder="Enter price"
                                      value={attachmentPrice}
                                      onChange={(e) => {
                                        setAttachmentPrice(Number.parseFloat(e.target.value))
                                      }}
                                      className="mt-2 bg-slate-700/50 border-slate-600/50 text-white rounded-xl h-12"
                                    />
                                  </div>
                                  {adding ? (
                                    <div className="flex justify-center">
                                      <CircularProgress sx={{ color: "#a855f7" }} size={24} />
                                    </div>
                                  ) : (
                                    <Button
                                      onClick={() => {
                                        handleAddAttachment()
                                      }}
                                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl h-12"
                                    >
                                      Add to Store
                                    </Button>
                                  )}
                                </div>
                              </DialogContent>
                            )}
                          </Dialog>
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  )
}
