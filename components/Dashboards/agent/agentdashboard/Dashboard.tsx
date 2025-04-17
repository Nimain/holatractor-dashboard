"use client"

import React, { useEffect, useState } from 'react'
import Menubar from '../Menubar/Menubar'
import BookingChart from './BookingChart'
import { FarmerAndBookingChart } from './FarmerAndBookingChart'
import DetailBox from './DetailBox'
import { Tractor } from "lucide-react";
import FarmersPieChart from './FarmersPieChart'
import { renderInstance } from '@/utils/Axios/RenderInstance'
import { errorMessage } from '@/utils/Toastify/Messages'

interface UserCounts {
  farmers: number;
  operators: number;
  agents: number;
  owners: number;
  maleFarmers: number;
  femaleFarmers: number;
  otherFarmers: number;
}

const Dashboard = () => {
  const [userCounts, setUserCounts] = useState<UserCounts>()
  const [loading, setLoading] = useState(false)

  function fetchChartUserCounts() {
    setLoading(true)
    renderInstance.get("/user/charts/userCounts")
      .then((res) => {
        setUserCounts(res.data)
      }).catch(() => {
        errorMessage("Error in fetching user details")
      }).finally(() => {
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchChartUserCounts()
  }, [])

  return (
    <div
      className='w-full min-h-[100vh] p-[10px] 1050px:p-[30px] max-h-[1580px] bg-[#e5e5e5] flex flex-col gap-6 relative overflow-auto'>

      <Menubar pagename={'Dashboard'} />

      <div className='w-full grid grid-cols-4 gap-8'>

        <DetailBox
          count={loading ? "loading..." : `${userCounts?.farmers}`}
          heading={"Total Farmers"}
          icon={<Tractor />}
          bgcolorCode={"bg-green-200"}
          textcolorCode={"text-green-800"}
          href={"#"} />
       
        <DetailBox
          count={loading ? "loading..." : `${userCounts?.operators}`}
          heading={"Total Operators"}
          icon={<Tractor />}
          bgcolorCode={"bg-red-200"}
          textcolorCode={"text-red-800"}
          href={"/Operator"} />
        <DetailBox
          count={loading ? "loading..." : `${userCounts?.owners}`}
          heading={"Total Owners"}
          icon={<Tractor />}
          bgcolorCode={"bg-yellow-200"}
          textcolorCode={"text-yellow-800"}
          href={"/Owner"} />

      </div>

      {/* <StoreBooking /> */}

      <div className="flex items-center gap-5">

        <BookingChart />
        {
          loading ? <p>Loading</p>
            :
            userCounts &&
            <FarmersPieChart maleCount={userCounts?.maleFarmers} femaleCount={userCounts?.femaleFarmers} otherCount={userCounts?.otherFarmers} />
        }

      </div>

      <FarmerAndBookingChart />

    </div>
  )
}

export default Dashboard