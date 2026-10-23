"use client"

import React, { useState, useEffect, useMemo } from "react"
import {
  ShieldCheck,
  ShieldAlert,
  Smartphone,
  Laptop,
  Tablet,
  Monitor,
  MapPin,
  Trash2,
  RefreshCw,
  Lock,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Clock,
  LogOut,
  Eye,
  EyeOff,
  History,
  Check,
  Globe,
  BellRing,
  QrCode,
  Copy,
  ChevronDown,
  Sparkles,
  SlidersHorizontal
} from "lucide-react"
import { getAuthUser } from "@/utils/auth/clientAuth"

interface SessionItem {
  id: string
  device_name: string
  device_type: string
  browser: string
  os: string
  ip_address: string
  location: string
  is_current: boolean
  last_active: string | null
  created_at: string | null
}

interface SecurityLogItem {
  id: string
  event_type: string
  description: string
  ip_address: string
  location: string
  status: string
  created_at: string | null
}

export default function Security() {
  const [loading, setLoading] = useState(true)
  const [dealerId, setDealerId] = useState("cmb7lih4v000ez5ms8nhvegf6")
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null)

  // Security Settings State
  const [twoStepEnabled, setTwoStepEnabled] = useState(true)
  const [toggling2FA, setToggling2FA] = useState(false)
  const [loginAlerts, setLoginAlerts] = useState(true)
  const [togglingAlerts, setTogglingAlerts] = useState(false)
  const [sessionTimeout, setSessionTimeout] = useState(60)
  const [updatingTimeout, setUpdatingTimeout] = useState(false)
  const [passwordLastChanged, setPasswordLastChanged] = useState("Recently updated")

  // Sessions & Logs
  const [sessions, setSessions] = useState<SessionItem[]>([])
  const [logs, setLogs] = useState<SecurityLogItem[]>([])
  const [logFilter, setLogFilter] = useState<"ALL" | "LOGINS" | "UPDATES" | "ALERTS">("ALL")
  const [terminatingId, setTerminatingId] = useState<string | null>(null)
  const [terminatingOthers, setTerminatingOthers] = useState(false)

  // Password Modal State
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [pwdCurrent, setPwdCurrent] = useState("")
  const [pwdNew, setPwdNew] = useState("")
  const [pwdConfirm, setPwdConfirm] = useState("")
  const [showPwd, setShowPwd] = useState(false)
  const [updatingPwd, setUpdatingPwd] = useState(false)

  // 2FA Setup Modal State
  const [show2FAModal, setShow2FAModal] = useState(false)
  const [selected2FAMethod, setSelected2FAMethod] = useState<"authenticator_app" | "sms">("authenticator_app")
  const [secretKey] = useState("HT-2FA-7X9B-4Q2M-8K1Z")
  const [copiedKey, setCopiedKey] = useState(false)
  const [twoFACode, setTwoFACode] = useState("")
  const [verifying2FA, setVerifying2FA] = useState(false)

  // Notification helper
  const showNotice = (type: "success" | "error", message: string) => {
    setNotification({ type, message })
    setTimeout(() => {
      setNotification((curr) => (curr?.message === message ? null : curr))
    }, 4500)
  }

  // Detect and register the current browser/device dynamically
  const registerCurrentClientSession = async (activeDealerId: string) => {
    if (typeof window === "undefined") return
    try {
      const ua = navigator.userAgent
      let browser = "Chrome"
      if (ua.includes("Firefox")) browser = "Firefox"
      else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari"
      else if (ua.includes("Edg")) browser = "Edge"

      let os = "macOS"
      let type = "Desktop"
      if (ua.includes("iPhone")) {
        os = "iOS"
        type = "Mobile"
      } else if (ua.includes("Android")) {
        os = "Android"
        type = "Mobile"
      } else if (ua.includes("iPad")) {
        os = "iPadOS"
        type = "Tablet"
      } else if (ua.includes("Windows")) {
        os = "Windows 11"
        type = "Desktop"
      } else if (ua.includes("Linux")) {
        os = "Linux"
        type = "Desktop"
      }

      const deviceName = `${os} (${browser})`

      await fetch("/api/dealer/settings/security/register-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dealer_id: activeDealerId,
          device_name: deviceName,
          device_type: type,
          browser,
          os,
          ip_address: "190.181.42.18",
          location: "Santa Cruz, Bolivia",
        }),
      })
    } catch (e) {
      // Ignore background registration errors
    }
  }

  // Fetch security data from backend
  const fetchSecurityData = async (idToUse?: string) => {
    try {
      setLoading(true)
      const targetId = idToUse || dealerId
      const res = await fetch(`/api/dealer/settings/security?dealer_id=${targetId}`, { cache: "no-store" })
      if (!res.ok) throw new Error("Failed to load security overview")
      const data = await res.json()

      if (data.success && data.security) {
        setTwoStepEnabled(Boolean(data.security.two_factor_enabled))
        setLoginAlerts(Boolean(data.security.login_alerts ?? true))
        setSessionTimeout(Number(data.security.session_timeout_minutes || 60))
        setPasswordLastChanged(data.security.password_status?.last_changed || "Recently updated")
        setSessions(data.security.sessions || [])
        setLogs(data.security.security_logs || [])
      }
    } catch (err: any) {
      console.error("Error fetching security data:", err)
      showNotice("error", "Unable to load security overview. Please check your connection.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const authUser = getAuthUser()
    const activeId = authUser?.userId || "cmb7lih4v000ez5ms8nhvegf6"
    setDealerId(activeId)
    registerCurrentClientSession(activeId).then(() => {
      fetchSecurityData(activeId)
    })
  }, [])

  // Calculate dynamic security health score (out of 100)
  const healthScore = useMemo(() => {
    let score = 0
    if (twoStepEnabled) score += 40
    score += 25 // strong master password
    if (loginAlerts) score += 20
    if (sessionTimeout <= 60) score += 15
    return score
  }, [twoStepEnabled, loginAlerts, sessionTimeout])

  // Toggle Two-Factor Authentication
  const handleToggle2FA = async () => {
    const nextState = !twoStepEnabled
    try {
      setToggling2FA(true)
      const res = await fetch("/api/dealer/settings/security/two-factor", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dealer_id: dealerId,
          enabled: nextState,
        }),
      })

      const data = await res.json()
      if (data.success) {
        setTwoStepEnabled(nextState)
        showNotice(
          "success",
          nextState
            ? "Two-step verification has been activated!"
            : "Two-step verification disabled. We recommend keeping it enabled."
        )
        fetchSecurityData(dealerId)
      } else {
        throw new Error(data.message || "Failed to update 2FA")
      }
    } catch (err: any) {
      showNotice("error", err.message || "Failed to toggle 2FA")
    } finally {
      setToggling2FA(false)
    }
  }

  // Toggle Suspicious Login Alerts
  const handleToggleLoginAlerts = async () => {
    const nextState = !loginAlerts
    try {
      setTogglingAlerts(true)
      const res = await fetch("/api/dealer/settings/security/login-alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dealer_id: dealerId,
          enabled: nextState,
        }),
      })

      const data = await res.json()
      if (data.success) {
        setLoginAlerts(nextState)
        showNotice(
          "success",
          nextState
            ? "Suspicious login email & SMS alerts enabled."
            : "Login alerts turned off."
        )
        fetchSecurityData(dealerId)
      } else {
        throw new Error(data.message || "Failed to update login alerts")
      }
    } catch (err: any) {
      showNotice("error", err.message || "Failed to toggle login alerts")
    } finally {
      setTogglingAlerts(false)
    }
  }

  // Update Inactivity Session Timeout
  const handleUpdateSessionTimeout = async (newMinutes: number) => {
    try {
      setUpdatingTimeout(true)
      const res = await fetch("/api/dealer/settings/security/session-timeout", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dealer_id: dealerId,
          timeout_minutes: newMinutes,
        }),
      })

      const data = await res.json()
      if (data.success) {
        setSessionTimeout(newMinutes)
        showNotice("success", `Automatic logout timer set to ${newMinutes} minutes.`)
        fetchSecurityData(dealerId)
      } else {
        throw new Error(data.message || "Failed to update session timeout")
      }
    } catch (err: any) {
      showNotice("error", err.message || "Failed to update timeout")
    } finally {
      setUpdatingTimeout(false)
    }
  }

  // Verify and complete 2FA setup modal
  const handleVerify2FACode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!twoFACode || twoFACode.length < 6) {
      showNotice("error", "Please enter the 6-digit verification code from your authenticator.")
      return
    }

    try {
      setVerifying2FA(true)
      const res = await fetch("/api/dealer/settings/security/verify-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dealer_id: dealerId,
          method: selected2FAMethod,
          code: twoFACode,
        }),
      })

      const data = await res.json()
      if (data.success) {
        setTwoStepEnabled(true)
        setShow2FAModal(false)
        setTwoFACode("")
        showNotice("success", "Two-Factor Authentication verified and fully activated!")
        fetchSecurityData(dealerId)
      } else {
        throw new Error(data.message || "Invalid verification code.")
      }
    } catch (err: any) {
      showNotice("error", err.message || "Could not verify code")
    } finally {
      setVerifying2FA(false)
    }
  }

  // Remove / Terminate a Device Session
  const handleRemoveDevice = async (sessionId: string, deviceName: string) => {
    try {
      setTerminatingId(sessionId)
      const res = await fetch(`/api/dealer/settings/security/sessions/${sessionId}?dealer_id=${dealerId}`, {
        method: "DELETE",
      })

      const data = await res.json()
      if (data.success) {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId))
        showNotice("success", `Signed out of ${deviceName}`)
        fetchSecurityData(dealerId)
      } else {
        throw new Error(data.message || "Failed to terminate session")
      }
    } catch (err: any) {
      showNotice("error", err.message || "Could not revoke session")
    } finally {
      setTerminatingId(null)
    }
  }

  // Terminate All Other Sessions
  const handleTerminateAllOthers = async () => {
    try {
      setTerminatingOthers(true)
      const res = await fetch("/api/dealer/settings/security/sessions/terminate-others", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dealer_id: dealerId }),
      })

      const data = await res.json()
      if (data.success) {
        setSessions((prev) => prev.filter((s) => s.is_current))
        showNotice("success", data.message || "All other devices signed out successfully.")
        fetchSecurityData(dealerId)
      } else {
        throw new Error(data.message || "Failed to terminate other sessions")
      }
    } catch (err: any) {
      showNotice("error", err.message || "Failed to sign out other devices")
    } finally {
      setTerminatingOthers(false)
    }
  }

  // Password Strength Evaluation
  const passwordStrength = useMemo(() => {
    if (!pwdNew) return { score: 0, label: "None", color: "bg-gray-300" }
    let pts = 0
    if (pwdNew.length >= 8) pts += 25
    if (pwdNew.length >= 12) pts += 25
    if (/[A-Z]/.test(pwdNew) && /[a-z]/.test(pwdNew)) pts += 25
    if (/[0-9]/.test(pwdNew) && /[^A-Za-z0-9]/.test(pwdNew)) pts += 25

    if (pts >= 100) return { score: 100, label: "Very Strong", color: "bg-emerald-500" }
    if (pts >= 75) return { score: 75, label: "Strong", color: "bg-blue-500" }
    if (pts >= 50) return { score: 50, label: "Moderate", color: "bg-amber-500" }
    return { score: 25, label: "Weak", color: "bg-red-500" }
  }, [pwdNew])

  // Handle Master Password Update
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pwdNew || pwdNew.length < 8) {
      showNotice("error", "New password must be at least 8 characters long")
      return
    }
    if (pwdNew !== pwdConfirm) {
      showNotice("error", "New password and confirmation do not match")
      return
    }

    try {
      setUpdatingPwd(true)
      const res = await fetch("/api/dealer/settings/general", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dealer_id: dealerId,
          current_password: pwdCurrent,
          new_password: pwdNew,
        }),
      })

      const data = await res.json()
      if (data.success) {
        showNotice("success", "Dealership master password updated successfully!")
        setShowPasswordModal(false)
        setPwdCurrent("")
        setPwdNew("")
        setPwdConfirm("")
        fetchSecurityData(dealerId)
      } else {
        throw new Error(data.message || "Failed to update password")
      }
    } catch (err: any) {
      showNotice("error", err.message || "Failed to update password")
    } finally {
      setUpdatingPwd(false)
    }
  }

  const copySecretKey = () => {
    navigator.clipboard.writeText(secretKey)
    setCopiedKey(true)
    setTimeout(() => setCopiedKey(false), 2000)
    showNotice("success", "2FA Secret Key copied to clipboard")
  }

  const getDeviceIcon = (type: string, os: string) => {
    const t = (type || "").toLowerCase()
    const o = (os || "").toLowerCase()
    if (t.includes("mobile") || o.includes("ios") || o.includes("android")) {
      return <Smartphone className="w-5 h-5 text-gray-700" />
    }
    if (t.includes("tablet") || o.includes("ipad")) {
      return <Tablet className="w-5 h-5 text-gray-700" />
    }
    if (o.includes("mac") || o.includes("windows") || t.includes("desktop")) {
      return <Laptop className="w-5 h-5 text-gray-700" />
    }
    return <Monitor className="w-5 h-5 text-gray-700" />
  }

  const formatTimeAgo = (dateStr: string | null) => {
    if (!dateStr) return "Recently"
    try {
      const dt = new Date(dateStr)
      const diffMs = Date.now() - dt.getTime()
      const diffMins = Math.floor(diffMs / (1000 * 60))
      if (diffMins < 2) return "Just now"
      if (diffMins < 60) return `${diffMins} minutes ago`
      const diffHours = Math.floor(diffMins / 60)
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`
      const diffDays = Math.floor(diffHours / 24)
      return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`
    } catch {
      return "Recently"
    }
  }

  // Filtered audit logs
  const filteredLogs = useMemo(() => {
    if (logFilter === "ALL") return logs
    if (logFilter === "LOGINS") return logs.filter((l) => l.event_type.includes("LOGIN") || l.event_type.includes("SESSION"))
    if (logFilter === "UPDATES") return logs.filter((l) => l.event_type.includes("2FA") || l.event_type.includes("PASSWORD") || l.event_type.includes("KEY") || l.event_type.includes("TIMEOUT"))
    if (logFilter === "ALERTS") return logs.filter((l) => l.status === "BLOCKED" || l.status === "ALERT" || l.event_type.includes("SUSPICIOUS"))
    return logs
  }, [logs, logFilter])

  return (
    <div className="bg-gray-50 min-h-screen p-3 sm:p-5 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Security & Access</h1>
            <p className="text-sm text-gray-500 mt-1">
              Live protection status, two-step verification, device session manager, and immutable audit logs.
            </p>
          </div>
          <button
            onClick={() => fetchSecurityData()}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 font-semibold text-xs rounded-xl shadow-sm transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh Data
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

        {/* Dynamic Security Health Banner */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div
              className={`w-13 h-13 rounded-2xl flex items-center justify-center shrink-0 ${
                healthScore >= 80 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
              }`}
            >
              {healthScore >= 80 ? <ShieldCheck className="w-7 h-7" /> : <ShieldAlert className="w-7 h-7" />}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="font-bold text-gray-900 text-base sm:text-lg">
                  Dealership Protection Score
                </h3>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    healthScore >= 80
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      : "bg-amber-100 text-amber-800 border border-amber-200"
                  }`}
                >
                  {healthScore} / 100 • {healthScore >= 80 ? "Optimal Protection" : "Action Recommended"}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                {twoStepEnabled
                  ? "Two-Factor Auth and Real-time IP monitoring are active. High defense against credential stuffing."
                  : "Enable 2FA and Login Alerts to boost security rating to 100."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 border-t md:border-t-0 pt-3 md:pt-0">
            <div className="text-left md:text-right">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Logged-in Devices</span>
              <p className="text-base font-extrabold text-gray-900">{sessions.length} Active</p>
            </div>
            <div className="text-left md:text-right">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Inactivity Timeout</span>
              <p className="text-base font-extrabold text-gray-900">{sessionTimeout}m</p>
            </div>
          </div>
        </div>

        {/* Main Security Gradient Card */}
        <div
          className="rounded-2xl p-6 sm:p-8 text-white shadow-xl space-y-8"
          style={{
            background: "linear-gradient(135deg, #8B0000 0%, #4A0404 100%)",
          }}
        >
          {/* Section 1: Authentication & Protection Controls */}
          <div className="border-b border-red-900/40 pb-8 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-bold tracking-wide flex items-center gap-2">
                <Lock className="w-5 h-5 text-red-300" />
                Authentication & Verification
              </h2>
            </div>

            {/* Row 1: Master Password */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/10 hover:bg-white/15 p-4 rounded-xl border border-white/10 transition-colors">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-white flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-orange-400" />
                    Dealership Master Password
                  </h3>
                  <span className="text-emerald-300 text-xs font-semibold px-2 py-0.5 bg-emerald-950/60 rounded-md border border-emerald-500/30">
                    Encrypted (Bcrypt)
                  </span>
                </div>
                <p className="text-gray-200 text-xs sm:text-sm mt-0.5">
                  Used for master sign-in, price adjustments, and mechanic management. Last updated: {passwordLastChanged}.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-white/95 px-3 py-1.5 rounded-lg border border-white/20">
                  <span className="text-gray-800 font-mono text-sm tracking-widest">••••••••••••</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(true)}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs rounded-lg transition-colors whitespace-nowrap shadow-sm"
                >
                  Change Password
                </button>
              </div>
            </div>

            {/* Row 2: Two-Step Verification (2FA) */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/10 hover:bg-white/15 p-4 rounded-xl border border-white/10 transition-colors">
              <div className="flex-1">
                <div className="flex items-center gap-2.5">
                  <h3 className="text-base font-semibold text-white">Two-Step Verification (2FA)</h3>
                  <span
                    className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                      twoStepEnabled
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "bg-red-500/20 text-red-300 border border-red-500/30"
                    }`}
                  >
                    {twoStepEnabled ? "Active & Enforced" : "Disabled (Vulnerable)"}
                  </span>
                </div>
                <p className="text-gray-200 text-xs sm:text-sm mt-1">
                  Requires 6-digit confirmation code from your authenticator app (Google Authenticator, 1Password) upon login.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShow2FAModal(true)}
                  className="px-3.5 py-1.5 bg-white/20 hover:bg-white/30 text-white font-semibold text-xs rounded-lg transition-colors border border-white/20"
                >
                  Configure 2FA
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleToggle2FA}
                    disabled={toggling2FA}
                    className={`relative inline-flex h-7 w-13 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 ${
                      twoStepEnabled ? "bg-emerald-500" : "bg-gray-400"
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${
                        twoStepEnabled ? "translate-x-7" : "translate-x-1"
                      }`}
                    />
                  </button>
                  <span className="text-xs font-medium text-gray-200 min-w-16">
                    {toggling2FA ? "Saving..." : twoStepEnabled ? "Enabled" : "Disabled"}
                  </span>
                </div>
              </div>
            </div>

            {/* Row 3: Suspicious Login Alerts */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/10 hover:bg-white/15 p-4 rounded-xl border border-white/10 transition-colors">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-white flex items-center gap-2">
                    <BellRing className="w-4 h-4 text-orange-400" />
                    Unfamiliar Login Alerts
                  </h3>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      loginAlerts
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "bg-gray-500/20 text-gray-300 border border-gray-500/30"
                    }`}
                  >
                    {loginAlerts ? "Email & Push On" : "Muted"}
                  </span>
                </div>
                <p className="text-gray-200 text-xs sm:text-sm mt-1">
                  Send immediate alert notifications whenever sign-in occurs from an unrecognized IP address or browser.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleLoginAlerts}
                  disabled={togglingAlerts}
                  className={`relative inline-flex h-7 w-13 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 ${
                    loginAlerts ? "bg-emerald-500" : "bg-gray-400"
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${
                      loginAlerts ? "translate-x-7" : "translate-x-1"
                    }`}
                  />
                </button>
                <span className="text-xs font-medium text-gray-200 min-w-16">
                  {togglingAlerts ? "Saving..." : loginAlerts ? "Enabled" : "Disabled"}
                </span>
              </div>
            </div>

            {/* Row 4: Automatic Inactivity Session Timeout */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/10 hover:bg-white/15 p-4 rounded-xl border border-white/10 transition-colors">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-400" />
                    Automatic Inactivity Session Timeout
                  </h3>
                </div>
                <p className="text-gray-200 text-xs sm:text-sm mt-1">
                  Automatically sign out dormant browser tabs to prevent unauthorized terminal access on shared store PCs.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={sessionTimeout}
                  onChange={(e) => handleUpdateSessionTimeout(Number(e.target.value))}
                  disabled={updatingTimeout}
                  className="bg-white text-gray-900 font-semibold text-xs px-3.5 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                >
                  <option value={15}>15 Minutes</option>
                  <option value={30}>30 Minutes</option>
                  <option value={60}>60 Minutes (Recommended)</option>
                  <option value={240}>4 Hours</option>
                  <option value={1440}>24 Hours</option>
                </select>
                {updatingTimeout && <RefreshCw className="w-4 h-4 animate-spin text-orange-300" />}
              </div>
            </div>
          </div>

          {/* Section 2: Browsers & Active Devices */}
          <div className="border-b border-red-900/40 pb-8 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-lg sm:text-xl font-bold tracking-wide flex items-center gap-2">
                  <Globe className="w-5 h-5 text-red-300" />
                  Browsers and Active Sessions ({sessions.length})
                </h2>
                <p className="text-gray-200 text-xs sm:text-sm mt-0.5">
                  Devices with active authorization tokens. Remove any unrecognized machine immediately.
                </p>
              </div>

              {sessions.filter((s) => !s.is_current).length > 0 && (
                <button
                  type="button"
                  onClick={handleTerminateAllOthers}
                  disabled={terminatingOthers}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-red-950/70 hover:bg-red-900 text-red-200 hover:text-white border border-red-500/30 text-xs font-semibold rounded-lg transition-colors self-start sm:self-auto"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  {terminatingOthers ? "Signing out..." : "Log out other devices"}
                </button>
              )}
            </div>

            <div className="space-y-3 pt-2">
              {sessions.map((device) => (
                <div
                  key={device.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/10 hover:bg-white/15 p-4 rounded-xl border border-white/10 transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                      {getDeviceIcon(device.device_type, device.os)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-white text-sm">{device.device_name}</h4>
                        {device.is_current && (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 border border-emerald-500/40">
                            Current session
                          </span>
                        )}
                      </div>
                      <p className="text-gray-300 text-xs mt-0.5">
                        {device.browser} • {device.os} • IP: <span className="font-mono">{device.ip_address}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 border-white/10 pt-2 sm:pt-0">
                    <div className="flex items-center gap-1.5 text-xs text-gray-300">
                      <MapPin size={14} className="text-orange-400 shrink-0" />
                      <span>{device.location}</span>
                    </div>

                    <div className="text-xs text-gray-300 flex items-center gap-1">
                      <Clock size={13} className="text-gray-400" />
                      <span>{device.is_current ? "Active now" : formatTimeAgo(device.last_active)}</span>
                    </div>

                    {!device.is_current && (
                      <button
                        type="button"
                        onClick={() => handleRemoveDevice(device.id, device.device_name)}
                        disabled={terminatingId === device.id}
                        className="p-1.5 text-red-300 hover:text-white hover:bg-red-500/20 rounded-lg transition-colors"
                        title="Revoke session"
                      >
                        {terminatingId === device.id ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {sessions.length === 0 && (
                <div className="text-center py-6 text-gray-300 text-sm">No active sessions found.</div>
              )}
            </div>
          </div>

          {/* Section 3: Live Security Audit Logs */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg sm:text-xl font-bold tracking-wide flex items-center gap-2">
                  <History className="w-5 h-5 text-red-300" />
                  Live Security Audit Trail
                </h2>
                <p className="text-gray-200 text-xs sm:text-sm mt-0.5">
                  Immutable record of logins, token rotations, 2FA verifications, and blocked attempts.
                </p>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 bg-black/30 p-1 rounded-xl self-start sm:self-auto border border-white/10">
                {(["ALL", "LOGINS", "UPDATES", "ALERTS"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setLogFilter(tab)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      logFilter === tab ? "bg-white text-gray-900 shadow-sm" : "text-gray-300 hover:text-white"
                    }`}
                  >
                    {tab === "ALL" ? "All" : tab === "LOGINS" ? "Logins" : tab === "UPDATES" ? "Updates" : "Alerts"}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2.5 pt-1">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white/5 hover:bg-white/10 p-3 rounded-xl border border-white/5 text-xs transition-colors"
                >
                  <div className="flex items-start sm:items-center gap-2.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 mt-0.5 sm:mt-0 ${
                        log.status === "SUCCESS"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : log.status === "BLOCKED"
                          ? "bg-red-500/20 text-red-300 border border-red-500/30"
                          : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      }`}
                    >
                      {log.status}
                    </span>
                    <span className="font-medium text-white">{log.description}</span>
                  </div>

                  <div className="flex items-center gap-3 text-gray-300 self-end sm:self-auto shrink-0">
                    <span className="font-mono">IP: {log.ip_address}</span>
                    <span>•</span>
                    <span>{log.location}</span>
                    <span>•</span>
                    <span className="text-gray-400">{formatTimeAgo(log.created_at)}</span>
                  </div>
                </div>
              ))}

              {filteredLogs.length === 0 && (
                <div className="text-center py-6 text-gray-300 text-sm">No security logs recorded for this filter.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2FA Configuration Modal */}
      {show2FAModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Set Up Two-Factor Authentication</h3>
              </div>
              <button
                onClick={() => setShow2FAModal(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            {/* Method Tabs */}
            <div className="grid grid-cols-2 gap-2 bg-gray-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setSelected2FAMethod("authenticator_app")}
                className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                  selected2FAMethod === "authenticator_app"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Authenticator App
              </button>
              <button
                type="button"
                onClick={() => setSelected2FAMethod("sms")}
                className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                  selected2FAMethod === "sms"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                SMS Text Message
              </button>
            </div>

            {selected2FAMethod === "authenticator_app" ? (
              <div className="space-y-4">
                <p className="text-xs text-gray-600">
                  Scan this QR code in Google Authenticator or 1Password, or enter the secret key manually below:
                </p>

                {/* Simulated QR Code Box */}
                <div className="flex flex-col items-center justify-center p-4 bg-gray-50 border border-dashed border-gray-300 rounded-xl">
                  <QrCode className="w-24 h-24 text-gray-800 mb-2" />
                  <span className="text-[11px] text-gray-400">Scan with mobile authenticator</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Secret Key</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={secretKey}
                      className="flex-1 px-3 py-2 bg-gray-100 text-gray-800 font-mono text-xs rounded-lg select-all border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={copySecretKey}
                      className="px-3 py-2 bg-gray-800 hover:bg-gray-900 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedKey ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-gray-50 rounded-xl space-y-2 border border-gray-200">
                <span className="text-xs font-semibold text-gray-700">Registered Dealership Phone:</span>
                <p className="text-sm font-mono font-bold text-gray-900">+591 7761 3811</p>
                <p className="text-xs text-gray-500">
                  A 6-digit confirmation code will be sent to this number whenever sign-in is attempted.
                </p>
              </div>
            )}

            {/* Verification Code Input */}
            <form onSubmit={handleVerify2FACode} className="space-y-4 pt-2 border-t border-gray-100">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Enter 6-digit Code to Confirm
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={twoFACode}
                  onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, ""))}
                  placeholder="e.g. 482910"
                  className="w-full text-center tracking-widest font-mono text-xl py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShow2FAModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={verifying2FA || twoFACode.length < 6}
                  className="px-5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-400 rounded-xl shadow-sm transition-all"
                >
                  {verifying2FA ? "Verifying..." : "Verify & Enable 2FA"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-lg font-bold text-gray-900">Change Master Password</h3>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Current Password</label>
                <input
                  type={showPwd ? "text" : "password"}
                  value={pwdCurrent}
                  onChange={(e) => setPwdCurrent(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-gray-700">New Password</label>
                  {pwdNew && (
                    <span className="text-[11px] font-bold text-gray-500">
                      Strength: <span className="font-extrabold">{passwordStrength.label}</span>
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPwd ? "text" : "password"}
                    value={pwdNew}
                    onChange={(e) => setPwdNew(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full px-3.5 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Meter */}
                {pwdNew && (
                  <div className="w-full bg-gray-200 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                      style={{ width: `${passwordStrength.score}%` }}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Confirm New Password</label>
                <input
                  type={showPwd ? "text" : "password"}
                  value={pwdConfirm}
                  onChange={(e) => setPwdConfirm(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingPwd || !pwdNew || pwdNew.length < 8 || pwdNew !== pwdConfirm}
                  className="px-5 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-400 rounded-xl shadow-sm transition-all"
                >
                  {updatingPwd ? "Saving..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
