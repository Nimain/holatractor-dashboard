import dynamic from 'next/dynamic'

const FarmerPage = dynamic(
    ()=> import('@/components/Dashboards/Farmer/FarmMapping/FarmMapping'),
    {
        ssr: false,
        loading: () => (
          <div className="w-full h-screen flex items-center justify-center">
            Loading
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