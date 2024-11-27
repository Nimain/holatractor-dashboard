"use client"

import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { changeFarm } from "@/redux/ActiveFarm/ActiveFarm"
import { Farm } from "@/utils/Types/types"
import {  History, CreditCard, Store, ShoppingBag, FileText } from 'lucide-react'

import { ChevronDown, ChevronLeft, ChevronRight, Home, Plus, Settings, Tractor,BadgeIndianRupee,LayoutDashboard,Handshake,LocateFixed,Bolt ,} from "lucide-react"
import { useCookie } from "next-cookie"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useDispatch } from "react-redux"
import { Tooltip } from "@mui/material"
import { Separator } from "@/components/ui/separator"
import FarmerShrimmer from './FarmerShrimmer'
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
  const [loading, setLoading] = useState(true); // Loading state

  const dispatch = useDispatch();

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
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);
  
  console.log(loading, user);

  if (loading) {
    return <FarmerShrimmer />;  // Correct usage
  }
  if (!user) {
    // Show a loading or redirect page here
    return <div>Loading...</div>;
  }

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
        <Button size="icon" onClick={() => setIsExpanded(!isExpanded)} className="bg-transparent hover:bg-white/20">
          {isExpanded ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      </div>
      <nav className="mt-6  space-y-4 overflow-auto">
      <Collapsible open={showFarmList} onOpenChange={setShowFarmList}>
        <CollapsibleTrigger asChild>
          <Button
            className={`flex gap-2 items-center bg-transparent hover:bg-white/20 ${isExpanded ? "w-full mx-0 justify-start" : "w-fit mx-auto p-0 aspect-square justify-center rounded-full"}`}
          >
            <Tooltip title="Farms" placement="right">
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
            <Button
              className="w-full justify-start text-sm bg-transparent hover:bg-white/20"
              key={store.id}
              onClick={() => {
                dispatch(changeFarm(store))
                setIsExpanded(false)
              }}
            >
              {store.name}
            </Button>
          ))}
          {isExpanded && (
            <Link href="/farmer/farm/new">
              <Button className="w-full flex gap-2 justify-start bg-transparent hover:bg-white/20">
                <Plus className="h-6 w-6" />
                Add farm
              </Button>
            </Link>
          )}
        </CollapsibleContent>
      </Collapsible>

      <Collapsible open={showBookingList} onOpenChange={setShowBookingList}>
        <CollapsibleTrigger asChild>
          <Button
            className={`flex gap-2 items-center bg-transparent hover:bg-white/20 ${isExpanded ? "w-full mx-0 justify-start" : "w-fit mx-auto p-0 aspect-square justify-center rounded-full"}`}
          >
            <Tooltip title="Bookings" placement="right">
              <Tractor className="h-6 w-6" />
            </Tooltip>
            {isExpanded && (
              <>
                Bookings
                <ChevronDown className="h-4 w-4 ml-auto" />
              </>
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pl-6 mt-2 space-y-2">
          {isExpanded && (
            <>
              <Link href="#">
                <Button className="w-full flex gap-2 justify-start bg-transparent hover:bg-white/20">
                  Booking History
                </Button>
              </Link>
              <Link href="/farmer/new-booking">
                <Button className="w-full flex gap-2 justify-start bg-transparent hover:bg-white/20">
                  New Booking
                </Button>
              </Link>
            </>
          )}
        </CollapsibleContent>
      </Collapsible>

      <Button
        className={`flex gap-2 items-center bg-transparent hover:bg-white/20 ${isExpanded ? "w-full mx-0 justify-start" : "w-fit mx-auto p-0 aspect-square justify-center rounded-full"}`}
      >
        <Tooltip title="History" placement="right">
          <History className="h-6 w-6" />
        </Tooltip>
        {isExpanded && "History"}
      </Button>

      <Button
        className={`flex gap-2 items-center bg-transparent hover:bg-white/20 ${isExpanded ? "w-full mx-0 justify-start" : "w-fit mx-auto p-0 aspect-square justify-center rounded-full"}`}
      >
        <Tooltip title="Payment" placement="right">
          <CreditCard className="h-6 w-6" />
        </Tooltip>
        {isExpanded && "Payment"}
      </Button>

      <Button
        className={`flex gap-2 items-center bg-transparent hover:bg-white/20 ${isExpanded ? "w-full mx-0 justify-start" : "w-fit mx-auto p-0 aspect-square justify-center rounded-full"}`}
      >
        <Tooltip title="Store" placement="right">
          <Store className="h-6 w-6" />
        </Tooltip>
        {isExpanded && "Store"}
      </Button>

      <Button
        className={`flex gap-2 items-center bg-transparent hover:bg-white/20 ${isExpanded ? "w-full mx-0 justify-start" : "w-fit mx-auto p-0 aspect-square justify-center rounded-full"}`}
      >
        <Tooltip title="Marketplace" placement="right">
          <ShoppingBag className="h-6 w-6" />
        </Tooltip>
        {isExpanded && "Marketplace"}
      </Button>

      <Button
        className={`flex gap-2 items-center bg-transparent hover:bg-white/20 ${isExpanded ? "w-full mx-0 justify-start" : "w-fit mx-auto p-0 aspect-square justify-center rounded-full"}`}
      >
        <Tooltip title="Logs" placement="right">
          <FileText className="h-6 w-6" />
        </Tooltip>
        {isExpanded && "Logs"}
      </Button>
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
       <Link href={"/farmer/operatordash"}>  <Button
          className={`flex gap-2 items-center bg-transparent hover:bg-white/20 mt-4 ${isExpanded ? "w-full mx-0 justify-start" : "w-fit mx-auto p-0 aspect-square justify-center rounded-full"}`}
        >
          <Tooltip title={"operator"} placement="right">
          <Settings className="h-6 w-6" />
              </Tooltip>
          {isExpanded && "operator"}
        </Button></Link>
        <Link href={"/farmer/paymentoperator"}>  <Button
          className={`flex gap-2 items-center bg-transparent hover:bg-white/20 mt-4 ${isExpanded ? "w-full mx-0 justify-start" : "w-fit mx-auto p-0 aspect-square justify-center rounded-full"}`}
        >
          <Tooltip title={"operatorpayment"} placement="right">
          <BadgeIndianRupee className="h-6 w-6" />
              </Tooltip>
          {isExpanded && "operatorpayment"}
        </Button></Link>
        <Link href={"/farmer/dealertracking"}>  <Button
          className={`flex gap-2 items-center bg-transparent hover:bg-white/20 mt-4 ${isExpanded ? "w-full mx-0 justify-start" : "w-fit mx-auto p-0 aspect-square justify-center rounded-full"}`}
        >
          <Tooltip title={"TrackDealer"} placement="right">
          <LocateFixed className="h-6 w-6" />
              </Tooltip>
          {isExpanded && "TrackDealer"}
        </Button></Link>
        <Link href={"/farmer/dealerdashboard"}>  <Button
          className={`flex gap-2 items-center bg-transparent hover:bg-white/20 mt-4 ${isExpanded ? "w-full mx-0 justify-start" : "w-fit mx-auto p-0 aspect-square justify-center rounded-full"}`}
        >
          <Tooltip title={"DealerDashboard"} placement="right">
          <LayoutDashboard className="h-6 w-6" />
              </Tooltip>
          {isExpanded && "DealerDashboard"}
        </Button></Link>
        <Link href={"/farmer/dealerdeal"}>  <Button
          className={`flex gap-2 items-center bg-transparent hover:bg-white/20 mt-4 ${isExpanded ? "w-full mx-0 justify-start" : "w-fit mx-auto p-0 aspect-square justify-center rounded-full"}`}
        >
          <Tooltip title={"dealerDeal"} placement="right">
          <Handshake className="h-6 w-6" />
              </Tooltip>
          {isExpanded && "dealerDeal"}
        </Button></Link>
        <Link href={"/farmer/dealersale"}>  <Button
          className={`flex gap-2 items-center bg-transparent hover:bg-white/20 mt-4 ${isExpanded ? "w-full mx-0 justify-start" : "w-fit mx-auto p-0 aspect-square justify-center rounded-full"}`}
        >
          <Tooltip title={"dealersales"} placement="right">
          <Bolt className="h-6 w-6" />
              </Tooltip>
          {isExpanded && "dealerSales"}
        </Button></Link>
      </nav>
    </aside>
  )
}

export default Sidebar