"use client"

import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Boxes, ChevronDown, ChevronLeft, ChevronRight, Home, MapPin, Plus, Settings, Store as StoreIcon, Trash2, Upload, UserSearch, Wallet } from "lucide-react"
import { useCookie } from "next-cookie"
import Image from "next/image"
import Link from "next/link"
import { useState, useEffect, useRef, ChangeEvent } from "react"
import { Backdrop, CircularProgress, Tooltip } from "@mui/material"
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import StyleIcon from '@mui/icons-material/Style';
import { Separator } from "@/components/ui/separator"
import { renderInstance } from "@/utils/Axios/RenderInstance"
import { Store } from "@/utils/Types/types"
import { errorMessage } from "@/utils/Toastify/Messages"
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import NewStore from "./NewStore"
import { useDispatch } from "react-redux"
import { changeNewStoreShow } from "@/redux/NewStoreShow/NewStoreShow"
import { useRouter } from "next/navigation"

interface user {
    userId: string;
    image: string;
    name: string;
    email: string;
}

const Sidebar = () => {
    const [isExpanded, setIsExpanded] = useState(false)
    const [showStoreList, setShowStoreList] = useState(false)

    const [stores, setStores] = useState<Store[]>([])

    const { cookie } = useCookie()
    const user: user = cookie.get("user")

    const dispatch = useDispatch()

    const router = useRouter()

    function fetchOwner() {
        renderInstance.get(`/owner/${user.userId}`)
            .then((res) => {
                setStores(res.data.stores)
            }).catch((err) => {
                errorMessage("Error fetching user detaild")
            })
    }

    function handleLogOut() {
        cookie.remove("access_token")
        cookie.remove("user")
        cookie.remove("isFarmer")
        cookie.remove("isOperator")
        cookie.remove("isOwner")
        cookie.remove("isODealer")
        router.push("/login")
    }

    useEffect(() => {
        if (user) {
            fetchOwner()
        }
    }, [])

    if (!user) return

    return (
        <aside
            className={`shadow-md transition-all duration-300 rounded-2xl ${isExpanded ? 'w-64' : 'w-16'} h-[90vh] bg-primaryColor text-white my-auto`}>
            <Link href={"/owner"} className="flex items-center justify-center gap-2 w-full mx-auto mt-4 mb-2">
                <Image
                    src={"https://holaimagesdata.s3.us-west-2.amazonaws.com/web/logo/ISOLOGO_HT_BLANCO.png"}
                    alt="Logo"
                    width={24}
                    height={24}
                    className="h-6 object-cover w-auto" />
                {isExpanded && <h1 className="text-xl md:text-2xl font-medium md:font-bold">Holatractpor</h1>}
            </Link>
            <div className="px-4 flex justify-between items-center">
                {isExpanded && <h1 className="text-xl md:text-2xl font-medium md:font-bold">Dashboard</h1>}
                <Button size="icon" onClick={() => setIsExpanded(!isExpanded)} className="bg-transparent hover:bg-white/20">
                    {isExpanded ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
            </div>
            <nav className="mt-6 px-1">
                <Collapsible open={showStoreList} onOpenChange={setShowStoreList}>
                    <CollapsibleTrigger asChild>
                        <Button
                            className={`flex gap-2 items-center bg-transparent hover:bg-white/20 ${isExpanded ? "w-full mx-0 justify-start" : "w-fit mx-auto p-0 aspect-square justify-center rounded-full"}`}
                        >
                            <Tooltip title={"Store"} placement="right">
                                <StoreIcon className="h-6 w-6" />
                            </Tooltip>
                            {isExpanded && (
                                <>
                                    {`Store ${stores.length}`}
                                    <ChevronDown className="h-4 w-4 ml-auto" />
                                </>
                            )}
                        </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pl-6 mt-2 space-y-2">
                        {isExpanded && <Link href={"#"}>
                            <Button
                                className={`w-full flex gap-2 justify-start bg-transparent hover:bg-white/20`}
                                onClick={()=>{dispatch(changeNewStoreShow())}}
                            >
                                <Plus className="h-6 w-6" />
                                New store
                            </Button>
                        </Link>}
                    </CollapsibleContent>
                </Collapsible>
                <Link href={"/owner/bookings"}>
                    <Button
                        className={`flex gap-2 items-center bg-transparent hover:bg-white/20 mt-4 ${isExpanded ? "w-full mx-0 justify-start" : "w-fit mx-auto p-0 aspect-square justify-center rounded-full"}`}
                    >
                        <Tooltip title={"Bookings"} placement="right">
                            <StyleIcon className="h-6 w-6" />
                        </Tooltip>
                        {isExpanded && "Bookings"}
                    </Button>
                </Link>
                <Link href={"/owner/operator"}>
                    <Button
                        className={`flex gap-2 items-center bg-transparent hover:bg-white/20 mt-4 ${isExpanded ? "w-full mx-0 justify-start" : "w-fit mx-auto p-0 aspect-square justify-center rounded-full"}`}
                    >
                        <Tooltip title={"Operator"} placement="right">
                            <UserSearch className="h-6 w-6" />
                        </Tooltip>
                        {isExpanded && "Operator"}
                    </Button>
                </Link>
                <Link href={"/owner/marketplace"}>
                    <Button
                        className={`flex gap-2 items-center bg-transparent hover:bg-white/20 mt-4 ${isExpanded ? "w-full mx-0 justify-start" : "w-fit mx-auto p-0 aspect-square justify-center rounded-full"}`}
                    >
                        <Tooltip title={"Marketplace"} placement="right">
                            <Boxes className="h-6 w-6" />
                        </Tooltip>
                        {isExpanded && "Marketplace"}
                    </Button>
                </Link>
                <Link href={"/owner/payment"}>
                    <Button
                        className={`flex gap-2 items-center bg-transparent hover:bg-white/20 mt-4 ${isExpanded ? "w-full mx-0 justify-start" : "w-fit mx-auto p-0 aspect-square justify-center rounded-full"}`}
                    >
                        <Tooltip title={"Payment"} placement="right">
                            <Wallet className="h-6 w-6" />
                        </Tooltip>
                        {isExpanded && "Payment"}
                    </Button>
                </Link>
                <Link href={"/owner/customer"}>
                    <Button
                        className={`flex gap-2 items-center bg-transparent hover:bg-white/20 mt-4 ${isExpanded ? "w-full mx-0 justify-start" : "w-fit mx-auto p-0 aspect-square justify-center rounded-full"}`}
                    >
                        <Tooltip title={"Customers"} placement="right">
                            <SupportAgentIcon className="h-6 w-6" />
                        </Tooltip>
                        {isExpanded && "Customers"}
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