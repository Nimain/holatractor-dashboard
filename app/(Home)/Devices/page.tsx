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

// import DeviceSection from "@/components/device-section"
// import { getGoogleMapsApiKey } from "@/lib/get-google-maps-key"

// export default async function Page() {
//   const googleMapsApiKey = await getGoogleMapsApiKey()

//   return <DeviceSection googleMapsApiKey={googleMapsApiKey} />
// }
