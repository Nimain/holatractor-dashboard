import dynamic from 'next/dynamic'

const City = dynamic(
    ()=> import('@/components/City/CityContainer'),
    {
        ssr: false,
        loading: () => (
          <div className="w-full h-screen flex items-center justify-center">
            Loading...
          </div>
        )
      }
  )

const CityPage = () => {
  return (
    <City />
  )
}

export default CityPage