"use client";

import { useEffect, useState } from 'react';
import { ChevronDown, Plus, Calendar, Clock, MapPin, Tractor, Paperclip, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCookie } from 'next-cookie';
import { NestJsBaseURL, renderInstance } from '@/utils/Axios/RenderInstance';
import { BookingHours, BookingStatus, OperatorBookingJob, ownerOperatorRequest, ownerOperatorResponse } from '@/utils/Types/types';
import { errorMessage, successMessage } from '@/utils/Toastify/Messages';
import { Backdrop, CircularProgress } from '@mui/material';
import SeeFarm from './SeeFarm';
import { io, Socket } from 'socket.io-client';
import { newBookingTranslations } from '../../Farmer/FarmerTranslation';
import TranslatedText from '@/components/Menubar/TranslatedText';
import { operatorBookingsTranslations } from './OperatorBookingTranslation';
import { operatorDashboardTranslations } from '../OperatorDashboardTranslations';

interface user {
    userId: string;
    image: string;
    name: string;
    email: string;
}

const KanbanBoard = () => {
    const today = new Date()
    const monthNames = [
        <TranslatedText key="jan" greetings={operatorDashboardTranslations.january} />,
        <TranslatedText key="feb" greetings={operatorDashboardTranslations.february} />,
        <TranslatedText key="mar" greetings={operatorDashboardTranslations.march} />,
        <TranslatedText key="apr" greetings={operatorDashboardTranslations.april} />,
        <TranslatedText key="may" greetings={operatorDashboardTranslations.may} />,
        <TranslatedText key="jun" greetings={operatorDashboardTranslations.june} />,
        <TranslatedText key="jul" greetings={operatorDashboardTranslations.july} />,
        <TranslatedText key="aug" greetings={operatorDashboardTranslations.august} />,
        <TranslatedText key="sep" greetings={operatorDashboardTranslations.september} />,
        <TranslatedText key="oct" greetings={operatorDashboardTranslations.october} />,
        <TranslatedText key="nov" greetings={operatorDashboardTranslations.november} />,
        <TranslatedText key="dec" greetings={operatorDashboardTranslations.december} />
      ];
      
      const dayNames = [
        <TranslatedText key="sun" greetings={operatorDashboardTranslations.sunday} />,
        <TranslatedText key="mon" greetings={operatorDashboardTranslations.monday} />,
        <TranslatedText key="tue" greetings={operatorDashboardTranslations.tuesday} />,
        <TranslatedText key="wed" greetings={operatorDashboardTranslations.wednesday} />,
        <TranslatedText key="thu" greetings={operatorDashboardTranslations.thursday} />,
        <TranslatedText key="fri" greetings={operatorDashboardTranslations.friday} />,
        <TranslatedText key="sat" greetings={operatorDashboardTranslations.saturday} />
      ];

    const [fetchingRequests, setFetchingRequests] = useState(false)
    const [requests, setRequests] = useState<ownerOperatorRequest[]>([])
    const [completedJobs, setCompletedJobs] = useState<OperatorBookingJob[]>([])
    const [fetchingCompletedJobs, setFetchingCompletedJobs] = useState(false)
    const [rejectingRequests, setRejectingRequests] = useState(false)

    const { cookie } = useCookie();
    const user: user = cookie.get("user")
    const access_token = cookie.get("access_token");

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
            setRequests(pre => pre.filter(b => b.id !== jobId))
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
        }).then((res) => {
            successMessage("Job accepted")
            setRequests(pre => pre.filter(b => b.booking_id !== booking_id))
            setCompletedJobs(pre => [res.data, ...pre])
        }).catch((err) => {
            console.log(err)
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
                errorMessage("Error in accepting request")
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
            setCompletedJobs(pre => pre.map(job => job.booking_id === id ? { ...job, booking: { ...job.booking, bookingStatus: res.data } } : job))
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

    useEffect(() => {
        // Connect to the socket server
        const newSocket: Socket = io(NestJsBaseURL, {
            query: {
                userId: user.userId
            }
        });

        // Listen for the 'newFarmerNotification' event
        newSocket.on('getUpdatedOperatorBookingJob', (bookingJob: OperatorBookingJob) => {
            console.log(bookingJob)
            setCompletedJobs(prevBookings => {
                const existingBookingIndex = prevBookings.findIndex(b => b.id === bookingJob.id);

                if (existingBookingIndex !== -1) {
                    const updatedBookings = prevBookings.filter(b => b.id !== bookingJob.id);
                    return [bookingJob, ...updatedBookings];
                } else {
                    return [bookingJob, ...prevBookings];
                }
            });
        });

        // Clean up the event listener when the component unmounts
        return () => {
            newSocket.disconnect();
        };
    }, []);

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
                        <h2 className="text-xl font-semibold"><TranslatedText greetings={operatorBookingsTranslations.booking} /></h2>
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
                    <TranslatedText greetings={operatorBookingsTranslations.apply} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* New bookings */}
                <div className="space-y-4 border border-gray-300 p-4 rounded-[25px] h-fit">
                    <div className="flex items-center justify-between">
                        <h2 className="font-medium text-gray-900 flex items-center gap-2">
                            <span className="text-gray-400">▸</span>
                            <TranslatedText greetings={operatorBookingsTranslations.newBookings} />
                        </h2>
                    </div>
                    {
                        fetchingRequests ? <div className="space-y-4 border-x-lime-200">
                            {/* Shimmer Effect */}
                            {[...Array(2)].map((_, index) => (
                                <div key={index} className="space-y-3">
                                    <div className="bg-gray-100 rounded-xl p-4 mb-4 shadow-sm animate-pulse">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                                        </div>

                                        <div className="space-y-2 mb-4">
                                            {/* Date Shimmer */}
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                                                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                                            </div>

                                            {/* Hours Shimmer */}
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                                                <div className="h-4 bg-gray-200 rounded w-1/5"></div>
                                            </div>

                                            {/* Tractors Shimmer (Multiple) */}
                                            {[1, 2].map((tractorShimmer) => (
                                                <div key={tractorShimmer} className="flex items-center gap-2">
                                                    <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                                                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                                                </div>
                                            ))}

                                            {/* Attachments Shimmer (Multiple) */}
                                            {[1].map((attachmentShimmer) => (
                                                <div key={attachmentShimmer} className="flex items-center gap-2">
                                                    <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                                                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center gap-1">
                                                        <div className="w-5 h-5 bg-gray-200 rounded-full"></div>
                                                        <div className="h-4 bg-gray-200 rounded w-8"></div>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <div className="w-5 h-5 bg-gray-200 rounded-full"></div>
                                                        <div className="h-4 bg-gray-200 rounded w-8"></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div> : requests.filter(job => job.operator_response !== ownerOperatorResponse.Reject).length === 0 ? <p><TranslatedText greetings={operatorBookingsTranslations.noRequestAvailable} /></p> :
                            requests.filter(job => job.operator_response !== ownerOperatorResponse.Reject).map((request, index) => {
                                console.log(request)
                                return (
                                    <div className="space-y-3" key={index}>
                                        <div className={`bg-purple-200 rounded-xl p-4 mb-4 shadow-sm`}>
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="space-y-2">
                                                    <div className="flex gap-2 mt-4">
                                                        <Button
                                                            variant="default"
                                                            className="w-full"
                                                            disabled={rejectingRequests}
                                                            onClick={() => { handleAccept(request.booking_id, request.operator_id) }}
                                                        >
                                                            <TranslatedText greetings={operatorBookingsTranslations.accept} />
                                                        </Button>
                                                        <Button
                                                            variant="destructive"
                                                            className="w-full"
                                                            disabled={rejectingRequests}
                                                            onClick={() => { handleReject(request.id) }}
                                                        >
                                                            <TranslatedText greetings={operatorBookingsTranslations.decline} />
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
                                                            request.booking.booking_hours ? request.booking.booking_hours === BookingHours.EIGHT_HOURS ? <TranslatedText greetings={newBookingTranslations.hours['8h']} /> : request.booking.booking_hours === BookingHours.SEVEN_HOURS ? <TranslatedText greetings={newBookingTranslations.hours['7h']} /> : request.booking.booking_hours === BookingHours.SIX_HOURS ? <TranslatedText greetings={newBookingTranslations.hours['6h']} /> : request.booking.booking_hours === BookingHours.FIVE_HOURS ? <TranslatedText greetings={newBookingTranslations.hours['5h']} /> : request.booking.booking_hours === BookingHours.FOUR_HOURS ? <TranslatedText greetings={newBookingTranslations.hours['4h']} /> : request.booking.booking_hours === BookingHours.THREE_HOURS ? <TranslatedText greetings={newBookingTranslations.hours['3h']} /> : request.booking.booking_hours === BookingHours.TWO_HOURS ? <TranslatedText greetings={newBookingTranslations.hours['2h']} /> : <TranslatedText greetings={newBookingTranslations.hours['1h']} /> : request.booking.end_date && new Date(request.booking.end_date).toLocaleDateString()
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
                                                    request.booking.farm && <SeeFarm farm={request.booking.farm} />
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
                <div className="space-y-4 border border-gray-300 p-4 rounded-[25px] h-fit">
                    <div className="flex items-center justify-between">
                        <h2 className="font-medium text-gray-900 flex items-center gap-2">
                            <span className="text-gray-400">▸</span>
                            <TranslatedText greetings={operatorBookingsTranslations.accepted} />
                        </h2>
                    </div>
                    {
                        fetchingCompletedJobs ? <div className="space-y-4 border-x-lime-200">
                            {/* Shimmer Effect */}
                            {[...Array(2)].map((_, index) => (
                                <div key={index} className="space-y-3">
                                    <div className="bg-gray-100 rounded-xl p-4 mb-4 shadow-sm animate-pulse">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                                        </div>

                                        <div className="space-y-2 mb-4">
                                            {/* Date Shimmer */}
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                                                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                                            </div>

                                            {/* Hours Shimmer */}
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                                                <div className="h-4 bg-gray-200 rounded w-1/5"></div>
                                            </div>

                                            {/* Tractors Shimmer (Multiple) */}
                                            {[1, 2].map((tractorShimmer) => (
                                                <div key={tractorShimmer} className="flex items-center gap-2">
                                                    <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                                                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                                                </div>
                                            ))}

                                            {/* Attachments Shimmer (Multiple) */}
                                            {[1].map((attachmentShimmer) => (
                                                <div key={attachmentShimmer} className="flex items-center gap-2">
                                                    <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                                                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center gap-1">
                                                        <div className="w-5 h-5 bg-gray-200 rounded-full"></div>
                                                        <div className="h-4 bg-gray-200 rounded w-8"></div>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <div className="w-5 h-5 bg-gray-200 rounded-full"></div>
                                                        <div className="h-4 bg-gray-200 rounded w-8"></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div> : completedJobs.filter(booking => booking.booking.bookingStatus === BookingStatus.Accepted).length === 0 ? <p>Currently you have not accepted any jobs</p> :
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
                                                            disabled={rejectingRequests}
                                                            onClick={() => { handleStatusChange(request.booking_id, BookingStatus.Arriving) }}
                                                        >
                                                            <TranslatedText greetings={operatorBookingsTranslations.arriving} />
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
                                                            request.booking.booking_hours ? request.booking.booking_hours === BookingHours.EIGHT_HOURS ? <TranslatedText greetings={newBookingTranslations.hours['8h']} /> : request.booking.booking_hours === BookingHours.SEVEN_HOURS ? <TranslatedText greetings={newBookingTranslations.hours['7h']} /> : request.booking.booking_hours === BookingHours.SIX_HOURS ? <TranslatedText greetings={newBookingTranslations.hours['6h']} /> : request.booking.booking_hours === BookingHours.FIVE_HOURS ? <TranslatedText greetings={newBookingTranslations.hours['5h']} /> : request.booking.booking_hours === BookingHours.FOUR_HOURS ? <TranslatedText greetings={newBookingTranslations.hours['4h']} /> : request.booking.booking_hours === BookingHours.THREE_HOURS ? <TranslatedText greetings={newBookingTranslations.hours['3h']} /> : request.booking.booking_hours === BookingHours.TWO_HOURS ? <TranslatedText greetings={newBookingTranslations.hours['2h']} /> : <TranslatedText greetings={newBookingTranslations.hours['1h']} /> : request.booking.end_date && new Date(request.booking.end_date).toLocaleDateString()
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
                                                    request.booking.farm && <SeeFarm farm={request.booking.farm} />
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
                <div className="space-y-4 border border-gray-300 p-4 rounded-[25px] h-fit">
                    <div className="flex items-center justify-between">
                        <h2 className="font-medium text-gray-900 flex items-center gap-2">
                            <span className="text-gray-400">▸</span>
                            <TranslatedText greetings={operatorBookingsTranslations.ongoing} />
                        </h2>
                    </div>
                    {
                        fetchingCompletedJobs ? <div className="space-y-4 border-x-lime-200">
                            {/* Shimmer Effect */}
                            {[...Array(2)].map((_, index) => (
                                <div key={index} className="space-y-3">
                                    <div className="bg-gray-100 rounded-xl p-4 mb-4 shadow-sm animate-pulse">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                                        </div>

                                        <div className="space-y-2 mb-4">
                                            {/* Date Shimmer */}
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                                                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                                            </div>

                                            {/* Hours Shimmer */}
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                                                <div className="h-4 bg-gray-200 rounded w-1/5"></div>
                                            </div>

                                            {/* Tractors Shimmer (Multiple) */}
                                            {[1, 2].map((tractorShimmer) => (
                                                <div key={tractorShimmer} className="flex items-center gap-2">
                                                    <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                                                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                                                </div>
                                            ))}

                                            {/* Attachments Shimmer (Multiple) */}
                                            {[1].map((attachmentShimmer) => (
                                                <div key={attachmentShimmer} className="flex items-center gap-2">
                                                    <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                                                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center gap-1">
                                                        <div className="w-5 h-5 bg-gray-200 rounded-full"></div>
                                                        <div className="h-4 bg-gray-200 rounded w-8"></div>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <div className="w-5 h-5 bg-gray-200 rounded-full"></div>
                                                        <div className="h-4 bg-gray-200 rounded w-8"></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div> : completedJobs.filter(booking => (booking.booking.bookingStatus !== BookingStatus.Accepted) && (booking.booking.bookingStatus !== BookingStatus.Finished)).length === 0 ? <p><TranslatedText greetings={operatorBookingsTranslations.noOngoingBookings} /></p> :
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
                                                                    disabled={rejectingRequests}
                                                                        onClick={() => { handleStatusChange(request.booking.id, BookingStatus.Arrived) }}>
                                                                        <TranslatedText greetings={operatorBookingsTranslations.arrived} />
                                                                    </Button>
                                                                    : (request.booking.bookingStatus === BookingStatus.Arrived || request.booking.bookingStatus === BookingStatus.Stopped) ?
                                                                        <Button
                                                                        disabled={rejectingRequests}
                                                                            onClick={() => { handleStatusChange(request.booking.id, BookingStatus.Started) }}>
                                                                            <TranslatedText greetings={operatorBookingsTranslations.starting} />
                                                                        </Button>
                                                                        : (request.booking.bookingStatus === BookingStatus.Started) && <div className='space-x-2'>
                                                                            <Button
                                                                            disabled={rejectingRequests}
                                                                                onClick={() => { handleStatusChange(request.booking.id, BookingStatus.Stopped) }}>
                                                                                <TranslatedText greetings={operatorBookingsTranslations.pause} />
                                                                            </Button>
                                                                            <Button
                                                                            disabled={rejectingRequests}
                                                                                onClick={() => { handleStatusChange(request.booking.id, BookingStatus.Finished) }}>
                                                                                <TranslatedText greetings={operatorBookingsTranslations.complete} />
                                                                            </Button>
                                                                        </div>
                                                            )
                                                        }
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                        <span className="font-medium"><TranslatedText greetings={operatorBookingsTranslations.bookingID} />: #holabook{request.booking_id.slice(-4)} </span>
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
                                                            request.booking.booking_hours ? request.booking.booking_hours === BookingHours.EIGHT_HOURS ? <TranslatedText greetings={newBookingTranslations.hours['8h']} /> : request.booking.booking_hours === BookingHours.SEVEN_HOURS ? <TranslatedText greetings={newBookingTranslations.hours['7h']} /> : request.booking.booking_hours === BookingHours.SIX_HOURS ? <TranslatedText greetings={newBookingTranslations.hours['6h']} /> : request.booking.booking_hours === BookingHours.FIVE_HOURS ? <TranslatedText greetings={newBookingTranslations.hours['5h']} /> : request.booking.booking_hours === BookingHours.FOUR_HOURS ? <TranslatedText greetings={newBookingTranslations.hours['4h']} /> : request.booking.booking_hours === BookingHours.THREE_HOURS ? <TranslatedText greetings={newBookingTranslations.hours['3h']} /> : request.booking.booking_hours === BookingHours.TWO_HOURS ? <TranslatedText greetings={newBookingTranslations.hours['2h']} /> : <TranslatedText greetings={newBookingTranslations.hours['1h']} /> : request.booking.end_date && new Date(request.booking.end_date).toLocaleDateString()
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
                                                    request.booking.farm && <SeeFarm farm={request.booking.farm} />
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
                <div className="space-y-4 border border-gray-300 p-4 rounded-[25px] h-fit">
                    <div className="flex items-center justify-between">
                        <h2 className="font-medium text-gray-900 flex items-center gap-2">
                            <span className="text-gray-400">▸</span>
                            <TranslatedText greetings={operatorBookingsTranslations.completed} />
                        </h2>
                    </div>
                    {
                        fetchingCompletedJobs ? <div className="space-y-4 border-x-lime-200">
                            {/* Shimmer Effect */}
                            {[...Array(2)].map((_, index) => (
                                <div key={index} className="space-y-3">
                                    <div className="bg-gray-100 rounded-xl p-4 mb-4 shadow-sm animate-pulse">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                                        </div>

                                        <div className="space-y-2 mb-4">
                                            {/* Date Shimmer */}
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                                                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                                            </div>

                                            {/* Hours Shimmer */}
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                                                <div className="h-4 bg-gray-200 rounded w-1/5"></div>
                                            </div>

                                            {/* Tractors Shimmer (Multiple) */}
                                            {[1, 2].map((tractorShimmer) => (
                                                <div key={tractorShimmer} className="flex items-center gap-2">
                                                    <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                                                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                                                </div>
                                            ))}

                                            {/* Attachments Shimmer (Multiple) */}
                                            {[1].map((attachmentShimmer) => (
                                                <div key={attachmentShimmer} className="flex items-center gap-2">
                                                    <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                                                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center gap-1">
                                                        <div className="w-5 h-5 bg-gray-200 rounded-full"></div>
                                                        <div className="h-4 bg-gray-200 rounded w-8"></div>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <div className="w-5 h-5 bg-gray-200 rounded-full"></div>
                                                        <div className="h-4 bg-gray-200 rounded w-8"></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div> : completedJobs.filter(booking => booking.booking.bookingStatus === BookingStatus.Finished).length === 0 ? <p><TranslatedText greetings={operatorBookingsTranslations.noAcceptedJobs} /></p> :
                            completedJobs.filter(booking => booking.booking.bookingStatus === BookingStatus.Finished).map((request, index) => {
                                return (
                                    <div className="space-y-3" key={index}>
                                        <div className={`bg-green-200 rounded-xl p-4 mb-4 shadow-sm`}>
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <span className="font-medium"><TranslatedText greetings={operatorBookingsTranslations.bookingID} />: #holabook{request.booking_id.slice(-4)} </span>
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
                                                            request.booking.booking_hours ? request.booking.booking_hours === BookingHours.EIGHT_HOURS ? <TranslatedText greetings={newBookingTranslations.hours['8h']} /> : request.booking.booking_hours === BookingHours.SEVEN_HOURS ? <TranslatedText greetings={newBookingTranslations.hours['7h']} /> : request.booking.booking_hours === BookingHours.SIX_HOURS ? <TranslatedText greetings={newBookingTranslations.hours['6h']} /> : request.booking.booking_hours === BookingHours.FIVE_HOURS ? <TranslatedText greetings={newBookingTranslations.hours['5h']} /> : request.booking.booking_hours === BookingHours.FOUR_HOURS ? <TranslatedText greetings={newBookingTranslations.hours['4h']} /> : request.booking.booking_hours === BookingHours.THREE_HOURS ? <TranslatedText greetings={newBookingTranslations.hours['3h']} /> : request.booking.booking_hours === BookingHours.TWO_HOURS ? <TranslatedText greetings={newBookingTranslations.hours['2h']} /> : <TranslatedText greetings={newBookingTranslations.hours['1h']} /> : request.booking.end_date && new Date(request.booking.end_date).toLocaleDateString()
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
                                                    request.booking.farm && <SeeFarm farm={request.booking.farm} />
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