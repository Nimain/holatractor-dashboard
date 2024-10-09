import "../globals.css"
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function FarmerDashboardLayout({
    children,
  }: {
    children: React.ReactNode
  }) {
    return (
      <html lang="en">
        <body>
          <div className="flex h-screen bg-gray-100">
            <main className="flex-1 overflow-y-auto p-8">
              <ToastContainer />
              {children}
            </main>
          </div>
        </body>
      </html>
    )
  }

export default FarmerDashboardLayout