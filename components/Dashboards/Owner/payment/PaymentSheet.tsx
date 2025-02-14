"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { TableCell, TableRow } from "@/components/ui/table"
import { Booking, Payment } from "@/utils/Types/types"
import { Copy, ExternalLink } from "lucide-react"
import { renderInstance } from '@/utils/Axios/RenderInstance'
import { useCookie } from 'next-cookie'
import { useState } from "react"
import { errorMessage, successMessage } from '@/utils/Toastify/Messages'
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import TranslatedText from "@/components/Menubar/TranslatedText"
import { ownerPaymentHistoryTranslations } from "./PaymentHistoryTrnslation"
import { DownloadSinglePDFButton } from "./PaymentPDF"
import { CircularProgress } from "@mui/material"

const PaymentSheet = ({ index, item }: { index: number; item: Payment; }) => {

    const [loading, setLoading] = useState(false)
    const [isRejecting, setIsRejecting] = useState(false)
    const [Rejecting, setRejecting] = useState(false)
    const [rejectionReason, setRejectionReason] = useState('')

    const { cookie } = useCookie()
    const access_token = cookie.get("access_token")

    const paymentDate = new Date(item.updatedAt).toLocaleDateString("en-GB");

    const handleAccept = () => {
        // Here you would typically send the acceptance to your backend
        setLoading(true)
        renderInstance.patch(`/owner/confirm_payment/${item.id}`, {}, {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        })
            .then((res) => {
                successMessage("Accepted")
                window.location.reload()
            }).catch((err) => {
                if (err.response && err.response.status === 404 && err.response.data.message === "Log in user not found") {
                    errorMessage("Log in user not found")
                } else if (err.response && err.response.status === 404 && err.response.data.message === "Payment not found") {
                    errorMessage("Payment not found")
                } else if (err.response && err.response.status === 409 && err.response.data.message === "You are not the correct reciever") {
                    errorMessage("You are not the correct reciever")
                } else if (err.response && err.response.status === 400 && err.response.data.message === "Farmer has not confirmed this payment") {
                    errorMessage("Farmer has not confirmed this payment")
                } else {
                    errorMessage("Error in accepting")
                }
            }).finally(() => {
                setLoading(false)
            })
    }

    const handleReject = () => {
        if (rejectionReason.trim() === '') {
            errorMessage('Please provide a reason for rejection')
            return
        }
        // Here you would typically send the rejection to your backend
        setRejecting(true)
        renderInstance.patch(`/owner/reject_payment/${item.id}`, {
            reason: rejectionReason
        }, {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        })
            .then((res) => {
                successMessage("Accepted")
            }).catch(() => {
                errorMessage("Error in rejecting")
            }).finally(() => {
                setRejecting(false)
            })
    }

    return (
        <Sheet>
            <SheetTrigger asChild>
                <TableRow key={index}>
                    <TableCell>
                        <Input
                            type="checkbox"
                            className="rounded w-4 h-4 accent-primaryColor"
                            onClick={e => { e.stopPropagation() }} />
                    </TableCell>
                    <TableCell>{item.id}</TableCell>
                    <TableCell>${item.amount.toFixed(2)}</TableCell>
                    <TableCell>{paymentDate}</TableCell>
                    <TableCell>
                        <span className="inline-flex items-center">
                            <span className="h-2 w-2 bg-green-400 rounded-full mr-2"></span>
                            {`${item.status}` === "FarmerPENDING" ? "Pending" : `${item.status}` === "FarmerCONFIRMED" ? <TranslatedText greetings={ownerPaymentHistoryTranslations.farmerPaid} /> : `${item.status}` === "OwnerREJECTED" ? <TranslatedText greetings={ownerPaymentHistoryTranslations.rejected} /> : <TranslatedText greetings={ownerPaymentHistoryTranslations.completed} />}
                        </span>
                    </TableCell>
                    <TableCell onClick={e => { e.stopPropagation() }}>
                        {
                            <DownloadSinglePDFButton payment={item} />
                        }
                    </TableCell>
                </TableRow>
            </SheetTrigger>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle><TranslatedText greetings={ownerPaymentHistoryTranslations.paymentLinkDetails} /></SheetTitle>
                    <SheetDescription>
                        <TranslatedText greetings={ownerPaymentHistoryTranslations.paymentDescription} />
                    </SheetDescription>
                </SheetHeader>
                <div className="p-6 space-y-6 overflow-y-auto h-[calc(100vh-140px)]">
                    {/* Amount Section */}
                    <div className="space-y-2">
                        <p className="text-sm text-muted-foreground"><TranslatedText greetings={ownerPaymentHistoryTranslations.amount} /></p>
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <svg
                                    className="h-6 w-6 text-blue-600"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                                </svg>
                            </div>
                            <span className="text-xl font-semibold">{item.amount.toFixed(2)} USD</span>
                        </div>
                    </div>

                    {/* URL Section */}
                    {
                        item.screenshots.length > 0 &&
                        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                            <span className="text-sm text-muted-foreground truncate">
                                {item.screenshots[item.screenshots.length - 1]}
                            </span>
                            {/* <Button variant="ghost" size="sm" className="h-8">
                                <Copy className="h-4 w-4" />
                                <span className="ml-2">Copy</span>
                            </Button> */}
                            <a href={item.screenshots[item.screenshots.length - 1]} target="_blank">
                                <Button variant="ghost" size="sm" className="h-8">
                                    <ExternalLink className="h-4 w-4" />
                                    <span className="ml-2"><TranslatedText greetings={ownerPaymentHistoryTranslations.visitLink} /></span>
                                </Button>
                            </a>
                        </div>
                    }

                    {/* Transaction Details */}
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-y-3">
                            <span className="text-muted-foreground"><TranslatedText greetings={ownerPaymentHistoryTranslations.status} /></span>
                            <Badge className="justify-self-end w-fit">
                                {`${item.status}` === "FarmerPENDING" ? "Pending" : `${item.status}` === "FarmerCONFIRMED" ? <TranslatedText greetings={ownerPaymentHistoryTranslations.farmerPaid} /> : `${item.status}` === "OwnerREJECTED" ? <TranslatedText greetings={ownerPaymentHistoryTranslations.rejected} /> : <TranslatedText greetings={ownerPaymentHistoryTranslations.completed} />}
                            </Badge>

                            <span className="text-muted-foreground"><TranslatedText greetings={ownerPaymentHistoryTranslations.createdOn} /></span>
                            <span className="text-right">
                                {new Date(item.createdAt).toLocaleDateString()}
                            </span>

                            {
                                item.transaction_reference &&
                                <span className="text-muted-foreground"><TranslatedText greetings={ownerPaymentHistoryTranslations.reference} /></span>
                            }
                            <span className="text-right">
                                {item.transaction_reference}
                            </span>
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold"><TranslatedText greetings={ownerPaymentHistoryTranslations.timeline} /></h3>
                        <div className="space-y-4">
                            <div className="relative pl-6 border-l-2 border-green-500 pb-4">
                                <div className="absolute -left-[5px] h-2.5 w-2.5 rounded-full bg-green-500" />
                                <div>
                                    <p className="font-medium"><TranslatedText greetings={ownerPaymentHistoryTranslations.createdPaymentLink} /></p>
                                    <p className="text-sm text-muted-foreground">
                                        {new Date(item.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            <div className={`relative pl-6 border-l-2 ${(`${item.status}` === "FarmerCONFIRMED") || (`${item.status} === "COMPLETED`) ? "border-green-500" : "border-blue-500"} pb-4`}>
                                <div className={`absolute -left-[5px] h-2.5 w-2.5 rounded-full ${(`${item.status}` === "FarmerCONFIRMED") || (`${item.status} === "COMPLETED`) ? "bg-blue-500" : "bg-green-500"}`} />
                                <div>
                                    <p className="font-medium"><TranslatedText greetings={ownerPaymentHistoryTranslations.awaitingPayment} /></p>
                                    <p className="text-sm text-muted-foreground">
                                        <TranslatedText greetings={ownerPaymentHistoryTranslations.waitingForRecipient} />
                                    </p>
                                </div>
                            </div>
                            <div className="relative pl-6">
                                <div className={`absolute -left-[5px] h-2.5 w-2.5 rounded-full ${`${item.status}` === "COMPLETED" ? "bg-green-500" : "bg-blue-500"}`} />
                                <div>
                                    <p className="font-medium"><TranslatedText greetings={ownerPaymentHistoryTranslations.paymentComplete} /></p>
                                    <p className="text-sm text-muted-foreground">
                                        <TranslatedText greetings={ownerPaymentHistoryTranslations.paymentReceived} /> {item.amount.toFixed(2)} USD.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {isRejecting && (
                        <div className="space-y-2">
                            <Label htmlFor="rejectionReason"><TranslatedText greetings={ownerPaymentHistoryTranslations.reasonForRejection} /></Label>
                            <Textarea
                                id="rejectionReason"
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="Provide a reason for rejection"
                                required
                            />
                        </div>
                    )}

                    {
                        `${item.status}` === "FarmerCONFIRMED" &&
                        <div className="flex items-center gap-2 flex-wrap">
                            {
                                isRejecting ?
                                    <Button variant="outline" onClick={() => { handleReject() }} disabled={Rejecting}>
                                        {
                                            Rejecting ? <TranslatedText greetings={ownerPaymentHistoryTranslations.rejecting} /> : <TranslatedText greetings={ownerPaymentHistoryTranslations.confirmReject} />
                                        }
                                    </Button>
                                    :
                                    <Button variant="outline" onClick={() => { setIsRejecting(true) }}><TranslatedText greetings={ownerPaymentHistoryTranslations.reject} /></Button>

                            }
                            <Button disabled={loading} onClick={() => { handleAccept() }}>
                                {loading ? <TranslatedText greetings={ownerPaymentHistoryTranslations.accepting} /> : <TranslatedText greetings={ownerPaymentHistoryTranslations.accept} />}
                            </Button>
                        </div>
                    }
                </div>
            </SheetContent>
        </Sheet>
    )
}

export default PaymentSheet