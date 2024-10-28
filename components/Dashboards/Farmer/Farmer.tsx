"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CalendarIcon, MapPinIcon, TractorIcon, ClipboardListIcon, UserIcon, BarChartIcon } from "lucide-react"
import Link from "next/link"
import { useCookie } from "next-cookie"
import { useEffect, useState } from "react"
import { Booking, Farmer } from "@/utils/Types/types"
import { renderInstance } from "@/utils/Axios/RenderInstance"
import { errorMessage } from "@/utils/Toastify/Messages"
import { Badge } from "@/components/ui/badge"

interface user {
  userId: string;
  image: string;
  name: string;
  email: string;
}

const FarmerDashboard = () => {

  const [farmer, setFarmer] = useState<Farmer | null>(null)
  const [fetchingFarmerDetails, setFetchingFarmerDetails] = useState(false)
  const [totalPaid, settotalPaid] = useState<number>(0)
  const [totalUnpaid, settotalUnpaid] = useState<number>(0)
  const [completedBookings, setcompletedBookings] = useState<number>(0)
  const [totalBookings, settotalBookings] = useState<number>(0)
  const [bookings, setBookings] = useState<Booking[]>([])

  const { cookie } = useCookie()
  const user: user = cookie.get("user")

  function fetchFarmer() {
    setFetchingFarmerDetails(true)

    renderInstance.get(`/farmer/${user.userId}`)
      .then((res) => {
        setFarmer(res.data.details)
        settotalPaid(res.data.totalPaid)
        settotalUnpaid(res.data.totalUnpaid)
        setcompletedBookings(res.data.completedBookings)
        settotalBookings(res.data.totalBookings)
        setBookings(res.data.bookings)
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

  useEffect(() => {
    if (user) {
      fetchFarmer()
    }
  }, [])

  if (fetchingFarmerDetails) return <p>Loading farmer details</p>

  if (!user) return <p>user not found</p>

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div className="flex items-center mb-4 md:mb-0">
          <Avatar className="h-20 w-20 mr-4">
            {
              user.image &&
              <AvatarImage src={user.image} alt={`${user.name}`} />
            }
            <AvatarFallback>{user.name[0]}{user.name[1]}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold">Welcome, {user.name}!</h1>
            <p className="text-muted-foreground flex items-center mt-1">
              <MapPinIcon className="w-4 h-4 mr-1" />
              {farmer?.farm_location_id ? `${farmer.farm?.country} ${farmer.farm?.city}` : "location not availablr"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <Button asChild>
            <Link href="/farmer/new-booking">New Booking</Link>
          </Button>
          <Button asChild>
            <Link href="/farmer/booking-history">Booking history</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Bookings</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBookings}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed bookings</CardTitle>
            <TractorIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedBookings}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total paid</CardTitle>
            <ClipboardListIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPaid.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total unpaid</CardTitle>
            <BarChartIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUnpaid}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {
                bookings.length === 0 ? <p>No bookings available</p>
                  :
                  bookings.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).map((booking, index) => {
                    return (
                      <li key={index} className={`${index > 1 ? "hidden" : "flex"} items-center justify-between`}>
                        <div className="flex items-center">
                          <TractorIcon className="h-6 w-6 mr-2 text-muted-foreground" />
                          <div className='w-full'>
                            <div className='w-full flex items-center justify-betweenn flex-wrap gap-1'>
                              <p className="font-medium">Booking #{`Hola_booking_${booking.id.slice(-4)}`}</p>
                              <Badge className='bg-yellow-200 text-yellow-800 hover:text-yellow-900 hover:bg-yellow-300'>
                                <p className="text-sm">{booking.bookingStatus}</p>
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">Total tractors: {booking.tractors.length}</p>
                            <p className="text-sm text-muted-foreground">Total attachments: {booking.attachments.length}</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">View</Button>
                      </li>
                    )
                  })
              }
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Your Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex items-center">
                <UserIcon className="h-5 w-5 mr-2 text-muted-foreground" />
                <span className="text-sm">{user.name}</span>
              </li>
              <li className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-muted-foreground" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                <span className="text-sm">{user.email}</span>
              </li>
              <li className="flex items-center">
                <MapPinIcon className="h-5 w-5 mr-2 text-muted-foreground" />
                <span className="text-sm">{farmer?.home_location_id ? `${farmer.home?.country} ${farmer.home?.city}` : "location not available"}</span>
              </li>
            </ul>
            <Button className="w-full mt-4" variant="outline" asChild>
              <Link href="/profile">Edit Profile</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default FarmerDashboard