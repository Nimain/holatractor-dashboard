"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import axios from "axios";
import { useCookie } from "next-cookie";
import { errorMessage, successMessage } from "@/utils/Toastify/Messages";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import {
  Tractor,
  Store as StoreIcon,
  Search,
  Plus,
  RefreshCw,
  Edit3,
  Trash2,
  Eye,
  DollarSign,
  Layers,
  LayoutGrid,
  List as ListIcon,
  MapPin,
  Calendar,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Info,
} from "lucide-react";

export interface StoreTractorItem {
  id: string;
  hourly_price: number;
  createdAt: string;
  updatedAt?: string;
  store_id: string;
  baseTractor?: {
    id: string;
    name: string;
    model?: string;
    type?: string;
    description?: string;
    year?: string | null;
    images?: string[];
  };
  store?: {
    id: string;
    name: string;
    description?: string;
    image?: string;
    location_id?: string;
  };
}

const StoreTractors = () => {
  const [storeTractors, setStoreTractors] = useState<StoreTractorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStoreFilter, setSelectedStoreFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Admin action modals
  const [viewItem, setViewItem] = useState<StoreTractorItem | null>(null);
  const [editItem, setEditItem] = useState<StoreTractorItem | null>(null);
  const [editPrice, setEditPrice] = useState<number>(20);
  const [isUpdating, setIsUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Add Tractor Modal state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [storesList, setStoresList] = useState<{ id: string; name: string }[]>([]);
  const [catalogTractors, setCatalogTractors] = useState<{ id: string; name: string; model: string }[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState("");
  const [selectedCatalogId, setSelectedCatalogId] = useState("");
  const [newHourlyPrice, setNewHourlyPrice] = useState("25");
  const [isAdding, setIsAdding] = useState(false);

  const { cookie } = useCookie();
  const access_token =
    cookie.get("access_token") ||
    (typeof document !== "undefined"
      ? document.cookie.match(/(?:^|;\s*)access_token=([^;]+)/)?.[1]
      : "");

  // Fetch Store Tractors
  const fetchStoreTractors = useCallback(async () => {
    setLoading(true);
    let loaded = false;

    // 1. Primary: Local Next.js API / PostgreSQL
    try {
      const res = await axios.get("/api/admin/store-tractors", { timeout: 6000 });
      if (res.data?.data && Array.isArray(res.data.data)) {
        setStoreTractors(res.data.data);
        loaded = true;
      }
    } catch (err) {
      console.warn("Direct /api/admin/store-tractors error:", err);
    }

    // 2. Secondary fallback
    if (!loaded) {
      try {
        const res = await axios.get("/api/store-tractors", { timeout: 6000 });
        if (res.data?.data && Array.isArray(res.data.data)) {
          setStoreTractors(res.data.data);
          loaded = true;
        }
      } catch (_) {}
    }

    setLoading(false);
  }, []);

  // Fetch stores & catalog tractors for Add dialog
  const fetchAddOptions = useCallback(async () => {
    try {
      const [storesRes, tractorsRes] = await Promise.all([
        axios.get("/api/admin/stores"),
        axios.get("/api/inventory"),
      ]);

      if (Array.isArray(storesRes.data)) {
        setStoresList(storesRes.data.map((s: any) => ({ id: s.id, name: s.name })));
        if (storesRes.data.length > 0) setSelectedStoreId(storesRes.data[0].id);
      }

      if (Array.isArray(tractorsRes.data)) {
        const uniqueTractors = tractorsRes.data.map((inv: any) => ({
          id: inv.tractor?.id || inv.id,
          name: inv.tractor?.name || "Tractor",
          model: inv.tractor?.model || "Standard",
        }));
        setCatalogTractors(uniqueTractors);
        if (uniqueTractors.length > 0) setSelectedCatalogId(uniqueTractors[0].id);
      }
    } catch (e) {
      console.warn("Error fetching add dialog options:", e);
    }
  }, []);

  useEffect(() => {
    fetchStoreTractors();
    fetchAddOptions();
  }, [fetchStoreTractors, fetchAddOptions]);

  // Handle Edit Price
  const handleUpdatePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;

    setIsUpdating(true);
    try {
      const res = await axios.put("/api/admin/store-tractors", {
        id: editItem.id,
        hourly_price: Number(editPrice),
      });

      if (res.data?.success) {
        successMessage("Hourly rental price updated successfully!");
        setStoreTractors((prev) =>
          prev.map((item) =>
            item.id === editItem.id ? { ...item, hourly_price: Number(editPrice) } : item
          )
        );
        setEditItem(null);
      } else {
        errorMessage(res.data?.error || "Failed to update price");
      }
    } catch (err: any) {
      errorMessage(err?.response?.data?.error || "Error updating store tractor");
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle Delete Store Tractor
  const handleDeleteStoreTractor = async (item: StoreTractorItem) => {
    const tName = item.baseTractor?.name || "Tractor";
    const sName = item.store?.name || "Store";

    if (!window.confirm(`Are you sure you want to remove ${tName} from ${sName}?`)) {
      return;
    }

    setDeletingId(item.id);
    try {
      const res = await axios.delete(`/api/admin/store-tractors?id=${item.id}`);
      if (res.data?.success) {
        successMessage(`${tName} removed from store.`);
        setStoreTractors((prev) => prev.filter((t) => t.id !== item.id));
      } else {
        errorMessage(res.data?.error || "Failed to remove tractor");
      }
    } catch (err: any) {
      errorMessage(err?.response?.data?.error || "Error removing tractor from store");
    } finally {
      setDeletingId(null);
    }
  };

  // Handle Add Tractor to Store
  const handleAddTractorToStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStoreId || !selectedCatalogId) {
      errorMessage("Please select both a store and a tractor model.");
      return;
    }

    setIsAdding(true);
    try {
      const res = await axios.post("/api/admin/store-tractors", {
        store_id: selectedStoreId,
        base_tractor_id: selectedCatalogId,
        hourly_price: Number(newHourlyPrice) || 20.0,
      });

      if (res.data?.success) {
        successMessage("Tractor assigned to store successfully!");
        setAddModalOpen(false);
        fetchStoreTractors();
      } else {
        errorMessage(res.data?.error || "Failed to add tractor");
      }
    } catch (err: any) {
      errorMessage(err?.response?.data?.error || "Error assigning tractor to store");
    } finally {
      setIsAdding(false);
    }
  };

  // Extract unique stores for dropdown filter
  const uniqueStores = useMemo(() => {
    const map = new Map<string, string>();
    storeTractors.forEach((st) => {
      if (st.store?.id && st.store?.name) {
        map.set(st.store.id, st.store.name);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [storeTractors]);

  // Filtered store tractors
  const filteredTractors = useMemo(() => {
    return storeTractors.filter((st) => {
      const q = searchQuery.toLowerCase();
      const tName = st.baseTractor?.name?.toLowerCase() || "";
      const tModel = st.baseTractor?.model?.toLowerCase() || "";
      const sName = st.store?.name?.toLowerCase() || "";

      const matchesSearch =
        q === "" || tName.includes(q) || tModel.includes(q) || sName.includes(q);

      const matchesStore =
        selectedStoreFilter === "all" || st.store_id === selectedStoreFilter;

      return matchesSearch && matchesStore;
    });
  }, [storeTractors, searchQuery, selectedStoreFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = storeTractors.length;
    const activeCount = storeTractors.filter((s) => s.hourly_price > 0).length;
    const avgPrice =
      total > 0
        ? Math.round(storeTractors.reduce((acc, s) => acc + (s.hourly_price || 0), 0) / total)
        : 0;
    const totalStores = new Set(storeTractors.map((s) => s.store_id)).size;

    return { total, activeCount, avgPrice, totalStores };
  }, [storeTractors]);

  return (
    <div className="w-full py-6 space-y-6 max-w-7xl mx-auto">
      {/* 1. Top Header & Primary Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-400 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
              <Tractor className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                Store Tractors Fleet
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60">
                  {storeTractors.length} Assigned
                </span>
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Manage tractors assigned to agricultural store hubs, rental rates, and store distribution.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStoreTractors}
            disabled={loading}
            className="rounded-xl border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 gap-2 h-10 px-4"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-amber-600" : ""}`} />
            Refresh
          </Button>

          {/* Quick Add Tractor Modal */}
          <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold gap-2 h-10 px-5 shadow-lg shadow-amber-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
                <Plus className="w-4 h-4" />
                Assign Tractor to Store
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-md p-6 rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                  <Tractor className="w-5 h-5 text-amber-600" />
                  Assign Tractor to Store Hub
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handleAddTractorToStore} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">
                    Target Store Hub *
                  </Label>
                  <select
                    value={selectedStoreId}
                    onChange={(e) => setSelectedStoreId(e.target.value)}
                    required
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {storesList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">
                    Select Tractor Model *
                  </Label>
                  <select
                    value={selectedCatalogId}
                    onChange={(e) => setSelectedCatalogId(e.target.value)}
                    required
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {catalogTractors.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.model})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">
                    Hourly Rental Rate ($/hr) *
                  </Label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                      type="number"
                      step="0.5"
                      min="1"
                      placeholder="25.00"
                      value={newHourlyPrice}
                      onChange={(e) => setNewHourlyPrice(e.target.value)}
                      required
                      className="pl-9 rounded-xl"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setAddModalOpen(false)}
                    className="rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isAdding}
                    className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold px-6 gap-2"
                  >
                    {isAdding ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Assigning...
                      </>
                    ) : (
                      "Assign Tractor"
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 2. Key Metrics Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center font-bold">
            <Tractor className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Assigned Fleet</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Active Units</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">{stats.activeCount}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center font-bold">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Avg. Hourly Rate</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">${stats.avgPrice}/hr</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center font-bold">
            <StoreIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Linked Hubs</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">{stats.totalStores}</p>
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search tractor name, model, store..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-xl h-10 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {uniqueStores.length > 0 && (
            <select
              value={selectedStoreFilter}
              onChange={(e) => setSelectedStoreFilter(e.target.value)}
              className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">All Stores ({uniqueStores.length})</option>
              {uniqueStores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}

          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === "grid"
                  ? "bg-white dark:bg-slate-700 text-amber-600 shadow-sm"
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
                  ? "bg-white dark:bg-slate-700 text-amber-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
              title="Table View"
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Machinery Content List / Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 animate-pulse"
            >
              <div className="w-full h-36 bg-slate-100 dark:bg-slate-800 rounded-xl" />
              <div className="h-5 bg-slate-100 dark:bg-slate-800 rounded w-2/3" />
              <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredTractors.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 mx-auto flex items-center justify-center">
            <Tractor className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Store Tractors Found</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
              {searchQuery
                ? `No tractor assignments match "${searchQuery}".`
                : "No tractors have been linked to store hubs yet."}
            </p>
          </div>
          <Button
            onClick={() => setAddModalOpen(true)}
            className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold"
          >
            <Plus className="w-4 h-4 mr-2" /> Assign First Tractor
          </Button>
        </div>
      ) : viewMode === "grid" ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTractors.map((item) => {
            const bt = item.baseTractor;
            const img =
              bt?.images && bt.images.length > 0
                ? bt.images[0]
                : "https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?w=800&q=80";

            return (
              <div
                key={item.id}
                className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-amber-500/50 hover:shadow-xl hover:shadow-amber-500/5 transition-all duration-300 overflow-hidden flex flex-col justify-between"
              >
                {/* Image & Top Badges */}
                <div className="relative h-44 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <img
                    src={img}
                    alt={bt?.name || "Tractor"}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white border border-white/10 flex items-center gap-1.5 truncate max-w-[60%]">
                      <StoreIcon className="w-3 h-3 text-amber-400 shrink-0" />
                      <span className="truncate">{item.store?.name || "Store Hub"}</span>
                    </span>

                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-500 text-white shadow-sm flex items-center gap-1">
                      ${item.hourly_price}/hr
                    </span>
                  </div>

                  {/* Title on Image */}
                  <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="text-lg font-bold text-white tracking-tight truncate">
                      {bt?.name || "Tractor Unit"}
                    </h3>
                    <p className="text-xs text-slate-200/80 truncate">
                      Model: {bt?.model || "Standard"} • Category: {bt?.type || "Medium"}
                    </p>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-2.5">
                    {/* Store Hub info */}
                    <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <StoreIcon className="w-3.5 h-3.5 text-amber-600" />
                        Store Hub:
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[150px]">
                        {item.store?.name || "HolaTractor Hub"}
                      </span>
                    </div>

                    {/* Hourly Rate & Date */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Rental Rate:</span>
                      <span className="font-bold text-emerald-600 text-sm">
                        ${item.hourly_price || 20}.00 / hr
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Assigned on:</span>
                      <span>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "Active"}</span>
                    </div>
                  </div>

                  {/* Admin Actions Suite */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    {/* View Action */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setViewItem(item)}
                      className="flex-1 rounded-xl h-9 text-xs font-semibold gap-1.5 border-slate-200 dark:border-slate-800 hover:bg-slate-50"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-600" />
                      View
                    </Button>

                    {/* Edit Price Action */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditItem(item);
                        setEditPrice(item.hourly_price || 20);
                      }}
                      className="flex-1 rounded-xl h-9 text-xs font-semibold gap-1.5 border-slate-200 dark:border-slate-800 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                      Edit Rate
                    </Button>

                    {/* Delete Action */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteStoreTractor(item)}
                      disabled={deletingId === item.id}
                      className="h-9 w-9 p-0 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                      title="Remove from Store"
                    >
                      {deletingId === item.id ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-rose-600" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
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
                  <th className="py-3.5 px-4">Model & Type</th>
                  <th className="py-3.5 px-4">Assigned Store</th>
                  <th className="py-3.5 px-4 text-center">Hourly Price</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {filteredTractors.map((item) => {
                  const bt = item.baseTractor;
                  const img =
                    bt?.images && bt.images.length > 0
                      ? bt.images[0]
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
                            alt={bt?.name || "Tractor"}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-800"
                          />
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white leading-tight">
                              {bt?.name || "Tractor Unit"}
                            </p>
                            <p className="text-xs text-slate-400 truncate max-w-xs mt-0.5">
                              ID: {item.id.slice(0, 12)}...
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-xs">
                          <p className="font-medium text-slate-800 dark:text-slate-200">
                            {bt?.model || "Standard"}
                          </p>
                          <p className="text-slate-400 capitalize">{bt?.type || "Medium"}</p>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                          <StoreIcon className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span className="font-medium">{item.store?.name || "HolaTractor Store"}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center font-bold text-emerald-600 text-sm">
                        ${item.hourly_price || 20}/hr
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs border border-emerald-200/60 dark:border-emerald-800/60">
                          Active
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewItem(item)}
                            className="h-8 px-2.5 text-xs font-semibold gap-1 text-slate-600 hover:bg-slate-100"
                            title="View Tractor Details"
                          >
                            <Eye className="w-3.5 h-3.5" /> View
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditItem(item);
                              setEditPrice(item.hourly_price || 20);
                            }}
                            className="h-8 px-2.5 text-xs font-semibold gap-1 text-amber-600 hover:bg-amber-50"
                            title="Edit Rate"
                          >
                            <Edit3 className="w-3.5 h-3.5" /> Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteStoreTractor(item)}
                            disabled={deletingId === item.id}
                            className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            title="Remove Tractor"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. VIEW DETAILS MODAL */}
      <Dialog open={!!viewItem} onOpenChange={(open) => !open && setViewItem(null)}>
        <DialogContent className="max-w-lg p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
              <Tractor className="w-5 h-5 text-amber-600" />
              Tractor Machinery Profile
            </DialogTitle>
          </DialogHeader>

          {viewItem && (
            <div className="space-y-4 pt-2">
              <div className="relative h-48 w-full rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800">
                <img
                  src={
                    viewItem.baseTractor?.images?.[0] ||
                    "https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?w=800&q=80"
                  }
                  alt="Tractor Photo"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-3 text-sm">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    {viewItem.baseTractor?.name || "Tractor Unit"}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {viewItem.baseTractor?.description || "High performance agricultural tractor."}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-400">Model:</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      {viewItem.baseTractor?.model || "Universal"}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">Category:</span>
                    <p className="font-semibold capitalize text-slate-800 dark:text-slate-200">
                      {viewItem.baseTractor?.type || "Medium"}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">Store Hub:</span>
                    <p className="font-semibold text-amber-600">
                      {viewItem.store?.name || "HolaTractor Store"}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">Hourly Rate:</span>
                    <p className="font-bold text-emerald-600 text-sm">
                      ${viewItem.hourly_price}/hour
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button
                  variant="outline"
                  onClick={() => setViewItem(null)}
                  className="rounded-xl"
                >
                  Close
                </Button>
                {viewItem.store_id && (
                  <Link href={`/Store/${viewItem.store_id}`}>
                    <Button className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white gap-1.5">
                      <ExternalLink className="w-4 h-4" /> Go to Store Hub
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 6. EDIT RATE MODAL */}
      <Dialog open={!!editItem} onOpenChange={(open) => !open && setEditItem(null)}>
        <DialogContent className="max-w-md p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
              <Edit3 className="w-5 h-5 text-amber-600" />
              Edit Hourly Rental Rate
            </DialogTitle>
          </DialogHeader>

          {editItem && (
            <form onSubmit={handleUpdatePrice} className="space-y-4 pt-2">
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {editItem.baseTractor?.name} ({editItem.baseTractor?.model})
                </p>
                <p className="text-xs text-slate-500">
                  Assigned Store: {editItem.store?.name}
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">
                  Hourly Price ($/hr) *
                </Label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    type="number"
                    step="0.5"
                    min="1"
                    value={editPrice}
                    onChange={(e) => setEditPrice(Number(e.target.value))}
                    required
                    className="pl-9 rounded-xl font-bold text-lg"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setEditItem(null)}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isUpdating}
                  className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold px-6 gap-2"
                >
                  {isUpdating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StoreTractors;