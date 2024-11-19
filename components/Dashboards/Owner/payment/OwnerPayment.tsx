"use client"

import { ShoppingCartIcon as PayPalIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowUpIcon,ArrowDownIcon } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../../components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { RiArrowUpDownLine } from "react-icons/ri";
import { X, Copy, ExternalLink } from "lucide-react";
import { Dialog, DialogOverlay, DialogContent } from "@/components/ui/dialog";
import { useState } from 'react'
import { Badge } from "@/components/ui/badge"

interface PaymentHistoryItem {
  invoice: string
  amount: number
  date: string
  status: 'Success' | 'Pending' | 'Failed'
}

const OwnerPayment = () => {
    const paymentHistory: PaymentHistoryItem[] = [
        {
          invoice: 'Invoice#0098 - Sep 2022',
          amount: 2161379.0,
          date: 'June 12-14, 2020',
          status: 'Success',
        },
        {
          invoice: 'Invoice#0097 - Aug 2022',
          amount: 2323337.0,
          date: 'June 13-14, 2020',
          status: 'Success',
        },
      ]
      const [isOpen, setIsOpen] = useState(false);
      const onClose = () => setIsOpen(false);
      const onOpen = () => setIsOpen(true);
      return (
        <div className="px-6 py-4">
        {/* Header Section */}
        <div className="flex justify-between mb-8">
          <div><h1 className="text-2xl font-semibold text-gray-900">Payment</h1>
          <p className="text-gray-600">
            Update your payment information or change your plans according to your needs
          </p></div>
          <div>
          <Button className="w-32">Add</Button>
          </div>
        </div>
      
        {/* Revenue & Profit Section */}
        <div className="mb-8">
      <Card className="w-full ">
        <CardContent className="p-6">
          <div className="grid grid-cols-4 gap-6">
            {/* Revenue Section */}
            <div className="border-r border-gray-200 pr-4">
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Revenue this month</p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">$10,398</span>
                  <div className="flex items-center text-sm text-emerald-500">
                    <ArrowUpIcon className="h-4 w-4" />
                    <span>+608</span>
                  </div>
                </div>
              </div>
            </div>
    
            {/* Profit Section */}
            <div className="border-r border-gray-200 pr-4">
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Profit this month</p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">$3,982</span>
                  <div className="flex items-center text-sm text-emerald-500">
                    <ArrowUpIcon className="h-4 w-4" />
                    <span>+198</span>
                  </div>
                </div>
              </div>
            </div>
    
            {/* Rejected Section */}
            <div className="border-r border-gray-200 pr-4">
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Rejected this month</p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">45</span>
                  <div className="flex items-center text-sm text-red-500">
                    <ArrowDownIcon className="h-4 w-4" />
                    <span>-15</span>
                  </div>
                </div>
              </div>
            </div>
    
            {/* Operator Pay Section */}
            <div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Operator Pay</p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">$1,245</span>
                  <div className="flex items-center text-sm text-emerald-500">
                    <ArrowUpIcon className="h-4 w-4" />
                    <span>+50</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    
    
      
        {/* My Plan & Payment Method Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* My Plan Section */}
          <Card className="w-full">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">My Plan</h2>
              <p className="text-gray-600 mb-4">Change your plan based on your needs</p>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-2 w-2 bg-green-400 rounded-full"></div>
                <span className="font-medium">Pro</span>
                <span className="text-gray-500 text-sm">Billed yearly</span>
              </div>
              <div className="mb-4">
                <span className="text-xl font-semibold">$299.99 USD</span>
                <span className="text-gray-500 text-sm ml-2">(next renew 24 September 2023)</span>
              </div>
              <div className="flex gap-4">
                <Button variant="default">Explore Plans</Button>
                <Button variant="outline">Manage Plans</Button>
              </div>
            </CardContent>
          </Card>
      
          {/* Payment Method Section */}
          <Card className="w-full">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
              <p className="text-gray-600 mb-4">Change how you pay your plan</p>
              <div className="flex items-center justify-between border p-4 rounded-lg">
                <div className="flex items-center gap-4">
                  <PayPalIcon className="h-6 w-6 text-blue-600" />
                  <div>
                    <p>customer@nija.com</p>
                    <p className="text-sm text-gray-500">Expiry 08/2023</p>
                  </div>
                </div>
                <Button variant="ghost">Change</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      
        {/* Payment History Section */}
        <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold">Payment History (24)</h2>
                <p className="text-gray-600">See history of your payment plan invoice</p>
              </div>
              <Button variant="outline" className='bg-blue-600 text-white w-32'>Download All</Button>
            </div>
    
            <div className="overflow-x-auto">
              <Table className="border border-gray-200 rounded-lg">
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox id="select-all" />
                    </TableHead>
                    <TableHead className="font-bold">
                      <div className="flex items-center gap-2">
                        Payment Invoice
                        <RiArrowUpDownLine className="h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead className="font-bold">
                      <div className="flex items-center gap-2">
                        Amount
                        <RiArrowUpDownLine className="h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead className="font-bold">
                      <div className="flex items-center gap-2">
                        Date
                        <RiArrowUpDownLine className="h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead className="font-bold">
                      <div className="flex items-center gap-2">
                        Status
                        <RiArrowUpDownLine className="h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead className="font-bold"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentHistory.map((item, index) => (
                    <TableRow key={index} onClick={() => setIsOpen(true)}>
                      <TableCell>
                        <Checkbox id={`select-invoice-${index}`} />
                      </TableCell>
                      <TableCell>{item.invoice}</TableCell>
                      <TableCell>${item.amount.toLocaleString()}</TableCell>
                      <TableCell>{item.date}</TableCell>
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
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
          {isOpen && (
            <div 
              className="fixed inset-0 bg-black/50 z-50 transition-opacity" 
              onClick={onClose}
            />
          )}
    
          {/* Drawer */}
          <div 
            className={`fixed inset-y-0 right-0 w-full max-w-xl bg-background z-50 transform transition-transform duration-300 ease-in-out rounded-2xl ${
              isOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            {/* Header */}
            <div className="border-b p-6 flex items-center justify-between ">
              <h2 className="text-lg font-semibold">Payment Link Details</h2>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <span className="sr-only">Close</span>
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </Button>
            </div>
    
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
    
            {/* Footer */}
           
          </div>
      </div>
      
      )
}

export default OwnerPayment