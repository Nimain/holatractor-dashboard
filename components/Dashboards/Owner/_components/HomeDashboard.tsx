"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Check,
  TractorIcon,
  TabletSmartphone,
  Wrench,
  User,
  MapPin,
} from "lucide-react";
import { Pie, PieChart, Cell } from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/autoplay";
import "swiper/css/pagination";
import { AddedDevicesSection } from "../devices/AddedDevicesSection";
import TranslatedText from "@/components/Menubar/TranslatedText";
import { OwnerDashboardTranslation } from "../OwnerDashboardTranslation";
import { operatorWorkPageTranslations } from "../../Operator/WorkSection/WorkPageTranslations";
import DeviceApiService, { type Device } from "../devices/Device"; // Update with correct path

// Types (same as your original)
interface Store {
  id: string;
  name: string;
  description: string;
  image: string;
  opening_time: string;
  closing_time: string;
  closing_days: string[];
  location: {
    lat: string;
    lan: string;
  };
  TractorInStore: TractorInStore[];
}

interface TractorInStore {
  id: string;
  baseTractorId: string;
  hourly_price: number;
  store_id: string;
  baseTractor: {
    id: string;
    name: string;
    description: string;
    model: string;
    type: string;
    year: string;
    images: string[];
  };
}

interface OperatorInStore {
  id: string;
  cost_per_job: number;
  cost_per_hour: number;
  cost_per_month: number;
  operator: {
    user: {
      first_name: string;
      middle_name?: string;
      last_name: string;
      image?: string;
    };
  };
}

interface Booking {
  id: string;
  user?: {
    first_name: string;
    last_name: string;
    image?: string;
  };
}

interface Tractor {
  id: string;
  name: string;
}

interface Attachment {
  id: string;
  name: string;
}

interface Location {
  latitude: number | null;
  longitude: number | null;
}

const chartConfig = {
  active: {
    label: "Active",
    color: "#13b8a7",
  },
  inactive: {
    label: "Inactive",
    color: "#FF474D",
  },
};

