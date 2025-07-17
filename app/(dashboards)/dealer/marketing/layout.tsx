"use client"

import type React from "react"
import { usePathname } from "next/navigation"
import { Settings } from "lucide-react"

import { Button } from "@/components/ui/button"

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  // Extract the last segment of the path and format it for the title
  const pathSegments = pathname.split("/").filter(Boolean)
  const currentPageSegment = pathSegments[pathSegments.length - 1]

  let pageTitle = "Marketing Dashboard"
  if (currentPageSegment === "marketing") {
    pageTitle = "Marketing Overview"
  } else if (currentPageSegment) {
    pageTitle = currentPageSegment.charAt(0).toUpperCase() + currentPageSegment.slice(1)
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex items-center justify-between h-16 px-4 border-b shrink-0 md:px-6">
        <h1 className="text-lg font-semibold md:text-xl">Marketing &gt;&gt; {pageTitle}</h1>
        <Button variant="ghost" size="icon">
          <Settings className="h-5 w-5" />
          <span className="sr-only">Settings</span>
        </Button>
      </header>
      <main className="flex-1 p-4 md:p-6">{children}</main>
    </div>
  )
}
