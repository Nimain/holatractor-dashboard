import dynamic from 'next/dynamic'
import OwnerShrimmer from '../../../components/Dashboards/Owner/_components/OwnerShrimmer'

const OwnerPage = dynamic(
  ()=> import('@/components/Dashboards/Owner/Owner'),
  {
      ssr: false,
      loading: () => (
        <OwnerShrimmer />
      )
    }
)

const OwnerDashboardPage = () => {
  
  return (
    <OwnerPage />
  )
}

export default OwnerDashboardPage