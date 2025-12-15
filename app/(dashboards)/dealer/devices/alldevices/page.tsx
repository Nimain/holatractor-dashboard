import dynamic from 'next/dynamic'
import React from 'react'

const Devices = dynamic(
  ()=> import('@/components/Dashboards/Dealer/Devices/AllDevices'),
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
    <Devices />
  )
}

export default LeadsPage