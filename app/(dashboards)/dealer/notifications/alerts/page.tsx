import dynamic from "next/dynamic"

const DealerAlerts = dynamic(
  () => import("@/components/Dashboards/Dealer/Notifications/DealerAlerts"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-96 flex items-center justify-center text-gray-500 font-medium">
        Loading dealer alerts...
      </div>
    ),
  }
)

export default function AlertsPage() {
  return <DealerAlerts />
}
