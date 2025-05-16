import FarmerSection from '@/components/Farmers/Farmer'
import dynamic from 'next/dynamic'

const Agent = dynamic(
    ()=> import('@/components/Farmers/Farmer'),
    {
        ssr: false,
        loading: () => (
          <div className="w-full h-screen flex items-center justify-center">
            Loading...
          </div>
        )
      }
  )

const AgentPage = () => {
  return (
    <FarmerSection />
  )
}

export default AgentPage