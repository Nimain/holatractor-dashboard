"use client"

import React, { useState, useEffect } from "react"
import {
  ChevronDown,
  Bell,
  Mail,
  Volume2,
  VolumeX,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Save,
  RotateCcw,
  Sliders,
  ShieldCheck,
  Zap,
  Wrench,
  Users
} from "lucide-react"

export interface DealerNotificationSettingsState {
  desktopNotification: boolean
  unreadBadge: boolean
  pushTimeout: string
  communicationEmails: boolean
  announcementsUpdates: boolean
  disableAllSounds: boolean
  leadAlerts: boolean
  repairAlerts: boolean
  marketingAlerts: boolean
}

export default function NotificationSettings() {
  const [settings, setSettings] = useState<DealerNotificationSettingsState>({
    desktopNotification: true,
    unreadBadge: true,
    pushTimeout: "10 Minutes",
    communicationEmails: true,
    announcementsUpdates: true,
    disableAllSounds: false,
    leadAlerts: true,
    repairAlerts: true,
    marketingAlerts: true,
  })

  const [loading, setLoading] = useState<boolean>(true)
  const [saving, setSaving] = useState<boolean>(false)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false)

  // Fetch settings from API
  const fetchSettings = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/dealer/notifications/settings", { cache: "no-store" })
      if (!res.ok) throw new Error("Failed to load notification settings")
      const data = await res.json()

      if (data.settings) {
        setSettings({
          desktopNotification: Boolean(data.settings.desktopNotification),
          unreadBadge: Boolean(data.settings.unreadBadge),
          pushTimeout: data.settings.pushTimeout || "10 Minutes",
          communicationEmails: Boolean(data.settings.communicationEmails),
          announcementsUpdates: Boolean(data.settings.announcementsUpdates),
          disableAllSounds: Boolean(data.settings.disableAllSounds),
          leadAlerts: data.settings.leadAlerts !== undefined ? Boolean(data.settings.leadAlerts) : true,
          repairAlerts: data.settings.repairAlerts !== undefined ? Boolean(data.settings.repairAlerts) : true,
          marketingAlerts: data.settings.marketingAlerts !== undefined ? Boolean(data.settings.marketingAlerts) : true,
        })
        setHasUnsavedChanges(false)
      }
    } catch (err: any) {
      console.error(err)
      setError("Could not retrieve current settings. Using standard defaults.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  // Auto-hide success alert
  useEffect(() => {
    if (saveSuccess) {
      const timer = setTimeout(() => setSaveSuccess(null), 3500)
      return () => clearTimeout(timer)
    }
  }, [saveSuccess])

  // Toggle individual setting
  const toggleSetting = async (key: keyof DealerNotificationSettingsState) => {
    const nextVal = !settings[key]
    const updated = { ...settings, [key]: nextVal }
    setSettings(updated)
    setHasUnsavedChanges(true)

    // Immediate background persistence
    try {
      const res = await fetch("/api/dealer/notifications/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: nextVal }),
      })
      if (res.ok) {
        setSaveSuccess(`Updated ${formatKeyName(key)}`)
      }
    } catch (e) {
      // Keep unsaved changes indicator
    }
  }

  // Handle push timeout change
  const handleTimeoutChange = async (val: string) => {
    const updated = { ...settings, pushTimeout: val }
    setSettings(updated)
    setHasUnsavedChanges(true)

    try {
      const res = await fetch("/api/dealer/notifications/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ push_timeout: val, pushTimeout: val }),
      })
      if (res.ok) {
        setSaveSuccess("Push notification timeout updated")
      }
    } catch (e) {
      //
    }
  }

  // Save all preferences button
  const handleSaveAll = async () => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/dealer/notifications/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })
      if (!res.ok) throw new Error("Failed to save notification settings")

      setSaveSuccess("All notification preferences saved successfully!")
      setHasUnsavedChanges(false)
    } catch (err: any) {
      setError("Error saving preferences. Please verify your connection.")
    } finally {
      setSaving(false)
    }
  }

  // Reset to default settings
  const handleResetDefaults = async () => {
    const defaults: DealerNotificationSettingsState = {
      desktopNotification: true,
      unreadBadge: true,
      pushTimeout: "10 Minutes",
      communicationEmails: true,
      announcementsUpdates: true,
      disableAllSounds: false,
      leadAlerts: true,
      repairAlerts: true,
      marketingAlerts: true,
    }
    setSettings(defaults)
    setHasUnsavedChanges(true)

    try {
      await fetch("/api/dealer/notifications/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(defaults),
      })
      setSaveSuccess("Settings reset to defaults")
      setHasUnsavedChanges(false)
    } catch (e) {
      //
    }
  }

  const formatKeyName = (key: string) => {
    return key
      .replace(/([A-Z])/g, " $1")
      .toLowerCase()
      .replace(/^./, (str) => str.toUpperCase())
  }

  return (
    <div className="bg-gray-100 min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-red-600">
              Notification Settings
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Configure how and when you receive critical dealership notifications and alerts
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <button
              onClick={handleResetDefaults}
              className="px-3.5 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <RotateCcw size={14} />
              <span>Reset Defaults</span>
            </button>

            <button
              onClick={handleSaveAll}
              disabled={saving}
              className="px-5 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-md transition-all"
            >
              {saving ? (
                <>
                  <RefreshCw size={15} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={15} />
                  <span>Save All Settings</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Alerts / Feedback */}
        {saveSuccess && (
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-3 rounded-lg flex items-center gap-2 shadow-sm text-sm font-medium animate-fade-in">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <span>{saveSuccess}</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-300 text-red-800 px-4 py-3 rounded-lg flex items-center gap-2 shadow-sm text-sm font-medium">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Settings Container */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-md p-16 text-center space-y-3">
            <RefreshCw className="h-8 w-8 text-orange-500 animate-spin mx-auto" />
            <p className="text-sm font-medium text-gray-600">Loading notification preferences...</p>
          </div>
        ) : (
          <div
            className="rounded-xl px-5 py-7 sm:p-9 text-white space-y-10 shadow-xl"
            style={{
              background: `linear-gradient(135deg, #A10A0C 0%, #3B0404 100%)`,
            }}
          >
            {/* 1. In-App & Desktop Notifications Section */}
            <section className="space-y-6">
              <div className="flex items-center gap-2.5 pb-2 border-b border-white/20">
                <Bell className="h-5 w-5 text-orange-400" />
                <h2 className="text-xl sm:text-2xl font-bold">In-App & Desktop Notifications</h2>
              </div>

              <div className="space-y-6">
                {/* Desktop Notification */}
                <SettingItem
                  title="Enable Desktop Notification"
                  description="Receive instant push notifications for new messages, signed contracts, and repair updates."
                  isOn={settings.desktopNotification}
                  onToggle={() => toggleSetting("desktopNotification")}
                />

                {/* Unread Badge */}
                <SettingItem
                  title="Enable Unread Notification Badge"
                  description="Displays a red badge count on the dealership dashboard icon when new items arrive."
                  isOn={settings.unreadBadge}
                  onToggle={() => toggleSetting("unreadBadge")}
                />

                {/* Timeout Selector */}
                <div>
                  <h3 className="text-base sm:text-lg font-semibold mb-1 flex items-center gap-2">
                    <Clock size={18} className="text-orange-400" />
                    <span>Push Notification Timeout</span>
                  </h3>
                  <p className="text-gray-300 text-xs sm:text-sm mb-3">
                    Duration floating notifications remain visible on screen before auto-dismissing.
                  </p>
                  <div className="relative max-w-xs">
                    <select
                      value={settings.pushTimeout}
                      onChange={(e) => handleTimeoutChange(e.target.value)}
                      className="w-full bg-white text-gray-900 font-medium px-4 py-2.5 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-sm text-sm"
                    >
                      <option value="5 Minutes">5 Minutes</option>
                      <option value="10 Minutes">10 Minutes (Recommended)</option>
                      <option value="15 Minutes">15 Minutes</option>
                      <option value="30 Minutes">30 Minutes</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 pointer-events-none" size={18} />
                  </div>
                </div>
              </div>
            </section>

            {/* 2. Email Notifications Section */}
            <section className="space-y-6">
              <div className="flex items-center gap-2.5 pb-2 border-b border-white/20">
                <Mail className="h-5 w-5 text-orange-400" />
                <h2 className="text-xl sm:text-2xl font-bold">Email Notifications</h2>
              </div>

              <div className="space-y-6">
                <SettingItem
                  title="Communication Emails"
                  description="Receive emails for customer inquiries, equipment purchase agreements, and lease contracts."
                  isOn={settings.communicationEmails}
                  onToggle={() => toggleSetting("communicationEmails")}
                />

                <SettingItem
                  title="Announcements and Product Updates"
                  description="Receive periodic emails about platform feature updates, system upgrades, and seasonal promos."
                  isOn={settings.announcementsUpdates}
                  onToggle={() => toggleSetting("announcementsUpdates")}
                />
              </div>
            </section>

            {/* 3. Audio & Sounds Section */}
            <section className="space-y-6">
              <div className="flex items-center gap-2.5 pb-2 border-b border-white/20">
                {settings.disableAllSounds ? (
                  <VolumeX className="h-5 w-5 text-gray-400" />
                ) : (
                  <Volume2 className="h-5 w-5 text-orange-400" />
                )}
                <h2 className="text-xl sm:text-2xl font-bold">Sounds & Chimes</h2>
              </div>

              <SettingItem
                title="Disable All Notification Sounds"
                description="Mute all chime audio for incoming notifications, inquiries, and tractor status changes."
                isOn={settings.disableAllSounds}
                onToggle={() => toggleSetting("disableAllSounds")}
              />
            </section>

            {/* 4. Module Alert Subscriptions */}
            <section className="space-y-6">
              <div className="flex items-center gap-2.5 pb-2 border-b border-white/20">
                <Zap className="h-5 w-5 text-orange-400" />
                <h2 className="text-xl sm:text-2xl font-bold">Dealership Operational Alerts</h2>
              </div>

              <div className="space-y-6">
                <SettingItem
                  title="Lead Inquiries & Conversion Alerts"
                  description="Immediate alerts when a farmer requests a tractor demo or submits a financing application."
                  isOn={settings.leadAlerts}
                  onToggle={() => toggleSetting("leadAlerts")}
                />

                <SettingItem
                  title="Emergency Repair & Service Requests"
                  description="High-priority alerts when a tractor in your territory logs a hydraulic or engine fault."
                  isOn={settings.repairAlerts}
                  onToggle={() => toggleSetting("repairAlerts")}
                />

                <SettingItem
                  title="Marketing Campaign Milestones"
                  description="Daily summaries of campaign budget utilization, impression peaks, and click rates."
                  isOn={settings.marketingAlerts}
                  onToggle={() => toggleSetting("marketingAlerts")}
                />
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  )
}

const SettingItem = ({
  title,
  description,
  isOn,
  onToggle,
}: {
  title: string
  description: string
  isOn: boolean
  onToggle: () => void
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
      <div className="flex-1">
        <h3 className="text-base sm:text-lg font-semibold mb-1 text-white">{title}</h3>
        <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">{description}</p>
      </div>
      <div className="sm:pt-1">
        <button
          onClick={onToggle}
          type="button"
          role="switch"
          aria-checked={isOn}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 focus:ring-offset-red-950 ${
            isOn ? "bg-orange-500" : "bg-gray-500/70"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-200 ease-in-out ${
              isOn ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>
    </div>
  )
}
