"use client"

import dynamic from 'next/dynamic'
import { ReactNode } from 'react'

interface user {
    userId: string;
    image: string;
    name: string;
    email: string;
    email_varified: boolean;
}

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
            <Sidebar />
            {children}
        </div>
    )
}

export default SidebarWrapper