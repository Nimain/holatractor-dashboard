import dynamic from 'next/dynamic'

const Owner = dynamic(
    ()=> import('@/components/Owner/OwnerContainer'),
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
    <Owner />
  )
}

export default OwnerPage