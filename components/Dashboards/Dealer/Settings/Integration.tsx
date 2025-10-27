"use client"
import { useState } from "react"

export default function Integration() {
  const [integrations, setIntegrations] = useState(
    Array(9).fill({
      name: "Paypal",
      description: "Trusted Online and Mobile Payments",
      enabled: true,
    }),
  )

  const toggleIntegration = (index) => {
    setIntegrations((prev) => prev.map((item, i) => (i === index ? { ...item, enabled: !item.enabled } : item)))
  }

  const ToggleSwitch = ({ isOn, onToggle }) => (
    <button
      onClick={onToggle}
      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 shadow-md ${
        isOn ? "bg-orange-500" : "bg-gray-400"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm ${
          isOn ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  )

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-red-600">Integration</h1>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">Manage your third-party integrations</p>
        </div>

        {/* Integration Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {integrations.map((integration, index) => (
            <div
              key={index}
              className="rounded-2xl p-5 sm:p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
              style={{
                background: `linear-gradient(135deg, #A10A0C 0%, #3B0404 100%)`,
              }}
            >
              {/* Icon Placeholder */}
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/90 rounded-xl mb-4 sm:mb-5 shadow-lg"></div>

              {/* Content */}
              <div className="mb-5 sm:mb-6">
                <h3 className="text-xl sm:text-2xl font-bold mb-2">{integration.name}</h3>
                <p className="text-gray-200 text-sm sm:text-base leading-relaxed">{integration.description}</p>
              </div>

              {/* Actions */}
              <div className="space-y-4">
                {/* Buttons Row */}
                <div className="flex flex-col xs:flex-row gap-2 sm:gap-3">
                  <button className="flex-1 border-2 border-white text-white px-4 py-2.5 rounded-xl hover:bg-white hover:text-red-600 transition-all font-semibold text-sm sm:text-base active:scale-95">
                    Configure
                  </button>
                  <button className="flex-1 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl transition-all font-semibold text-sm sm:text-base shadow-lg active:scale-95">
                    Remove
                  </button>
                </div>

                {/* Toggle Row */}
                <div className="flex items-center justify-between pt-2 border-t border-white/20">
                  <span className="text-sm sm:text-base font-medium">
                    {integrations[index].enabled ? "Enabled" : "Disabled"}
                  </span>
                  <ToggleSwitch isOn={integrations[index].enabled} onToggle={() => toggleIntegration(index)} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}