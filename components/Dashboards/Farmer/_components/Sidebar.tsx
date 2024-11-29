"use client"

import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { changeFarm } from "@/redux/ActiveFarm/ActiveFarm"
import { Farm } from "@/utils/Types/types"
import { BellElectric, ChevronDown, ChevronLeft, ChevronRight, Home, Plus, Settings, Store, Tractor, Wallet } from "lucide-react"
import { useCookie } from "next-cookie"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useDispatch } from "react-redux"
import { Tooltip } from "@mui/material"
import { Separator } from "@/components/ui/separator"
import { useRouter } from "next/navigation"
import { renderInstance } from "@/utils/Axios/RenderInstance"
import { errorMessage } from "@/utils/Toastify/Messages"

interface user {
  userId: string;
  image: string;
  name: string;
  email: string;
}

const Sidebar = () => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showFarmList, setShowFarmList] = useState(false)

  const [farms, setFarms] = useState<Farm[]>([])

  const dispatch = useDispatch();

  const router = useRouter()

  const { cookie } = useCookie()
  const user: user = cookie.get("user")

  function handleLogOut() {
    cookie.remove("access_token")
    cookie.remove("user")
    cookie.remove("isFarmer")
    cookie.remove("isOperator")
    cookie.remove("isOwner")
    cookie.remove("isODealer")
    router.push("/login")
  }

  function fetchFarmer() {

    renderInstance.get(`/farmer/${user.userId}`)
      .then((res) => {
        setFarms(res.data.farms)
        dispatch(changeFarm(res.data.farms[0]))
      }).catch((err) => {
        if (err.response && err.response.status === 404 && err.response.data.message === "Farmer not found") {
          errorMessage("Farmer not found")
        } else {
          errorMessage("Error fetching user detaild")
        }
      })
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
        {isExpanded && <h1 className="text-xl md:text-2xl font-medium md:font-bold">Dashboard</h1>}
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
              <Tooltip title={"Farms"} placement="right">
                <Home className="h-6 w-6" />
              </Tooltip>
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
                Add farm
              </Button>
            </Link>}
          </CollapsibleContent>
        </Collapsible>
        <Link href={"/farmer/bookinghistory"}>
          <Button
            className={`flex gap-2 items-center bg-transparent hover:bg-white/20 mt-4 ${isExpanded ? "w-full mx-0 justify-start" : "w-fit mx-auto p-0 aspect-square justify-center rounded-full"}`}
          >
            <Tooltip title={"Booking"} placement="right">
              <Tractor className="h-6 w-6" />
            </Tooltip>
            {isExpanded && "Booking"}
          </Button>
        </Link>
        <Link href={"/farmer/paymenthistory"}>
          <Button
            className={`flex gap-2 items-center bg-transparent hover:bg-white/20 mt-4 ${isExpanded ? "w-full mx-0 justify-start" : "w-fit mx-auto p-0 aspect-square justify-center rounded-full"}`}
          >
            <Tooltip title={"Payment"} placement="right">
              <Wallet className="h-6 w-6" />
            </Tooltip>
            {isExpanded && "Payment"}
          </Button>
        </Link>
        <Link href={"/farmer/stores"}>
          <Button
            className={`flex gap-2 items-center bg-transparent hover:bg-white/20 mt-4 ${isExpanded ? "w-full mx-0 justify-start" : "w-fit mx-auto p-0 aspect-square justify-center rounded-full"}`}
          >
            <Tooltip title={"Stores"} placement="right">
              <Store className="h-6 w-6" />
            </Tooltip>
            {isExpanded && "Stores"}
          </Button>
        </Link>
        <Link href={"/farmer/logs"}>
          <Button
            className={`flex gap-2 items-center bg-transparent hover:bg-white/20 mt-4 ${isExpanded ? "w-full mx-0 justify-start" : "w-fit mx-auto p-0 aspect-square justify-center rounded-full"}`}
          >
            <Tooltip title={"Logs"} placement="right">
              <BellElectric className="h-6 w-6" />
            </Tooltip>
            {isExpanded && "Logs"}
          </Button>
        </Link>
        <Separator className={`mt-4 ${isExpanded ? "w-[90%]" : "w-[75%]"} mx-auto`} />
        <Button
          className={`flex gap-2 items-center bg-transparent hover:bg-white/20 mt-4 ${isExpanded ? "w-full mx-0 justify-start" : "w-fit mx-auto p-0 aspect-square justify-center rounded-full"}`}
          onClick={() => { handleLogOut() }}
        >
          <Tooltip title={"Log out"} placement="right">
            <Settings className="h-6 w-6" />
          </Tooltip>
          {isExpanded && "Log out"}
        </Button>
      </nav>
    </aside>
  )
}

export default Sidebar