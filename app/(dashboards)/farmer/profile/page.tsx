import dynamic from "next/dynamic";

const FarmerProfile = dynamic(
  () => import("@/components/Dashboards/Farmer/Profile/FarmerProfile"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-screen flex items-center justify-center text-xs font-bold text-slate-400">
        Loading Farmer Profile...
      </div>
    ),
  }
);

export default function FarmerProfilePage() {
  return <FarmerProfile />;
}
