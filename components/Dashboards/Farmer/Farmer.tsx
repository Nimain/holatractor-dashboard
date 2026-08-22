"use client"

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  CalendarIcon,
  MapPinIcon,
  TractorIcon,
  ClipboardListIcon,
  UserIcon,
  BarChartIcon,
  ClockIcon,
  Truck,
  DollarSignIcon,
  Pickaxe,
  LandPlot,
} from "lucide-react"
import { useCookie } from "next-cookie"
import { useEffect, useState } from "react"
import { Booking, BookingStatus, Farm, Farmer, FarmerNotification, FarmerNotificationType, Logs } from "@/utils/Types/types"
import { renderInstance, NestJsBaseURL } from "@/utils/Axios/RenderInstance"
import { errorMessage } from "@/utils/Toastify/Messages"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import FarmerBookingHistory from "./BookingHistory"
import FarmerShrimmer from "./_components/FarmerShrimmer"
import { MapContainer, Polygon, TileLayer } from "react-leaflet"
import "leaflet/dist/leaflet.css";
import WeatherWidget from "./_components/WeatherWidget"
import axios from "axios"
import UserProfileCard from "./_components/UserProfile"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import TranslatedText from "@/components/Menubar/TranslatedText"
import {
  activeBookings,
  completedBookings,
  totalFarms,
  totalPaidTranslation,
  totalUnpaidTranslation,
  WelcomeTranslation, totalLandArea,
  recentBookingsTranslation,
  viewTranslation,
  latitudeTranslation,
  longitudeTranslation,
  tractorsTranslation,
  attachmentsTranslation,
  totalCostTranslation,
  logTranslations
} from "./FarmerTranslation"
import { useDispatch, useSelector } from "react-redux"
import { RootState } from "@/redux/store"
import { changeFarm } from "@/redux/ActiveFarm/ActiveFarm"
import LatestBookingComponent from "./_components/LatestBookingComponent"
import { ClassNames } from "@emotion/react"

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

  const [location, setLocation] = useState<Location>({ latitude: null, longitude: null });
  const [ip, setIp] = useState('');
  const [city, setCity] = useState('')
  const [error, setError] = useState<string | null>(null);

  const [allLogs, setAllLogs] = useState<Logs[]>([])
  const [fetchingLogs, setFetchingLogs] = useState(false)

  const { activeFarm } = useSelector(
    (root: RootState) => root.ActiveFarm
  );
  const dispatch = useDispatch()

  const { cookie } = useCookie()
  const rawUser = cookie.get("user")
  const parsedUser: any = typeof rawUser === "string" ? (() => { try { return JSON.parse(rawUser) } catch { return null } })() : rawUser
  const user: user = parsedUser || {}
  const userId = parsedUser?.userId || parsedUser?.id || parsedUser?.sub || parsedUser?._id

  const limeOptions = { color: 'lime' }

  function fetchFarmer() {
    if (!userId) return

    setFetchingFarmerDetails(true)

    renderInstance.get(`/farmer/${userId}`)
      .then((res) => {
        setFarmer(res.data?.details || null)
        settotalPaid(typeof res.data?.totalPaid === "number" ? res.data.totalPaid : 0)
        settotalUnpaid(typeof res.data?.totalUnpaid === "number" ? res.data.totalUnpaid : 0)
        setcompletedBookingsCount(typeof res.data?.completedBookings === "number" ? res.data.completedBookings : 0)
        settotalBookings(typeof res.data?.totalBookings === "number" ? res.data.totalBookings : 0)
        setBookings(Array.isArray(res.data?.bookings) ? res.data.bookings : [])
        const fetchedFarms = Array.isArray(res.data?.farms) ? res.data.farms : []
        setFarms(fetchedFarms)
        setAllLogs(Array.isArray(res.data?.logs) ? res.data.logs : [])
        if (fetchedFarms.length > 0) {
          dispatch(changeFarm(fetchedFarms[0]))
        }
      }).catch((err) => {
        if (err.response && err.response.status === 404 && err.response.data?.message === "Farmer not found") {
          errorMessage("Farmer not found")
        } else {
          errorMessage("Error fetching user details")
        }
      }).finally(() => {
        setFetchingFarmerDetails(false)
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

    return isNaN(dateObj.getTime()) ? "N/A" : dateObj.toLocaleDateString(undefined, options);
  };

  const truncateDetails = (details: string) => {
    if (!details) return ""
    return details.slice(0, 15) + (details.length > 15 ? '...' : '')
  }

  useEffect(() => {
    if (userId) {
      fetchFarmer()
    }
  }, [userId])

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

  if (fetchingFarmerDetails) return <FarmerShrimmer />

  if (!user) return <p>user not found</p>

  return (
      <div className="h-screen overflow-auto w-full" style={{ scrollbarWidth: "none" }}>

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
              <Card className="rounded-2xl space-y-2 bg-gradient-to-r from-[#8c0000] to-[#4d0000] text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    <TranslatedText greetings={activeBookings} />
                  </CardTitle>
                  <CalendarIcon className="h-4 w-4 text-muted" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalBookings}</div>
                </CardContent>
              </Card>
              <Card className="rounded-2xl space-y-2 bg-gradient-to-r from-[#8c0000] to-[#4d0000] text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    <TranslatedText greetings={completedBookings} />
                  </CardTitle>
                  <TractorIcon className="h-4 w-4 text-muted" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{completedBookingsCount}</div>
                </CardContent>
              </Card>
              <Card className="rounded-2xl space-y-2 bg-gradient-to-r from-[#8c0000] to-[#4d0000] text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    <TranslatedText greetings={totalPaidTranslation} />
                  </CardTitle>
                  <ClipboardListIcon className="h-4 w-4 text-muted" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalPaid.toFixed(2)}</div>
                </CardContent>
              </Card>
              <Card className="rounded-2xl space-y-2 bg-gradient-to-r from-[#8c0000] to-[#4d0000] text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    <TranslatedText greetings={totalUnpaidTranslation} />
                  </CardTitle>
                  <BarChartIcon className="h-4 w-4 text-muted" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalUnpaid.toFixed(2)}</div>
                </CardContent>
              </Card>
            </div>

            <div className="w-full grid grid-cols-1 md:grid-cols-2 1200px:grid-cols-4 gap-6">

              <div className="grid grid-cols-1 md:grid-cols-2 1200px:flex 1200px:flex-col gap-6 col-span-2 1200px:col-span-1">
                <Card className="rounded-2xl space-y-2 bg-gradient-to-r from-[#8c0000] to-[#4d0000] text-white">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      <TranslatedText greetings={totalFarms} />
                    </CardTitle>
                    <Pickaxe className="h-4 w-4 text-muted" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{farms.length}</div>
                  </CardContent>
                </Card>
                <Card className="rounded-2xl space-y-2 bg-gradient-to-r from-[#8c0000] to-[#4d0000] text-white">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      <TranslatedText greetings={totalLandArea} />
                    </CardTitle>
                    <LandPlot className="h-4 w-4 text-muted" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold flex items-center gap-2 flex-wrap">
                      <p>
                        {activeFarm && activeFarm.boundary && typeof activeFarm.boundary.area === "number" ? activeFarm.boundary.area.toFixed(2) : "0.00"}
                      </p>
                      <Badge className="bg-red-200 text-red-700 hover:bg-red-300 hover:text-red-900">Sq.m</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="col-span-2 1200px:col-span-3">
                {error ? (
                  <p>Error: {error}</p>
                ) : (location.latitude && location.longitude) ? (
                  <MapContainer
                    center={
                      activeFarm?.boundary?.coordinates && activeFarm.boundary.coordinates.length > 0
                        ? (activeFarm.boundary.coordinates[0] as [number, number])
                        : [location.latitude, location.longitude]
                    }
                    zoom={20}
                    scrollWheelZoom={false}
                    style={{ width: "100%", height: "300px", borderRadius: "16px", zIndex: 1 }}>
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {
                      farms.length != 0 && farms.map((details, index) => {
                        if (!details?.boundary?.coordinates) return null
                        return (
                          <div key={index}>
                            <Polygon pathOptions={limeOptions} positions={details.boundary.coordinates} />
                          </div>
                        )
                      })
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

              <LatestBookingComponent booking={bookings} bookingLength={totalBookings} />

            </div>

            <div className="w-full bg-white p-2 rounded-2xl drop-shadow h-96 overflow-auto" style={{ scrollbarWidth: "none" }}>
              {
                fetchingLogs ?
                  <p><TranslatedText greetings={logTranslations.logsLoading} />...</p>
                  :
                  <div className="bg-gradient-to-r from-[#8c0000] to-[#4d0000] text-white">
                    <h1 className="text-center mb-3 text-2xl font-bold bg-gradient-to-r from-[#8c0000] to-[#4d0000] text-white">
                      <TranslatedText greetings={logTranslations.systemActivity} />
                    </h1>
                    <Table  className="bg-gradient-to-r from-[#8c0000] to-[#4d0000] text-white">
                      <TableCaption className="text-white">
                        <TranslatedText greetings={logTranslations.recentActivitiesList} />
                      </TableCaption>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="font-bold text-white">
                            <TranslatedText greetings={logTranslations.slNo} />
                          </TableHead>
                          <TableHead className="font-bold text-white">
                            <TranslatedText greetings={logTranslations.action} />
                          </TableHead>
                          <TableHead className="font-bold text-white">
                            <TranslatedText greetings={logTranslations.details} />
                          </TableHead>
                          <TableHead className="font-bold text-white">
                            <TranslatedText greetings={logTranslations.time} />
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allLogs.length === 0 ? <p><TranslatedText greetings={logTranslations.noLogsPresent} /></p> : allLogs.filter((log) => (log.userId === user.userId)).reverse().map((log, index) => (
                          <TooltipProvider
                            key={index}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <TableRow >
                                  <TableCell>{index + 1}</TableCell>
                                  <TableCell>{log.action}</TableCell>
                                  <TableCell>{truncateDetails(log.details)}</TableCell>
                                  <TableCell>{formatDate(log.createdAt)}</TableCell>
                                </TableRow>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-white">{log.details}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
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
              <LatestBookingComponent booking={bookings} bookingLength={totalBookings} />

            <WeatherWidget city={city} />

          </div>

        </div>

        {/* <FarmerBookingHistory /> */}

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