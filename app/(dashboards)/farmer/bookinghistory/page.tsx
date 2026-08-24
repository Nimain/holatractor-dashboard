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

const BookingHistoryPage = () => {
  return (
    <BookingHistory />
  )
}

export default BookingHistoryPage