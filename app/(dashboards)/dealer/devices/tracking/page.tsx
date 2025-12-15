import dynamic from 'next/dynamic'
import React from 'react'

const Tracking = dynamic(
  ()=> import('@/components/Dashboards/Dealer/Devices/Tracking'),
  {
      ssr: false,
      loading: () => (
        <div className="w-full h-screen flex items-center justify-center">
          Loading...
        </div>
      )
    }
)

const LeadsPage = () => {
  return (
    <Tracking />
  )
}

export default LeadsPage