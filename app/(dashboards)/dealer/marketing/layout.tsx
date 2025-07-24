"use client"

import React from "react"
import { usePathname, useRouter } from "next/navigation"
import { Settings, ChevronRight, Home, MoreHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"

export default function MarketingLayout({
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

  // Helper function to render breadcrumb items for mobile
  const renderMobileBreadcrumb = () => {
    if (breadcrumbItems.length <= 2) {
      return renderFullBreadcrumb()
    }

    const firstItem = breadcrumbItems[0]
    const lastItem = breadcrumbItems[breadcrumbItems.length - 1]
    
    return (
      <ol className="flex items-center space-x-1">
        {/* First item */}
        <li className="flex items-center">
          {firstItem.isLast ? (
            <div className="font-semibold flex items-center gap-2 px-2 py-1">
              {firstItem.icon && (
                <span>
                  {React.createElement(firstItem.icon, { className: "h-4 w-4 text-white" })}
                </span>
              )}
              <span className="text-white text-sm">
                {firstItem.label}
              </span>
            </div>
          ) : (
            <button
              onClick={() => handleBreadcrumbClick(firstItem.href)}
              className="text-red-200 hover:text-white font-medium flex items-center gap-2 px-2 py-1 rounded hover:bg-red-600 transition-colors"
              type="button"
            >
              {firstItem.icon && React.createElement(firstItem.icon, { 
                className: "h-4 w-4" 
              })}
              <span className="text-sm">{firstItem.label}</span>
            </button>
          )}
        </li>

        {/* Ellipsis for collapsed items */}
        {breadcrumbItems.length > 2 && (
          <>
            <li className="flex items-center">
              <div className="mx-2">
                <ChevronRight className="h-4 w-4 text-red-200" />
              </div>
            </li>
            <li className="flex items-center">
              <div className="px-2 py-1 text-red-200">
                <MoreHorizontal className="h-4 w-4" />
              </div>
            </li>
          </>
        )}

        {/* Last item (if not the same as first) */}
        {breadcrumbItems.length > 1 && (
          <>
            <li className="flex items-center">
              <div className="mx-2">
                <ChevronRight className="h-4 w-4 text-red-200" />
              </div>
            </li>
            <li className="flex items-center">
              {lastItem.isLast ? (
                <div className="font-semibold flex items-center gap-2 px-2 py-1">
                  {lastItem.icon && (
                    <span>
                      {React.createElement(lastItem.icon, { className: "h-4 w-4 text-white" })}
                    </span>
                  )}
                  <span className="text-white text-sm">
                    {lastItem.label}
                  </span>
                </div>
              ) : (
                <button
                  onClick={() => handleBreadcrumbClick(lastItem.href)}
                  className="text-red-200 hover:text-white font-medium flex items-center gap-2 px-2 py-1 rounded hover:bg-red-600 transition-colors"
                  type="button"
                >
                  {lastItem.icon && React.createElement(lastItem.icon, { 
                    className: "h-4 w-4" 
                  })}
                  <span className="text-sm">{lastItem.label}</span>
                </button>
              )}
            </li>
          </>
        )}
      </ol>
    )
  }

  // Helper function to render full breadcrumb
  const renderFullBreadcrumb = () => (
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
  )

  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex items-center justify-between h-16 px-2 sm:px-4 bg-red-800 text-white border-b border-red-700 shrink-0 md:px-6">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center space-x-1 min-w-0 flex-1 mr-2" aria-label="Breadcrumb">
          <div className="flex items-center bg-red-700 rounded-lg px-2 sm:px-4 py-2 border border-red-600 min-w-0 max-w-full overflow-hidden">
            {/* Mobile: Show collapsed breadcrumb on small screens */}
            <div className="block sm:hidden min-w-0">
              {renderMobileBreadcrumb()}
            </div>
            
            {/* Desktop: Show full breadcrumb on larger screens */}
            <div className="hidden sm:block min-w-0">
              {renderFullBreadcrumb()}
            </div>
          </div>
        </nav>

        <Button variant="ghost" size="icon" className="text-white hover:bg-red-700 hover:text-white flex-shrink-0">
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