import dynamic from 'next/dynamic'

const Store = dynamic(
  ()=> import('@/components/Dashboards/Farmer/Stores/BookingStore'),
  {
      ssr: false,
      loading: () => (
        <div className="w-full h-screen flex items-center justify-center">
          Loading...
        </div>
      )
    }
)

const SingleStorePage = () => {
  return (
    <Store />
  )
}

export default SingleStorePage