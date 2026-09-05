"use client"

import { Booking, BookingHours, BookingStatus, PaymentStatus } from "@/utils/Types/types"
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { ChevronRight, Mail } from "lucide-react";
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import AssignOperator from "../bookings/AssignOperator";
import PaymentReview from "../_components/PaymentProofAction";
import { ownerMarketPlaceTranslations } from "./OwnerMarketPlaceTranslations";
import TranslatedText from "@/components/Menubar/TranslatedText";
import { newBookingTranslations } from "../../Farmer/FarmerTranslation";

const SeeBooking = ({ booking }: { booking: Booking }) => {
    return (
        <Sheet>
            <SheetTrigger asChild>
                <Card className="overflow-hidden bg-gradient-to-r from-[#8c0000] to-[#4d0000] text-white shadow-sm rounded-md mt-3">
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
            <SheetContent side="right" className="p-0 bg-gradient-to-r from-[#8c0000] to-[#4d0000] text-white">
                <SheetHeader className="px-6 py-4 border-b">
                    <SheetTitle className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <ChevronRight className="h-4 w-4" />
                            <span className="text-lg font-semibold"><TranslatedText greetings={ownerMarketPlaceTranslations.leadPreview} /></span>
                        </div>
                    </SheetTitle>
                </SheetHeader>

                <div className="px-6 py-4 overflow-y-auto h-[calc(100vh-80px)]">
                    <div className="bg-gradient-to-r from-[#8c0000] to-[#4d0000] text-white rounded-lg shadow-md p-6 border mt-3">
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
                                <TranslatedText greetings={ownerMarketPlaceTranslations.duration} />: <span className="font-medium">{booking.booking_hours === BookingHours.EIGHT_HOURS ? <TranslatedText greetings={newBookingTranslations.hours['8h']} /> : booking.booking_hours === BookingHours.SEVEN_HOURS ? <TranslatedText greetings={newBookingTranslations.hours['7h']} /> : booking.booking_hours === BookingHours.SIX_HOURS ? <TranslatedText greetings={newBookingTranslations.hours['6h']} /> : booking.booking_hours === BookingHours.FIVE_HOURS ? <TranslatedText greetings={newBookingTranslations.hours['5h']} /> : booking.booking_hours === BookingHours.FOUR_HOURS ? <TranslatedText greetings={newBookingTranslations.hours['4h']} /> : booking.booking_hours === BookingHours.THREE_HOURS ? <TranslatedText greetings={newBookingTranslations.hours['3h']} /> : booking.booking_hours === BookingHours.TWO_HOURS ? <TranslatedText greetings={newBookingTranslations.hours['2h']} /> : <TranslatedText greetings={newBookingTranslations.hours['1h']} />}</span>
                                </span>
                            </div>
                        }
                        <div className="flex items-center space-x-2 p-2 border rounded-md ml-auto">
                            <span className="text-green-500">
                                <i className="fas fa-check-circle"></i>
                            </span>
                            <span className="text-sm text-muted-foreground">
                            <TranslatedText greetings={ownerMarketPlaceTranslations.created} />: <span className="font-medium">{new Date(booking.createdAt).toLocaleDateString()}</span>
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
                        booking.owner_confirm && (() => {
                            const paymentList = Array.isArray(booking?.payment) ? booking.payment : [];
                            const hasPayments = paymentList.length > 0;
                            const firstPayment = hasPayments ? paymentList[0] : null;
                            const paymentStatus = firstPayment?.status ? String(firstPayment.status) : "";

                            return (
                                <div className="mt-6">
                                    <h3 className="text-lg font-semibold">
                                    <TranslatedText greetings={ownerMarketPlaceTranslations.bookingTimeline} />:
                                    </h3>
                                    <div className="space-y-6">
                                        <div className="flex gap-3">
                                            <div className="flex flex-col items-center">
                                                <div className={`w-3 h-3 rounded-full ${(booking.bookingStatus === BookingStatus.Open) || (booking.bookingStatus === BookingStatus.Accepted) || (booking.bookingStatus === BookingStatus.Arriving) || (booking.bookingStatus === BookingStatus.Arrived) || (booking.bookingStatus === BookingStatus.Started) || (booking.bookingStatus === BookingStatus.Stopped) || ((booking.bookingStatus === BookingStatus.Finished) && (paymentStatus === "FarmerPENDING")) || ((booking.bookingStatus === BookingStatus.Finished) && (paymentStatus === "FarmerCONFIRMED")) || ((booking.bookingStatus === BookingStatus.Finished) && (paymentStatus === "OwnerREJECTED")) || ((booking.bookingStatus === BookingStatus.Finished) && (paymentStatus === "COMPLETED"))
                                                    ? 'bg-green-500'
                                                    : 'bg-yellow-400'
                                                    }`} />
                                            </div>

                                            <div className="flex-1 pb-6">
                                                <div className="flex justify-between">
                                                    <p className="font-medium"><TranslatedText greetings={ownerMarketPlaceTranslations.justConfirmedBooking} /></p>
                                                </div>
                                            </div>
                                        </div>
                                        {
                                            booking.bookingStatus === BookingStatus.Open &&
                                            <AssignOperator selectedRequest={booking.id} storeId={booking.store_id} />
                                        }
                                        <div className="flex gap-3">
                                            <div className="flex flex-col items-center">
                                                <div className={`w-3 h-3 rounded-full ${(booking.bookingStatus === BookingStatus.Accepted) || (booking.bookingStatus === BookingStatus.Arriving) || (booking.bookingStatus === BookingStatus.Arrived) || (booking.bookingStatus === BookingStatus.Started) || (booking.bookingStatus === BookingStatus.Stopped) || ((booking.bookingStatus === BookingStatus.Finished) && (paymentStatus === "FarmerPENDING")) || ((booking.bookingStatus === BookingStatus.Finished) && (paymentStatus === "FarmerCONFIRMED")) || ((booking.bookingStatus === BookingStatus.Finished) && (paymentStatus === "OwnerREJECTED")) || ((booking.bookingStatus === BookingStatus.Finished) && (paymentStatus === "COMPLETED"))
                                                    ? 'bg-green-500'
                                                    : 'bg-yellow-400'
                                                    }`} />
                                            </div>

                                            <div className="flex-1 pb-6">
                                                <div className="flex justify-between">
                                                    <p className="font-medium">
                                                    <TranslatedText greetings={ownerMarketPlaceTranslations.operatorAcceptedBooking} />
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-3">
                                            <div className="flex flex-col items-center">
                                                <div className={`w-3 h-3 rounded-full ${(booking.bookingStatus === BookingStatus.Arriving) || (booking.bookingStatus === BookingStatus.Arrived) || (booking.bookingStatus === BookingStatus.Started) || (booking.bookingStatus === BookingStatus.Stopped) || ((booking.bookingStatus === BookingStatus.Finished) && (paymentStatus === "FarmerPENDING")) || ((booking.bookingStatus === BookingStatus.Finished) && (paymentStatus === "FarmerCONFIRMED")) || ((booking.bookingStatus === BookingStatus.Finished) && (paymentStatus === "OwnerREJECTED")) || ((booking.bookingStatus === BookingStatus.Finished) && (paymentStatus === "COMPLETED"))
                                                    ? 'bg-green-500'
                                                    : 'bg-yellow-400'
                                                    }`} />
                                            </div>

                                            <div className="flex-1 pb-6">
                                                <div className="flex justify-between">
                                                    <p className="font-medium">
                                                    <TranslatedText greetings={ownerMarketPlaceTranslations.bookingLeftDestination} />
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-3">
                                            <div className="flex flex-col items-center">
                                                <div className={`w-3 h-3 rounded-full ${(booking.bookingStatus === BookingStatus.Arrived) || (booking.bookingStatus === BookingStatus.Started) || (booking.bookingStatus === BookingStatus.Stopped) || ((booking.bookingStatus === BookingStatus.Finished) && (paymentStatus === "FarmerPENDING")) || ((booking.bookingStatus === BookingStatus.Finished) && (paymentStatus === "FarmerCONFIRMED")) || ((booking.bookingStatus === BookingStatus.Finished) && (paymentStatus === "OwnerREJECTED")) || ((booking.bookingStatus === BookingStatus.Finished) && (paymentStatus === "COMPLETED"))
                                                    ? 'bg-green-500'
                                                    : 'bg-yellow-400'
                                                    }`} />
                                            </div>

                                            <div className="flex-1 pb-6">
                                                <div className="flex justify-between">
                                                    <p className="font-medium">
                                                    <TranslatedText greetings={ownerMarketPlaceTranslations.bookingArrivedDestination} />
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-3">
                                            <div className="flex flex-col items-center">
                                                <div className={`w-3 h-3 rounded-full ${(booking.bookingStatus === BookingStatus.Started) || (booking.bookingStatus === BookingStatus.Stopped) || ((booking.bookingStatus === BookingStatus.Finished) && (paymentStatus === "FarmerPENDING")) || ((booking.bookingStatus === BookingStatus.Finished) && (paymentStatus === "FarmerCONFIRMED")) || ((booking.bookingStatus === BookingStatus.Finished) && (paymentStatus === "OwnerREJECTED")) || ((booking.bookingStatus === BookingStatus.Finished) && (paymentStatus === "COMPLETED"))
                                                    ? 'bg-green-500'
                                                    : 'bg-yellow-400'
                                                    }`} />
                                            </div>

                                            <div className="flex-1 pb-6">
                                                <div className="flex justify-between">
                                                    <p className="font-medium">
                                                    <TranslatedText greetings={ownerMarketPlaceTranslations.bookingStartedWork} />
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-3">
                                            <div className="flex flex-col items-center">
                                                <div className={`w-3 h-3 rounded-full ${((booking.bookingStatus === BookingStatus.Finished) && (paymentStatus === "FarmerPENDING")) || ((booking.bookingStatus === BookingStatus.Finished) && (paymentStatus === "FarmerCONFIRMED")) || ((booking.bookingStatus === BookingStatus.Finished) && (paymentStatus === "OwnerREJECTED")) || ((booking.bookingStatus === BookingStatus.Finished) && (paymentStatus === "COMPLETED"))
                                                    ? 'bg-green-500'
                                                    : 'bg-yellow-400'
                                                    }`} />
                                            </div>

                                            <div className="flex-1 pb-6">
                                                <div className="flex justify-between">
                                                    <p className="font-medium">
                                                    <TranslatedText greetings={ownerMarketPlaceTranslations.bookingCompletedWaitingPayment} />
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-3">
                                            <div className="flex flex-col items-center">
                                                <div className={`w-3 h-3 rounded-full ${((booking.bookingStatus === BookingStatus.Finished) && (paymentStatus === "FarmerCONFIRMED")) || ((booking.bookingStatus === BookingStatus.Finished) && (paymentStatus === "OwnerREJECTED")) || ((booking.bookingStatus === BookingStatus.Finished) && (paymentStatus === "COMPLETED"))
                                                    ? 'bg-green-500'
                                                    : 'bg-yellow-400'
                                                    }`} />
                                            </div>

                                            <div className="flex-1 pb-6">
                                                <div className="flex justify-between">
                                                    <p className="font-medium">
                                                    <TranslatedText greetings={ownerMarketPlaceTranslations.farmerSubmittedPayment} />
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-3">
                                            <div className="flex flex-col items-center">
                                                <div className={`w-3 h-3 rounded-full ${((booking.bookingStatus === BookingStatus.Finished) && (paymentStatus === "OwnerREJECTED")) || ((booking.bookingStatus === BookingStatus.Finished) && (paymentStatus === "COMPLETED"))
                                                    ? 'bg-green-500'
                                                    : 'bg-yellow-400'
                                                    }`} />
                                            </div>

                                            <div className="flex-1 pb-6">
                                                <div className="flex justify-between">
                                                    <p className="font-medium">
                                                    <TranslatedText greetings={ownerMarketPlaceTranslations.rejectedPaymentDetails} />
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-3">
                                            <div className="flex flex-col items-center">
                                                <div className={`w-3 h-3 rounded-full ${((booking.bookingStatus === BookingStatus.Finished) && (paymentStatus === "COMPLETED"))
                                                    ? 'bg-green-500'
                                                    : 'bg-yellow-400'
                                                    }`} />
                                            </div>

                                            <div className="flex-1 pb-6">
                                                <div className="flex justify-between">
                                                    <p className="font-medium">
                                                    <TranslatedText greetings={ownerMarketPlaceTranslations.jobCompletedPaymentAccepted} />
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        {
                                            (hasPayments && firstPayment && (paymentStatus === "FarmerCONFIRMED" || (paymentStatus as any) === PaymentStatus.FarmerCONFIRMED)) && <PaymentReview
                                                referenceNumber={firstPayment.transaction_reference?.[(firstPayment.transaction_reference?.length || 1) - 1] || ""}
                                                screenshotUrl={firstPayment.screenshots?.[(firstPayment.screenshots?.length || 1) - 1] || ""}
                                                paymentId={firstPayment.id} />
                                        }
                                    </div>
                                </div>
                            )
                        })()
                    }
                </div>
            </SheetContent>
        </Sheet>
    )
}

export default SeeBooking