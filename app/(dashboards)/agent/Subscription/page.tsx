import dynamic from 'next/dynamic'

const Subscriptions = dynamic(
    ()=> import('@/components/Subscription/SubscriptionContainer'),
    {
        ssr: false,
        loading: () => (
          <div className="w-full h-screen flex items-center justify-center">
            Loading...
          </div>
        )
      }
  )

const page = () => {
  return (
    <Subscriptions />
  )
}

export default page