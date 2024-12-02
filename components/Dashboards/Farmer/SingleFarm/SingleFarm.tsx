"use client"

import { renderInstance } from '@/utils/Axios/RenderInstance'
import { errorMessage } from '@/utils/Toastify/Messages'
import { Farm } from '@/utils/Types/types'
import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Polygon } from 'react-leaflet'

import { MoreHorizontal, Navigation2, TrendingUp, Map, Leaf } from 'lucide-react'
import { Card } from "@/components/ui/card"
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'slick-carousel/slick/slick.css';
import Slider from 'react-slick';

import 'slick-carousel/slick/slick-theme.css';
interface Location {
  latitude: number | null;
  longitude: number | null;
}
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import FarmerShimmer from '../_components/FarmerShrimmer'
import BookingCard from './BookingCard'

const chartData = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 },
  { month: "july", desktop: 209, mobile: 130 },
  { month: "Aug", desktop: 214, mobile: 140 },
];
const cardData = [
  {
    id: 1,
    title: 'Signal',
    level: 'Medium',
    latitude: '49.8397°N',
    longitude: '24.0297°E',
  },
  {
    id: 2,
    title: 'Location 2',
    level: 'Low',
    latitude: '40.7128°N',
    longitude: '74.0060°W',
  },
  {
    id: 3,
    title: 'Location 3',
    level: 'High',
    latitude: '51.5074°N',
    longitude: '0.1278°W',
  }
];
const cardDataLeft = [
  {
    title: 'pH',
    value: '6.5',
    description: 'The pH of the soil decreased',
    bgClass: 'bg-zinc-900/50',
    textClass: 'text-black/50'
  },
  {
    title: 'Acidity',
    value: '5.8',
    description: 'Soil acidity is changing',
    bgClass: 'bg-zinc-800/50',
    textClass: 'text-black/50'
  }
];

const cardDataRight = [
  {
    title: 'Temperature',
    value: '23°',
    description: 'Soil temperature in degrees Celsius',
    bgClass: 'bg-[#1A1600]',
    textClass: 'text-amber-500',
    highlightClass: 'text-amber-500'
  },
  {
    title: 'Heat Index',
    value: '26°',
    description: 'Feels like temperature',
    bgClass: 'bg-[#2A2600]',
    textClass: 'text-amber-600',
    highlightClass: 'text-amber-600'
  }
];

interface Location {
  latitude: number | null;
  longitude: number | null;
}

interface FarmDetails {
  farmDetails: Farm,
  centerPoint: {
    lat: number | null,
    lng: number | null
  },
  cropYields: {
    wheat: number | null,
    corn: number | null,
    soybean: number | null,
    rice: number | null
  }
}

