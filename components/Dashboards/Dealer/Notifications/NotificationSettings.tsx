"use client"
import { useState } from "react"
import { ChevronDown } from "lucide-react"

export default function NotificationSettings() {
  const [settings, setSettings] = useState({
    desktopNotification: true,
    unreadBadge: true,
    communicationEmails: true,
    announcementsUpdates: true,
    disableAllSounds: true,
  })

  const [timeoutValue, setTimeoutValue] = useState("10 Minutes")

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const ToggleSwitch = ({ isOn, onToggle }: { isOn: boolean; onToggle: () => void }) => (
    <button
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
        isOn ? "bg-orange-500" : "bg-gray-400"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          isOn ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  )

  return (
    <div className=" bg-gray-100 p-6">
      <div className=" mx-auto">
        {/* Header */}
        <h1 className="text-3xl font-bold text-red-600 mb-8">Notification Settings</h1>

        {/* Settings Container */}
        <div
          className="rounded-lg p-8 text-white"
          style={{
            background: `linear-gradient(135deg, #A10A0C 0%, #3B0404 100%)`,
          }}
        >
          {/* Notifications Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6">Notifications</h2>

            <div className="space-y-6">
              {/* Enable Desktop Notification */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-1">Enable Desktop Notification</h3>
                  <p className="text-gray-200 text-sm">
                    Receive Notifications of all the messages,contracts and documents
                  </p>
                </div>
                <ToggleSwitch
                  isOn={settings.desktopNotification}
                  onToggle={() => toggleSetting("desktopNotification")}
                />
              </div>

              {/* Enable Unread Notification Badge */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-1">Enable Unread Notification Badge</h3>
                  <p className="text-gray-200 text-sm">
                    Shows a Red badge on the app icon when you have unread message
                  </p>
                </div>
                <ToggleSwitch isOn={settings.unreadBadge} onToggle={() => toggleSetting("unreadBadge")} />
              </div>

              {/* Push Notification Timeout */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Push Notification Timeout</h3>
                <div className="relative">
                  <select
                    value={timeoutValue}
                    onChange={(e) => setTimeoutValue(e.target.value)}
                    className="w-full bg-white text-gray-800 px-4 py-3 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="5 Minutes">5 Minutes</option>
                    <option value="10 Minutes">10 Minutes</option>
                    <option value="15 Minutes">15 Minutes</option>
                    <option value="30 Minutes">30 Minutes</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500" size={20} />
                </div>
              </div>
            </div>
          </div>

          {/* Email Notifications Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6">Email Notifications</h2>

            <div className="space-y-6">
              {/* Communication Emails */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-1">Communication Emails</h3>
                  <p className="text-gray-200 text-sm">Receive emails for messages, contracts and documents</p>
                </div>
                <ToggleSwitch
                  isOn={settings.communicationEmails}
                  onToggle={() => toggleSetting("communicationEmails")}
                />
              </div>

              {/* Announcements and Updates */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-1">Announcements and Updates</h3>
                  <p className="text-gray-200 text-sm">Receive Emails about product updates, improvements etc</p>
                </div>
                <ToggleSwitch
                  isOn={settings.announcementsUpdates}
                  onToggle={() => toggleSetting("announcementsUpdates")}
                />
              </div>
            </div>
          </div>

          {/* Sounds Section */}
          <div>
            <h2 className="text-2xl font-bold mb-6">Sounds</h2>

            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-1">Disable all Notification Sounds</h3>
                <p className="text-gray-200 text-sm">Mute all notification of the messages, contracts, documents</p>
              </div>
              <ToggleSwitch isOn={settings.disableAllSounds} onToggle={() => toggleSetting("disableAllSounds")} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
