"use client"

import  React from "react"
import { usePathname, useRouter } from "next/navigation"
import { Settings, ChevronRight, Home, Sparkles } from "lucide-react"

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

  return (
    <div className="flex flex-col min-h-screen">
      {/* Stunning Header with Glassmorphism and Animated Gradient */}
      <header className="relative flex items-center justify-between h-20 px-6 border-b border-white/20 shrink-0 md:px-8 overflow-hidden">
        {/* Animated Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-violet-600/10 via-purple-600/10 to-fuchsia-600/10 bg-[length:400%_400%] animate-pulse"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-indigo-50/30 to-purple-50/50 backdrop-blur-xl"></div>
        
        {/* Floating Orbs Animation */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-r from-violet-400/20 to-purple-400/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-r from-fuchsia-400/20 to-pink-400/20 rounded-full blur-xl animate-bounce"></div>
        
        {/* Enhanced Breadcrumb Navigation */}
        <nav className="relative z-10 flex items-center space-x-1" aria-label="Breadcrumb">
          <div className="flex items-center bg-white/60 backdrop-blur-md rounded-full px-4 py-2 shadow-lg border border-white/30 hover:shadow-xl transition-all duration-300">
            <ol className="flex items-center space-x-1">
              {breadcrumbItems.map((item, index) => (
                <li key={item.href} className="flex items-center group">
                  {index > 0 && (
                    <div className="mx-3 relative">
                      <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-violet-500 transition-all duration-200" />
                      <div className="absolute inset-0 bg-violet-400/20 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                    </div>
                  )}
                  
                  {item.isLast ? (
                    <div className="relative">
                      <span className="font-semibold flex items-center gap-2 px-3 py-1.5">
                        {item.icon && (
                          <span className="relative">
                            {React.createElement(item.icon, { className: "h-4 w-4 text-violet-600" })}
                            <Sparkles className="h-3 w-3 text-[#f87019] absolute -top-1 -right-1 animate-pulse" />
                          </span>
                        )}
                        <span className="relative text-transparent bg-gradient-to-r from-[#f87019] to-[#f87019] bg-clip-text">
                          {item.label}
                          <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-[#f87019] to-[#f87019] rounded-full"></div>
                        </span>
                      </span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleBreadcrumbClick(item.href)}
                      className="relative text-slate-600 hover:text-white font-medium flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gradient-to-r hover:from-violet-500 hover:to-fuchsia-500 transition-all duration-300 transform hover:scale-105 hover:shadow-lg group"
                      type="button"
                    >
                      {/* Hover Background Effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-violet-500/0 to-fuchsia-500/0 group-hover:from-violet-500/100 group-hover:to-fuchsia-500/100 rounded-lg transition-all duration-300 opacity-0 group-hover:opacity-100"></div>
                      
                      <span className="relative z-10 flex items-center gap-2">
                        {item.icon && React.createElement(item.icon, { 
                          className: "h-4 w-4 group-hover:animate-pulse" 
                        })}
                        {item.label}
                      </span>
                      
                      {/* Subtle Glow Effect */}
                      <div className="absolute inset-0 bg-violet-400/20 rounded-lg blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
                    </button>
                  )}
                </li>
              ))}
            </ol>
          </div>
        </nav>

        {/* Enhanced Settings Button */}
       
      </header>
      
      <main className="flex-1 p-6 md:p-8 bg-gradient-to-br from-slate-50 via-white to-violet-50/30 relative">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(139,92,246,0.15)_1px,transparent_0)] [background-size:20px_20px] opacity-30"></div>
        <div className="relative z-10">
          {children}
        </div>
      </main>
    </div>
  )
}