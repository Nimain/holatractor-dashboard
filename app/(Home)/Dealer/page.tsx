import dynamic from 'next/dynamic'

const Dealer = dynamic(
    ()=> import('@/components/Dealer/DealerContainer'),
    {
        ssr: false,
        loading: () => (
          <div className="w-full h-screen flex items-center justify-center">
            Loading...
          </div>
        )
      }
  )

const DealerPage = () => {
  return (
    <Dealer />
  )
}

export default DealerPage