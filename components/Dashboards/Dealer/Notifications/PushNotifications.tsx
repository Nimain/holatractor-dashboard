"use client"

import React, { useState, useEffect, useMemo } from "react"
import {
  Plus,
  Search,
  RefreshCw,
  CheckCheck,
  Trash2,
  Bell,
  Eye,
  X,
  Calendar,
  Users,
  Send,
  Radio,
  CheckCircle2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Filter,
  Flame,
  Wrench,
  ShieldAlert
} from "lucide-react"

export interface NotificationItem {
  id: string
  dealer_id?: string
  user_id?: string
  title: string
  titleName: string
  message: string
  category: string
  channel: string
  status: "Active" | "Inactive" | string
  is_read: boolean
  active_from?: string | null
  activeFrom: string
  active_to?: string | null
  activeTo: string
  target_audience: string
  created_at?: string
  updated_at?: string
}

export default function PushNotifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [refreshing, setRefreshing] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    active_count: 0,
    inactive_count: 0,
    unread_count: 0,
  })

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false)
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  // Form State for New Notification
  const [newNotification, setNewNotification] = useState({
    title: "",
    message: "",
    category: "MARKETING",
    channel: "PUSH",
    target_audience: "All Farmers",
    active_from: new Date().toISOString().split("T")[0],
    active_to: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    status: "Active" as "Active" | "Inactive",
  })
  const [submitting, setSubmitting] = useState<boolean>(false)

  // Fetch notifications from API
  const fetchNotifications = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/dealer/notifications", { cache: "no-store" })
      if (!res.ok) throw new Error("Failed to load notifications")
      const data = await res.json()

      if (data.notifications) {
        setNotifications(data.notifications)
        setStats({
          total: data.total ?? data.notifications.length,
          active_count: data.active_count ?? data.notifications.filter((n: any) => n.status === "Active").length,
          inactive_count: data.inactive_count ?? data.notifications.filter((n: any) => n.status === "Inactive").length,
          unread_count: data.unread_count ?? data.notifications.filter((n: any) => !n.is_read).length,
        })
      }
    } catch (err: any) {
      console.error(err)
      setError("Unable to connect to live notifications service. Displaying cached data.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  // Auto-clear success message after 4s
  useEffect(() => {
    if (actionSuccess) {
      const timer = setTimeout(() => setActionSuccess(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [actionSuccess])

  // Filtered Notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      // Status filter
      if (statusFilter === "active" && item.status.toLowerCase() !== "active") return false
      if (statusFilter === "inactive" && item.status.toLowerCase() !== "inactive") return false
      if (statusFilter === "unread" && item.is_read) return false

      // Category filter
      if (categoryFilter !== "all" && item.category.toLowerCase() !== categoryFilter.toLowerCase()) return false

      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const matchTitle = item.title?.toLowerCase().includes(query)
        const matchId = item.id?.toLowerCase().includes(query)
        const matchMessage = item.message?.toLowerCase().includes(query)
        const matchAudience = item.target_audience?.toLowerCase().includes(query)
        if (!matchTitle && !matchId && !matchMessage && !matchAudience) return false
      }

      return true
    })
  }, [notifications, statusFilter, categoryFilter, searchQuery])

  // Toggle Active/Inactive status
  const handleToggleStatus = async (item: NotificationItem, e?: React.MouseEvent) => {
    e?.stopPropagation()
    const nextStatus = item.status === "Active" ? "Inactive" : "Active"

    // Optimistic UI update
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, status: nextStatus } : n))
    )
    setStats((prev) => ({
      ...prev,
      active_count: nextStatus === "Active" ? prev.active_count + 1 : Math.max(0, prev.active_count - 1),
      inactive_count: nextStatus === "Inactive" ? prev.inactive_count + 1 : Math.max(0, prev.inactive_count - 1),
    }))

    try {
      const res = await fetch(`/api/dealer/notifications/${encodeURIComponent(item.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      })
      if (!res.ok) throw new Error("Failed to update status")
      setActionSuccess(`Notification ${item.id} status changed to ${nextStatus}`)
    } catch (err: any) {
      // Rollback on failure
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, status: item.status } : n))
      )
      setError("Failed to update status on server. Please try again.")
    }
  }

  // Toggle Read / Unread status
  const handleToggleRead = async (item: NotificationItem, e?: React.MouseEvent) => {
    e?.stopPropagation()
    const nextRead = !item.is_read

    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, is_read: nextRead } : n))
    )
    setStats((prev) => ({
      ...prev,
      unread_count: nextRead ? Math.max(0, prev.unread_count - 1) : prev.unread_count + 1,
    }))

    try {
      const res = await fetch(`/api/dealer/notifications/${encodeURIComponent(item.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_read: nextRead }),
      })
      if (!res.ok) throw new Error("Failed to mark read/unread")
    } catch (err: any) {
      // Rollback
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, is_read: item.is_read } : n))
      )
    }
  }

  // Mark all as read
  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    setStats((prev) => ({ ...prev, unread_count: 0 }))

    try {
      const res = await fetch("/api/dealer/notifications/mark-all-read", {
        method: "POST",
      })
      if (!res.ok) throw new Error("Failed to mark all as read")
      setActionSuccess("All notifications marked as read.")
    } catch (err: any) {
      setError("Failed to mark all as read.")
      fetchNotifications()
    }
  }

  // Delete notification
  const handleDeleteNotification = async (id: string) => {
    try {
      const res = await fetch(`/api/dealer/notifications/${encodeURIComponent(id)}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete notification")

      setNotifications((prev) => prev.filter((n) => n.id !== id))
      setDeleteConfirmId(null)
      if (selectedNotification?.id === id) setSelectedNotification(null)
      setActionSuccess(`Notification ${id} deleted successfully.`)
      fetchNotifications(true)
    } catch (err: any) {
      setError("Failed to delete notification.")
    }
  }

  // Create new push notification
  const handleCreateNotification = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNotification.title.trim()) {
      setError("Notification Title is required.")
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/dealer/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newNotification),
      })
      if (!res.ok) throw new Error("Failed to create notification")
      const data = await res.json()

      setIsAddModalOpen(false)
      setActionSuccess(`New push notification ${data.notification?.id || ""} broadcasted successfully!`)
      setNewNotification({
        title: "",
        message: "",
        category: "MARKETING",
        channel: "PUSH",
        target_audience: "All Farmers",
        active_from: new Date().toISOString().split("T")[0],
        active_to: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        status: "Active",
      })
      fetchNotifications(true)
    } catch (err: any) {
      setError("Error broadcasting push notification. Please check your network and try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-[#24701D] text-white"
      case "Inactive":
        return "bg-[#F76A1E] text-white"
      default:
        return "bg-gray-200 text-gray-800"
    }
  }

  const getCategoryBadge = (cat: string) => {
    switch (cat?.toUpperCase()) {
      case "MARKETING":
        return {
          classes: "bg-amber-50 text-amber-900 border-amber-300",
          icon: <Flame size={12} className="text-amber-600" />,
          label: "Campaign Alert",
        }
      case "REPAIR":
        return {
          classes: "bg-rose-50 text-rose-900 border-rose-300",
          icon: <Wrench size={12} className="text-rose-600" />,
          label: "Repair Alert",
        }
      case "LEAD":
        return {
          classes: "bg-emerald-50 text-emerald-900 border-emerald-300",
          icon: <CheckCircle2 size={12} className="text-emerald-600" />,
          label: "Sales Alert",
        }
      case "SYSTEM":
        return {
          classes: "bg-purple-50 text-purple-900 border-purple-300",
          icon: <ShieldAlert size={12} className="text-purple-600" />,
          label: "System Alert",
        }
      default:
        return {
          classes: "bg-gray-50 text-gray-800 border-gray-300",
          icon: <Radio size={12} className="text-gray-500" />,
          label: "General Notice",
        }
    }
  }

  return (
    <div className="bg-gray-100 min-h-screen px-3 py-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Modern Floating Alert Banner */}
        {actionSuccess && (
          <div className="relative overflow-hidden bg-white border-l-4 border-emerald-500 shadow-md text-emerald-950 px-4 py-3 rounded-xl flex items-center justify-between animate-fade-in ring-1 ring-emerald-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg shrink-0">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Alert Notification</p>
                <p className="text-sm font-semibold text-gray-900">{actionSuccess}</p>
              </div>
            </div>
            <button
              onClick={() => setActionSuccess(null)}
              className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {error && (
          <div className="relative overflow-hidden bg-white border-l-4 border-rose-500 shadow-md text-rose-950 px-4 py-3 rounded-xl flex items-center justify-between animate-fade-in ring-1 ring-rose-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-100 text-rose-700 rounded-lg shrink-0">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-rose-700 uppercase tracking-wider">Operational Alert</p>
                <p className="text-sm font-semibold text-gray-900">{error}</p>
              </div>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Header & Main Actions */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-red-100 rounded-xl text-red-600">
                <Bell className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-red-600">
                  Push Notifications
                </h1>
                <p className="text-xs sm:text-sm text-gray-500">
                  Manage in-app announcements, dealer alerts, and mobile notifications
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <button
              onClick={() => fetchNotifications(true)}
              disabled={refreshing}
              className="px-3.5 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-colors"
              title="Refresh notifications"
            >
              <RefreshCw size={16} className={refreshing ? "animate-spin text-orange-500" : ""} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {stats.unread_count > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="px-3.5 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-colors"
                title="Mark all notifications as read"
              >
                <CheckCheck size={16} className="text-emerald-600" />
                <span className="hidden sm:inline">Mark All Read</span>
              </button>
            )}

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 sm:px-6 py-2.5 rounded-lg font-semibold flex items-center gap-2 shadow-md transition-all text-sm sm:text-base justify-center flex-1 sm:flex-initial"
            >
              <Plus size={18} className="sm:w-5 sm:h-5" />
              <span>Add Push Notification</span>
            </button>
          </div>
        </div>

        {/* Filter Pills & Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => setStatusFilter("all")}
            className={`p-3.5 rounded-xl text-left border transition-all ${
              statusFilter === "all"
                ? "bg-red-900 text-white border-red-950 shadow-md ring-2 ring-red-500/30"
                : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="text-xs uppercase tracking-wider opacity-80 font-medium">All Notifications</div>
            <div className="text-xl sm:text-2xl font-bold mt-1">{stats.total}</div>
          </button>

          <button
            onClick={() => setStatusFilter("active")}
            className={`p-3.5 rounded-xl text-left border transition-all ${
              statusFilter === "active"
                ? "bg-emerald-800 text-white border-emerald-900 shadow-md ring-2 ring-emerald-500/30"
                : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="text-xs uppercase tracking-wider opacity-80 font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Active
            </div>
            <div className="text-xl sm:text-2xl font-bold mt-1 text-emerald-600 sm:text-inherit">
              {stats.active_count}
            </div>
          </button>

          <button
            onClick={() => setStatusFilter("inactive")}
            className={`p-3.5 rounded-xl text-left border transition-all ${
              statusFilter === "inactive"
                ? "bg-orange-800 text-white border-orange-900 shadow-md ring-2 ring-orange-500/30"
                : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="text-xs uppercase tracking-wider opacity-80 font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-orange-400"></span> Inactive
            </div>
            <div className="text-xl sm:text-2xl font-bold mt-1 text-orange-600 sm:text-inherit">
              {stats.inactive_count}
            </div>
          </button>

          <button
            onClick={() => setStatusFilter("unread")}
            className={`p-3.5 rounded-xl text-left border transition-all ${
              statusFilter === "unread"
                ? "bg-blue-800 text-white border-blue-900 shadow-md ring-2 ring-blue-500/30"
                : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="text-xs uppercase tracking-wider opacity-80 font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400"></span> Unread
            </div>
            <div className="text-xl sm:text-2xl font-bold mt-1 text-blue-600 sm:text-inherit">
              {stats.unread_count}
            </div>
          </button>
        </div>

        {/* Search & Category Filter Toolbar */}
        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notifications by title, ID, audience or text..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50 focus:bg-white transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1 pl-1">
              <Filter size={14} /> Category:
            </span>
            {["all", "MARKETING", "REPAIR", "LEAD", "GENERAL"].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  categoryFilter === cat
                    ? "bg-red-600 text-white shadow-sm"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {cat === "all" ? "All Categories" : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content: Table on desktop, Cards on mobile */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center space-y-3">
            <RefreshCw className="h-8 w-8 text-orange-500 animate-spin mx-auto" />
            <p className="text-sm font-medium text-gray-600">Loading dealer notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center space-y-4 border border-dashed border-gray-300">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
              <Bell size={28} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">No notifications found</h3>
              <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
                {searchQuery || statusFilter !== "all" || categoryFilter !== "all"
                  ? "No notifications match your current filter and search criteria."
                  : "You haven't created any push notifications yet."}
              </p>
            </div>
            {(searchQuery || statusFilter !== "all" || categoryFilter !== "all") && (
              <button
                onClick={() => {
                  setSearchQuery("")
                  setStatusFilter("all")
                  setCategoryFilter("all")
                }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold transition-colors"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="lg:hidden space-y-3 sm:space-y-4">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className="rounded-xl shadow-md overflow-hidden text-white transition-transform active:scale-[0.99]"
                  style={{ background: `linear-gradient(135deg, #A10A0C 0%, #3B0404 100%)` }}
                >
                  <div className="p-4 space-y-3">
                    {/* Header Row: ID, Badges, Toggle */}
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg tracking-wide">{notification.id}</span>
                        {!notification.is_read && (
                          <span className="w-2.5 h-2.5 rounded-full bg-orange-400 ring-2 ring-red-900" title="Unread" />
                        )}
                        {(() => {
                          const badge = getCategoryBadge(notification.category)
                          return (
                            <span className={`text-[11px] px-2 py-0.5 rounded font-semibold border inline-flex items-center gap-1 shadow-sm ${badge.classes}`}>
                              {badge.icon}
                              <span>{badge.label}</span>
                            </span>
                          )
                        })()}
                      </div>

                      <button
                        onClick={(e) => handleToggleStatus(notification, e)}
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold shadow-sm transition-all ${getStatusBadgeColor(
                          notification.status
                        )}`}
                        title="Click to toggle Active/Inactive"
                      >
                        {notification.status}
                      </button>
                    </div>

                    {/* Title & Preview Message */}
                    <div>
                      <p className="text-gray-300 text-xs mb-0.5 font-medium">Title Name</p>
                      <p className="text-white font-semibold text-base leading-snug">{notification.titleName}</p>
                      {notification.message && (
                        <p className="text-gray-300 text-xs mt-1 line-clamp-2 leading-relaxed opacity-90">
                          {notification.message}
                        </p>
                      )}
                    </div>

                    {/* Target Audience & Channel */}
                    <div className="flex items-center gap-4 text-xs text-gray-300 pt-1">
                      <div className="flex items-center gap-1">
                        <Users size={13} className="text-orange-400" />
                        <span>{notification.target_audience}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Radio size={13} className="text-red-400" />
                        <span>{notification.channel}</span>
                      </div>
                    </div>

                    {/* Date Range */}
                    <div className="grid grid-cols-2 gap-3 pt-2.5 border-t border-white/20 text-xs">
                      <div>
                        <p className="text-gray-300 mb-0.5">Active From</p>
                        <p className="text-white font-medium">{notification.activeFrom}</p>
                      </div>
                      <div>
                        <p className="text-gray-300 mb-0.5">Active To</p>
                        <p className="text-white font-medium">{notification.activeTo}</p>
                      </div>
                    </div>

                    {/* Card Action Buttons */}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                      <button
                        onClick={() => setSelectedNotification(notification)}
                        className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                      >
                        <Eye size={14} /> View
                      </button>

                      <button
                        onClick={(e) => handleToggleRead(notification, e)}
                        className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                      >
                        <CheckCheck size={14} className={notification.is_read ? "text-emerald-400" : "text-gray-400"} />
                        {notification.is_read ? "Mark Unread" : "Mark Read"}
                      </button>

                      <button
                        onClick={() => setDeleteConfirmId(notification.id)}
                        className="px-2.5 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded-lg text-xs transition-colors"
                        title="Delete notification"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr className="text-red-600 text-xs lg:text-sm uppercase tracking-wider">
                      <th className="px-5 py-3.5 text-left font-semibold">ID</th>
                      <th className="px-5 py-3.5 text-left font-semibold">Notification Title</th>
                      <th className="px-5 py-3.5 text-left font-semibold">Category</th>
                      <th className="px-5 py-3.5 text-left font-semibold">Target Audience</th>
                      <th className="px-5 py-3.5 text-left font-semibold">Active From</th>
                      <th className="px-5 py-3.5 text-left font-semibold">Active To</th>
                      <th className="px-5 py-3.5 text-left font-semibold">Status</th>
                      <th className="px-5 py-3.5 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody style={{ background: `linear-gradient(135deg, #A10A0C 0%, #3B0404 100%)` }}>
                    {filteredNotifications.map((notification) => (
                      <tr
                        key={notification.id}
                        className="border-b border-red-900/40 hover:bg-white/5 transition-colors text-sm"
                      >
                        {/* ID */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {!notification.is_read && (
                              <span
                                className="w-2 h-2 rounded-full bg-orange-400 shadow-sm"
                                title="Unread notification"
                              />
                            )}
                            <span className="text-white font-bold tracking-wider">{notification.id}</span>
                          </div>
                        </td>

                        {/* Title & Preview */}
                        <td className="px-5 py-4 max-w-xs">
                          <div className="text-white font-semibold line-clamp-1">{notification.titleName}</div>
                          {notification.message && (
                            <div className="text-gray-300 text-xs line-clamp-1 opacity-80 mt-0.5">
                              {notification.message}
                            </div>
                          )}
                        </td>

                        {/* Category */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          {(() => {
                            const badge = getCategoryBadge(notification.category)
                            return (
                              <span className={`text-xs px-2.5 py-1 rounded font-semibold border inline-flex items-center gap-1.5 shadow-sm ${badge.classes}`}>
                                {badge.icon}
                                <span>{badge.label}</span>
                              </span>
                            )
                          })()}
                        </td>

                        {/* Target Audience */}
                        <td className="px-5 py-4 whitespace-nowrap text-gray-200 text-xs">
                          <div className="flex items-center gap-1.5">
                            <Users size={14} className="text-orange-400" />
                            <span>{notification.target_audience}</span>
                          </div>
                        </td>

                        {/* Active From */}
                        <td className="px-5 py-4 whitespace-nowrap text-gray-200 text-xs font-medium">
                          {notification.activeFrom}
                        </td>

                        {/* Active To */}
                        <td className="px-5 py-4 whitespace-nowrap text-gray-200 text-xs font-medium">
                          {notification.activeTo}
                        </td>

                        {/* Status Toggle */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <button
                            onClick={(e) => handleToggleStatus(notification, e)}
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold shadow-sm transition-all hover:scale-105 active:scale-95 ${getStatusBadgeColor(
                              notification.status
                            )}`}
                            title="Click to toggle Active/Inactive"
                          >
                            <span>{notification.status}</span>
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedNotification(notification)}
                              className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                              title="View details"
                            >
                              <Eye size={17} />
                            </button>

                            <button
                              onClick={(e) => handleToggleRead(notification, e)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                notification.is_read
                                  ? "text-emerald-400 hover:bg-emerald-500/20"
                                  : "text-gray-300 hover:text-white hover:bg-white/10"
                              }`}
                              title={notification.is_read ? "Mark as unread" : "Mark as read"}
                            >
                              <CheckCheck size={17} />
                            </button>

                            <button
                              onClick={() => setDeleteConfirmId(notification.id)}
                              className="p-1.5 rounded-lg text-red-300 hover:text-red-100 hover:bg-red-500/20 transition-colors"
                              title="Delete notification"
                            >
                              <Trash2 size={17} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ======================================================== */}
      {/* ADD PUSH NOTIFICATION MODAL                             */}
      {/* ======================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                  <Send size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Broadcast Push Notification</h3>
                  <p className="text-xs text-gray-500">Send an instant alert or announcement to dealers & farmers</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateNotification} className="space-y-4">
              {/* Notification Title */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Notification Title *
                </label>
                <input
                  type="text"
                  required
                  value={newNotification.title}
                  onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
                  placeholder="e.g., Seasonal Discount on Tractor Implements"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Message / Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Notification Message *
                </label>
                <textarea
                  required
                  rows={3}
                  value={newNotification.message}
                  onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
                  placeholder="Enter broadcast details, promotional message or urgent maintenance alert..."
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Category & Channel Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Category
                  </label>
                  <select
                    value={newNotification.category}
                    onChange={(e) => setNewNotification({ ...newNotification, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                  >
                    <option value="MARKETING">Marketing Campaign</option>
                    <option value="REPAIR">Repair & Service Alert</option>
                    <option value="LEAD">Leads & Sales Alert</option>
                    <option value="GENERAL">General Announcement</option>
                    <option value="SYSTEM">System & Security Notice</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Broadcast Channel
                  </label>
                  <select
                    value={newNotification.channel}
                    onChange={(e) => setNewNotification({ ...newNotification, channel: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                  >
                    <option value="PUSH">Push Notification (Mobile & Web)</option>
                    <option value="IN_APP">In-App Banner Only</option>
                    <option value="SMS">SMS Alert</option>
                    <option value="EMAIL">Email Dispatch</option>
                  </select>
                </div>
              </div>

              {/* Target Audience & Status Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Target Audience
                  </label>
                  <select
                    value={newNotification.target_audience}
                    onChange={(e) => setNewNotification({ ...newNotification, target_audience: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                  >
                    <option value="All Farmers">All Registered Farmers</option>
                    <option value="Registered Farmers">Active Tractor Renters</option>
                    <option value="Dealership Mechanics">Dealership Mechanics</option>
                    <option value="Sub-dealers & Agents">Sub-dealers & Agents</option>
                    <option value="Commercial Farm Owners">Commercial Farm Owners</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Initial Status
                  </label>
                  <select
                    value={newNotification.status}
                    onChange={(e) => setNewNotification({ ...newNotification, status: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                  >
                    <option value="Active">Active (Publish immediately)</option>
                    <option value="Inactive">Inactive (Draft mode)</option>
                  </select>
                </div>
              </div>

              {/* Date Ranges */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Active From
                  </label>
                  <input
                    type="date"
                    value={newNotification.active_from}
                    onChange={(e) => setNewNotification({ ...newNotification, active_from: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Active To
                  </label>
                  <input
                    type="date"
                    value={newNotification.active_to}
                    onChange={(e) => setNewNotification({ ...newNotification, active_to: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-lg text-sm font-semibold flex items-center gap-2 shadow-md transition-all"
                >
                  {submitting ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Broadcasting...</span>
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      <span>Publish Notification</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW DETAILS MODAL                                      */}
      {/* ======================================================== */}
      {selectedNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-gray-900">{selectedNotification.id}</span>
                {(() => {
                  const badge = getCategoryBadge(selectedNotification.category)
                  return (
                    <span className={`text-xs px-2.5 py-0.5 rounded font-semibold border inline-flex items-center gap-1 shadow-sm ${badge.classes}`}>
                      {badge.icon}
                      <span>{badge.label}</span>
                    </span>
                  )
                })()}
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${getStatusBadgeColor(selectedNotification.status)}`}>
                  {selectedNotification.status}
                </span>
              </div>
              <button
                onClick={() => setSelectedNotification(null)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <h4 className="text-xs uppercase tracking-wider font-semibold text-gray-500 mb-1">Title</h4>
                <p className="text-base font-bold text-gray-900">{selectedNotification.titleName}</p>
              </div>

              <div>
                <h4 className="text-xs uppercase tracking-wider font-semibold text-gray-500 mb-1">Message Content</h4>
                <p className="text-gray-700 bg-gray-50 p-3.5 rounded-lg leading-relaxed whitespace-pre-wrap border border-gray-200">
                  {selectedNotification.message || "No custom message specified."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <span className="text-xs text-gray-500 block">Target Audience:</span>
                  <span className="font-medium text-gray-800">{selectedNotification.target_audience}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block">Channel:</span>
                  <span className="font-medium text-gray-800">{selectedNotification.channel}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block">Active From:</span>
                  <span className="font-medium text-gray-800">{selectedNotification.activeFrom}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block">Active To:</span>
                  <span className="font-medium text-gray-800">{selectedNotification.activeTo}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-5 mt-4 border-t border-gray-100">
              <button
                onClick={() => {
                  handleToggleStatus(selectedNotification)
                  setSelectedNotification((prev) =>
                    prev ? { ...prev, status: prev.status === "Active" ? "Inactive" : "Active" } : null
                  )
                }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                Toggle {selectedNotification.status === "Active" ? "Inactive" : "Active"}
              </button>

              <button
                onClick={() => setSelectedNotification(null)}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* DELETE CONFIRMATION MODAL                               */}
      {/* ======================================================== */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Delete Notification?</h3>
              <p className="text-xs text-gray-500 mt-1">
                Are you sure you want to delete notification <span className="font-bold text-gray-800">{deleteConfirmId}</span>? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteNotification(deleteConfirmId)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}