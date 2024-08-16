import dynamic from 'next/dynamic'
import React from 'react'

const SignUp = dynamic(
    ()=> import('@/components/Authentication/SignUp'),
    {
        ssr: false,
        loading: () => (
          <div className="w-full h-screen flex items-center justify-center">
            Loading...
          </div>
        )
      }
  )

const SinUpPage = () => {
  return (
    <SignUp />
  )
}

export default SinUpPage