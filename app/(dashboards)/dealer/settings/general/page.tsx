import dynamic from "next/dynamic"

// Dynamically import the FacebookLinkAccount component
const Market = dynamic(() => import("@/components/Dashboards/Dealer/Settings/GeneralSettings"), {
  ssr: false, // Ensure this component is only rendered on the client-side
  loading: () => <div className="w-full h-screen flex items-center justify-center">Loading...</div>,
})

const LeadsPage = () => {
  return (
    <div className="container mx-auto py-8">
      <Market />
    </div>
  )
}

export default LeadsPage
