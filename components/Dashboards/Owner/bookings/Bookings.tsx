"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { YAxis, Tooltip, ResponsiveContainer } from "recharts";

import { Filter, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Booking } from "@/utils/Types/types";
import { useCookie } from "next-cookie";
import { NestJsBaseURL, renderInstance } from "@/utils/Axios/RenderInstance";
import { errorMessage } from "@/utils/Toastify/Messages";
import { io, Socket } from "socket.io-client";
import TranslatedText from "@/components/Menubar/TranslatedText";
import { ownerBookingsTranslation } from "./OwnerBookingsTranslations";
import { BookingCard } from "./BookingCard";
import Pagination from "@/utils/Paginations/Pagination";

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
interface ChartData {
  time: string;
  passengers: number;
}

// Define the structure of the `chartData` object
interface ChartDataSet {
  last30: ChartData[];
}

const Bookings = () => {
  const [location, setLocation] = useState<Location>({
    latitude: null,
    longitude: null,
  });
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState("all");

  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [fetchingBookings, setFetchingBookings] = useState(false);
  const [query, setQuery] = useState("");
  const [confirming, setConfirming] = useState(false);

  const [totalBookings, setTotalBookings] = useState(0);
  const [totalOpen, setTotalOpen] = useState(0);
  const [totalAccepted, setTotalAccepted] = useState(0);
  const [totalOngoing, setTotalOngoing] = useState(0);
  const [totalUnpaid, setTotalUnpaid] = useState(0);
  const [totalCompleted, setTotalCompleted] = useState(0);
  const [totalrejected, setTotalRejected] = useState(0);
  const [totalReview, setTotalReview] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [page, setPage] = useState(1);

  const [year, setYear] = useState(new Date().getFullYear());
  const [chartData, setChartData] = useState<ChartData[]>([]);

  const [fetchingBookingsChart, setFetchingBookingsChart] = useState(false);

  const leftSectionRef = useRef<HTMLDivElement>(null);
  const rightSectionRef = useRef<HTMLDivElement>(null);

  const { cookie } = useCookie();
  const user: user = cookie.get("user");
  const access_token = cookie.get("access_token");

  function generateYearOptions() {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = 2021; year <= currentYear; year++) {
      years.push(year.toString());
    }
    return years.reverse();
  }

  function fetchBookings() {
    setFetchingBookings(true);

    renderInstance
      .get(
        `/owner/get-owner-booking-page-details/${user.userId}?filter=${selectedFilter}&page=${page}&itemsPerPage=${itemsPerPage}`
      )
      .then((res) => {
        setAllBookings(res.data.allBookings);
        setTotalBookings(res.data.total);
        setTotalOpen(res.data.open);
        setTotalAccepted(res.data.accepted);
        setTotalOngoing(res.data.ongoing);
        setTotalUnpaid(res.data.unpaid);
        setTotalCompleted(res.data.completed);
        setTotalRejected(res.data.rejected);
        setTotalReview(res.data.review);
        setTotalPages(res.data.totalPages);
      })
      .catch((err) => {
        errorMessage("Error fetching operator lists");
      })
      .finally(() => {
        setFetchingBookings(false);
      });
  }

  const handlePageChange = (page: number) => {
    setPage(page);
  };

  function fetchBookingCharts() {
    setFetchingBookingsChart(true);

    renderInstance
      .get(`/owner/get-booking-chart/${user.userId}?year=${year}`)
      .then((res) => {
        setChartData(res.data);
      })
      .catch((err) => {
        errorMessage("Error fetching operator lists");
      })
      .finally(() => {
        setFetchingBookingsChart(false);
      });
  }

  // Calculate max bookings dynamically
  const maxBookings = useMemo(() => {
    return Math.max(...chartData.map((data) => data.passengers), 200); // Default min 200
  }, [chartData]);

  // Generate dynamic ticks (intervals of 200 or another step)
  const yAxisTicks = useMemo(() => {
    const step = Math.ceil(maxBookings / 4 / 100) * 100; // Adjust step size dynamically
    return Array.from({ length: 5 }, (_, i) => i * step).filter(
      (tick) => tick <= maxBookings
    );
  }, [maxBookings]);

  useEffect(() => {
    const handleScroll = (e: WheelEvent) => {
      const target = e.currentTarget as HTMLDivElement;
      target.scrollTop += e.deltaY;
    };

    const section = leftSectionRef.current;
    if (section) {
      section.addEventListener("wheel", handleScroll);
    }

    const rsection = rightSectionRef.current;
    if (rsection) {
      rsection.addEventListener("wheel", handleScroll);
    }

    return () => {
      if (section) {
        section.removeEventListener("wheel", handleScroll);
      }
    };
  }, []);

  useEffect(() => {
    // Connect to the socket server
    const newSocket: Socket = io(NestJsBaseURL, {
      query: {
        userId: user.userId,
      },
    });

    // Listen for the 'newFarmerNotification' event
    newSocket.on("newBooking", (booking: Booking) => {
      setAllBookings((prevBookings) => {
        const existingBookingIndex = prevBookings.findIndex(
          (b) => b.id === booking.id
        );

        if (existingBookingIndex !== -1) {
          const updatedBookings = prevBookings.filter(
            (b) => b.id !== booking.id
          );
          return [booking, ...updatedBookings];
        } else {
          return [booking, ...prevBookings];
        }
      });
    });

    // Clean up the event listener when the component unmounts
    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (user) {
      fetchBookings();
      fetchBookingCharts();
    }
  }, [selectedFilter, itemsPerPage, page]);

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
    <div className="bg-white ">
      <header className="text-red-600 text-3xl mt-2 font-bold mx-4">
        Bookings
      </header>
      <div className="flex mt-5 flex-col h-screen">
        {/* Header */}

        {/* Main Content */}
        <div
          className="flex flex-grow overflow-auto"
          style={{ scrollbarWidth: "none" }}
        >
          {/* Left Section - Train Cards */}
          <div
            className="w-2/5 mx-auto p-4 overflow-auto border-black border rounded-xl  border-2"
            style={{ scrollbarWidth: "none" }}
            ref={leftSectionRef}
          >
            {/* Search Bar */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
              <div className="flex border border-black rounded-md items-center gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-red-500 w-5 h-5" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search Deatils"
                    className="w-full py-3 pl-12 pr-4 text-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 placeholder:text-red-500 font-bold"
                  />
                </div>
                <div>
                  {" "}
                  <Filter className="bg-red-500  text-white m-3 rounded-md p-1 " />
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="flex justify-between gap-4 mb-6">
              <Select
                defaultValue="all"
                onValueChange={(e) => {
                  setSelectedFilter(e);
                }}
              >
                <SelectTrigger className="w-[140px] bg-white">
                  <SelectValue
                    placeholder={
                      <TranslatedText
                        greetings={ownerBookingsTranslation.allBookings}
                      />
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <TranslatedText greetings={ownerBookingsTranslation.all} />{" "}
                    {totalBookings}
                  </SelectItem>
                  <SelectItem value="open">
                    <TranslatedText greetings={ownerBookingsTranslation.open} />{" "}
                    {totalOpen}
                  </SelectItem>
                  <SelectItem value="accepted">
                    <TranslatedText
                      greetings={ownerBookingsTranslation.accepted}
                    />{" "}
                    {totalAccepted}
                  </SelectItem>
                  <SelectItem value="ongoing">
                    <TranslatedText
                      greetings={ownerBookingsTranslation.ongoing}
                    />{" "}
                    {totalOngoing}
                  </SelectItem>
                  <SelectItem value="unpaid">
                    <TranslatedText
                      greetings={ownerBookingsTranslation.unpaid}
                    />{" "}
                    {totalUnpaid}
                  </SelectItem>
                  <SelectItem value="review">
                    <TranslatedText
                      greetings={ownerBookingsTranslation.review}
                    />{" "}
                    {totalReview}
                  </SelectItem>
                  <SelectItem value="completed">
                    <TranslatedText
                      greetings={ownerBookingsTranslation.completed}
                    />{" "}
                    {totalCompleted}
                  </SelectItem>
                  <SelectItem value="rejected">
                    <TranslatedText
                      greetings={ownerBookingsTranslation.rejected}
                    />{" "}
                    {totalrejected}
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select
                defaultValue="10"
                onValueChange={(e) => {
                  setItemsPerPage(parseInt(e));
                }}
              >
                <SelectTrigger className="w-[140px] bg-white">
                  <SelectValue placeholder={"Items per page"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="30">30</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Train List */}

            {fetchingBookings ? (
              <div className="space-y-4 ">
                <div className="animate-pulse w-full h-[160px] bg-gray-300 rounded" />
                <div className="animate-pulse w-full h-[160px] bg-gray-300 rounded" />
                <div className="animate-pulse w-full h-[160px] bg-gray-300 rounded" />
                <div className="animate-pulse w-full h-[160px] bg-gray-300 rounded" />
                <div className="animate-pulse w-full h-[160px] bg-gray-300 rounded" />
                <div className="animate-pulse w-full h-[160px] bg-gray-300 rounded" />
                <div className="animate-pulse w-full h-[160px] bg-gray-300 rounded" />
                <div className="animate-pulse w-full h-[160px] bg-gray-300 rounded" />
                <div className="animate-pulse w-full h-[160px] bg-gray-300 rounded" />
                <div className="animate-pulse w-full h-[160px] bg-gray-300 rounded" />
                <div className="animate-pulse w-full h-[160px] bg-gray-300 rounded" />
              </div>
            ) : (
              <div className="space-y-4 ">
                {allBookings
                  .filter((bo) => bo.confirm)
                  .map((ticket, i) => (
                    <BookingCard
                      confirming={confirming}
                      setConfirming={setConfirming}
                      ticket={ticket}
                      accessToken={access_token}
                      key={i}
                    />
                  ))}
              </div>
            )}
            {totalPages > 1 && !fetchingBookings && (
              <Pagination
                totalPages={totalPages}
                currentPage={page}
                onPageChange={handlePageChange}
              />
            )}
          </div>

          {/* Right Section - Map & Statistics */}
          <div
            className="w-3/5 p-4 bg-white shadow overflow-auto"
            style={{ scrollbarWidth: "none" }}
            ref={rightSectionRef}
          >
            <div className="h-full flex flex-col">
              {/* Map */}

              <div className="mb-4 flex-grow mt-3">
                <div className="map-container w-full h-64 lg:h-96 rounded-lg shadow-md overflow-hidden">
                  {error ? (
                    <p>Error: {error}</p>
                  ) : location.latitude && location.longitude ? (
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
                  ) : (
                    <p>Latitude and longitude not available</p>
                  )}
                </div>
              </div>

              {/* Statistics */}
              <div className="border rounded-md p-3 bg-gradient-to-r from-[#8c0000] to-[#4d0000] space-y-6 mt-6">
                {/* Tab Content */}
                <div className="space-y-4">
                  <div className="w-full space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl text-white font-semibold tracking-tight">
                        Booking Details
                      </h2>
                      <div className="flex items-center gap-2">
                        <Select
                          value={`${year}`}
                          onValueChange={(value) => setYear(parseInt(value))}
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Select year" />
                          </SelectTrigger>
                          <SelectContent>
                            {generateYearOptions().map((year) => (
                              <SelectItem key={year} value={year}>
                                {year}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Chart Card */}
                    <Card className="p-4 bg-gradient-to-r from-[#8c0000] to-[#4d0000] border-none  text-white mt-5">
                      <CardContent className="pt-4 text-white">
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={chartData} barSize={40}>
                            <CartesianGrid
                              vertical={false}
                              stroke="transparent"
                            />
                            <XAxis
                              dataKey="time"
                              axisLine={false}
                              tickLine={false}
                              dy={10}
                              tick={{ fill: "white" }} // make text white
                            />

                            <YAxis
                              axisLine={false}
                              tickLine={false}
                              ticks={yAxisTicks}
                              dx={-10}
                              tick={{ fill: "white" }} //  make text white
                            />

                            <Tooltip
                              cursor={false}
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  return (
                                    <div className="rounded-lg  bg-background p-2 shadow-sm">
                                      <div className="grid grid-cols-2 gap-2">
                                        <div className="flex flex-col">
                                          <span className="text-[0.70rem] uppercase text-muted-foreground">
                                            Bookings
                                          </span>
                                          <span className="font-bold text-muted-foreground">
                                            {payload[0].value}
                                          </span>
                                        </div>
                                        {/* <div className="flex flex-col">
                                                                                <span className="text-[0.70rem] uppercase text-muted-foreground">
                                                                                    Change
                                                                                </span>
                                                                                <span className="font-bold text-emerald-500">
                                                                                    +12%
                                                                                </span>
                                                                            </div> */}
                                      </div>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Bar
                              dataKey="passengers"
                              fill="white"
                              radius={[4, 4, 0, 0]}
                              background={{ fill: "transparent" }}
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
    </div>
  );
};

export default Bookings;
