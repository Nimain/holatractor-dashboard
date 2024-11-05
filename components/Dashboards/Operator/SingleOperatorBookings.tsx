"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarDays, Clock, MapPin, DollarSign, ReceiptPoundSterling } from "lucide-react"
import { BookingStatus, OperatorBookingJob, ownerOperatorRequest, ownerOperatorResponse } from "@/utils/Types/types"
import { renderInstance } from "@/utils/Axios/RenderInstance"
import { useParams, useRouter } from "next/navigation";
import { errorMessage, successMessage } from "@/utils/Toastify/Messages"
import { useCookie } from "next-cookie"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { DialogClose } from "@radix-ui/react-dialog"
import { CircularProgress } from "@mui/material"
import { Switch } from "@/components/ui/switch"
import OperatorRequests from "./_components/OperatorRequests"

export default function Operator() {

    const [requests, setRequests] = useState<ownerOperatorRequest[]>([])
    const [completedJobs, setCompletedJobs] = useState<OperatorBookingJob[]>([])
    const [costForOperator, setCostForOperator] = useState(0)
    const [fetchingRequests, setFetchingRequests] = useState(false)
    const [fetchingCompletedJobs, setFetchingCompletedJobs] = useState(false)
    const [rejectingRequests, setRejectingRequests] = useState(false)

    const [updateStatusBookingCode, setUpdateStatusBookingCode] = useState("")

    const { cookie } = useCookie();
    const access_token = cookie.get("access_token");

    const { slug } = useParams()

    const router = useRouter()

    function handleFetchAllRequests() {
        setFetchingRequests(true)
        renderInstance.get(`/operator/getAllRequests/${slug}`, {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        })
            .then((res) => {
                setRequests(res.data)
            }).catch((err) => {
                if (err.response && err.response.status === 404 && err.response.data.message === "User not found") {
                    errorMessage("User not found")
                } else {
                    errorMessage("Some error occurred while fetching requests")
                }
            }).finally(() => {
                setFetchingRequests(false)
            })
    }

    function fetchAllCompletedBookings() {
        setFetchingCompletedJobs(true)
        renderInstance.get(`/operatorbooking/getOperatorBookingJobByOperatorId/${slug}`, {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        }).then((res) => {
            setCompletedJobs(res.data)
        }).catch((err) => {
            if (err.response && err.response.status === 404 && err.response.data.message === "Operator not found") {
                errorMessage("Operator not found")
            } else {
                errorMessage("Some error occurred while fetching requests")
            }
        }).finally(() => {
            setFetchingCompletedJobs(false)
        })
    }

    const handleReject = (jobId: string) => {
        setRejectingRequests(true)
        renderInstance.post(`/operator/rejectjob/${jobId}`, {}, {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        }).then(() => {
            successMessage("Job rejected")
            handleFetchAllRequests()
            fetchAllCompletedBookings()
            router.refresh()
        }).catch((err) => {
            if (err.response && err.response.status === 404 && err.response.data.message === "Request is not valid") {
                errorMessage("Request is not valid")
            } else {
                errorMessage("Error in rejecting request")
            }
        }).finally(() => {
            setRejectingRequests(false)
        })
    }

    const handleAccept = (booking_id: string, operator_id: string) => {
        if (!booking_id) {
            errorMessage("Some error occurred")
            return
        }
        if (!operator_id) {
            errorMessage("Some error occurred")
            return
        }
        setRejectingRequests(true)
        renderInstance.post(`/operatorbooking`, {
            booking_id,
            operator_id
        }, {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        }).then(() => {
            successMessage("Job accepted")
            handleFetchAllRequests()
            fetchAllCompletedBookings()
            router.refresh()
        }).catch((err) => {
            if (err.response && err.response.status === 404 && err.response.data.message === "Booking not found") {
                errorMessage("Booking not valid")
            } else if (err.response && err.response.status === 404 && err.response.data.message === "Operator not found") {
                errorMessage("Operator not valid")
            } else if (err.response && err.response.status === 404 && err.response.data.message === "User not found") {
                errorMessage("User not valid")
            } else if (err.response && err.response.status === 404 && err.response.data.message === "This booking id has nor request") {
                errorMessage("Booking is not valid")
            } else if (err.response && err.response.status === 400 && err.response.data.message === "This operator is not present in this store") {
                errorMessage("This operator is not present in this store")
            } else if (err.response && err.response.status === 409 && err.response.data.message === "You are not allowed for this task") {
                errorMessage("You are not allowed for this task")
            } else {
                errorMessage("Error in rejecting request")
            }
        }).finally(() => {
            setRejectingRequests(false)
        })
    }

    function handleArriving(id: string) {
        setUpdateStatusBookingCode(id)
        renderInstance.patch(`/operatorbooking/${id}/arriving`, {}, {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        }).then((res) => {
            successMessage("Status changed to arriving")
            fetchAllCompletedBookings()
            handleFetchAllRequests()
            router.refresh()
        }).catch((err) => {
            if (err.response && err.response.status === 404 && err.response.data.message === "Booking not found") {
                errorMessage("Booking not valid")
            } else if (err.response && err.response.status === 404 && err.response.data.message === "Operator not found") {
                errorMessage("Operator not valid")
            } else if (err.response && err.response.status === 400 && err.response.data.message === "Operator has not assigned to this booking") {
                errorMessage("Operator has not assigned to this booking")
            } else if (err.response && err.response.status === 400 && err.response.data.message === "The job has not accepted") {
                errorMessage("The job has not accepted yet")
            } else {
                errorMessage("Error updating the status")
            }
        }).finally(() => {
            setUpdateStatusBookingCode("")
        })
    }

    function handleArrived(id: string) {
        setUpdateStatusBookingCode(id)
        renderInstance.patch(`/operatorbooking/${id}/arrived`, {}, {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        }).then((res) => {
            successMessage("Status changed to arrived")
            fetchAllCompletedBookings()
            handleFetchAllRequests()
            router.refresh()
        }).catch((err) => {
            if (err.response && err.response.status === 404 && err.response.data.message === "Booking not found") {
                errorMessage("Booking not valid")
            } else if (err.response && err.response.status === 404 && err.response.data.message === "Operator not found") {
                errorMessage("Operator not valid")
            } else if (err.response && err.response.status === 400 && err.response.data.message === "Operator has not assigned to this booking") {
                errorMessage("Operator has not assigned to this booking")
            } else if (err.response && err.response.status === 400 && err.response.data.message === "Operator's journey has not started") {
                errorMessage("Operator's journey has not started")
            } else {
                errorMessage("Error updating the status")
            }
        }).finally(() => {
            setUpdateStatusBookingCode("")
        })
    }

    function handleStarted(id: string) {
        setUpdateStatusBookingCode(id)
        renderInstance.patch(`/operatorbooking/${id}/starting`, {}, {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        }).then((res) => {
            successMessage("Status changed to started")
            fetchAllCompletedBookings()
            handleFetchAllRequests()
            router.refresh()
        }).catch((err) => {
            if (err.response && err.response.status === 404 && err.response.data.message === "Booking not found") {
                errorMessage("Booking not valid")
            } else if (err.response && err.response.status === 404 && err.response.data.message === "Operator not found") {
                errorMessage("Operator not valid")
            } else if (err.response && err.response.status === 400 && err.response.data.message === "Operator has not assigned to this booking") {
                errorMessage("Operator has not assigned to this booking")
            } else {
                errorMessage("Error updating the status")
            }
        }).finally(() => {
            setUpdateStatusBookingCode("")
        })
    }

    function handleStatusChange(id: string, value: string) {
        setUpdateStatusBookingCode(id)
        let url = ""
        if (value === BookingStatus.Stopped) url = `/operatorbooking/${id}/pausing`
        else if (value === BookingStatus.Finished) url = `/operatorbooking/${id}/complete`
        else if (value === BookingStatus.Started) url = `/operatorbooking/${id}/starting`
        if (!url) {
            errorMessage("Invalid select")
            ReceiptPoundSterling
        }
        renderInstance.patch(url, {}, {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        }).then((res) => {
            successMessage("Status changed")
            fetchAllCompletedBookings()
            handleFetchAllRequests()
            router.refresh()
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

    useEffect(() => {
        if (slug) {
            handleFetchAllRequests()
            fetchAllCompletedBookings()
        }
    }, [slug])

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6">Operator Dashboard</h1>
            <OperatorRequests />
            <Tabs defaultValue="ongoing">
                <TabsList className="mb-4">
                    <TabsTrigger value="ongoing">Ongoing</TabsTrigger>
                    <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                    <TabsTrigger value="completed">Completed</TabsTrigger>
                </TabsList>
                <TabsContent value="ongoing">
                    {
                        fetchingRequests ? <CircularProgress />
                            :
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {
                                    completedJobs
                                        .filter((operatorReq) => (operatorReq.booking.bookingStatus !== BookingStatus.Finished))
                                        .length === 0 ?
                                        <p>No requests available</p>
                                        :
                                        completedJobs
                                            .filter((operatorReq) => (operatorReq.booking.bookingStatus !== BookingStatus.Finished))
                                            .map((details, i) => {
                                                const name = `${details.booking.user.first_name} ${details.booking.user.middle_name ?? ""} ${details.booking.user.last_name}`
                                                const location = `${details.booking.location.address ?? ""}, ${details.booking.location.city}, ${details.booking.location.name ?? ""}, ${details.booking.location.state ?? ""} , ${details.booking.location.country}, ${details.booking.location.zip_code}`
                                                if (updateStatusBookingCode === details.booking_id) return <CircularProgress key={i} />
                                                return (
                                                    <Card key={i} className="mb-4">
                                                        <CardHeader>
                                                            <CardTitle className="flex justify-between items-center">
                                                                <span>{name}</span>
                                                                <Badge variant={"default"}>{details.booking.bookingStatus}</Badge>
                                                            </CardTitle>
                                                        </CardHeader>
                                                        <CardContent>
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <div className="flex items-center">
                                                                    <MapPin className="mr-2" size={16} />
                                                                    <span>{location}</span>
                                                                </div>
                                                                <div className="flex items-center">
                                                                    <CalendarDays className="mr-2" size={16} />
                                                                    <span>{formatDate(details.booking.start_date)}</span>
                                                                </div>
                                                                <div className="flex items-center">
                                                                    <Clock className="mr-2" size={16} />
                                                                    <span>{
                                                                        details.booking.end_date ?
                                                                            formatDate(details.booking.end_date)
                                                                            :
                                                                            details.booking.booking_hours
                                                                    }</span>
                                                                </div>
                                                                <div className="flex items-center">
                                                                    <DollarSign className="mr-2" size={16} />
                                                                    <span>${details.booking.total_cost.toFixed(2)}</span>
                                                                </div>
                                                            </div>
                                                        </CardContent>
                                                        <CardFooter className="flex justify-between">
                                                            {
                                                                details.booking.bookingStatus === BookingStatus.Accepted && <div className="flex items-center space-x-2">
                                                                    <Switch
                                                                        id="airplane-mode"
                                                                        onCheckedChange={() => { handleArriving(details.booking_id) }} />
                                                                    <Label htmlFor="airplane-mode">Arriving</Label>
                                                                </div>
                                                            }
                                                            {
                                                                details.booking.bookingStatus === BookingStatus.Arriving && <div className="flex items-center space-x-2">
                                                                    <Switch
                                                                        id="airplane-mode"
                                                                        onCheckedChange={() => { handleArrived(details.booking_id) }} />
                                                                    <Label htmlFor="airplane-mode">Arrived</Label>
                                                                </div>
                                                            }
                                                            {
                                                                details.booking.bookingStatus === BookingStatus.Arrived && <div className="flex items-center space-x-2">
                                                                    <Switch
                                                                        id="airplane-mode"
                                                                        onCheckedChange={() => { handleStarted(details.booking_id) }} />
                                                                    <Label htmlFor="airplane-mode">Started</Label>
                                                                </div>
                                                            }
                                                            {
                                                                (details.booking.bookingStatus === BookingStatus.Started || details.booking.bookingStatus === BookingStatus.Stopped) &&
                                                                <Select onValueChange={(value) => handleStatusChange(details.booking_id, value)}>
                                                                    <SelectTrigger className="w-full">
                                                                        <SelectValue placeholder="Update Status" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {
                                                                            details.booking.bookingStatus === BookingStatus.Stopped ?
                                                                                <SelectItem value={BookingStatus.Started}>
                                                                                    Resume
                                                                                </SelectItem>
                                                                                :
                                                                                <SelectItem value={BookingStatus.Stopped}>
                                                                                    Pause
                                                                                </SelectItem>
                                                                        }
                                                                        <SelectItem value={BookingStatus.Finished}>
                                                                            Complete
                                                                        </SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            }
                                                        </CardFooter>
                                                    </Card>
                                                )
                                            })
                                }
                            </div>
                    }
                </TabsContent>
                <TabsContent value="upcoming">
                    {
                        fetchingRequests ? <CircularProgress />
                            :
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {
                                    requests
                                        .filter((operatorReq) => (operatorReq.operator_response === ownerOperatorResponse.NotSeen))
                                        .length === 0 ?
                                        <p>No requests available</p>
                                        :
                                        requests
                                            .filter((operatorReq) => (operatorReq.operator_response === ownerOperatorResponse.NotSeen))
                                            .map((details, i) => {
                                                const name = `${details.booking.user.first_name} ${details.booking.user.middle_name ?? ""} ${details.booking.user.last_name}`
                                                const location = `${details.booking.location.address ?? ""}, ${details.booking.location.city}, ${details.booking.location.name ?? ""}, ${details.booking.location.state ?? ""} , ${details.booking.location.country}, ${details.booking.location.zip_code}`
                                                if (rejectingRequests) return <CircularProgress key={i} />
                                                return (
                                                    <Card key={i} className="mb-4">
                                                        <CardHeader>
                                                            <CardTitle className="flex justify-between items-center">
                                                                <span>{name}</span>
                                                                <Badge variant={"default"}>{details.booking.bookingStatus}</Badge>
                                                            </CardTitle>
                                                        </CardHeader>
                                                        <CardContent>
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <div className="flex items-center">
                                                                    <MapPin className="mr-2" size={16} />
                                                                    <span>{location}</span>
                                                                </div>
                                                                <div className="flex items-center">
                                                                    <CalendarDays className="mr-2" size={16} />
                                                                    <span>{formatDate(details.booking.start_date)}</span>
                                                                </div>
                                                                <div className="flex items-center">
                                                                    <Clock className="mr-2" size={16} />
                                                                    <span>{
                                                                        details.booking.end_date ?
                                                                            formatDate(details.booking.end_date)
                                                                            :
                                                                            details.booking.booking_hours
                                                                    }</span>
                                                                </div>
                                                                <div className="flex items-center">
                                                                    <DollarSign className="mr-2" size={16} />
                                                                    <span>${details.booking.total_cost.toFixed(2)}</span>
                                                                </div>
                                                            </div>
                                                        </CardContent>
                                                        <CardFooter className="flex justify-between">
                                                            <Button onClick={() => {
                                                                handleAccept(details.booking_id, details.operator_id)
                                                            }}>Accept</Button>
                                                            <Button variant="destructive" onClick={() => handleReject(details.operator_id)}>Reject</Button>
                                                        </CardFooter>
                                                    </Card>
                                                )
                                            })
                                }
                            </div>
                    }
                </TabsContent>
                <TabsContent value="completed">
                    {
                        fetchingCompletedJobs ? <CircularProgress />
                            :
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {
                                    completedJobs
                                        .filter((booking) => (booking.booking.bookingStatus === BookingStatus.Finished))
                                        .length === 0 ?
                                        <p>No bookings available</p>
                                        :
                                        completedJobs
                                            .filter((booking) => (booking.booking.bookingStatus === BookingStatus.Finished))
                                            .map((details, i) => {
                                                const name = `${details.booking.user.first_name} ${details.booking.user.middle_name ?? ""} ${details.booking.user.last_name}`
                                                const location = `${details.booking.location.address ?? ""}, ${details.booking.location.city}, ${details.booking.location.name ?? ""}, ${details.booking.location.state ?? ""} , ${details.booking.location.country}, ${details.booking.location.zip_code}`
                                                if (rejectingRequests) return <CircularProgress key={i} />
                                                return (
                                                    <Card key={i} className="mb-4">
                                                        <CardHeader>
                                                            <CardTitle className="flex justify-between items-center">
                                                                <span>{name}</span>
                                                                <Badge variant={"finished"}>{details.booking.bookingStatus}</Badge>
                                                            </CardTitle>
                                                        </CardHeader>
                                                        <CardContent>
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <div className="flex items-center">
                                                                    <MapPin className="mr-2" size={16} />
                                                                    <span>{location}</span>
                                                                </div>
                                                                <div className="flex items-center">
                                                                    <CalendarDays className="mr-2" size={16} />
                                                                    <span>{formatDate(details.booking.start_date)}</span>
                                                                </div>
                                                                <div className="flex items-center">
                                                                    <Clock className="mr-2" size={16} />
                                                                    <span>{
                                                                        details.booking.end_date ?
                                                                            formatDate(details.booking.end_date)
                                                                            :
                                                                            details.booking.booking_hours
                                                                    }</span>
                                                                </div>
                                                                <div className="flex items-center">
                                                                    <DollarSign className="mr-2" size={16} />
                                                                    <span>${details.booking.total_cost.toFixed(2)}</span>
                                                                </div>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                )
                                            })
                                }
                            </div>
                    }
                </TabsContent>
            </Tabs>
        </div>
    )
}