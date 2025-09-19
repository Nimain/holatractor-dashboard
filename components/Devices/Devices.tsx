"use client"
import React, { useState, useEffect } from 'react'
import { Truck, Gauge, Fuel, Thermometer, Clock, MapPin, Settings, Activity, Wrench, Zap } from 'lucide-react'

function DeviceSection() {
  const [selectedTractor, setSelectedTractor] = useState('JD-8420')
  const [engineTemp, setEngineTemp] = useState(87)
  const [fuelLevel, setFuelLevel] = useState(73)
  const [speed, setSpeed] = useState(12.4)
  const [engineHours, setEngineHours] = useState(1247)
  const [isActive, setIsActive] = useState(true)

  // Simulate real-time data updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (isActive) {
        setEngineTemp(prev => Math.max(75, Math.min(105, prev + Math.random() * 4 - 2)))
        setFuelLevel(prev => Math.max(0, prev - Math.random() * 0.1))
        setSpeed(prev => Math.max(0, Math.min(25, prev + Math.random() * 2 - 1)))
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [isActive])

  const tractors = [
    { id: 'JD-8420', name: 'John Deere 8420', field: 'North Field', status: 'Active' },
    { id: 'NH-7630', name: 'New Holland 7630', field: 'South Field', status: 'Maintenance' },
    { id: 'MF-7720', name: 'Massey Ferguson 7720', field: 'East Field', status: 'Active' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-950 via-red-900 to-black relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-white rounded-full blur-3xl animate-pulse delay-2000"></div>
        <div className="absolute top-2/3 left-1/2 w-64 h-64 bg-red-400 rounded-full blur-2xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 flex h-screen">
        {/* Main Map Area */}
        <div className="flex-1 relative">
          {/* Field Map Background */}
          <div className="absolute inset-0 bg-gradient-to-b from-green-950/30 to-black/50 backdrop-blur-sm"></div>
          
          {/* Field Grid Overlay */}
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(rgba(239, 68, 68, 0.15) 1px, transparent 1px),
              linear-gradient(90deg, rgba(239, 68, 68, 0.15) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px'
          }}></div>

          {/* Tractor Position */}
          <div className="absolute top-1/2 left-1/3 transform -translate-x-1/2 -translate-y-1/2">
            <div className="relative">
              <div className="w-6 h-6 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50">
                <div className="absolute -top-2 -left-2 w-10 h-10 border-2 border-red-400 rounded-full animate-ping opacity-75"></div>
              </div>
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/70 backdrop-blur-sm text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                {selectedTractor}
              </div>
            </div>
          </div>
          
          {/* Tractor Path Trail */}
          <svg className="absolute inset-0 w-full h-full">
            <defs>
              <linearGradient id="tractorPath" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgb(239, 68, 68)" stopOpacity="0.2" />
                <stop offset="70%" stopColor="rgb(239, 68, 68)" stopOpacity="0.8" />
                <stop offset="100%" stopColor="rgb(239, 68, 68)" stopOpacity="1" />
              </linearGradient>
            </defs>
            <path 
              d="M50,400 L200,400 L200,300 L350,300 L350,400 L500,400 L500,200 L650,200" 
              stroke="url(#tractorPath)" 
              strokeWidth="4" 
              fill="none"
              strokeDasharray="8,4"
              className="animate-pulse"
            />
          </svg>

          {/* Field Boundaries */}
          <div className="absolute top-20 left-20 right-20 bottom-20 border-2 border-red-500/30 rounded-lg"></div>
        </div>

        {/* Right Control Panel */}
        <div className="w-80 bg-black/20 backdrop-blur-xl border-l border-red-500/20">
          {/* Header */}
          <div className="p-6 border-b border-red-500/20">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Tractor Control</h2>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-400 text-sm font-medium">LIVE</span>
              </div>
            </div>
          </div>

          {/* Tractor Selector */}
          <div className="p-6 border-b border-red-500/10">
            <h3 className="text-white font-semibold mb-4 flex items-center">
              <Truck className="w-5 h-5 mr-2 text-red-400" />
              Active Tractors
            </h3>
            <div className="space-y-2">
              {tractors.map((tractor) => (
                <div 
                  key={tractor.id}
                  onClick={() => setSelectedTractor(tractor.id)}
                  className={`p-3 rounded-lg cursor-pointer transition-all duration-300 ${
                    selectedTractor === tractor.id 
                      ? 'bg-red-500/20 border border-red-500/40 shadow-lg shadow-red-500/10' 
                      : 'bg-white/5 hover:bg-white/10 border border-white/10'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-white font-medium text-sm">{tractor.id}</p>
                      <p className="text-gray-400 text-xs">{tractor.field}</p>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      tractor.status === 'Active' 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {tractor.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Real-time Metrics */}
          <div className="p-6 space-y-6">
            <h3 className="text-white font-semibold flex items-center">
              <Activity className="w-5 h-5 mr-2 text-red-400" />
              Live Metrics
            </h3>

            {/* Speed */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-300 text-sm flex items-center">
                  <Gauge className="w-4 h-4 mr-2" />
                  Speed
                </span>
                <span className="text-white font-bold">{speed.toFixed(1)} km/h</span>
              </div>
              <div className="w-full bg-black/30 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-red-600 to-red-400 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${(speed / 25) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Fuel Level */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-300 text-sm flex items-center">
                  <Fuel className="w-4 h-4 mr-2" />
                  Fuel Level
                </span>
                <span className="text-white font-bold">{Math.round(fuelLevel)}%</span>
              </div>
              <div className="w-full bg-black/30 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-1000 ${
                    fuelLevel > 50 ? 'bg-gradient-to-r from-green-600 to-green-400' : 
                    fuelLevel > 25 ? 'bg-gradient-to-r from-yellow-600 to-yellow-400' : 
                    'bg-gradient-to-r from-red-600 to-red-400'
                  }`}
                  style={{ width: `${fuelLevel}%` }}
                ></div>
              </div>
            </div>

            {/* Engine Temperature */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-300 text-sm flex items-center">
                  <Thermometer className="w-4 h-4 mr-2" />
                  Engine Temp
                </span>
                <span className="text-white font-bold">{Math.round(engineTemp)}°C</span>
              </div>
              <div className="w-full bg-black/30 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-1000 ${
                    engineTemp < 90 ? 'bg-gradient-to-r from-blue-600 to-blue-400' : 
                    engineTemp < 100 ? 'bg-gradient-to-r from-yellow-600 to-yellow-400' : 
                    'bg-gradient-to-r from-red-600 to-red-400'
                  }`}
                  style={{ width: `${((engineTemp - 70) / 40) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Engine Hours */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-gray-300 text-sm flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  Engine Hours
                </span>
                <span className="text-white font-bold">{engineHours.toLocaleString()} hrs</span>
              </div>
            </div>

            {/* Location Info */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-300 text-sm flex items-center">
                  <MapPin className="w-4 h-4 mr-2" />
                  Current Field
                </span>
              </div>
              <div className="text-white font-medium">North Field - Section A</div>
              <div className="text-gray-400 text-sm">GPS: 40.7128°N, 74.0060°W</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-6 border-t border-red-500/10 space-y-3">
            <button className="w-full bg-red-600 hover:bg-red-500 text-white font-medium py-3 px-4 rounded-lg transition-all duration-300 shadow-lg shadow-red-500/25 flex items-center justify-center">
              <Zap className="w-5 h-5 mr-2" />
              Send Command
            </button>
            <button className="w-full bg-white/10 hover:bg-white/20 text-white font-medium py-3 px-4 rounded-lg transition-all duration-300 border border-white/20 flex items-center justify-center">
              <Settings className="w-5 h-5 mr-2" />
              Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DeviceSection