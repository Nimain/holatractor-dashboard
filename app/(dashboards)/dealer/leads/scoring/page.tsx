import dynamic from "next/dynamic";
import React from "react";

const LeadScoring = dynamic(
  () => import("@/components/Dashboards/Dealer/Leads/LeadScoring"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="animate-pulse text-amber-600 font-bold text-lg">Loading AI Lead Scoring...</div>
      </div>
    ),
  }
);

export default function LeadScoringPage() {
  return <LeadScoring />;
}
