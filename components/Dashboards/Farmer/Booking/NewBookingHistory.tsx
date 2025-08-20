"use client";

import { useState, useEffect } from "react";
import {
  ChevronDown,
  Search,
  ArrowUpDown,
  X,
  Check,
  Download,
  Filter,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Booking,
  BookingHours,
  BookingStatus,
  Payment,
} from "@/utils/Types/types";
import { NestJsBaseURL, renderInstance } from "@/utils/Axios/RenderInstance";
import { errorMessage } from "@/utils/Toastify/Messages";
import { useCookie } from "next-cookie";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import BookingConfirmation from "./BookingConfirmation";
import { io, Socket } from "socket.io-client";
import TranslatedText from "@/components/Menubar/TranslatedText";
import { bookingHistoryTranslations } from "./BookingHistoryTranslations";
import { newBookingTranslations } from "../FarmerTranslation";
import Pagination from "@/utils/Paginations/Pagination";

interface user {
  userId: string;
  image: string;
  name: string;
  email: string;
}

interface PaginationResponse {
  itemsPerPage: number;
  page: number;
  all: number;
  unconfirmed: number;
  assigned: number;
  ongoing: number;
  completed: number;
  rejected: number;
  totalPages: number;
}

const durations = [
  {
    label: "1 hr",
    value: `${BookingHours.ONE_HOUR}`,
  },
  {
    label: "2 hr",
    value: `${BookingHours.TWO_HOURS}`,
  },
  {
    label: "3 hr",
    value: `${BookingHours.THREE_HOURS}`,
  },
  {
    label: "4 hr",
    value: `${BookingHours.FOUR_HOURS}`,
  },
  {
    label: "5 hr",
    value: `${BookingHours.FIVE_HOURS}`,
  },
  {
    label: "6 hr",
    value: `${BookingHours.SIX_HOURS}`,
  },
  {
    label: "7 hr",
    value: `${BookingHours.SEVEN_HOURS}`,
  },
  {
    label: "8 hr",
    value: `${BookingHours.EIGHT_HOURS}`,
  },
];

