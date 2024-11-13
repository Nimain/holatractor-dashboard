"use client"

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CalendarIcon, MapPinIcon, TractorIcon, ClipboardListIcon, UserIcon, BarChartIcon, ClockIcon, Truck, DollarSignIcon, Pickaxe, LandPlot } from "lucide-react"
import Link from "next/link"
import { useCookie } from "next-cookie"
import { useEffect, useState } from "react"
import { Booking, BookingStatus, Farm, Farmer, Logs } from "@/utils/Types/types"
import { renderInstance } from "@/utils/Axios/RenderInstance"
import { errorMessage, successMessage } from "@/utils/Toastify/Messages"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import FarmerBookingHistory from "./BookingHistory"
import FarmerShrimmer from "./_components/FarmerShrimmer"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MapContainer, Marker, Polygon, TileLayer } from "react-leaflet"
import "leaflet/dist/leaflet.css";
import WeatherWidget from "./_components/WeatherWidget"
import axios from "axios"
import UserProfileCard from "./_components/UserProfile"
import { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import Sidebar from "./_components/Sidebar"
import { area, polygon } from "@turf/turf";
import TranslatedText from "@/components/Menubar/TranslatedText"
import { activeBookings, completedBookings, totalFarms, totalPaidTranslation, totalUnpaidTranslation, WelcomeTranslation, totalLandArea, recentBookingsTranslation, noBookingsAvailableTranslation, bookingTranslation, totalTractorsTranslation, totalAttachmentsTranslation, viewTranslation, latitudeTranslation, longitudeTranslation, tractorsTranslation, attachmentsTranslation, totalCostTranslation, logTranslations } from "./FarmerTranslation"
import Languages from "@/components/Menubar/Languages"

interface user {
  userId: string;
  image: string;
  name: string;
  email: string;
  email_varified: boolean;
}

interface Location {
  latitude: number | null;
  longitude: number | null;
}

const FarmerDashboard = () => {

  const [farmer, setFarmer] = useState<Farmer | null>(null)
  const [fetchingFarmerDetails, setFetchingFarmerDetails] = useState(false)
  const [totalPaid, settotalPaid] = useState<number>(0)
  const [totalUnpaid, settotalUnpaid] = useState<number>(0)
  const [completedBookingsCount, setcompletedBookingsCount] = useState<number>(0)
  const [totalBookings, settotalBookings] = useState<number>(0)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [farms, setFarms] = useState<Farm[]>([])
  const [totalArea, setTotalArea] = useState(0)

  const [location, setLocation] = useState<Location>({ latitude: null, longitude: null });
  const [ip, setIp] = useState('');
  const [city, setCity] = useState('')
  const [error, setError] = useState<string | null>(null);

  const [allLogs, setAllLogs] = useState<Logs[]>([])
  const [fetchingLogs, setFetchingLogs] = useState(false)

  const { cookie } = useCookie()
  const user: user = cookie.get("user")

  const limeOptions = { color: 'lime' }

  function fetchFarmer() {
    setFetchingFarmerDetails(true)

    renderInstance.get(`/farmer/${user.userId}`)
      .then((res) => {
        setFarmer(res.data.details)
        settotalPaid(res.data.totalPaid)
        settotalUnpaid(res.data.totalUnpaid)
        setcompletedBookingsCount(res.data.completedBookings)
        settotalBookings(res.data.totalBookings)
        setBookings(res.data.bookings)
        setFarms(res.data.farms)

      }).catch((err) => {
        if (err.response && err.response.status === 404 && err.response.data.message === "Farmer not found") {
          errorMessage("Farmer not found")
        } else {
          errorMessage("Error fetching user detaild")
        }
      }).finally(() => {
        setFetchingFarmerDetails(false)
      })
  }

  function fetchLogs() {
    setFetchingLogs(true)
    renderInstance.get('/log')
      .then((res) => {
        setAllLogs(res.data)
      }).catch((err) => {
        errorMessage("Error in fetching log details")
      }).finally(() => {
        setFetchingLogs(false)
      })
  }

  const formatDate = (date: string | Date): string => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };

    const dateObj = typeof date === "string" ? new Date(date) : date;

    return dateObj.toLocaleDateString(undefined, options);
  };

  const truncateDetails = (details: string) => {
    return details.slice(0, 15) + (details.length > 15 ? '...' : '')
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  useEffect(() => {
    if (user) {
      fetchFarmer()
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


  useEffect(() => {
    axios.get("https://api64.ipify.org?format=json")
      .then((res) => {
        // console.log(res)
        // const userIp = response.data.ip;
        setIp(res.data.ip);
      })
      .catch((err) => {
        console.log(err)
      })
  }, [])

  useEffect(() => {
    if (ip) {
      axios.get(`https://ipapi.co/${ip}/json/`)
        .then((res) => {
          // console.log(res)
          const { city } = res.data
          // console.log(city)
          setCity(city)
        })
        .catch((err) => {
          // console.log(err)
        })
    }
  }, [ip])

  useEffect(() => {
    for (const farm of farms) {
      // Convert Leaflet coordinates to Turf.js-compatible format (GeoJSON-like)
      const coordinates = farm.boundary.coordinates.map((latlng: { lng: any; lat: any; }) => [latlng.lng, latlng.lat]);

      // Close the polygon by repeating the first coordinate at the end
      coordinates.push(coordinates[0]);

      // Create a Turf.js polygon
      const polyArea = polygon([coordinates]);
      const tempTotalArea = area(polyArea);

      setTotalArea(tempTotalArea)
    }
  }, [farms])

  if (fetchingFarmerDetails) return <FarmerShrimmer />

  if (!user) return <p>user not found</p>

  return (
    <div className="w-full mx-auto my-2 flex gap-5 h-screen overflow-hidden">

      <Sidebar farms={farms} />

      <div className="h-screen overflow-auto w-full" style={{ scrollbarWidth: "none" }}>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div className="flex items-center mb-4 md:mb-0">
            <h1 className="text-xl md:text-3xl font-bold"><TranslatedText greetings={WelcomeTranslation} /> {user.name}!</h1>
          </div>
          <div className="flex items-center gap-6 ml-auto">
            <Languages />
            <Avatar>
              {
                user.image &&
                <AvatarImage src={user.image} alt={`${user.name}`} />
              }
              <AvatarFallback className="bg-white drop-shadow-md">{user.name[0]}{user.name[1]}</AvatarFallback>
            </Avatar>
          </div>
        </div>

        <div className="w-full flex gap-4 my-4">

          <div className="w-full space-y-6">

            <div className="w-full block 1200px:hidden">

              <UserProfileCard
                avatarUrl={user.image}
                email={user.email}
                isEmailVerified={user.email_varified}
                isOnline={true}
                name={user.name} />

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 1200px:grid-cols-4 gap-6 mb-8">
              <Card className="rounded-2xl space-y-2 bg-[#D0E1E9]">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    <TranslatedText greetings={activeBookings} />
                  </CardTitle>
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalBookings}</div>
                </CardContent>
              </Card>
              <Card className="rounded-2xl space-y-2 bg-[#D0E1E9]">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    <TranslatedText greetings={completedBookings} />
                  </CardTitle>
                  <TractorIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{completedBookingsCount}</div>
                </CardContent>
              </Card>
              <Card className="rounded-2xl space-y-2 bg-[#D0E1E9]">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    <TranslatedText greetings={totalPaidTranslation} />
                  </CardTitle>
                  <ClipboardListIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalPaid.toFixed(2)}</div>
                </CardContent>
              </Card>
              <Card className="rounded-2xl space-y-2 bg-[#D0E1E9]">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    <TranslatedText greetings={totalUnpaidTranslation} />
                  </CardTitle>
                  <BarChartIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalUnpaid.toFixed(2)}</div>
                </CardContent>
              </Card>
            </div>

            <div className="w-full grid grid-cols-1 md:grid-cols-2 1200px:grid-cols-4 gap-6">

              <div className="grid grid-cols-1 md:grid-cols-2 1200px:flex 1200px:flex-col gap-6 col-span-2 1200px:col-span-1">
                <Card className="rounded-2xl space-y-2 bg-[#D0E1E9]">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      <TranslatedText greetings={totalFarms} />
                    </CardTitle>
                    <Pickaxe className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{farms.length}</div>
                  </CardContent>
                </Card>
                <Card className="rounded-2xl space-y-2 bg-[#D0E1E9]">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      <TranslatedText greetings={totalLandArea} />
                    </CardTitle>
                    <LandPlot className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totalArea.toFixed(2)}</div>
                  </CardContent>
                </Card>
              </div>

              <div className="col-span-2 1200px:col-span-3">
                {error ? (
                  <p>Error: {error}</p>
                ) : (location.latitude && location.longitude) ? (
                  <MapContainer
                    center={farms.length === 0 ? [location.latitude, location.longitude] : farms[0].boundary.coordinates[0]}
                    zoom={20}
                    scrollWheelZoom={false}
                    style={{ width: "100%", height: "300px", borderRadius: "16px", zIndex: 1 }}>
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {/* <Marker
                      position={[location.latitude, location.longitude]}
                      icon={L.divIcon({
                        iconSize: [32, 32],
                        iconAnchor: [32 / 2, 32 + 9],
                        className: "mymarker",
                        html: "😁",
                      })}> */}
                    {/* </Marker> */}
                    {
                      farms.length != 0 &&
                      <Polygon pathOptions={limeOptions} positions={farms[0].boundary.coordinates} />
                    }
                  </MapContainer>
                ) : (
                  <p>Latitude and longitude not available</p>
                )}
              </div>

            </div>

            <div className="w-full 900px:w-fit flex 1200px:hidden flex-col gap-4">

              <h1 className="text-2xl font-bold text-center">
                <TranslatedText greetings={recentBookingsTranslation} />
              </h1>

              <div className="space-y-4">
                {
                  bookings.length === 0 ?
                    <p>
                      <TranslatedText greetings={noBookingsAvailableTranslation} />
                    </p>
                    :
                    bookings.map((booking, i) => {
                      if (i > 1) return null
                      return (
                        <Card className="w-full 900px:max-w-sm 900px:min-w-sm flex items-center justify-between flex-shrink-0 py-2 px-4 rounded-2xl bg-[#D0E1E9]" key={i}>
                          <div className="flex items-center">
                            <TractorIcon className="h-6 w-6 mr-2 text-muted-foreground" />
                            <div className='w-full'>
                              <div className='w-full flex items-center justify-betweenn flex-wrap gap-1'>
                                <p className="font-bold text-sm"><TranslatedText greetings={bookingTranslation} /> #{`Holabooking${booking.id.slice(-4)}`}</p>
                                <Badge className='text-xs bg-yellow-200 text-yellow-800 hover:text-yellow-900 hover:bg-yellow-300'>
                                  <p>{booking.bookingStatus}</p>
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground"><TranslatedText greetings={totalTractorsTranslation} /> {booking.tractors.length}</p>
                              <p className="text-sm text-muted-foreground"><TranslatedText greetings={totalAttachmentsTranslation} /> {booking.attachments.length}</p>
                            </div>
                          </div>
                          <BookingCard booking={booking} id={`#Holabooking${booking.id.slice(-4)}`} />
                        </Card>
                      )
                    })
                }
              </div>

            </div>

            <div className="w-full bg-white p-2 rounded-2xl drop-shadow h-96 overflow-auto" style={{ scrollbarWidth: "none" }}>
              {
                fetchingLogs ?
                  <p><TranslatedText greetings={logTranslations.logsLoading} />...</p>
                  :
                  <Table>
                    <TableCaption>
                      <TranslatedText greetings={logTranslations.recentActivitiesList} />
                    </TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-bold">
                          <TranslatedText greetings={logTranslations.slNo} />
                        </TableHead>
                        <TableHead className="font-bold">
                          <TranslatedText greetings={logTranslations.action} />
                        </TableHead>
                        <TableHead className="font-bold">
                        <TranslatedText greetings={logTranslations.details} />
                        </TableHead>
                        <TableHead className="font-bold">
                        <TranslatedText greetings={logTranslations.time} />
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allLogs.length === 0 ? <p><TranslatedText greetings={logTranslations.noLogsPresent} /></p> : allLogs.filter((log) => (log.userId === user.userId)).map((log, index) => (
                        <TooltipProvider
                          key={index}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <TableRow>
                                <TableCell>{index + 1}</TableCell>
                                <TableCell>{log.action}</TableCell>
                                <TableCell>{truncateDetails(log.details)}</TableCell>
                                <TableCell>{formatDate(log.createdAt)}</TableCell>
                              </TableRow>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{log.details}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ))}
                    </TableBody>
                  </Table>
              }
            </div>

            <div className="w-full block 1200px:hidden">
              <WeatherWidget city={city} />
            </div>

          </div>

          <div className="hidden 900px:flex flex-col gap-6">

            <UserProfileCard
              avatarUrl={user.image}
              email={user.email}
              isEmailVerified={user.email_varified}
              isOnline={true}
              name={user.name} />

            <div className="w-fit flex flex-col gap-4">

              <h1 className="text-2xl font-bold text-center">
              <TranslatedText greetings={recentBookingsTranslation} />
              </h1>

              <div className="space-y-4">
                {
                  bookings.length === 0 ?
                    <p>
                      <TranslatedText greetings={noBookingsAvailableTranslation} />
                    </p>
                    :
                    bookings.map((booking, i) => {
                      if (i > 1) return null
                      return (
                        <Card className="w-full max-w-sm min-w-sm flex items-center justify-between flex-shrink-0 py-2 px-4 rounded-2xl bg-[#D0E1E9]" key={i}>
                          <div className="flex items-center">
                            <TractorIcon className="h-6 w-6 mr-2 text-muted-foreground" />
                            <div className='w-full'>
                              <div className='w-full flex items-center justify-betweenn flex-wrap gap-1'>
                                <p className="font-bold text-sm"><TranslatedText greetings={bookingTranslation} /> #{`Holabooking${booking.id.slice(-4)}`}</p>
                                <Badge className='text-xs bg-yellow-200 text-yellow-800 hover:text-yellow-900 hover:bg-yellow-300'>
                                  <p>{booking.bookingStatus}</p>
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground"><TranslatedText greetings={totalTractorsTranslation} /> {booking.tractors.length}</p>
                              <p className="text-sm text-muted-foreground"><TranslatedText greetings={totalAttachmentsTranslation} /> {booking.attachments.length}</p>
                            </div>
                          </div>
                          <BookingCard booking={booking} id={`#Holabooking${booking.id.slice(-4)}`} />
                        </Card>
                      )
                    })
                }
              </div>

            </div>

            <WeatherWidget city={city} />

          </div>

        </div>

        <FarmerBookingHistory />

      </div>
    </div>
  )
}

