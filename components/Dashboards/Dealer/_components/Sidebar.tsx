"use client"
import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ChevronDown,
  Menu,
  Home,
  Store,
  Users,
  TrendingUp,
  DollarSign,
  FileText,
  Megaphone,
  Bell,
  Settings,
  Wrench,
  Calendar,
  BookOpen,
  Package,
  Target,
  BarChart,
  Zap,
  Inbox,
  AlertTriangle,
  Shield,
  LinkIcon,
  MessageSquare,
  Ticket,
} from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import HolaTractor from "../../../../assets/traclog.png"

const navigationItems = [
  { icon: Home, label: "Dashboard", href: "/dealer" },
  { icon: Store, label: "Store", href: "/dealer/viewstore" },
]

const dropdownSections = [
  {
    icon: Users,
    label: "Customer",
    items: [
      { icon: FileText, label: "Customer List", href: "/dealer/customer" },
      { icon: Ticket, label: "Support Tickets", href: "/demo" },
      { icon: MessageSquare, label: "Feedback", href: "/demo" },
    ],
  },
  {
    icon: TrendingUp,
    label: "Leads",
    items: [
      { icon: DollarSign, label: "Sales", href: "/dealer/leads/sells" },
      { icon: FileText, label: "Lease", href: "/dealer/leads/lease" },
      { icon: Target, label: "Lead Scoring", href: "/dealer/sells" },
      { icon: BarChart, label: "Conversion Rates", href:"/dealer/leads/conversion" },
    ],
  },
  {
    icon: Megaphone,
    label: "Marketing",
    href: "/dealer/marketing", // Added href for the main Marketing section
    items: [
      { icon: Zap, label: "Campaigns", href: "/dealer/marketing/campaigns" },
      { icon: FileText, label: "Template", href: "/dealer/marketing/template" }, // Added new sub-label
      { icon: BarChart, label: "Analytics", href: "/dealer/marketing/analytics" },
      { icon: Settings, label: "Automation", href: "/dealer/marketing/automation" },
    ],
  },
  {
    icon: Bell,
    label: "Notifications",
    items: [
      { icon: Inbox, label: "All Notifications", href: "/demo" },
      { icon: Settings, label: "Settings", href: "/demo" },
      { icon: AlertTriangle, label: "Alerts", href: "/demo" },
    ],
  },
  {
    icon: Settings,
    label: "Settings",
    items: [
      { icon: Settings, label: "General", href: "/demo" },
      { icon: Shield, label: "Security", href: "/demo" },
      { icon: LinkIcon, label: "Integrations", href: "/demo" },
    ],
  },
  {
    icon: Wrench,
    label: "Repairs",
    items: [
      { icon: Calendar, label: "Schedule Repair", href: "/demo" },
      { icon: BookOpen, label: "Maintenance Log", href: "/demo" },
      { icon: Package, label: "Parts Inventory", href: "/demo" },
    ],
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [isExpanded, setIsExpanded] = useState(true)
  const [openSections, setOpenSections] = useState<string[]>([])

  // Function to check if a route is active
  const isActiveRoute = (href: string) => {
    if (href === "/dealer") {
      return pathname === "/dealer"
    }
    return pathname.startsWith(href)
  }

  // Function to check if any item in a section is active
  const isSectionActive = (section: any) => {
    if (section.href && isActiveRoute(section.href)) {
      return true
    }
    if (section.items) {
      return section.items.some((item: any) => isActiveRoute(item.href))
    }
    return false
  }

  // Auto-expand sections that contain active items
  useEffect(() => {
    const activeSections: string[] = []
    dropdownSections.forEach((section) => {
      if (isSectionActive(section)) {
        activeSections.push(section.label)
      }
    })

    setOpenSections((prev) => {
      const combinedSections = [...prev, ...activeSections]
      const uniqueSections = Array.from(new Set(combinedSections))
      return uniqueSections
    })
  }, [pathname])

  const toggleSection = (section: string) => {
    setOpenSections((prev) => (prev.includes(section) ? prev.filter((item) => item !== section) : [...prev, section]))
  }

  return (
    <aside
      className={`bg-white shadow-lg transition-all duration-300 flex flex-col h-screen ${
        isExpanded ? "w-80" : "w-20"
      }`}
    >
      {/* Logo Section */}
      <div className="px-6 py-6 border-b border-red-100">
        <div className="flex items-center justify-center">
          <Image
            src={HolaTractor || "/placeholder.svg"}
            alt="Hola Tractor"
            width={isExpanded ? 150 : 40}
            height={40}
            className="transition-all duration-300"
          />
        </div>
      </div>
      {/* Toggle Button */}
      <div className="flex justify-center p-4 border-b border-red-100">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="hover:bg-red-50 p-3 rounded-lg transition-colors duration-200"
        >
          <Menu className="h-6 w-6 text-[#F91F1F]" />
        </button>
      </div>
      {/* Navigation */}
      <div className="flex-1 overflow-y-auto">
        <nav className="py-4 px-4">
          {/* Main Navigation Items */}
          {navigationItems.map((item, index) => {
            const IconComponent = item.icon
            const isActive = isActiveRoute(item.href)
            return (
              <div key={item.label}>
                <Link
                  href={item.href}
                  className={`flex items-center px-4 py-4 rounded-xl transition-all duration-200 mb-2 ${
                    isActive ? "bg-[#F91F1F] text-white shadow-lg" : "text-[#F91F1F] hover:bg-red-50"
                  }`}
                >
                  <IconComponent className="h-6 w-6 flex-shrink-0" />
                  {isExpanded && <span className="ml-4 font-semibold text-base">{item.label}</span>}
                </Link>
                {index < navigationItems.length - 1 && <div className="mx-4 my-3 h-px bg-red-100"></div>}
              </div>
            )
          })}
          {/* Dropdown Sections */}
          <div className="mt-4">
            {dropdownSections.map((section, sectionIndex) => {
              const IconComponent = section.icon
              const isOpen = openSections.includes(section.label)
              const isActiveSection = isSectionActive(section)

              return (
                <div key={section.label} className="mb-2">
                  <Collapsible open={isOpen} onOpenChange={() => toggleSection(section.label)}>
                    <div
                      className={`flex items-center justify-between w-full px-4 py-4 rounded-xl transition-all duration-200 ${
                        isOpen || isActiveSection ? "bg-red-50 text-[#F91F1F]" : "text-[#F91F1F] hover:bg-red-50"
                      }`}
                    >
                      {/* Main content: Link or div */}
                      {section.href ? (
                        <Link href={section.href} className="flex items-center min-w-0 flex-1">
                          <IconComponent className="h-6 w-6 flex-shrink-0" />
                          {isExpanded && <span className="ml-4 font-semibold text-base truncate">{section.label}</span>}
                        </Link>
                      ) : (
                        <div className="flex items-center min-w-0 flex-1">
                          <IconComponent className="h-6 w-6 flex-shrink-0" />
                          {isExpanded && <span className="ml-4 font-semibold text-base truncate">{section.label}</span>}
                        </div>
                      )}

                      {/* Collapsible trigger: ChevronDown button */}
                      {isExpanded && section.items && (
                        <CollapsibleTrigger asChild>
                          <button className="p-1 rounded-full hover:bg-red-100">
                            <ChevronDown
                              className={`w-5 h-5 transition-transform duration-200 flex-shrink-0 ml-3 ${
                                isOpen ? "transform rotate-180" : ""
                              }`}
                            />
                          </button>
                        </CollapsibleTrigger>
                      )}
                    </div>

                    {/* Collapsible Content (only used when isExpanded is true) */}
                    {section.items && isExpanded && (
                      <CollapsibleContent className="mt-2">
                        <div className="ml-8 border-l-2 border-red-200 pl-4">
                          {section.items.map((item) => {
                            const ItemIconComponent = item.icon
                            const isItemActive = isActiveRoute(item.href)
                            return (
                              <Link
                                key={item.label}
                                href={item.href}
                                className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 mb-1 ${
                                  isItemActive ? "bg-[#F91F1F] text-white shadow-md" : "text-[#F91F1F] hover:bg-red-50"
                                }`}
                              >
                                <ItemIconComponent className="h-5 w-5 flex-shrink-0" />
                                <span className="ml-3 font-medium text-sm truncate">{item.label}</span>
                              </Link>
                            )
                          })}
                        </div>
                      </CollapsibleContent>
                    )}

                    {/* Collapsed state rendering (when !isExpanded) */}
                    {section.items && !isExpanded && isOpen && (
                      <div className="mt-1">
                        {section.items.map((item) => {
                          const ItemIconComponent = item.icon
                          const isItemActive = isActiveRoute(item.href)
                          return (
                            <Link
                              key={item.label}
                              href={item.href}
                              className={`flex items-center justify-center py-2 mb-1 rounded-lg transition-all duration-200 ${
                                isItemActive ? "bg-[#F91F1F] text-white shadow-md" : "text-[#F91F1F] hover:bg-red-50"
                              }`}
                              title={item.label}
                            >
                              <ItemIconComponent className="h-4 w-4" />
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </Collapsible>
                  {sectionIndex < dropdownSections.length - 1 && <div className="mx-4 my-3 h-px bg-red-100"></div>}
                </div>
              )
            })}
          </div>
        </nav>
      </div>
    </aside>
  )
}
