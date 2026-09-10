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
import { ChevronRight, Mail, CalendarDays, Clock, CheckCircle2, AlertCircle, Sparkles, ShieldCheck, Check, Layers } from "lucide-react";
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import AssignOperator from "../bookings/AssignOperator";
import PaymentReview from "../_components/PaymentProofAction";
import { ownerMarketPlaceTranslations } from "./OwnerMarketPlaceTranslations";
import TranslatedText from "@/components/Menubar/TranslatedText";
import { newBookingTranslations } from "../../Farmer/FarmerTranslation";

const SeeBooking = ({ booking }: { booking: Booking }) => {
    const durationLabel = booking.booking_hours === BookingHours.EIGHT_HOURS ? (
        <TranslatedText greetings={newBookingTranslations.hours['8h']} />
    ) : booking.booking_hours === BookingHours.SEVEN_HOURS ? (
        <TranslatedText greetings={newBookingTranslations.hours['7h']} />
    ) : booking.booking_hours === BookingHours.SIX_HOURS ? (
        <TranslatedText greetings={newBookingTranslations.hours['6h']} />
    ) : booking.booking_hours === BookingHours.FIVE_HOURS ? (
        <TranslatedText greetings={newBookingTranslations.hours['5h']} />
    ) : booking.booking_hours === BookingHours.FOUR_HOURS ? (
        <TranslatedText greetings={newBookingTranslations.hours['4h']} />
    ) : booking.booking_hours === BookingHours.THREE_HOURS ? (
        <TranslatedText greetings={newBookingTranslations.hours['3h']} />
    ) : booking.booking_hours === BookingHours.TWO_HOURS ? (
        <TranslatedText greetings={newBookingTranslations.hours['2h']} />
    ) : booking.booking_hours === BookingHours.ONE_HOUR ? (
        <TranslatedText greetings={newBookingTranslations.hours['1h']} />
    ) : null;

    const maskedEmail = booking.user?.email && booking.user.email.includes("@")
        ? `${booking.user.email.split('@')[0].slice(0, 3)}...@${booking.user.email.split('@')[1]}`
        : (booking.user?.email || "");

    const fullName = `${booking.user?.first_name || ""} ${booking.user?.middle_name ?? ""} ${booking.user?.last_name || ""}`.trim() || "Farmer";

    const paymentList = Array.isArray(booking?.payment) ? booking.payment : [];
    const hasPayments = paymentList.length > 0;
    const firstPayment = hasPayments ? paymentList[0] : null;
    const paymentStatus = firstPayment?.status ? String(firstPayment.status) : "";

    // Status styling helper
    const getStatusStyle = () => {
        switch (booking.bookingStatus) {
            case BookingStatus.Open:
                return {
                    border: "border-l-amber-500",
                    badgeBg: "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900",
                    label: "Open Lead",
                    dot: "bg-amber-500"
                };
            case BookingStatus.Accepted:
            case BookingStatus.Arriving:
            case BookingStatus.Arrived:
            case BookingStatus.Started:
            case BookingStatus.Stopped:
                return {
                    border: "border-l-emerald-500",
                    badgeBg: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900",
                    label: "In Progress",
                    dot: "bg-emerald-500"
                };
            case BookingStatus.Finished:
                return {
                    border: "border-l-purple-500",
                    badgeBg: "bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-900",
                    label: "Completed",
                    dot: "bg-purple-500"
                };
            case BookingStatus.Rejected:
                return {
                    border: "border-l-red-500",
                    badgeBg: "bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900",
                    label: "Rejected",
                    dot: "bg-red-500"
                };
            default:
                return {
                    border: "border-l-blue-500",
                    badgeBg: "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900",
                    label: "Active",
                    dot: "bg-blue-500"
                };
        }
    };

    const statusStyle = getStatusStyle();

    // Timeline steps verification
    const isStep1 = (booking.bookingStatus === BookingStatus.Open) || (booking.bookingStatus === BookingStatus.Accepted) || (booking.bookingStatus === BookingStatus.Arriving) || (booking.bookingStatus === BookingStatus.Arrived) || (booking.bookingStatus === BookingStatus.Started) || (booking.bookingStatus === BookingStatus.Stopped) || ((booking.bookingStatus === BookingStatus.Finished) && (paymentStatus === "FarmerPENDING")) || ((booking.bookingStatus === BookingStatus.Finished) && (paymentStatus === "FarmerCONFIRMED")) || ((booking.bookingStatus === BookingStatus.Finished) && (paymentStatus === "OwnerREJECTED")) || ((booking.bookingStatus === BookingStatus.Finished) && (paymentStatus === "COMPLETED"));

    const isStep2 = (booking.bookingStatus === BookingStatus.Accepted) || (booking.bookingStatus === BookingStatus.Arriving) || (booking.bookingStatus === BookingStatus.Arrived) || (booking.bookingStatus === BookingStatus.Started) || (booking.bookingStatus === BookingStatus.Stopped) || ((booking.bookingStatus === BookingStatus.Finished) && (paymentStatus === "FarmerPENDING")) || ((booking.bookingStatus === BookingStatus.Finished) && (paymentStatus === "FarmerCONFIRMED")) || ((booking.bookingStatus === BookingStatus.Finished) && (paymentStatus === "OwnerREJECTED")) || ((booking.bookingStatus === BookingStatus.Finished) && (paymentStatus === "COMPLETED"));

    const isStep3 = (booking.bookingStatus === BookingStatus.Arriving) || (booking.bookingStatus === BookingStatus.Arrived) || (booking.bookingStatus === BookingStatus.Started) || (booking.bookingStatus === BookingStatus.Stopped) || ((booking.bookingStatus === BookingStatus.Finished) && (paymentStatus === "FarmerPENDING")) || ((booking.bookingStatus === BookingStatus.Finished) && (paymentStatus === "FarmerCONFIRMED")) || ((booking.bookingStatus === BookingStatus.Finished) && (paymentStatus === "OwnerREJECTED")) || ((booking.bookingStatus === BookingStatus.Finished) && (paymentStatus === "COMPLETED"));

    const isStep4 = (booking.bookingStatus === BookingStatus.Arrived) || (booking.bookingStatus === BookingStatus.Started) || (booking.bookingStatus === BookingStatus.Stopped) || ((booking.bookingStatus === BookingStatus.Finished) && (paymentStatus === "FarmerPENDING")) || ((booking.bookingStatus === BookingStatus.Finished) && (paymentStatus === "FarmerCONFIRMED")) || ((booking.bookingStatus === BookingStatus.Finished) && (paymentStatus === "OwnerREJECTED")) || ((booking.bookingStatus === BookingStatus.Finished) && (paymentStatus === "COMPLETED"));

    const isStep5 = (booking.bookingStatus === BookingStatus.Started) || (booking.bookingStatus === BookingStatus.Stopped) || ((booking.bookingStatus === BookingStatus.Finished) && (paymentStatus === "FarmerPENDING")) || ((booking.bookingStatus === BookingStatus.Finished) && (paymentStatus === "FarmerCONFIRMED")) || ((booking.bookingStatus === BookingStatus.Finished) && (paymentStatus === "OwnerREJECTED")) || ((booking.bookingStatus === BookingStatus.Finished) && (paymentStatus === "COMPLETED"));

    const isStep6 = ((booking.bookingStatus === BookingStatus.Finished) && (paymentStatus === "FarmerPENDING")) || ((booking.bookingStatus === BookingStatus.Finished) && (paymentStatus === "FarmerCONFIRMED")) || ((booking.bookingStatus === BookingStatus.Finished) && (paymentStatus === "OwnerREJECTED")) || ((booking.bookingStatus === BookingStatus.Finished) && (paymentStatus === "COMPLETED"));

    const isStep7 = ((booking.bookingStatus === BookingStatus.Finished) && (paymentStatus === "FarmerCONFIRMED")) || ((booking.bookingStatus === BookingStatus.Finished) && (paymentStatus === "OwnerREJECTED")) || ((booking.bookingStatus === BookingStatus.Finished) && (paymentStatus === "COMPLETED"));

    const isStep8 = ((booking.bookingStatus === BookingStatus.Finished) && (paymentStatus === "COMPLETED"));

    return (
        <Sheet>
            <SheetTrigger asChild>
                <div className={`group relative bg-white dark:bg-zinc-900 rounded-xl p-4 border border-slate-200/90 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer border-l-4 ${statusStyle.border} hover:-translate-y-0.5 mb-3`}>
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center space-x-3 min-w-0">
                            <Avatar className="h-11 w-11 ring-2 ring-slate-200 dark:ring-zinc-700 flex-shrink-0">
                                {booking.user?.image && (
                                    <AvatarImage src={booking.user.image} alt={fullName} />
                                )}
                                <AvatarFallback className="bg-gradient-to-br from-slate-700 to-zinc-900 text-white font-semibold text-xs">
                                    {booking.user?.first_name?.[0] || "U"}
                                </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                                <h4 className="text-sm font-semibold text-slate-900 dark:text-zinc-100 group-hover:text-blue-600 transition-colors truncate">
                                    {fullName}
                                </h4>
                                <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                                    <Clock className="h-3 w-3 flex-shrink-0 text-slate-400" />
                                    <span>
                                        {booking.updatedAt
                                            ? new Date(booking.updatedAt).toLocaleDateString()
                                            : (booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : "")}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusStyle.badgeBg} flex-shrink-0`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${statusStyle.dot}`} />
                            {statusStyle.label}
                        </span>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-zinc-800/80 space-y-2 text-xs">
                        {maskedEmail && (
                            <div className="flex items-center text-slate-600 dark:text-zinc-300">
                                <Mail className="h-3.5 w-3.5 mr-2 text-slate-400 flex-shrink-0" />
                                <span className="truncate">{maskedEmail}</span>
                            </div>
                        )}

                        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400 pt-0.5">
                            <span className="flex items-center gap-1 font-medium">
                                <CalendarDays className="h-3 w-3 text-slate-400" />
                                {new Date(booking.start_date).toLocaleDateString()}
                            </span>
                            {durationLabel && (
                                <span className="font-semibold text-slate-700 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                                    {durationLabel}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </SheetTrigger>

            <SheetContent side="right" className="p-0 sm:max-w-xl md:max-w-2xl bg-slate-50 dark:bg-zinc-950 border-l border-slate-200 dark:border-zinc-800 flex flex-col h-full overflow-hidden shadow-2xl">
                {/* Modern Drawer Header */}
                <div className="px-6 py-4 bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center space-x-3">
                        <div className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex items-center justify-center text-slate-700 dark:text-zinc-300">
                            <Layers className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                    <TranslatedText greetings={ownerMarketPlaceTranslations.leadPreview} />
                                </h3>
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusStyle.badgeBg}`}>
                                    <span className={`h-1.5 w-1.5 rounded-full ${statusStyle.dot}`} />
                                    {statusStyle.label}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                                Ref: #{booking.id ? booking.id.slice(-6).toUpperCase() : "LEAD"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Drawer Scrollable Body */}
                <div className="px-6 py-5 overflow-y-auto flex-1 space-y-5">
                    {/* Farmer Profile Card */}
                    <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 p-5 border border-slate-200/90 dark:border-zinc-800 shadow-sm">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-emerald-500 to-blue-500" />
                        <div className="flex items-center space-x-4">
                            <Avatar className="h-16 w-16 ring-4 ring-slate-100 dark:ring-zinc-800 shadow-sm">
                                {booking.user?.image && (
                                    <AvatarImage src={booking.user.image} alt={fullName} />
                                )}
                                <AvatarFallback className="bg-gradient-to-br from-slate-700 to-zinc-900 text-white font-bold text-lg">
                                    {booking.user?.first_name?.[0] || "U"}{booking.user?.last_name?.[0] || ""}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                        {fullName}
                                    </h2>
                                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                                        <ShieldCheck className="h-3 w-3 text-emerald-600" /> Verified
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 flex items-center gap-1.5">
                                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                                    <span>{booking.user?.email || "Email undisclosed"}</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Quick Metrics Bar */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div className="bg-white dark:bg-zinc-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 shadow-sm">
                            <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400 text-xs font-medium">
                                <Clock className="h-3.5 w-3.5 text-amber-500" />
                                <span><TranslatedText greetings={ownerMarketPlaceTranslations.duration} /></span>
                            </div>
                            <p className="text-sm font-bold text-slate-800 dark:text-zinc-100 mt-1.5 truncate">
                                {durationLabel || "Full Job"}
                            </p>
                        </div>

                        <div className="bg-white dark:bg-zinc-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 shadow-sm">
                            <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400 text-xs font-medium">
                                <CalendarDays className="h-3.5 w-3.5 text-blue-500" />
                                <span><TranslatedText greetings={ownerMarketPlaceTranslations.created} /></span>
                            </div>
                            <p className="text-sm font-bold text-slate-800 dark:text-zinc-100 mt-1.5">
                                {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : "-"}
                            </p>
                        </div>

                        <div className="bg-white dark:bg-zinc-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 shadow-sm col-span-2 sm:col-span-1">
                            <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400 text-xs font-medium">
                                <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
                                <span>Status</span>
                            </div>
                            <p className="text-sm font-bold text-slate-800 dark:text-zinc-100 mt-1.5 truncate">
                                {statusStyle.label}
                            </p>
                        </div>
                    </div>

                    {/* Booking Schedule / Calendar */}
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-slate-200/90 dark:border-zinc-800 shadow-sm space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <CalendarDays className="h-4 w-4 text-blue-600" />
                                Booking Dates
                            </h4>
                            <div className="text-xs text-slate-500 font-medium">
                                {new Date(booking.start_date).toLocaleDateString()}
                                {booking.end_date && ` - ${new Date(booking.end_date).toLocaleDateString()}`}
                            </div>
                        </div>

                        <div className="flex justify-center p-2 rounded-xl bg-slate-50/70 dark:bg-zinc-800/30 border border-slate-100 dark:border-zinc-800">
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
                                className="rounded-md"
                            />
                        </div>
                    </div>

                    {/* Booking Timeline & Stepper */}
                    {booking.owner_confirm && (
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-slate-200/90 dark:border-zinc-800 shadow-sm space-y-5">
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-blue-600" />
                                    <TranslatedText greetings={ownerMarketPlaceTranslations.bookingTimeline} />
                                </h4>
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300">
                                    Live Progress
                                </span>
                            </div>

                            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-zinc-800">
                                {/* Step 1: Confirmed */}
                                <div className="relative flex items-start space-x-3">
                                    <div className={`absolute -left-6 top-0.5 h-5 w-5 rounded-full flex items-center justify-center text-white ${isStep1 ? 'bg-emerald-500 shadow-sm ring-4 ring-emerald-100 dark:ring-emerald-950' : 'bg-slate-300 dark:bg-zinc-700'}`}>
                                        <Check className="h-3 w-3" />
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                                            <TranslatedText greetings={ownerMarketPlaceTranslations.justConfirmedBooking} />
                                        </p>
                                        {booking.bookingStatus === BookingStatus.Open && (
                                            <div className="pt-1">
                                                <AssignOperator selectedRequest={booking.id} storeId={booking.store_id} />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Step 2: Operator Accepted */}
                                <div className="relative flex items-start space-x-3">
                                    <div className={`absolute -left-6 top-0.5 h-5 w-5 rounded-full flex items-center justify-center text-white ${isStep2 ? 'bg-emerald-500 shadow-sm ring-4 ring-emerald-100 dark:ring-emerald-950' : 'bg-slate-300 dark:bg-zinc-700'}`}>
                                        <Check className="h-3 w-3" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-medium text-slate-800 dark:text-zinc-200">
                                            <TranslatedText greetings={ownerMarketPlaceTranslations.operatorAcceptedBooking} />
                                        </p>
                                    </div>
                                </div>

                                {/* Step 3: Left for Destination */}
                                <div className="relative flex items-start space-x-3">
                                    <div className={`absolute -left-6 top-0.5 h-5 w-5 rounded-full flex items-center justify-center text-white ${isStep3 ? 'bg-emerald-500 shadow-sm ring-4 ring-emerald-100 dark:ring-emerald-950' : 'bg-slate-300 dark:bg-zinc-700'}`}>
                                        <Check className="h-3 w-3" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-medium text-slate-800 dark:text-zinc-200">
                                            <TranslatedText greetings={ownerMarketPlaceTranslations.bookingLeftDestination} />
                                        </p>
                                    </div>
                                </div>

                                {/* Step 4: Arrived */}
                                <div className="relative flex items-start space-x-3">
                                    <div className={`absolute -left-6 top-0.5 h-5 w-5 rounded-full flex items-center justify-center text-white ${isStep4 ? 'bg-emerald-500 shadow-sm ring-4 ring-emerald-100 dark:ring-emerald-950' : 'bg-slate-300 dark:bg-zinc-700'}`}>
                                        <Check className="h-3 w-3" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-medium text-slate-800 dark:text-zinc-200">
                                            <TranslatedText greetings={ownerMarketPlaceTranslations.bookingArrivedDestination} />
                                        </p>
                                    </div>
                                </div>

                                {/* Step 5: Started Work */}
                                <div className="relative flex items-start space-x-3">
                                    <div className={`absolute -left-6 top-0.5 h-5 w-5 rounded-full flex items-center justify-center text-white ${isStep5 ? 'bg-emerald-500 shadow-sm ring-4 ring-emerald-100 dark:ring-emerald-950' : 'bg-slate-300 dark:bg-zinc-700'}`}>
                                        <Check className="h-3 w-3" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-medium text-slate-800 dark:text-zinc-200">
                                            <TranslatedText greetings={ownerMarketPlaceTranslations.bookingStartedWork} />
                                        </p>
                                    </div>
                                </div>

                                {/* Step 6: Completed & Waiting Payment */}
                                <div className="relative flex items-start space-x-3">
                                    <div className={`absolute -left-6 top-0.5 h-5 w-5 rounded-full flex items-center justify-center text-white ${isStep6 ? 'bg-emerald-500 shadow-sm ring-4 ring-emerald-100 dark:ring-emerald-950' : 'bg-slate-300 dark:bg-zinc-700'}`}>
                                        <Check className="h-3 w-3" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-medium text-slate-800 dark:text-zinc-200">
                                            <TranslatedText greetings={ownerMarketPlaceTranslations.bookingCompletedWaitingPayment} />
                                        </p>
                                    </div>
                                </div>

                                {/* Step 7: Farmer Submitted Payment */}
                                <div className="relative flex items-start space-x-3">
                                    <div className={`absolute -left-6 top-0.5 h-5 w-5 rounded-full flex items-center justify-center text-white ${isStep7 ? 'bg-emerald-500 shadow-sm ring-4 ring-emerald-100 dark:ring-emerald-950' : 'bg-slate-300 dark:bg-zinc-700'}`}>
                                        <Check className="h-3 w-3" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-medium text-slate-800 dark:text-zinc-200">
                                            <TranslatedText greetings={ownerMarketPlaceTranslations.farmerSubmittedPayment} />
                                        </p>
                                    </div>
                                </div>

                                {/* Step 8: Completed / Payment Accepted */}
                                <div className="relative flex items-start space-x-3">
                                    <div className={`absolute -left-6 top-0.5 h-5 w-5 rounded-full flex items-center justify-center text-white ${isStep8 ? 'bg-purple-600 shadow-sm ring-4 ring-purple-100 dark:ring-purple-950' : 'bg-slate-300 dark:bg-zinc-700'}`}>
                                        <Check className="h-3 w-3" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-medium text-slate-800 dark:text-zinc-200">
                                            <TranslatedText greetings={ownerMarketPlaceTranslations.jobCompletedPaymentAccepted} />
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Review Action Card */}
                            {(hasPayments && firstPayment && (paymentStatus === "FarmerCONFIRMED" || (paymentStatus as any) === PaymentStatus.FarmerCONFIRMED)) && (
                                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-zinc-800">
                                    <PaymentReview
                                        referenceNumber={firstPayment.transaction_reference?.[(firstPayment.transaction_reference?.length || 1) - 1] || ""}
                                        screenshotUrl={firstPayment.screenshots?.[(firstPayment.screenshots?.length || 1) - 1] || ""}
                                        paymentId={firstPayment.id}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    )
}

export default SeeBooking