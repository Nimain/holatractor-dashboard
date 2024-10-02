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

interface OwnerActionProps {
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

const OwnerAction = (
    { index, name, mailHover, email, emailVerified, creatDate, updateDate, status, id }: OwnerActionProps
) => {
    const [loading, setLoading] = useState(false)

    const { cookie } = useCookie()
    const access_token = cookie.get("access_token")

    function InactiveOwner(e: MouseEvent<HTMLButtonElement, globalThis.MouseEvent>) {
        e.stopPropagation()
        e.preventDefault()
        setLoading(true)
        renderInstance.patch(`/owner/inactivate_owner/${id}`, {}, {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        }).then(() => {
            successMessage("Success")
            window.location.reload()
        }).catch(() => {
            errorMessage("Try again")
        }).finally(() => {
            setLoading(false)
        })
    }

    function ActiveOwner(e: MouseEvent<HTMLButtonElement, globalThis.MouseEvent>) {
        e.stopPropagation()
        e.preventDefault()
        setLoading(true)
        renderInstance.patch(`/owner/activate_owner/${id}`, {}, {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        }).then(() => {
            successMessage("Success")
            window.location.reload()
        }).catch(() => {
            errorMessage("Try again")
        }).finally(() => {
            setLoading(false)
        })
    }

    return (
        <Sheet>
            <SheetTrigger asChild>
                <div
                    className='text-[18px] flex items-center justify-between gap-[10px] bg-[#ededed] p-[20px] rounded cursor-pointer hover:bg-white transition-all duration-500'>

                    <p
                        className='w-[100px]'>
                        {index + 1}
                    </p>

                    <p className='w-[140px]'>
                        {mailHover === index ? name : `${name.slice(0, 5)}...`}
                    </p>

                    <p className={`transition ${index === mailHover ? 'w-fit' : 'w-[140px]'}`}>
                        {mailHover === index ? email : `${email.slice(0, 5)}...`}
                    </p>

                    <div className={`px-[10px] text-[14px] py-[6px] ${emailVerified ? 'text-[#3e875e]' : 'text-red-400'} bg-[#dfe4e2] text-center w-[140px] rounded-full`}>
                        {
                            emailVerified ?
                                'Yes'
                                :
                                'No'
                        }
                    </div>

                    <p className={`px-[10px] text-[14px] py-[6px] ${status === 1 ? 'text-[#3e875e]' : 'text-red-400'} bg-[#dfe4e2] text-center w-[140px] rounded-full`}>
                        {
                            status === 1 ?
                                'Active'
                                :
                                'Inactive'
                        }
                    </p>

                    <p className='w-[180px]'>
                        {mailHover === index ? creatDate : `${creatDate.slice(0, 12)}...`}
                    </p>

                    <p className='w-[180px]'>
                        {mailHover === index ? updateDate : `${updateDate.slice(0, 12)}...`}
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
                                <Button variant={"destructive"} onClick={(e)=>{InactiveOwner(e)}}>
                                    {
                                        loading ? <CircularProgress /> : "Inactive"
                                    }
                                </Button>
                                :
                                <Button className="bg-green-800" onClick={(e)=>{ActiveOwner(e)}}>
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

export default OwnerAction