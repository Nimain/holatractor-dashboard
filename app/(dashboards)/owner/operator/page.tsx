import OwnerShrimmer from '@/components/Dashboards/Owner/_components/OwnerShrimmer'
import dynamic from 'next/dynamic'

const OperatorPage = dynamic(
    ()=> import('@/components/Dashboards/Owner/operator/OwnerOperator'),
    {
        ssr: false,
        loading: () => (
          <OwnerShrimmer />
        )
      }
  )

const OwnerOperatorPage = () => {
  return (
    <OperatorPage />
  )
}

export default OwnerOperatorPage