"use client"

import {
  Search,
  Store,
  Plus,
  Menu,
  RefreshCw,
  MapPin,
  Clock,
  Calendar,
  Tractor,
  Wrench,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  X,
  Building2,
  ExternalLink,
  ShieldCheck,
  Phone,
  Layers,
  Sparkles,
  Info,
  Users,
  TrendingUp,
  Mail,
  Check,
  Copy,
} from "lucide-react"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import Image from "next/image"
import { getSafeImageSrc, isValidImageSrc } from "@/utils/image/safeImage"
import AddStoreModal from "@/components/Dashboards/Dealer/_components/AddStoreModal"
import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
import { renderInstance } from "@/utils/Axios/RenderInstance"
import { getAuthToken, getAuthUser } from "@/utils/auth/clientAuth"
import { useCookie } from "next-cookie"
import { useDealerLanguage } from "@/context/DealerLanguageContext"

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

interface PerformanceSummary {
  totalStores?: number
  totalLeads?: number
  recentLeads?: number
  overallPerformanceScore?: string
  growthRate?: string
  topPerformingStore?: string
}

interface PerformancePoint {
  name: string
  value: number
  leads?: number
  inventory?: number
  fill?: string
}

interface DealerMember {
  id: string
  user_id?: string
  status?: number
  createdAt?: string
  user?: {
    id?: string
    first_name?: string
    middle_name?: string
    last_name?: string
    email?: string
    image?: string
    mobile?: string
    gender?: string
  }
}

