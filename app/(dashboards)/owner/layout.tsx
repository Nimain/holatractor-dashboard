import { ReactNode } from 'react'
import "../../globals.css"
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ReduxWrapper from '../_components/ReduxWrapper';
import SidebarWrapper from './_components/SidebarWrapper';
import NewStore from '@/components/Dashboards/Owner/_components/NewStore';

const OwnerDashboardLayout = ({
  children,
}: {
  children: ReactNode
}) => {
  return (
    <html lang="en">
      <body style={{fontFamily: 'Poppins'}}>
        <ReduxWrapper>
          <SidebarWrapper>
            <main className="flex-1 overflow-y-auto my-2">
              <NewStore />
              <ToastContainer />
              {children}
            </main>
          </SidebarWrapper>
        </ReduxWrapper>
      </body>
    </html>
  )
}

export default OwnerDashboardLayout