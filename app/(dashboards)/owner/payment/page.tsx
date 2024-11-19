import OwnerShrimmer from '@/components/Dashboards/Owner/_components/OwnerShrimmer'
import dynamic from 'next/dynamic'

const PaymentPage = dynamic(
    ()=> import('@/components/Dashboards/Owner/payment/OwnerPayment'),
    {
        ssr: false,
        loading: () => (
          <OwnerShrimmer />
        )
      }
  )

const PaymentDashboard = () => {
  return (
    <PaymentPage />
  )
}

export default PaymentDashboard