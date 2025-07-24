"use client"
import { Plus } from "lucide-react"

export default function PushNotifications() {
  const notificationData = [
    {
      id: "#7466",
      titleName: "Creative Mornings",
      activeFrom: "20 Mar 2025",
      activeTo: "20 Jun 2025",
      status: "Active",
    },
    {
      id: "#7466",
      titleName: "Creative Mornings",
      activeFrom: "20 Mar 2025",
      activeTo: "20 Jun 2025",
      status: "Inactive",
    },
    {
      id: "#7466",
      titleName: "Creative Mornings",
      activeFrom: "20 Mar 2025",
      activeTo: "20 Jun 2025",
      status: "Active",
    },
    {
      id: "#7466",
      titleName: "Creative Mornings",
      activeFrom: "20 Mar 2025",
      activeTo: "20 Jun 2025",
      status: "Inactive",
    },
    {
      id: "#7466",
      titleName: "Creative Mornings",
      activeFrom: "20 Mar 2025",
      activeTo: "20 Jun 2025",
      status: "Active",
    },
    {
      id: "#7466",
      titleName: "Creative Mornings",
      activeFrom: "20 Mar 2025",
      activeTo: "20 Jun 2025",
      status: "Active",
    },
    {
      id: "#7466",
      titleName: "Creative Mornings",
      activeFrom: "20 Mar 2025",
      activeTo: "20 Jun 2025",
      status: "Inactive",
    },
  ]

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-[#24701D] text-white"
      case "Inactive":
        return "bg-[#F76A1E] text-white"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className=" bg-gray-100 p-6">
      <div className=" mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-red-600">Push notifications</h1>
          <button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors">
            <Plus size={20} />
            Add Push Notification
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="text-red-600">
                  <th className="px-6 py-4 text-left font-semibold">ID</th>
                  <th className="px-6 py-4 text-left font-semibold">Title Name</th>
                  <th className="px-6 py-4 text-left font-semibold">Active From</th>
                  <th className="px-6 py-4 text-left font-semibold">Active To</th>
                  <th className="px-6 py-4 text-left font-semibold">Status</th>
                </tr>
              </thead>
              <tbody style={{ background: `linear-gradient(135deg, #A10A0C 0%, #3B0404 100%)` }}>
                {notificationData.map((notification, index) => (
                  <tr key={index} className="border-b border-red-900/30">
                    <td className="px-6 py-4 text-white font-semibold">{notification.id}</td>
                    <td className="px-6 py-4 text-white">{notification.titleName}</td>
                    <td className="px-6 py-4 text-white">{notification.activeFrom}</td>
                    <td className="px-6 py-4 text-white">{notification.activeTo}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(notification.status)}`}
                      >
                        {notification.status}
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
