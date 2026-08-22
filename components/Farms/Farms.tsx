"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import NullImage from "@/assets/AnimateIcons/Owner.svg";
import { renderInstance } from "@/utils/Axios/RenderInstance";
import { successMessage, errorMessage } from "@/utils/Toastify/Messages";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTrigger,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import {
  Edit,
  Eye,
  Trash2,
  Plus,
  Search,
  MapPin,
  Sprout,
  User as UserIcon,
  Layers,
  Calendar,
  Clock,
  ShieldAlert,
  X,
  Check,
  Copy,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Compass,
  Maximize2,
} from "lucide-react";
import axios from "axios";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";

interface Farm {
  id: string;
  owner_id: string;
  base_id: string;
  type: string;
  name: string;
  description: string;
  location?: string | null;
  soil_type?: string | null;
  crops?: string[] | null;
  boundary: {
    area: number;
    coordinates:
      | Array<{
          lat: string | number;
          lng: string | number;
          lan?: string | number;
        }>
      | Array<Array<number>>;
  };
  createdAt: string;
  updatedAt: string;
  Owner: {
    id: string;
    first_name: string;
    middle_name: string;
    last_name: string;
    email: string;
    password?: string | null;
    authType: string;
    googleId?: string | null;
    mobile?: string | null;
    country_code?: string | null;
    image?: string | null;
    dob?: string | null;
    gender: string;
    base_id: string;
    location_id?: string | null;
    createdAt: string;
    updatedAt: string;
    phoneVerified: boolean;
    emailVerified: boolean;
    request_to_delete: boolean;
  };
}

interface FarmerOption {
  id: string;
  name: string;
  email: string;
  mobile?: string;
}

const FARM_TYPES = [
  { label: "Cereales y Granos (Grain & Cereals)", value: "grain", icon: "🌾" },
  { label: "Ganadería y Pasturas (Livestock)", value: "livestock", icon: "🐄" },
  { label: "Hortalizas y Vegetales (Vegetables)", value: "vegetables", icon: "🥕" },
  { label: "Frutales y Huertos (Orchard)", value: "orchard", icon: "🍎" },
  { label: "Soja y Oleaginosas (Soy & Oilseeds)", value: "soy", icon: "🌱" },
  { label: "Polígono General (General Polygon)", value: "polygon", icon: "📐" },
];

const SOIL_TYPES = [
  "Franco (Loamy - Balanced)",
  "Arcilloso (Clay - High Retention)",
  "Arenoso (Sandy - Fast Drainage)",
  "Limoso (Silty - High Fertility)",
  "Tierra Negra Fértil (Humus Rich)",
  "Franco-Arcilloso (Clay Loam)",
];

const AVAILABLE_CROPS = [
  "Soy (Soya)",
  "Corn (Maíz)",
  "Wheat (Trigo)",
  "Sunflower (Girasol)",
  "Sorghum (Sorgo)",
  "Rice (Arroz)",
  "Sugarcane (Caña)",
  "Vegetables (Hortalizas)",
  "Pasture / Forage (Pasturas)",
];

