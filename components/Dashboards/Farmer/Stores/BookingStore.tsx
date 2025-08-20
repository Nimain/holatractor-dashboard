"use client";

import { renderInstance } from "@/utils/Axios/RenderInstance";
import { errorMessage, successMessage } from "@/utils/Toastify/Messages";
import {
  Booking,
  Farm,
  Store,
  BookingHours as BookingHoursTypes,
} from "@/utils/Types/types";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import FarmerShimmer from "../_components/FarmerShrimmer";
import {
  CalendarIcon,
  Clock,
  CreditCard,
  Heart,
  MapPin,
  Receipt,
  Settings2Icon,
  Share,
  Tractor,
  Wrench,
} from "lucide-react";
import { FaHotel, FaImage, FaRegCalendarAlt, FaStore } from "react-icons/fa";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCookie } from "next-cookie";
import { DateRange } from "react-day-picker";
import { addDays, format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogClose, DialogContent } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Backdrop, CircularProgress } from "@mui/material";
import { storePageTranslations } from "./StoreTranslations";
import TranslatedText from "@/components/Menubar/TranslatedText";
import { newBookingTranslations } from "../FarmerTranslation";

interface user {
  userId: string;
  image: string;
  name: string;
  email: string;
  email_varified: boolean;
}

interface user {
  userId: string;
  image: string;
  name: string;
  email: string;
  email_varified: boolean;
}

const CostItem = ({ label, value }: { label: any; value: any }) => (
  <div className="flex justify-between items-center py-1">
    <span className="text-gray-600">{label}</span>
    <span className="font-medium">{formatCurrency(value)}</span>
  </div>
);

const formatCurrency = (amount: any) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

