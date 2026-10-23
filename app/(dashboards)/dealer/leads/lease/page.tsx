import dynamic from "next/dynamic"

const Leads = dynamic(() => import("@/components/Dashboards/Dealer/Leads/Leads"), {
  ssr: false,
  loading: () => <div className="w-full h-screen flex items-center justify-center">Loading...</div>,
})

const LeadsPage = () => {
  return (
    <div >
    
      <Leads />
    </div>
  )
}

export default LeadsPage
