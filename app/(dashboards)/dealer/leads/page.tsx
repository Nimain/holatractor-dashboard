import dynamic from 'next/dynamic'
import React from 'react'

const Leads = dynamic(
  ()=> import('@/components/Dashboards/Dealer/Leads/Leads'),
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
    <Leads />
  )
}

export default LeadsPage