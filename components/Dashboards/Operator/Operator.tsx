"use client"

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { renderInstance } from '@/utils/Axios/RenderInstance'
import { errorMessage } from '@/utils/Toastify/Messages'
import { Booking, Operator } from '@/utils/Types/types'
import { CalendarIcon, ClockIcon, DollarSignIcon, MapPinIcon, TractorIcon, Truck, UserIcon } from 'lucide-react'
import { useCookie } from 'next-cookie'
import Link from 'next/link'
import { useState, useEffect } from 'react'

const OperatorDashboardPage = () => {

    const [operator, setOperator] = useState<Operator | null>(null)
    const [fetchingOperatorDetails, setFetchingOperatorDetails] = useState(false)
    const [bookings, setBookings] = useState<Booking[]>([])
  
    const { cookie } = useCookie()
    const user = cookie.get("user")
  
    function fetchOperator(){
      setFetchingOperatorDetails(true)
  
      renderInstance.get(`/operator/getOperator/${user.userId}`)
      .then((res)=>{
        setOperator(res.data.details)
        setBookings(res.data.bookings)
      }).catch((err)=>{
        errorMessage("Error fetching user detaild")
      }).finally(()=>{
        setFetchingOperatorDetails(false)
      })
    }
  
    useEffect(()=>{
      if(user){
        fetchOperator()
      }
    },[])
  
    if(fetchingOperatorDetails) return <p>Loading operator details</p>
    if(!operator) return <p>Operator details not present</p>

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
          <Link href={`/operator/${operator.id}`}>Bookings</Link>
        </Button>
        </div>
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
                          <p className="text-sm text-muted-foreground">Total tractors: {booking.tractors.length}</p>
                          <p className="text-sm text-muted-foreground">Total attachments: {booking.attachments.length}</p>
                        </div>
                      </div>
                      <BookingCard booking={booking} id={`#Hola_booking_${booking.id.slice(-4)}`} />
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

export default OperatorDashboardPage

const BookingCard = ({ booking, id }: { booking: Booking; id: string }) => {
  const [open, setOpen] = useState(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>

      <DialogTrigger asChild>
        <Button variant="outline" size="sm">View</Button>
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
                Lat: {booking.booking_location_lat}, Lon: {booking.booking_location_lan}
              </span>
            </div>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <TractorIcon className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium">Tractors:</span>
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
                <span className="text-sm font-medium">Attachments:</span>
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
                <span className="text-sm font-medium">Total Cost:</span>
              </div>
              <span className="text-lg font-bold">${booking.total_cost.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

      </DialogContent>

    </Dialog>
  )
}