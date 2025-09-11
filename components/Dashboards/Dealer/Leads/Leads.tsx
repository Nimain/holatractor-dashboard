"use client"

import { useState, useEffect } from "react"
import { Search, ChevronDown, UserIcon, Filter, MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { RentalDetailsModal } from "@/components/Dashboards/Dealer/Modals/RentalDetailsModal"
import { useCookie } from "next-cookie"
import { renderInstance } from "@/utils/Axios/RenderInstance"
import { errorMessage, successMessage } from "@/utils/Toastify/Messages"
import { CircularProgress } from "@mui/material"

function CustomTooltip({ text, maxLength }: { text: string; maxLength: number }) {
  const [isHovered, setIsHovered] = useState(false)

  if (text.length <= maxLength) return <span>{text}</span>

  return (
    <div
      className="relative inline-block cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span>{text.slice(0, maxLength)}...</span>
      {isHovered && (
        <div className="absolute left-0 top-full mt-2 z-50 p-2 bg-gray-800 text-white text-sm rounded shadow-lg whitespace-nowrap max-w-xs">
          {text}
        </div>
      )}
    </div>
  )
}

// Define interfaces (unchanged)
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
  TractorSpecification?: {
    brand: string
    model: string
    horsePower: string
    inventoryTractor: {
      name: string
      type: string
    }
  }
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
  originalData: TractorLeaseLead
}

