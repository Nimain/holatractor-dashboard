import dynamic from 'next/dynamic'

const Stores = dynamic(
    ()=> import('@/components/Dashboards/Farmer/Stores/Stores'),
    {
        ssr: false,
        loading: () => (
          <div className="w-full h-screen flex items-center justify-center">
            Loading...
          </div>
        )
      }
  )

const StoresPage = () => {
  return (
    <Stores />
  )
}

export default StoresPage