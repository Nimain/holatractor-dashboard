import dynamic from 'next/dynamic'

const PaymentHistory = dynamic(
    ()=> import('@/components/Dashboards/Farmer/PaymentHistory/PaymentHistory'),
    {
        ssr: false,
        loading: () => (
          <div className="w-full h-screen flex items-center justify-center">
            Loading...
          </div>
        )
      }
  )

const PaymentHistoryPage = () => {
  return (
    <PaymentHistory />
  )
}

export default PaymentHistoryPage