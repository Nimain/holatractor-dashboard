import {
  BookingHours,
  BookingStatus,
  PaymentStatus,
  type Booking,
} from "@/utils/Types/types";
import { CalendarIcon, Clock, RotateCw, Share2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import TranslatedText from "@/components/Menubar/TranslatedText";
import { ownerBookingsTranslation } from "./OwnerBookingsTranslations";
import { newBookingTranslations } from "../../Farmer/FarmerTranslation";
import { cn } from "@/lib/utils";
import AssignOperator from "./AssignOperator";
import PaymentReview from "../_components/PaymentProofAction";
import PaymentMethods from "../_components/BankAccountSelect";
import { useState } from "react";
import { renderInstance } from "@/utils/Axios/RenderInstance";
import { CircularProgress } from "@mui/material";
import { errorMessage, successMessage } from "@/utils/Toastify/Messages";

interface BookingCardProps {
  ticket: Booking;
  confirming: boolean;
  accessToken: string;
  setConfirming: (id: boolean) => void;
}

export function BookingCard({
  ticket: ticketProps,
  confirming,
  setConfirming,
  accessToken,
}: BookingCardProps) {
  const [ticket, setTicket] = useState(ticketProps);
  const [loading, setLoading] = useState(false);

  async function fetchBooking(id: string) {
    setLoading(true);
    const response = await renderInstance.get(`/booking/${id}`);
    setTicket(response.data);
    setLoading(false);
  }

  const handleReject = (id: string) => {
    setConfirming(true);
    // Implement accept logic here
    renderInstance
      .patch(
        `/booking/${id}/owner_reject`,
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )
      .then(async (res) => {
        await fetchBooking(id);
        successMessage("You have rejected this request");
      })
      .catch((err) => {
        if (
          err.response &&
          err.response.status === 404 &&
          err.response.data.message === "Booking is not valid"
        ) {
          errorMessage("Log in user not found");
        } else if (
          err.response &&
          err.response.status === 400 &&
          err.response.data.message ===
            "User has not confirmed the booking. Wait till user booked"
        ) {
          errorMessage(
            "User has not confirmed the booking. Wait till user booked"
          );
        } else if (
          err.response &&
          err.response.status === 400 &&
          err.response.data.message ===
            "You are not allowed to perform this task"
        ) {
          errorMessage("You are not allowed to perform this task");
        } else {
          errorMessage("Some error occurred");
        }
      })
      .finally(() => {
        setConfirming(false);
      });
  };

  return (
    <Card
      className={cn(
        "py-4 hover:shadow-md transition-shadow bg-gradient-to-r from-[#8c0000] to-[#4d0000] text-white"
      )}
    >
      <CardContent>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-medium">
              #holabook{ticket.id.slice(-5)}
            </h3>
          </div>
          <span className="text-lg font-semibold ">
            ${ticket.total_cost.toFixed(2)}
          </span>
        </div>

        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="font-medium">
              {new Date(ticket.start_date).toLocaleDateString()}
            </p>
            {/* <p className="text-sm text-blue-500">{ticket.from.time}</p> */}
          </div>
          {/* <div className="grow mx-4 border-t-2 border-dashed border-gray-300" /> */}
          <div className="text-right">
            <p className="font-medium">
              {ticket.booking_hours ? (
                <span className="text-sm text-muted">
                  <TranslatedText
                    greetings={ownerBookingsTranslation.duration}
                  />
                  :{" "}
                  <span className="font-medium">
                    {ticket.booking_hours === BookingHours.EIGHT_HOURS ? (
                      <TranslatedText
                        greetings={newBookingTranslations.hours["8h"]}
                      />
                    ) : ticket.booking_hours === BookingHours.SEVEN_HOURS ? (
                      <TranslatedText
                        greetings={newBookingTranslations.hours["7h"]}
                      />
                    ) : ticket.booking_hours === BookingHours.SIX_HOURS ? (
                      <TranslatedText
                        greetings={newBookingTranslations.hours["6h"]}
                      />
                    ) : ticket.booking_hours === BookingHours.FIVE_HOURS ? (
                      <TranslatedText
                        greetings={newBookingTranslations.hours["5h"]}
                      />
                    ) : ticket.booking_hours === BookingHours.FOUR_HOURS ? (
                      <TranslatedText
                        greetings={newBookingTranslations.hours["4h"]}
                      />
                    ) : ticket.booking_hours === BookingHours.THREE_HOURS ? (
                      <TranslatedText
                        greetings={newBookingTranslations.hours["3h"]}
                      />
                    ) : ticket.booking_hours === BookingHours.TWO_HOURS ? (
                      <TranslatedText
                        greetings={newBookingTranslations.hours["2h"]}
                      />
                    ) : (
                      <TranslatedText
                        greetings={newBookingTranslations.hours["1h"]}
                      />
                    )}
                  </span>
                </span>
              ) : (
                ticket.end_date &&
                new Date(ticket.end_date).toLocaleDateString()
              )}
            </p>
            {/* <p className="text-sm text-blue-500">{ticket.to.time}</p> */}
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex items-center gap-2 text-sm ">
            <Badge className="bg-white text-orange-600">
              {ticket.bookingStatus}
            </Badge>
            <span className="px-3 py-1 rounded-full">
              {`${ticket.user?.first_name} ${ticket.user?.middle_name ?? ""} ${
                ticket.user?.last_name
              }`}
            </span>
          </div>
          <Button variant="ghost" className=" hover:text-orange-600">
            <Share2 className="w-4 h-4 mr-2" />
            <TranslatedText greetings={ownerBookingsTranslation.share} />
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button className="bg-orange-600 hover:bg-orange-700">
                <TranslatedText
                  greetings={ownerBookingsTranslation.viewDetails}
                />
              </Button>
            </SheetTrigger>

            <SheetContent
              className="overflow-auto bg-gradient-to-r from-[#8c0000] to-[#4d0000] text-white"
              style={{ scrollbarWidth: "none" }}
            >
              <SheetHeader>
                <SheetTitle className="text-xl text-white flex items-center gap-2">
                  <p>Booking Details</p>
                  {/* {
                    loading ? <CircularProgress size={20} color="inherit" /> : <RotateCw className="w-5" onClick={() => { fetchBooking(ticket.id) }} />
                  } */}
                </SheetTitle>
              </SheetHeader>

              {!ticket.confirm && (
                <p className="text-red-700">
                  <TranslatedText
                    greetings={ownerBookingsTranslation.userNotConfirmed}
                  />
                </p>
              )}

              {!ticket.owner_confirm &&
                ticket.bookingStatus !== BookingStatus.Rejected && (
                  <div className="flex items-center space-x-2">
                    {/* <Button onClick={() => handleAccept(request.id)}>Accept</Button> */}
                    <PaymentMethods
                      bookingId={ticket.id}
                      fetchBooking={fetchBooking}
                    />
                    <Button
                      variant="destructive"
                      onClick={() => handleReject(ticket.id)}
                      disabled={confirming}
                    >
                      {confirming ? (
                        <TranslatedText
                          greetings={ownerBookingsTranslation.rejecting}
                        />
                      ) : (
                        <TranslatedText
                          greetings={ownerBookingsTranslation.reject}
                        />
                      )}
                    </Button>
                  </div>
                )}

              <div className="space-y-4 mt-6">
                {/* Order Info */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-white">Id</span>
                    <span>#holabook{ticket.id.slice(-5)}</span>
                  </div>

                  <div className="space-y-1">
                    <div>
                      <div className="flex justify-between gap-2">
                        <p className="text-white text-sm">
                          <TranslatedText
                            greetings={ownerBookingsTranslation.from}
                          />
                        </p>
                        <p className="flex  font-medium">
                          <CalendarIcon className="w-4 h-4 mt-1 text-white" />
                          {new Date(ticket.start_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {ticket.end_date && (
                      <div>
                        <div className="flex justify-between gap-2">
                          <p className="text-white text-sm">
                            <TranslatedText
                              greetings={ownerBookingsTranslation.to}
                            />
                          </p>
                          <p className="flex  justify-between font-medium">
                            <CalendarIcon className="w-4 h-4 mt-1 text-gray-400" />
                            {new Date(ticket.end_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  {ticket.booking_hours && (
                    <div className="flex justify-between gap-2">
                      <p className="text-white text-sm">
                        <TranslatedText
                          greetings={ownerBookingsTranslation.estimation}
                        />
                      </p>
                      <p className="flex items-center font-medium">
                        {" "}
                        <Clock className="w-4 h-4 text-white" />
                        {ticket.booking_hours === BookingHours.EIGHT_HOURS ? (
                          <TranslatedText
                            greetings={newBookingTranslations.hours["8h"]}
                          />
                        ) : ticket.booking_hours ===
                          BookingHours.SEVEN_HOURS ? (
                          <TranslatedText
                            greetings={newBookingTranslations.hours["7h"]}
                          />
                        ) : ticket.booking_hours === BookingHours.SIX_HOURS ? (
                          <TranslatedText
                            greetings={newBookingTranslations.hours["6h"]}
                          />
                        ) : ticket.booking_hours === BookingHours.FIVE_HOURS ? (
                          <TranslatedText
                            greetings={newBookingTranslations.hours["5h"]}
                          />
                        ) : ticket.booking_hours === BookingHours.FOUR_HOURS ? (
                          <TranslatedText
                            greetings={newBookingTranslations.hours["4h"]}
                          />
                        ) : ticket.booking_hours ===
                          BookingHours.THREE_HOURS ? (
                          <TranslatedText
                            greetings={newBookingTranslations.hours["3h"]}
                          />
                        ) : ticket.booking_hours === BookingHours.TWO_HOURS ? (
                          <TranslatedText
                            greetings={newBookingTranslations.hours["2h"]}
                          />
                        ) : (
                          <TranslatedText
                            greetings={newBookingTranslations.hours["1h"]}
                          />
                        )}
                      </p>
                    </div>
                  )}
                </div>

                {/* Status */}
                <div className="flex justify-between gap-2">
                  <div>
                    <TranslatedText
                      greetings={ownerBookingsTranslation.status}
                    />
                  </div>

                  <Badge
                    className={
                      ticket.bookingStatus.toLowerCase() === "open"
                        ? "bg-orange-500 text-white hover:bg-orange-600"
                        : ticket.bookingStatus.toLowerCase() === "finished"
                        ? "bg-green-500 text-white"
                        : ticket.bookingStatus.toLowerCase() === "rejected"
                        ? "bg-red-500 text-white"
                        : "bg-gray-300 text-black"
                    }
                  >
                    {ticket.bookingStatus}
                  </Badge>
                </div>

                {/* Driver Info */}
                <div className="flex items-center gap-3 py-3 border-y">
                  <div className="w-10 h-10 bg-gray-200 rounded-full" />
                  <div>
                    <p className="font-medium">
                      Mr.{" "}
                      {`${ticket.user?.first_name} ${
                        ticket.user?.middle_name ?? ""
                      } ${ticket.user?.last_name}`}
                    </p>
                    <p className="text-sm text-white">
                      <TranslatedText
                        greetings={ownerBookingsTranslation.reportAt}
                      />{" "}
                      ${new Date(ticket.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Timeline */}
                <div className="space-y-6">
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          (ticket.bookingStatus === BookingStatus.Open &&
                            ticket.owner_confirm) ||
                          ticket.bookingStatus === BookingStatus.Accepted ||
                          ticket.bookingStatus === BookingStatus.Arriving ||
                          ticket.bookingStatus === BookingStatus.Arrived ||
                          ticket.bookingStatus === BookingStatus.Started ||
                          ticket.bookingStatus === BookingStatus.Stopped ||
                          (ticket.bookingStatus === BookingStatus.Finished &&
                            `${ticket.payment[0].status}` ===
                              "FarmerPENDING") ||
                          (ticket.bookingStatus === BookingStatus.Finished &&
                            `${ticket.payment[0].status}` ===
                              "FarmerCONFIRMED") ||
                          (ticket.bookingStatus === BookingStatus.Finished &&
                            `${ticket.payment[0].status}` ===
                              "OwnerREJECTED") ||
                          (ticket.bookingStatus === BookingStatus.Finished &&
                            `${ticket.payment[0].status}` === "COMPLETED")
                            ? "bg-green-500"
                            : "bg-yellow-400"
                        }`}
                      />
                    </div>

                    <div className="flex-1 pb-6">
                      <div className="flex justify-between">
                        <p className="font-medium">
                          <TranslatedText
                            greetings={
                              ownerBookingsTranslation.confirmedBooking
                            }
                          />
                        </p>
                      </div>
                    </div>
                  </div>
                  {ticket.bookingStatus === BookingStatus.Open &&
                    ticket.owner_confirm && (
                      <AssignOperator
                        selectedRequest={ticket.id}
                        storeId={ticket.store_id}
                    />
                    )}
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          ticket.bookingStatus === BookingStatus.Accepted ||
                          ticket.bookingStatus === BookingStatus.Arriving ||
                          ticket.bookingStatus === BookingStatus.Arrived ||
                          ticket.bookingStatus === BookingStatus.Started ||
                          ticket.bookingStatus === BookingStatus.Stopped ||
                          (ticket.bookingStatus === BookingStatus.Finished &&
                            `${ticket.payment[0].status}` ===
                              "FarmerPENDING") ||
                          (ticket.bookingStatus === BookingStatus.Finished &&
                            `${ticket.payment[0].status}` ===
                              "FarmerCONFIRMED") ||
                          (ticket.bookingStatus === BookingStatus.Finished &&
                            `${ticket.payment[0].status}` ===
                              "OwnerREJECTED") ||
                          (ticket.bookingStatus === BookingStatus.Finished &&
                            `${ticket.payment[0].status}` === "COMPLETED")
                            ? "bg-green-500"
                            : "bg-yellow-400"
                        }`}
                      />
                    </div>

                    <div className="flex-1 pb-6">
                      <div className="flex justify-between">
                        <p className="font-medium">
                          <TranslatedText
                            greetings={
                              ownerBookingsTranslation.operatorAccepted
                            }
                          />
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          ticket.bookingStatus === BookingStatus.Arriving ||
                          ticket.bookingStatus === BookingStatus.Arrived ||
                          ticket.bookingStatus === BookingStatus.Started ||
                          ticket.bookingStatus === BookingStatus.Stopped ||
                          (ticket.bookingStatus === BookingStatus.Finished &&
                            `${ticket.payment[0].status}` ===
                              "FarmerPENDING") ||
                          (ticket.bookingStatus === BookingStatus.Finished &&
                            `${ticket.payment[0].status}` ===
                              "FarmerCONFIRMED") ||
                          (ticket.bookingStatus === BookingStatus.Finished &&
                            `${ticket.payment[0].status}` ===
                              "OwnerREJECTED") ||
                          (ticket.bookingStatus === BookingStatus.Finished &&
                            `${ticket.payment[0].status}` === "COMPLETED")
                            ? "bg-green-500"
                            : "bg-yellow-400"
                        }`}
                      />
                    </div>

                    <div className="flex-1 pb-6">
                      <div className="flex justify-between">
                        <p className="font-medium">
                          <TranslatedText
                            greetings={
                              ownerBookingsTranslation.leftForDestination
                            }
                          />
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          ticket.bookingStatus === BookingStatus.Arrived ||
                          ticket.bookingStatus === BookingStatus.Started ||
                          ticket.bookingStatus === BookingStatus.Stopped ||
                          (ticket.bookingStatus === BookingStatus.Finished &&
                            `${ticket.payment[0].status}` ===
                              "FarmerPENDING") ||
                          (ticket.bookingStatus === BookingStatus.Finished &&
                            `${ticket.payment[0].status}` ===
                              "FarmerCONFIRMED") ||
                          (ticket.bookingStatus === BookingStatus.Finished &&
                            `${ticket.payment[0].status}` ===
                              "OwnerREJECTED") ||
                          (ticket.bookingStatus === BookingStatus.Finished &&
                            `${ticket.payment[0].status}` === "COMPLETED")
                            ? "bg-green-500"
                            : "bg-yellow-400"
                        }`}
                      />
                    </div>

                    <div className="flex-1 pb-6">
                      <div className="flex justify-between">
                        <p className="font-medium">
                          <TranslatedText
                            greetings={
                              ownerBookingsTranslation.arrivedAtDestination
                            }
                          />
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          ticket.bookingStatus === BookingStatus.Started ||
                          ticket.bookingStatus === BookingStatus.Stopped ||
                          (ticket.bookingStatus === BookingStatus.Finished &&
                            `${ticket.payment[0].status}` ===
                              "FarmerPENDING") ||
                          (ticket.bookingStatus === BookingStatus.Finished &&
                            `${ticket.payment[0].status}` ===
                              "FarmerCONFIRMED") ||
                          (ticket.bookingStatus === BookingStatus.Finished &&
                            `${ticket.payment[0].status}` ===
                              "OwnerREJECTED") ||
                          (ticket.bookingStatus === BookingStatus.Finished &&
                            `${ticket.payment[0].status}` === "COMPLETED")
                            ? "bg-green-500"
                            : "bg-yellow-400"
                        }`}
                      />
                    </div>

                    <div className="flex-1 pb-6">
                      <div className="flex justify-between">
                        <p className="font-medium">
                          <TranslatedText
                            greetings={ownerBookingsTranslation.startedWork}
                          />
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          (ticket.bookingStatus === BookingStatus.Finished &&
                            `${ticket.payment[0].status}` ===
                              "FarmerPENDING") ||
                          (ticket.bookingStatus === BookingStatus.Finished &&
                            `${ticket.payment[0].status}` ===
                              "FarmerCONFIRMED") ||
                          (ticket.bookingStatus === BookingStatus.Finished &&
                            `${ticket.payment[0].status}` ===
                              "OwnerREJECTED") ||
                          (ticket.bookingStatus === BookingStatus.Finished &&
                            `${ticket.payment[0].status}` === "COMPLETED")
                            ? "bg-green-500"
                            : "bg-yellow-400"
                        }`}
                      />
                    </div>

                    <div className="flex-1 pb-6">
                      <div className="flex justify-between">
                        <p className="font-medium">
                          <TranslatedText
                            greetings={
                              ownerBookingsTranslation.waitingForPayment
                            }
                          />
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          (ticket.bookingStatus === BookingStatus.Finished &&
                            `${ticket.payment[0].status}` ===
                              "FarmerCONFIRMED") ||
                          (ticket.bookingStatus === BookingStatus.Finished &&
                            `${ticket.payment[0].status}` ===
                              "OwnerREJECTED") ||
                          (ticket.bookingStatus === BookingStatus.Finished &&
                            `${ticket.payment[0].status}` === "COMPLETED")
                            ? "bg-green-500"
                            : "bg-yellow-400"
                        }`}
                      />
                    </div>

                    <div className="flex-1 pb-6">
                      <div className="flex justify-between">
                        <p className="font-medium">
                          <TranslatedText
                            greetings={
                              ownerBookingsTranslation.farmerSubmittedPayment
                            }
                          />
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          (ticket.bookingStatus === BookingStatus.Finished &&
                            `${ticket.payment[0].status}` ===
                              "OwnerREJECTED") ||
                          (ticket.bookingStatus === BookingStatus.Finished &&
                            `${ticket.payment[0].status}` === "COMPLETED")
                            ? "bg-green-500"
                            : "bg-yellow-400"
                        }`}
                      />
                    </div>

                    <div className="flex-1 pb-6">
                      <div className="flex justify-between">
                        <p className="font-medium">
                          <TranslatedText
                            greetings={ownerBookingsTranslation.rejectedPayment}
                          />
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          ticket.bookingStatus === BookingStatus.Finished &&
                          `${ticket.payment[0].status}` === "COMPLETED"
                            ? "bg-green-500"
                            : "bg-yellow-400"
                        }`}
                      />
                    </div>

                    <div className="flex-1 pb-6">
                      <div className="flex justify-between">
                        <p className="font-medium">
                          <TranslatedText
                            greetings={
                              ownerBookingsTranslation.completedPayment
                            }
                          />
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {ticket.payment.length > 0 &&
                ticket.payment[0].status === PaymentStatus.FarmerCONFIRMED && (
                  <PaymentReview
                    referenceNumber={
                      ticket.payment[0].transaction_reference[
                        ticket.payment[0].transaction_reference.length - 1
                      ]
                    }
                    screenshotUrl={
                      ticket.payment[0].screenshots[
                        ticket.payment[0].screenshots.length - 1
                      ]
                    }
                    paymentId={ticket.payment[0].id}
                  />
                )}
            </SheetContent>
          </Sheet>
        </div>
      </CardContent>
    </Card>
  );
}
