"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { renderInstance } from "@/utils/Axios/RenderInstance"
import { useParams } from "next/navigation";
import { Booking, BookingStatus, Operator } from "@/utils/Types/types"
import { errorMessage, successMessage } from "@/utils/Toastify/Messages"
import { useCookie } from "next-cookie"
import { CircularProgress } from "@mui/material"
import Image from "next/image"

export default function Owner() {
    const [isAssignOpen, setIsAssignOpen] = useState(false)
    const [selectedRequest, setSelectedRequest] = useState<string | null>(null)

    const [getBookingsOfAStore, setGetBookingsOfAStore] = useState<Booking[]>([])
    const [allOperators, setAllOperators] = useState<Operator[]>([])
    const [fetchingBookings, setFetchingBookings] = useState(false)
    const [fetchingOperators, setFetchingOperators] = useState(false)
    const [confirming, setConfirming] = useState(false)
    const [assigning, setAssigning] = useState(false)

    const { slug } = useParams()

    const { cookie } = useCookie();
    const access_token = cookie.get("access_token");

    const handleAccept = (id: string) => {
        setConfirming(true)
        renderInstance.patch(`/booking/${id}/owner_confirm`, {}, {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        }).then((res) => {
            successMessage("Thank you for confirming. Now assign an operator")
            handleFetchAllBookings()
        }).catch((err) => {
            errorMessage("Some error occurred")
        }).finally(() => {
            setConfirming(false)
        })
    }

    const handleReject = (id: string) => {
        setConfirming(true)
        renderInstance.patch(`/booking/${id}/owner_reject`, {}, {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        }).then((res) => {
            successMessage("You have rejected this request")
            handleFetchAllBookings()
        }).catch((err) => {
            errorMessage("Some error occurred")
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
            console.log(res)
            setIsAssignOpen(false)
        }).catch((error) => {
            errorMessage("Some error occurred while assigning")
            console.log(error)
        }).finally(() => {
            setAssigning(false)
        })
    }

    function handleFetchAllBookings() {
        setFetchingBookings(true)
        renderInstance.get(`/booking/${slug}/bookings`)
            .then((res) => {
                setGetBookingsOfAStore(res.data)
            }).catch((err) => {
                errorMessage("Some error occurred in fetching bookings")
            }).finally(() => {
                setFetchingBookings(false)
            })
    }

    function handleFetchAllOperators() {
        setFetchingOperators(true)
        renderInstance.get(`/operator`)
            .then((res) => {
                setAllOperators(res.data)
            }).catch((err) => {
                errorMessage("Some error occurred in fetching operators")
            }).finally(() => {
                setFetchingOperators(false)
            })
    }

    useEffect(() => {
        if (slug) {
            handleFetchAllBookings()
        }
        handleFetchAllOperators()
    }, [slug])

    const renderUserName = (user: Booking['user']) => {
        if (!user) return 'Unknown User';
        return `${user.first_name} ${user.middle_name ?? ""} ${user.last_name}`;
    }

    return (
        <div className="p-4">
            <Tabs defaultValue="not_seen">
                <TabsList>
                    <TabsTrigger value="not_seen">Not Seen</TabsTrigger>
                    <TabsTrigger value="rejected">Rejected</TabsTrigger>
                    <TabsTrigger value="accepted">Accepted</TabsTrigger>
                </TabsList>
                <TabsContent value="not_seen">
                    {fetchingBookings ? (
                        <p>Getting all the bookings</p>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {getBookingsOfAStore
                                .filter((request) => (!request.owner_confirm && request.confirm && request.bookingStatus === BookingStatus.Open))
                                .map((request) => (
                                    <Card key={request.id} className="drop-shadow-md">
                                        <CardHeader>
                                            <CardTitle>{renderUserName(request.user)}</CardTitle>
                                            <Badge className="w-fit">{request.bookingStatus}</Badge>
                                        </CardHeader>
                                        <CardContent>
                                            <p>Total Cost: ${request.total_cost}</p>
                                        </CardContent>
                                        <CardFooter className="flex justify-end space-x-2">
                                            {confirming ? (
                                                <CircularProgress />
                                            ) : (
                                                <>
                                                    <Button onClick={() => handleAccept(request.id)}>Accept</Button>
                                                    <Button variant="destructive" onClick={() => handleReject(request.id)}>
                                                        Reject
                                                    </Button>
                                                </>
                                            )}
                                        </CardFooter>
                                    </Card>
                                ))}
                            {getBookingsOfAStore.filter((request) => (!request.owner_confirm && request.confirm && request.bookingStatus === BookingStatus.Open)).length === 0 && (
                                <p>No open requests available</p>
                            )}
                        </div>
                    )}
                </TabsContent>
                <TabsContent value="rejected">
                    {fetchingBookings ? (
                        <p>Getting all the bookings</p>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {getBookingsOfAStore
                                .filter((request) => (!request.owner_confirm && request.confirm && request.bookingStatus === BookingStatus.Rejected))
                                .map((request) => (
                                    <Card key={request.id} className="border-2 border-red-500 drop-shadow-md">
                                        <CardHeader>
                                            <CardTitle>{renderUserName(request.user)}</CardTitle>
                                            <Badge className="w-fit">{request.bookingStatus}</Badge>
                                        </CardHeader>
                                        <CardContent>
                                            <p>Total Cost: ${request.total_cost}</p>
                                        </CardContent>
                                        <CardFooter className="flex justify-end space-x-2">
                                            <Button onClick={() => handleAccept(request.id)}>Accept</Button>
                                            <Button variant="destructive" onClick={() => handleReject(request.id)}>
                                                Reject
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                ))}
                            {getBookingsOfAStore.filter((request) => (!request.owner_confirm && request.confirm && request.bookingStatus === BookingStatus.Rejected)).length === 0 && (
                                <p>No rejected bookings found</p>
                            )}
                        </div>
                    )}
                </TabsContent>
                <TabsContent value="accepted">
                    {fetchingBookings ? (
                        <p>Getting all the bookings</p>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {getBookingsOfAStore
                                .filter((request) => (request.owner_confirm && request.confirm && request.bookingStatus === BookingStatus.Open))
                                .map((request) => (
                                    <Card key={request.id} className="drop-shadow-md">
                                        <CardHeader>
                                            <CardTitle>{renderUserName(request.user)}</CardTitle>
                                            <Badge className="w-fit">{request.bookingStatus}</Badge>
                                        </CardHeader>
                                        <CardContent>
                                            <p>Total Cost: ${request.total_cost}</p>
                                        </CardContent>
                                        <CardFooter className="flex justify-end space-x-2">
                                            <Button
                                                onClick={() => {
                                                    setSelectedRequest(request.id)
                                                    setIsAssignOpen(true)
                                                }}
                                            >
                                                Assign Operator
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                ))}
                            {getBookingsOfAStore.filter((request) => (request.owner_confirm && request.confirm && request.bookingStatus === BookingStatus.Open)).length === 0 && (
                                <p>No open requests available</p>
                            )}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Assign Operator</DialogTitle>
                    </DialogHeader>
                    {fetchingOperators ? (
                        <p>Fetching all Operators</p>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {allOperators.map((operator) => (
                                <Card key={operator.id}>
                                    <CardHeader>
                                        <CardTitle>{renderUserName(operator.user)}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {operator.user?.image && (
                                            <Image
                                                src={operator.user.image}
                                                alt={renderUserName(operator.user)}
                                                className="w-24 h-24 rounded-full mx-auto"
                                                width={200}
                                                height={200}
                                            />
                                        )}
                                    </CardContent>
                                    <CardFooter>
                                        {assigning ? (
                                            <CircularProgress />
                                        ) : (
                                            <Button
                                                className="w-full"
                                                onClick={() => handleAssign(operator.id)}
                                            >
                                                Assign
                                            </Button>
                                        )}
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}

