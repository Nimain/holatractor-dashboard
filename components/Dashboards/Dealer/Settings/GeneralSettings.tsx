"use client"
import { useState } from "react"

export default function GeneralSettings() {
  const [formData, setFormData] = useState({
    name: "Hola Farmer",
    token: "a1b2c3d4e5f6g7h8",
    timezone: "Santa cruz, Bolivia 07:20 PM",
    blockedIPs: "Not blocking any IP addresses by default",
    email: "dealer@holatractor.com",
    currentPassword: "Current password",
    newPassword: "New password",
    deleteConfirmation: "Type in your email to confirm.",
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleUpdate = (type: string) => {
    console.log(`Updating ${type}...`)
  }

  const handleDeleteAccount = () => {
    console.log("Deleting account...")
  }

  return (
    <div className=" bg-gray-100 p-6">
      <div className=" mx-auto">
        {/* Header */}
        <h1 className="text-3xl font-bold text-red-600 mb-8">General Settings</h1>

        {/* Settings Container */}
        <div
          className="rounded-lg p-8 text-white space-y-8"
          style={{
            background: `linear-gradient(135deg, #A10A0C 0%, #3B0404 100%)`,
          }}
        >
          {/* Name */}
          <div className="border-b border-red-900/30 pb-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 mr-6">
                <h3 className="text-lg font-semibold mb-2">Name</h3>
                <p className="text-gray-200 text-sm">Used for display purposes only.</p>
              </div>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="bg-white text-red-600 px-4 py-3 rounded-lg w-80 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* Token */}
          <div className="border-b border-red-900/30 pb-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 mr-6">
                <h3 className="text-lg font-semibold mb-2">Token</h3>
                <p className="text-gray-200 text-sm">Send events from the server or track subdomains.</p>
              </div>
              <input
                type="text"
                value={formData.token}
                onChange={(e) => handleInputChange("token", e.target.value)}
                className="bg-white text-red-600 px-4 py-3 rounded-lg w-80 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* Timezone */}
          <div className="border-b border-red-900/30 pb-6">
            <div className="flex items-start justify-between">
              <div className="flex-1 mr-6">
                <h3 className="text-lg font-semibold mb-2">Timezone</h3>
                <p className="text-gray-200 text-sm mb-2">
                  All the dates and charts you see align with this time zone. Be cautious when updating, as it will
                  change as well.
                </p>
                <p className="text-gray-300 text-xs">Hash salt resets</p>
              </div>
              <input
                type="text"
                value={formData.timezone}
                onChange={(e) => handleInputChange("timezone", e.target.value)}
                className="bg-white text-red-600 px-4 py-3 rounded-lg w-80 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* Blocked IP addresses */}
          <div className="border-b border-red-900/30 pb-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 mr-6">
                <h3 className="text-lg font-semibold mb-2">Blocked IP addresses</h3>
                <p className="text-gray-200 text-sm">
                  Traffic from these IP addresses will be blocked. Should be a comma-separated list.
                </p>
              </div>
              <input
                type="text"
                value={formData.blockedIPs}
                onChange={(e) => handleInputChange("blockedIPs", e.target.value)}
                className="bg-white text-red-600 px-4 py-3 rounded-lg w-80 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* USER DETAILS */}
          <div>
            <h2 className="text-xl font-bold mb-2">USER DETAILS</h2>
            <p className="text-gray-200 text-sm mb-6">Update your email, password, or delete your account.</p>

            {/* Email */}
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 mr-6">
                  <h3 className="text-lg font-semibold mb-2">Email</h3>
                  <p className="text-gray-200 text-sm">Update your email address.</p>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="bg-white text-red-600 px-4 py-3 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <button
                    onClick={() => handleUpdate("email")}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                  >
                    Update
                  </button>
                </div>
              </div>
            </div>

            {/* Password */}
            <div className="mb-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 mr-6">
                  <h3 className="text-lg font-semibold mb-2">Password</h3>
                  <p className="text-gray-200 text-sm">Change your password. No less than 8 characters.</p>
                </div>
                <div className="flex flex-col gap-3">
                  <input
                    type="password"
                    placeholder={formData.currentPassword}
                    className="bg-white text-red-600 px-4 py-3 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-orange-500 placeholder-red-400"
                  />
                  <div className="flex items-center gap-3">
                    <input
                      type="password"
                      placeholder={formData.newPassword}
                      className="bg-white text-red-600 px-4 py-3 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-orange-500 placeholder-red-400"
                    />
                    <button
                      onClick={() => handleUpdate("password")}
                      className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                    >
                      Update
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Delete account */}
            <div>
              <div className="flex items-center justify-between">
                <div className="flex-1 mr-6">
                  <h3 className="text-lg font-semibold mb-2">Delete account</h3>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="email"
                    placeholder={formData.deleteConfirmation}
                    className="bg-white text-red-600 px-4 py-3 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-orange-500 placeholder-red-400"
                  />
                  <button
                    onClick={handleDeleteAccount}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
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
