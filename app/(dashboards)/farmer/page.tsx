import dynamic from 'next/dynamic'
import FarmerShrimmer from "@/components/Dashboards/Farmer/_components/FarmerShrimmer"

const FarmerPage = dynamic(
  ()=> import('@/components/Dashboards/Farmer/Farmer'),
  {
      ssr: false,
      loading: () => (
        <div className="w-full h-screen flex items-center justify-center">
          <FarmerShrimmer />
        </div>
      )
    }
)

const FarmerDashboard = () => {

  return (
    <FarmerPage />
  )
}

export default FarmerDashboard