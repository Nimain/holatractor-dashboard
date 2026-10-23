import dynamic from "next/dynamic";
import React from "react";

const SupportTickets = dynamic(
  () => import("@/components/Dashboards/Dealer/Customers/SupportTickets"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="animate-pulse text-red-600 font-bold text-lg">Loading Customer Support Tickets...</div>
      </div>
    ),
  }
);

export default function CustomerSupportTicketsPage() {
  return <SupportTickets />;
}
