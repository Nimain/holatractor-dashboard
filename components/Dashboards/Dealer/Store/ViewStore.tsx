"use client"

import { Search, Mail, Store, Heart, ChevronLeft, ChevronRight, Plus, MoreHorizontal } from "lucide-react"
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

export default function DealerDashboard() {
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

  // Format time from ISO string (e.g., "1970-01-01T23:35:00.000Z")
  const formatTime = (timeString: string) => {
    try {
      const date = new Date(timeString)
      return format(date, "h:mm a")
    } catch (error) {
      return "N/A"
    }
  }

  const lessons = [
    {
      mentor: {
        name: "Padhang Satrio",
        avatar: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQJkPZY_sSpXLHyqUr_6WAB4oXmauRcUvHISQ&s",
        date: "2/16/2004",
      },
      type: "UI/UX DESIGN",
      desc: "Understand Of UI/UX Design",
    },
  ]

  const chartData = [
    { name: "1-10 Aug", value: 30, fill: "#7C5CFC" },
    { name: "11-20 Aug", value: 45, fill: "#7C5CFC" },
    { name: "21-30 Aug", value: 60, fill: "#7C5CFC" },
    { name: "11-20 Aug", value: 45, fill: "#7C5CFC" },
    { name: "21-30 Aug", value: 60, fill: "#7C5CFC" },
  ]

  const mentors: Mentor[] = [
    { name: "Padhang Satrio", role: "Mentor", avatar: "/placeholder.svg?height=48&width=48", verified: true },
    { name: "Zakir Horizontal", role: "Mentor", avatar: "/placeholder.svg?height=48&width=48", verified: true },
    { name: "Leonardo Samsul", role: "Mentor", avatar: "/placeholder.svg?height=48&width=48", verified: true },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="flex justify-between items-center p-6 mb-8">
        <div className="relative w-1/3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search your store..."
            className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
          />
        </div>
        <div className="flex items-center gap-4">
          <button
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200"
            onClick={() => setIsModalOpen(true)}
          >
            <Store size={20} className="text-white" />
            Add Store
          </button>
          <AddStoreModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </div>
      </div>

      <div className="grid grid-cols-[1fr_400px]">
        {/* Left content */}
        <div className="p-6 bg-gray-50 min-h-screen">
          {/* Hero Section */}
          <div className="bg-[#7C5CFC] rounded-3xl p-8 mb-8 text-white relative overflow-hidden">
            <div className="absolute right-0 top-0 w-1/2 h-full opacity-20">
              <div className="absolute right-[-100px] top-1/2 transform -translate-y-1/2 w-[400px] h-[400px] border border-white/20 rounded-full" />
              <div className="absolute right-[-50px] top-1/2 transform -translate-y-1/2 w-[300px] h-[300px] border border-white/20 rounded-full" />
              <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-[200px] h-[200px] border border-white/20 rounded-full" />
            </div>
            <div className="text-sm uppercase tracking-wide mb-2">Dealer Dashboard</div>
            <h1 className="text-4xl font-bold mb-6 max-w-lg leading-tight">Manage Your Stores and Inventory</h1>
            <button className="bg-black hover:bg-black/90 text-white px-6 py-3 rounded-full flex items-center gap-2 text-sm transition-colors">
              View Analytics
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Store Progress */}
          <div className="flex gap-6 mb-8 overflow-x-auto pb-4 scrollbar-hide">
            <div className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm min-w-[240px]">
              <div className="p-3 bg-blue-50 rounded-xl">
                <div className="text-blue-600 font-medium">Total Stores</div>
              </div>
              <div className="text-sm text-gray-500">{stores.length}</div>
              <MoreHorizontal size={20} className="text-gray-400 ml-auto cursor-pointer" />
            </div>
            <div className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm min-w-[240px]">
              <div className="p-3 bg-green-50 rounded-xl">
                <div className="text-green-600 font-medium">Active</div>
              </div>
              <div className="text-sm text-gray-500">{stores.length}</div>
              <MoreHorizontal size={20} className="text-gray-400 ml-auto cursor-pointer" />
            </div>
            <div className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm min-w-[240px]">
              <div className="p-3 bg-purple-50 rounded-xl">
                <div className="text-purple-600 font-medium">Inventory</div>
              </div>
              <div className="text-sm text-gray-500">0 items</div>
              <MoreHorizontal size={20} className="text-gray-400 ml-auto cursor-pointer" />
            </div>
          </div>

          {/* All Stores Section */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">All Stores</h2>
              <div className="flex gap-2">
                <button className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
                  <ChevronLeft size={20} className="text-gray-600" />
                </button>
                <button className="p-2 rounded-full bg-[#7C5CFC] hover:bg-[#6B4FD9] text-white transition-colors">
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
              </div>
            ) : stores.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stores.map((store) => (
                  <div
                    key={store.id}
                    className="bg-white rounded-xl overflow-hidden shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => router.push(`/dealer/store/${store.id}`)}
                  >
                    <div className="relative">
                      <Image
                        src={store.banner[0] || store.logo || "/placeholder.svg?height=200&width=400"}
                        alt={store.name}
                        width={400}
                        height={200}
                        className="w-full h-48 object-cover"
                      />
                      <button className="absolute top-4 right-4 p-2 rounded-full bg-white/80 hover:bg-white transition-colors">
                        <Heart size={20} className="text-gray-600" />
                      </button>
                    </div>
                    <div className="p-4">
                      {/* Store Name */}
                      <h3 className="font-semibold mb-3 line-clamp-1 text-base">{store.name || "Unnamed Store"}</h3>
                      
                      {/* Time and Days in organized layout */}
                      <div className="space-y-2 mb-3">
                        {/* Opening Hours */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 font-medium min-w-[45px]">Hours:</span>
                          <span className="text-sm text-blue-600 font-medium">
                            {formatTime(store.opening_time)} - {formatTime(store.closing_time)}
                          </span>
                        </div>
                        
                        {/* Closing Days */}
                        {store.closing_days.length > 0 && store.closing_days[0] && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 font-medium min-w-[45px]">Closed:</span>
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
                      
                      {/* Description with hover - max 2 lines */}
                      <div className="relative group mb-4">
                        <p className="text-sm text-gray-600 leading-5 h-10 overflow-hidden">
                          {store.description || "No description available"}
                        </p>
                        
                        {/* Hover tooltip for full description */}
                        {store.description && store.description.length > 80 && (
                          <div className="absolute bottom-full left-0 right-0 mb-2 p-3 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20 pointer-events-none shadow-lg">
                            {store.description}
                            <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                            <Store size={16} className="text-gray-600" />
                          </div>
                          <div className="text-xs text-gray-500">
                            Created {new Date(store.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <button className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full">
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl p-8 text-center">
                <Store size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-800 mb-2">No Stores Found</h3>
                <p className="text-gray-500 mb-4">You haven't created any stores yet.</p>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg" onClick={() => setIsModalOpen(true)}>
                  Create Your First Store
                </button>
              </div>
            )}
          </div>

          {/* Your Lesson Section */}
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Recent Activity</h2>
              <button className="text-[#7C5CFC] text-sm font-medium">See all</button>
            </div>

            <div className="bg-white rounded-xl overflow-hidden">
              <div className="grid grid-cols-4 gap-4 p-4 text-sm text-gray-500 border-b">
                <div>USER</div>
                <div>TYPE</div>
                <div>DESC</div>
                <div>ACTION</div>
              </div>
              {lessons.map((lesson, index) => (
                <div key={index} className="grid grid-cols-4 gap-4 p-4 items-center">
                  <div className="flex items-center gap-3">
                    <Image
                      src={lesson.mentor.avatar || "/placeholder.svg"}
                      alt={lesson.mentor.name}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                    <div>
                      <div className="font-medium text-sm">{lesson.mentor.name}</div>
                      <div className="text-xs text-gray-500">{lesson.mentor.date}</div>
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-purple-50 text-purple-600 rounded-md w-fit text-sm">{lesson.type}</div>
                  <div className="text-sm">{lesson.desc}</div>
                  <div>
                    <button className="p-2 rounded-full bg-[#7C5CFC] text-white">
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right content */}
        <div className="p-6 bg-white w-[98%] rounded-2xl">
          <div className="text-center mb-8">
            <div className="relative inline-block">
              <div className="w-20 h-20 rounded-full bg-[#F5F1FF] flex items-center justify-center relative">
                <img
                  src={user?.image || "/placeholder.svg?height=80&width=80"}
                  alt="Profile"
                  className="w-16 h-16 rounded-full object-cover"
                />
                <svg className="absolute inset-0 w-full h-full rotate-[-90deg]">
                  <circle
                    cx="40"
                    cy="40"
                    r="38"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    className="text-[#F5F1FF]"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="38"
                    stroke="#7C5CFC"
                    strokeWidth="4"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 38 * 0.32} ${2 * Math.PI * 38 * (1 - 0.32)}`}
                    className="drop-shadow-[0_2px_4px_rgba(124,92,252,0.4)]"
                  />
                </svg>
                <span className="absolute -top-1 -right-1 bg-[#7C5CFC] text-white text-xs px-2 py-0.5 rounded-full shadow-lg">
                  {stores.length > 0 ? "Active" : "New"}
                </span>
              </div>
            </div>
            <h3 className="text-lg font-bold mt-4 mb-1">Welcome, {user?.name || "Dealer"} 👋</h3>
            <p className="text-sm text-gray-500">Manage your stores and inventory from one place</p>
          </div>

          <div className="mb-8 bg-[#F8F7FF] p-6 rounded-[20px]">
            <h3 className="font-semibold mb-4">Store Performance</h3>
            <ChartContainer
              className="h-[170px]"
              config={{
                value: {
                  color: "#7C5CFC",
                },
              }}
            >
              <BarChart data={chartData}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} tickMargin={8} />
                <YAxis axisLine={false} tickLine={false} fontSize={12} tickMargin={8} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ChartContainer>
          </div>

          <div className="bg-[#F8F7FF] p-6 rounded-[20px]">
            <div className="flex justify-between items-center mb-6">
              {/* <h2 className="text-xl font-bold">Quick Actions</h2> */}
              <button className="text-[#7C5CFC] hover:bg-white p-1 rounded-full transition-colors">
                <Plus size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center justify-between w-full p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <Store size={20} className="text-blue-600" />
                  </div>
                  <span>Add New Store</span>
                </div>
                <ChevronRight size={16} className="text-gray-400" />
              </button>

              <button className="flex items-center justify-between w-full p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-full">
                    <Plus size={20} className="text-green-600" />
                  </div>
                  <span>Add Inventory</span>
                </div>
                <ChevronRight size={16} className="text-gray-400" />
              </button>

              <button className="flex items-center justify-between w-full p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-full">
                    <Mail size={20} className="text-purple-600" />
                  </div>
                  <span>Messages</span>
                </div>
                <ChevronRight size={16} className="text-gray-400" />
              </button>
            </div>
            <button className="w-full text-center text-[#7C5CFC] mt-6 py-2.5 bg-[#F5F1FF] rounded-xl text-sm font-medium hover:bg-[#EBE5FF] transition-colors">
              View All Actions
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}