"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, NotebookPen, Settings, Store } from "lucide-react"
import { useCookie } from "next-cookie"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import StyleIcon from '@mui/icons-material/Style';
import { Separator } from "@/components/ui/separator"
import { useRouter } from "next/navigation"
import { Tooltip } from "@mui/material"

const Sidebar = () => {
    const [isExpanded, setIsExpanded] = useState(false)

    const { cookie } = useCookie()

    const router = useRouter()

    function handleLogOut() {
        cookie.remove("access_token")
        cookie.remove("user")
        cookie.remove("isFarmer")
        cookie.remove("isOperator")
        cookie.remove("isOwner")
        cookie.remove("isODealer")
        router.push("/login")
    }

    return (
        <aside
            className={`shadow-md transition-all duration-300 rounded-2xl ${isExpanded ? 'w-64' : 'w-16'} h-[90vh] bg-primaryColor text-white my-auto`}>
            <Link href={"/operator"} className="flex items-center justify-center gap-2 w-full mx-auto mt-4 mb-2">
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
                <Link href={"/operator/bookings"}>
                    <Button
                        className={`flex gap-2 items-center bg-transparent hover:bg-white/20 mt-4 ${isExpanded ? "w-full mx-0 justify-start" : "w-fit mx-auto p-0 aspect-square justify-center rounded-full"}`}
                    >
                        <Tooltip title={"Bookings"} placement="right">
                            <StyleIcon className="h-6 w-6" />
                        </Tooltip>
                        {isExpanded && "Bookings"}
                    </Button>
                </Link>
                <Link href={"/operator/works"}>
                    <Button
                        className={`flex gap-2 items-center bg-transparent hover:bg-white/20 mt-4 ${isExpanded ? "w-full mx-0 justify-start" : "w-fit mx-auto p-0 aspect-square justify-center rounded-full"}`}
                    >
                        <Tooltip title={"Works"} placement="right">
                            <NotebookPen className="h-6 w-6" />
                        </Tooltip>
                        {isExpanded && "Works"}
                    </Button>
                </Link>
                <Link href={"/operator/stores"}>
                    <Button
                        className={`flex gap-2 items-center bg-transparent hover:bg-white/20 mt-4 ${isExpanded ? "w-full mx-0 justify-start" : "w-fit mx-auto p-0 aspect-square justify-center rounded-full"}`}
                    >
                        <Tooltip title={"Stores"} placement="right">
                            <Store className="h-6 w-6" />
                        </Tooltip>
                        {isExpanded && "Stores"}
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