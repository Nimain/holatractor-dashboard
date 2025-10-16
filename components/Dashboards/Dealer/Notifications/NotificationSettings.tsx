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
    <div className="bg-gray-100 px-4 py-6 sm:px-6 lg:px-8">
      <div className=" mx-auto">
        {/* Header */}
        <h1 className="text-2xl sm:text-3xl font-bold text-red-600 mb-6 sm:mb-8 text-center sm:text-left">
          Notification Settings
        </h1>

        {/* Settings Container */}
        <div
          className="rounded-lg px-4 py-6 sm:p-8 text-white space-y-10"
          style={{
            background: `linear-gradient(135deg, #A10A0C 0%, #3B0404 100%)`,
          }}
        >
          {/* Notifications Section */}
          <section className="space-y-6">
            <h2 className="text-xl sm:text-2xl font-bold">Notifications</h2>

            <div className="space-y-6">
              {/* Desktop Notification */}
              <SettingItem
                title="Enable Desktop Notification"
                description="Receive notifications for all messages, contracts, and documents."
                isOn={settings.desktopNotification}
                onToggle={() => toggleSetting("desktopNotification")}
              />

              {/* Unread Badge */}
              <SettingItem
                title="Enable Unread Notification Badge"
                description="Shows a red badge on the app icon when you have unread messages."
                isOn={settings.unreadBadge}
                onToggle={() => toggleSetting("unreadBadge")}
              />

              {/* Timeout Selector */}
              <div>
                <h3 className="text-base sm:text-lg font-semibold mb-2">Push Notification Timeout</h3>
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
          </section>

          {/* Email Notifications Section */}
          <section className="space-y-6">
            <h2 className="text-xl sm:text-2xl font-bold">Email Notifications</h2>

            <SettingItem
              title="Communication Emails"
              description="Receive emails for messages, contracts and documents."
              isOn={settings.communicationEmails}
              onToggle={() => toggleSetting("communicationEmails")}
            />

            <SettingItem
              title="Announcements and Updates"
              description="Receive emails about product updates, improvements, etc."
              isOn={settings.announcementsUpdates}
              onToggle={() => toggleSetting("announcementsUpdates")}
            />
          </section>

          {/* Sound Settings */}
          <section className="space-y-6">
            <h2 className="text-xl sm:text-2xl font-bold">Sounds</h2>

            <SettingItem
              title="Disable All Notification Sounds"
              description="Mute all notification sounds for messages, contracts, and documents."
              isOn={settings.disableAllSounds}
              onToggle={() => toggleSetting("disableAllSounds")}
            />
          </section>
        </div>
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
        <h3 className="text-base sm:text-lg font-semibold mb-1">{title}</h3>
        <p className="text-gray-200 text-sm">{description}</p>
      </div>
      <div className="sm:pt-1">
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
      </div>
    </div>
  )
}
