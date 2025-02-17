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
    LayoutGrid,
    Building2,
    Users,
    DollarSign,
    X,
    ChevronUp
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
import { useCookie } from 'next-cookie';
import { renderInstance } from '@/utils/Axios/RenderInstance';
import { errorMessage } from '@/utils/Toastify/Messages';
import TranslatedText from '@/components/Menubar/TranslatedText';
import { ownerCustomerPageTranslations } from './OwnerCustomerTranslations';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Pagination from '@/utils/Paginations/Pagination';


interface Customer {
    id: string;
    name: string;
    email: string;
    totalSpent: number;
    lastStoreName: string;
}

interface user {
    userId: string;
    image: string;
    name: string;
    email: string;
}

const OwnerCustomer = () => {
    const [currentTime, setCurrentTime] = useState<string>("");
    const [currentDate, setCurrentDate] = useState<string>("");
    const [fetchingPageDetails, setFetchingPageDetails] = useState(false)

    const [customers, setCustomers] = useState<Customer[]>([])
    const [activeCustomers, setActiveCustomers] = useState(0)
    const [rejectedCustomers, setRejectedCustomers] = useState(0)
    const [pendingCustomers, setPendingCustomers] = useState(0)
    const [totalReceived, setTotalReceived] = useState(0)

    const [sortBy, setSortBy] = useState("first_name")
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")

    const [searchBy, setSearchBy] = useState("first_name")
    const [searchTerm, setSearchTerm] = useState("")

    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    const [hoveredItem, setHoveredItem] = useState(-1)

    const { cookie } = useCookie()
    const user: user = cookie.get("user")

    const sortOptions = [
        {
            label: "First Name",
            value: "first_name",
        },
        {
            label: "Last Name",
            value: "last_name",
        },
        {
            label: "Store",
            value: "store",
        }
    ]

    const searchOptions = [
        {
            label: "First Name",
            value: "first_name",
        },
        {
            label: "Last Name",
            value: "last_name",
        },
        {
            label: "Store",
            value: "store",
        },
    ]

    const handleClear = () => {
        setSearchTerm("")
    }

    function fetchPageDetails() {
        setFetchingPageDetails(true)

        renderInstance.get(`/owner/get-owner-customer-page-details/${user.userId}?searchBy=${searchBy}&search=${searchTerm}&sortBy=${sortBy}&sortOrder=${sortOrder}&page=${page}`)
            .then((res) => {
                setCustomers(res.data.customers)
                setActiveCustomers(res.data.activeCustomers.length)
                setRejectedCustomers(res.data.rejectedCustomers)
                setPendingCustomers(res.data.pendingCustomers)
                setTotalReceived(res.data.totalReceived)
            }).catch((err) => {
                errorMessage("Error fetching user detaild")
            }).finally(() => {
                setFetchingPageDetails(false)
            })
    }

    useEffect(() => {
        if (user) {
            fetchPageDetails()
        }
    }, [searchBy, searchTerm, sortBy, sortOrder])

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
                            <BreadcrumbLink href="/owner"><TranslatedText greetings={ownerCustomerPageTranslations.dashboard} /></BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/owner/customer"><TranslatedText greetings={ownerCustomerPageTranslations.customer} /></BreadcrumbLink>
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
                        <h3 className="text-gray-600 text-sm font-medium"><TranslatedText greetings={ownerCustomerPageTranslations.totalEstimate} /></h3>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 500px:grid-cols-2 768px:grid-cols-3 900px:flex gap-5 mt-4">
                        <div className="col-span-1 900px:flex-1">
                            <div className="text-3xl font-semibold mb-1">$ {totalReceived.toFixed(2)}</div>
                            <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                <span className="text-green-500 text-sm"><TranslatedText greetings={ownerCustomerPageTranslations.accepted} /></span>
                            </div>
                        </div>

                        <div className="w-px bg-gray-200 mx-4 hidden 900px:inline-block"></div>

                        <div className="col-span-1 900px:flex-1">
                            <div className="text-3xl font-semibold mb-1 text-left 500px:text-right 768px:text-left">$ {pendingCustomers.toFixed(2)}</div>
                            <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-orange-400 ml-0 500px:ml-auto 768px:ml-0"></div>
                                <span className="text-orange-400 text-sm"><TranslatedText greetings={ownerCustomerPageTranslations.pending} /></span>
                            </div>
                        </div>

                        <div className="w-px bg-gray-200 mx-4 hidden 900px:inline-block"></div>

                        <div className="col-span-1 900px:flex-1">
                            <div className="text-3xl font-semibold mb-1">$ {rejectedCustomers.toFixed(2)}</div>
                            <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                <span className="text-red-500 text-sm"><TranslatedText greetings={ownerCustomerPageTranslations.cancelled} /></span>
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
                        <h3 className="text-gray-600 text-sm font-medium"><TranslatedText greetings={ownerCustomerPageTranslations.activeCustomers} /></h3>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="mt-4 flex justify-between mb-0">
                        <div className="text-4xl font-semibold">{activeCustomers}</div>
                        {/* <div className="flex items-center gap-1 mt-2">
                            <span className="text-green-500 text-sm">↑ 15%</span>
                        </div> */}
                    </div>
                </div>

                {/* Total Member Card */}
                <div className="col-span-1 bg-white rounded-lg border shadow-sm p-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-gray-600 text-sm font-medium"><TranslatedText greetings={ownerCustomerPageTranslations.totalCustomers} /></h3>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="flex justify-between mt-4 ">
                        <div className="text-4xl font-semibold">{customers.length}</div>
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

            {/* Action Bar */}
            <div className="flex justify-between items-start 1000px:items-center flex-col 1000px:flex-row gap-4 mb-4">
                <div className='flex gap-2 items-center'>
                    <Select value={searchBy} onValueChange={setSearchBy}>
                        <SelectTrigger className="w-[200px] bg-transparent">
                            <SelectValue placeholder={"Search by"} />
                        </SelectTrigger>
                        <SelectContent>
                            {
                                searchOptions.map((sortValue, index) => {
                                    return (
                                        <SelectItem value={sortValue.value} key={index}>{sortValue.label}</SelectItem>
                                    )
                                })
                            }
                        </SelectContent>
                    </Select>
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                        <Input
                            type={(searchBy === "per_hour" || searchBy === "per_job" || searchBy === "per_month") ? 'number' : "text"}
                            placeholder="Search"
                            className="pl-10 py-2 border rounded-lg w-80 pr-16"
                            onChange={e => { setSearchTerm(e.target.value) }}
                            value={searchTerm}
                        />
                        {searchTerm && (
                            <Button
                                variant="ghost"
                                onClick={handleClear}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 ml-16"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-4 flex-wrap">
                    <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="w-[200px] bg-transparent">
                            <SelectValue placeholder={"Sort by"} />
                        </SelectTrigger>
                        <SelectContent>
                            {
                                sortOptions.map((sortValue, index) => {
                                    return (
                                        <SelectItem value={sortValue.value} key={index}>{sortValue.label}</SelectItem>
                                    )
                                })
                            }
                        </SelectContent>
                    </Select>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => { setSortOrder(sortOrder === "asc" ? "desc" : "asc") }}
                        className='bg-transparent hover:bg-transparent'>
                        {sortOrder === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
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
                            <TableHead className="text-left p-4 font-bold text-lg"><TranslatedText greetings={ownerCustomerPageTranslations.profile} /></TableHead>
                            <TableHead className="text-left p-4 font-bold text-lg"><TranslatedText greetings={ownerCustomerPageTranslations.contact} /></TableHead>
                            <TableHead className="text-left p-4 font-bold text-lg"><TranslatedText greetings={ownerCustomerPageTranslations.store} /></TableHead>
                            <TableHead className="text-left p-4 font-bold text-lg"><TranslatedText greetings={ownerCustomerPageTranslations.estimateValue} /></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {fetchingPageDetails ? <CustomerTableShrimmer />
                            :
                            customers.length === 0 ?
                                <p><TranslatedText greetings={ownerCustomerPageTranslations.noCustomersAvailable} /></p>
                                :
                                customers.map((customer, i) => {
                                    const name = customer.name
                                    return (
                                        <TableRow key={i} className="border-t" onMouseEnter={()=>{setHoveredItem(i)}} onMouseLeave={()=>{setHoveredItem(-1)}}>
                                            <TableCell className="p-4 w-[4vw]">
                                                <Input type="checkbox" className="rounded w-4 h-4 accent-primaryColor" />
                                            </TableCell>
                                            <TableCell className="p-4 w-[20vw]">
                                                <div className="flex items-center gap-3">
                                                    <Image
                                                        src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRH87TKQrWcl19xly2VNs0CjBzy8eaKNM-ZpA&s"
                                                        alt={customer.name}
                                                        className="w-10 h-10 rounded-full object-cover"
                                                        width={400}
                                                        height={400}
                                                    />
                                                    <div>
                                                        <p className="font-medium">{hoveredItem === i ? name : name.slice(0, 4) + "..."}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="p-4 w-[40vw]">
                                                <p className="text-sm">{hoveredItem === i ? customer.email : customer.email.slice(0, 4) + "..."}</p>
                                            </TableCell>
                                            <TableCell className="p-4 w-[18vw]">
                                                <div className="flex items-center gap-3">
                                                    <p className="text-sm">{hoveredItem === i ? customer.lastStoreName : customer.lastStoreName.slice(0, 4) + "..."}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="p-4 w-[18vw]">
                                                <p className="font-medium">${customer.totalSpent.toFixed(2)}</p>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                    </TableBody>
                </Table>
                {
                    (totalPages > 1) && !fetchingPageDetails &&
                    <Pagination totalPages={totalPages} currentPage={page} onPageChange={(e) => { setPage(e) }} />
                }
            </div>
        </div>
    );
}

export default OwnerCustomer

function CustomerTableShrimmer() {
    return (
        Array.from({ length: 5 }).map((_, index) => (
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
            </tr>
        ))
    )
}