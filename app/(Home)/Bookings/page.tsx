import dynamic from 'next/dynamic'
import React from 'react'

const AllBookings = dynamic(
    ()=> import('@/components/Bookings/BookingsContainer'),
    {
        ssr: false,
        loading: () => (
          <div className="w-full h-screen flex items-center justify-center">
            Loading...
          </div>
        )
      }
  )

const Bookings = () => {
  return (
    <AllBookings />
  )
}

export default Bookings