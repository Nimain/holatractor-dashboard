"use client";

import { useEffect, useState } from 'react';
import { ChevronDown, Search, ArrowUpDown, Check, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Payment } from '@/utils/Types/types';
import { useCookie } from 'next-cookie';
import { renderInstance } from '@/utils/Axios/RenderInstance';
import { errorMessage } from '@/utils/Toastify/Messages';
import FarmerShimmer from '../_components/FarmerShrimmer';

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

  const { cookie } = useCookie()
  const user: user = cookie.get("user")
  const access_token = cookie.get("access_token")

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

  function fetchPayments(){
    setFetching(true)
    renderInstance.get(`/farmer/paymentPage/${user.userId}`)
    .then((res)=>{
      setPayments(res.data)
    }).catch((err)=>{
      errorMessage("Error fetching payments")
    }).finally(()=>{
      setFetching(false)
    })
  }

  useEffect(()=>{
    if(user){
      fetchPayments()
    }
  },[])

  if(fetching) return <FarmerShimmer />

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
              `${payment.status}` === "COMPLETED" ? new Date(payment.createdAt).toISOString() : "Payment not settled yed"
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
          className="bg-primary text-primary-foreground"
        >
          Export <ChevronDown className="ml-2 h-4 w-4" />
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
        <Button variant="outline" className="ml-4">
          Filter by <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </div>

      {/* Payments Table */}
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="border-b">
              <th className="text-left p-4 font-medium text-gray-600">
                Payment ID <ArrowUpDown size={14} className="inline ml-1" />
              </th>
              <th className="text-left p-4 font-medium text-gray-600">
                Booking ID <ArrowUpDown size={14} className="inline ml-1" />
              </th>
              <th className="text-left p-4 font-medium text-gray-600">
                Amount <ArrowUpDown size={14} className="inline ml-1" />
              </th>
              <th className="text-left p-4 font-medium text-gray-600">
                Status <ArrowUpDown size={14} className="inline ml-1" />
              </th>
              <th className="text-left p-4 font-medium text-gray-600">
                Payment Method <ArrowUpDown size={14} className="inline ml-1" />
              </th>
              <th className="text-left p-4 font-medium text-gray-600">
                Receiver <ArrowUpDown size={14} className="inline ml-1" />
              </th>
              <th className="text-left p-4 font-medium text-gray-600">
                Date <ArrowUpDown size={14} className="inline ml-1" />
              </th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment, index) => (
              <tr key={index} className="border-b hover:bg-gray-50">
                <td className="p-4 text-sm text-blue-600">{payment.id}</td>
                <td className="p-4 text-sm">{payment.booking_id}</td>
                <td className="p-4 text-sm font-medium">${payment.amount.toFixed(2)}</td>
                <td className="p-4 text-sm">
                  <Badge className={`bg-gray-100 text-gray-800'} capitalize`}>
                    {payment.status}
                  </Badge>
                </td>
                <td className="p-4 text-sm">{payment.transactionMethod}</td>
                <td className="p-4 text-sm text-gray-600">{`${payment.reciever.first_name} ${payment.reciever.middle_name ?? ""} ${payment.reciever.last_name}`}</td>
                <td className="p-4 text-sm text-gray-600">
                  {`${payment.status}` === "COMPLETED" ? new Date(payment.createdAt).toISOString() : "Payment not settled yed"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

export default PaymentHistory