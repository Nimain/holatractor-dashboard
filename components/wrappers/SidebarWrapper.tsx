"use client"

import { RootState } from '@/redux/store';
import React, { ReactNode } from 'react'
import { useSelector } from 'react-redux';
import Sidebar from '../Sidebar/Sidebar';

const SidebarWrapper = ({ children }: { children: ReactNode }) => {
    const { sidebarShow } = useSelector((root: RootState) => root.SidebarShow);
  return (
    <div
        className={`${
          sidebarShow ? "" : ""
        } w-full min-h-[100vh] max-h-fit flex`}
      >
        <Sidebar />
        {children}
      </div>
  )
}

export default SidebarWrapper