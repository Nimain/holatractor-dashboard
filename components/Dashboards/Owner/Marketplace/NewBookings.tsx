"use client"
import { Booking, BookingHours, BookingStatus } from "@/utils/Types/types";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronsUpDown, House, Mail, MessageCircle, MoreHorizontal, NotepadText, Phone, Plus, Tractor, Truck, Clock, Sparkles, ShieldCheck, CalendarDays, Eye, ArrowRight, Store as StoreIcon } from "lucide-react";
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { renderInstance } from "@/utils/Axios/RenderInstance";
import { useCookie } from "next-cookie";
import { useEffect, useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { errorMessage, successMessage } from "@/utils/Toastify/Messages";
import { Backdrop, CircularProgress } from "@mui/material";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MapContainer, Polygon, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import Image from "next/image";
import { Pagination, Autoplay } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/autoplay';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/scrollbar';
import PaymentMethods from "./BankAccountSelect";
import { RiDirectionLine } from "react-icons/ri";
import TranslatedText from "@/components/Menubar/TranslatedText";
import { ownerMarketPlaceTranslations } from "./OwnerMarketPlaceTranslations";
import { newBookingTranslations } from "../../Farmer/FarmerTranslation";
import { getAuthUserId } from "@/utils/auth/clientAuth";

interface AvailStore {
    storeId: string;
    storeName: string;
    availableTractors: {
        tractorId: string;
        tractorName: string;
    }[];
    availableAttachments: {
        attachmentId: string;
        attachmentName: string;
    }[];
}

const NewBookings = ({ booking, minDistance }: { booking: Booking; minDistance: number | null }) => {

    const [availableStores, setAvailableStores] = useState<AvailStore[]>([])
    const [checkingAvailability, setCheckingAvailability] = useState(false)
    const [converting, setConverting] = useState(false)

    const { cookie } = useCookie();
    const access_token = cookie.get("access_token");
    const rawUser = cookie.get("user");
    const parsedUser = typeof rawUser === "string" ? (() => { try { return JSON.parse(rawUser); } catch { return null; } })() : rawUser;
    const ownerUserId = parsedUser?.userId || parsedUser?.id || getAuthUserId();

    const limeOptions = { color: 'lime' }

    function fetchAvailableStores() {
        setCheckingAvailability(true)
        const ownerQuery = ownerUserId ? `?owner_id=${encodeURIComponent(ownerUserId)}` : "";
        renderInstance.post(`/booking/standalone-booking/${booking.id}/check-available-stores${ownerQuery}`, {
            owner_id: ownerUserId,
            user_id: ownerUserId,
        }, {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
            params: ownerUserId ? { owner_id: ownerUserId, user_id: ownerUserId } : {},
        })
            .then((res) => {
                const raw = Array.isArray(res.data)
                    ? res.data
                    : Array.isArray(res.data?.available_stores)
                    ? res.data.available_stores
                    : Array.isArray(res.data?.stores)
                    ? res.data.stores
                    : [];
                const normalized: AvailStore[] = raw.map((s: any) => ({
                    storeId: s?.storeId || s?.id || "",
                    storeName: s?.storeName || s?.name || "Store",
                    availableTractors: Array.isArray(s?.availableTractors) ? s.availableTractors : [],
                    availableAttachments: Array.isArray(s?.availableAttachments) ? s.availableAttachments : []
                }));
                setAvailableStores(normalized);
            }).catch((err) => {
                setAvailableStores([]);
                if (err.response) {
                    if (err.response.status === 404 && err.response.data.message === "Log in user not valid") {
                        errorMessage("Log in user not valid")
                    } else if (err.response.status === 404 && err.response.data.message === "Booking not found") {
                        errorMessage("Booking not found")
                    } else if (err.response.status === 409 && err.response.data.message === "Booking has been taken by another store") {
                        errorMessage("Booking has been taken by another store")
                    }
                }
            }).finally(() => {
                setCheckingAvailability(false)
            })
    }

    function bookingConverting(storeId: string, bookingId: string) {
        setConverting(true)
        renderInstance.post(`/booking/standalone-booking/${bookingId}/convert-booking/store/${storeId}`, {}, {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        })
            .then((res) => {
                successMessage("Booked")
                window.location.reload()
            }).catch((err) => {
                if (err.response) {
                    if (err.response.status === 404 && err.response.data.message === "Login User not found") {
                        errorMessage("Login User not found")
                    } else if (err.response.status === 404 && err.response.data.message === "Store not found or not owned by the user") {
                        errorMessage("Store not found or not owned by the user")
                    } else if (err.response.status === 404 && err.response.data.message === "Booking not found") {
                        errorMessage("Booking not found")
                    } else if (err.response.status === 409 && err.response.data.message === "Booking has taken by other owner") {
                        errorMessage("Booking has taken by other owner")
                    }
                }
            }).finally(() => {
                setConverting(false)
            })
    }

    useEffect(() => {
        fetchAvailableStores()
    }, [])

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

    const fullName = `${booking.user?.first_name || ""} ${booking.user?.middle_name ?? ""} ${booking.user?.last_name || ""}`.trim() || "Prospective Farmer";

    return (
        <Sheet onOpenChange={(open) => {
            if (open) fetchAvailableStores();
        }}>
            <SheetTrigger asChild>
                <div className="group relative bg-white dark:bg-zinc-900 rounded-xl p-4 border border-slate-200/90 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer border-l-4 border-l-blue-600 hover:-translate-y-0.5 mb-3">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center space-x-3 min-w-0">
                            <Avatar className="h-11 w-11 ring-2 ring-blue-500/20 flex-shrink-0">
                                {booking.user?.image && (
                                    <AvatarImage src={booking.user.image} alt={fullName} />
                                )}
                                <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-semibold text-xs">
                                    {booking.user?.first_name?.[0] || "U"}
                                </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                                <h4 className="text-sm font-semibold text-slate-900 dark:text-zinc-100 group-hover:text-blue-600 transition-colors truncate">
                                    {fullName}
                                </h4>
                                <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                                    <Clock className="h-3 w-3 flex-shrink-0 text-slate-400" />
                                    <span>{booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : "Recent"}</span>
                                </div>
                            </div>
                        </div>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900 flex-shrink-0">
                            New Lead
                        </span>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-zinc-800/80 space-y-2 text-xs">
                        {maskedEmail && (
                            <div className="flex items-center text-slate-600 dark:text-zinc-300">
                                <Mail className="h-3.5 w-3.5 mr-2 text-slate-400 flex-shrink-0" />
                                <span className="truncate">{maskedEmail}</span>
                            </div>
                        )}

                        <div className="flex items-center justify-between pt-0.5">
                            <div className="inline-flex items-center text-emerald-600 dark:text-emerald-400 font-medium text-[11px]">
                                <RiDirectionLine className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                                <span>{minDistance != null ? `${minDistance.toFixed(1)} km away` : "Distance pending"}</span>
                            </div>

                            <div className="flex items-center gap-1.5">
                                {Boolean(booking.standaloneTractors?.length) && (
                                    <span className="px-1.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/40 text-[10px] font-medium flex items-center gap-1">
                                        <Tractor className="h-3 w-3" />
                                        {booking.standaloneTractors?.length}
                                    </span>
                                )}
                                {Boolean(booking.standaloneAttachments?.length) && (
                                    <span className="px-1.5 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/40 text-[10px] font-medium flex items-center gap-1">
                                        <Truck className="h-3 w-3" />
                                        {booking.standaloneAttachments?.length}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </SheetTrigger>

            <SheetContent side="right" className="p-0 sm:max-w-xl md:max-w-2xl bg-slate-50 dark:bg-zinc-950 border-l border-slate-200 dark:border-zinc-800 flex flex-col h-full overflow-hidden shadow-2xl">
                {/* Modern Drawer Header */}
                <div className="px-6 py-4 bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center space-x-3">
                        <div className="h-9 w-9 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400">
                            <Sparkles className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                    <TranslatedText greetings={ownerMarketPlaceTranslations.leadPreview} />
                                </h3>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                    New Lead
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                                Ref: #{booking.id ? booking.id.slice(-6).toUpperCase() : "REQUEST"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Drawer Scrollable Body */}
                <div className="px-6 py-5 overflow-y-auto flex-1 space-y-5">
                    {/* Farmer Profile Card */}
                    <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 p-5 border border-slate-200/90 dark:border-zinc-800 shadow-sm">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-400" />
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center space-x-4">
                                <Avatar className="h-16 w-16 ring-4 ring-blue-500/10 shadow-sm">
                                    {booking.user?.image && (
                                        <AvatarImage src={booking.user.image} alt={fullName} />
                                    )}
                                    <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold text-lg">
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

                            {minDistance != null && (
                                <div className="text-right hidden sm:block">
                                    <span className="text-[11px] font-medium text-slate-400 dark:text-zinc-500 block">Proximity</span>
                                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-1 rounded-lg border border-emerald-200 dark:border-emerald-900 mt-0.5">
                                        <RiDirectionLine className="h-3.5 w-3.5" />
                                        {minDistance.toFixed(1)} km
                                    </span>
                                </div>
                            )}
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
                                <RiDirectionLine className="h-3.5 w-3.5 text-emerald-500" />
                                <span><TranslatedText greetings={ownerMarketPlaceTranslations.distance} /></span>
                            </div>
                            <p className="text-sm font-bold text-slate-800 dark:text-zinc-100 mt-1.5">
                                {minDistance != null ? `${minDistance.toFixed(1)} km` : "Nearby"}
                            </p>
                        </div>
                    </div>

                    {/* Requested Equipment & Machinery */}
                    {(Boolean(booking.standaloneTractors?.length) || Boolean(booking.standaloneAttachments?.length)) && (
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-slate-200/90 dark:border-zinc-800 shadow-sm space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Tractor className="h-4 w-4 text-blue-600" />
                                    Requested Equipment
                                </h4>
                                <span className="text-xs text-slate-500">
                                    {(booking.standaloneTractors?.length || 0) + (booking.standaloneAttachments?.length || 0)} item(s)
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {/* Tractors */}
                                {(booking.standaloneTractors || []).map((t, idx) => (
                                    <div key={idx} className="p-3 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/40 flex items-center gap-3">
                                        <div className="h-12 w-12 rounded-lg bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center flex-shrink-0 text-amber-700 dark:text-amber-400">
                                            <Tractor className="h-6 w-6" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                                {t.tractor?.name || "Tractor"}
                                            </p>
                                            <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                                                {t.tractor?.type || "Standard"}
                                            </p>
                                            <span className="inline-block mt-1 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200">
                                                Qty: {t.count ?? 1}
                                            </span>
                                        </div>
                                    </div>
                                ))}

                                {/* Attachments */}
                                {(booking.standaloneAttachments || []).map((a, idx) => (
                                    <div key={idx} className="p-3 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/40 flex items-center gap-3">
                                        <div className="h-12 w-12 rounded-lg bg-purple-100 dark:bg-purple-950/50 flex items-center justify-center flex-shrink-0 text-purple-700 dark:text-purple-400">
                                            <Truck className="h-6 w-6" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                                {a.attachment?.name || "Attachment"}
                                            </p>
                                            <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                                                Attachment
                                            </p>
                                            <span className="inline-block mt-1 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                                                Qty: {a.count ?? 1}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Farm Location Map Card */}
                    {Boolean(booking.farm?.boundary?.coordinates && Array.isArray(booking.farm.boundary.coordinates) && booking.farm.boundary.coordinates.length > 0) && (
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-slate-200/90 dark:border-zinc-800 shadow-sm flex items-center justify-between gap-4">
                            <div className="flex items-center space-x-3">
                                <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-center text-emerald-600">
                                    <House className="h-5 w-5" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                        {booking.farm?.name || "Farm Field Location"}
                                    </h4>
                                    <p className="text-xs text-slate-500 dark:text-zinc-400">
                                        {booking.farm?.boundary?.coordinates?.length || 0} boundary points mapped
                                    </p>
                                </div>
                            </div>

                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="gap-1.5 text-xs font-semibold rounded-lg">
                                        <Eye className="h-3.5 w-3.5" />
                                        View Map
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-3xl">
                                    <DialogHeader>
                                        <DialogTitle>Farm Boundary Map</DialogTitle>
                                        <DialogDescription>
                                            Geographic boundaries specified by the farmer for this booking.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="rounded-xl overflow-hidden border border-slate-200 mt-2">
                                        <MapContainer
                                            center={booking.farm?.boundary?.coordinates?.[0]}
                                            zoom={16}
                                            scrollWheelZoom={false}
                                            style={{ width: "100%", height: "65vh", zIndex: 1 }}
                                        >
                                            <TileLayer
                                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                            />
                                            <Polygon pathOptions={limeOptions} positions={booking.farm?.boundary?.coordinates || []} />
                                        </MapContainer>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    )}

                    {/* Booking Schedule / Dates */}
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-slate-200/90 dark:border-zinc-800 shadow-sm space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <CalendarDays className="h-4 w-4 text-blue-600" />
                                Requested Schedule
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

                    {/* Store Fulfillment & Action Section */}
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-slate-200/90 dark:border-zinc-800 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <StoreIcon className="h-4 w-4 text-blue-600" />
                                    <TranslatedText greetings={ownerMarketPlaceTranslations.availableStores} />
                                </h4>
                                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                                    Select your store to accept and fulfill this lead
                                </p>
                            </div>
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                                {availableStores.length} Available
                            </span>
                        </div>

                        {checkingAvailability ? (
                            <div className="p-6 rounded-xl border border-dashed border-slate-200 dark:border-zinc-800 text-center space-y-2">
                                <CircularProgress size={24} className="text-blue-600 mx-auto" />
                                <p className="text-xs text-slate-500">
                                    <TranslatedText greetings={ownerMarketPlaceTranslations.checkingAvailability} />...
                                </p>
                            </div>
                        ) : availableStores.length === 0 ? (
                            <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 text-xs">
                                <p className="font-semibold">No stores found for your account</p>
                                <p className="mt-0.5 text-amber-700 dark:text-amber-400">
                                    Only stores belonging to your account can fulfill this lead. Please ensure your account has active registered stores.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2.5">
                                {availableStores.map((storeDetails, i) => {
                                    const sName = storeDetails?.storeName || (storeDetails as any)?.name || "Store";
                                    const sId = storeDetails?.storeId || (storeDetails as any)?.id || "";
                                    return (
                                        <div
                                            key={i}
                                            className="p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-800/40 hover:bg-slate-100/60 transition-colors flex items-center justify-between gap-3"
                                        >
                                            <div className="flex items-center space-x-3 min-w-0">
                                                <div className="h-9 w-9 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-xs flex-shrink-0">
                                                    <StoreIcon className="h-4 w-4" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                                        {sName}
                                                    </p>
                                                    <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                                                        Ready for dispatch
                                                    </p>
                                                </div>
                                            </div>

                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 text-xs font-semibold rounded-lg shadow-sm">
                                                        <span>Accept Lead</span>
                                                        <ArrowRight className="h-3.5 w-3.5" />
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="max-w-xl">
                                                    <DialogHeader>
                                                        <DialogTitle className="text-xl font-semibold">
                                                            <TranslatedText greetings={ownerMarketPlaceTranslations.confirmBookingLeadForStore} /> {sName}
                                                        </DialogTitle>
                                                        <DialogDescription>
                                                            <TranslatedText greetings={ownerMarketPlaceTranslations.confirmBookingAction} />
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <DialogFooter className="sm:justify-start gap-2 pt-2">
                                                        <DialogClose asChild>
                                                            <Button variant="outline">
                                                                <TranslatedText greetings={ownerMarketPlaceTranslations.dontBook} />
                                                            </Button>
                                                        </DialogClose>
                                                        <PaymentMethods bookingId={booking.id} storeId={sId} />
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                <Backdrop
                    sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
                    open={converting}
                >
                    <CircularProgress />
                </Backdrop>
            </SheetContent>
        </Sheet>
    )
}

export default NewBookings