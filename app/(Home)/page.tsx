import dynamic from "next/dynamic";
import Image from "next/image";

const DashboardComponentsContainer = dynamic(
  ()=> import('@/components/Dashboard/Dashboard'),
  {
      ssr: false,
      loading: () => (
        <div className="w-full h-screen flex items-center justify-center">
          Loading...
        </div>
      )
    }
)

export default function Home() {
  return (
    <DashboardComponentsContainer />
  );
}
