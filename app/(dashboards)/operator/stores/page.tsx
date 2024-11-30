import dynamic from 'next/dynamic'

const Stores = dynamic(
    ()=> import('@/components/Dashboards/Operator/Stores/Stores'),
    {
        ssr: false,
        loading: () => (
          <div className="w-full h-screen flex items-center justify-center">
            Loading...
          </div>
        )
      }
  )

const StoreList = () => {
  return (
    <Stores />
  )
}

export default StoreList