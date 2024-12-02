import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, ClockIcon, MapPinIcon, StoreIcon, TagIcon, TractorIcon } from "lucide-react"
import { Booking, BookingHours, BookingStatus } from "@/utils/Types/types"

export default function BookingCard({ booking }: { booking: Booking; }) {
    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    return (
        <Card className="w-full max-w-sm border-0">
            <CardContent className="space-y-2">
                <div className="flex justify-between items-center py-2 border-0">
                    <span>Booking #{booking.id.slice(-4)}</span>
                    <Badge variant={booking.bookingStatus === "Confirmed" ? "default" : "secondary"}>
                        {booking.booking_hours === BookingHours.EIGHT_HOURS ? "8 hours" : booking.booking_hours === BookingHours.SEVEN_HOURS ? "7 hours" : booking.booking_hours === BookingHours.SIX_HOURS ? "6 hours" : booking.booking_hours === BookingHours.FIVE_HOURS ? "5 hours" : booking.booking_hours === BookingHours.FOUR_HOURS ? "4 hours" : booking.booking_hours === BookingHours.THREE_HOURS ? "3 hours" : booking.booking_hours === BookingHours.TWO_HOURS ? "2 hours" : "1 hour"}
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
                    <span>{booking.tractors.length} Tractor(s)</span>
                </div>
                {booking.store ? (
                    <div className="flex items-center">
                        <StoreIcon className="mr-2 h-4 w-4" />
                        <span>1 Store: {booking.store.name}</span>
                    </div>
                ) : (
                    <div className="flex items-center">
                        <StoreIcon className="mr-2 h-4 w-4" />
                        <span>No Store (Standalone)</span>
                    </div>
                )}
                <div className="flex items-center">
                    <TagIcon className="mr-2 h-4 w-4" />
                    <span>Type: {booking.bookingType || "N/A"}</span>
                </div>
            </CardContent>
            <CardFooter className="justify-between">
                <div className="flex items-center">
                    <ClockIcon className="mr-2 h-4 w-4" />
                    <span>Duration: {booking.end_date ?
                        Math.ceil((new Date(booking.end_date).getTime() - new Date(booking.start_date).getTime()) / (1000 * 3600 * 24)) :
                        'Ongoing'} days
                    </span>
                </div>
                <span className="font-bold">Total: ${booking.total_cost.toFixed(2)}</span>
            </CardFooter>
        </Card>
    )
}

