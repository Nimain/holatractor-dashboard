import OwnerShrimmer from '@/components/Dashboards/Owner/_components/OwnerShrimmer'
import dynamic from 'next/dynamic'

const Stores = dynamic(
    ()=> import('@/components/Dashboards/Operator/Stores/Stores'),
    {
        ssr: false,
        loading: () => (
          <OwnerShrimmer />
        )
      }
  )

const StoreList = () => {
  return (
    <Stores />
  )
}

export default StoreList