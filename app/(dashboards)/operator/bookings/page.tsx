import dynamic from 'next/dynamic'

const Bookings = dynamic(
    ()=> import('@/components/Dashboards/Operator/BookingSection/OperatorBooking'),
    {
        ssr: false,
        loading: () => (
          <div className="w-full h-screen flex items-center justify-center">
            Loading...
          </div>
        )
      }
  )

const OperatorBookings = () => {
  return (
    <Bookings />
  )
}

export default OperatorBookings