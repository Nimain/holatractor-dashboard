import dynamic from 'next/dynamic'
import React from 'react'

const Booking = dynamic(
    ()=> import('@/components/Store/booking/StoreBookingContainer'),
    {
        ssr: false,
        loading: () => (
          <div className="w-full h-screen flex items-center justify-center">
            Loading...
          </div>
        )
      }
  )

const NewBooking = () => {
  return (
    <Booking />
  )
}

export default NewBooking