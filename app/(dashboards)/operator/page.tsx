import dynamic from 'next/dynamic'

const OperatorPage = dynamic(
  ()=> import('@/components/Dashboards/Operator/Operator'),
  {
      ssr: false,
      loading: () => (
        <div className="w-full h-screen flex items-center justify-center">
          Loading...
        </div>
      )
    }
)

const OperatorDashboardPage = () => {

  return (
    <OperatorPage />
  )
}

export default OperatorDashboardPage