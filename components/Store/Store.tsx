"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, useMemo } from "react";
import { Avatar } from "@mui/material";
import { useCookie } from "next-cookie";
import Image from "next/image";
import axios from "axios";
import { renderInstance } from "@/utils/Axios/RenderInstance";
import { errorMessage, successMessage } from "@/utils/Toastify/Messages";
import { City, Country, Owner } from "@/utils/Types/types";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { uploadFileToS3 } from "@/utils/AWS/FileUpload";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import {
  Store as StoreIcon,
  Tractor,
  MapPin,
  Clock,
  Calendar,
  Users,
  Search,
  Plus,
  Trash2,
  ExternalLink,
  Layers,
  Sparkles,
  LayoutGrid,
  List as ListIcon,
  RefreshCw,
  Phone,
  Mail,
  AlertCircle,
  Building2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export interface RichStoreItem {
  id: string;
  name: string;
  description: string;
  image?: string;
  opening_time?: string;
  closing_time?: string;
  closing_days?: string[];
  createdAt?: string;
  updatedAt?: string;
  tractor_count?: number;
  attachment_count?: number;
  operator_count?: number;
  owner?: {
    id: string;
    name: string;
    email: string;
    mobile?: string;
    image?: string;
  } | null;
  location?: {
    id?: string;
    name?: string;
    address?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    country?: string;
  } | null;
}

const StoreSection = () => {
  const [allStores, setAllStores] = useState<RichStoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Create modal state
  const [open, setOpen] = useState(false);
  const [creatingStore, setCreatingStore] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [openingTime, setOpeningTime] = useState("08:00");
  const [closingTime, setClosingTime] = useState("20:00");
  const [closingDays, setClosingDays] = useState<string[]>(["Sunday"]);

  const [allOwners, setAllOwners] = useState<Owner[]>([]);
  const [owner, setOwner] = useState("");
  const [location_name, setLocationName] = useState("");
  const [location_address, setLocationAddress] = useState("");
  const [location_city, setLocationCity] = useState("Buenos Aires");
  const [location_state, setLocationState] = useState("Buenos Aires");
  const [location_zip_code, setLocationZipCode] = useState("1000");
  const [location_zip_country, setLocationZipCountry] = useState("Argentina");

  const [countries, setCountries] = useState<Country[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { cookie } = useCookie();
  const router = useRouter();
  const access_token =
    cookie.get("access_token") ||
    (typeof document !== "undefined"
      ? document.cookie.match(/(?:^|;\s*)access_token=([^;]+)/)?.[1]
      : "");
  const user = cookie.get("user");

  // Format time utility
  const formatTimeOnly = (dateTimeStr?: string | number | Date) => {
    if (!dateTimeStr) return "08:00 AM";
    try {
      const date = new Date(dateTimeStr);
      if (isNaN(date.getTime())) return String(dateTimeStr);
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "08:00 AM";
    }
  };

  // 1. Fetch stores with rich DB metadata
  const fetchAllStores = useCallback(async () => {
    setLoading(true);
    let loaded = false;

    // Primary: Local Next.js API route connected directly to PostgreSQL
    try {
      const res = await axios.get("/api/admin/stores", { timeout: 6000 });
      if (Array.isArray(res.data)) {
        setAllStores(res.data);
        loaded = true;
      }
    } catch (err) {
      console.warn("Direct /api/admin/stores fetch notice:", err);
    }

    // Secondary fallback: /api/store route
    if (!loaded) {
      try {
        const res = await axios.get("/api/store", { timeout: 6000 });
        if (Array.isArray(res.data)) {
          setAllStores(res.data);
          loaded = true;
        }
      } catch (err) {
        console.warn("Fallback /api/store fetch notice:", err);
      }
    }

    // Tertiary fallback: NestJS backend if available
    if (!loaded && access_token) {
      try {
        const res = await renderInstance.get("/store", {
          headers: { Authorization: `Bearer ${access_token}` },
        });
        if (res.status === 200 && Array.isArray(res.data)) {
          setAllStores(res.data);
          loaded = true;
        }
      } catch (err) {
        console.warn("NestJS store fetch notice:", err);
      }
    }

    setLoading(false);
  }, [access_token]);

  // Fetch owners list
  const fetchAllOwners = useCallback(async () => {
    try {
      const res = await axios.get("/api/owner");
      if (Array.isArray(res.data)) {
        setAllOwners(res.data);
      }
    } catch {
      if (access_token) {
        renderInstance
          .post("/store/owners", {}, { headers: { Authorization: `Bearer ${access_token}` } })
          .then((res) => {
            if (res.status === 201 && Array.isArray(res.data)) setAllOwners(res.data);
          })
          .catch(() => {});
      }
    }
  }, [access_token]);

  // Fetch countries
  const fetchAllCountry = useCallback(async () => {
    try {
      const res = await axios.get("/api/country");
      if (Array.isArray(res.data)) setCountries(res.data);
    } catch {
      renderInstance
        .get("/country")
        .then((res) => {
          if (Array.isArray(res.data)) setCountries(res.data);
        })
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    fetchAllStores();
    fetchAllOwners();
    fetchAllCountry();
  }, [fetchAllStores, fetchAllOwners, fetchAllCountry]);

  // Dropzone for store image
  const onDrop = useCallback((acceptedFiles: File[]) => {
    setSelectedImage(acceptedFiles);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    multiple: false,
  });

  const handleDaySelection = (day: string) => {
    setClosingDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  // Add new store
  const handleAddStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      errorMessage("Store name is required");
      return;
    }

    setCreatingStore(true);
    try {
      let storeImageUrl = "https://images.unsplash.com/photo-1592928302636-c83cf1e1c887?w=600&q=80";

      if (selectedImage.length > 0) {
        setImageUploading(true);
        const buffer = Buffer.from(await selectedImage[0].arrayBuffer());
        storeImageUrl = await uploadFileToS3(buffer, selectedImage[0].name);
        setImageUploading(false);
      }

      const isUserAdmin = Boolean(user?.isAdmin || cookie.get("isAdmin") === "true");
      const selectedOwnerId = owner || (isUserAdmin ? "cm8x7w4xn001vu5w3xq9nvfjz" : user?.userId);

      const storePayload = {
        name: name.trim(),
        description: description.trim() || "HolaTractor Agricultural Hub Unit",
        opening_time: new Date(`1970-01-01T${openingTime}:00.000Z`),
        closing_time: new Date(`1970-01-01T${closingTime}:00.000Z`),
        closing_days: closingDays,
        image: storeImageUrl,
        owner_user_id: selectedOwnerId,
        location_name: location_name || `${name} Location`,
        location_address: location_address || "Agricultural Regional Hub",
        location_city: location_city || "Buenos Aires",
        location_state: location_state || "Buenos Aires",
        location_zip_code: location_zip_code || "1000",
        location_country: location_zip_country || "Argentina",
      };

      const res = await axios.post("/api/admin/stores", storePayload);
      if (res.status === 201 || res.data?.success) {
        successMessage("Store created successfully!");
        setOpen(false);
        // Reset form
        setName("");
        setDescription("");
        setSelectedImage([]);
        fetchAllStores();
      } else {
        errorMessage(res.data?.message || "Failed to create store");
      }
    } catch (err: any) {
      console.error("Create store error:", err);
      errorMessage(err?.response?.data?.error || err?.response?.data?.message || "Error creating store");
    } finally {
      setCreatingStore(false);
      setImageUploading(false);
    }
  };

  // Delete store
  const handleDeleteStore = async (storeId: string, storeName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${storeName}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingId(storeId);
    try {
      const res = await axios.delete(`/api/admin/stores?id=${storeId}`);
      if (res.data?.success) {
        successMessage(`Store "${storeName}" deleted successfully`);
        setAllStores((prev) => prev.filter((s) => s.id !== storeId));
      } else {
        errorMessage(res.data?.error || "Failed to delete store");
      }
    } catch (err: any) {
      errorMessage(err?.response?.data?.error || "Failed to delete store");
    } finally {
      setDeletingId(null);
    }
  };

  // Computed statistics
  const stats = useMemo(() => {
    const totalStores = allStores.length;
    const totalTractors = allStores.reduce((acc, s) => acc + (s.tractor_count || 0), 0);
    const totalAttachments = allStores.reduce((acc, s) => acc + (s.attachment_count || 0), 0);
    const totalOperators = allStores.reduce((acc, s) => acc + (s.operator_count || 0), 0);
    return { totalStores, totalTractors, totalAttachments, totalOperators };
  }, [allStores]);

  // Filtered stores
  const filteredStores = useMemo(() => {
    return allStores.filter((store) => {
      const matchesSearch =
        searchQuery === "" ||
        store.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        store.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        store.location?.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        store.location?.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        store.owner?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        store.owner?.email?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCountry =
        selectedCountry === "all" ||
        store.location?.country?.toLowerCase() === selectedCountry.toLowerCase();

      return matchesSearch && matchesCountry;
    });
  }, [allStores, searchQuery, selectedCountry]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCountry, pageSize]);

  const totalPages = Math.ceil(filteredStores.length / pageSize) || 1;
  const paginatedStores = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStores.slice(start, start + pageSize);
  }, [filteredStores, currentPage, pageSize]);

  return (
    <div className="w-full py-6 space-y-6 max-w-7xl mx-auto">
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                Stores & Hub Inventory
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                  {allStores.length} Active Hubs
                </span>
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Manage operational store centers, tractor fleets, attachments, and hub operators.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAllStores}
            disabled={loading}
            className="rounded-xl border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 gap-2 h-10 px-4"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-emerald-600" : ""}`} />
            Refresh
          </Button>

          {/* Add Store Dialog */}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-2 h-10 px-5 shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
                <Plus className="w-4 h-4" />
                Add New Store
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6 rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  <StoreIcon className="w-5 h-5 text-emerald-600" />
                  Create Agricultural Store / Hub
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handleAddStore} className="space-y-5 pt-2">
                {/* Image Upload */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Store Banner Image</Label>
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${
                      isDragActive
                        ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20"
                        : "border-slate-200 dark:border-slate-800 hover:border-emerald-400 bg-slate-50/50 dark:bg-slate-900/50"
                    }`}
                  >
                    <input {...getInputProps()} />
                    {selectedImage.length > 0 ? (
                      <div className="flex items-center justify-center gap-3">
                        <img
                          src={URL.createObjectURL(selectedImage[0])}
                          alt="preview"
                          className="w-16 h-16 rounded-lg object-cover border border-slate-200 shadow-sm"
                        />
                        <div className="text-left">
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                            {selectedImage[0].name}
                          </p>
                          <p className="text-xs text-slate-400">Click to change image</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1.5 text-slate-500">
                        <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
                          <StoreIcon className="w-5 h-5" />
                        </div>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Drag & drop store banner image here, or browse
                        </p>
                        <p className="text-xs text-slate-400">Supports JPG, PNG, WebP up to 5MB</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Name & Description */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">
                      Store Name *
                    </Label>
                    <Input
                      placeholder="e.g. Central Pampas Tractor Hub"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">
                      Owner Account
                    </Label>
                    <select
                      value={owner}
                      onChange={(e) => setOwner(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">Default Admin / System Owner</option>
                      {allOwners.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.user?.first_name} {o.user?.last_name} ({o.user?.email})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">
                    Description
                  </Label>
                  <Textarea
                    placeholder="Provide details regarding machinery inventory, rental terms, and hub contact details..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="rounded-xl resize-none h-20"
                  />
                </div>

                {/* Operating Hours */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-600" /> Opening Time
                    </Label>
                    <Input
                      type="time"
                      value={openingTime}
                      onChange={(e) => setOpeningTime(e.target.value)}
                      className="rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-rose-500" /> Closing Time
                    </Label>
                    <Input
                      type="time"
                      value={closingTime}
                      onChange={(e) => setClosingTime(e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                </div>

                {/* Closing Days */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" /> Closed Days
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day) => {
                      const isSelected = closingDays.includes(day);
                      return (
                        <button
                          type="button"
                          key={day}
                          onClick={() => handleDaySelection(day)}
                          className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                            isSelected
                              ? "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800"
                              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-transparent hover:bg-slate-200"
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Location Fields */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
                  <p className="text-xs font-bold uppercase text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Hub Location Address
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input
                      placeholder="Address (e.g. Route 9, Km 120)"
                      value={location_address}
                      onChange={(e) => setLocationAddress(e.target.value)}
                      className="rounded-xl"
                    />
                    <Input
                      placeholder="City / Region (e.g. Cordoba)"
                      value={location_city}
                      onChange={(e) => setLocationCity(e.target.value)}
                      className="rounded-xl"
                    />
                    <Input
                      placeholder="State / Province"
                      value={location_state}
                      onChange={(e) => setLocationState(e.target.value)}
                      className="rounded-xl"
                    />
                    <Input
                      placeholder="Country"
                      value={location_zip_country}
                      onChange={(e) => setLocationZipCountry(e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setOpen(false)}
                    className="rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={creatingStore || imageUploading}
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 gap-2"
                  >
                    {creatingStore ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Creating Store...
                      </>
                    ) : (
                      "Create Store Hub"
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 2. Key Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center font-bold">
            <StoreIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Stores</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">{stats.totalStores}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center font-bold">
            <Tractor className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Store Tractors</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">{stats.totalTractors}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center font-bold">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Attachments</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">{stats.totalAttachments}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Hub Operators</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">{stats.totalOperators}</p>
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search stores by name, city, owner, address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-xl h-10 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 focus-visible:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === "grid"
                  ? "bg-white dark:bg-slate-700 text-emerald-600 shadow-sm"
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
                  ? "bg-white dark:bg-slate-700 text-emerald-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
              title="Table View"
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Content Area */}
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
              <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl" />
            </div>
          ))}
        </div>
      ) : filteredStores.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 mx-auto flex items-center justify-center">
            <StoreIcon className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Stores Found</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
              {searchQuery
                ? `No stores matching "${searchQuery}". Try modifying your search criteria.`
                : "No stores have been created yet. Click 'Add New Store' to set up your first store hub."}
            </p>
          </div>
          {searchQuery ? (
            <Button
              variant="outline"
              onClick={() => setSearchQuery("")}
              className="rounded-xl border-slate-200 dark:border-slate-800"
            >
              Clear Search
            </Button>
          ) : (
            <Button
              onClick={() => setOpen(true)}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              <Plus className="w-4 h-4 mr-2" /> Add First Store
            </Button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {paginatedStores.map((store) => {
            const hasTractors = (store.tractor_count || 0) > 0;
            return (
              <div
                key={store.id}
                className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300 overflow-hidden flex flex-col justify-between"
              >
                {/* Store Header Image */}
                <div className="relative h-44 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  {store.image ? (
                    <img
                      src={store.image}
                      alt={store.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 text-slate-400">
                      <StoreIcon className="w-12 h-12 opacity-50" />
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white border border-white/10 flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-emerald-400" />
                      {store.location?.city || store.location?.name || "Regional Hub"}
                    </span>

                    {hasTractors ? (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-500 text-white shadow-sm flex items-center gap-1">
                        <Tractor className="w-3 h-3" /> {store.tractor_count} Tractors
                      </span>
                    ) : (
                      <span className="text-xs font-medium px-2 py-1 rounded-lg bg-black/60 backdrop-blur-md text-slate-300 border border-white/10">
                        No Machinery
                      </span>
                    )}
                  </div>

                  {/* Title & Info on Image */}
                  <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="text-lg font-bold text-white tracking-tight truncate">
                      {store.name}
                    </h3>
                    <p className="text-xs text-slate-200/80 line-clamp-1">
                      {store.description || "Agricultural machinery store hub"}
                    </p>
                  </div>
                </div>

                {/* Store Body */}
                <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    {/* Timing & Closing Days */}
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-emerald-600" />
                        {formatTimeOnly(store.opening_time)} - {formatTimeOnly(store.closing_time)}
                      </span>
                      <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {store.closing_days?.length
                          ? `Closed: ${store.closing_days.join(", ")}`
                          : "Open 7 Days"}
                      </span>
                    </div>

                    {/* Owner Information */}
                    {store.owner && (
                      <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs">
                        <Avatar
                          src={store.owner.image}
                          alt={store.owner.name}
                          sx={{ width: 28, height: 28, fontSize: "12px" }}
                        >
                          {store.owner.name?.charAt(0)}
                        </Avatar>
                        <div className="truncate flex-1">
                          <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {store.owner.name}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">{store.owner.email}</p>
                        </div>
                      </div>
                    )}

                    {/* Equipment Counts Grid */}
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                        <p className="text-slate-400 text-[10px]">Tractors</p>
                        <p className="font-bold text-slate-800 dark:text-slate-200">
                          {store.tractor_count || 0}
                        </p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                        <p className="text-slate-400 text-[10px]">Attachments</p>
                        <p className="font-bold text-slate-800 dark:text-slate-200">
                          {store.attachment_count || 0}
                        </p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                        <p className="text-slate-400 text-[10px]">Operators</p>
                        <p className="font-bold text-slate-800 dark:text-slate-200">
                          {store.operator_count || 0}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <Link
                      href={`/Store/${store.id}`}
                      className="flex-1 text-center py-2 px-3 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white font-medium text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      View Store Hub
                    </Link>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteStore(store.id, store.name)}
                      disabled={deletingId === store.id}
                      className="h-9 w-9 p-0 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      title="Delete Store"
                    >
                      {deletingId === store.id ? (
                        <RefreshCw className="w-4 h-4 animate-spin text-rose-600" />
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
                  <th className="py-3.5 px-4">Store Hub</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4">Schedule</th>
                  <th className="py-3.5 px-4 text-center">Tractors</th>
                  <th className="py-3.5 px-4 text-center">Attachments</th>
                  <th className="py-3.5 px-4 text-center">Operators</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {paginatedStores.map((store) => (
                  <tr
                    key={store.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        {store.image ? (
                          <img
                            src={store.image}
                            alt={store.name}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-800"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                            <StoreIcon className="w-5 h-5" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white leading-tight">
                            {store.name}
                          </p>
                          <p className="text-xs text-slate-400 line-clamp-1 max-w-xs mt-0.5">
                            {store.description || "Agricultural machinery store hub"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 text-xs">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>
                          {store.location?.city || store.location?.name || "Regional Hub"}
                          {store.location?.country ? `, ${store.location.country}` : ""}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-xs text-slate-600 dark:text-slate-300">
                        <p className="font-medium">
                          {formatTimeOnly(store.opening_time)} - {formatTimeOnly(store.closing_time)}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {store.closing_days?.length
                            ? `Closed: ${store.closing_days.join(", ")}`
                            : "Open 7 Days"}
                        </p>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="font-semibold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs border border-emerald-200/60 dark:border-emerald-800/60">
                        {store.tractor_count || 0}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="font-semibold px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs border border-blue-200/60 dark:border-blue-800/60">
                        {store.attachment_count || 0}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="font-semibold px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-xs border border-purple-200/60 dark:border-purple-800/60">
                        {store.operator_count || 0}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/Store/${store.id}`}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-emerald-600 hover:text-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors inline-flex items-center gap-1"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> View
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteStore(store.id, store.name)}
                          disabled={deletingId === store.id}
                          className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Pagination Controller Footer */}
      {filteredStores.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm text-xs">
          <div className="flex items-center gap-3 text-slate-500">
            <span>
              Showing <span className="font-semibold text-slate-800 dark:text-slate-200">{(currentPage - 1) * pageSize + 1}</span> to{" "}
              <span className="font-semibold text-slate-800 dark:text-slate-200">{Math.min(currentPage * pageSize, filteredStores.length)}</span> of{" "}
              <span className="font-semibold text-slate-800 dark:text-slate-200">{filteredStores.length}</span> stores
            </span>

            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="h-8 px-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium focus:outline-none"
            >
              <option value={9}>9 / page</option>
              <option value={18}>18 / page</option>
              <option value={36}>36 / page</option>
              <option value={72}>72 / page</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="rounded-xl h-8 px-3 gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Prev
            </Button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
              .map((p, idx, arr) => {
                const prev = arr[idx - 1];
                return (
                  <span key={p} className="flex items-center">
                    {prev && p - prev > 1 && <span className="px-1 text-slate-400">...</span>}
                    <Button
                      variant={currentPage === p ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(p)}
                      className={`rounded-xl h-8 w-8 p-0 text-xs font-semibold ${
                        currentPage === p
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                          : "border-slate-200 text-slate-700"
                      }`}
                    >
                      {p}
                    </Button>
                  </span>
                );
              })}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="rounded-xl h-8 px-3 gap-1"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreSection;