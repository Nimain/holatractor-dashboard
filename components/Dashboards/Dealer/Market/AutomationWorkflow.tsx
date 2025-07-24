"use client"
import Image from "next/image"
import first from '@/assets/dealer/Line 212.png'
import second from '@/assets/dealer/Line 213.png'
import third from '@/assets/dealer/Line 214.png'
import fourth from '@/assets/dealer/Line 215.png'
import five from '@/assets/dealer/Line 216.png'

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
    <div className="bg-red-800 rounded-lg p-3 text-center cursor-pointer hover:bg-red-700 transition-colors">
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

      <div className="flex gap-4">
        {/* Sidebar */}
        <div className="w-72 bg-gradient-to-b from-red-900 to-red-950 text-white">
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
        <div className="flex-1 bg-white relative" style={{ minHeight: "600px" }}>
          {/* Workflow Blocks */}
          <div className="absolute top-8 left-8">
            <WorkflowBlock title="Added to List" subtitle="Conference Leads" icon="📋" />
          </div>

          <div className="absolute top-8 right-8">
            <WorkflowBlock title="A/B Split" subtitle="50/50" icon="🔄" />
          </div>

          <div className="absolute top-80 left-8">
            <WorkflowBlock
              title="Contact Field Update"
              subtitle="Update Contact's Owner"
              extra="set John Caddel"
              icon="👤"
            />
          </div>

          <div className="absolute top-80 right-8">
            <WorkflowBlock title="Contact Field Update" subtitle="Update Contact's Owner" extra="set Kay G" icon="👤" />
          </div>

          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
            <WorkflowBlock title="Deal Create" subtitle="Deal-{Contact.Name}" icon="💰" />
          </div>

          {/* Connection Arrows using Next.js Image */}
          {/* Added to List → A/B Split */}
          <div className="absolute top-12 left-80" style={{ transform: "translateY(-50%)" }}>
            <Image
              src={first}
              alt="Right Arrow"
              width={250}
              height={32}
              className="object-contain"
            />
          </div>

          {/* A/B Split → Path A (down and left) */}
          <div className="absolute top-24 right-20">
            <Image
              src={second}
              alt="Down Arrow"
              width={32}
              height={64}
              className="object-contain"
            />
          </div>

          <div className="absolute top-48 left-64">
            <Image
              src={third}
              alt="Diagonal Left Arrow"
              width={96}
              height={64}
              className="object-contain"
            />
          </div>

          {/* A/B Split → Path B (down and right) */}
          <div className="absolute top-24 right-12">
            <Image
              src={fourth}
              alt="Down Arrow Blue"
              width={32}
              height={64}
              className="object-contain"
            />
          </div>

          {/* Path A → Deal Create */}
          <div className="absolute bottom-32 left-64" style={{ transform: "rotate(45deg)" }}>
            <Image
              src={five}
              alt="Diagonal Right Arrow"
              width={96}
              height={64}
              className="object-contain"
            />
          </div>

          {/* Path B → Deal Create */}
          <div className="absolute bottom-32 right-64" style={{ transform: "rotate(-45deg)" }}>
            <Image
              src={five}
              alt="Diagonal Left Arrow Blue"
              width={96}
              height={64}
              className="object-contain"
            />
          </div>

          {/* Labels */}
          <Label position="absolute top-16 left-96" color="red" text="Added to List" />
          <Label position="absolute top-52 left-72" color="red" text="Path A" />
          <Label position="absolute top-52 right-32" color="blue" text="Path B" />
          <Label position="absolute bottom-40 left-32" color="red" text="Out" />
          <Label position="absolute bottom-40 right-32" color="blue" text="Out" />
        </div>
      </div>
    </div>
  )
}

// Reusable Block Component
const WorkflowBlock = ({
  title,
  subtitle,
  extra,
  icon,
}: {
  title: string
  subtitle: string
  extra?: string
  icon: string
}) => (
  <div className="bg-red-900 rounded-lg p-4 text-white shadow-lg flex items-center gap-3 w-72 relative">
    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center flex-shrink-0">
      <span className="text-red-800 text-lg">{icon}</span>
    </div>
    <div>
      <div className="font-bold text-base">{title}</div>
      <div className="text-sm opacity-90">{subtitle}</div>
      {extra && <div className="text-sm opacity-90">{extra}</div>}
    </div>
  </div>
)

// Reusable Label
const Label = ({ position, color, text }: { position: string; color: "red" | "blue"; text: string }) => {
  const colors = {
    red: {
      border: "border-red-400",
      text: "text-red-600",
      bg: "bg-red-50",
    },
    blue: {
      border: "border-blue-400",
      text: "text-blue-600",
      bg: "bg-blue-50",
    },
  }

  return (
    <div className={`${position}`}>
      <div
        className={`${colors[color].bg} ${colors[color].border} border-2 rounded-full px-4 py-2 text-sm font-medium ${colors[color].text} shadow-sm`}
      >
        {text}
      </div>
    </div>
  )
}

export default AutomationWorkflow