const HomeDashboard = ({
  stores,
  operators,
  tractors,
  attachments,
  bookings,
  tractorsInUse,
  attachmentsInUse,
}: {
  stores: Store[];
  operators: OperatorInStore[];
  tractors: Tractor[];
  attachments: Attachment[];
  bookings: Booking[];
  tractorsInUse: number;
  attachmentsInUse: number;
}) => {
  const [slideIndex, setSlideIndex] = useState(0);
  const [location, setLocation] = useState<Location>({
    latitude: null,
    longitude: null,
  });
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loadingDevices, setLoadingDevices] = useState(false);

  const getChartData = () => {
    const activeDevices = devices.filter(
      (device) => device.base.status === 1
    ).length;
    const inactiveDevices = devices.length - activeDevices;

    return [
      { status: "Active", count: activeDevices, fill: "#4caf50" },
      { status: "Inactive", count: inactiveDevices, fill: "#f44336" },
    ];
  };

  const chartData = getChartData();

  const totalDevices = chartData.reduce((sum, item) => sum + item.count, 0);
  const activeDevices =
    chartData.find((item) => item.status === "Active")?.count || 0;
  const totalSlides = operators.length;

  const handleNext = () => {
    setSlideIndex((prevIndex) => (prevIndex + 1) % totalSlides);
  };

  const handlePrev = () => {
    setSlideIndex((prevIndex) => (prevIndex - 1 + totalSlides) % totalSlides);
  };

  const calculateProgress = (inUse: number, total: number) => {
    return total > 0 ? (inUse / total) * 100 : 0;
  };

  const tractorProgress = calculateProgress(tractorsInUse, tractors.length);
  const attachmentProgress = calculateProgress(
    attachmentsInUse,
    attachments.length
  );

  const fetchDevices = async () => {
    try {
      setLoadingDevices(true);
      const deviceData = await DeviceApiService.getAllDevices();
      setDevices(deviceData);
    } catch (error) {
      console.error("Error fetching devices:", error);
    } finally {
      setLoadingDevices(false);
    }
  };

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

    // Fetch devices initially
    fetchDevices();

    // Set up real-time updates every 30 seconds
    const deviceInterval = setInterval(fetchDevices, 30000);

    // Cleanup interval on component unmount
    return () => {
      clearInterval(deviceInterval);
    };
  }, []);

  return (
    <div className="mt-4">
      {/* First Row with 2 cards having background images */}
      <div className="grid grid-cols-1 md:grid-cols-2  gap-6">
        {/* First Card with Swiper */}
        <div className="relative rounded-[20px] shadow-xl h-48 md:h-56 xl:h-64 overflow-hidden w-full">
          {/* Slider with only changing images */}
          {stores.length === 0 ? (
            <Card className="w-full h-full rounded-2xl">
              <CardContent className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Image
                    src="https://img.freepik.com/premium-vector/available-allowed-icon-concept_313674-42037.jpg"
                    alt="No Operator Available"
                    className="w-64 object-cover rounded-full mx-auto mb-4"
                    width={256}
                    height={256}
                    unoptimized={true}
                  />
                  <h2 className="text-lg font-semibold">No Stores Available</h2>
                </div>
              </CardContent>
            </Card>
          ) : (
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
                  <SwiperSlide key={i} className="w-full object-fill h-full">
                    <div className="relative flex items-center justify-center  w-full h-full">
                      <Image
                        src={details.image || "/placeholder.svg"}
                        alt={details.name}
                        className="w-full h-full object-cover rounded-xl absolute top-0 left-0 z-[-2]"
                        width={300}
                        height={400}
                        unoptimized={true}
                      />
                      <div className="absolute top-0 left-0 z-[-1] bg-black/20 w-full h-full" />
                      <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center justify-between">
                        {/* Overlapping User Images */}
                        {bookings.length === 0 ? (
                          <span className="hidden 768px:block text-white text-lg font-bold ml-4 text-center mt-3">
                            <TranslatedText
                              greetings={
                                OwnerDashboardTranslation.noBookingsCompleted
                              }
                            />
                          </span>
                        ) : (
                          <div className="hidden 768px:flex pointer-events-auto">
                            {bookings.map((book, index) => {
                              if (index >= 3) return null;
                              return (
                                <div
                                  className="w-12 h-12 overflow-hidden relative -mr-6"
                                  style={{ zIndex: 3 }}
                                  key={index}
                                >
                                  {/* <Avatar>
                                    {book.user && book.user.image && (
                                      <AvatarImage
                                        src={book.user.image || "/placeholder.svg"}
                                        alt={`${book.user.image}`}
                                      />
                                    )}
                                    <AvatarFallback className="bg-white drop-shadow-md">
                                      {book.user?.first_name[0]}
                                      {book.user?.last_name[1]}
                                    </AvatarFallback>
                                  </Avatar> */}
                                </div>
                              );
                            })}
                            {/* <span className="text-white text-lg font-bold ml-8 text-center mt-3">
                              {bookings.length > 3 && "+"} {bookings.length > 3 ? bookings.length - 3 : bookings.length}{" "}
                              <TranslatedText greetings={OwnerDashboardTranslation.hasBooked} />
                            </span> */}
                          </div>
                        )}

                        {/* Open Store Button */}
                        <Link
                          href={`/owner/stores/${details.id}`}
                          className="mx-auto 768px:mx-0"
                        >
                          <Button className="inline-flex w-[225px] h-[52px] items-center px-6 py-3 text-white font-bold bg-orange-600 hover:bg-orange-500 rounded-full shadow-lg border-2 border-transparent transition-all duration-300 transform hover:scale-105 group pointer-events-auto">
                            <TranslatedText
                              greetings={OwnerDashboardTranslation.openStore}
                            />
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
                      <h1 className="text-xl md:text-3xl font-bold text-white">
                        {details.name}
                      </h1>
                    </div>
                  </SwiperSlide>
                );
              })}
            </Swiper>
          )}
        </div>

        {/* Second Card */}
        <div className="p-0 rounded-[20px] shadow-lg h-48 md:h-56 xl:h-64 w-full">
          {/* Map Integration */}
          {location.latitude && location.longitude ? (
            <div className="h-full w-full bg-gradient-to-br from-green-100 to-blue-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <MapPin className="h-12 w-12 mx-auto mb-4 text-green-600" />
                <p className="text-lg font-semibold">Location Enabled</p>
                <p className="text-sm text-muted-foreground">
                  {location.latitude.toFixed(4)},{" "}
                  {location.longitude.toFixed(4)}
                </p>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <p>
                <TranslatedText
                  greetings={OwnerDashboardTranslation.enableLocationDetails}
                />
              </p>
            </div>
          )}
        </div>
      </div>

      <div
        className="grid grid-cols-1 1050px:grid-cols-2 1200px:grid-cols-3 gap-6 mt-6"
        style={{ backgroundColor: "#EAF6FA" }}
      >
        {operators.length === 0 ? (
          <Card className="w-full shadow-lg rounded-2xl">
            <CardContent className="flex flex-col items-center justify-center h-full p-6">
              <div className="text-center">
                <div className="mb-4 p-4 bg-gray-100 rounded-full inline-block">
                  <User className="w-16 h-16 text-gray-400" />
                </div>
                <h2 className="text-xl font-semibold mb-2">
                  No Operator Available
                </h2>
                <p className="text-sm text-gray-500">
                  Add operators to see their details here.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="w-full  bg-gradient-to-r from-[#8c0000] to-[#4d0000] text-white   shadow-lg rounded-2xl">
            <CardHeader>
              <div className="flex items-center mb-4">
                <div className="flex">
                  <Avatar>
                    <AvatarFallback className="bg-gray-400 drop-shadow-md">
                      {operators[slideIndex].operator.user.first_name[0]}
                      {operators[slideIndex].operator.user.last_name[0]}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
              <h2 className="text-lg font-semibold leading-relaxed mb-6">
                {`${operators[slideIndex].operator.user.first_name} ${
                  operators[slideIndex].operator.user.middle_name ?? ""
                } ${operators[slideIndex].operator.user.last_name}`}
              </h2>
            </CardHeader>
            <CardContent>
              <div className="relative my-2 mb-0 bottom-7">
                {/* <hr className="absolute top-0 left-0 w-full h-0.3 bg-black" /> */}
                <Button
                  variant="default"
                  size="sm"
                  className="flex absolute h-[30px] w-[148]  left-11 bg-orange-600  hover:bg-red-600 transform -translate-x-1/2 -translate-y-1/2 rounded-full"
                >
                  <span>
                    <TranslatedText
                      greetings={OwnerDashboardTranslation.seeProfile}
                    />
                  </span>
                </Button>
              </div>
              <div className="mt-10 mb-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">
                    <TranslatedText
                      greetings={operatorWorkPageTranslations.costPerJob}
                    />
                    :
                  </span>
                  <span className="text-sm font-bold">
                    ${operators[slideIndex].cost_per_job ?? "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">
                    <TranslatedText
                      greetings={operatorWorkPageTranslations.costPerHour}
                    />
                    :
                  </span>
                  <span className="text-sm font-bold">
                    ${operators[slideIndex].cost_per_hour ?? "N/A"}/hr
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">
                    <TranslatedText
                      greetings={operatorWorkPageTranslations.costPerMonth}
                    />
                    :
                  </span>
                  <span className="text-sm font-bold">
                    ${operators[slideIndex].cost_per_month ?? "N/A"}/day
                  </span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <div className="flex justify-between  items-center w-full mt-4 space-x-2">
                <div>
                  <span className="text-2xl font-bold">{slideIndex + 1}</span>
                  <span className="text-muted">/{totalSlides}</span>
                </div>
                <div className="flex space-x-4 ">
                  <Button
                    variant="outline"
                    size="icon"
                    className="bg-transparent"
                    onClick={handlePrev}
                  >
                    &lt;
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="bg-transparent"
                    onClick={handleNext}
                  >
                    &gt;
                  </Button>
                </div>
              </div>
            </CardFooter>
          </Card>
        )}

        <Card className="w-full bg-gradient-to-r from-[#8c0000] to-[#4d0000] text-white shadow-lg rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold">
              <div className="flex items-center gap-x-2">
                <span className="flex justify-center items-center w-8 h-8 rounded-full bg-white text-red-500">
                  <TractorIcon className="h-4 w-4" />
                </span>
                <TranslatedText
                  greetings={OwnerDashboardTranslation.tractors}
                />
              </div>
            </CardTitle>
            <span className="text-sm text-muted">
              {tractorsInUse}{" "}
              <TranslatedText greetings={OwnerDashboardTranslation.inUse} />
            </span>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted">
              <TranslatedText
                greetings={OwnerDashboardTranslation.tractorOperations}
              />
            </p>
            <div className="mt-3 text-3xl font-bold">
              {tractors.length}{" "}
              <span className="text-xl font-normal">
                <TranslatedText
                  greetings={OwnerDashboardTranslation.totalTractors}
                />
              </span>
            </div>
            <div className="mt-3 text-sm text-muted flex justify-between">
              <span>0</span>
              <span>
                {tractorsInUse}{" "}
                <TranslatedText
                  greetings={OwnerDashboardTranslation.tractorsInUse}
                />
              </span>
            </div>
            <div className="mt-1 flex items-center gap-x-1">
              <Progress
                value={tractorProgress}
                className="h-10 [&>div]:bg-orange-600"
              />
              <span className="ml-2 shrink-0 size-6 flex justify-center items-center rounded-full bg-green-700 text-primary-foreground">
                <Check className="h-4 w-4" />
              </span>
            </div>
          </CardContent>
          <Separator className="mb-2 mt-0" />
          <CardContent>
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg font-semibold">
                <div className="flex items-center gap-x-2">
                  <span className="flex justify-center items-center w-8 h-8 rounded-full bg-white text-red-600">
                    <Wrench className="h-4 w-4" />
                  </span>
                  <TranslatedText
                    greetings={OwnerDashboardTranslation.attachments}
                  />
                </div>
              </CardTitle>{" "}
              <span className="text-sm text-muted">
                {attachmentsInUse}{" "}
                <TranslatedText greetings={OwnerDashboardTranslation.inUse} />
              </span>
            </div>
            <p className="text-sm text-muted mt-1">
              <TranslatedText
                greetings={OwnerDashboardTranslation.variousImplements}
              />
            </p>
            <div className="mt-4 text-2xl font-bold">
              {attachments.length}{" "}
              <span className="text-lg font-normal">
                <TranslatedText
                  greetings={OwnerDashboardTranslation.totalAttachments}
                />
              </span>
            </div>
            <div className="mt-4 text-sm text-muted flex justify-between">
              <span>0</span>
              <span>
                {attachmentsInUse}{" "}
                <TranslatedText
                  greetings={OwnerDashboardTranslation.attachmentsInUse}
                />
              </span>
            </div>
            <div className="mt-2 flex items-center gap-x-1">
              <Progress
                value={attachmentProgress}
                className="h-10 [&>div]:bg-orange-600"
              />
              <span className="ml-2 shrink-0 size-6 flex justify-center items-center rounded-full bg-green-700 text-white">
                <Check className="h-4 w-4" />
              </span>
            </div>
          </CardContent>
        </Card>

        {/* <Card className="w-full bg-gradient-to-r from-[#8c0000] to-[#4d0000] text-white shadow-lg rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold">
              <div className="flex items-center gap-x-2">
                <span className="flex justify-center items-center w-8 h-8 rounded-full bg-white text-red-600">
                  <Smartphone className="h-4 w-4" />
                </span>
                <TranslatedText greetings={OwnerDashboardTranslation.devicesComingSoon} />
                {loadingDevices && <span className="text-xs text-muted ml-2">Updating...</span>}
              </div>
            </CardTitle>
            <span className="text-sm text-muted">
              {chartData.find((item) => item.status === "Active")?.count || 0}{" "}
              <TranslatedText greetings={OwnerDashboardTranslation.active} />
            </span>
          </CardHeader>
          <CardContent className="p-0">
            <p className="text-sm text-muted px-6 pb-4">
              <TranslatedText greetings={OwnerDashboardTranslation.monitoringAllDevices} /> ({devices.length} total
              devices)
            </p>
            <ChartContainer config={chartConfig} className="w-full h-[250px]">
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
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <div className="flex justify-center mt-4 space-x-4 px-6 pb-6">
              {Object.entries(chartConfig).map(([key, { color, label }]) => (
                <div key={key} className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
                  <span className="text-sm text-muted">{label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card> */}

        {/* New device field */}
        <Card className="w-full  bg-gradient-to-r from-[#8c0000] to-[#4d0000] text-white shadow-lg rounded-2xl border-[3px] p-3">
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-1">
            <div className="flex items-center gap-x-2">
              <span className="flex justify-center items-center w-8 h-8 rounded-full bg-white text-red-600">
                <TabletSmartphone className="h-4 w-4" />
              </span>
              <div className="leading-tight">
                <h2 className="text-lg font-semibold m-0 p-0">Devices</h2>
                <p className="text-sm text-gray-200 m-0 p-0">
                  Monitoring all Devices
                </p>
              </div>
            </div>
            <span className="text-sm text-white">5 Active</span>
          </CardHeader>

          <CardContent className="w-full bg-transparent p-2">
            <div className="w-[80%] mx-auto flex flex-col items-center bg-white text-black rounded-xl p-4 pt-3">
              {/* Image Container with Green Dot */}
              <div className="relative bg-[#ffe3d3] flex justify-center rounded-lg p-1 mb-3 w-[85%]">
                {/* Green dot in top-right of image area */}
                <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-600 rounded-full  border-white shadow-md"></div>

                <Image
                  src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQUOgaaN9UQFaR5snILqpOCwuy9fHl3khgbwQ&s"
                  alt="Tractor"
                  width={150}
                  height={100}
                  className="object-contain"
                />
              </div>

              {/* Text Content */}
              <div className="space-y-1 text-sm font-semibold w-full px-1">
                <p className="text-[#d70000]">New Holland 3032</p>

                <div className="flex justify-between text-gray-600">
                  <span>Price:</span>
                  <span className="text-black">22$/hr</span>
                </div>

                <div className="flex justify-between text-gray-600">
                  <span>Status:</span>
                  <span className="text-green-600">Online</span>
                </div>

                <div className="flex justify-between text-gray-600">
                  <span>Last Seen at:</span>
                  <span className="text-black">37hr ago</span>
                </div>
              </div>

              {/* Button */}
              <Button className="bg-orange-500 text-white mt-4 w-full rounded-full text-sm font-semibold">
                View Location
              </Button>
            </div>
          </CardContent>

          <div className="flex justify-center gap-4 mt-4">
            {/* <button className="w-8 h-8 rounded-md border border-white flex items-center justify-center">
              <ChevronLeft className="text-white w-4 h-4" />
            </button> */}
            <Button variant="outline" size="icon" className="bg-transparent">
              &lt;
            </Button>
            {/* <button className="w-8 h-8 rounded-md border border-white flex items-center justify-center">
              <ChevronRight className="text-white w-4 h-4" />
            </button> */}
            <Button variant="outline" size="icon" className="bg-transparent">
              &gt;
            </Button>
          </div>
        </Card>
      </div>

      {/* Added Devices Section */}
      <div className="mt-6">
        <AddedDevicesSection />
      </div>
    </div>
  );
};

export default HomeDashboard;
