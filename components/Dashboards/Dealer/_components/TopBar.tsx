"use client"

import { useCookie } from "next-cookie"
import { useRouter } from "next/navigation"
import { LogOut, User, Bell, Search, Globe, ChevronDown, Menu, X, Check, AlertTriangle, CheckCheck, Inbox, Clock, Calendar } from "lucide-react"
import { successMessage } from "@/utils/Toastify/Messages"
import { useState, useEffect, useMemo } from "react"
import { useDealerLanguage } from "@/context/DealerLanguageContext"
import { renderInstance } from "@/utils/Axios/RenderInstance"

const TopBar = () => {
  const { cookie } = useCookie()
  const router = useRouter()
  const { language, setLanguage, t } = useDealerLanguage()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isLangOpen, setIsLangOpen] = useState(false)
  const [isNotifOpen, setIsNotifOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [recentNotifications, setRecentNotifications] = useState<any[]>([])

  // Fetch live notifications
  const fetchLiveNotifications = () => {
    fetch("/api/dealer/notifications", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data.notifications) {
          setRecentNotifications(data.notifications.slice(0, 4))
          setUnreadNotifications(data.unread_count ?? data.notifications.filter((n: any) => !n.is_read).length)
        }
      })
      .catch(() => {})
  }

  useEffect(() => {
    fetchLiveNotifications()
  }, [])

  // Get user info from cookie
  let user: any = null
  try {
    const userCookie = cookie?.get ? (cookie.get("user") || cookie.get("user_info")) : null
    if (userCookie) {
      user = typeof userCookie === 'string' ? JSON.parse(userCookie) : userCookie
    }
  } catch (error) {
    console.error("Error parsing user cookie:", error)
    user = null
  }

  const [liveName, setLiveName] = useState<string>("")
  const [liveImage, setLiveImage] = useState<string>("")

  // Fetch real dealer profile from FastAPI to replace any placeholder or stale "User"
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const uId = user?.userId || user?.user_id || user?.id
        const dId = user?.dealer_id || user?.dealerId
        const uEmail = user?.email
        if (!uId && !dId && !uEmail) return

        const res = await renderInstance.get("/dealer/profile", {
          params: {
            user_id: uId,
            dealer_id: dId,
            email: uEmail,
          },
        })
        const profile = res.data?.profile
        if (profile) {
          const fullName = `${profile.firstName || ""} ${profile.lastName || ""}`.trim()
          if (fullName && fullName.toLowerCase() !== "user") {
            setLiveName(fullName)
          }
          if (profile.image && profile.image !== "test") {
            setLiveImage(profile.image)
          }
        }
      } catch (err) {
        // Fallback to local cookie data
      }
    }

    fetchUserProfile()
  }, [user?.id, user?.userId, user?.user_id, user?.dealer_id, user?.email])

  const resolvedName = useMemo(() => {
    if (liveName && liveName.toLowerCase() !== "user") return liveName
    if (user) {
      const full = `${user.first_name || user.firstName || ""} ${user.last_name || user.lastName || ""}`.trim()
      if (full && full.toLowerCase() !== "user") return full
      if (user.name && user.name.toLowerCase() !== "user") return user.name
      if (user.email) {
        const prefix = user.email.split("@")[0]
        return prefix.charAt(0).toUpperCase() + prefix.slice(1)
      }
    }
    return "Dealer"
  }, [liveName, user])

  const avatarSrc = liveImage || (user?.image && user.image !== "test" ? user.image : "")

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
      if (isLangOpen && !target.closest('.lang-dropdown')) {
        setIsLangOpen(false)
      }
      if (isNotifOpen && !target.closest('.notif-dropdown')) {
        setIsNotifOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isProfileOpen, isLangOpen, isNotifOpen])

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
    return date.toLocaleTimeString(language === "es" ? "es-ES" : "en-US", {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(language === "es" ? "es-ES" : "en-US", {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <>
      <div className="bg-[#A80000] border-b border-gray-200 px-3 sm:px-4 lg:px-6 py-3 sm:py-4 shadow-sm">
        <div className="flex items-center justify-between">
          {/* Left Section - Menu & Re-arranged Date/Time Box */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-white hover:bg-white/10 rounded-xl transition-all"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Re-arranged Date & Time Box */}
            <div className="flex items-center gap-2.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl text-white backdrop-blur-sm transition-all shadow-sm">
              <div className="p-1 rounded-lg bg-white/15 text-white flex items-center justify-center shrink-0">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 leading-tight">
                <span className="font-bold text-xs sm:text-sm tracking-wide text-white">
                  {formatTime(currentTime)}
                </span>
                <span className="hidden sm:inline text-white/40 text-xs">•</span>
                <div className="flex items-center gap-1 text-[11px] sm:text-xs text-white/85 font-medium">
                  <Calendar className="w-3 h-3 text-white/70 hidden sm:inline" />
                  <span>{formatDate(currentTime)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Center Section - Desktop Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-4 lg:mx-8">
            <div className="relative w-full">
              <input
                type="text"
                placeholder={t("searchPlaceholder")}
                className="w-full px-4 py-2 pl-10 bg-gray-50 border border-gray-200 rounded-lg text-[#F91F1F] placeholder-[#A80000] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#F91F1F]" size={18} />
            </div>
          </div>

          {/* Right Section - User Controls & Language Dropdown */}
          <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-3">
            {/* Mobile Search Button */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="md:hidden p-2 text-white hover:bg-red-700 rounded-lg transition-all"
            >
              <Search className="w-[18px] h-[18px]" />
            </button>

            {/* Notifications */}
            <div className="relative notif-dropdown">
              <button
                onClick={() => {
                  setIsNotifOpen(!isNotifOpen)
                  if (!isNotifOpen) fetchLiveNotifications()
                }}
                className="relative p-2 text-white hover:bg-red-700 rounded-lg transition-all"
                title="Notifications & Alerts"
              >
                <Bell className="w-[18px] h-[18px] sm:w-5 sm:h-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 bg-amber-400 text-red-950 font-bold text-[10px] rounded-full w-4 h-4 flex items-center justify-center shadow">
                    {unreadNotifications > 9 ? "9+" : unreadNotifications}
                  </span>
                )}
              </button>

              {/* Notification Popover Dropdown */}
              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden animate-fade-in text-gray-800">
                  {/* Dropdown Header */}
                  <div className="px-4 py-3 bg-red-800 text-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell size={16} />
                      <span className="font-bold text-sm">Notifications & Alerts</span>
                    </div>
                    {unreadNotifications > 0 ? (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/20 font-semibold">
                        {unreadNotifications} new
                      </span>
                    ) : (
                      <span className="text-[11px] text-red-200">All caught up</span>
                    )}
                  </div>

                  {/* Dropdown Items List */}
                  <div className="max-h-72 overflow-y-auto divide-y divide-gray-100">
                    {recentNotifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-gray-500 space-y-1">
                        <CheckCheck className="h-6 w-6 text-emerald-500 mx-auto" />
                        <p className="font-medium">No recent notifications</p>
                      </div>
                    ) : (
                      recentNotifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => {
                            setIsNotifOpen(false)
                            router.push("/dealer/notifications/allnotification")
                          }}
                          className={`p-3 hover:bg-gray-50 transition-colors cursor-pointer flex items-start gap-2.5 ${
                            !notif.is_read ? "bg-red-50/50" : ""
                          }`}
                        >
                          <div
                            className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                              notif.category === "REPAIR"
                                ? "bg-red-100 text-red-600"
                                : notif.category === "MARKETING"
                                ? "bg-amber-100 text-amber-600"
                                : "bg-blue-100 text-blue-600"
                            }`}
                          >
                            {notif.category === "REPAIR" ? (
                              <AlertTriangle size={14} />
                            ) : (
                              <Bell size={14} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <p className="text-xs font-bold text-gray-900 truncate">
                                {notif.titleName || notif.title}
                              </p>
                              {!notif.is_read && (
                                <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
                              )}
                            </div>
                            <p className="text-[11px] text-gray-500 truncate mt-0.5">
                              {notif.message || "Notification alert"}
                            </p>
                            <span className="text-[10px] text-gray-400 mt-1 block font-medium">
                              {notif.activeFrom || "Recent"}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Dropdown Footer Actions */}
                  <div className="p-2.5 bg-gray-50 border-t border-gray-100 grid grid-cols-2 gap-2 text-center">
                    <button
                      onClick={() => {
                        setIsNotifOpen(false)
                        router.push("/dealer/notifications/allnotification")
                      }}
                      className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-100 rounded-lg text-xs font-semibold text-gray-700 transition-colors"
                    >
                      All Notifications
                    </button>
                    <button
                      onClick={() => {
                        setIsNotifOpen(false)
                        router.push("/dealer/notifications/alerts")
                      }}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                    >
                      <AlertTriangle size={12} />
                      <span>Alerts</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Language Selector Dropdown (Replaces Settings Icon) */}
            <div className="relative lang-dropdown">
              <button
                onClick={() => setIsLangOpen(!isLangOpen)}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg transition-all text-xs font-bold"
                title="Select Language"
              >
                <Globe className="w-4 h-4 text-white" />
                <span className="uppercase tracking-wider">{language === "es" ? "ES 🇪🇸" : "EN 🇺🇸"}</span>
                <ChevronDown size={14} className={`text-white transition-transform ${isLangOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Language Menu */}
              {isLangOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50 animate-in fade-in duration-150">
                  <div className="px-3 py-2 border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    {t("language")}
                  </div>
                  <button
                    onClick={() => {
                      setLanguage("en");
                      setIsLangOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2 text-xs font-semibold hover:bg-red-50 transition-colors ${
                      language === "en" ? "text-[#A80000] bg-red-50/60 font-bold" : "text-gray-700"
                    }`}
                  >
                    <span className="flex items-center gap-2">🇺🇸 English</span>
                    {language === "en" && <Check className="w-4 h-4 text-[#A80000]" />}
                  </button>
                  <button
                    onClick={() => {
                      setLanguage("es");
                      setIsLangOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2 text-xs font-semibold hover:bg-red-50 transition-colors ${
                      language === "es" ? "text-[#A80000] bg-red-50/60 font-bold" : "text-gray-700"
                    }`}
                  >
                    <span className="flex items-center gap-2">🇪🇸 Español</span>
                    {language === "es" && <Check className="w-4 h-4 text-[#A80000]" />}
                  </button>
                </div>
              )}
            </div>

            {/* User Profile Dropdown */}
            <div className="relative profile-dropdown">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-1 sm:space-x-2 lg:space-x-3 p-1 sm:p-2 rounded-lg hover:bg-white/10 transition-all"
              >
                <div className="relative">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-white/20 border border-white/30 rounded-full flex items-center justify-center overflow-hidden">
                    {avatarSrc ? (
                      <img src={avatarSrc} alt={resolvedName} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white text-xs font-bold uppercase">{resolvedName.charAt(0)}</span>
                    )}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-400 rounded-full border-2 border-[#A80000]"></div>
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-sm font-semibold text-white truncate max-w-[150px]">
                    {resolvedName}
                  </div>
                  <div className="text-xs text-white/80">{t("online")}</div>
                </div>
                <ChevronDown size={14} className={`text-white transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-56 sm:w-64 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
                  <div className="p-3 sm:p-4 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden font-bold text-sm">
                        {avatarSrc ? (
                          <img src={avatarSrc} alt={resolvedName} className="w-full h-full object-cover" />
                        ) : (
                          <span>{resolvedName.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-gray-900 truncate text-sm">
                          {resolvedName}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {user?.email || "dealer@holatractor.com"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-2 space-y-1">
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        router.push("/dealer/profile");
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-all"
                    >
                      <span>{t("profileSettings")}</span>
                      <User size={16} />
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center justify-between px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-all font-medium"
                    >
                      <span>{t("logout")}</span>
                      <LogOut size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Search Overlay */}
        {isSearchOpen && (
          <div className="mt-3 md:hidden">
            <div className="relative w-full">
              <input
                type="text"
                placeholder={t("searchPlaceholder")}
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

            {/* Mobile Language Selector */}
            <div className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Globe className="w-4 h-4 text-[#A80000]" />
                <span>{t("language")}</span>
              </div>
              <div className="flex bg-white p-1 rounded-lg border border-gray-200 text-xs font-bold">
                <button
                  onClick={() => setLanguage("en")}
                  className={`px-3 py-1 rounded-md transition-all ${
                    language === "en" ? "bg-[#A80000] text-white" : "text-gray-600"
                  }`}
                >
                  🇺🇸 EN
                </button>
                <button
                  onClick={() => setLanguage("es")}
                  className={`px-3 py-1 rounded-md transition-all ${
                    language === "es" ? "bg-[#A80000] text-white" : "text-gray-600"
                  }`}
                >
                  🇪🇸 ES
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default TopBar