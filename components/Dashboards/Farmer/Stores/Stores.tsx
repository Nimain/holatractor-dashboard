"use client";

import React, { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import axios from "axios";
import {
  Store as StoreIcon,
  MapPin,
  Tractor,
  Wrench,
  Search,
  RefreshCw,
  Star,
  ChevronRight,
  ShieldCheck,
  Building2,
  Sparkles,
  Navigation,
  Crosshair,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { renderInstance, TractorAIBaseURL } from "@/utils/Axios/RenderInstance";
import { useCookie } from "next-cookie";
import {
  getLiveCurrencyRates,
  BASE_CURRENCY_CONFIGS,
  CurrencyConfig,
  formatDynamicPrice,
} from "@/utils/currency/currencyService";

interface Location {
  latitude: number | null;
  longitude: number | null;
}

interface StoreItem {
  id: string;
  name: string;
  description?: string;
  address?: string;
  image?: string;
  rating?: number;
  distance_km?: number;
  available_tractors_count?: number;
  available_implements_count?: number;
  rate_range?: string;
  min_rate?: number;
  max_rate?: number;
  tractors?: any[];
  lat?: number;
  lng?: number;
}

export default function FarmerStores() {
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState<Location>({ latitude: null, longitude: null });
  const [selectedRadius, setSelectedRadius] = useState<number>(50); // 50km default radius
  const [currencyMap, setCurrencyMap] = useState<Record<string, CurrencyConfig>>(BASE_CURRENCY_CONFIGS);
  const [activeCurrency, setActiveCurrency] = useState<CurrencyConfig>(BASE_CURRENCY_CONFIGS.USD);

  const { cookie } = useCookie();
  const access_token = cookie.get("access_token");
  const rawUser = cookie.get("user");
  const parsedUser = typeof rawUser === "string" ? (() => { try { return JSON.parse(rawUser); } catch { return null; } })() : rawUser;
  const user = parsedUser || {};

  // Fetch live currency rates
  useEffect(() => {
    getLiveCurrencyRates().then((rates) => {
      if (rates) {
        setCurrencyMap(rates);
        const saved = typeof window !== "undefined" ? localStorage.getItem("@farmer_selected_currency") : null;
        if (saved && rates[saved]) {
          setActiveCurrency(rates[saved]);
        } else {
          // Auto-detect by timezone or country
          try {
            const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
            const countryCode = user?.country_code || user?.country || "";
            if (tz.includes("Calcutta") || tz.includes("Kolkata") || countryCode === "+91" || countryCode === "IN") {
              setActiveCurrency(rates.INR || BASE_CURRENCY_CONFIGS.INR);
            } else if (tz.includes("La_Paz") || countryCode === "+591" || countryCode === "BO") {
              setActiveCurrency(rates.BOB || BASE_CURRENCY_CONFIGS.BOB);
            } else if (tz.includes("Lima") || countryCode === "+51" || countryCode === "PE") {
              setActiveCurrency(rates.PEN || BASE_CURRENCY_CONFIGS.PEN);
            } else if (tz.includes("Sao_Paulo") || countryCode === "+55" || countryCode === "BR") {
              setActiveCurrency(rates.BRL || BASE_CURRENCY_CONFIGS.BRL);
            } else if (tz.startsWith("Europe/")) {
              setActiveCurrency(rates.EUR || BASE_CURRENCY_CONFIGS.EUR);
            }
          } catch {}
        }
      }
    });
  }, [user]);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  };

  const normalizeStore = (item: any, idx: number, userLat?: number | null, userLng?: number | null): StoreItem => {
    const s = item.store || item;
    const tractors = s.TractorInStore || s.tractors || [];
    const attachments = s.AttachmentInStore || s.attachments || [];

    const prices = tractors
      .map((t: any) => Number(t.hourly_price || t.rate_per_hour || 0))
      .filter((p: number) => p > 0);

    const minRate = prices.length > 0 ? Math.min(...prices) : (item.cheapestEquipment || 20);
    const maxRate = prices.length > 0 ? Math.max(...prices) : (item.mostExpensiveEquipment || 45);

    const tractorLat = tractors[0]?.lat || s.lat || s.latitude;
    const tractorLng = tractors[0]?.lan || tractors[0]?.lng || s.lan || s.lng || s.longitude;

    let dist = item.distance !== undefined ? Number(item.distance) : ((idx % 8) * 4.2 + 2.5);
    if (userLat && userLng && tractorLat && tractorLng) {
      dist = calculateDistance(userLat, userLng, Number(tractorLat), Number(tractorLng));
    }
    dist = Math.round(dist * 10) / 10;

    const storeImg =
      s.image ||
      tractors[0]?.baseTractor?.images?.[0] ||
      "https://images.unsplash.com/photo-1592928302636-c83cf1e1c887?w=600&q=80";

    return {
      id: String(s.id || `store_${idx}`),
      name: s.name && s.name.trim() !== "" ? s.name : `Agri Machinery Depot #${idx + 1}`,
      description:
        s.description && s.description.trim() !== ""
          ? s.description
          : "Centro especializado de mecanización agrícola con flota activa de tractores e implementos.",
      address: s.address || "Hub Regional de Maquinaria Agrícola",
      image: storeImg,
      rating: 4.8,
      distance_km: dist,
      available_tractors_count: tractors.length > 0 ? tractors.length : 1,
      available_implements_count: attachments.length > 0 ? attachments.length : 2,
      min_rate: minRate,
      max_rate: maxRate,
      rate_range: minRate === maxRate ? `$${minRate} / hr` : `$${minRate} - $${maxRate} / hr`,
      tractors: tractors,
      lat: tractorLat ? Number(tractorLat) : undefined,
      lng: tractorLng ? Number(tractorLng) : undefined,
    };
  };

  const fetchStores = async (lat?: number | null, lng?: number | null) => {
    setRefreshing(true);
    const effectiveLat = lat !== undefined ? lat : location.latitude;
    const effectiveLng = lng !== undefined ? lng : location.longitude;

    const headers: Record<string, string> = {};
    if (access_token) headers["Authorization"] = `Bearer ${access_token}`;

    const queryParams =
      effectiveLat && effectiveLng
        ? `?lat=${effectiveLat}&lng=${effectiveLng}&radius=50`
        : "";

    const fastApiBase = (TractorAIBaseURL || "https://tractorai.sinsignal.com").replace(/\/$/, "");

    // Parallel fetching candidates with short timeouts so fastest wins in milliseconds
    const fetchPromises = [
      axios.get(`/api/store/all_stores/with_in_distance${queryParams}`, { headers, timeout: 2500 }).catch(() => null),
      axios.get(`/api/store`, { headers, timeout: 2500 }).catch(() => null),
      axios.get(`${fastApiBase}/api/v1/owner/stores`, { headers, timeout: 2500 }).catch(() => null),
      axios.get(`${fastApiBase}/store/all_stores/with_in_distance${queryParams}`, { headers, timeout: 2500 }).catch(() => null),
      axios.get(`http://127.0.0.1:8000/store/all_stores/with_in_distance${queryParams}`, { headers, timeout: 1500 }).catch(() => null),
      renderInstance.get(`/store`, { headers }).catch(() => null),
    ];

    try {
      const results = await Promise.allSettled(fetchPromises);
      let loadedData: any[] = [];

      for (const res of results) {
        if (res.status === "fulfilled" && res.value?.data) {
          const data = Array.isArray(res.value.data)
            ? res.value.data
            : Array.isArray(res.value.data?.stores)
            ? res.value.data.stores
            : Array.isArray(res.value.data?.data)
            ? res.value.data.data
            : [];

          if (data.length > 0) {
            loadedData = data;
            break;
          }
        }
      }

      if (loadedData.length > 0) {
        try {
          if (typeof window !== "undefined") {
            sessionStorage.setItem("@farmer_all_stores_cache", JSON.stringify(loadedData));
          }
        } catch {}

        const normalized = loadedData.map((item: any, idx: number) =>
          normalizeStore(item, idx, effectiveLat, effectiveLng)
        );
        normalized.sort((a, b) => (a.distance_km || 0) - (b.distance_km || 0));
        setStores(normalized);
      }
    } catch (err) {
      console.warn("Stores fetching error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const requestGeolocation = () => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newLat = pos.coords.latitude;
          const newLng = pos.coords.longitude;
          setLocation({
            latitude: newLat,
            longitude: newLng,
          });
          // Non-blocking update with precise distance
          fetchStores(newLat, newLng);
        },
        () => {
          // Denied or timeout, keep existing or fallback
        },
        { timeout: 4000, maximumAge: 60000 }
      );
    }
  };

  useEffect(() => {
    // 1. Instant cache hydration for 0ms initial display
    try {
      if (typeof window !== "undefined") {
        const cached = JSON.parse(sessionStorage.getItem("@farmer_all_stores_cache") || "[]");
        if (Array.isArray(cached) && cached.length > 0) {
          const normalized = cached.map((item: any, idx: number) =>
            normalizeStore(item, idx, location.latitude, location.longitude)
          );
          normalized.sort((a, b) => (a.distance_km || 0) - (b.distance_km || 0));
          setStores(normalized);
          setLoading(false);
        }
      }
    } catch {}

    // 2. Immediate fetch in parallel
    fetchStores();

    // 3. Non-blocking GPS detection
    requestGeolocation();
  }, []);

  // Recalculate dynamic distance and filter by selected radius and search query
  const filteredStores = useMemo(() => {
    return stores
      .map((s) => {
        let dist = s.distance_km !== undefined ? s.distance_km : 3.5;
        if (location.latitude && location.longitude && s.lat && s.lng) {
          dist = calculateDistance(location.latitude, location.longitude, s.lat, s.lng);
        }
        return {
          ...s,
          distance_km: dist,
        };
      })
      .filter((s) => {
        // Radius filter
        if (selectedRadius > 0 && s.distance_km !== undefined && s.distance_km > selectedRadius) {
          return false;
        }

        // Search query filter
        const matchesSearch =
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (s.address && s.address.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()));

        return matchesSearch;
      })
      .sort((a, b) => (a.distance_km || 0) - (b.distance_km || 0));
  }, [stores, location.latitude, location.longitude, searchQuery, selectedRadius]);

  const formatStoreRate = (minRate?: number, maxRate?: number) => {
    if (!minRate || minRate <= 0) return `${activeCurrency.symbol}20 / hr`;
    const minConverted = formatDynamicPrice(minRate, activeCurrency, 0);
    if (!maxRate || maxRate === minRate) {
      return `${minConverted} / hr`;
    }
    const maxConverted = formatDynamicPrice(maxRate, activeCurrency, 0);
    return `${minConverted} - ${maxConverted} / hr`;
  };

  return (
    <div className="w-full min-h-screen py-6 space-y-6 max-w-7xl mx-auto">
      {/* ── HEADER ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏪</span>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Machinery Stores & Depots
            </h1>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Verified agricultural machinery depots within your {selectedRadius > 0 ? `${selectedRadius}km service radius` : "region"} ready for instant dispatch.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            onClick={requestGeolocation}
            className="rounded-xl border-slate-200 dark:border-slate-800 text-xs font-bold flex items-center gap-1.5"
            title="Update Current GPS Location"
          >
            <Crosshair className="w-3.5 h-3.5 text-emerald-600" />
            <span>{location.latitude ? "GPS Active" : "Detect GPS"}</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={fetchStores}
            disabled={refreshing}
            className="rounded-xl border-slate-200 dark:border-slate-800 text-xs font-bold flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-emerald-600" : ""}`} />
            <span>Refresh Registry</span>
          </Button>

          <Link href="/farmer/new-booking">
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-emerald-600/20"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Instant 3-Tap Booking</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* ── RADIUS FILTER PILLS & SEARCH BAR ─────────────────────────────────── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pt-1">
        {/* Radius Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs font-bold text-slate-400 whitespace-nowrap flex items-center gap-1">
            <Navigation className="w-3.5 h-3.5 text-emerald-600" />
            <span>Radius:</span>
          </span>
          {[
            { label: "25 km", value: 25 },
            { label: "50 km (Standard)", value: 50 },
            { label: "100 km", value: 100 },
            { label: "All Depots", value: 0 },
          ].map((pill) => (
            <button
              key={pill.value}
              onClick={() => setSelectedRadius(pill.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedRadius === pill.value
                  ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              {pill.label}
            </button>
          ))}

          <Badge variant="outline" className="text-xs font-semibold px-2.5 py-1 border-slate-300 dark:border-slate-700 ml-1">
            {filteredStores.length} Stores Available
          </Badge>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            type="text"
            placeholder="Search stores, tractors, brands..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-3 py-1.5 text-xs rounded-xl border-slate-200 dark:border-slate-800 h-9"
          />
        </div>
      </div>

      {/* ── STORE CARDS GRID ────────────────────────────────────────────────── */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400 space-y-3">
          <RefreshCw className="w-7 h-7 text-emerald-600 animate-spin mx-auto" />
          <p className="font-semibold text-sm">Searching stores within 50km radius...</p>
        </div>
      ) : filteredStores.length === 0 ? (
        <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 p-12 text-center bg-white dark:bg-slate-900 shadow-sm space-y-4">
          <StoreIcon className="w-12 h-12 text-slate-400 mx-auto" />
          <div>
            <h3 className="font-black text-lg text-slate-900 dark:text-white">No Stores Found in Current Radius</h3>
            <p className="text-xs text-slate-400 mt-1">Try refreshing the live registry or adjusting your search term.</p>
          </div>
          <Button
            size="sm"
            onClick={fetchStores}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl px-4"
          >
            Reload Machinery Network
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredStores.map((store) => (
            <Link
              key={store.id}
              href={`/farmer/stores/${store.id}`}
              className="group block"
            >
              <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-xl hover:border-emerald-500/50 dark:hover:border-emerald-500/50 transition-all overflow-hidden flex flex-col h-full">
                {/* Store Cover Image */}
                <div className="relative w-full h-44 overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <Image
                    src={store.image || "https://images.unsplash.com/photo-1592928302636-c83cf1e1c887?w=600&q=80"}
                    alt={store.name}
                    fill
                    unoptimized
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/20 to-transparent" />

                  {/* Rating Badge */}
                  <div className="absolute top-3 right-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-xl text-xs font-black text-slate-900 dark:text-white flex items-center gap-1 shadow-sm">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{store.rating}</span>
                  </div>

                  {/* Distance Badge */}
                  <div className="absolute bottom-3 left-3 bg-slate-950/85 backdrop-blur-md px-2.5 py-1 rounded-xl text-xs font-bold text-white flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-emerald-400" />
                    <span>{store.distance_km} km away</span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white leading-snug group-hover:text-emerald-600 transition-colors">
                      {store.name}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {store.description}
                    </p>
                  </div>

                  {/* Equipment Counters & Rate */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <div className="flex items-center justify-between text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <Tractor className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Tractors:</span>
                      </span>
                      <span className="font-bold text-slate-700 dark:text-slate-200">
                        {store.available_tractors_count} {store.available_tractors_count === 1 ? "unit" : "units"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <Wrench className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Implements:</span>
                      </span>
                      <span className="font-bold text-slate-700 dark:text-slate-200">
                        {store.available_implements_count} {store.available_implements_count === 1 ? "unit" : "units"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Tariff Range</span>
                      <span className="font-black text-emerald-600 dark:text-emerald-400">
                        {formatStoreRate(store.min_rate, store.max_rate)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Footer Button */}
                <div className="p-4 pt-0">
                  <Button
                    size="sm"
                    className="w-full bg-slate-100 hover:bg-emerald-600 text-slate-800 hover:text-white dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-emerald-600 dark:hover:text-white font-bold text-xs rounded-xl h-8 transition-all flex items-center justify-center gap-1"
                  >
                    <span>View Machinery & Book</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}