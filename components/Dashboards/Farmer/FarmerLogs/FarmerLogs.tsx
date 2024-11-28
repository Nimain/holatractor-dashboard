"use client"

import React, { useState } from 'react';
import { format } from 'date-fns';
import { ChevronDown, Search, ArrowUpDown, Check, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

// Payment interface
interface Payment {
  id: string;
  booking_id: string;
  user_id: string;
  amount: number;
  status: 'Completed' | 'Pending' | 'Failed';
  payment_method: string;
  transaction_id: string;
  created_at: Date;
  updated_at: Date;
}

// Mock data for demonstration
const mockPayments: Payment[] = [
  {
    id: 'PAY001',
    booking_id: 'BOOK001',
    user_id: 'user1',
    amount: 500.00,
    status: 'Completed',
    payment_method: 'Credit Card',
    transaction_id: 'TXN123456',
    created_at: new Date('2024-01-15T10:30:00'),
    updated_at: new Date('2024-01-15T10:35:00'),
  },
  {
    id: 'PAY002',
    booking_id: 'BOOK002',
    user_id: 'user2',
    amount: 750.50,
    status: 'Pending',
    payment_method: 'Bank Transfer',
    transaction_id: 'TXN789012',
    created_at: new Date('2024-02-20T09:15:00'),
    updated_at: new Date('2024-02-20T09:15:00'),
  },
  {
    id: 'PAY003',
    booking_id: 'BOOK003',
    user_id: 'user3',
    amount: 300.25,
    status: 'Failed',
    payment_method: 'PayPal',
    transaction_id: 'TXN345678',
    created_at: new Date('2024-03-05T14:45:00'),
    updated_at: new Date('2024-03-05T14:50:00'),
  },
];

const FarmerLogs = () => {
    const [payments, setPayments] = useState<Payment[]>(mockPayments);
    const [searchTerm, setSearchTerm] = useState<string>('');
  
    // Search handler
    const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
      const term = event.target.value.toLowerCase();
      setSearchTerm(term);
  
      const filteredPayments = mockPayments.filter(payment => 
        payment.id.toLowerCase().includes(term) ||
        payment.booking_id.toLowerCase().includes(term) ||
        payment.payment_method.toLowerCase().includes(term) ||
        payment.status.toLowerCase().includes(term)
      );
  
      setPayments(filteredPayments);
    };
  
    // Status badge component
    const StatusBadge: React.FC<{ status: Payment['status'] }> = ({ status }) => {
      const statusStyles = {
        Completed: 'bg-green-100 text-green-800',
        Pending: 'bg-yellow-100 text-yellow-800',
        Failed: 'bg-red-100 text-red-800',
      };
  
      return (
        <Badge className={`${statusStyles[status]} capitalize`}>
          {status === 'Completed' && <Check className="w-3 h-3 mr-1" />}
          {status === 'Failed' && <X className="w-3 h-3 mr-1" />}
          {status}
        </Badge>
      );
    };
  
    return (
      <div className="p-6">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold mb-1">Logs</h1>
            <p className="text-gray-500 text-sm">View and manage your farmer Logs</p>
          </div>
          <Button 
            onClick={() => {
              // Export functionality
              const headers = [
                'Payment ID', 'Booking ID', 'Amount', 'Status', 
                'Payment Method', 'Transaction ID', 'Date'
              ];
  
              const csvData = payments.map(payment => [
                payment.id,
                payment.booking_id,
                `$${payment.amount.toFixed(2)}`,
                payment.status,
                payment.payment_method,
                payment.transaction_id,
                format(payment.created_at, 'yyyy-MM-dd HH:mm')
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
                  Transaction ID <ArrowUpDown size={14} className="inline ml-1" />
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
                    <StatusBadge status={payment.status} />
                  </td>
                  <td className="p-4 text-sm">{payment.payment_method}</td>
                  <td className="p-4 text-sm text-gray-600">{payment.transaction_id}</td>
                  <td className="p-4 text-sm text-gray-600">
                    {format(payment.created_at, 'yyyy-MM-dd HH:mm')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    );
}

export default FarmerLogs