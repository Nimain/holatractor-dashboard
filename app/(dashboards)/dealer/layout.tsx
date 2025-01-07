import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../../globals.css"
import dynamic from "next/dynamic"

const Sidebar = dynamic(
  () => import("../../../components/Dashboards/Dealer/_components/Sidebar"),
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
      <body>
        <div className="flex h-screen bg-gray-100" style={{ fontFamily: 'Poppins' }}>
          <ToastContainer />

          {/* Sidebar */}

          <Sidebar />

          {/* Main Content */}
          {children}
        </div>
      </body>
    </html>
  )
}