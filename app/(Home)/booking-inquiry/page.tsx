import dynamic from 'next/dynamic'
import React from 'react'

const AllInquiries = dynamic(
    ()=> import('@/components/booking-inquiry/Inquiry'),
    {
        ssr: false,
        loading: () => (
          <div className="w-full h-screen flex items-center justify-center">
            Loading...
          </div>
        )
      }
  )

const Inquiries = () => {
  return (
    <AllInquiries />
  )
}

export default Inquiries