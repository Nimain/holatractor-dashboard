import { DeviceList } from "@/components/Dashboards/Owner/devices/DeviceList";
import { AllDeviceList } from "@/components/Dashboards/Owner/devices/AllDevicesList";

export default function DevicesPage() {
  return (
    <div className="container mx-auto py-4 mb-4">
      {/* <div className="mb-8"><AllDeviceList /></div> */}
      <DeviceList />
    </div>
  )
}
