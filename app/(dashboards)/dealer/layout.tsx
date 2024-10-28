import Sidebar from '../../../components/Dashboards/Dealer/_components/Sidebar'
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {

  return (
    <div className="flex h-screen bg-gray-100">
      <ToastContainer />

      {/* Sidebar */}

      <Sidebar />

      {/* Main Content */}
      {children}
    </div>
  )
}