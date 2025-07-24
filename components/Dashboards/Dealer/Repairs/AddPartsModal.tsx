"use client"
import { useState } from "react"
import { Search, X } from "lucide-react"

interface AddPartsModalProps {
  isOpen: boolean
  onClose: () => void
  onAddPart: (part: any) => void
}

export default function AddPartsModal({ isOpen, onClose, onAddPart }: AddPartsModalProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const availableParts = [
    {
      id: 1,
      name: "Massey Power Steering, Rane Genuine Hydraulic Cylinder Assembly",
      model: "Latest Model",
      type: "Hydraulic Cylinder",
      partNumber: "IG5102342",
      brand: "Rayne",
      image: "/placeholder.svg?height=120&width=120",
      brandLogo: "RANE",
    },
    {
      id: 2,
      name: "Farmtrac Tractor Genuine Power Steering Reservoir Dipstick For Latest Model Tractors",
      model: "Latest Model",
      type: "Reservoir Dipstick",
      partNumber: "D10641700",
      brand: "Kubota",
      image: "/placeholder.svg?height=120&width=120",
      brandLogo: "kubota",
    },
    {
      id: 3,
      name: "Swaraj 855 7.5 Inch Tractor Brake Liner Disc Assembly | 1 Box For 1 Side Wheel",
      model: "Swaraj Non Oil Brake",
      type: "Brake Liner Disc Assembly",
      partNumber: "RE2517",
      brand: "Excel",
      image: "/placeholder.svg?height=120&width=120",
      brandLogo: "Excel",
    },
    {
      id: 4,
      name: "Sonalika Genuine 6 Blade Fan Assembly For Sonalika ITL Engine Tractor",
      model: "For Sonalika Tractor Model",
      type: "Fan Assembly",
      partNumber: "10002384A",
      brand: "Sonalika",
      image: "/placeholder.svg?height=120&width=120",
      brandLogo: "sonalika",
    },
    {
      id: 5,
      name: "Massey Power Steering, Rane Genuine Hydraulic Cylinder Assembly",
      model: "Latest Model",
      type: "Hydraulic Cylinder",
      partNumber: "IG5102342",
      brand: "Rayne",
      image: "/placeholder.svg?height=120&width=120",
      brandLogo: "RANE",
    },
    {
      id: 6,
      name: "Farmtrac Tractor Genuine Power Steering Reservoir Dipstick For Latest Model Tractors",
      model: "Latest Model",
      type: "Reservoir Dipstick",
      partNumber: "D10641700",
      brand: "Kubota",
      image: "/placeholder.svg?height=120&width=120",
      brandLogo: "kubota",
    },
    {
      id: 7,
      name: "Swaraj 855 7.5 Inch Tractor Brake Liner Disc Assembly | 1 Box For 1 Side Wheel",
      model: "Swaraj Non Oil Brake",
      type: "Brake Liner Disc Assembly",
      partNumber: "RE2517",
      brand: "Excel",
      image: "/placeholder.svg?height=120&width=120",
      brandLogo: "Excel",
    },
    {
      id: 8,
      name: "Sonalika Genuine 6 Blade Fan Assembly For Sonalika ITL Engine Tractor",
      model: "For Sonalika Tractor Model",
      type: "Fan Assembly",
      partNumber: "10002384A",
      brand: "Sonalika",
      image: "/placeholder.svg?height=120&width=120",
      brandLogo: "sonalika",
    },
  ]

  const filteredParts = availableParts.filter(
    (part) =>
      part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.partNumber.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleAddPart = (part: any) => {
    onAddPart(part)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className="rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden"
        style={{
          background: `linear-gradient(135deg, #A10A0C 0%, #3B0404 100%)`,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-red-900/30">
          <div>
            <h2 className="text-2xl font-bold text-white">Add Parts to the Inventory</h2>
            <p className="text-gray-200 text-sm">Select a Part to add to your inventory</p>
          </div>
          <button onClick={onClose} className="text-white hover:text-gray-300 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-6 border-b border-red-900/30">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-red-500" size={20} />
            <input
              type="text"
              placeholder="Search for the Part"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
            />
          </div>
        </div>

        {/* Parts Grid */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredParts.map((part) => (
              <div key={part.id} className="bg-white rounded-lg p-4 shadow-lg">
                {/* Brand Logo */}
                <div className="flex justify-between items-start mb-3">
                  <div className="bg-blue-100 px-2 py-1 rounded text-xs font-semibold text-blue-800">
                    {part.brandLogo}
                  </div>
                </div>

                {/* Product Image */}
                <div className="flex justify-center mb-4">
                  <img src={part.image || "/placeholder.svg"} alt={part.name} className="w-24 h-24 object-contain" />
                </div>

                {/* Product Details */}
                <div className="space-y-2 mb-4">
                  <h3 className="text-sm font-semibold text-gray-800 line-clamp-3">{part.name}</h3>
                  <div className="text-xs text-gray-600 space-y-1">
                    <p>
                      <span className="font-medium">Model:</span> {part.model}
                    </p>
                    <p>
                      <span className="font-medium">Type:</span> {part.type}
                    </p>
                    <p>
                      <span className="font-medium">Part Number:</span> {part.partNumber}
                    </p>
                    <p>
                      <span className="font-medium">Brand:</span> {part.brand}
                    </p>
                  </div>
                </div>

                {/* Add Button */}
                <button
                  onClick={() => handleAddPart(part)}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-lg font-semibold transition-colors"
                >
                  Add To Inventory
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
