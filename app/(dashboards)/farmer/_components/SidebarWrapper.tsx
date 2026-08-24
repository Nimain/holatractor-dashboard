"use client"

import { ConfirmationProvider } from '@/components/wrappers/ConfirmationWrapper';
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
        <div className="flex h-screen bg-slate-100/60 dark:bg-slate-950 gap-4 px-3 md:px-6 overflow-hidden">
            <FarmProvider>
                <ConfirmationProvider>
                    <Sidebar />
                    {children}
                </ConfirmationProvider>
            </FarmProvider>
        </div>
    )
}

export default SidebarWrapper