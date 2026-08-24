"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CalendarIcon, ChevronLeft, ChevronRight, ClockIcon, DollarSignIcon, MapPinIcon, TractorIcon, Truck } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Booking, BookingStatus, PaymentStatus } from '@/utils/Types/types'
import { renderInstance } from '@/utils/Axios/RenderInstance'
import axios from 'axios'
import { useCookie } from 'next-cookie'
import { errorMessage, successMessage } from '@/utils/Toastify/Messages'
import { CircularProgress } from '@mui/material'
import { Input } from '@/components/ui/input'
import Image from 'next/image'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import PaymentUpload from './_components/UploadPaymentProof'
import { motion } from "framer-motion"
import BookingHistoryLoader from "./BookingHistoryLoader"

const FarmerBookingHistory = () => {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [bookingConfirm, setBookingConfirm] = useState(false)
  const [fetchingFarmerDetails, setFetchingFarmerDetails] = useState(false)

  const [activeTab, setActiveTab] = useState("booked")

  const { cookie } = useCookie()
  const access_token = cookie.get("access_token")
  const rawUser = cookie.get("user")
  const parsedUser: any = typeof rawUser === "string" ? (() => { try { return JSON.parse(rawUser) } catch { return null } })() : rawUser
  const user = parsedUser || {}
  const userId = parsedUser?.userId || parsedUser?.id || parsedUser?.sub || parsedUser?._id

  const tabsList = [
    { label: "All", value: "all" },
    { label: "Booked", value: "booked" },
    { label: "Arriving", value: "arriving" },
    { label: "Started", value: "started" },
    { label: "Unpaid", value: "unpaid" },
    { label: "Review", value: "review" },
    { label: "Completed", value: "completed" },
    { label: "Rejected", value: "rejected" },
  ]

  const scroll = (direction: 'left' | 'right', containerId: string) => {
    const container = document.getElementById(containerId)
    if (container) {
      const scrollAmount = 300
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  const normalizeBooking = (raw: any): Booking => {
    const statusMap: Record<string, BookingStatus> = {
      Open: BookingStatus.Open,
      Accepted: BookingStatus.Accepted,
      Confirmed: BookingStatus.Accepted,
      Arriving: BookingStatus.Arriving,
      Arrived: BookingStatus.Arrived,
      Started: BookingStatus.Started,
      Stopped: BookingStatus.Stopped,
      Finished: BookingStatus.Finished,
      Completed: BookingStatus.Finished,
      Rejected: BookingStatus.Rejected,
    }

    const assignedStatus = statusMap[raw.bookingStatus || raw.status] || BookingStatus.Open
    const bookingId = raw.id || raw.booking_id || `HT-${Math.random().toString(36).substring(2, 8)}`
    const totalAmount = Number(raw.total_price || raw.total_amount || raw.total_cost || 0)

    const tractors = Array.isArray(raw.tractors) && raw.tractors.length > 0
      ? raw.tractors
      : [
          {
            tractor: {
              baseTractor: {
                name: raw.assigned_tractor || raw.tractor_name || "John Deere Agriculture Fleet",
                model: raw.assigned_tractor || "High-Efficiency Tractor",
                image: ["https://images.unsplash.com/photo-1592841200221-a6898f307baa?w=400&h=300&fit=crop"],
              },
              implements: [
                {
                  baseImplement: {
                    name: raw.task_name || raw.implement_name || "Certified Agricultural Implement",
                    description: raw.summary_message || "Machinery scheduled with certified operator",
                  },
                },
              ],
            },
          },
        ]

    return {
      id: bookingId,
      bookingStatus: assignedStatus,
      confirm: raw.confirm !== undefined ? raw.confirm : true,
      owner_confirm: raw.owner_confirm !== undefined ? raw.owner_confirm : true,
      start_date: raw.start_date || raw.scheduled_start || raw.scheduled_date || new Date().toISOString(),
      end_date: raw.end_date || null,
      booking_hours: raw.booking_hours || (raw.hectares ? `${raw.hectares} Ha Operation` : "Scheduled Task"),
      booking_location_lat: raw.booking_location_lat || raw.lat || "Field Location",
      booking_location_lan: raw.booking_location_lan || raw.lng || "Assigned",
      total_price: totalAmount,
      total_cost: totalAmount,
      hours_worked: raw.hours_worked || 0,
      checkin_otp: raw.checkin_otp || "N/A",
      tractors: tractors,
      attachments: Array.isArray(raw.attachments) ? raw.attachments : [],
      farmer: raw.farmer || { name: user.name || "Farmer", phone: user.phone || "" },
      farm: raw.farm || { name: raw.farm_name || "Active Field", description: "" },
      payment: Array.isArray(raw.payment) && raw.payment.length > 0
        ? raw.payment
        : [
            {
              status: raw.payment_status || (assignedStatus === BookingStatus.Finished ? "COMPLETED" : "FarmerPENDING"),
              amount: totalAmount,
            },
          ],
    } as any
  }

  async function fetchFarmer() {
    setFetchingFarmerDetails(true)
    const effectiveUserId = userId || "farmer_demo_01"

    let standardBookings: any[] = []
    let simpleBookings: any[] = []
    let localBookings: any[] = []

    // 1. Fetch standard bookings
    try {
      const res = await renderInstance.get(`/farmer/${effectiveUserId}`)
      if (res.data?.bookings && Array.isArray(res.data.bookings)) {
        standardBookings = res.data.bookings
      }
    } catch {}

    // 2. Fetch 3-tap simple bookings from TractorAI backend
    try {
      const fastApiBase = "https://tractorai.sinsignal.com"
      const res = await axios.get(`${fastApiBase}/simple-booking/list/${effectiveUserId}`, { timeout: 6000 })
      if (Array.isArray(res.data)) {
        simpleBookings = res.data
      }
    } catch {}

    // 3. Scan all farmer local bookings from localStorage
    try {
      if (typeof window !== "undefined") {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i) || ""
          if (k.startsWith("@farmer_recent_bookings_") || k.startsWith("@farmer_simple_bookings_")) {
            try {
              const arr = JSON.parse(localStorage.getItem(k) || "[]")
              if (Array.isArray(arr)) localBookings.push(...arr)
            } catch {}
          }
        }
      }
    } catch {}

    // 4. Merge and deduplicate
    const combinedRaw = [...localBookings, ...simpleBookings, ...standardBookings]
    const seen = new Set<string>()
    const merged: Booking[] = []

    for (const item of combinedRaw) {
      const bId = item.id || item.booking_id
      if (bId && !seen.has(bId)) {
        seen.add(bId)
        merged.push(normalizeBooking(item))
      } else if (!bId) {
        merged.push(normalizeBooking(item))
      }
    }

    setBookings(merged)
    setFetchingFarmerDetails(false)
  }

  const openBookings = bookings.filter((booking) => ((booking.bookingStatus === BookingStatus.Open) || (booking.bookingStatus === BookingStatus.Accepted)))

  const rejectBookings = bookings.filter((booking) => booking.bookingStatus === BookingStatus.Rejected)

  const arrivingBookings = bookings.filter((booking) => booking.bookingStatus === BookingStatus.Arrived || booking.bookingStatus === BookingStatus.Arriving)

  const startedBookings = bookings.filter((booking) => (booking.bookingStatus === BookingStatus.Started) || (booking.bookingStatus === BookingStatus.Stopped))

  const unpaidBookings = bookings.filter((booking) => (((booking.bookingStatus === BookingStatus.Finished) && (`${booking.payment?.[0]?.status}` === "FarmerPENDING")) || ((booking.bookingStatus === BookingStatus.Finished) && (`${booking.payment?.[0]?.status}` === "OwnerREJECTED"))))

  const reviewBookings = bookings.filter((booking) => (booking.bookingStatus === BookingStatus.Finished) && (`${booking.payment?.[0]?.status}` === "FarmerCONFIRMED"))

  const completedBookings = bookings.filter((booking) => (booking.bookingStatus === BookingStatus.Finished) && (`${booking.payment?.[0]?.status}` === "COMPLETED"))

  function userBookingConfirm(booking_id: string) {
    setBookingConfirm(true)
    renderInstance.patch(`/booking/${booking_id}/user_confirm`, {}, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    }).then((res) => {
      successMessage("Successfully booked")
      fetchFarmer()
    }).catch((err) => {
      if (err.response && err.response.status === 404 && err.response.data.message === "Booking is not valid") {
        errorMessage("Booking is not valid")
      } else if (err.response && err.response.status === 400 && err.response.data.message === "Booking already confirm") {
        successMessage("Successfully booked")
      } else if (err.response && err.response.status === 400 && err.response.data.message === "You are not allowed to perform this task") {
        successMessage("You are not allowed to perform this task")
      } else {
        errorMessage("Some error occurred. Please try again...")
      }
    }).finally(() => { setBookingConfirm(false) })
  }

  useEffect(() => {
    fetchFarmer()

    const handleCreated = () => {
      fetchFarmer()
    }
    window.addEventListener("farmer_booking_created", handleCreated)
    return () => {
      window.removeEventListener("farmer_booking_created", handleCreated)
    }
  }, [userId])

  if (fetchingFarmerDetails) return <BookingHistoryLoader />

  if (bookings.length === 0) return <p>No bookings found</p>

  return (
    <div className="p-10 rounded-md border-2 my-10">
      <h1 className="text-3xl font-bold mb-6 text-center">Booking History</h1>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="space-x-2 bg-transparent">
          {
            tabsList.map((tab) => {
              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className={`
                relative px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 bg-white focus-visible:ring-blue-500
                ${activeTab === tab.value
                      ? "text-white"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-200"
                    }
              `}
                >
                  {activeTab === tab.value && (
                    <motion.div
                      layoutId="active-tab"
                      className="absolute inset-0 bg-blue-200 rounded-md"
                      initial={false}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{tab.label}</span>
                </TabsTrigger>
              )
            })
          }
        </TabsList>
        <TabsContent value="all" className="relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full bg-white shadow-md"
              onClick={() => scroll('left', 'booked-container')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
          <div
            id="booked-container"
            className="flex gap-3 overflow-x-auto scrollbar-hide px-8"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {
              bookings.length === 0 ?
                <p>
                  No bookings available
                </p>
                :
                bookings.map((booking, i) => {
                  return (
                    <Card className="w-full max-w-sm min-w-sm flex-shrink-0" key={i}>
                      <CardHeader>
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-lg font-semibold">id: {`Hola-${i + 1}-${booking.id.slice(-6)}`}</CardTitle>
                          <Badge className={'bg-blue-100 text-blue-800'}>
                            {booking.bookingStatus}
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
                              <li key={index}>{tractor?.tractor?.baseTractor?.name || "Agriculture Tractor"}</li>
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
                              <li key={index}>{attachment?.attachment?.baseAttachment?.name || "Agricultural Implement"}</li>
                            ))}
                          </ul>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <DollarSignIcon className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium">Total Cost:</span>
                          </div>
                          <span className="text-lg font-bold">${(Number(booking.total_cost ?? booking.total_price ?? 0)).toFixed(2)}</span>
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-between">
                        {openBookings.includes(booking) && (
                          <Button onClick={() => { userBookingConfirm(booking.id) }}>
                            {
                              bookingConfirm ?
                                <CircularProgress />
                                :
                                "Confirm Booking"
                            }
                          </Button>
                        )}
                        {
                          unpaidBookings.includes(booking) && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">View Details</Button>
                              </DialogTrigger>
                              <DialogContent>
                                {
                                  booking.payment[0].BankAccount && <BankAccountForm
                                    username={booking.payment[0].BankAccount.accountHolderName}
                                    bankname={booking.payment[0].BankAccount.bankName}
                                    accnum={booking.payment[0].BankAccount.accountNumber}
                                    branchCode={booking.payment[0].BankAccount.branchCode ?? ""}
                                    country={booking.payment[0].BankAccount.country}
                                    currency={booking.payment[0].BankAccount.currency}
                                    iban={booking.payment[0].BankAccount.iban ?? ""}
                                    routingnum={booking.payment[0].BankAccount.routingNumber ?? ""}
                                    swiftcode={booking.payment[0].BankAccount.swiftCode ?? ""} />
                                }
                                {
                                  booking.payment[0].PayPal && <PayPalForm
                                    email={booking.payment[0].PayPal.email} />
                                }
                                {
                                  booking.payment[0].UPI && <UPIForm
                                    upiId={booking.payment[0].UPI.upi_id ?? ""}
                                    upi={booking.payment[0].UPI.qr_code}
                                  />
                                }
                              </DialogContent>
                            </Dialog>
                          )
                        }
                        {
                          unpaidBookings.includes(booking) && (
                            <PaymentUpload paymentId={booking.payment[0].id} />
                          )
                        }
                        {
                          reviewBookings.includes(booking) && (
                            <Button variant="outline" size="sm">View Details</Button>
                          )
                        }
                      </CardFooter>
                    </Card>
                  )
                })
            }
          </div>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full bg-white shadow-md"
              onClick={() => scroll('right', 'booked-container')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </TabsContent>
        <TabsContent value="booked" className="relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full bg-white shadow-md"
              onClick={() => scroll('left', 'booked-container')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
          <div
            id="booked-container"
            className="flex gap-3 overflow-x-auto scrollbar-hide px-8"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {
              openBookings.length === 0 ?
                <p>
                  No open bookings available
                </p>
                :
                openBookings.map((booking, i) => {
                  return (
                    <Card className="w-full max-w-sm min-w-sm flex-shrink-0" key={i}>
                      <CardHeader>
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-lg font-semibold">id: {`Hola-${i + 1}-${booking.id.slice(-6)}`}</CardTitle>
                          <Badge className={'bg-blue-100 text-blue-800'}>
                            {
                              booking.confirm && booking.owner_confirm && "Booked"
                            }
                            {
                              booking.confirm && !booking.owner_confirm && "Pending"
                            }
                            {
                              !booking.confirm && "Please confirm it"
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
                              <li key={index}>{tractor?.tractor?.baseTractor?.name || "Agriculture Tractor"}</li>
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
                              <li key={index}>{attachment?.attachment?.baseAttachment?.name || "Agricultural Implement"}</li>
                            ))}
                          </ul>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <DollarSignIcon className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium">Total Cost:</span>
                          </div>
                          <span className="text-lg font-bold">${(Number(booking.total_cost ?? booking.total_price ?? 0)).toFixed(2)}</span>
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-between">
                        {!booking.confirm && (
                          <Button onClick={() => { userBookingConfirm(booking.id) }}>
                            {
                              bookingConfirm ?
                                <CircularProgress />
                                :
                                "Confirm Booking"
                            }
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  )
                })
            }
          </div>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full bg-white shadow-md"
              onClick={() => scroll('right', 'booked-container')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </TabsContent>
        <TabsContent value="arriving" className="relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full bg-white shadow-md"
              onClick={() => scroll('left', 'booked-container')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
          <div
            id="booked-container"
            className="flex gap-3 overflow-x-auto scrollbar-hide px-8"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {
            arrivingBookings.length === 0 ?
              <p>
                No bookings arriving today
              </p>
              :
              arrivingBookings.map((booking, i) => {
                return (
                  <Card className="w-full max-w-sm min-w-sm flex-shrink-0" key={i}>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-lg font-semibold">id: {`Hola-${i + 1}-${booking.id.slice(-6)}`}</CardTitle>
                        <Badge className={'bg-blue-100 text-blue-800'}>
                          {booking.bookingStatus}
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
                            <li key={index}>{tractor?.tractor?.baseTractor?.name || "Agriculture Tractor"}</li>
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
                            <li key={index}>{attachment?.attachment?.baseAttachment?.name || "Agricultural Implement"}</li>
                          ))}
                        </ul>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <DollarSignIcon className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium">Total Cost:</span>
                        </div>
                        <span className="text-lg font-bold">${(Number(booking.total_cost ?? booking.total_price ?? 0)).toFixed(2)}</span>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
          }
          </div>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full bg-white shadow-md"
              onClick={() => scroll('right', 'booked-container')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </TabsContent>
        <TabsContent value="started" className="relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full bg-white shadow-md"
              onClick={() => scroll('left', 'booked-container')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
          <div
            id="booked-container"
            className="flex gap-3 overflow-x-auto scrollbar-hide px-8"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {
            startedBookings.length === 0 ?
              <p>
                No bookings have started
              </p>
              :
              startedBookings.map((booking, i) => {
                return (
                  <Card className="w-full max-w-sm min-w-sm flex-shrink-0" key={i}>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-lg font-semibold">id: {`Hola-${i + 1}-${booking.id.slice(-6)}`}</CardTitle>
                        <Badge className={'bg-yellow-100 text-yellow-800'}>
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
                            <li key={index}>{tractor?.tractor?.baseTractor?.name || "Agriculture Tractor"}</li>
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
                            <li key={index}>{attachment?.attachment?.baseAttachment?.name || "Agricultural Implement"}</li>
                          ))}
                        </ul>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <DollarSignIcon className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium">Total Cost:</span>
                        </div>
                        <span className="text-lg font-bold">${(Number(booking.total_cost ?? booking.total_price ?? 0)).toFixed(2)}</span>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
          }
          </div>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full bg-white shadow-md"
              onClick={() => scroll('right', 'booked-container')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </TabsContent>
        <TabsContent value="unpaid" className="relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full bg-white shadow-md"
              onClick={() => scroll('left', 'booked-container')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
          <div
            id="booked-container"
            className="flex gap-3 overflow-x-auto scrollbar-hide px-8"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {
            unpaidBookings.length === 0 ?
              <p>
                No bookings available
              </p>
              :
              unpaidBookings.map((booking, i) => {
                const status = `${booking.payment[0].status}`
                return (
                  <Card className="w-full max-w-sm min-w-sm flex-shrink-0" key={i}>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-lg font-semibold">id: {`Hola-${i + 1}-${booking.id.slice(-6)}`}</CardTitle>
                        <Badge className={'bg-yellow-100 text-yellow-800'}>
                          {
                            status === "FarmerPENDING" ?
                              "payment required"
                              :
                              "owner rejected"
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
                            <li key={index}>{tractor?.tractor?.baseTractor?.name || "Agriculture Tractor"}</li>
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
                            <li key={index}>{attachment?.attachment?.baseAttachment?.name || "Agricultural Implement"}</li>
                          ))}
                        </ul>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <DollarSignIcon className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium">Total Cost:</span>
                        </div>
                        <span className="text-lg font-bold">${(Number(booking.total_cost ?? booking.total_price ?? 0)).toFixed(2)}</span>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">View Details</Button>
                        </DialogTrigger>
                        <DialogContent>
                          {
                            booking.payment[0].BankAccount && <BankAccountForm
                              username={booking.payment[0].BankAccount.accountHolderName}
                              bankname={booking.payment[0].BankAccount.bankName}
                              accnum={booking.payment[0].BankAccount.accountNumber}
                              branchCode={booking.payment[0].BankAccount.branchCode ?? ""}
                              country={booking.payment[0].BankAccount.country}
                              currency={booking.payment[0].BankAccount.currency}
                              iban={booking.payment[0].BankAccount.iban ?? ""}
                              routingnum={booking.payment[0].BankAccount.routingNumber ?? ""}
                              swiftcode={booking.payment[0].BankAccount.swiftCode ?? ""} />
                          }
                          {
                            booking.payment[0].PayPal && <PayPalForm
                              email={booking.payment[0].PayPal.email} />
                          }
                          {
                            booking.payment[0].UPI && <UPIForm
                              upiId={booking.payment[0].UPI.upi_id ?? ""}
                              upi={booking.payment[0].UPI.qr_code}
                            />
                          }
                        </DialogContent>
                      </Dialog>
                      <PaymentUpload paymentId={booking.payment[0].id} />
                    </CardFooter>
                  </Card>
                )
              })
          }
          </div>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full bg-white shadow-md"
              onClick={() => scroll('right', 'booked-container')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </TabsContent>
        <TabsContent value="review" className="relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full bg-white shadow-md"
              onClick={() => scroll('left', 'booked-container')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
          <div
            id="booked-container"
            className="flex gap-3 overflow-x-auto scrollbar-hide px-8"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {
            reviewBookings.length === 0 ?
              <p>
                No bookings available for review
              </p>
              :
              reviewBookings.map((booking, i) => {
                return (
                  <Card className="w-full max-w-sm min-w-sm flex-shrink-0" key={i}>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-lg font-semibold">id: {`Hola-${i + 1}-${booking.id.slice(-6)}`}</CardTitle>
                        <Badge className={'bg-gray-100 text-gray-800'}>
                          Owner review
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
                            <li key={index}>{tractor?.tractor?.baseTractor?.name || "Agriculture Tractor"}</li>
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
                            <li key={index}>{attachment?.attachment?.baseAttachment?.name || "Agricultural Implement"}</li>
                          ))}
                        </ul>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <DollarSignIcon className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium">Total Cost:</span>
                        </div>
                        <span className="text-lg font-bold">${(Number(booking.total_cost ?? booking.total_price ?? 0)).toFixed(2)}</span>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button variant="outline" size="sm">View Details</Button>
                    </CardFooter>
                  </Card>
                )
              })
          }
          </div>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full bg-white shadow-md"
              onClick={() => scroll('right', 'booked-container')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </TabsContent>
        <TabsContent value="completed" className="relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full bg-white shadow-md"
              onClick={() => scroll('left', 'booked-container')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
          <div
            id="booked-container"
            className="flex gap-3 overflow-x-auto scrollbar-hide px-8"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {
            completedBookings.length === 0 ?
              <p>
                0 bookings completed
              </p>
              :
              completedBookings.map((booking, i) => {
                return (
                  <Card className="w-full max-w-sm min-w-sm flex-shrink-0" key={i}>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-lg font-semibold">id: {`Hola-${i + 1}-${booking.id.slice(-6)}`}</CardTitle>
                        <Badge className={'bg-green-100 text-green-800'}>
                          Completed
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
                            <li key={index}>{tractor?.tractor?.baseTractor?.name || "Agriculture Tractor"}</li>
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
                            <li key={index}>{attachment?.attachment?.baseAttachment?.name || "Agricultural Implement"}</li>
                          ))}
                        </ul>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <DollarSignIcon className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium">Total Cost:</span>
                        </div>
                        <span className="text-lg font-bold">${(Number(booking.total_cost ?? booking.total_price ?? 0)).toFixed(2)}</span>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
          }
          </div>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full bg-white shadow-md"
              onClick={() => scroll('right', 'booked-container')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </TabsContent>
        <TabsContent value="rejected" className="relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full bg-white shadow-md"
              onClick={() => scroll('left', 'booked-container')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
          <div
            id="booked-container"
            className="flex gap-3 overflow-x-auto scrollbar-hide px-8"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {
            rejectBookings.length === 0 ?
              <p>
                0 bookings rejected
              </p>
              :
              rejectBookings.map((booking, i) => {
                return (
                  <Card className="w-full max-w-sm min-w-sm flex-shrink-0" key={i}>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-lg font-semibold">id: {`Hola-${i + 1}-${booking.id.slice(-6)}`}</CardTitle>
                        <Badge className={'bg-red-100 text-red-800'}>
                          Rejected
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
                            <li key={index}>{tractor?.tractor?.baseTractor?.name || "Agriculture Tractor"}</li>
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
                            <li key={index}>{attachment?.attachment?.baseAttachment?.name || "Agricultural Implement"}</li>
                          ))}
                        </ul>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <DollarSignIcon className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium">Total Cost:</span>
                        </div>
                        <span className="text-lg font-bold">${(Number(booking.total_cost ?? booking.total_price ?? 0)).toFixed(2)}</span>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
          }
          </div>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full bg-white shadow-md"
              onClick={() => scroll('right', 'booked-container')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default FarmerBookingHistory

export function BankAccountForm({ username, bankname, accnum, swiftcode, iban, routingnum, branchCode, currency, country }: { username: string, bankname: string, accnum: string, swiftcode: string, iban: string, routingnum: string, branchCode: string, currency: string, country: string }) {

  return (
    <div className="space-y-4">
      <Input name="accountHolderName" placeholder="Account Holder Name" value={username} readOnly={true} />
      <Input name="bankName" placeholder="Bank Name" value={bankname} readOnly={true} />
      <Input name="accountNumber" placeholder="Account Number" value={accnum} readOnly={true} />
      <Input name="swiftCode" placeholder="SWIFT Code" value={swiftcode} readOnly={true} />
      <Input name="iban" placeholder="IBAN" value={iban} readOnly={true} />
      <Input name="routingNumber" placeholder="Routing Number" value={routingnum} readOnly={true} />
      <Input name="branchCode" placeholder="Branch Code" value={branchCode} readOnly={true} />
      <Input name="currency" placeholder="currency" value={currency} readOnly={true} />
      <Input name="country" placeholder="Country" value={country} readOnly={true} />
    </div>
  )
}

export function PayPalForm({ email }: { email: string }) {

  return (
    <div className="space-y-4">
      <Input type="email" placeholder="PayPal Email" value={email} readOnly={true} />
    </div>
  )
}

export function UPIForm({ upiId, upi }: { upiId: string, upi: string }) {

  return (
    <div className="space-y-4">
      <Input placeholder="UPI ID" value={upiId} readOnly={true} />
      <div className="flex items-center space-x-2">
        <Image src={upi} alt={upiId} width={400} height={400} unoptimized={true} className='rounded' />
      </div>
    </div>
  )
}