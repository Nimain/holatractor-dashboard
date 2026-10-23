import dynamic from "next/dynamic"

const UserProfileForm = dynamic(
  () => import("@/components/Dashboards/Dealer/_components/UserProfileForm"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-96 flex items-center justify-center text-gray-500 font-medium">
        Loading profile...
      </div>
    ),
  }
)

export default function DealerProfilePage() {
  return (
    <div className="container mx-auto py-6 px-4">
      <UserProfileForm />
    </div>
  )
}
