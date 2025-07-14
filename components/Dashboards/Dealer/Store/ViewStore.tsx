"use client"

import { Search, Mail, Store, Heart, ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { Bar, BarChart, XAxis, YAxis } from "recharts"
import { ChartContainer } from "@/components/ui/chart"
import Image from "next/image"
import AddStoreModal from "@/components/Dashboards/Dealer/_components/AddStoreModal"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { renderInstance } from "@/utils/Axios/RenderInstance"
import { useCookie } from "next-cookie"
import { format } from "date-fns"

interface StoreLocation {
  id: string
  name: string | null
  address: string | null
  city: string | null
  state: string | null
  zip_code: string | null
  country: string | null
  base_id: string
  lat: string
  lan: string
  createdAt: string
  updatedAt: string
}

interface StoreData {
  id: string
  owner_id: string
  name: string
  description: string
  banner: string[]
  logo: string
  opening_time: string
  closing_time: string
  closing_days: string[]
  created_by: string
  base_id: string
  rating_id: string[]
  location_id: string
  createdAt: string
  updatedAt: string
  location: StoreLocation
  AttachmentInDealerStore: any[]
  TractorInDealerStore: any[]
  SellTractor: any[]
}

interface Mentor {
  name: string
  role: string
  avatar: string
  verified?: boolean
}

export default function ResponsiveDealerDashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [stores, setStores] = useState<StoreData[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { cookie } = useCookie()
  const user = cookie.get("user")
  const access_token = cookie.get("access_token")

  // Fetch stores when component mounts
  useEffect(() => {
    const fetchStores = async () => {
      if (!user?.userId || !access_token) return
      try {
        setLoading(true)
        const response = await renderInstance.get(`/dealer/all-stores/${user.userId}`, {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        })
        if (response.status === 200) {
          setStores(response.data)
        }
      } catch (error) {
        console.error("Error fetching stores:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStores()
  }, [user?.userId, access_token])

  // Format time from ISO string
  const formatTime = (timeString: string) => {
    try {
      const date = new Date(timeString)
      return format(date, "h:mm a")
    } catch (error) {
      return "N/A"
    }
  }

  const chartData = [
    { name: "1-10 Aug", value: 30, fill: "#7C5CFC" },
    { name: "11-20 Aug", value: 45, fill: "#7C5CFC" },
    { name: "21-30 Aug", value: 60, fill: "#7C5CFC" },
    { name: "11-20 Aug", value: 45, fill: "#7C5CFC" },
    { name: "21-30 Aug", value: 60, fill: "#7C5CFC" },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-4 md:p-6 bg-white shadow-sm">
        <div className="relative w-full md:w-1/2 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search your store..."
            className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
          />
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto justify-end">
          <button
            className="flex items-center gap-2 px-4 py-2 bg-[#F91F1F] text-white rounded-lg shadow-md hover:bg-red-700 transition-colors duration-200"
            onClick={() => setIsModalOpen(true)}
          >
            <Store size={20} className="text-white" />
            <span className="hidden sm:inline">Add Store</span>
          </button>
        </div>
      </div>

      <AddStoreModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      {/* Main Content Grid - FIXED: Changed from xl:flex-row to 2xl:flex-row */}
      <div className="flex flex-col 2xl:flex-row gap-6 p-4 md:p-6">
        {/* Left content - Flexible width with min-w-0 to prevent overflow */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Hero Section */}
          <div className="bg-gradient-to-br from-[#A10A0C] to-[#3B0404] rounded-2xl md:rounded-3xl p-6 md:p-8 text-white relative overflow-hidden">
            <div className="absolute right-0 top-0 w-1/2 h-full opacity-20 hidden md:block">
              <div className="absolute right-[-100px] top-1/2 transform -translate-y-1/2 w-[400px] h-[400px] border border-white/20 rounded-full" />
              <div className="absolute right-[-50px] top-1/2 transform -translate-y-1/2 w-[300px] h-[300px] border border-white/20 rounded-full" />
              <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-[200px] h-[200px] border border-white/20 rounded-full" />
            </div>
            <div className="text-xs md:text-sm uppercase tracking-wide mb-2">Dealer Dashboard</div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 md:mb-6 max-w-lg leading-tight">
              Manage Your Stores and Inventory
            </h1>
            <button className="bg-white hover:bg-gray-100 text-[#F91F1F] px-4 md:px-6 py-2 md:py-3 rounded-[5px] flex items-center gap-2 text-sm transition-colors">
              Join Now
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Store Progress Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-[#A10A0C] to-[#3B0404] rounded-xl shadow-sm">
              <div className="p-3 bg-blue-50 rounded-xl flex-shrink-0">
                <div className="text-[#F91F1F] font-medium text-sm">Total Stores</div>
              </div>
              <div className="text-sm text-white">{stores.length}</div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-[#A10A0C] to-[#3B0404] rounded-xl shadow-sm">
              <div className="p-3 bg-green-50 rounded-xl flex-shrink-0">
                <div className="text-[#F91F1F] font-medium text-sm">Branding</div>
              </div>
              <div className="text-sm text-white">{stores.length}</div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-[#A10A0C] to-[#3B0404] rounded-xl shadow-sm">
              <div className="p-3 bg-purple-50 rounded-xl flex-shrink-0">
                <div className="text-[#F91F1F] font-medium text-sm">Front End</div>
              </div>
              <div className="text-sm text-white">0 items</div>
            </div>
          </div>

          {/* All Stores Section */}
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <h2 className="text-xl font-bold text-[#F91F1F]">All Stores</h2>
              <div className="flex gap-2">
                <button className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
                  <ChevronLeft size={20} className="text-gray-600" />
                </button>
                <button className="p-2 rounded-full bg-[#F91F1F] hover:bg-red-700 text-white transition-colors">
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
              </div>
            ) : stores.length > 0 ? (
              /* FIXED: Changed grid breakpoints to prevent squeezing */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-4 md:gap-6">
                {stores.map((store) => (
                  <div
                    key={store.id}
                    className="bg-gradient-to-br from-[#A10A0C] to-[#3B0404] rounded-xl overflow-hidden shadow-sm cursor-pointer hover:shadow-lg transition-all duration-200 text-white hover:scale-[1.02]"
                    onClick={() => router.push(`/dealer/store/${store.id}`)}
                  >
                    <div className="relative">
                      <Image
                        src={store.banner[0] || store.logo || "/placeholder.svg?height=200&width=400"}
                        alt={store.name}
                        width={400}
                        height={200}
                        className="w-full h-40 md:h-48 object-cover"
                      />
                      <button
                        className="absolute top-4 right-4 p-2 rounded-full bg-white/80 hover:bg-white transition-colors"
                        onClick={(e) => {
                          e.stopPropagation()
                          // Handle favorite logic here
                        }}
                      >
                        <Heart size={20} className="text-[#F91F1F]" />
                      </button>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold mb-3 line-clamp-1 text-base">{store.name || "Unnamed Store"}</h3>
                      <div className="space-y-2 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-white font-medium min-w-[45px]">Hours:</span>
                          <span className="text-sm text-white font-medium">
                            {formatTime(store.opening_time)} - {formatTime(store.closing_time)}
                          </span>
                        </div>
                        {store.closing_days.length > 0 && store.closing_days[0] && (
                          <div className="flex items-start gap-2">
                            <span className="text-xs text-white font-medium min-w-[45px] mt-0.5">Closed:</span>
                            <div className="flex flex-wrap gap-1">
                              {store.closing_days.map((day, index) => (
                                <span key={index} className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded">
                                  {day}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="relative group mb-4">
                        <p className="text-sm text-white leading-5 h-10 overflow-hidden">
                          {store.description || "No description available"}
                        </p>
                        {store.description && store.description.length > 80 && (
                          <div className="absolute bottom-full left-0 right-0 mb-2 p-3 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20 pointer-events-none shadow-lg">
                            {store.description}
                            <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <Store size={16} className="text-[#F91F1F]" />
                          </div>
                          <div className="text-xs text-white">
                            Created {new Date(store.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <button
                          className="text-xs bg-blue-50 text-[#F91F1F] px-3 py-1 rounded-full whitespace-nowrap hover:bg-blue-100 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/dealer/store/${store.id}`)
                          }}
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl p-8 text-center shadow-sm">
                <Store size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-800 mb-2">No Stores Found</h3>
                <p className="text-gray-600 mb-4">You haven't created any stores yet.</p>
                <button
                  className="px-4 py-2 bg-[#F91F1F] text-white rounded-lg hover:bg-red-700 transition-colors"
                  onClick={() => setIsModalOpen(true)}
                >
                  Create Your First Store
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - FIXED: Changed from xl:w-80 xl:flex-shrink-0 to 2xl:w-80 2xl:flex-shrink-0 */}
        <div className="w-full 2xl:w-80 2xl:flex-shrink-0">
          <div className="bg-gradient-to-br from-[#A10A0C] to-[#3B0404] rounded-2xl p-6 2xl:sticky 2xl:top-6">
            {/* Profile Section */}
            <div className="text-center mb-6 md:mb-8">
              <div className="relative inline-block">
                <div className="w-16 md:w-20 h-16 md:h-20 rounded-full bg-[#F5F1FF] flex items-center justify-center relative">
                  <img
                    src={user?.image || "/placeholder.svg?height=80&width=80"}
                    alt="Profile"
                    className="w-12 md:w-16 h-12 md:h-16 rounded-full object-cover"
                  />
                  <svg className="absolute inset-0 w-full h-full rotate-[-90deg]">
                    <circle
                      cx="50%"
                      cy="50%"
                      r="38"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                      className="text-[#F5F1FF]"
                    />
                    <circle
                      cx="50%"
                      cy="50%"
                      r="38"
                      stroke="#7C5CFC"
                      strokeWidth="4"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 38 * 0.32} ${2 * Math.PI * 38 * (1 - 0.32)}`}
                      className="drop-shadow-[0_2px_4px_rgba(124,92,252,0.4)]"
                    />
                  </svg>
                </div>
              </div>
              <h3 className="text-lg font-bold mt-4 mb-1 text-white">Welcome, {user?.name || "Dealer"} 👋</h3>
              <p className="text-sm text-white">Manage your stores and inventory from one place</p>
            </div>

            {/* Chart Section */}
            <div className="mb-6 md:mb-8 bg-gradient-to-br from-[#A10A0C] to-[#3B0404] p-4 md:p-6 rounded-[20px] border border-white">
              <h3 className="font-semibold mb-4 text-white">Store Performance</h3>
              <ChartContainer
                className="h-[150px] md:h-[170px] w-full"
                config={{
                  value: {
                    color: "#FF6B1B",
                  },
                }}
              >
                <BarChart data={chartData} margin={{ top: 10, right: 0, bottom: 10, left: 10 }}>
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    fontSize={10}
                    tickMargin={8}
                    tick={{ fill: "#ffffff", fontSize: 10 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    fontSize={10}
                    tickMargin={8}
                    tick={{ fill: "#ffffff", fontSize: 10 }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={40} fill="#FF6B1B" />
                </BarChart>
              </ChartContainer>
            </div>

            {/* Mentors Section */}
            <div className="bg-gradient-to-br from-[#A10A0C] to-[#3B0404] p-4 md:p-6 rounded-[20px] border border-white">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg md:text-xl font-bold text-yellow-400">Your Mentor</h2>
              </div>
              <div className="space-y-4">
                {/* Mentor Items */}
                {[
                  { icon: Store, name: "Padhang Satrio" },
                  { icon: Plus, name: "Zakir Horizontal" },
                  { icon: Mail, name: "Leonardo Samsul" },
                ].map((mentor, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between w-full p-3 bg-transparent rounded-lg hover:bg-red-600/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="relative flex-shrink-0">
                        <div className="w-10 md:w-12 h-10 md:h-12 bg-gray-300 rounded-full flex items-center justify-center">
                          <mentor.icon size={18} className="text-gray-600" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-3 md:w-4 h-3 md:h-4 bg-green-500 rounded-full border-2 border-white"></div>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-white font-semibold text-sm md:text-base truncate">{mentor.name}</span>
                        <span className="text-gray-300 text-xs md:text-sm">Mentor</span>
                      </div>
                    </div>
                    <button className="text-yellow-400 font-medium hover:text-yellow-300 transition-colors text-sm flex-shrink-0">
                      Follow
                    </button>
                  </div>
                ))}
              </div>
              <button className="w-full text-center text-white mt-6 py-3 bg-transparent border border-white/30 rounded-xl text-sm font-medium hover:bg-white/10 transition-colors">
                See All
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
