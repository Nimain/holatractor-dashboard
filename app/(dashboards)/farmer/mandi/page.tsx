import dynamic from "next/dynamic";

const MandiCommodityDetails = dynamic(
  () => import("@/components/Dashboards/Farmer/Mandi/MandiCommodityDetails"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-screen flex items-center justify-center text-xs font-bold text-slate-400">
        Loading Mandi & Commodity Prices...
      </div>
    ),
  }
);

export default function FarmerMandiPage() {
  return <MandiCommodityDetails />;
}
