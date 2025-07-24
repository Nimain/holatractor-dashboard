"use client"
import { useState } from "react"
import { MapPin, Trash2 } from "lucide-react"

export default function Security() {
  const [twoStepEnabled, setTwoStepEnabled] = useState(true)

  const devices = [
    {
      id: 1,
      name: "Oilive's MacBook Pro",
      location: "Ninh Binh, Vietnam",
      status: "Current session",
    },
    {
      id: 2,
      name: "Oilive's MacBook Pro",
      location: "Ninh Binh, Vietnam",
      status: "Current session",
    },
    {
      id: 3,
      name: "Oilive's MacBook Pro",
      location: "Ninh Binh, Vietnam",
      status: "Current session",
    },
    {
      id: 4,
      name: "Oilive's MacBook Pro",
      location: "Ninh Binh, Vietnam",
      status: "Current session",
    },
    {
      id: 5,
      name: "Oilive's MacBook Pro",
      location: "Ninh Binh, Vietnam",
      status: "Current session",
    },
  ]

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

  const handleRemoveDevice = (deviceId: number) => {
    console.log(`Removing device ${deviceId}`)
  }

  return (
    <div className=" bg-gray-100 p-6">
      <div className=" mx-auto">
        {/* Header */}
        <h1 className="text-3xl font-bold text-red-600 mb-8">Security</h1>

        {/* Security Container */}
        <div
          className="rounded-lg p-8 text-white"
          style={{
            background: `linear-gradient(135deg, #A10A0C 0%, #3B0404 100%)`,
          }}
        >
          {/* Basics Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6">Basics</h2>

            {/* Password */}
            <div className="border-b border-red-900/30 pb-6 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">Password</h3>
                  <p className="text-gray-200 text-sm">Set a password to protect your account.</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="bg-white px-4 py-2 rounded-lg">
                    <span className="text-black font-mono">••••••••••</span>
                  </div>
                  <span className="text-gray-200">Very secure</span>
                  <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors">
                    Edit
                  </button>
                </div>
              </div>
            </div>

            {/* Two-step verification */}
            <div>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">Two-step verification</h3>
                  <p className="text-gray-200 text-sm">
                    We recommend requiring a verification code in addition to your password.
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <ToggleSwitch isOn={twoStepEnabled} onToggle={() => setTwoStepEnabled(!twoStepEnabled)} />
                    <span className="text-gray-200">Two-step verification</span>
                  </div>
                  <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors">
                    Edit
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Browsers and devices Section */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Browsers and devices</h2>
            <p className="text-gray-200 text-sm mb-6">
              These browsers and devices are currently signed in to your account. Remove any unauthorized devices.
            </p>

            {/* Device List */}
            <div className="space-y-4">
              {devices.map((device) => (
                <div key={device.id} className="flex items-center justify-between border-b border-red-900/30 pb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-full"></div>
                    <div>
                      <h4 className="font-semibold">{device.name}</h4>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-gray-300" />
                      <span className="text-gray-200">{device.location}</span>
                    </div>
                    <span className="text-gray-200">{device.status}</span>
                    <button
                      onClick={() => handleRemoveDevice(device.id)}
                      className="text-gray-300 hover:text-white transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
