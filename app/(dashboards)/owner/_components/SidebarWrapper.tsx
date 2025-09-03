"use client";

import { AddStoreItemProvider } from "@/components/wrappers/AddStoreItemProvider";
import { OperatorsRequestToJoinStoreProvider } from "@/components/wrappers/OperatorsRequestToJoinStoreProvider";
import { OwnerStoreProvider } from "@/components/wrappers/StoreProvider";
import dynamic from "next/dynamic";
import { ReactNode } from "react";
import ChatButton from "@/components/ChatButton";

const Sidebar = dynamic(
  () => import("@/components/Dashboards/Owner/_components/Sidebar"),
  {
    ssr: false,
  }
);

const SidebarWrapper = ({ children }: { children: ReactNode }) => {
  return (
    <div className="flex h-screen bg-[#EAF6FA] gap-4 px-4 md:px-8">
      <OwnerStoreProvider>
        <OperatorsRequestToJoinStoreProvider>
          <AddStoreItemProvider>
            <Sidebar />
            {children}
            <ChatButton />
          </AddStoreItemProvider>
        </OperatorsRequestToJoinStoreProvider>
      </OwnerStoreProvider>
    </div>
  );
};

export default SidebarWrapper;
