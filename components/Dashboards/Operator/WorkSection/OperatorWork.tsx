"use client";

import { format, addDays, subDays } from 'date-fns';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import React, { useState } from 'react';
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
const AttendanceDashboard = () => {
    const getStatusBadge = (status: "active" | "pending" | "inactive") => {
        let badgeClasses = "";

        if (status === "active") {
            badgeClasses = "bg-green-100 text-green-800";
        } else if (status === "pending") {
            badgeClasses = "bg-yellow-100 text-yellow-800";
        } else if (status === "inactive") {
            badgeClasses = "bg-red-100 text-red-800";
        }

        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${badgeClasses}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    const summaryData = {
        present: [
            { label: 'On time', value: 265, change: 12 },
            { label: 'Late clock-in', value: 62, change: -6 },
            { label: 'Early clock-in', value: 224, change: -6 }
        ],
        notPresent: [
            { label: 'Absent', value: 42, change: 12 },
            { label: 'No clock-in', value: 36, change: -6 },
            { label: 'No clock-out', value: 0, change: 0 },
            { label: 'Invalid', value: 0, change: 0 }
        ],
        away: [
            { label: 'Day off', value: 0, change: -2 },
            { label: 'Time off', value: 0, change: -6 }
        ]
    };

    const data = [
        {
            id: "ST001",
            serialNo: 1,
            storeName: "Downtown Market",
            jobCount: 15,
            accepted: 12,
            rejected: 3,
            amount: 2500.00,
            status: "active"
        },
        {
            id: "ST002",
            serialNo: 2,
            storeName: "City Grocers",
            jobCount: 8,
            accepted: 6,
            rejected: 2,
            amount: 1800.50,
            status: "pending"
        },
        {
            id: "ST003",
            serialNo: 3,
            storeName: "Fresh Foods",
            jobCount: 20,
            accepted: 18,
            rejected: 2,
            amount: 3200.75,
            status: "inactive"
        }
    ];

    // Add more employee data as needed
    const [dateRange, setDateRange] = useState({
        from: undefined,
        to: undefined
    });
    const [isPickerOpen, setIsPickerOpen] = useState(false);

    // Handler for selecting date range
    const handleDateRangeSelect = (range) => {
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
    const [currentDate, setCurrentDate] = useState(new Date());

    // Handler to go to the previous day
    const handlePreviousDay = () => {
        setCurrentDate(prevDate => subDays(prevDate, 1));
    };

    // Handler to go to the next day
    const handleNextDay = () => {
        setCurrentDate(prevDate => addDays(prevDate, 1));
    };

    // Format the date for display
    const formattedDate = format(currentDate, 'EEEE, dd MMMM');
    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                        <h1 className="text-2xl font-semibold text-gray-900">Attendance</h1>
                        <div className="flex items-center bg-white rounded-lg shadow-sm border">
                            <button
                                onClick={handlePreviousDay}
                                className="p-2 hover:bg-gray-100 rounded-l-lg transition-colors"
                            >
                                <ChevronLeft className="h-4 w-4 text-gray-500" />
                            </button>
                            <span className="px-3 text-sm">{formattedDate}</span>
                            <button
                                onClick={handleNextDay}
                                className="p-2 hover:bg-gray-100 rounded-r-lg transition-colors"
                            >
                                <ChevronRight className="h-4 w-4 text-gray-500" />
                            </button>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button className="px-4 py-2 bg-white border rounded-lg shadow-sm flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Attendance Report
                        </button>
                        <StoreRequest />
                        <button className="px-4 py-2 bg-teal-600 text-white rounded-lg flex items-center gap-2">
                            <UserPlus className="h-4 w-4" />
                            Add Attendance
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    {/* Present Summary Card */}
                    <div className="bg-white rounded-lg shadow-sm p-4">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-2">
                                <div className="bg-blue-100 p-1 rounded">
                                    <Warehouse className="h-4 w-4 text-blue-600" />
                                </div>
                                <span className="font-medium text-sm">Store</span>
                            </div>
                            <button className="text-gray-400">
                                <MoreVertical className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            {summaryData.present.map((item) => (
                                <div key={item.label} className="text-center">
                                    <div className="text-2xl font-semibold mb-1">{item.value}</div>
                                    <div className="text-xs text-gray-500 mb-1">{item.label}</div>
                                    <div className={`text-xs ${item.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                        {item.change > 0 ? '+' : ''}{item.change} vs yesterday
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Not Present Summary Card */}
                    <div className="bg-white rounded-lg shadow-sm p-4">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-2">
                                <div className="bg-blue-100 p-1 rounded">
                                    <BriefcaseBusiness className="h-4 w-4 text-blue-600" />
                                </div>
                                <span className="font-medium text-sm">Work</span>
                            </div>
                            <button className="text-gray-400">
                                <MoreVertical className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="grid grid-cols-4 gap-4">
                            {summaryData.notPresent.map((item) => (
                                <div key={item.label} className="text-center">
                                    <div className="text-2xl font-semibold mb-1">{item.value}</div>
                                    <div className="text-xs text-gray-500 mb-1">{item.label}</div>
                                    <div className={`text-xs ${item.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                        {item.change === 0 ? '' : (item.change > 0 ? '+' : '')}{item.change} vs yesterday
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Away Summary Card */}
                    <div className="bg-white rounded-lg shadow-sm p-4">
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
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="flex flex-wrap gap-4 mb-6">
                    <div className="flex-1 min-w-[200px]">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <input
                                type="text"
                                placeholder="Search employee"
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
                                            Clear
                                        </button>
                                        <button
                                            onClick={() => setIsPickerOpen(false)}
                                            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                                        >
                                            Apply
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <button className="px-4 py-2 bg-white border rounded-lg flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        Advance Filter
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
                                            <span>Srl No</span>
                                            <ArrowUpDown className="h-4 w-4 text-gray-500" />
                                        </div>
                                    </TableHead>
                                    <TableHead className="font-semibold text-center">
                                        <div className="flex justify-center items-center space-x-2">
                                            <span>ID</span>
                                            <ArrowUpDown className="h-4 w-4 text-gray-500" />
                                        </div>
                                    </TableHead>
                                    <TableHead className="font-semibold text-center">
                                        <div className="flex justify-center items-center space-x-2">
                                            <span>Store Name</span>
                                            <ArrowUpDown className="h-4 w-4 text-gray-500" />
                                        </div>
                                    </TableHead>
                                    <TableHead className="font-semibold text-center">
                                        <div className="flex justify-center items-center space-x-2">
                                            <span>No of Jobs</span>
                                            <ArrowUpDown className="h-4 w-4 text-gray-500" />
                                        </div>
                                    </TableHead>
                                    <TableHead className="font-semibold text-center">
                                        <div className="flex justify-center items-center space-x-2">
                                            <span>Accepted</span>
                                            <ArrowUpDown className="h-4 w-4 text-gray-500" />
                                        </div>
                                    </TableHead>
                                    <TableHead className="font-semibold text-center">
                                        <div className="flex justify-center items-center space-x-2">
                                            <span>Rejected</span>
                                            <ArrowUpDown className="h-4 w-4 text-gray-500" />
                                        </div>
                                    </TableHead>
                                    <TableHead className="font-semibold text-center">
                                        <div className="flex justify-center items-center space-x-2">
                                            <span>Amount</span>
                                            <ArrowUpDown className="h-4 w-4 text-gray-500" />
                                        </div>
                                    </TableHead>
                                    <TableHead className="font-semibold text-center">
                                        <div className="flex justify-center items-center space-x-2">
                                            <span>Status</span>
                                            <ArrowUpDown className="h-4 w-4 text-gray-500" />
                                        </div>
                                    </TableHead>
                                    <TableHead className="w-16 text-center">
                                        <span className="sr-only">Actions</span>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.map((store) => (
                                    <TableRow key={store.id} className="hover:bg-gray-50">
                                        <TableCell className="font-medium text-center">{store.serialNo}</TableCell>
                                        <TableCell className="font-medium text-gray-600 text-center">{store.id}</TableCell>
                                        <TableCell className="text-center">
                                            <div className="font-medium">{store.storeName}</div>
                                        </TableCell>
                                        <TableCell className="font-medium text-center">{store.jobCount}</TableCell>
                                        <TableCell className=" text-green-600 font-medium text-center">{store.accepted}</TableCell>
                                        <TableCell className=" text-red-600 font-medium text-center">{store.rejected}</TableCell>
                                        <TableCell className=" font-medium text-center">
                                            ${store.amount.toFixed(2)}
                                        </TableCell>
                                        <TableCell className="text-center">{getStatusBadge(store.status)}</TableCell>
                                        <TableCell className="text-center">
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>

                    </div>
                    <div className="flex items-center justify-between px-2">
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
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AttendanceDashboard;