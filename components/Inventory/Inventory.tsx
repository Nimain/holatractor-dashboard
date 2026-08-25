"use client";

import { useCookie } from "next-cookie";
import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import axios from "axios";
import { renderInstance } from "@/utils/Axios/RenderInstance";
import { Inventory } from "@/utils/Types/types";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Tractor,
  Plus,
  Search,
  RefreshCw,
  LayoutGrid,
  List as ListIcon,
  MapPin,
  Calendar,
  Layers,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  DollarSign,
} from "lucide-react";

const InventorySection = () => {
  const [allTractors, setAllTractors] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  const { cookie } = useCookie();
  const access_token = cookie.get("access_token");

  const fetchAllTractors = useCallback(async () => {
    setLoading(true);
    let loaded = false;

    // 1. Try Next.js API route first
    try {
      const res = await axios.get("/api/inventory", {
        headers: access_token ? { Authorization: `Bearer ${access_token}` } : {},
        timeout: 6000,
      });
      if (Array.isArray(res.data)) {
        setAllTractors(res.data);
        loaded = true;
      }
    } catch (apiErr) {
      console.warn("Local inventory fetch notice:", apiErr);
    }

    // 2. Fallback to renderInstance (NestJS)
    if (!loaded) {
      try {
        const res = await renderInstance.get("/inventory");
        if (res.status === 200 && Array.isArray(res.data)) {
          setAllTractors(res.data);
          loaded = true;
        }
      } catch (err) {
        console.warn("NestJS inventory fetch notice:", err);
      }
    }

    setLoading(false);
  }, [access_token]);

  useEffect(() => {
    fetchAllTractors();
  }, [fetchAllTractors]);

  // Filtered tractors
  const filteredTractors = useMemo(() => {
    return allTractors.filter((item) => {
      const q = searchQuery.toLowerCase();
      const t = item.tractor;
      const matchesSearch =
        q === "" ||
        t?.name?.toLowerCase().includes(q) ||
        t?.model?.toLowerCase().includes(q) ||
        t?.type?.toLowerCase().includes(q) ||
        item.city?.toLowerCase().includes(q);

      const matchesType =
        typeFilter === "all" ||
        t?.type?.toLowerCase() === typeFilter.toLowerCase();

      return matchesSearch && matchesType;
    });
  }, [allTractors, searchQuery, typeFilter]);

  // Quick stats
  const stats = useMemo(() => {
    const total = allTractors.length;
    const heavyCount = allTractors.filter(
      (t) => t.tractor?.type?.toLowerCase() === "large" || t.tractor?.type?.toLowerCase() === "heavy"
    ).length;
    const mediumCount = allTractors.filter(
      (t) => t.tractor?.type?.toLowerCase() === "medium"
    ).length;
    const smallCount = allTractors.filter(
      (t) => t.tractor?.type?.toLowerCase() === "small"
    ).length;
    return { total, heavyCount, mediumCount, smallCount };
  }, [allTractors]);

  return (
    <div className="w-full py-6 space-y-6 max-w-7xl mx-auto">
      {/* 1. Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Tractor className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                Tractor Inventory Fleet
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
                  {allTractors.length} Units
                </span>
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Master inventory catalog of tractors, machinery specs, base rates, and availability.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAllTractors}
            disabled={loading}
            className="rounded-xl border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 gap-2 h-10 px-4"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-600" : ""}`} />
            Refresh
          </Button>

          <Link href="/Inventory/new">
            <Button className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-2 h-10 px-5 shadow-lg shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
              <Plus className="w-4 h-4" />
              Add New Inventory
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center font-bold">
            <Tractor className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Fleet</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center font-bold">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Heavy Duty</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">{stats.heavyCount}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 flex items-center justify-center font-bold">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Medium Duty</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">{stats.mediumCount}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Utility / Small</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">{stats.smallCount}</p>
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search inventory by tractor name, model, city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-xl h-10 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
            {["all", "small", "medium", "large"].map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 rounded-lg capitalize font-medium transition-all ${
                  typeFilter === t
                    ? "bg-white dark:bg-slate-700 text-blue-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {t === "all" ? "All Types" : t}
              </button>
            ))}
          </div>

          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === "grid"
                  ? "bg-white dark:bg-slate-700 text-blue-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === "table"
                  ? "bg-white dark:bg-slate-700 text-blue-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
              title="Table View"
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Content Display */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 animate-pulse"
            >
              <div className="w-full h-40 bg-slate-100 dark:bg-slate-800 rounded-xl" />
              <div className="h-5 bg-slate-100 dark:bg-slate-800 rounded w-2/3" />
              <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredTractors.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 mx-auto flex items-center justify-center">
            <Tractor className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Tractors Found</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
              {searchQuery
                ? `No inventory matching "${searchQuery}".`
                : "No tractor inventory units have been added yet."}
            </p>
          </div>
          <Link href="/Inventory/new">
            <Button className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold">
              <Plus className="w-4 h-4 mr-2" /> Add First Tractor
            </Button>
          </Link>
        </div>
      ) : viewMode === "grid" ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTractors.map((item) => {
            const t = item.tractor;
            const img =
              Array.isArray(t?.images) && t.images.length > 0
                ? t.images[0]
                : "https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?w=800&q=80";

            return (
              <div
                key={item.id}
                className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 overflow-hidden flex flex-col justify-between"
              >
                {/* Image */}
                <div className="relative h-44 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <img
                    src={img}
                    alt={t?.name || "Tractor"}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                  {/* Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white border border-white/10 flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-blue-400" />
                      {item.city || "Regional"}
                    </span>

                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-500 text-white shadow-sm capitalize">
                      {t?.type || "Medium"}
                    </span>
                  </div>

                  <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="text-lg font-bold text-white tracking-tight truncate">
                      {t?.name || "Tractor Unit"}
                    </h3>
                  </div>
                </div>

                {/* Body */}
                <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Model:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {t?.model || "Standard"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Base Rental Rate:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                        ${item.fixedPrice || 50}/hr
                      </span>
                    </div>

                    {t?.year && (
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Year:</span>
                        <span>{new Date(t.year).getFullYear() || "2024"}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                    <Link
                      href={`/Inventory/${item.id}`}
                      className="w-full text-center py-2 px-3 rounded-xl bg-slate-900 hover:bg-blue-600 text-white font-medium text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      View Inventory Specs
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                  <th className="py-3.5 px-4">Tractor Machine</th>
                  <th className="py-3.5 px-4">Model</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4 text-center">Hourly Rate</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {filteredTractors.map((item) => {
                  const t = item.tractor;
                  const img =
                    Array.isArray(t?.images) && t.images.length > 0
                      ? t.images[0]
                      : "https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?w=800&q=80";

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={img}
                            alt={t?.name || "Tractor"}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-800"
                          />
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white leading-tight">
                              {t?.name || "Tractor Unit"}
                            </p>
                            <p className="text-xs text-slate-400 line-clamp-1 max-w-xs mt-0.5">
                              {t?.description || "High efficiency agricultural tractor"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-slate-300">
                        {t?.model || "Standard"}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="capitalize font-semibold text-xs px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
                          {t?.type || "Medium"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{item.city || "Buenos Aires"}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                        ${item.fixedPrice || 50}/hr
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/Inventory/${item.id}`}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-600 hover:text-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors inline-flex items-center gap-1"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventorySection;