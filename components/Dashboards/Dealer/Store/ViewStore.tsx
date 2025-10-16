"use client"

import { Search, Mail, Store, Heart, ChevronLeft, ChevronRight, Plus, Menu } from "lucide-react"
import { Bar, BarChart, XAxis, YAxis } from "recharts"
import { ChartContainer } from "@/components/ui/chart"
import Image from "next/image"
import AddStoreModal from "@/components/Dashboards/Dealer/_components/AddStoreModal"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { renderInstance } from "@/utils/Axios/RenderInstance"
import { useCookie } from "next-cookie"
// Removed date-fns import - using native Date methods

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

export default function ResponsiveDealerDashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [stores, setStores] = useState<StoreData[]>([])
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()
  const { cookie } = useCookie()
  const user = cookie.get("user")
  const access_token = cookie.get("access_token")

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

  const formatTime = (timeString: string) => {
    try {
      const date = new Date(timeString)
      const hours = date.getHours()
      const minutes = date.getMinutes()
      const ampm = hours >= 12 ? 'PM' : 'AM'
      const displayHours = hours % 12 || 12
      const displayMinutes = minutes < 10 ? '0' + minutes : minutes
      return `${displayHours}:${displayMinutes} ${ampm}`
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
      {/* Header - Enhanced Mobile Responsiveness */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 md:p-6 bg-white shadow-sm sticky top-0 z-30">
        <div className="relative w-full sm:flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search your store..."
            className="w-full pl-9 pr-4 py-2 sm:py-2.5 text-sm rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
          />
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile Sidebar Toggle */}
          <button
            className="lg:hidden p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu size={20} className="text-gray-700" />
          </button>
          
          <button
            className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-[#F91F1F] text-white rounded-lg shadow-md hover:bg-red-700 transition-colors duration-200 flex-1 sm:flex-none text-sm"
            onClick={() => setIsModalOpen(true)}
          >
            <Store size={18} className="text-white" />
            <span>Add Store</span>
          </button>
        </div>
      </div>

      <AddStoreModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      {/* Main Content Grid */}
      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 p-3 sm:p-4 md:p-6">
        {/* Left Content - Main Section */}
        <div className="flex-1 min-w-0 space-y-4 sm:space-y-6">
          {/* Hero Section - Enhanced Mobile */}
          <div className="bg-gradient-to-br from-[#A10A0C] to-[#3B0404] rounded-xl sm:rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 text-white relative overflow-hidden">
            <div className="absolute right-0 top-0 w-1/2 h-full opacity-20 hidden sm:block">
              <div className="absolute right-[-100px] top-1/2 transform -translate-y-1/2 w-[300px] sm:w-[400px] h-[300px] sm:h-[400px] border border-white/20 rounded-full" />
              <div className="absolute right-[-50px] top-1/2 transform -translate-y-1/2 w-[200px] sm:w-[300px] h-[200px] sm:h-[300px] border border-white/20 rounded-full" />
              <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-[150px] sm:w-[200px] h-[150px] sm:h-[200px] border border-white/20 rounded-full" />
            </div>
            <div className="relative z-10">
              <div className="text-xs sm:text-sm uppercase tracking-wide mb-2">Dealer Dashboard</div>
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 md:mb-6 max-w-lg leading-tight">
                Manage Your Stores and Inventory
              </h1>
              <button className="bg-white hover:bg-gray-100 text-[#F91F1F] px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-[5px] flex items-center gap-2 text-xs sm:text-sm transition-colors">
                Join Now
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Store Progress Cards - Enhanced Mobile Grid */}
          <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            <div className="flex items-center gap-3 p-3 sm:p-4 bg-gradient-to-br from-[#A10A0C] to-[#3B0404] rounded-lg sm:rounded-xl shadow-sm">
              <div className="p-2 sm:p-3 bg-blue-50 rounded-lg sm:rounded-xl flex-shrink-0">
                <div className="text-[#F91F1F] font-medium text-xs sm:text-sm">Total Stores</div>
              </div>
              <div className="text-sm sm:text-base text-white font-semibold">{stores.length}</div>
            </div>
            <div className="flex items-center gap-3 p-3 sm:p-4 bg-gradient-to-br from-[#A10A0C] to-[#3B0404] rounded-lg sm:rounded-xl shadow-sm">
              <div className="p-2 sm:p-3 bg-green-50 rounded-lg sm:rounded-xl flex-shrink-0">
                <div className="text-[#F91F1F] font-medium text-xs sm:text-sm">Branding</div>
              </div>
              <div className="text-sm sm:text-base text-white font-semibold">{stores.length}</div>
            </div>
            <div className="flex items-center gap-3 p-3 sm:p-4 bg-gradient-to-br from-[#A10A0C] to-[#3B0404] rounded-lg sm:rounded-xl shadow-sm xs:col-span-2 md:col-span-1">
              <div className="p-2 sm:p-3 bg-purple-50 rounded-lg sm:rounded-xl flex-shrink-0">
                <div className="text-[#F91F1F] font-medium text-xs sm:text-sm">Front End</div>
              </div>
              <div className="text-sm sm:text-base text-white font-semibold">0 items</div>
            </div>
          </div>

          {/* All Stores Section */}
          <div>
            <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center mb-4 sm:mb-6 gap-3">
              <h2 className="text-lg sm:text-xl font-bold text-[#F91F1F]">All Stores</h2>
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
              <div className="flex justify-center items-center h-48 sm:h-64">
                <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-t-2 border-b-2 border-purple-500"></div>
              </div>
            ) : stores.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                {stores.map((store) => (
                  <div
                    key={store.id}
                    className="bg-gradient-to-br from-[#A10A0C] to-[#3B0404] rounded-lg sm:rounded-xl overflow-hidden shadow-sm cursor-pointer hover:shadow-lg transition-all duration-200 text-white hover:scale-[1.02]"
                    onClick={() => router.push(`/dealer/store/${store.id}`)}
                  >
                    <div className="relative">
                      <Image
                        src={store.banner[0] || store.logo || "/placeholder.svg?height=200&width=400"}
                        alt={store.name}
                        width={400}
                        height={200}
                        className="w-full h-32 sm:h-40 md:h-48 object-cover"
                      />
                      <button
                        className="absolute top-2 sm:top-4 right-2 sm:right-4 p-1.5 sm:p-2 rounded-full bg-white/80 hover:bg-white transition-colors"
                        onClick={(e) => {
                          e.stopPropagation()
                        }}
                      >
                        <Heart size={20} className="text-[#F91F1F]" />
                      </button>
                    </div>
                    <div className="p-3 sm:p-4">
                      <h3 className="font-semibold mb-2 sm:mb-3 line-clamp-1 text-sm sm:text-base">{store.name || "Unnamed Store"}</h3>
                      <div className="space-y-1.5 sm:space-y-2 mb-2 sm:mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-white font-medium min-w-[40px] sm:min-w-[45px]">Hours:</span>
                          <span className="text-xs sm:text-sm text-white font-medium">
                            {formatTime(store.opening_time)} - {formatTime(store.closing_time)}
                          </span>
                        </div>
                        {store.closing_days.length > 0 && store.closing_days[0] && (
                          <div className="flex items-start gap-2">
                            <span className="text-xs text-white font-medium min-w-[40px] sm:min-w-[45px] mt-0.5">Closed:</span>
                            <div className="flex flex-wrap gap-1">
                              {store.closing_days.map((day, index) => (
                                <span key={index} className="text-xs bg-red-50 text-red-600 px-1.5 sm:px-2 py-0.5 rounded">
                                  {day}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="relative group mb-3 sm:mb-4">
                        <p className="text-xs sm:text-sm text-white leading-4 sm:leading-5 h-8 sm:h-10 overflow-hidden">
                          {store.description || "No description available"}
                        </p>
                        {store.description && store.description.length > 80 && (
                          <div className="absolute bottom-full left-0 right-0 mb-2 p-2 sm:p-3 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20 pointer-events-none shadow-lg">
                            {store.description}
                            <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <Store size={16} className="text-[#F91F1F]" />
                          </div>
                          <div className="text-xs text-white truncate">
                            {new Date(store.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <button
                          className="text-xs bg-blue-50 text-[#F91F1F] px-2 sm:px-3 py-1 rounded-full whitespace-nowrap hover:bg-blue-100 transition-colors flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/dealer/store/${store.id}`)
                          }}
                        >
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl p-6 sm:p-8 text-center shadow-sm">
                <Store size={48} className="mx-auto text-gray-300 mb-3 sm:mb-4" />
                <h3 className="text-base sm:text-lg font-medium text-gray-800 mb-2">No Stores Found</h3>
                <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">You haven't created any stores yet.</p>
                <button
                  className="px-4 py-2 bg-[#F91F1F] text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                  onClick={() => setIsModalOpen(true)}
                >
                  Create Your First Store
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Mobile Overlay & Desktop Fixed */}
        <div className={`
          fixed lg:relative inset-0 lg:inset-auto z-40 lg:z-0
          ${sidebarOpen ? 'block' : 'hidden lg:block'}
          lg:w-80 lg:flex-shrink-0
        `}>
          {/* Mobile Overlay Background */}
          <div 
            className="fixed inset-0 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          
          {/* Sidebar Content */}
          <div className="absolute right-0 top-0 bottom-0 w-[85vw] max-w-sm lg:relative lg:w-full overflow-y-auto">
            <div className="bg-gradient-to-br from-[#A10A0C] to-[#3B0404] rounded-none lg:rounded-2xl p-4 sm:p-6 lg:sticky lg:top-6 min-h-screen lg:min-h-0">
              {/* Mobile Close Button */}
              <button
                className="lg:hidden absolute top-4 right-4 text-white p-2 hover:bg-white/10 rounded-full"
                onClick={() => setSidebarOpen(false)}
              >
                ✕
              </button>

              {/* Profile Section */}
              <div className="text-center mb-6 md:mb-8 pt-8 lg:pt-0">
                <div className="relative inline-block">
                  <div className="w-16 sm:w-20 h-16 sm:h-20 rounded-full bg-[#F5F1FF] flex items-center justify-center relative">
                    <img
                      src={user?.image || "/placeholder.svg?height=80&width=80"}
                      alt="Profile"
                      className="w-12 sm:w-16 h-12 sm:h-16 rounded-full object-cover"
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
                <h3 className="text-base sm:text-lg font-bold mt-3 sm:mt-4 mb-1 text-white">Welcome, {user?.name || "Dealer"} 👋</h3>
                <p className="text-xs sm:text-sm text-white px-4">Manage your stores and inventory from one place</p>
              </div>

              {/* Chart Section */}
              <div className="mb-6 md:mb-8 bg-gradient-to-br from-[#A10A0C] to-[#3B0404] p-3 sm:p-4 md:p-6 rounded-[20px] border border-white">
                <h3 className="font-semibold mb-3 sm:mb-4 text-white text-sm sm:text-base">Store Performance</h3>
                <ChartContainer
                  className="h-[140px] sm:h-[150px] md:h-[170px] w-full"
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
                      fontSize={9}
                      tickMargin={8}
                      tick={{ fill: "#ffffff", fontSize: 9 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      fontSize={9}
                      tickMargin={8}
                      tick={{ fill: "#ffffff", fontSize: 9 }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={40} fill="#FF6B1B" />
                  </BarChart>
                </ChartContainer>
              </div>

              {/* Mentors Section */}
              <div className="bg-gradient-to-br from-[#A10A0C] to-[#3B0404] p-3 sm:p-4 md:p-6 rounded-[20px] border border-white">
                <div className="flex justify-between items-center mb-4 sm:mb-6">
                  <h2 className="text-base sm:text-lg md:text-xl font-bold text-yellow-400">Your Mentor</h2>
                </div>
                <div className="space-y-3 sm:space-y-4">
                  {[
                    { icon: Store, name: "Padhang Satrio" },
                    { icon: Plus, name: "Zakir Horizontal" },
                    { icon: Mail, name: "Leonardo Samsul" },
                  ].map((mentor, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between w-full p-2 sm:p-3 bg-transparent rounded-lg hover:bg-red-600/30 transition-colors"
                    >
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <div className="relative flex-shrink-0">
                          <div className="w-9 sm:w-10 md:w-12 h-9 sm:h-10 md:h-12 bg-gray-300 rounded-full flex items-center justify-center">
                            <mentor.icon size={18} className="text-gray-600" />
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-3 md:w-4 h-3 md:h-4 bg-green-500 rounded-full border-2 border-white"></div>
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-white font-semibold text-xs sm:text-sm md:text-base truncate">{mentor.name}</span>
                          <span className="text-gray-300 text-xs">Mentor</span>
                        </div>
                      </div>
                      <button className="text-yellow-400 font-medium hover:text-yellow-300 transition-colors text-xs sm:text-sm flex-shrink-0">
                        Follow
                      </button>
                    </div>
                  ))}
                </div>
                <button className="w-full text-center text-white mt-4 sm:mt-6 py-2.5 sm:py-3 bg-transparent border border-white/30 rounded-xl text-xs sm:text-sm font-medium hover:bg-white/10 transition-colors">
                  See All
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}