import dynamic from 'next/dynamic'

const Operator = dynamic(
    ()=> import('@/components/Operator/OperatorContainer'),
    {
        ssr: false,
        loading: () => (
          <div className="w-full h-screen flex items-center justify-center">
            Loading...
          </div>
        )
      }
  )

const OperatorPage = () => {
  return (
    <Operator />
  )
}

export default OperatorPage