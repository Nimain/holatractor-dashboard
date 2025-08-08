"use client"

import React from "react"
import { usePathname, useRouter } from "next/navigation"
import { Settings, ChevronRight, Home } from "lucide-react"

import { Button } from "@/components/ui/button"

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()

  // Generate breadcrumb items from pathname
  const pathSegments = pathname.split("/").filter(Boolean)
  
  const breadcrumbItems = [
    {
      label: "Dashboard",
      href: "/",
      icon: Home,
      isLast: false
    },
    ...pathSegments.map((segment, index) => {
      const href = "/" + pathSegments.slice(0, index + 1).join("/")
      const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ")
      
      return {
        label,
        href,
        icon: null as React.ComponentType<{ className?: string }> | null,
        isLast: index === pathSegments.length - 1
      }
    })
  ]

  // Update the last item status for dashboard
  if (breadcrumbItems.length > 1) {
    breadcrumbItems[0].isLast = false
  } else {
    breadcrumbItems[0].isLast = true
  }

  const handleBreadcrumbClick = (href: string) => {
    router.push(href)
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="rounded-mdflex items-center justify-between h-16 px-4 bg-red-800 text-white border-b border-red-700 shrink-0 md:px-6">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center space-x-1" aria-label="Breadcrumb">
          <div className="flex items-center bg-red-700 rounded-lg px-4 py-2 border border-red-600">
            <ol className="flex items-center space-x-1">
              {breadcrumbItems.map((item, index) => (
                <li key={item.href} className="flex items-center">
                  {index > 0 && (
                    <div className="mx-2">
                      <ChevronRight className="h-4 w-4 text-red-200" />
                    </div>
                  )}
                  
                  {item.isLast ? (
                    <div className="font-semibold flex items-center gap-2 px-2 py-1">
                      {item.icon && (
                        <span>
                          {React.createElement(item.icon, { className: "h-4 w-4 text-white" })}
                        </span>
                      )}
                      <span className="text-white">
                        {item.label}
                      </span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleBreadcrumbClick(item.href)}
                      className="text-red-200 hover:text-white font-medium flex items-center gap-2 px-2 py-1 rounded hover:bg-red-600 transition-colors"
                      type="button"
                    >
                      {item.icon && React.createElement(item.icon, { 
                        className: "h-4 w-4" 
                      })}
                      {item.label}
                    </button>
                  )}
                </li>
              ))}
            </ol>
          </div>
        </nav>

        <Button variant="ghost" size="icon" className="text-white hover:bg-red-700 hover:text-white">
          <Settings className="h-5 w-5" />
          <span className="sr-only">Settings</span>
        </Button>
      </header>
      <main className="flex-1 p-4 md:p-6 bg-gray-100">
        {children}
      </main>
    </div>
  )
}