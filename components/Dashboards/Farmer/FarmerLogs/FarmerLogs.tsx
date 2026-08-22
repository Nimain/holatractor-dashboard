"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  ChevronDown,
  Search,
  ArrowUpDown,
  Check,
  X,
  Download,
  Filter,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Logs } from "@/utils/Types/types";
import { useCookie } from "next-cookie";
import { renderInstance } from "@/utils/Axios/RenderInstance";
import { errorMessage } from "@/utils/Toastify/Messages";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { logTranslations } from "../FarmerTranslation";
import TranslatedText from "@/components/Menubar/TranslatedText";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { bookingHistoryTranslations } from "../Booking/BookingHistoryTranslations";
import { TableFooter } from "@mui/material";

interface user {
  userId: string;
  image: string;
  name: string;
  email: string;
}

const FarmerLogs = () => {
  const [payments, setPayments] = useState<Logs[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [fetching, setFetching] = useState(false);

  const { cookie } = useCookie();
  const rawUser = cookie.get("user");
  const parsedUser: any = typeof rawUser === "string" ? (() => { try { return JSON.parse(rawUser) } catch { return null } })() : rawUser;
  const user: user = parsedUser || {};
  const userId = parsedUser?.userId || parsedUser?.id || parsedUser?.sub || parsedUser?._id;

  // Search handler
  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const term = event.target.value.toLowerCase();
    setSearchTerm(term);

    const filteredPayments = payments.filter(
      (payment) =>
        (payment?.id || "").toLowerCase().includes(term) ||
        (payment?.email || "").toLowerCase().includes(term) ||
        (payment?.action || "").toLowerCase().includes(term) ||
        (payment?.details || "").toLowerCase().includes(term)
    );

    setPayments(filteredPayments);
  };

  const truncateDetails = (details: string) => {
    if (!details) return "";
    return details.slice(0, 15) + (details.length > 15 ? "..." : "");
  };

  const formatDate = (date: string | Date): string => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };

    const dateObj = typeof date === "string" ? new Date(date) : date;

    return isNaN(dateObj.getTime()) ? "N/A" : dateObj.toLocaleDateString(undefined, options);
  };

  function fetchPayments() {
    if (!userId) return;
    setFetching(true);
    renderInstance
      .get(`/farmer/logPage/${userId}`)
      .then((res) => {
        setPayments(Array.isArray(res.data) ? res.data : []);
      })
      .catch((err) => {
        errorMessage("Error fetching logs");
      })
      .finally(() => {
        setFetching(false);
      });
  }

  useEffect(() => {
    if (userId) {
      fetchPayments();
    }
  }, [userId]);

  return (
    <div className="p-6 pt-0">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl text-red-600 font-bold mb-1">
            <TranslatedText greetings={logTranslations.logsLoading} />
          </h1>
        </div>
        <Button
          onClick={() => {
            // Export functionality
            const headers = ["Id", "Action", "Details", "Email", "Time"];

            const csvData = payments.map((payment) => [
              payment.id,
              payment.action,
              payment.details,
              payment.email,
              new Date(payment.createdAt).toLocaleDateString(),
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
            link.setAttribute("download", "log_history.csv");
            link.style.visibility = "hidden";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }}
          className="bg-orange-600 text-white hover:bg-orange-700 hover:text-white"
        >
          <Download className="size-4 mr-1" />
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
            className="pl-10 placeholder:text-red-600"
          />
        </div>
        <Button variant="outline" className="ml-4 text-red-600">
          <Filter className="size-4" />
          <TranslatedText
            greetings={bookingHistoryTranslations.filterBy}
          />{" "}
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </div>

      {/* Payments Table */}
      <Card className="overflow-x-auto">
        <Table className=" bg-gradient-to-r from-[#8c0000] to-[#4d0000] text-white">
          {/* <TableCaption className="bg-gradient-to-r from-[#8c0000] to-[#4d0000] text-white">
            <TranslatedText greetings={logTranslations.recentActivitiesList} />
          </TableCaption> */}
          <TableHeader>
            <TableRow>
              <TableHead className="font-bold text-white">
                <TranslatedText greetings={logTranslations.slNo} />
              </TableHead>
              <TableHead className="font-bold text-white">
                <TranslatedText greetings={logTranslations.action} />
              </TableHead>
              <TableHead className="font-bold text-white">
                <TranslatedText greetings={logTranslations.details} />
              </TableHead>
              <TableHead className="font-bold text-white">
                <TranslatedText greetings={logTranslations.time} />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fetching ? (
              <LogTableShrimmer />
            ) : payments.length === 0 ? (
              <p className="">
                <TranslatedText greetings={logTranslations.noLogsPresent} />
              </p>
            ) : (
              payments
                .filter((log) => log.userId === user.userId)
                .reverse()
                .map((log, index) => (
                  <TooltipProvider key={index}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <TableRow>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{log.action}</TableCell>
                          <TableCell>{truncateDetails(log.details)}</TableCell>
                          <TableCell>
                            {new Date(log.createdAt).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{log.details}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))
            )}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={4} className="text-center text-white">
                <TranslatedText
                  greetings={logTranslations.recentActivitiesList}
                />
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </Card>
    </div>
  );
};

export default FarmerLogs;

function LogTableShrimmer() {
  return Array.from({ length: 5 }).map((_, index) => (
    <tr key={index} className="animate-pulse border-b ">
      <td className="p-4 ">
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
    </tr>
  ));
}