const NewBookingHistory = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [fetching, setFetching] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");

  const [pagination, setPagination] = useState<PaginationResponse>({
    itemsPerPage: 10,
    page: 1,
    all: 0,
    unconfirmed: 0,
    assigned: 0,
    ongoing: 0,
    completed: 0,
    rejected: 0,
    totalPages: 0,
  });
  const [searchCategory, setSearchCategory] = useState("owner_name");
  const [date, setDate] = useState<Date>();
  const [openDuration, setOpenDuration] = useState(false);

  const { cookie } = useCookie();
  const user: user = cookie.get("user");

  const handleClear = () => {
    setSearchTerm("");
    setDate(new Date());
  };

  const filterBookingHours = (val: string) => {
    let hours = (
      <TranslatedText greetings={newBookingTranslations.hours["1h"]} />
    );
    if (val === BookingHours.EIGHT_HOURS)
      hours = <TranslatedText greetings={newBookingTranslations.hours["8h"]} />;
    else if (val === BookingHours.SEVEN_HOURS)
      hours = <TranslatedText greetings={newBookingTranslations.hours["7h"]} />;
    else if (val === BookingHours.SIX_HOURS)
      hours = <TranslatedText greetings={newBookingTranslations.hours["6h"]} />;
    else if (val === BookingHours.FIVE_HOURS)
      hours = <TranslatedText greetings={newBookingTranslations.hours["5h"]} />;
    else if (val === BookingHours.FOUR_HOURS)
      hours = <TranslatedText greetings={newBookingTranslations.hours["4h"]} />;
    else if (val === BookingHours.THREE_HOURS)
      hours = <TranslatedText greetings={newBookingTranslations.hours["3h"]} />;
    else if (val === BookingHours.TWO_HOURS)
      hours = <TranslatedText greetings={newBookingTranslations.hours["2h"]} />;
    return hours;
  };

  const bookingFilters = [
    {
      placeholder: (
        <TranslatedText greetings={bookingHistoryTranslations.all} />
      ),
      value: "all",
    },
    {
      placeholder: (
        <TranslatedText greetings={bookingHistoryTranslations.unConfirmed} />
      ),
      value: "unconfirmed",
    },
    {
      placeholder: (
        <TranslatedText greetings={bookingHistoryTranslations.assigned} />
      ),
      value: "assigned",
    },
    {
      placeholder: (
        <TranslatedText greetings={bookingHistoryTranslations.ongoing} />
      ),
      value: "ongoing",
    },
    {
      placeholder: (
        <TranslatedText greetings={bookingHistoryTranslations.completed} />
      ),
      value: "completed",
    },
    {
      placeholder: (
        <TranslatedText greetings={bookingHistoryTranslations.rejected} />
      ),
      value: "rejected",
    },
  ];

  function fetchPayments() {
    setFetching(true);
    renderInstance
      .get(
        `/farmer/bookingPage/${user.userId}?filter=${activeFilter}&page=${pagination.page}&category=${searchCategory}&search=${searchTerm}`
      )
      .then((res) => {
        setPagination(res.data.pagination);
        setBookings(res.data.bookings);
      })
      .catch((err) => {
        errorMessage("Error fetching payments");
      })
      .finally(() => {
        setFetching(false);
      });
  }

  const renderInput = () => {
    switch (searchCategory) {
      case "booking_type":
        return (
          <Select value={searchTerm} onValueChange={setSearchTerm}>
            <SelectTrigger className="w-full rounded-l-none">
              <SelectValue
                placeholder={
                  <span className="text-red-600">Select booking type</span>
                }
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="standalone">Standalone</SelectItem>
              <SelectItem value="store">Store</SelectItem>
            </SelectContent>
          </Select>
        );

      case "start_date":
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={`w-full justify-start text-left font-normal rounded-l-none ${
                  !date && "text-red-600 placeholder:text-red-600"
                }`}
              >
                {date ? (
                  format(date, "PPP")
                ) : (
                  <span className="text-red-600">Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(newDate) => {
                  setDate(newDate);
                  setSearchTerm(newDate ? format(newDate, "yyyy-MM-dd") : "");
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        );
      case "duration":
        return (
          <Popover open={openDuration} onOpenChange={setOpenDuration}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openDuration}
                className="w-full justify-between rounded-l-none"
              >
                {searchTerm ? (
                  durations.find((duration) => duration.value === searchTerm)
                    ?.label || "Select duration..."
                ) : (
                  <span className="text-red-600">Select duration...</span>
                )}
                <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput
                  placeholder="Search duration..."
                  className="placeholder:text-red-600"
                />
                <CommandList>
                  <CommandEmpty>No duration found.</CommandEmpty>
                  <CommandGroup>
                    {durations.map((duration) => (
                      <CommandItem
                        key={duration.value}
                        onSelect={() => {
                          setSearchTerm(duration.value);
                          setOpenDuration(false);
                        }}
                      >
                        <Check
                          className={`mr-2 h-4 w-4 ${
                            searchTerm === duration.value
                              ? "opacity-100"
                              : "opacity-0"
                          }`}
                        />
                        {duration.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        );
      case "price":
        return (
          <Input
            type="number"
            placeholder="Enter price"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="rounded-l-none placeholder:text-red-600"
          />
        );
      default:
        return (
          <div className="relative flex-1">
            <Input
              type="text"
              placeholder="Type here to search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 rounded-l-none placeholder:text-red-600"
            />
          </div>
        );
    }
  };

  const updateBookingStatus = (id: string, confirmed: boolean) => {
    setBookings((prevBookings) =>
      prevBookings.map((booking) =>
        booking.id === id ? { ...booking, confirm: confirmed } : booking
      )
    );
  };

  const handlePageChange = (page: number) => {
    setPagination((prevPagination) => ({ ...prevPagination, page }));
  };

  useEffect(() => {
    if (user) {
      fetchPayments();
    }
  }, [activeFilter, searchTerm, pagination.page]);

  useEffect(() => {
    // Connect to the socket server
    const newSocket: Socket = io(NestJsBaseURL, {
      query: {
        userId: user.userId,
      },
    });

    // Listen for the 'newFarmerNotification' event
    newSocket.on("newBooking", (booking: Booking) => {
      setBookings((prevBookings) => {
        const existingBookingIndex = prevBookings.findIndex(
          (b) => b.id === booking.id
        );

        if (existingBookingIndex !== -1) {
          const updatedBookings = prevBookings.filter(
            (b) => b.id !== booking.id
          );
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
    <div className="p-6 pt-0">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl text-red-600  font-bold mb-1">
            <TranslatedText
              greetings={bookingHistoryTranslations.bookingHistory}
            />
          </h1>
          <p className=" text-red-600 text-sm">
            <TranslatedText
              greetings={bookingHistoryTranslations.allBookingHistoryInOnePlace}
            />
          </p>
        </div>
        <Button
          className="bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          onClick={() => {
            // Export functionality
            const headers = [
              "Booking ID",
              "Owner",
              "Booking Type",
              "Start Date",
              "Duration",
              "Total Price",
              "status",
            ];

            const csvData = bookings.map((booking) => [
              booking.id,
              booking.store
                ? `${booking.store.owner.user.first_name} ${
                    booking.store.owner.user.middle_name ?? ""
                  } ${booking.store.owner.user.last_name}`
                : "N/A",
              booking.bookingType || "N/A",
              new Date(booking.start_date).toLocaleDateString(),
              booking.booking_hours
                ? filterBookingHours(booking.booking_hours)
                : booking.end_date
                ? new Date(booking.end_date).toLocaleDateString()
                : "N/A",
              `$${booking.total_cost.toFixed(2)}`,
              booking.bookingStatus,
            ]);

            const csvContent = [
              headers.join(","),
              ...csvData.map((row) => row.join(",")),
            ].join("\n");

            const blob = new Blob([csvContent], {
              type: "text/csv;charset=utf-8;",
            });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", "booking_history.csv");
            link.style.visibility = "hidden";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }}
        >
          <Download className=" size-4" />
          Export
        </Button>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex justify-between items-center mb-6">
        <div className="relative flex items-center max-w-2xl w-full">
          <Select value={searchCategory} onValueChange={setSearchCategory}>
            <SelectTrigger className="w-[160px] rounded-r-none bg-red-600 text-white">
              <Filter className="size-4" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="bg-red-600 text-white">
              <SelectItem value="owner_name">Owner name</SelectItem>
              <SelectItem value="booking_type">Booking type</SelectItem>
              <SelectItem value="start_date">Start date</SelectItem>
              <SelectItem value="duration">Duration</SelectItem>
              <SelectItem value="price">Price</SelectItem>
            </SelectContent>
          </Select>
          {renderInput()}
          {searchTerm && (
            <Button
              variant="ghost"
              onClick={handleClear}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <Select onValueChange={(e) => setActiveFilter(e)} defaultValue="all">
          <SelectTrigger className="w-[180px] text-red-600">
            <SelectValue
              placeholder={
                <TranslatedText
                  greetings={bookingHistoryTranslations.filterBy}
                />
              }
            />
          </SelectTrigger>
          <SelectContent>
            {bookingFilters.map((filer, index) => {
              return (
                <SelectItem
                  key={index}
                  value={filer.value}
                  className="text-red-600"
                >
                  {filer.placeholder}{" "}
                  {pagination[filer.value as keyof PaginationResponse]}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Bookings Table */}
      <Card className="overflow-x-auto">
        <Table className="w-full min-w-[800px] bg-gradient-to-r from-[#8c0000] to-[#4d0000] text-white">
          <TableHeader>
            <TableRow className="border-b">
              <TableHead className="text-left p-4 font-medium text-white">
                <TranslatedText
                  greetings={bookingHistoryTranslations.bookingNo}
                />{" "}
                <span className="w-6 h-6 rounded-full inline-flex items-center justify-center hover:bg-gray-200">
                  <ArrowUpDown size={14} className="inline" />
                </span>
              </TableHead>
              <TableHead className="text-left p-4 font-medium text-white">
                <TranslatedText
                  greetings={bookingHistoryTranslations.ownerName}
                />{" "}
                <span className="w-6 h-6 rounded-full inline-flex items-center justify-center hover:bg-gray-200">
                  <ArrowUpDown size={14} className="inline" />
                </span>
              </TableHead>
              <TableHead className="text-left p-4 font-medium text-white">
                <TranslatedText
                  greetings={bookingHistoryTranslations.bookingType}
                />{" "}
                <span className="w-6 h-6 rounded-full inline-flex items-center justify-center hover:bg-gray-200">
                  <ArrowUpDown size={14} className="inline" />
                </span>
              </TableHead>
              <TableHead className="text-left p-4 font-medium text-white">
                <TranslatedText
                  greetings={bookingHistoryTranslations.startDate}
                />{" "}
                <span className="w-6 h-6 rounded-full inline-flex items-center justify-center hover:bg-gray-200">
                  <ArrowUpDown size={14} className="inline" />
                </span>
              </TableHead>
              <TableHead className="text-left p-4 font-medium text-white">
                <TranslatedText
                  greetings={bookingHistoryTranslations.duration}
                />{" "}
                <span className="w-6 h-6 rounded-full inline-flex items-center justify-center hover:bg-gray-200">
                  <ArrowUpDown size={14} className="inline" />
                </span>
              </TableHead>
              <TableHead className="text-left p-4 font-medium text-white">
                <TranslatedText
                  greetings={bookingHistoryTranslations.totalPrice}
                />{" "}
                <span className="w-6 h-6 rounded-full inline-flex items-center justify-center hover:bg-gray-200">
                  <ArrowUpDown size={14} className="inline" />
                </span>
              </TableHead>
              <TableHead className="text-left p-4 font-medium text-white">
                <TranslatedText greetings={bookingHistoryTranslations.status} />{" "}
                <span className="w-6 h-6 rounded-full inline-flex items-center justify-center hover:bg-gray-200">
                  <ArrowUpDown size={14} className="inline" />
                </span>
              </TableHead>
              {activeFilter === "unconfirmed" && (
                <TableHead className="text-left p-4 font-medium text-white">
                  <TranslatedText
                    greetings={bookingHistoryTranslations.action}
                  />{" "}
                  <span className="w-6 h-6 rounded-full inline-flex items-center justify-center hover:bg-gray-200">
                    <ArrowUpDown size={14} className="inline" />
                  </span>
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {fetching ? (
              <PaymentTableLoader bookings={bookings} />
            ) : bookings.length === 0 ? (
              <p>No bookings available</p>
            ) : (
              bookings.map((booking, index) => (
                <TableRow key={index} className="border-b">
                  <TableCell className="p-4 text-sm tewhite">
                    {booking.id}
                  </TableCell>
                  <TableCell className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">
                        {booking.store
                          ? `${booking.store.owner.user.first_name} ${
                              booking.store.owner.user.middle_name ?? ""
                            } ${booking.store.owner.user.last_name}`
                          : "N/A"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="p-4 text-sm text-white">
                    {booking.bookingType || "N/A"}
                  </TableCell>
                  <TableCell className="p-4 text-sm">
                    {new Date(booking.start_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="p-4 text-sm text-white">
                    {booking.booking_hours
                      ? filterBookingHours(booking.booking_hours)
                      : booking.end_date
                      ? new Date(booking.end_date).toLocaleDateString()
                      : "N/A"}
                  </TableCell>
                  <TableCell className="p-4 text-sm">
                    ${booking.total_cost.toFixed(2)}
                  </TableCell>
                  <TableCell className="p-4 text-sm font-medium">
                    <div className="bg-green-700 text-white px-3 py-1 rounded-full inline-flex items-center justify-center">
                      {booking.bookingStatus}
                    </div>
                  </TableCell>

                  {!booking.confirm && (
                    <TableCell className="p-4 text-sm">
                      <BookingConfirmation
                        newBooking={booking}
                        updateBookingStatus={updateBookingStatus}
                      />
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {pagination.totalPages > 1 && !fetching && (
          <Pagination
            totalPages={pagination.totalPages}
            currentPage={pagination.page}
            onPageChange={handlePageChange}
          />
        )}
      </Card>
    </div>
  );
};

export default NewBookingHistory;

function PaymentTableLoader({ bookings }: { bookings: Booking[] }) {
  return (
    <>
      {Array.from({ length: Math.max(5, bookings.length || 5) }).map(
        (_, index) => (
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
        )
      )}
    </>
  );
}
