import dynamic from 'next/dynamic'
import React from 'react'

const Store = dynamic(
    ()=> import('@/components/Store/SingleStore/SingleStoreContainer'),
    {
        ssr: false,
        loading: () => (
          <div className="w-full h-screen flex items-center justify-center">
            Loading...
          </div>
        )
      }
  )

const SingleStore = () => {
  return (
    <Store />
  )
}

export default SingleStore