"use client"

import { useState, useEffect } from "react"
import { Search, ChevronDown, UserIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RentalDetailsModal } from "@/components/Dashboards/Dealer/Modals/RentalDetailsModal"
import { useCookie } from "next-cookie"
import { renderInstance } from "@/utils/Axios/RenderInstance"
import { errorMessage, successMessage } from "@/utils/Toastify/Messages"
import { CircularProgress } from "@mui/material"

// Define interfaces that match the API response
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

// Transform API data to match the existing table interface
interface TractorRental {
  id: number
  userId: string
  tractorNameModel: string
  startDate: string
  duration: string
  cost: number
  paymentStatus: "Paid" | "Pending" | "Overdue"
  status: "Active" | "Completed" | "Cancelled"
  originalData: TractorLeaseLead // Keep original data for modal
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

  // Transform API data to table format with rich details
  const transformApiDataToRental = (apiData: TractorLeaseLead[]): TractorRental[] => {
    return apiData.map((lead, index) => {
      // Extract tractor name from nested data
      const tractorName =
        lead.Tractor?.TractorSpecification?.inventoryTractor?.name ||
        `${lead.Tractor?.TractorSpecification?.brand || "Unknown"} ${lead.Tractor?.TractorSpecification?.model || "Model"}` ||
        `Tractor ${lead.tractorId}`

      // Extract customer name
      const customerName =
        `${lead.User?.first_name || ""} ${lead.User?.last_name || ""}`.trim() ||
        lead.User?.email ||
        `User ${lead.user_id}`

      // Better status mapping
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
        userId: customerName, // Show customer name instead of ID
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

  // Fetch tractor lease leads
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

  // Enhanced search functionality
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

  if (fetching) {
    return (
      <div className="w-full p-1">
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-lg shadow-sm">
          <CircularProgress size={48} />
          <p className="mt-4 text-lg text-gray-600">Loading tractor lease leads...</p>
          <p className="text-sm text-gray-500">Please wait while we fetch your data</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Top Header Section - Bright Red */}
      <div className="bg-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button className="bg-[#F91F1F] hover:bg-red-700 text-white px-4 py-2 rounded-[5px] text-sm font-medium flex items-center gap-2">
            All Rentals
            <ChevronDown className="h-4 w-4" />
          </Button>
          <Button className="bg-[#F91F1F] hover:bg-red-700 text-white px-4 py-2 rounded-[5px] text-sm font-medium flex items-center gap-2">
            <UserIcon className="h-4 w-4" />
            Rented By
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white border-[#F91F1F]" />
          <Input
            placeholder="Search in the List"
            className="pl-12 pr-4 py-3 w-96 bg-[#F91F1F] border-0 rounded-full text-sm placeholder:text-white border-[#F91F1F] focus:ring-2 "
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Secondary Header - Same Red */}
      <div className="bg-red-500 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <h1 className="text-white font-semibold text-lg">Total Rentals: {filteredRentals.length}</h1>
          <div className="flex items-center gap-2 bg-white py-0 px-5 rounded-full">
            <span className="text-[#F91F1F] text-sm">Sort By:</span>
            <Button className="bg-transparent text-red-500 hover:bg-transparent px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
              Date
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-white text-sm">Results</span>
          <Button variant="ghost" className="text-white hover:bg-red-600 px-2 py-1 text-sm flex items-center gap-1">
            {filteredRentals.length}
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden">
        {filteredRentals.length === 0 ? (
          <div className="text-center py-16 bg-white">
            <div className="mx-auto h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <div className="h-12 w-12 text-gray-400">🚜</div>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              {searchTerm ? "No matching rentals found" : "No rental leads available"}
            </h2>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              {searchTerm
                ? "Try adjusting your search terms to find what you're looking for."
                : "Check back later for new tractor lease inquiries, or refresh to load the latest data."}
            </p>
            <div className="flex justify-center gap-3">
              {searchTerm && (
                <Button variant="outline" onClick={() => setSearchTerm("")}>
                  Clear Search
                </Button>
              )}
              <Button onClick={fetchTractorLeaseLeads} className="bg-red-500 hover:bg-red-600">
                Refresh Data
              </Button>
            </div>
          </div>
        ) : (
          <table className="w-full">
            {/* Table Header - Red */}
            <thead>
              <tr className="bg-white">
                <th className="px-4 py-4 text-left text-sm font-bold text-[#F91F1F] uppercase tracking-wider">S.NO</th>
                <th className="px-4 py-4 text-left text-sm font-bold text-[#F91F1F] uppercase tracking-wider">
                  CUSTOMER NAME
                </th>
                <th className="px-4 py-4 text-left text-sm font-bold text-[#F91F1F] uppercase tracking-wider">
                  TRACTOR NAME & MODEL
                </th>
                <th className="px-4 py-4 text-left text-sm font-bold text-[#F91F1F] uppercase tracking-wider">
                  START DATE
                </th>
                <th className="px-4 py-4 text-left text-sm font-bold text-[#F91F1F] uppercase tracking-wider">
                  LEASE PERIOD
                </th>
                <th className="px-4 py-4 text-left text-sm font-bold text-[#F91F1F] uppercase tracking-wider">
                  MONTHLY COST
                </th>
                <th className="px-4 py-4 text-left text-sm font-bold text-[#F91F1F] uppercase tracking-wider">
                  PAYMENT STATUS
                </th>
                <th className="px-4 py-4 text-left text-sm font-bold text-[#F91F1F] uppercase tracking-wider">
                  LEASE STATUS
                </th>
              </tr>
            </thead>
            {/* Table Body - Dark Red/Maroon with White Text */}
            <tbody>
              {filteredRentals.map((rental, index) => (
                <tr
                  key={rental.id}
                  className="bg-red-900 hover:bg-red-800 transition-colors cursor-pointer border-b border-red-800"
                  onClick={() => openModal(rental)}
                >
                  <td className="px-4 py-4 text-white font-bold text-lg">{index + 1}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center">
                        <span className="text-sm font-bold text-red-900">
                          {rental.originalData?.User?.first_name?.[0] || "H"}
                          {rental.originalData?.User?.last_name?.[0] || ""}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-white">{rental.userId || "Holauser123"}</p>
                        <p className="text-sm text-red-200">
                          {rental.originalData?.User?.email || "Holauser123@gmail.com"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div>
                      <p className="font-semibold text-white">{rental.tractorNameModel || "MF 245 DI-50 HP"}</p>
                      <p className="text-sm text-red-200">
                        {rental.originalData?.Tractor?.TractorSpecification?.horsePower || "677"} HP - Medium Type
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div>
                      <p className="font-semibold text-white">{rental.startDate || "Jun 30,2025"}</p>
                      <p className="text-sm text-red-200">May 02,2025</p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="font-semibold text-white">{rental.duration || "One Month"}</span>
                  </td>
                  <td className="px-4 py-4">
                    <div>
                      <p className="font-semibold text-white">${rental.cost?.toLocaleString() || "1200"}.5</p>
                      <p className="text-sm text-red-200">-$50 Discount</p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-500 text-white">
                      {rental.paymentStatus || "Pending"}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-600 text-white">
                      {rental.status || "Active"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <RentalDetailsModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} rental={selectedRental} />
    </div>
  )
}
