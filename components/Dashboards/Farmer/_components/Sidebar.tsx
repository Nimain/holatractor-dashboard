"use client"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Farm } from "@/utils/Types/types"
import { Bell, Check, ChevronDown, ChevronLeft, ChevronRight, ChevronsUpDown, Home, Megaphone, PhoneCall, Plus, PlusCircle, Settings, Store, Upload, Users, Wrench, X } from "lucide-react"
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

const Sidebar = ({farms}:{farms: Farm[]}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showFarmList, setShowFarmList] = useState(false)

  const { cookie } = useCookie()
  const user: user = cookie.get("user")

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
        {isExpanded && <h1 className="text-2xl font-bold">Holatractpor</h1>}
      </div>
      <div className="px-4 flex justify-between items-center">
        {isExpanded && <h1 className="text-2xl font-bold">Dashboard</h1>}
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
        <Link href={"/"}>
          <Button
            variant="ghost"
            className={`w-full flex gap-2 justify-start`}
          >
            <Settings className="h-6 w-6" />
            {isExpanded && "Test"}
          </Button>
        </Link>
      </nav>
    </aside>
  )
}

export default Sidebar