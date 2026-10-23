import dynamic from 'next/dynamic'

const SingleStorePage = dynamic(
  ()=> import('@/components/Dashboards/Owner/SingleStore'),
  {
      ssr: false,
      loading: () => (
        <div className="w-full h-screen flex items-center justify-center">
          Loading...
        </div>
      )
    }
)

export default function StorePage() {

  return (
    <SingleStorePage />
  )
}