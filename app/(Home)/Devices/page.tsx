import dynamic from 'next/dynamic'

const Devices = dynamic(
    ()=> import('@/components/Devices/DeviceContainer'),
    {
        ssr: false,
        loading: () => (
          <div className="w-full h-screen flex items-center justify-center">
            Loading...
          </div>
        )
      }
  )

const OwnerPage = () => {
  return (
    <Devices />
  )
}

export default Devices