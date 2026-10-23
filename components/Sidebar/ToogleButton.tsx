"use client";

import { expandSidebarShow } from "@/redux/Sidebar/SidebarShow";
import { MenuIcon } from "lucide-react";
import React from "react";
import { useDispatch } from "react-redux";

const ToogleButton = () => {

    const dispatch = useDispatch()

  return (
    <div
      className="flex items-center justify-center w-fit p-2 aspect-square rounded-full mx-auto bg-gray-200 shadow-xl cursor-pointer"
      onClick={() => {
        dispatch(expandSidebarShow())
      }}
    >
      <MenuIcon />
    </div>
  );
};

export default ToogleButton;
