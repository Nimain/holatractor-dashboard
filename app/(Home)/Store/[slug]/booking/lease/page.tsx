import dynamic from 'next/dynamic'
import React from 'react'

const Booking = dynamic(
  ()=> import('@/components/Store/booking/Lease/StoreBookingLeaseContainer'),
  {
      ssr: false,
      loading: () => (
        <div className="w-full h-screen flex items-center justify-center">
          Loading...
        </div>
      )
    }
)

const LeaseBooking = () => {
  return (
    <Booking />
  )
}

export default LeaseBooking