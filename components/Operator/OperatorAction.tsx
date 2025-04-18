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
import { useState, useRef } from "react"
import { errorMessage, successMessage } from '@/utils/Toastify/Messages';
import { Loader2 } from "lucide-react"

interface OperatorActionProps {
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

const OperatorAction = (
    { index, name, mailHover, email, emailVerified, creatDate, updateDate, status, id }: OperatorActionProps
) => {
    const [loading, setLoading] = useState(false)
    const [open, setOpen] = useState(false)
    const closeRef = useRef<HTMLButtonElement>(null)

    const { cookie } = useCookie()
    const access_token = cookie.get("access_token")

    function InactiveOperator() {
        setLoading(true)
        renderInstance.patch(`/operator/inactivate_operator/${id}`, {}, {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        }).then(() => {
            successMessage("Operator inactivated successfully")
            setOpen(false)
            window.location.reload()
        }).catch((error) => {
            errorMessage(error?.response?.data?.message || "Failed to inactivate operator")
        }).finally(() => {
            setLoading(false)
        })
    }

    function ActiveOperator() {
        setLoading(true)
        renderInstance.patch(`/operator/activate_operator/${id}`, {}, {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        }).then(() => {
            successMessage("Operator activated successfully")
            setOpen(false)
            window.location.reload()
        }).catch((error) => {
            errorMessage(error?.response?.data?.message || "Failed to activate operator")
        }).finally(() => {
            setLoading(false)
        })
    }

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <div
                    className="flex items-center justify-between gap-3 bg-muted p-4 rounded-lg cursor-pointer hover:bg-background transition-all duration-300 text-sm md:text-base">
                    <p className="w-10 md:w-16 text-center">{index + 1}</p>
                    
                    <p className="w-20 md:w-32 truncate">
                        {mailHover === index ? name : `${name.slice(0, 5)}...`}
                    </p>
                    
                    <p className={`truncate transition-all ${index === mailHover ? 'w-full' : 'w-20 md:w-32'}`}>
                        {mailHover === index ? email : `${email.slice(0, 5)}...`}
                    </p>
                    
                    <div className={`px-2 py-1 text-xs md:text-sm ${emailVerified ? 'text-green-700' : 'text-red-500'} bg-muted-foreground/10 text-center w-20 md:w-24 rounded-full`}>
                        {emailVerified ? 'Yes' : 'No'}
                    </div>
                    
                    <div className={`px-2 py-1 text-xs md:text-sm ${status === 1 ? 'text-green-700' : 'text-red-500'} bg-muted-foreground/10 text-center w-20 md:w-24 rounded-full`}>
                        {status === 1 ? 'Active' : 'Inactive'}
                    </div>
                    
                    <p className="hidden md:block w-32 truncate">
                        {mailHover === index ? creatDate : `${creatDate.slice(0, 12)}...`}
                    </p>
                    
                    <p className="hidden md:block w-32 truncate">
                        {mailHover === index ? updateDate : `${updateDate.slice(0, 12)}...`}
                    </p>
                </div>
            </SheetTrigger>
            
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>Update status of {name}</SheetTitle>
                    <SheetDescription>
                        {status === 1
                            ? `${name} is currently active. You can deactivate this operator account.`
                            : `${name} is currently inactive. You can activate this operator account.`
                        }
                    </SheetDescription>
                </SheetHeader>
                
                <div className="grid gap-4 py-6">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            Name
                        </Label>
                        <Input id="name" value={name} readOnly className="col-span-3" />
                    </div>
                    
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">
                            Email
                        </Label>
                        <Input id="email" value={email} readOnly className="col-span-3" />
                    </div>
                    
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="status" className="text-right">
                            Status
                        </Label>
                        <div className={`col-span-3 px-3 py-2 rounded-md border ${
                            status === 1 ? 'bg-green-50 border-green-200 text-green-700' : 
                            'bg-red-50 border-red-200 text-red-500'
                        }`}>
                            {status === 1 ? 'Active' : 'Inactive'}
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="emailVerified" className="text-right">
                            Email Verified
                        </Label>
                        <div className={`col-span-3 px-3 py-2 rounded-md border ${
                            emailVerified ? 'bg-green-50 border-green-200 text-green-700' : 
                            'bg-red-50 border-red-200 text-red-500'
                        }`}>
                            {emailVerified ? 'Yes' : 'No'}
                        </div>
                    </div>
                </div>
                
                <SheetFooter className="pt-4">
                    <SheetClose ref={closeRef} className="hidden" />
                    
                    {status === 1 ? (
                        <Button 
                            variant="destructive" 
                            onClick={InactiveOperator}
                            disabled={loading}
                            className="w-full sm:w-auto"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Deactivating...
                                </>
                            ) : (
                                "Deactivate Operator"
                            )}
                        </Button>
                    ) : (
                        <Button 
                            variant="default"
                            onClick={ActiveOperator}
                            disabled={loading}
                            className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Activating...
                                </>
                            ) : (
                                "Activate Operator"
                            )}
                        </Button>
                    )}
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}

export default OperatorAction