const BookingStore = () => {
  const [store, setStore] = useState<Store | null>(null);
  const [fetchingStoreDetails, setFetchingStoreDetails] = useState(false);
  const [selectedTab, setSelectedTab] = useState("Tractor"); // Track selected tab

  const [farms, setFarms] = useState<Farm[]>([]);
  const [fetchingFarms, setFetchingFarms] = useState(false);

  const [selectedFarm, setSelectedFarm] = useState("");
  const [startDate, setstartDate] = useState<Date>();
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(),
    to: addDays(new Date(), 1),
  });
  const [BookingHours, setBookingHours] = useState("");
  const [selectedTractorIds, setSelectedTractorIds] = useState<string[]>([]);
  const [selectedAttachmentIds, setSelectedAttachmentIds] = useState<string[]>(
    []
  );

  const [newBooking, setNewBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const { slug } = useParams();

  const { cookie } = useCookie();
  const user: user = cookie.get("user");
  const access_token = cookie.get("access_token");

  function handleBookClick(tractorId: string) {
    setSelectedTractorIds((prevIds) => {
      if (prevIds.includes(tractorId)) {
        return prevIds.filter((id) => id !== tractorId);
      } else {
        return [...prevIds, tractorId];
      }
    });
  }

  function handleBookAttachmentClick(attachmentId: string) {
    setSelectedAttachmentIds((prevIds) => {
      if (prevIds.includes(attachmentId)) {
        return prevIds.filter((id) => id !== attachmentId);
      } else {
        return [...prevIds, attachmentId];
      }
    });
  }

  const fetchFarms = useCallback(() => {
    if (!user?.userId) return;
    setFetchingFarms(true);
    renderInstance
      .get(`/farm/get-with-user-id/${user.userId}`)
      .then((res) => {
        setFarms(res.data);
      })
      .catch(() => {
        errorMessage("Error fetching farms");
      })
      .finally(() => {
        setFetchingFarms(false);
      });
  }, [user?.userId]);

  const fetchStoreDetails = useCallback(() => {
    if (!slug) return;
    setFetchingStoreDetails(true);
    renderInstance
      .get(`/store/${slug}`)
      .then((res) => {
        setStore(res.data);
      })
      .catch((err) => {
        errorMessage("Error fetching store details");
      })
      .finally(() => {
        setFetchingStoreDetails(false);
      });
  }, [slug]);

  function handleBooking() {
    if (!slug || !user.userId) {
      errorMessage("Try after some time");
      return;
    }
    if (!selectedFarm) {
      errorMessage("Please select a farm");
      return;
    }

    if (!BookingHours) {
      errorMessage("Select booking hours");
      return;
    }

    if (!startDate) {
      errorMessage("Select the start date");
      return;
    }

    if (selectedAttachmentIds.length === 0 && selectedTractorIds.length === 0) {
      errorMessage("You need to select at least one item from store");
      return;
    }

    setLoading(true);

    const booking = {
      farm_id: selectedFarm,
      user_id: user.userId,
      store_id: slug,
      start_date: startDate,
      booking_hours: BookingHours,
      tractor_ids: selectedTractorIds,
      attachment_ids: selectedAttachmentIds,
    };

    renderInstance
      .post("/booking", booking, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      })
      .then((res) => {
        if (res.status === 201) {
          setNewBooking(res.data);
          setOpen(true);
        }
      })
      .catch((err) => {
        errorMessage(err.response?.data?.message || "Some error occurred");
      })
      .finally(() => {
        setLoading(false);
      });
  }

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
          setNewBooking(null);
          setOpen(false);
        })
        .catch((err) => {
          errorMessage(
            err.response?.data?.message ||
              "Some error occurred. Please try again..."
          );
        })
        .finally(() => {
          setOpen(false);
          setLoading(false);
        });
    } else {
      errorMessage("Booking is not available");
    }
  }

  useEffect(() => {
    fetchStoreDetails();
  }, [fetchStoreDetails]);

  useEffect(() => {
    fetchFarms();
  }, [fetchFarms]);

  if (fetchingStoreDetails) return <FarmerShimmer />;

  if (!store)
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-xl">Store details unavailable.</p>
      </div>
    );

  return (
    <div
      className="min-h-screen w-full bg-gray-50 dark:bg-gray-800 overflow-auto overscroll-none"
      style={{ scrollbarWidth: "none" }}
    >
      <h1 className="text-3xl text-red-600 p-3 font-bold">Stores</h1>
      <div className="w-full relative h-[40vh] bg-gray-500">
        <Image
          alt={store.name}
          src={store.image}
          fill
          unoptimized
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="relative z-10 flex flex-col items-center justify-center text-center w-full h-full p-6">
          <h1 className="text-5xl font-bold text-white mb-2 tracking-wide">
            {store.name}
          </h1>
          <p className="text-lg text-white/90 max-w-2xl">{store.description}</p>
        </div>
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-full flex justify-center z-20">
          <div className="flex items-center justify-center p-1.5 rounded-xl bg-black/30 backdrop-blur-lg shadow-xl">
            {[
              { name: "Tractor", icon: <Tractor /> },
              { name: "Attachment", icon: <Wrench /> },
            ].map((tab) => (
              <button
                key={tab.name}
                onClick={() => setSelectedTab(tab.name)}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg transition-all duration-300 font-bold text-sm
                                    ${
                                      selectedTab === tab.name
                                        ? "bg-yellow-500/40 text-white border border-yellow-400/50 shadow-lg"
                                        : "text-white/80 hover:bg-white/10"
                                    }`}
              >
                {tab.icon}
                <span>{tab.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className=" flex flex-col lg:flex-row gap-8 p-6">
        <Card className="w-full lg:w-[400px] bg-gradient-to-br from-[#8c0000] to-[#4d0000] text-white border-none shrink-0 z-10 -mt-24 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-center">
              <TranslatedText greetings={storePageTranslations.wantToBook} />
            </CardTitle>
            <CardDescription className="text-center text-white">
              ({" "}
              <TranslatedText
                greetings={storePageTranslations.fillFormToBook}
              />
              )
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>
                <TranslatedText greetings={storePageTranslations.selectFarms} />
              </Label>
              {fetchingFarms ? (
                <p className="text-gray-200 text-sm">Loading farms...</p>
              ) : (
                <Select onValueChange={(value) => setSelectedFarm(value)}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Choose a farm" />
                  </SelectTrigger>
                  <SelectContent className="text-white border-gray-600">
                    {farms.map((farm) => (
                      <SelectItem
                        key={farm.id}
                        value={farm.id}
                        className="focus:bg-red-800 bg-white text-red-600"
                      >
                        {farm.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-1">
              <Label>
                <TranslatedText
                  greetings={newBookingTranslations.bookingHours}
                />
              </Label>
              <Select onValueChange={(value) => setBookingHours(value)}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent className="bg-black text-white border-gray-600">
                  <SelectItem value="One_Hour">
                    <TranslatedText
                      greetings={newBookingTranslations.hours["1h"]}
                    />
                  </SelectItem>
                  <SelectItem value="Two_Hours">
                    <TranslatedText
                      greetings={newBookingTranslations.hours["2h"]}
                    />
                  </SelectItem>
                  <SelectItem value="Three_Hours">
                    <TranslatedText
                      greetings={newBookingTranslations.hours["3h"]}
                    />
                  </SelectItem>
                  <SelectItem value="Four_Hours">
                    <TranslatedText
                      greetings={newBookingTranslations.hours["4h"]}
                    />
                  </SelectItem>
                  <SelectItem value="Five_Hours">
                    <TranslatedText
                      greetings={newBookingTranslations.hours["5h"]}
                    />
                  </SelectItem>
                  <SelectItem value="Six_Hours">
                    <TranslatedText
                      greetings={newBookingTranslations.hours["6h"]}
                    />
                  </SelectItem>
                  <SelectItem value="Seven_Hours">
                    <TranslatedText
                      greetings={newBookingTranslations.hours["7h"]}
                    />
                  </SelectItem>
                  <SelectItem value="Eight_Hours">
                    <TranslatedText
                      greetings={newBookingTranslations.hours["8h"]}
                    />
                  </SelectItem>
                  <SelectItem value="more">
                    <TranslatedText
                      greetings={newBookingTranslations.moreThan8Hours}
                    />
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-white/90 font-medium">Select Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal bg-white/10 border-white/20 text-white hover:bg-white/20",
                      !startDate && "text-gray-300"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? (
                      format(startDate, "PPP")
                    ) : (
                      <span>
                        <TranslatedText
                          greetings={newBookingTranslations.pickADate}
                        />
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setstartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label className="text-white/90 font-medium">Selected IDs</Label>

              <div className="bg-white/10 p-2 rounded-md">
                <span className="text-sm text-gray-300">Tractor IDs:</span>
                <p className="text-sm font-mono break-words">
                  {selectedTractorIds.length > 0
                    ? selectedTractorIds.join(", ")
                    : "None"}
                </p>
              </div>

              <div className="bg-white/10 p-2 rounded-md">
                <span className="text-sm text-gray-300">Attachment IDs:</span>
                <p className="text-sm font-mono break-words">
                  {selectedAttachmentIds.length > 0
                    ? selectedAttachmentIds.join(", ")
                    : "None"}
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full bg-orange-600 hover:bg-orange-700 text-white border-none font-bold"
              onClick={handleBooking}
            >
              Confirm Booking
            </Button>
          </CardFooter>
        </Card>

        <div>
          {/* className="flex-1 grid gap-4 grid-cols-1 md:grid-cols-2
          xl:grid-cols-3" */}
          {selectedTab === "Tractor" &&
            store.TractorInStore.map((tractor) => (
              <Card
                className="bg-gradient-to-br from-[#8c0000] to-[#4d0000] text-white p-3 flex flex-col border-none shadow-lg"
                key={tractor.id}
              >
                <Image
                  src={
                    tractor.baseTractor.images[0] ||
                    "/placeholder.svg?height=300&width=300"
                  }
                  alt={tractor.baseTractor.name}
                  width={400}
                  height={400}
                  unoptimized={true}
                  className="object-cover w-full h-48 rounded-md"
                />
                <div className="mt-4 space-y-3">
                  <h3 className="text-xl font-bold text-center">
                    {tractor.baseTractor.name}
                  </h3>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-white/90 px-2">
                    <span className="font-semibold text-left">
                      <TranslatedText greetings={storePageTranslations.model} />
                      :
                    </span>
                    <span className="text-right">
                      {(tractor.baseTractor as any).model || "N/A"}
                    </span>

                    <span className="font-semibold text-left">Type:</span>
                    <span className="text-right">
                      {(tractor.baseTractor as any).type || "N/A"}
                    </span>

                    <span className="font-semibold text-left">HP:</span>
                    <span className="text-right">
                      {(tractor.baseTractor as any).hp || "50"}
                    </span>
                  </div>
                </div>
                <Button
                  className={`w-full font-bold mt-2 pt-4 bg-orange-600 hover:bg-orange-700 text-white`}
                  onClick={() => handleBookClick(tractor.id)}
                >
                  {selectedTractorIds.includes(tractor.id)
                    ? "Selected"
                    : "Select"}
                </Button>
              </Card>
            ))}
          {selectedTab === "Attachment" &&
            store.AttachmentInStore.length === 0 && (
              <Card className="bg-white dark:bg-slate-900 text-black dark:text-white p-8 flex flex-col justify-center items-center col-span-1 md:col-span-2 xl:col-span-3">
                <CreditCard className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
                <h3 className="text-xl font-bold">No Attachments Available</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  This store currently has no attachments listed.
                </p>
              </Card>
            )}
          {selectedTab === "Attachment" &&
            store.AttachmentInStore.map((attachment) => (
              <Card
                className="bg-gradient-to-br from-[#8c0000] to-[#4d0000] text-white p-4 flex flex-col border-none shadow-lg"
                key={attachment.id}
              >
                <Image
                  src={
                    attachment.baseAttachment.images[0] ||
                    "/placeholder.svg?height=300&width=300"
                  }
                  alt={attachment.baseAttachment.name}
                  width={400}
                  height={400}
                  unoptimized={true}
                  className="object-cover w-full h-48 rounded-md"
                />
                <div className="mt-4 space-y-3">
                  <h3 className="text-xl font-bold text-center">
                    {attachment.baseAttachment.name}
                  </h3>
                  <p className="text-sm text-white/80 text-center h-12 overflow-hidden px-2">
                    {attachment.baseAttachment.description}
                  </p>
                </div>
                <Button
                  className={`w-full font-bold mt-auto pt-4 bg-orange-600 hover:bg-orange-700 text-white`}
                  onClick={() => handleBookAttachmentClick(attachment.id)}
                >
                  {selectedAttachmentIds.includes(attachment.id)
                    ? "Selected"
                    : "Select"}
                </Button>
              </Card>
            ))}
        </div>
      </div>
      {/* You can add the Dialog and Backdrop for booking confirmation here if needed */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-gradient-to-br from-[#8c0000] to-[#4d0000] text-white border-none p-0">
          {newBooking && (
            <div className="p-6">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl font-bold text-white">
                  <TranslatedText
                    greetings={newBookingTranslations.bookingConfirmation}
                  />
                </CardTitle>
                <p className="text-white/70 text-sm">
                  <TranslatedText
                    greetings={newBookingTranslations.bookingId}
                  />
                  : {newBooking.id}
                </p>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="bg-black/20 p-4 rounded-lg space-y-3">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5 text-white/80" />
                    <h3 className="font-semibold text-white">
                      <TranslatedText
                        greetings={newBookingTranslations.bookingPeriod}
                      />
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pl-7 text-sm">
                    <div>
                      <p className="text-white/70">
                        <TranslatedText
                          greetings={newBookingTranslations.from}
                        />
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
                      <p className="font-medium text-white">
                        {newBooking.booking_hours?.replace("_", " ")}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-black/20 p-4 rounded-lg space-y-2">
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
                        <TranslatedText
                          greetings={newBookingTranslations.tax}
                        />
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
      </Dialog>

      <Backdrop
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </div>
  );
};

export default BookingStore;
