"use client"

import { useState, useEffect } from 'react';
import {
  ChevronDown,
  Search,
  ArrowUpDown
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Booking, BookingHours, BookingStatus, Payment } from '@/utils/Types/types';
import { renderInstance } from '@/utils/Axios/RenderInstance';
import { errorMessage } from '@/utils/Toastify/Messages';
import { useCookie } from 'next-cookie';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import BookingConfirmation from './BookingConfirmation';

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
  const [activeFilter, setActiveFilter] = useState("unconfirmed")

  const { cookie } = useCookie()
  const user: user = cookie.get("user")

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

  const filterBookingHours = (val: string) => {
    let hours = "1 hour"
    if (val === BookingHours.EIGHT_HOURS) hours = "8 hours"
    else if (val === BookingHours.SEVEN_HOURS) hours = "7 hours"
    else if (val === BookingHours.SIX_HOURS) hours = "6 hours"
    else if (val === BookingHours.FIVE_HOURS) hours = "5 hours"
    else if (val === BookingHours.FOUR_HOURS) hours = "4 hours"
    else if (val === BookingHours.THREE_HOURS) hours = "3 hours"
    else if (val === BookingHours.TWO_HOURS) hours = "2 hours"
    return hours
  }

  const bookingFilters = [
    {
      placeholder: "All",
      value: "all",
    },
    {
      placeholder: "Un confirmed",
      value: "unconfirmed",
    },
    {
      placeholder: "Accepted",
      value: "assigned",
    },
    {
      placeholder: "Ongoing",
      value: "ongoing",
    },
    {
      placeholder: "Completed",
      value: "completed",
    },
    {
      placeholder: "Rejected",
      value: "rejected",
    }
  ]

  function fetchPayments() {
    setFetching(true)
    renderInstance.get(`/farmer/bookingPage/${user.userId}`)
      .then((res) => {
        setBookings(res.data)
      }).catch((err) => {
        errorMessage("Error fetching payments")
      }).finally(() => {
        setFetching(false)
      })
  }

  useEffect(() => {
    if (user) {
      fetchPayments()
    }
  }, [])

  return (
    <div className="p-6">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1">Booking History</h1>
          <p className="text-gray-500 text-sm">All of your booking history in one place.</p>
        </div>
        <Button
          className="bg-primaryColor text-white px-4 py-2 rounded-lg flex items-center gap-2"
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
              new Date(booking.start_date).toLocaleDateString(),
              booking.booking_hours ? filterBookingHours(booking.booking_hours) : booking.end_date ? new Date(booking.end_date).toLocaleDateString() : 'N/A',
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
          Export
        </Button>
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
        <Select onValueChange={e=>setActiveFilter(e)} defaultValue='unconfirmed'>
          <SelectTrigger className='w-[180px]'>
            <SelectValue placeholder="Filter by" />
          </SelectTrigger>
          <SelectContent>
            {
              bookingFilters.map((filer, index)=>{
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

      {/* Bookings Table */}
      <Card className="overflow-x-auto">
        <Table className="w-full min-w-[800px]">
          <TableHeader>
            <TableRow className="border-b">
              <TableHead className="text-left p-4 font-medium text-gray-600">
                Booking No. <span className='w-6 h-6 rounded-full inline-flex items-center justify-center hover:bg-gray-200'><ArrowUpDown size={14} className="inline" /></span>
              </TableHead>
              <TableHead className="text-left p-4 font-medium text-gray-600">
                Owner Name <span className='w-6 h-6 rounded-full inline-flex items-center justify-center hover:bg-gray-200'><ArrowUpDown size={14} className="inline" /></span>
              </TableHead>
              <TableHead className="text-left p-4 font-medium text-gray-600">
                Booking Type <span className='w-6 h-6 rounded-full inline-flex items-center justify-center hover:bg-gray-200'><ArrowUpDown size={14} className="inline" /></span>
              </TableHead>
              <TableHead className="text-left p-4 font-medium text-gray-600">
                Start Date <span className='w-6 h-6 rounded-full inline-flex items-center justify-center hover:bg-gray-200'><ArrowUpDown size={14} className="inline" /></span>
              </TableHead>
              <TableHead className="text-left p-4 font-medium text-gray-600">
                Duration <span className='w-6 h-6 rounded-full inline-flex items-center justify-center hover:bg-gray-200'><ArrowUpDown size={14} className="inline" /></span>
              </TableHead>
              <TableHead className="text-left p-4 font-medium text-gray-600">
                Total Price <span className='w-6 h-6 rounded-full inline-flex items-center justify-center hover:bg-gray-200'><ArrowUpDown size={14} className="inline" /></span>
              </TableHead>
              <TableHead className="text-left p-4 font-medium text-gray-600">
                Status <span className='w-6 h-6 rounded-full inline-flex items-center justify-center hover:bg-gray-200'><ArrowUpDown size={14} className="inline" /></span>
              </TableHead>
              {
                activeFilter === "unconfirmed" &&
                <TableHead className="text-left p-4 font-medium text-gray-600">
                Action <span className='w-6 h-6 rounded-full inline-flex items-center justify-center hover:bg-gray-200'><ArrowUpDown size={14} className="inline" /></span>
              </TableHead>
              }
            </TableRow>
          </TableHeader>
          <TableBody>
            {fetching ? <p>Loading...</p> : bookings.length === 0 ? <p>No bookings available</p> : 
            activeFilter === "unconfirmed" ?
            bookings.filter(bo=>!bo.confirm).map((booking, index) => (
              <TableRow key={index} className="border-b hover:bg-gray-50">
                <TableCell className="p-4 text-sm text-blue-600">{booking.id}</TableCell>
                <TableCell className="p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{booking.store ? `${booking.store.owner.user.first_name} ${booking.store.owner.user.middle_name ?? ""} ${booking.store.owner.user.last_name}` : "N/A"}</span>
                  </div>
                </TableCell>
                <TableCell className="p-4 text-sm text-gray-600">
                  {booking.bookingType || 'N/A'}
                </TableCell>
                <TableCell className="p-4 text-sm">{new Date(booking.start_date).toLocaleDateString()}</TableCell>
                <TableCell className="p-4 text-sm text-gray-600">
                  {booking.booking_hours ? filterBookingHours(booking.booking_hours) : booking.end_date ? new Date(booking.end_date).toLocaleDateString() : 'N/A'}
                </TableCell>
                <TableCell className="p-4 text-sm">${booking.total_cost.toFixed(2)}</TableCell>
                <TableCell className="p-4 text-sm text-blue-600 font-medium">
                  {booking.bookingStatus}
                </TableCell>
                <TableCell className="p-4 text-sm">
                  <BookingConfirmation newBooking={booking} />
                </TableCell>
              </TableRow>
            ))
            :
            activeFilter === "assigned" ?
            bookings.filter(bo=>(bo.owner_confirm || bo.bookingStatus === BookingStatus.Accepted)).map((booking, index) => (
              <TableRow key={index} className="border-b hover:bg-gray-50">
                <TableCell className="p-4 text-sm text-blue-600">{booking.id}</TableCell>
                <TableCell className="p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{booking.store ? `${booking.store.owner.user.first_name} ${booking.store.owner.user.middle_name ?? ""} ${booking.store.owner.user.last_name}` : "N/A"}</span>
                  </div>
                </TableCell>
                <TableCell className="p-4 text-sm text-gray-600">
                  {booking.bookingType || 'N/A'}
                </TableCell>
                <TableCell className="p-4 text-sm">{new Date(booking.start_date).toLocaleDateString()}</TableCell>
                <TableCell className="p-4 text-sm text-gray-600">
                  {booking.booking_hours ? filterBookingHours(booking.booking_hours) : booking.end_date ? new Date(booking.end_date).toLocaleDateString() : 'N/A'}
                </TableCell>
                <TableCell className="p-4 text-sm">${booking.total_cost.toFixed(2)}</TableCell>
                <TableCell className="p-4 text-sm text-blue-600 font-medium">
                  {booking.bookingStatus}
                </TableCell>
              </TableRow>
            ))
            :
            activeFilter === "ongoing" ?
            bookings.filter(bo=>(bo.bookingStatus === BookingStatus.Arriving || bo.bookingStatus === BookingStatus.Arrived || bo.bookingStatus === BookingStatus.Started || bo.bookingStatus === BookingStatus.Stopped)).map((booking, index) => (
              <TableRow key={index} className="border-b hover:bg-gray-50">
                <TableCell className="p-4 text-sm text-blue-600">{booking.id}</TableCell>
                <TableCell className="p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{booking.store ? `${booking.store.owner.user.first_name} ${booking.store.owner.user.middle_name ?? ""} ${booking.store.owner.user.last_name}` : "N/A"}</span>
                  </div>
                </TableCell>
                <TableCell className="p-4 text-sm text-gray-600">
                  {booking.bookingType || 'N/A'}
                </TableCell>
                <TableCell className="p-4 text-sm">{new Date(booking.start_date).toLocaleDateString()}</TableCell>
                <TableCell className="p-4 text-sm text-gray-600">
                  {booking.booking_hours ? filterBookingHours(booking.booking_hours) : booking.end_date ? new Date(booking.end_date).toLocaleDateString() : 'N/A'}
                </TableCell>
                <TableCell className="p-4 text-sm">${booking.total_cost.toFixed(2)}</TableCell>
                <TableCell className="p-4 text-sm text-blue-600 font-medium">
                  {booking.bookingStatus}
                </TableCell>
              </TableRow>
            ))
            :
            activeFilter === "completed" ?
            bookings.filter(bo=>(bo.bookingStatus === BookingStatus.Finished)).map((booking, index) => (
              <TableRow key={index} className="border-b hover:bg-gray-50">
                <TableCell className="p-4 text-sm text-blue-600">{booking.id}</TableCell>
                <TableCell className="p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{booking.store ? `${booking.store.owner.user.first_name} ${booking.store.owner.user.middle_name ?? ""} ${booking.store.owner.user.last_name}` : "N/A"}</span>
                  </div>
                </TableCell>
                <TableCell className="p-4 text-sm text-gray-600">
                  {booking.bookingType || 'N/A'}
                </TableCell>
                <TableCell className="p-4 text-sm">{new Date(booking.start_date).toLocaleDateString()}</TableCell>
                <TableCell className="p-4 text-sm text-gray-600">
                  {booking.booking_hours ? filterBookingHours(booking.booking_hours) : booking.end_date ? new Date(booking.end_date).toLocaleDateString() : 'N/A'}
                </TableCell>
                <TableCell className="p-4 text-sm">${booking.total_cost.toFixed(2)}</TableCell>
                <TableCell className="p-4 text-sm text-blue-600 font-medium">
                  {booking.bookingStatus}
                </TableCell>
              </TableRow>
            ))
            :
            activeFilter === "rejected" ?
            bookings.filter(bo=>(bo.bookingStatus === BookingStatus.Rejected)).map((booking, index) => (
              <TableRow key={index} className="border-b hover:bg-gray-50">
                <TableCell className="p-4 text-sm text-blue-600">{booking.id}</TableCell>
                <TableCell className="p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{booking.store ? `${booking.store.owner.user.first_name} ${booking.store.owner.user.middle_name ?? ""} ${booking.store.owner.user.last_name}` : "N/A"}</span>
                  </div>
                </TableCell>
                <TableCell className="p-4 text-sm text-gray-600">
                  {booking.bookingType || 'N/A'}
                </TableCell>
                <TableCell className="p-4 text-sm">{new Date(booking.start_date).toLocaleDateString()}</TableCell>
                <TableCell className="p-4 text-sm text-gray-600">
                  {booking.booking_hours ? filterBookingHours(booking.booking_hours) : booking.end_date ? new Date(booking.end_date).toLocaleDateString() : 'N/A'}
                </TableCell>
                <TableCell className="p-4 text-sm">${booking.total_cost.toFixed(2)}</TableCell>
                <TableCell className="p-4 text-sm text-blue-600 font-medium">
                  {booking.bookingStatus}
                </TableCell>
              </TableRow>
            ))
            :
            bookings.map((booking, index) => (
              <TableRow key={index} className="border-b hover:bg-gray-50">
                <TableCell className="p-4 text-sm text-blue-600">{booking.id}</TableCell>
                <TableCell className="p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{booking.store ? `${booking.store.owner.user.first_name} ${booking.store.owner.user.middle_name ?? ""} ${booking.store.owner.user.last_name}` : "N/A"}</span>
                  </div>
                </TableCell>
                <TableCell className="p-4 text-sm text-gray-600">
                  {booking.bookingType || 'N/A'}
                </TableCell>
                <TableCell className="p-4 text-sm">{new Date(booking.start_date).toLocaleDateString()}</TableCell>
                <TableCell className="p-4 text-sm text-gray-600">
                  {booking.booking_hours ? filterBookingHours(booking.booking_hours) : booking.end_date ? new Date(booking.end_date).toLocaleDateString() : 'N/A'}
                </TableCell>
                <TableCell className="p-4 text-sm">${booking.total_cost.toFixed(2)}</TableCell>
                <TableCell className="p-4 text-sm text-blue-600 font-medium">
                  {booking.bookingStatus}
                </TableCell>
              </TableRow>
            ))
          }
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

export default NewBookingHistory