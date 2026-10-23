import Menubar from '@/components/Menubar/Menubar'
import React from 'react'
import StoreBookingLease from './StoreBookingLease'

const StoreBookingLeaseContainer = () => {
  return (
    <div
      className='w-full min-h-[100vh] p-[10px] 1050px:p-[30px] max-h-[1580px] bg-[#e5e5e5] relative overflow-auto'>

      <Menubar pagename={'Store new lease booking'} />

      <StoreBookingLease />

    </div>
  )
}

export default StoreBookingLeaseContainer