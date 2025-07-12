"use client"
import { useState, useRef } from "react"
import type React from "react"

import { MoreHorizontal, Plus, Upload, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import * as XLSX from "xlsx"
import AddCustomerModal from "../Modals/AddCustomerModal"

interface Owner {
  id: number
  name: string
  email: string
  mobile: string
  gender: string
  status: "Active" | "Inactive"
  avatar: string
}

const initialOwners: Owner[] = [
  {
    id: 1,
    name: "John Doe",
    email: "john@example.com",
    mobile: "123-456-7890",
    gender: "Male",
    status: "Active",
    avatar: "/avatars/01.png",
  },
  {
    id: 2,
    name: "Jane Smith",
    email: "jane@example.com",
    mobile: "987-654-3210",
    gender: "Female",
    status: "Inactive",
    avatar: "/avatars/02.png",
  },
  {
    id: 3,
    name: "Bob Johnson",
    email: "bob@example.com",
    mobile: "456-789-0123",
    gender: "Male",
    status: "Active",
    avatar: "/avatars/03.png",
  },
  {
    id: 4,
    name: "Alice Brown",
    email: "alice@example.com",
    mobile: "789-012-3456",
    gender: "Female",
    status: "Active",
    avatar: "/avatars/04.png",
  },
  {
    id: 5,
    name: "Charlie Wilson",
    email: "charlie@example.com",
    mobile: "321-654-0987",
    gender: "Male",
    status: "Inactive",
    avatar: "/avatars/05.png",
  },
]

function CustomTooltip({ text, maxLength }: { text: string; maxLength: number }) {
  const [isHovered, setIsHovered] = useState(false)

  if (text.length <= maxLength) return <span>{text}</span>

  return (
    <div
      className="relative inline-block cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span>{text.slice(0, maxLength)}...</span>
      {isHovered && (
        <div className="absolute left-0 top-full mt-2 z-50 p-2 bg-gray-800 text-white text-sm rounded shadow-lg whitespace-nowrap">
          {text}
        </div>
      )}
    </div>
  )
}

const TableHeader = ({ children, sortable = false }: { children: React.ReactNode; sortable?: boolean }) => (
  <th className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-white">
    <div className="flex items-center space-x-1 sm:space-x-2">
      <span>{children}</span>
      {sortable && (
        <Button
          variant="ghost"
          size="sm"
          className="opacity-0 group-hover:opacity-100 text-white hover:bg-white/10 h-6 w-6 p-0"
        >
          <MoreHorizontal className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>
      )}
    </div>
  </th>
)

export default function EnhancedOwnerTable() {
  const [owners, setOwners] = useState<Owner[]>(initialOwners)
  const [searchTerm, setSearchTerm] = useState("")
  const [showAddModal, setShowAddModal] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: "array" })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as Owner[]

        const newOwners = jsonData.map((item, index) => ({
          ...item,
          id: owners.length + index + 1,
          status: item.status as "Active" | "Inactive",
          avatar: `/avatars/0${(index % 5) + 1}.png`,
        }))

        setOwners([...owners, ...newOwners])
      } catch (error) {
        console.error("Error processing file:", error)
        alert("Error processing file. Please ensure it's a valid Excel file.")
      }
    }
    reader.readAsArrayBuffer(file)
  }

  const handleAddCustomer = (customerData: any) => {
    const newCustomer: Owner = {
      id: owners.length + 1,
      name: customerData.name,
      email: customerData.email,
      mobile: customerData.contactNumber,
      gender: customerData.gender || "Male",
      status: "Active",
      avatar: `/avatars/0${(owners.length % 5) + 1}.png`,
    }
    setOwners([...owners, newCustomer])
    setShowAddModal(false)
  }

  const filteredOwners = owners.filter((owner) =>
    Object.values(owner).join(" ").toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="min-h-screen w-full bg-gray-50 p-2 sm:p-4">
      <div className="w-full max-w-full">
        {/* Header Section */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-[#F91F1F] mb-3 sm:mb-4 lg:mb-6">
            Customers ({owners.length})
          </h1>

          {/* Search and Actions in One Row */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
            {/* Search Bar */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search customers..."
                className="pl-10 w-full shadow-md focus:shadow-lg transition-shadow duration-200 text-sm sm:text-base"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 sm:gap-3 flex-shrink-0">
              <Button
                className="bg-[#F91F1F] text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 text-sm sm:text-base py-2 sm:py-3 px-4"
                onClick={() => setShowAddModal(true)}
              >
                <Plus className="mr-2 h-4 w-4" /> Add Customer
              </Button>

              <Button
                className="bg-[#F76A1E] text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 text-sm sm:text-base py-2 sm:py-3 px-4"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mr-2 h-4 w-4" /> Import Excel
              </Button>
            </div>
          </div>

          <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".xlsx, .xls" className="hidden" />
        </div>

        {/* Table Container */}
        <div className="bg-gradient-to-br from-[#A10A0C] to-[#3B0404] rounded-lg shadow-xl overflow-hidden">
          {/* Mobile Card Layout (< 768px) */}
          <div className="block md:hidden">
            {filteredOwners.map((owner, index) => (
              <div
                key={owner.id}
                className="border-b border-gray-200/20 p-4 hover:bg-white/10 transition-colors duration-150"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarImage src={owner.avatar || "/placeholder.svg"} alt={owner.name} />
                      <AvatarFallback>{owner.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-[#FFC8C8] truncate">{owner.name}</h3>
                      <p className="text-sm text-gray-300">ID: {index + 1}</p>
                    </div>
                  </div>
                  <button
                    className={`inline-flex items-center justify-center rounded-[5px] px-3 py-1 text-xs font-semibold text-white shadow-md hover:shadow-lg transition-all duration-200 flex-shrink-0 ${
                      owner.status === "Active" ? "bg-[#F76A1E] hover:bg-[#E55A0E]" : "bg-[#666666] hover:bg-[#555555]"
                    }`}
                  >
                    {owner.status}
                  </button>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-start">
                    <span className="text-gray-300 flex-shrink-0">Email:</span>
                    <span className="text-white text-right break-all ml-2">{owner.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300 flex-shrink-0">Mobile:</span>
                    <span className="text-white">{owner.mobile}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300 flex-shrink-0">Gender:</span>
                    <span className="text-white">{owner.gender}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Tablet Layout (768px - 1024px) */}
          <div className="hidden md:block lg:hidden overflow-x-auto">
            <table className="w-full divide-y divide-gray-200 min-w-[600px]">
              <thead className="bg-gradient-to-br from-[#A10A0C] to-[#3B0404]">
                <tr className="group">
                  <TableHeader>ID</TableHeader>
                  <TableHeader sortable>Name</TableHeader>
                  <TableHeader sortable>Email</TableHeader>
                  <TableHeader>Mobile</TableHeader>
                  <TableHeader sortable>Status</TableHeader>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 text-white bg-gradient-to-br from-[#A10A0C] to-[#3B0404]">
                {filteredOwners.map((owner, index) => (
                  <tr key={owner.id} className="hover:bg-white/10 transition-colors duration-150">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-white">{index + 1}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center space-x-2 text-[#FFC8C8]">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={owner.avatar || "/placeholder.svg"} alt={owner.name} />
                          <AvatarFallback>{owner.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <CustomTooltip text={owner.name} maxLength={15} />
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <CustomTooltip text={owner.email} maxLength={20} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-white">{owner.mobile}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button
                        className={`inline-flex items-center justify-center rounded-[5px] px-3 py-1 text-xs font-semibold text-white shadow-md hover:shadow-lg transition-all duration-200 ${
                          owner.status === "Active"
                            ? "bg-[#F76A1E] hover:bg-[#E55A0E]"
                            : "bg-[#666666] hover:bg-[#555555]"
                        }`}
                      >
                        {owner.status}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Desktop Layout (1024px+) */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-br from-[#A10A0C] to-[#3B0404]">
                <tr className="group">
                  <TableHeader>ID</TableHeader>
                  <TableHeader sortable>Name</TableHeader>
                  <TableHeader sortable>Email</TableHeader>
                  <TableHeader>Mobile</TableHeader>
                  <TableHeader>Gender</TableHeader>
                  <TableHeader sortable>Status</TableHeader>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 text-white bg-gradient-to-br from-[#A10A0C] to-[#3B0404]">
                {filteredOwners.map((owner, index) => (
                  <tr key={owner.id} className="hover:bg-white/10 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3 text-[#FFC8C8]">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={owner.avatar || "/placeholder.svg"} alt={owner.name} />
                          <AvatarFallback>{owner.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <CustomTooltip text={owner.name} maxLength={20} />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <CustomTooltip text={owner.email} maxLength={25} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{owner.mobile}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{owner.gender}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        className={`inline-flex items-center justify-center rounded-[5px] px-4 py-2 text-xs font-semibold text-white w-20 shadow-md hover:shadow-lg transition-all duration-200 ${
                          owner.status === "Active"
                            ? "bg-[#F76A1E] hover:bg-[#E55A0E]"
                            : "bg-[#666666] hover:bg-[#555555]"
                        }`}
                      >
                        {owner.status}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Empty State */}
        {filteredOwners.length === 0 && (
          <div className="text-center py-8 sm:py-12 bg-white rounded-lg shadow-md mt-4">
            <p className="text-gray-500 text-base sm:text-lg">No customers found matching your search.</p>
          </div>
        )}
      </div>

      {/* Add Customer Modal */}
      <AddCustomerModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onSubmit={handleAddCustomer} />
    </div>
  )
}
