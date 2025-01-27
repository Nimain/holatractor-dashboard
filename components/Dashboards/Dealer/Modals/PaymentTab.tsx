'use client'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowUpDown, CreditCard, Download, Mail, MoreVertical } from 'lucide-react'
import Image from "next/image"
interface Invoice {
    id: string
    date: string
    amount: string
    name: string
    status: 'Paid' | 'Pending'
}
const invoices: Invoice[] = [
    { id: "007", date: "Dec 1, 2022", amount: "USD $10.00",  name:'markzuker', status: "Paid" },
    { id: "006", date: "Nov 1, 2022", amount: "USD $10.00",  name:'markzuker', status: "Paid" },
    { id: "005", date: "Oct 1, 2022", amount: "USD $10.00",  name:'markzuker', status: "Paid" },
    { id: "004", date: "Sep 1, 2022", amount: "USD $10.00",  name:'markzuker', status: "Paid" },
    { id: "003", date: "Aug 1, 2022", amount: "USD $10.00",  name:'markzuker', status: "Paid" },
    { id: "002", date: "Jul 1, 2022", amount: "USD $10.00",  name:'markzuker', status: "Paid" },
    { id: "001", date: "Jun 1, 2022", amount: "USD $10.00",  name:'markzuker', status: "Paid" },
]
export function PaymentTab() {
    return (
        <div className="flex flex-col h-full max-h-[calc(100vh-4rem)] overflow-hidden">
            <div className="space-y-8 p-0 overflow-y-auto mt-3">
                <div>
                    <h2 className="text-2xl font-semibold tracking-tight">Lease and billing</h2>
                    <p className="text-sm text-muted-foreground">Manage your plan and billing details.</p>
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                    <Card className="p-6">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-lg font-semibold">Monthly Lease</h3>
                                        <Badge variant="outline" className="rounded-full bg-transparent border-gray-200 text-xs">Active</Badge>
                                    </div>
                                    <p className="text-[9px] text-gray-500">Our most popular plan for small teams.</p>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-base font-bold">$20</span>
                                        <span className="text-xs text-gray-500">per month</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex -space-x-2 mt-3">
                            {[...Array(10)].map((_, i) => (
                                <div key={i} className="h-8 w-8 rounded-full border-2 border-background bg-muted">
                                    <Image
                                        src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSjEy_j0KZuihswm8-WSdNLCb7MWzpdMXx_gA&s"
                                        alt={`User ${i + 1}`}
                                        width={32}
                                        height={32}
                                        className="rounded-full"
                                    />
                                </div>
                            ))}
                            <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted">
                                <span className="text-xs">+5</span>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-3">
                        <div className="space-y-1">
                            <div className="p-3">
                                <h3 className="text-lg font-semibold">Payment method</h3>
                                <p className="text-sm text-gray-500 mt-1">Change how you pay for your plan.</p>
                            </div>
                            <div className="mt-4 p-2 border border-gray-200 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-7 bg-[#1A1F36] flex items-center justify-center rounded text-white font-bold text-xs">
                                        VISA
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium">Visa ending in 1234</span>
                                            <Badge variant="outline" className="rounded-full bg-transparent border-gray-200 text-xs">Default</Badge>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">Expiry 06/2024</p>
                                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                            <Mail className="h-3 w-3" />
                                            <span>billing@untitledui.com</span>
                                        </div>
                                    </div>
                                    <Button variant="secondary" size="sm" className="bg-[#1A1F36] text-white hover:bg-[#32394e] text-xs">
                                        Edit
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold">Billing history</h3>
                            <p className="text-sm text-muted-foreground">
                                Download your previous plan receipts and usage details.
                            </p>
                        </div>
                        <Button variant="outline">
                            <Download className="mr-2 h-4 w-4" />
                            Download all
                        </Button>
                    </div>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[100px]">Invoice</TableHead>
                                    <TableHead>Billing date</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead >Name</TableHead>
                                    <TableHead className="text-left">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {invoices.map((invoice) => (
                                    <TableRow key={invoice.id}>
                                        <TableCell>
                                            <div className="flex items-center space-x-2">
                                                <div className="h-8 w-8">📄</div>
                                                <div>Invoice #{invoice.id}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell>{invoice.date}</TableCell>
                                        <TableCell>{invoice.amount}</TableCell>
                                        <TableCell>{invoice.name} </TableCell>
                                        <TableCell className="text-left">
                                            <div className="flex items-left justify-left space-x-2">
                                                <Button variant="ghost" size="icon">
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
        </div>
    )
}