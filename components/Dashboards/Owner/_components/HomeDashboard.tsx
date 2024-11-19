"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import './Home.css'
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { MapContainer, TileLayer, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';  // Import leaflet styles
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Check, Tractor as TractorIcon, Smartphone, Wrench } from "lucide-react"
import { Pie, PieChart, Cell, ResponsiveContainer } from "recharts"
import 'keen-slider/keen-slider.min.css';
import Link from 'next/link';
import { Attachment, Booking, OperatorInStore, Store, Tractor } from '@/utils/Types/types'
import { Pagination, Autoplay } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/autoplay';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/scrollbar';
import { Button } from '@/components/ui/button'
import {
    Card,
    CardFooter,
    CardHeader,
    CardContent,
    CardTitle,
} from "@/components/ui/card"
import {
    ChartContainer,
} from "@/components/ui/chart"
import { Avatar, AvatarImage } from "@/components/ui/avatar"
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';

// Register components with Chart.js
ChartJS.register(ArcElement, Tooltip, Legend);

interface Location {
    latitude: number | null;
    longitude: number | null;
}

const chartData = [
    { status: "Active", count: 75, fill: "#4caf50" },  // Active accounts (Green)
    { status: "Inactive", count: 25, fill: "#f44336" }, // Inactive accounts (Red)
]

const chartConfig = {
    active: {
        label: "Active",
        color: "#13b8a7", // Green for active accounts
    },
    inactive: {
        label: "Inactive",
        color: "#FF474D", // Red for inactive accounts
    },
}

