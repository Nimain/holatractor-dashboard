import dynamic from 'next/dynamic'
import React from 'react'

const Customer = dynamic(
  ()=> import('@/components/Dashboards/Dealer/Customers/Customer'),
  {
      ssr: false,
      loading: () => (
        <div className="w-full h-screen flex items-center justify-center">
          Loading...
        </div>
      )
    }
)

const CustomerPage = () => {
  return (
    <Customer />
  )
}

export default CustomerPage