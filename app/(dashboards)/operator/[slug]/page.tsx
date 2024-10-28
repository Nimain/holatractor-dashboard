import dynamic from 'next/dynamic'

const OperatorPage = dynamic(
    ()=> import('@/components/Dashboards/Operator/SingleOperatorBookings'),
    {
        ssr: false,
        loading: () => (
          <div className="w-full h-screen flex items-center justify-center">
            Loading...
          </div>
        )
      }
  )

export default function Operator() {

    return (
        <OperatorPage />
    )
}