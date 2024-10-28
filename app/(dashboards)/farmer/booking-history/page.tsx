import dynamic from 'next/dynamic'

const BookingHistory = dynamic(
  ()=> import('@/components/Dashboards/Farmer/BookingHistory'),
  {
      ssr: false,
      loading: () => (
        <div className="w-full h-screen flex items-center justify-center">
          Loading...
        </div>
      )
    }
)

const FarmerBookingHistory = () => {

  return (
    <BookingHistory />
  )
}

export default FarmerBookingHistory