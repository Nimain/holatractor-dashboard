import dynamic from 'next/dynamic'

const Logs = dynamic(
    ()=> import('@/components/Dashboards/Farmer/FarmerLogs/FarmerLogs'),
    {
        ssr: false,
        loading: () => (
          <div className="w-full h-screen flex items-center justify-center">
            Loading...
          </div>
        )
      }
  )

const FarmerLogsPage = () => {
  return (
    <Logs />
  )
}

export default FarmerLogsPage