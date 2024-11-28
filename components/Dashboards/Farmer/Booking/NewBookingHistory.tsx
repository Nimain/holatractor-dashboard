"use client"

import React, { useState } from 'react';
import { format } from 'date-fns';
import { 
  ChevronDown, 
  Search, 
  ArrowUpDown 
} from 'lucide-react';
import { Card } from '@/components/ui/card';

// Booking interface matching previous definition
interface Booking {
  id: string;
  user_id: string;
  store_id: string;
  start_date: Date;
  end_date?: Date | null;
  total_cost: number;
  tractors: {
    type: string;
  }[];
  user: {
    name: string;
    avatar?: string;
  };
  payment: {
    type: string;
  }[];
}

// Mock data for demonstration
const mockBookings: Booking[] = [
  {
    id: 'BOOK001',
    user_id: 'user1',
    store_id: 'store1',
    start_date: new Date('2024-01-15T10:00:00'),
    end_date: new Date('2024-01-16T14:00:00'),
    total_cost: 500.00,
    tractors: [{ type: 'Excavator' }],
    user: { 
      name: 'John Doe',
      avatar: '/path/to/avatar.jpg'
    },
    payment: [{ type: 'Credit Card' }]
  },
  {
    id: 'BOOK002',
    user_id: 'user2',
    store_id: 'store2',
    start_date: new Date('2024-02-20T09:00:00'),
    end_date: new Date('2024-02-21T16:00:00'),
    total_cost: 750.50,
    tractors: [{ type: 'Tractor' }],
    user: { 
      name: 'Jane Smith',
      avatar: '/path/to/avatar2.jpg'
    },
    payment: [{ type: 'Bank Transfer' }]
  }
];

const NewBookingHistory = () => {
    const [bookings, setBookings] = useState<Booking[]>(mockBookings);
    const [searchTerm, setSearchTerm] = useState<string>('');
  
    // Search handler
    const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
      const term = event.target.value.toLowerCase();
      setSearchTerm(term);
  
      const filteredBookings = mockBookings.filter(booking => 
        booking.id.toLowerCase().includes(term) ||
        booking.user.name.toLowerCase().includes(term) ||
        booking.tractors[0].type.toLowerCase().includes(term)
      );
  
      setBookings(filteredBookings);
    };
  
    return (
      <div className="p-6">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold mb-1">Booking History</h1>
            <p className="text-gray-500 text-sm">Get your latest bookings for the last 7 days</p>
          </div>
          <button 
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            onClick={() => {
              // Export functionality
              const headers = [
                'Booking ID', 'Owner', 'Creation Date', 
                'Tractor Type', 'Delivery Date', 
                'Payment Type', 'Total Price'
              ];
  
              const csvData = bookings.map(booking => [
                booking.id,
                booking.user.name,
                format(booking.start_date, 'yyyy-MM-dd'),
                booking.tractors[0]?.type || 'N/A',
                booking.end_date ? format(booking.end_date, 'yyyy-MM-dd') : 'N/A',
                booking.payment[0]?.type || 'N/A',
                `$${booking.total_cost.toFixed(2)}`
              ]);
  
              const csvContent = [
                headers.join(','),
                ...csvData.map(row => row.join(','))
              ].join('\n');
  
              const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
              const link = document.createElement('a');
              const url = URL.createObjectURL(blob);
              link.setAttribute('href', url);
              link.setAttribute('download', 'booking_history.csv');
              link.style.visibility = 'hidden';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
          >
            Export <ChevronDown size={16} />
          </button>
        </div>
  
        {/* Search and Filter Bar */}
        <div className="flex justify-between items-center mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Type here to search"
              value={searchTerm}
              onChange={handleSearch}
              className="pl-10 pr-4 py-2 w-full border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button className="ml-4 px-4 py-2 border rounded-lg flex items-center gap-2">
            Filter by <ChevronDown size={16} />
          </button>
        </div>
  
        {/* Bookings Table */}
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b">
                <th className="text-left p-4 font-medium text-gray-600">
                  Booking No. <ArrowUpDown size={14} className="inline" />
                </th>
                <th className="text-left p-4 font-medium text-gray-600">
                  Owner Name <ArrowUpDown size={14} className="inline" />
                </th>
                <th className="text-left p-4 font-medium text-gray-600">
                  Creation Date <ArrowUpDown size={14} className="inline" />
                </th>
                <th className="text-left p-4 font-medium text-gray-600">
                  Tractor Type <ArrowUpDown size={14} className="inline" />
                </th>
                <th className="text-left p-4 font-medium text-gray-600">
                  Return Date <ArrowUpDown size={14} className="inline" />
                </th>
                <th className="text-left p-4 font-medium text-gray-600">
                  Payment Type <ArrowUpDown size={14} className="inline" />
                </th>
                <th className="text-left p-4 font-medium text-gray-600">
                  Total Price <ArrowUpDown size={14} className="inline" />
                </th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="p-4 text-sm text-blue-600">{booking.id}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-8 h-8 bg-gray-200 rounded-full bg-cover bg-center"
                        style={{
                          backgroundImage: booking.user.avatar 
                            ? `url(${booking.user.avatar})` 
                            : 'none'
                        }} 
                      />
                      <span className="text-sm">{booking.user.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                    {format(booking.start_date, 'yyyy-MM-dd')}
                  </td>
                  <td className="p-4 text-sm">{booking.tractors[0]?.type || 'N/A'}</td>
                  <td className="p-4 text-sm text-gray-600">
                    {booking.end_date ? format(booking.end_date, 'yyyy-MM-dd') : 'N/A'}
                  </td>
                  <td className="p-4 text-sm">{booking.payment[0]?.type || 'N/A'}</td>
                  <td className="p-4 text-sm text-blue-600 font-medium">
                    ${booking.total_cost.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    );
}

export default NewBookingHistory