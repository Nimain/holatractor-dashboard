"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input, InputProps } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { renderInstance } from "@/utils/Axios/RenderInstance";
import { errorMessage, successMessage } from "@/utils/Toastify/Messages";
import {
  Attachment,
  Booking,
  Farm,
  Tractor,
  BookingHours as BookingHoursTypes,
} from "@/utils/Types/types";
import { addDays, format } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarIcon,
  Clock,
  Clock1,
  LucideHouse,
  MapPin,
  Minus,
  Plus,
  Receipt,
  Search,
  Tractor as TractorIcon,
  Truck,
  Wrench,
  X,
} from "lucide-react";
import { useCookie } from "next-cookie";
import { useState, useEffect, ReactNode, FC } from "react";
import { DateRange } from "react-day-picker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Image from "next/image";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Backdrop, CircularProgress } from "@mui/material";
import { Separator } from "@/components/ui/separator";
import TranslatedText from "@/components/Menubar/TranslatedText";
import { newBookingTranslations } from "./FarmerTranslation";
import { useConfirmation } from "@/components/wrappers/ConfirmationWrapper";
import { DialogClose } from "@radix-ui/react-dialog";

interface user {
  userId: string;
  image: string;
  name: string;
  email: string;
  email_varified: boolean;
}

interface EquipmentItem {
  id: string;
  count: number;
}

