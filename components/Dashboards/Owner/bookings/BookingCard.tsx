import { BookingHours, BookingStatus, PaymentStatus, type Booking } from "@/utils/Types/types"
import { CalendarIcon, Clock, Share2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import TranslatedText from "@/components/Menubar/TranslatedText"
import { ownerBookingsTranslation } from "./OwnerBookingsTranslations"
import { newBookingTranslations } from "../../Farmer/FarmerTranslation"
import { cn } from "@/lib/utils"
import AssignOperator from "./AssignOperator"
import PaymentReview from "../_components/PaymentProofAction"
import PaymentMethods from "../_components/BankAccountSelect"
import { useState } from "react"
import { renderInstance } from "@/utils/Axios/RenderInstance"

interface BookingCardProps {
  ticket: Booking
  confirming: boolean
  handleReject: (id: string) => void
}

export function BookingCard({ ticket: ticketProps, confirming, handleReject }: BookingCardProps) {
  const [ticket, setTicket] = useState(ticketProps)

  async function fetchBooking(id: string){
    const response = await renderInstance.get(`/booking/${id}`)
    setTicket(response.data)
  }

  return (
    <Card
      className={cn(
        "py-4 hover:shadow-md transition-shadow"
      )}
    >
      <CardContent>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-medium">
              #holabook{ticket.id.slice(-5)}
            </h3>
          </div>
          <span className="text-lg font-semibold text-green-500">
            ${ticket.total_cost.toFixed(2)}
          </span>
        </div>

        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="font-medium">{new Date(ticket.start_date).toLocaleDateString()}</p>
            {/* <p className="text-sm text-blue-500">{ticket.from.time}</p> */}
          </div>
          <div className="grow mx-4 border-t-2 border-dashed border-gray-300" />
          <div className="text-right">
            <p className="font-medium">{ticket.booking_hours ? <span className="text-sm text-muted-foreground">
              <TranslatedText greetings={ownerBookingsTranslation.duration} />: <span className="font-medium">{ticket.booking_hours === BookingHours.EIGHT_HOURS ? <TranslatedText greetings={newBookingTranslations.hours['8h']} /> : ticket.booking_hours === BookingHours.SEVEN_HOURS ? <TranslatedText greetings={newBookingTranslations.hours['7h']} /> : ticket.booking_hours === BookingHours.SIX_HOURS ? <TranslatedText greetings={newBookingTranslations.hours['6h']} /> : ticket.booking_hours === BookingHours.FIVE_HOURS ? <TranslatedText greetings={newBookingTranslations.hours['5h']} /> : ticket.booking_hours === BookingHours.FOUR_HOURS ? <TranslatedText greetings={newBookingTranslations.hours['4h']} /> : ticket.booking_hours === BookingHours.THREE_HOURS ? <TranslatedText greetings={newBookingTranslations.hours['3h']} /> : ticket.booking_hours === BookingHours.TWO_HOURS ? <TranslatedText greetings={newBookingTranslations.hours['2h']} /> : <TranslatedText greetings={newBookingTranslations.hours['1h']} />}</span>
            </span> : ticket.end_date && new Date(ticket.end_date).toLocaleDateString()}</p>
            {/* <p className="text-sm text-blue-500">{ticket.to.time}</p> */}
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Badge>
              {ticket.bookingStatus}
            </Badge>
            <span className="px-3 py-1 bg-gray-50 rounded-full">
              {`${ticket.user?.first_name} ${ticket.user?.middle_name ?? ""} ${ticket.user?.last_name}`}
            </span>
          </div>
          <Button variant="ghost" className="text-orange-500 hover:text-orange-600">
            <Share2 className="w-4 h-4 mr-2" />
            <TranslatedText greetings={ownerBookingsTranslation.share} />
          </Button>
          <Sheet>

            <SheetTrigger asChild>
              <Button className="bg-primaryColor hover:bg-primaryColor">
                <TranslatedText greetings={ownerBookingsTranslation.viewDetails} />
              </Button>
            </SheetTrigger>

            <SheetContent className="overflow-auto" style={{ scrollbarWidth: "none" }}>
              <SheetHeader>
                <SheetTitle className="text-xl font-semibold">Details</SheetTitle>
              </SheetHeader>

              {
                !ticket.confirm && <p className="text-red-700"><TranslatedText greetings={ownerBookingsTranslation.userNotConfirmed} /></p>
              }

              {
                !ticket.owner_confirm && ticket.bookingStatus !== BookingStatus.Rejected && <div className="flex items-center space-x-2">
                  {/* <Button onClick={() => handleAccept(request.id)}>Accept</Button> */}
                  <PaymentMethods bookingId={ticket.id} fetchBooking={fetchBooking} />
                  <Button variant="destructive" onClick={() => handleReject(ticket.id)} disabled={confirming}>
                    {confirming ? <TranslatedText greetings={ownerBookingsTranslation.rejecting} /> : <TranslatedText greetings={ownerBookingsTranslation.reject} />}
                  </Button>
                </div>
              }

              <div className="space-y-4 mt-6">
                {/* Order Info */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Id</span>
                    <span>#holabook{ticket.id.slice(-5)}</span>
                  </div>

                  <div className="space-y-1">
                    <div >

                      <div className="flex justify-between gap-2">
                        <p className="text-gray-500 text-sm"><TranslatedText greetings={ownerBookingsTranslation.from} /></p>
                        <p className="flex  font-medium"><CalendarIcon className="w-4 h-4 mt-1 text-gray-400" />
                          {new Date(ticket.start_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {
                      ticket.end_date &&
                      <div >
                        <div className="flex justify-between gap-2">
                          <p className="text-gray-500 text-sm"><TranslatedText greetings={ownerBookingsTranslation.to} /></p>
                          <p className="flex  justify-between font-medium"><CalendarIcon className="w-4 h-4 mt-1 text-gray-400" />
                            {new Date(ticket.end_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    }
                  </div>
                  {
                    ticket.booking_hours &&
                    <div className="flex justify-between gap-2">
                      <p className="text-gray-500 text-sm"><TranslatedText greetings={ownerBookingsTranslation.estimation} /></p>
                      <p className="flex items-center font-medium"> <Clock className="w-4 h-4 text-gray-400" />
                        {ticket.booking_hours === BookingHours.EIGHT_HOURS ? <TranslatedText greetings={newBookingTranslations.hours['8h']} /> : ticket.booking_hours === BookingHours.SEVEN_HOURS ? <TranslatedText greetings={newBookingTranslations.hours['7h']} /> : ticket.booking_hours === BookingHours.SIX_HOURS ? <TranslatedText greetings={newBookingTranslations.hours['6h']} /> : ticket.booking_hours === BookingHours.FIVE_HOURS ? <TranslatedText greetings={newBookingTranslations.hours['5h']} /> : ticket.booking_hours === BookingHours.FOUR_HOURS ? <TranslatedText greetings={newBookingTranslations.hours['4h']} /> : ticket.booking_hours === BookingHours.THREE_HOURS ? <TranslatedText greetings={newBookingTranslations.hours['3h']} /> : ticket.booking_hours === BookingHours.TWO_HOURS ? <TranslatedText greetings={newBookingTranslations.hours['2h']} /> : <TranslatedText greetings={newBookingTranslations.hours['1h']} />}
                      </p>
                    </div>
                  }
                </div>

                {/* Status */}
                <div className="flex justify-between gap-2">
                  <div><TranslatedText greetings={ownerBookingsTranslation.status} /></div>

                  <Badge>{ticket.bookingStatus}</Badge>
                </div>

                {/* Driver Info */}
                <div className="flex items-center gap-3 py-3 border-y">
                  <div className="w-10 h-10 bg-gray-200 rounded-full" />
                  <div>
                    <p className="font-medium">Mr. {`${ticket.user?.first_name} ${ticket.user?.middle_name ?? ""} ${ticket.user?.last_name}`}</p>
                    <p className="text-sm text-gray-500"><TranslatedText greetings={ownerBookingsTranslation.reportAt} /> ${new Date(ticket.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Timeline */}
                <div className="space-y-6">
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${((ticket.bookingStatus === BookingStatus.Open) && ticket.owner_confirm) || (ticket.bookingStatus === BookingStatus.Accepted) || (ticket.bookingStatus === BookingStatus.Arriving) || (ticket.bookingStatus === BookingStatus.Arrived) || (ticket.bookingStatus === BookingStatus.Started) || (ticket.bookingStatus === BookingStatus.Stopped) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerPENDING")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerCONFIRMED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "OwnerREJECTED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "COMPLETED"))
                        ? 'bg-green-500'
                        : 'bg-yellow-400'
                        }`} />
                    </div>

                    <div className="flex-1 pb-6">
                      <div className="flex justify-between">
                        <p className="font-medium"><TranslatedText greetings={ownerBookingsTranslation.confirmedBooking} /></p>
                      </div>
                    </div>
                  </div>
                  {
                    ticket.bookingStatus === BookingStatus.Open && ticket.owner_confirm &&
                    <AssignOperator selectedRequest={ticket.id} storeId={ticket.store_id} store={ticket.store} />
                  }
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${(ticket.bookingStatus === BookingStatus.Accepted) || (ticket.bookingStatus === BookingStatus.Arriving) || (ticket.bookingStatus === BookingStatus.Arrived) || (ticket.bookingStatus === BookingStatus.Started) || (ticket.bookingStatus === BookingStatus.Stopped) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerPENDING")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerCONFIRMED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "OwnerREJECTED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "COMPLETED"))
                        ? 'bg-green-500'
                        : 'bg-yellow-400'
                        }`} />
                    </div>

                    <div className="flex-1 pb-6">
                      <div className="flex justify-between">
                        <p className="font-medium">
                          <TranslatedText greetings={ownerBookingsTranslation.operatorAccepted} />
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${(ticket.bookingStatus === BookingStatus.Arriving) || (ticket.bookingStatus === BookingStatus.Arrived) || (ticket.bookingStatus === BookingStatus.Started) || (ticket.bookingStatus === BookingStatus.Stopped) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerPENDING")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerCONFIRMED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "OwnerREJECTED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "COMPLETED"))
                        ? 'bg-green-500'
                        : 'bg-yellow-400'
                        }`} />
                    </div>

                    <div className="flex-1 pb-6">
                      <div className="flex justify-between">
                        <p className="font-medium">
                          <TranslatedText greetings={ownerBookingsTranslation.leftForDestination} />
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${(ticket.bookingStatus === BookingStatus.Arrived) || (ticket.bookingStatus === BookingStatus.Started) || (ticket.bookingStatus === BookingStatus.Stopped) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerPENDING")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerCONFIRMED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "OwnerREJECTED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "COMPLETED"))
                        ? 'bg-green-500'
                        : 'bg-yellow-400'
                        }`} />
                    </div>

                    <div className="flex-1 pb-6">
                      <div className="flex justify-between">
                        <p className="font-medium">
                          <TranslatedText greetings={ownerBookingsTranslation.arrivedAtDestination} />
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${(ticket.bookingStatus === BookingStatus.Started) || (ticket.bookingStatus === BookingStatus.Stopped) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerPENDING")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerCONFIRMED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "OwnerREJECTED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "COMPLETED"))
                        ? 'bg-green-500'
                        : 'bg-yellow-400'
                        }`} />
                    </div>

                    <div className="flex-1 pb-6">
                      <div className="flex justify-between">
                        <p className="font-medium">
                          <TranslatedText greetings={ownerBookingsTranslation.startedWork} />
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerPENDING")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerCONFIRMED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "OwnerREJECTED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "COMPLETED"))
                        ? 'bg-green-500'
                        : 'bg-yellow-400'
                        }`} />
                    </div>

                    <div className="flex-1 pb-6">
                      <div className="flex justify-between">
                        <p className="font-medium">
                          <TranslatedText greetings={ownerBookingsTranslation.waitingForPayment} />
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "FarmerCONFIRMED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "OwnerREJECTED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "COMPLETED"))
                        ? 'bg-green-500'
                        : 'bg-yellow-400'
                        }`} />
                    </div>

                    <div className="flex-1 pb-6">
                      <div className="flex justify-between">
                        <p className="font-medium">
                          <TranslatedText greetings={ownerBookingsTranslation.farmerSubmittedPayment} />
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "OwnerREJECTED")) || ((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "COMPLETED"))
                        ? 'bg-green-500'
                        : 'bg-yellow-400'
                        }`} />
                    </div>

                    <div className="flex-1 pb-6">
                      <div className="flex justify-between">
                        <p className="font-medium">
                          <TranslatedText greetings={ownerBookingsTranslation.rejectedPayment} />
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${((ticket.bookingStatus === BookingStatus.Finished) && (`${ticket.payment[0].status}` === "COMPLETED"))
                        ? 'bg-green-500'
                        : 'bg-yellow-400'
                        }`} />
                    </div>

                    <div className="flex-1 pb-6">
                      <div className="flex justify-between">
                        <p className="font-medium">
                          <TranslatedText greetings={ownerBookingsTranslation.completedPayment} />
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {
                (ticket.payment.length > 0 && ticket.payment[0].status === PaymentStatus.FarmerCONFIRMED) && <PaymentReview
                  referenceNumber={ticket.payment[0].transaction_reference[ticket.payment[0].transaction_reference.length - 1]}
                  screenshotUrl={ticket.payment[0].screenshots[ticket.payment[0].screenshots.length - 1]}
                  paymentId={ticket.payment[0].id} />
              }
            </SheetContent>
          </Sheet>
        </div>
      </CardContent>
    </Card>
  )
}

