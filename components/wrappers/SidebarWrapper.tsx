"use client"

import { RootState } from '@/redux/store';
import React, { ReactNode } from 'react'
import { useSelector } from 'react-redux';
import Sidebar from '../Sidebar/Sidebar';

const SidebarWrapper = ({ children }: { children: ReactNode }) => {
    const { sidebarShow } = useSelector((root: RootState) => root.SidebarShow);
  return (
    <div
        className={`w-full min-h-[100vh] max-h-fit flex`}
      >
        <Sidebar />
        <div
        className={`transition-all duration-500 ${sidebarShow ? "pl-[190px]" : "pl-0"} w-full h-full bg-[#e5e5e5]`}
      >
        {children}
      </div>
      </div>
  )
}

export default SidebarWrapper