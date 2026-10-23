import OwnerShrimmer from '@/components/Dashboards/Owner/_components/OwnerShrimmer'
import dynamic from 'next/dynamic'

const Store = dynamic(
  ()=> import('@/components/Dashboards/Operator/Stores/BookingStore'),
  {
      ssr: false,
      loading: () => (
        <OwnerShrimmer />
      )
    }
)

const SingleStorePage = () => {
  return (
    <Store />
  )
}

export default SingleStorePage