"use client"

import { useState } from 'react';
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Phone, Mail, MapPin, User } from 'lucide-react'
interface Operator {
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

const OwnerOperator = () => {
    const [activeTab, setActiveTab] = useState('all');

    const tabs = [
        { id: 'all', label: 'All', icon: LayoutGrid },
        { id: 'company', label: 'Company', icon: Building2 },
        { id: 'contact', label: 'Contact', icon: Users },
        { id: 'estimate', label: 'Estimate Value', icon: DollarSign },
    ];
    const [isOpen, setIsOpen] = useState(false)

    const operators: Operator[] = [
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

    return (
        <div className="p-5">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-2">
                    <span className="text-gray-600">List /</span>
                    <span className="font-medium">Operators</span> {/* Changed "Customers" to "Operators" */}
                </div>


            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-4 mb-8">
                {/* Total Estimate Card */}
                <div className="col-span-2 bg-white rounded-lg border shadow-sm p-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-gray-600 text-sm font-medium">Total Spend</h3>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="flex mt-4">
                        <div className="flex-1">
                            <div className="text-3xl font-semibold mb-1">$ 32.1k</div>
                            <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                <span className="text-green-500 text-sm">Accepted</span>
                            </div>
                        </div>

                        <div className="w-px bg-gray-200 mx-4"></div>

                        <div className="flex-1">
                            <div className="text-3xl font-semibold mb-1">$ 16.23k</div>
                            <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                                <span className="text-orange-400 text-sm">Pending</span>
                            </div>
                        </div>

                        <div className="w-px bg-gray-200 mx-4"></div>

                        <div className="flex-1">
                            <div className="text-3xl font-semibold mb-1">$ 2.58k</div>
                            <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                <span className="text-red-500 text-sm">Reject</span>
                            </div>
                        </div>
                        <div className=" items-center mt-4">
                            <p className="text-gray-500 text-sm justify-center text-right">08.52</p>
                            <p className="text-gray-500 text-sm mt-1">21 September 2023</p>
                        </div>
                    </div>
                </div>

                {/* Total Operators Card */}
                <div className="col-span-1.5 bg-white rounded-lg border shadow-sm p-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-gray-600 text-sm font-medium">Active Operators</h3> {/* Changed "Customers" to "Operators" */}
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
                <div className="col-span-1.5 bg-white rounded-lg border shadow-sm p-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-gray-600 text-sm font-medium">Total Member</h3>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="flex justify-between mt-4 ">
                        <div className="text-4xl font-semibold">324</div>
                        <div className="flex -space-x-2 mt-4">
                            {[1, 2, 3, 4, 5].map((index) => (
                                <img
                                    key={index}
                                    src="/api/placeholder/32/32"
                                    alt={`Member ${index}`}
                                    className="w-8 h-8 rounded-full border-2 border-white"
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center justify-between mb-6 bg-white p-3 rounded-lg shadow-sm">
                <div className="flex gap-1.5">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
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
                            </button>
                        );
                    })}
                    <button
                        className={cn(
                            "p-2 rounded-lg transition-all duration-200",
                            "hover:bg-gray-50 focus:outline-none focus:ring-2",
                            "focus:ring-gray-200 focus:ring-offset-1",
                            "text-gray-600 hover:text-gray-900"
                        )}
                        aria-label="Add new"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>


            </div>

            {/* Action Bar */}
            <div className="flex justify-between items-center mb-4">
                <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search"
                        className="pl-10 pr-4 py-2 border rounded-lg w-64"
                    />
                </div>

                <div className="flex items-center gap-4">
                    <button className="flex items-center gap-2 px-4 py-2 border rounded-lg">
                        <Import className="w-4 h-4" />
                        Import
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 border rounded-lg">
                        <Filter className="w-4 h-4" />
                        Filter
                    </button>
                    <button className="px-4 py-2 bg-teal-500 text-white rounded-lg">List</button>
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
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="w-8 p-4">
                                <input type="checkbox" className="rounded" />
                            </th>
                            <th className="text-left p-4">Profile</th>
                            <th className="text-left p-4">Contact</th>
                            <th className="text-left p-4">Company</th>
                            <th className="text-left p-4">Status</th>
                            <th className="text-left p-4">Estimate Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        {operators.map((customer) => (
                            <tr key={customer.id} className="border-t" onClick={() => {
                                setIsOpen(true)
                            }}>
                                <td className="p-4">
                                    <input type="checkbox" className="rounded" />
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <img
                                            src="/api/placeholder/40/40"
                                            alt={customer.name}
                                            className="w-10 h-10 rounded-full"
                                        />
                                        <div>
                                            <p className="font-medium">{customer.name}</p>
                                            <p className="text-sm text-gray-500">{customer.lastActive}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <p className="text-sm">{customer.email}</p>
                                    <p className="text-sm text-gray-500">{customer.phone}</p>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={customer.company.logo}
                                            alt={customer.company.name}
                                            className="w-8 h-8 rounded"
                                        />
                                        <p className="text-sm">{customer.company.name}</p>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className={`px-3 py-1 rounded-full text-sm
                    ${customer.status === 'Accepted' ? 'bg-green-100 text-green-800' : ''}
                    ${customer.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                    ${customer.status === 'Canceled' ? 'bg-red-100 text-red-800' : ''}
                  `}>
                                        {customer.status}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <p className="font-medium">${customer.estimateValue.toFixed(2)}</p>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="max-w-7xl p-0 overflow-hidden">
                    {/* Navigation Header - Fixed */}
                    <div className="flex items-center px-4 font-semibold">Profile</div>

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
                                        <AvatarImage src="/placeholder.svg" alt="Nicholas Swatz" />
                                        <AvatarFallback>NS</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h2 className="text-lg font-semibold">Nicholas Swatz</h2>
                                        <p className="text-sm text-muted-foreground">#ERD246534</p>
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <section>
                                        <h3 className="text-sm font-semibold mb-4">About</h3>
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2">
                                                <Phone className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm">(629) 555-0123</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Mail className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm">nicholasswatz@gmail.com</span>
                                            </div>
                                        </div>
                                    </section>

                                    <section>
                                        <h3 className="text-sm font-semibold mb-4">Address</h3>
                                        <div className="space-y-3">
                                            <div className="flex items-start gap-2">
                                                <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                                                <div className="text-sm">
                                                    <p>390 Market Street, Suite 200</p>
                                                    <p>San Francisco CA 94102</p>
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    <section>
                                        <h3 className="text-sm font-semibold mb-4">Employee details</h3>
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm">Sep 26, 1988</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm">GER10654</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm">Project Manager</span>
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
        </div>
    );
}

export default OwnerOperator