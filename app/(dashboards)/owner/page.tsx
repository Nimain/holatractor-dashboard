"use client"

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { renderInstance } from '@/utils/Axios/RenderInstance'
import { errorMessage } from '@/utils/Toastify/Messages'
import { Booking, Owner } from '@/utils/Types/types'
import { BarChartIcon, CalendarIcon, ClipboardListIcon, MapPinIcon, TractorIcon, UserIcon } from 'lucide-react'
import { useCookie } from 'next-cookie'
import Link from 'next/link'
import { useState, useEffect } from 'react'

const OwnerDashboardPage = () => {
  const [fetchingOwnerDetails, setFetchingOwnerDetails] = useState(false)
  const [totalCompletedBookings, setTotalCompletedBookings] = useState(0)
  const [totalRejectedBookings, setTotalRejectedBookings] = useState(0)
  const [totalStores, setTotalStores] = useState(0)
  const [totalRatings, setTotalRatings] = useState(4.5)
  const [bookings, setBookings] = useState<Booking[]>([])

  const { cookie } = useCookie()
  const user = cookie.get("user")

  function fetchOwner() {
    setFetchingOwnerDetails(true)

    renderInstance.get(`/owner/${user.userId}`)
      .then((res) => {
        setTotalCompletedBookings(res.data.totalCompletedBookings)
        setTotalRejectedBookings(res.data.totalRejectedBookings)
        setTotalStores(res.data.totalStores)
        setBookings(res.data.bookings)
      }).catch((err) => {
        errorMessage("Error fetching user detaild")
      }).finally(() => {
        setFetchingOwnerDetails(false)
      })
  }

  useEffect(() => {
    if (user) {
      fetchOwner()
    }
  }, [])

  if (fetchingOwnerDetails) return <p>Loading owner details</p>
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
          </div>
        </div>
        <div className="flex items-center gap-6">
          <Button asChild>
            <Link href="/owner/stores">Stores</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings Completed</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCompletedBookings}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total bookings rejected</CardTitle>
            <TractorIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRejectedBookings}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total stores</CardTitle>
            <ClipboardListIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStores}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rating</CardTitle>
            <BarChartIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRatings}/5.0</div>
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
                          <div className='w-full flex items-center justify-between gap-1 flex-wrap'>
                          <p className="font-medium">Booking #{`Hola_booking_${booking.id.slice(-4)}`}</p>
                          <Badge className='bg-yellow-200 text-yellow-800 hover:text-yellow-900 hover:bg-yellow-300'>
                            <p className="text-sm">{booking.bookingStatus}</p>
                          </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">Total tractors: ${booking.tractors.length}</p>
                          <p className="text-sm text-muted-foreground">Total attachments: ${booking.attachments.length}</p>
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

export default OwnerDashboardPage