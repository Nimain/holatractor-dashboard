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
import { Payment } from "@/utils/Types/types"
import { Copy, ExternalLink } from "lucide-react"

const PaymentSheet = ({ index, item }: { index: number; item: Payment }) => {

    const paymentDate = new Date(item.updatedAt).toLocaleDateString("en-GB");

    return (
        <Sheet>
            <SheetTrigger asChild>
                <TableRow key={index}>
                    <TableCell>
                        <Input 
                        type="checkbox" 
                        className="rounded w-4 h-4 accent-primaryColor" 
                        onClick={e=>{e.stopPropagation()}} />
                    </TableCell>
                    <TableCell>{item.id}</TableCell>
                    <TableCell>${item.amount.toFixed(2)}</TableCell>
                    <TableCell>{paymentDate}</TableCell>
                    <TableCell>
                        <span className="inline-flex items-center">
                            <span className="h-2 w-2 bg-green-400 rounded-full mr-2"></span>
                            {item.status}
                        </span>
                    </TableCell>
                    <TableCell>
                        <Button variant="ghost" size="sm">
                            Download
                        </Button>
                    </TableCell>
                </TableRow>
            </SheetTrigger>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>Payment Link Details</SheetTitle>
                    <SheetDescription>
                        Complete description of your payment
                    </SheetDescription>
                </SheetHeader>
                <div className="p-6 space-y-6 overflow-y-auto h-[calc(100vh-140px)]">
                    {/* Amount Section */}
                    <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Amount</p>
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
                            <span className="text-xl font-semibold">100 USD</span>
                        </div>
                    </div>

                    {/* URL Section */}
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                        <span className="text-sm text-muted-foreground truncate">
                            https://arto.plus/preview/KJ098efdjbf
                        </span>
                        <Button variant="ghost" size="sm" className="h-8">
                            <Copy className="h-4 w-4" />
                            <span className="ml-2">Copy</span>
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8">
                            <ExternalLink className="h-4 w-4" />
                            <span className="ml-2">Visit Link</span>
                        </Button>
                    </div>

                    {/* Transaction Details */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Payment Link Transactions</h3>
                        <div className="grid grid-cols-2 gap-y-3">
                            <span className="text-muted-foreground">Status</span>
                            <Badge className="justify-self-end w-fit">Paid</Badge>

                            <span className="text-muted-foreground">Created on</span>
                            <span className="text-right">Aug 28, 2023 2:40 PM</span>

                            <span className="text-muted-foreground">Expires on</span>
                            <span className="text-right">Sept 6, 2023 1:40 PM</span>

                            <span className="text-muted-foreground">Reference</span>
                            <span className="text-right">019283</span>

                            <span className="text-muted-foreground">Notes</span>
                            <span className="text-right">for pizza party tonight</span>
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Timeline</h3>
                        <div className="space-y-4">
                            <div className="relative pl-6 border-l-2 border-green-500 pb-4">
                                <div className="absolute -left-[5px] h-2.5 w-2.5 rounded-full bg-green-500" />
                                <div>
                                    <p className="font-medium">Created Payment Link</p>
                                    <p className="text-sm text-muted-foreground">
                                        Aug 28, 2023 2:40 PM
                                    </p>
                                </div>
                            </div>
                            <div className="relative pl-6 border-l-2 border-green-500 pb-4">
                                <div className="absolute -left-[5px] h-2.5 w-2.5 rounded-full bg-green-500" />
                                <div>
                                    <p className="font-medium">Awaiting Payment</p>
                                    <p className="text-sm text-muted-foreground">
                                        Waiting for the recipient to make the payment.
                                    </p>
                                </div>
                            </div>
                            <div className="relative pl-6">
                                <div className="absolute -left-[5px] h-2.5 w-2.5 rounded-full bg-blue-500" />
                                <div>
                                    <p className="font-medium">Payment Complete</p>
                                    <p className="text-sm text-muted-foreground">
                                        You have received a payment of 100 USD.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className=" bottom-0 left-0 right-0 p-6 border-t bg-background flex justify-between">
                        <Button variant="outline">Cancel Request</Button>
                        <Button>Request this again</Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}

export default PaymentSheet