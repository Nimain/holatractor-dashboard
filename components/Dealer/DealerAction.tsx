"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { renderInstance } from "@/utils/Axios/RenderInstance"
import { useCookie } from "next-cookie"
import { MouseEvent, useState } from "react"
import { errorMessage, successMessage } from '@/utils/Toastify/Messages';
import { CircularProgress } from "@mui/material"

interface DealerActionProps {
    index: number;
    mailHover: number;
    name: string;
    email: string;
    emailVerified: boolean;
    creatDate: string;
    updateDate: string;
    status: number;
    id: string;
}

const DealerAction = (
    { index, name, mailHover, email, emailVerified, creatDate, updateDate, status, id }: DealerActionProps
) => {
    const [loading, setLoading] = useState(false)

    const { cookie } = useCookie()
    const access_token = cookie.get("access_token")

    async function InactiveDealer(e: MouseEvent<HTMLButtonElement, globalThis.MouseEvent>) {
        e.stopPropagation()
        e.preventDefault()
        setLoading(true)
        try {
            await fetch(`/api/dealer/inactivate_dealer/${id}`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${access_token}` },
            });
            successMessage("Dealer inactivated successfully");
            setTimeout(() => window.location.reload(), 300);
        } catch {
            errorMessage("Try again");
        } finally {
            setLoading(false);
        }
    }

    async function ActiveDealer(e: MouseEvent<HTMLButtonElement, globalThis.MouseEvent>) {
        e.stopPropagation()
        e.preventDefault()
        setLoading(true)
        try {
            await fetch(`/api/dealer/activate_dealer/${id}`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${access_token}` },
            });
            successMessage("Dealer activated successfully");
            setTimeout(() => window.location.reload(), 300);
        } catch {
            errorMessage("Try again");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Sheet>
            <SheetTrigger asChild>
                <div
                    className='text-[18px] flex items-center justify-between gap-[10px] bg-[#ededed] p-[20px] rounded cursor-pointer hover:bg-white transition-all duration-500'>

                    <p className='w-[60px] font-semibold text-slate-500'>
                        #{index + 1}
                    </p>

                    <p className='w-[220px] font-semibold text-slate-900 truncate' title={name}>
                        {name}
                    </p>

                    <p className='w-[220px] text-slate-600 text-[15px] truncate' title={email}>
                        {email || "N/A"}
                    </p>

                    <div className={`px-[12px] text-[13px] font-semibold py-[4px] ${emailVerified ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' : 'text-amber-700 bg-amber-50 border border-amber-200'} text-center w-[100px] rounded-full`}>
                        {emailVerified ? 'Verified' : 'Pending'}
                    </div>

                    <div className={`px-[12px] text-[13px] font-semibold py-[4px] ${status === 1 ? 'text-emerald-700 bg-emerald-100' : 'text-red-700 bg-red-100'} text-center w-[100px] rounded-full`}>
                        {status === 1 ? 'Active' : 'Inactive'}
                    </div>

                    <p className='w-[160px] text-slate-500 text-[14px] truncate'>
                        {creatDate}
                    </p>

                    <p className='w-[160px] text-slate-500 text-[14px] truncate'>
                        {updateDate}
                    </p>

                </div>
            </SheetTrigger>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>Update status of {name}</SheetTitle>
                    <SheetDescription>
                        {
                            status === 1 ?
                                `${name} is an active operator` :
                                `${name} is an inactive operator. Click on the active button to active the operator.`
                        }
                    </SheetDescription>
                </SheetHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            Name
                        </Label>
                        <Input id="name" value={name} readOnly={true} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="username" className="text-right">
                            Email
                        </Label>
                        <Input id="username" value={email} readOnly={true} className="col-span-3" />
                    </div>
                </div>
                <SheetFooter>
                    <SheetClose asChild>
                        {
                            status === 1 ?
                                <Button variant={"destructive"} onClick={(e)=>{InactiveDealer(e)}}>
                                    {
                                        loading ? <CircularProgress /> : "Inactive"
                                    }
                                </Button>
                                :
                                <Button className="bg-green-800" onClick={(e)=>{ActiveDealer(e)}}>
                                    {
                                        loading ? <CircularProgress /> : "Active"
                                    }
                                </Button>
                        }
                    </SheetClose>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}

export default DealerAction