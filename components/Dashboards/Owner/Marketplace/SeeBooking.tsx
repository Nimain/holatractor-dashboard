"use client"

import { Booking, BookingHours, BookingStatus, PaymentStatus, Store } from "@/utils/Types/types"
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronsUpDown, Mail, MessageCircle, MoreHorizontal, NotepadText, Phone, Plus } from "lucide-react";
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { renderInstance } from "@/utils/Axios/RenderInstance";
import { useCookie } from "next-cookie";
import { useEffect, useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { errorMessage, successMessage } from "@/utils/Toastify/Messages";
import { Backdrop, CircularProgress } from "@mui/material";
import AssignOperator from "../bookings/AssignOperator";
import PaymentReview from "../_components/PaymentProofAction";

const SeeBooking = ({ booking }: { booking: Booking }) => {
    return (
        <Sheet>
            <SheetTrigger asChild>
                <Card className="overflow-hidden bg-white shadow-sm rounded-md mt-3">
                    <CardContent className="flex items-center space-x-4 p-4">
                        <Avatar className="h-12 w-12">
                            {
                                booking.user && booking.user?.image &&
                                <AvatarImage src={booking.user?.image} alt={booking.user.first_name} />
                            }
                            <AvatarFallback>
                                {booking.user?.first_name[0]}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium leading-none">{booking.user?.first_name} {booking.user?.middle_name ?? ""} {booking.user?.last_name}</p>
                            <p className="text-sm text-muted-foreground">{new Date(booking.updatedAt).toLocaleDateString()}</p>
                            <div className="flex items-center pt-2">
                                <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                                <span className="text-sm">
                                    {`${booking.user?.email.split('@')[0].slice(0, 3)}...@${booking.user?.email.split('@')[1]}`}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </SheetTrigger>
            <SheetContent side="right" className="p-0 bg-white">
                <SheetHeader className="px-6 py-4 border-b">
                    <SheetTitle className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <ChevronRight className="h-4 w-4" />
                            <span className="text-lg font-semibold">Lead Preview</span>
                        </div>
                    </SheetTitle>
                </SheetHeader>

                <div className="px-6 py-4 overflow-y-auto h-[calc(100vh-80px)]">
                    <div className="bg-white rounded-lg shadow-md p-6 border mt-3">
                        <div className="flex justify-between">

                            <div className="flex items-center space-x-4">
                                <div>
                                    <Avatar className="h-16 w-16">
                                        {
                                            booking.user?.image &&
                                            <AvatarImage src={booking.user?.image} />
                                        }
                                        <AvatarFallback>
                                            {booking.user?.first_name[0]}{booking.user?.last_name[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                </div>
                                <div>
                                    <div>
                                        <h2 className="text-xl font-semibold">
                                            {`${booking.user?.first_name} ${booking.user?.middle_name ?? ""} ${booking.user?.last_name}`}
                                        </h2>
                                    </div>
                                    {
                                        booking.owner_confirm &&
                                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                            <Mail className="h-4 w-4" />
                                            <span className="text-sm">
                                                {booking.user?.email}
                                            </span>
                                        </div>
                                    }
                                </div>
                            </div>
                            {/* <div className="flex space-x-2">
                                <div className="h-7 w-7 flex items-center justify-center rounded-full bg-gray-200">
                                    <Plus className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div className="h-7 w-7 flex items-center justify-center rounded-full bg-gray-200">
                                    <MessageCircle className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div className="h-7 w-7 flex items-center justify-center rounded-full bg-gray-200">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div className="h-7 w-7 flex items-center justify-center rounded-full bg-gray-200">
                                    <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                                </div>
                            </div> */}

                        </div>
                        {/* <div>
                            <div className="grid grid-cols-4 gap-4 mt-6 border">
                                <div className="p-4">
                                    <Label className="text-xs text-muted-foreground">Lead owner</Label>
                                    <div className="font-medium">Esther Howard</div>
                                </div>
                                <div className="p-4">
                                    <Label className="text-xs text-muted-foreground">Company</Label>
                                    <div className="font-medium">Google</div>
                                </div>
                                <div className="p-4">
                                    <Label className="text-xs text-muted-foreground">Job Title</Label>
                                    <div className="font-medium">Content Writer</div>
                                </div>
                                <div className="p-4">
                                    <Label className="text-xs text-muted-foreground block mb-1">Annual revenue</Label>
                                    <div className="font-medium">$ 5,000</div>
                                </div>
                            </div>
                        </div> */}
                    </div>

                    <div className="flex items-center justify-between mt-6">
                        {
                            booking.booking_hours &&
                            <div className="flex items-center space-x-2 p-2 border rounded-md">
                                <span className="text-green-500">
                                    <i className="fas fa-check-circle"></i>
                                </span>
                                <span className="text-sm text-muted-foreground">
                                    Duration: <span className="font-medium">{booking.booking_hours === BookingHours.EIGHT_HOURS ? "8 hours" : booking.booking_hours === BookingHours.SEVEN_HOURS ? "7 hours" : booking.booking_hours === BookingHours.SIX_HOURS ? "6 hours" : booking.booking_hours === BookingHours.FIVE_HOURS ? "5 hours" : booking.booking_hours === BookingHours.FOUR_HOURS ? "4 hours" : booking.booking_hours === BookingHours.THREE_HOURS ? "3 hours" : booking.booking_hours === BookingHours.TWO_HOURS ? "2 hours" : "1 hour"}</span>
                                </span>
                            </div>
                        }
                        <div className="flex items-center space-x-2 p-2 border rounded-md ml-auto">
                            <span className="text-green-500">
                                <i className="fas fa-check-circle"></i>
                            </span>
                            <span className="text-sm text-muted-foreground">
                                Created: <span className="font-medium">{new Date(booking.createdAt).toLocaleDateString()}</span>
                            </span>
                        </div>
                    </div>

                    <div className="mt-6">
                        <Calendar
                            initialFocus
                            mode="range"
                            selected={(booking.end_date && !booking.booking_hours) ? {
                                from: new Date(booking.start_date),
                                to: new Date(booking.end_date),
                            } : {
                                from: new Date(booking.start_date),
                                to: new Date(booking.start_date)
                            }}
                            className="text-xl text-blue-500" />
                    </div>

                    {
                        booking.owner_confirm &&
                        <div className="mt-6">
                            <h3 className="text-lg font-semibold">
                                Booking timeline:
                            </h3>
                            <div className="space-y-6">
                                <div className="flex gap-3">
                                    <div className="flex flex-col items-center">
                                        <div className={`w-3 h-3 rounded-full ${(booking.bookingStatus === BookingStatus.Open) || (booking.bookingStatus === BookingStatus.Accepted) || (booking.bookingStatus === BookingStatus.Arriving) || (booking.bookingStatus === BookingStatus.Arrived) || (booking.bookingStatus === BookingStatus.Started) || (booking.bookingStatus === BookingStatus.Stopped) || ((booking.bookingStatus === BookingStatus.Finished) && (`${booking.payment[0].status}` === "FarmerPENDING")) || ((booking.bookingStatus === BookingStatus.Finished) && (`${booking.payment[0].status}` === "FarmerCONFIRMED")) || ((booking.bookingStatus === BookingStatus.Finished) && (`${booking.payment[0].status}` === "OwnerREJECTED")) || ((booking.bookingStatus === BookingStatus.Finished) && (`${booking.payment[0].status}` === "COMPLETED"))
                                            ? 'bg-green-500'
                                            : 'bg-yellow-400'
                                            }`} />
                                    </div>

                                    <div className="flex-1 pb-6">
                                        <div className="flex justify-between">
                                            <p className="font-medium">You just confirmed the booking</p>
                                        </div>
                                    </div>
                                </div>
                                {
                                    booking.bookingStatus === BookingStatus.Open &&
                                    <AssignOperator selectedRequest={booking.id} storeId={booking.store_id} store={booking.store} />
                                }
                                <div className="flex gap-3">
                                    <div className="flex flex-col items-center">
                                        <div className={`w-3 h-3 rounded-full ${(booking.bookingStatus === BookingStatus.Accepted) || (booking.bookingStatus === BookingStatus.Arriving) || (booking.bookingStatus === BookingStatus.Arrived) || (booking.bookingStatus === BookingStatus.Started) || (booking.bookingStatus === BookingStatus.Stopped) || ((booking.bookingStatus === BookingStatus.Finished) && (`${booking.payment[0].status}` === "FarmerPENDING")) || ((booking.bookingStatus === BookingStatus.Finished) && (`${booking.payment[0].status}` === "FarmerCONFIRMED")) || ((booking.bookingStatus === BookingStatus.Finished) && (`${booking.payment[0].status}` === "OwnerREJECTED")) || ((booking.bookingStatus === BookingStatus.Finished) && (`${booking.payment[0].status}` === "COMPLETED"))
                                            ? 'bg-green-500'
                                            : 'bg-yellow-400'
                                            }`} />
                                    </div>

                                    <div className="flex-1 pb-6">
                                        <div className="flex justify-between">
                                            <p className="font-medium">
                                                Operator has accepted this booking.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <div className="flex flex-col items-center">
                                        <div className={`w-3 h-3 rounded-full ${(booking.bookingStatus === BookingStatus.Arriving) || (booking.bookingStatus === BookingStatus.Arrived) || (booking.bookingStatus === BookingStatus.Started) || (booking.bookingStatus === BookingStatus.Stopped) || ((booking.bookingStatus === BookingStatus.Finished) && (`${booking.payment[0].status}` === "FarmerPENDING")) || ((booking.bookingStatus === BookingStatus.Finished) && (`${booking.payment[0].status}` === "FarmerCONFIRMED")) || ((booking.bookingStatus === BookingStatus.Finished) && (`${booking.payment[0].status}` === "OwnerREJECTED")) || ((booking.bookingStatus === BookingStatus.Finished) && (`${booking.payment[0].status}` === "COMPLETED"))
                                            ? 'bg-green-500'
                                            : 'bg-yellow-400'
                                            }`} />
                                    </div>

                                    <div className="flex-1 pb-6">
                                        <div className="flex justify-between">
                                            <p className="font-medium">
                                                The booking has left for it's destination.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <div className="flex flex-col items-center">
                                        <div className={`w-3 h-3 rounded-full ${(booking.bookingStatus === BookingStatus.Arrived) || (booking.bookingStatus === BookingStatus.Started) || (booking.bookingStatus === BookingStatus.Stopped) || ((booking.bookingStatus === BookingStatus.Finished) && (`${booking.payment[0].status}` === "FarmerPENDING")) || ((booking.bookingStatus === BookingStatus.Finished) && (`${booking.payment[0].status}` === "FarmerCONFIRMED")) || ((booking.bookingStatus === BookingStatus.Finished) && (`${booking.payment[0].status}` === "OwnerREJECTED")) || ((booking.bookingStatus === BookingStatus.Finished) && (`${booking.payment[0].status}` === "COMPLETED"))
                                            ? 'bg-green-500'
                                            : 'bg-yellow-400'
                                            }`} />
                                    </div>

                                    <div className="flex-1 pb-6">
                                        <div className="flex justify-between">
                                            <p className="font-medium">
                                                The booking has arrived at it's destination.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <div className="flex flex-col items-center">
                                        <div className={`w-3 h-3 rounded-full ${(booking.bookingStatus === BookingStatus.Started) || (booking.bookingStatus === BookingStatus.Stopped) || ((booking.bookingStatus === BookingStatus.Finished) && (`${booking.payment[0].status}` === "FarmerPENDING")) || ((booking.bookingStatus === BookingStatus.Finished) && (`${booking.payment[0].status}` === "FarmerCONFIRMED")) || ((booking.bookingStatus === BookingStatus.Finished) && (`${booking.payment[0].status}` === "OwnerREJECTED")) || ((booking.bookingStatus === BookingStatus.Finished) && (`${booking.payment[0].status}` === "COMPLETED"))
                                            ? 'bg-green-500'
                                            : 'bg-yellow-400'
                                            }`} />
                                    </div>

                                    <div className="flex-1 pb-6">
                                        <div className="flex justify-between">
                                            <p className="font-medium">
                                                The booking has started it's work.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <div className="flex flex-col items-center">
                                        <div className={`w-3 h-3 rounded-full ${((booking.bookingStatus === BookingStatus.Finished) && (`${booking.payment[0].status}` === "FarmerPENDING")) || ((booking.bookingStatus === BookingStatus.Finished) && (`${booking.payment[0].status}` === "FarmerCONFIRMED")) || ((booking.bookingStatus === BookingStatus.Finished) && (`${booking.payment[0].status}` === "OwnerREJECTED")) || ((booking.bookingStatus === BookingStatus.Finished) && (`${booking.payment[0].status}` === "COMPLETED"))
                                            ? 'bg-green-500'
                                            : 'bg-yellow-400'
                                            }`} />
                                    </div>

                                    <div className="flex-1 pb-6">
                                        <div className="flex justify-between">
                                            <p className="font-medium">
                                                The booking has completed. Wailting for farmer to pay.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <div className="flex flex-col items-center">
                                        <div className={`w-3 h-3 rounded-full ${((booking.bookingStatus === BookingStatus.Finished) && (`${booking.payment[0].status}` === "FarmerCONFIRMED")) || ((booking.bookingStatus === BookingStatus.Finished) && (`${booking.payment[0].status}` === "OwnerREJECTED")) || ((booking.bookingStatus === BookingStatus.Finished) && (`${booking.payment[0].status}` === "COMPLETED"))
                                            ? 'bg-green-500'
                                            : 'bg-yellow-400'
                                            }`} />
                                    </div>

                                    <div className="flex-1 pb-6">
                                        <div className="flex justify-between">
                                            <p className="font-medium">
                                                FArmer has submitted payment details
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <div className="flex flex-col items-center">
                                        <div className={`w-3 h-3 rounded-full ${((booking.bookingStatus === BookingStatus.Finished) && (`${booking.payment[0].status}` === "OwnerREJECTED")) || ((booking.bookingStatus === BookingStatus.Finished) && (`${booking.payment[0].status}` === "COMPLETED"))
                                            ? 'bg-green-500'
                                            : 'bg-yellow-400'
                                            }`} />
                                    </div>

                                    <div className="flex-1 pb-6">
                                        <div className="flex justify-between">
                                            <p className="font-medium">
                                                You have rejected the booking payment details.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <div className="flex flex-col items-center">
                                        <div className={`w-3 h-3 rounded-full ${((booking.bookingStatus === BookingStatus.Finished) && (`${booking.payment[0].status}` === "COMPLETED"))
                                            ? 'bg-green-500'
                                            : 'bg-yellow-400'
                                            }`} />
                                    </div>

                                    <div className="flex-1 pb-6">
                                        <div className="flex justify-between">
                                            <p className="font-medium">
                                                The booking job has completed and you have accepted the payment.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                {
                                    (booking.payment.length > 0 && booking.payment[0].status === PaymentStatus.FarmerCONFIRMED) && <PaymentReview
                                        referenceNumber={booking.payment[0].transaction_reference[booking.payment[0].transaction_reference.length - 1]}
                                        screenshotUrl={booking.payment[0].screenshots[booking.payment[0].screenshots.length - 1]}
                                        paymentId={booking.payment[0].id} />
                                }
                            </div>
                        </div>
                    }
                </div>
            </SheetContent>
        </Sheet>
    )
}

export default SeeBooking