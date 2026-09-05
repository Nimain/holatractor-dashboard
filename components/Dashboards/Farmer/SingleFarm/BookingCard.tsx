"use client";

import React from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  MapPin,
  Store as StoreIcon,
  Tag,
  Tractor,
  DollarSign,
  CheckCircle2,
} from "lucide-react";
import { Booking, BookingHours } from "@/utils/Types/types";
import TranslatedText from "@/components/Menubar/TranslatedText";
import { farmPageTranslations } from "./FarmTranslations";
import { newBookingTranslations } from "../FarmerTranslation";

export default function BookingCard({ booking }: { booking: Booking }) {
  const formatDate = (date: Date | string | undefined) => {
    if (!date) return "N/A";
    const d = new Date(date);
    return isNaN(d.getTime())
      ? "N/A"
      : d.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
  };

  const isConfirmed = booking.bookingStatus === "Confirmed" || (booking as any).confirm === 1;
  const bookingCode = booking.id ? booking.id.slice(-6).toUpperCase() : "BK-001";
  const tractorCount = Array.isArray(booking.tractors) ? booking.tractors.length : 1;
  const totalCost = Number(booking.total_cost || (booking as any).total_amount || 0);

  const durationDays = booking.end_date && booking.start_date
    ? Math.max(
        1,
        Math.ceil(
          (new Date(booking.end_date).getTime() - new Date(booking.start_date).getTime()) /
            (1000 * 3600 * 24)
        )
      )
    : 1;

  return (
    <Card className="w-full rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 shadow-md backdrop-blur-md overflow-hidden transition-all hover:shadow-lg hover:border-emerald-500/40 p-4 space-y-3">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Tractor className="w-3.5 h-3.5" />
          </div>
          <span className="font-extrabold text-xs text-slate-900 dark:text-white">
            #{bookingCode}
          </span>
        </div>
        <Badge
          className={
            isConfirmed
              ? "bg-emerald-600 text-white font-bold text-[10px]"
              : "bg-amber-500 text-white font-bold text-[10px]"
          }
        >
          {booking.bookingStatus || "Active"}
        </Badge>
      </div>

      {/* Booking Details Grid */}
      <div className="space-y-2 text-xs">
        <div className="flex items-center text-slate-600 dark:text-slate-300 gap-2">
          <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="font-medium truncate">
            {formatDate(booking.start_date)} - {booking.end_date ? formatDate(booking.end_date) : "Ongoing"}
          </span>
        </div>

        {booking.location && (
          <div className="flex items-center text-slate-600 dark:text-slate-300 gap-2">
            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="font-medium truncate">
              {booking.location.name || booking.location.address || "Field Location"}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 pt-1">
          <div className="flex items-center gap-1.5 font-medium">
            <Tractor className="w-3.5 h-3.5 text-slate-400" />
            <span>
              {tractorCount} {tractorCount === 1 ? "Machinery Unit" : "Units"}
            </span>
          </div>
          <div className="flex items-center gap-1.5 font-medium">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{durationDays} {durationDays === 1 ? "Day" : "Days"}</span>
          </div>
        </div>

        {booking.store && (
          <div className="flex items-center text-slate-500 dark:text-slate-400 gap-2 text-[11px]">
            <StoreIcon className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="truncate">Hub: {booking.store.name}</span>
          </div>
        )}
      </div>

      {/* Footer Price & Status */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Total Fee
        </span>
        <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
          ${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>
    </Card>
  );
}

