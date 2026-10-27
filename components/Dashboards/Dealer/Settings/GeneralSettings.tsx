"use client"

import { useState, useEffect } from "react"
import {
  Eye,
  EyeOff,
  Copy,
  Check,
  AlertTriangle,
  RefreshCw,
  Save,
  Globe,
  Shield,
  Key,
  Mail,
  Phone,
  Building2,
  CheckCircle2,
  AlertCircle
} from "lucide-react"
import { getAuthUser } from "@/utils/auth/clientAuth"

export default function GeneralSettings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null)

  const [formData, setFormData] = useState({
    displayName: "",
    businessName: "",
    email: "",
    phone: "",
    token: "",
    timezone: "America/La_Paz (UTC-04:00)",
    currency: "USD",
    blockedIPs: "",
    currentPassword: "",
    newPassword: "",
    deleteConfirmation: "",
  })

  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
  })

  const [copied, setCopied] = useState(false)
  const [showRegenModal, setShowRegenModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [dealerId, setDealerId] = useState("")

  // Show notification for 4 seconds
  const showNotice = (type: "success" | "error", message: string) => {
    setNotification({ type, message })
    setTimeout(() => {
      setNotification((curr) => (curr?.message === message ? null : curr))
    }, 4500)
  }

  // Fetch settings from API
  const fetchSettings = async (idToUse?: string) => {
    try {
      setLoading(true)
      const targetId = idToUse || dealerId
      const res = await fetch(`/api/dealer/settings/general?dealer_id=${targetId}`, { cache: "no-store" })
      if (!res.ok) throw new Error("Failed to load settings")
      const data = await res.json()

      if (data.success && data.settings) {
        const s = data.settings
        setFormData((prev) => ({
          ...prev,
          displayName: s.display_name || prev.displayName || "AgroTractor Dealership",
          businessName: s.business_name || prev.businessName || "AgroTractor Equipos y Servicios S.R.L.",
          email: s.email || prev.email || "dealer@holatractor.com",
          phone: s.phone || prev.phone || "+591 7761 3811",
          token: s.api_token || prev.token || "",
          timezone: s.timezone || "America/La_Paz (UTC-04:00)",
          currency: s.currency || "USD",
          blockedIPs: s.blocked_ips || "",
        }))
      }
    } catch (err: any) {
      console.error("Error fetching general settings:", err)
      showNotice("error", "Failed to sync settings with server. Please check your connection.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const authUser = getAuthUser()
    const activeId = (authUser as any)?.dealer_id || authUser?.userId || (authUser as any)?.id || ""
    setDealerId(activeId)
    fetchSettings(activeId)
  }, [])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  // Save General Information
  const handleSaveGeneral = async () => {
    try {
      setSaving(true)
      const payload = {
        dealer_id: dealerId,
        display_name: formData.displayName,
        business_name: formData.businessName,
        email: formData.email,
        phone: formData.phone,
        timezone: formData.timezone,
        currency: formData.currency,
        blocked_ips: formData.blockedIPs,
      }

      const res = await fetch("/api/dealer/settings/general", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (data.success) {
        showNotice("success", "General settings updated successfully!")
        if (data.settings) {
          setFormData((prev) => ({
            ...prev,
            displayName: data.settings.display_name || prev.displayName,
            businessName: data.settings.business_name || prev.businessName,
            email: data.settings.email || prev.email,
            phone: data.settings.phone || prev.phone,
            timezone: data.settings.timezone || prev.timezone,
            currency: data.settings.currency || prev.currency,
            blockedIPs: data.settings.blocked_ips || prev.blockedIPs,
          }))
        }
      } else {
        throw new Error(data.message || "Failed to save settings")
      }
    } catch (err: any) {
      console.error("Error saving general settings:", err)
      showNotice("error", err.message || "Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  // Regenerate API Token
  const handleRegenerateToken = async () => {
    try {
      setSaving(true)
      const res = await fetch("/api/dealer/settings/general", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dealer_id: dealerId,
          regenerate_token: true,
        }),
      })

      const data = await res.json()
      if (data.success) {
        showNotice("success", "New API security token generated successfully!")
        if (data.settings?.api_token) {
          setFormData((prev) => ({ ...prev, token: data.settings.api_token }))
        }
        setShowRegenModal(false)
      } else {
        throw new Error(data.message || "Failed to regenerate token")
      }
    } catch (err: any) {
      showNotice("error", err.message || "Failed to regenerate API token")
    } finally {
      setSaving(false)
    }
  }

  // Update Password
  const handleUpdatePassword = async () => {
    if (!formData.newPassword) {
      showNotice("error", "Please provide a new password")
      return
    }
    if (formData.newPassword.length < 8) {
      showNotice("error", "Password must be at least 8 characters long")
      return
    }

    try {
      setSaving(true)
      const res = await fetch("/api/dealer/settings/general", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dealer_id: dealerId,
          current_password: formData.currentPassword,
          new_password: formData.newPassword,
        }),
      })

      const data = await res.json()
      if (data.success) {
        showNotice("success", "Dealership password changed successfully!")
        setFormData((prev) => ({ ...prev, currentPassword: "", newPassword: "" }))
      } else {
        throw new Error(data.message || "Failed to change password")
      }
    } catch (err: any) {
      showNotice("error", err.message || "Failed to update password")
    } finally {
      setSaving(false)
    }
  }

  // Request Account Deletion
  const handleDeleteAccount = async () => {
    if (formData.deleteConfirmation.trim().toLowerCase() !== formData.email.trim().toLowerCase()) {
      showNotice("error", "Confirmation email does not match your account email.")
      return
    }

    try {
      setSaving(true)
      const res = await fetch("/api/dealer/settings/general", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dealer_id: dealerId,
          delete_account: true,
        }),
      })

      const data = await res.json()
      if (data.success) {
        showNotice("success", "Account deletion requested. Our administrative team will review your ticket.")
        setShowDeleteModal(false)
      } else {
        throw new Error(data.message || "Failed to submit deletion request")
      }
    } catch (err: any) {
      showNotice("error", err.message || "Failed to request account deletion")
    } finally {
      setSaving(false)
    }
  }

  const copyToken = () => {
    if (!formData.token) return
    navigator.clipboard.writeText(formData.token)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    showNotice("success", "API Token copied to clipboard!")
  }

  const togglePasswordVisibility = (field: "current" | "new") => {
    setShowPassword((prev) => ({
      ...prev,
      [field]: !prev[field],
    }))
  }

  return (
    <div className="bg-gray-50 min-h-screen p-3 sm:p-5 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">General Settings</h1>
            <p className="text-sm text-gray-500 mt-1">
              Configure your dealership profile, server API credentials, operating timezone, and access controls.
            </p>
          </div>
          <button
            onClick={handleSaveGeneral}
            disabled={saving || loading}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold text-sm rounded-xl shadow-sm transition-all transform active:scale-95"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save All Changes
          </button>
        </div>

        {/* Status Notification */}
        {notification && (
          <div
            className={`p-4 rounded-xl flex items-center justify-between shadow-sm border transition-all animate-in fade-in-50 duration-300 ${
              notification.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            <div className="flex items-center gap-3">
              {notification.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              )}
              <span className="text-sm font-medium">{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-xs font-semibold opacity-70 hover:opacity-100"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Main Settings Card */}
        <div
          className="rounded-2xl p-6 sm:p-8 text-white shadow-xl space-y-8"
          style={{
            background: "linear-gradient(135deg, #8B0000 0%, #4A0404 100%)",
          }}
        >
          {/* Section 1: Dealership Profile */}
          <div className="border-b border-red-900/40 pb-7">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-5 h-5 text-red-300" />
              <h2 className="text-lg sm:text-xl font-bold tracking-wide">Dealership Identity</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs uppercase tracking-wider text-red-200 mb-1.5 font-medium">
                  Display / Brand Name
                </label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => handleInputChange("displayName", e.target.value)}
                  placeholder="e.g. AgroTractor Bolivia Central"
                  className="bg-white/95 text-gray-900 placeholder-gray-400 px-4 py-2.5 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-orange-400 font-medium text-sm transition-all"
                />
                <p className="text-red-300 text-xs mt-1">Shown to farmers and buyers across the marketplace.</p>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-red-200 mb-1.5 font-medium">
                  Legal Business Name
                </label>
                <input
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => handleInputChange("businessName", e.target.value)}
                  placeholder="e.g. AgroTractor Equipos y Servicios S.R.L."
                  className="bg-white/95 text-gray-900 placeholder-gray-400 px-4 py-2.5 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-orange-400 font-medium text-sm transition-all"
                />
                <p className="text-red-300 text-xs mt-1">Used for invoices, leasing contracts, and tax compliance.</p>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-red-200 mb-1.5 font-medium">
                  Support & Contact Phone
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="+591 7761 3811"
                    className="bg-white/95 text-gray-900 placeholder-gray-400 pl-9 pr-4 py-2.5 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-orange-400 font-medium text-sm transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-red-200 mb-1.5 font-medium">
                  Default Accounting Currency
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => handleInputChange("currency", e.target.value)}
                  className="bg-white/95 text-gray-900 px-4 py-2.5 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-orange-400 font-medium text-sm transition-all"
                >
                  <option value="USD">USD ($) - US Dollar</option>
                  <option value="BOB">BOB (Bs.) - Bolivian Boliviano</option>
                  <option value="EUR">EUR (€) - Euro</option>
                  <option value="BRL">BRL (R$) - Brazilian Real</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Server API & Integration Token */}
          <div className="border-b border-red-900/40 pb-7">
            <div className="flex items-center gap-2 mb-3">
              <Key className="w-5 h-5 text-red-300" />
              <h2 className="text-lg sm:text-xl font-bold tracking-wide">Dealership Server Token</h2>
            </div>
            <p className="text-gray-200 text-xs sm:text-sm mb-4">
              Authenticate API webhooks, integrate third-party dealership ERPs, or sync telemetry across stores.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={formData.token}
                  readOnly
                  className="bg-white/90 text-gray-800 font-mono text-xs sm:text-sm px-4 py-2.5 rounded-lg w-full select-all focus:outline-none border border-transparent shadow-inner"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={copyToken}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-medium text-xs sm:text-sm rounded-lg transition-colors shadow-sm"
                  title="Copy Token"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-200" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copied" : "Copy"}
                </button>

                <button
                  type="button"
                  onClick={() => setShowRegenModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white font-medium text-xs sm:text-sm rounded-lg transition-colors border border-white/20"
                  title="Regenerate Token"
                >
                  <RefreshCw className="w-4 h-4" />
                  Regenerate
                </button>
              </div>
            </div>
          </div>

          {/* Section 3: Timezone & Network Filtering */}
          <div className="border-b border-red-900/40 pb-7">
            <div className="flex items-center gap-2 mb-3">
              <Globe className="w-5 h-5 text-red-300" />
              <h2 className="text-lg sm:text-xl font-bold tracking-wide">Timezone & Access Controls</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs uppercase tracking-wider text-red-200 mb-1.5 font-medium">
                  Operating Timezone
                </label>
                <select
                  value={formData.timezone}
                  onChange={(e) => handleInputChange("timezone", e.target.value)}
                  className="bg-white/95 text-gray-900 px-4 py-2.5 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-orange-400 font-medium text-sm transition-all"
                >
                  <option value="America/La_Paz (UTC-04:00)">Santa Cruz, Bolivia (UTC-04:00)</option>
                  <option value="America/Bogota (UTC-05:00)">Bogota, Colombia (UTC-05:00)</option>
                  <option value="America/Sao_Paulo (UTC-03:00)">Sao Paulo, Brazil (UTC-03:00)</option>
                  <option value="America/Buenos_Aires (UTC-03:00)">Buenos Aires, Argentina (UTC-03:00)</option>
                  <option value="America/Mexico_City (UTC-06:00)">Mexico City (UTC-06:00)</option>
                  <option value="America/New_York (UTC-05:00)">Eastern Time (US & Canada)</option>
                  <option value="UTC (UTC+00:00)">Coordinated Universal Time (UTC)</option>
                </select>
                <p className="text-red-200 text-xs mt-1.5">
                  All repair schedules, tractor booking calendars, and marketing logs align with this timezone.
                </p>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-red-200 mb-1.5 font-medium">
                  Blocked IP Addresses
                </label>
                <textarea
                  rows={2}
                  value={formData.blockedIPs}
                  onChange={(e) => handleInputChange("blockedIPs", e.target.value)}
                  placeholder="e.g. 192.168.1.100, 10.0.0.45 (comma-separated)"
                  className="bg-white/95 text-gray-900 placeholder-gray-400 px-4 py-2.5 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-orange-400 font-mono text-xs transition-all resize-none"
                />
                <p className="text-red-200 text-xs mt-1">
                  Inbound requests originating from these IP subnets will be blocked by dealership firewalls.
                </p>
              </div>
            </div>
          </div>

          {/* Section 4: User Credentials (Email & Password) */}
          <div className="border-b border-red-900/40 pb-7 space-y-6">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-5 h-5 text-red-300" />
              <h2 className="text-lg sm:text-xl font-bold tracking-wide">Account Security & Credentials</h2>
            </div>

            {/* Email Edit */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white/10 p-4 rounded-xl border border-white/10">
              <div>
                <h3 className="font-semibold text-white text-sm sm:text-base flex items-center gap-2">
                  <Mail className="w-4 h-4 text-orange-400" />
                  Primary Account Email
                </h3>
                <p className="text-red-200 text-xs mt-0.5">Primary notification and authentication address.</p>
              </div>
              <div className="flex items-center gap-3 w-full lg:w-auto">
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="bg-white text-gray-900 px-4 py-2 rounded-lg font-medium text-sm flex-1 sm:w-64 focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
                <button
                  type="button"
                  onClick={handleSaveGeneral}
                  disabled={saving}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs rounded-lg transition-colors whitespace-nowrap shadow-sm"
                >
                  Update
                </button>
              </div>
            </div>

            {/* Change Password */}
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 bg-white/10 p-4 rounded-xl border border-white/10">
              <div className="flex-1">
                <h3 className="font-semibold text-white text-sm sm:text-base flex items-center gap-2">
                  <Key className="w-4 h-4 text-orange-400" />
                  Change Master Password
                </h3>
                <p className="text-red-200 text-xs mt-0.5">Must be at least 8 characters with letters and numbers.</p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                <div className="relative w-full sm:w-56">
                  <input
                    type={showPassword.new ? "text" : "password"}
                    value={formData.newPassword}
                    onChange={(e) => handleInputChange("newPassword", e.target.value)}
                    placeholder="New password (8+ chars)"
                    className="bg-white text-gray-900 px-4 py-2 pr-10 rounded-lg w-full font-medium text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility("new")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleUpdatePassword}
                  disabled={saving || !formData.newPassword}
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white font-semibold text-xs rounded-lg transition-colors whitespace-nowrap shadow-sm"
                >
                  Update Password
                </button>
              </div>
            </div>
          </div>

          {/* Section 5: Danger Zone */}
          <div className="bg-red-950/60 border border-red-500/30 rounded-xl p-5 sm:p-6 space-y-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-yellow-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-base font-bold text-yellow-400">Danger Zone</h3>
                <p className="text-red-200 text-xs sm:text-sm mt-0.5">
                  Deleting your dealership account will terminate active tractor listings, repair bookings, and access tokens permanently.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2">
              <div className="text-xs text-red-300">
                Type <span className="font-mono font-bold text-white">{formData.email}</span> to confirm deletion.
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={formData.deleteConfirmation}
                  onChange={(e) => handleInputChange("deleteConfirmation", e.target.value)}
                  placeholder="Type email to confirm"
                  className="bg-white text-gray-900 px-3.5 py-1.5 rounded-lg text-xs font-mono w-full sm:w-60 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={formData.deleteConfirmation.trim().toLowerCase() !== formData.email.trim().toLowerCase()}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white font-semibold text-xs rounded-lg transition-colors whitespace-nowrap shadow-sm"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Token Regeneration */}
      {showRegenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-gray-100">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-gray-900">Regenerate API Token?</h3>
              <p className="text-sm text-gray-500 mt-2">
                This will immediately invalidate your previous dealership token. Any webhooks or third-party ERP services using the old token will stop working until updated.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                onClick={() => setShowRegenModal(false)}
                className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleRegenerateToken}
                disabled={saving}
                className="px-5 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm"
              >
                {saving ? "Regenerating..." : "Yes, Regenerate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}