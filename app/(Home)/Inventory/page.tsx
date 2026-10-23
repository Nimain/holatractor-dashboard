import dynamic from 'next/dynamic'
import React from 'react'

const Inventory = dynamic(
    ()=> import('@/components/Inventory/InventoryContainer'),
    {
        ssr: false,
        loading: () => (
          <div className="w-full h-screen flex items-center justify-center">
            Loading...
          </div>
        )
      }
  )

const InventoryPage = () => {
  return (
    <Inventory />
  )
}

export default InventoryPage