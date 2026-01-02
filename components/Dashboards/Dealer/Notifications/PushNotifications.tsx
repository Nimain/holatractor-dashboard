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
      id: "#7467",
      titleName: "Creative Evenings",
      activeFrom: "21 Mar 2025",
      activeTo: "21 Jun 2025",
      status: "Inactive",
    },
    {
      id: "#7468",
      titleName: "Creative Nights",
      activeFrom: "22 Mar 2025",
      activeTo: "22 Jun 2025",
      status: "Active",
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
    <div className="bg-gray-100 min-h-screen">
      {/* FULL WIDTH CONTAINER */}
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-20 py-4 sm:py-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-red-600">
            Push Notifications
          </h1>

          <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors w-full sm:w-auto justify-center">
            <Plus size={18} />
            Add Push Notification
          </button>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden space-y-4">
          {notificationData.map((notification, index) => (
            <div
              key={index}
              className="rounded-lg shadow-lg overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #A10A0C 0%, #3B0404 100%)",
              }}
            >
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-white font-bold text-lg">
                    {notification.id}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(
                      notification.status
                    )}`}
                  >
                    {notification.status}
                  </span>
                </div>

                <div>
                  <p className="text-gray-300 text-xs mb-1">Title Name</p>
                  <p className="text-white font-semibold">
                    {notification.titleName}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/20">
                  <div>
                    <p className="text-gray-300 text-xs">Active From</p>
                    <p className="text-white text-sm">
                      {notification.activeFrom}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-300 text-xs">Active To</p>
                    <p className="text-white text-sm">
                      {notification.activeTo}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50 text-red-600">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold">ID</th>
                  <th className="px-6 py-3 text-left font-semibold">Title Name</th>
                  <th className="px-6 py-3 text-left font-semibold">Active From</th>
                  <th className="px-6 py-3 text-left font-semibold">Active To</th>
                  <th className="px-6 py-3 text-left font-semibold">Status</th>
                </tr>
              </thead>

              <tbody
                style={{
                  background: "linear-gradient(135deg, #A10A0C 0%, #3B0404 100%)",
                }}
              >
                {notificationData.map((notification, index) => (
                  <tr
                    key={index}
                    className="border-b border-red-900/30 text-sm lg:text-base"
                  >
                    <td className="px-6 py-4 text-white font-semibold">
                      {notification.id}
                    </td>
                    <td className="px-6 py-4 text-white">
                      {notification.titleName}
                    </td>
                    <td className="px-6 py-4 text-white">
                      {notification.activeFrom}
                    </td>
                    <td className="px-6 py-4 text-white">
                      {notification.activeTo}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(
                          notification.status
                        )}`}
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
