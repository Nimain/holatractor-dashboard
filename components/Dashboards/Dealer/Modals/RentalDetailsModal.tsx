"use client"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  BadgeCheck,
  Check,
  Clock,
  Download,
  Eye,
  Pencil,
  User,
  Mail,
  Phone,
  Calendar,
  Star,
  Tractor,
  Fuel,
  Gauge,
  Zap,
  Weight,
  Ruler,
  ImageIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PaymentTab } from "./PaymentTab"
import Image from "next/image"

// Updated interfaces to match the new API structure
interface TractorSpecification {
  id: string
  inventory_tractor_id: string
  attachment_ids: string[]
  horsePower: number
  torque: number
  zeroToSixty: number
  features: string[]
  engineType: string
  fuelCapacity: number
  transmission: string
  weight: number
  dimensions: string
  maxSpeed: number
  tireType: string
  seatingCapacity: number
  ptoPower: number
  liftCapacity: number
  warranty: string
  manufactureYear: number
  brand: string
  model: string
  base_id: string
  createdAt: string
  updatedAt: string
  inventoryTractor: InventoryTractor
}

interface InventoryTractor {
  id: string
  name: string
  description: string
  es_name: string | null
  es_description: string | null
  ay_name: string | null
  ay_description: string | null
  qu_name: string | null
  qu_description: string | null
  gn_name: string | null
  gn_description: string | null
  images: string[]
  model: string
  type: string
  year: string
  base_id: string
  created_by: string
  createdAt: string
  updatedAt: string
}

interface ApiTractor {
  id: string
  dealerId: string
  dealer_store_id: string
  tractorSpecificationId: string
  isAvailable: boolean
  listingType: string
  price: number
  monthlyPrice: number
  discount: number
  rating: number
  base_id: string
  createdAt: string
  updatedAt: string
  TractorSpecification: TractorSpecification
}

interface ApiUser {
  id: string
  first_name: string
  middle_name: string
  last_name: string
  email: string
  password: string | null
  authType: string
  googleId: string | null
  mobile: string | null
  country_code: string | null
  image: string
  dob: string
  gender: string
  base_id: string
  location_id: string | null
  createdAt: string
  updatedAt: string
  phoneVerified: boolean
  emailVerified: boolean
  request_to_delete: boolean
}

interface ApiBase {
  id: string
  created_by: string
  status: number
  created: string
  updated: string
}

interface TractorLeaseLead {
  id: string
  tractorId: string
  startDate: string
  lease_period: string
  monthlyPrice: number
  status: string
  discount: number
  rating: number
  base_id: string
  user_id: string
  forOwner: boolean
  forFarmer: boolean
  user_confirm: boolean
  dealer_confirm: boolean
  createdAt: string
  updatedAt: string
  Tractor: ApiTractor
  User: ApiUser
  base: ApiBase
}

interface TractorRental {
  id: number
  userId: string
  tractorNameModel: string
  startDate: string
  duration: string
  cost: number
  paymentStatus: "Paid" | "Pending" | "Overdue"
  status: "Active" | "Completed" | "Cancelled"
  originalData?: TractorLeaseLead
}

interface RentalDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  rental: TractorRental | null
}

