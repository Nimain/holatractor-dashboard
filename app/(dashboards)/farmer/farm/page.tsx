import dynamic from "next/dynamic";
import React from "react";

const FarmOverviewPage = dynamic(
  () => import("@/components/Dashboards/Farmer/FarmMapping/FarmOverview"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-screen flex items-center justify-center text-xs font-bold text-slate-400">
        Loading Field Overview...
      </div>
    ),
  }
);

export default function FarmerFarmsRootPage() {
  return <FarmOverviewPage />;
}
