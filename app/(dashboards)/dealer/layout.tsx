"use client"

import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import "../../globals.css"
import dynamic from "next/dynamic"
import ReduxWrapper from "@/components/Dashboards/Dealer/wrapper/ReduxWrapper"

// const Sidebar = dynamic(
//   () => import("../../../components/Dashboards/Dealer/_components/Sidebar"),
//   {
//     ssr: false
//   }
// )
const TopBar = dynamic(
  () => import("../../../components/Dashboards/Dealer/_components/TopBar"),
  {
    ssr: false
  }
)

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'Poppins' }} >
        <ReduxWrapper>
          <div className="flex  flex-col md:flex-row ">
            <ToastContainer />
            {/* Sidebar (Commented Out) */}
            {/* <Sidebar /> */}
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden w-full">
              {/* Top Bar */}
              <TopBar />
              {/* Main Content */}
              <div className="flex-1 overflow-auto ">
                {children}
              </div>
            </div>
          </div>
        </ReduxWrapper>
      </body>
    </html>
  )
}