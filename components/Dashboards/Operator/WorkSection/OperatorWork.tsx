"use client";

import { format, addDays, subDays } from 'date-fns';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import React, { useEffect, useState } from 'react';
import { Calendar, Clock, Filter, Hand, Search } from 'lucide-react';
import { ChevronLeft, ChevronRight, MoreVertical, FileText, UserPlus, Star, BriefcaseBusiness, Warehouse } from 'lucide-react';
import { ArrowUpDown } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import StoreRequest from './StoreRequest';
import { BookingHours, OperatorInStore } from '@/utils/Types/types';
import { renderInstance } from '@/utils/Axios/RenderInstance';
import { errorMessage } from '@/utils/Toastify/Messages';
import { useCookie } from 'next-cookie';
import TranslatedText, { TranslatedTaskText } from '@/components/Menubar/TranslatedText';
import { operatorWorkPageTranslations } from './WorkPageTranslations';
import { newBookingTranslations } from '../../Farmer/FarmerTranslation';

interface PageDetails {
    operatorId: string,
    operatorName: string,
    pendingOwnerRequests: number,
    pendingOperatorRequests: number,
    totalAcceptedJobs: number,
    totalRejectedJobs: number,
    totalCompletedJobs: number,
    bookings: {
        booking_id: string,
        storeName: string,
        start_date: string,
        duration: string,
        status: string,
        amount: number,
        bookingHours: string
    }[]
}

interface user {
    userId: string;
    image: string;
    name: string;
    email: string;
    email_varified: boolean;
}

