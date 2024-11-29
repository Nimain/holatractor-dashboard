"use client"

import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Bar, BarChart, CartesianGrid, LabelList, XAxis } from "recharts"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
import { YAxis, Tooltip, ResponsiveContainer } from 'recharts';

import { CalendarIcon, ChevronDown, Minus, Plus, Search, User, X, Wifi, Share2, Users, ArrowRight, MapPin, Clock, Phone, } from 'lucide-react'
import { addDays, format } from "date-fns"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Booking, BookingHours, BookingStatus, OperatorInStore, PaymentStatus } from "@/utils/Types/types";
import { useCookie } from "next-cookie";
import { renderInstance } from "@/utils/Axios/RenderInstance";
import { errorMessage } from "@/utils/Toastify/Messages";
import OwnerShrimmer from "../_components/OwnerShrimmer";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Image from "next/image";
import AssignOperator from "./AssignOperator";
import PaymentReview from "../_components/PaymentProofAction";

interface user {
    userId: string;
    image: string;
    name: string;
    email: string;
}

interface Location {
    latitude: number | null;
    longitude: number | null;
}

const Bookings = () => {
    const [date, setDate] = useState(new Date());
    const [location, setLocation] = useState<Location>({ latitude: null, longitude: null });
    const [error, setError] = useState<string | null>(null);
    const [selectedFilter, setSelectedFilter] = useState("all")

    const [allBookings, setAllBookings] = useState<Booking[]>([])
    const [fetchingBookings, setFetchingBookings] = useState(false)
    const [query, setQuery] = useState('');

    const [timeRange, setTimeRange] = useState('last30');
    const [dayFilter, setDayFilter] = useState('sunday');

    const leftSectionRef = useRef<HTMLDivElement>(null)
    const rightSectionRef = useRef<HTMLDivElement>(null)

    const chartData = {
        last30: [
            { time: 'Jan', passengers: 200 },
            { time: 'Feb', passengers: 600 },
            { time: 'Mar', passengers: 400 },
            { time: 'Apr', passengers: 300 },
            { time: 'May', passengers: 650 },
            { time: 'Jun', passengers: 450 },
            { time: 'Jul', passengers: 350 },
            { time: 'Aug', passengers: 250 },
            { time: 'Sep', passengers: 450 },
            { time: 'Oct', passengers: 550 },
            { time: 'Nov', passengers: 400 },
            { time: 'Dec', passengers: 300 },
        ],
        // Add more data for other time periods if needed
    };

    const { cookie } = useCookie()
    const user: user = cookie.get("user")

    function fetchBookings() {
        setFetchingBookings(true)

        renderInstance.get(`/owner/get-owner-booking-page-details/${user.userId}`)
            .then((res) => {
                console.log(res.data)
                setAllBookings(res.data.allBookings)
            }).catch((err) => {
                errorMessage("Error fetching operator lists")
            }).finally(() => {
                setFetchingBookings(false)
            })
    }



    useEffect(() => {
        const handleScroll = (e: WheelEvent) => {
            const target = e.currentTarget as HTMLDivElement
            target.scrollTop += e.deltaY
        }

        const section = leftSectionRef.current
        if (section) {
            section.addEventListener('wheel', handleScroll)
        }

        const rsection = rightSectionRef.current
        if (rsection) {
            rsection.addEventListener('wheel', handleScroll)
        }

        return () => {
            if (section) {
                section.removeEventListener('wheel', handleScroll)
            }
        }
    }, [])

    useEffect(() => {
        if (user) {
            fetchBookings()
        }
    }, [])

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position: GeolocationPosition) => {
                    setLocation({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    });
                },
                (error: GeolocationPositionError) => {
                    setError(error.message);
                }
            );
        } else {
            setError("Geolocation is not supported by this browser.");
        }
    }, []);

    if (fetchingBookings) return <OwnerShrimmer />

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            {/* Header */}

            {/* Main Content */}
            <div className="flex flex-grow overflow-auto" style={{ scrollbarWidth: "none" }}>


                {/* Left Section - Train Cards */}
                <div className="w-2/5 mx-auto p-4 overflow-auto" style={{ scrollbarWidth: "none" }} ref={leftSectionRef}>
                    {/* Search Bar */}
                    <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
                        <div className="flex items-center gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="From: Lorta Station, SMG"
                                    className="w-full py-3 pl-12 pr-4 text-gray-700 bg-gray-50 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                                />
                            </div>


                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex justify-between gap-4 mb-6">
                        <Select defaultValue="all" onValueChange={(e) => { setSelectedFilter(e) }}>
                            <SelectTrigger className="w-[140px] bg-white">
                                <SelectValue placeholder="All class" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                <SelectItem value="open">Open</SelectItem>
                                <SelectItem value="accepted">Accepted</SelectItem>
                                <SelectItem value="ongoing">On going</SelectItem>
                                <SelectItem value="unpaid">Unpaid</SelectItem>
                                <SelectItem value="review">Review</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="bg-white flex items-center gap-5">
                                    <CalendarIcon className="h-4 w-4 text-gray-500" />
                                    {format(date, "EEE, d MMM")}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    // onSelect={setDate}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover> */}
                    </div>

                    {/* Train List */}
                    <div className="space-y-4">
                        {
                            selectedFilter === "all" && allBookings.map((ticket, i) => (
                                <Card
                                    key={i}
                                    className={cn(
                                        "py-4 hover:shadow-md transition-shadow"
                                    )}
                                >
                                    <CardContent>
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="text-lg font-medium">
                                                    #holabook{ticket.id.slice(-5)}
                                                </h3>
                                            </div>
                                            <span className="text-lg font-semibold text-green-500">
                                                ${ticket.total_cost.toFixed(2)}
                                            </span>
                                        </div>

                                        <div className="flex justify-between items-center mb-4">
                                            <div>
                                                <p className="font-medium">{new Date(ticket.start_date).toLocaleDateString()}</p>
                                                {/* <p className="text-sm text-blue-500">{ticket.from.time}</p> */}
                                            </div>
                                            <div className="grow mx-4 border-t-2 border-dashed border-gray-300" />
                                            <div className="text-right">
                                                <p className="font-medium">{ticket.booking_hours ? <span className="text-sm text-muted-foreground">
                                                    Duration: <span className="font-medium">{ticket.booking_hours === BookingHours.EIGHT_HOURS ? "8 hours" : ticket.booking_hours === BookingHours.SEVEN_HOURS ? "7 hours" : ticket.booking_hours === BookingHours.SIX_HOURS ? "6 hours" : ticket.booking_hours === BookingHours.FIVE_HOURS ? "5 hours" : ticket.booking_hours === BookingHours.FOUR_HOURS ? "4 hours" : ticket.booking_hours === BookingHours.THREE_HOURS ? "3 hours" : ticket.booking_hours === BookingHours.TWO_HOURS ? "2 hours" : "1 hour"}</span>
                                                </span> : ticket.end_date && new Date(ticket.end_date).toLocaleDateString()}</p>
                                                {/* <p className="text-sm text-blue-500">{ticket.to.time}</p> */}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-3 border-t">
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <Badge>
                                                    {ticket.bookingStatus}
                                                </Badge>
                                                <span className="px-3 py-1 bg-gray-50 rounded-full">
                                                    {`${ticket.user?.first_name} ${ticket.user?.middle_name ?? ""} ${ticket.user?.last_name}`}
                                                </span>
                                            </div>
                                            <Button variant="ghost" className="text-orange-500 hover:text-orange-600">
                                                <Share2 className="w-4 h-4 mr-2" />
                                                Share
                                            </Button>
                                            <Sheet>

                                                <SheetTrigger asChild>
                                                    <Button className="bg-primaryColor hover:bg-primaryColor">
                                                        View details
                                                    </Button>
                                                </SheetTrigger>

                                                <SheetContent className="overflow-auto" style={{ scrollbarWidth: "none" }}>
                                                    <SheetHeader>
                                                        <SheetTitle className="text-xl font-semibold">Details</SheetTitle>
                                                    </SheetHeader>

                                                    <div className="space-y-4 mt-6">
                                                        {/* Order Info */}
                                                        <div className="space-y-2">
                                                            <div className="flex justify-between text-sm">
                                                                <span className="text-gray-500">Id</span>
                                                                <span>#holabook{ticket.id.slice(-5)}</span>
                                                            </div>

                                                            <div className="space-y-1">
                                                                <div >

                                                                    <div className="flex justify-between gap-2">
                                                                        <p className="text-gray-500 text-sm">From</p>
                                                                        <p className="flex  font-medium"><CalendarIcon className="w-4 h-4 mt-1 text-gray-400" />
                                                                            {new Date(ticket.start_date).toLocaleDateString()}
                                                                        </p>
                                                                    </div>
                                                                </div>

                                                                <div >
                                                                    <div className="flex justify-between gap-2">
                                                                        <p className="text-gray-500 text-sm">To</p>
                                                                        <p className="flex  justify-between font-medium"><CalendarIcon className="w-4 h-4 mt-1 text-gray-400" />
                                                                            {
                                                                                ticket.booking_hours ? ticket.booking_hours : ticket.end_date && new Date(ticket.end_date).toLocaleDateString()
                                                                            }
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            {
                                                                ticket.booking_hours &&
                                                                <div className="flex justify-between gap-2">
                                                                    <p className="text-gray-500 text-sm">Estimation</p>
                                                                    <p className="flex items-center font-medium"> <Clock className="w-4 h-4 text-gray-400" />
                                                                        {ticket.booking_hours}
                                                                    </p>
                                                                </div>
                                                            }
                                                        </div>

                                                        {/* Status */}
                                                        <div className="flex justify-between gap-2">
                                                            <div>status</div>

                                                            <Badge>{ticket.bookingStatus}</Badge>
                                                        </div>

                                                        {/* Driver Info */}
                                                        <div className="flex items-center gap-3 py-3 border-y">
                                                            <div className="w-10 h-10 bg-gray-200 rounded-full" />
                                                            <div>
                                                                <p className="font-medium">Mr. {`${ticket.user?.first_name} ${ticket.user?.middle_name ?? ""} ${ticket.user?.last_name}`}</p>
                                                                <p className="text-sm text-gray-500">Report at ${new Date(ticket.createdAt).toLocaleDateString()}</p>
                                                            </div>
                                                        </div>

                                                        {/* Timeline */}
                                                        <div className="space-y-6">
                                                            <div className="flex gap-3">
                                                                <div className="flex flex-col items-center">
                                                                    <div className={`w-3 h-3 rounded-full ${(ticket.bookingStatus === BookingStatus.Open) || (ticket.bookingStatus === BookingStatus.Accepted) || (ticket.bookingStatus === BookingStatus.Arriving) || (ticket.bookingStatus === BookingStatus.Arrived) || (ticket.bookingStatus === BookingStatus.Started) || (ticket.bookingStatus === BookingStatus.Stopped) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerPENDING")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerCONFIRMED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "OwnerREJECTED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "COMPLETED"))
                                                                        ? 'bg-green-500'
                                                                        : 'bg-yellow-400'
                                                                        }`} />
                                                                </div>

                                                                <div className="flex-1 pb-6">
                                                                    <div className="flex justify-between">
                                                                        <p className="font-medium">You just confirmed the booking</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            {
                                                                ticket.bookingStatus === BookingStatus.Open &&
                                                                <AssignOperator selectedRequest={ticket.id} storeId={ticket.store_id} store={ticket.store} />
                                                            }
                                                            <div className="flex gap-3">
                                                                <div className="flex flex-col items-center">
                                                                    <div className={`w-3 h-3 rounded-full ${(ticket.bookingStatus === BookingStatus.Accepted) || (ticket.bookingStatus === BookingStatus.Arriving) || (ticket.bookingStatus === BookingStatus.Arrived) || (ticket.bookingStatus === BookingStatus.Started) || (ticket.bookingStatus === BookingStatus.Stopped) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerPENDING")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerCONFIRMED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "OwnerREJECTED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "COMPLETED"))
                                                                        ? 'bg-green-500'
                                                                        : 'bg-yellow-400'
                                                                        }`} />
                                                                </div>

                                                                <div className="flex-1 pb-6">
                                                                    <div className="flex justify-between">
                                                                        <p className="font-medium">
                                                                            Operator has accepted this booking.
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-3">
                                                                <div className="flex flex-col items-center">
                                                                    <div className={`w-3 h-3 rounded-full ${(ticket.bookingStatus === BookingStatus.Arriving) || (ticket.bookingStatus === BookingStatus.Arrived) || (ticket.bookingStatus === BookingStatus.Started) || (ticket.bookingStatus === BookingStatus.Stopped) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerPENDING")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerCONFIRMED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "OwnerREJECTED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "COMPLETED"))
                                                                        ? 'bg-green-500'
                                                                        : 'bg-yellow-400'
                                                                        }`} />
                                                                </div>

                                                                <div className="flex-1 pb-6">
                                                                    <div className="flex justify-between">
                                                                        <p className="font-medium">
                                                                            The booking has left for it's destination.
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-3">
                                                                <div className="flex flex-col items-center">
                                                                    <div className={`w-3 h-3 rounded-full ${(ticket.bookingStatus === BookingStatus.Arrived) || (ticket.bookingStatus === BookingStatus.Started) || (ticket.bookingStatus === BookingStatus.Stopped) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerPENDING")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerCONFIRMED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "OwnerREJECTED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "COMPLETED"))
                                                                        ? 'bg-green-500'
                                                                        : 'bg-yellow-400'
                                                                        }`} />
                                                                </div>

                                                                <div className="flex-1 pb-6">
                                                                    <div className="flex justify-between">
                                                                        <p className="font-medium">
                                                                            The booking has arrived at it's destination.
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-3">
                                                                <div className="flex flex-col items-center">
                                                                    <div className={`w-3 h-3 rounded-full ${(ticket.bookingStatus === BookingStatus.Started) || (ticket.bookingStatus === BookingStatus.Stopped) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerPENDING")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerCONFIRMED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "OwnerREJECTED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "COMPLETED"))
                                                                        ? 'bg-green-500'
                                                                        : 'bg-yellow-400'
                                                                        }`} />
                                                                </div>

                                                                <div className="flex-1 pb-6">
                                                                    <div className="flex justify-between">
                                                                        <p className="font-medium">
                                                                            The booking has started it's work.
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-3">
                                                                <div className="flex flex-col items-center">
                                                                    <div className={`w-3 h-3 rounded-full ${((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerPENDING")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerCONFIRMED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "OwnerREJECTED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "COMPLETED"))
                                                                        ? 'bg-green-500'
                                                                        : 'bg-yellow-400'
                                                                        }`} />
                                                                </div>

                                                                <div className="flex-1 pb-6">
                                                                    <div className="flex justify-between">
                                                                        <p className="font-medium">
                                                                            The booking has completed. Wailting for farmer to pay.
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-3">
                                                                <div className="flex flex-col items-center">
                                                                    <div className={`w-3 h-3 rounded-full ${((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerCONFIRMED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "OwnerREJECTED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "COMPLETED"))
                                                                        ? 'bg-green-500'
                                                                        : 'bg-yellow-400'
                                                                        }`} />
                                                                </div>

                                                                <div className="flex-1 pb-6">
                                                                    <div className="flex justify-between">
                                                                        <p className="font-medium">
                                                                            FArmer has submitted payment details
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-3">
                                                                <div className="flex flex-col items-center">
                                                                    <div className={`w-3 h-3 rounded-full ${((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "OwnerREJECTED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "COMPLETED"))
                                                                        ? 'bg-green-500'
                                                                        : 'bg-yellow-400'
                                                                        }`} />
                                                                </div>

                                                                <div className="flex-1 pb-6">
                                                                    <div className="flex justify-between">
                                                                        <p className="font-medium">
                                                                            You have rejected the booking payment details.
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-3">
                                                                <div className="flex flex-col items-center">
                                                                    <div className={`w-3 h-3 rounded-full ${((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "COMPLETED"))
                                                                        ? 'bg-green-500'
                                                                        : 'bg-yellow-400'
                                                                        }`} />
                                                                </div>

                                                                <div className="flex-1 pb-6">
                                                                    <div className="flex justify-between">
                                                                        <p className="font-medium">
                                                                            The booking job has completed and you have accepted the payment.
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {
                                                        (ticket.payment.length > 0 && ticket.payment[0].status === PaymentStatus.FarmerCONFIRMED) && <PaymentReview
                                                            referenceNumber={ticket.payment[0].transaction_reference[ticket.payment[0].transaction_reference.length - 1]}
                                                            screenshotUrl={ticket.payment[0].screenshots[ticket.payment[0].screenshots.length - 1]}
                                                            paymentId={ticket.payment[0].id} />
                                                    }
                                                </SheetContent>
                                            </Sheet>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        }
                        {
                            selectedFilter === "open" && allBookings.filter(bo => bo.bookingStatus === BookingStatus.Open).map((ticket, i) => (
                                <Card
                                    key={i}
                                    className={cn(
                                        "py-4 hover:shadow-md transition-shadow"
                                    )}
                                >
                                    <CardContent>
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="text-lg font-medium">
                                                    #holabook{ticket.id.slice(-5)}
                                                </h3>
                                            </div>
                                            <span className="text-lg font-semibold text-green-500">
                                                ${ticket.total_cost.toFixed(2)}
                                            </span>
                                        </div>

                                        <div className="flex justify-between items-center mb-4">
                                            <div>
                                                <p className="font-medium">{new Date(ticket.start_date).toLocaleDateString()}</p>
                                                {/* <p className="text-sm text-blue-500">{ticket.from.time}</p> */}
                                            </div>
                                            <div className="grow mx-4 border-t-2 border-dashed border-gray-300" />
                                            <div className="text-right">
                                                <p className="font-medium">{ticket.booking_hours ? <span className="text-sm text-muted-foreground">
                                                    Duration: <span className="font-medium">{ticket.booking_hours === BookingHours.EIGHT_HOURS ? "8 hours" : ticket.booking_hours === BookingHours.SEVEN_HOURS ? "7 hours" : ticket.booking_hours === BookingHours.SIX_HOURS ? "6 hours" : ticket.booking_hours === BookingHours.FIVE_HOURS ? "5 hours" : ticket.booking_hours === BookingHours.FOUR_HOURS ? "4 hours" : ticket.booking_hours === BookingHours.THREE_HOURS ? "3 hours" : ticket.booking_hours === BookingHours.TWO_HOURS ? "2 hours" : "1 hour"}</span>
                                                </span> : ticket.end_date && new Date(ticket.end_date).toLocaleDateString()}</p>
                                                {/* <p className="text-sm text-blue-500">{ticket.to.time}</p> */}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-3 border-t">
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <Badge>
                                                    {ticket.bookingStatus}
                                                </Badge>
                                                <span className="px-3 py-1 bg-gray-50 rounded-full">
                                                    {`${ticket.user?.first_name} ${ticket.user?.middle_name ?? ""} ${ticket.user?.last_name}`}
                                                </span>
                                            </div>
                                            <Button variant="ghost" className="text-orange-500 hover:text-orange-600">
                                                <Share2 className="w-4 h-4 mr-2" />
                                                Share
                                            </Button>
                                            <Sheet>

                                                <SheetTrigger asChild>
                                                    <Button className="bg-primaryColor hover:bg-primaryColor">
                                                        View details
                                                    </Button>
                                                </SheetTrigger>

                                                <SheetContent className="overflow-auto" style={{ scrollbarWidth: "none" }}>
                                                    <SheetHeader>
                                                        <SheetTitle className="text-xl font-semibold">Details</SheetTitle>
                                                    </SheetHeader>

                                                    <div className="space-y-4 mt-6">
                                                        {/* Order Info */}
                                                        <div className="space-y-2">
                                                            <div className="flex justify-between text-sm">
                                                                <span className="text-gray-500">Id</span>
                                                                <span>#holabook{ticket.id.slice(-5)}</span>
                                                            </div>

                                                            <div className="space-y-1">
                                                                <div >

                                                                    <div className="flex justify-between gap-2">
                                                                        <p className="text-gray-500 text-sm">From</p>
                                                                        <p className="flex  font-medium"><CalendarIcon className="w-4 h-4 mt-1 text-gray-400" />
                                                                            {new Date(ticket.start_date).toLocaleDateString()}
                                                                        </p>
                                                                    </div>
                                                                </div>

                                                                <div >
                                                                    <div className="flex justify-between gap-2">
                                                                        <p className="text-gray-500 text-sm">To</p>
                                                                        <p className="flex  justify-between font-medium"><CalendarIcon className="w-4 h-4 mt-1 text-gray-400" />
                                                                            {
                                                                                ticket.booking_hours ? ticket.booking_hours : ticket.end_date && new Date(ticket.end_date).toLocaleDateString()
                                                                            }
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            {
                                                                ticket.booking_hours &&
                                                                <div className="flex justify-between gap-2">
                                                                    <p className="text-gray-500 text-sm">Estimation</p>
                                                                    <p className="flex items-center font-medium"> <Clock className="w-4 h-4 text-gray-400" />
                                                                        {ticket.booking_hours}
                                                                    </p>
                                                                </div>
                                                            }
                                                        </div>

                                                        {/* Status */}
                                                        <div className="flex justify-between gap-2">
                                                            <div>status</div>

                                                            <Badge>{ticket.bookingStatus}</Badge>
                                                        </div>

                                                        {/* Driver Info */}
                                                        <div className="flex items-center gap-3 py-3 border-y">
                                                            <div className="w-10 h-10 bg-gray-200 rounded-full" />
                                                            <div>
                                                                <p className="font-medium">Mr. {`${ticket.user?.first_name} ${ticket.user?.middle_name ?? ""} ${ticket.user?.last_name}`}</p>
                                                                <p className="text-sm text-gray-500">Report at ${new Date(ticket.createdAt).toLocaleDateString()}</p>
                                                            </div>
                                                        </div>

                                                        {/* Timeline */}
                                                        <div className="space-y-6">
                                                            <div className="flex gap-3">
                                                                <div className="flex flex-col items-center">
                                                                    <div className={`w-3 h-3 rounded-full ${(ticket.bookingStatus === BookingStatus.Open) || (ticket.bookingStatus === BookingStatus.Accepted) || (ticket.bookingStatus === BookingStatus.Arriving) || (ticket.bookingStatus === BookingStatus.Arrived) || (ticket.bookingStatus === BookingStatus.Started) || (ticket.bookingStatus === BookingStatus.Stopped) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerPENDING")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerCONFIRMED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "OwnerREJECTED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "COMPLETED"))
                                                                        ? 'bg-green-500'
                                                                        : 'bg-yellow-400'
                                                                        }`} />
                                                                </div>

                                                                <div className="flex-1 pb-6">
                                                                    <div className="flex justify-between">
                                                                        <p className="font-medium">You just confirmed the booking</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-3">
                                                                <div className="flex flex-col items-center">
                                                                    <div className={`w-3 h-3 rounded-full ${(ticket.bookingStatus === BookingStatus.Accepted) || (ticket.bookingStatus === BookingStatus.Arriving) || (ticket.bookingStatus === BookingStatus.Arrived) || (ticket.bookingStatus === BookingStatus.Started) || (ticket.bookingStatus === BookingStatus.Stopped) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerPENDING")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerCONFIRMED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "OwnerREJECTED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "COMPLETED"))
                                                                        ? 'bg-green-500'
                                                                        : 'bg-yellow-400'
                                                                        }`} />
                                                                </div>

                                                                <div className="flex-1 pb-6">
                                                                    <div className="flex justify-between">
                                                                        <p className="font-medium">
                                                                            Operator has accepted this booking.
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-3">
                                                                <div className="flex flex-col items-center">
                                                                    <div className={`w-3 h-3 rounded-full ${(ticket.bookingStatus === BookingStatus.Arriving) || (ticket.bookingStatus === BookingStatus.Arrived) || (ticket.bookingStatus === BookingStatus.Started) || (ticket.bookingStatus === BookingStatus.Stopped) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerPENDING")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerCONFIRMED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "OwnerREJECTED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "COMPLETED"))
                                                                        ? 'bg-green-500'
                                                                        : 'bg-yellow-400'
                                                                        }`} />
                                                                </div>

                                                                <div className="flex-1 pb-6">
                                                                    <div className="flex justify-between">
                                                                        <p className="font-medium">
                                                                            The booking has left for it's destination.
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-3">
                                                                <div className="flex flex-col items-center">
                                                                    <div className={`w-3 h-3 rounded-full ${(ticket.bookingStatus === BookingStatus.Arrived) || (ticket.bookingStatus === BookingStatus.Started) || (ticket.bookingStatus === BookingStatus.Stopped) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerPENDING")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerCONFIRMED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "OwnerREJECTED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "COMPLETED"))
                                                                        ? 'bg-green-500'
                                                                        : 'bg-yellow-400'
                                                                        }`} />
                                                                </div>

                                                                <div className="flex-1 pb-6">
                                                                    <div className="flex justify-between">
                                                                        <p className="font-medium">
                                                                            The booking has arrived at it's destination.
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-3">
                                                                <div className="flex flex-col items-center">
                                                                    <div className={`w-3 h-3 rounded-full ${(ticket.bookingStatus === BookingStatus.Started) || (ticket.bookingStatus === BookingStatus.Stopped) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerPENDING")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerCONFIRMED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "OwnerREJECTED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "COMPLETED"))
                                                                        ? 'bg-green-500'
                                                                        : 'bg-yellow-400'
                                                                        }`} />
                                                                </div>

                                                                <div className="flex-1 pb-6">
                                                                    <div className="flex justify-between">
                                                                        <p className="font-medium">
                                                                            The booking has started it's work.
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-3">
                                                                <div className="flex flex-col items-center">
                                                                    <div className={`w-3 h-3 rounded-full ${((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerPENDING")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerCONFIRMED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "OwnerREJECTED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "COMPLETED"))
                                                                        ? 'bg-green-500'
                                                                        : 'bg-yellow-400'
                                                                        }`} />
                                                                </div>

                                                                <div className="flex-1 pb-6">
                                                                    <div className="flex justify-between">
                                                                        <p className="font-medium">
                                                                            The booking has completed. Wailting for farmer to pay.
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-3">
                                                                <div className="flex flex-col items-center">
                                                                    <div className={`w-3 h-3 rounded-full ${((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerCONFIRMED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "OwnerREJECTED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "COMPLETED"))
                                                                        ? 'bg-green-500'
                                                                        : 'bg-yellow-400'
                                                                        }`} />
                                                                </div>

                                                                <div className="flex-1 pb-6">
                                                                    <div className="flex justify-between">
                                                                        <p className="font-medium">
                                                                            FArmer has submitted payment details
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-3">
                                                                <div className="flex flex-col items-center">
                                                                    <div className={`w-3 h-3 rounded-full ${((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "OwnerREJECTED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "COMPLETED"))
                                                                        ? 'bg-green-500'
                                                                        : 'bg-yellow-400'
                                                                        }`} />
                                                                </div>

                                                                <div className="flex-1 pb-6">
                                                                    <div className="flex justify-between">
                                                                        <p className="font-medium">
                                                                            You have rejected the booking payment details.
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-3">
                                                                <div className="flex flex-col items-center">
                                                                    <div className={`w-3 h-3 rounded-full ${((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "COMPLETED"))
                                                                        ? 'bg-green-500'
                                                                        : 'bg-yellow-400'
                                                                        }`} />
                                                                </div>

                                                                <div className="flex-1 pb-6">
                                                                    <div className="flex justify-between">
                                                                        <p className="font-medium">
                                                                            The booking job has completed and you have accepted the payment.
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {
                                                        ticket.bookingStatus === BookingStatus.Open &&
                                                        <AssignOperator selectedRequest={ticket.id} storeId={ticket.store_id} store={ticket.store} />
                                                    }
                                                    {
                                                        (ticket.payment.length > 0 && ticket.payment[0].status === PaymentStatus.FarmerCONFIRMED) && <PaymentReview
                                                            referenceNumber={ticket.payment[0].transaction_reference[ticket.payment[0].transaction_reference.length - 1]}
                                                            screenshotUrl={ticket.payment[0].screenshots[ticket.payment[0].screenshots.length - 1]}
                                                            paymentId={ticket.payment[0].id} />
                                                    }
                                                </SheetContent>
                                            </Sheet>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        }
                        {
                            selectedFilter === "accepted" && allBookings.filter(bo => bo.bookingStatus === BookingStatus.Accepted).map((ticket, i) => (
                                <Card
                                    key={i}
                                    className={cn(
                                        "py-4 hover:shadow-md transition-shadow"
                                    )}
                                >
                                    <CardContent>
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="text-lg font-medium">
                                                    #holabook{ticket.id.slice(-5)}
                                                </h3>
                                            </div>
                                            <span className="text-lg font-semibold text-green-500">
                                                ${ticket.total_cost.toFixed(2)}
                                            </span>
                                        </div>

                                        <div className="flex justify-between items-center mb-4">
                                            <div>
                                                <p className="font-medium">{new Date(ticket.start_date).toLocaleDateString()}</p>
                                                {/* <p className="text-sm text-blue-500">{ticket.from.time}</p> */}
                                            </div>
                                            <div className="grow mx-4 border-t-2 border-dashed border-gray-300" />
                                            <div className="text-right">
                                                <p className="font-medium">{ticket.booking_hours ? <span className="text-sm text-muted-foreground">
                                                    Duration: <span className="font-medium">{ticket.booking_hours === BookingHours.EIGHT_HOURS ? "8 hours" : ticket.booking_hours === BookingHours.SEVEN_HOURS ? "7 hours" : ticket.booking_hours === BookingHours.SIX_HOURS ? "6 hours" : ticket.booking_hours === BookingHours.FIVE_HOURS ? "5 hours" : ticket.booking_hours === BookingHours.FOUR_HOURS ? "4 hours" : ticket.booking_hours === BookingHours.THREE_HOURS ? "3 hours" : ticket.booking_hours === BookingHours.TWO_HOURS ? "2 hours" : "1 hour"}</span>
                                                </span> : ticket.end_date && new Date(ticket.end_date).toLocaleDateString()}</p>
                                                {/* <p className="text-sm text-blue-500">{ticket.to.time}</p> */}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-3 border-t">
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <Badge>
                                                    {ticket.bookingStatus}
                                                </Badge>
                                                <span className="px-3 py-1 bg-gray-50 rounded-full">
                                                    {`${ticket.user?.first_name} ${ticket.user?.middle_name ?? ""} ${ticket.user?.last_name}`}
                                                </span>
                                            </div>
                                            <Button variant="ghost" className="text-orange-500 hover:text-orange-600">
                                                <Share2 className="w-4 h-4 mr-2" />
                                                Share
                                            </Button>
                                            <Sheet>

                                                <SheetTrigger asChild>
                                                    <Button className="bg-primaryColor hover:bg-primaryColor">
                                                        View details
                                                    </Button>
                                                </SheetTrigger>

                                                <SheetContent className="overflow-auto" style={{ scrollbarWidth: "none" }}>
                                                    <SheetHeader>
                                                        <SheetTitle className="text-xl font-semibold">Details</SheetTitle>
                                                    </SheetHeader>

                                                    <div className="space-y-4 mt-6">
                                                        {/* Order Info */}
                                                        <div className="space-y-2">
                                                            <div className="flex justify-between text-sm">
                                                                <span className="text-gray-500">Id</span>
                                                                <span>#holabook{ticket.id.slice(-5)}</span>
                                                            </div>

                                                            <div className="space-y-1">
                                                                <div >

                                                                    <div className="flex justify-between gap-2">
                                                                        <p className="text-gray-500 text-sm">From</p>
                                                                        <p className="flex  font-medium"><CalendarIcon className="w-4 h-4 mt-1 text-gray-400" />
                                                                            {new Date(ticket.start_date).toLocaleDateString()}
                                                                        </p>
                                                                    </div>
                                                                </div>

                                                                <div >
                                                                    <div className="flex justify-between gap-2">
                                                                        <p className="text-gray-500 text-sm">To</p>
                                                                        <p className="flex  justify-between font-medium"><CalendarIcon className="w-4 h-4 mt-1 text-gray-400" />
                                                                            {
                                                                                ticket.booking_hours ? ticket.booking_hours : ticket.end_date && new Date(ticket.end_date).toLocaleDateString()
                                                                            }
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            {
                                                                ticket.booking_hours &&
                                                                <div className="flex justify-between gap-2">
                                                                    <p className="text-gray-500 text-sm">Estimation</p>
                                                                    <p className="flex items-center font-medium"> <Clock className="w-4 h-4 text-gray-400" />
                                                                        {ticket.booking_hours}
                                                                    </p>
                                                                </div>
                                                            }
                                                        </div>

                                                        {/* Status */}
                                                        <div className="flex justify-between gap-2">
                                                            <div>status</div>

                                                            <Badge>{ticket.bookingStatus}</Badge>
                                                        </div>

                                                        {/* Driver Info */}
                                                        <div className="flex items-center gap-3 py-3 border-y">
                                                            <div className="w-10 h-10 bg-gray-200 rounded-full" />
                                                            <div>
                                                                <p className="font-medium">Mr. {`${ticket.user?.first_name} ${ticket.user?.middle_name ?? ""} ${ticket.user?.last_name}`}</p>
                                                                <p className="text-sm text-gray-500">Report at ${new Date(ticket.createdAt).toLocaleDateString()}</p>
                                                            </div>
                                                        </div>

                                                        {/* Timeline */}
                                                        <div className="space-y-6">
                                                            <div className="flex gap-3">
                                                                <div className="flex flex-col items-center">
                                                                    <div className={`w-3 h-3 rounded-full ${(ticket.bookingStatus === BookingStatus.Open) || (ticket.bookingStatus === BookingStatus.Accepted) || (ticket.bookingStatus === BookingStatus.Arriving) || (ticket.bookingStatus === BookingStatus.Arrived) || (ticket.bookingStatus === BookingStatus.Started) || (ticket.bookingStatus === BookingStatus.Stopped) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerPENDING")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerCONFIRMED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "OwnerREJECTED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "COMPLETED"))
                                                                        ? 'bg-green-500'
                                                                        : 'bg-yellow-400'
                                                                        }`} />
                                                                </div>

                                                                <div className="flex-1 pb-6">
                                                                    <div className="flex justify-between">
                                                                        <p className="font-medium">You just confirmed the booking</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            {
                                                                ticket.bookingStatus === BookingStatus.Open &&
                                                                <AssignOperator selectedRequest={ticket.id} storeId={ticket.store_id} store={ticket.store} />
                                                            }
                                                            <div className="flex gap-3">
                                                                <div className="flex flex-col items-center">
                                                                    <div className={`w-3 h-3 rounded-full ${(ticket.bookingStatus === BookingStatus.Accepted) || (ticket.bookingStatus === BookingStatus.Arriving) || (ticket.bookingStatus === BookingStatus.Arrived) || (ticket.bookingStatus === BookingStatus.Started) || (ticket.bookingStatus === BookingStatus.Stopped) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerPENDING")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerCONFIRMED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "OwnerREJECTED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "COMPLETED"))
                                                                        ? 'bg-green-500'
                                                                        : 'bg-yellow-400'
                                                                        }`} />
                                                                </div>

                                                                <div className="flex-1 pb-6">
                                                                    <div className="flex justify-between">
                                                                        <p className="font-medium">
                                                                            Operator has accepted this booking.
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-3">
                                                                <div className="flex flex-col items-center">
                                                                    <div className={`w-3 h-3 rounded-full ${(ticket.bookingStatus === BookingStatus.Arriving) || (ticket.bookingStatus === BookingStatus.Arrived) || (ticket.bookingStatus === BookingStatus.Started) || (ticket.bookingStatus === BookingStatus.Stopped) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerPENDING")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerCONFIRMED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "OwnerREJECTED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "COMPLETED"))
                                                                        ? 'bg-green-500'
                                                                        : 'bg-yellow-400'
                                                                        }`} />
                                                                </div>

                                                                <div className="flex-1 pb-6">
                                                                    <div className="flex justify-between">
                                                                        <p className="font-medium">
                                                                            The booking has left for it's destination.
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-3">
                                                                <div className="flex flex-col items-center">
                                                                    <div className={`w-3 h-3 rounded-full ${(ticket.bookingStatus === BookingStatus.Arrived) || (ticket.bookingStatus === BookingStatus.Started) || (ticket.bookingStatus === BookingStatus.Stopped) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerPENDING")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerCONFIRMED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "OwnerREJECTED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "COMPLETED"))
                                                                        ? 'bg-green-500'
                                                                        : 'bg-yellow-400'
                                                                        }`} />
                                                                </div>

                                                                <div className="flex-1 pb-6">
                                                                    <div className="flex justify-between">
                                                                        <p className="font-medium">
                                                                            The booking has arrived at it's destination.
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-3">
                                                                <div className="flex flex-col items-center">
                                                                    <div className={`w-3 h-3 rounded-full ${(ticket.bookingStatus === BookingStatus.Started) || (ticket.bookingStatus === BookingStatus.Stopped) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerPENDING")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerCONFIRMED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "OwnerREJECTED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "COMPLETED"))
                                                                        ? 'bg-green-500'
                                                                        : 'bg-yellow-400'
                                                                        }`} />
                                                                </div>

                                                                <div className="flex-1 pb-6">
                                                                    <div className="flex justify-between">
                                                                        <p className="font-medium">
                                                                            The booking has started it's work.
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-3">
                                                                <div className="flex flex-col items-center">
                                                                    <div className={`w-3 h-3 rounded-full ${((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerPENDING")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerCONFIRMED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "OwnerREJECTED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "COMPLETED"))
                                                                        ? 'bg-green-500'
                                                                        : 'bg-yellow-400'
                                                                        }`} />
                                                                </div>

                                                                <div className="flex-1 pb-6">
                                                                    <div className="flex justify-between">
                                                                        <p className="font-medium">
                                                                            The booking has completed. Wailting for farmer to pay.
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-3">
                                                                <div className="flex flex-col items-center">
                                                                    <div className={`w-3 h-3 rounded-full ${((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerCONFIRMED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "OwnerREJECTED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "COMPLETED"))
                                                                        ? 'bg-green-500'
                                                                        : 'bg-yellow-400'
                                                                        }`} />
                                                                </div>

                                                                <div className="flex-1 pb-6">
                                                                    <div className="flex justify-between">
                                                                        <p className="font-medium">
                                                                            FArmer has submitted payment details
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-3">
                                                                <div className="flex flex-col items-center">
                                                                    <div className={`w-3 h-3 rounded-full ${((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "OwnerREJECTED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "COMPLETED"))
                                                                        ? 'bg-green-500'
                                                                        : 'bg-yellow-400'
                                                                        }`} />
                                                                </div>

                                                                <div className="flex-1 pb-6">
                                                                    <div className="flex justify-between">
                                                                        <p className="font-medium">
                                                                            You have rejected the booking payment details.
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-3">
                                                                <div className="flex flex-col items-center">
                                                                    <div className={`w-3 h-3 rounded-full ${((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "COMPLETED"))
                                                                        ? 'bg-green-500'
                                                                        : 'bg-yellow-400'
                                                                        }`} />
                                                                </div>

                                                                <div className="flex-1 pb-6">
                                                                    <div className="flex justify-between">
                                                                        <p className="font-medium">
                                                                            The booking job has completed and you have accepted the payment.
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {
                                                        (ticket.payment.length > 0 && ticket.payment[0].status === PaymentStatus.FarmerCONFIRMED) && <PaymentReview
                                                            referenceNumber={ticket.payment[0].transaction_reference[ticket.payment[0].transaction_reference.length - 1]}
                                                            screenshotUrl={ticket.payment[0].screenshots[ticket.payment[0].screenshots.length - 1]}
                                                            paymentId={ticket.payment[0].id} />
                                                    }
                                                </SheetContent>
                                            </Sheet>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        }
                        {
                            selectedFilter === "ongoing" && allBookings.filter(bo => ((bo.bookingStatus === BookingStatus.Arriving) || (bo.bookingStatus === BookingStatus.Arrived) || (bo.bookingStatus === BookingStatus.Started) || (bo.bookingStatus === BookingStatus.Stopped))).map((ticket, i) => (
                                <Card
                                    key={i}
                                    className={cn(
                                        "py-4 hover:shadow-md transition-shadow"
                                    )}
                                >
                                    <CardContent>
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="text-lg font-medium">
                                                    #holabook{ticket.id.slice(-5)}
                                                </h3>
                                            </div>
                                            <span className="text-lg font-semibold text-green-500">
                                                ${ticket.total_cost.toFixed(2)}
                                            </span>
                                        </div>

                                        <div className="flex justify-between items-center mb-4">
                                            <div>
                                                <p className="font-medium">{new Date(ticket.start_date).toLocaleDateString()}</p>
                                                {/* <p className="text-sm text-blue-500">{ticket.from.time}</p> */}
                                            </div>
                                            <div className="grow mx-4 border-t-2 border-dashed border-gray-300" />
                                            <div className="text-right">
                                                <p className="font-medium">{ticket.booking_hours ? <span className="text-sm text-muted-foreground">
                                                    Duration: <span className="font-medium">{ticket.booking_hours === BookingHours.EIGHT_HOURS ? "8 hours" : ticket.booking_hours === BookingHours.SEVEN_HOURS ? "7 hours" : ticket.booking_hours === BookingHours.SIX_HOURS ? "6 hours" : ticket.booking_hours === BookingHours.FIVE_HOURS ? "5 hours" : ticket.booking_hours === BookingHours.FOUR_HOURS ? "4 hours" : ticket.booking_hours === BookingHours.THREE_HOURS ? "3 hours" : ticket.booking_hours === BookingHours.TWO_HOURS ? "2 hours" : "1 hour"}</span>
                                                </span> : ticket.end_date && new Date(ticket.end_date).toLocaleDateString()}</p>
                                                {/* <p className="text-sm text-blue-500">{ticket.to.time}</p> */}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-3 border-t">
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <Badge>
                                                    {ticket.bookingStatus}
                                                </Badge>
                                                <span className="px-3 py-1 bg-gray-50 rounded-full">
                                                    {`${ticket.user?.first_name} ${ticket.user?.middle_name ?? ""} ${ticket.user?.last_name}`}
                                                </span>
                                            </div>
                                            <Button variant="ghost" className="text-orange-500 hover:text-orange-600">
                                                <Share2 className="w-4 h-4 mr-2" />
                                                Share
                                            </Button>
                                            <Sheet>

                                                <SheetTrigger asChild>
                                                    <Button className="bg-primaryColor hover:bg-primaryColor">
                                                        View details
                                                    </Button>
                                                </SheetTrigger>

                                                <SheetContent className="overflow-auto" style={{ scrollbarWidth: "none" }}>
                                                    <SheetHeader>
                                                        <SheetTitle className="text-xl font-semibold">Details</SheetTitle>
                                                    </SheetHeader>

                                                    <div className="space-y-4 mt-6">
                                                        {/* Order Info */}
                                                        <div className="space-y-2">
                                                            <div className="flex justify-between text-sm">
                                                                <span className="text-gray-500">Id</span>
                                                                <span>#holabook{ticket.id.slice(-5)}</span>
                                                            </div>

                                                            <div className="space-y-1">
                                                                <div >

                                                                    <div className="flex justify-between gap-2">
                                                                        <p className="text-gray-500 text-sm">From</p>
                                                                        <p className="flex  font-medium"><CalendarIcon className="w-4 h-4 mt-1 text-gray-400" />
                                                                            {new Date(ticket.start_date).toLocaleDateString()}
                                                                        </p>
                                                                    </div>
                                                                </div>

                                                                <div >
                                                                    <div className="flex justify-between gap-2">
                                                                        <p className="text-gray-500 text-sm">To</p>
                                                                        <p className="flex  justify-between font-medium"><CalendarIcon className="w-4 h-4 mt-1 text-gray-400" />
                                                                            {
                                                                                ticket.booking_hours ? ticket.booking_hours : ticket.end_date && new Date(ticket.end_date).toLocaleDateString()
                                                                            }
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            {
                                                                ticket.booking_hours &&
                                                                <div className="flex justify-between gap-2">
                                                                    <p className="text-gray-500 text-sm">Estimation</p>
                                                                    <p className="flex items-center font-medium"> <Clock className="w-4 h-4 text-gray-400" />
                                                                        {ticket.booking_hours}
                                                                    </p>
                                                                </div>
                                                            }
                                                        </div>

                                                        {/* Status */}
                                                        <div className="flex justify-between gap-2">
                                                            <div>status</div>

                                                            <Badge>{ticket.bookingStatus}</Badge>
                                                        </div>

                                                        {/* Driver Info */}
                                                        <div className="flex items-center gap-3 py-3 border-y">
                                                            <div className="w-10 h-10 bg-gray-200 rounded-full" />
                                                            <div>
                                                                <p className="font-medium">Mr. {`${ticket.user?.first_name} ${ticket.user?.middle_name ?? ""} ${ticket.user?.last_name}`}</p>
                                                                <p className="text-sm text-gray-500">Report at ${new Date(ticket.createdAt).toLocaleDateString()}</p>
                                                            </div>
                                                        </div>

                                                        {/* Timeline */}
                                                        <div className="space-y-6">
                                                            <div className="flex gap-3">
                                                                <div className="flex flex-col items-center">
                                                                    <div className={`w-3 h-3 rounded-full ${(ticket.bookingStatus === BookingStatus.Open) || (ticket.bookingStatus === BookingStatus.Accepted) || (ticket.bookingStatus === BookingStatus.Arriving) || (ticket.bookingStatus === BookingStatus.Arrived) || (ticket.bookingStatus === BookingStatus.Started) || (ticket.bookingStatus === BookingStatus.Stopped) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerPENDING")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerCONFIRMED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "OwnerREJECTED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "COMPLETED"))
                                                                        ? 'bg-green-500'
                                                                        : 'bg-yellow-400'
                                                                        }`} />
                                                                </div>

                                                                <div className="flex-1 pb-6">
                                                                    <div className="flex justify-between">
                                                                        <p className="font-medium">You just confirmed the booking</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            {
                                                                ticket.bookingStatus === BookingStatus.Open &&
                                                                <AssignOperator selectedRequest={ticket.id} storeId={ticket.store_id} store={ticket.store} />
                                                            }
                                                            <div className="flex gap-3">
                                                                <div className="flex flex-col items-center">
                                                                    <div className={`w-3 h-3 rounded-full ${(ticket.bookingStatus === BookingStatus.Accepted) || (ticket.bookingStatus === BookingStatus.Arriving) || (ticket.bookingStatus === BookingStatus.Arrived) || (ticket.bookingStatus === BookingStatus.Started) || (ticket.bookingStatus === BookingStatus.Stopped) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerPENDING")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerCONFIRMED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "OwnerREJECTED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "COMPLETED"))
                                                                        ? 'bg-green-500'
                                                                        : 'bg-yellow-400'
                                                                        }`} />
                                                                </div>

                                                                <div className="flex-1 pb-6">
                                                                    <div className="flex justify-between">
                                                                        <p className="font-medium">
                                                                            Operator has accepted this booking.
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-3">
                                                                <div className="flex flex-col items-center">
                                                                    <div className={`w-3 h-3 rounded-full ${(ticket.bookingStatus === BookingStatus.Arriving) || (ticket.bookingStatus === BookingStatus.Arrived) || (ticket.bookingStatus === BookingStatus.Started) || (ticket.bookingStatus === BookingStatus.Stopped) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerPENDING")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerCONFIRMED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "OwnerREJECTED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "COMPLETED"))
                                                                        ? 'bg-green-500'
                                                                        : 'bg-yellow-400'
                                                                        }`} />
                                                                </div>

                                                                <div className="flex-1 pb-6">
                                                                    <div className="flex justify-between">
                                                                        <p className="font-medium">
                                                                            The booking has left for it's destination.
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-3">
                                                                <div className="flex flex-col items-center">
                                                                    <div className={`w-3 h-3 rounded-full ${(ticket.bookingStatus === BookingStatus.Arrived) || (ticket.bookingStatus === BookingStatus.Started) || (ticket.bookingStatus === BookingStatus.Stopped) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerPENDING")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerCONFIRMED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "OwnerREJECTED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "COMPLETED"))
                                                                        ? 'bg-green-500'
                                                                        : 'bg-yellow-400'
                                                                        }`} />
                                                                </div>

                                                                <div className="flex-1 pb-6">
                                                                    <div className="flex justify-between">
                                                                        <p className="font-medium">
                                                                            The booking has arrived at it's destination.
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-3">
                                                                <div className="flex flex-col items-center">
                                                                    <div className={`w-3 h-3 rounded-full ${(ticket.bookingStatus === BookingStatus.Started) || (ticket.bookingStatus === BookingStatus.Stopped) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerPENDING")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerCONFIRMED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "OwnerREJECTED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "COMPLETED"))
                                                                        ? 'bg-green-500'
                                                                        : 'bg-yellow-400'
                                                                        }`} />
                                                                </div>

                                                                <div className="flex-1 pb-6">
                                                                    <div className="flex justify-between">
                                                                        <p className="font-medium">
                                                                            The booking has started it's work.
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-3">
                                                                <div className="flex flex-col items-center">
                                                                    <div className={`w-3 h-3 rounded-full ${((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerPENDING")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerCONFIRMED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "OwnerREJECTED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "COMPLETED"))
                                                                        ? 'bg-green-500'
                                                                        : 'bg-yellow-400'
                                                                        }`} />
                                                                </div>

                                                                <div className="flex-1 pb-6">
                                                                    <div className="flex justify-between">
                                                                        <p className="font-medium">
                                                                            The booking has completed. Wailting for farmer to pay.
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-3">
                                                                <div className="flex flex-col items-center">
                                                                    <div className={`w-3 h-3 rounded-full ${((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerCONFIRMED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "OwnerREJECTED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "COMPLETED"))
                                                                        ? 'bg-green-500'
                                                                        : 'bg-yellow-400'
                                                                        }`} />
                                                                </div>

                                                                <div className="flex-1 pb-6">
                                                                    <div className="flex justify-between">
                                                                        <p className="font-medium">
                                                                            FArmer has submitted payment details
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-3">
                                                                <div className="flex flex-col items-center">
                                                                    <div className={`w-3 h-3 rounded-full ${((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "OwnerREJECTED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "COMPLETED"))
                                                                        ? 'bg-green-500'
                                                                        : 'bg-yellow-400'
                                                                        }`} />
                                                                </div>

                                                                <div className="flex-1 pb-6">
                                                                    <div className="flex justify-between">
                                                                        <p className="font-medium">
                                                                            You have rejected the booking payment details.
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-3">
                                                                <div className="flex flex-col items-center">
                                                                    <div className={`w-3 h-3 rounded-full ${((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "COMPLETED"))
                                                                        ? 'bg-green-500'
                                                                        : 'bg-yellow-400'
                                                                        }`} />
                                                                </div>

                                                                <div className="flex-1 pb-6">
                                                                    <div className="flex justify-between">
                                                                        <p className="font-medium">
                                                                            The booking job has completed and you have accepted the payment.
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {
                                                        (ticket.payment.length > 0 && ticket.payment[0].status === PaymentStatus.FarmerCONFIRMED) && <PaymentReview
                                                            referenceNumber={ticket.payment[0].transaction_reference[ticket.payment[0].transaction_reference.length - 1]}
                                                            screenshotUrl={ticket.payment[0].screenshots[ticket.payment[0].screenshots.length - 1]}
                                                            paymentId={ticket.payment[0].id} />
                                                    }
                                                </SheetContent>
                                            </Sheet>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        }
                        {
                            selectedFilter === "unpaid" && allBookings.filter(bo => bo.payment.length > 0).filter(bo => ((bo.bookingStatus === BookingStatus.Finished) || (`${bo.payment[0].status}` === "FarmerPENDING") || (`${bo.payment[0].status}` === "OwnerREJECTED"))).map((ticket, i) => (
                                <Card
                                    key={i}
                                    className={cn(
                                        "py-4 hover:shadow-md transition-shadow"
                                    )}
                                >
                                    <CardContent>
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="text-lg font-medium">
                                                    #holabook{ticket.id.slice(-5)}
                                                </h3>
                                            </div>
                                            <span className="text-lg font-semibold text-green-500">
                                                ${ticket.total_cost.toFixed(2)}
                                            </span>
                                        </div>

                                        <div className="flex justify-between items-center mb-4">
                                            <div>
                                                <p className="font-medium">{new Date(ticket.start_date).toLocaleDateString()}</p>
                                                {/* <p className="text-sm text-blue-500">{ticket.from.time}</p> */}
                                            </div>
                                            <div className="grow mx-4 border-t-2 border-dashed border-gray-300" />
                                            <div className="text-right">
                                                <p className="font-medium">{ticket.booking_hours ? <span className="text-sm text-muted-foreground">
                                                    Duration: <span className="font-medium">{ticket.booking_hours === BookingHours.EIGHT_HOURS ? "8 hours" : ticket.booking_hours === BookingHours.SEVEN_HOURS ? "7 hours" : ticket.booking_hours === BookingHours.SIX_HOURS ? "6 hours" : ticket.booking_hours === BookingHours.FIVE_HOURS ? "5 hours" : ticket.booking_hours === BookingHours.FOUR_HOURS ? "4 hours" : ticket.booking_hours === BookingHours.THREE_HOURS ? "3 hours" : ticket.booking_hours === BookingHours.TWO_HOURS ? "2 hours" : "1 hour"}</span>
                                                </span> : ticket.end_date && new Date(ticket.end_date).toLocaleDateString()}</p>
                                                {/* <p className="text-sm text-blue-500">{ticket.to.time}</p> */}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-3 border-t">
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <Badge>
                                                    {ticket.bookingStatus}
                                                </Badge>
                                                <span className="px-3 py-1 bg-gray-50 rounded-full">
                                                    {`${ticket.user?.first_name} ${ticket.user?.middle_name ?? ""} ${ticket.user?.last_name}`}
                                                </span>
                                            </div>
                                            <Button variant="ghost" className="text-orange-500 hover:text-orange-600">
                                                <Share2 className="w-4 h-4 mr-2" />
                                                Share
                                            </Button>
                                            <Sheet>

                                                <SheetTrigger asChild>
                                                    <Button className="bg-primaryColor hover:bg-primaryColor">
                                                        View details
                                                    </Button>
                                                </SheetTrigger>

                                                <SheetContent className="overflow-auto" style={{ scrollbarWidth: "none" }}>
                                                    <SheetHeader>
                                                        <SheetTitle className="text-xl font-semibold">Details</SheetTitle>
                                                    </SheetHeader>

                                                    <div className="space-y-4 mt-6">
                                                        {/* Order Info */}
                                                        <div className="space-y-2">
                                                            <div className="flex justify-between text-sm">
                                                                <span className="text-gray-500">Id</span>
                                                                <span>#holabook{ticket.id.slice(-5)}</span>
                                                            </div>

                                                            <div className="space-y-1">
                                                                <div >

                                                                    <div className="flex justify-between gap-2">
                                                                        <p className="text-gray-500 text-sm">From</p>
                                                                        <p className="flex  font-medium"><CalendarIcon className="w-4 h-4 mt-1 text-gray-400" />
                                                                            {new Date(ticket.start_date).toLocaleDateString()}
                                                                        </p>
                                                                    </div>
                                                                </div>

                                                                <div >
                                                                    <div className="flex justify-between gap-2">
                                                                        <p className="text-gray-500 text-sm">To</p>
                                                                        <p className="flex  justify-between font-medium"><CalendarIcon className="w-4 h-4 mt-1 text-gray-400" />
                                                                            {
                                                                                ticket.booking_hours ? ticket.booking_hours : ticket.end_date && new Date(ticket.end_date).toLocaleDateString()
                                                                            }
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            {
                                                                ticket.booking_hours &&
                                                                <div className="flex justify-between gap-2">
                                                                    <p className="text-gray-500 text-sm">Estimation</p>
                                                                    <p className="flex items-center font-medium"> <Clock className="w-4 h-4 text-gray-400" />
                                                                        {ticket.booking_hours}
                                                                    </p>
                                                                </div>
                                                            }
                                                        </div>

                                                        {/* Status */}
                                                        <div className="flex justify-between gap-2">
                                                            <div>status</div>

                                                            <Badge>{ticket.bookingStatus}</Badge>
                                                        </div>

                                                        {/* Driver Info */}
                                                        <div className="flex items-center gap-3 py-3 border-y">
                                                            <div className="w-10 h-10 bg-gray-200 rounded-full" />
                                                            <div>
                                                                <p className="font-medium">Mr. {`${ticket.user?.first_name} ${ticket.user?.middle_name ?? ""} ${ticket.user?.last_name}`}</p>
                                                                <p className="text-sm text-gray-500">Report at ${new Date(ticket.createdAt).toLocaleDateString()}</p>
                                                            </div>
                                                        </div>

                                                        {/* Timeline */}
                                                        <div className="space-y-6">
                                                            <div className="flex gap-3">
                                                                <div className="flex flex-col items-center">
                                                                    <div className={`w-3 h-3 rounded-full ${(ticket.bookingStatus === BookingStatus.Open) || (ticket.bookingStatus === BookingStatus.Accepted) || (ticket.bookingStatus === BookingStatus.Arriving) || (ticket.bookingStatus === BookingStatus.Arrived) || (ticket.bookingStatus === BookingStatus.Started) || (ticket.bookingStatus === BookingStatus.Stopped) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerPENDING")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerCONFIRMED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "OwnerREJECTED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "COMPLETED"))
                                                                        ? 'bg-green-500'
                                                                        : 'bg-yellow-400'
                                                                        }`} />
                                                                </div>

                                                                <div className="flex-1 pb-6">
                                                                    <div className="flex justify-between">
                                                                        <p className="font-medium">You just confirmed the booking</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-3">
                                                                <div className="flex flex-col items-center">
                                                                    <div className={`w-3 h-3 rounded-full ${(ticket.bookingStatus === BookingStatus.Accepted) || (ticket.bookingStatus === BookingStatus.Arriving) || (ticket.bookingStatus === BookingStatus.Arrived) || (ticket.bookingStatus === BookingStatus.Started) || (ticket.bookingStatus === BookingStatus.Stopped) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerPENDING")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerCONFIRMED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "OwnerREJECTED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "COMPLETED"))
                                                                        ? 'bg-green-500'
                                                                        : 'bg-yellow-400'
                                                                        }`} />
                                                                </div>

                                                                <div className="flex-1 pb-6">
                                                                    <div className="flex justify-between">
                                                                        <p className="font-medium">
                                                                            Operator has accepted this booking.
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-3">
                                                                <div className="flex flex-col items-center">
                                                                    <div className={`w-3 h-3 rounded-full ${(ticket.bookingStatus === BookingStatus.Arriving) || (ticket.bookingStatus === BookingStatus.Arrived) || (ticket.bookingStatus === BookingStatus.Started) || (ticket.bookingStatus === BookingStatus.Stopped) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerPENDING")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerCONFIRMED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "OwnerREJECTED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "COMPLETED"))
                                                                        ? 'bg-green-500'
                                                                        : 'bg-yellow-400'
                                                                        }`} />
                                                                </div>

                                                                <div className="flex-1 pb-6">
                                                                    <div className="flex justify-between">
                                                                        <p className="font-medium">
                                                                            The booking has left for it's destination.
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-3">
                                                                <div className="flex flex-col items-center">
                                                                    <div className={`w-3 h-3 rounded-full ${(ticket.bookingStatus === BookingStatus.Arrived) || (ticket.bookingStatus === BookingStatus.Started) || (ticket.bookingStatus === BookingStatus.Stopped) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerPENDING")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerCONFIRMED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "OwnerREJECTED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "COMPLETED"))
                                                                        ? 'bg-green-500'
                                                                        : 'bg-yellow-400'
                                                                        }`} />
                                                                </div>

                                                                <div className="flex-1 pb-6">
                                                                    <div className="flex justify-between">
                                                                        <p className="font-medium">
                                                                            The booking has arrived at it's destination.
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-3">
                                                                <div className="flex flex-col items-center">
                                                                    <div className={`w-3 h-3 rounded-full ${(ticket.bookingStatus === BookingStatus.Started) || (ticket.bookingStatus === BookingStatus.Stopped) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerPENDING")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerCONFIRMED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "OwnerREJECTED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "COMPLETED"))
                                                                        ? 'bg-green-500'
                                                                        : 'bg-yellow-400'
                                                                        }`} />
                                                                </div>

                                                                <div className="flex-1 pb-6">
                                                                    <div className="flex justify-between">
                                                                        <p className="font-medium">
                                                                            The booking has started it's work.
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-3">
                                                                <div className="flex flex-col items-center">
                                                                    <div className={`w-3 h-3 rounded-full ${((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerPENDING")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerCONFIRMED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "OwnerREJECTED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "COMPLETED"))
                                                                        ? 'bg-green-500'
                                                                        : 'bg-yellow-400'
                                                                        }`} />
                                                                </div>

                                                                <div className="flex-1 pb-6">
                                                                    <div className="flex justify-between">
                                                                        <p className="font-medium">
                                                                            The booking has completed. Wailting for farmer to pay.
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-3">
                                                                <div className="flex flex-col items-center">
                                                                    <div className={`w-3 h-3 rounded-full ${((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerCONFIRMED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "OwnerREJECTED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "COMPLETED"))
                                                                        ? 'bg-green-500'
                                                                        : 'bg-yellow-400'
                                                                        }`} />
                                                                </div>

                                                                <div className="flex-1 pb-6">
                                                                    <div className="flex justify-between">
                                                                        <p className="font-medium">
                                                                            FArmer has submitted payment details
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-3">
                                                                <div className="flex flex-col items-center">
                                                                    <div className={`w-3 h-3 rounded-full ${((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "OwnerREJECTED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "COMPLETED"))
                                                                        ? 'bg-green-500'
                                                                        : 'bg-yellow-400'
                                                                        }`} />
                                                                </div>

                                                                <div className="flex-1 pb-6">
                                                                    <div className="flex justify-between">
                                                                        <p className="font-medium">
                                                                            You have rejected the booking payment details.
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-3">
                                                                <div className="flex flex-col items-center">
                                                                    <div className={`w-3 h-3 rounded-full ${((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "COMPLETED"))
                                                                        ? 'bg-green-500'
                                                                        : 'bg-yellow-400'
                                                                        }`} />
                                                                </div>

                                                                <div className="flex-1 pb-6">
                                                                    <div className="flex justify-between">
                                                                        <p className="font-medium">
                                                                            The booking job has completed and you have accepted the payment.
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {
                                                        ticket.bookingStatus === BookingStatus.Open &&
                                                        <AssignOperator selectedRequest={ticket.id} storeId={ticket.store_id} store={ticket.store} />
                                                    }
                                                    {
                                                        (ticket.payment.length > 0 && ticket.payment[0].status === PaymentStatus.FarmerCONFIRMED) && <PaymentReview
                                                            referenceNumber={ticket.payment[0].transaction_reference[ticket.payment[0].transaction_reference.length - 1]}
                                                            screenshotUrl={ticket.payment[0].screenshots[ticket.payment[0].screenshots.length - 1]}
                                                            paymentId={ticket.payment[0].id} />
                                                    }
                                                </SheetContent>
                                            </Sheet>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        }
                        {
                            selectedFilter === "review" && allBookings.filter(bo => bo.payment.length > 0).filter(bo => ((bo.bookingStatus === BookingStatus.Finished) || (`${bo.payment[0].status}` === "FarmerCONFIRMED"))).map((ticket, i) => (
                                <Card
                                    key={i}
                                    className={cn(
                                        "py-4 hover:shadow-md transition-shadow"
                                    )}
                                >
                                    <CardContent>
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="text-lg font-medium">
                                                    #holabook{ticket.id.slice(-5)}
                                                </h3>
                                            </div>
                                            <span className="text-lg font-semibold text-green-500">
                                                ${ticket.total_cost.toFixed(2)}
                                            </span>
                                        </div>

                                        <div className="flex justify-between items-center mb-4">
                                            <div>
                                                <p className="font-medium">{new Date(ticket.start_date).toLocaleDateString()}</p>
                                                {/* <p className="text-sm text-blue-500">{ticket.from.time}</p> */}
                                            </div>
                                            <div className="grow mx-4 border-t-2 border-dashed border-gray-300" />
                                            <div className="text-right">
                                                <p className="font-medium">{ticket.booking_hours ? <span className="text-sm text-muted-foreground">
                                                    Duration: <span className="font-medium">{ticket.booking_hours === BookingHours.EIGHT_HOURS ? "8 hours" : ticket.booking_hours === BookingHours.SEVEN_HOURS ? "7 hours" : ticket.booking_hours === BookingHours.SIX_HOURS ? "6 hours" : ticket.booking_hours === BookingHours.FIVE_HOURS ? "5 hours" : ticket.booking_hours === BookingHours.FOUR_HOURS ? "4 hours" : ticket.booking_hours === BookingHours.THREE_HOURS ? "3 hours" : ticket.booking_hours === BookingHours.TWO_HOURS ? "2 hours" : "1 hour"}</span>
                                                </span> : ticket.end_date && new Date(ticket.end_date).toLocaleDateString()}</p>
                                                {/* <p className="text-sm text-blue-500">{ticket.to.time}</p> */}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-3 border-t">
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <Badge>
                                                    {ticket.bookingStatus}
                                                </Badge>
                                                <span className="px-3 py-1 bg-gray-50 rounded-full">
                                                    {`${ticket.user?.first_name} ${ticket.user?.middle_name ?? ""} ${ticket.user?.last_name}`}
                                                </span>
                                            </div>
                                            <Button variant="ghost" className="text-orange-500 hover:text-orange-600">
                                                <Share2 className="w-4 h-4 mr-2" />
                                                Share
                                            </Button>
                                            <Sheet>

                                                <SheetTrigger asChild>
                                                    <Button className="bg-primaryColor hover:bg-primaryColor">
                                                        View details
                                                    </Button>
                                                </SheetTrigger>

                                                <SheetContent className="overflow-auto" style={{ scrollbarWidth: "none" }}>
                                                    <SheetHeader>
                                                        <SheetTitle className="text-xl font-semibold">Details</SheetTitle>
                                                    </SheetHeader>

                                                    <div className="space-y-4 mt-6">
                                                        {/* Order Info */}
                                                        <div className="space-y-2">
                                                            <div className="flex justify-between text-sm">
                                                                <span className="text-gray-500">Id</span>
                                                                <span>#holabook{ticket.id.slice(-5)}</span>
                                                            </div>

                                                            <div className="space-y-1">
                                                                <div >

                                                                    <div className="flex justify-between gap-2">
                                                                        <p className="text-gray-500 text-sm">From</p>
                                                                        <p className="flex  font-medium"><CalendarIcon className="w-4 h-4 mt-1 text-gray-400" />
                                                                            {new Date(ticket.start_date).toLocaleDateString()}
                                                                        </p>
                                                                    </div>
                                                                </div>

                                                                <div >
                                                                    <div className="flex justify-between gap-2">
                                                                        <p className="text-gray-500 text-sm">To</p>
                                                                        <p className="flex  justify-between font-medium"><CalendarIcon className="w-4 h-4 mt-1 text-gray-400" />
                                                                            {
                                                                                ticket.booking_hours ? ticket.booking_hours : ticket.end_date && new Date(ticket.end_date).toLocaleDateString()
                                                                            }
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            {
                                                                ticket.booking_hours &&
                                                                <div className="flex justify-between gap-2">
                                                                    <p className="text-gray-500 text-sm">Estimation</p>
                                                                    <p className="flex items-center font-medium"> <Clock className="w-4 h-4 text-gray-400" />
                                                                        {ticket.booking_hours}
                                                                    </p>
                                                                </div>
                                                            }
                                                        </div>

                                                        {/* Status */}
                                                        <div className="flex justify-between gap-2">
                                                            <div>status</div>

                                                            <Badge>{ticket.bookingStatus}</Badge>
                                                        </div>

                                                        {/* Driver Info */}
                                                        <div className="flex items-center gap-3 py-3 border-y">
                                                            <div className="w-10 h-10 bg-gray-200 rounded-full" />
                                                            <div>
                                                                <p className="font-medium">Mr. {`${ticket.user?.first_name} ${ticket.user?.middle_name ?? ""} ${ticket.user?.last_name}`}</p>
                                                                <p className="text-sm text-gray-500">Report at ${new Date(ticket.createdAt).toLocaleDateString()}</p>
                                                            </div>
                                                        </div>

                                                        {/* Timeline */}
                                                        <div className="space-y-6">
                                                            <div className="flex gap-3">
                                                                <div className="flex flex-col items-center">
                                                                    <div className={`w-3 h-3 rounded-full ${(ticket.bookingStatus === BookingStatus.Open) || (ticket.bookingStatus === BookingStatus.Accepted) || (ticket.bookingStatus === BookingStatus.Arriving) || (ticket.bookingStatus === BookingStatus.Arrived) || (ticket.bookingStatus === BookingStatus.Started) || (ticket.bookingStatus === BookingStatus.Stopped) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerPENDING")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerCONFIRMED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "OwnerREJECTED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "COMPLETED"))
                                                                        ? 'bg-green-500'
                                                                        : 'bg-yellow-400'
                                                                        }`} />
                                                                </div>

                                                                <div className="flex-1 pb-6">
                                                                    <div className="flex justify-between">
                                                                        <p className="font-medium">You just confirmed the booking</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-3">
                                                                <div className="flex flex-col items-center">
                                                                    <div className={`w-3 h-3 rounded-full ${(ticket.bookingStatus === BookingStatus.Accepted) || (ticket.bookingStatus === BookingStatus.Arriving) || (ticket.bookingStatus === BookingStatus.Arrived) || (ticket.bookingStatus === BookingStatus.Started) || (ticket.bookingStatus === BookingStatus.Stopped) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerPENDING")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerCONFIRMED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "OwnerREJECTED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "COMPLETED"))
                                                                        ? 'bg-green-500'
                                                                        : 'bg-yellow-400'
                                                                        }`} />
                                                                </div>

                                                                <div className="flex-1 pb-6">
                                                                    <div className="flex justify-between">
                                                                        <p className="font-medium">
                                                                            Operator has accepted this booking.
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-3">
                                                                <div className="flex flex-col items-center">
                                                                    <div className={`w-3 h-3 rounded-full ${(ticket.bookingStatus === BookingStatus.Arriving) || (ticket.bookingStatus === BookingStatus.Arrived) || (ticket.bookingStatus === BookingStatus.Started) || (ticket.bookingStatus === BookingStatus.Stopped) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerPENDING")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerCONFIRMED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "OwnerREJECTED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "COMPLETED"))
                                                                        ? 'bg-green-500'
                                                                        : 'bg-yellow-400'
                                                                        }`} />
                                                                </div>

                                                                <div className="flex-1 pb-6">
                                                                    <div className="flex justify-between">
                                                                        <p className="font-medium">
                                                                            The booking has left for it's destination.
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-3">
                                                                <div className="flex flex-col items-center">
                                                                    <div className={`w-3 h-3 rounded-full ${(ticket.bookingStatus === BookingStatus.Arrived) || (ticket.bookingStatus === BookingStatus.Started) || (ticket.bookingStatus === BookingStatus.Stopped) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerPENDING")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerCONFIRMED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "OwnerREJECTED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "COMPLETED"))
                                                                        ? 'bg-green-500'
                                                                        : 'bg-yellow-400'
                                                                        }`} />
                                                                </div>

                                                                <div className="flex-1 pb-6">
                                                                    <div className="flex justify-between">
                                                                        <p className="font-medium">
                                                                            The booking has arrived at it's destination.
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-3">
                                                                <div className="flex flex-col items-center">
                                                                    <div className={`w-3 h-3 rounded-full ${(ticket.bookingStatus === BookingStatus.Started) || (ticket.bookingStatus === BookingStatus.Stopped) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerPENDING")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerCONFIRMED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "OwnerREJECTED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "COMPLETED"))
                                                                        ? 'bg-green-500'
                                                                        : 'bg-yellow-400'
                                                                        }`} />
                                                                </div>

                                                                <div className="flex-1 pb-6">
                                                                    <div className="flex justify-between">
                                                                        <p className="font-medium">
                                                                            The booking has started it's work.
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-3">
                                                                <div className="flex flex-col items-center">
                                                                    <div className={`w-3 h-3 rounded-full ${((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerPENDING")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerCONFIRMED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "OwnerREJECTED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "COMPLETED"))
                                                                        ? 'bg-green-500'
                                                                        : 'bg-yellow-400'
                                                                        }`} />
                                                                </div>

                                                                <div className="flex-1 pb-6">
                                                                    <div className="flex justify-between">
                                                                        <p className="font-medium">
                                                                            The booking has completed. Wailting for farmer to pay.
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-3">
                                                                <div className="flex flex-col items-center">
                                                                    <div className={`w-3 h-3 rounded-full ${((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerCONFIRMED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "OwnerREJECTED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "COMPLETED"))
                                                                        ? 'bg-green-500'
                                                                        : 'bg-yellow-400'
                                                                        }`} />
                                                                </div>

                                                                <div className="flex-1 pb-6">
                                                                    <div className="flex justify-between">
                                                                        <p className="font-medium">
                                                                            FArmer has submitted payment details
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-3">
                                                                <div className="flex flex-col items-center">
                                                                    <div className={`w-3 h-3 rounded-full ${((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "OwnerREJECTED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "COMPLETED"))
                                                                        ? 'bg-green-500'
                                                                        : 'bg-yellow-400'
                                                                        }`} />
                                                                </div>

                                                                <div className="flex-1 pb-6">
                                                                    <div className="flex justify-between">
                                                                        <p className="font-medium">
                                                                            You have rejected the booking payment details.
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-3">
                                                                <div className="flex flex-col items-center">
                                                                    <div className={`w-3 h-3 rounded-full ${((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "COMPLETED"))
                                                                        ? 'bg-green-500'
                                                                        : 'bg-yellow-400'
                                                                        }`} />
                                                                </div>

                                                                <div className="flex-1 pb-6">
                                                                    <div className="flex justify-between">
                                                                        <p className="font-medium">
                                                                            The booking job has completed and you have accepted the payment.
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {
                                                        ticket.bookingStatus === BookingStatus.Open &&
                                                        <AssignOperator selectedRequest={ticket.id} storeId={ticket.store_id} store={ticket.store} />
                                                    }
                                                    {
                                                        (ticket.payment.length > 0 && ticket.payment[0].status === PaymentStatus.FarmerCONFIRMED) && <PaymentReview
                                                            referenceNumber={ticket.payment[0].transaction_reference[ticket.payment[0].transaction_reference.length - 1]}
                                                            screenshotUrl={ticket.payment[0].screenshots[ticket.payment[0].screenshots.length - 1]}
                                                            paymentId={ticket.payment[0].id} />
                                                    }
                                                </SheetContent>
                                            </Sheet>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        }
                        {
                            selectedFilter === "completed" && allBookings.filter(bo => bo.payment.length > 0).filter(bo => ((bo.bookingStatus === BookingStatus.Finished) || (`${bo.payment[0].status}` === "COMPLETED"))).map((ticket, i) => (
                                <Card
                                    key={i}
                                    className={cn(
                                        "py-4 hover:shadow-md transition-shadow"
                                    )}
                                >
                                    <CardContent>
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="text-lg font-medium">
                                                    #holabook{ticket.id.slice(-5)}
                                                </h3>
                                            </div>
                                            <span className="text-lg font-semibold text-green-500">
                                                ${ticket.total_cost.toFixed(2)}
                                            </span>
                                        </div>

                                        <div className="flex justify-between items-center mb-4">
                                            <div>
                                                <p className="font-medium">{new Date(ticket.start_date).toLocaleDateString()}</p>
                                                {/* <p className="text-sm text-blue-500">{ticket.from.time}</p> */}
                                            </div>
                                            <div className="grow mx-4 border-t-2 border-dashed border-gray-300" />
                                            <div className="text-right">
                                                <p className="font-medium">{ticket.booking_hours ? <span className="text-sm text-muted-foreground">
                                                    Duration: <span className="font-medium">{ticket.booking_hours === BookingHours.EIGHT_HOURS ? "8 hours" : ticket.booking_hours === BookingHours.SEVEN_HOURS ? "7 hours" : ticket.booking_hours === BookingHours.SIX_HOURS ? "6 hours" : ticket.booking_hours === BookingHours.FIVE_HOURS ? "5 hours" : ticket.booking_hours === BookingHours.FOUR_HOURS ? "4 hours" : ticket.booking_hours === BookingHours.THREE_HOURS ? "3 hours" : ticket.booking_hours === BookingHours.TWO_HOURS ? "2 hours" : "1 hour"}</span>
                                                </span> : ticket.end_date && new Date(ticket.end_date).toLocaleDateString()}</p>
                                                {/* <p className="text-sm text-blue-500">{ticket.to.time}</p> */}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-3 border-t">
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <Badge>
                                                    {ticket.bookingStatus}
                                                </Badge>
                                                <span className="px-3 py-1 bg-gray-50 rounded-full">
                                                    {`${ticket.user?.first_name} ${ticket.user?.middle_name ?? ""} ${ticket.user?.last_name}`}
                                                </span>
                                            </div>
                                            <Button variant="ghost" className="text-orange-500 hover:text-orange-600">
                                                <Share2 className="w-4 h-4 mr-2" />
                                                Share
                                            </Button>
                                            <Sheet>

                                                <SheetTrigger asChild>
                                                    <Button className="bg-primaryColor hover:bg-primaryColor">
                                                        View details
                                                    </Button>
                                                </SheetTrigger>

                                                <SheetContent className="overflow-auto" style={{ scrollbarWidth: "none" }}>
                                                    <SheetHeader>
                                                        <SheetTitle className="text-xl font-semibold">Details</SheetTitle>
                                                    </SheetHeader>

                                                    <div className="space-y-4 mt-6">
                                                        {/* Order Info */}
                                                        <div className="space-y-2">
                                                            <div className="flex justify-between text-sm">
                                                                <span className="text-gray-500">Id</span>
                                                                <span>#holabook{ticket.id.slice(-5)}</span>
                                                            </div>

                                                            <div className="space-y-1">
                                                                <div >

                                                                    <div className="flex justify-between gap-2">
                                                                        <p className="text-gray-500 text-sm">From</p>
                                                                        <p className="flex  font-medium"><CalendarIcon className="w-4 h-4 mt-1 text-gray-400" />
                                                                            {new Date(ticket.start_date).toLocaleDateString()}
                                                                        </p>
                                                                    </div>
                                                                </div>

                                                                <div >
                                                                    <div className="flex justify-between gap-2">
                                                                        <p className="text-gray-500 text-sm">To</p>
                                                                        <p className="flex  justify-between font-medium"><CalendarIcon className="w-4 h-4 mt-1 text-gray-400" />
                                                                            {
                                                                                ticket.booking_hours ? ticket.booking_hours : ticket.end_date && new Date(ticket.end_date).toLocaleDateString()
                                                                            }
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            {
                                                                ticket.booking_hours &&
                                                                <div className="flex justify-between gap-2">
                                                                    <p className="text-gray-500 text-sm">Estimation</p>
                                                                    <p className="flex items-center font-medium"> <Clock className="w-4 h-4 text-gray-400" />
                                                                        {ticket.booking_hours}
                                                                    </p>
                                                                </div>
                                                            }
                                                        </div>

                                                        {/* Status */}
                                                        <div className="flex justify-between gap-2">
                                                            <div>status</div>

                                                            <Badge>{ticket.bookingStatus}</Badge>
                                                        </div>

                                                        {/* Driver Info */}
                                                        <div className="flex items-center gap-3 py-3 border-y">
                                                            <div className="w-10 h-10 bg-gray-200 rounded-full" />
                                                            <div>
                                                                <p className="font-medium">Mr. {`${ticket.user?.first_name} ${ticket.user?.middle_name ?? ""} ${ticket.user?.last_name}`}</p>
                                                                <p className="text-sm text-gray-500">Report at ${new Date(ticket.createdAt).toLocaleDateString()}</p>
                                                            </div>
                                                        </div>

                                                        {/* Timeline */}
                                                        <div className="space-y-6">
                                                            <div className="flex gap-3">
                                                                <div className="flex flex-col items-center">
                                                                    <div className={`w-3 h-3 rounded-full ${(ticket.bookingStatus === BookingStatus.Open) || (ticket.bookingStatus === BookingStatus.Accepted) || (ticket.bookingStatus === BookingStatus.Arriving) || (ticket.bookingStatus === BookingStatus.Arrived) || (ticket.bookingStatus === BookingStatus.Started) || (ticket.bookingStatus === BookingStatus.Stopped) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerPENDING")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerCONFIRMED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "OwnerREJECTED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "COMPLETED"))
                                                                        ? 'bg-green-500'
                                                                        : 'bg-yellow-400'
                                                                        }`} />
                                                                </div>

                                                                <div className="flex-1 pb-6">
                                                                    <div className="flex justify-between">
                                                                        <p className="font-medium">You just confirmed the booking</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-3">
                                                                <div className="flex flex-col items-center">
                                                                    <div className={`w-3 h-3 rounded-full ${(ticket.bookingStatus === BookingStatus.Accepted) || (ticket.bookingStatus === BookingStatus.Arriving) || (ticket.bookingStatus === BookingStatus.Arrived) || (ticket.bookingStatus === BookingStatus.Started) || (ticket.bookingStatus === BookingStatus.Stopped) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerPENDING")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerCONFIRMED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "OwnerREJECTED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "COMPLETED"))
                                                                        ? 'bg-green-500'
                                                                        : 'bg-yellow-400'
                                                                        }`} />
                                                                </div>

                                                                <div className="flex-1 pb-6">
                                                                    <div className="flex justify-between">
                                                                        <p className="font-medium">
                                                                            Operator has accepted this booking.
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-3">
                                                                <div className="flex flex-col items-center">
                                                                    <div className={`w-3 h-3 rounded-full ${(ticket.bookingStatus === BookingStatus.Arriving) || (ticket.bookingStatus === BookingStatus.Arrived) || (ticket.bookingStatus === BookingStatus.Started) || (ticket.bookingStatus === BookingStatus.Stopped) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerPENDING")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerCONFIRMED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "OwnerREJECTED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "COMPLETED"))
                                                                        ? 'bg-green-500'
                                                                        : 'bg-yellow-400'
                                                                        }`} />
                                                                </div>

                                                                <div className="flex-1 pb-6">
                                                                    <div className="flex justify-between">
                                                                        <p className="font-medium">
                                                                            The booking has left for it's destination.
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-3">
                                                                <div className="flex flex-col items-center">
                                                                    <div className={`w-3 h-3 rounded-full ${(ticket.bookingStatus === BookingStatus.Arrived) || (ticket.bookingStatus === BookingStatus.Started) || (ticket.bookingStatus === BookingStatus.Stopped) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerPENDING")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerCONFIRMED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "OwnerREJECTED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "COMPLETED"))
                                                                        ? 'bg-green-500'
                                                                        : 'bg-yellow-400'
                                                                        }`} />
                                                                </div>

                                                                <div className="flex-1 pb-6">
                                                                    <div className="flex justify-between">
                                                                        <p className="font-medium">
                                                                            The booking has arrived at it's destination.
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-3">
                                                                <div className="flex flex-col items-center">
                                                                    <div className={`w-3 h-3 rounded-full ${(ticket.bookingStatus === BookingStatus.Started) || (ticket.bookingStatus === BookingStatus.Stopped) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerPENDING")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerCONFIRMED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "OwnerREJECTED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "COMPLETED"))
                                                                        ? 'bg-green-500'
                                                                        : 'bg-yellow-400'
                                                                        }`} />
                                                                </div>

                                                                <div className="flex-1 pb-6">
                                                                    <div className="flex justify-between">
                                                                        <p className="font-medium">
                                                                            The booking has started it's work.
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-3">
                                                                <div className="flex flex-col items-center">
                                                                    <div className={`w-3 h-3 rounded-full ${((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerPENDING")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerCONFIRMED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "OwnerREJECTED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "COMPLETED"))
                                                                        ? 'bg-green-500'
                                                                        : 'bg-yellow-400'
                                                                        }`} />
                                                                </div>

                                                                <div className="flex-1 pb-6">
                                                                    <div className="flex justify-between">
                                                                        <p className="font-medium">
                                                                            The booking has completed. Wailting for farmer to pay.
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-3">
                                                                <div className="flex flex-col items-center">
                                                                    <div className={`w-3 h-3 rounded-full ${((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerCONFIRMED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "OwnerREJECTED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "COMPLETED"))
                                                                        ? 'bg-green-500'
                                                                        : 'bg-yellow-400'
                                                                        }`} />
                                                                </div>

                                                                <div className="flex-1 pb-6">
                                                                    <div className="flex justify-between">
                                                                        <p className="font-medium">
                                                                            FArmer has submitted payment details
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-3">
                                                                <div className="flex flex-col items-center">
                                                                    <div className={`w-3 h-3 rounded-full ${((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "OwnerREJECTED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "COMPLETED"))
                                                                        ? 'bg-green-500'
                                                                        : 'bg-yellow-400'
                                                                        }`} />
                                                                </div>

                                                                <div className="flex-1 pb-6">
                                                                    <div className="flex justify-between">
                                                                        <p className="font-medium">
                                                                            You have rejected the booking payment details.
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-3">
                                                                <div className="flex flex-col items-center">
                                                                    <div className={`w-3 h-3 rounded-full ${((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "COMPLETED"))
                                                                        ? 'bg-green-500'
                                                                        : 'bg-yellow-400'
                                                                        }`} />
                                                                </div>

                                                                <div className="flex-1 pb-6">
                                                                    <div className="flex justify-between">
                                                                        <p className="font-medium">
                                                                            The booking job has completed and you have accepted the payment.
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {
                                                        ticket.bookingStatus === BookingStatus.Open &&
                                                        <AssignOperator selectedRequest={ticket.id} storeId={ticket.store_id} store={ticket.store} />
                                                    }
                                                    {
                                                        (ticket.payment.length > 0 && ticket.payment[0].status === PaymentStatus.FarmerCONFIRMED) && <PaymentReview
                                                            referenceNumber={ticket.payment[0].transaction_reference[ticket.payment[0].transaction_reference.length - 1]}
                                                            screenshotUrl={ticket.payment[0].screenshots[ticket.payment[0].screenshots.length - 1]}
                                                            paymentId={ticket.payment[0].id} />
                                                    }
                                                </SheetContent>
                                            </Sheet>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        }
                        {
                            selectedFilter === "rejected" && allBookings.filter(bo => (bo.bookingStatus === BookingStatus.Rejected)).map((ticket, i) => (
                                <Card
                                    key={i}
                                    className={cn(
                                        "py-4 hover:shadow-md transition-shadow"
                                    )}
                                >
                                    <CardContent>
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="text-lg font-medium">
                                                    #holabook{ticket.id.slice(-5)}
                                                </h3>
                                            </div>
                                            <span className="text-lg font-semibold text-green-500">
                                                ${ticket.total_cost.toFixed(2)}
                                            </span>
                                        </div>

                                        <div className="flex justify-between items-center mb-4">
                                            <div>
                                                <p className="font-medium">{new Date(ticket.start_date).toLocaleDateString()}</p>
                                                {/* <p className="text-sm text-blue-500">{ticket.from.time}</p> */}
                                            </div>
                                            <div className="grow mx-4 border-t-2 border-dashed border-gray-300" />
                                            <div className="text-right">
                                                <p className="font-medium">{ticket.booking_hours ? <span className="text-sm text-muted-foreground">
                                                    Duration: <span className="font-medium">{ticket.booking_hours === BookingHours.EIGHT_HOURS ? "8 hours" : ticket.booking_hours === BookingHours.SEVEN_HOURS ? "7 hours" : ticket.booking_hours === BookingHours.SIX_HOURS ? "6 hours" : ticket.booking_hours === BookingHours.FIVE_HOURS ? "5 hours" : ticket.booking_hours === BookingHours.FOUR_HOURS ? "4 hours" : ticket.booking_hours === BookingHours.THREE_HOURS ? "3 hours" : ticket.booking_hours === BookingHours.TWO_HOURS ? "2 hours" : "1 hour"}</span>
                                                </span> : ticket.end_date && new Date(ticket.end_date).toLocaleDateString()}</p>
                                                {/* <p className="text-sm text-blue-500">{ticket.to.time}</p> */}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-3 border-t">
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <Badge>
                                                    {ticket.bookingStatus}
                                                </Badge>
                                                <span className="px-3 py-1 bg-gray-50 rounded-full">
                                                    {`${ticket.user?.first_name} ${ticket.user?.middle_name ?? ""} ${ticket.user?.last_name}`}
                                                </span>
                                            </div>
                                            <Button variant="ghost" className="text-orange-500 hover:text-orange-600">
                                                <Share2 className="w-4 h-4 mr-2" />
                                                Share
                                            </Button>
                                            <Sheet>

                                                <SheetTrigger asChild>
                                                    <Button className="bg-primaryColor hover:bg-primaryColor">
                                                        View details
                                                    </Button>
                                                </SheetTrigger>

                                                <SheetContent className="overflow-auto" style={{ scrollbarWidth: "none" }}>
                                                    <SheetHeader>
                                                        <SheetTitle className="text-xl font-semibold">Details</SheetTitle>
                                                    </SheetHeader>

                                                    <div className="space-y-4 mt-6">
                                                        {/* Order Info */}
                                                        <div className="space-y-2">
                                                            <div className="flex justify-between text-sm">
                                                                <span className="text-gray-500">Id</span>
                                                                <span>#holabook{ticket.id.slice(-5)}</span>
                                                            </div>

                                                            <div className="space-y-1">
                                                                <div >

                                                                    <div className="flex justify-between gap-2">
                                                                        <p className="text-gray-500 text-sm">From</p>
                                                                        <p className="flex  font-medium"><CalendarIcon className="w-4 h-4 mt-1 text-gray-400" />
                                                                            {new Date(ticket.start_date).toLocaleDateString()}
                                                                        </p>
                                                                    </div>
                                                                </div>

                                                                <div >
                                                                    <div className="flex justify-between gap-2">
                                                                        <p className="text-gray-500 text-sm">To</p>
                                                                        <p className="flex  justify-between font-medium"><CalendarIcon className="w-4 h-4 mt-1 text-gray-400" />
                                                                            {
                                                                                ticket.booking_hours ? ticket.booking_hours : ticket.end_date && new Date(ticket.end_date).toLocaleDateString()
                                                                            }
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            {
                                                                ticket.booking_hours &&
                                                                <div className="flex justify-between gap-2">
                                                                    <p className="text-gray-500 text-sm">Estimation</p>
                                                                    <p className="flex items-center font-medium"> <Clock className="w-4 h-4 text-gray-400" />
                                                                        {ticket.booking_hours}
                                                                    </p>
                                                                </div>
                                                            }
                                                        </div>

                                                        {/* Status */}
                                                        <div className="flex justify-between gap-2">
                                                            <div>status</div>

                                                            <Badge>{ticket.bookingStatus}</Badge>
                                                        </div>

                                                        {/* Driver Info */}
                                                        <div className="flex items-center gap-3 py-3 border-y">
                                                            <div className="w-10 h-10 bg-gray-200 rounded-full" />
                                                            <div>
                                                                <p className="font-medium">Mr. {`${ticket.user?.first_name} ${ticket.user?.middle_name ?? ""} ${ticket.user?.last_name}`}</p>
                                                                <p className="text-sm text-gray-500">Report at ${new Date(ticket.createdAt).toLocaleDateString()}</p>
                                                            </div>
                                                        </div>

                                                        {/* Timeline */}
                                                        <div className="space-y-6">
                                                            <div className="flex gap-3">
                                                                <div className="flex flex-col items-center">
                                                                    <div className={`w-3 h-3 rounded-full ${(ticket.bookingStatus === BookingStatus.Open) || (ticket.bookingStatus === BookingStatus.Accepted) || (ticket.bookingStatus === BookingStatus.Arriving) || (ticket.bookingStatus === BookingStatus.Arrived) || (ticket.bookingStatus === BookingStatus.Started) || (ticket.bookingStatus === BookingStatus.Stopped) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerPENDING")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerCONFIRMED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "OwnerREJECTED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "COMPLETED"))
                                                                        ? 'bg-green-500'
                                                                        : 'bg-yellow-400'
                                                                        }`} />
                                                                </div>

                                                                <div className="flex-1 pb-6">
                                                                    <div className="flex justify-between">
                                                                        <p className="font-medium">You just confirmed the booking</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-3">
                                                                <div className="flex flex-col items-center">
                                                                    <div className={`w-3 h-3 rounded-full ${(ticket.bookingStatus === BookingStatus.Accepted) || (ticket.bookingStatus === BookingStatus.Arriving) || (ticket.bookingStatus === BookingStatus.Arrived) || (ticket.bookingStatus === BookingStatus.Started) || (ticket.bookingStatus === BookingStatus.Stopped) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerPENDING")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerCONFIRMED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "OwnerREJECTED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "COMPLETED"))
                                                                        ? 'bg-green-500'
                                                                        : 'bg-yellow-400'
                                                                        }`} />
                                                                </div>

                                                                <div className="flex-1 pb-6">
                                                                    <div className="flex justify-between">
                                                                        <p className="font-medium">
                                                                            Operator has accepted this booking.
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-3">
                                                                <div className="flex flex-col items-center">
                                                                    <div className={`w-3 h-3 rounded-full ${(ticket.bookingStatus === BookingStatus.Arriving) || (ticket.bookingStatus === BookingStatus.Arrived) || (ticket.bookingStatus === BookingStatus.Started) || (ticket.bookingStatus === BookingStatus.Stopped) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerPENDING")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerCONFIRMED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "OwnerREJECTED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "COMPLETED"))
                                                                        ? 'bg-green-500'
                                                                        : 'bg-yellow-400'
                                                                        }`} />
                                                                </div>

                                                                <div className="flex-1 pb-6">
                                                                    <div className="flex justify-between">
                                                                        <p className="font-medium">
                                                                            The booking has left for it's destination.
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-3">
                                                                <div className="flex flex-col items-center">
                                                                    <div className={`w-3 h-3 rounded-full ${(ticket.bookingStatus === BookingStatus.Arrived) || (ticket.bookingStatus === BookingStatus.Started) || (ticket.bookingStatus === BookingStatus.Stopped) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerPENDING")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerCONFIRMED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "OwnerREJECTED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "COMPLETED"))
                                                                        ? 'bg-green-500'
                                                                        : 'bg-yellow-400'
                                                                        }`} />
                                                                </div>

                                                                <div className="flex-1 pb-6">
                                                                    <div className="flex justify-between">
                                                                        <p className="font-medium">
                                                                            The booking has arrived at it's destination.
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-3">
                                                                <div className="flex flex-col items-center">
                                                                    <div className={`w-3 h-3 rounded-full ${(ticket.bookingStatus === BookingStatus.Started) || (ticket.bookingStatus === BookingStatus.Stopped) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerPENDING")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerCONFIRMED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "OwnerREJECTED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "COMPLETED"))
                                                                        ? 'bg-green-500'
                                                                        : 'bg-yellow-400'
                                                                        }`} />
                                                                </div>

                                                                <div className="flex-1 pb-6">
                                                                    <div className="flex justify-between">
                                                                        <p className="font-medium">
                                                                            The booking has started it's work.
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-3">
                                                                <div className="flex flex-col items-center">
                                                                    <div className={`w-3 h-3 rounded-full ${((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerPENDING")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerCONFIRMED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "OwnerREJECTED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "COMPLETED"))
                                                                        ? 'bg-green-500'
                                                                        : 'bg-yellow-400'
                                                                        }`} />
                                                                </div>

                                                                <div className="flex-1 pb-6">
                                                                    <div className="flex justify-between">
                                                                        <p className="font-medium">
                                                                            The booking has completed. Wailting for farmer to pay.
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-3">
                                                                <div className="flex flex-col items-center">
                                                                    <div className={`w-3 h-3 rounded-full ${((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerCONFIRMED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "OwnerREJECTED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "COMPLETED"))
                                                                        ? 'bg-green-500'
                                                                        : 'bg-yellow-400'
                                                                        }`} />
                                                                </div>

                                                                <div className="flex-1 pb-6">
                                                                    <div className="flex justify-between">
                                                                        <p className="font-medium">
                                                                            FArmer has submitted payment details
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-3">
                                                                <div className="flex flex-col items-center">
                                                                    <div className={`w-3 h-3 rounded-full ${((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "OwnerREJECTED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "COMPLETED"))
                                                                        ? 'bg-green-500'
                                                                        : 'bg-yellow-400'
                                                                        }`} />
                                                                </div>

                                                                <div className="flex-1 pb-6">
                                                                    <div className="flex justify-between">
                                                                        <p className="font-medium">
                                                                            You have rejected the booking payment details.
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-3">
                                                                <div className="flex flex-col items-center">
                                                                    <div className={`w-3 h-3 rounded-full ${((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "COMPLETED"))
                                                                        ? 'bg-green-500'
                                                                        : 'bg-yellow-400'
                                                                        }`} />
                                                                </div>

                                                                <div className="flex-1 pb-6">
                                                                    <div className="flex justify-between">
                                                                        <p className="font-medium">
                                                                            The booking job has completed and you have accepted the payment.
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {
                                                        ticket.bookingStatus === BookingStatus.Open &&
                                                        <AssignOperator selectedRequest={ticket.id} storeId={ticket.store_id} store={ticket.store} />
                                                    }
                                                    {
                                                        (ticket.payment.length > 0 && ticket.payment[0].status === PaymentStatus.FarmerCONFIRMED) && <PaymentReview
                                                            referenceNumber={ticket.payment[0].transaction_reference[ticket.payment[0].transaction_reference.length - 1]}
                                                            screenshotUrl={ticket.payment[0].screenshots[ticket.payment[0].screenshots.length - 1]}
                                                            paymentId={ticket.payment[0].id} />
                                                    }
                                                </SheetContent>
                                            </Sheet>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        }
                    </div>
                </div>

                {/* Right Section - Map & Statistics */}
                <div className="w-3/5 p-4 bg-white shadow overflow-auto" style={{ scrollbarWidth: "none" }} ref={rightSectionRef}>
                    <div className="h-full flex flex-col">
                        {/* Map */}

                        <div className="mb-4 flex-grow mt-3">
                            <div className="map-container w-full h-64 lg:h-96 rounded-lg shadow-md overflow-hidden">
                                {
                                    error ? <p>Error: {error}</p> :
                                        (location.latitude && location.longitude) ?
                                            <MapContainer
                                                center={[location.latitude, location.longitude]}
                                                zoom={13}
                                                scrollWheelZoom={false}
                                                style={{ height: "100%", width: "100%", zIndex: 1 }}
                                            >
                                                <TileLayer
                                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                                />
                                            </MapContainer>
                                            :
                                            <p>Latitude and longitude not available</p>
                                }

                            </div>
                        </div>

                        {/* Statistics */}
                        <div className="space-y-6 mt-6">
                            {/* Navigation Tabs */}
                            {/* <div className="flex justify-between border-b">
                                {["Details", "Amenities", "Statistics", "Route", "Reviews"].map((tab) => (
                                    <Button
                                        key={tab}
                                        variant="ghost"
                                        onClick={() => setActiveTab(tab)}
                                        className={`px-4 py-2 -mb-px ${tab === activeTab
                                            ? "border-b-2 border-blue-500 text-blue-600"
                                            : "text-gray-500"
                                            }`}
                                    >
                                        {tab}
                                    </Button>
                                ))}
                            </div> */}

                            {/* Tab Content */}
                            <div className="space-y-4">
                                <div>
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-medium">Popular times</h3>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className={`rounded-full ${timeRange === "last30" ? "bg-gray-100" : ""
                                                    }`}
                                                onClick={() => setTimeRange("last30")}
                                            >
                                                Last 30 days
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className={`rounded-full ${dayFilter === "sunday" ? "bg-gray-100" : ""
                                                    }`}
                                                onClick={() => setDayFilter("sunday")}
                                            >
                                                Sunday
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Chart Card */}
                                    <Card className="p-4 mt-5">
                                        <CardContent className="pt-4">
                                            <ResponsiveContainer width="100%" height={300}>
                                                <BarChart data={chartData[timeRange as keyof typeof chartData]} barSize={40}>
                                                    <CartesianGrid vertical={false} stroke="#f0f0f0" />
                                                    <XAxis
                                                        dataKey="time"
                                                        axisLine={false}
                                                        tickLine={false}
                                                        dy={10}
                                                    />
                                                    <YAxis
                                                        axisLine={false}
                                                        tickLine={false}
                                                        ticks={[200, 400, 600, 800]}
                                                        dx={-10}
                                                    />
                                                    <Tooltip
                                                        cursor={false}
                                                        content={({ active, payload }) => {
                                                            if (active && payload && payload.length) {
                                                                return (
                                                                    <div className="bg-white p-2 shadow-lg rounded border">
                                                                        <p className="text-sm">
                                                                            Average passengers
                                                                            <br />
                                                                            {payload[0].payload.time}, 2022
                                                                        </p>
                                                                        <p className="text-sm font-bold">
                                                                            {payload[0].value}{" "}
                                                                            <span className="text-green-500">12%</span>
                                                                        </p>
                                                                    </div>
                                                                );
                                                            }
                                                            return null;
                                                        }}
                                                    />
                                                    <Bar
                                                        dataKey="passengers"
                                                        fill="#1a73e8"
                                                        radius={[4, 4, 0, 0]}
                                                        background={{ fill: "#f8f9fa" }}
                                                    />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </div>


                    </div>
                </div>
            </div>
        </div>
    );
}

export default Bookings