const FarmSection = () => {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState("all");

  // Farmers list for create modal
  const [farmerOptions, setFarmerOptions] = useState<FarmerOption[]>([]);
  const [farmerSearch, setFarmerSearch] = useState("");
  const [farmerDropdownOpen, setFarmerDropdownOpen] = useState(false);
  const [selectedFarmerLabel, setSelectedFarmerLabel] = useState("");

  // Modals state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  // Create Form State
  const [newFarmName, setNewFarmName] = useState("");
  const [newFarmOwnerId, setNewFarmOwnerId] = useState("");
  const [newFarmType, setNewFarmType] = useState("grain");
  const [newFarmArea, setNewFarmArea] = useState<string>("50000");
  const [newFarmLocation, setNewFarmLocation] = useState("Santa Cruz, Bolivia");
  const [newFarmSoilType, setNewFarmSoilType] = useState("Franco (Loamy - Balanced)");
  const [newFarmCrops, setNewFarmCrops] = useState<string[]>(["Soy (Soya)", "Corn (Maíz)"]);
  const [newFarmDescription, setNewFarmDescription] = useState("");

  // Edit Form State
  const [editFarmName, setEditFarmName] = useState("");
  const [editFarmType, setEditFarmType] = useState("polygon");
  const [editFarmArea, setEditFarmArea] = useState<string>("");
  const [editFarmLocation, setEditFarmLocation] = useState("");
  const [editFarmSoilType, setEditFarmSoilType] = useState("");
  const [editFarmCrops, setEditFarmCrops] = useState<string[]>([]);
  const [editFarmDescription, setEditFarmDescription] = useState("");

  const { language: locale } = useSelector(
    (root: RootState) => root.ActiveLanguage
  );

  const getTranslation = (locale: string, translations: any) => {
    return translations[locale] || translations["en"] || translations["es"];
  };

  const sortFarmsByUpdateDate = (farmsList: Farm[]) => {
    if (!Array.isArray(farmsList)) return [];
    return [...farmsList].sort((a, b) => {
      const dateA = new Date(a?.updatedAt || a?.createdAt || 0).getTime();
      const dateB = new Date(b?.updatedAt || b?.createdAt || 0).getTime();
      return dateB - dateA;
    });
  };

  async function fetchAllFarms() {
    setLoading(true);
    try {
      let farmList: Farm[] = [];
      try {
        const localRes = await axios.get("/api/farm");
        if (Array.isArray(localRes.data) && localRes.data.length > 0) {
          farmList = localRes.data;
        }
      } catch {}

      if (farmList.length === 0) {
        const res = await renderInstance.get("/farm");
        farmList = Array.isArray(res.data)
          ? res.data
          : (res.data?.farms || res.data?.data || []);
      }

      const sortedFarms = sortFarmsByUpdateDate(farmList);
      setFarms(sortedFarms);
    } catch {
      errorMessage("Error fetching farm list");
    } finally {
      setLoading(false);
    }
  }

  async function fetchFarmerOptions() {
    try {
      const res = await axios.get("/api/farmer");
      if (Array.isArray(res.data) && res.data.length > 0) {
        const mapped: FarmerOption[] = res.data.map((f: any) => {
          // API returns nested user object
          const u = f.user || f;
          const firstName = u.first_name || f.first_name || "";
          const lastName = u.last_name || f.last_name || "";
          const email = u.email || f.email || "";
          const mobile = u.mobile || f.mobile || "";
          return {
            id: f.user_id || f.id,
            name: `${firstName} ${lastName}`.trim() || email || "Farmer",
            email,
            mobile,
          };
        });
        setFarmerOptions(mapped);
      }
    } catch {
      // Fallback silently
    }
  }

  useEffect(() => {
    fetchAllFarms();
    fetchFarmerOptions();
  }, []);

  const formatDate = (date?: string | Date | null): string => {
    if (!date) return "N/A";
    try {
      const dateObj = typeof date === "string" ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) return "N/A";
      const options: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      };
      return dateObj.toLocaleDateString(undefined, options);
    } catch {
      return "N/A";
    }
  };

  const formatArea = (area?: number | string | null): string => {
    if (area === undefined || area === null || isNaN(Number(area))) {
      return "0.00 m² (0.00 ha)";
    }
    const num = Number(area);
    const ha = (num / 10000).toFixed(2);
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(2)}M m² (${ha} ha)`;
    } else if (num >= 1000) {
      return `${num.toLocaleString()} m² (${ha} ha)`;
    } else {
      return `${num.toFixed(2)} m² (${ha} ha)`;
    }
  };

  const getOwnerFullName = (owner?: Farm["Owner"] | null): string => {
    if (!owner) return "Unknown Owner";
    return `${owner.first_name || ""} ${
      owner.middle_name ? owner.middle_name + " " : ""
    }${owner.last_name || ""}`.trim() || owner.email || "N/A";
  };

  // Filtered Farms
  const filteredFarms = useMemo(() => {
    return farms.filter((f) => {
      const q = searchTerm.toLowerCase().trim();
      const nameMatch = f.name?.toLowerCase().includes(q);
      const ownerMatch = getOwnerFullName(f.Owner).toLowerCase().includes(q);
      const locMatch = f.location?.toLowerCase().includes(q);
      const typeMatch = selectedTypeFilter === "all" || f.type?.toLowerCase() === selectedTypeFilter.toLowerCase();
      return (nameMatch || ownerMatch || locMatch || !q) && typeMatch;
    });
  }, [farms, searchTerm, selectedTypeFilter]);

  // Total Area Calculation
  const totalAreaHectares = useMemo(() => {
    const totalSqm = farms.reduce((acc, f) => acc + (Number(f?.boundary?.area) || 0), 0);
    return (totalSqm / 10000).toFixed(1);
  }, [farms]);

  // Handle Copy ID
  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  // Handlers
  const handleOpenCreateModal = () => {
    setNewFarmName("");
    setNewFarmOwnerId("");
    setSelectedFarmerLabel("");
    setFarmerSearch("");
    setFarmerDropdownOpen(false);
    setNewFarmType("grain");
    setNewFarmArea("50000");
    setNewFarmLocation("Santa Cruz, Bolivia");
    setNewFarmSoilType("Franco (Loamy - Balanced)");
    setNewFarmCrops(["Soy (Soya)", "Corn (Maíz)"]);
    setNewFarmDescription("");
    setCreateDialogOpen(true);
  };

  const toggleCreateCrop = (crop: string) => {
    setNewFarmCrops((prev) =>
      prev.includes(crop) ? prev.filter((c) => c !== crop) : [...prev, crop]
    );
  };

  const toggleEditCrop = (crop: string) => {
    setEditFarmCrops((prev) =>
      prev.includes(crop) ? prev.filter((c) => c !== crop) : [...prev, crop]
    );
  };

  const handleCreateFarmSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFarmName.trim()) {
      errorMessage("Please enter a farm name");
      return;
    }
    const areaNum = parseFloat(newFarmArea) || 50000;
    const ownerId = newFarmOwnerId || (farmerOptions[0]?.id || "cm8czs7az0006ai057wi3qob8");

    // Generate sample 4-point bounding polygon around Santa Cruz coordinates
    const sampleCoords = [
      { lat: "-17.7833", lan: "-63.1821", lng: "-63.1821" },
      { lat: "-17.7833", lan: "-63.1721", lng: "-63.1721" },
      { lat: "-17.7733", lan: "-63.1721", lng: "-63.1721" },
      { lat: "-17.7733", lan: "-63.1821", lng: "-63.1821" },
    ];

    const payload = {
      owner_id: ownerId,
      name: newFarmName.trim(),
      type: newFarmType,
      location: newFarmLocation.trim() || "Santa Cruz, Bolivia",
      soil_type: newFarmSoilType,
      crops: newFarmCrops,
      description: newFarmDescription.trim(),
      boundary: {
        coordinates: sampleCoords,
        area: areaNum,
      },
    };

    setSubmitting(true);
    try {
      const res = await axios.post("/api/farm", payload);
      const createdFarm = res.data;
      successMessage(`Farm "${newFarmName}" registered successfully!`);
      setCreateDialogOpen(false);
      await fetchAllFarms();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.response?.data?.detail || "Failed to create farm";
      errorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewFarm = (farm: Farm) => {
    setSelectedFarm(farm);
    setViewDialogOpen(true);
  };

  const handleEditFarm = (farm: Farm) => {
    setSelectedFarm(farm);
    setEditFarmName(farm.name || "");
    setEditFarmType(farm.type || "polygon");
    setEditFarmArea(farm?.boundary?.area ? String(farm.boundary.area) : "50000");
    setEditFarmLocation(farm.location || "Santa Cruz, Bolivia");
    setEditFarmSoilType(farm.soil_type || "Franco (Loamy - Balanced)");
    setEditFarmCrops(Array.isArray(farm.crops) ? farm.crops : []);
    setEditFarmDescription(farm.description || "");
    setEditDialogOpen(true);
  };

  const handleUpdateFarmSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFarm || !editFarmName.trim()) {
      errorMessage("Please enter a farm name");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: editFarmName.trim(),
        type: editFarmType,
        location: editFarmLocation.trim(),
        soil_type: editFarmSoilType,
        crops: editFarmCrops,
        description: editFarmDescription.trim(),
        boundary: {
          ...selectedFarm.boundary,
          area: parseFloat(editFarmArea) || selectedFarm.boundary?.area || 0,
        },
      };

      try {
        await axios.patch(`/api/farm/${selectedFarm.id}`, payload);
      } catch {
        await renderInstance.patch(`/farm/${selectedFarm.id}`, payload);
      }

      setFarms((prev) =>
        prev.map((f) =>
          f.id === selectedFarm.id
            ? {
                ...f,
                name: editFarmName.trim(),
                type: editFarmType,
                location: editFarmLocation.trim(),
                soil_type: editFarmSoilType,
                crops: editFarmCrops,
                description: editFarmDescription.trim(),
                boundary: {
                  ...f.boundary,
                  area: parseFloat(editFarmArea) || f.boundary?.area || 0,
                },
                updatedAt: new Date().toISOString(),
              }
            : f
        )
      );

      successMessage("Farm details updated successfully!");
      setEditDialogOpen(false);
      setSelectedFarm(null);
    } catch (error: any) {
      errorMessage(error?.response?.data?.message || "Failed to update farm");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteFarm = (farm: Farm) => {
    setSelectedFarm(farm);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedFarm) return;

    setSubmitting(true);
    try {
      try {
        await axios.delete(`/api/farm/${selectedFarm.id}`);
      } catch {
        await renderInstance.delete(`/farm/${selectedFarm.id}`);
      }

      setFarms((prev) => prev.filter((f) => f.id !== selectedFarm.id));
      successMessage(`Farm "${selectedFarm.name}" removed successfully.`);
      setDeleteDialogOpen(false);
      setSelectedFarm(null);
    } catch (error: any) {
      errorMessage("Failed to delete farm");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-6 md:mt-8 space-y-6">
      {/* TOP STATS & ACTIONS HEADER */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Farms Card */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {getTranslation(locale, {
                en: "Total Registered Farms",
                es: "Granjas Registradas",
                ay: "Taqpacha Uywa Uta",
                qu: "Lliw Chakrakuna",
                gn: "Opa Ñemitỹ Renda",
              })}
            </p>
            <h3 className="text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
              {farms.length}
            </h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Sprout className="w-6 h-6" />
          </div>
        </div>

        {/* Cultivated Land Area */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {getTranslation(locale, {
                en: "Mapped Agricultural Area",
                es: "Superficie Mapeada",
                ay: "Taqpacha Uraqi",
                qu: "Chakra Suyu",
                gn: "Yvy Pehẽngue",
              })}
            </p>
            <h3 className="text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
              {totalAreaHectares} <span className="text-sm font-semibold text-slate-500">ha</span>
            </h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Maximize2 className="w-6 h-6" />
          </div>
        </div>

        {/* Action Button Card */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-5 rounded-2xl shadow-lg shadow-emerald-600/20 text-white flex items-center justify-between">
          <div>
            <h4 className="font-bold text-base">
              {getTranslation(locale, {
                en: "Need a new farm?",
                es: "¿Registrar nueva granja?",
                ay: "¿Machaqa uywa uta?",
                qu: "¿Musuq chakra munankichu?",
                gn: "¿Ñemitỹ pyahu?",
              })}
            </h4>
            <p className="text-xs text-emerald-100 mt-0.5">
              {getTranslation(locale, {
                en: "Define boundaries & telemetry",
                es: "Delimitar perímetro y telemetría",
                ay: "Lurawinaka qillqaña",
                qu: "Saywakunata churanapaq",
                gn: "Moñepyrũ ñemitỹ",
              })}
            </p>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 bg-white text-emerald-800 hover:bg-emerald-50 rounded-xl font-bold text-xs shadow-md transition-all flex items-center space-x-1.5 active:scale-95 flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>
              {getTranslation(locale, {
                en: "New Farm",
                es: "Nueva Granja",
                ay: "Machaqa",
                qu: "Musuq",
                gn: "Pyahu",
              })}
            </span>
          </button>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search farm by name, farmer, or region..."
            className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Filter:</span>
          {["all", "grain", "livestock", "vegetables", "polygon"].map((type) => (
            <button
              key={type}
              onClick={() => setSelectedTypeFilter(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all whitespace-nowrap ${
                selectedTypeFilter === type
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {type === "all" ? "All Types" : type}
            </button>
          ))}
        </div>
      </div>

      {/* DESKTOP TABLE VIEW */}
      <div className="hidden lg:block bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="grid grid-cols-12 gap-3 px-6 py-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          <div className="col-span-1">#</div>
          <div className="col-span-3">Farm Name & Location</div>
          <div className="col-span-2">Assigned Farmer</div>
          <div className="col-span-2">Land Area</div>
          <div className="col-span-2">Category / Type</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {loading ? (
            <div className="py-16 text-center">
              <div className="animate-spin rounded-full h-9 w-9 border-2 border-emerald-500 border-t-transparent mx-auto mb-3"></div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Loading farms...</p>
            </div>
          ) : filteredFarms.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <Sprout className="w-12 h-12 text-slate-400 mx-auto opacity-50" />
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                {searchTerm ? `No farms found matching "${searchTerm}"` : "No farms registered yet."}
              </p>
              <button
                onClick={handleOpenCreateModal}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md inline-flex items-center space-x-1.5 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Create First Farm</span>
              </button>
            </div>
          ) : (
            filteredFarms.map((farm, idx) => {
              const ownerName = getOwnerFullName(farm.Owner);
              const areaNum = Number(farm?.boundary?.area) || 0;
              const ha = (areaNum / 10000).toFixed(2);
              return (
                <div
                  key={farm.id}
                  className="grid grid-cols-12 gap-3 px-6 py-4 items-center hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-all text-sm"
                >
                  <div className="col-span-1 font-bold text-slate-400 text-xs">
                    {(idx + 1).toString().padStart(2, "0")}
                  </div>

                  <div className="col-span-3">
                    <h4 className="font-bold text-slate-900 dark:text-white flex items-center space-x-1.5 truncate">
                      <span>{farm.name}</span>
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center mt-0.5 truncate">
                      <MapPin className="w-3 h-3 mr-1 text-slate-400 flex-shrink-0" />
                      {farm.location || "Santa Cruz, Bolivia"}
                    </p>
                  </div>

                  <div className="col-span-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center flex-shrink-0">
                        {ownerName.charAt(0).toUpperCase()}
                      </div>
                      <div className="truncate">
                        <p className="font-semibold text-xs text-slate-800 dark:text-slate-200 truncate">{ownerName}</p>
                        <p className="text-[11px] text-slate-400 truncate">{farm.Owner?.email || "Farmer"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-2">
                    <p className="font-extrabold text-slate-900 dark:text-white text-xs">
                      {ha} <span className="font-normal text-slate-500">ha</span>
                    </p>
                    <p className="text-[11px] text-slate-400">{areaNum.toLocaleString()} m²</p>
                  </div>

                  <div className="col-span-2">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 capitalize">
                      {farm.type || "Polygon"}
                    </span>
                  </div>

                  <div className="col-span-2 flex items-center justify-end space-x-1.5">
                    <button
                      onClick={() => handleViewFarm(farm)}
                      className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-all"
                      title="View Farm Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEditFarm(farm)}
                      className="p-2 rounded-xl text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-all"
                      title="Edit Farm"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteFarm(farm)}
                      className="p-2 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition-all"
                      title="Delete Farm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* MOBILE & TABLET CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:hidden">
        {loading ? (
          <div className="col-span-full py-16 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent mx-auto mb-2"></div>
            <p className="text-xs text-slate-500">Loading farms...</p>
          </div>
        ) : filteredFarms.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-sm">
            No farms found matching your search.
          </div>
        ) : (
          filteredFarms.map((farm) => {
            const ownerName = getOwnerFullName(farm.Owner);
            const areaNum = Number(farm?.boundary?.area) || 0;
            const ha = (areaNum / 10000).toFixed(2);
            return (
              <div
                key={farm.id}
                className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-base truncate">{farm.name}</h4>
                    <p className="text-xs text-slate-500 flex items-center mt-0.5">
                      <MapPin className="w-3 h-3 mr-1 text-slate-400" />
                      {farm.location || "Santa Cruz, Bolivia"}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/60 capitalize">
                    {farm.type || "Polygon"}
                  </span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Farmer:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate ml-2">{ownerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Area:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {ha} ha <span className="font-normal text-slate-400">({areaNum.toLocaleString()} m²)</span>
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => handleViewFarm(farm)}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 flex items-center justify-center space-x-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View</span>
                  </button>
                  <button
                    onClick={() => handleEditFarm(farm)}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 flex items-center justify-center space-x-1"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDeleteFarm(farm)}
                    className="p-2 rounded-xl text-xs font-semibold bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 flex items-center justify-center"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 1. REGISTER NEW FARM MODAL */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="bg-slate-900 border border-slate-700/80 text-white rounded-3xl p-0 overflow-hidden shadow-2xl max-w-xl w-[94vw] max-h-[92vh] flex flex-col [&>button]:text-slate-400 [&>button]:hover:text-white [&>button]:top-5 [&>button]:right-5 [&>button]:p-1.5 [&>button]:rounded-xl [&>button]:bg-slate-800/60 [&>button]:hover:bg-slate-800">
          {/* Header Banner */}
          <div className="p-6 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-900 border-b border-slate-800 flex items-center justify-between pr-14">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <Sprout className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Register New Farm</h3>
                <p className="text-xs text-slate-400 mt-0.5">Define boundaries, soil type & assign a farmer</p>
              </div>
            </div>
          </div>

          {/* Body Form */}
          <form onSubmit={handleCreateFarmSubmit} className="flex-1 overflow-y-auto p-6 space-y-4" style={{ scrollbarWidth: "none" }}>
            {/* Farmer Assignment - Search & Select */}
            <div className="relative">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Assigned Farmer <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={farmerSearch}
                  onChange={(e) => {
                    setFarmerSearch(e.target.value);
                    setFarmerDropdownOpen(true);
                    if (!e.target.value) {
                      setNewFarmOwnerId("");
                      setSelectedFarmerLabel("");
                    }
                  }}
                  onFocus={() => setFarmerDropdownOpen(true)}
                  placeholder={selectedFarmerLabel || "Search farmer by name, email or phone..."}
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
                {newFarmOwnerId && (
                  <button
                    type="button"
                    onClick={() => { setNewFarmOwnerId(""); setSelectedFarmerLabel(""); setFarmerSearch(""); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              {newFarmOwnerId && !farmerDropdownOpen && (
                <div className="mt-1.5 px-3 py-1.5 bg-emerald-950/50 border border-emerald-700/40 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-medium">{selectedFarmerLabel}</span>
                  <span className="text-slate-500 ml-1 truncate">{newFarmOwnerId}</span>
                </div>
              )}
              {farmerDropdownOpen && (() => {
                const q = farmerSearch.toLowerCase();
                const filtered = farmerOptions.filter(f =>
                  !q ||
                  f.name.toLowerCase().includes(q) ||
                  f.email.toLowerCase().includes(q) ||
                  (f.mobile || "").includes(q)
                ).slice(0, 12);
                return filtered.length > 0 ? (
                  <div
                    className="absolute z-50 mt-1.5 w-full bg-slate-850 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden"
                    style={{ background: "#0f172a" }}
                  >
                    <div className="max-h-52 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
                      {filtered.map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setNewFarmOwnerId(f.id);
                            setSelectedFarmerLabel(f.name);
                            setFarmerSearch("");
                            setFarmerDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2.5 hover:bg-slate-800 transition-colors flex items-center gap-3 group"
                        >
                          <div className="w-7 h-7 rounded-full bg-emerald-900/60 border border-emerald-700/40 flex items-center justify-center text-emerald-300 text-xs font-bold shrink-0">
                            {(f.name[0] || "F").toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{f.name}</p>
                            <p className="text-xs text-slate-400 truncate">{f.email || f.mobile || f.id.slice(0, 12) + "..."}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                    {filtered.length === 0 && (
                      <div className="px-4 py-4 text-center text-xs text-slate-500">No farmers found</div>
                    )}
                  </div>
                ) : (
                  <div
                    className="absolute z-50 mt-1.5 w-full border border-slate-700 rounded-2xl shadow-xl px-4 py-3 text-xs text-slate-500"
                    style={{ background: "#0f172a" }}
                  >
                    {farmerOptions.length === 0 ? "Loading farmers..." : "No farmers match your search"}
                  </div>
                );
              })()}
              {/* Close dropdown on outside click */}
              {farmerDropdownOpen && (
                <div className="fixed inset-0 z-40" onClick={() => setFarmerDropdownOpen(false)} />
              )}
            </div>

            {/* Farm Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Farm Name <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Sprout className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={newFarmName}
                  onChange={(e) => setNewFarmName(e.target.value)}
                  placeholder="e.g. Finca San Isidro Sector Norte"
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
              </div>
            </div>

            {/* Farm Type Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Agricultural Classification
              </label>
              <div className="grid grid-cols-2 gap-2">
                {FARM_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setNewFarmType(t.value)}
                    className={`p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center space-x-2 transition-all ${
                      newFarmType === t.value
                        ? "bg-emerald-950/60 border-emerald-500 text-white ring-1 ring-emerald-500"
                        : "bg-slate-800/60 border-slate-700/60 text-slate-400 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <span>{t.icon}</span>
                    <span className="truncate">{t.label.split("(")[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Area & Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Land Area (m²)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="100"
                    step="100"
                    value={newFarmArea}
                    onChange={(e) => setNewFarmArea(e.target.value)}
                    placeholder="e.g. 50000"
                    className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                    {(parseFloat(newFarmArea || "0") / 10000).toFixed(2)} ha
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Location / Municipality
                </label>
                <input
                  type="text"
                  value={newFarmLocation}
                  onChange={(e) => setNewFarmLocation(e.target.value)}
                  placeholder="e.g. Santa Cruz, Bolivia"
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Soil Type */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Soil Classification (Tractor AI & Agronomy)
              </label>
              <select
                value={newFarmSoilType}
                onChange={(e) => setNewFarmSoilType(e.target.value)}
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {SOIL_TYPES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Cultivated Crops Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Planned / Active Crops
              </label>
              <div className="flex flex-wrap gap-1.5">
                {AVAILABLE_CROPS.map((crop) => {
                  const selected = newFarmCrops.includes(crop);
                  return (
                    <button
                      key={crop}
                      type="button"
                      onClick={() => toggleCreateCrop(crop)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                        selected
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
                      }`}
                    >
                      {selected ? "✓ " : "+ "}
                      {crop.split("(")[0]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Notes & Irrigation Details (Optional)
              </label>
              <textarea
                rows={3}
                value={newFarmDescription}
                onChange={(e) => setNewFarmDescription(e.target.value)}
                placeholder="Access roads, irrigation pivots, slope, crop rotation history..."
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              />
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setCreateDialogOpen(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/25 transition-all flex items-center active:scale-95 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent mr-2"></div>
                    Saving Farm...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-1.5" />
                    Register Farm
                  </>
                )}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 2. VIEW FARM DETAILS MODAL */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="bg-slate-900 border border-slate-700/80 text-white rounded-3xl p-0 overflow-hidden shadow-2xl max-w-2xl w-[94vw] max-h-[92vh] flex flex-col [&>button]:text-slate-400 [&>button]:hover:text-white [&>button]:top-5 [&>button]:right-5 [&>button]:p-1.5 [&>button]:rounded-xl [&>button]:bg-slate-800/60 [&>button]:hover:bg-slate-800">
          {selectedFarm && (
            <>
              {/* Header Banner */}
              <div className="p-6 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-900 border-b border-slate-800 flex items-start justify-between pr-14">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
                      {selectedFarm.type || "Farm"}
                    </span>
                    <span className="text-xs text-slate-400">• Active Telemetry</span>
                  </div>
                  <h3 className="text-xl font-bold text-white">{selectedFarm.name}</h3>
                  <p className="text-xs text-slate-400 flex items-center">
                    <MapPin className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                    {selectedFarm.location || "Santa Cruz, Bolivia"}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setViewDialogOpen(false);
                      handleEditFarm(selectedFarm);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-emerald-400 hover:bg-slate-700 transition-all flex items-center space-x-1.5 text-xs font-semibold"
                    title="Edit this farm"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                </div>
              </div>

              {/* Body Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5" style={{ scrollbarWidth: "none" }}>
                {/* Metric Cards Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-800/60 border border-slate-700/60 p-3.5 rounded-2xl">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Total Area</span>
                    <p className="text-lg font-extrabold text-white mt-1">
                      {((Number(selectedFarm?.boundary?.area) || 0) / 10000).toFixed(2)}{" "}
                      <span className="text-xs font-semibold text-slate-400">ha</span>
                    </p>
                    <span className="text-[11px] text-slate-500">{(Number(selectedFarm?.boundary?.area) || 0).toLocaleString()} m²</span>
                  </div>

                  <div className="bg-slate-800/60 border border-slate-700/60 p-3.5 rounded-2xl">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Soil Type</span>
                    <p className="text-sm font-bold text-emerald-400 mt-1 truncate">
                      {selectedFarm.soil_type || "Franco / Loamy"}
                    </p>
                    <span className="text-[11px] text-slate-500">Agronomic profile</span>
                  </div>

                  <div className="bg-slate-800/60 border border-slate-700/60 p-3.5 rounded-2xl">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Boundary Vertices</span>
                    <p className="text-lg font-extrabold text-white mt-1">
                      {Array.isArray(selectedFarm.boundary?.coordinates) ? selectedFarm.boundary.coordinates.length : 0}
                    </p>
                    <span className="text-[11px] text-slate-500">GPS polygon points</span>
                  </div>

                  <div className="bg-slate-800/60 border border-slate-700/60 p-3.5 rounded-2xl">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Registry Status</span>
                    <p className="text-sm font-bold text-blue-400 mt-1">Verified</p>
                    <span className="text-[11px] text-slate-500">Render PostgreSQL</span>
                  </div>
                </div>

                {/* Farmer / Owner Profile Card */}
                <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-black text-lg flex items-center justify-center shadow-md">
                      {getOwnerFullName(selectedFarm.Owner).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <h4 className="font-bold text-white text-sm">{getOwnerFullName(selectedFarm.Owner)}</h4>
                        <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800">
                          Farmer
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{selectedFarm.Owner?.email || "No email available"}</p>
                      {selectedFarm.Owner?.mobile && (
                        <p className="text-xs text-slate-400">Tel: {selectedFarm.Owner.mobile}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Cultivated Crops in View Modal */}
                {Array.isArray(selectedFarm.crops) && selectedFarm.crops.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Cultivated Crops</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedFarm.crops.map((crop: string) => (
                        <span
                          key={crop}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-950/70 text-emerald-300 border border-emerald-800/70"
                        >
                          🌱 {crop}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Description */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Description & Notes</h4>
                  <div className="p-3.5 bg-slate-800/40 border border-slate-700/60 rounded-2xl text-xs text-slate-300 leading-relaxed">
                    {selectedFarm.description || "No descriptions or topographical notes entered for this farm."}
                  </div>
                </div>

                {/* GPS Coordinates Preview */}
                {Array.isArray(selectedFarm.boundary?.coordinates) && selectedFarm.boundary.coordinates.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
                      <span>GPS Perimeter Coordinates</span>
                      <span className="text-[11px] font-normal text-slate-500">WGS84 Coordinates</span>
                    </h4>
                    <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 max-h-36 overflow-y-auto space-y-1.5 font-mono text-[11px]">
                      {selectedFarm.boundary.coordinates.map((coord: any, cIdx: number) => {
                        const lat = coord.lat ?? coord[0] ?? "0";
                        const lng = coord.lng ?? coord.lan ?? coord[1] ?? "0";
                        return (
                          <div key={cIdx} className="flex items-center justify-between text-slate-300 py-0.5 px-2 hover:bg-slate-800/40 rounded">
                            <span className="text-slate-500 font-bold">P{cIdx + 1}:</span>
                            <span>Lat: {lat}</span>
                            <span>Lng: {lng}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Technical Details & Timestamps */}
                <div className="p-3.5 bg-slate-950/50 border border-slate-800/80 rounded-2xl space-y-2 text-xs text-slate-400">
                  <div className="flex items-center justify-between">
                    <span>Farm UUID:</span>
                    <button
                      onClick={() => handleCopyId(selectedFarm.id)}
                      className="font-mono text-slate-300 hover:text-white inline-flex items-center space-x-1"
                    >
                      <span>{selectedFarm.id}</span>
                      <Copy className="w-3.5 h-3.5 ml-1 text-slate-500" />
                    </button>
                  </div>
                  {copiedId && <p className="text-right text-[11px] text-emerald-400 font-semibold">Copied to clipboard!</p>}
                  <div className="flex justify-between">
                    <span>Registered On:</span>
                    <span className="text-slate-300">{formatDate(selectedFarm.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Updated:</span>
                    <span className="text-slate-300">{formatDate(selectedFarm.updatedAt)}</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex justify-end">
                <Button onClick={() => setViewDialogOpen(false)} className="bg-slate-800 hover:bg-slate-700 text-white">
                  Close
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* 3. EDIT FARM MODAL */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-slate-900 border border-slate-700/80 text-white rounded-3xl p-0 overflow-hidden shadow-2xl max-w-xl w-[94vw] max-h-[92vh] flex flex-col [&>button]:text-slate-400 [&>button]:hover:text-white [&>button]:top-5 [&>button]:right-5 [&>button]:p-1.5 [&>button]:rounded-xl [&>button]:bg-slate-800/60 [&>button]:hover:bg-slate-800">
          {/* Header */}
          <div className="p-6 bg-gradient-to-r from-slate-950 to-slate-900 border-b border-slate-800 flex items-center justify-between pr-14">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
                <Edit className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Edit Farm Details</h3>
                <p className="text-xs text-slate-400 mt-0.5">Modify farm attributes and agronomic metadata</p>
              </div>
            </div>
          </div>

          {/* Form Body */}
          <form onSubmit={handleUpdateFarmSubmit} className="flex-1 overflow-y-auto p-6 space-y-4" style={{ scrollbarWidth: "none" }}>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Farm Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={editFarmName}
                onChange={(e) => setEditFarmName(e.target.value)}
                placeholder="Enter farm name"
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Classification Type
              </label>
              <select
                value={editFarmType}
                onChange={(e) => setEditFarmType(e.target.value)}
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {FARM_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Land Area (m²)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="100"
                    step="100"
                    value={editFarmArea}
                    onChange={(e) => setEditFarmArea(e.target.value)}
                    className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                    {(parseFloat(editFarmArea || "0") / 10000).toFixed(2)} ha
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Location / Municipality
                </label>
                <input
                  type="text"
                  value={editFarmLocation}
                  onChange={(e) => setEditFarmLocation(e.target.value)}
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Soil Classification
              </label>
              <select
                value={editFarmSoilType}
                onChange={(e) => setEditFarmSoilType(e.target.value)}
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {SOIL_TYPES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Cultivated Crops in Edit Modal */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Planned / Active Crops
              </label>
              <div className="flex flex-wrap gap-1.5">
                {AVAILABLE_CROPS.map((crop) => {
                  const selected = editFarmCrops.includes(crop);
                  return (
                    <button
                      key={crop}
                      type="button"
                      onClick={() => toggleEditCrop(crop)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                        selected
                          ? "bg-blue-600 text-white shadow-sm"
                          : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
                      }`}
                    >
                      {selected ? "✓ " : "+ "}
                      {crop.split("(")[0]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Description & Notes
              </label>
              <textarea
                rows={3}
                value={editFarmDescription}
                onChange={(e) => setEditFarmDescription(e.target.value)}
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              />
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setEditDialogOpen(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/25 transition-all flex items-center active:scale-95 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent mr-2"></div>
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-1.5" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 4. DELETE FARM MODAL */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-slate-900 border border-red-500/40 text-white rounded-3xl p-6 shadow-2xl max-w-md w-[94vw] space-y-4 [&>button]:text-slate-400 [&>button]:hover:text-white [&>button]:top-5 [&>button]:right-5 [&>button]:p-1.5 [&>button]:rounded-xl [&>button]:bg-slate-800/60 [&>button]:hover:bg-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center border border-red-500/30 mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>

          <div className="text-center space-y-1.5">
            <h3 className="text-lg font-bold text-white">Delete Farm?</h3>
            <p className="text-xs text-slate-400">
              Are you sure you want to permanently remove this farm from the system?
            </p>
          </div>

          {selectedFarm && (
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 space-y-1.5 text-xs text-left">
              <p className="font-bold text-white">{selectedFarm.name}</p>
              <p className="text-slate-400">Owner: {getOwnerFullName(selectedFarm.Owner)}</p>
              <p className="text-slate-400">
                Area: {((Number(selectedFarm?.boundary?.area) || 0) / 10000).toFixed(2)} ha (
                {(Number(selectedFarm?.boundary?.area) || 0).toLocaleString()} m²)
              </p>
            </div>
          )}

          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300 text-xs text-center">
            ⚠️ This action is irreversible and will remove all boundary telemetry links.
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setDeleteDialogOpen(false)}
              className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              disabled={submitting}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500 shadow-lg shadow-red-600/25 transition-all flex items-center justify-center active:scale-95 disabled:opacity-50"
            >
              {submitting ? "Deleting..." : "Confirm Delete"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FarmSection;