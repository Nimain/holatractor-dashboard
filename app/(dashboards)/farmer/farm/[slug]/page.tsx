import dynamic from 'next/dynamic'
import React from 'react'

const FarmPage = dynamic(
  ()=> import('@/components/Dashboards/Farmer/SingleFarm/SingleFarm'),
  {
      ssr: false,
      loading: () => (
        <div className="w-full h-screen flex items-center justify-center">
          Loading
        </div>
      )
    }
)

const FarmerFarmPage = () => {
  return (
    <FarmPage />
  )
}

export default FarmerFarmPage