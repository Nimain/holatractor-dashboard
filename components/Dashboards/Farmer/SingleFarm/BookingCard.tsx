import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, ClockIcon, MapPinIcon, StoreIcon, TagIcon, TractorIcon } from "lucide-react"
import { Booking, BookingHours, BookingStatus } from "@/utils/Types/types"
import TranslatedText from "@/components/Menubar/TranslatedText";
import { farmPageTranslations } from "./FarmTranslations";
import { newBookingTranslations } from "../FarmerTranslation";

export default function BookingCard({ booking }: { booking: Booking; }) {
    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    return (
        <Card className="w-full max-w-sm border-0 bg-gradient-to-r from-[#8c0000] to-[#4d0000] text-white">
            <CardContent className="space-y-2">
                <div className="flex justify-between items-center py-2 border-0">
                    <span><TranslatedText greetings={farmPageTranslations.bookings} /> #{booking.id.slice(-4)}</span>
                    <Badge variant={booking.bookingStatus === "Confirmed" ? "default" : "secondary"}>
                    {booking.booking_hours === BookingHours.EIGHT_HOURS ? <TranslatedText greetings={newBookingTranslations.hours['8h']} /> : booking.booking_hours === BookingHours.SEVEN_HOURS ? <TranslatedText greetings={newBookingTranslations.hours['7h']} /> : booking.booking_hours === BookingHours.SIX_HOURS ? <TranslatedText greetings={newBookingTranslations.hours['6h']} /> : booking.booking_hours === BookingHours.FIVE_HOURS ? <TranslatedText greetings={newBookingTranslations.hours['5h']} /> : booking.booking_hours === BookingHours.FOUR_HOURS ? <TranslatedText greetings={newBookingTranslations.hours['4h']} /> : booking.booking_hours === BookingHours.THREE_HOURS ? <TranslatedText greetings={newBookingTranslations.hours['3h']} /> : booking.booking_hours === BookingHours.TWO_HOURS ? <TranslatedText greetings={newBookingTranslations.hours['2h']} /> : <TranslatedText greetings={newBookingTranslations.hours['1h']} />}
                    </Badge>
                </div>
                <div className="flex items-center">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    <span>{formatDate(booking.start_date)} - {booking.end_date ? formatDate(booking.end_date) : 'Ongoing'}</span>
                </div>
                {booking.location && (
                    <div className="flex items-center">
                        <MapPinIcon className="mr-2 h-4 w-4" />
                        <span>{booking.location.name || booking.location.address}</span>
                    </div>
                )}
                <div className="flex items-center">
                    <TractorIcon className="mr-2 h-4 w-4" />
                    <span>{booking.tractors.length} <TranslatedText greetings={farmPageTranslations.tractors} /></span>
                </div>
                {booking.store ? (
                    <div className="flex items-center">
                        <StoreIcon className="mr-2 h-4 w-4" />
                        <span><TranslatedText greetings={farmPageTranslations.store} />: {booking.store.name}</span>
                    </div>
                ) : (
                    <div className="flex items-center">
                        <StoreIcon className="mr-2 h-4 w-4" />
                        <span><TranslatedText greetings={farmPageTranslations.noStore} /></span>
                    </div>
                )}
                <div className="flex items-center">
                    <TagIcon className="mr-2 h-4 w-4" />
                    <span><TranslatedText greetings={farmPageTranslations.type} />: {booking.bookingType || "N/A"}</span>
                </div>
            </CardContent>
            <CardFooter className="justify-between">
                <div className="flex items-center">
                    <ClockIcon className="mr-2 h-4 w-4" />
                    <span><TranslatedText greetings={farmPageTranslations.duration} />: {booking.end_date ?
                        Math.ceil((new Date(booking.end_date).getTime() - new Date(booking.start_date).getTime()) / (1000 * 3600 * 24)) :
                        'Ongoing'} <TranslatedText greetings={farmPageTranslations.days} />
                    </span>
                </div>
                <span className="font-bold"><TranslatedText greetings={farmPageTranslations.total} />: ${booking.total_cost.toFixed(2)}</span>
            </CardFooter>
        </Card>
    )
}

