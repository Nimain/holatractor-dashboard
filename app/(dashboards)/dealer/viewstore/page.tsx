import dynamic from 'next/dynamic'
import React from 'react'

const ViewStore = dynamic(
  ()=> import('@/components/Dashboards/Dealer/Store/ViewStore'),
  {
      ssr: false,
      loading: () => (
        <div className="w-full h-screen flex items-center justify-center">
          Loading...
        </div>
      )
    }
)

const ViewStorePage = () => {
  return (
    <ViewStore />
  )
}

export default ViewStorePage