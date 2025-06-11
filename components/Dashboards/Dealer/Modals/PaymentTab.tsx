"use client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, Mail, MoreVertical, CreditCard, Calendar, DollarSign } from "lucide-react"

interface Invoice {
  id: string
  date: string
  amount: string
  name: string
  status: "Paid" | "Pending"
}

const invoices: Invoice[] = [
  { id: "007", date: "Dec 1, 2024", amount: "USD $1,200.50", name: "John Deere Lease", status: "Paid" },
  { id: "006", date: "Nov 1, 2024", amount: "USD $1,200.50", name: "John Deere Lease", status: "Paid" },
  { id: "005", date: "Oct 1, 2024", amount: "USD $1,200.50", name: "John Deere Lease", status: "Paid" },
  { id: "004", date: "Sep 1, 2024", amount: "USD $1,200.50", name: "John Deere Lease", status: "Paid" },
  { id: "003", date: "Aug 1, 2024", amount: "USD $1,200.50", name: "John Deere Lease", status: "Pending" },
]

export function PaymentTab() {
  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-4rem)] overflow-hidden">
      <div className="space-y-8 p-0 overflow-y-auto mt-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Lease and Billing</h2>
          <p className="text-sm text-muted-foreground">Manage your tractor lease payments and billing details.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">Monthly Tractor Lease</h3>
                    <Badge
                      variant="outline"
                      className="rounded-full bg-green-50 border-green-200 text-green-700 text-xs"
                    >
                      Active
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500">Premium tractor lease agreement with full maintenance.</p>
                </div>
                <div className="text-right">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-blue-600">$1,200</span>
                    <span className="text-sm text-gray-500">per month</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Includes insurance</p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Next payment due:</span>
                  <span className="font-medium">Jan 1, 2025</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-gray-600">Lease period:</span>
                  <span className="font-medium">12 months</span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Payment Method</h3>
                <p className="text-sm text-gray-500 mt-1">How you pay for your tractor lease.</p>
              </div>

              <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-8 bg-[#1A1F36] flex items-center justify-center rounded text-white font-bold text-xs">
                    VISA
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Visa ending in 1234</span>
                      <Badge
                        variant="outline"
                        className="rounded-full bg-blue-50 border-blue-200 text-blue-700 text-xs"
                      >
                        Default
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Expiry 06/2027</p>
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                      <Mail className="h-3 w-3" />
                      <span>billing@tractorleasing.com</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="text-xs">
                    Edit
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <DollarSign className="h-5 w-5 text-green-600 mx-auto mb-1" />
                  <p className="text-xs text-gray-600">Total Paid</p>
                  <p className="font-semibold text-green-600">$8,403.50</p>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <Calendar className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                  <p className="text-xs text-gray-600">Payments Made</p>
                  <p className="font-semibold text-blue-600">7 of 12</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Payment History</h3>
              <p className="text-sm text-muted-foreground">
                Download your previous lease payment receipts and details.
              </p>
            </div>
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Download All
            </Button>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Invoice</TableHead>
                  <TableHead>Payment Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className="h-8 w-8 bg-blue-100 rounded flex items-center justify-center">
                          <CreditCard className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="font-medium">#{invoice.id}</div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{invoice.date}</TableCell>
                    <TableCell className="font-semibold text-green-600">{invoice.amount}</TableCell>
                    <TableCell>{invoice.name}</TableCell>
                    <TableCell>
                      <Badge
                        variant={invoice.status === "Paid" ? "default" : "secondary"}
                        className={
                          invoice.status === "Paid"
                            ? "bg-green-100 text-green-800 hover:bg-green-100"
                            : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                        }
                      >
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
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
