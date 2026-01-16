import dynamic from 'next/dynamic'
import React from 'react'

const FarmCategoriespage = dynamic(
    ()=> import('@/components/FarmCategories/FarmCategoriesContainer'),
    {
        ssr: false,
        loading: () => (
          <div className="w-full h-screen flex items-center justify-center">
            Loading...
          </div>
        )
      }
  )

const FarmCategories = () => {
  return (
    <FarmCategoriespage />
  )
}

export default FarmCategories;