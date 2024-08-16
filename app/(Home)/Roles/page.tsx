import dynamic from 'next/dynamic'
import React from 'react'

const RolesPage = dynamic(
    ()=> import('@/components/Roles/RolesContainer'),
    {
        ssr: false,
        loading: () => (
          <div className="w-full h-screen flex items-center justify-center">
            Loading...
          </div>
        )
      }
  )

const Roles = () => {
  return (
    <RolesPage />
  )
}

export default Roles