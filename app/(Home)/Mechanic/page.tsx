import dynamic from 'next/dynamic'

const Mechanic = dynamic(
    ()=> import('@/components/Mechanic/MechanicContainer'),
    {
        ssr: false,
        loading: () => (
          <div className="w-full h-screen flex items-center justify-center">
            Loading...
          </div>
        )
      }
  )

const MechanicPage = () => {
  return (
    <Mechanic />
  )
}

export default MechanicPage
