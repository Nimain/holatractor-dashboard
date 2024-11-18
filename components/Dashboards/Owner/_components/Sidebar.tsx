"use client"

import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronLeft, ChevronRight, Home, Plus, Settings, Tractor } from "lucide-react"
import { useCookie } from "next-cookie"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { Tooltip } from "@mui/material"

interface user {
  userId: string;
  image: string;
  name: string;
  email: string;
}

const Sidebar = () => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showStoreList, setShowStoreList] = useState(false)
  const [showPaymentList, setShowPaymentList] = useState(false)

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
      className={`shadow-md transition-all duration-300 rounded-2xl ${isExpanded ? 'w-64' : 'w-16'} h-[90vh] bg-primaryColor text-white my-auto`}>
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
      <nav className="mt-6 px-1 space-y-4">
        <Collapsible open={showStoreList} onOpenChange={setShowStoreList}>
          <CollapsibleTrigger asChild>
            <Button
              className={`w-full flex gap-2 justify-start bg-transparent hover:bg-white/20`}
            >
              <Tooltip title={"Store"} placement="right">
                <Tractor className="h-6 w-6" />
              </Tooltip>
              {isExpanded && (
                <>
                  {`Store`}
                  <ChevronDown className="h-4 w-4 ml-auto" />
                </>
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pl-6 mt-2 space-y-2">
            {isExpanded && <Link href={"#"}>
              <Button
                className={`w-full flex gap-2 justify-start bg-transparent hover:bg-white/20`}
              >
                <Plus className="h-6 w-6" />
                New store
              </Button>
            </Link>}
          </CollapsibleContent>
        </Collapsible>
        <Collapsible open={showPaymentList} onOpenChange={setShowPaymentList}>
          <CollapsibleTrigger asChild>
            <Button
              className={`w-full flex gap-2 justify-start bg-transparent hover:bg-white/20`}
            >
              <Tooltip title={"Payment"} placement="right">
                <Tractor className="h-6 w-6" />
              </Tooltip>
              {isExpanded && (
                <>
                  {`Payment`}
                  <ChevronDown className="h-4 w-4 ml-auto" />
                </>
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pl-6 mt-2 space-y-2">
            {isExpanded && <Link href={"#"}>
              <Button
                className={`w-full flex gap-2 justify-start bg-transparent hover:bg-white/20`}
              >
                {/* <Plus className="h-6 w-6" /> */}
                Recieved/ Review
              </Button>
            </Link>}
            {isExpanded && <Link href={"#"}>
              <Button
                className={`w-full flex gap-2 justify-start bg-transparent hover:bg-white/20`}
              >
                {/* <Plus className="h-6 w-6" /> */}
                Unpaid
              </Button>
            </Link>}
          </CollapsibleContent>
        </Collapsible>
        <Link href={"#"}>
          <Button
            className={`w-full flex gap-2 justify-start bg-transparent hover:bg-white/20`}
          >
            <Tooltip title={"Operator"} placement="right">
              <Settings className="h-6 w-6" />
            </Tooltip>
            {isExpanded && "Operator"}
          </Button>
        </Link>
        <Link href={"#"}>
          <Button
            className={`w-full flex gap-2 justify-start bg-transparent hover:bg-white/20`}
          >
            <Tooltip title={"Customers"} placement="right">
              <Settings className="h-6 w-6" />
            </Tooltip>
            {isExpanded && "Customers"}
          </Button>
        </Link>
        <Link href={"#"}>
          <Button
            className={`w-full flex gap-2 justify-start bg-transparent hover:bg-white/20`}
          >
            <Tooltip title={"Bookings"} placement="right">
              <Settings className="h-6 w-6" />
            </Tooltip>
            {isExpanded && "Bookings"}
          </Button>
        </Link>
        <Button
          className={`w-full flex gap-2 justify-start bg-transparent hover:bg-white/20`}
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