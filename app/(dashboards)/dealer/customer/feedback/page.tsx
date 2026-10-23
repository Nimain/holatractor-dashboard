import dynamic from "next/dynamic";
import React from "react";

const CustomerFeedback = dynamic(
  () => import("@/components/Dashboards/Dealer/Customers/CustomerFeedback"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="animate-pulse text-emerald-600 font-bold text-lg">Loading Customer Feedback & Reviews...</div>
      </div>
    ),
  }
);

export default function CustomerFeedbackPage() {
  return <CustomerFeedback />;
}
