"use client"

import React from 'react'
import Store from './Store'
import Menubar from "@/components/Menubar/Menubar"

const StoreContainer = () => {
  return (
    <div
      className='w-full min-h-[100vh] p-[10px] 1050px:p-[30px] max-h-[1580px] bg-[#e5e5e5] relative overflow-auto'>

      <Menubar pagename={'Store'} />

      <Store />

    </div>
  )
}

export default StoreContainer