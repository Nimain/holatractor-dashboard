import dynamic from 'next/dynamic'

const Farmers = dynamic(
    ()=> import('@/components/Farmers/FarmerContainer'),
    {
        ssr: false,
        loading: () => (
          <div className="w-full h-screen flex items-center justify-center">
            Loading...
          </div>
        )
      }
  )

const FarmerPage = () => {
  return (
    <Farmers />
  )
}

export default FarmerPage