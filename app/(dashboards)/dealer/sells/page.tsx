import dynamic from 'next/dynamic'
import React from 'react'

const Sales = dynamic(
  ()=> import('@/components/Dashboards/Dealer/Sales/Sales'),
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
    <Sales />
  )
}

export default LeadsPage