import dynamic from 'next/dynamic'

const Attachments = dynamic(
    ()=> import('@/components/Attachments/AttachmentsContainer'),
    {
        ssr: false,
        loading: () => (
          <div className="w-full h-screen flex items-center justify-center">
            Loading...
          </div>
        )
      }
  )

const AttachmentsPage = () => {
  return (
    <Attachments />
  )
}

export default AttachmentsPage