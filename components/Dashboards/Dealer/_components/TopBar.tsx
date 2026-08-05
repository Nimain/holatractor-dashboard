"use client"

import { useCookie } from "next-cookie"
import { useRouter } from "next/navigation"
import { LogOut, User, Bell, Search, Settings, ChevronDown, Menu, X } from "lucide-react"
import { successMessage } from "@/utils/Toastify/Messages"
import { useState, useEffect } from "react"

const TopBar = () => {
  const { cookie } = useCookie()
  const router = useRouter()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
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

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (isProfileOpen && !target.closest('.profile-dropdown')) {
        setIsProfileOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isProfileOpen])

  const handleLogout = () => {
    try {
      const cookiesToRemove = [
        "access_token",
        "user",
        "isFarmer",
        "isOperator",
        "isAgent",
        "isOwner",
        "isDealer",
        "isODealer",
      ];

      cookiesToRemove.forEach((name) => {
        cookie.remove(name, { path: "/" });
        cookie.remove(name);
        if (typeof document !== "undefined") {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        }
      });

      successMessage("Logged out successfully");
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
      router.push("/login");
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <>
      <div className="bg-[#A80000] border-b border-gray-200 px-3 sm:px-4 lg:px-6 py-3 sm:py-4 shadow-sm">
        <div className="flex items-center justify-between">
          {/* Left Section - Title and Menu */}
          <div className="flex items-center space-x-2 sm:space-x-4 lg:space-x-8">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-white hover:bg-red-700 rounded-lg transition-all"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <div>
              <h1 className="text-base sm:text-xl lg:text-2xl font-bold text-white truncate">
                Dealer Dashboard
              </h1>
            </div>

            {/* Desktop Time Display */}
            <div className="hidden lg:flex items-center space-x-2 px-4 py-2 bg-gray-50 rounded-lg">
              <div className="text-sm text-[#F91F1F]">
                <div className="font-medium">{formatTime(currentTime)}</div>
                <div className="text-xs text-[#F91F1F]">{formatDate(currentTime)}</div>
              </div>
            </div>
          </div>

          {/* Center Section - Desktop Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-4 lg:mx-8">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search..."
                className="w-full px-4 py-2 pl-10 bg-gray-50 border border-gray-200 rounded-lg text-[#F91F1F] placeholder-[#A80000] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#F91F1F]" size={18} />
            </div>
          </div>

          {/* Right Section - User Controls */}
          <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-4">
            {/* Mobile Search Button */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="md:hidden p-2 text-white hover:bg-red-700 rounded-lg transition-all"
            >
              <Search className="w-[18px] h-[18px]" />
            </button>

            {/* Notifications */}
            <div className="relative">
              <button className="relative p-2 text-white hover:bg-red-700 rounded-lg transition-all">
                <Bell className="w-[18px] h-[18px] sm:w-5 sm:h-5" />
                {notifications > 0 && (
                  <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {notifications}
                  </span>
                )}
              </button>
            </div>

            {/* Settings - Hidden on mobile */}
            <button className="hidden sm:block p-2 text-white hover:bg-red-700 rounded-lg transition-all">
              <Settings className="w-5 h-5" />
            </button>

            {/* User Profile Dropdown */}
            <div className="relative profile-dropdown">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-1 sm:space-x-2 lg:space-x-3 p-1 sm:p-2 rounded-lg transition-all"
              >
                <div className="relative">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-400 rounded-full border-2 border-white"></div>
                </div>
                <div className="hidden lg:block text-left">
                  <div className="text-sm font-medium text-white truncate max-w-[120px]">
                    {user?.name || user?.email?.split('@')[0] || "Dealer"}
                  </div>
                  <div className="text-xs text-white">Online</div>
                </div>
                <ChevronDown size={14} className={`hidden sm:block text-white transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-56 sm:w-64 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50">
                  <div className="p-3 sm:p-4 border-b border-gray-100">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <User size={20} className="text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-[#F91F1F] truncate">
                          {user?.name || user?.email?.split('@')[0] || "Dealer"}
                        </div>
                        <div className="text-sm text-gray-500 truncate">
                          {user?.email || "dealer@example.com"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-2">
                    <button 
                      onClick={() => {
                        router.push('/dealer/profile')
                        setIsProfileOpen(false)
                      }}
                      className="w-full flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-md transition-all"
                    >
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

        {/* Mobile Search Bar */}
        {isSearchOpen && (
          <div className="md:hidden mt-3 pb-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                className="w-full px-4 py-2 pl-10 bg-gray-50 border border-gray-200 rounded-lg text-[#F91F1F] placeholder-[#A80000] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#F91F1F]" size={18} />
            </div>
          </div>
        )}
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-gray-200 shadow-lg">
          <div className="px-4 py-3 space-y-2">
            {/* Time Display for Mobile */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-[#F91F1F]">
                <div className="font-medium">{formatTime(currentTime)}</div>
                <div className="text-xs text-[#A80000]">{formatDate(currentTime)}</div>
              </div>
            </div>

            {/* Mobile Settings */}
            <button className="w-full flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-md transition-all">
              <Settings size={18} />
              <span>Settings</span>
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default TopBar