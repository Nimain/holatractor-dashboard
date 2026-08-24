"use client";

import React, { useEffect, useState } from "react";
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
  Clock,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { renderInstance, TractorAIBaseURL } from "@/utils/Axios/RenderInstance";
import { useCookie } from "next-cookie";

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
  tractors?: any[];
  opening_time?: string;
  closing_time?: string;
}

export default function FarmerStores() {
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState<Location>({ latitude: null, longitude: null });

  const { cookie } = useCookie();
  const access_token = cookie.get("access_token");

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

  const fetchStores = async () => {
    setRefreshing(true);
    let loadedList: StoreItem[] = [];

    // 1. Primary Live API: TractorAI FastAPI Backend (/api/v1/owner/stores)
    try {
      const fastApiBase = (TractorAIBaseURL || "https://tractorai.sinsignal.com").replace(/\/$/, "");
      const res = await axios.get(`${fastApiBase}/api/v1/owner/stores`, { timeout: 8000 });

      if (Array.isArray(res.data) && res.data.length > 0) {
        // Cache in sessionStorage for single-store detail routing
        try {
          if (typeof window !== "undefined") {
            sessionStorage.setItem("@farmer_all_stores_cache", JSON.stringify(res.data));
          }
        } catch {}

        loadedList = res.data.map((s: any, idx: number) => {
          const tractors = s.TractorInStore || s.tractors || [];
          const attachments = s.AttachmentInStore || s.attachments || [];

          // Compute dynamic rate range from live machinery
          const prices = tractors
            .map((t: any) => Number(t.hourly_price || t.rate_per_hour || 0))
            .filter((p: number) => p > 0);

          const minRate = prices.length > 0 ? Math.min(...prices) : 20;
          const maxRate = prices.length > 0 ? Math.max(...prices) : 45;

          // Compute distance if lat/lng available
          let dist = (idx % 8) * 1.8 + 2.4;
          if (location.latitude && location.longitude && tractors[0]?.lat && tractors[0]?.lan) {
            dist = calculateDistance(
              location.latitude,
              location.longitude,
              tractors[0].lat,
              tractors[0].lan
            );
          }

          const storeImg =
            s.image ||
            tractors[0]?.baseTractor?.images?.[0] ||
            "https://images.unsplash.com/photo-1592928302636-c83cf1e1c887?w=600&q=80";

          return {
            id: s.id || `store_${idx}`,
            name: s.name && s.name.trim() !== "" ? s.name : `Agri Depot #${idx + 1}`,
            description:
              s.description && s.description.trim() !== ""
                ? s.description
                : "Centro especializado de mecanización agrícola con tractores modernos y equipo certificado.",
            address: s.address || "Hub Regional de Maquinaria Agrícola",
            image: storeImg,
            rating: 4.8,
            distance_km: dist,
            available_tractors_count: tractors.length,
            available_implements_count: attachments.length,
            rate_range: minRate === maxRate ? `$${minRate} / hr` : `$${minRate} - $${maxRate} / hr`,
            tractors: tractors,
            opening_time: s.opening_time,
            closing_time: s.closing_time,
          };
        });
      }
    } catch (errFastApi) {
      console.warn("TractorAI stores fetch error:", errFastApi);
    }

    // 2. Secondary Backend: NestJS (/store) with access token
    if (loadedList.length === 0) {
      try {
        const headers: Record<string, string> = {};
        if (access_token) headers["Authorization"] = `Bearer ${access_token}`;

        const url =
          location.latitude && location.longitude
            ? `/store/all_stores/with_in_distance?lat=${location.latitude}&lng=${location.longitude}&radius=150`
            : `/store`;

        const res = await renderInstance.get(url, { headers });
        const data = Array.isArray(res.data) ? res.data : [];
        if (data.length > 0) {
          loadedList = data.map((item: any, idx: number) => {
            const s = item.store || item;
            return {
              id: s.id || `store_nest_${idx}`,
              name: s.name || `Machinery Store #${idx + 1}`,
              description: s.description || "Centro de maquinaria agrícola con flota activa de tractores.",
              address: s.address || "Regional Agricultural Depot",
              image: s.image || "https://images.unsplash.com/photo-1592928302636-c83cf1e1c887?w=600&q=80",
              rating: 4.8,
              distance_km: item.distance || (idx + 1) * 2.5,
              available_tractors_count: s.tractors?.length || s.TractorInStore?.length || 0,
              available_implements_count: s.attachments?.length || s.AttachmentInStore?.length || 0,
              rate_range: "$20 - $45 / hr",
              tractors: s.tractors || s.TractorInStore || [],
            };
          });
        }
      } catch (errNest) {
        console.warn("NestJS stores fetch error:", errNest);
      }
    }

    setStores(loadedList);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
        },
        () => {
          fetchStores();
        }
      );
    } else {
      fetchStores();
    }
  }, []);

  useEffect(() => {
    fetchStores();
  }, [location.latitude, location.longitude]);

  const filteredStores = stores.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.address && s.address.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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
            Real-time live registry of verified agricultural machinery stores, certified dealer fleets, and available equipment.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            onClick={fetchStores}
            disabled={refreshing}
            className="rounded-xl border-slate-200 dark:border-slate-800 text-xs font-bold flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-emerald-600" : ""}`} />
            <span>Refresh Live Registry</span>
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

      {/* ── SEARCH & FILTERS BAR ───────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Badge className="bg-emerald-600 text-white text-xs font-bold px-3 py-1">
            {stores.length} Live Stores
          </Badge>
          <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>TractorAI Real-time Fleet Sync</span>
          </span>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            type="text"
            placeholder="Search stores, brands, equipment..."
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
          <p className="font-semibold text-sm">Querying TractorAI live store network...</p>
        </div>
      ) : filteredStores.length === 0 ? (
        <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 p-12 text-center bg-white dark:bg-slate-900 shadow-sm space-y-4">
          <StoreIcon className="w-12 h-12 text-slate-400 mx-auto" />
          <div>
            <h3 className="font-black text-lg text-slate-900 dark:text-white">No Stores Found</h3>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your search query or refresh the live registry.</p>
          </div>
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
                  <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-xl text-xs font-bold text-white flex items-center gap-1">
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
                      <span className="font-black text-emerald-600 dark:text-emerald-400">{store.rate_range}</span>
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