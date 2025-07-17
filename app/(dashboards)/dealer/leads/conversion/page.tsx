import dynamic from "next/dynamic"

const Conversion = dynamic(() => import("@/components/Dashboards/Dealer/Leads/Conversion"), {
  ssr: false,
  loading: () => <div className="w-full h-screen flex items-center justify-center">Loading...</div>,
})

const LeadsPage = () => {
  return (
    <div >
     
      <Conversion />
    </div>
  )
}

export default LeadsPage
