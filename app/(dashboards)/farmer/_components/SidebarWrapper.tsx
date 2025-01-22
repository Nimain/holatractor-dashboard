"use client"

import { FarmProvider } from '@/components/wrappers/FarmProvider';
import dynamic from 'next/dynamic'
import { ReactNode } from 'react'

const Sidebar = dynamic(
    () => import('@/components/Dashboards/Farmer/_components/Sidebar'),
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
            <FarmProvider>
                <Sidebar />
                {children}
            </FarmProvider>
        </div>
    )
}

export default SidebarWrapper