export default function ResponsiveDealerDashboard() {
  const { t } = useDealerLanguage()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [stores, setStores] = useState<StoreData[]>([])
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()
  const { cookie } = useCookie()

  // Dynamic Store Performance State
  const [performanceData, setPerformanceData] = useState<{
    summary: PerformanceSummary
    chartData: PerformancePoint[]
    intervalData: PerformancePoint[]
  }>({
    summary: {
      totalStores: 0,
      totalLeads: 0,
      recentLeads: 0,
      overallPerformanceScore: "0%",
      growthRate: "0%",
      topPerformingStore: "",
    },
    chartData: [
      { name: "May", value: 45, leads: 18, inventory: 27, fill: "#A10A0C" },
      { name: "Jun", value: 60, leads: 24, inventory: 36, fill: "#A10A0C" },
      { name: "Jul", value: 52, leads: 20, inventory: 32, fill: "#A10A0C" },
      { name: "Aug", value: 70, leads: 28, inventory: 42, fill: "#A10A0C" },
      { name: "Sep", value: 65, leads: 26, inventory: 39, fill: "#A10A0C" },
      { name: "Oct", value: 85, leads: 34, inventory: 51, fill: "#A10A0C" },
    ],
    intervalData: [
      { name: "1-10 Aug", value: 38, fill: "#A10A0C" },
      { name: "11-20 Aug", value: 50, fill: "#A10A0C" },
      { name: "21-30 Aug", value: 65, fill: "#A10A0C" },
      { name: "1-10 Sep", value: 58, fill: "#A10A0C" },
      { name: "11-20 Sep", value: 75, fill: "#A10A0C" },
      { name: "21-30 Sep", value: 88, fill: "#A10A0C" },
    ],
  })
  const [loadingPerformance, setLoadingPerformance] = useState(false)
  const [performanceTimeframe, setPerformanceTimeframe] = useState<"monthly" | "intervals">("intervals")

  // Dynamic Dealer Network State
  const [dealers, setDealers] = useState<DealerMember[]>([])
  const [loadingDealers, setLoadingDealers] = useState(false)
  const [isDealerNetworkModalOpen, setIsDealerNetworkModalOpen] = useState(false)
  const [dealerNetworkSearch, setDealerNetworkSearch] = useState("")
  const [copiedDealerEmail, setCopiedDealerEmail] = useState<string | null>(null)

  const rawCookieUser = cookie?.get ? cookie.get("user") : null
  const cookieUser = useMemo(() => {
    try {
      return typeof rawCookieUser === "string" ? JSON.parse(rawCookieUser) : rawCookieUser
    } catch {
      return null
    }
  }, [rawCookieUser])

  const access_token = cookie?.get ? cookie.get("access_token") : null
  const authUser = getAuthUser()
  const displayUser = cookieUser || authUser

  const targetDealerId = useMemo(() => {
    return (
      cookieUser?.dealer_id ||
      cookieUser?.dealerId ||
      (authUser as any)?.dealer_id ||
      (typeof window !== "undefined" ? localStorage.getItem("dealer_id") : null) ||
      ""
    )
  }, [cookieUser?.dealer_id, cookieUser?.dealerId, (authUser as any)?.dealer_id])

  const targetUserId = useMemo(() => {
    return (
      cookieUser?.userId ||
      cookieUser?.id ||
      authUser?.userId ||
      authUser?.id ||
      (typeof window !== "undefined" ? (localStorage.getItem("userId") || localStorage.getItem("id")) : null) ||
      ""
    )
  }, [cookieUser?.userId, cookieUser?.id, authUser?.userId, authUser?.id])

  const targetUid = targetDealerId || targetUserId

  // Fetch stores directly from FastAPI (b2bholatractor)
  const fetchStores = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    setIsRefreshing(true)

    const token = getAuthToken() || access_token
    const reqHeaders = token ? { Authorization: `Bearer ${token}` } : {}

    try {
      if (targetUid) {
        const renderRes = await renderInstance.get(
          `/dealer/all-stores/${encodeURIComponent(targetUid)}`,
          { headers: reqHeaders }
        )
        if (renderRes.status === 200 && Array.isArray(renderRes.data)) {
          setStores(renderRes.data)
          return
        }
      }
      setStores([])
    } catch (error) {
      console.error("FastAPI error fetching stores:", error)
      setStores([])
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [targetUid, access_token])

  // Fetch Store Performance Data directly from FastAPI (b2bholatractor)
  const fetchPerformanceData = useCallback(async () => {
    setLoadingPerformance(true)
    try {
      const res = await renderInstance.get(
        `/dealer/store/performance?dealer_id=${encodeURIComponent(targetDealerId || targetUid)}`
      )
      if (res.data?.success) {
        setPerformanceData({
          summary: res.data.summary || {},
          chartData: res.data.chartData || [],
          intervalData: res.data.intervalData || [],
        })
      }
    } catch (perfErr) {
      console.warn("FastAPI store performance fetch notice:", perfErr)
    } finally {
      setLoadingPerformance(false)
    }
  }, [targetDealerId, targetUid])

  // Fetch Dealer Network dynamically from FastAPI (b2bholatractor)
  const fetchDealers = useCallback(async () => {
    setLoadingDealers(true)
    try {
      const fastRes = await renderInstance.get("/dealer/all")
      if (Array.isArray(fastRes.data)) {
        setDealers(fastRes.data)
      }
    } catch (err) {
      console.error("FastAPI error fetching dealers:", err)
    } finally {
      setLoadingDealers(false)
    }
  }, [])

  useEffect(() => {
    fetchStores()
    fetchPerformanceData()
    fetchDealers()
  }, [fetchStores, fetchPerformanceData, fetchDealers])

  // Window focus auto-refresh (stable callback)
  useEffect(() => {
    const handleFocus = () => {
      fetchStores(true)
      fetchPerformanceData()
    }
    window.addEventListener("focus", handleFocus)
    return () => window.removeEventListener("focus", handleFocus)
  }, [fetchStores, fetchPerformanceData])

  const formatTime = (timeString: string) => {
    try {
      const date = new Date(timeString)
      if (isNaN(date.getTime())) {
        return timeString || "08:00 AM"
      }
      const hours = date.getHours()
      const minutes = date.getMinutes()
      const ampm = hours >= 12 ? "PM" : "AM"
      const displayHours = hours % 12 || 12
      const displayMinutes = minutes < 10 ? "0" + minutes : minutes
      return `${displayHours}:${displayMinutes} ${ampm}`
    } catch {
      return "08:00 AM"
    }
  }

  // Real dynamic aggregates
  const totalStores = stores.length
  const totalTractors = useMemo(() => {
    return stores.reduce((acc, s) => {
      const tInStore = Array.isArray(s.TractorInDealerStore) ? s.TractorInDealerStore.length : 0
      const sellT = Array.isArray(s.SellTractor) ? s.SellTractor.length : 0
      return acc + tInStore + sellT
    }, 0)
  }, [stores])

  const totalAttachments = useMemo(() => {
    return stores.reduce((acc, s) => {
      return acc + (Array.isArray(s.AttachmentInDealerStore) ? s.AttachmentInDealerStore.length : 0)
    }, 0)
  }, [stores])

  const uniqueCitiesCount = useMemo(() => {
    const cities = stores
      .map((s) => s.location?.city || s.location?.state)
      .filter(Boolean)
    return new Set(cities).size
  }, [stores])

  const filteredStores = useMemo(() => {
    if (!searchQuery.trim()) return stores
    const q = searchQuery.toLowerCase().trim()
    return stores.filter((store) => {
      const name = (store.name || "").toLowerCase()
      const desc = (store.description || "").toLowerCase()
      const city = (store.location?.city || "").toLowerCase()
      const state = (store.location?.state || "").toLowerCase()
      const address = (store.location?.address || "").toLowerCase()
      const country = (store.location?.country || "").toLowerCase()
      return (
        name.includes(q) ||
        desc.includes(q) ||
        city.includes(q) ||
        state.includes(q) ||
        address.includes(q) ||
        country.includes(q)
      )
    })
  }, [stores, searchQuery])

  // Filtered dealers for the modal
  const filteredModalDealers = useMemo(() => {
    if (!dealerNetworkSearch.trim()) return dealers
    const q = dealerNetworkSearch.toLowerCase().trim()
    return dealers.filter((d) => {
      const first = (d.user?.first_name || "").toLowerCase()
      const last = (d.user?.last_name || "").toLowerCase()
      const email = (d.user?.email || "").toLowerCase()
      const mobile = (d.user?.mobile || "").toLowerCase()
      return first.includes(q) || last.includes(q) || email.includes(q) || mobile.includes(q)
    })
  }, [dealers, dealerNetworkSearch])

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Top Header Navigation */}
      <div className="bg-white border-b border-slate-200/90 sticky top-0 z-30 shadow-xs">
        <div className="container mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400" size={17} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search stores by branch name, city, state, or address..."
              className="w-full pl-10 pr-9 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#A10A0C]/20 focus:border-[#A10A0C] bg-white transition-all shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
                title="Clear search"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 sm:gap-3 justify-end">
            <button
              type="button"
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors flex items-center gap-2 text-xs font-semibold shadow-xs"
              onClick={() => {
                fetchStores(false)
                fetchPerformanceData()
                fetchDealers()
              }}
              title="Refresh store network and performance"
              disabled={isRefreshing || loadingPerformance}
            >
              <RefreshCw size={14} className={`text-slate-600 ${isRefreshing ? "animate-spin text-[#A10A0C]" : ""}`} />
              <span className="hidden sm:inline">Sync Fleet</span>
            </button>

            <button
              className="lg:hidden p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              title="Toggle sidebar"
            >
              <Menu size={18} />
            </button>

            <button
              className="flex items-center justify-center gap-2 px-4 py-2 bg-[#A10A0C] hover:bg-[#85080A] text-white rounded-xl shadow-xs transition-colors duration-200 text-xs font-semibold"
              onClick={() => setIsModalOpen(true)}
            >
              <Plus size={16} />
              <span>Add New Store</span>
            </button>
          </div>
        </div>
      </div>

      <AddStoreModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onStoreCreated={(newStore) => {
          if (newStore && newStore.id) {
            setStores((prev) => {
              const withoutDup = prev.filter((s) => s.id !== newStore.id)
              return [newStore, ...withoutDup]
            })
          }
          fetchStores(true)
          fetchPerformanceData()
        }}
      />

      {/* Main Container */}
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 items-start">
          {/* Main Content Area */}
          <div className="flex-1 min-w-0 space-y-6 sm:space-y-8 w-full">
            {/* Executive Dealership Hero Banner */}
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-slate-950 via-slate-900 to-[#4A0506] text-white border border-slate-800 shadow-md">
              <div className="absolute inset-0 opacity-15 pointer-events-none">
                <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full border-2 border-white/20" />
                <div className="absolute right-20 top-20 w-52 h-52 rounded-full border border-white/10" />
                <div className="absolute right-40 -bottom-10 w-64 h-64 rounded-full bg-red-600/20 blur-3xl" />
              </div>

              <div className="relative z-10 p-6 sm:p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-3 max-w-2xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-semibold tracking-wide text-red-200 backdrop-blur-sm">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    HolaTractor Dealership Network
                  </div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
                    Manage Dealership Locations & Fleets
                  </h1>
                  <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                    Coordinate your branch showrooms, allocate tractor models and attachments to individual stores, and monitor operating schedules across all territories.
                  </p>
                </div>

                <div className="flex flex-row md:flex-col gap-3 w-full md:w-auto flex-shrink-0">
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex-1 md:flex-none px-5 py-3 rounded-xl bg-white hover:bg-slate-100 text-[#A10A0C] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg"
                  >
                    <Plus size={16} />
                    <span>Create Branch</span>
                  </button>
                  <button
                    onClick={() => {
                      fetchStores(false)
                      fetchPerformanceData()
                      fetchDealers()
                    }}
                    className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium text-xs flex items-center justify-center gap-2 transition-all backdrop-blur-sm"
                  >
                    <RefreshCw size={13} className={isRefreshing ? "animate-spin" : ""} />
                    <span>Sync Fleet</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 4-Card Metric Strip */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Stores</span>
                  <div className="w-8 h-8 rounded-xl bg-red-50 text-[#A10A0C] flex items-center justify-center">
                    <Store size={16} />
                  </div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{totalStores}</div>
                  <p className="text-xs text-slate-500 mt-1">Active Dealership Showrooms</p>
                </div>
              </div>

              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tractors in Fleet</span>
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                    <Tractor size={16} />
                  </div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{totalTractors}</div>
                  <p className="text-xs text-slate-500 mt-1">Assigned Across Stores</p>
                </div>
              </div>

              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Attachments</span>
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                    <Wrench size={16} />
                  </div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{totalAttachments}</div>
                  <p className="text-xs text-slate-500 mt-1">Plows, Harvesters & Tools</p>
                </div>
              </div>

              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Territories</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <MapPin size={16} />
                  </div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{uniqueCitiesCount || (totalStores > 0 ? 1 : 0)}</div>
                  <p className="text-xs text-slate-500 mt-1">Regional Service Hubs</p>
                </div>
              </div>
            </div>

            {/* All Dealership Stores Grid */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                    <span>Dealership Branches</span>
                    <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full border border-slate-200">
                      {filteredStores.length} {filteredStores.length === 1 ? "store" : "stores"}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">Click any store card to manage its tractors, attachments, and operating schedule.</p>
                </div>

                {searchQuery && (
                  <span className="text-xs text-slate-500">
                    Showing results for &ldquo;{searchQuery}&rdquo;
                  </span>
                )}
              </div>

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs animate-pulse space-y-4">
                      <div className="h-40 bg-slate-200 rounded-xl w-full" />
                      <div className="h-5 bg-slate-200 rounded w-2/3" />
                      <div className="h-4 bg-slate-100 rounded w-1/2" />
                      <div className="h-10 bg-slate-100 rounded-xl w-full" />
                    </div>
                  ))}
                </div>
              ) : filteredStores.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
                  {filteredStores.map((store) => {
                    const tractorsCount =
                      (Array.isArray(store.TractorInDealerStore) ? store.TractorInDealerStore.length : 0) +
                      (Array.isArray(store.SellTractor) ? store.SellTractor.length : 0)
                    const attachmentsCount = Array.isArray(store.AttachmentInDealerStore)
                      ? store.AttachmentInDealerStore.length
                      : 0

                    const locationText = [
                      store.location?.city,
                      store.location?.state,
                      store.location?.country,
                    ]
                      .filter(Boolean)
                      .join(", ") || store.location?.address || "Location on record"

                    const coverImage = getSafeImageSrc(
                      store.banner?.[0] || store.logo,
                      "https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?w=800&q=80"
                    )

                    return (
                      <div
                        key={store.id}
                        onClick={() => router.push(`/dealer/store/${store.id}`)}
                        className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs hover:shadow-lg transition-all duration-200 hover:-translate-y-1 group flex flex-col cursor-pointer"
                      >
                        {/* Store Cover Image */}
                        <div className="relative h-44 sm:h-48 w-full bg-slate-100 overflow-hidden">
                          <Image
                            src={coverImage}
                            alt={store.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          {/* Top Gradient */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />

                          {/* Floating Status Pill */}
                          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-emerald-800 text-[11px] font-semibold shadow-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Active Branch</span>
                          </div>

                          {/* Operating Hours Pill */}
                          <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-medium">
                            <Clock size={12} className="text-white/80" />
                            <span>
                              {formatTime(store.opening_time)} - {formatTime(store.closing_time)}
                            </span>
                          </div>

                          {/* Logo avatar positioned bottom left */}
                          <div className="absolute -bottom-3 left-4 w-12 h-12 rounded-xl bg-white p-0.5 shadow-md ring-2 ring-white overflow-hidden flex items-center justify-center">
                            {isValidImageSrc(store.logo) ? (
                              <Image
                                src={getSafeImageSrc(store.logo)}
                                alt={store.name}
                                width={48}
                                height={48}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              <Building2 size={24} className="text-[#A10A0C]" />
                            )}
                          </div>
                        </div>

                        {/* Card Body */}
                        <div className="p-5 pt-6 flex-1 flex flex-col justify-between space-y-4">
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-bold text-base sm:text-lg text-slate-900 group-hover:text-[#A10A0C] transition-colors line-clamp-1">
                                {store.name || "Unnamed Dealership Store"}
                              </h3>
                            </div>

                            {/* Location */}
                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                              <MapPin size={13} className="text-[#A10A0C] flex-shrink-0" />
                              <span className="truncate">{locationText}</span>
                            </div>

                            {/* Description snippet */}
                            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                              {store.description || "Full-service agricultural equipment showroom and parts dealership."}
                            </p>
                          </div>

                          {/* Inventory Chips */}
                          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 text-xs font-semibold">
                              <Tractor size={13} className="text-amber-600" />
                              <span>{tractorsCount} Tractors</span>
                            </div>
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 text-xs font-semibold">
                              <Wrench size={13} className="text-blue-600" />
                              <span>{attachmentsCount} Attachments</span>
                            </div>
                            {store.closing_days && store.closing_days.length > 0 && store.closing_days[0] && (
                              <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-red-50 text-red-700 text-xs font-medium">
                                <span>Closed: {store.closing_days.join(", ")}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Card Footer */}
                        <div className="px-5 py-3.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[11px] text-slate-400">
                            Created {new Date(store.createdAt || Date.now()).toLocaleDateString(undefined, { month: "short", year: "numeric" })}
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-[#A10A0C] group-hover:translate-x-0.5 transition-transform">
                            Manage Store
                            <ArrowRight size={13} />
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : stores.length > 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center shadow-xs">
                  <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-slate-400">
                    <Search size={26} />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-1">No Matching Stores</h3>
                  <p className="text-xs sm:text-sm text-slate-500 mb-4 max-w-sm mx-auto">
                    No dealership stores match your query &ldquo;{searchQuery}&rdquo;. Try another term or clear the filter.
                  </p>
                  <button
                    onClick={() => setSearchQuery("")}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                  >
                    Clear Filter
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center shadow-xs">
                  <div className="w-16 h-16 bg-red-50 text-[#A10A0C] rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Store size={32} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">No Dealership Stores Found</h3>
                  <p className="text-xs sm:text-sm text-slate-500 mb-6 max-w-md mx-auto">
                    You haven&apos;t added any store branches yet. Create your first showroom to start listing tractors, assigning equipment, and receiving customer leads.
                  </p>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-5 py-2.5 bg-[#A10A0C] hover:bg-[#85080A] text-white rounded-xl text-xs font-bold transition-all shadow-sm inline-flex items-center gap-2"
                  >
                    <Plus size={16} />
                    <span>Create Your First Store</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar - Dealership Operations Hub */}
          <div
            className={`
              fixed lg:relative inset-0 lg:inset-auto z-40 lg:z-0
              ${sidebarOpen ? "block" : "hidden lg:block"}
              lg:w-80 lg:flex-shrink-0
            `}
          >
            {/* Mobile Backdrop */}
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-xs lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />

            {/* Sidebar Content */}
            <div className="absolute right-0 top-0 bottom-0 w-[85vw] max-w-sm lg:relative lg:w-full overflow-y-auto">
              <div className="bg-white border border-slate-200/90 rounded-none lg:rounded-2xl p-5 sm:p-6 lg:sticky lg:top-20 space-y-6 shadow-xs min-h-screen lg:min-h-0">
                {/* Mobile Close Button */}
                <button
                  className="lg:hidden absolute top-4 right-4 text-slate-500 p-1.5 hover:bg-slate-100 rounded-full"
                  onClick={() => setSidebarOpen(false)}
                >
                  <X size={18} />
                </button>

                {/* Dealer Profile Card */}
                <div className="text-center pb-5 border-b border-slate-100 pt-6 lg:pt-0">
                  <div className="relative inline-block mx-auto mb-3">
                    <div className="w-20 h-20 rounded-2xl ring-4 ring-slate-100 bg-slate-50 overflow-hidden flex items-center justify-center mx-auto shadow-xs">
                      {isValidImageSrc(displayUser?.image) ? (
                        <Image
                          src={getSafeImageSrc(displayUser.image)}
                          alt="Dealer avatar"
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Building2 size={36} className="text-[#A10A0C]" />
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center border-2 border-white shadow-xs">
                      <ShieldCheck size={14} />
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 line-clamp-1">
                    {displayUser?.name || "Dealership Partner"}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{displayUser?.email || "dealer@holatractor.com"}</p>
                  <div className="inline-flex items-center gap-1 mt-2.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-semibold">
                    <CheckCircle2 size={12} className="text-emerald-600" />
                    <span>Verified Dealership</span>
                  </div>
                </div>

                {/* Dynamic Store Performance Chart Section */}
                <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <TrendingUp size={15} className="text-[#A10A0C]" />
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                          {t("storePerformance")}
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">Live showroom activity & demand</p>
                    </div>

                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      {performanceData.summary.growthRate || "+18.5%"}
                    </span>
                  </div>

                  {/* Toggle view: 10-Day Cycles vs Monthly */}
                  <div className="flex items-center justify-between gap-1 bg-slate-200/60 p-0.5 rounded-lg text-[11px]">
                    <button
                      type="button"
                      onClick={() => setPerformanceTimeframe("intervals")}
                      className={`flex-1 py-1 px-2 rounded-md font-semibold transition-all ${
                        performanceTimeframe === "intervals"
                          ? "bg-white text-slate-900 shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      10-Day Cycles
                    </button>
                    <button
                      type="button"
                      onClick={() => setPerformanceTimeframe("monthly")}
                      className={`flex-1 py-1 px-2 rounded-md font-semibold transition-all ${
                        performanceTimeframe === "monthly"
                          ? "bg-white text-slate-900 shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Monthly Trend
                    </button>
                  </div>

                  {/* Chart Container */}
                  <div className="h-36 sm:h-40 w-full pt-1">
                    {loadingPerformance ? (
                      <div className="h-full w-full flex items-center justify-center">
                        <RefreshCw size={18} className="animate-spin text-[#A10A0C]" />
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={
                            performanceTimeframe === "intervals"
                              ? performanceData.intervalData
                              : performanceData.chartData
                          }
                          margin={{ top: 8, right: 4, left: -26, bottom: 0 }}
                        >
                          <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            fontSize={10}
                            tickMargin={6}
                            tick={{ fill: "#64748B" }}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            fontSize={10}
                            tickMargin={4}
                            tick={{ fill: "#64748B" }}
                          />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload
                                return (
                                  <div className="bg-slate-900 text-white text-[11px] p-2 rounded-lg shadow-lg border border-slate-700">
                                    <p className="font-bold text-amber-300">{data.name}</p>
                                    <p className="text-slate-200">Activity Index: <span className="font-semibold text-white">{data.value}</span></p>
                                    {data.leads !== undefined && (
                                      <p className="text-slate-300">Inquiries: <span className="font-semibold text-emerald-400">{data.leads}</span></p>
                                    )}
                                  </div>
                                )
                              }
                              return null
                            }}
                          />
                          <Bar
                            dataKey="value"
                            radius={[5, 5, 0, 0]}
                            maxBarSize={28}
                            fill="#A10A0C"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>

                  {/* Performance Footer Highlight */}
                  <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Top Showroom:</span>
                    <span className="font-bold text-slate-800 truncate max-w-[150px]">
                      {performanceData.summary.topPerformingStore || "Central Showroom"}
                    </span>
                  </div>
                </div>

                {/* Dynamic Dealer Network Section (Updated from Your Mentor) */}
                <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Users size={15} className="text-[#A10A0C]" />
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        {t("dealerNetwork") || "Dealer Network"}
                      </h4>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                      {dealers.length > 0 ? `${dealers.length} Active` : "Network"}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500">
                    Connect and collaborate with authorized regional dealers and branch operators.
                  </p>

                  {/* Top 3 Dealers */}
                  <div className="space-y-2.5">
                    {loadingDealers ? (
                      <div className="py-6 flex items-center justify-center">
                        <RefreshCw size={16} className="animate-spin text-[#A10A0C]" />
                      </div>
                    ) : dealers.length > 0 ? (
                      dealers.slice(0, 3).map((d) => {
                        const u = d.user || {}
                        const fullName = `${u.first_name || "Dealer"} ${u.last_name || ""}`.trim()
                        const initial = (u.first_name?.[0] || u.last_name?.[0] || "D").toUpperCase()
                        const email = u.email || "dealer@holatractor.com"
                        const isCopied = copiedDealerEmail === email

                        return (
                          <div
                            key={d.id}
                            className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200/80 hover:border-slate-300 transition-all shadow-2xs group"
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <div className="relative flex-shrink-0">
                                <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center font-bold text-xs text-[#A10A0C]">
                                  {u.image && !u.image.includes("placeholder") && !u.image.includes("Imagelink") ? (
                                    <img src={u.image} alt={fullName} className="w-full h-full object-cover" />
                                  ) : (
                                    <span>{initial}</span>
                                  )}
                                </div>
                                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
                              </div>

                              <div className="flex flex-col min-w-0">
                                <span className="text-xs font-bold text-slate-900 truncate group-hover:text-[#A10A0C] transition-colors">
                                  {fullName}
                                </span>
                                <span className="text-[10px] text-slate-400 truncate">{email}</span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                if (typeof navigator !== "undefined" && navigator.clipboard) {
                                  navigator.clipboard.writeText(email)
                                  setCopiedDealerEmail(email)
                                  setTimeout(() => setCopiedDealerEmail(null), 2000)
                                }
                              }}
                              className="text-xs font-semibold text-[#A10A0C] hover:bg-red-50 px-2 py-1 rounded-lg transition-colors flex-shrink-0 flex items-center gap-1"
                              title={`Copy contact email for ${fullName}`}
                            >
                              {isCopied ? (
                                <>
                                  <Check size={12} className="text-emerald-600" />
                                  <span className="text-emerald-600 text-[10px]">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Mail size={12} />
                                  <span className="text-[11px]">{t("connect") || "Connect"}</span>
                                </>
                              )}
                            </button>
                          </div>
                        )
                      })
                    ) : (
                      <div className="text-center py-4 text-xs text-slate-400">
                        No other dealers registered yet
                      </div>
                    )}
                  </div>

                  {/* See All Button */}
                  <button
                    type="button"
                    onClick={() => setIsDealerNetworkModalOpen(true)}
                    className="w-full text-center text-xs font-bold text-slate-700 hover:text-slate-900 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors shadow-2xs flex items-center justify-center gap-1.5"
                  >
                    <span>{t("seeAll")} ({dealers.length} Dealers)</span>
                    <ChevronRight size={14} />
                  </button>
                </div>

                {/* Fleet Allocation Summary */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Fleet Allocation</h4>
                    <span className="text-[11px] font-semibold text-slate-400">{totalTractors + totalAttachments} total items</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="flex items-center gap-1.5 text-slate-700">
                        <Tractor size={14} className="text-amber-600" /> Tractors
                      </span>
                      <span className="font-bold text-slate-900">{totalTractors}</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all duration-500"
                        style={{
                          width: `${
                            totalTractors + totalAttachments > 0
                              ? Math.round((totalTractors / (totalTractors + totalAttachments)) * 100)
                              : 50
                          }%`,
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs font-medium pt-1">
                      <span className="flex items-center gap-1.5 text-slate-700">
                        <Wrench size={14} className="text-blue-600" /> Attachments
                      </span>
                      <span className="font-bold text-slate-900">{totalAttachments}</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-500"
                        style={{
                          width: `${
                            totalTractors + totalAttachments > 0
                              ? Math.round((totalAttachments / (totalTractors + totalAttachments)) * 100)
                              : 50
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Quick Dealer Operations */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Dealership Actions</h4>

                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all text-left flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-red-50 text-[#A10A0C] flex items-center justify-center">
                        <Plus size={16} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800">Add New Branch</div>
                        <div className="text-[11px] text-slate-500">Register location & hours</div>
                      </div>
                    </div>
                    <ChevronRight size={15} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
                  </button>

                  <button
                    onClick={() => {
                      fetchStores(false)
                      fetchPerformanceData()
                      fetchDealers()
                    }}
                    className="w-full p-2.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all text-left flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                        <RefreshCw size={14} className={isRefreshing ? "animate-spin text-[#A10A0C]" : ""} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800">Sync All Showrooms</div>
                        <div className="text-[11px] text-slate-500">Live inventory pull</div>
                      </div>
                    </div>
                    <ChevronRight size={15} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
                  </button>

                  <button
                    onClick={() => router.push("/dealer/leads/sells")}
                    className="w-full p-2.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all text-left flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                        <Layers size={15} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800">Sales & Lease Leads</div>
                        <div className="text-[11px] text-slate-500">Inbound buyer demand</div>
                      </div>
                    </div>
                    <ChevronRight size={15} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
                  </button>
                </div>

                {/* Dealer Support Card */}
                <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <Info size={14} className="text-[#A10A0C]" />
                    <span>Dealer Support</span>
                  </div>
                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    Need assistance adding custom equipment or regional franchise branches? Contact HolaTractor Dealer Operations.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full Dealer Network Modal */}
      <Dialog open={isDealerNetworkModalOpen} onOpenChange={setIsDealerNetworkModalOpen}>
        <DialogContent className="sm:max-w-[650px] max-h-[85vh] overflow-hidden flex flex-col bg-white text-slate-900 border border-slate-200 rounded-2xl shadow-2xl p-0">
          <DialogHeader className="p-6 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-[#A10A0C] flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg sm:text-xl font-extrabold text-slate-900">
                  HolaTractor Dealer Network
                </DialogTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Authorized regional dealership partners, branch operators, and representatives.
                </p>
              </div>
            </div>
          </DialogHeader>

          {/* Search Bar in Modal */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/70">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
              <input
                type="text"
                value={dealerNetworkSearch}
                onChange={(e) => setDealerNetworkSearch(e.target.value)}
                placeholder="Search dealers by name, email, or contact..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-[#A10A0C] focus:border-[#A10A0C]"
              />
            </div>
          </div>

          {/* Dealer Network List */}
          <div className="p-6 overflow-y-auto max-h-[55vh] space-y-3">
            {filteredModalDealers.length > 0 ? (
              filteredModalDealers.map((d) => {
                const u = d.user || {}
                const fullName = `${u.first_name || "Dealer"} ${u.last_name || ""}`.trim()
                const initial = (u.first_name?.[0] || u.last_name?.[0] || "D").toUpperCase()
                const email = u.email || "dealer@holatractor.com"
                const mobile = u.mobile || "Available on request"
                const isCopied = copiedDealerEmail === email

                return (
                  <div
                    key={d.id}
                    className="flex items-center justify-between p-3.5 bg-slate-50/70 hover:bg-slate-100/70 rounded-xl border border-slate-200/80 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="relative flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-white border border-slate-200 overflow-hidden flex items-center justify-center font-bold text-sm text-[#A10A0C] shadow-2xs">
                          {u.image && !u.image.includes("placeholder") && !u.image.includes("Imagelink") ? (
                            <img src={u.image} alt={fullName} className="w-full h-full object-cover" />
                          ) : (
                            <span>{initial}</span>
                          )}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
                      </div>

                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {fullName}
                          </span>
                          <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 rounded-full">
                            Active
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                          <span className="truncate">{email}</span>
                          {mobile && mobile !== "Available on request" && (
                            <span className="text-slate-400 hidden sm:inline">• {mobile}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (typeof navigator !== "undefined" && navigator.clipboard) {
                          navigator.clipboard.writeText(email)
                          setCopiedDealerEmail(email)
                          setTimeout(() => setCopiedDealerEmail(null), 2000)
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs flex-shrink-0"
                    >
                      {isCopied ? (
                        <>
                          <Check size={13} className="text-emerald-600" />
                          <span className="text-emerald-600 text-xs">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy size={13} className="text-slate-500" />
                          <span>Copy Email</span>
                        </>
                      )}
                    </button>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-10 text-slate-400 text-xs">
                No dealers found matching &ldquo;{dealerNetworkSearch}&rdquo;
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}