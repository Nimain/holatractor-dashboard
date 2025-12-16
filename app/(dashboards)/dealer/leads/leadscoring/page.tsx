import dynamic from 'next/dynamic'
import React from 'react'

const Leadscoring = dynamic(
  ()=> import('@/components/Dashboards/Dealer/Leads/LeadScoring'),
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
    <Leadscoring />
  )
}

export default LeadsPage