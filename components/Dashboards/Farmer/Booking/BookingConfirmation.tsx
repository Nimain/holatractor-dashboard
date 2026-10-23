"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { renderInstance } from "@/utils/Axios/RenderInstance";
import { errorMessage, successMessage } from "@/utils/Toastify/Messages";
import {
  Booking,
  BookingHours as BookingHoursTypes,
} from "@/utils/Types/types";
import { Backdrop, CircularProgress } from "@mui/material";
import { CalendarIcon, Clock, MapPin, Receipt } from "lucide-react";
import { useCookie } from "next-cookie";
import { useState } from "react";
import { newBookingTranslations } from "../FarmerTranslation";
import TranslatedText from "@/components/Menubar/TranslatedText";
import { useConfirmation } from "@/components/wrappers/ConfirmationWrapper";

const BookingConfirmation = ({
  newBooking,
  updateBookingStatus,
}: {
  newBooking: Booking;
  updateBookingStatus: (id: string, confirmed: boolean) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const { cookie } = useCookie();
  const access_token = cookie.get("access_token");

  const { StartPlaying } = useConfirmation();

  const formatCurrency = (amount: any) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const CostItem = ({ label, value }: { label: any; value: any }) => (
    <div className="flex justify-between items-center py-1">
      <span className="text-white">{label}</span>
      <span className="font-medium">{formatCurrency(value)}</span>
    </div>
  );

  function userBookingConfirm() {
    if (newBooking && newBooking.id) {
      setLoading(true);
      renderInstance
        .patch(
          `/booking/${newBooking.id}/user_confirm`,
          {},
          {
            headers: {
              Authorization: `Bearer ${access_token}`,
            },
          }
        )
        .then((res) => {
          successMessage("Successfully booked");
          updateBookingStatus(newBooking.id, true);
          StartPlaying();
          setTimeout(() => {
            setOpen(false);
          }, 1500);
        })
        .catch((err) => {
          if (
            err.response &&
            err.response.status === 404 &&
            err.response.data.message === "Booking is not valid"
          ) {
            errorMessage("Booking is not valid");
          } else if (
            err.response &&
            err.response.status === 400 &&
            err.response.data.message === "Booking already confirm"
          ) {
            successMessage("Successfully booked");
          } else if (
            err.response &&
            err.response.status === 400 &&
            err.response.data.message ===
              "You are not allowed to perform this task"
          ) {
            successMessage("You are not allowed to perform this task");
          } else {
            errorMessage("Some error occurred. Please try again...");
          }
        })
        .finally(() => {
          setOpen(false);
          setLoading(false);
        });
    } else {
      errorMessage("Booking is not available");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primaryColor hover:bg-red-500 hover:text-white">
          Confirm
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-gradient-to-r from-[#8c0000] to-[#4d0000] text-white ">
        {newBooking && (
          <div className="p-6">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl font-bold text-white">
                <TranslatedText
                  greetings={newBookingTranslations.bookingConfirmation}
                />
              </CardTitle>
              <p className="text-white/70 text-sm">
                <TranslatedText greetings={newBookingTranslations.bookingId} />:{" "}
                {newBooking.id}
              </p>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="bg-white/10 backdrop-blur-sm  p-4 rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 mr-1 text-white/80" />
                  <h3 className="font-semibold text-white">
                    <TranslatedText
                      greetings={newBookingTranslations.bookingPeriod}
                    />
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-4 pl-7 text-sm">
                  <div>
                    <p className="text-white/70">
                      <TranslatedText greetings={newBookingTranslations.from} />
                    </p>
                    <p className="font-medium text-white">
                      {new Date(newBooking.start_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-white/70">
                      <TranslatedText
                        greetings={newBookingTranslations.duration}
                      />
                    </p>
                    <p>
                      <TranslatedText
                        greetings={newBookingTranslations.duration}
                      />
                      :{" "}
                      {newBooking.booking_hours ===
                      BookingHoursTypes.EIGHT_HOURS ? (
                        <TranslatedText
                          greetings={newBookingTranslations.hours["8h"]}
                        />
                      ) : newBooking.booking_hours ===
                        BookingHoursTypes.SEVEN_HOURS ? (
                        <TranslatedText
                          greetings={newBookingTranslations.hours["7h"]}
                        />
                      ) : newBooking.booking_hours ===
                        BookingHoursTypes.SIX_HOURS ? (
                        <TranslatedText
                          greetings={newBookingTranslations.hours["6h"]}
                        />
                      ) : newBooking.booking_hours ===
                        BookingHoursTypes.FIVE_HOURS ? (
                        <TranslatedText
                          greetings={newBookingTranslations.hours["5h"]}
                        />
                      ) : newBooking.booking_hours ===
                        BookingHoursTypes.FOUR_HOURS ? (
                        <TranslatedText
                          greetings={newBookingTranslations.hours["4h"]}
                        />
                      ) : newBooking.booking_hours ===
                        BookingHoursTypes.THREE_HOURS ? (
                        <TranslatedText
                          greetings={newBookingTranslations.hours["3h"]}
                        />
                      ) : newBooking.booking_hours ===
                        BookingHoursTypes.TWO_HOURS ? (
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
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm  p-4 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-white/80" />
                  <h3 className="font-semibold text-white">
                    <TranslatedText
                      greetings={newBookingTranslations.costBreakdown}
                    />
                  </h3>
                </div>
                <div className="px-2 space-y-1 text-sm [&_*]:text-white">
                  <CostItem
                    label={
                      <TranslatedText
                        greetings={newBookingTranslations.attachmentCost}
                      />
                    }
                    value={newBooking.total_attachment_cost?.toFixed(2)}
                    className="text-white"
                  />
                  <CostItem
                    label={
                      <TranslatedText
                        greetings={newBookingTranslations.tractorCost}
                      />
                    }
                    value={newBooking.total_tractor_cost?.toFixed(2)}
                    className="text-white"
                  />
                  <CostItem
                    label={
                      <TranslatedText
                        greetings={newBookingTranslations.serviceCharge}
                      />
                    }
                    value={newBooking.total_service_charge?.toFixed(2)}
                    className="text-white"
                  />
                  <CostItem
                    label={
                      <TranslatedText
                        greetings={newBookingTranslations.distanceCost}
                      />
                    }
                    value={newBooking.total_distance_cost?.toFixed(2)}
                    className="text-white"
                  />
                  <CostItem
                    label={
                      <TranslatedText greetings={newBookingTranslations.tax} />
                    }
                    value={newBooking.total_tax?.toFixed(2)}
                    className="text-white"
                  />
                  <div className="flex justify-between items-center pt-2 font-bold border-t border-white/10 mt-2">
                    <span className="text-base text-white">
                      <TranslatedText
                        greetings={newBookingTranslations.totalAmount}
                      />
                    </span>
                    <span className="text-amber-400 text-lg">
                      {formatCurrency(newBooking.total_cost)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between gap-3 pt-4">
              <DialogClose asChild>
                <Button
                  variant="outline"
                  className="bg-orange-600  border-orange-600  hover:bg-orange-600 hover:text-white"
                >
                  <TranslatedText greetings={newBookingTranslations.cancel} />
                </Button>
              </DialogClose>
              <Button
                className="bg-orange-600 hover:bg-orange-700 text-white"
                onClick={userBookingConfirm}
              >
                <TranslatedText
                  greetings={newBookingTranslations.confirmBooking}
                />
              </Button>
            </CardFooter>
          </div>
        )}
      </DialogContent>

      <Backdrop
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading}
      >
        <CircularProgress />
      </Backdrop>
    </Dialog>
  );
};

export default BookingConfirmation;
