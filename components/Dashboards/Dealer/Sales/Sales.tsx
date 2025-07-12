"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Phone, 
  MapPin, 
  Star, 
  Clock, 
  Mail, 
  Tractor, 
  RefreshCw, 
  Search,
  Filter,
  TrendingUp,
  Calendar,
  DollarSign,
  MessageSquare,
  ChevronDown,
  Users,
  Target
} from "lucide-react"
import { useCookie } from "next-cookie"
import { renderInstance } from "@/utils/Axios/RenderInstance"
import { errorMessage, successMessage } from "@/utils/Toastify/Messages"
import type { TractorLead as BaseTractorLead, User as BaseUser } from "@/utils/Types/types"
import { CircularProgress } from "@mui/material"

// Define user interface to match your Header component
interface User {
  userId: string
  image: string
  name: string
  email: string
  email_varified: boolean
}

// Define interfaces that match the actual API response
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
}

interface ApiUser extends BaseUser {
  location?: {
    city?: string
  }
}

interface ApiTractorLead extends Omit<BaseTractorLead, "tractor" | "user"> {
  name?: string
  city?: string
  mobile?: string
  timeframe?: string
  tractor: ApiTractor
  user: ApiUser
}

export default function SalesPage() {
  const [leads, setLeads] = useState<ApiTractorLead[]>([])
  const [fetching, setFetching] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [sortBy, setSortBy] = useState("newest")

  const { cookie } = useCookie()
  const user: User = cookie?.get("user")
  const access_token = cookie?.get("access_token")

  function fetchTractorLeads() {
    if (!user?.userId) {
      errorMessage("User not found. Please login again.")
      console.log("User or userId is missing:", { user, userId: user?.userId })
      return
    }

    setFetching(true)
    renderInstance
      .get(`/dealer/store/tractorleaddealer/${user.userId}`, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      })
      .then((res) => {
        console.log("API Response:", res.data)

        // Handle different response structures
        let leadsData = []
        if (Array.isArray(res.data)) {
          leadsData = res.data
        } else if (res.data?.data && Array.isArray(res.data.data)) {
          leadsData = res.data.data
        } else if (res.data?.leads && Array.isArray(res.data.leads)) {
          leadsData = res.data.leads
        } else {
          console.warn("Unexpected response structure:", res.data)
          leadsData = []
        }

        console.log("Processed leads data:", leadsData)
        setLeads(leadsData)
        successMessage(`Loaded ${leadsData.length} tractor leads`)
      })
      .catch((err) => {
        console.error("Error fetching leads:", err)
        console.error("Error response:", err.response?.data)

        if (err.response?.status === 401) {
          errorMessage("Unauthorized. Please login again.")
        } else if (err.response?.status === 404) {
          errorMessage("No leads found for this dealer")
          setLeads([])
        } else if (err.response?.status === 500) {
          errorMessage("Server error. Please try again later.")
        } else {
          errorMessage("Error fetching tractor leads")
        }
      })
      .finally(() => {
        setFetching(false)
      })
  }

  useEffect(() => {
    if (user?.userId && access_token) {
      fetchTractorLeads()
    } else {
      console.log("Missing user or token:", { userId: user?.userId, hasToken: !!access_token })
    }
  }, [user?.userId, access_token])

  // Filter and sort leads
  const filteredLeads = leads.filter(lead => {
    const leadName = lead.name ?? `${lead.user?.first_name ?? ""} ${lead.user?.last_name ?? ""}`.trim()
    const userCity = lead.city ?? lead.user?.location?.city ?? ""
    const searchString = `${leadName} ${userCity} ${lead.user?.email ?? ""}`.toLowerCase()
    
    return searchString.includes(searchTerm.toLowerCase())
  })

  const sortedLeads = [...filteredLeads].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      case "oldest":
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
      case "price-high":
        return (b.tractor?.price || 0) - (a.tractor?.price || 0)
      case "price-low":
        return (a.tractor?.price || 0) - (b.tractor?.price || 0)
      default:
        return 0
    }
  })

  // Calculate stats
  const totalLeads = leads.length
  const totalValue = leads.reduce((sum, lead) => sum + (lead.tractor?.price || 0), 0)
  const avgValue = totalLeads > 0 ? totalValue / totalLeads : 0
  const urgentLeads = leads.filter(lead => 
    lead.timeframe?.toLowerCase().includes('urgent') || 
    lead.timeframe?.toLowerCase().includes('immediate')
  ).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 text-white">
      <div className="container mx-auto p-6">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-4xl font-bold text-[#F91F1F] mb-2">
                Tractor Sales Dashboard
              </h1>
              <p className="text-lg text-[#F91F1F]">
                Manage your tractor inquiries and convert leads into sales
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              {/* <Button variant="outline" onClick={fetchTractorLeads} disabled={fetching} className="shadow-sm">
                <RefreshCw className={`h-4 w-4 mr-2 ${fetching ? "animate-spin" : ""}`} />
                Refresh
              </Button> */}
              <Badge variant="secondary" className="text-lg px-4 py-2 bg-gradient-to-br from-[#A10A0C] to-[#3B0404] shadow-sm text-white">
                <Users className="h-4 w-4 mr-2" />
                {totalLeads} Total Leads
              </Badge>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <Card className="bg-gradient-to-br from-[#A10A0C] to-[#3B0404] shadow-sm border-0">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">Total Leads</p>
                    <p className="text-2xl font-bold text-white">{totalLeads}</p>
                  </div>
                  <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-[#A10A0C] to-[#3B0404] shadow-sm border-0">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">Total Value</p>
                    <p className="text-2xl font-bold text-white">${(totalValue / 100000).toFixed(1)}L</p>
                  </div>
                  <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-[#A10A0C] to-[#3B0404] shadow-sm border-0">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">Avg. Value</p>
                    <p className="text-2xl font-bold text-white">${(avgValue / 100000).toFixed(1)}L</p>
                  </div>
                  <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-[#A10A0C] to-[#3B0404] shadow-sm border-0">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">Urgent Leads</p>
                    <p className="text-2xl font-bold text-white">{urgentLeads}</p>
                  </div>
                  <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <Target className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6 bg-gradient-to-br from-[#A10A0C] to-[#3B0404] shadow-sm border-0">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search by name, city, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-gray-200 text-[#F91F1F] placeholder:text-[#F91F1F] bg-gradient-to-br from-[#A10A0C] to-[#3B0404] "
                  />
                </div>
              </div>
              
              <div className="flex gap-3">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gradient-to-br from-[#A10A0C] to-[#3B0404] text-[#F91F1F] "
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="price-low">Price: Low to High</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        {fetching ? (
          <div className="flex flex-col items-center justify-center py-16 bg-gradient-to-br from-[#A10A0C] to-[#3B0404] rounded-lg shadow-sm">
            <CircularProgress size={48} />
            <p className="mt-4 text-lg text-white">Loading tractor leads...</p>
            <p className="text-sm text-white">Please wait while we fetch your data</p>
          </div>
        ) : sortedLeads.length === 0 ? (
          <div className="text-center py-16 bg-gradient-to-br from-[#A10A0C] to-[#3B0404] rounded-lg shadow-sm">
            <div className="mx-auto h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <Tractor className="h-12 w-12 text-gray-400" />
            </div>
            <h2 className="text-2xl font-semibold text-white mb-2">
              {searchTerm ? "No matching leads found" : "No leads available"}
            </h2>
            <p className="text-white mb-6 max-w-md mx-auto">
              {searchTerm 
                ? "Try adjusting your search terms or filters to find what you're looking for."
                : "Check back later for new tractor inquiries, or refresh to load the latest data."
              }
            </p>
            <div className="flex justify-center gap-3">
              {searchTerm && (
                <Button variant="outline" onClick={() => setSearchTerm("")}>
                  Clear Search
                </Button>
              )}
              <Button onClick={fetchTractorLeads}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {sortedLeads.map((lead) => (
              <TractorLeadCard key={lead.id || `lead-${Math.random()}`} lead={lead} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function TractorLeadCard({ lead }: { lead: ApiTractorLead }) {
  const leadName = lead.name ?? `${lead.user?.first_name ?? "Unknown"} ${lead.user?.last_name ?? "User"}`
  const userInitials = lead.name
    ? lead.name
        .split(" ")
        .map((n) => n?.[0] ?? "")
        .join("")
        .toUpperCase()
        .slice(0, 2) || "UN"
    : `${lead.user?.first_name?.[0] ?? "U"}${lead.user?.last_name?.[0] ?? "U"}`

  const userEmail = lead.user?.email ?? "No email"
  const userImage = lead.user?.image ?? undefined
  const userCity = lead.city ?? lead.user?.location?.city ?? "Unknown City"
  const userMobile = lead.mobile ?? lead.user?.mobile ?? "No phone"
  const timeframe = lead.timeframe ?? "Not specified"

  const tractorPrice = lead.tractor?.price ?? 0
  const tractorMonthlyPrice = lead.tractor?.monthlyPrice ?? 0
  const tractorDiscount = lead.tractor?.discount ?? 0
  const tractorRating = lead.tractor?.rating ?? 0
  const tractorListingType = lead.tractor?.listingType ?? "N/A"

  const isUrgent = timeframe.toLowerCase().includes('urgent') || timeframe.toLowerCase().includes('immediate')
  const isHighValue = tractorPrice > 1000000

  return (
    <Card className="group hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-[#A10A0C] to-[#3B0404] border-0 shadow-sm hover:-translate-y-1">
      <CardHeader className="pb-4">
        <div className="flex items-start gap-4">
          <div className="relative">
            <Avatar className="h-16 w-16 ring-2 ring-white shadow-md">
              <AvatarImage src={userImage ?? "/placeholder.svg"} alt={leadName} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            {isUrgent && (
              <div className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full animate-pulse"></div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <CardTitle className="text-lg font-semibold text-white truncate">
                  {leadName}
                </CardTitle>
                <div className="flex items-center gap-1 mt-1">
                  <MapPin className="h-3 w-3 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-white truncate">{userCity}</span>
                </div>
              </div>
              
              <div className="flex flex-col gap-1 ml-2">
                {isUrgent && (
                  <Badge variant="destructive" className="text-xs">Urgent</Badge>
                )}
                {isHighValue && (
                  <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">High Value</Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Contact Information */}
        <div className="grid grid-cols-1 gap-3">
          <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
            <Phone className="h-4 w-4 text-blue-600 flex-shrink-0" />
            <span className="text-sm font-medium text-white">{userMobile}</span>
          </div>
          
          <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
            <Mail className="h-4 w-4 text-green-600 flex-shrink-0" />
            <span className="text-sm text-gray-700 truncate">{userEmail}</span>
          </div>
          
          <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
            <Clock className="h-4 w-4 text-purple-600 flex-shrink-0" />
            <span className="text-sm text-gray-700">{timeframe}</span>
          </div>
          
          <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
            <Calendar className="h-4 w-4 text-orange-600 flex-shrink-0" />
            <span className="text-sm text-gray-700">
              {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              }) : "Unknown date"}
            </span>
          </div>
        </div>

        {/* Tractor Details */}
        {lead.tractor && (
          <div className="border-t pt-4 mt-4">
            <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
              <Tractor className="h-4 w-4" />
              Tractor Interest
            </h4>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-white">Price:</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg text-white">
                    ${(tractorPrice / 100000).toFixed(1)}L
                  </span>
                  {tractorDiscount > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      -${(tractorDiscount / 1000).toFixed(0)}K
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-white">Monthly EMI:</span>
                <span className="font-semibold text-white">
                  ${tractorMonthlyPrice.toLocaleString()}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-white">Condition:</span>
                <Badge variant={tractorListingType === "New" ? "default" : "secondary"}>
                  {tractorListingType}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-white">Rating:</span>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-semibold text-white">
                    {tractorRating.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-4">
        <ContactLeadForm lead={lead} />
      </CardFooter>
    </Card>
  )
}

function ContactLeadForm({ lead }: { lead: ApiTractorLead }) {
  const [open, setOpen] = useState(false)
  const [requesting, setRequesting] = useState(false)

  const { cookie } = useCookie()
  const access_token = cookie?.get("access_token")

  const [formData, setFormData] = useState({
    subject: "",
    message: "",
    offerPrice: (lead.tractor?.price ?? 0).toString(),
    contactMethod: "email",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  function handleContactLead() {
    if (!formData.subject?.trim() || !formData.message?.trim()) {
      errorMessage("Subject and message are required")
      return
    }

    if (!access_token) {
      errorMessage("Authorization token not found. Please login again.")
      return
    }

    setRequesting(true)

    const requestData = {
      subject: formData.subject.trim(),
      message: formData.message.trim(),
      offer_price: formData.offerPrice ? Number.parseFloat(formData.offerPrice) : null,
      contact_method: formData.contactMethod,
    }

    renderInstance
      .post(`/dealer/contact-lead/${lead.id}`, requestData, {
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "application/json",
        },
      })
      .then((res) => {
        successMessage("Message sent successfully!")
        setOpen(false)
        setFormData({
          subject: "",
          message: "",
          offerPrice: (lead.tractor?.price ?? 0).toString(),
          contactMethod: "email",
        })
      })
      .catch((err) => {
        console.error("Error contacting lead:", err)

        if (err.response?.status === 404) {
          errorMessage("Lead not found")
        } else if (err.response?.status === 401) {
          errorMessage("Unauthorized. Please login again.")
        } else if (err.response?.status === 400) {
          errorMessage(err.response?.data?.message || "Invalid request data")
        } else if (err.response?.status === 500) {
          errorMessage("Server error. Please try again later.")
        } else {
          errorMessage("Error sending message. Please try again.")
        }
      })
      .finally(() => {
        setRequesting(false)
      })
  }

  const leadName = lead.name ?? `${lead.user?.first_name ?? "Unknown"} ${lead.user?.last_name ?? "User"}`

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-200">
          <MessageSquare className="h-4 w-4 mr-2" />
          Contact Lead
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Contact {leadName}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="subject" className="text-sm font-medium">Subject *</Label>
            <Input
              id="subject"
              name="subject"
              placeholder="Regarding your tractor inquiry..."
              value={formData.subject}
              onChange={handleInputChange}
              required
              className="border-gray-200"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="offerPrice" className="text-sm font-medium">Offer Price ($)</Label>
            <Input
              id="offerPrice"
              name="offerPrice"
              type="number"
              placeholder="Enter your offer..."
              value={formData.offerPrice}
              onChange={handleInputChange}
              min="0"
              className="border-gray-200"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="contactMethod" className="text-sm font-medium">Contact Method</Label>
            <select
              id="contactMethod"
              name="contactMethod"
              value={formData.contactMethod}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gradient-to-br from-[#A10A0C] to-[#3B0404]"
            >
              <option value="email">Email</option>
              <option value="phone">Phone</option>
              <option value="both">Both</option>
            </select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="message" className="text-sm font-medium">Message *</Label>
            <Textarea
              id="message"
              name="message"
              placeholder="Hi, I'm interested in discussing your tractor requirements..."
              value={formData.message}
              onChange={handleInputChange}
              rows={4}
              required
              className="border-gray-200"
            />
          </div>
          
          <Button 
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700" 
            onClick={handleContactLead} 
            disabled={requesting}
          >
            {requesting ? (
              <div className="flex items-center gap-2">
                <CircularProgress size={20} />
                <span>Sending...</span>
              </div>
            ) : (
              <>
                <MessageSquare className="h-4 w-4 mr-2" />
                Send Message
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}