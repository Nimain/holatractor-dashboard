import dynamic from "next/dynamic"

const GeneralSettingsComponent = dynamic(() => import("@/components/Dashboards/Dealer/Settings/GeneralSettings"), {
  ssr: false,
  loading: () => <div className="w-full h-screen flex items-center justify-center">Loading settings...</div>,
})

const DealerGeneralSettingsPage = () => {
  return (
    <div className="w-full">
      <GeneralSettingsComponent />
    </div>
  )
}

export default DealerGeneralSettingsPage
