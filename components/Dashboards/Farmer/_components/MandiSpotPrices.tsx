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
  Globe2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface MandiItem {
  id: string;
  name_en: string;
  name_local: string;
  category: string;
  variety: string;
  price: number;
  formattedPrice: string;
  unit: string;
  ratePerKg: string;
  trend: string;
  pct: number;
  isUp: boolean;
  minPrice: number;
  maxPrice: number;
  arrival_volume: string;
  forecast: string;
  image: string;
  icon: string;
  last_updated?: string;
}

interface MandiData {
  zoneId: string;
  zoneName: string;
  currencySymbol: string;
  currencyCode: string;
  yieldUnit: string;
  country: string;
  status: string;
  aiAdvice: string;
  last_synced_at?: string;
  items: MandiItem[];
}

const REGIONAL_ZONES = [
  { id: "delhi", name: "Delhi Mandi (Azadpur & Narela)", countryCode: "IN", city: "Delhi", flag: "🇮🇳" },
  { id: "punjab", name: "Punjab & Haryana (Khanna)", countryCode: "IN", city: "Ludhiana", flag: "🇮🇳" },
  { id: "mp", name: "Madhya Pradesh (Indore & Mandsaur)", countryCode: "IN", city: "Indore", flag: "🇮🇳" },
  { id: "scz", name: "Santa Cruz & Montero (Puerto Fluvial)", countryCode: "BO", city: "Santa Cruz", flag: "🇧🇴" },
  { id: "cbba", name: "Cochabamba & Valles (Abasto)", countryCode: "BO", city: "Cochabamba", flag: "🇧🇴" },
];

