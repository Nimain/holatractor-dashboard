"use client"

import { Booking, BookingHours, BookingStatus, Store } from "@/utils/Types/types"
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronsUpDown, House, Mail, MessageCircle, MoreHorizontal, NotepadText, Phone, Plus, Tractor, Truck } from "lucide-react";
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

    const limeOptions = { color: 'lime' }

    function fetchAvailableStores() {
        setCheckingAvailability(true)
        renderInstance.post(`/booking/standalone-booking/${booking.id}/check-available-stores`, {}, {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        })
            .then((res) => {
                setAvailableStores(res.data)
            }).catch((err) => {
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
                            <p className="text-sm text-muted-foreground">{new Date(booking.createdAt).toLocaleDateString()}</p>
                            <div className="flex items-center pt-2">
                                <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                                <span className="text-sm">
                                    {`${booking.user?.email.split('@')[0].slice(0, 3)}...@${booking.user?.email.split('@')[1]}`}
                                </span>
                            </div>
                            <div className="flex items-center pt-2">
                                <RiDirectionLine className="h-4 w-4 mr-2 text-muted-foreground" />
                                <span className="text-sm">
                                <TranslatedText greetings={ownerMarketPlaceTranslations.distance} />: {minDistance ?? 0}km
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
                            <span className="text-lg font-semibold"><TranslatedText greetings={ownerMarketPlaceTranslations.leadPreview} /></span>
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
                    <div className="w-full flex items-center justify-around gap-2 flex-wrap">
                    {
                        booking.farm &&
                        <div className="mt-6">
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button>
                                        <House />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <MapContainer
                                        center={booking.farm.boundary.coordinates[0]}
                                        zoom={16}
                                        scrollWheelZoom={false}
                                        style={{ width: "100%", height: "80vh", zIndex: 1 }}>
                                        <TileLayer
                                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                        />
                                        <Polygon pathOptions={limeOptions} positions={booking.farm.boundary.coordinates} />
                                    </MapContainer>
                                </DialogContent>
                            </Dialog>
                        </div>
                    }
                    {
                        booking.standaloneTractors.length > 0 &&
                        <div className="mt-6">
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button>
                                        <Tractor className="mr-2" /> {booking.standaloneTractors.length}
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-h-[90vh] overflow-auto" style={{ scrollbarWidth: "none" }}>
                                    <div className="w-full grid grid-cols-2 gap-5">
                                        {
                                            booking.standaloneTractors.map((tractorDetails, i) => {
                                                return (
                                                    <Card key={i}>
                                                        <CardTitle>
                                                            {tractorDetails.tractor.name}
                                                        </CardTitle>
                                                        <CardContent>
                                                            <Swiper
                                                                modules={[Autoplay, Pagination]}
                                                                spaceBetween={0}
                                                                slidesPerView={1}
                                                                loop={true}
                                                                pagination={true}
                                                                autoplay={true}
                                                                className="w-full h-full"
                                                            >
                                                                {
                                                                    tractorDetails.tractor.images.map((imageLink) => {
                                                                        return (
                                                                            <SwiperSlide className="w-full h-full" key={imageLink}>
                                                                                <Image
                                                                                    alt={tractorDetails.tractor.name}
                                                                                    src={imageLink}
                                                                                    width={400}
                                                                                    height={400}
                                                                                    className="h-52 w-full object-cover"
                                                                                    unoptimized={true} />
                                                                            </SwiperSlide>
                                                                        )
                                                                    })
                                                                }
                                                            </Swiper>
                                                            <p>
                                                            <TranslatedText greetings={ownerMarketPlaceTranslations.tractorType} />: {tractorDetails.tractor.type}
                                                            </p>
                                                            <p>
                                                            <TranslatedText greetings={ownerMarketPlaceTranslations.quantity} />: {tractorDetails.count}
                                                            </p>
                                                        </CardContent>
                                                    </Card>
                                                )
                                            })
                                        }
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    }
                    {
                        booking.standaloneAttachments.length > 0 &&
                        <div className="mt-6">
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button>
                                        <Truck className="mr-2"/> {booking.standaloneAttachments.length}
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-h-[90vh] overflow-auto" style={{ scrollbarWidth: "none" }}>
                                    <div className="w-full grid grid-cols-2 gap-5">
                                        {
                                            booking.standaloneAttachments.map((tractorDetails, i) => {
                                                return (
                                                    <Card key={i}>
                                                        <CardTitle>
                                                            {tractorDetails.attachment.name}
                                                        </CardTitle>
                                                        <CardContent>
                                                            <Swiper
                                                                modules={[Autoplay, Pagination]}
                                                                spaceBetween={0}
                                                                slidesPerView={1}
                                                                loop={true}
                                                                pagination={true}
                                                                autoplay={true}
                                                                className="w-full h-full"
                                                            >
                                                                {
                                                                    tractorDetails.attachment.images.map((imageLink) => {
                                                                        return (
                                                                            <SwiperSlide className="w-full h-full" key={imageLink}>
                                                                                <Image
                                                                                    alt={tractorDetails.attachment.name}
                                                                                    src={imageLink}
                                                                                    width={400}
                                                                                    height={400}
                                                                                    className="h-52 w-full object-cover"
                                                                                    unoptimized={true} />
                                                                            </SwiperSlide>
                                                                        )
                                                                    })
                                                                }
                                                            </Swiper>
                                                            <p>
                                                            <TranslatedText greetings={ownerMarketPlaceTranslations.quantity} />: {tractorDetails.count}
                                                            </p>
                                                        </CardContent>
                                                    </Card>
                                                )
                                            })
                                        }
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    }
                    </div>
                        <Collapsible className="mt-4 mx-auto">
                            <CollapsibleTrigger>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex items-center space-x-2 border border-gray-300 px-4 py-2 rounded-md"
                                >
                                    {
                                        checkingAvailability ? <span className="text-sm">
                                            <TranslatedText greetings={ownerMarketPlaceTranslations.checkingAvailability} />
                                        </span>
                                            :
                                            <span className="text-sm">
                                                <TranslatedText greetings={ownerMarketPlaceTranslations.availableStores} /> {availableStores.length}
                                            </span>
                                    }
                                    {
                                        !checkingAvailability &&
                                        <ChevronsUpDown className="h-4 w-4 text-gray-600" />
                                    }
                                </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                {
                                    availableStores.map((storeDetails, i) => {
                                        return (
                                            <Dialog key={i}>
                                                <DialogTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="flex items-center space-x-2 border border-gray-300 px-4 py-2 rounded-md"
                                                    >
                                                        <span className="text-sm">
                                                            {storeDetails.storeName}
                                                        </span>
                                                        <ChevronRight className="h-4 w-4 text-gray-600" />
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="max-w-xl">
                                                    <DialogHeader>
                                                        <DialogTitle className="text-xl font-semibold">
                                                        <TranslatedText greetings={ownerMarketPlaceTranslations.confirmBookingLeadForStore} /> {storeDetails.storeName}
                                                        </DialogTitle>
                                                        <DialogDescription>
                                                        <TranslatedText greetings={ownerMarketPlaceTranslations.confirmBookingAction} />
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <DialogFooter className="sm:justify-start">
                                                        <DialogClose asChild>
                                                            <Button variant="outline">
                                                            <TranslatedText greetings={ownerMarketPlaceTranslations.dontBook} />
                                                            </Button>
                                                        </DialogClose>
                                                        <PaymentMethods bookingId={booking.id} storeId={storeDetails.storeId} />
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>
                                        )
                                    })
                                }
                            </CollapsibleContent>
                        </Collapsible>
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