const HomeDashboard = (
    {
        stores,
        operators,
        tractors,
        attachments,
        bookings
    }: {
        stores: Store[];
        operators: OperatorInStore[];
        tractors: Tractor[];
        attachments: Attachment[];
        bookings: Booking[]
    }
) => {
    const [slideIndex, setSlideIndex] = useState(0);

    const [location, setLocation] = useState<Location>({ latitude: null, longitude: null });
    const [error, setError] = useState<string | null>(null);

    const totalDevices = chartData.reduce((sum, item) => sum + item.count, 0)
    const activeDevices = chartData.find(item => item.status === "Active")?.count || 0

    const totalSlides = operators.length;

    const handleNext = () => {
        setSlideIndex((prevIndex) => (prevIndex + 1) % totalSlides);
    };

    const handlePrev = () => {
        setSlideIndex((prevIndex) => (prevIndex - 1 + totalSlides) % totalSlides);
    };

    const tractorData = {
        total: 2540,
        inUse: 2350
    }

    const attachmentData = {
        total: 1500,
        inUse: 1200
    }

    const calculateProgress = (inUse: number, total: number) => {
        return (inUse / total) * 100
    }

    const tractorProgress = calculateProgress(tractorData.inUse, tractorData.total)
    const attachmentProgress = calculateProgress(attachmentData.inUse, attachmentData.total)

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

    return (
        <div className="mt-6">
            {/* First Row with 2 cards having background images */}
            <div className="grid grid-cols-1 1050px:grid-cols-2 gap-6">
                {/* First Card with Swiper */}
                <div className="relative rounded-[20px] h-80 1600px:h-96 overflow-hidden">
                    {/* Slider with only changing images */}
                    <Swiper
                        modules={[Autoplay, Pagination]}
                        spaceBetween={0}
                        slidesPerView={1}
                        loop={true}
                        pagination={true}
                        autoplay={true}
                        className="w-full h-full"
                    >
                        {stores.map((details, i) => {
                            return (
                                <SwiperSlide key={i} className="w-full h-full">
                                    <div className="relative flex items-center justify-center w-full h-full">
                                        <Image
                                            src={details.image}
                                            alt={details.name}
                                            className="w-full h-full object-cover rounded-xl absolute top-0 left-0 z-[-2]"
                                            width={300}
                                            height={400}
                                            unoptimized={true}
                                        />
                                        <div className="absolute top-0 left-0 z-[-1] bg-black/20 w-full h-full" />
                                        <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center justify-between">
                                            {/* Overlapping User Images */}
                                            {
                                                bookings.length === 0 ?
                                                    <span className="hidden 768px:block text-white text-lg font-bold ml-4 text-center mt-3">
                                                        No bookings have completed till now
                                                    </span>
                                                    :
                                                    <div className="hidden 768px:flex pointer-events-auto">
                                                        {
                                                            bookings.map((book, index) => {
                                                                if (index >= 3) return null
                                                                return (
                                                                    <div
                                                                        className="w-12 h-12 rounded-full border-2 border-white overflow-hidden relative -mr-6"
                                                                        style={{ zIndex: 3 }}
                                                                    >
                                                                        <Image
                                                                            src={book.user.image ? book.user.image : "https://github.com/shadcn.png"}
                                                                            alt={book.user.first_name}
                                                                            className="w-full h-full object-cover"
                                                                            width={50}
                                                                            height={50}
                                                                            unoptimized={true}
                                                                        />
                                                                    </div>
                                                                )
                                                            })
                                                        }
                                                        <span className="text-white text-lg font-bold ml-8 text-center mt-3">
                                                            + {bookings.length - 3} has booked
                                                        </span>
                                                    </div>
                                            }

                                            {/* Open Store Button */}
                                            <Link href={`/owner/stores/${details.id}`} className="mx-auto 768px:mx-0">
                                                <Button
                                                    className="inline-flex items-center px-6 py-3 text-white font-bold bg-black rounded-full shadow-lg border-2 border-transparent transition-all duration-300 transform hover:scale-105 group pointer-events-auto">
                                                    Open Store
                                                    <svg
                                                        fill="currentColor"
                                                        viewBox="0 0 24 24"
                                                        className="ml-2 w-6 h-6 transition-all duration-300 group-hover:translate-x-2"
                                                    >
                                                        <path
                                                            clipRule="evenodd"
                                                            d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm4.28 10.28a.75.75 0 000-1.06l-3-3a.75.75 0 10-1.06 1.06l1.72 1.72H8.25a.75.75 0 000 1.5h5.69l-1.72 1.72a.75.75 0 101.06 1.06l3-3z"
                                                            fillRule="evenodd"
                                                        />
                                                    </svg>
                                                </Button>
                                            </Link>
                                        </div>
                                        <h1 className="text-xl md:text-3xl font-bold text-white">{details.name}</h1>
                                    </div>
                                </SwiperSlide>
                            );
                        })}
                    </Swiper>
                </div>

                {/* Second Card */}
                <div className="p-0 rounded-[20px] shadow-lg h-80 1600px:h-96 w-full">
                    {/* OpenStreetMap Integration */}
                    {
                        (location.latitude && location.longitude) ?
                            <MapContainer
                                center={[location.latitude, location.longitude]}
                                zoom={6}
                                scrollWheelZoom={false}
                                className="h-full w-full rounded-[20px]">
                                <TileLayer
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                />
                            </MapContainer>
                            :
                            <p>Please enable location details</p>
                    }
                </div>

            </div>


            <div className="grid grid-cols-1 1050px:grid-cols-2 1200px:grid-cols-3 gap-6 mt-6" style={{ backgroundColor: '#EAF6FA' }}>

                {
                    operators.length !== 0 &&
                    <Card className="w-full shadow-lg rounded-2xl">
                        <CardHeader>
                            <div className="flex items-center mb-4">
                                <div className="flex">
                                    <Avatar>
                                        <AvatarImage
                                            src={operators[slideIndex].operator.user.image ? operators[slideIndex].operator.user.image : "https://github.com/shadcn.png"}
                                            alt={`${operators[slideIndex].operator.user.first_name}`}
                                            className="w-24 h-24 object-cover" />
                                    </Avatar>
                                </div>
                            </div>
                            <h2 className="text-lg font-semibold leading-relaxed mb-6">
                                {`${operators[slideIndex].operator.user.first_name} ${operators[slideIndex].operator.user.middle_name ?? ""} ${operators[slideIndex].operator.user.last_name}`}
                            </h2>
                        </CardHeader>
                        <CardContent>
                            <div className="relative my-2 mb-0 bottom-7">
                                <hr className="absolute top-0 left-0 w-full h-0.3 bg-black" />
                                <Button variant="default" size="sm" className="flex absolute top-1/2 left-14 transform -translate-x-1/2 -translate-y-1/2 rounded-full">
                                    <span>See profile</span>
                                </Button>
                            </div>
                            <div className="mt-10 mb-6 space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium">Per Job Price:</span>
                                    <span className="text-sm font-bold">${operators[slideIndex].cost_per_job ?? 'N/A'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium">Per Hour Price:</span>
                                    <span className="text-sm font-bold">${operators[slideIndex].cost_per_hour ?? 'N/A'}/hr</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium">Per Month Price:</span>
                                    <span className="text-sm font-bold">${operators[slideIndex].cost_per_month ?? 'N/A'}/day</span>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <div className="flex justify-between items-center w-full mt-4 space-x-2">
                                <div>
                                    <span className="text-2xl font-bold">{slideIndex + 1}</span>
                                    <span className="text-muted-foreground">/{totalSlides}</span>
                                </div>
                                <div className="flex space-x-4">
                                    <Button variant="outline" size="icon" onClick={handlePrev}>
                                        &lt;
                                    </Button>
                                    <Button variant="outline" size="icon" onClick={handleNext}>
                                        &gt;
                                    </Button>
                                </div>
                            </div>
                        </CardFooter>
                    </Card>
                }

                <Card className="w-full shadow-lg rounded-2xl">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-lg font-semibold">
                            <div className="flex items-center gap-x-2">
                                <span className="flex justify-center items-center w-8 h-8 rounded-full bg-primaryColor text-primary-foreground">
                                    <TractorIcon className="h-4 w-4" />
                                </span>
                                Tractors
                            </div>
                        </CardTitle>
                        <span className="text-sm text-muted-foreground">2,350 in use</span>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">Lack of physical activity</p>
                        <div className="mt-4 text-3xl font-bold">
                            {tractors.length} <span className="text-xl font-normal">Total Tractors</span>
                        </div>
                        <div className="mt-4 text-sm text-muted-foreground flex justify-between">
                            <span>0</span>
                            <span>2,350 Tractors in use</span>
                        </div>
                        <div className="mt-2 flex items-center gap-x-1">
                            <Progress value={tractorProgress} className="h-10 [&>div]:bg-primaryColor" />
                            <span className="ml-2 shrink-0 size-6 flex justify-center items-center rounded-full bg-primaryColor text-primary-foreground">
                                <Check className="h-4 w-4" />
                            </span>
                        </div>
                    </CardContent>
                    <Separator className="my-4" />
                    <CardContent>
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-lg font-semibold">
                                <div className="flex items-center gap-x-2">
                                    <span className="flex justify-center items-center w-8 h-8 rounded-full bg-primaryColor  text-white">
                                        <Wrench className="h-4 w-4" />
                                    </span>
                                    Attachments
                                </div>
                            </CardTitle>
                            <span className="text-sm text-muted-foreground">1,200 in use</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">Various implements for tractors</p>
                        <div className="mt-4 text-2xl font-bold">
                            {attachments.length} <span className="text-lg font-normal">Total Attachments</span>
                        </div>
                        <div className="mt-4 text-sm text-muted-foreground flex justify-between">
                            <span>0</span>
                            <span>1,200 Attachments in use</span>
                        </div>
                        <div className="mt-2 flex items-center gap-x-1">
                            <Progress value={attachmentProgress} className="h-10 [&>div]:bg-primaryColor" />
                            <span className="ml-2 shrink-0 size-6 flex justify-center items-center rounded-full bg-primaryColor text-white">
                                <Check className="h-4 w-4" />
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="w-full shadow-lg rounded-2xl">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold">
          <div className="flex items-center gap-x-2">
            <span className="flex justify-center items-center w-8 h-8 rounded-full bg-[#13b8a7] text-white">
              <Smartphone className="h-4 w-4" />
            </span>
            Devices (coming soon)
          </div>
        </CardTitle>
        <span className="text-sm text-muted-foreground">{activeDevices} Active</span>
      </CardHeader>
      <CardContent className="p-0">
        <p className="text-sm text-muted-foreground px-6 pb-4">Monitoring all devices</p>
        <ChartContainer config={chartConfig} className="w-full h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="50%"
                innerRadius="40%"
                outerRadius="60%"
                label={({ index, x, y, value }) => (
                  <text
                    x={x}
                    y={y}
                    fill="#333"
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="text-xs font-medium"
                  >
                    {chartData[index].status}: {value}
                  </text>
                )}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.fill}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
        <div className="flex justify-center mt-4 space-x-4 px-6 pb-6">
          {Object.entries(chartConfig).map(([key, { color, label }]) => (
            <div key={key} className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
              <span className="text-sm text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
            </div>

        </div>
    );
};

export default HomeDashboard;