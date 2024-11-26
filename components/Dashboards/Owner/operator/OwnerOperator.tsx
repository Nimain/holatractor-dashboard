"use client"

import { useEffect, useState } from 'react';
import {
    Search,
    Import,
    Filter,
    Grid,
    ChevronDown,
    Bell,
    Settings,
    HelpCircle,
    Plus,
    LayoutGrid,
    Building2,
    Users,
    DollarSign
} from 'lucide-react';
import { RiArrowUpDownLine } from "react-icons/ri";
import { cn } from "@/lib/utils";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Phone, Mail, MapPin, User } from 'lucide-react'
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Image from 'next/image';
import { OperatorInStore } from '@/utils/Types/types';
import { useCookie } from 'next-cookie';
import { renderInstance } from '@/utils/Axios/RenderInstance';
import { errorMessage } from '@/utils/Toastify/Messages';

interface user {
    userId: string;
    image: string;
    name: string;
    email: string;
}

const OwnerOperator = () => {
    const [activeTab, setActiveTab] = useState('all');
    const [isOpen, setIsOpen] = useState(false)
    const [currentTime, setCurrentTime] = useState<string>("");
    const [currentDate, setCurrentDate] = useState<string>("");

    const [allOperators, setAllOperators] = useState<OperatorInStore[]>([])
    const [activeOperators, setActiveOperators] = useState(0)
    const [fetchingOperatorDetails, setFetchingOperatorDetails] = useState(false)

    const tabs = [
        { id: 'all', label: 'All', icon: LayoutGrid },
        { id: 'company', label: 'Company', icon: Building2 },
        { id: 'contact', label: 'Contact', icon: Users },
        { id: 'estimate', label: 'Estimate Value', icon: DollarSign },
    ];

    const jobInfo = [
        { department: "Creative Associate", division: "Project Management", manager: "Alex Foster", hireDate: "May 13, 2024", location: "Metro DC" },
        { department: "Marketing Team", division: "Leadership", manager: "Jack Danniel", hireDate: "Sep 05, 2024", location: "Bergen, NJ" },
        { department: "Team Lead", division: "Creator", manager: "Alina Skazka", hireDate: "Jun 08, 2023", location: "Miami, FL" },
        { department: "Finance & Accounting", division: "Senior Consultant", manager: "John Miller", hireDate: "Sep 13, 2022", location: "Chicago, IL" },
        { department: "Team Lead", division: "Creator", manager: "Mark Baldwin", hireDate: "Jul 07, 2023", location: "Miami, FL" },
    ];

    const activities = [
        {
            avatar: "/api/placeholder/32/32",
            name: "John Miller",
            action: "last login on",
            date: "Jul 13, 2024",
            time: "05:36 PM"
        },
        {
            avatar: "/api/placeholder/32/32",
            name: "Merva Sahin",
            action: "date created on",
            date: "Sep 08, 2024",
            time: "03:12 PM"
        },
        {
            avatar: "/api/placeholder/32/32",
            name: "Tammy Collier",
            action: "updated on",
            date: "Aug 15, 2023",
            time: "05:36 PM"
        }
    ];

    const compensation = [
        {
            amount: "862.00 USD per month",
            effectiveDate: "May 10, 2015"
        },
        {
            amount: "1560.00 USD per quarter",
            effectiveDate: "Jun 08, 2022"
        },
        {
            amount: "378.00 USD per week",
            effectiveDate: "Jun 08, 2022"
        }
    ];

    const { cookie } = useCookie()
    const user: user = cookie.get("user")

    function fetchOperators() {
        setFetchingOperatorDetails(true)

        renderInstance.get(`/owner/get-operators/${user.userId}`)
            .then((res) => {
                setAllOperators(res.data.operators)
                setActiveOperators(res.data.activeOperators)
            }).catch((err) => {
                errorMessage("Error fetching operator lists")
            }).finally(() => {
                setFetchingOperatorDetails(false)
            })
    }

    useEffect(() => {
        if (user) {
            fetchOperators()
        }
    }, [])

    useEffect(() => {
        const updateDateTime = () => {
            const now = new Date();
            setCurrentTime(now.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' })); // Adjust locale and options as needed
            setCurrentDate(now.toLocaleDateString("en-GB")); // Format: DD/MM/YYYY
        };

        // Update every second
        const intervalId = setInterval(updateDateTime, 1000);
        updateDateTime(); // Initialize immediately

        return () => clearInterval(intervalId); // Cleanup on component unmount
    }, []);

    return (
        <div>
            {/* Header */}
            <div className="flex justify-between items-center mb-8">

                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/owner">Dashboard</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/owner/operator">Operators</BreadcrumbLink>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 900px:grid-cols-2 1300px:grid-cols-4 gap-4 mb-8">
                {/* Total Estimate Card */}
                <div className="grid-cols-1 900px:col-span-2 bg-white rounded-lg border shadow-sm p-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-gray-600 text-sm font-medium">Total Spend</h3>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* <div className="grid grid-cols-1 500px:grid-cols-2 768px:grid-cols-3 900px:flex gap-5 mt-4">
                        <div className="col-span-1 900px:flex-1">
                            <div className="text-3xl font-semibold mb-1">$ 32.1k</div>
                            <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                <span className="text-green-500 text-sm">Accepted</span>
                            </div>
                        </div>

                        <div className="w-px bg-gray-200 mx-4 hidden 900px:inline-block"></div>

                        <div className="col-span-1 900px:flex-1">
                            <div className="text-3xl font-semibold mb-1 text-left 500px:text-right 768px:text-left">$ 16.23k</div>
                            <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-orange-400 ml-0 500px:ml-auto 768px:ml-0"></div>
                                <span className="text-orange-400 text-sm">Pending</span>
                            </div>
                        </div>

                        <div className="w-px bg-gray-200 mx-4 hidden 900px:inline-block"></div>

                        <div className="col-span-1 900px:flex-1">
                            <div className="text-3xl font-semibold mb-1">$ 2.58k</div>
                            <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                <span className="text-red-500 text-sm">Reject</span>
                            </div>
                        </div>

                        <div className="items-center mt-4 col-span-1 768px:col-span-3">
                            <p className="text-gray-500 text-sm justify-center text-right">
                                {currentTime}
                            </p>
                            <p className="text-gray-500 text-sm mt-1 text-right">
                                {currentDate}
                            </p>
                        </div>
                    </div> */}
                </div>

                {/* Total Operators Card */}
                <div className="col-span-1 bg-white rounded-lg border shadow-sm p-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-gray-600 text-sm font-medium">Active Operators</h3> {/* Changed "Customers" to "Operators" */}
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="mt-4 flex justify-between mb-0">
                        <div className="text-4xl font-semibold">{activeOperators}</div>
                        <div className="flex items-center gap-1 mt-2">
                            <span className="text-green-500 text-sm">↑ 15%</span>
                        </div>
                    </div>
                </div>

                {/* Total Member Card */}
                <div className="col-span-1 bg-white rounded-lg border shadow-sm p-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-gray-600 text-sm font-medium">Total Operators</h3>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="flex justify-between mt-4 ">
                        <div className="text-4xl font-semibold">
                            {allOperators.length}
                        </div>
                        <div className="flex -space-x-2 mt-4">
                            {allOperators.map((index, i) => {
                                if (i > 5) return null
                                return (
                                    <Image
                                        key={i}
                                        src={index.operator.user.image ? index.operator.user.image : 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRH87TKQrWcl19xly2VNs0CjBzy8eaKNM-ZpA&s'}
                                        alt={`Member ${index.operator.user.first_name}`}
                                        className="w-8 h-8 rounded-full border-2 border-white"
                                        width={400}
                                        height={400}
                                    />
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center justify-between flex-wrap mb-6 bg-white p-3 rounded-lg shadow-sm">
                <div className="flex flex-wrap gap-1.5">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <Button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 bg-white",
                                    "flex items-center gap-2",
                                    "hover:bg-gray-50 hover:text-gray-900",
                                    "focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-offset-1",
                                    activeTab === tab.id
                                        ? "bg-gray-50 text-gray-900 shadow-sm"
                                        : "text-gray-600"
                                )}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                            </Button>
                        );
                    })}
                    <Button
                        className={cn(
                            "p-2 rounded-lg transition-all duration-200 bg-white",
                            "hover:bg-gray-50 focus:outline-none focus:ring-2",
                            "focus:ring-gray-200 focus:ring-offset-1",
                            "text-gray-600 hover:text-gray-900"
                        )}
                        aria-label="Add new"
                    >
                        <Plus className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Action Bar */}
            <div className="flex justify-between items-start 1000px:items-center flex-col 1000px:flex-row gap-4 mb-4">
                <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                    <Input
                        type="text"
                        placeholder="Search"
                        className="pl-10 pr-4 py-2 border rounded-lg w-64"
                    />
                </div>

                <div className="flex items-center gap-4 flex-wrap">
                    <button className="flex items-center gap-2 px-4 py-2 border rounded-lg">
                        <Import className="w-4 h-4" />
                        Import
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 border rounded-lg">
                        <Filter className="w-4 h-4" />
                        Filter
                    </button>
                    <button className="px-4 py-2 bg-primaryColor text-white rounded-lg">List</button>
                    <button className="p-2 border rounded-lg">
                        <Grid className="w-4 h-4" />
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 border rounded-lg">
                        Short by
                        <ChevronDown className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Customer Table */}
            <div className="border rounded-lg">
                <Table className="w-full">
                    <TableHeader className="bg-gray-50">
                        <TableRow>
                            <TableHead className="w-8 p-4">
                                <Input type="checkbox" className="rounded w-4 h-4 accent-primaryColor" />
                            </TableHead>
                            <TableHead className="text-left font-bold text-lg">
                            <div className="flex items-center gap-2">
                                    Profile
                                    <div className="hover:bg-gray-200 p-1 aspect-square rounded-full">
                                        <RiArrowUpDownLine className="h-4 w-4" />
                                    </div>
                                </div>
                            </TableHead>
                            <TableHead className="text-left font-bold text-lg">
                            <div className="flex items-center gap-2">
                                    Contact
                                    <div className="hover:bg-gray-200 p-1 aspect-square rounded-full">
                                        <RiArrowUpDownLine className="h-4 w-4" />
                                    </div>
                                </div>
                            </TableHead>
                            <TableHead className="text-left font-bold text-lg">
                            <div className="flex items-center gap-2">
                                    Store
                                    <div className="hover:bg-gray-200 p-1 aspect-square rounded-full">
                                        <RiArrowUpDownLine className="h-4 w-4" />
                                    </div>
                                </div>
                            </TableHead>
                            <TableHead className="text-left font-bold text-lg">
                            <div className="flex items-center gap-2">
                                    Per hour
                                    <div className="hover:bg-gray-200 p-1 aspect-square rounded-full">
                                        <RiArrowUpDownLine className="h-4 w-4" />
                                    </div>
                                </div>
                            </TableHead>
                            <TableHead className="text-left font-bold text-lg">
                            <div className="flex items-center gap-2">
                                    Per month
                                    <div className="hover:bg-gray-200 p-1 aspect-square rounded-full">
                                        <RiArrowUpDownLine className="h-4 w-4" />
                                    </div>
                                </div>
                            </TableHead>
                            <TableHead className="text-left font-bold text-lg">
                                <div className="flex items-center gap-2">
                                    Per job
                                    <div className="hover:bg-gray-200 p-1 aspect-square rounded-full">
                                        <RiArrowUpDownLine className="h-4 w-4" />
                                    </div>
                                </div>
                            </TableHead>
                            <TableHead className="text-left font-bold text-lg">
                                <div className="flex items-center gap-2">
                                    Status
                                    <div className="hover:bg-gray-200 p-1 aspect-square rounded-full">
                                        <RiArrowUpDownLine className="h-4 w-4" />
                                    </div>
                                </div>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {fetchingOperatorDetails ? <p>Loading operator lists</p>
                            :
                            allOperators.length === 0 ? <p>No operators available</p>
                                :
                                allOperators.map((customer, i) => (
                                    <Dialog open={isOpen} onOpenChange={setIsOpen} key={i}>
                                        <DialogTrigger asChild>
                                            <TableRow className="border-t">
                                                <TableCell className="p-4">
                                                    <Input
                                                        type="checkbox"
                                                        className="rounded w-4 h-4 accent-primaryColor"
                                                        onClick={e => { e.stopPropagation() }} />
                                                </TableCell>
                                                <TableCell className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <Image
                                                            src={customer.operator.user.image ? customer.operator.user.image : 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRH87TKQrWcl19xly2VNs0CjBzy8eaKNM-ZpA&s'}
                                                            alt={customer.operator.user.first_name}
                                                            className="w-10 h-10 rounded-full"
                                                            width={400}
                                                            height={400}
                                                        />
                                                        <div>
                                                            <p className="font-medium">
                                                                {`${customer.operator.user.first_name} ${customer.operator.user.middle_name ?? ""} ${customer.operator.user.last_name}`}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="p-4">
                                                    <p className="text-sm">{customer.operator.user.email}</p>
                                                </TableCell>
                                                <TableCell className="p-4">
                                                    {/* <span className={`px-3 py-1 rounded-full text-sm
                                ${customer.status === 'Accepted' ? 'bg-green-100 text-green-800' : ''}
                                ${customer.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                                ${customer.status === 'Canceled' ? 'bg-red-100 text-red-800' : ''}
                              `}>
                                                {customer.status}
                                            </span> */}
                                                    <span>
                                                        {customer.store.name}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="p-4">
                                                    <p className="font-medium">${`${customer.cost_per_hour ?? "NA"}`}</p>
                                                </TableCell>
                                                <TableCell className="p-4">
                                                    <p className="font-medium">${`${customer.cost_per_month ?? "NA"}`}</p>
                                                </TableCell>
                                                <TableCell className="p-4">
                                                    <p className="font-medium">${`${customer.cost_per_job ?? "NA"}`}</p>
                                                </TableCell>
                                                <TableCell className="p-4">
                                                    <span className={`px-3 py-1 rounded-full text-sm ${customer.operator.Status === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {customer.operator.Status === 1 ? "Active" : "Inactive"}
                                            </span>
                                                </TableCell>
                                            </TableRow>
                                        </DialogTrigger>
                                        <DialogContent
                                            className="max-w-7xl max-h-[80vh] p-0 overflow-auto"
                                            style={{ scrollbarWidth: "none" }}>
                                            {/* Tabs - Fixed */}
                                            <div className="flex h-12 border-b">
                                                <Tabs defaultValue="overview" className="flex-1">
                                                    <TabsList className="h-full bg-transparent gap-4">
                                                        <TabsTrigger value="overview" className="data-[state=active]:border-b-2 data-[state=active]:border-red-500 rounded-none">
                                                            Overview
                                                        </TabsTrigger>

                                                        <TabsTrigger value="performance" className="data-[state=active]:border-b-2 data-[state=active]:border-red-500 rounded-none">
                                                            Performance
                                                        </TabsTrigger>
                                                        <TabsTrigger value="files" className="data-[state=active]:border-b-2 data-[state=active]:border-red-500 rounded-none">
                                                            Rating
                                                        </TabsTrigger>

                                                    </TabsList>
                                                </Tabs>
                                            </div>

                                            {/* Content Container - Scrollable */}
                                            <div className="flex h-[calc(100vh-10vh-48px-48px)]">
                                                {/* Left Sidebar - Fixed height with independent scroll */}
                                                <div className="w-72 border-r overflow-y-auto">
                                                    <div className="p-6">
                                                        <div className="flex items-start gap-4 mb-8">
                                                            <Avatar className="h-16 w-16">
                                                                {
                                                                    customer.operator.user.image ?
                                                                        <AvatarImage
                                                                            src={customer.operator.user.image}
                                                                            alt={customer.operator.user.first_name} />
                                                                        :
                                                                        <AvatarFallback>{customer.operator.user.first_name[0]}{customer.operator.user.last_name[0]}</AvatarFallback>
                                                                }
                                                            </Avatar>
                                                            <div>
                                                                <h2 className="text-lg font-semibold">
                                                                    {`${customer.operator.user.first_name} ${customer.operator.user.middle_name ?? ""} ${customer.operator.user.last_name}`}
                                                                </h2>
                                                                <p className="text-sm text-muted-foreground">
                                                                    #{customer.operator_id}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-8">
                                                            <section>
                                                                <h3 className="text-sm font-semibold mb-4">About</h3>
                                                                <div className="space-y-3">
                                                                    {
                                                                        customer.operator.user.country_code && customer.operator.user.mobile &&
                                                                        <div className="flex items-center gap-2">
                                                                            <Phone className="h-4 w-4 text-muted-foreground" />
                                                                            <span className="text-sm">(629) 555-0123</span>
                                                                        </div>
                                                                    }
                                                                    <div className="flex items-center gap-2">
                                                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                                                        <span className="text-sm">
                                                                            {customer.operator.user.email}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </section>

                                                            <section>
                                                                <h3 className="text-sm font-semibold mb-4">Employee details</h3>
                                                                <div className="space-y-3">
                                                                    <div className="flex items-center gap-2">
                                                                        <User className="h-4 w-4 text-muted-foreground" />
                                                                        {/* <span className="text-sm">Joined {customer.createdAt.toLocaleDateString()}</span> */}
                                                                    </div>
                                                                </div>
                                                            </section>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Main Content - Fixed height with independent scroll */}
                                                <div className="flex-1 overflow-y-auto">
                                                    <div className="p-6 space-y-6">
                                                        {/* Job Information */}
                                                        <div className="bg-white rounded-lg border">
                                                            <div className="flex justify-between items-center p-4 border-b">
                                                                <h3 className="font-semibold">Job Information</h3>
                                                                <Button variant="outline" size="sm" className="text-red-600">
                                                                    + Add Info
                                                                </Button>
                                                            </div>
                                                            <table className="w-full">
                                                                <thead>
                                                                    <tr className="border-b bg-gray-50">
                                                                        <th className="text-left p-4 text-xs font-medium text-gray-500">DEPARTMENT</th>
                                                                        <th className="text-left p-4 text-xs font-medium text-gray-500">DIVISION</th>
                                                                        <th className="text-left p-4 text-xs font-medium text-gray-500">MANAGER</th>
                                                                        <th className="text-left p-4 text-xs font-medium text-gray-500">HIRE DATE</th>
                                                                        <th className="text-left p-4 text-xs font-medium text-gray-500">LOCATION</th>
                                                                        <th className="w-16"></th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {jobInfo.map((job, index) => (
                                                                        <tr key={index} className="border-b last:border-0">
                                                                            <td className="p-4 text-sm">{job.department}</td>
                                                                            <td className="p-4 text-sm">{job.division}</td>
                                                                            <td className="p-4 text-sm">{job.manager}</td>
                                                                            <td className="p-4 text-sm">{job.hireDate}</td>
                                                                            <td className="p-4 text-sm">{job.location}</td>
                                                                            <td className="p-4">
                                                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                                </Button>
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>

                                                        {/* Activity and Compensation Grid */}
                                                        <div className="grid grid-cols-2 gap-6">
                                                            {/* Activity */}
                                                            <div className="bg-white rounded-lg p-6 border">
                                                                <div className="flex justify-between items-center mb-6">
                                                                    <h3 className="font-semibold">Activity</h3>
                                                                </div>
                                                                <div className="space-y-4">
                                                                    {activities.map((activity, index) => (
                                                                        <div key={index} className="flex items-start gap-3">
                                                                            <Avatar className="w-8 h-8">
                                                                                <AvatarImage src={activity.avatar} alt={activity.name} />
                                                                                <AvatarFallback>{activity.name[0]}</AvatarFallback>
                                                                            </Avatar>
                                                                            <div>
                                                                                <p className="text-sm">
                                                                                    <span className="font-medium">{activity.name}</span>
                                                                                    {' '}{activity.action}{' '}
                                                                                    <span className="font-medium">{activity.date}</span>
                                                                                </p>
                                                                                <p className="text-sm text-gray-500">{activity.time}</p>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                                <Button variant="link" className="mt-4 p-0 h-auto text-red-600">
                                                                    View all
                                                                </Button>
                                                            </div>

                                                            {/* Compensation */}
                                                            <div className="bg-white rounded-lg p-6 border">
                                                                <div className="flex justify-between items-center mb-6">
                                                                    <h3 className="font-semibold">Compensation</h3>
                                                                </div>
                                                                <div className="space-y-4">
                                                                    {compensation.map((comp, index) => (
                                                                        <div key={index} className="text-sm">
                                                                            <p className="font-medium">{comp.amount}</p>
                                                                            <p className="text-gray-500">Effective date on {comp.effectiveDate}</p>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                                <Button variant="link" className="mt-4 p-0 h-auto text-red-600">
                                                                    View all
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                        </DialogContent>
                                    </Dialog>
                                ))}
                    </TableBody>
                </Table>
            </div>

        </div>
    );
}

export default OwnerOperator