"use client";

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronDown, Menu } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import HolaTractor from "../../../../assets/traclog.png"

const navigationItems = [
  { icon: '🔴', label: 'Dashboard', href: '/dealer' },
  // { icon: '🌾', label: 'Farms', href: '/farms' },
  // { icon: '💼', label: 'Business', href: '/business' },
]

const dropdownSections = [
  {
    icon: '🏪',
    label: 'Store',
    href: '/dealer/viewstore'
  },
  {
    icon: '👥',
    label: 'Customer',
    items: [
      { icon: '📋', label: 'Customer List', href: '/dealer/customer'},
      { icon: '🎫', label: 'Support Tickets', href: '/demo' },
      { icon: '💬', label: 'Feedback', href: '/demo' }
    ]
  },
  {
    icon: '📈',
    label: 'Leads',
    items: [
        { icon: '💰', label: 'Sales', href: '/dealer/sells' },
      { icon: '🆕', label: 'Lease', href: '/dealer/leads' },
      { icon: '🎯', label: 'Lead Scoring', href: '/demo' },
      { icon: '📊', label: 'Conversion Rates', href: '/demo' }
    ]
  },
  {
    icon: '📢',
    label: 'Marketing',
    items: [
      { icon: '🚀', label: 'Campaigns', href: '/demo' },
      { icon: '📊', label: 'Analytics', href: '/demo' },
      { icon: '⚡', label: 'Automation', href: '/demo' }
    ]
  },
  {
    icon: '🔔',
    label: 'Notifications',
    items: [
      { icon: '📬', label: 'All Notifications', href: '/demo' },
      { icon: '⚙️', label: 'Settings', href: '/demo' },
      { icon: '🚨', label: 'Alerts', href: '/demo' }
    ]
  },
  {
    icon: '⚙️',
    label: 'Settings',
    items: [
      { icon: '🔧', label: 'General', href: '/demo' },
      { icon: '🔒', label: 'Security', href: '/demo' },
      { icon: '🔗', label: 'Integrations', href: '/demo' }
    ]
  },
  {
    icon: '🚜',
    label: 'Tractor Repair',
    items: [
      { icon: '📅', label: 'Schedule Repair', href: '/demo' },
      { icon: '📝', label: 'Maintenance Log', href: '/demo' },
      { icon: '🔧', label: 'Parts Inventory', href: '/demo' }
    ]
  }
]

export default function Sidebar() {
  const pathname = usePathname()
  const [isExpanded, setIsExpanded] = useState(true)
  const [openSections, setOpenSections] = useState<string[]>([])

  // Function to check if a route is active
  const isActiveRoute = (href: string) => {
    if (href === '/dealer') {
      return pathname === '/dealer'
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
    
    setOpenSections(prev => {
      const combinedSections = [...prev, ...activeSections]
      const uniqueSections = Array.from(new Set(combinedSections))
      return uniqueSections
    })
  }, [pathname])

  const toggleSection = (section: string) => {
    setOpenSections(prev =>
      prev.includes(section)
        ? prev.filter(item => item !== section)
        : [...prev, section]
    )
  }

  return (
    <aside className={`bg-white shadow-lg transition-all duration-300 flex flex-col h-screen ${
      isExpanded ? 'w-64' : 'w-16'
    }`}>
      <div className="px-2 py-4 border-b border-gray-100">
        <Image
          src={HolaTractor}
          alt="Hola Tractor"
          width={isExpanded ? 150 : 40}
          height={40}
          className="mx-auto transition-all duration-300"
        />
      </div>
      <div className="flex justify-center p-3 border-b border-gray-100">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="hover:bg-gray-100 p-2 rounded-lg transition-colors duration-200"
        >
          <Menu className="h-5 w-5 text-gray-600" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
        <nav className="mt-4 space-y-0.5">
          {navigationItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors duration-200 ${
                isActiveRoute(item.href) ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600' : ''
              }`}
            >
              <span className="text-xl mr-3">{item.icon}</span>
              {isExpanded && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          ))}

          <div className="pt-3">
            {dropdownSections.map((section) => (
              <div key={section.label} className="relative">
                <Collapsible
                  open={openSections.includes(section.label)}
                  onOpenChange={() => toggleSection(section.label)}
                >
                  <CollapsibleTrigger className={`flex items-center justify-between w-full px-4 py-2.5 hover:bg-gray-50 transition-colors duration-200 ${
                    openSections.includes(section.label) || isSectionActive(section) ? 'bg-gray-50' : ''
                  }`}>
                    <div className="flex items-center min-w-0">
                      <span className={`text-xl ${!isExpanded && 'mx-auto'}`}>{section.icon}</span>
                      {isExpanded && (
                        <span className={`ml-3 text-sm font-medium truncate ${
                          isSectionActive(section) ? 'text-blue-600' : 'text-gray-700'
                        }`}>
                          {section.label}
                        </span>
                      )}
                    </div>
                    {isExpanded && section.items && (
                      <ChevronDown
                        className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 
                          ${openSections.includes(section.label) ? 'transform rotate-180' : ''}`}
                      />
                    )}
                  </CollapsibleTrigger>
                  
                  {/* Handle sections with direct href (like Store) */}
                  {section.href && !section.items && (
                    <Link 
                      href={section.href}
                      className={`flex items-center px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors duration-200 ${
                        isActiveRoute(section.href) ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600' : ''
                      }`}
                    >
                      <span className="text-xl mr-3">{section.icon}</span>
                      {isExpanded && <span className="text-sm font-medium">{section.label}</span>}
                    </Link>
                  )}

                  {section.items && (
                    <>
                      {isExpanded ? (
                        <CollapsibleContent className="bg-gray-50/50">
                          {section.items.map((item) => (
                            <Link
                              key={item.label}
                              href={item.href}
                              className={`flex items-center px-11 py-2 text-sm text-gray-600 hover:bg-gray-100 transition-colors duration-200 ${
                                isActiveRoute(item.href) ? 'bg-blue-100 text-blue-600 border-r-2 border-blue-600' : ''
                              }`}
                            >
                              <span className="text-lg mr-2">{item.icon}</span>
                              {item.label}
                            </Link>
                          ))}
                        </CollapsibleContent>
                      ) : (
                        <div className="border-l border-gray-200 ml-8 my-1">
                          {section.items.map((item) => (
                            <Link
                              key={item.label}
                              href={item.href}
                              className={`flex items-center justify-center py-2.5 hover:bg-gray-50 transition-colors duration-200 ${
                                isActiveRoute(item.href) ? 'bg-blue-50 border-r-2 border-blue-600' : ''
                              }`}
                            >
                              <span className={`text-lg ${isActiveRoute(item.href) ? 'text-blue-600' : ''}`}>
                                {item.icon}
                              </span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </Collapsible>
              </div>
            ))}
          </div>
        </nav>
      </div>
    </aside>
  )
}