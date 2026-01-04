import dynamic from "next/dynamic"

// Dynamically import the FacebookLinkAccount component
const Alert = dynamic(() => import("@/components/Dashboards/Dealer/Notifications/AlertNortification"), {
  ssr: false, // Ensure this component is only rendered on the client-side
  loading: () => <div className="w-full h-screen flex items-center justify-center">Loading...</div>,
})

const AlertPage = () => {
  return (
    <div>
      <Alert />
    </div>
  )
}

export default AlertPage
