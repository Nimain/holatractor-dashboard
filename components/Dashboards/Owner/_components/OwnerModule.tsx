"use client"

import { useEffect, useState } from 'react'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useCookie } from 'next-cookie'
import { Booking, BookingStatus, OperatorInStore, PaymentStatus, Store } from '@/utils/Types/types'
import { NestJsBaseURL, renderInstance } from '@/utils/Axios/RenderInstance'
import { errorMessage, successMessage } from '@/utils/Toastify/Messages'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useParams } from 'next/navigation'
import { CircularProgress } from '@mui/material'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'
import RequestOperators from './RequestOperators'
import PaymentMethods from './BankAccountSelect'
import PaymentReview from './PaymentProofAction'
import io from 'socket.io-client';

const socket = io(NestJsBaseURL);

const OwnerModule = () => {

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [store, setStore] = useState<Store | null>(null)
  const [fetchingStoreDetails, setFetchingStoreDetails] = useState(false)

  const [getBookingsOfAStore, setGetBookingsOfAStore] = useState<Booking[]>([])
  const [filteredPaymentBookings, setfilteredPaymentBookings] = useState<Booking[]>([])
  const [allOperators, setAllOperators] = useState<OperatorInStore[]>([])
  const [fetchingBookings, setFetchingBookings] = useState(false)
  const [fetchingOperators, setFetchingOperators] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [isAssignOpen, setIsAssignOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null)

  const { cookie } = useCookie()
  const user = cookie.get("user")
  const access_token = cookie.get("access_token")

  const { slug } = useParams()

  function fetchStores() {
    setFetchingStoreDetails(true)

    renderInstance.get(`/owner/${user.userId}`)
      .then((res) => {
        setStore(res.data)
      }).catch((err) => {
        errorMessage("Error fetching user detaild")
      }).finally(() => {
        setFetchingStoreDetails(false)
      })
  }

  function handleFetchAllBookings() {
    setFetchingBookings(true)
    renderInstance.get(`/booking/${slug}/bookings`)
      .then((res) => {
        setGetBookingsOfAStore(res.data)
        setfilteredPaymentBookings(res.data.filter((request: Booking) => (request.payment.length >= 1)))
      }).catch((err) => {
        errorMessage("Some error occurred in fetching bookings")
      }).finally(() => {
        setFetchingBookings(false)
      })
  }

  const handleReject = (id: string) => {
    setConfirming(true)
    // Implement accept logic here
    renderInstance.patch(`/booking/${id}/owner_reject`, {}, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    }).then((res) => {
      successMessage("You have rejected this request")
      handleFetchAllBookings()
    }).catch((err) => {
      if (err.response && err.response.status === 404 && err.response.data.message === "Booking is not valid") {
        errorMessage("Log in user not found")
      } else if (err.response && err.response.status === 400 && err.response.data.message === "User has not confirmed the booking. Wait till user booked") {
        errorMessage("User has not confirmed the booking. Wait till user booked")
      } else if (err.response && err.response.status === 400 && err.response.data.message === "You are not allowed to perform this task") {
        errorMessage("You are not allowed to perform this task")
      } else {
        errorMessage("Some error occurred")
      }
    }).finally(() => {
      setConfirming(false)
    })
  }

  const handleAssign = (operatorId: string) => {
    setAssigning(true)
    renderInstance.patch(`/booking/${selectedRequest}/${operatorId}/request_operator`, {}, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    }).then((res) => {
      successMessage("Operator assigned")
      setIsAssignOpen(false)
      handleFetchAllBookings()
    }).catch((err) => {
      if (err.response && err.response.status === 404 && err.response.data.message === "Booking is not valid") {
        errorMessage("Log in user not found")
      } else if (err.response && err.response.status === 400) {
        if (err.response.data.message === "This booking is not Open now") {
          errorMessage("This booking is not Open now")
        } else if (err.response.data.message === "You are not allowed to perform this task") {
          errorMessage("You are not allowed to perform this task")
        } else if (err.response.data.message === "Operator not found") {
          errorMessage("Operator not found")
        } else if (err.response.data.message === "This operator is not present in this store") {
          errorMessage("This operator is not present in this store")
        } else if (err.response.data.message === "You already request to this user") {
          errorMessage("You have already request to this user")
        } else if (err.response.data.message === "User has not confirmed the booking") {
          errorMessage("User has not confirmed the booking")
        } else if (err.response.data.message === "Owner has not confirmed the booking") {
          errorMessage("Owner has not confirmed the booking")
        } else if (err.response.data.message === "Booking status has changed") {
          errorMessage("Booking status has changed")
        }
      } else {
        errorMessage("Some error occurred while assigning")
      }
    }).finally(() => {
      setAssigning(false)
    })
  }

  function handleFetchAllOperators() {
    setFetchingOperators(true)
    renderInstance.get(`/operator/getOperatorsByStoreId/${slug}`)
      .then((res) => {
        setAllOperators(res.data)
      }).catch((err) => {
        errorMessage("Some error occurred in fetching operators")
      }).finally(() => {
        setFetchingOperators(false)
      })
  }

  useEffect(()=>{
    // Listen for booking updates
    socket.on('bookingUpdate', (data:Booking) => {
      renderInstance.get(`/booking/${slug}/bookings`)
      .then((res) => {
        setGetBookingsOfAStore(res.data)
        setfilteredPaymentBookings(res.data.filter((request: Booking) => (request.payment.length >= 1)))
      })
    });

    // return () => {
    //   socket.off('bookingUpdate');
    // };
  },[])

  useEffect(() => {
    if (slug) {
      handleFetchAllBookings()
      handleFetchAllOperators()
    }
  }, [slug])

  useEffect(() => {
    if (user) {
      fetchStores()
    }
  }, [])

  if (fetchingStoreDetails) return <p>Getting store details</p>

  if (!store) return <p>Store details not found</p>

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button>Show Bookings</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Store Bookings</DialogTitle>
        </DialogHeader>
        <div className="p-4">
          <Tabs defaultValue="not_seen">
            <TabsList>
              <TabsTrigger value="not_seen">Not Seen</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
              <TabsTrigger value="accepted">Accepted</TabsTrigger>
              <TabsTrigger value="ongoing">Ongoing</TabsTrigger>
              <TabsTrigger value="unpaid">Unpaid Payments</TabsTrigger>
              <TabsTrigger value="review">Review Payments</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
            <TabsContent value={"not_seen"}>
              {
                fetchingBookings ? <p>Getting all the bookings</p>
                  :
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {getBookingsOfAStore
                      .filter((request) => (!request.owner_confirm && request.confirm && request.bookingStatus === BookingStatus.Open)).length === 0 ?
                      <p>No open requests availanle</p>
                      :
                      getBookingsOfAStore
                        .filter((request) => (!request.owner_confirm && request.confirm && request.bookingStatus === BookingStatus.Open))
                        .map((request) => {
                          if (confirming) return <CircularProgress key={request.id} />
                          return (
                            <Card key={request.id} className="drop-shadow-md">
                              <CardHeader>
                                <CardTitle>{`${request.user.first_name} ${request.user.middle_name ?? ""} ${request.user.last_name}`}</CardTitle>
                                <Badge className="w-fit">{request.bookingStatus}</Badge>
                              </CardHeader>
                              <CardContent>
                                <p>Total Cost: ${request.total_cost.toFixed(2)}</p>
                                {/* <p>Location: {request.location}</p> */}
                              </CardContent>
                              <CardFooter className="flex justify-end space-x-2">
                                {/* <Button onClick={() => handleAccept(request.id)}>Accept</Button> */}
                                <PaymentMethods bookingId={request.id} />
                                <Button variant="destructive" onClick={() => handleReject(request.id)}>
                                  Reject
                                </Button>
                              </CardFooter>
                            </Card>
                          )
                        })}
                  </div>
              }
            </TabsContent>
            <TabsContent value={"rejected"}>
              {
                fetchingBookings ? <p>Getting all the bookings</p>
                  :
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {getBookingsOfAStore
                      .filter((request) => (!request.owner_confirm && request.confirm && request.bookingStatus === BookingStatus.Rejected)).length === 0 ?
                      <p>No reject bookings found</p> :
                      getBookingsOfAStore
                        .filter((request) => (!request.owner_confirm && request.confirm && request.bookingStatus === BookingStatus.Rejected))
                        .map((request) => (
                          <Card key={request.id} className="border-2 border-red-500 drop-shadow-md">
                            <CardHeader>
                              <CardTitle>{`${request.user.first_name} ${request.user.middle_name ?? ""} ${request.user.last_name}`}</CardTitle>
                              <Badge className="w-fit">{request.bookingStatus}</Badge>
                            </CardHeader>
                            <CardContent>
                              <p>Total Cost: ${request.total_cost.toFixed(2)}</p>
                              {/* <p>Location: {request.location}</p> */}
                            </CardContent>
                          </Card>
                        ))}
                  </div>
              }
            </TabsContent>
            <TabsContent value={"accepted"}>
              {
                fetchingBookings ? <p>Getting all the bookings</p>
                  :
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {getBookingsOfAStore
                      .filter((request) => (request.owner_confirm && request.confirm && request.bookingStatus === BookingStatus.Open)).length === 0 ?
                      <p>No open requests available</p>
                      :
                      getBookingsOfAStore
                        .filter((request) => (request.owner_confirm && request.confirm && request.bookingStatus === BookingStatus.Open))
                        .map((request) => (
                          <Card key={request.id} className="drop-shadow-md">
                            <CardHeader>
                              <CardTitle>{`${request.user.first_name} ${request.user.middle_name ?? ""} ${request.user.last_name}`}</CardTitle>
                              <Badge className="w-fit">{request.bookingStatus}</Badge>
                            </CardHeader>
                            <CardContent>
                              <p>Total Cost: ${request.total_cost.toFixed(2)}</p>
                              {/* <p>Location: {request.location}</p> */}
                            </CardContent>
                            <CardFooter className="flex justify-end space-x-2">
                              {
                                request.bookingStatus === BookingStatus.Open &&
                                <Button
                                  onClick={() => {
                                    setSelectedRequest(request.id)
                                    setIsAssignOpen(true)
                                  }}
                                >
                                  Assign Operator
                                </Button>
                              }
                            </CardFooter>
                          </Card>
                        ))}
                  </div>
              }
            </TabsContent>
            <TabsContent value={"ongoing"}>
              {
                fetchingBookings ? <p>Getting all the bookings</p>
                  :
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {getBookingsOfAStore
                      .filter((booking) => ((booking.bookingStatus === BookingStatus.Started) || (booking.bookingStatus === BookingStatus.Stopped) || (booking.bookingStatus === BookingStatus.Arrived) || (booking.bookingStatus === BookingStatus.Accepted) || (booking.bookingStatus === BookingStatus.Arriving))).length === 0 ?
                      <p>0 ongoing bookings</p>
                      :
                      getBookingsOfAStore
                        .filter((booking) => ((booking.bookingStatus === BookingStatus.Started) || (booking.bookingStatus === BookingStatus.Stopped) || (booking.bookingStatus === BookingStatus.Arrived) || (booking.bookingStatus === BookingStatus.Accepted) || (booking.bookingStatus === BookingStatus.Arriving)))
                        .map((request) => (
                          <Card key={request.id} className="drop-shadow-md">
                            <CardHeader>
                              <CardTitle>{`${request.user.first_name} ${request.user.middle_name ?? ""} ${request.user.last_name}`}</CardTitle>
                              <Badge className="w-fit">{request.bookingStatus}</Badge>
                            </CardHeader>
                            <CardContent>
                              <p>Total Cost: ${request.total_cost.toFixed(2)}</p>
                              {/* <p>Location: {request.location}</p> */}
                            </CardContent>
                          </Card>
                        ))}
                  </div>
              }
            </TabsContent>
            <TabsContent value={"unpaid"}>
              {
                fetchingBookings ? <p>Getting all the bookings</p>
                  :

                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredPaymentBookings
                      .filter((booking)=> (((booking.bookingStatus === BookingStatus.Finished) && (`${booking.payment[0].status}` === "FarmerPENDING")) || ((booking.bookingStatus === BookingStatus.Finished) && (`${booking.payment[0].status}` === "OwnerREJECTED")))).length === 0 ?
                      <p>0 unpaid bookings</p>
                      :
                      filteredPaymentBookings
                        .filter((booking)=> (((booking.bookingStatus === BookingStatus.Finished) && (`${booking.payment[0].status}` === "FarmerPENDING")) || ((booking.bookingStatus === BookingStatus.Finished) && (`${booking.payment[0].status}` === "OwnerREJECTED"))))
                        .map((request) => (
                          <Card key={request.id} className="drop-shadow-md">
                            <CardHeader>
                              <CardTitle>{`${request.user.first_name} ${request.user.middle_name ?? ""} ${request.user.last_name}`}</CardTitle>
                              <Badge className="w-fit">{`${request.payment[0].status}`}</Badge>
                            </CardHeader>
                            <CardContent>
                              <p>Total Cost: ${request.total_cost.toFixed(2)}</p>
                              {/* <p>Location: {request.location}</p> */}
                            </CardContent>
                            <CardFooter className="flex justify-end space-x-2">
                              <PaymentReview
                                referenceNumber={request.payment[0].transaction_reference[request.payment[0].transaction_reference.length - 1]}
                                screenshotUrl={request.payment[0].screenshots[request.payment[0].screenshots.length - 1]}
                                paymentId={request.payment[0].id} />
                            </CardFooter>
                          </Card>
                        ))}
                  </div>
              }
            </TabsContent>
            <TabsContent value={"review"}>
              {
                fetchingBookings ? <p>Getting all the bookings</p>
                  :

                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredPaymentBookings
                      .filter((request) => (`${request.payment[0].status}` === "FarmerCONFIRMED")).length === 0 ?
                      <p>There is nothing to review</p>
                      :
                      filteredPaymentBookings
                        .filter((request) => (request.owner_confirm && request.confirm && `${request.payment[0].status}` === "FarmerCONFIRMED"))
                        .map((request) => (
                          <Card key={request.id} className="drop-shadow-md">
                            <CardHeader>
                              <CardTitle>{`${request.user.first_name} ${request.user.middle_name ?? ""} ${request.user.last_name}`}</CardTitle>
                              <Badge className="w-fit">{`${request.payment[0].status}`}</Badge>
                            </CardHeader>
                            <CardContent>
                              <p>Total Cost: ${request.total_cost.toFixed(2)}</p>
                              {/* <p>Location: {request.location}</p> */}
                            </CardContent>
                            <CardFooter className="flex justify-end space-x-2">
                              <PaymentReview
                                referenceNumber={request.payment[0].transaction_reference[request.payment[0].transaction_reference.length - 1]}
                                screenshotUrl={request.payment[0].screenshots[request.payment[0].screenshots.length - 1]}
                                paymentId={request.payment[0].id} />
                            </CardFooter>
                          </Card>
                        ))}
                  </div>
              }
            </TabsContent>
            <TabsContent value={"completed"}>
              {
                fetchingBookings ? <p>Getting all the bookings</p>
                  :

                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredPaymentBookings
                      .filter((booking)=> (booking.bookingStatus === BookingStatus.Finished) && (`${booking.payment[0].status}` === "COMPLETED")).length === 0 ?
                      <p>0 bookings completed</p>
                      :
                      filteredPaymentBookings
                        .filter((booking)=> (booking.bookingStatus === BookingStatus.Finished) && (`${booking.payment[0].status}` === "COMPLETED"))
                        .map((request) => (
                          <Card key={request.id} className="drop-shadow-md">
                            <CardHeader>
                              <CardTitle>{`${request.user.first_name} ${request.user.middle_name ?? ""} ${request.user.last_name}`}</CardTitle>
                              <Badge className="w-fit">{`${request.payment[0].status}`}</Badge>
                            </CardHeader>
                            <CardContent>
                              <p>Total Cost: ${request.total_cost.toFixed(2)}</p>
                              {/* <p>Location: {request.location}</p> */}
                            </CardContent>
                          </Card>
                        ))}
                  </div>
              }
            </TabsContent>
          </Tabs>

          <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign Operator</DialogTitle>
              </DialogHeader>
              {
                fetchingOperators ?
                  <p>Fetching all Operators</p>
                  :
                  allOperators.length === 0 ?
                    <div
                      className="w-fill h-[50vh] flex items-center justify-center flex-col gap-5">
                      <p>No operators available</p>
                      <RequestOperators store={store} />
                    </div>
                    :
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {allOperators.map((operator: OperatorInStore) => {
                        if (assigning) return <CircularProgress key={operator.id} />
                        return (
                          <Card key={operator.id}>
                            <CardHeader>
                              <CardTitle>{`${operator.operator.user.first_name} ${operator.operator.user.middle_name ?? ""} ${operator.operator.user.last_name}`}</CardTitle>
                            </CardHeader>
                            <CardContent>
                              {
                                operator.operator.user.image &&
                                <Image
                                  src={operator.operator.user.image}
                                  alt={`${operator.operator.user.first_name} ${operator.operator.user.middle_name ?? ""} ${operator.operator.user.last_name}`}
                                  className="w-24 h-24 rounded-full mx-auto"
                                  width={200}
                                  height={200}
                                />
                              }
                            </CardContent>
                            <CardFooter>
                              <Button
                                className="w-full"
                                onClick={() => handleAssign(operator.operator_id)}
                              >
                                Assign
                              </Button>
                            </CardFooter>
                          </Card>
                        )
                      })}
                    </div>
              }
            </DialogContent>
          </Dialog>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default OwnerModule