"use client";

import { useEffect, useState } from "react";
import { ArrowUpDown, Download, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Payment } from "@/utils/Types/types";
import { useCookie } from "next-cookie";
import { NestJsBaseURL, renderInstance } from "@/utils/Axios/RenderInstance";
import { errorMessage } from "@/utils/Toastify/Messages";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PaymentDetailsSheet from "./PaymentDetailsSheet";
import { io, Socket } from "socket.io-client";
import TranslatedText from "@/components/Menubar/TranslatedText";
import { paymentHistoryTranslations } from "./PaymentHistoryTranslations";
import Pagination from "@/utils/Paginations/Pagination";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";

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
  unpaid: number;
  review: number;
  completed: number;
  rejected: number;
  totalPages: number;
}

const PaymentHistory = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [fetching, setFetching] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");

  const [pagination, setPagination] = useState<PaginationResponse>({
    itemsPerPage: 10,
    page: 1,
    all: 0,
    unpaid: 0,
    review: 0,
    completed: 0,
    rejected: 0,
    totalPages: 0,
  });
  const [searchCategory, setSearchCategory] = useState("status");
  const [date, setDate] = useState<Date>();

  const { cookie } = useCookie();
  const user: user = cookie.get("user");

  function fetchPayments() {
    setFetching(true);
    renderInstance
      .get(
        `/farmer/paymentPage/${user.userId}?filter=${activeFilter}&page=${pagination.page}&category=${searchCategory}&search=${searchTerm}`
      )
      .then((res) => {
        setPayments(res.data.payments);
        setPagination(res.data.pagination);
      })
      .catch((err) => {
        errorMessage("Error fetching payments");
      })
      .finally(() => {
        setFetching(false);
      });
  }

  const handlePageChange = (page: number) => {
    setPagination((prevPagination) => ({ ...prevPagination, page }));
  };

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
  ];

  const renderInput = () => {
    switch (searchCategory) {
      case "status":
        return (
          <Select value={searchTerm} onValueChange={setSearchTerm}>
            <SelectTrigger className="w-full rounded-l-none text-red-600">
              <SelectValue
                placeholder={
                  <span className="text-red-600">Select payment status</span>
                }
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="FarmerPENDING"  className="text-red-600">Pending</SelectItem>
              <SelectItem value="FarmerCONFIRMED"  className="text-red-600">Owner review</SelectItem>
              <SelectItem value="OwnerREJECTED"  className="text-red-600">Owner rejected</SelectItem>
              <SelectItem value="COMPLETED"  className="text-red-600">Paid</SelectItem>
            </SelectContent>
          </Select>
        );

      case "date":
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={`w-full justify-start text-left font-normal rounded-l-none ${
                  !date && "text-red-600"
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

      case "payment_method":
        return (
          <Select value={searchTerm} onValueChange={setSearchTerm}>
            <SelectTrigger className="w-full rounded-l-none text-red-600">
              <SelectValue
                placeholder={
                  <span className="text-red-600">Select payment type</span>
                }
              />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="PayPal" className="text-red-600">
                Paypal
              </SelectItem>
              <SelectItem value="Bank" className="text-red-600">
                Bank Account
              </SelectItem>
              <SelectItem value="UPI" className="text-red-600">
                QR
              </SelectItem>
            </SelectContent>
          </Select>
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
              className="pl-10 rounded-l-none"
            />
          </div>
        );
    }
  };

  const handleClear = () => {
    setSearchTerm("");
    setDate(new Date());
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
    newSocket.on("getUpdatedPayment", (payment: Payment) => {
      setPayments((prevPayments) => {
        const existingPaymentIndex = prevPayments.findIndex(
          (b) => b.id === payment.id
        );

        if (existingPaymentIndex !== -1) {
          // If payment exists, remove the old one and add the new one at the start
          const updatedPayments = prevPayments.filter(
            (b) => b.id !== payment.id
          );
          return [payment, ...updatedPayments];
        } else {
          // If payment doesn't exist, leave the array as it is
          return [payment, ...prevPayments];
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
          <h1 className="text-2xl text-red-600 font-bold mb-1">
            <TranslatedText
              greetings={paymentHistoryTranslations.paymentHistory}
            />
          </h1>
          <p className="text-red-600 text-sm">
            <TranslatedText
              greetings={paymentHistoryTranslations.viewAndManage}
            />
          </p>
        </div>
        <Button
          onClick={() => {
            // Export functionality
            const headers = [
              "Payment ID",
              "Booking ID",
              "Amount",
              "Status",
              "Payment Method",
              "Receiver",
              "Date",
            ];

            const csvData = payments.map((payment) => [
              payment.id,
              payment.booking_id,
              `$${payment.amount.toFixed(2)}`,
              payment.status,
              payment.transactionMethod,
              `${payment.reciever.first_name} ${
                payment.reciever.middle_name ?? ""
              } ${payment.reciever.last_name}`,
              `${payment.status}` === "COMPLETED"
                ? new Date(payment.createdAt).toLocaleDateString()
                : "Payment not settled yed",
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
            link.setAttribute("download", "payment_history.csv");
            link.style.visibility = "hidden";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }}
          className="bg-orange-600 text-white"
        >
          <Download className=" size-4 mr-1" />
          <TranslatedText greetings={paymentHistoryTranslations.export} />
          
        </Button>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex justify-between items-center mb-6">
        <div className="relative flex items-center max-w-2xl w-full">
          <Select value={searchCategory} onValueChange={setSearchCategory}>
            <SelectTrigger className="w-[160px] rounded-r-none bg-red-600 text-white">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="bg-red-600 text-white">
              <SelectItem value="status">Status</SelectItem>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="payment_method">Payment Method</SelectItem>
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
                  greetings={paymentHistoryTranslations.filterBy}
                />
              }
            />
          </SelectTrigger>
          <SelectContent className="text-red-600">
            {bookingFilters.map((filer, index) => {
              return (
                <SelectItem key={index} value={filer.value} className="text-red-600" >
                  {filer.placeholder}{" "}
                  {pagination[filer.value as keyof PaginationResponse]}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Payments Table */}
      <Card className="overflow-x-auto ">
        <Table className="w-full min-w-[800px] bg-gradient-to-r from-[#8c0000] to-[#4d0000]">
          <TableHeader>
            <TableRow className="border-b">
              
              <TableHead className="text-left p-4 font-medium text-white">
                <TranslatedText
                  greetings={paymentHistoryTranslations.paymentId}
                />{" "}
                <span className="w-6 h-6 rounded-full inline-flex items-center justify-center hover:bg-gray-200">
                  <ArrowUpDown size={14} className="inline" />
                </span>
              </TableHead>
              <TableHead className="text-left p-4 font-medium text-white">
                <TranslatedText
                  greetings={paymentHistoryTranslations.bookingId}
                />{" "}
                <span className="w-6 h-6 rounded-full inline-flex items-center justify-center hover:bg-gray-200">
                  <ArrowUpDown size={14} className="inline" />
                </span>
              </TableHead>
              <TableHead className="text-left p-4 font-medium text-white">
                <TranslatedText greetings={paymentHistoryTranslations.amount} />{" "}
                <span className="w-6 h-6 rounded-full inline-flex items-center justify-center hover:bg-gray-200">
                  <ArrowUpDown size={14} className="inline" />
                </span>
              </TableHead>
              <TableHead className="text-left p-4 font-medium text-white">
                <TranslatedText greetings={paymentHistoryTranslations.status} />{" "}
                <span className="w-6 h-6 rounded-full inline-flex items-center justify-center hover:bg-gray-200">
                  <ArrowUpDown size={14} className="inline" />
                </span>
              </TableHead>
              <TableHead className="text-left p-4 font-medium text-white">
                <TranslatedText
                  greetings={paymentHistoryTranslations.paymentMethod}
                />{" "}
                <span className="w-6 h-6 rounded-full inline-flex items-center justify-center hover:bg-gray-200">
                  <ArrowUpDown size={14} className="inline" />
                </span>
              </TableHead>
              <TableHead className="text-left p-4 font-medium text-white">
                <TranslatedText
                  greetings={paymentHistoryTranslations.receiver}
                />{" "}
                <span className="w-6 h-6 rounded-full inline-flex items-center justify-center hover:bg-gray-200">
                  <ArrowUpDown size={14} className="inline" />
                </span>
              </TableHead>
              <TableHead className="text-left p-4 font-medium text-white">
                <TranslatedText greetings={paymentHistoryTranslations.date} />{" "}
                <span className="w-6 h-6 rounded-full inline-flex items-center justify-center hover:bg-gray-200">
                  <ArrowUpDown size={14} className="inline" />
                </span>
              </TableHead>
              {activeFilter === "unpaid" && (
                <TableHead className="text-left p-4 font-medium text-white">
                  <TranslatedText
                    greetings={paymentHistoryTranslations.action}
                  />{" "}
                  <span className="w-6 h-6 rounded-full inline-flex items-center justify-center hover:bg-gray-200">
                    <ArrowUpDown size={14} className="inline" />
                  </span>
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody className="text-white " >
            {fetching ? (
              <PaymentTableShrimmer />
            ) : payments.length === 0 ? (
              <p >
                <TranslatedText greetings={paymentHistoryTranslations.noData} />
              </p>
            ) : (
              payments.map((payment) => (
                <PaymentDetailsSheet
                  payment={payment}
                  key={payment.id}
                  paymentRefresh={fetchPayments}
                />
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

export default PaymentHistory;

function PaymentTableShrimmer() {
  return Array.from({ length: 5 }).map((_, index) => (
    <tr key={index} className="animate-pulse border-b">
      <td className="p-4">
        <div className="h-4 w-4 bg-gray-300 rounded"></div>
      </td>
      <td className="p-4">
        <div className="h-4 w-32 bg-gray-300 rounded"></div>
      </td>
      <td className="p-4">
        <div className="h-4 w-32 bg-gray-300 rounded"></div>
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
        <div className="h-4 w-32 bg-gray-300 rounded"></div>
      </td>
      <td className="p-4">
        <div className="h-4 w-36 bg-gray-300 rounded"></div>
      </td>
      <td className="p-4">
        <div className="h-4 w-36 bg-gray-300 rounded"></div>
      </td>
    </tr>
  ));
}
