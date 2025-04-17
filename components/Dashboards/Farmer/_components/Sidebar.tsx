"use client"

import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { BellElectric, ChevronDown, ChevronLeft, ChevronRight, Home, Plus, Settings, Store, Tractor, Wallet } from "lucide-react"
import { useCookie } from "next-cookie"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Tooltip } from "@mui/material"
import { Separator } from "@/components/ui/separator"
import { useRouter } from "next/navigation"
import TranslatedText from "@/components/Menubar/TranslatedText"
import { sidebarTranslations } from "../FarmerTranslation"
import { useFarmContext } from "@/components/wrappers/FarmProvider"

interface user {
  userId: string;
  image: string;
  name: string;
  email: string;
}

const Sidebar = () => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showFarmList, setShowFarmList] = useState(false)
  
  const { farms, fetching, fetchFarmer } = useFarmContext();

  const router = useRouter()

  const { cookie } = useCookie()
  const user: user = cookie.get("user")

  function handleLogOut() {
    cookie.remove("access_token")
    cookie.remove("user")
    cookie.remove("isFarmer")
    cookie.remove("isAgent")
    cookie.remove("isOperator")
    cookie.remove("isOwner")
    cookie.remove("isODealer")
    router.push("/login")
  }

  useEffect(() => {
    if (user) {
      fetchFarmer()
    }
  }, [])

  if (!user) return

  return (
    <aside
      className={`shadow-md transition-all duration-300 rounded-2xl ${isExpanded ? 'w-64' : 'w-16'} h-[90vh] bg-primaryColor text-white my-auto`}>
      <Link href={"/farmer"} className="flex items-center justify-center gap-2 w-full mx-auto mt-4 mb-2">
        <Image
          src={"https://holaimagesdata.s3.us-west-2.amazonaws.com/web/logo/ISOLOGO_HT_BLANCO.png"}
          alt="Logo"
          width={24}
          height={24}
          className="h-6 object-cover w-auto" />
        {isExpanded && <h1 className="text-xl md:text-2xl font-medium md:font-bold">Holatractor</h1>}
      </Link>
      <div className="px-4 flex justify-between items-center">
        {isExpanded && <h1 className="text-xl md:text-2xl font-medium md:font-bold"><TranslatedText greetings={sidebarTranslations.dashboard} /></h1>}
        <Button size="icon" onClick={() => setIsExpanded(!isExpanded)} className="bg-transparent hover:bg-white/20">
          {isExpanded ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      </div>
      <nav className="mt-6 px-1">
        <Collapsible open={showFarmList} onOpenChange={setShowFarmList}>
          <CollapsibleTrigger asChild>
            <Button
              className={`flex gap-2 items-center bg-transparent hover:bg-white/20 ${isExpanded ? "w-full mx-0 justify-start" : "w-fit mx-auto p-0 aspect-square justify-center rounded-full"}`}
            >
              <Tooltip title={<TranslatedText greetings={sidebarTranslations.farms} />} placement="right">
                <Home className="h-6 w-6" />
              </Tooltip>
              {isExpanded && (
                <>
                  {fetching ? <TranslatedText greetings={sidebarTranslations.farms} /> : <TranslatedText greetings={sidebarTranslations.farms} />}
                  <ChevronDown className="h-4 w-4 ml-auto" />
                </>
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pl-6 mt-2 space-y-2">
            {isExpanded && farms.map((store) => (
              <Link
                key={store.id}
              href={`/farmer/farm/${store.id}`}>
              <Button
                className="w-full justify-start text-sm bg-transparent hover:bg-white/20">
                {store.name}
              </Button>
                </Link>
            ))}
            {isExpanded && <Link href={"/farmer/farm/new"}>
              <Button
                className={`w-full flex gap-2 justify-start bg-transparent hover:bg-white/20`}
              >
                <Plus className="h-6 w-6" />
                <TranslatedText greetings={sidebarTranslations.addFarm} />
              </Button>
            </Link>}
          </CollapsibleContent>
        </Collapsible>
        <Link href={"/farmer/bookinghistory"}>
          <Button
            className={`flex gap-2 items-center bg-transparent hover:bg-white/20 mt-4 ${isExpanded ? "w-full mx-0 justify-start" : "w-fit mx-auto p-0 aspect-square justify-center rounded-full"}`}
          >
            <Tooltip title={<TranslatedText greetings={sidebarTranslations.booking} />} placement="right">
              <Tractor className="h-6 w-6" />
            </Tooltip>
            {isExpanded && <TranslatedText greetings={sidebarTranslations.booking} />}
          </Button>
        </Link>
        <Link href={"/farmer/paymenthistory"}>
          <Button
            className={`flex gap-2 items-center bg-transparent hover:bg-white/20 mt-4 ${isExpanded ? "w-full mx-0 justify-start" : "w-fit mx-auto p-0 aspect-square justify-center rounded-full"}`}
          >
            <Tooltip title={<TranslatedText greetings={sidebarTranslations.payment} />} placement="right">
              <Wallet className="h-6 w-6" />
            </Tooltip>
            {isExpanded && <TranslatedText greetings={sidebarTranslations.payment} />}
          </Button>
        </Link>
        <Link href={"/farmer/stores"}>
          <Button
            className={`flex gap-2 items-center bg-transparent hover:bg-white/20 mt-4 ${isExpanded ? "w-full mx-0 justify-start" : "w-fit mx-auto p-0 aspect-square justify-center rounded-full"}`}
          >
            <Tooltip title={<TranslatedText greetings={sidebarTranslations.stores} />} placement="right">
              <Store className="h-6 w-6" />
            </Tooltip>
            {isExpanded && <TranslatedText greetings={sidebarTranslations.stores} />}
          </Button>
        </Link>
        <Link href={"/farmer/logs"}>
          <Button
            className={`flex gap-2 items-center bg-transparent hover:bg-white/20 mt-4 ${isExpanded ? "w-full mx-0 justify-start" : "w-fit mx-auto p-0 aspect-square justify-center rounded-full"}`}
          >
            <Tooltip title={<TranslatedText greetings={sidebarTranslations.logs} />} placement="right">
              <BellElectric className="h-6 w-6" />
            </Tooltip>
            {isExpanded && <TranslatedText greetings={sidebarTranslations.logs} />}
          </Button>
        </Link>
        <Separator className={`mt-4 ${isExpanded ? "w-[90%]" : "w-[75%]"} mx-auto`} />
        <Button
          className={`flex gap-2 items-center bg-transparent hover:bg-white/20 mt-4 ${isExpanded ? "w-full mx-0 justify-start" : "w-fit mx-auto p-0 aspect-square justify-center rounded-full"}`}
          onClick={() => { handleLogOut() }}
        >
          <Tooltip title={<TranslatedText greetings={sidebarTranslations.logout} />} placement="right">
            <Settings className="h-6 w-6" />
          </Tooltip>
          {isExpanded && <TranslatedText greetings={sidebarTranslations.logout} />}
        </Button>
      </nav>
    </aside>
  )
}

export default Sidebar