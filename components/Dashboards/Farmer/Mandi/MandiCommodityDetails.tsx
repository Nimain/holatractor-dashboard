"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import axios from "axios";
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  MapPin,
  Search,
  Wheat,
  Activity,
  ShieldCheck,
  Building2,
  Calendar,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Download,
  ArrowLeft,
  Filter,
  BarChart3,
  Scale,
  Zap,
  Clock,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const REGIONAL_ZONES = [
  { id: "delhi", name: "Delhi APMC (Azadpur & Narela)", countryCode: "IN", city: "Delhi", flag: "🇮🇳" },
  { id: "punjab", name: "Punjab & Haryana (Khanna & Ludhiana)", countryCode: "IN", city: "Ludhiana", flag: "🇮🇳" },
  { id: "mp", name: "Madhya Pradesh (Indore & Mandsaur)", countryCode: "IN", city: "Indore", flag: "🇮🇳" },
  { id: "scz", name: "Santa Cruz & Montero (Puerto Fluvial)", countryCode: "BO", city: "Santa Cruz", flag: "🇧🇴" },
  { id: "cbba", name: "Cochabamba & Valles (Abasto Sur)", countryCode: "BO", city: "Cochabamba", flag: "🇧🇴" },
];

export default function MandiCommodityDetails() {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedZone, setSelectedZone] = useState(REGIONAL_ZONES[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const [marketResponse, setMarketResponse] = useState<any>(null);

  const fetchLiveSpotData = async (countryCode: string, city: string) => {
    try {
      const res = await axios.get(
        `/api/mandi/spot-prices?country_code=${countryCode}&city=${encodeURIComponent(city)}`,
        { timeout: 5000 }
      );
      if (res.data && res.data.items && res.data.items.length > 0) {
        setMarketResponse(res.data);
        return;
      }
    } catch {
      try {
        const fastRes = await axios.get(
          `http://127.0.0.1:8000/mandi/spot-prices?country_code=${countryCode}&city=${encodeURIComponent(city)}`,
          { timeout: 4000 }
        );
        if (fastRes.data && fastRes.data.items) {
          setMarketResponse(fastRes.data);
        }
      } catch {}
    }
  };

  useEffect(() => {
    fetchLiveSpotData(selectedZone.countryCode, selectedZone.city);
    const interval = setInterval(() => {
      fetchLiveSpotData(selectedZone.countryCode, selectedZone.city);
    }, 60000);
    return () => clearInterval(interval);
  }, [selectedZone]);

  const handleZoneChange = (zoneId: string) => {
    const z = REGIONAL_ZONES.find((item) => item.id === zoneId) || REGIONAL_ZONES[0];
    setSelectedZone(z);
    setRefreshing(true);
    fetchLiveSpotData(z.countryCode, z.city).finally(() => setRefreshing(false));
  };

  const categories = ["all", "Cereal", "Oilseed", "Vegetable", "Input"];

  const items = marketResponse?.items || [];
  const filteredCommodities = useMemo(() => {
    return items.filter((c: any) => {
      const matchSearch =
        c.name_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.name_local.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.variety.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat =
        selectedCategory === "all" ||
        c.category.toLowerCase() === selectedCategory.toLowerCase();
      return matchSearch && matchCat;
    });
  }, [items, searchQuery, selectedCategory]);

  const totalGainers = items.filter((c: any) => c.isUp).length;
  const totalLosers = items.filter((c: any) => !c.isUp).length;

  const currentDateFormatted = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="w-full min-h-screen py-6 space-y-6 max-w-7xl mx-auto">
      {/* ── TOP BREADCRUMB & HEADER ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/farmer">
            <Button
              size="icon"
              variant="outline"
              className="rounded-xl border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">📊</span>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Live Mandi & Commodity Spot Analytics
              </h1>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1 flex items-center gap-1.5">
              <span>Dynamic price discovery powered by TractorAI</span>
              <span className="text-emerald-600 font-bold">• Real-time Auction Sync</span>
              <span className="text-slate-400">• {currentDateFormatted}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Zone Selector */}
          <Select value={selectedZone.id} onValueChange={handleZoneChange}>
            <SelectTrigger className="rounded-xl border-slate-200 dark:border-slate-800 text-xs font-bold h-9 w-[220px]">
              <SelectValue placeholder="Select Zone" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {REGIONAL_ZONES.map((z) => (
                <SelectItem key={z.id} value={z.id} className="text-xs font-bold">
                  {z.flag} {z.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setRefreshing(true);
              fetchLiveSpotData(selectedZone.countryCode, selectedZone.city).finally(() => setRefreshing(false));
            }}
            disabled={refreshing}
            className="rounded-xl border-slate-200 dark:border-slate-800 text-xs font-bold h-9"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? "animate-spin text-emerald-600" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* ── METRICS OVERVIEW STRIP ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Commodities */}
        <Card className="p-4 rounded-3xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Tracked Commodities</span>
            <Wheat className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {items.length}
          </div>
          <p className="text-[11px] text-emerald-600 font-semibold">100% Active APMC Floor</p>
        </Card>

        {/* Daily Gainers */}
        <Card className="p-4 rounded-3xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Bullish Gainers</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600">
            {totalGainers}
          </div>
          <p className="text-[11px] text-slate-400 font-medium">Demand exceeds daily inflows</p>
        </Card>

        {/* Daily Decliners */}
        <Card className="p-4 rounded-3xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Bearish / Stable</span>
            <TrendingDown className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-slate-700 dark:text-slate-300">
            {totalLosers}
          </div>
          <p className="text-[11px] text-slate-400 font-medium">Heavy harvest supply arrival</p>
        </Card>

        {/* Status */}
        <Card className="p-4 rounded-3xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Trading Status</span>
            <Activity className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-sm font-black text-slate-900 dark:text-white truncate">
            {marketResponse?.status || "Open Floor"}
          </div>
          <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            e-NAM Floor Live
          </p>
        </Card>
      </div>

      {/* ── AI ADVISORY BANNER ────────────────────────────────────────────── */}
      {marketResponse?.aiAdvice && (
        <Card className="p-4 rounded-3xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 shadow-sm">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="text-xs font-black text-emerald-900 dark:text-emerald-300 uppercase tracking-wide block">
                TractorAI Agronomic Market Guidance
              </span>
              <p className="text-xs text-emerald-800/90 dark:text-emerald-200/90 font-medium leading-relaxed">
                {marketResponse.aiAdvice}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* ── FILTER & SEARCH BAR ────────────────────────────────────────────── */}
      <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Categories */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  selectedCategory === cat
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                }`}
              >
                {cat === "all" ? "All Commodities" : cat}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder="Search commodity, variety, grade..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 text-xs rounded-xl border-slate-200 dark:border-slate-800 h-9"
            />
          </div>
        </div>
      </Card>

      {/* ── COMMODITY PRICES TABLE CARD ────────────────────────────────────── */}
      <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800">
              <TableRow>
                <TableHead className="font-extrabold text-xs text-slate-600 dark:text-slate-300 py-3.5 pl-6">
                  Commodity & Variety
                </TableHead>
                <TableHead className="font-extrabold text-xs text-slate-600 dark:text-slate-300 py-3.5">
                  Category
                </TableHead>
                <TableHead className="font-extrabold text-xs text-slate-600 dark:text-slate-300 py-3.5 text-right">
                  Min Rate
                </TableHead>
                <TableHead className="font-extrabold text-xs text-slate-600 dark:text-slate-300 py-3.5 text-right">
                  Modal Spot Price
                </TableHead>
                <TableHead className="font-extrabold text-xs text-slate-600 dark:text-slate-300 py-3.5 text-right">
                  Max Rate
                </TableHead>
                <TableHead className="font-extrabold text-xs text-slate-600 dark:text-slate-300 py-3.5 text-center">
                  Daily Trend
                </TableHead>
                <TableHead className="font-extrabold text-xs text-slate-600 dark:text-slate-300 py-3.5 text-right pr-6">
                  Daily Arrivals
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              {filteredCommodities.map((c: any) => (
                <TableRow
                  key={c.id}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                >
                  {/* Commodity */}
                  <TableCell className="py-4 pl-6">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{c.icon}</span>
                      <div>
                        <span className="font-extrabold text-xs text-slate-900 dark:text-white block">
                          {c.name_en}
                        </span>
                        <span className="text-[11px] text-emerald-600 font-medium">{c.name_local}</span>
                      </div>
                    </div>
                  </TableCell>

                  {/* Category & Variety */}
                  <TableCell className="py-4">
                    <div className="space-y-0.5">
                      <Badge variant="outline" className="text-[10px] font-bold border-slate-200 dark:border-slate-700">
                        {c.category}
                      </Badge>
                      <span className="text-[11px] text-slate-400 block">{c.variety}</span>
                    </div>
                  </TableCell>

                  {/* Min */}
                  <TableCell className="py-4 text-right font-semibold text-slate-500">
                    {marketResponse?.currencySymbol}{c.minPrice.toLocaleString()}
                  </TableCell>

                  {/* Modal */}
                  <TableCell className="py-4 text-right">
                    <span className="font-black text-sm text-emerald-600 dark:text-emerald-400">
                      {c.formattedPrice} {c.unit}
                    </span>
                    <span className="text-[10px] text-slate-400 block font-mono">{c.ratePerKg}</span>
                  </TableCell>

                  {/* Max */}
                  <TableCell className="py-4 text-right font-semibold text-slate-500">
                    {marketResponse?.currencySymbol}{c.maxPrice.toLocaleString()}
                  </TableCell>

                  {/* Trend Delta */}
                  <TableCell className="py-4 text-center">
                    <Badge
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-lg inline-flex items-center gap-0.5 ${
                        c.isUp
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30"
                          : "bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30"
                      }`}
                    >
                      {c.isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      <span>{c.trend}</span>
                    </Badge>
                  </TableCell>

                  {/* Arrivals */}
                  <TableCell className="py-4 text-right pr-6 font-mono font-bold text-slate-700 dark:text-slate-300">
                    {c.arrival_volume}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
