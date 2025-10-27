"use client"
import { useState } from "react"
import { Eye, EyeOff, Copy, Check, AlertTriangle } from "lucide-react"

export default function GeneralSettings() {
  const [formData, setFormData] = useState({
    name: "Hola Farmer",
    token: "a1b2c3d4e5f6g7h8",
    timezone: "Santa cruz, Bolivia 07:20 PM",
    blockedIPs: "Not blocking any IP addresses by default",
    email: "dealer@holatractor.com",
    currentPassword: "",
    newPassword: "",
    deleteConfirmation: "",
  })

  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
  })

  const [copied, setCopied] = useState(false)
  const [showDeleteWarning, setShowDeleteWarning] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleUpdate = (type: string) => {
    console.log(`Updating ${type}...`)
    // Add success notification here
  }

  const handleDeleteAccount = () => {
    if (formData.deleteConfirmation === formData.email) {
      console.log("Deleting account...")
      // Add delete logic here
    } else {
      alert("Email doesn't match!")
    }
  }

  const copyToken = () => {
    navigator.clipboard.writeText(formData.token)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const togglePasswordVisibility = (field: 'current' | 'new') => {
    setShowPassword(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  return (
    <div className="bg-gray-100 min-h-screen p-3 sm:p-4 md:p-6">
      <div className=" mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-red-600 mb-4 sm:mb-6 lg:mb-8">General Settings</h1>

        <div
          className="rounded-lg p-3 sm:p-4 lg:p-5 text-white space-y-8 sm:space-y-10
"
          style={{
            background: `linear-gradient(135deg, #A10A0C 0%, #3B0404 100%)`,
          }}
        >
          {/* Name Section */}
          <div className="border-b border-red-900/30 pb-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div className="flex-1 lg:mr-4">
                <h3 className="text-base sm:text-lg font-semibold mb-1">Name</h3>
                <p className="text-gray-200 text-xs sm:text-sm">Used for display purposes only.</p>
              </div>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="bg-white text-red-600 px-5 py-3 sm:py-3.5 rounded-lg w-full lg:w-80 focus:outline-none focus:ring-2 focus:ring-orange-500 text-base sm:text-lg"
              />
            </div>
          </div>

          {/* Token Section with Copy Button */}
          <div className="border-b border-red-900/30 pb-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div className="flex-1 lg:mr-4">
                <h3 className="text-base sm:text-lg font-semibold mb-1">Token</h3>
                <p className="text-gray-200 text-xs sm:text-sm">Send events from the server or track subdomains.</p>
              </div>
              <div className="flex gap-2 w-full lg:w-auto">
                <input
                  type="text"
                  value={formData.token}
                  onChange={(e) => handleInputChange("token", e.target.value)}
                  className="bg-white text-red-600 px-4 py-2.5 sm:py-3 rounded-lg flex-1 lg:w-64 focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono text-xs sm:text-sm"
                  readOnly
                />
                {/* <button
                  onClick={copyToken}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg transition-colors flex-shrink-0"
                  title="Copy token"
                >
                  {copied ? <Check className="w-4 h-4 sm:w-5 sm:h-5" /> : <Copy className="w-4 h-4 sm:w-5 sm:h-5" />}
                </button> */}
              </div>
            </div>
          </div>

          {/* Timezone Section */}
          <div className="border-b border-red-900/30 pb-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div className="flex-1 lg:mr-4">
                <h3 className="text-base sm:text-lg font-semibold mb-1">Timezone</h3>
                <p className="text-gray-200 text-xs sm:text-sm mb-1">All the dates and charts you see align with this time zone. Be cautious when updating, as it will change as well.</p>
                <p className="text-gray-300 text-xs">Hash salt resets</p>
              </div>
              <input
                type="text"
                value={formData.timezone}
                onChange={(e) => handleInputChange("timezone", e.target.value)}
                className="bg-white text-red-600 px-4 py-2.5 sm:py-3 rounded-lg w-full lg:w-80 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm sm:text-base"
              />
            </div>
          </div>

          {/* Blocked IPs Section */}
          <div className="border-b border-red-900/30 pb-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div className="flex-1 lg:mr-4">
                <h3 className="text-base sm:text-lg font-semibold mb-1">Blocked IP addresses</h3>
                <p className="text-gray-200 text-xs sm:text-sm">Traffic from these IP addresses will be blocked. Should be a comma-separated list.</p>
              </div>
              <textarea
                value={formData.blockedIPs}
                onChange={(e) => handleInputChange("blockedIPs", e.target.value)}
                rows={3}
                className="bg-white text-red-600 px-4 py-2.5 sm:py-3 rounded-lg w-full lg:w-80 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none text-sm sm:text-base"
              />
            </div>
          </div>

          {/* USER DETAILS SECTION */}
          <div className="pt-4">
            <h2 className="text-lg sm:text-xl font-bold mb-2">USER DETAILS</h2>
            <p className="text-gray-200 text-xs sm:text-sm mb-6">Update your email, password, or delete your account.</p>

            {/* Email */}
            <div className="mb-6 border-b border-red-900/30 pb-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex-1 lg:mr-4">
                  <h3 className="text-base sm:text-lg font-semibold mb-2">Email</h3>
                  <p className="text-gray-200 text-xs sm:text-sm">Update your email address.</p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="bg-white text-red-600 px-4 py-2.5 sm:py-3 rounded-lg w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm sm:text-base"
                  />
                  <button
                    onClick={() => handleUpdate("email")}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 sm:py-3 rounded-lg font-semibold transition-colors whitespace-nowrap text-sm sm:text-base"
                  >
                    Update
                  </button>
                </div>
              </div>
            </div>

            {/* Password */}
            <div className="mb-6 border-b border-red-900/30 pb-6">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="flex-1 lg:mr-4">
                  <h3 className="text-base sm:text-lg font-semibold mb-2">Password</h3>
                  <p className="text-gray-200 text-xs sm:text-sm">Change your password. No less than 8 characters.</p>
                </div>
                <div className="flex flex-col gap-3 w-full lg:w-auto">
                  {/* Current Password */}
                  <div className="relative w-full sm:w-64">
                    <input
                      type={showPassword.current ? "text" : "password"}
                      value={formData.currentPassword}
                      onChange={(e) => handleInputChange("currentPassword", e.target.value)}
                      placeholder="Current password"
                      className="bg-white text-red-600 px-4 py-2.5 sm:py-3 pr-12 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-orange-500 placeholder-red-400 text-sm sm:text-base"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('current')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-red-600 hover:text-red-700"
                    >
                      {showPassword.current ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                    </button>
                  </div>

                  {/* New Password & Update Button */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="relative w-full sm:w-64">
                      <input
                        type={showPassword.new ? "text" : "password"}
                        value={formData.newPassword}
                        onChange={(e) => handleInputChange("newPassword", e.target.value)}
                        placeholder="New password"
                        className="bg-white text-red-600 px-4 py-2.5 sm:py-3 pr-12 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-orange-500 placeholder-red-400 text-sm sm:text-base"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('new')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-red-600 hover:text-red-700"
                      >
                        {showPassword.new ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                      </button>
                    </div>
                    <button
                      onClick={() => handleUpdate("password")}
                      className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 sm:py-3 rounded-lg font-semibold transition-colors whitespace-nowrap text-sm sm:text-base"
                    >
                      Update
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Delete Account - Dangerous Zone */}
            <div className="bg-red-900/30 rounded-lg p-4 sm:p-6">
              <div className="flex items-start gap-3 mb-4">
                <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-base sm:text-lg font-semibold mb-1 text-yellow-400">Danger Zone</h3>
                  <p className="text-gray-200 text-xs sm:text-sm">Deleting your account is permanent and cannot be undone. All your data will be lost.</p>
                </div>
              </div>

              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex-1 lg:mr-4">
                  <h3 className="text-base sm:text-lg font-semibold mb-2">Delete account</h3>
                  <p className="text-gray-200 text-xs sm:text-sm">Type your email to confirm deletion.</p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                  <input
                    type="email"
                    value={formData.deleteConfirmation}
                    onChange={(e) => handleInputChange("deleteConfirmation", e.target.value)}
                    placeholder="Type your email to confirm"
                    className="bg-white text-red-600 px-4 py-2.5 sm:py-3 rounded-lg w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-red-500 placeholder-red-400 text-sm sm:text-base"
                  />
                  <button
                    onClick={handleDeleteAccount}
                    disabled={formData.deleteConfirmation !== formData.email}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 sm:py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap text-sm sm:text-base"
                  >
                    Delete account
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}