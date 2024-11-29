"use client"

import { useState } from 'react';
import { 
  ChevronDown, 
  Search, 
  ArrowUpDown 
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Payment } from '@/utils/Types/types';

const NewBookingHistory = () => {
    const [bookings, setBookings] = useState<Payment[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>('');
  
    // Search handler
    const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
      const term = event.target.value.toLowerCase();
      setSearchTerm(term);
  
      const filteredBookings = bookings.filter(booking => 
        booking.id.toLowerCase().includes(term) ||
        booking.reciever.first_name.toLowerCase().includes(term) ||
        booking.reciever.last_name.toLowerCase().includes(term) ||
        booking.reciever.middle_name?.toLowerCase().includes(term)
      );
  
      setBookings(filteredBookings);
    };
  
    return (
      <div className="p-6">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold mb-1">Booking History</h1>
            <p className="text-gray-500 text-sm">All of your booking history in one place.</p>
          </div>
          <button 
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            onClick={() => {
              // Export functionality
              const headers = [
                'Booking ID', 'Owner', 'Creation Date', 
                'Booking Type', 'Payment Date', 
                'Payment Type', 'Total Price'
              ];
  
              const csvData = bookings.map(booking => [
                booking.id,
                `${booking.reciever.first_name} ${booking.reciever.middle_name ?? ""} ${booking.reciever.last_name}`,
                new Date(booking.createdAt).toISOString(),
                booking.booking.bookingType || 'N/A',
                `${booking.status}` === "COMPLETED" ? new Date(booking.updatedAt).toISOString() : 'N/A',
                booking.transactionMethod || 'N/A',
                `$${booking.amount.toFixed(2)}`
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
                  Booking Type <ArrowUpDown size={14} className="inline" />
                </th>
                <th className="text-left p-4 font-medium text-gray-600">
                  Payment Date <ArrowUpDown size={14} className="inline" />
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
                          backgroundImage: booking.reciever.image 
                            ? `url(${booking.reciever.image})` 
                            : 'none'
                        }} 
                      />
                      <span className="text-sm">{`${booking.reciever.first_name} ${booking.reciever.middle_name ?? ""} ${booking.reciever.last_name}`}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                    {new Date(booking.createdAt).toISOString()}
                  </td>
                  <td className="p-4 text-sm">{booking.booking.bookingType || 'N/A'}</td>
                  <td className="p-4 text-sm text-gray-600">
                    {`${booking.status}` === "COMPLETED" ? new Date(booking.updatedAt).toISOString() : 'N/A'}
                  </td>
                  <td className="p-4 text-sm">{booking.transactionMethod}</td>
                  <td className="p-4 text-sm text-blue-600 font-medium">
                    ${booking.amount.toFixed(2)}
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