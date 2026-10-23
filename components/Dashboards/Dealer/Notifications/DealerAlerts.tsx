"use client"

import React, { useState, useEffect, useMemo } from "react"
import {
  AlertTriangle,
  AlertCircle,
  Bell,
  CheckCircle2,
  Clock,
  Filter,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Trash2,
  Wrench,
  Users,
  X,
  ExternalLink,
  ChevronRight,
  Flame,
  CheckCheck
} from "lucide-react"

export interface DealerAlertItem {
  id: string
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
  severity?: "CRITICAL" | "WARNING" | "INFO" | "SUCCESS"
  equipment?: string
}

export default function DealerAlerts() {
  const [alerts, setAlerts] = useState<DealerAlertItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [refreshing, setRefreshing] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  // Filters
  const [severityFilter, setSeverityFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [showResolved, setShowResolved] = useState<boolean>(false)

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false)
  const [selectedAlert, setSelectedAlert] = useState<DealerAlertItem | null>(null)
  const [newAlert, setNewAlert] = useState({
    title: "",
    message: "",
    category: "REPAIR",
    severity: "CRITICAL" as "CRITICAL" | "WARNING" | "INFO",
    target_audience: "Dealership Mechanics",
    channel: "PUSH",
  })
  const [submitting, setSubmitting] = useState<boolean>(false)

  const fetchAlerts = async (isManual = false) => {
    if (isManual) setRefreshing(true)
    else setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/dealer/notifications", { cache: "no-store" })
      if (!res.ok) throw new Error("Failed to load alerts")
      const data = await res.json()

      if (data.notifications) {
        // Map notifications into alerts with inferred severities and equipment names
        const mapped: DealerAlertItem[] = data.notifications.map((n: any, idx: number) => {
          let severity: "CRITICAL" | "WARNING" | "INFO" = "INFO"
          let equipment = "Tractor Fleet"

          if (n.category === "REPAIR" || n.title?.toLowerCase().includes("urgent") || n.title?.toLowerCase().includes("breakdown")) {
            severity = "CRITICAL"
            equipment = n.message?.includes("John Deere") ? "John Deere 5050D" : "Mahindra 575 DI"
          } else if (n.category === "MARKETING" || n.title?.toLowerCase().includes("discount") || n.title?.toLowerCase().includes("flash")) {
            severity = "WARNING"
            equipment = "Harvest Campaign"
          } else if (n.category === "LEAD" || n.target_audience?.includes("Farmers")) {
            severity = "INFO"
            equipment = "Customer Inquiries"
          }

          return {
            ...n,
            severity,
            equipment,
          }
        })

        // Also add seed dynamic operational alerts if only few exist
        if (mapped.length < 5) {
          mapped.unshift(
            {
              id: "#ALT-901",
              title: "Critical Engine Overheat Alert: Fleet #JD-410",
              titleName: "Critical Engine Overheat Alert: Fleet #JD-410",
              message: "Coolant temperature exceeded 105°C during active field plowing in Warnes. Immediate inspection required.",
              category: "REPAIR",
              channel: "PUSH",
              status: "Active",
              is_read: false,
              activeFrom: "Today, 14:20",
              activeTo: "30 Oct 2026",
              target_audience: "Dealership Mechanics",
              severity: "CRITICAL",
              equipment: "John Deere 5050D (SN: JD-8819)",
            },
            {
              id: "#ALT-902",
              title: "Low Inventory Warning: Hydraulic Seals (Part #HS-401)",
              titleName: "Low Inventory Warning: Hydraulic Seals",
              message: "Stock has dropped to 3 units in Santa Cruz Central Depot. Reorder threshold is 10 units.",
              category: "SYSTEM",
              channel: "IN_APP",
              status: "Active",
              is_read: false,
              activeFrom: "Yesterday",
              activeTo: "20 Nov 2026",
              target_audience: "Inventory Staff",
              severity: "WARNING",
              equipment: "Central Parts Store",
            }
          )
        }

        setAlerts(mapped)
      }
    } catch (err: any) {
      console.error(err)
      setError("Unable to sync live alerts feed. Showing recent cached alerts.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchAlerts()
  }, [])

  useEffect(() => {
    if (actionSuccess) {
      const timer = setTimeout(() => setActionSuccess(null), 3500)
      return () => clearTimeout(timer)
    }
  }, [actionSuccess])

  // Filtered alerts
  const filteredAlerts = useMemo(() => {
    return alerts.filter((item) => {
      if (!showResolved && item.status.toLowerCase() === "inactive") return false
      if (severityFilter !== "all" && item.severity !== severityFilter) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchTitle = item.title?.toLowerCase().includes(q)
        const matchId = item.id?.toLowerCase().includes(q)
        const matchEquip = item.equipment?.toLowerCase().includes(q)
        const matchMsg = item.message?.toLowerCase().includes(q)
        if (!matchTitle && !matchId && !matchEquip && !matchMsg) return false
      }
      return true
    })
  }, [alerts, severityFilter, searchQuery, showResolved])

  // Stats
  const criticalCount = alerts.filter((a) => a.severity === "CRITICAL" && a.status === "Active").length
  const warningCount = alerts.filter((a) => a.severity === "WARNING" && a.status === "Active").length
  const infoCount = alerts.filter((a) => a.severity === "INFO" && a.status === "Active").length
  const resolvedCount = alerts.filter((a) => a.status === "Inactive").length

  // Resolve / Acknowledge alert
  const handleToggleResolve = async (alertItem: DealerAlertItem) => {
    const nextStatus = alertItem.status === "Active" ? "Inactive" : "Active"
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertItem.id ? { ...a, status: nextStatus, is_read: true } : a))
    )

    try {
      await fetch(`/api/dealer/notifications/${encodeURIComponent(alertItem.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus, is_read: true }),
      })
      setActionSuccess(
        nextStatus === "Inactive"
          ? `Alert ${alertItem.id} marked as Resolved.`
          : `Alert ${alertItem.id} re-opened as Active.`
      )
    } catch (e) {
      //
    }
  }

  // Create new urgent alert
  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAlert.title.trim()) return

    setSubmitting(true)
    try {
      const res = await fetch("/api/dealer/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `[${newAlert.severity}] ${newAlert.title}`,
          message: newAlert.message,
          category: newAlert.category,
          channel: newAlert.channel,
          target_audience: newAlert.target_audience,
          status: "Active",
        }),
      })
      if (!res.ok) throw new Error("Failed to post alert")

      setIsAddModalOpen(false)
      setActionSuccess("Emergency alert broadcasted to dealership staff.")
      setNewAlert({
        title: "",
        message: "",
        category: "REPAIR",
        severity: "CRITICAL",
        target_audience: "Dealership Mechanics",
        channel: "PUSH",
      })
      fetchAlerts(true)
    } catch (err: any) {
      setError("Failed to create alert.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-gray-100 min-h-screen px-3 py-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Banner Alert Feedback */}
        {actionSuccess && (
          <div className="bg-emerald-500/10 border-l-4 border-emerald-500 text-emerald-900 p-4 rounded-r-xl flex items-center justify-between shadow-sm animate-fade-in bg-white">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <span className="text-sm font-semibold">{actionSuccess}</span>
            </div>
            <button onClick={() => setActionSuccess(null)} className="text-emerald-700 hover:text-emerald-950">
              <X size={16} />
            </button>
          </div>
        )}

        {error && (
          <div className="bg-rose-500/10 border-l-4 border-rose-500 text-rose-900 p-4 rounded-r-xl flex items-center justify-between shadow-sm bg-white">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-rose-600" />
              <span className="text-sm font-semibold">{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-rose-700 hover:text-rose-950">
              <X size={16} />
            </button>
          </div>
        )}

        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 text-red-700 rounded-2xl shadow-sm">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-red-600 tracking-tight">
                  Dealer Operational Alerts
                </h1>
                {criticalCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-600 text-white animate-pulse">
                    {criticalCount} Critical
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                Real-time equipment fault detection, low inventory stock thresholds, and urgent dealership notices
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <button
              onClick={() => fetchAlerts(true)}
              disabled={refreshing}
              className="px-3.5 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl text-sm font-medium flex items-center gap-2 shadow-sm transition-colors"
            >
              <RefreshCw size={16} className={refreshing ? "animate-spin text-orange-500" : ""} />
              <span className="hidden sm:inline">Refresh Alerts</span>
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 sm:px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
            >
              <Plus size={18} />
              <span>Create Alert</span>
            </button>
          </div>
        </div>

        {/* Severity Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Critical */}
          <button
            onClick={() => setSeverityFilter(severityFilter === "CRITICAL" ? "all" : "CRITICAL")}
            className={`p-4 rounded-2xl border text-left transition-all ${
              severityFilter === "CRITICAL"
                ? "bg-rose-900 text-white border-rose-950 shadow-lg ring-2 ring-rose-500/50"
                : "bg-white border-rose-200/80 hover:border-rose-300 shadow-sm"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-500 sm:text-inherit">
                Critical Severity
              </span>
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold mt-2 text-rose-600 sm:text-inherit">
              {criticalCount}
            </div>
            <div className="text-[11px] opacity-75 mt-1">Requires immediate dispatch</div>
          </button>

          {/* Warning */}
          <button
            onClick={() => setSeverityFilter(severityFilter === "WARNING" ? "all" : "WARNING")}
            className={`p-4 rounded-2xl border text-left transition-all ${
              severityFilter === "WARNING"
                ? "bg-amber-900 text-white border-amber-950 shadow-lg ring-2 ring-amber-500/50"
                : "bg-white border-amber-200/80 hover:border-amber-300 shadow-sm"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-500 sm:text-inherit">
                Warnings
              </span>
              <Flame size={16} className="text-amber-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold mt-2 text-amber-600 sm:text-inherit">
              {warningCount}
            </div>
            <div className="text-[11px] opacity-75 mt-1">Attention & maintenance</div>
          </button>

          {/* Operational Info */}
          <button
            onClick={() => setSeverityFilter(severityFilter === "INFO" ? "all" : "INFO")}
            className={`p-4 rounded-2xl border text-left transition-all ${
              severityFilter === "INFO"
                ? "bg-blue-900 text-white border-blue-950 shadow-lg ring-2 ring-blue-500/50"
                : "bg-white border-blue-200/80 hover:border-blue-300 shadow-sm"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-500 sm:text-inherit">
                Operational Info
              </span>
              <Bell size={16} className="text-blue-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold mt-2 text-blue-600 sm:text-inherit">
              {infoCount}
            </div>
            <div className="text-[11px] opacity-75 mt-1">Broadcasts & inquiries</div>
          </button>

          {/* Resolved */}
          <button
            onClick={() => setShowResolved(!showResolved)}
            className={`p-4 rounded-2xl border text-left transition-all ${
              showResolved
                ? "bg-emerald-900 text-white border-emerald-950 shadow-lg ring-2 ring-emerald-500/50"
                : "bg-white border-gray-200 hover:border-gray-300 shadow-sm"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 sm:text-inherit">
                Resolved
              </span>
              <CheckCheck size={16} className="text-emerald-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold mt-2 text-emerald-600 sm:text-inherit">
              {resolvedCount}
            </div>
            <div className="text-[11px] opacity-75 mt-1">
              {showResolved ? "Showing resolved" : "Click to view resolved"}
            </div>
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search alerts by equipment, issue title or keyword..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50 focus:bg-white transition-colors"
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
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1 pl-1">
              <Filter size={13} /> Filter:
            </span>
            {[
              { id: "all", label: "All Severities" },
              { id: "CRITICAL", label: "Critical" },
              { id: "WARNING", label: "Warning" },
              { id: "INFO", label: "Info" },
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setSeverityFilter(btn.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  severityFilter === btn.id
                    ? "bg-red-600 text-white shadow-sm"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Alert Cards Feed */}
        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm p-16 text-center space-y-3">
            <RefreshCw className="h-8 w-8 text-orange-500 animate-spin mx-auto" />
            <p className="text-sm font-semibold text-gray-600">Syncing live dealer alerts...</p>
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-14 text-center space-y-3 border border-dashed border-gray-300">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 size={30} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">All systems operational</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              No active alerts matching your criteria. Your tractor fleet and dealership operations are running smoothly.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAlerts.map((alertItem) => {
              const isCritical = alertItem.severity === "CRITICAL"
              const isWarning = alertItem.severity === "WARNING"
              const isResolved = alertItem.status.toLowerCase() === "inactive"

              return (
                <div
                  key={alertItem.id}
                  className={`rounded-2xl transition-all border shadow-sm hover:shadow-md overflow-hidden ${
                    isResolved
                      ? "bg-gray-50/80 border-gray-200 opacity-75"
                      : isCritical
                      ? "bg-gradient-to-r from-rose-50 via-white to-white border-rose-300 ring-1 ring-rose-200"
                      : isWarning
                      ? "bg-gradient-to-r from-amber-50 via-white to-white border-amber-300"
                      : "bg-gradient-to-r from-blue-50 via-white to-white border-blue-200"
                  }`}
                >
                  <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Left details */}
                    <div className="flex items-start gap-3.5 flex-1">
                      <div
                        className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                          isResolved
                            ? "bg-gray-200 text-gray-600"
                            : isCritical
                            ? "bg-rose-600 text-white shadow-md animate-pulse"
                            : isWarning
                            ? "bg-amber-500 text-white shadow-sm"
                            : "bg-blue-600 text-white"
                        }`}
                      >
                        {isCritical ? (
                          <ShieldAlert size={22} />
                        ) : isWarning ? (
                          <AlertTriangle size={22} />
                        ) : (
                          <Bell size={22} />
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs px-2 py-0.5 rounded bg-gray-200/80 text-gray-800">
                            {alertItem.id}
                          </span>

                          <span
                            className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                              isResolved
                                ? "bg-gray-200 text-gray-700"
                                : isCritical
                                ? "bg-rose-100 text-rose-800 border border-rose-300"
                                : isWarning
                                ? "bg-amber-100 text-amber-800 border border-amber-300"
                                : "bg-blue-100 text-blue-800 border border-blue-300"
                            }`}
                          >
                            {isResolved ? "Resolved" : alertItem.severity}
                          </span>

                          {alertItem.equipment && (
                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 font-semibold border border-red-200 flex items-center gap-1">
                              <Wrench size={11} /> {alertItem.equipment}
                            </span>
                          )}

                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Clock size={12} /> {alertItem.activeFrom}
                          </span>
                        </div>

                        <h3
                          className={`text-base sm:text-lg font-bold leading-snug ${
                            isResolved ? "text-gray-500 line-through" : "text-gray-900"
                          }`}
                        >
                          {alertItem.titleName}
                        </h3>

                        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed max-w-3xl">
                          {alertItem.message}
                        </p>

                        <div className="flex items-center gap-3 text-xs text-gray-500 pt-1">
                          <span className="flex items-center gap-1">
                            <Users size={12} className="text-gray-400" /> {alertItem.target_audience}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right actions */}
                    <div className="flex items-center gap-2 self-end md:self-center shrink-0 pt-2 md:pt-0">
                      <button
                        onClick={() => setSelectedAlert(alertItem)}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-semibold transition-colors"
                      >
                        Details
                      </button>

                      <button
                        onClick={() => handleToggleResolve(alertItem)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
                          isResolved
                            ? "bg-gray-200 hover:bg-gray-300 text-gray-700"
                            : isCritical
                            ? "bg-rose-600 hover:bg-rose-700 text-white"
                            : "bg-emerald-600 hover:bg-emerald-700 text-white"
                        }`}
                      >
                        {isResolved ? "Reopen Alert" : "Mark Resolved"}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Modal: Create Alert */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                    <ShieldAlert size={20} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Broadcast Urgent Alert</h3>
                </div>
                <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateAlert} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Alert Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={newAlert.title}
                    onChange={(e) => setNewAlert({ ...newAlert, title: e.target.value })}
                    placeholder="e.g., Immediate Hydraulic Leak: Tractor #JD-302"
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Alert Severity Level
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "CRITICAL", label: "Critical", color: "border-rose-500 bg-rose-50 text-rose-800" },
                      { id: "WARNING", label: "Warning", color: "border-amber-500 bg-amber-50 text-amber-800" },
                      { id: "INFO", label: "Info", color: "border-blue-500 bg-blue-50 text-blue-800" },
                    ].map((s) => (
                      <button
                        type="button"
                        key={s.id}
                        onClick={() => setNewAlert({ ...newAlert, severity: s.id as any })}
                        className={`p-2.5 text-xs font-bold rounded-lg border text-center transition-all ${
                          newAlert.severity === s.id ? `${s.color} ring-2 ring-red-500/30` : "border-gray-200 text-gray-600"
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Incident Details / Instructions *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={newAlert.message}
                    onChange={(e) => setNewAlert({ ...newAlert, message: e.target.value })}
                    placeholder="Describe equipment location, fault symptoms, and required mechanic action..."
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                      Target Audience
                    </label>
                    <select
                      value={newAlert.target_audience}
                      onChange={(e) => setNewAlert({ ...newAlert, target_audience: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                    >
                      <option value="Dealership Mechanics">Dealership Mechanics</option>
                      <option value="All Farmers">All Registered Farmers</option>
                      <option value="Inventory Staff">Inventory Staff</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                      Dispatch Channel
                    </label>
                    <select
                      value={newAlert.channel}
                      onChange={(e) => setNewAlert({ ...newAlert, channel: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                    >
                      <option value="PUSH">Push & SMS Alert</option>
                      <option value="IN_APP">In-App Banner Only</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
                  >
                    {submitting ? "Broadcasting..." : "Broadcast Alert"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Alert Details */}
        {selectedAlert && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900">{selectedAlert.id}</span>
                  <span className="text-xs px-2.5 py-0.5 rounded font-bold uppercase tracking-wider bg-red-100 text-red-800">
                    {selectedAlert.severity}
                  </span>
                </div>
                <button onClick={() => setSelectedAlert(null)} className="text-gray-400 hover:text-gray-600">
                  <X size={18} />
                </button>
              </div>

              <div>
                <h4 className="text-base font-bold text-gray-900">{selectedAlert.titleName}</h4>
                <p className="text-xs text-gray-500 mt-0.5">Logged: {selectedAlert.activeFrom}</p>
              </div>

              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                {selectedAlert.message}
              </div>

              {selectedAlert.equipment && (
                <div className="text-xs text-gray-600">
                  <span className="font-bold text-gray-800">Assigned Asset:</span> {selectedAlert.equipment}
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <button
                  onClick={() => {
                    handleToggleResolve(selectedAlert)
                    setSelectedAlert(null)
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm"
                >
                  {selectedAlert.status === "Active" ? "Mark Resolved" : "Reopen Alert"}
                </button>
                <button
                  onClick={() => setSelectedAlert(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-bold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