const AttendanceDashboard = () => {
    const [PageDetails, setPageDetails] = useState<PageDetails>()
    const [isLoading, setIsLoading] = useState(false);

    const { cookie } = useCookie()
    const user: user = cookie.get("user")
    const access_token = cookie.get("access_token")

    // Add more employee data as needed
    const [dateRange, setDateRange] = useState({
        from: undefined,
        to: undefined
    });
    const [isPickerOpen, setIsPickerOpen] = useState(false);

    // Handler for selecting date range
    const handleDateRangeSelect = (range: any) => {
        setDateRange(range);
        setIsPickerOpen(false);
    };

    // Format date range for display
    const formatDateRange = () => {
        if (!dateRange.from) return 'Date Range';

        if (!dateRange.to) {
            return format(dateRange.from, 'PPP');
        }

        return `${format(dateRange.from, 'PPP')} - ${format(dateRange.to, 'PPP')}`;
    };

    function fetchPageDetails() {
        setIsLoading(true)
        renderInstance.get(`/operator/getOperatorWorkPageDetails/${user.userId}`, {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        })
            .then((res) => {
                setPageDetails(res.data)
            }).catch((err) => {
                if (err.response && err.response.status === 404 && err.response.data.message === "User not found") {
                    errorMessage("User not found")
                } else {
                    errorMessage("Some error occurred while fetching requests")
                }
            }).finally(() => {
                setIsLoading(false)
            })
    }

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

    useEffect(() => {
        if (user) {
            fetchPageDetails()
        }
    }, [])

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold text-gray-900"><TranslatedText greetings={operatorWorkPageTranslations.work} /></h1>
                    <StoreRequest />
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Present Summary Card */}
                    <div className="bg-white rounded-lg shadow-sm p-4">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-2">
                                <div className="bg-blue-100 p-1 rounded">
                                    <Warehouse className="h-4 w-4 text-blue-600" />
                                </div>
                                <span className="font-medium text-sm"><TranslatedText greetings={operatorWorkPageTranslations.store} /></span>
                            </div>
                            <button className="text-gray-400">
                                <MoreVertical className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-semibold mb-1">{PageDetails ? PageDetails.bookings.length : 0}</div>
                                <div className="text-xs text-gray-500 mb-1"><TranslatedText greetings={operatorWorkPageTranslations.totalStores} /></div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-semibold mb-1">{PageDetails ? PageDetails.pendingOperatorRequests : 0}</div>
                                <div className="text-xs text-gray-500 mb-1"><TranslatedText greetings={operatorWorkPageTranslations.requestReviewPending} /></div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-semibold mb-1">{PageDetails ? PageDetails.pendingOwnerRequests : 0}</div>
                                <div className="text-xs text-gray-500 mb-1"><TranslatedText greetings={operatorWorkPageTranslations.ownerReviewPending} /></div>
                            </div>
                        </div>
                    </div>

                    {/* Not Present Summary Card */}
                    <div className="bg-white rounded-lg shadow-sm p-4">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-2">
                                <div className="bg-blue-100 p-1 rounded">
                                    <BriefcaseBusiness className="h-4 w-4 text-blue-600" />
                                </div>
                                <span className="font-medium text-sm"><TranslatedText greetings={operatorWorkPageTranslations.work} /></span>
                            </div>
                            <button className="text-gray-400">
                                <MoreVertical className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="grid grid-cols-4 gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-semibold mb-1">{PageDetails ? PageDetails.totalAcceptedJobs : 0}</div>
                                <div className="text-xs text-gray-500 mb-1"><TranslatedText greetings={operatorWorkPageTranslations.jobsAccepted} /></div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-semibold mb-1">{PageDetails ? PageDetails.totalRejectedJobs : 0}</div>
                                <div className="text-xs text-gray-500 mb-1"><TranslatedText greetings={operatorWorkPageTranslations.jobsRejected} /></div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-semibold mb-1">{PageDetails ? PageDetails.totalCompletedJobs : 0}</div>
                                <div className="text-xs text-gray-500 mb-1"><TranslatedText greetings={operatorWorkPageTranslations.jobsCompleted} /></div>
                            </div>
                        </div>
                    </div>

                    {/* Away Summary Card */}
                    {/* <div className="bg-white rounded-lg shadow-sm p-4">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-2">
                                <div className="bg-blue-100 p-1 rounded">
                                    <Star className="h-4 w-4 text-blue-600" />
                                </div>
                                <span className="font-medium text-sm">Rating</span>
                            </div>
                            <button className="text-gray-400">
                                <MoreVertical className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {summaryData.away.map((item) => (
                                <div key={item.label} className="text-center">
                                    <div className="text-2xl font-semibold mb-1">{item.value}</div>
                                    <div className="text-xs text-gray-500 mb-1">{item.label}</div>
                                    <div className={`text-xs ${item.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                        {item.change > 0 ? '+' : ''}{item.change} vs yesterday
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div> */}
                </div>

                {/* Search and Filters */}
                <div className="flex flex-wrap gap-4 mb-6">
                    <div className="flex-1 min-w-[200px]">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <input
                                type="text"
                                className="w-full pl-10 pr-4 py-2 border rounded-lg bg-white"
                            />
                        </div>
                    </div>
                    <div className="relative">
                        <button
                            onClick={() => setIsPickerOpen(!isPickerOpen)}
                            className="px-4 py-2 bg-white border rounded-lg flex items-center gap-2 hover:bg-gray-50 transition-colors"
                        >
                            <Calendar className="h-4 w-4" />
                            {formatDateRange()}
                        </button>

                        {isPickerOpen && (
                            <div className="absolute z-10 mt-2 bg-white border rounded-lg shadow-lg">
                                <DayPicker
                                    mode="range"
                                    selected={dateRange}
                                    onSelect={handleDateRangeSelect}
                                    className="p-4"
                                    modifiersClassNames={{
                                        selected: 'bg-blue-500 text-white hover:bg-blue-600',
                                        today: 'bg-blue-100'
                                    }}
                                />
                                {dateRange.from && (
                                    <div className="p-4 border-t flex justify-between items-center">
                                        <button
                                            onClick={() => setDateRange({ from: undefined, to: undefined })}
                                            className="text-sm text-gray-500 hover:text-gray-700"
                                        >
                                            <TranslatedText greetings={operatorWorkPageTranslations.clear} />
                                        </button>
                                        <button
                                            onClick={() => setIsPickerOpen(false)}
                                            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                                        >
                                            <TranslatedText greetings={operatorWorkPageTranslations.apply} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <button className="px-4 py-2 bg-white border rounded-lg flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        <TranslatedText greetings={operatorWorkPageTranslations.advanceFilter} />
                    </button>
                </div>

                {/* Employee Table */}
                <div className="space-y-4">
                    <div className="rounded-md border bg-white">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50 hover:bg-gray-50">
                                    <TableHead className="font-semibold text-center">
                                        <div className="flex justify-center items-center space-x-2">
                                            <span><TranslatedText greetings={operatorWorkPageTranslations.slNo} /></span>
                                            <ArrowUpDown className="h-4 w-4 text-gray-500" />
                                        </div>
                                    </TableHead>
                                    <TableHead className="font-semibold text-center">
                                        <div className="flex justify-center items-center space-x-2">
                                            <span>Booking ID</span>
                                            <ArrowUpDown className="h-4 w-4 text-gray-500" />
                                        </div>
                                    </TableHead>
                                    <TableHead className="font-semibold text-center">
                                        <div className="flex justify-center items-center space-x-2">
                                            <span><TranslatedText greetings={operatorWorkPageTranslations.storeName} /></span>
                                            <ArrowUpDown className="h-4 w-4 text-gray-500" />
                                        </div>
                                    </TableHead>
                                    <TableHead className="font-semibold text-center">
                                        <div className="flex justify-center items-center space-x-2">
                                            <span><TranslatedText greetings={operatorWorkPageTranslations.jobs} /></span>
                                            <ArrowUpDown className="h-4 w-4 text-gray-500" />
                                        </div>
                                    </TableHead>
                                    <TableHead className="font-semibold text-center">
                                        <div className="flex justify-center items-center space-x-2">
                                            <span><TranslatedText greetings={operatorWorkPageTranslations.accepted} /></span>
                                            <ArrowUpDown className="h-4 w-4 text-gray-500" />
                                        </div>
                                    </TableHead>
                                    <TableHead className="font-semibold text-center">
                                        <div className="flex justify-center items-center space-x-2">
                                            <span><TranslatedText greetings={operatorWorkPageTranslations.rejected} /></span>
                                            <ArrowUpDown className="h-4 w-4 text-gray-500" />
                                        </div>
                                    </TableHead>
                                    <TableHead className="font-semibold text-center">
                                        <div className="flex justify-center items-center space-x-2">
                                            <span><TranslatedText greetings={operatorWorkPageTranslations.amount} /></span>
                                            <ArrowUpDown className="h-4 w-4 text-gray-500" />
                                        </div>
                                    </TableHead>
                                    {/* <TableHead className="font-semibold text-center">
                                        <div className="flex justify-center items-center space-x-2">
                                            <span>Status</span>
                                            <ArrowUpDown className="h-4 w-4 text-gray-500" />
                                        </div>
                                    </TableHead>
                                    <TableHead className="w-16 text-center">
                                        <span className="sr-only">Actions</span>
                                    </TableHead> */}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? <TableRow className="animate-pulse">
                                        {[...Array(7)].map((_, rowIndex) => (
                                            <TableCell
                                                key={`row-${rowIndex}`}
                                            >
                                                {[...Array(8)].map((_, colIndex) => (
                                                    <div
                                                        key={`col-${colIndex}`}
                                                        className="h-4 w-full bg-gray-200 rounded my-2"
                                                    />
                                                ))}
                                            </TableCell>
                                        ))}
                                    </TableRow> : PageDetails && PageDetails.bookings.length === 0 ? <p>No data available</p> : PageDetails && PageDetails.bookings.map((store, i) => (
                                    <TableRow key={i} className="hover:bg-gray-50">
                                        <TableCell className="font-medium text-center">{i + 1}</TableCell>
                                        <TableCell className="font-medium text-gray-600 text-center">{store.booking_id}</TableCell>
                                        <TableCell className="text-center">
                                            <div className="font-medium">{store.storeName}</div>
                                        </TableCell>
                                        <TableCell className="font-medium text-center">{store.start_date}</TableCell>
                                        <TableCell className="font-medium text-center">{store.bookingHours ? filterBookingHours(store.duration) : store.duration}</TableCell>
                                        <TableCell className="font-medium text-center">{store.status}</TableCell>
                                        <TableCell className="font-medium text-center">
                                            ${store.amount}
                                        </TableCell>
                                        {/* <TableCell className="text-center">{getStatusBadge(store.status)}</TableCell>
                                        <TableCell className="text-center">
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </TableCell> */}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>

                    </div>
                    {/* <div className="flex items-center justify-between px-2">
                        <div className="text-sm text-gray-500">
                            Showing <span className="font-medium">1</span> to <span className="font-medium">3</span> of{" "}
                            <span className="font-medium">3</span> results
                        </div>
                        <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm" className="h-8">
                                Previous
                            </Button>
                            <Button variant="outline" size="sm" className="h-8">
                                Next
                            </Button>
                        </div>
                    </div> */}
                </div>
            </div>
        </div>
    );
};

export default AttendanceDashboard;