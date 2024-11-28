import { Calendar as Calu, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Booking, BookingStatus } from "@/utils/Types/types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const getDaysInMonth = (month: number, year: number) => {
    return new Array(new Date(year, month + 1, 0).getDate())
        .fill(null)
        .map((_, index) => index + 1);
};

// Interface for booking dates
interface BookingDate {
    date: string; // ISO date string
    available: boolean;
}

export const CalendarOne = ({ booking }: { booking: Booking[]; }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [bookingDates, setBookingDates] = useState<Booking[]>([]);
    const [error, setError] = useState<string | null>(null);

    const daysInMonth = getDaysInMonth(currentMonth, currentYear);

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    // Handlers for navigation
    const handlePreviousMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(currentYear - 1);
        } else {
            setCurrentMonth(currentMonth - 1);
        }
    };

    const handleNextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear(currentYear + 1);
        } else {
            setCurrentMonth(currentMonth + 1);
        }
    };

    // Get booking status for a specific date
    const getBookingStatusForDate = (day: number) => {
        const dateString = new Date(currentYear, currentMonth, day).toISOString().split('T')[0];
        return booking.find(booking => new Date(booking.start_date).toISOString().split('T')[0] === dateString)?.bookingStatus;
    };

    const getBookingStatusClass = (status: BookingStatus | null) => {
        switch (status) {
            case BookingStatus.Accepted: // Upcoming bookings
                return "bg-blue-500 text-white hover:bg-blue-400";
            case BookingStatus.Arriving:
            case BookingStatus.Arrived:
            case BookingStatus.Started:
            case BookingStatus.Stopped: // Ongoing bookings
                return "bg-orange-500 text-white hover:bg-orange-400";
            case BookingStatus.Finished: // Completed bookings
                return "bg-green-500 text-white hover:bg-green-400";
            default:
                return "hover:bg-gray-200";
        }
    };

    const getBookingStatusStringClass = (status: BookingStatus | null) => {
        switch (status) {
            case BookingStatus.Accepted: // Upcoming bookings
                return "Upcoming";
            case BookingStatus.Arriving:
            case BookingStatus.Arrived:
            case BookingStatus.Started:
            case BookingStatus.Stopped: // Ongoing bookings
                return "Ongoing";
            case BookingStatus.Finished: // Completed bookings
                return "Completed";
            default:
                return "";
        }
    };

    if (error) {
        return (
            <div className="w-[600px]">
                <Card className="h-full">
                    <CardContent className="flex justify-center items-center text-red-500">
                        {error}
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="w-[600px]">
            <Card className="h-full">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-lg font-semibold flex items-center space-x-2">
                            <span className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200">
                                <Calu className="w-4 h-4 text-gray-600" /> {/* Icon inside a rounded box */}
                            </span>
                            <span>Calendar</span>
                        </CardTitle>            <div className="flex items-center gap-4">
                            <Button variant="ghost" onClick={handlePreviousMonth}>
                                &lt;
                            </Button>
                            <span className="text-sm">
                                {monthNames[currentMonth]} {currentYear}
                            </span>
                            <Button variant="ghost" onClick={handleNextMonth}>
                                &gt;
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-7 gap-2 text-center mb-4">
                        {["S", "M", "T", "W", "T", "F", "S"].map((day) => (
                            <div key={day} className="text-sm text-gray-500 font-medium">
                                {day}
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 gap-2 text-center">
                        {daysInMonth.map((day) => {
                            const bookingStatus = getBookingStatusForDate(day);
                            const isToday =
                                day === new Date().getDate() &&
                                currentMonth === new Date().getMonth() &&
                                currentYear === new Date().getFullYear();
                            return (
                                <TooltipProvider
                                    key={day}>
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <Button
                                                variant="ghost"
                                                className={`
                                            w-12 h-12 rounded-full text-sm
                                            transition-colors duration-200
                                            ${bookingStatus && getBookingStatusClass(bookingStatus)}
                                            ${isToday && !bookingStatus ? "bg-gray-800 text-white hover:bg-gray-700" : ""}
                                            `}
                                                disabled={!!bookingStatus}
                                            >
                                                {day}
                                            </Button>
                                        </TooltipTrigger>
                                        {
                                            bookingStatus && getBookingStatusStringClass(bookingStatus) &&
                                        <TooltipContent>
                                                    <p>
                                                        {bookingStatus && getBookingStatusStringClass(bookingStatus)}
                                                    </p>
                                        </TooltipContent>
                                        }
                                    </Tooltip>
                                </TooltipProvider>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};