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

    async function InactiveOperator() {
        setLoading(true)
        try {
            await fetch(`/api/operator/inactivate_operator/${id}`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${access_token}` },
            });
            successMessage("Operator inactivated successfully");
            setOpen(false);
            setTimeout(() => window.location.reload(), 300);
        } catch (error: any) {
            errorMessage("Failed to inactivate operator");
        } finally {
            setLoading(false);
        }
    }

    async function ActiveOperator() {
        setLoading(true)
        try {
            await fetch(`/api/operator/activate_operator/${id}`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${access_token}` },
            });
            successMessage("Operator activated successfully");
            setOpen(false);
            setTimeout(() => window.location.reload(), 300);
        } catch (error: any) {
            errorMessage("Failed to activate operator");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <div
                    className="flex items-center justify-between gap-3 bg-muted p-4 rounded-xl cursor-pointer hover:bg-white hover:shadow-sm transition-all duration-300 text-sm md:text-base">
                    <p className="w-12 text-slate-500 font-semibold text-center">#{index + 1}</p>
                    
                    <p className="w-48 font-semibold text-slate-900 truncate" title={name}>
                        {name}
                    </p>
                    
                    <p className="w-48 text-slate-600 text-sm truncate" title={email}>
                        {email || "N/A"}
                    </p>
                    
                    <div className={`px-2.5 py-1 text-xs font-semibold ${emailVerified ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' : 'text-amber-700 bg-amber-50 border border-amber-200'} text-center w-24 rounded-full`}>
                        {emailVerified ? 'Verified' : 'Pending'}
                    </div>
                    
                    <div className={`px-2.5 py-1 text-xs font-semibold ${status === 1 ? 'text-emerald-700 bg-emerald-100' : 'text-red-700 bg-red-100'} text-center w-24 rounded-full`}>
                        {status === 1 ? 'Active' : 'Inactive'}
                    </div>
                    
                    <p className="hidden md:block w-36 text-slate-500 text-xs truncate">
                        {creatDate}
                    </p>
                    
                    <p className="hidden md:block w-36 text-slate-500 text-xs truncate">
                        {updateDate}
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