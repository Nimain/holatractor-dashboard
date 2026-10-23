import dynamic from 'next/dynamic'

const StorePage = dynamic(
  ()=> import('@/components/Dashboards/Owner/Store'),
  {
      ssr: false,
      loading: () => (
        <div className="w-full h-screen flex items-center justify-center">
          Loading...
        </div>
      )
    }
)

export default function StoresPage() {

  return (
    <StorePage />
  )
}