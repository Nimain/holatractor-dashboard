"use client"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Farm } from "@/utils/Types/types"
import { Bell, Check, ChevronDown, ChevronLeft, ChevronRight, ChevronsUpDown, Home, Megaphone, PhoneCall, Plus, PlusCircle, Settings, Store, Upload, Users, Wrench, X, Tractor } from "lucide-react"
import { useCookie } from "next-cookie"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"

interface user {
  userId: string;
  image: string;
  name: string;
  email: string;
}

const Sidebar = ({ farms }: { farms: Farm[] }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showFarmList, setShowFarmList] = useState(false)
  const [showBookingList, setShowBookingList] = useState(false)

  const { cookie } = useCookie()
  const user: user = cookie.get("user")

  function handleLogOut() {
    cookie.remove("access_token")
    cookie.remove("user")
    cookie.remove("isFarmer")
    cookie.remove("isOperator")
    cookie.remove("isOwner")
    cookie.remove("isODealer")
    window.location.reload()
  }

  if (!user) return

  return (
    <aside
      className={`shadow-md transition-all duration-300 rounded-2xl ${isExpanded ? 'w-64' : 'w-16'} h-[90vh] bg-primaryColor text-white`}>
      <div className="flex items-center justify-center gap-2 w-full mx-auto mt-4 mb-2">
        <Image
          src={"https://holaimagesdata.s3.us-west-2.amazonaws.com/web/logo/ISOLOGO_HT_BLANCO.png"}
          alt="Logo"
          width={24}
          height={24}
          className="h-6 object-cover w-auto" />
        {isExpanded && <h1 className="text-xl md:text-2xl font-medium md:font-bold">Holatractpor</h1>}
      </div>
      <div className="px-4 flex justify-between items-center">
        {isExpanded && <h1 className="text-xl md:text-2xl font-medium md:font-bold">Dashboard</h1>}
        <Button variant="ghost" size="icon" onClick={() => setIsExpanded(!isExpanded)}>
          {isExpanded ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      </div>
      <nav className="mt-6 px-1">
        <Collapsible open={showFarmList} onOpenChange={setShowFarmList}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className={`w-full flex gap-2 justify-start`}
            >
              <Home className="h-6 w-6" />
              {isExpanded && (
                <>
                  {`Farms (${farms.length})`}
                  <ChevronDown className="h-4 w-4 ml-auto" />
                </>
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pl-6 mt-2 space-y-2">
            {isExpanded && farms.map((store) => (
              <Link key={store.id} href={`/farmer/farm/${store.id}`}>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-sm"
                >
                  {store.name}
                </Button>
              </Link>
            ))}
            {isExpanded && <Link href={"/farmer/farm/new"}>
              <Button
                variant="ghost"
                className={`w-full flex gap-2 justify-start`}
              >
                <Plus className="h-6 w-6" />
                Add farm
              </Button>
            </Link>}
          </CollapsibleContent>
        </Collapsible>
        <Collapsible open={showBookingList} onOpenChange={setShowBookingList}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className={`w-full flex gap-2 justify-start`}
            >
              <Tractor className="h-6 w-6" />
              {isExpanded && (
                <>
                  {`Bookings`}
                  <ChevronDown className="h-4 w-4 ml-auto" />
                </>
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pl-6 mt-2 space-y-2">
            {isExpanded && <Link href={"#"}>
              <Button
                variant="ghost"
                className={`w-full flex gap-2 justify-start`}
              >
                {/* <Plus className="h-6 w-6" /> */}
                Booking History
              </Button>
            </Link>}
            {isExpanded && <Link href={"/farmer/new-booking"}>
              <Button
                variant="ghost"
                className={`w-full flex gap-2 justify-start`}
              >
                {/* <Plus className="h-6 w-6" /> */}
                New Booking
              </Button>
            </Link>}
          </CollapsibleContent>
        </Collapsible>
        <Button
          variant="ghost"
          className={`w-full flex gap-2 justify-start`}
          onClick={() => { handleLogOut() }}
        >
          <Settings className="h-6 w-6" />
          {isExpanded && "Log out"}
        </Button>
      </nav>
    </aside>
  )
}

export default Sidebar