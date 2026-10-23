"use client"

import dynamic from 'next/dynamic'
import { ReactNode } from 'react'

const Sidebar = dynamic(
  ()=> import('@/components/Dashboards/Operator/_components/Sidebar'),
  {
      ssr: false,
    }
)

const SidebarWrapper = ({
    children,
  }: {
    children: ReactNode
  }) => {
  return (
    <div className="flex h-screen bg-[#EAF6FA] gap-4 px-4 md:px-8">
    <Sidebar/>
    {children}
    </div>
  )
}

export default SidebarWrapper