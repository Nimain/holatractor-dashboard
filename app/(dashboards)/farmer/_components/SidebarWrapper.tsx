"use client";

import { ConfirmationProvider } from "@/components/wrappers/ConfirmationWrapper";
import { FarmProvider } from "@/components/wrappers/FarmProvider";
import dynamic from "next/dynamic";
import { ReactNode } from "react";
import ChatButton from "@/components/ChatButton";

const Sidebar = dynamic(
  () => import("@/components/Dashboards/Farmer/_components/Sidebar"),
  {
    ssr: false,
  }
);

const SidebarWrapper = ({ children }: { children: ReactNode }) => {
  return (
    <div className="flex h-screen bg-[#EAF6FA] gap-4 px-4 md:px-8">
      <FarmProvider>
        <ConfirmationProvider>
          <Sidebar />
          {children}
          <ChatButton />
        </ConfirmationProvider>
      </FarmProvider>
    </div>
  );
};

export default SidebarWrapper;
