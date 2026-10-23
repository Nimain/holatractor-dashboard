"use client";

import React from "react";
import { Card } from "@/components/ui/card";

export default function FarmerShimmer() {
  return (
    <div className="w-full space-y-6 pb-12 animate-pulse">
      {/* ── 1. HERO GREETING & 3-TAP BOOKING ACTION RIBBON SHIMMER ── */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-200 dark:bg-slate-800/80 p-6 md:p-8 h-48 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="flex items-center gap-5 w-full max-w-xl">
          <div className="w-16 h-16 rounded-2xl bg-slate-300 dark:bg-slate-700 shrink-0 hidden sm:block" />
          <div className="space-y-3 w-full">
            <div className="flex items-center gap-2">
              <div className="h-5 w-32 bg-slate-300 dark:bg-slate-700 rounded-full" />
              <div className="h-4 w-24 bg-slate-300 dark:bg-slate-700 rounded-full" />
            </div>
            <div className="h-8 w-3/4 bg-slate-300 dark:bg-slate-700 rounded-xl" />
            <div className="h-4 w-full bg-slate-300 dark:bg-slate-700 rounded-lg" />
          </div>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto shrink-0">
          <div className="h-12 w-48 bg-slate-300 dark:bg-slate-700 rounded-2xl" />
          <div className="h-12 w-36 bg-slate-300 dark:bg-slate-700 rounded-2xl" />
        </div>
      </div>

      {/* ── 2. LIVE MANDI & COMMODITY SPOT PRICES WIDGET SHIMMER ── */}
      <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-800" />
            <div className="space-y-1.5">
              <div className="h-5 w-44 bg-slate-200 dark:bg-slate-800 rounded-md" />
              <div className="h-3 w-32 bg-slate-200 dark:bg-slate-800 rounded-md" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 rounded-xl" />
            <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          </div>
        </div>

        {/* Commodity Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array(6)
            .fill(0)
            .map((_, i) => (
              <div
                key={i}
                className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700" />
                  <div className="w-10 h-4 bg-slate-200 dark:bg-slate-700 rounded-full" />
                </div>
                <div className="h-3.5 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
                <div className="h-5 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
              </div>
            ))}
        </div>
      </Card>

      {/* ── 3. KPI METRICS CARDS SHIMMER ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {Array(4)
          .fill(0)
          .map((_, i) => (
            <Card
              key={i}
              className="rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="h-3.5 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-800" />
              </div>
              <div className="h-8 w-28 bg-slate-200 dark:bg-slate-800 rounded-lg" />
              <div className="h-3.5 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
            </Card>
          ))}
      </div>

      {/* ── 4. MIDDLE SECTION: SATELLITE MAP & QUICK DISPATCH SHIMMER ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Satellite Map Card */}
        <Card className="lg:col-span-2 rounded-3xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-800" />
              <div className="space-y-1">
                <div className="h-5 w-36 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-3 w-48 bg-slate-200 dark:bg-slate-800 rounded" />
              </div>
            </div>
            <div className="h-8 w-28 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          </div>

          <div className="w-full h-80 rounded-2xl bg-slate-200 dark:bg-slate-800" />
        </Card>

        {/* Right 1 Col: Quick 3-Tap Machinery Services */}
        <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="h-5 w-40 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-3 w-32 bg-slate-200 dark:bg-slate-800 rounded" />

            <div className="space-y-2.5 pt-2">
              {Array(4)
                .fill(0)
                .map((_, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/60 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700" />
                      <div className="space-y-1">
                        <div className="h-3.5 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
                        <div className="h-2.5 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
                      </div>
                    </div>
                    <div className="h-4 w-12 bg-slate-200 dark:bg-slate-700 rounded" />
                  </div>
                ))}
            </div>
          </div>

          <div className="h-10 w-full bg-slate-200 dark:bg-slate-800 rounded-xl" />
        </Card>
      </div>

      {/* ── 5. RECENT BOOKINGS & FIELD ACTIVITY LOGS TABLE SHIMMER ── */}
      <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-5 w-48 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        </div>

        <div className="space-y-3 pt-2">
          {Array(5)
            .fill(0)
            .map((_, i) => (
              <div
                key={i}
                className="h-12 w-full bg-slate-100 dark:bg-slate-800/60 rounded-xl flex items-center justify-between px-4"
              >
                <div className="h-3.5 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
                <div className="h-3.5 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
                <div className="h-3.5 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
                <div className="h-6 w-16 bg-slate-200 dark:bg-slate-700 rounded-full" />
              </div>
            ))}
        </div>
      </Card>
    </div>
  );
}
