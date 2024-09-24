import React from 'react'
import Menubar from '../Menubar/Menubar'
import BookingChart from './BookingChart'
import { FarmerAndBookingChart } from './FarmerAndBookingChart'
import DetailBox from './DetailBox'

const Dashboard = () => {
  return (
    <div
      className='w-full min-h-[100vh] p-[10px] 1050px:p-[30px] max-h-[1580px] bg-[#e5e5e5] flex flex-col gap-6 relative overflow-auto'>

      <Menubar pagename={'Dashboard'} />

      <div className='w-full flex gap-5 flex-wrap'>

<DetailBox count={"10"} heading={"Active Farmers"} />
<DetailBox count={"10"} heading={"Inactive Farmers"} />
<DetailBox count={"10"} heading={"Male Farmers"} />
<DetailBox count={"10"} heading={"Female Farmers"} />
<DetailBox count={"10"} heading={"Total Agents"} />
<DetailBox count={"10"} heading={"Total Operators"} />
<DetailBox count={"10"} heading={"Total Owners"} />

      </div>

      {/* <StoreBooking /> */}

      <BookingChart />

      <FarmerAndBookingChart />

    </div>
  )
}

export default Dashboard