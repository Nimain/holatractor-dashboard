import dynamic from 'next/dynamic'

const AllInquiries = dynamic(
    ()=> import('@/components/inquiry/Inquiry'),
    {
        ssr: false,
        loading: () => (
          <div className="w-full h-screen flex items-center justify-center">
            Loading...
          </div>
        )
      }
  )

const Inquiries = () => {
  return (
    <AllInquiries />
  )
}

export default Inquiries