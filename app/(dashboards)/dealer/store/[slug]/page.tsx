import dynamic from 'next/dynamic'

const DealerPage = dynamic(
  ()=> import('@/components/Dashboards/Dealer/SingleStore'),
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
    <DealerPage />
  )
}