export default function MandiSpotPrices() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedZone, setSelectedZone] = useState(REGIONAL_ZONES[0]);

  const [locationMeta, setLocationMeta] = useState({
    ip: "Detecting...",
    city: "Delhi & NCR",
    countryCode: "IN",
    country: "India",
  });

  const [marketData, setMarketData] = useState<MandiData | null>(null);

  const fetchSpotPrices = async (countryCode: string, city: string) => {
    try {
      // 1. Try local Next.js /api/mandi/spot-prices (which proxies to localhost FastAPI)
      const res = await axios.get(
        `/api/mandi/spot-prices?country_code=${countryCode}&city=${encodeURIComponent(city)}`,
        { timeout: 5000 }
      );
      if (res.data && res.data.items && res.data.items.length > 0) {
        setMarketData(res.data);
        return;
      }
    } catch (err) {
      // Fallback directly to localhost FastAPI
      try {
        const fastRes = await axios.get(
          `http://127.0.0.1:8000/mandi/spot-prices?country_code=${countryCode}&city=${encodeURIComponent(city)}`,
          { timeout: 4000 }
        );
        if (fastRes.data && fastRes.data.items && fastRes.data.items.length > 0) {
          setMarketData(fastRes.data);
          return;
        }
      } catch (err2) {}
    }
  };

  const resolveLocationAndSync = async (zoneOverride?: typeof REGIONAL_ZONES[0]) => {
    setRefreshing(true);
    const targetZone = zoneOverride || selectedZone;

    try {
      if (!zoneOverride) {
        try {
          const ipRes = await axios.get("https://ipapi.co/json/", { timeout: 3500 });
          if (ipRes.data) {
            const cc = ipRes.data.country_code || "IN";
            const cityName = ipRes.data.city || "Delhi";
            setLocationMeta({
              ip: ipRes.data.ip || "127.0.0.1",
              city: cityName,
              countryCode: cc,
              country: ipRes.data.country_name || "India",
            });
            const matchingZone = REGIONAL_ZONES.find(
              (z) => z.countryCode.toUpperCase() === cc.toUpperCase()
            ) || REGIONAL_ZONES[0];
            setSelectedZone(matchingZone);
            await fetchSpotPrices(matchingZone.countryCode, matchingZone.city);
            return;
          }
        } catch {}
      }

      await fetchSpotPrices(targetZone.countryCode, targetZone.city);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    resolveLocationAndSync();

    // Auto-refresh dynamic rates every 60 seconds
    const interval = setInterval(() => {
      fetchSpotPrices(selectedZone.countryCode, selectedZone.city);
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const handleZoneChange = (zoneId: string) => {
    const zone = REGIONAL_ZONES.find((z) => z.id === zoneId) || REGIONAL_ZONES[0];
    setSelectedZone(zone);
    setRefreshing(true);
    fetchSpotPrices(zone.countryCode, zone.city).finally(() => setRefreshing(false));
  };

  const categories = ["all", "Cereal", "Oilseed", "Vegetable", "Input"];

  const filteredItems = useMemo(() => {
    if (!marketData?.items) return [];
    return marketData.items.filter((item) => {
      const matchSearch =
        item.name_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.name_local.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.variety.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat =
        selectedCategory === "all" ||
        item.category.toLowerCase() === selectedCategory.toLowerCase();
      return matchSearch && matchCat;
    });
  }, [marketData, searchQuery, selectedCategory]);

  const currentDateFormatted = new Date().toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 md:p-6 shadow-sm space-y-5">
      {/* ── TOP HEADER WITH LOCATION & LIVE STATUS ─────────────────────────── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5">
              Live Mandi Spot Prices
            </Badge>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>TractorAI Daily Live Sync</span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                {currentDateFormatted}
              </span>
            </div>
          </div>
          <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-600" />
            {marketData?.zoneName || selectedZone.name}
          </h2>
          <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              {selectedZone.city} ({selectedZone.countryCode === "IN" ? "India" : "Bolivia"}) •{" "}
              {marketData?.status || "Live Floor Open"}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          {/* Zone Selector */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-700">
            {REGIONAL_ZONES.map((zone) => (
              <button
                key={zone.id}
                onClick={() => handleZoneChange(zone.id)}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                  selectedZone.id === zone.id
                    ? "bg-white dark:bg-slate-900 text-emerald-600 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
                title={zone.name}
              >
                <span>{zone.flag}</span>
                <span className="hidden sm:inline">{zone.city}</span>
              </button>
            ))}
          </div>

          <Link href="/farmer/mandi">
            <Button
              size="sm"
              variant="outline"
              className="border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-xs font-bold rounded-xl flex items-center gap-1.5"
            >
              <span>Analytics</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
          <Button
            size="sm"
            variant="outline"
            onClick={() => resolveLocationAndSync(selectedZone)}
            disabled={refreshing}
            className="border-slate-200 dark:border-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-emerald-600" : ""}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* ── AI MARKET ADVISORY NOTE ────────────────────────────────────────── */}
      {marketData?.aiAdvice && (
        <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-2.5 shadow-sm">
          <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-extrabold text-[11px] uppercase tracking-wide text-emerald-800 dark:text-emerald-300 block">
              TractorAI Daily Market Advisory
            </span>
            <span className="font-medium leading-relaxed">{marketData.aiAdvice}</span>
          </div>
        </div>
      )}

      {/* ── SEARCH & CATEGORY FILTER ───────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              {cat === "all" ? "All Commodities" : cat}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            type="text"
            placeholder="Search crop / variety..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-xs rounded-xl border-slate-200 dark:border-slate-700 h-8"
          />
        </div>
      </div>

      {/* ── COMMODITY SPOT CARDS ───────────────────────────────────────────── */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400 space-y-2">
          <Sparkles className="w-6 h-6 text-emerald-600 animate-spin mx-auto" />
          <p>Calculating live daily dynamic commodity spot prices with TractorAI...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400">
          No commodities found matching your query.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const isUp = item.isUp;
            return (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-md transition-all space-y-3"
              >
                {/* Header: Icon, Name & Trend */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight">
                        {item.name_en}
                      </h3>
                      <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
                        {item.name_local}
                      </p>
                    </div>
                  </div>

                  <Badge
                    className={`text-[10px] font-black px-2 py-0.5 flex items-center gap-0.5 ${
                      isUp
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                        : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                    }`}
                  >
                    {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {item.trend}
                  </Badge>
                </div>

                {/* Spot Price & Rate/Kg */}
                <div className="flex items-baseline justify-between pt-1">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Spot Rate</span>
                    <div className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">
                      {item.formattedPrice}
                      <span className="text-xs text-slate-400 font-normal ml-1">{item.unit}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Unit Rate</span>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{item.ratePerKg}</p>
                  </div>
                </div>

                {/* Min - Max Range Bar */}
                <div className="space-y-1 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                  <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                    <span>
                      Min: {marketData?.currencySymbol}
                      {item.minPrice.toLocaleString()}
                    </span>
                    <span>
                      Max: {marketData?.currencySymbol}
                      {item.maxPrice.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(
                            20,
                            ((item.price - item.minPrice) / (item.maxPrice - item.minPrice || 1)) * 100
                          )
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Forecast / Inflow */}
                <div className="flex items-center justify-between text-[10px] pt-1 text-slate-400">
                  <span>Arrival: {item.arrival_volume}</span>
                  <span className="text-emerald-600 font-semibold truncate max-w-[170px]" title={item.forecast}>
                    {item.forecast}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
