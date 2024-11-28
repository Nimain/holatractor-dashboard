"use client"

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
  CheckCircle,
  AlertCircle,
  Clock,
  CreditCard,
  LogIn,
  Bell,
  Trash2,
  Tractor,
  Calendar,
  PlayCircle,
  PauseCircle,
  RefreshCcw
} from "lucide-react"
import Link from "next/link"
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
import Sidebar from "./_components/Sidebar"
import TranslatedText from "@/components/Menubar/TranslatedText"
import {
  activeBookings,
  completedBookings,
  totalFarms,
  totalPaidTranslation,
  totalUnpaidTranslation,
  WelcomeTranslation, totalLandArea,
  recentBookingsTranslation,
  noBookingsAvailableTranslation,
  bookingTranslation,
  totalTractorsTranslation,
  totalAttachmentsTranslation,
  viewTranslation,
  latitudeTranslation,
  longitudeTranslation,
  tractorsTranslation,
  attachmentsTranslation,
  totalCostTranslation,
  logTranslations
} from "./FarmerTranslation"
import Languages from "@/components/Menubar/Languages"
import { useDispatch, useSelector } from "react-redux"
import { RootState } from "@/redux/store"
import { changeFarm } from "@/redux/ActiveFarm/ActiveFarm"
import { motion, AnimatePresence } from 'framer-motion'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import io, { Socket } from 'socket.io-client';
import WithoutStoreBooking from "./WithoutStoreBooking"
import LatestBookingComponent from "./_components/LatestBookingComponent"

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

  const [notifications, setNotifications] = useState<FarmerNotification[]>([])
  const [isOpen, setIsOpen] = useState(false)

  const [socket, setSocket] = useState<Socket | null>(null);

  const { activeFarm } = useSelector(
    (root: RootState) => root.ActiveFarm
  );
  const dispatch = useDispatch()

  const { cookie } = useCookie()
  const user: user = cookie.get("user")
  const access_token = cookie.get("access_token")

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
        dispatch(changeFarm(res.data.farms[0]))
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

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
    renderInstance.delete(`/farmer/deleteNotification/${id}`, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    })
  }

  const fetchNotifications = async () => {
    renderInstance.get(`/farmer/${user.userId}`)
      .then((res) => {
        setNotifications(res.data.notifications)
      })
  }

  const showBrowserNotification = (notification: any) => {
    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message
      });
    }
  };

  useEffect(() => {
    fetchNotifications()
  }, [])

  useEffect(() => {
    if (!isOpen) {
      fetchNotifications()
    }
  }, [isOpen])

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
    // Connect to the socket server
    const newSocket: Socket = io(NestJsBaseURL, {
      query: {
        userId: user.userId
      }
    });
    setSocket(newSocket);

    // Listen for the 'newFarmerNotification' event
    newSocket.on('newFarmerNotification', (notification: FarmerNotification) => {
      showBrowserNotification(notification)
      setNotifications((prev) => [notification, ...prev]);
    });

    // Clean up the event listener when the component unmounts
    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

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
            <WithoutStoreBooking />
            <Link href={"/farmer/new-booking"}>
              <Button>
                New Booking
              </Button>
            </Link>
            <Languages />
            <Popover open={isOpen} onOpenChange={setIsOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {notifications.length > 0 && (
                    <span className="absolute top-0 right-0 h-4 w-4 bg-primaryColor text-white rounded-full text-xs flex items-center justify-center">
                      {notifications.length}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0 mr-6">
                <Card className="w-sm">
                  <CardHeader className="pb-3">
                    <CardTitle>Notifications</CardTitle>
                  </CardHeader>
                  <CardContent className="max-h-[60vh] overflow-auto">
                    <AnimatePresence initial={false}>
                      {notifications.map(notification => (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="w-full relative mb-4 p-4 bg-gray-100 rounded-lg group"
                        >
                          <div className="flex items-start">
                            <div className="ml-3 flex-1">
                              <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                              <p className="mt-1 text-sm text-gray-500">{notification.message}</p>
                            </div>
                            <Button
                              onClick={() => deleteNotification(notification.id)}
                              className="bg-transparent hover:bg-gray-200 -mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                            >
                              <Trash2 className="h-4 w-4 text-black" />
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </PopoverContent>
            </Popover>
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
                    <div className="text-2xl font-bold flex items-center gap-2 flex-wrap">
                      <p>
                        {activeFarm && activeFarm.boundary.area.toFixed(2)}
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
                    center={!activeFarm ? [location.latitude, location.longitude] : activeFarm.boundary.coordinates[0]}
                    zoom={20}
                    scrollWheelZoom={false}
                    style={{ width: "100%", height: "300px", borderRadius: "16px", zIndex: 1 }}>
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {
                      farms.length != 0 && farms.map((details, index) => {
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
                  <>
                    <h1 className="text-center mb-3 text-2xl font-bold">
                      <TranslatedText greetings={logTranslations.systemActivity} />
                    </h1>
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
                        {allLogs.length === 0 ? <p><TranslatedText greetings={logTranslations.noLogsPresent} /></p> : allLogs.filter((log) => (log.userId === user.userId)).reverse().map((log, index) => (
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
                  </>
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