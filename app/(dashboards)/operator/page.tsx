import OwnerShrimmer from '@/components/Dashboards/Owner/_components/OwnerShrimmer'
import dynamic from 'next/dynamic'

const OperatorPage = dynamic(
  ()=> import('@/components/Dashboards/Operator/NewDashboard'),
  {
      ssr: false,
      loading: () => (
        <OwnerShrimmer />
      )
    }
)

const OperatorDashboardPage = () => {

  return (
    <OperatorPage />
  )
}

export default OperatorDashboardPage