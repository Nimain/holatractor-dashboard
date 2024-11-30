import dynamic from 'next/dynamic'

const Works = dynamic(
    ()=> import('@/components/Dashboards/Operator/WorkSection/OperatorWork'),
    {
        ssr: false,
        loading: () => (
          <div className="w-full h-screen flex items-center justify-center">
            Loading...
          </div>
        )
      }
  )

const OperatorWorkPage = () => {
  return (
    <Works />
  )
}

export default OperatorWorkPage