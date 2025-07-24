"use client"
import { useState } from "react"
import { Search, Plus, Package } from "lucide-react"
import AddPartsModal from "./AddPartsModal"

export default function PartsInventory() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)

  const partsData = [
    {
      id: 1,
      partName: "Attachment",
      partNumber: "1HSV432",
      description: "Spare Part",
      tractorModel: "New Holland 3032",
      stock: 5,
      cost: 450,
      status: "Active",
    },
    {
      id: 2,
      partName: "Attachment",
      partNumber: "1HSV432",
      description: "Spare Part",
      tractorModel: "New Holland 3032",
      stock: 10,
      cost: 250,
      status: "Active",
    },
    {
      id: 3,
      partName: "Attachment",
      partNumber: "1HSV432",
      description: "Spare Part",
      tractorModel: "New Holland 3032",
      stock: 3,
      cost: 400,
      status: "Active",
    },
    {
      id: 4,
      partName: "Attachment",
      partNumber: "1HSV432",
      description: "Spare Part",
      tractorModel: "New Holland 3032",
      stock: 7,
      cost: 650,
      status: "Active",
    },
    {
      id: 5,
      partName: "Attachment",
      partNumber: "1HSV432",
      description: "Spare Part",
      tractorModel: "New Holland 3032",
      stock: 12,
      cost: 150,
      status: "Active",
    },
    {
      id: 6,
      partName: "Attachment",
      partNumber: "1HSV432",
      description: "Spare Part",
      tractorModel: "New Holland 3032",
      stock: 18,
      cost: 500,
      status: "Active",
    },
  ]

  const filteredParts = partsData.filter(
    (part) =>
      part.partName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.partNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.tractorModel.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleAddPart = (newPart: any) => {
    console.log("Adding part:", newPart)
    // You can add logic here to actually add the part to your inventory
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-red-600 mb-4">Parts Inventory</h1>

          {/* Hero Section */}
          <div
            className="rounded-lg p-8 text-white relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, #A10A0C 0%, #3B0404 100%)`,
            }}
          >
            <div className="relative z-10">
              <h2 className="text-2xl font-bold mb-4">
                Manage and Access all the parts and attachments in your Inventory
              </h2>
              <div className="flex flex-wrap gap-6 mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <span className="text-lg">Quick Setup</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <span className="text-lg">Easy Maintenance</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <span className="text-lg">Smart Management</span>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors"
              >
                <Plus size={20} />
                Add Parts
              </button>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -translate-y-8 translate-x-8"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-5 rounded-full translate-y-8 -translate-x-8"></div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-red-500" size={20} />
            <input
              type="text"
              placeholder="Search by Name of the Part"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="text-red-600">
                  <th className="px-6 py-4 text-left font-semibold">S.NO</th>
                  <th className="px-6 py-4 text-left font-semibold">Image</th>
                  <th className="px-6 py-4 text-left font-semibold">Part Name</th>
                  <th className="px-6 py-4 text-left font-semibold">Part Number</th>
                  <th className="px-6 py-4 text-left font-semibold">Description</th>
                  <th className="px-6 py-4 text-left font-semibold">Tractor Model</th>
                  <th className="px-6 py-4 text-left font-semibold">Stock</th>
                  <th className="px-6 py-4 text-left font-semibold">Cost</th>
                  <th className="px-6 py-4 text-left font-semibold">Status</th>
                </tr>
              </thead>
              <tbody style={{ background: `linear-gradient(135deg, #A10A0C 0%, #3B0404 100%)` }}>
                {filteredParts.map((part) => (
                  <tr key={part.id} className="border-b border-red-900/30">
                    <td className="px-6 py-4 text-white font-semibold">{part.id}</td>
                    <td className="px-6 py-4">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                        <Package className="text-red-600" size={24} />
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-white">{part.partName}</td>
                    <td className="px-6 py-4 text-white">{part.partNumber}</td>
                    <td className="px-6 py-4 text-white">{part.description}</td>
                    <td className="px-6 py-4 text-white">{part.tractorModel}</td>
                    <td className="px-6 py-4 font-semibold text-white">{part.stock}</td>
                    <td className="px-6 py-4 font-semibold text-white">${part.cost}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        {part.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <AddPartsModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAddPart={handleAddPart} />
      </div>
    </div>
  )
}
