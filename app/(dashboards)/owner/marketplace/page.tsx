import OwnerShrimmer from '@/components/Dashboards/Owner/_components/OwnerShrimmer'
import dynamic from 'next/dynamic'

const MarketPlace = dynamic(
    ()=> import('@/components/Dashboards/Owner/Marketplace/Marketplace'),
    {
        ssr: false,
        loading: () => (
          <OwnerShrimmer />
        )
      }
  )

const MarketPlacePage = () => {
  return (
    <MarketPlace />
  )
}

export default MarketPlacePage