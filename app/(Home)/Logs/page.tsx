import dynamic from 'next/dynamic'

const Logs = dynamic(
    ()=> import('@/components/Logs/LogsContainer'),
    {
        ssr: false,
        loading: () => (
          <div className="w-full h-screen flex items-center justify-center">
            Loading...
          </div>
        )
      }
  )

const LogsPage = () => {
  return (
    <Logs />
  )
}

export default LogsPage