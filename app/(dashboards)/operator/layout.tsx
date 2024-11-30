import "../../globals.css"
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ReduxWrapper from "../_components/ReduxWrapper";
import SidebarWrapper from "./_components/SidebarWrapper";

function FarmerDashboardLayout({
    children,
  }: {
    children: React.ReactNode
  }) {
    return (
      <html lang="en">
      <body style={{fontFamily: 'Poppins'}}>
        <ReduxWrapper>
          <SidebarWrapper>
            <main className="flex-1 overflow-y-auto my-2">
              <ToastContainer />
              {children}
            </main>
          </SidebarWrapper>
        </ReduxWrapper>
      </body>
    </html>
    )
  }

export default FarmerDashboardLayout