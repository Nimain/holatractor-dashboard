import dynamic from 'next/dynamic'
import React from 'react'

const Users = dynamic(
    ()=> import('@/components/Users/UsersContainer'),
    {
        ssr: false,
        loading: () => (
          <div className="w-full h-screen flex items-center justify-center">
            Loading...
          </div>
        )
      }
  )

const UserPage = () => {
  return (
    <Users />
  )
}

export default UserPage