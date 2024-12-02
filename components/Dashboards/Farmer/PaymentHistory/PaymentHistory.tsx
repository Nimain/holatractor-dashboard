"use client";

import { useEffect, useState } from 'react';
import { ChevronDown, Search, ArrowUpDown, Check, X, Download, Printer, Wallet, Eye, CreditCard, Banknote } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Payment, TransactionMethod } from '@/utils/Types/types';
import { useCookie } from 'next-cookie';
import { renderInstance } from '@/utils/Axios/RenderInstance';
import { errorMessage } from '@/utils/Toastify/Messages';
import FarmerShimmer from '../_components/FarmerShrimmer';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { BankAccountForm, PayPalForm, UPIForm } from '../BookingHistory';
import PaymentDetailsSheet from './PaymentDetailsSheet';

interface user {
  userId: string;
  image: string;
  name: string;
  email: string;
}

const PaymentHistory = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [fetching, setFetching] = useState(false)
  const [activeFilter, setActiveFilter] = useState("unpaid")

  const { cookie } = useCookie()
  const user: user = cookie.get("user")

  // Search handler
  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const term = event.target.value.toLowerCase();
    setSearchTerm(term);

    const filteredPayments = payments.filter(payment =>
      payment.id.toLowerCase().includes(term) ||
      payment.booking_id.toLowerCase().includes(term)
    );

    setPayments(filteredPayments);
  };

  function fetchPayments() {
    setFetching(true)
    renderInstance.get(`/farmer/paymentPage/${user.userId}`)
      .then((res) => {
        setPayments(res.data)
      }).catch((err) => {
        errorMessage("Error fetching payments")
      }).finally(() => {
        setFetching(false)
      })
  }

  const bookingFilters = [
    {
      placeholder: "All",
      value: "all",
    },
    {
      placeholder: "Un paid",
      value: "unpaid",
    },
    {
      placeholder: "Owner review",
      value: "review",
    },
    {
      placeholder: "Rejected",
      value: "rejected",
    },
    {
      placeholder: "Completed",
      value: "completed",
    },
  ]

  useEffect(() => {
    if (user) {
      fetchPayments()
    }
  }, [])

  if (fetching) return <FarmerShimmer />

  return (
    <div className="p-6">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1">Payment History</h1>
          <p className="text-gray-500 text-sm">View and manage your payment transactions</p>
        </div>
        <Button
          onClick={() => {
            // Export functionality
            const headers = [
              'Payment ID', 'Booking ID', 'Amount', 'Status',
              'Payment Method', 'Receiver', 'Date'
            ];

            const csvData = payments.map(payment => [
              payment.id,
              payment.booking_id,
              `$${payment.amount.toFixed(2)}`,
              payment.status,
              payment.transactionMethod,
              `${payment.reciever.first_name} ${payment.reciever.middle_name ?? ""} ${payment.reciever.last_name}`,
              `${payment.status}` === "COMPLETED" ? new Date(payment.createdAt).toLocaleDateString() : "Payment not settled yed"
            ]);

            const csvContent = [
              headers.join(','),
              ...csvData.map(row => row.join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', 'payment_history.csv');
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }}
          className="bg-primaryColor text-primary-foreground"
        >
          Export
        </Button>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex justify-between items-center mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search by ID, booking, method, or status"
            value={searchTerm}
            onChange={handleSearch}
            className="pl-10"
          />
        </div>
        <Select onValueChange={e => setActiveFilter(e)} defaultValue='unpaid'>
          <SelectTrigger className='w-[180px]'>
            <SelectValue placeholder="Filter by" />
          </SelectTrigger>
          <SelectContent>
            {
              bookingFilters.map((filer, index) => {
                return (
                  <SelectItem key={index} value={filer.value}>
                    {filer.placeholder}
                  </SelectItem>
                )
              })
            }
          </SelectContent>
        </Select>
      </div>

      {/* Payments Table */}
      <Card className="overflow-x-auto">
        <Table className="w-full min-w-[800px]">
          <TableHeader>
            <TableRow className="border-b">
              <TableHead className="w-8 p-4">
                <Input type="checkbox" className="rounded w-4 h-4 accent-primaryColor" />
              </TableHead>
              <TableHead className="text-left p-4 font-medium text-gray-600">
                Payment ID <span className='w-6 h-6 rounded-full inline-flex items-center justify-center hover:bg-gray-200'><ArrowUpDown size={14} className="inline" /></span>
              </TableHead>
              <TableHead className="text-left p-4 font-medium text-gray-600">
                Booking ID <span className='w-6 h-6 rounded-full inline-flex items-center justify-center hover:bg-gray-200'><ArrowUpDown size={14} className="inline" /></span>
              </TableHead>
              <TableHead className="text-left p-4 font-medium text-gray-600">
                Amount <span className='w-6 h-6 rounded-full inline-flex items-center justify-center hover:bg-gray-200'><ArrowUpDown size={14} className="inline" /></span>
              </TableHead>
              <TableHead className="text-left p-4 font-medium text-gray-600">
                Status <span className='w-6 h-6 rounded-full inline-flex items-center justify-center hover:bg-gray-200'><ArrowUpDown size={14} className="inline" /></span>
              </TableHead>
              <TableHead className="text-left p-4 font-medium text-gray-600">
                Payment Method <span className='w-6 h-6 rounded-full inline-flex items-center justify-center hover:bg-gray-200'><ArrowUpDown size={14} className="inline" /></span>
              </TableHead>
              <TableHead className="text-left p-4 font-medium text-gray-600">
                Receiver <span className='w-6 h-6 rounded-full inline-flex items-center justify-center hover:bg-gray-200'><ArrowUpDown size={14} className="inline" /></span>
              </TableHead>
              <TableHead className="text-left p-4 font-medium text-gray-600">
                Date <span className='w-6 h-6 rounded-full inline-flex items-center justify-center hover:bg-gray-200'><ArrowUpDown size={14} className="inline" /></span>
              </TableHead>
              {
                activeFilter === "unpaid" &&
                <TableHead className="text-left p-4 font-medium text-gray-600">
                  Action <span className='w-6 h-6 rounded-full inline-flex items-center justify-center hover:bg-gray-200'><ArrowUpDown size={14} className="inline" /></span>
                </TableHead>
              }
            </TableRow>
          </TableHeader>
          <TableBody>
            {activeFilter === "unpaid" ?
              payments.length === 0 ? <p>No payment history available</p> : payments.filter(po=>(`${po.status}` === "FarmerPENDING")).map((payment) => (
                <PaymentDetailsSheet payment={payment} key={payment.id} />
              ))
              :
              activeFilter === "review" ?
              payments.filter(po=>(`${po.status}` === "FarmerCONFIRMED")).map((payment) => (
                <PaymentDetailsSheet payment={payment} key={payment.id} />
              ))
              :
              activeFilter === "rejected" ?
              payments.filter(po=>(`${po.status}` === "OwnerREJECTED")).map((payment) => (
                <PaymentDetailsSheet payment={payment} key={payment.id} />
              ))
              :
              activeFilter === "completed" ?
              payments.filter(po=>(`${po.status}` === "COMPLETED")).map((payment) => (
                <PaymentDetailsSheet payment={payment} key={payment.id} />
              ))
              :
              payments.map((payment) => (
                <PaymentDetailsSheet payment={payment} key={payment.id} />
              ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

export default PaymentHistory