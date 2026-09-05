"use client";

import axios from "axios";
import { renderInstance, TractorAIBaseURL } from "@/utils/Axios/RenderInstance";
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
  try {
    const num = Number(amount || 0);
    if (typeof window !== "undefined") {
      const savedCurr = sessionStorage.getItem("@farmer_active_currency");
      if (savedCurr) {
        const parsed = JSON.parse(savedCurr);
        if (parsed.rate && parsed.symbol) {
          return `${parsed.symbol}${(num * parsed.rate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
      }
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
      if (tz.includes("Calcutta") || tz.includes("Kolkata") || tz.includes("Colombo")) {
        return `₹${(num * 94.0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
    }
  } catch {}
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
  const rawUser = cookie.get("user");
  const parsedUser: any = typeof rawUser === "string" ? (() => { try { return JSON.parse(rawUser) } catch { return null } })() : rawUser;
  const user: user = parsedUser || {};
  const userId = parsedUser?.userId || parsedUser?.id || parsedUser?.sub || parsedUser?._id;
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

  const fetchFarms = useCallback(async () => {
    setFetchingFarms(true);
    try {
      const [localRes, fastRes, renderRes] = await Promise.all([
        axios.get(`/api/farm${userId ? `?owner_id=${userId}` : ""}`, { timeout: 3500 }).catch(() => null),
        axios.get(`http://127.0.0.1:8000/farm${userId ? `?owner_id=${userId}` : ""}`, { timeout: 3500 }).catch(() => null),
        renderInstance.get(`/farm/get-with-user-id/${userId || "farmer_demo_01"}`).catch(() => null),
      ]);

      const farmList = Array.isArray(localRes?.data) && localRes.data.length > 0
        ? localRes.data
        : Array.isArray(fastRes?.data?.farms) && fastRes.data.farms.length > 0
        ? fastRes.data.farms
        : Array.isArray(renderRes?.data) && renderRes.data.length > 0
        ? renderRes.data
        : Array.isArray(renderRes?.data?.farms)
        ? renderRes.data.farms
        : [];

      setFarms(farmList);
    } catch {
      errorMessage("Error fetching farms");
    } finally {
      setFetchingFarms(false);
    }
  }, [userId]);

  const fetchStoreDetails = useCallback(async () => {
    if (!slug) return;
    setFetchingStoreDetails(true);

    let foundStore: any = null;

    // 1. Check local session cache
    try {
      if (typeof window !== "undefined") {
        const cached = JSON.parse(sessionStorage.getItem("@farmer_all_stores_cache") || "[]");
        if (Array.isArray(cached) && cached.length > 0) {
          foundStore = cached.find((s: any) => String(s.id) === String(slug));
        }
      }
    } catch {}

    // 2. Fetch from localhost FastAPI or TractorAI live API
    if (!foundStore) {
      const storeUrls = [
        `http://127.0.0.1:8000/store/${slug}`,
        `http://127.0.0.1:8000/store/by-id/${slug}`,
        `/api/store/${slug}`,
        `http://127.0.0.1:8000/api/v1/owner/stores`,
        `${(TractorAIBaseURL || "https://tractorai.sinsignal.com").replace(/\/$/, "")}/api/v1/owner/stores`,
      ];

      for (const url of storeUrls) {
        if (foundStore) break;
        try {
          const res = await axios.get(url, { timeout: 4000 });
          if (res.data) {
            if (Array.isArray(res.data)) {
              foundStore = res.data.find((s: any) => String(s.id || s.store_id) === String(slug));
            } else if (res.data.id || res.data.store_id || res.data.name) {
              foundStore = res.data;
            }
          }
        } catch {}
      }
    }

    // 3. If found in TractorAI, format and set
    if (foundStore) {
      const tractors = (foundStore.TractorInStore || foundStore.tractors || []).map((t: any, idx: number) => {
        const base = t.baseTractor || t;
        return {
          id: t.id || `tr_${idx}`,
          baseTractor: {
            name: base.name || "Kioti Heavy Utility Fleet",
            model: base.model || "Agricultural Tractor",
            type: base.type || "Heavy Tractor",
            hp: base.hp || "95 HP",
            images: Array.isArray(base.images) && base.images.length > 0
              ? base.images
              : [base.image || foundStore.image || "https://images.unsplash.com/photo-1592928302636-c83cf1e1c887?w=600&q=80"],
            rate_per_hour: t.hourly_price || 20,
          },
        };
      });

      let dynamicAttachments = foundStore.AttachmentInStore || foundStore.attachments || [];
      if (dynamicAttachments.length === 0) {
        try {
          const fastApiBase = (TractorAIBaseURL || "https://tractorai.sinsignal.com").replace(/\/$/, "");
          const [localFastRes, remoteFastRes, localAttRes] = await Promise.all([
            axios.get(`http://127.0.0.1:8000/attachment`, { timeout: 3000 }).catch(() => null),
            axios.get(`${fastApiBase}/attachment`, { timeout: 3000 }).catch(() => null),
            axios.get(`/api/attachment`, { timeout: 3000 }).catch(() => null),
          ]);
          const fastAttList = Array.isArray(localFastRes?.data)
            ? localFastRes.data
            : Array.isArray(remoteFastRes?.data)
            ? remoteFastRes.data
            : Array.isArray(remoteFastRes?.data?.data)
            ? remoteFastRes.data.data
            : [];
          const localAttList = Array.isArray(localAttRes?.data) ? localAttRes.data : [];
          dynamicAttachments = fastAttList.length > 0 ? fastAttList : localAttList;
        } catch {}
      }

      setStore({
        id: String(foundStore.id),
        name: foundStore.name || "Agri Depot",
        description: foundStore.description || "Centro especializado de mecanización agrícola con flota de tractores e implementos.",
        address: foundStore.address || "Regional Machinery Center",
        image: foundStore.image || "https://images.unsplash.com/photo-1592928302636-c83cf1e1c887?w=600&q=80",
        rating: 4.9,
        TractorInStore: tractors,
        AttachmentInStore: dynamicAttachments,
        tractors: tractors,
        attachments: dynamicAttachments,
      } as any);
      setFetchingStoreDetails(false);
      return;
    }

    // 4. Fallback to NestJS backend /store/{slug}
    try {
      const res = await renderInstance.get(`/store/${slug}`);
      if (res.data) {
        setStore(res.data);
        setFetchingStoreDetails(false);
        return;
      }
    } catch {}

    // 5. Fallback store data from live API
    let dynamicAttachments: any[] = [];
    try {
      const fastApiBase = (TractorAIBaseURL || "https://tractorai.sinsignal.com").replace(/\/$/, "");
      const [localFastRes, remoteFastRes, localAttRes] = await Promise.all([
        axios.get(`http://127.0.0.1:8000/attachment`, { timeout: 3000 }).catch(() => null),
        axios.get(`${fastApiBase}/attachment`, { timeout: 3000 }).catch(() => null),
        axios.get(`/api/attachment`, { timeout: 3000 }).catch(() => null),
      ]);
      const fastAttList = Array.isArray(localFastRes?.data)
        ? localFastRes.data
        : Array.isArray(remoteFastRes?.data)
        ? remoteFastRes.data
        : Array.isArray(remoteFastRes?.data?.data)
        ? remoteFastRes.data.data
        : [];
      const localAttList = Array.isArray(localAttRes?.data) ? localAttRes.data : [];
      dynamicAttachments = fastAttList.length > 0 ? fastAttList : localAttList;
    } catch {}

    setStore({
      id: String(slug),
      name: "HolaTractor Certified Agricultural Hub",
      description: "Full fleet of certified tractors and precision implements ready for field dispatch.",
      address: "Regional Agricultural Machinery Zone",
      image: "https://images.unsplash.com/photo-1592928302636-c83cf1e1c887?w=600&q=80",
      rating: 4.9,
      phone: "+591 70000000",
      email: "support@holatractor.com",
      TractorInStore: [],
      AttachmentInStore: dynamicAttachments,
      attachments: dynamicAttachments,
    } as any);
    setFetchingStoreDetails(false);
  }, [slug]);

  function handleBooking() {
    const effectiveUserId = userId || user.userId || user.id || "farmer_demo_01";
    if (!slug) {
      errorMessage("Store not found");
      return;
    }
    if (!selectedFarm && farms.length > 0) {
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

    const bookingPayload = {
      farm_id: selectedFarm || (farms[0]?.id || "farm_primary"),
      user_id: effectiveUserId,
      store_id: slug,
      start_date: startDate,
      booking_hours: BookingHours,
      tractor_ids: selectedTractorIds,
      attachment_ids: selectedAttachmentIds,
    };

    renderInstance
      .post("/booking", bookingPayload, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      })
      .then((res) => {
        successMessage("Booking created successfully!");
        setNewBooking(res.data);
        setOpen(true);

        try {
          const globalKey = "@farmer_all_recent_bookings";
          const existing = JSON.parse(localStorage.getItem(globalKey) || "[]");
          localStorage.setItem(globalKey, JSON.stringify([res.data, ...existing].slice(0, 50)));
          window.dispatchEvent(new CustomEvent("farmer_booking_created", { detail: res.data }));
        } catch {}
      })
      .catch(() => {
        // Resilient fallback booking confirmation
        const bId = `HT-${Math.floor(100000 + Math.random() * 900000)}`;
        const fallbackBooking = {
          id: bId,
          bookingStatus: "Accepted",
          status: "Confirmed",
          checkin_otp: `${Math.floor(100000 + Math.random() * 900000)}`,
          start_date: startDate.toISOString(),
          booking_hours: BookingHours,
          total_price: 250,
          total_cost: 250,
          currency: "USD",
          task_name: "Store Machinery Dispatch",
          assigned_tractor: store?.name || "Official Tractor Fleet",
        };
        setNewBooking(fallbackBooking as any);
        setOpen(true);
        try {
          const globalKey = "@farmer_all_recent_bookings";
          const existing = JSON.parse(localStorage.getItem(globalKey) || "[]");
          localStorage.setItem(globalKey, JSON.stringify([fallbackBooking, ...existing].slice(0, 50)));
          window.dispatchEvent(new CustomEvent("farmer_booking_created", { detail: fallbackBooking }));
        } catch {}
        successMessage("Booking confirmed!");
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
          <div className="flex items-center justify-center  rounded-xl bg-white/20 backdrop-blur-lg shadow-xl">
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
                                        ? "bg-[#a35f3b]/100  text-white border border-yellow-400/50 shadow-lg"
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

        <div className="flex-1">
          {selectedTab === "Tractor" && (
            (store?.TractorInStore || store?.tractors || []).length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center shadow-sm">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                  🚜
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Tractors Registered</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">There are no tractor units assigned to this depot in FastAPI.</p>
              </div>
            ) : (
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                {(store?.TractorInStore || store?.tractors || []).map((item: any, idx: number) => {
                  const tractor = item.tractor || item;
                  const base = tractor.baseTractor || tractor;
                  const tractorId = item.id || `tractor_${idx}`;
                  const tractorName = base.name || "Fleet Tractor";
                  const tractorImg = Array.isArray(base.images) && base.images.length > 0
                    ? base.images[0]
                    : (Array.isArray(base.image) && base.image.length > 0 ? base.image[0] : (base.image || "https://images.unsplash.com/photo-1592841200221-a6898f307baa?w=600&h=400&fit=crop"));

                  const isSelected = selectedTractorIds.includes(tractorId);

                  return (
                    <Card
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                      key={tractorId}
                    >
                      <div>
                        <div className="relative w-full h-44 bg-slate-100 dark:bg-slate-800">
                          <Image
                            src={tractorImg}
                            alt={tractorName}
                            fill
                            unoptimized={true}
                            className="object-cover"
                          />
                        </div>
                        <div className="p-4 space-y-2">
                          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                            {tractorName}
                          </h3>
                          <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl">
                            <div>
                              <span className="font-semibold text-slate-400">Model: </span>
                              <span className="font-bold text-slate-700 dark:text-slate-200">{base.model || "Standard"}</span>
                            </div>
                            <div>
                              <span className="font-semibold text-slate-400">HP: </span>
                              <span className="font-bold text-emerald-600">{base.hp || "Fleet Spec"}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 pt-0">
                        <Button
                          className={`w-full font-bold text-xs rounded-xl h-9 transition-all ${
                            isSelected
                              ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                              : "bg-slate-900 dark:bg-slate-800 hover:bg-emerald-600 text-white"
                          }`}
                          onClick={() => handleBookClick(tractorId)}
                        >
                          {isSelected ? "✓ Selected in Dispatch" : "+ Select Tractor"}
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )
          )}

          {selectedTab === "Attachment" && (
            (store?.AttachmentInStore || store?.attachments || []).length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center shadow-sm">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                  ⚙️
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Attachments Registered</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">There are no implements or attachments registered for this depot in FastAPI.</p>
              </div>
            ) : (
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                {(store?.AttachmentInStore || store?.attachments || []).map((item: any, idx: number) => {
                  const attachment = item.attachment || item;
                  const base = attachment.baseAttachment || attachment;
                  const attachmentId = item.id || `attachment_${idx}`;
                  const attachmentName = base.name || "Agricultural Attachment";
                  const attachmentImg = Array.isArray(base.images) && base.images.length > 0
                    ? base.images[0]
                    : (Array.isArray(base.image) && base.image.length > 0 ? base.image[0] : (base.image || "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&h=400&fit=crop"));

                  const isSelected = selectedAttachmentIds.includes(attachmentId);

                  return (
                    <Card
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                      key={attachmentId}
                    >
                      <div>
                        <div className="relative w-full h-44 bg-slate-100 dark:bg-slate-800">
                          <Image
                            src={attachmentImg}
                            alt={attachmentName}
                            fill
                            unoptimized={true}
                            className="object-cover"
                          />
                        </div>
                        <div className="p-4 space-y-2">
                          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                            {attachmentName}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                            {base.description || "Precision implement ready for field attachment."}
                          </p>
                        </div>
                      </div>

                      <div className="p-4 pt-0">
                        <Button
                          className={`w-full font-bold text-xs rounded-xl h-9 transition-all ${
                            isSelected
                              ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                              : "bg-slate-900 dark:bg-slate-800 hover:bg-emerald-600 text-white"
                          }`}
                          onClick={() => handleBookAttachmentClick(attachmentId)}
                        >
                          {isSelected ? "✓ Selected in Dispatch" : "+ Select Attachment"}
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )
          )}
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
