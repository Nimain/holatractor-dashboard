"use client"

import React from "react"
import Menubar from "@/components/Menubar/Menubar"
import Payment from "./PaymentHistory"  

const ServiceContainer = () => {
  return (
    <div className="w-full min-h-[100vh] p-[10px] 1050px:p-[30px] max-h-[1580px] bg-[#e5e5e5] relative overflow-auto">
      <Menubar pagename={"PaymentHistory"} />
      <Payment />   
    </div>
  )
}

export default ServiceContainer
