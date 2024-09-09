import dynamic from 'next/dynamic'

const AllLease = dynamic(
    ()=> import('@/components/Lease/LeaseContainer'),
    {
        ssr: false,
        loading: () => (
          <div className="w-full h-screen flex items-center justify-center">
            Loading...
          </div>
        )
      }
  )
const LeasePage = () => {
  return (
    <AllLease />
  )
}

export default LeasePage