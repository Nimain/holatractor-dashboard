import dynamic from 'next/dynamic'

const CategoryPage = dynamic(
    ()=> import('@/components/Category/CategoryContainer'),
    {
        ssr: false,
        loading: () => (
          <div className="w-full h-screen flex items-center justify-center">
            Loading...
          </div>
        )
      }
  )

const OwnerPage = () => {
  return (
    <CategoryPage />
  )
}

export default CategoryPage