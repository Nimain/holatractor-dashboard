"use client";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../../globals.css";
import dynamic from "next/dynamic";
import ReduxWrapper from "@/components/Dashboards/Dealer/wrapper/ReduxWrapper";
import { DealerLanguageProvider } from "@/context/DealerLanguageContext";

const TopBar = dynamic(
  () => import("../../../components/Dashboards/Dealer/_components/TopBar"),
  {
    ssr: false,
  }
);

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DealerLanguageProvider>
      <ReduxWrapper>
        <div className="flex flex-col md:flex-row min-h-screen">
          <ToastContainer />
          <div className="flex-1 flex flex-col overflow-hidden w-full">
            <TopBar />
            <div className="flex-1 overflow-auto">{children}</div>
          </div>
        </div>
      </ReduxWrapper>
    </DealerLanguageProvider>
  );
}