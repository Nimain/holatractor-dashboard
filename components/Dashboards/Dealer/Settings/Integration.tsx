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

  const toggleIntegration = (index: number) => {
    setIntegrations((prev) => prev.map((item, i) => (i === index ? { ...item, enabled: !item.enabled } : item)))
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
        <h1 className="text-3xl font-bold text-red-600 mb-8">Integration</h1>

        {/* Integration Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {integrations.map((integration, index) => (
            <div
              key={index}
              className="rounded-lg p-6 text-white"
              style={{
                background: `linear-gradient(135deg, #A10A0C 0%, #3B0404 100%)`,
              }}
            >
              {/* Icon Placeholder */}
              <div className="w-12 h-12 bg-white rounded-lg mb-4"></div>

              {/* Content */}
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-2">{integration.name}</h3>
                <p className="text-gray-200 text-sm">{integration.description}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between">
                <div className="flex gap-3">
                  <button className="border border-white text-white px-4 py-2 rounded-lg hover:bg-white hover:text-red-600 transition-colors">
                    Configure
                  </button>
                  <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors">
                    Remove
                  </button>
                </div>
                <ToggleSwitch isOn={integrations[index].enabled} onToggle={() => toggleIntegration(index)} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
