import dynamic from 'next/dynamic'

const DealerPage = dynamic(
  ()=> import('@/components/Dashboards/Dealer/Dealer'),
  {
      ssr: false,
      loading: () => (
        <div className="w-full h-screen flex items-center justify-center">
          Loading...
        </div>
      )
    }
)

const DealerDashboardPage = () => {

  return (
    <DealerPage />
  )
}

export default DealerDashboardPage