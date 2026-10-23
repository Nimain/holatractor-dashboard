import dynamic from "next/dynamic"

// Dynamically import the FacebookLinkAccount component
const Market = dynamic(() => import("@/components/Dashboards/Dealer/Repairs/Mechanics"), {
  ssr: false, // Ensure this component is only rendered on the client-side
  loading: () => <div className="w-full h-screen flex items-center justify-center">Loading...</div>,
})

const LeadsPage = () => {
  return (
    <div className="container mx-auto ">
      <Market />
    </div>
  )
}

export default LeadsPage
