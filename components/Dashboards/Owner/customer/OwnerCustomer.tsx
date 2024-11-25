"use client"

import { useState, useEffect } from 'react';
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
    Share, LayoutGrid,
    Building2,
    Users,
    DollarSign
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import Image from 'next/image';


interface Customer {
    id: string;
    name: string;
    email: string;
    company: {
        name: string;
        logo: string;
        website: string;
    };
    status: 'Accepted' | 'Pending' | 'Canceled';
    estimateValue: number;
    lastActive: string;
    phone: string;
}

const OwnerCustomer = () => {
    const [activeTab, setActiveTab] = useState('all');
    const [currentTime, setCurrentTime] = useState<string>("");
    const [currentDate, setCurrentDate] = useState<string>("");

    const tabs = [
        { id: 'all', label: 'All', icon: LayoutGrid },
        { id: 'company', label: 'Company', icon: Building2 },
        { id: 'contact', label: 'Contact', icon: Users },
        { id: 'estimate', label: 'Estimate Value', icon: DollarSign },
    ];

    const customers: Customer[] = [
        {
            id: '1',
            name: 'Olivia Anderson',
            email: 'olivanderson21@gmail.com',
            company: {
                name: 'Tech Wise',
                logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRH87TKQrWcl19xly2VNs0CjBzy8eaKNM-ZpA&s',
                website: 'techwise.com'
            },
            status: 'Accepted',
            estimateValue: 2345.00,
            lastActive: 'Today at 14:50PM',
            phone: '+62 85292410764 (Indonesia)'
        },
        {
            id: '2',
            name: 'Benjamin Ramirez',
            email: 'b.ramirez@gmail.com',
            company: {
                name: 'Green Eco',
                logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRH87TKQrWcl19xly2VNs0CjBzy8eaKNM-ZpA&s',
                website: 'greeneco.id'
            },
            status: 'Pending',
            estimateValue: 1239.00,
            lastActive: 'Today at 11:43AM',
            phone: '+62 85292410764 (Indonesia)'
        }
    ];

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
            <div className="flex justify-between items-center gap-4 flex-wrap mb-8">
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/owner">Dashboard</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/owner/customer">Customers</BreadcrumbLink>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                <div className="flex items-center gap-4">
                    
                        <Bell className="w-5 h-5" />
                        <Settings className="w-5 h-5" />
                        <HelpCircle className="w-5 h-5" />
                    
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 900px:grid-cols-2 1300px:grid-cols-4 gap-4 mb-8">
                {/* Total Estimate Card */}
                <div className="grid-cols-1 900px:col-span-2 bg-white rounded-lg border shadow-sm p-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-gray-600 text-sm font-medium">Total Estimate</h3>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 500px:grid-cols-2 768px:grid-cols-3 900px:flex gap-5 mt-4">
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
                                <span className="text-red-500 text-sm">Cancelled</span>
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
                    </div>

                </div>

                {/* Total Customers Card */}
                <div className="col-span-1 bg-white rounded-lg border shadow-sm p-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-gray-600 text-sm font-medium">Active Customers</h3>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="mt-4 flex justify-between mb-0">
                        <div className="text-4xl font-semibold">829</div>
                        <div className="flex items-center gap-1 mt-2">
                            <span className="text-green-500 text-sm">↑ 15%</span>
                        </div>
                    </div>
                </div>

                {/* Total Member Card */}
                <div className="col-span-1 bg-white rounded-lg border shadow-sm p-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-gray-600 text-sm font-medium">Total Customers</h3>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="flex justify-between mt-4 ">
                        <div className="text-4xl font-semibold">324</div>
                        <div className="flex -space-x-2 mt-4">
                            {[1, 2, 3, 4, 5].map((index) => (
                                <Image
                                    key={index}
                                    src='https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRH87TKQrWcl19xly2VNs0CjBzy8eaKNM-ZpA&s'
                                    alt={`Member ${index}`}
                                    className="w-8 h-8 rounded-full border-2 object-cover border-white"
                                    width={400}
                                    height={400}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>


            {/* Filter Bar */}
            <div className="flex items-center justify-between flex-wrap mb-6 bg-white p-3 rounded-lg shadow-sm">
                <div className="flex gap-1.5 flex-wrap">
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
            <div className="flex justify-between flex-wrap gap-4 items-center mb-4">
                <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                    <Input
                        type="text"
                        placeholder="Search"
                        className="pl-10 pr-4 py-2 border rounded-lg w-64 outline-none focus:outline-none"
                    />
                </div>

                <div className="flex items-center flex-wrap gap-4">
                    <Button
                    variant={"outline"} 
                    className="flex items-center gap-2 px-4 py-2 border rounded-lg">
                        <Import className="w-4 h-4" />
                        Import
                    </Button>
                    <Button
                    variant={"outline"} 
                    className="flex items-center gap-2 px-4 py-2 border rounded-lg">
                        <Filter className="w-4 h-4" />
                        Filter
                    </Button>
                    <Button
                    variant={"outline"} 
                    className="px-4 py-2 bg-primaryColor text-white rounded-lg">List</Button>
                    <Button
                    variant={"outline"} 
                    className="p-2 border rounded-lg">
                        <Grid className="w-4 h-4" />
                    </Button>
                    <Button
                    variant={"outline"} 
                    className="flex items-center gap-2 px-4 py-2 border rounded-lg">
                        Short by
                        <ChevronDown className="w-4 h-4" />
                    </Button>
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
                            <TableHead className="text-left p-4 font-bold text-lg">Profile</TableHead>
                            <TableHead className="text-left p-4 font-bold text-lg">Contact</TableHead>
                            <TableHead className="text-left p-4 font-bold text-lg">Company</TableHead>
                            <TableHead className="text-left p-4 font-bold text-lg">Status</TableHead>
                            <TableHead className="text-left p-4 font-bold text-lg">Estimate Value</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {customers.map((customer) => (
                            <TableRow key={customer.id} className="border-t">
                                <TableCell className="p-4">
                                    <Input type="checkbox" className="rounded w-4 h-4 accent-primaryColor" />
                                </TableCell>
                                <TableCell className="p-4">
                                    <div className="flex items-center gap-3">
                                        <Image
                                            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRH87TKQrWcl19xly2VNs0CjBzy8eaKNM-ZpA&s"
                                            alt={customer.name}
                                            className="w-10 h-10 rounded-full object-cover"
                                            width={400}
                                            height={400}
                                        />
                                        <div>
                                            <p className="font-medium">{customer.name}</p>
                                            <p className="text-sm text-gray-500">{customer.lastActive}</p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="p-4">
                                    <p className="text-sm">{customer.email}</p>
                                    <p className="text-sm text-gray-500">{customer.phone}</p>
                                </TableCell>
                                <TableCell className="p-4">
                                    <div className="flex items-center gap-3">
                                        <Image
                                            src={customer.company.logo}
                                            alt={customer.company.name}
                                            className="w-8 h-8 rounded-full object-cover"
                                            width={400}
                                            height={400}
                                        />
                                        <p className="text-sm">{customer.company.name}</p>
                                    </div>
                                </TableCell>
                                <TableCell className="p-4">
                                    <span className={`px-3 py-1 rounded-full text-sm
                    ${customer.status === 'Accepted' ? 'bg-green-100 text-green-800' : ''}
                    ${customer.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                    ${customer.status === 'Canceled' ? 'bg-red-100 text-red-800' : ''}
                  `}>
                                        {customer.status}
                                    </span>
                                </TableCell>
                                <TableCell className="p-4">
                                    <p className="font-medium">${customer.estimateValue.toFixed(2)}</p>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

export default OwnerCustomer