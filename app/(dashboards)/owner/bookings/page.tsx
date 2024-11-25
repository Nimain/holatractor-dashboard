import OwnerShrimmer from '@/components/Dashboards/Owner/_components/OwnerShrimmer'
import dynamic from 'next/dynamic'

const Bookings = dynamic(
    ()=> import('@/components/Dashboards/Owner/bookings/Bookings'),
    {
        ssr: false,
        loading: () => (
          <OwnerShrimmer />
        )
      }
  )

const BookingsPage = () => {
  return (
    <Bookings />
  )
}

export default BookingsPage