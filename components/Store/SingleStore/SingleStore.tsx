"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCookie } from "next-cookie";
import axios from "axios";
import Link from "next/link";
import Image from "next/image";
import { renderInstance } from "@/utils/Axios/RenderInstance";
import { errorMessage, successMessage } from "@/utils/Toastify/Messages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Building2,
  Tractor,
  Layers,
  Users,
  MapPin,
  Clock,
  Calendar,
  Phone,
  Mail,
  ArrowLeft,
  RefreshCw,
  Plus,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Info,
  Edit3,
  Trash2,
  Store as StoreIcon,
  Navigation,
} from "lucide-react";

export interface SingleStoreTractor {
  id: string;
  hourly_price: number;
  createdAt: string;
  baseTractor?: {
    id: string;
    name: string;
    model?: string;
    type?: string;
    description?: string;
    year?: string | null;
    images?: string[];
  };
}

export interface SingleStoreAttachment {
  id: string;
  hourly_price: number;
  createdAt: string;
  attachment?: {
    id: string;
    name: string;
    description?: string;
    images?: string[];
    fixedPrice?: number;
  };
}

export interface SingleStoreOperator {
  id: string;
  status?: string;
  cost_per_hour?: number;
  cost_per_job?: number;
  cost_per_month?: number;
  note?: string;
  createdAt: string;
  operator?: {
    id: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    mobile?: string;
    image?: string;
  };
}

export interface StoreFullData {
  id: string;
  name: string;
  description: string;
  image?: string;
  opening_time?: string;
  closing_time?: string;
  closing_days?: string[];
  location?: {
    id?: string;
    name?: string;
    address?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    country?: string;
  };
  owner?: {
    id?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    mobile?: string;
    image?: string;
  };
  tractor_in_store?: SingleStoreTractor[];
  attachment_in_store?: SingleStoreAttachment[];
  operator_in_store?: SingleStoreOperator[];
}