export function RentalDetailsModal({ isOpen, onClose, rental }: RentalDetailsModalProps) {
  const [activeTab, setActiveTab] = useState("details")
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  useEffect(() => {
    console.log("Active tab:", activeTab)
    console.log("Rental data:", rental)
  }, [activeTab, rental])

  if (!rental) return null

  // Extract data from the original API response
  const apiData = rental.originalData
  const user = apiData?.User
  const tractor = apiData?.Tractor
  const tractorSpec = tractor?.TractorSpecification
  const inventoryTractor = tractorSpec?.inventoryTractor
  const leaseData = apiData

  // Helper functions
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const getUserInitials = () => {
    if (!user) return "UN"
    return `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase()
  }

  const getFullName = () => {
    if (!user) return "Unknown User"
    return `${user.first_name || ""} ${user.middle_name || ""} ${user.last_name || ""}`.trim()
  }

  const getTractorName = () => {
    if (inventoryTractor?.name) return inventoryTractor.name
    if (tractorSpec?.brand && tractorSpec?.model) return `${tractorSpec.brand} ${tractorSpec.model}`
    return `Tractor ${tractor?.id || "Unknown"}`
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "active":
        return "bg-blue-100 text-blue-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const tractorImages = inventoryTractor?.images || []

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[1000px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{getTractorName()} - Lease Agreement Details</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="contract">Contract</TabsTrigger>
            <TabsTrigger value="payment">Payment</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6">
            {/* Tractor Images */}
            {tractorImages.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    Tractor Images
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden">
                      <Image
                        src={tractorImages[currentImageIndex] || "/placeholder.svg"}
                        alt={`${getTractorName()} - Image ${currentImageIndex + 1}`}
                        fill
                        className="object-cover"
                        onError={() => {
                          console.log("Image failed to load:", tractorImages[currentImageIndex])
                        }}
                      />
                    </div>
                    {tractorImages.length > 1 && (
                      <div className="flex gap-2 overflow-x-auto">
                        {tractorImages.map((image, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 flex-shrink-0 ${
                              currentImageIndex === index ? "border-blue-500" : "border-gray-200"
                            }`}
                          >
                            <Image
                              src={image || "/placeholder.svg"}
                              alt={`Thumbnail ${index + 1}`}
                              fill
                              className="object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* User Information Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={user?.image || "/placeholder.svg"} alt={getFullName()} />
                    <AvatarFallback className="bg-blue-500 text-white text-lg">{getUserInitials()}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1 space-y-3">
                    <div>
                      <h3 className="text-xl font-semibold">{getFullName()}</h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          <span>{user?.email || "No email"}</span>
                          {user?.emailVerified && <BadgeCheck className="h-4 w-4 text-green-500" />}
                        </div>
                        {user?.mobile && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            <span>
                              {user.country_code || ""} {user.mobile}
                            </span>
                            {user?.phoneVerified && <BadgeCheck className="h-4 w-4 text-green-500" />}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Gender:</span>
                        <span className="ml-2 capitalize">{user?.gender || "Not specified"}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Auth Type:</span>
                        <span className="ml-2">{user?.authType || "Unknown"}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Date of Birth:</span>
                        <span className="ml-2">{user?.dob ? formatDate(user.dob) : "Not provided"}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Member Since:</span>
                        <span className="ml-2">{user?.createdAt ? formatDate(user.createdAt) : "Unknown"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tractor Information Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tractor className="h-5 w-5" />
                  Tractor Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div>
                    <h4 className="font-semibold text-lg mb-3">{getTractorName()}</h4>
                    <p className="text-gray-600 mb-4">{inventoryTractor?.description || "No description available"}</p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Brand:</span>
                        <p className="font-medium">{tractorSpec?.brand || "Unknown"}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Model:</span>
                        <p className="font-medium">{tractorSpec?.model || inventoryTractor?.model || "Unknown"}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Year:</span>
                        <p className="font-medium">
                          {tractorSpec?.manufactureYear ||
                            new Date(inventoryTractor?.year || "").getFullYear() ||
                            "Unknown"}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Type:</span>
                        <p className="font-medium capitalize">{inventoryTractor?.type || "Unknown"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Technical Specifications */}
                  <div>
                    <h5 className="font-semibold mb-3">Technical Specifications</h5>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-orange-500" />
                        <div>
                          <p className="text-xs text-gray-500">Horse Power</p>
                          <p className="font-medium">{tractorSpec?.horsePower || "N/A"} HP</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Gauge className="h-4 w-4 text-blue-500" />
                        <div>
                          <p className="text-xs text-gray-500">Torque</p>
                          <p className="font-medium">{tractorSpec?.torque || "N/A"} Nm</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Fuel className="h-4 w-4 text-green-500" />
                        <div>
                          <p className="text-xs text-gray-500">Fuel Capacity</p>
                          <p className="font-medium">{tractorSpec?.fuelCapacity || "N/A"} L</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Weight className="h-4 w-4 text-purple-500" />
                        <div>
                          <p className="text-xs text-gray-500">Weight</p>
                          <p className="font-medium">{tractorSpec?.weight || "N/A"} kg</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Ruler className="h-4 w-4 text-indigo-500" />
                        <div>
                          <p className="text-xs text-gray-500">Dimensions</p>
                          <p className="font-medium">{tractorSpec?.dimensions || "N/A"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Gauge className="h-4 w-4 text-red-500" />
                        <div>
                          <p className="text-xs text-gray-500">Max Speed</p>
                          <p className="font-medium">{tractorSpec?.maxSpeed || "N/A"} km/h</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Additional Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h5 className="font-semibold mb-3">Engine & Transmission</h5>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Engine Type:</span>
                          <span className="font-medium">{tractorSpec?.engineType || "N/A"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Transmission:</span>
                          <span className="font-medium">{tractorSpec?.transmission || "N/A"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">0-60 km/h:</span>
                          <span className="font-medium">{tractorSpec?.zeroToSixty || "N/A"}s</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h5 className="font-semibold mb-3">Capacity & Power</h5>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Seating:</span>
                          <span className="font-medium">{tractorSpec?.seatingCapacity || "N/A"} seats</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">PTO Power:</span>
                          <span className="font-medium">{tractorSpec?.ptoPower || "N/A"} HP</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Lift Capacity:</span>
                          <span className="font-medium">{tractorSpec?.liftCapacity || "N/A"} kg</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Features */}
                  {tractorSpec?.features && tractorSpec.features.length > 0 && (
                    <div>
                      <h5 className="font-semibold mb-3">Features</h5>
                      <div className="flex flex-wrap gap-2">
                        {tractorSpec.features.map((feature, index) => (
                          <Badge key={index} variant="secondary" className="bg-blue-50 text-blue-700">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pricing & Availability */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                    <div className="space-y-3">
                      <h5 className="font-semibold">Pricing</h5>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Purchase Price:</span>
                          <span className="font-bold text-lg">{formatCurrency(tractor?.price || 0)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Monthly Lease:</span>
                          <span className="font-semibold text-blue-600">
                            {formatCurrency(tractor?.monthlyPrice || 0)}
                          </span>
                        </div>
                        {tractor?.discount && tractor.discount > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Discount:</span>
                            <span className="font-semibold text-green-600">-{formatCurrency(tractor.discount)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h5 className="font-semibold">Status & Warranty</h5>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Availability:</span>
                          <Badge variant={tractor?.isAvailable ? "default" : "destructive"}>
                            {tractor?.isAvailable ? "Available" : "Not Available"}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Listing Type:</span>
                          <Badge variant={tractor?.listingType === "sell" ? "default" : "secondary"}>
                            {tractor?.listingType || "Unknown"}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Warranty:</span>
                          <span className="font-medium">{tractorSpec?.warranty || "N/A"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Rating:</span>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span>{tractor?.rating || 0}/5</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lease Details Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Lease Agreement Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <span className="text-gray-600">Lease Period:</span>
                      <p className="font-semibold">{leaseData?.lease_period?.replace("_", " ") || "Not specified"}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Start Date:</span>
                      <p className="font-semibold">
                        {leaseData?.startDate ? formatDate(leaseData.startDate) : "Not set"}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Monthly Payment:</span>
                      <p className="font-semibold text-lg text-blue-600">
                        {formatCurrency(leaseData?.monthlyPrice || 0)}
                      </p>
                    </div>
                    {leaseData?.discount && leaseData.discount > 0 && (
                      <div>
                        <span className="text-gray-600">Discount Applied:</span>
                        <p className="font-semibold text-green-600">-{formatCurrency(leaseData.discount)}</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <span className="text-gray-600">Status:</span>
                      <Badge className={`ml-2 ${getStatusColor(leaseData?.status || "unknown")}`}>
                        {leaseData?.status || "Unknown"}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">For Owner:</span>
                        <Badge variant={leaseData?.forOwner ? "default" : "secondary"}>
                          {leaseData?.forOwner ? "Yes" : "No"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">For Farmer:</span>
                        <Badge variant={leaseData?.forFarmer ? "default" : "secondary"}>
                          {leaseData?.forFarmer ? "Yes" : "No"}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">User Confirmed:</span>
                        <div className="flex items-center gap-1">
                          {leaseData?.user_confirm ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Clock className="h-4 w-4 text-yellow-500" />
                          )}
                          <span className={leaseData?.user_confirm ? "text-green-600" : "text-yellow-600"}>
                            {leaseData?.user_confirm ? "Confirmed" : "Pending"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Dealer Confirmed:</span>
                        <div className="flex items-center gap-1">
                          {leaseData?.dealer_confirm ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Clock className="h-4 w-4 text-yellow-500" />
                          )}
                          <span className={leaseData?.dealer_confirm ? "text-green-600" : "text-yellow-600"}>
                            {leaseData?.dealer_confirm ? "Confirmed" : "Pending"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contract" className="bg-white rounded-lg">
            <div className="space-y-8">
              {/* Header Section */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-semibold">
                    {getTractorName()} Lease Agreement · {leaseData?.id || "Unknown"}
                  </h2>
                  <div className="flex items-center space-x-4 mt-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user?.image || "/placeholder.svg"} />
                      <AvatarFallback>{getUserInitials()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm text-muted-foreground">Contract for</p>
                      <p className="font-medium">{getFullName()}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <Badge variant="secondary" className={getStatusColor(leaseData?.status || "unknown")}>
                        {leaseData?.status || "Unknown"}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button className="bg-emerald-600 hover:bg-emerald-700">Review and Sign</Button>
                  <Button variant="outline" size="icon">
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Contract Time Section */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium">Contract Time</h4>
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <p className="text-sm text-muted-foreground">Start Date</p>
                    <p className="font-medium mt-1">
                      {leaseData?.startDate ? formatDate(leaseData.startDate) : "Not specified"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Lease Period</p>
                    <p className="font-medium mt-1">{leaseData?.lease_period?.replace("_", " ") || "Not specified"}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Tractor Details Section */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium">Tractor Details</h4>
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <p className="text-sm text-muted-foreground">Tractor Name</p>
                    <p className="font-medium mt-1">{getTractorName()}</p>
                    <p className="text-sm text-muted-foreground mt-2">Brand & Model</p>
                    <p className="font-medium mt-1">
                      {tractorSpec?.brand && tractorSpec?.model
                        ? `${tractorSpec.brand} ${tractorSpec.model}`
                        : "Not specified"}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">Year</p>
                    <p className="font-medium mt-1">
                      {tractorSpec?.manufactureYear ||
                        new Date(inventoryTractor?.year || "").getFullYear() ||
                        "Unknown"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Monthly Lease Amount</p>
                    <p className="font-bold text-xl mt-1 text-blue-600">
                      {formatCurrency(leaseData?.monthlyPrice || 0)}
                    </p>
                    {leaseData?.discount && leaseData.discount > 0 && (
                      <>
                        <p className="text-sm text-muted-foreground mt-2">Discount Applied</p>
                        <p className="font-medium mt-1 text-green-600">-{formatCurrency(leaseData.discount)}</p>
                      </>
                    )}
                    <p className="text-sm text-muted-foreground mt-2">Horse Power</p>
                    <p className="font-medium mt-1">{tractorSpec?.horsePower || "N/A"} HP</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Agreement Status */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium">Agreement Status</h4>
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">Customer Confirmation</span>
                      <div className="flex items-center gap-2">
                        {leaseData?.user_confirm ? (
                          <>
                            <Check className="h-5 w-5 text-green-500" />
                            <span className="text-green-600 font-medium">Confirmed</span>
                          </>
                        ) : (
                          <>
                            <Clock className="h-5 w-5 text-yellow-500" />
                            <span className="text-yellow-600 font-medium">Pending</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">Dealer Confirmation</span>
                      <div className="flex items-center gap-2">
                        {leaseData?.dealer_confirm ? (
                          <>
                            <Check className="h-5 w-5 text-green-500" />
                            <span className="text-green-600 font-medium">Confirmed</span>
                          </>
                        ) : (
                          <>
                            <Clock className="h-5 w-5 text-yellow-500" />
                            <span className="text-yellow-600 font-medium">Pending</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="payment">
            <PaymentTab />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
