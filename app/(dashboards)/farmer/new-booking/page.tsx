import dynamic from 'next/dynamic'

const Booking = dynamic(
    ()=> import('@/components/Dashboards/Farmer/NewBooking'),
    {
        ssr: false,
        loading: () => (
          <div className="w-full h-screen flex items-center justify-center">
            Loading...
          </div>
        )
      }
  )

const NewBooking = () => {

    return (
        <NewBooking />
    )
}

export default NewBooking