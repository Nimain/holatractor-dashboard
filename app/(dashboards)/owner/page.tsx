import dynamic from 'next/dynamic'

const OwnerPage = dynamic(
  ()=> import('@/components/Dashboards/Owner/Owner'),
  {
      ssr: false,
      loading: () => (
        <div className="w-full h-screen flex items-center justify-center">
          Loading...
        </div>
      )
    }
)

const OwnerDashboardPage = () => {
  
  return (
    <OwnerPage />
  )
}

export default OwnerDashboardPage