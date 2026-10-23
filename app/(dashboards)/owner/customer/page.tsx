import OwnerShrimmer from '@/components/Dashboards/Owner/_components/OwnerShrimmer'
import dynamic from 'next/dynamic'

const CustomerPage = dynamic(
    ()=> import('@/components/Dashboards/Owner/customer/OwnerCustomer'),
    {
        ssr: false,
        loading: () => (
          <OwnerShrimmer />
        )
      }
  )

const CustomerDashboard = () => {
  return (
    <CustomerPage />
  )
}

export default CustomerDashboard