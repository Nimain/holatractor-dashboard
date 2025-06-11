"use client"
import { useState, useEffect } from "react"
import { MoreHorizontal, Filter, Search, Calendar, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { RentalDetailsModal } from "@/components/Dashboards/Dealer/Modals/RentalDetailsModal"
import { useCookie } from "next-cookie"
import { renderInstance } from "@/utils/Axios/RenderInstance"
import { errorMessage, successMessage } from "@/utils/Toastify/Messages"
import { CircularProgress } from "@mui/material"

// Define user interface to match your Header component
interface User {
  userId: string
  image: string
  name: string
  email: string
  email_varified: boolean
}

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
  const user: User = cookie?.get("user")
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
    if (!user?.userId) {
      errorMessage("User not found. Please login again.")
      console.log("User or userId is missing:", { user, userId: user?.userId })
      return
    }

    setFetching(true)
    renderInstance
      .get(`/dealer/store/tractorleaselead/${user.userId}`, {
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
    if (user?.userId && access_token) {
      fetchTractorLeaseLeads()
    } else {
      console.log("Missing user or token:", { userId: user?.userId, hasToken: !!access_token })
    }
  }, [user?.userId, access_token])

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

  const toggleSelectAll = () => {
    if (selectedRentals.length === filteredRentals.length) {
      setSelectedRentals([])
    } else {
      setSelectedRentals(filteredRentals.map((rental) => rental.id))
    }
  }

  const toggleSelectRental = (id: number) => {
    setSelectedRentals((prev) => (prev.includes(id) ? prev.filter((rentalId) => rentalId !== id) : [...prev, id]))
  }

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
    <div className="w-full p-1">
      {/* First Row Header */}
      <div className="flex items-center justify-between p-4 bg-white rounded-t-lg">
        <div className="flex items-center gap-2">
          <Button variant="ghost" className="h-10 px-4 bg-white border shadow-sm rounded-lg flex items-center">
            <Filter className="mr-2 h-4 w-4 text-gray-500" />
            All Rentals
            <ChevronDown className="ml-2 h-4 w-4 text-gray-400" />
          </Button>
          <Button variant="ghost" className="h-10 px-4 bg-white border shadow-sm rounded-lg flex items-center">
            <div className="mr-2 h-5 w-5 rounded-full bg-gray-100 flex items-center justify-center">
              <div className="h-4 w-4 text-gray-500">👤</div>
            </div>
            Rented by
            <ChevronDown className="ml-2 h-4 w-4 text-gray-400" />
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search in the list..."
              className="h-10 pl-10 pr-4 w-[360px] text-sm border shadow-sm rounded-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button
            variant="ghost"
            className="h-10 w-10 bg-white border shadow-sm rounded-lg flex items-center justify-center"
            onClick={fetchTractorLeaseLeads}
            disabled={fetching}
          >
            <Calendar size={39} className="w-14 h-14 text-gray-500 text-3xl" />
          </Button>
        </div>
      </div>

      {/* Second Row Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-t">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold">Total Rentals: {filteredRentals.length}</h1>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Sort by</span>
            <Button variant="ghost" className="text-blue-600 px-1 hover:bg-transparent hover:text-blue-700">
              Date
              <ChevronDown className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Results</span>
            <Button variant="ghost" className="text-gray-900 px-1 hover:bg-transparent">
              {filteredRentals.length}
              <ChevronDown className="ml-1 h-4 w-4" />
            </Button>
          </div>

          <Button variant="ghost" size="icon" className="h-8 w-8">
            <div className="grid grid-cols-3 gap-0.5">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="w-1 h-1 bg-gray-400 rounded-full" />
              ))}
            </div>
          </Button>

          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-5 w-5 text-gray-400" />
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="px-0 bg-white">
        {filteredRentals.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow-sm">
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
              <Button onClick={fetchTractorLeaseLeads}>Refresh Data</Button>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-100 bottom-7">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-50">
                  <th className="w-[40px] px-4 py-3">
                    <Checkbox
                      checked={selectedRentals.length === filteredRentals.length && filteredRentals.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">SL NO</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">CUSTOMER NAME</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">TRACTOR NAME & MODEL</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">START DATE</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">LEASE PERIOD</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">MONTHLY COST</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">PAYMENT STATUS</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">LEASE STATUS</th>
                  <th className="w-[40px]"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRentals.map((rental, index) => (
                  <tr
                    key={rental.id}
                    className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                    onClick={() => openModal(rental)}
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedRentals.includes(rental.id)}
                        onCheckedChange={() => toggleSelectRental(rental.id)}
                      />
                    </td>
                    <td className="px-4 py-3">{index + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-xs font-medium text-blue-600">
                            {rental.originalData?.User?.first_name?.[0] || "U"}
                            {rental.originalData?.User?.last_name?.[0] || "N"}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-sm">{rental.userId}</p>
                          <p className="text-xs text-gray-500">{rental.originalData?.User?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-sm">{rental.tractorNameModel}</p>
                        <p className="text-xs text-gray-500">
                          {rental.originalData?.Tractor?.TractorSpecification?.horsePower || "N/A"} HP •
                          {rental.originalData?.Tractor?.TractorSpecification?.inventoryTractor?.type || "Unknown"} Type
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-sm">{rental.startDate}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(rental.originalData?.createdAt || "").toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}{" "}
                          applied
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium">{rental.duration}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-sm">${rental.cost.toLocaleString()}</p>
                        {rental.originalData?.discount > 0 && (
                          <p className="text-xs text-green-600">-${rental.originalData.discount} discount</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          rental.paymentStatus === "Paid"
                            ? "bg-green-100 text-green-800"
                            : rental.paymentStatus === "Pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                        }`}
                      >
                        {rental.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          rental.status === "Active"
                            ? "bg-blue-100 text-blue-800"
                            : rental.status === "Completed"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {rental.status}
                      </span>
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-gray-100">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <RentalDetailsModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} rental={selectedRental} />
    </div>
  )
}
