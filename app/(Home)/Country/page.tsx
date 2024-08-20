import dynamic from 'next/dynamic'
import React from 'react'

const Country = dynamic(
    ()=> import('@/components/Country/CountryContainer'),
    {
        ssr: false,
        loading: () => (
          <div className="w-full h-screen flex items-center justify-center">
            Loading...
          </div>
        )
      }
  )

const CountryPage = () => {
  return (
    <Country />
  )
}

export default CountryPage