const SingleFarm = () => {
  const [farm, setFarm] = useState<FarmDetails | null>(null)
  const [fetching, setFetching] = useState(false)
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<Location>({ latitude: null, longitude: null });

  const { slug } = useParams()

  const limeOptions = { color: 'lime' }

  function fetchFarmer() {
    setFetching(true)
    renderInstance.get(`/farm/${slug}`)
      .then((res) => {
        setFarm(res.data)
      }).catch(() => {
        console.log(error)
        errorMessage("Error fetching farm details")
      }).finally(() => {
        setFetching(false)
      })
  }

  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false,
    autoplay: false,
    centerMode: true,
    centerPadding: '0px',
    customPaging: () => (
      <div
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: 'gray',
          marginTop: '10px'
        }}
      />
    )
  };
  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: true,
    autoplay: true,
    centerMode: true,
    centerPadding: '0px',
    customPaging: () => (
      <div
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: 'gray',
          marginTop: '10px'
        }}
      />
    )
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
  }, []);

  useEffect(() => {
    if (slug) {
      fetchFarmer()
    }
  }, [])

  if (fetching) return <FarmerShimmer />

  if (!farm) return <p>Farm details not available</p>

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_600px] gap-6 p-6 bg-gray-100">
        {/* Map Area */}
        <Card className="relative h-full min-h-[400px] bg-zinc-900/50">
          <div className="flex justify-between border-b border-none px-6 py-4 bg-white">
            <div className="flex items-center">
              <span className="text-xl font-light">
                {farm.farmDetails.name}
              </span>
              <MoreHorizontal className="h-6 w-6" />
            </div>
            <div>
              <span className="text-black/50 flex items-center">
                <Map className="mr-2" /> available
              </span>
            </div>
          </div>

          <div className="h-[calc(100%-80px)]">
            {(location?.latitude && location?.longitude) ? (
              <MapContainer
                center={(farm.centerPoint.lat && farm.centerPoint.lng) ? [farm.centerPoint.lat, farm.centerPoint.lng] : [location.latitude, location.longitude]}
                zoom={18}
                scrollWheelZoom={false}
                className="h-full w-full"
                style={{ zIndex: 1 }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <Polygon pathOptions={limeOptions} positions={farm.farmDetails.boundary.coordinates} />
              </MapContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p>Please enable location details</p>
              </div>
            )}
          </div>

          <div className="absolute bottom-4 right-4 flex gap-2">
            <button className="rounded-full bg-black/50 p-3 backdrop-blur-sm hover:bg-black/70">
              <Navigation2 className="h-5 w-5" />
            </button>
            <button className="rounded-full bg-black/50 p-3 backdrop-blur-sm hover:bg-black/70">
              <span className="sr-only">Location</span>
              <div className="h-5 w-5 rounded-full border-2 border-current" />
            </button>
          </div>
        </Card>

        {/* Right Column */}
        <div className="flex flex-col gap-6">
          {/* Latest Update Card */}
          <Card className="bg-zinc-400/50 text-black rounded-xl">
            <div className="flex justify-between border-b border-none px-6 py-4 bg-white">
              <span className="text-lg">Latest update</span>
              <div className="flex rounded-full p-2 hover:bg-white/10">
                <span>Bookings</span>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 p-4">
              {/* Crops Card */}
              <Card className="w-full bg-zinc-900 border-zinc-800 text-white h-[400px] flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 shrink-0">
                  <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                    <Leaf className="h-5 w-5 text-green-500" />
                    Crops
                  </CardTitle>
                  <button className="rounded-full hover:bg-zinc-800 p-2">
                    <MoreHorizontal className="h-5 w-5 text-zinc-400" />
                  </button>
                </CardHeader>
                <CardContent className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-800">
                  <div className="space-y-4">
                    <div
                      className="flex justify-between items-center py-3 px-2 border-b border-zinc-800 last:border-b-0 hover:bg-zinc-800/50 transition-colors rounded-lg"
                    >
                      <span className="text-lg font-medium">Wheat</span>
                      <span className="text-zinc-400">
                        {farm.cropYields.wheat?.toFixed(2)} <span className="text-sm">per/acer</span>
                      </span>
                    </div>
                    <div
                      className="flex justify-between items-center py-3 px-2 border-b border-zinc-800 last:border-b-0 hover:bg-zinc-800/50 transition-colors rounded-lg"
                    >
                      <span className="text-lg font-medium">Corn</span>
                      <span className="text-zinc-400">
                        {farm.cropYields.corn?.toFixed(2)} <span className="text-sm">per/acer</span>
                      </span>
                    </div>
                    <div
                      className="flex justify-between items-center py-3 px-2 border-b border-zinc-800 last:border-b-0 hover:bg-zinc-800/50 transition-colors rounded-lg"
                    >
                      <span className="text-lg font-medium">Soyabean</span>
                      <span className="text-zinc-400">
                        {farm.cropYields.soybean?.toFixed(2)} <span className="text-sm">per/acer</span>
                      </span>
                    </div>
                    <div
                      className="flex justify-between items-center py-3 px-2 border-b border-zinc-800 last:border-b-0 hover:bg-zinc-800/50 transition-colors rounded-lg"
                    >
                      <span className="text-lg font-medium">Rice</span>
                      <span className="text-zinc-400">
                        {farm.cropYields.rice?.toFixed(2)} <span className="text-sm">per/acer</span>
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Slider Card */}
              <Card className="w-full h-[400px] overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    Bookings
                  </CardTitle>
                  <button className="rounded-full hover:bg-zinc-800 p-2">
                    <MoreHorizontal className="h-5 w-5 text-zinc-400" />
                  </button>
                </CardHeader>
                <CardContent className="p-0 h-[calc(100%-64px)]">
                  <Slider {...settings} className="h-full">
                    {farm.farmDetails.Booking.map((card) => (
                      <BookingCard booking={card} key={card.id} />
                    ))}
                  </Slider>
                </CardContent>
              </Card>
            </div>
          </Card>

          {/* Moisture Chart Card */}
          <Card className="bg-zinc-900/50 p-4">
            <div className="mb-6 flex items-center justify-between">
              <CardTitle className="text-lg">Moisture</CardTitle>
              <button className="rounded-full p-2 hover:bg-white/10">
                <MoreHorizontal className="h-5 w-5" />
              </button>
            </div>
            <CardContent className="p-0 overflow-x-auto">
              <div className="min-w-[500px]">
                <BarChart
                  width={570}
                  height={300}
                  data={chartData}
                  className="text-white"
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    tickFormatter={(value) => value.slice(0, 3)}
                    stroke="#ffffff50"
                  />
                  <Bar
                    dataKey="desktop"
                    fill="#4f46e5"
                    radius={4}
                    className="opacity-80 hover:opacity-100 transition-opacity"
                  />
                  <Bar
                    dataKey="mobile"
                    fill="#8b5cf6"
                    radius={4}
                    className="opacity-80 hover:opacity-100 transition-opacity"
                  />
                </BarChart>
              </div>
            </CardContent>
          </Card>

          {/* Bottom Sliders */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Left Slider */}
      <div className="w-full">
        <Slider {...sliderSettings} className="h-full">
          <div className="p-2 h-full">
            <Card className="bg-zinc-900/50 p-4 h-full flex flex-col transition-colors hover:bg-yellow-400">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-lg text-white">pH</div>
                <button className="rounded-full p-2 hover:bg-white/10">
                  <MoreHorizontal className="h-5 w-5 text-white" />
                </button>
              </div>
              <div className="text-center flex-grow flex flex-col justify-center">
                <div className="text-6xl font-light text-white">6.5</div>
                <div className="mt-2 text-sm text-black/50">
                  The pH of the soil decreased
                </div>
              </div>
            </Card>
          </div>
          <div className="p-2 h-full">
            <Card className="bg-zinc-800/50 p-4 h-full flex flex-col transition-colors hover:bg-zinc-700/60">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-lg text-white">Acidity</div>
                <button className="rounded-full p-2 hover:bg-white/10">
                  <MoreHorizontal className="h-5 w-5 text-white" />
                </button>
              </div>
              <div className="text-center flex-grow flex flex-col justify-center">
                <div className="text-6xl font-light text-white">5.8</div>
                <div className="mt-2 text-sm text-black/50">
                  Soil acidity is changing
                </div>
              </div>
            </Card>
          </div>
        </Slider>
      </div>

      {/* Right Slider */}
      <div className="w-full">
        <Slider {...sliderSettings} className="h-full">
          <div className="p-2 h-full">
            <Card className="relative overflow-hidden bg-[#1A1600] p-4 h-full flex flex-col transition-colors hover:bg-[#2A2600]">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-lg text-amber-500">Temperature</div>
                <button className="rounded-full p-2 hover:bg-white/10">
                  <MoreHorizontal className="h-5 w-5 text-amber-500" />
                </button>
              </div>
              <div className="text-center flex-grow flex flex-col justify-center">
                <div className="text-6xl font-light text-amber-500">23°</div>
                <div className="mt-2 text-sm text-amber-500">
                  Soil temperature in degrees Celsius
                </div>
              </div>
            </Card>
          </div>
          <div className="p-2 h-full">
            <Card className="relative overflow-hidden bg-[#2A2600] p-4 h-full flex flex-col transition-colors hover:bg-[#3A3600]">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-lg text-amber-600">Heat Index</div>
                <button className="rounded-full p-2 hover:bg-white/10">
                  <MoreHorizontal className="h-5 w-5 text-amber-600" />
                </button>
              </div>
              <div className="text-center flex-grow flex flex-col justify-center">
                <div className="text-6xl font-light text-amber-600">26°</div>
                <div className="mt-2 text-sm text-amber-600">
                  Feels like temperature
                </div>
              </div>
            </Card>
          </div>
        </Slider>
      </div>
    </div>
        </div>
      </div>
    </div>
  )

  // return (
  //   <>
  //     {error ? (
  //       <p>Error: {error}</p>
  //     ) : (location.latitude && location.longitude) ? (
  //       <MapContainer
  //         center={farm?.boundary.coordinates[0]}
  //         zoom={13}
  //         scrollWheelZoom={false}
  //         style={{ width: "100%", height: "100vh", zIndex: 1 }}>
  //         <TileLayer
  //           attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  //           url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
  //         />
  //         <Polygon pathOptions={limeOptions} positions={farm?.boundary.coordinates} />
  //       </MapContainer>
  //     ) : (
  //       <p>Latitude and longitude not available</p>
  //     )}
  //   </>
  // )
}

export default SingleFarm