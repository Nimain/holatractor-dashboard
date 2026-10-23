import dynamic from 'next/dynamic'

const Agent = dynamic(
    ()=> import('@/components/Agent/AgentContainer'),
    {
        ssr: false,
        loading: () => (
          <div className="w-full h-screen flex items-center justify-center">
            Loading...
          </div>
        )
      }
  )

const AgentPage = () => {
  return (
    <Agent />
  )
}

export default AgentPage