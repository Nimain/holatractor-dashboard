import dynamic from "next/dynamic"

const SecurityComponent = dynamic(() => import("@/components/Dashboards/Dealer/Settings/Security"), {
  ssr: false,
  loading: () => <div className="w-full h-screen flex items-center justify-center">Loading security settings...</div>,
})

const DealerSecurityPage = () => {
  return (
    <div className="w-full">
      <SecurityComponent />
    </div>
  )
}

export default DealerSecurityPage
