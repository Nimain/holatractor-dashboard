"use client"

import { useState, useEffect } from 'react';
import {
  ChevronDown,
  Search,
  ArrowUpDown
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Booking, BookingHours, BookingStatus, Payment } from '@/utils/Types/types';
import { NestJsBaseURL, renderInstance } from '@/utils/Axios/RenderInstance';
import { errorMessage } from '@/utils/Toastify/Messages';
import { useCookie } from 'next-cookie';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import BookingConfirmation from './BookingConfirmation';
import { io, Socket } from 'socket.io-client';
import TranslatedText from '@/components/Menubar/TranslatedText';
import { bookingHistoryTranslations } from './BookingHistoryTranslations';
import { newBookingTranslations } from '../FarmerTranslation';

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
    let hours = <TranslatedText greetings={newBookingTranslations.hours['1h']} />
    if (val === BookingHours.EIGHT_HOURS) hours = <TranslatedText greetings={newBookingTranslations.hours['8h']} />
    else if (val === BookingHours.SEVEN_HOURS) hours = <TranslatedText greetings={newBookingTranslations.hours['7h']} />
    else if (val === BookingHours.SIX_HOURS) hours = <TranslatedText greetings={newBookingTranslations.hours['6h']} />
    else if (val === BookingHours.FIVE_HOURS) hours = <TranslatedText greetings={newBookingTranslations.hours['5h']} />
    else if (val === BookingHours.FOUR_HOURS) hours = <TranslatedText greetings={newBookingTranslations.hours['4h']} />
    else if (val === BookingHours.THREE_HOURS) hours = <TranslatedText greetings={newBookingTranslations.hours['3h']} />
    else if (val === BookingHours.TWO_HOURS) hours = <TranslatedText greetings={newBookingTranslations.hours['2h']} />
    return hours
  }

  const bookingFilters = [
    {
      placeholder: <TranslatedText greetings={bookingHistoryTranslations.all} />,
      value: "all",
    },
    {
      placeholder: <TranslatedText greetings={bookingHistoryTranslations.unConfirmed} />,
      value: "unconfirmed",
    },
    {
      placeholder: <TranslatedText greetings={bookingHistoryTranslations.assigned} />,
      value: "assigned",
    },
    {
      placeholder: <TranslatedText greetings={bookingHistoryTranslations.ongoing} />,
      value: "ongoing",
    },
    {
      placeholder: <TranslatedText greetings={bookingHistoryTranslations.completed} />,
      value: "completed",
    },
    {
      placeholder: <TranslatedText greetings={bookingHistoryTranslations.rejected} />,
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

  useEffect(() => {
    // Connect to the socket server
    const newSocket: Socket = io(NestJsBaseURL, {
        query: {
            userId: user.userId
        }
    });

    // Listen for the 'newFarmerNotification' event
    newSocket.on('newBooking', (booking: Booking) => {
        setBookings(prevBookings => {
            const existingBookingIndex = prevBookings.findIndex(b => b.id === booking.id);
            
            if (existingBookingIndex !== -1) {
                const updatedBookings = prevBookings.filter(b => b.id !== booking.id);
                return [booking, ...updatedBookings];
            } else {
                return [booking, ...prevBookings];
            }
        });
     });

    // Clean up the event listener when the component unmounts
    return () => {
        newSocket.disconnect();
    };
}, []);

  return (
    <div className="p-6">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1"><TranslatedText greetings={bookingHistoryTranslations.bookingHistory} /></h1>
          <p className="text-gray-500 text-sm"><TranslatedText greetings={bookingHistoryTranslations.allBookingHistoryInOnePlace} /></p>
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
        <Select onValueChange={e => setActiveFilter(e)} defaultValue='unconfirmed'>
          <SelectTrigger className='w-[180px]'>
            <SelectValue placeholder={<TranslatedText greetings={bookingHistoryTranslations.filterBy} />} />
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

      {/* Bookings Table */}
      <Card className="overflow-x-auto">
        <Table className="w-full min-w-[800px]">
          <TableHeader>
            <TableRow className="border-b">
              <TableHead className="text-left p-4 font-medium text-gray-600">
              <TranslatedText greetings={bookingHistoryTranslations.bookingNo} /> <span className='w-6 h-6 rounded-full inline-flex items-center justify-center hover:bg-gray-200'><ArrowUpDown size={14} className="inline" /></span>
              </TableHead>
              <TableHead className="text-left p-4 font-medium text-gray-600">
              <TranslatedText greetings={bookingHistoryTranslations.ownerName} /> <span className='w-6 h-6 rounded-full inline-flex items-center justify-center hover:bg-gray-200'><ArrowUpDown size={14} className="inline" /></span>
              </TableHead>
              <TableHead className="text-left p-4 font-medium text-gray-600">
              <TranslatedText greetings={bookingHistoryTranslations.bookingType} /> <span className='w-6 h-6 rounded-full inline-flex items-center justify-center hover:bg-gray-200'><ArrowUpDown size={14} className="inline" /></span>
              </TableHead>
              <TableHead className="text-left p-4 font-medium text-gray-600">
              <TranslatedText greetings={bookingHistoryTranslations.startDate} /> <span className='w-6 h-6 rounded-full inline-flex items-center justify-center hover:bg-gray-200'><ArrowUpDown size={14} className="inline" /></span>
              </TableHead>
              <TableHead className="text-left p-4 font-medium text-gray-600">
              <TranslatedText greetings={bookingHistoryTranslations.duration} /> <span className='w-6 h-6 rounded-full inline-flex items-center justify-center hover:bg-gray-200'><ArrowUpDown size={14} className="inline" /></span>
              </TableHead>
              <TableHead className="text-left p-4 font-medium text-gray-600">
              <TranslatedText greetings={bookingHistoryTranslations.totalPrice} /> <span className='w-6 h-6 rounded-full inline-flex items-center justify-center hover:bg-gray-200'><ArrowUpDown size={14} className="inline" /></span>
              </TableHead>
              <TableHead className="text-left p-4 font-medium text-gray-600">
              <TranslatedText greetings={bookingHistoryTranslations.status} /> <span className='w-6 h-6 rounded-full inline-flex items-center justify-center hover:bg-gray-200'><ArrowUpDown size={14} className="inline" /></span>
              </TableHead>
              {
                activeFilter === "unconfirmed" &&
                <TableHead className="text-left p-4 font-medium text-gray-600">
                  <TranslatedText greetings={bookingHistoryTranslations.action} /> <span className='w-6 h-6 rounded-full inline-flex items-center justify-center hover:bg-gray-200'><ArrowUpDown size={14} className="inline" /></span>
                </TableHead>
              }
            </TableRow>
          </TableHeader>
          <TableBody>
            {fetching ? <PaymentTableLoader bookings={bookings} /> : bookings.length === 0 ? <p>No bookings available</p> :
              activeFilter === "unconfirmed" ?
                bookings.filter(bo => !bo.confirm).map((booking, index) => (
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
                  bookings.filter(bo => (bo.owner_confirm || bo.bookingStatus === BookingStatus.Accepted)).map((booking, index) => (
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
                    bookings.filter(bo => (bo.bookingStatus === BookingStatus.Arriving || bo.bookingStatus === BookingStatus.Arrived || bo.bookingStatus === BookingStatus.Started || bo.bookingStatus === BookingStatus.Stopped)).map((booking, index) => (
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
                      bookings.filter(bo => (bo.bookingStatus === BookingStatus.Finished)).map((booking, index) => (
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
                        bookings.filter(bo => (bo.bookingStatus === BookingStatus.Rejected)).map((booking, index) => (
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

function PaymentTableLoader({bookings}: {bookings: Booking[]}) {
  return (
    <>
      {Array.from({ length: Math.max(5, bookings.length || 5) }).map((_, index) => (
        <tr key={`shimmer-${index}`} className="animate-pulse border-b">
          <td className="p-4">
            <div className="h-4 w-24 bg-gray-300 rounded"></div>
          </td>
          <td className="p-4">
            <div className="flex items-center gap-2">
              <div className="h-4 w-20 bg-gray-300 rounded"></div>
            </div>
          </td>
          <td className="p-4">
            <div className="h-4 w-24 bg-gray-300 rounded"></div>
          </td>
          <td className="p-4">
            <div className="h-4 w-16 bg-gray-300 rounded"></div>
          </td>
          <td className="p-4">
            <div className="h-4 w-24 bg-gray-300 rounded"></div>
          </td>
          <td className="p-4">
            <div className="h-4 w-16 bg-gray-300 rounded"></div>
          </td>
          <td className="p-4">
            <div className="h-4 w-20 bg-gray-300 rounded"></div>
          </td>
          <td className="p-4">
            <div className="h-4 w-20 bg-gray-300 rounded"></div>
          </td>
        </tr>
      ))}</>
  )
}