const SingleStore = () => {
  const { slug } = useParams();
  const router = useRouter();
  const { cookie } = useCookie();
  const access_token = cookie.get("access_token");

  const [storeData, setStoreData] = useState<StoreFullData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"tractors" | "attachments" | "operators" | "details">("tractors");

  // Tractor Search & Pagination
  const [tractorPage, setTractorPage] = useState(1);
  const [tractorPageSize, setTractorPageSize] = useState(6);
  const [tractorSearch, setTractorSearch] = useState("");

  // Edit Tractor Rate Modal
  const [editTractorItem, setEditTractorItem] = useState<SingleStoreTractor | null>(null);
  const [editPrice, setEditPrice] = useState("20");
  const [isUpdatingPrice, setIsUpdatingPrice] = useState(false);

  // Add Tractor Modal State
  const [addTractorOpen, setAddTractorOpen] = useState(false);
  const [catalogTractors, setCatalogTractors] = useState<{ id: string; name: string; model: string }[]>([]);
  const [selectedCatalogId, setSelectedCatalogId] = useState("");
  const [newHourlyPrice, setNewHourlyPrice] = useState("25");
  const [isAddingTractor, setIsAddingTractor] = useState(false);

  // Edit Store Profile Modal State
  const [editStoreOpen, setEditStoreOpen] = useState(false);
  const [editStoreName, setEditStoreName] = useState("");
  const [editStoreDesc, setEditStoreDesc] = useState("");
  const [editStoreAddress, setEditStoreAddress] = useState("");
  const [editStoreCity, setEditStoreCity] = useState("");
  const [editStoreCountry, setEditStoreCountry] = useState("");
  const [editStoreOpenTime, setEditStoreOpenTime] = useState("08:00");
  const [editStoreCloseTime, setEditStoreCloseTime] = useState("20:00");
  const [editStoreClosingDays, setEditStoreClosingDays] = useState<string[]>(["Sunday"]);
  const [isSavingStore, setIsSavingStore] = useState(false);

  // Time formatter
  const formatTime = (timeStr?: string) => {
    if (!timeStr) return "08:00 AM";
    try {
      const d = new Date(timeStr);
      if (!isNaN(d.getTime())) {
        return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      }
      return String(timeStr);
    } catch {
      return "08:00 AM";
    }
  };

  // Fetch Store Details
  const fetchStore = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    let loaded = false;

    // 1. Try Next.js API / PostgreSQL first
    try {
      const res = await axios.get(`/api/store/${slug}`, { timeout: 6000 });
      if (res.data && res.data.id) {
        setStoreData(res.data);
        setEditStoreName(res.data.name || "");
        setEditStoreDesc(res.data.description || "");
        setEditStoreAddress(res.data.location?.address || "");
        setEditStoreCity(res.data.location?.city || "");
        setEditStoreCountry(res.data.location?.country || "");
        setEditStoreClosingDays(res.data.closing_days || []);
        loaded = true;
      }
    } catch (e) {
      console.warn("Direct /api/store/[slug] notice:", e);
    }

    // 2. Fallback to /api/admin/stores/${slug}
    if (!loaded) {
      try {
        const res = await axios.get(`/api/admin/stores/${slug}`, { timeout: 6000 });
        if (res.data && res.data.id) {
          setStoreData(res.data);
          loaded = true;
        }
      } catch (_) {}
    }

    // 3. Fallback to renderInstance (NestJS)
    if (!loaded) {
      try {
        const res = await renderInstance.get(`/store/${slug}`, {
          headers: access_token ? { Authorization: `Bearer ${access_token}` } : {},
        });
        if (res.data) {
          setStoreData(res.data);
          loaded = true;
        }
      } catch (err) {
        console.warn("RenderInstance fallback notice:", err);
      }
    }

    setLoading(false);
  }, [slug, access_token]);

  // Fetch base catalog tractors for Quick Add Modal
  const fetchCatalogTractors = useCallback(async () => {
    try {
      const res = await axios.get("/api/inventory");
      if (Array.isArray(res.data)) {
        const list = res.data.map((inv: any) => ({
          id: inv.tractor?.id || inv.id,
          name: inv.tractor?.name || "Tractor",
          model: inv.tractor?.model || "Standard",
        }));
        setCatalogTractors(list);
        if (list.length > 0) setSelectedCatalogId(list[0].id);
      }
    } catch (e) {
      console.warn("Catalog fetch error:", e);
    }
  }, []);

  useEffect(() => {
    fetchStore();
    fetchCatalogTractors();
  }, [fetchStore, fetchCatalogTractors]);

  // Quick Add Tractor to this store
  const handleAddTractor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug || !selectedCatalogId) return;

    setIsAddingTractor(true);
    try {
      const res = await axios.post("/api/admin/store-tractors", {
        store_id: String(slug),
        base_tractor_id: selectedCatalogId,
        hourly_price: Number(newHourlyPrice) || 20.0,
      });

      if (res.data?.success) {
        successMessage("Tractor added to this store successfully!");
        setAddTractorOpen(false);
        fetchStore();
      } else {
        errorMessage(res.data?.error || "Failed to add tractor");
      }
    } catch (err: any) {
      errorMessage(err?.response?.data?.error || "Error adding tractor to store");
    } finally {
      setIsAddingTractor(false);
    }
  };

  // Update Tractor Hourly Rate
  const handleUpdateTractorPrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTractorItem) return;

    setIsUpdatingPrice(true);
    try {
      const res = await axios.put("/api/admin/store-tractors", {
        id: editTractorItem.id,
        hourly_price: Number(editPrice),
      });

      if (res.data?.success) {
        successMessage("Hourly rental price updated!");
        setEditTractorItem(null);
        fetchStore();
      } else {
        errorMessage(res.data?.error || "Failed to update price");
      }
    } catch (err: any) {
      errorMessage(err?.response?.data?.error || "Error updating price");
    } finally {
      setIsUpdatingPrice(false);
    }
  };

  // Remove Tractor from this store
  const handleRemoveTractor = async (tractorInStoreId: string, tractorName: string) => {
    if (!window.confirm(`Are you sure you want to remove ${tractorName} from this store?`)) {
      return;
    }

    try {
      const res = await axios.delete(`/api/admin/store-tractors?id=${tractorInStoreId}`);
      if (res.data?.success) {
        successMessage(`${tractorName} removed from store.`);
        fetchStore();
      } else {
        errorMessage(res.data?.error || "Failed to remove tractor");
      }
    } catch (err: any) {
      errorMessage(err?.response?.data?.error || "Error removing tractor");
    }
  };

  // Save Store Profile Edits
  const handleSaveStoreProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug) return;

    setIsSavingStore(true);
    try {
      const res = await axios.put("/api/admin/stores", {
        id: String(slug),
        name: editStoreName,
        description: editStoreDesc,
        location_address: editStoreAddress,
        location_city: editStoreCity,
        location_country: editStoreCountry,
        opening_time: editStoreOpenTime,
        closing_time: editStoreCloseTime,
        closing_days: editStoreClosingDays,
      });

      if (res.data?.success) {
        successMessage("Store hub profile updated successfully!");
        setEditStoreOpen(false);
        fetchStore();
      } else {
        errorMessage(res.data?.error || "Failed to update store");
      }
    } catch (err: any) {
      errorMessage(err?.response?.data?.error || "Error saving store profile");
    } finally {
      setIsSavingStore(false);
    }
  };

  // Filtered & Paginated Tractors
  const filteredTractors = useMemo(() => {
    if (!storeData?.tractor_in_store) return [];
    return storeData.tractor_in_store.filter((item) => {
      const q = tractorSearch.toLowerCase();
      const bt = item.baseTractor;
      return (
        q === "" ||
        bt?.name?.toLowerCase().includes(q) ||
        bt?.model?.toLowerCase().includes(q) ||
        bt?.type?.toLowerCase().includes(q)
      );
    });
  }, [storeData?.tractor_in_store, tractorSearch]);

  const totalTractorPages = Math.ceil(filteredTractors.length / tractorPageSize) || 1;
  const paginatedTractors = useMemo(() => {
    const start = (tractorPage - 1) * tractorPageSize;
    return filteredTractors.slice(start, start + tractorPageSize);
  }, [filteredTractors, tractorPage, tractorPageSize]);

  if (loading) {
    return (
      <div className="w-full min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center animate-bounce shadow-lg shadow-emerald-500/10">
          <Building2 className="w-7 h-7" />
        </div>
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Loading store machinery hub...</p>
      </div>
    );
  }

  if (!storeData) {
    return (
      <div className="w-full py-16 max-w-2xl mx-auto text-center space-y-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 p-8 shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
          <Building2 className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Store Hub Not Found</h2>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            The store hub record could not be loaded from database.
          </p>
        </div>
        <Link href="/Store">
          <Button className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
            <ArrowLeft className="w-4 h-4 mr-2" /> Return to Store Directory
          </Button>
        </Link>
      </div>
    );
  }

  const tractorsCount = storeData.tractor_in_store?.length || 0;
  const attachmentsCount = storeData.attachment_in_store?.length || 0;
  const operatorsCount = storeData.operator_in_store?.length || 0;

  const bannerImg =
    storeData.image && !storeData.image.includes("default")
      ? storeData.image
      : "https://images.unsplash.com/photo-1592928302636-c83cf1e1c887?w=1200&q=80";

  return (
    <div className="w-full py-2 space-y-6 max-w-7xl mx-auto">
      {/* 1. Header Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Link href="/Store" className="hover:text-emerald-600 transition-colors flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Stores Hub
          </Link>
          <span>/</span>
          <span className="text-slate-900 dark:text-white truncate max-w-xs">{storeData.name}</span>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStore}
            className="rounded-xl border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 gap-1.5 h-9"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" /> Refresh
          </Button>

          {/* Edit Store Profile Dialog */}
          <Dialog open={editStoreOpen} onOpenChange={setEditStoreOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 gap-1.5 h-9"
              >
                <Edit3 className="w-3.5 h-3.5 text-emerald-600" /> Edit Store Profile
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-xl p-6 rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                  <Building2 className="w-5 h-5 text-emerald-600" />
                  Edit Store Hub Details
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSaveStoreProfile} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase text-slate-600">Store Name *</Label>
                  <Input
                    value={editStoreName}
                    onChange={(e) => setEditStoreName(e.target.value)}
                    required
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase text-slate-600">Description</Label>
                  <Textarea
                    value={editStoreDesc}
                    onChange={(e) => setEditStoreDesc(e.target.value)}
                    className="rounded-xl resize-none h-20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase text-slate-600">Address</Label>
                    <Input
                      value={editStoreAddress}
                      onChange={(e) => setEditStoreAddress(e.target.value)}
                      placeholder="e.g. Route 9, Km 120"
                      className="rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase text-slate-600">City / State</Label>
                    <Input
                      value={editStoreCity}
                      onChange={(e) => setEditStoreCity(e.target.value)}
                      placeholder="e.g. Cordoba"
                      className="rounded-xl"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setEditStoreOpen(false)}
                    className="rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSavingStore}
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 gap-2"
                  >
                    {isSavingStore ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Link href={`/Store/${slug}/booking`}>
            <Button className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-9 px-4 gap-1.5 shadow-md shadow-emerald-600/20">
              <Sparkles className="w-3.5 h-3.5" /> Store Bookings
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Premium Hero Store Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
        {/* Cover Photo */}
        <div className="relative h-64 md:h-80 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <img
            src={bannerImg}
            alt={storeData.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/45 to-transparent" />

          {/* Top Badges */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md text-white border border-white/15 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              {storeData.location?.city || storeData.location?.name || "Regional Agricultural Hub"}
              {storeData.location?.country ? `, ${storeData.location.country}` : ""}
            </span>

            <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-500 text-white shadow-lg flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Verified Hub
            </span>
          </div>

          {/* Bottom Title & Details on Cover */}
          <div className="absolute bottom-6 left-6 right-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-md bg-white/20 backdrop-blur-md text-white">
                  ID: {storeData.id.slice(0, 16)}...
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                {storeData.name}
              </h1>
              <p className="text-sm text-slate-200/90 max-w-2xl line-clamp-2 leading-relaxed">
                {storeData.description || "Primary agricultural hub for machinery leasing, implements, and certified operators."}
              </p>
            </div>

            {/* Operating Window Badge */}
            <div className="flex items-center gap-3 bg-black/50 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 text-white text-xs shrink-0">
              <Clock className="w-4 h-4 text-emerald-400" />
              <div>
                <p className="font-semibold">{formatTime(storeData.opening_time)} - {formatTime(storeData.closing_time)}</p>
                <p className="text-slate-300 text-[11px]">
                  {storeData.closing_days?.length ? `Closed: ${storeData.closing_days.join(", ")}` : "Open 7 Days"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Owner & Facility Contact Bar */}
        <div className="p-4 md:p-6 bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
              {storeData.owner?.first_name?.charAt(0) || "H"}
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white text-sm">
                {storeData.owner?.first_name ? `${storeData.owner.first_name} ${storeData.owner.last_name || ""}` : "System Admin / Dealer"}
              </p>
              <p className="text-slate-500">{storeData.owner?.email || "hub@holatractor.com"}</p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-slate-600 dark:text-slate-300">
            {storeData.owner?.mobile && (
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span className="font-medium">{storeData.owner.mobile}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>{storeData.location?.address || "Hub Facilities, Central Sector"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Core KPI Analytics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center font-bold">
            <Tractor className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Tractors Fleet</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{tractorsCount}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center font-bold">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Attachments</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{attachmentsCount}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Certified Drivers</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{operatorsCount}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center font-bold">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Hub Status</p>
            <p className="text-lg font-bold text-emerald-600">Active / Verified</p>
          </div>
        </div>
      </div>

      {/* 4. Tab Navigation Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveTab("tractors")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "tractors"
                ? "bg-white dark:bg-slate-700 text-emerald-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Tractor className="w-4 h-4" />
            Tractors ({tractorsCount})
          </button>

          <button
            onClick={() => setActiveTab("attachments")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "attachments"
                ? "bg-white dark:bg-slate-700 text-emerald-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Layers className="w-4 h-4" />
            Attachments ({attachmentsCount})
          </button>

          <button
            onClick={() => setActiveTab("operators")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "operators"
                ? "bg-white dark:bg-slate-700 text-emerald-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Users className="w-4 h-4" />
            Operators ({operatorsCount})
          </button>

          <button
            onClick={() => setActiveTab("details")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "details"
                ? "bg-white dark:bg-slate-700 text-emerald-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Info className="w-4 h-4" />
            Hub Profile & Timings
          </button>
        </div>

        {/* Action Button for Current Tab */}
        {activeTab === "tractors" && (
          <Dialog open={addTractorOpen} onOpenChange={setAddTractorOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold gap-1.5 h-10 px-4 shadow-md shadow-emerald-600/20">
                <Plus className="w-4 h-4" /> Assign Tractor to Store
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-md p-6 rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold flex items-center gap-2 text-slate-900">
                  <Tractor className="w-5 h-5 text-emerald-600" />
                  Assign Tractor to {storeData.name}
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handleAddTractor} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase text-slate-600">
                    Select Tractor Model *
                  </Label>
                  <select
                    value={selectedCatalogId}
                    onChange={(e) => setSelectedCatalogId(e.target.value)}
                    required
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {catalogTractors.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.model})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase text-slate-600">
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

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setAddTractorOpen(false)}
                    className="rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isAddingTractor}
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 gap-2"
                  >
                    {isAddingTractor ? "Assigning..." : "Assign Tractor"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* 5. TAB 1: TRACTORS IN STORE */}
      {activeTab === "tractors" && (
        <div className="space-y-5">
          {/* Tractor Search Bar */}
          {tractorsCount > 0 && (
            <div className="relative max-w-sm">
              <Input
                placeholder="Search tractors in this store..."
                value={tractorSearch}
                onChange={(e) => {
                  setTractorSearch(e.target.value);
                  setTractorPage(1);
                }}
                className="rounded-xl h-10 pl-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
              />
            </div>
          )}

          {tractorsCount === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 p-12 text-center space-y-4 shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 mx-auto flex items-center justify-center">
                <Tractor className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Tractors in this Store Hub</h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
                  No machinery is currently assigned to this store facility. Click &apos;Assign Tractor&apos; to link machines.
                </p>
              </div>
              <Button
                onClick={() => setAddTractorOpen(true)}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                <Plus className="w-4 h-4 mr-2" /> Assign First Tractor
              </Button>
            </div>
          ) : (
            <>
              {/* Machinery Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {paginatedTractors.map((item) => {
                  const bt = item.baseTractor;
                  const img =
                    bt?.images && bt.images.length > 0
                      ? bt.images[0]
                      : "https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?w=800&q=80";

                  return (
                    <div
                      key={item.id}
                      className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/5 transition-all overflow-hidden flex flex-col justify-between"
                    >
                      <div className="relative h-44 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <img
                          src={img}
                          alt={bt?.name || "Tractor"}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                        <div className="absolute top-3 right-3">
                          <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-500 text-white shadow-sm">
                            ${item.hourly_price}/hr
                          </span>
                        </div>
                        <div className="absolute bottom-3 left-3 right-3">
                          <h3 className="text-lg font-bold text-white tracking-tight truncate">
                            {bt?.name || "Tractor Unit"}
                          </h3>
                          <p className="text-xs text-slate-200/80 truncate">
                            Model: {bt?.model || "Standard"} • Category: {bt?.type || "Medium"}
                          </p>
                        </div>
                      </div>

                      <div className="p-5 space-y-4">
                        <div className="space-y-2 text-xs">
                          <div className="flex items-center justify-between text-slate-500">
                            <span>Base Machine ID:</span>
                            <span className="font-mono text-slate-700 dark:text-slate-300">
                              {(bt?.id || item.id).slice(0, 14)}...
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">Hourly Rental Rate:</span>
                            <span className="font-bold text-emerald-600 text-sm">
                              ${item.hourly_price}.00/hr
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                          <Link
                            href={`/Inventory/${bt?.id || item.id}`}
                            className="flex-1 text-center py-2 rounded-xl bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700 font-semibold text-xs transition-colors flex items-center justify-center gap-1"
                          >
                            <ExternalLink className="w-3.5 h-3.5" /> View Specs
                          </Link>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditTractorItem(item);
                              setEditPrice(String(item.hourly_price || 20));
                            }}
                            className="h-8 px-2.5 text-xs font-semibold text-amber-600 hover:bg-amber-50 border-slate-200 rounded-xl"
                            title="Edit Rate"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveTractor(item.id, bt?.name || "Tractor")}
                            className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl"
                            title="Remove from Store"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Tractors Pagination Bar */}
              {totalTractorPages > 1 && (
                <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm text-xs">
                  <span className="text-slate-500">
                    Showing {(tractorPage - 1) * tractorPageSize + 1} to{" "}
                    {Math.min(tractorPage * tractorPageSize, filteredTractors.length)} of{" "}
                    {filteredTractors.length} tractors
                  </span>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTractorPage((p) => Math.max(p - 1, 1))}
                      disabled={tractorPage === 1}
                      className="rounded-xl h-8 px-2.5"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </Button>
                    {Array.from({ length: totalTractorPages }, (_, i) => i + 1).map((p) => (
                      <Button
                        key={p}
                        variant={tractorPage === p ? "default" : "outline"}
                        size="sm"
                        onClick={() => setTractorPage(p)}
                        className={`rounded-xl h-8 w-8 p-0 ${
                          tractorPage === p ? "bg-emerald-600 hover:bg-emerald-700 text-white font-semibold" : ""
                        }`}
                      >
                        {p}
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTractorPage((p) => Math.min(p + 1, totalTractorPages))}
                      disabled={tractorPage === totalTractorPages}
                      className="rounded-xl h-8 px-2.5"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* 6. TAB 2: ATTACHMENTS */}
      {activeTab === "attachments" && (
        <div className="space-y-5">
          {attachmentsCount === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 p-12 text-center space-y-4 shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 mx-auto flex items-center justify-center">
                <Layers className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Attachments Assigned</h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
                  No agricultural implements or attachments are currently stored in this hub.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {storeData.attachment_in_store?.map((item) => {
                const att = item.attachment;
                const img =
                  att?.images && att.images.length > 0
                    ? att.images[0]
                    : "https://images.unsplash.com/photo-1595878715977-2e8f8df18ea8?w=800&q=80";

                return (
                  <div
                    key={item.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 space-y-4 shadow-sm"
                  >
                    <div className="h-40 w-full rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800">
                      <img src={img} alt={att?.name || "Attachment"} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-base">{att?.name || "Implement"}</h4>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1">{att?.description || "Heavy duty soil implement"}</p>
                    </div>
                    <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500">Rental Rate:</span>
                      <span className="font-bold text-blue-600 text-sm">${item.hourly_price || att?.fixedPrice || 15}/hr</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 7. TAB 3: OPERATORS */}
      {activeTab === "operators" && (
        <div className="space-y-5">
          {operatorsCount === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 p-12 text-center space-y-4 shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 mx-auto flex items-center justify-center">
                <Users className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Certified Drivers Assigned</h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
                  No certified tractor drivers are currently stationed at this hub.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {storeData.operator_in_store?.map((item) => {
                const op = item.operator;
                return (
                  <div
                    key={item.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 space-y-3 shadow-sm flex items-center gap-4"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-lg shrink-0">
                      {op?.first_name?.charAt(0) || "D"}
                    </div>
                    <div className="space-y-0.5 flex-1">
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                        {op?.first_name} {op?.last_name || ""}
                      </h4>
                      <p className="text-xs text-slate-500 truncate">{op?.email}</p>
                      {op?.mobile && <p className="text-xs text-purple-600 font-medium">{op?.mobile}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 8. TAB 4: STORE PROFILE & TIMINGS */}
      {activeTab === "details" && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 md:p-8 space-y-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-600" />
                Store Facility Overview
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {storeData.description || "Certified agricultural logistics hub offering tractor rentals, attachments, and certified drivers."}
              </p>

              <div className="space-y-2 pt-2 text-xs">
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Hub ID:</span>
                  <span className="font-mono font-medium">{storeData.id}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Hub Location:</span>
                  <span className="font-medium">
                    {storeData.location?.address || "Regional Address"}, {storeData.location?.city || "Regional Hub"}, {storeData.location?.country || "Argentina"}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-600" />
                Operating Hours & Availability
              </h3>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-3 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Daily Operating Window:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {formatTime(storeData.opening_time)} - {formatTime(storeData.closing_time)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Scheduled Closing Days:</span>
                  <span className="font-semibold text-rose-600">
                    {storeData.closing_days?.length ? storeData.closing_days.join(", ") : "None (Open 7 Days)"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT TRACTOR HOURLY PRICE MODAL */}
      <Dialog open={!!editTractorItem} onOpenChange={(open) => !open && setEditTractorItem(null)}>
        <DialogContent className="max-w-md p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-slate-900">
              <Edit3 className="w-5 h-5 text-emerald-600" />
              Edit Tractor Rental Rate
            </DialogTitle>
          </DialogHeader>

          {editTractorItem && (
            <form onSubmit={handleUpdateTractorPrice} className="space-y-4 pt-2">
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  {editTractorItem.baseTractor?.name} ({editTractorItem.baseTractor?.model})
                </p>
                <p className="text-xs text-slate-500">
                  Store: {storeData.name}
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase text-slate-600">
                  Hourly Rate ($/hr) *
                </Label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    type="number"
                    step="0.5"
                    min="1"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    required
                    className="pl-9 rounded-xl font-bold text-lg"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setEditTractorItem(null)}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isUpdatingPrice}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 gap-2"
                >
                  {isUpdatingPrice ? "Saving..." : "Save Rate"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SingleStore;
