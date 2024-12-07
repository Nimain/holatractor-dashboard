"use client"

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { renderInstance } from "@/utils/Axios/RenderInstance";
import { errorMessage, successMessage } from "@/utils/Toastify/Messages";
import { Booking, BookingHours as BookingHoursTypes } from "@/utils/Types/types"
import { Backdrop, CircularProgress } from "@mui/material";
import { CalendarIcon, Clock, MapPin, Receipt } from "lucide-react";
import { useCookie } from "next-cookie";
import { useState } from "react";
import { newBookingTranslations } from "../FarmerTranslation";
import TranslatedText from "@/components/Menubar/TranslatedText";


const BookingConfirmation = ({ newBooking }: { newBooking: Booking; }) => {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false);

    const { cookie } = useCookie()
    const access_token = cookie.get("access_token")

    const formatCurrency = (amount: any) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    const CostItem = ({ label, value }: { label: any; value: any }) => (
        <div className="flex justify-between items-center py-1">
            <span className="text-gray-600">{label}</span>
            <span className="font-medium">{formatCurrency(value)}</span>
        </div>
    );

    function userBookingConfirm() {
        if (newBooking && newBooking.id) {
            setLoading(true)
            renderInstance.patch(`/booking/${newBooking.id}/user_confirm`, {}, {
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }).then((res) => {
                successMessage("Successfully booked")
                setOpen(false)
            }).catch((err) => {
                if (err.response && err.response.status === 404 && err.response.data.message === "Booking is not valid") {
                    errorMessage("Booking is not valid")
                } else if (err.response && err.response.status === 400 && err.response.data.message === "Booking already confirm") {
                    successMessage("Successfully booked")
                } else if (err.response && err.response.status === 400 && err.response.data.message === "You are not allowed to perform this task") {
                    successMessage("You are not allowed to perform this task")
                } else {
                    errorMessage("Some error occurred. Please try again...")
                }
            }).finally(() => {
                setOpen(false)
                setLoading(false)
            })
        } else {
            errorMessage("Booking is not available")
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-primaryColor">
                    Confirm
                </Button>
            </DialogTrigger>
            <DialogContent>
                {
                    newBooking && <Card className="w-full mx-auto shadow-lg">
                        <CardHeader className="text-center border-b">
                            <CardTitle className="text-2xl font-bold text-primary">
                            <TranslatedText greetings={newBookingTranslations.bookingConfirmation} />
                            </CardTitle>
                            <p className="text-gray-500"><TranslatedText greetings={newBookingTranslations.bookingId} />: {newBooking.id}</p>
                        </CardHeader>

                        <CardContent className="space-y-6 pt-6">
                            {/* Date and Duration Section */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <CalendarIcon className="h-5 w-5 text-primary" />
                                    <h3 className="font-semibold">
                                    <TranslatedText greetings={newBookingTranslations.bookingPeriod} />
                                    </h3>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pl-7">
                                    <div>
                                        <p className="text-gray-600"><TranslatedText greetings={newBookingTranslations.from} /></p>
                                        <p className="font-medium">{new Date(newBooking.start_date).toLocaleDateString()}</p>
                                    </div>
                                    {newBooking.end_date && (
                                        <div>
                                            <p className="text-gray-600"><TranslatedText greetings={newBookingTranslations.to} /></p>
                                            <p className="font-medium">{new Date(newBooking.end_date).toLocaleDateString()}</p>
                                        </div>
                                    )}
                                </div>

                                {!newBooking.end_date && (
                                    <div className="flex items-center gap-2 pl-7">
                                        <Clock className="h-4 w-4 text-gray-500" />
                                        <p><TranslatedText greetings={newBookingTranslations.duration} />: {newBooking.booking_hours === BookingHoursTypes.EIGHT_HOURS ? <TranslatedText greetings={newBookingTranslations.hours['8h']} /> : newBooking.booking_hours === BookingHoursTypes.SEVEN_HOURS ? <TranslatedText greetings={newBookingTranslations.hours['7h']} /> : newBooking.booking_hours === BookingHoursTypes.SIX_HOURS ? <TranslatedText greetings={newBookingTranslations.hours['6h']} /> : newBooking.booking_hours === BookingHoursTypes.FIVE_HOURS ? <TranslatedText greetings={newBookingTranslations.hours['5h']} /> : newBooking.booking_hours === BookingHoursTypes.FOUR_HOURS ? <TranslatedText greetings={newBookingTranslations.hours['4h']} /> : newBooking.booking_hours === BookingHoursTypes.THREE_HOURS ? <TranslatedText greetings={newBookingTranslations.hours['3h']} /> : newBooking.booking_hours === BookingHoursTypes.TWO_HOURS ? <TranslatedText greetings={newBookingTranslations.hours['2h']} /> : <TranslatedText greetings={newBookingTranslations.hours['1h']} />}</p>
                                    </div>
                                )}
                            </div>

                            <Separator />

                            {/* Distance Section */}
                            {
                                newBooking.distance &&
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-5 w-5 text-primary" />
                                        <h3 className="font-semibold"><TranslatedText greetings={newBookingTranslations.distanceDetails} /></h3>
                                    </div>
                                    <p className="pl-7"><TranslatedText greetings={newBookingTranslations.totalDistance} />: {parseFloat(newBooking.distance).toFixed(2)} km</p>
                                </div>
                            }

                            <Separator />

                            {/* Cost Breakdown Section */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <Receipt className="h-5 w-5 text-primary" />
                                    <h3 className="font-semibold"><TranslatedText greetings={newBookingTranslations.costBreakdown} /></h3>
                                </div>

                                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                                <CostItem label={<TranslatedText greetings={newBookingTranslations.attachmentCost} />} value={newBooking.total_attachment_cost?.toFixed(2)} />
                                        <CostItem label={<TranslatedText greetings={newBookingTranslations.tractorCost} />} value={newBooking.total_tractor_cost?.toFixed(2)} />
                                        <CostItem label={<TranslatedText greetings={newBookingTranslations.serviceCharge} />} value={newBooking.total_service_charge?.toFixed(2)} />
                                        <CostItem label={<TranslatedText greetings={newBookingTranslations.distanceCost} />} value={newBooking.total_distance_cost?.toFixed(2)} />
                                        <CostItem label={<TranslatedText greetings={newBookingTranslations.tax} />} value={newBooking.total_tax?.toFixed(2)} />
                                    <Separator className="my-2" />
                                    <div className="flex justify-between items-center pt-2 font-bold">
                                        <span><TranslatedText greetings={newBookingTranslations.totalAmount} /></span>
                                        <span className="text-primary text-lg">
                                            {formatCurrency(newBooking.total_cost.toFixed(2))}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                            <DialogClose asChild>
                                <Button><TranslatedText greetings={newBookingTranslations.cancel} /></Button>
                            </DialogClose>
                            <Button onClick={() => { userBookingConfirm() }}><TranslatedText greetings={newBookingTranslations.confirmBooking} /></Button>
                        </CardFooter>
                    </Card>
                }
            </DialogContent>

            <Backdrop
                sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
                open={loading}
            >
                <CircularProgress />
            </Backdrop>
        </Dialog>
    )
}

export default BookingConfirmation