const WithoutStoreBooking = () => {
  const [open, setOpen] = useState(false);
  const [isBooking, setIsBooking] = useState(false);

  const [activeTab, setActiveTab] = useState("tractors");
  const [searchQuery, setSearchQuery] = useState("");

  const [farms, setFarms] = useState<Farm[]>([]);
  const [fetchingFarms, setFetchingFarms] = useState(false);

  const [tractors, setTractors] = useState<Tractor[]>([]);
  const [fetchingTractors, setFetchingTractors] = useState(false);

  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [fetchingAttachments, setFetchingAttachments] = useState(false);

  // Form fields
  const [selectedFarm, setSelectedFarm] = useState("");
  const [startDate, setstartDate] = useState<Date>();
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(),
    to: addDays(new Date(), 1),
  });
  const [BookingHours, setBookingHours] = useState("");
  const [selectedTractors, setSelectedTractors] = useState<EquipmentItem[]>([]);
  const [selectedAttachments, setSelectedAttachments] = useState<
    EquipmentItem[]
  >([]);

  const [newBooking, setNewBooking] = useState<Booking | null>(null);

  const { cookie } = useCookie();
  const user: user = cookie.get("user");
  const access_token = cookie.get("access_token");

  const { StartPlaying } = useConfirmation();

  const fetchData = async () => {
    setFetchingFarms(true);
    setFetchingTractors(true);
    setFetchingAttachments(true);

    try {
      const [farmsRes, tractorsRes, attachmentsRes] = await Promise.all([
        renderInstance.get(`/farm/get-with-user-id/${user.userId}`),
        renderInstance.get("/tractor"),
        renderInstance.get("/attachment", {
          headers: { Authorization: `Bearer ${access_token}` },
        }),
      ]);

      setFarms(farmsRes.data);
      setTractors(tractorsRes.data);
      setAttachments(attachmentsRes.data);
    } catch (error) {
      errorMessage("Error fetching data");
    } finally {
      setFetchingFarms(false);
      setFetchingTractors(false);
      setFetchingAttachments(false);
    }
  };

  const handleEquipmentSelect = (
    equipment: Tractor | Attachment,
    type: "tractor" | "attachment"
  ) => {
    const setFunction =
      type === "tractor" ? setSelectedTractors : setSelectedAttachments;
    setFunction((prev) => {
      const existingItem = prev.find((item) => item.id === equipment.id);
      if (existingItem) {
        return prev.map((item) =>
          item.id === equipment.id ? { ...item, count: item.count + 1 } : item
        );
      } else {
        return [...prev, { id: equipment.id, count: 1 }];
      }
    });
  };

  const filteredTractors = tractors.filter(
    (tractor) =>
      tractor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tractor.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAttachments = attachments.filter(
    (attachment) =>
      attachment.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      attachment.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const CostItem = ({ label, value }: { label: any; value: any }) => (
    <div className="flex justify-between items-center py-1">
      <span className="text-gray-600">{label}</span>
      <span className="font-medium">{formatCurrency(value)}</span>
    </div>
  );

  function userBookingConfirm() {
    if (newBooking && newBooking.id) {
      setIsBooking(true);
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
          setIsBooking(false);
        });
    } else {
      errorMessage("Booking is not available");
    }
  }

  const formatCurrency = (amount: any) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  function handleBooking() {
    if (!selectedFarm) {
      errorMessage("Select a farm, please");
      return;
    }

    if (!BookingHours) {
      errorMessage("Select booking hours");
      return;
    }

    if (BookingHours === "more" && !date?.from && !startDate) {
      errorMessage("Select the start date");
      return;
    }

    if (BookingHours === "more" && !date?.to) {
      errorMessage("Select the end date");
      return;
    }

    if (selectedAttachments.length === 0 && selectedTractors.length === 0) {
      errorMessage("You need to select at least one item from store");
      return;
    }

    setIsBooking(true);
    const start_date = BookingHours === "more" ? date?.from : startDate;
    let booking;

    if (BookingHours === "more") {
      booking = {
        user_id: user.userId,
        farm_id: selectedFarm,
        start_date: start_date,
        end_date: BookingHours === "more" ? date?.to : new Date(),
        tractors: selectedTractors,
        attachments: selectedAttachments,
      };
    } else {
      booking = {
        user_id: user.userId,
        farm_id: selectedFarm,
        start_date: start_date,
        booking_hours: BookingHours,
        tractors: selectedTractors,
        attachments: selectedAttachments,
      };
    }

    renderInstance
      .post("/booking/standalone-booking", booking, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      })
      .then((res) => {
        if (res.status === 201) {
          setNewBooking(res.data);
          successMessage("Booked");
        }
      })
      .catch((err) => {
        if (
          err.response &&
          err.response.status === 400 &&
          err.response.data.message === "Farmer not found"
        ) {
          errorMessage("Farmer not found");
        } else if (
          err.response &&
          err.response.status === 404 &&
          err.response.data.message === "Log in user not found"
        ) {
          errorMessage("Log in user not found");
        } else if (
          err.response &&
          err.response.status === 409 &&
          err.response.data.message === "You are not allowed for this operation"
        ) {
          errorMessage("You are not allowed for this operation");
        } else if (
          err.response &&
          err.response.status === 404 &&
          err.response.data.message === "Farm with this user not found"
        ) {
          errorMessage("Farm with this user not found");
        } else if (
          err.response &&
          err.response.status === 404 &&
          err.response.data.message === "Attachment not present"
        ) {
          errorMessage("Attachment not available");
        } else if (
          err.response &&
          err.response.status === 404 &&
          err.response.data.message === "Tractor not present"
        ) {
          errorMessage("Tractor not available");
        } else {
          errorMessage("Some error occurred");
        }
      })
      .finally(() => {
        setIsBooking(false);
      });
  }

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Backdrop
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={isBooking}
      >
        <CircularProgress />
      </Backdrop>

      <DialogTrigger asChild>
        <Button
          onClick={() => {
            setOpen(true);
          }}
          className="bg-green-600 hover:bg-green-700"
        >
          <TranslatedText greetings={newBookingTranslations.newBooking} />
        </Button>
      </DialogTrigger>

      <DialogContent className=" h-[90vh] w-full max-w-6xl overflow-auto  bg-gradient-to-br from-[#8c0000] to-[#4d0000] text-white p-0">
        {newBooking ? (
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
        ) : (
          <div className="flex h-full  w-full">
            {/* Left side details */}
            <div className="w-1/2 h-full border-r bg-gradient-to-r from-[#8c0000] to-[#4d0000]">
              <ScrollArea className="h-full">
                <div className="p-6 space-y-6">
                  <h2 className="text-2xl font-bold text-center">
                    <TranslatedText
                      greetings={newBookingTranslations.bookingForm}
                    />
                  </h2>

                  <div className="space-y-6">
                    <div className="space-y-4">
                      <Label className="flex items-center ">
                        <div>
                          <LucideHouse className="h-5 w-5 mr-1" />
                        </div>
                        <TranslatedText
                          greetings={newBookingTranslations.selectFarm}
                        />
                      </Label>
                      {fetchingFarms ? (
                        <p>
                          <TranslatedText
                            greetings={newBookingTranslations.loadingFarmList}
                          />
                        </p>
                      ) : (
                        <Select
                          onValueChange={(value) => {
                            setSelectedFarm(value);
                          }}
                        >
                          <SelectTrigger className="bg-white/10 border-none">
                            <SelectValue
                              placeholder={
                                <TranslatedText
                                  greetings={newBookingTranslations.chooseAFarm}
                                />
                              }
                              className="placeholder:text-red-500"
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {farms.map((farm) => (
                              <SelectItem key={farm.id} value={farm.id}>
                                {farm.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>

                    <div className="space-y-4">
                      <Label className="mb-3 flex items-center">
                        <div>
                          <Clock1 className="h-5 w-5 mr-1" />
                        </div>
                        <TranslatedText
                          greetings={newBookingTranslations.bookingHours}
                        />
                      </Label>

                      <Select
                        onValueChange={(value) => {
                          setBookingHours(value);
                        }}
                      >
                        <SelectTrigger className="bg-white/10 border-none">
                          <SelectValue
                            placeholder={
                              <TranslatedText
                                greetings={newBookingTranslations.bookingHours}
                              />
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="One_Hour" className="bg-white/10">
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

                    {BookingHours === "more" ? (
                      <div className={cn("grid gap-2")}>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              id="date"
                              variant={"outline"}
                              className={cn(
                                "w-[300px] justify-start text-left font-normal",
                                !date && "text-white"
                              )}
                            >
                              <CalendarIcon />
                              {date?.from ? (
                                date.to ? (
                                  <>
                                    {format(date.from, "LLL dd, y")} -{" "}
                                    {format(date.to, "LLL dd, y")}
                                  </>
                                ) : (
                                  format(date.from, "LLL dd, y")
                                )
                              ) : (
                                <TranslatedText
                                  greetings={newBookingTranslations.pickADate}
                                />
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              initialFocus
                              mode="range"
                              defaultMonth={date?.from}
                              selected={date}
                              onSelect={setDate}
                              numberOfMonths={2}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    ) : (
                      <>
                        <Popover>
                          <div className="flex items-center ">
                            <div>
                              <CalendarIcon className=" h-4 w-4 mr-1" />
                            </div>
                            <h1>Start Date</h1>
                          </div>
                          <PopoverTrigger
                            asChild
                            className="bg-white/10 text-white hover:bg-white/10 hover:text-white"
                          >
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-[280px] justify-start text-left font-normal",
                                !startDate && "text-white"
                              )}
                            >
                              {startDate ? (
                                format(startDate, "PPP")
                              ) : (
                                <TranslatedText
                                  greetings={
                                    newBookingTranslations.pickAStartDate
                                  }
                                />
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
                      </>
                    )}

                    {/* Selected Tractors */}
                    {selectedTractors.length > 0 && (
                      <div className="space-y-2">
                        <Label className="font-semibold">
                          <TranslatedText
                            greetings={newBookingTranslations.selectedTractors}
                          />{" "}
                          ({selectedTractors.length})
                        </Label>
                        {selectedTractors.map((tractor) => (
                          <div
                            key={tractor.id}
                            className="rounded-lg bg-white/10 p-2 text-sm"
                          >
                            ID: {tractor.id}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Selected Attachments */}
                    {selectedAttachments.length > 0 && (
                      <div className="space-y-2">
                        <Label className="font-semibold">
                          <TranslatedText
                            greetings={
                              newBookingTranslations.selectedAttachments
                            }
                          />{" "}
                          ({selectedAttachments.length})
                        </Label>
                        {selectedAttachments.map((attachment) => (
                          <div
                            key={attachment.id}
                            className="rounded-lg bg-white/10 p-2 text-sm"
                          >
                            ID: {attachment.id}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <Button
                    className="w-full bg-orange-500 text-white hover:bg-orange-600 hover:text-white"
                    size="lg"
                    onClick={() => {
                      handleBooking();
                    }}
                  >
                    <TranslatedText
                      greetings={newBookingTranslations.bookEquipment}
                    />
                  </Button>
                </div>
              </ScrollArea>
            </div>

            {/* Right side details */}
            <div className="w-1/2 h-full bg-gray-200">
              <ScrollArea className="h-full">
                <div className="p-6">
                  <div className="mb-6">
                    <SearchInput
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search...."
                      className="w-full pl-10 text-red-500 placeholder:text-red-500" // Added left padding for the icon
                      icon={<Search className="h-4 w-4 text-red-500" />}
                    />
                  </div>
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-2 h-14 p-0 bg-transparent gap-0">
                      <TabsTrigger
                        value="tractors"
                        className="h-full rounded-none data-[state=active]:bg-yellow-500 data-[state=inactive]:bg-white data-[state=active]:text-white data-[state=inactive]:text-gray-600 border-0"
                      >
                        <TractorIcon className="mr-2 h-4 w-4" />
                        <div className="text-xl">
                          {" "}
                          <TranslatedText
                            greetings={newBookingTranslations.tractors}
                          />
                        </div>
                      </TabsTrigger>
                      <TabsTrigger
                        value="attachments"
                        className="h-full rounded-none data-[state=active]:bg-yellow-500 data-[state=inactive]:bg-white data-[state=active]:text-white data-[state=inactive]:text-gray-600 border-0"
                      >
                        <Wrench className="mr-2 h-4 w-4" />
                        <div className="text-xl">
                          <TranslatedText
                            greetings={newBookingTranslations.attachments}
                          />
                        </div>
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="tractors" className="mt-6">
                      {fetchingTractors ? (
                        <p>
                          <TranslatedText
                            greetings={
                              newBookingTranslations.loadingAllTractorLists
                            }
                          />
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {filteredTractors.map((tractor) => (
                            <Card
                              key={tractor.id}
                              className={cn(
                                "cursor-pointer transition-colors overflow-hidden border-none shadow-lg",
                                selectedTractors.some(
                                  (a) => a.id === tractor.id
                                )
                                  ? "ring-2 ring-orange-400"
                                  : "hover:shadow-xl hover:scale-105"
                              )}
                              onClick={() =>
                                handleEquipmentSelect(tractor, "tractor")
                              }
                            >
                              {/* Image Section - Full Width */}
                              <div className="w-full">
                                <Image
                                  src={tractor.images[0]}
                                  alt={tractor.name}
                                  width={300}
                                  height={200}
                                  className="object-cover w-full h-48"
                                />
                              </div>

                              {/* Content Section - Red Background */}
                              <div className="bg-gradient-to-br from-[#8c0000] to-[#4d0000] text-white p-3">
                                <div className="space-y-1">
                                  <h4 className="font-bold text-lg text-center text-white">
                                    {tractor.name}
                                  </h4>
                                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-sm text-white/90 px-2">
                                    <span className="font-semibold text-left">
                                      Model:
                                    </span>
                                    <span className="text-right">
                                      {tractor.model || "N/A"}
                                    </span>

                                    <span className="font-semibold text-left">
                                      Type:
                                    </span>
                                    <span className="text-right">
                                      {tractor.type}
                                    </span>

                                    <span className="font-semibold text-left">
                                      Rate:
                                    </span>
                                    <span className="text-right">
                                      $
                                      {tractor.inventory[0].fixedPrice?.toFixed(
                                        2
                                      )}
                                      /hour
                                    </span>
                                  </div>
                                </div>
                                <Button
                                  className={cn(
                                    "w-full font-bold mt-2",
                                    selectedTractors.some(
                                      (a) => a.id === tractor.id
                                    )
                                      ? "bg-green-600 hover:bg-green-700 text-white"
                                      : "bg-orange-600 hover:bg-orange-700 text-white"
                                  )}
                                >
                                  {selectedTractors.some(
                                    (a) => a.id === tractor.id
                                  )
                                    ? "Selected"
                                    : "Select"}
                                </Button>
                              </div>
                            </Card>
                          ))}
                        </div>
                      )}
                    </TabsContent>
                    <TabsContent value="attachments" className="mt-6">
                      {fetchingAttachments ? (
                        <p>
                          <TranslatedText
                            greetings={
                              newBookingTranslations.loadingAllTractorLists
                            }
                          />
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {filteredAttachments.map((attachment) => (
                            <Card
                              key={attachment.id}
                              className={cn(
                                "cursor-pointer transition-colors overflow-hidden border-none shadow-lg",
                                selectedAttachments.some(
                                  (a) => a.id === attachment.id
                                )
                                  ? "ring-2 ring-orange-400"
                                  : "hover:shadow-xl hover:scale-105"
                              )}
                              onClick={() =>
                                handleEquipmentSelect(attachment, "attachment")
                              }
                            >
                              {/* Image Section - Full Width */}
                              <div className="w-full">
                                <Image
                                  src={attachment.images[0]}
                                  alt={attachment.name}
                                  width={300}
                                  height={200}
                                  className="object-cover w-full h-48"
                                />
                              </div>

                              {/* Content Section - Red Background */}
                              <div className="bg-gradient-to-br from-[#8c0000] to-[#4d0000] text-white p-3">
                                <div className="space-y-1">
                                  <h4 className="font-bold text-lg text-center text-white">
                                    {attachment.name}
                                  </h4>
                                  <p className="text-sm text-white/80 text-center px-2 line-clamp-2">
                                    {attachment.description}
                                  </p>
                                  <div className="text-center">
                                    <p className="text-sm font-semibold text-white">
                                      ${attachment.fixedPrice?.toFixed(2)}/hour
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  className={cn(
                                    "w-full font-bold mt-2",
                                    selectedAttachments.some(
                                      (a) => a.id === attachment.id
                                    )
                                      ? "bg-green-600 hover:bg-green-700 text-white"
                                      : "bg-orange-600 hover:bg-orange-700 text-white"
                                  )}
                                >
                                  {selectedAttachments.some(
                                    (a) => a.id === attachment.id
                                  )
                                    ? "Selected"
                                    : "Select"}
                                </Button>
                              </div>
                            </Card>
                          ))}
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              </ScrollArea>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default WithoutStoreBooking;

interface SearchInputProps extends InputProps {
  icon?: ReactNode;
}

export const SearchInput: FC<SearchInputProps> = ({ icon, ...props }) => {
  return (
    <div className="relative">
      <Input {...props} />
      {icon && (
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          {icon}
        </div>
      )}
    </div>
  );
};
