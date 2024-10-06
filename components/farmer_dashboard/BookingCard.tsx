import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { CalendarIcon, ClockIcon, MapPinIcon, TractorIcon, DollarSignIcon, Truck } from "lucide-react"

type BookingCardProps = {
  booking: {
    id: string
    start_date: string
    end_date: string | null
    total_cost: number
    booking_location_lan: string
    booking_location_lat: string
    confirm: boolean
    owner_confirm: boolean
    bookingStatus: string
    tractors: { name: string }[]
    attachments: { name: string }[]
  }
}

export default function BookingCard({ booking }: BookingCardProps) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open':
        return 'bg-blue-100 text-blue-800'
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'completed':
        return 'bg-gray-100 text-gray-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold">Booking #{booking.id.slice(-6)}</CardTitle>
          <Badge className={getStatusColor(booking.bookingStatus)}>{booking.bookingStatus}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <CalendarIcon className="w-4 h-4 text-gray-500" />
          <span className="text-sm">
            {new Date(booking.start_date).toLocaleDateString()} - 
            {booking.end_date ? new Date(booking.end_date).toLocaleDateString() : 'Ongoing'}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <ClockIcon className="w-4 h-4 text-gray-500" />
          <span className="text-sm">
            {new Date(booking.start_date).toLocaleTimeString()} - 
            {booking.end_date ? new Date(booking.end_date).toLocaleTimeString() : 'Ongoing'}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <MapPinIcon className="w-4 h-4 text-gray-500" />
          <span className="text-sm">
            Lat: {booking.booking_location_lat}, Lon: {booking.booking_location_lan}
          </span>
        </div>
        <Separator />
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <TractorIcon className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium">Tractors:</span>
          </div>
          <ul className="list-disc list-inside text-sm pl-6">
            {booking.tractors.map((tractor, index) => (
              <li key={index}>{tractor.name}</li>
            ))}
          </ul>
        </div>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Truck className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium">Attachments:</span>
          </div>
          <ul className="list-disc list-inside text-sm pl-6">
            {booking.attachments.map((attachment, index) => (
              <li key={index}>{attachment.name}</li>
            ))}
          </ul>
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <DollarSignIcon className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium">Total Cost:</span>
          </div>
          <span className="text-lg font-bold">${booking.total_cost.toFixed(2)}</span>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" size="sm">View Details</Button>
        {!booking.confirm && (
          <Button variant="destructive" size="sm">Cancel Booking</Button>
        )}
      </CardFooter>
    </Card>
  )
}