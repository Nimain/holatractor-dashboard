"use client";

import { useEffect, useState } from 'react';
import { MoreHorizontal, MessageSquare, Users, ChevronDown, Plus, Calendar, Clock, MapPin, Tractor, Paperclip, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCookie } from 'next-cookie';
import { renderInstance } from '@/utils/Axios/RenderInstance';
import { BookingHours, BookingStatus, OperatorBookingJob, ownerOperatorRequest } from '@/utils/Types/types';
import { errorMessage, successMessage } from '@/utils/Toastify/Messages';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { MapContainer, Polygon, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Backdrop, CircularProgress } from '@mui/material';

interface user {
    userId: string;
    image: string;
    name: string;
    email: string;
}

const KanbanBoard = () => {
    const today = new Date()
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ]
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

    const [fetchingRequests, setFetchingRequests] = useState(false)
    const [requests, setRequests] = useState<ownerOperatorRequest[]>([])
    const [completedJobs, setCompletedJobs] = useState<OperatorBookingJob[]>([])
    const [fetchingCompletedJobs, setFetchingCompletedJobs] = useState(false)
    const [rejectingRequests, setRejectingRequests] = useState(false)

    const { cookie } = useCookie();
    const user: user = cookie.get("user")
    const access_token = cookie.get("access_token");

    const limeOptions = { color: 'lime' }

    function handleFetchAllRequests() {
        setFetchingRequests(true)
        renderInstance.get(`/operator/getAllRequests/${user.userId}`, {
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
        renderInstance.get(`/operatorbooking/getOperatorBookingJobByOperatorId/${user.userId}`, {
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

    function handleStatusChange(id: string, value: string) {
        setRejectingRequests(true)
        let url = ""
        if (value === BookingStatus.Arriving) url = `/operatorbooking/${id}/arriving`
        else if (value === BookingStatus.Arrived) url = `/operatorbooking/${id}/arrived`
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
            fetchAllCompletedBookings()
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
            setRejectingRequests(false)
        })
    }

    useEffect(() => {
        if (user) {
            handleFetchAllRequests()
            fetchAllCompletedBookings()
        }
    }, [])

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="mb-8 flex justify-between items-center border-b border-gray-200 pb-4">
                <div className="flex items-center gap-6">
                    <div>
                        <h1 className="text-xl font-bold">{monthNames[today.getMonth()]}</h1>
                        <p className="text-gray-600 text-sm">
                            {dayNames[today.getDay()]}, {today.getDate()} {today.getFullYear()}
                        </p>
                    </div>
                    <div className="h-6 w-px bg-gray-200" />
                    <div className="flex items-center gap-2">
                        <h2 className="text-xl font-semibold">Booking</h2>
                        <ChevronDown size={20} className="text-gray-400" />
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex -space-x-2">
                        {[...Array(5)].map((_, i) => (
                            <div
                                key={i}
                                className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white ring-2 ring-white"
                            />
                        ))}
                    </div>
                    <button className="bg-black text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-800 transition-colors">
                        Apply
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* New bookings */}
                <div className="space-y-4 border border-gray-300 p-4 rounded-[25px]">
                    <div className="flex items-center justify-between">
                        <h2 className="font-medium text-gray-900 flex items-center gap-2">
                            <span className="text-gray-400">▸</span>
                            New bookings
                        </h2>
                    </div>
                    {
                        fetchingRequests ? <p>Fetching for new requests</p> : requests.length === 0 ? <p>Currently no requets is available</p> :
                            requests.map((request, index) => {
                                return (
                                    <div className="space-y-3" key={index}>
                                        <div className={`bg-purple-200 rounded-xl p-4 mb-4 shadow-sm`}>
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="space-y-2">
                                                    <div className="flex gap-2 mt-4">
                                                        <Button
                                                            variant="default"
                                                            className="w-full"
                                                            onClick={() => { handleAccept(request.booking_id, request.operator_id) }}
                                                        >
                                                            Accept
                                                        </Button>
                                                        <Button
                                                            variant="destructive"
                                                            className="w-full"
                                                            onClick={() => { handleReject(request.id) }}
                                                        >
                                                            Decline
                                                        </Button>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                        <span className="font-medium">Booking ID: #holabook{request.booking_id.slice(-4)} </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-2 mb-4">
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <div className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300">
                                                        <Calendar size={14} />
                                                    </div>
                                                    <span>
                                                        {new Date(request.booking.start_date).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <div className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300">
                                                        <Clock size={14} />
                                                    </div>
                                                    <span>
                                                        {
                                                            request.booking.booking_hours ? request.booking.booking_hours === BookingHours.EIGHT_HOURS ? "8 hours" : request.booking.booking_hours === BookingHours.SEVEN_HOURS ? "7 hours" : request.booking.booking_hours === BookingHours.SIX_HOURS ? "6 hours" : request.booking.booking_hours === BookingHours.FIVE_HOURS ? "5 hours" : request.booking.booking_hours === BookingHours.FOUR_HOURS ? "4 hours" : request.booking.booking_hours === BookingHours.THREE_HOURS ? "3 hours" : request.booking.booking_hours === BookingHours.TWO_HOURS ? "2 hours" : "1 hour" : request.booking.end_date && new Date(request.booking.end_date).toLocaleDateString()
                                                        }
                                                    </span>
                                                </div>
                                                {
                                                    (request.booking.bookingType && `${request.booking.bookingType}` === "standalone") ? request.booking.standaloneTractors.map((tractor) => {
                                                        return (
                                                            <div className="flex items-center gap-2 text-sm text-gray-600" key={tractor.tractorId}>

                                                                <div className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300">
                                                                    <Tractor size={14} />
                                                                </div>
                                                                <span>
                                                                    {tractor.tractor.name}
                                                                </span>
                                                            </div>
                                                        )
                                                    })
                                                        :
                                                        request.booking.tractors.map((tractor) => {
                                                            return (
                                                                <div className="flex items-center gap-2 text-sm text-gray-600" key={tractor.tractorId}>

                                                                    <div className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300">
                                                                        <Tractor size={14} />
                                                                    </div>
                                                                    <span>
                                                                        {tractor.tractor.baseTractor.name}
                                                                    </span>
                                                                </div>
                                                            )
                                                        })
                                                }
                                                {
                                                    (request.booking.bookingType && `${request.booking.bookingType}` === "standalone") ? request.booking.standaloneAttachments.map((tractor) => {
                                                        return (
                                                            <div className="flex items-center gap-2 text-sm text-gray-600" key={tractor.attachmentId}>
                                                                <div className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300">
                                                                    <Paperclip size={14} />
                                                                </div>
                                                                <span>
                                                                    {tractor.attachment.name}
                                                                </span>
                                                            </div>
                                                        )
                                                    })
                                                        :
                                                        request.booking.attachments.map((tractor) => {
                                                            return (
                                                                <div className="flex items-center gap-2 text-sm text-gray-600" key={tractor.attachmentId}>
                                                                    <div className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300">
                                                                        <Paperclip size={14} />
                                                                    </div>
                                                                    <span>
                                                                        {tractor.attachment.baseAttachment.name}
                                                                    </span>
                                                                </div>
                                                            )
                                                        })
                                                }
                                                {
                                                    request.booking.farm && <Dialog>
                                                        <DialogTrigger asChild>
                                                            <div className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                                                                <div className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300">
                                                                    <MapPin size={14} />
                                                                </div>
                                                                <span>
                                                                    Click to see farm Location
                                                                </span>
                                                            </div>
                                                        </DialogTrigger>
                                                        <DialogContent>
                                                            <MapContainer
                                                                center={request.booking.farm.boundary.coordinates[0]}
                                                                zoom={16}
                                                                scrollWheelZoom={false}
                                                                style={{ width: "100%", height: "80vh", zIndex: 1 }}>
                                                                <TileLayer
                                                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                                                />
                                                                <Polygon pathOptions={limeOptions} positions={request.booking.farm.boundary.coordinates} />
                                                            </MapContainer>
                                                        </DialogContent>
                                                    </Dialog>
                                                }
                                            </div>

                                            <div className="space-y-4">

                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex items-center gap-1 text-gray-600">
                                                            <Tractor size={16} />
                                                            {
                                                                (request.booking.bookingType && `${request.booking.bookingType}` === "standalone") ? request.booking.standaloneTractors.length : request.booking.tractors.length
                                                            }
                                                        </div>
                                                        <div className="flex items-center gap-1 text-gray-600">
                                                            <Paperclip size={16} />
                                                            {
                                                                (request.booking.bookingType && `${request.booking.bookingType}` === "standalone") ? request.booking.standaloneAttachments.length : request.booking.attachments.length
                                                            }
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })
                    }
                </div>
                {/* Accepted bookings */}
                <div className="space-y-4 border border-gray-300 p-4 rounded-[25px]">
                    <div className="flex items-center justify-between">
                        <h2 className="font-medium text-gray-900 flex items-center gap-2">
                            <span className="text-gray-400">▸</span>
                            Accepted
                        </h2>
                    </div>
                    {
                        fetchingCompletedJobs ? <p>Fetching all Accepted jobs</p> : completedJobs.filter(booking => booking.booking.bookingStatus === BookingStatus.Accepted).length === 0 ? <p>Currently you have not accepted any jobs</p> :
                            completedJobs.filter(booking => booking.booking.bookingStatus === BookingStatus.Accepted).map((request, index) => {
                                return (
                                    <div className="space-y-3" key={index}>
                                        <div className={`bg-orange-100 rounded-xl p-4 mb-4 shadow-sm`}>
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="space-y-2">
                                                    <div className="flex gap-2 mt-4">
                                                        <Button
                                                            variant="default"
                                                            className="w-full"
                                                            onClick={() => { handleStatusChange(request.booking_id, BookingStatus.Arriving) }}
                                                        >
                                                            Arriving
                                                        </Button>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                        <span className="font-medium">Booking ID: #holabook{request.booking_id.slice(-4)} </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-2 mb-4">
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <div className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300">
                                                        <Calendar size={14} />
                                                    </div>
                                                    <span>
                                                        {new Date(request.booking.start_date).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <div className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300">
                                                        <Clock size={14} />
                                                    </div>
                                                    <span>
                                                        {
                                                            request.booking.booking_hours ? request.booking.booking_hours === BookingHours.EIGHT_HOURS ? "8 hours" : request.booking.booking_hours === BookingHours.SEVEN_HOURS ? "7 hours" : request.booking.booking_hours === BookingHours.SIX_HOURS ? "6 hours" : request.booking.booking_hours === BookingHours.FIVE_HOURS ? "5 hours" : request.booking.booking_hours === BookingHours.FOUR_HOURS ? "4 hours" : request.booking.booking_hours === BookingHours.THREE_HOURS ? "3 hours" : request.booking.booking_hours === BookingHours.TWO_HOURS ? "2 hours" : "1 hour" : request.booking.end_date && new Date(request.booking.end_date).toLocaleDateString()
                                                        }
                                                    </span>
                                                </div>
                                                {
                                                    (request.booking.bookingType && `${request.booking.bookingType}` === "standalone") ? request.booking.standaloneTractors.map((tractor) => {
                                                        return (
                                                            <div className="flex items-center gap-2 text-sm text-gray-600" key={tractor.tractorId}>

                                                                <div className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300">
                                                                    <Tractor size={14} />
                                                                </div>
                                                                <span>
                                                                    {tractor.tractor.name}
                                                                </span>
                                                            </div>
                                                        )
                                                    })
                                                        :
                                                        request.booking.tractors.map((tractor) => {
                                                            return (
                                                                <div className="flex items-center gap-2 text-sm text-gray-600" key={tractor.tractorId}>

                                                                    <div className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300">
                                                                        <Tractor size={14} />
                                                                    </div>
                                                                    <span>
                                                                        {tractor.tractor.baseTractor.name}
                                                                    </span>
                                                                </div>
                                                            )
                                                        })
                                                }
                                                {
                                                    (request.booking.bookingType && `${request.booking.bookingType}` === "standalone") ? request.booking.standaloneAttachments.map((tractor) => {
                                                        return (
                                                            <div className="flex items-center gap-2 text-sm text-gray-600" key={tractor.attachmentId}>
                                                                <div className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300">
                                                                    <Paperclip size={14} />
                                                                </div>
                                                                <span>
                                                                    {tractor.attachment.name}
                                                                </span>
                                                            </div>
                                                        )
                                                    })
                                                        :
                                                        request.booking.attachments.map((tractor) => {
                                                            return (
                                                                <div className="flex items-center gap-2 text-sm text-gray-600" key={tractor.attachmentId}>
                                                                    <div className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300">
                                                                        <Paperclip size={14} />
                                                                    </div>
                                                                    <span>
                                                                        {tractor.attachment.baseAttachment.name}
                                                                    </span>
                                                                </div>
                                                            )
                                                        })
                                                }
                                                {
                                                    request.booking.farm && <Dialog>
                                                        <DialogTrigger asChild>
                                                            <div className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                                                                <div className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300">
                                                                    <MapPin size={14} />
                                                                </div>
                                                                <span>
                                                                    Click to see farm Location
                                                                </span>
                                                            </div>
                                                        </DialogTrigger>
                                                        <DialogContent>
                                                            <MapContainer
                                                                center={request.booking.farm.boundary.coordinates[0]}
                                                                zoom={16}
                                                                scrollWheelZoom={false}
                                                                style={{ width: "100%", height: "80vh", zIndex: 1 }}>
                                                                <TileLayer
                                                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                                                />
                                                                <Polygon pathOptions={limeOptions} positions={request.booking.farm.boundary.coordinates} />
                                                            </MapContainer>
                                                        </DialogContent>
                                                    </Dialog>
                                                }
                                            </div>

                                            <div className="space-y-4">

                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex items-center gap-1 text-gray-600">
                                                            <Tractor size={16} />
                                                            {
                                                                (request.booking.bookingType && `${request.booking.bookingType}` === "standalone") ? request.booking.standaloneTractors.length : request.booking.tractors.length
                                                            }
                                                        </div>
                                                        <div className="flex items-center gap-1 text-gray-600">
                                                            <Paperclip size={16} />
                                                            {
                                                                (request.booking.bookingType && `${request.booking.bookingType}` === "standalone") ? request.booking.standaloneAttachments.length : request.booking.attachments.length
                                                            }
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })
                    }
                </div>
                {/* Ongoing bookings */}
                <div className="space-y-4 border border-gray-300 p-4 rounded-[25px]">
                    <div className="flex items-center justify-between">
                        <h2 className="font-medium text-gray-900 flex items-center gap-2">
                            <span className="text-gray-400">▸</span>
                            Ongoing
                        </h2>
                    </div>
                    {
                        fetchingCompletedJobs ? <p>Fetching all ongoing jobs</p> : completedJobs.filter(booking => (booking.booking.bookingStatus !== BookingStatus.Accepted) && (booking.booking.bookingStatus !== BookingStatus.Finished)).length === 0 ? <p>Currently you have no ongoing bookings</p> :
                            completedJobs.filter(booking => (booking.booking.bookingStatus !== BookingStatus.Accepted) && (booking.booking.bookingStatus !== BookingStatus.Finished)).map((request, index) => {
                                return (
                                    <div className="space-y-3" key={index}>
                                        <div className={`bg-yellow-200 rounded-xl p-4 mb-4 shadow-sm`}>
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="space-y-2">
                                                    <div className="flex gap-2 mt-4">
                                                        {
                                                            request.booking.bookingStatus && (
                                                                request.booking.bookingStatus === BookingStatus.Arriving ?
                                                                    <Button
                                                                        onClick={() => { handleStatusChange(request.booking.id, BookingStatus.Arrived) }}>
                                                                        Arrived
                                                                    </Button>
                                                                    : (request.booking.bookingStatus === BookingStatus.Arrived || request.booking.bookingStatus === BookingStatus.Stopped) ?
                                                                        <Button
                                                                            onClick={() => { handleStatusChange(request.booking.id, BookingStatus.Started) }}>
                                                                            Starting
                                                                        </Button>
                                                                        : (request.booking.bookingStatus === BookingStatus.Started) && <div className='space-x-2'>
                                                                            <Button
                                                                                onClick={() => { handleStatusChange(request.booking.id, BookingStatus.Stopped) }}>
                                                                                Pause
                                                                            </Button>
                                                                            <Button
                                                                                onClick={() => { handleStatusChange(request.booking.id, BookingStatus.Finished) }}>
                                                                                Complete
                                                                            </Button>
                                                                        </div>
                                                            )
                                                        }
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                        <span className="font-medium">Booking ID: #holabook{request.booking_id.slice(-4)} </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-2 mb-4">
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <div className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300">
                                                        <Calendar size={14} />
                                                    </div>
                                                    <span>
                                                        {new Date(request.booking.start_date).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <div className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300">
                                                        <Clock size={14} />
                                                    </div>
                                                    <span>
                                                        {
                                                            request.booking.booking_hours ? request.booking.booking_hours === BookingHours.EIGHT_HOURS ? "8 hours" : request.booking.booking_hours === BookingHours.SEVEN_HOURS ? "7 hours" : request.booking.booking_hours === BookingHours.SIX_HOURS ? "6 hours" : request.booking.booking_hours === BookingHours.FIVE_HOURS ? "5 hours" : request.booking.booking_hours === BookingHours.FOUR_HOURS ? "4 hours" : request.booking.booking_hours === BookingHours.THREE_HOURS ? "3 hours" : request.booking.booking_hours === BookingHours.TWO_HOURS ? "2 hours" : "1 hour" : request.booking.end_date && new Date(request.booking.end_date).toLocaleDateString()
                                                        }
                                                    </span>
                                                </div>
                                                {
                                                    (request.booking.bookingType && `${request.booking.bookingType}` === "standalone") ? request.booking.standaloneTractors.map((tractor) => {
                                                        return (
                                                            <div className="flex items-center gap-2 text-sm text-gray-600" key={tractor.tractorId}>

                                                                <div className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300">
                                                                    <Tractor size={14} />
                                                                </div>
                                                                <span>
                                                                    {tractor.tractor.name}
                                                                </span>
                                                            </div>
                                                        )
                                                    })
                                                        :
                                                        request.booking.tractors.map((tractor) => {
                                                            return (
                                                                <div className="flex items-center gap-2 text-sm text-gray-600" key={tractor.tractorId}>

                                                                    <div className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300">
                                                                        <Tractor size={14} />
                                                                    </div>
                                                                    <span>
                                                                        {tractor.tractor.baseTractor.name}
                                                                    </span>
                                                                </div>
                                                            )
                                                        })
                                                }
                                                {
                                                    (request.booking.bookingType && `${request.booking.bookingType}` === "standalone") ? request.booking.standaloneAttachments.map((tractor) => {
                                                        return (
                                                            <div className="flex items-center gap-2 text-sm text-gray-600" key={tractor.attachmentId}>
                                                                <div className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300">
                                                                    <Paperclip size={14} />
                                                                </div>
                                                                <span>
                                                                    {tractor.attachment.name}
                                                                </span>
                                                            </div>
                                                        )
                                                    })
                                                        :
                                                        request.booking.attachments.map((tractor) => {
                                                            return (
                                                                <div className="flex items-center gap-2 text-sm text-gray-600" key={tractor.attachmentId}>
                                                                    <div className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300">
                                                                        <Paperclip size={14} />
                                                                    </div>
                                                                    <span>
                                                                        {tractor.attachment.baseAttachment.name}
                                                                    </span>
                                                                </div>
                                                            )
                                                        })
                                                }
                                                {
                                                    request.booking.farm && <Dialog>
                                                        <DialogTrigger asChild>
                                                            <div className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                                                                <div className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300">
                                                                    <MapPin size={14} />
                                                                </div>
                                                                <span>
                                                                    Click to see farm Location
                                                                </span>
                                                            </div>
                                                        </DialogTrigger>
                                                        <DialogContent>
                                                            <MapContainer
                                                                center={request.booking.farm.boundary.coordinates[0]}
                                                                zoom={16}
                                                                scrollWheelZoom={false}
                                                                style={{ width: "100%", height: "80vh", zIndex: 1 }}>
                                                                <TileLayer
                                                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                                                />
                                                                <Polygon pathOptions={limeOptions} positions={request.booking.farm.boundary.coordinates} />
                                                            </MapContainer>
                                                        </DialogContent>
                                                    </Dialog>
                                                }
                                            </div>

                                            <div className="space-y-4">

                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex items-center gap-1 text-gray-600">
                                                            <Tractor size={16} />
                                                            {
                                                                (request.booking.bookingType && `${request.booking.bookingType}` === "standalone") ? request.booking.standaloneTractors.length : request.booking.tractors.length
                                                            }
                                                        </div>
                                                        <div className="flex items-center gap-1 text-gray-600">
                                                            <Paperclip size={16} />
                                                            {
                                                                (request.booking.bookingType && `${request.booking.bookingType}` === "standalone") ? request.booking.standaloneAttachments.length : request.booking.attachments.length
                                                            }
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })
                    }
                </div>
                {/* Completed bookings */}
                <div className="space-y-4 border border-gray-300 p-4 rounded-[25px]">
                    <div className="flex items-center justify-between">
                        <h2 className="font-medium text-gray-900 flex items-center gap-2">
                            <span className="text-gray-400">▸</span>
                            Completed
                        </h2>
                    </div>
                    {
                        fetchingCompletedJobs ? <p>Fetching all Accepted jobs</p> : completedJobs.filter(booking => booking.booking.bookingStatus === BookingStatus.Finished).length === 0 ? <p>Currently you have not accepted any jobs</p> :
                            completedJobs.filter(booking => booking.booking.bookingStatus === BookingStatus.Accepted).map((request, index) => {
                                return (
                                    <div className="space-y-3" key={index}>
                                        <div className={`bg-green-200 rounded-xl p-4 mb-4 shadow-sm`}>
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <span className="font-medium">Booking ID: #holabook{request.booking_id.slice(-4)} </span>
                                                </div>
                                            </div>

                                            <div className="space-y-2 mb-4">
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <div className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300">
                                                        <Calendar size={14} />
                                                    </div>
                                                    <span>
                                                        {new Date(request.booking.start_date).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <div className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300">
                                                        <Clock size={14} />
                                                    </div>
                                                    <span>
                                                        {
                                                            request.booking.booking_hours ? request.booking.booking_hours === BookingHours.EIGHT_HOURS ? "8 hours" : request.booking.booking_hours === BookingHours.SEVEN_HOURS ? "7 hours" : request.booking.booking_hours === BookingHours.SIX_HOURS ? "6 hours" : request.booking.booking_hours === BookingHours.FIVE_HOURS ? "5 hours" : request.booking.booking_hours === BookingHours.FOUR_HOURS ? "4 hours" : request.booking.booking_hours === BookingHours.THREE_HOURS ? "3 hours" : request.booking.booking_hours === BookingHours.TWO_HOURS ? "2 hours" : "1 hour" : request.booking.end_date && new Date(request.booking.end_date).toLocaleDateString()
                                                        }
                                                    </span>
                                                </div>
                                                {
                                                    (request.booking.bookingType && `${request.booking.bookingType}` === "standalone") ? request.booking.standaloneTractors.map((tractor) => {
                                                        return (
                                                            <div className="flex items-center gap-2 text-sm text-gray-600" key={tractor.tractorId}>

                                                                <div className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300">
                                                                    <Tractor size={14} />
                                                                </div>
                                                                <span>
                                                                    {tractor.tractor.name}
                                                                </span>
                                                            </div>
                                                        )
                                                    })
                                                        :
                                                        request.booking.tractors.map((tractor) => {
                                                            return (
                                                                <div className="flex items-center gap-2 text-sm text-gray-600" key={tractor.tractorId}>

                                                                    <div className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300">
                                                                        <Tractor size={14} />
                                                                    </div>
                                                                    <span>
                                                                        {tractor.tractor.baseTractor.name}
                                                                    </span>
                                                                </div>
                                                            )
                                                        })
                                                }
                                                {
                                                    (request.booking.bookingType && `${request.booking.bookingType}` === "standalone") ? request.booking.standaloneAttachments.map((tractor) => {
                                                        return (
                                                            <div className="flex items-center gap-2 text-sm text-gray-600" key={tractor.attachmentId}>
                                                                <div className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300">
                                                                    <Paperclip size={14} />
                                                                </div>
                                                                <span>
                                                                    {tractor.attachment.name}
                                                                </span>
                                                            </div>
                                                        )
                                                    })
                                                        :
                                                        request.booking.attachments.map((tractor) => {
                                                            return (
                                                                <div className="flex items-center gap-2 text-sm text-gray-600" key={tractor.attachmentId}>
                                                                    <div className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300">
                                                                        <Paperclip size={14} />
                                                                    </div>
                                                                    <span>
                                                                        {tractor.attachment.baseAttachment.name}
                                                                    </span>
                                                                </div>
                                                            )
                                                        })
                                                }
                                                {
                                                    request.booking.farm && <Dialog>
                                                        <DialogTrigger asChild>
                                                            <div className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                                                                <div className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300">
                                                                    <MapPin size={14} />
                                                                </div>
                                                                <span>
                                                                    Click to see farm Location
                                                                </span>
                                                            </div>
                                                        </DialogTrigger>
                                                        <DialogContent>
                                                            <MapContainer
                                                                center={request.booking.farm.boundary.coordinates[0]}
                                                                zoom={16}
                                                                scrollWheelZoom={false}
                                                                style={{ width: "100%", height: "80vh", zIndex: 1 }}>
                                                                <TileLayer
                                                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                                                />
                                                                <Polygon pathOptions={limeOptions} positions={request.booking.farm.boundary.coordinates} />
                                                            </MapContainer>
                                                        </DialogContent>
                                                    </Dialog>
                                                }
                                            </div>

                                            <div className="space-y-4">

                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex items-center gap-1 text-gray-600">
                                                            <Tractor size={16} />
                                                            {
                                                                (request.booking.bookingType && `${request.booking.bookingType}` === "standalone") ? request.booking.standaloneTractors.length : request.booking.tractors.length
                                                            }
                                                        </div>
                                                        <div className="flex items-center gap-1 text-gray-600">
                                                            <Paperclip size={16} />
                                                            {
                                                                (request.booking.bookingType && `${request.booking.bookingType}` === "standalone") ? request.booking.standaloneAttachments.length : request.booking.attachments.length
                                                            }
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })
                    }
                </div>
            </div>
            <Backdrop
                sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
                open={rejectingRequests}
            >
                <CircularProgress />
            </Backdrop>
        </div>
    );
};

export default KanbanBoard;