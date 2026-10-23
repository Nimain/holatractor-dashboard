import dynamic from 'next/dynamic'

const Farms = dynamic(
    ()=> import('@/components/Farms/Farmcontainer'),
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
    <Farms />
  )
}

export default Farms