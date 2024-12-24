import OwnerShrimmer from '@/components/Dashboards/Owner/_components/OwnerShrimmer'
import dynamic from 'next/dynamic'

const Bookings = dynamic(
    ()=> import('@/components/Dashboards/Operator/BookingSection/OperatorBooking'),
    {
        ssr: false,
        loading: () => (
          <OwnerShrimmer />
        )
      }
  )

const OperatorBookings = () => {
  return (
    <Bookings />
  )
}

export default OperatorBookings