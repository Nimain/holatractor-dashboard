"use client"

import dynamic from 'next/dynamic'

const DealerPage = dynamic(
  () => import('@/components/Dashboards/Dealer/Dealer'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-screen flex items-center justify-center text-lg text-gray-600">
        Loading...
      </div>
    )
  }
)

export default function DealerDashboardPage() {
  return (
    <DealerPage />
  )
}