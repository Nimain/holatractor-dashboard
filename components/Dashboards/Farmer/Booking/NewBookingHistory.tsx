"use client"

import { useState, useEffect } from 'react';
import { 
  ChevronDown, 
  Search, 
  ArrowUpDown 
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Booking, BookingHours, Payment } from '@/utils/Types/types';
import { renderInstance } from '@/utils/Axios/RenderInstance';
import { errorMessage } from '@/utils/Toastify/Messages';
import { useCookie } from 'next-cookie';

interface user {
  userId: string;
  image: string;
  name: string;
  email: string;
}

const NewBookingHistory = () => {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [fetching, setFetching] = useState(false)

    const { cookie } = useCookie()
  const user: user = cookie.get("user")
  const access_token = cookie.get("access_token")

    // Search handler
    const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
      const term = event.target.value.toLowerCase();
      setSearchTerm(term);
  
      const filteredBookings = bookings.filter(booking => 
        booking.id.toLowerCase().includes(term) ||
        booking.store?.name.toLowerCase().includes(term)
      );
  
      setBookings(filteredBookings);
    };

    const filterBookingHours = (val: string) =>{
      let hours = "1 hour"
      if(val === BookingHours.EIGHT_HOURS) hours = "8 hours"
      else if(val === BookingHours.SEVEN_HOURS) hours = "7 hours"
      else if(val === BookingHours.SIX_HOURS) hours = "6 hours"
      else if(val === BookingHours.FIVE_HOURS) hours = "5 hours"
      else if(val === BookingHours.FOUR_HOURS) hours = "4 hours"
      else if(val === BookingHours.THREE_HOURS) hours = "3 hours"
      else if(val === BookingHours.TWO_HOURS) hours = "2 hours"
      return hours
    }

    function fetchPayments(){
      setFetching(true)
      renderInstance.get(`/farmer/bookingPage/${user.userId}`)
      .then((res)=>{
        setBookings(res.data)
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
                'Booking ID', 'Owner',
                'Booking Type', 'Start Date', 
                'Duration', 'Total Price', "status"
              ];

              const csvData = bookings.map(booking => [
                booking.id,
                booking.store ? `${booking.store.owner.user.first_name} ${booking.store.owner.user.middle_name ?? ""} ${booking.store.owner.user.last_name}` : "N/A",
                booking.bookingType || 'N/A',
                new Date(booking.start_date).toISOString(),
                booking.booking_hours ? filterBookingHours(booking.booking_hours) : booking.end_date ? new Date(booking.end_date).toISOString() : 'N/A',
                `$${booking.total_cost.toFixed(2)}`,
                booking.bookingStatus
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
                  Booking Type <ArrowUpDown size={14} className="inline" />
                </th>
                <th className="text-left p-4 font-medium text-gray-600">
                  Start Date <ArrowUpDown size={14} className="inline" />
                </th>
                <th className="text-left p-4 font-medium text-gray-600">
                  Duration <ArrowUpDown size={14} className="inline" />
                </th>
                <th className="text-left p-4 font-medium text-gray-600">
                  Total Price <ArrowUpDown size={14} className="inline" />
                </th>
                <th className="text-left p-4 font-medium text-gray-600">
                  Status <ArrowUpDown size={14} className="inline" />
                </th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="p-4 text-sm text-blue-600">{booking.id}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{booking.store ? `${booking.store.owner.user.first_name} ${booking.store.owner.user.middle_name ?? ""} ${booking.store.owner.user.last_name}` : "N/A"}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                  {booking.bookingType || 'N/A'}
                  </td>
                  <td className="p-4 text-sm">{new Date(booking.start_date).toISOString()}</td>
                  <td className="p-4 text-sm text-gray-600">
                    {booking.booking_hours ? filterBookingHours(booking.booking_hours) : booking.end_date ? new Date(booking.end_date).toISOString() : 'N/A'}
                  </td>
                  <td className="p-4 text-sm">${booking.total_cost.toFixed(2)}</td>
                  <td className="p-4 text-sm text-blue-600 font-medium">
                    {booking.bookingStatus}
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