import dynamic from 'next/dynamic'
import React from 'react'

const Permissions = dynamic(
    ()=> import('@/components/Permissions/PermissionsContainer'),
    {
        ssr: false,
        loading: () => (
          <div className="w-full h-screen flex items-center justify-center">
            Loading...
          </div>
        )
      }
  )

const PermissionsPage = () => {
  return (
    <Permissions />
  )
}

export default PermissionsPage