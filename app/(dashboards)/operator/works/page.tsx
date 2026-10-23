import OwnerShrimmer from '@/components/Dashboards/Owner/_components/OwnerShrimmer'
import dynamic from 'next/dynamic'

const Works = dynamic(
    ()=> import('@/components/Dashboards/Operator/WorkSection/OperatorWork'),
    {
        ssr: false,
        loading: () => (
          <OwnerShrimmer />
        )
      }
  )

const OperatorWorkPage = () => {
  return (
    <Works />
  )
}

export default OperatorWorkPage