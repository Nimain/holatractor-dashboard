"use client"
import { useState } from "react"
import { Search, Calendar } from "lucide-react"

export default function ScheduleTractorRepair() {
  const [searchTerm, setSearchTerm] = useState("")

  const repairData = [
    {
      id: 1,
      createdOn: "16 Aug 25",
      priority: "High",
      customerName: "Hola Farmer",
      contactNo: "(+591) 3-123 4567",
      tractorModel: "Mahindra 575",
      issues: "Oil Pipe Leak",
      status: "Active",
    },
    {
      id: 2,
      createdOn: "10 Jun 25",
      priority: "Low",
      customerName: "Hola Farmer",
      contactNo: "(+591) 3-123 4567",
      tractorModel: "Mahindra 575",
      issues: "Oil Pipe Leak",
      status: "Inactive",
    },
    {
      id: 3,
      createdOn: "12 Mar 25",
      priority: "Medium",
      customerName: "Hola Farmer",
      contactNo: "(+591) 3-123 4567",
      tractorModel: "Mahindra 575",
      issues: "Oil Pipe Leak",
      status: "Active",
    },
    {
      id: 4,
      createdOn: "14 Feb 25",
      priority: "Urgent",
      customerName: "Hola Farmer",
      contactNo: "(+591) 3-123 4567",
      tractorModel: "Mahindra 575",
      issues: "Oil Pipe Leak",
      status: "Inactive",
    },
    {
      id: 5,
      createdOn: "10 Jan 25",
      priority: "High",
      customerName: "Hola Farmer",
      contactNo: "(+591) 3-123 4567",
      tractorModel: "Mahindra 575",
      issues: "Oil Pipe Leak",
      status: "Active",
    },
    {
      id: 6,
      createdOn: "19 Dec 24",
      priority: "Low",
      customerName: "Hola Farmer",
      contactNo: "(+591) 3-123 4567",
      tractorModel: "Mahindra 575",
      issues: "Oil Pipe Leak",
      status: "Inactive",
    },
  ]

  const filteredRepairs = repairData.filter(
    (repair) =>
      repair.id.toString().includes(searchTerm.toLowerCase()) ||
      repair.customerName.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "bg-orange-500 text-white"
      case "Low":
        return "bg-green-500 text-white"
      case "Medium":
        return "bg-yellow-500 text-white"
      case "Urgent":
        return "bg-red-500 text-white"
      default:
        return "bg-gray-500 text-white"
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800"
      case "Inactive":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-red-600 mb-4">Schedule Tractor Repair</h1>

          {/* Hero Section */}
          <div
            className="rounded-lg p-8 text-white relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, #A10A0C 0%, #3B0404 100%)`,
            }}
          >
            <div className="relative z-10">
              <h2 className="text-2xl font-bold mb-4">Schedule Your tractor Repairs without any Hassle</h2>
              <div className="flex flex-wrap gap-6 mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <span className="text-lg">Quick Scheduling</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <span className="text-lg">Priority Repairs</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <span className="text-lg">Reliable Service</span>
                </div>
              </div>
              <button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors">
                <Calendar size={20} />
                Schedule Repair
              </button>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -translate-y-8 translate-x-8"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-5 rounded-full translate-y-8 -translate-x-8"></div>
          </div>
        </div>

        {/* Past Repair Details Section */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Past Repair Details</h2>

          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-red-500" size={20} />
            <input
              type="text"
              placeholder="Search by Repair ID or Customer Name"
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
                  <th className="px-6 py-4 text-left font-semibold">Repair ID</th>
                  <th className="px-6 py-4 text-left font-semibold">Created on</th>
                  <th className="px-6 py-4 text-left font-semibold">Priority</th>
                  <th className="px-6 py-4 text-left font-semibold">Customer Name</th>
                  <th className="px-6 py-4 text-left font-semibold">Contact No</th>
                  <th className="px-6 py-4 text-left font-semibold">Tractor Model</th>
                  <th className="px-6 py-4 text-left font-semibold">Issues</th>
                  <th className="px-6 py-4 text-left font-semibold">Status</th>
                </tr>
              </thead>
              <tbody style={{ background: `linear-gradient(135deg, #A10A0C 0%, #3B0404 100%)` }}>
                {filteredRepairs.map((repair) => (
                  <tr key={repair.id} className="border-b border-red-900/30">
                    <td className="px-6 py-4 text-white font-semibold">{repair.id}</td>
                    <td className="px-6 py-4 text-white">{repair.createdOn}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPriorityBadgeColor(repair.priority)}`}
                      >
                        {repair.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-white">{repair.customerName}</td>
                    <td className="px-6 py-4 text-white">{repair.contactNo}</td>
                    <td className="px-6 py-4 text-white">{repair.tractorModel}</td>
                    <td className="px-6 py-4 text-white">{repair.issues}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(repair.status)}`}
                      >
                        {repair.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
