"use client"

import { useEffect, useState, FC } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, MapPin, Hotel, List, Heart, Share, Zap, Maximize2, CreditCard, MessageCircleQuestion, Sun, Mic, Map } from 'lucide-react'
import OwnerModule from './_components/OwnerModule'
import { renderInstance } from '@/utils/Axios/RenderInstance'
import { errorMessage } from '@/utils/Toastify/Messages'
import { Store } from '@/utils/Types/types'
import "leaflet/dist/leaflet.css";
import { FaImage, FaStore } from 'react-icons/fa'; // Importing Image and Store icons
import { FaRegChartBar, FaHotel, FaRegCalendarAlt, FaPlane } from "react-icons/fa";
import { Button } from '@/components/ui/button'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'

export default function StorePage ({
  location = 'Greece',
  temperature = 28,
  priceRange = { min: 1581, max: 3162 },
}: {
  storeImages: string[];
  location?: string;
  temperature?: number;
  priceRange?: {
    min: number;
    max: number;
  };
}) {
  const [store, setStore] = useState<Store | null>(null)
  const [fetchingStoreDetails, setFetchingStoreDetails] = useState(false)

  const [selectedTab, setSelectedTab] = useState('Overview'); // Track selected tab

  const images = [
    "https://img.freepik.com/premium-photo/tractor-makes-harvesting-hay-animals-farm_627378-1301.jpg",
    "https://cdn.britannica.com/09/179609-138-D7550199/tractors-GPS-navigation-systems-farming.jpg",
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT243T7YIOkC6yRwBVPQ6wPFXfo_Ssl1aYlcQ&s",
    "https://thumbs.dreamstime.com/b/tractor-modern-agriculture-equipment-14081589.jpg",
  ];
  const [mainImage, setMainImage] = useState(images[0]);

  const { slug } = useParams()

  function fetchStoreDetails() {
    setFetchingStoreDetails(true)
    renderInstance.get(`/store/${slug}`)
      .then((res) => {
        setStore(res.data)
      }).catch((err) => {
        errorMessage("Error fetching store details")
      }).finally(() => {
        setFetchingStoreDetails(false)
      })
  }

  useEffect(() => {
    if (slug) {
      fetchStoreDetails()
    }
  }, [])

  if (fetchingStoreDetails) return <p>Getting store details</p>

  if (!store) return <p>Store details not available</p>

  return (
    <div className="bg-gray-50 min-h-screen p-6 flex-1 overflow-y-auto">
        {/* Header Navigation */}
        <div className="flex items-center justify-between mb-0">
          <div className="flex items-center gap-2">
            <div className="bg-yellow-400 w-8 h-8 rounded-full" />
            <span className="text-gray-700">Travel planning</span>
          </div>
          <div className="flex gap-2">
            <span>Store</span>
          </div>
        </div>

        {/* Hero Section */}
        <main>
          <div className="relative rounded-xl text-white p-3 mb-6">
            {/* Main Banner Image */}
            <div className="absolute left-6 top-6 flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-[40px] bg-white/60 px-4 py-4 backdrop-blur-sm">
                <MapPin className="h-4 w-4 text-black" />
              </div>
              <span className="text-sm font-medium">Greece</span>
            </div>
            <img
              src={mainImage}
              alt="Main Banner"
              className="w-full h-[65vh] object-cover rounded-lg"
            />

            {/* Centered Heading and Description */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center -mt-[50rem]  bg-white/20 rounded-lg p-6">
              <h1 className="text-4xl font-bold text-white mb-2">Welcome to Tailwind CSS</h1>
              <p className="text-lg text-white max-w-md ">
                Tailwind CSS makes it easy to build responsive, modern, and consistent designs. Align and style elements effortlessly.
              </p>
            </div>

            <div className="absolute left-6 top-[19.5rem] flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-[40px] bg-white/60 px-4 py-4 backdrop-blur-sm">
                <Heart className="h-4 w-4 text-black" />
              </div>
              <div className="flex items-center gap-2 rounded-[40px] bg-white/60 px-4 py-4 backdrop-blur-sm">
                <Share className="h-4 w-4 text-black" />
              </div>
            </div>
            {/* Thumbnail Gallery */}
            <div className="absolute top-[50px] right-12 flex space-x-2">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setMainImage(image)} // Update main image on click
                  className={`w-12 h-12 bg-white/20 rounded-lg ${mainImage === image ? "border-2 border-white" : ""}`}
                >
                  <img
                    src={image}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-12 h-12 object-cover rounded-lg"
                  />
                </button>
              ))}

              {/* Fifth Box: Display remaining images */}
              <div className="w-12 h-12 bg-gray-700 text-white flex items-center justify-center rounded-lg">
                {images.length - 1} {/* Display remaining images */}
              </div>
            </div>


            {/* Tabs */}

            <div className="absolute right-6 top-[24.5rem] flex items-center gap-4">
              {/* Image Icon */}
              <div className="flex items-center gap-2 rounded-[40px] bg-white/60 px-4 py-4 backdrop-blur-sm">
                <FaImage className="h-4 w-4 text-black" /> {/* Replace with the appropriate image icon */}
              </div>

              {/* Store Icon */}
              <div className="flex items-center gap-2 rounded-[40px] bg-white/60 px-4 py-4 backdrop-blur-sm">
                <FaStore className="h-4 w-4 text-black" /> {/* Replace with the appropriate store icon */}
              </div>
            </div>
            {/* Tab Content */}
            <div className="relative">
              {/* Tabs */}
              <div className="absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex gap-2 p-2 bg-white/10 backdrop-blur-lg rounded-xl shadow-lg -mt-[4rem]">
                {[
                  { name: "Overview", icon: <FaRegChartBar /> },
                  { name: "Tractor", icon: <FaHotel /> },
                  { name: "Attachment", icon: <FaRegCalendarAlt /> },
                ].map((tab) => (
                  <button
                    key={tab.name}
                    onClick={() => setSelectedTab(tab.name)}
                    className={`
              flex items-center gap-2 px-6 py-2.5 
              rounded-lg transition-all duration-300 
              font-medium text-sm 
              ${selectedTab === tab.name
                        ? "bg-white text-gray-900 shadow-sm transform scale-105"
                        : "text-white/80 hover:bg-white/20"
                      }
            `}
                  >
                    {tab.icon}
                    {tab.name}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="pt-6 p-2">
                {selectedTab === 'Overview' && (
                  <div className="container mx-auto p-6">
                    <div className="flex gap-6 h-[95vh]">
                      {/* Assistant Card */}
                      <div className="w-[47%]">
                      <Card className="max-w-md bg-gradient-to-b from-[#FF7A82] to-[#FF4D4D] shadow-md rounded-lg flex flex-col h-full -mt-[8.7rem]">
                      <CardHeader className="flex flex-row items-center justify-between py-4 px-4">
                            <div className="flex items-center gap-2">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black">
                                <Zap className="h-4 w-4 text-white" />
                              </div>
                              <span className="font-medium text-white">Assistant</span>
                            </div>
                            <button className="p-2 bg-black/10 hover:bg-black/5 rounded-lg transition-colors duration-200">
                              <Maximize2 size={20} className="text-gray-600" />
                            </button>
                          </CardHeader>
                          <CardContent className="flex flex-col justify-between grow py-6 px-4">
                            {/* Main Content */}
                            <div className="flex-grow flex items-center justify-center">
                              <div className="space-y-4 text-center">
                                <p className="text-[30px] font-large leading-tight text-left text-white">
                                  Ready to dive into some{" "}
                                  <span className="font-semibold text-white">hotel options</span>{" "}
                                  or maybe an{" "}
                                  <span className="font-semibold text-white">itinerary</span>?
                                </p>
                                <div className="flex flex-wrap gap-4 justify-left">
                                  <Button
                                    variant="secondary"
                                    className="px-3 py-3 text-lg bgwhitek/10 hover:bg-black/20 rounded-lg"
                                  >
                                    Hotel options
                                  </Button>
                                  <Button
                                    variant="secondary"
                                    className="px-3 py-3 text-lg bgwhitek/10 hover:bg-black/20 rounded-lg"
                                  >
                                    Itinerary
                                  </Button>
                                  <Button
                                    variant="secondary"
                                    className="px-3 py-3 text-lg bgwhitek/10 hover:bg-black/20 rounded-lg"
                                  >
                                    Things to do
                                  </Button>
                                </div>
                              </div>
                            </div>
                            {/* Bottom Section */}
                            <div className="flex items-center justify-between mt-6">
                              <Button variant="ghost" size="icon" className="h-10 w-10 bg-black/10 hover:bg-black/20">
                                <CreditCard className="h-4 w-4" />
                                <span className="sr-only">Payment</span>
                              </Button>
                              <Button
                                variant="default"
                                size="icon"
                                className="h-10 w-10 rounded-xl"
                              >
                                <Mic className="h-4 w-4 text-white" />
                                <span className="sr-only">Voice input</span>
                              </Button>
                              <Button variant="ghost" size="icon" className="h-10 w-10 bg-black/10 hover:bg-black/20">
                                <MessageCircleQuestion className="h-4 w-4" />
                                <span className="sr-only">Help</span>
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Right Side Content */}
                      <div className="w-[100%] flex flex-col h-full">
                        {/* Weather and Price Range Cards */}
                        <div className="flex gap-6 mb-6">
                          {/* Weather Card */}
                          <Card className="flex-1 h-[30vh]">
                            <CardContent className="p-6">
                              <div className="flex items-center justify-between">
                                <div className="flex items-end gap-2">
                                  <span className="text-4xl font-bold">{temperature}</span>
                                  <span className="text-gray-500">°C</span>
                                </div>
                                <Sun className="text-yellow-400" size={40} />
                              </div>
                              <p className="text-sm text-gray-500 mt-2">For your dates</p>
                            </CardContent>
                          </Card>

                          {/* Price Range Card */}
                          <Card className="flex-1">
                            <CardContent className="p-6">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-lg font-semibold">
                                  ${priceRange.min} - ${priceRange.max}
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 h-2 rounded-full">
                                <div className="bg-green-500 h-full w-3/4 rounded-full" />
                              </div>
                              <p className="text-sm text-gray-500 mt-2">One week trip</p>
                            </CardContent>
                          </Card>
                        </div>

                        {/* Map Card */}
                        <div className="relative h-[42.5vh] w-full">
                          <Card className="h-full w-full">
                            <MapContainer
                              center={[51.505, -0.09]} // Default coordinates (e.g., London)
                              zoom={13}
                              scrollWheelZoom={false}
                              className="h-full w-full rounded-lg"
                            >
                              <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                              />
                              {/* Example Marker */}
                              <Marker position={[51.505, -0.09]}>
                                <Popup>A pretty popup. <br /> Easily customizable.</Popup>
                              </Marker>
                            </MapContainer>
                          </Card>
                          {/* Map Icon */}
                          <div className="absolute top-2 right-2 z-[1000] bg-white rounded-full p-2 shadow-md">
                            <Map className="h-6 w-6 text-gray-600" />
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                )}

                {selectedTab === 'Tractor' && (
                   <div className="container mx-auto p-6">
                   <div className="flex gap-6 h-[95vh]">
                     {/* Assistant Card */}
                     <div className="w-[47%]">
                     <Card className="max-w-md bg-gradient-to-b from-[#FF7A82] to-[#FF4D4D] shadow-md rounded-lg flex flex-col h-full -mt-[8.7rem]">
                     <CardHeader className="flex flex-row items-center justify-between py-4 px-4">
                           <div className="flex items-center gap-2">
                             <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black">
                               <Zap className="h-4 w-4 text-white" />
                             </div>
                             <span className="font-medium text-white">Assistant</span>
                           </div>
                           <button className="p-2 bg-black/10 hover:bg-black/5 rounded-lg transition-colors duration-200">
                             <Maximize2 size={20} className="text-gray-600" />
                           </button>
                         </CardHeader>
                         <CardContent className="flex flex-col justify-between grow py-6 px-4">
                           {/* Main Content */}
                           <div className="flex-grow flex items-center justify-center">
                             <div className="space-y-4 text-center">
                               <p className="text-[30px] font-large leading-tight text-left text-white">
                                 Ready to dive into some{" "}
                                 <span className="font-semibold text-white">hotel options</span>{" "}
                                 or maybe an{" "}
                                 <span className="font-semibold text-white">itinerary</span>?
                               </p>
                               <div className="flex flex-wrap gap-4 justify-left">
                                 <Button
                                   variant="secondary"
                                   className="px-3 py-3 text-lg bg-white/10 hover:bg-black/20 rounded-lg"
                                 >
                                   Hotel options
                                 </Button>
                                 <Button
                                   variant="secondary"
                                   className="px-3 py-3 text-lg bg-white/10 hover:bg-black/20 rounded-lg"
                                 >
                                   Itinerary
                                 </Button>
                                 <Button
                                   variant="secondary"
                                   className="px-3 py-3 text-lg bg-white/10 hover:bg-black/20 rounded-lg"
                                 >
                                   Things to do
                                 </Button>
                               </div>
                             </div>
                           </div>
                           {/* Bottom Section */}
                           <div className="flex items-center justify-between mt-6">
                             <Button variant="ghost" size="icon" className="h-10 w-10 bg-black/10 hover:bg-black/20">
                               <CreditCard className="h-4 w-4" />
                               <span className="sr-only">Payment</span>
                             </Button>
                             <Button
                               variant="default"
                               size="icon"
                               className="h-10 w-10 rounded-xl"
                             >
                               <Mic className="h-4 w-4 text-white" />
                               <span className="sr-only">Voice input</span>
                             </Button>
                             <Button variant="ghost" size="icon" className="h-10 w-10 bg-black/10 hover:bg-black/20">
                               <MessageCircleQuestion className="h-4 w-4" />
                               <span className="sr-only">Help</span>
                             </Button>
                           </div>
                         </CardContent>
                       </Card>
                     </div>

                     {/* Right Side Content */}
                     <div className="w-[100%] flex flex-col h-full">
                       {/* Weather and Price Range Cards */}
                       <div className="flex gap-6 mb-6">
                         {/* Weather Card */}
                         <Card className="flex-1 h-[30vh]">
                           <CardContent className="p-6">
                             <div className="flex items-center justify-between">
                               <div className="flex items-end gap-2">
                                 <span className="text-4xl font-bold">{temperature}</span>
                                 <span className="text-gray-500">°C</span>
                               </div>
                               <Sun className="text-yellow-400" size={40} />
                             </div>
                             <p className="text-sm text-gray-500 mt-2">For your dates</p>
                           </CardContent>
                         </Card>

                         {/* Price Range Card */}
                         <Card className="flex-1">
                           <CardContent className="p-6">
                             <div className="flex items-center justify-between mb-2">
                               <span className="text-lg font-semibold">
                                 ${priceRange.min} - ${priceRange.max}
                               </span>
                             </div>
                             <div className="w-full bg-gray-200 h-2 rounded-full">
                               <div className="bg-green-500 h-full w-3/4 rounded-full" />
                             </div>
                             <p className="text-sm text-gray-500 mt-2">One week trip</p>
                           </CardContent>
                         </Card>
                       </div>

                       {/* Map Card */}
                       <div className="relative h-[42.5vh] w-full">
                         <Card className="h-full w-full">
                           <MapContainer
                             center={[51.505, -0.09]} // Default coordinates (e.g., London)
                             zoom={13}
                             scrollWheelZoom={false}
                             className="h-full w-full rounded-lg"
                           >
                             <TileLayer
                               url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                               attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                             />
                             {/* Example Marker */}
                             <Marker position={[51.505, -0.09]}>
                               <Popup>A pretty popup. <br /> Easily customizable.</Popup>
                             </Marker>
                           </MapContainer>
                         </Card>
                         {/* Map Icon */}
                         <div className="absolute top-2 right-2 z-[1000] bg-white rounded-full p-2 shadow-md">
                           <Map className="h-6 w-6 text-gray-600" />
                         </div>
                       </div>

                     </div>
                   </div>
                 </div>
                )}

                {selectedTab === 'Attachment' && (
                   <div className="container mx-auto p-6">
                    <div className="flex gap-6 h-[95vh]">
                      {/* Assistant Card */}
                      <div className="w-[47%]">
                      <Card className="max-w-md bg-gradient-to-b from-[#FF7A82] to-[#FF4D4D] shadow-md rounded-lg flex flex-col h-full -mt-[8.7rem]">
                      <CardHeader className="flex flex-row items-center justify-between py-4 px-4">
                            <div className="flex items-center gap-2">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black">
                                <Zap className="h-4 w-4 text-white" />
                              </div>
                              <span className="font-medium text-white">Assistant</span>
                            </div>
                            <button className="p-2 bg-black/10 hover:bg-black/5 rounded-lg transition-colors duration-200">
                              <Maximize2 size={20} className="text-gray-600" />
                            </button>
                          </CardHeader>
                          <CardContent className="flex flex-col justify-between grow py-6 px-4">
                            {/* Main Content */}
                            <div className="flex-grow flex items-center justify-center">
                              <div className="space-y-4 text-center">
                                <p className="text-[30px] font-large leading-tight text-left text-white">
                                  Ready to dive into some{" "}
                                  <span className="font-semibold text-white">hotel options</span>{" "}
                                  or maybe an{" "}
                                  <span className="font-semibold text-white">itinerary</span>?
                                </p>
                                <div className="flex flex-wrap gap-4 justify-left">
                                  <Button
                                    variant="secondary"
                                    className="px-3 py-3 text-lg bgwhitek/10 hover:bg-black/20 rounded-lg"
                                  >
                                    Hotel options
                                  </Button>
                                  <Button
                                    variant="secondary"
                                    className="px-3 py-3 text-lg bgwhitek/10 hover:bg-black/20 rounded-lg"
                                  >
                                    Itinerary
                                  </Button>
                                  <Button
                                    variant="secondary"
                                    className="px-3 py-3 text-lg bgwhitek/10 hover:bg-black/20 rounded-lg"
                                  >
                                    Things to do
                                  </Button>
                                </div>
                              </div>
                            </div>
                            {/* Bottom Section */}
                            <div className="flex items-center justify-between mt-6">
                              <Button variant="ghost" size="icon" className="h-10 w-10 bg-black/10 hover:bg-black/20">
                                <CreditCard className="h-4 w-4" />
                                <span className="sr-only">Payment</span>
                              </Button>
                              <Button
                                variant="default"
                                size="icon"
                                className="h-10 w-10 rounded-xl"
                              >
                                <Mic className="h-4 w-4 text-white" />
                                <span className="sr-only">Voice input</span>
                              </Button>
                              <Button variant="ghost" size="icon" className="h-10 w-10 bg-black/10 hover:bg-black/20">
                                <MessageCircleQuestion className="h-4 w-4" />
                                <span className="sr-only">Help</span>
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Right Side Content */}
                      <div className="w-[100%] flex flex-col h-full">
                        {/* Weather and Price Range Cards */}
                        <div className="flex gap-6 mb-6">
                          {/* Weather Card */}
                          <Card className="flex-1 h-[30vh]">
                            <CardContent className="p-6">
                              <div className="flex items-center justify-between">
                                <div className="flex items-end gap-2">
                                  <span className="text-4xl font-bold">{temperature}</span>
                                  <span className="text-gray-500">°C</span>
                                </div>
                                <Sun className="text-yellow-400" size={40} />
                              </div>
                              <p className="text-sm text-gray-500 mt-2">For your dates</p>
                            </CardContent>
                          </Card>

                          {/* Price Range Card */}
                          <Card className="flex-1">
                            <CardContent className="p-6">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-lg font-semibold">
                                  ${priceRange.min} - ${priceRange.max}
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 h-2 rounded-full">
                                <div className="bg-green-500 h-full w-3/4 rounded-full" />
                              </div>
                              <p className="text-sm text-gray-500 mt-2">One week trip</p>
                            </CardContent>
                          </Card>
                        </div>

                        {/* Map Card */}
                        <div className="relative h-[42.5vh] w-full">
                          <Card className="h-full w-full">
                            <MapContainer
                              center={[51.505, -0.09]} // Default coordinates (e.g., London)
                              zoom={13}
                              scrollWheelZoom={false}
                              className="h-full w-full rounded-lg"
                            >
                              <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                              />
                              {/* Example Marker */}
                              <Marker position={[51.505, -0.09]}>
                                <Popup>A pretty popup. <br /> Easily customizable.</Popup>
                              </Marker>
                            </MapContainer>
                          </Card>
                          {/* Map Icon */}
                          <div className="absolute top-2 right-2 z-[1000] bg-white rounded-full p-2 shadow-md">
                            <Map className="h-6 w-6 text-gray-600" />
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                )}


              </div>
            </div>





            {/* Location Info */}
            <div className="flex items-center gap-2 mb-4">
              <Map size={20} />
              <span>{location}</span>
            </div>
          </div>
        </main>

        {/* Dashboard Grid */}

      </div>
  )
}