export default FarmerDashboard

const BookingCard = ({ booking, id }: { booking: Booking; id: string }) => {
  const [open, setOpen] = useState(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>

      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <TranslatedText greetings={viewTranslation} />
        </Button>
      </DialogTrigger>

      <DialogContent className="w-fit h-fit">

        <Card className="w-full max-w-sm">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg font-semibold">id: {id}</CardTitle>
              <Badge className={'bg-blue-100 text-blue-800'}>
                {
                  booking.bookingStatus
                }
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <CalendarIcon className="w-4 h-4 text-gray-500" />
              <span className="text-sm">
                {new Date(booking.start_date).toLocaleDateString()} -
                {booking.end_date ? new Date(booking.end_date).toLocaleDateString() : booking.booking_hours}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <ClockIcon className="w-4 h-4 text-gray-500" />
              <span className="text-sm">
                {new Date(booking.start_date).toLocaleTimeString()} -
                {booking.booking_hours && booking.booking_hours}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPinIcon className="w-4 h-4 text-gray-500" />
              <span className="text-sm">
                <TranslatedText greetings={latitudeTranslation} />: {booking.booking_location_lat}, <TranslatedText greetings={longitudeTranslation} />: {booking.booking_location_lan}
              </span>
            </div>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <TractorIcon className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium"><TranslatedText greetings={tractorsTranslation} />:</span>
              </div>
              <ul className="list-disc list-inside text-sm pl-6">
                {booking.tractors.map((tractor, index) => (
                  <li key={index}>{tractor.tractor.baseTractor.name}</li>
                ))}
              </ul>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Truck className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium"><TranslatedText greetings={attachmentsTranslation} />:</span>
              </div>
              <ul className="list-disc list-inside text-sm pl-6">
                {booking.attachments.map((attachment, index) => (
                  <li key={index}>{attachment.attachment.baseAttachment.name}</li>
                ))}
              </ul>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <DollarSignIcon className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium"><TranslatedText greetings={totalCostTranslation} />:</span>
              </div>
              <span className="text-lg font-bold">${booking.total_cost.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

      </DialogContent>

    </Dialog>
  )
}