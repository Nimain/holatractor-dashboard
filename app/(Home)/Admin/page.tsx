import dynamic from 'next/dynamic'

const Admin = dynamic(
    ()=> import('@/components/Admin/AdminContainer'),
    {
        ssr: false,
        loading: () => (
          <div className="w-full h-screen flex items-center justify-center">
            Loading...
          </div>
        )
      }
  )

const AdminPage = () => {
  return (
    <Admin />
  )
}

export default AdminPage