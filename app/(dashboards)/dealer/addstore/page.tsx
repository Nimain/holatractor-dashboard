import dynamic from 'next/dynamic'
import React from 'react'

const AddStore = dynamic(
  ()=> import('@/components/Dashboards/Dealer/Store/AddStore'),
  {
      ssr: false,
      loading: () => (
        <div className="w-full h-screen flex items-center justify-center">
          Loading...
        </div>
      )
    }
)

const AddStorePage = () => {
  return (
    <AddStore />
  )
}

export default AddStorePage