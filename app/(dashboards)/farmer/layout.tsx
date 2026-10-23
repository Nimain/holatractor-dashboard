import "../../globals.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ReduxWrapper from "../_components/ReduxWrapper";
import SidebarWrapper from "./_components/SidebarWrapper";
import dynamic from "next/dynamic";

const Header = dynamic(
  () => import("@/components/Dashboards/Farmer/_components/Header"),
  {
    ssr: false,
  }
);

function FarmerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ReduxWrapper>
      <SidebarWrapper>
        <main className="flex-1 overflow-y-auto my-2">
          <ToastContainer />
          <Header />
          {children}
        </main>
      </SidebarWrapper>
    </ReduxWrapper>
  );
}

export default FarmerDashboardLayout;