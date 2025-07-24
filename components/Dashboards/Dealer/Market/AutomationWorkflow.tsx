"use client"

import Image from "next/image"
import img from "@/assets/dealer/image.png" // Using the provided local asset path

const AutomationWorkflow = () => {
  const triggers = [
    { icon: "📋", title: "Added to List" },
    { icon: "📅", title: "Date and Time" },
    { icon: "⏰", title: "Smart Segment" },
    { icon: "🔄", title: "Record Updated" },
    { icon: "🏷️", title: "Field Matched" },
    { icon: "📧", title: "Email Activity" },
  ]
  const conditions = [
    { icon: "📧", title: "Check Email Status" },
    { icon: "📋", title: "Is In List" },
    { icon: "👤", title: "Check Contact Field" },
    { icon: "💰", title: "Check Deal Field" },
    { icon: "👁️", title: "Has visited page" },
    { icon: "✅", title: "Check Activity Field" },
  ]
  const actions = [
    { icon: "📧", title: "Send Mail" },
    { icon: "👤", title: "Contact Field Update" },
    { icon: "⏰", title: "Add Delay" },
    { icon: "💰", title: "Deal Create" },
    { icon: "🔄", title: "A/B Split" },
    { icon: "✅", title: "Activity Field Update" },
  ]

  const SidebarItem = ({ icon, title }: { icon: string; title: string }) => (
    <div className="bg-red-800 rounded-lg p-3 text-center cursor-pointer hover:bg-red-700 transition-colors text-white">
      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mx-auto mb-2">
        <span className="text-red-800 text-sm">{icon}</span>
      </div>
      <div className="text-xs font-medium leading-tight">{title}</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-200 p-4">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h1 className="text-red-600 text-3xl font-bold mb-1">Automation</h1>
          <h2 className="text-red-600 text-lg">Distribute Leads Between your teammates</h2>
        </div>
        <div className="flex gap-2">
          {["Publish", "Save", "Cancel"].map((btn) => (
            <button
              key={btn}
              className="bg-orange-500 text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-orange-600 transition-colors"
            >
              {btn}
            </button>
          ))}
        </div>
      </div>
      {/* Main content area: Sidebar + Workflow Canvas */}
      <div className="grid grid-cols-1 md:grid-cols-[288px_1fr] gap-4 items-stretch">
        {/* Sidebar */}
        <div className="w-full md:w-72 bg-gradient-to-b from-red-900 to-red-950 text-white flex-shrink-0">
          <div className="p-4">
            <div className="text-lg font-bold mb-4">Triggers</div>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {triggers.map((item, i) => (
                <SidebarItem key={i} {...item} />
              ))}
            </div>
            <div className="text-lg font-bold mb-4">Conditions</div>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {conditions.map((item, i) => (
                <SidebarItem key={i} {...item} />
              ))}
            </div>
            <div className="text-lg font-bold mb-4">Actions</div>
            <div className="grid grid-cols-3 gap-3">
              {actions.map((item, i) => (
                <SidebarItem key={i} {...item} />
              ))}
            </div>
          </div>
        </div>
        {/* Main Workflow Canvas */}
        <div
          className="bg-white relative h-full" // Set height to 100% of grid row
          style={{ minHeight: "600px" }} // Ensure a minimum height for the canvas
        >
          <Image
            src={img || "/placeholder.svg"}
            alt="Automation Workflow Diagram"
            fill
            style={{ objectFit: "contain" }} // Maintain aspect ratio within the container
            priority // Load this image with high priority
          />
        </div>
      </div>
    </div>
  )
}

export default AutomationWorkflow
