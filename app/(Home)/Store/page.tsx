import dynamic from 'next/dynamic'
import React from 'react'

const Store = dynamic(
    ()=> import('@/components/Store/StoreContainer'),
    {
        ssr: false,
        loading: () => (
          <div className="w-full h-screen flex items-center justify-center">
            Loading...
          </div>
        )
      }
  )

const StorePage = () => {
  return (
    <Store />
  )
}

export default StorePage