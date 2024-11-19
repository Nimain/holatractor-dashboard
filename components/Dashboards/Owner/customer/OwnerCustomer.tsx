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

    return (
        <div className="p-5">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-2">
                    <span className="text-gray-600">List /</span>
                    <span className="font-medium">Customers</span>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex -space-x-2">
                        <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRH87TKQrWcl19xly2VNs0CjBzy8eaKNM-ZpA&s" alt="Team member" className="w-8 h-8 rounded-full border-2 border-white" />
                        <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRH87TKQrWcl19xly2VNs0CjBzy8eaKNM-ZpA&s" alt="Team member" className="w-8 h-8 rounded-full border-2 border-white" />
                        <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRH87TKQrWcl19xly2VNs0CjBzy8eaKNM-ZpA&s" alt="Team member" className="w-8 h-8 rounded-full border-2 border-white" />
                    </div>

                    {/* Divider */}
                    <div className="w-px h-8 bg-gray-300"></div>

                    {/* Share Button */}
                    <button className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg">
                        <Share className="w-4 h-4" />
                        Share
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg">
                        <Plus className="w-4 h-4" />
                        Create New
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg">
                        <Bell className="w-5 h-5" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg">
                        <Settings className="w-5 h-5" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg">
                        <HelpCircle className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-4 mb-8">
                {/* Total Estimate Card */}
                <div className="col-span-2 bg-white rounded-lg border shadow-sm p-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-gray-600 text-sm font-medium">Total Estimate</h3>
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
                                <span className="text-red-500 text-sm">Cancelled</span>
                            </div>
                        </div>
                        <div className=" items-center mt-4">
                            <p className="text-gray-500 text-sm justify-center text-right">08.52</p>
                            <p className="text-gray-500 text-sm mt-1">21 September 2023</p>

                        </div>
                    </div>


                </div>

                {/* Total Customers Card */}
                <div className="col-span-1.5 bg-white rounded-lg border shadow-sm p-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-gray-600 text-sm font-medium">Total Customers</h3>
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


            {/* Filter Bar */}
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
                        {customers.map((customer) => (
                            <tr key={customer.id} className="border-t">
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
        </div>
    );
}

export default OwnerCustomer