export default function EnhancedTractorRentalTable() {
  const [rentals, setRentals] = useState<TractorRental[]>([])
  const [selectedRentals, setSelectedRentals] = useState<number[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedRental, setSelectedRental] = useState<TractorRental | null>(null)
  const [fetching, setFetching] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const { cookie } = useCookie()
  const dealerUser = cookie?.get("user")
  const access_token = cookie?.get("access_token")

  // Transform API data to table format (unchanged)
  const transformApiDataToRental = (apiData: TractorLeaseLead[]): TractorRental[] => {
    return apiData.map((lead, index) => {
      const tractorName =
        lead.Tractor?.TractorSpecification?.inventoryTractor?.name ||
        `${lead.Tractor?.TractorSpecification?.brand || "Unknown"} ${lead.Tractor?.TractorSpecification?.model || "Model"}` ||
        `Tractor ${lead.tractorId}`

      const customerName =
        `${lead.User?.first_name || ""} ${lead.User?.last_name || ""}`.trim() ||
        lead.User?.email ||
        `User ${lead.user_id}`

      const getPaymentStatus = (): "Paid" | "Pending" | "Overdue" => {
        if (lead.dealer_confirm && lead.user_confirm) return "Paid"
        if (lead.status === "CANCELLED") return "Overdue"
        return "Pending"
      }

      const getLeaseStatus = (): "Active" | "Completed" | "Cancelled" => {
        if (lead.status === "CANCELLED") return "Cancelled"
        if (lead.dealer_confirm && lead.user_confirm) return "Active"
        if (lead.status === "COMPLETED") return "Completed"
        return "Active"
      }

      return {
        id: index + 1,
        userId: customerName,
        tractorNameModel: tractorName,
        startDate: new Date(lead.startDate).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
        duration: lead.lease_period.replace("_", " "),
        cost: lead.monthlyPrice,
        paymentStatus: getPaymentStatus(),
        status: getLeaseStatus(),
        originalData: lead,
      }
    })
  }

  // Fetch tractor lease leads (unchanged)
  function fetchTractorLeaseLeads() {
    if (!dealerUser?.userId) {
      errorMessage("User not found. Please login again.")
      console.log("User or userId is missing:", { dealerUser, userId: dealerUser?.userId })
      return
    }

    setFetching(true)
    renderInstance
      .get(`/dealer/store/tractorleaselead/${dealerUser.userId}`, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      })
      .then((res) => {
        console.log("API Response:", res.data)
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
        console.log("Processed lease leads data:", leadsData)
        const transformedData = transformApiDataToRental(leadsData)
        setRentals(transformedData)
        successMessage(`Loaded ${transformedData.length} tractor lease leads`)
      })
      .catch((err) => {
        console.error("Error fetching lease leads:", err)
        console.error("Error response:", err.response?.data)
        if (err.response?.status === 401) {
          errorMessage("Unauthorized. Please login again.")
        } else if (err.response?.status === 404) {
          errorMessage("No lease leads found for this dealer")
          setRentals([])
        } else if (err.response?.status === 500) {
          errorMessage("Server error. Please try again later.")
        } else {
          errorMessage("Error fetching tractor lease leads")
        }
      })
      .finally(() => {
        setFetching(false)
      })
  }

  useEffect(() => {
    if (dealerUser?.userId && access_token) {
      fetchTractorLeaseLeads()
    } else {
      console.log("Missing user or token:", { userId: dealerUser?.userId, hasToken: !!access_token })
    }
  }, [dealerUser?.userId, access_token])

  // Enhanced search functionality (unchanged)
  const filteredRentals = rentals.filter((rental) => {
    const customerName =
      `${rental.originalData?.User?.first_name || ""} ${rental.originalData?.User?.last_name || ""}`.trim()
    const customerEmail = rental.originalData?.User?.email || ""
    const tractorBrand = rental.originalData?.Tractor?.TractorSpecification?.brand || ""
    const tractorModel = rental.originalData?.Tractor?.TractorSpecification?.model || ""
    const tractorName = rental.originalData?.Tractor?.TractorSpecification?.inventoryTractor?.name || ""

    const searchString =
      `${customerName} ${customerEmail} ${rental.tractorNameModel} ${tractorBrand} ${tractorModel} ${tractorName} ${rental.status} ${rental.duration}`.toLowerCase()

    return searchString.includes(searchTerm.toLowerCase())
  })

  const openModal = (rental: TractorRental) => {
    setSelectedRental(rental)
    setIsModalOpen(true)
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-500 hover:bg-green-600"
      case "Completed":
        return "bg-blue-500 hover:bg-blue-600"
      case "Cancelled":
        return "bg-gray-500 hover:bg-gray-600"
      default:
        return "bg-green-500 hover:bg-green-600"
    }
  }

  const getPaymentStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Paid":
        return "bg-green-500 hover:bg-green-600"
      case "Pending":
        return "bg-orange-500 hover:bg-orange-600"
      case "Overdue":
        return "bg-red-500 hover:bg-red-600"
      default:
        return "bg-orange-500 hover:bg-orange-600"
    }
  }

  if (fetching) {
    return (
      <div className="w-full p-4 md:p-6">
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-lg shadow-sm">
          <CircularProgress size={48} />
          <p className="mt-4 text-lg text-gray-600">Loading tractor lease leads...</p>
          <p className="text-sm text-gray-500">Please wait while we fetch your data</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full p-3">
      {/* Top Header Section - Improved Responsive Layout */}
      <div className="bg-transparent  py-4 pt-0">
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
          {/* Filter Buttons */}
          <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3">
            <Button className="bg-[#F91F1F] hover:bg-[#F91F1F] text-white px-4 py-2 rounded-[5px] text-sm font-medium flex items-center justify-center gap-2 w-full sm:w-auto">
              <Filter className="h-4 w-4" />
              All Rentals
              <ChevronDown className="h-4 w-4" />
            </Button>
            <Button className="bg-[#F91F1F] hover:bg-[#F91F1F] text-white px-4 py-2 rounded-[5px] text-sm font-medium flex items-center justify-center gap-2 w-full sm:w-auto">
              <UserIcon className="h-4 w-4" />
              Rented By
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
          {/* Search Bar */}
          <div className="relative w-full lg:w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#F91F1F]" />
            <Input
              placeholder="Search in the List"
              className="pl-10 pr-4 py-2.5 w-full bg-white border border-[#F91F1F] rounded-md text-sm placeholder:text-[#A80000] focus:ring-2 focus:ring-[#F91F1F] focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Secondary Header - Improved Layout */}
      <div className="bg-red-500 rounded-t-lg px-4 md:px-6 py-3">
        <div className="flex flex-col space-y-3 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-6">
            <h1 className="text-white font-semibold text-lg">
              Total Rentals: <span className="font-bold">{filteredRentals.length}</span>
            </h1>
            <div className="flex items-center gap-2 bg-white py-1 px-4 rounded-full w-fit">
              <span className="text-[#F91F1F] text-sm font-medium">Sort By:</span>
              <Button className="bg-transparent text-red-500 hover:bg-red-50 px-2 py-1 rounded-md text-sm font-medium flex items-center gap-1">
                Date
                <ChevronDown className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white text-sm">Results:</span>
            <Button variant="ghost" className="text-white hover:bg-red-600 px-3 py-1 text-sm flex items-center gap-1">
              {filteredRentals.length}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div>
        {filteredRentals.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg">
            <div className="mx-auto h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <div className="h-12 w-12 text-gray-400 text-2xl">🚜</div>
            </div>
            <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-2">
              {searchTerm ? "No matching rentals found" : "No rental leads available"}
            </h2>
            <p className="text-gray-500 mb-6 max-w-md mx-auto text-sm md:text-base">
              {searchTerm
                ? "Try adjusting your search terms to find what you're looking for."
                : "Check back later for new tractor lease inquiries, or refresh to load the latest data."}
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              {searchTerm && (
                <Button variant="outline" onClick={() => setSearchTerm("")} className="w-full sm:w-auto">
                  Clear Search
                </Button>
              )}
              <Button onClick={fetchTractorLeaseLeads} className="bg-red-500 hover:bg-red-600 w-full sm:w-auto">
                Refresh Data
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Desktop Table - Hidden on mobile and tablet */}
            <div className="hidden xl:block">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-4 text-left text-xs font-bold text-[#F91F1F] uppercase tracking-wider">
                          S.NO
                        </th>
                        <th className="px-3 py-4 text-left text-xs font-bold text-[#F91F1F] uppercase tracking-wider w-48">
                          Customer Name
                        </th>
                        <th className="px-4 py-4 text-left text-xs font-bold text-[#F91F1F] uppercase tracking-wider">
                          Tractor Name & Model
                        </th>
                        <th className="px-4 py-4 text-left text-xs font-bold text-[#F91F1F] uppercase tracking-wider">
                          Start Date
                        </th>
                        <th className="px-4 py-4 text-left text-xs font-bold text-[#F91F1F] uppercase tracking-wider">
                          Lease Period
                        </th>
                        <th className="px-4 py-4 text-left text-xs font-bold text-[#F91F1F] uppercase tracking-wider">
                          Monthly Cost
                        </th>
                        <th className="px-4 py-4 text-left text-xs font-bold text-[#F91F1F] uppercase tracking-wider">
                          Payment Status
                        </th>
                        <th className="px-4 py-4 text-left text-xs font-bold text-[#F91F1F] uppercase tracking-wider">
                          Lease Status
                        </th>
                        <th className="px-4 py-4 text-left text-xs font-bold text-[#F91F1F] uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-red-900 divide-y divide-gray-200">
                      {filteredRentals.map((rental, index) => (
                        <tr
                          key={rental.id}
                          className="hover:bg-red-800 transition-colors cursor-pointer"
                          onClick={() => openModal(rental)}
                        >
                          <td className="px-4 py-4 text-white font-semibold">{index + 1}</td>
                          <td className="px-3 py-4 w-48">
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                                <span className="text-xs font-bold text-white">
                                  {rental.originalData?.User?.first_name?.[0] || "H"}
                                  {rental.originalData?.User?.last_name?.[0] || ""}
                                </span>
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-white text-sm">
                                  <CustomTooltip text={rental.userId || "Holauser123"} maxLength={10} />
                                </p>
                                <p className="text-xs text-white">
                                  <CustomTooltip
                                    text={rental.originalData?.User?.email || "Holauser123@gmail.com"}
                                    maxLength={15}
                                  />
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div>
                              <p className="font-semibold text-white">
                                <CustomTooltip text={rental.tractorNameModel} maxLength={15} />
                              </p>
                              <p className="text-sm text-white">
                                {rental.originalData?.Tractor?.TractorSpecification?.horsePower} HP
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <p className="font-semibold text-white">{rental.startDate || "Jun 30, 2025"}</p>
                          </td>
                          <td className="px-4 py-4">
                            <span className="font-semibold text-white">{rental.duration || "One Month"}</span>
                          </td>
                          <td className="px-4 py-4">
                            <p className="font-semibold text-white">${rental.cost?.toLocaleString() || "1200"}</p>
                          </td>
                          <td className="px-4 py-4">
                            <Badge className={`${getPaymentStatusBadgeVariant(rental.paymentStatus)} text-white`}>
                              {rental.paymentStatus || "Pending"}
                            </Badge>
                          </td>
                          <td className="px-4 py-4">
                            <Badge className={`${getStatusBadgeVariant(rental.status)} text-white`}>
                              {rental.status || "Active"}
                            </Badge>
                          </td>
                          <td className="px-4 py-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                openModal(rental)
                              }}
                            >
                              <MoreVertical className="h-4 w-4 text-white" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Tablet Horizontal Scroll Table - Visible on medium to large screens */}
            <div className="hidden md:block xl:hidden">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full ">
                    <thead className="border-b border-gray-200">
                      <tr>
                        <th className="px-3 py-3 text-left text-xs font-bold text-[#F91F1F] uppercase tracking-wider">
                          S.NO
                        </th>
                        <th className="px-2 py-3 text-left text-xs font-bold text-[#F91F1F] uppercase tracking-wider w-32">
                          Customer
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-bold text-[#F91F1F] uppercase tracking-wider">
                          Tractor
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-bold text-[#F91F1F] uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-bold text-[#F91F1F] uppercase tracking-wider">
                          Period
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-bold text-[#F91F1F] uppercase tracking-wider">
                          Cost
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-bold text-[#F91F1F] uppercase tracking-wider">
                          Payment
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-bold text-[#F91F1F] uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-red-900 divide-y divide-gray-200">
                      {filteredRentals.map((rental, index) => (
                        <tr
                          key={rental.id}
                          className="hover:bg-red-800 transition-colors cursor-pointer"
                          onClick={() => openModal(rental)}
                        >
                          <td className="px-3 py-3 text-white font-semibold text-sm">{index + 1}</td>
                          <td className="px-2 py-3 w-32">
                            <div className="flex items-center gap-1">
                              <div className="h-6 w-6 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                                <span className="text-xs font-bold text-white">
                                  {rental.originalData?.User?.first_name?.[0] || "H"}
                                  {rental.originalData?.User?.last_name?.[0] || ""}
                                </span>
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-white text-xs">
                                  <CustomTooltip text={rental.userId || "Holauser123"} maxLength={8} />
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <p className="font-semibold text-white text-sm">
                              <CustomTooltip text={rental.tractorNameModel} maxLength={12} />
                            </p>
                          </td>
                          <td className="px-3 py-3">
                            <p className="font-semibold text-white text-sm">{rental.startDate || "Jun 30, 2025"}</p>
                          </td>
                          <td className="px-3 py-3">
                            <span className="font-semibold text-white text-sm">{rental.duration || "One Month"}</span>
                          </td>
                          <td className="px-3 py-3">
                            <p className="font-semibold text-white text-sm">
                              ${rental.cost?.toLocaleString() || "1200"}
                            </p>
                          </td>
                          <td className="px-3 py-3">
                            <Badge
                              className={`${getPaymentStatusBadgeVariant(rental.paymentStatus)} text-white text-xs`}
                            >
                              {rental.paymentStatus || "Pending"}
                            </Badge>
                          </td>
                          <td className="px-3 py-3">
                            <Badge className={`${getStatusBadgeVariant(rental.status)} text-white text-xs`}>
                              {rental.status || "Active"}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Mobile Card Layout - Visible only on small screens */}
            <div className="md:hidden space-y-4">
              {filteredRentals.map((rental, index) => (
                <div
                  key={rental.id}
                  className="cursor-pointer hover:shadow-md transition-shadow border border-gray-200 bg-[#742a2a]"
                  onClick={() => openModal(rental)}
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-bold text-lg text-white">#{index + 1}</span>
                      <Badge className={`${getStatusBadgeVariant(rental.status)} text-white`}>
                        {rental.status || "Active"}
                      </Badge>
                    </div>
                    <div className="space-y-3">
                      {/* Customer Info */}
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-white">
                            {rental.originalData?.User?.first_name?.[0] || "H"}
                            {rental.originalData?.User?.last_name?.[0] || ""}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-white">
                            <CustomTooltip text={rental.userId || "Holauser123"} maxLength={12} />
                          </p>
                          <p className="text-sm text-white">
                            <CustomTooltip
                              text={rental.originalData?.User?.email || "Holauser123@gmail.com"}
                              maxLength={20}
                            />
                          </p>
                        </div>
                      </div>
                      {/* Tractor Info */}
                      <div>
                        <p className="text-sm font-medium text-white">Tractor</p>
                        <p className="font-semibold text-white">
                          <CustomTooltip text={rental.tractorNameModel || "MF 245 DI-50 HP"} maxLength={20} />
                        </p>
                        <p className="text-sm text-white">
                          {rental.originalData?.Tractor?.TractorSpecification?.horsePower || "677"} HP
                        </p>
                      </div>
                      {/* Details Grid */}
                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                        <div>
                          <p className="text-sm font-medium text-white">Start Date</p>
                          <p className="font-semibold text-white">{rental.startDate || "Jun 30, 2025"}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">Period</p>
                          <p className="font-semibold text-white">{rental.duration || "One Month"}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">Monthly Cost</p>
                          <p className="font-semibold text-white">${rental.cost?.toLocaleString() || "1200"}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">Payment</p>
                          <Badge className={`${getPaymentStatusBadgeVariant(rental.paymentStatus)} text-white text-xs`}>
                            {rental.paymentStatus || "Pending"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <RentalDetailsModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} rental={selectedRental} />
    </div>
  )
}
