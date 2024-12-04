"use client"

import { Calendar, DollarSign, Heart, House, MapPin, Paperclip, Store as StoreIcon, Tractor, User, X } from 'lucide-react';
import Image from "next/image"
import Link from 'next/link';
import { Progress } from "@/components/ui/progress"
import { BookOpen } from "lucide-react"; // Import necessary icons

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowDownRight, ArrowUpRight, Repeat } from 'lucide-react'
import { CalendarOne } from './_components/OperatorCalender';
import { useEffect, useState } from 'react';
import { Booking, BookingHours, BookingStatus, Operator, OperatorInStore, Store } from '@/utils/Types/types';
import { useCookie } from 'next-cookie';
import { renderInstance } from '@/utils/Axios/RenderInstance';
import { errorMessage, successMessage } from '@/utils/Toastify/Messages';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';

interface user {
    userId: string;
    image: string;
    name: string;
    email: string;
  }

const NewDashboard = () => {
    const [operator, setOperator] = useState<Operator | null>(null)
    const [stores, setStores] = useState<OperatorInStore[]>([])
    const [bookings, setBookings] = useState<Booking[]>([])
    const [latestBookings, setLatestBookings] = useState<Booking[]>([])
    const [todayBookings, setTodayBookings] = useState(0)
    const [fetchingOperatorDetails, setFetchingOperatorDetails] = useState(false)
    const [updateStatusBookingCode, setUpdateStatusBookingCode] = useState("")

    const { cookie } = useCookie()
    const user: user = cookie.get("user")
    const access_token = cookie.get("access_token");

    function handleStatusChange(id: string, value: string) {
      setUpdateStatusBookingCode(id)
      let url = ""
      if(value === BookingStatus.Arriving) url = `/operatorbooking/${id}/arriving`
      else if(value === BookingStatus.Arrived) url = `/operatorbooking/${id}/arrived`
      else if (value === BookingStatus.Stopped) url = `/operatorbooking/${id}/pausing`
      else if (value === BookingStatus.Finished) url = `/operatorbooking/${id}/complete`
      else if (value === BookingStatus.Started) url = `/operatorbooking/${id}/starting`
      if (!url) {
          errorMessage("Invalid select")
          return
      }
      renderInstance.patch(url, {}, {
          headers: {
              Authorization: `Bearer ${access_token}`,
          },
      }).then((res) => {
          successMessage("Status changed")
      }).catch((err) => {
          if (err.response && err.response.status === 404 && err.response.data.message === "Booking not found") {
              errorMessage("Booking not valid")
          } else if (err.response && err.response.status === 404 && err.response.data.message === "Operator not found") {
              errorMessage("Operator not valid")
          } else if (err.response && err.response.status === 400 && err.response.data.message === "Operator has not assigned to this booking") {
              errorMessage("Operator has not assigned to this booking")
          } else if (err.response && err.response.status === 400 && err.response.data.message === "Job has not started yet") {
              errorMessage("Job has not started yet")
          } else if (err.response && err.response.status === 409 && err.response.data.message === "This bakking has no payment details") {
              errorMessage("This bakking has no payment details added")
          } else {
              errorMessage("Error updating the status")
          }
      }).finally(() => {
          setUpdateStatusBookingCode("")
      })
  }
  
    function fetchOperator(){
      setFetchingOperatorDetails(true)
  
      renderInstance.get(`/operator/getOperator/${user.userId}`)
      .then((res)=>{
        setOperator(res.data.details)
        setStores(res.data.stores)
        setBookings(res.data.bookings)
        setTodayBookings(res.data.todayBookings)
        setLatestBookings(res.data.latestBookings)
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

    const transactions = [
        {
          type: "expense",
          title: "Subscription Payment",
          date: "Today, August 20, 2021",
          time: "(10:06 PM)",
          amount: 1200,
        },
        {
          type: "income",
          title: "Influencer Income",
          date: "Today, August 20, 2021",
          time: "(10:06 PM)",
          amount: 1200,
        },
        {
          type: "income",
          title: "Influencer Income",
          date: "Today, August 20, 2021",
          time: "(10:06 PM)",
          amount: 1200,
        },
      ]

      return (
        <div>
          <div className="flex flex-col p-6 ">
            {/* Tasks Section */}
            <div className="flex gap-8 p-6 bg-gray-50">
              {/* Tasks Section */}
              <div className="flex-1">
                <div className="bg-white h-full flex flex-col rounded-xl">
                  <div className="p-6 flex-grow">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-lg font-semibold flex items-center space-x-2">
                        <span className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200">
                          <BookOpen className="w-4 h-4 text-gray-600" /> {/* Icon inside a rounded box */}
                        </span>
                        <span>Bookings</span>
                      </h2>
                      <button className="text-sm text-gray-600 hover:text-gray-800">See All</button>
                    </div>
    
                    <div className="flex gap-6">
                      {
                        latestBookings.map((booking, index)=>{
                          const user_name = `${booking.user?.first_name} ${booking.user?.middle_name ?? ""} ${booking.user?.last_name}`
                          return(
                            <Card className="w-full max-w-3xl bg-zinc-900 text-white shadow-lg">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                              <CardTitle className="text-lg font-bold">#holabook{booking.id.slice(-4)}</CardTitle>
                              <Badge 
                                variant={(booking.bookingStatus && booking.bookingStatus === BookingStatus.Finished) ? 'finished' : 'default'}
                              >
                                {booking.bookingStatus}
                              </Badge>
                            </CardHeader>
                            <CardContent className="space-y-2">
                              <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                  <Calendar className="h-5 w-5 text-muted-foreground" />
                                  <span>
                                    {format(new Date(booking.start_date), 'PPP')} - {booking.end_date && format(new Date(booking.end_date), 'PPP')} - {booking.booking_hours && (booking.booking_hours === BookingHours.EIGHT_HOURS ? "8 hours" : booking.booking_hours === BookingHours.SEVEN_HOURS ? "7 hours" : booking.booking_hours === BookingHours.SIX_HOURS ? "6 hours" : booking.booking_hours === BookingHours.FIVE_HOURS ? " 5 hours" : booking.booking_hours === BookingHours.FOUR_HOURS ? "4 hours" : booking.booking_hours === BookingHours.THREE_HOURS ? "3 hours" : booking.booking_hours === BookingHours.TWO_HOURS ? "2 hours" : "1 hour")}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <User className="h-5 w-5 text-muted-foreground" />
                                  <span>{user_name || 'Unknown User'}</span>
                                </div>
                                {booking.store && (
                                  <div className="flex items-center space-x-2">
                                    <StoreIcon className="h-5 w-5 text-muted-foreground" />
                                    <span>{booking.store.name}</span>
                                  </div>
                                )}
                                {booking.farm && (
                                  <div className="flex items-center space-x-2">
                                    <House className="h-5 w-5 text-muted-foreground" />
                                    <span>{booking.farm.name}</span>
                                  </div>
                                )}
                                {booking.booking_location_lat && booking.booking_location_lan && (
                                  <div className="flex items-center space-x-2">
                                    <MapPin className="h-5 w-5 text-muted-foreground" />
                                    <span>
                                      {booking.booking_location_lat}, {booking.booking_location_lan}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                  <Tractor className="h-5 w-5 text-muted-foreground" />
                                  <span>{booking.tractors.length + booking.standaloneTractors.length} Tractors</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Paperclip className="h-5 w-5 text-muted-foreground" />
                                  <span>{booking.attachments.length + booking.standaloneAttachments.length} Attachments</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                                  <span>Total Cost: ${booking.total_cost.toFixed(2)}</span>
                                </div>
                              </div>
                            </CardContent>
                            <CardFooter className="flex justify-between items-center flex-wrap gap-3">
                              <div className="text-sm">
                                Created: {format(new Date(booking.createdAt), 'PPP')}
                              </div>
                              {
                                booking.bookingStatus && (
                                  booking.bookingStatus === BookingStatus.Accepted ?
                                  <Button className="bg-primaryColor text-white hover:bg-primaryColor" onClick={()=>{handleStatusChange(booking.id, BookingStatus.Arriving)}}>
                                    Arriving
                                  </Button>
                                  : booking.bookingStatus === BookingStatus.Arriving ? 
                                  <Button className="bg-primaryColor text-white hover:bg-primaryColor" onClick={()=>{handleStatusChange(booking.id, BookingStatus.Arrived)}}>
                                    Arrived
                                  </Button>
                                  : (booking.bookingStatus === BookingStatus.Arrived || booking.bookingStatus === BookingStatus.Stopped) ?
                                  <Button className="bg-primaryColor text-white hover:bg-primaryColor" onClick={()=>{handleStatusChange(booking.id, BookingStatus.Started)}}>
                                    Starting
                                  </Button>
                                  : (booking.bookingStatus === BookingStatus.Started) && <div className='space-x-2'>
                                  <Button className="bg-primaryColor text-white hover:bg-primaryColor" onClick={()=>{handleStatusChange(booking.id, BookingStatus.Stopped)}}>
                                    Pause
                                  </Button>
                                  <Button className="bg-primaryColor text-white hover:bg-primaryColor" onClick={()=>{handleStatusChange(booking.id, BookingStatus.Finished)}}>
                                    Complete
                                  </Button>
                                  </div>
                                )
                              }
                            </CardFooter>
                          </Card>
                          )
                        })
                      }
                    </div>
    
                    {/* Notification Toast */}
                    <div className="mt-6 bg-gray-900 text-white p-4 rounded-xl flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        {
                            todayBookings === 0 ?
                        <span>You have 0 task for today</span>
                        :
                        <span>You have {todayBookings} {todayBookings === 1 ? "task" : "tasks"} today. Keep it up! 💪</span>
                        }
                      </div>
                    </div>
                  </div>
                </div>
              </div>
    
              {/* Calendar Section */}
              <CalendarOne booking={bookings} />
              {/* <CalendarTwo /> */}
    
            </div>
          </div>
          <div className="grid gap-6 p-10 lg:grid-cols-2">
            <div className="space-y-6">
              <div className="rounded-lg bg-white p-6 shadow">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Last Transaction</h2>
                  <Link href={'#'} className="text-sm text-blue-600 hover:underline">
                    See Details
                  </Link>
                </div>
    
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-lg bg-card p-4 shadow-sm">
                    <div className="flex items-center gap-2">
                      <div className="rounded-full bg-red-100 p-2">
                        <ArrowUpRight className="h-4 w-4 text-red-600" />
                      </div>
                      <span className="text-sm text-muted-foreground">Income</span>
                    </div>
                    <p className="mt-2 text-2xl font-semibold">$0</p>
                  </div>
                  <div className="rounded-lg bg-card p-4 shadow-sm">
                    <div className="flex items-center gap-2">
                      <div className="rounded-full bg-green-100 p-2">
                        <ArrowDownRight className="h-4 w-4 text-green-600" />
                      </div>
                      <span className="text-sm text-muted-foreground">Pending</span>
                    </div>
                    <p className="mt-2 text-2xl font-semibold">$0</p>
                  </div>
                  <div className="rounded-lg bg-card p-4 shadow-sm">
                    <div className="flex items-center gap-2">
                      <div className="rounded-full bg-blue-100 p-2">
                        <Repeat className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="text-sm text-muted-foreground">Jobs</span>
                    </div>
                    <p className="mt-2 text-2xl font-semibold">
                      {bookings.length}
                    </p>
                  </div>
                </div>
              </div>
    
              <div className="rounded-lg border bg-card">
                <div className="flex items-center justify-between border-b p-4">
                  <div className="text-sm text-muted-foreground">TRANSACTION</div>
                  <div className="text-sm text-muted-foreground">AMOUNT</div>
                </div>
                <div className="divide-y">
                  {/* {transactions.map((transaction, i) => (
                    <div key={i} className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-4">
                        <div className="rounded-full bg-background p-2">
                          <ArrowDownRight className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <div className="font-medium">{transaction.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {transaction.date} {transaction.time}
                          </div>
                        </div>
                      </div>
                      <div className="font-medium">${transaction.amount}</div>
                    </div>
                  ))} */}
                  <p className='ml-2 my-4'>No transactions have done so far</p>
                </div>
              </div>
            </div>
    
            <div className="space-y-6">
              <div className="rounded-lg bg-white p-6 shadow">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Store</h2>
                  <Link href={'/farmer/allstores'} className="text-sm text-blue-600 hover:underline">
                    See All Stores
                  </Link>
                </div>
    
                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                  {stores.map((influencer, i) => (
                    <Card 
                    key={i} 
                    className="w-64 flex-shrink-0 rounded-xl bg-white shadow-md transition-all duration-300 hover:scale-55 hover:shadow-xl hover:bg-green-100 hover:ring-2 hover:ring-green-300"
                  >
                       <div className="relative">
                         <Image
                           src={influencer.store.image}
                           alt={`${influencer.store.name}'s profile`}
                           width={400}
                           height={300}
                           className="aspect-[4/3] w-full object-cover rounded-t-xl"
                         />
                         <button className="absolute right-4 top-4 rounded-full bg-white p-2">
                           <Heart className="h-4 w-4 text-gray-600" />
                         </button>
                       </div>
                       <div className="p-4">
                         <div className="mb-2 space-y-2">
                           <div className="flex items-center gap-1">
                             <span className="text-2xl font-semibold">${influencer.cost_per_hour}</span>
                             <span className="text-gray-600">/per hour</span>
                           </div>
                           <div className="flex items-center gap-1">
                             <span className="text-2xl font-semibold">${influencer.cost_per_job}</span>
                             <span className="text-gray-600">/per job</span>
                           </div>
                           <div className="flex items-center gap-1">
                             <span className="text-2xl font-semibold">${influencer.cost_per_month}</span>
                             <span className="text-gray-600">/per momth</span>
                           </div>
                         </div>
                         <p className="mb-3 text-sm text-gray-600">{influencer.store.name}</p>
                         <div className="flex items-center gap-4 text-gray-600">
                           <div className="flex items-center gap-1">
                             <svg
                               className="h-5 w-5"
                               fill="none"
                               stroke="currentColor"
                               viewBox="0 0 24 24"
                             >
                               <path
                                 strokeLinecap="round"
                                 strokeLinejoin="round"
                                 strokeWidth={1.5}
                                 d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                               />
                             </svg>
                             <div className="flex items-center gap-1">
                             <span className="text-sm font-semibold">Joined since: </span>
                             <span className="text-gray-600">{new Date(influencer.createdAt).toLocaleDateString()}</span>
                           </div>
                           </div>
                         </div>
                       </div>
                     </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
    
      );
    };

export default NewDashboard