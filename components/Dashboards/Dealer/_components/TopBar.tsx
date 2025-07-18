"use client"

import { useCookie } from "next-cookie"
import { useRouter } from "next/navigation"
import { LogOut, User, Bell, Search, Settings, ChevronDown } from "lucide-react"
import { successMessage } from "@/utils/Toastify/Messages"
import { useState, useEffect } from "react"

const TopBar = () => {
  const { cookie } = useCookie()
  const router = useRouter()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [notifications] = useState(3)

  // Get user info from cookie
  const userCookie = cookie.get("user")
  let user = null

  try {
    if (userCookie) {
      user = typeof userCookie === 'string' ? JSON.parse(userCookie) : userCookie
    }
  } catch (error) {
    console.error("Error parsing user cookie:", error)
    user = null
  }

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const handleLogout = () => {
    try {
      // Clear all authentication cookies
      cookie.remove("access_token", { path: "/" })
      cookie.remove("user", { path: "/" })
      cookie.remove("isFarmer", { path: "/" })
      cookie.remove("isOperator", { path: "/" })
      cookie.remove("isOwner", { path: "/" })
      cookie.remove("isDealer", { path: "/" })
      cookie.remove("isAgent", { path: "/" })

      // Clear localStorage debug logs if they exist
      if (typeof window !== 'undefined') {
        localStorage.removeItem("cookieDebugLog")
        localStorage.removeItem("redirectDebugLog")
        localStorage.removeItem("loginDebugLog")
        localStorage.removeItem("googleLoginDebugLog")
        localStorage.removeItem("errorDebugLog")
        localStorage.removeItem("googleErrorDebugLog")
      }

      successMessage("Logged out successfully")
      router.push("/login")
    } catch (error) {
      console.error("Logout error:", error)
      router.push("/login")
    }
  }

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="bg-[#A80000] border-b border-gray-200 px-6 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        {/* Left Section - Title and Time */}
        <div className="flex items-center space-x-8">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Dealer Dashboard
            </h1>
          </div>

          <div className="hidden md:flex items-center space-x-2 px-4 py-2 bg-gray-50 rounded-lg">
            <div className="text-sm text-[#F91F1F]">
              <div className="font-medium">{formatTime(currentTime)}</div>
              <div className="text-xs text-[#F91F1F]">{formatDate(currentTime)}</div>
            </div>
          </div>
        </div>

        {/* Center Section - Search Bar */}
        <div className="flex-1 max-w-md mx-8">
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              className="w-full px-4 py-2 pl-10 bg-gray-50 border border-gray-200 rounded-lg text-[#F91F1F] placeholder-[#A80000] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#F91F1F]" size={18} />
          </div>
        </div>

        {/* Right Section - User Controls */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <div className="relative">
            <button className="relative p-2 text-white hover:text-[#F91F1F] hover:bg-gray-100 rounded-lg transition-all">
              <Bell size={20} />
              {notifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {notifications}
                </span>
              )}
            </button>
          </div>

          {/* Settings */}
          <button className="p-2 text-white hover:text-[#F91F1F] hover:bg-gray-100 rounded-lg transition-all">
            <Settings size={20} />
          </button>

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center space-x-3 p-2  rounded-lg transition-all"
            >
              <div className="relative">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <User size={16} className="text-white" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
              </div>
              <div className="hidden md:block text-left">
                <div className="text-sm font-medium text-white">
                  {user?.name || user?.email?.split('@')[0] || "Dealer"}
                </div>
                <div className="text-xs text-white">Online</div>
              </div>
              <ChevronDown size={16} className={`text-white transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50">
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                      <User size={20} className="text-white" />
                    </div>
                    <div>
                      <div className="font-medium text-[#F91F1F]">
                        {user?.name || user?.email?.split('@')[0] || "Dealer"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {user?.email || "dealer@example.com"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-2">
                  <button onClick={() => router.push('/dealer/profile')}
                    className="w-full flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-md transition-all">
                    <User size={16} />
                    <span>Profile Settings</span>
                  </button>
                  <button className="w-full flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-md transition-all">
                    <Settings size={16} />
                    <span>Preferences</span>
                  </button>
                  <hr className="border-gray-100 my-2" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-3 px-3 py-2 text-red-600 hover:bg-red-50 rounded-md transition-all"
                  >
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TopBar