"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  ChevronRight,
  Edit,
  Plus,
  Calendar,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  AlertTriangle,
  Radio,
  Filter,
  Grid,
  List,
  Wrench,
  CheckCircle,
  ArrowRight,
  MoreVertical,
  Layers,
  ArrowLeft,
  Loader2,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import AddTractorModal from "./AddTractorModal";
import AddAttachmentModal from "./AddAttachmentModal";
import FleetMapTracker, { TractorMarker } from "./FleetMapTracker";
import { useDealerLanguage } from "@/context/DealerLanguageContext";
import { errorMessage, successMessage } from "@/utils/Toastify/Messages";

interface Owner {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  mobile: string;
  gender: string;
  status: "Active" | "Inactive";
  image?: string;
  city?: string;
  dealer_id?: string;
  base_id?: string;
  createdAt?: string;
}

interface TractorItem {
  id: string;
  name: string;
  model: string;
  type: string;
  year: string;
  vin: string;
  hours: string;
  lastService: string;
  locationPing: string;
  locationPingStatus: "online" | "offline";
  gpsStatus: "Strong Signal" | "Weak Signal" | "No Signal";
  lastCoordinates: string;
  lat: number;
  lng: number;
  status: "Optimal" | "Service Due";
  image: string;
  imei?: string;
  region?: string;
}

interface EquipmentItem {
  id: string;
  name: string;
  serial: string;
  hours?: string;
}

interface FleetStats {
  totalTractors: number;
  optimal: number;
  serviceDue: number;
  activeAlerts: number;
  totalAttachments: number;
}

export default function CustomerFleetDetails({
  customer,
  onBack,
  onEdit,
}: {
  customer: Owner;
  onBack: () => void;
  onEdit: (customer: Owner) => void;
}) {
  const { t } = useDealerLanguage();
  const [activeMapView, setActiveMapView] = useState<"live" | "history">("live");
  const [modelFilter, setModelFilter] = useState("All Models");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showAddTractorModal, setShowAddTractorModal] = useState(false);
  const [showAddAttachmentModal, setShowAddAttachmentModal] = useState(false);

  // Live dynamic states
  const [fleet, setFleet] = useState<TractorItem[]>([]);
  const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
  const [stats, setStats] = useState<FleetStats>({
    totalTractors: 0,
    optimal: 0,
    serviceDue: 0,
    activeAlerts: 0,
    totalAttachments: 0,
  });
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch live fleet data for this specific customer
  const fetchCustomerFleet = useCallback(async () => {
    if (!customer?.id) return;
    try {
      const res = await fetch(`/api/dealer/customers/${customer.id}/fleet`);
      if (!res.ok) {
        throw new Error("Failed to load customer fleet");
      }
      const data = await res.json();
      setFleet(data.fleet || []);
      setEquipment(data.equipment || []);
      setStats(
        data.stats || {
          totalTractors: (data.fleet || []).length,
          optimal: (data.fleet || []).filter((f: any) => f.status === "Optimal").length,
          serviceDue: (data.fleet || []).filter((f: any) => f.status === "Service Due").length,
          activeAlerts: (data.fleet || []).filter((f: any) => f.status === "Service Due").length,
          totalAttachments: (data.equipment || []).length,
        }
      );
    } catch (err: any) {
      console.error("Error fetching customer fleet:", err);
    } finally {
      setLoading(false);
    }
  }, [customer?.id]);

  useEffect(() => {
    fetchCustomerFleet();
  }, [fetchCustomerFleet]);

  // Handle delete item
  const handleDeleteItem = async (itemId: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name} from this customer's fleet?`)) {
      return;
    }
    setDeletingId(itemId);
    try {
      const res = await fetch(
        `/api/dealer/customers/${customer.id}/fleet?itemId=${itemId}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        throw new Error("Failed to delete item");
      }
      successMessage(`${name} removed from fleet`);
      fetchCustomerFleet();
    } catch (err: any) {
      errorMessage(err?.message || "Failed to remove item");
    } finally {
      setDeletingId(null);
    }
  };

  // Unique model filter options dynamically derived from fleet
  const uniqueModels = [
    "All Models",
    ...Array.from(
      new Set(
        fleet.map((item) => {
          if (item.model) return item.model;
          return item.name.split(" ")[0] || item.name;
        })
      )
    ),
  ];

  const filteredFleet = fleet.filter((item) => {
    if (modelFilter === "All Models") return true;
    return (
      item.model?.toLowerCase() === modelFilter.toLowerCase() ||
      item.name.toLowerCase().includes(modelFilter.toLowerCase())
    );
  });

  const initials =
    `${customer.first_name?.[0] || ""}${customer.last_name?.[0] || ""}`.toUpperCase() ||
    "CU";

  // Markers for the interactive Map Tracker
  const mapTractors: TractorMarker[] = filteredFleet.map((t) => ({
    id: t.id,
    name: t.name,
    type: t.type,
    lat: t.lat,
    lng: t.lng,
    status: t.status,
    locationPing: t.locationPing,
    image: t.image,
    vin: t.vin,
    hours: t.hours,
  }));

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 md:p-8 space-y-6">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <button
              onClick={onBack}
              className="hover:text-[#790000] flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> {t("customerDirectory")}
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[#790000] font-bold">
              {customer.first_name} {customer.last_name}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {customer.first_name} {customer.last_name}
            </h1>
            <span
              className={`px-3 py-0.5 rounded-full text-xs font-bold border ${
                customer.status === "Active"
                  ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                  : "bg-slate-100 text-slate-700 border-slate-300"
              }`}
            >
              {customer.status === "Active"
                ? stats.totalTractors > 2
                  ? "Enterprise Fleet"
                  : "Active Commercial"
                : "Inactive Account"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => onEdit(customer)}
            className="border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5"
          >
            <Edit className="w-4 h-4" /> {t("editProfile")}
          </Button>
          <Button
            onClick={() => setShowAddTractorModal(true)}
            className="bg-[#790000] hover:bg-[#570000] text-white font-bold text-xs px-5 py-2 rounded-xl flex items-center gap-1.5 shadow-md"
          >
            <Plus className="w-4 h-4" /> {t("addTractor")}
          </Button>
        </div>
      </div>

      {/* Bento Grid Layout (3 Cols Left Profile / 9 Cols Fleet Canvas) */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Column: Profile & Quick Stats (3 Cols) */}
        <div className="col-span-12 lg:col-span-4 xl:col-span-3 space-y-6">
          {/* Customer Profile Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="h-24 bg-gradient-to-r from-[#790000] to-slate-900 w-full relative">
              <div className="absolute -bottom-10 left-6 w-20 h-20 rounded-full border-4 border-white bg-slate-800 flex items-center justify-center text-white font-black text-xl shadow-md">
                {initials}
              </div>
            </div>

            <div className="pt-12 pb-6 px-6 space-y-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {customer.first_name} {customer.last_name}
                </h2>
              </div>

              <div className="space-y-3 border-t border-slate-100 pt-4 text-xs">
                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-[#790000] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">
                      {t("memberSince")}
                    </p>
                    <p className="font-semibold text-slate-800">
                      {customer.createdAt
                        ? new Date(customer.createdAt).toLocaleDateString("en-US", {
                            month: "long",
                            year: "numeric",
                          })
                        : "Registered Member"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-[#790000] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">
                      {t("primaryLocation")}
                    </p>
                    <p className="font-semibold text-slate-800">
                      {customer.city || "Santa Cruz, Bolivia"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-[#790000] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">{t("contactPhone")}</p>
                    <p className="font-semibold text-slate-800">{customer.mobile || "Not specified"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-[#790000] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">{t("contactEmail")}</p>
                    <a
                      href={`mailto:${customer.email}`}
                      className="font-semibold text-[#790000] hover:underline break-all"
                    >
                      {customer.email}
                    </a>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">{t("accountStatus")}</span>
                <span
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold border flex items-center gap-1 ${
                    customer.status === "Active"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-slate-100 text-slate-600 border-slate-200"
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {customer.status === "Active" ? t("activeGoodStanding") : "Inactive"}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Stats Card (Dynamic) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">{t("totalFleet")}</p>
              <p className="text-2xl font-black text-[#790000]">
                {loading ? "..." : `${stats.totalTractors} Units`}
              </p>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">{t("activeAlerts")}</p>
              <p className="text-2xl font-black text-rose-600 flex items-center gap-1">
                {loading ? "..." : stats.activeAlerts} <AlertTriangle className="w-4 h-4 text-rose-500" />
              </p>
            </div>
          </div>
        </div>

        {/* Right Main Area: Map Tracker & Registered Fleet (9 Cols) */}
        <div className="col-span-12 lg:col-span-8 xl:col-span-9 space-y-6">
          {/* Fleet Map Tracker Section */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-white">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-[#790000] animate-pulse" />
                <h3 className="text-base font-bold text-slate-800">{t("fleetMapTracker")}</h3>
                <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full ml-1">
                  {mapTractors.length} live units
                </span>
              </div>
              <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setActiveMapView("live")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    activeMapView === "live"
                      ? "bg-[#790000] text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {t("liveView")}
                </button>
                <button
                  onClick={() => setActiveMapView("history")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    activeMapView === "history"
                      ? "bg-[#790000] text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {t("history")}
                </button>
              </div>
            </div>

            {/* Interactive Google Fleet Map Tracker with Live Dynamic Coordinates */}
            <FleetMapTracker
              activeView={activeMapView}
              tractors={mapTractors}
              customerCity={customer.city}
            />
          </div>

          {/* Registered Fleet Header & Filters */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-base font-bold text-slate-800">
              {t("registeredFleet")} ({filteredFleet.length})
            </h3>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <select
                  value={modelFilter}
                  onChange={(e) => setModelFilter(e.target.value)}
                  className="pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#790000]"
                >
                  {uniqueModels.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-lg transition-all ${
                    viewMode === "grid"
                      ? "bg-[#790000] text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded-lg transition-all ${
                    viewMode === "list"
                      ? "bg-[#790000] text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Fleet Cards Grid */}
          {loading ? (
            <div className="p-12 bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-[#790000] animate-spin" />
              <p className="text-xs font-bold text-slate-500">Loading registered fleet...</p>
            </div>
          ) : filteredFleet.length === 0 ? (
            <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center space-y-3">
              <p className="text-sm font-bold text-slate-700">No machinery registered in fleet</p>
              <p className="text-xs text-slate-400">Click &quot;Add Tractor&quot; above to register tractors for this customer.</p>
            </div>
          ) : (
            <div
              className={`grid gap-6 ${
                viewMode === "grid" ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
              }`}
            >
              {filteredFleet.map((tractor) => (
                <div
                  key={tractor.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col relative group"
                >
                  {/* Alert Badge */}
                  <div className="absolute top-4 right-4 z-10">
                    {tractor.status === "Service Due" ? (
                      <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1 shadow-sm">
                        <Wrench className="w-3.5 h-3.5" /> Service Due
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1 shadow-sm">
                        <CheckCircle className="w-3.5 h-3.5" /> Optimal
                      </span>
                    )}
                  </div>

                  {/* Image */}
                  <div className="h-48 w-full bg-slate-900 relative overflow-hidden border-b border-slate-100">
                    <Image
                      src={tractor.image}
                      alt={tractor.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 text-white">
                      <h4 className="text-base font-bold tracking-wide">{tractor.name}</h4>
                      <p className="text-xs text-slate-200 mt-0.5">
                        {tractor.type} • {tractor.year}
                      </p>
                    </div>
                  </div>

                  {/* Specs & Live GPS Details */}
                  <div className="p-5 flex-1 flex flex-col space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">
                          VIN / Serial
                        </p>
                        <p className="font-semibold text-slate-800 truncate" title={tractor.vin}>
                          {tractor.vin}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">
                          Engine Hours
                        </p>
                        <p className="font-semibold text-slate-800">{tractor.hours}</p>
                      </div>

                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">
                          Last Service
                        </p>
                        <p className="font-semibold text-slate-800">{tractor.lastService}</p>
                      </div>

                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">
                          Location Ping
                        </p>
                        <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              tractor.locationPingStatus === "online"
                                ? "bg-emerald-500"
                                : "bg-slate-400"
                            }`}
                          />
                          {tractor.locationPing}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">
                          GPS Status
                        </p>
                        <p className="font-semibold text-slate-800 flex items-center gap-1">
                          <Radio className="w-3.5 h-3.5 text-[#790000]" />
                          {tractor.gpsStatus}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">
                          Last Known Location
                        </p>
                        <p className="font-semibold text-slate-800 truncate">
                          {tractor.lastCoordinates}
                        </p>
                      </div>
                    </div>

                    {/* Actions Footer */}
                    <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-medium text-slate-500">
                          {tractor.region || (customer.city ? `${customer.city} Region` : "Primary Agricultural Sector")}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={deletingId === tractor.id}
                          onClick={() => handleDeleteItem(tractor.id, tractor.name)}
                          className="h-8 px-2 text-xs font-bold text-rose-600 border-slate-200 hover:bg-rose-50 hover:border-rose-300"
                          title="Remove from fleet"
                        >
                          {deletingId === tractor.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Equipment & Attachments Section (Dynamic) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#790000]" />
                <h3 className="text-base font-bold text-slate-800">
                  Attachments & Equipment ({equipment.length})
                </h3>
              </div>
              <Button
                onClick={() => setShowAddAttachmentModal(true)}
                className="bg-[#790000] hover:bg-[#570000] text-white text-xs font-bold px-4 py-1.5 rounded-xl flex items-center gap-1 shadow-sm"
              >
                <Plus className="w-4 h-4" /> Add Equipment
              </Button>
            </div>

            {loading ? (
              <div className="py-6 flex justify-center">
                <Loader2 className="w-5 h-5 text-[#790000] animate-spin" />
              </div>
            ) : equipment.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                No implements registered. Click &quot;Add Equipment&quot; to assign implements.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {equipment.map((item) => (
                  <div
                    key={item.id}
                    className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex items-center justify-between hover:border-[#790000]/40 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-slate-200 text-[#790000] shadow-sm">
                        <Layers className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">{item.name}</h4>
                        <p className="text-xs text-slate-500">
                          Serial: {item.serial} {item.hours ? `• ${item.hours}` : ""}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={deletingId === item.id}
                      onClick={() => handleDeleteItem(item.id, item.name)}
                      className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                      title="Remove implement"
                    >
                      {deletingId === item.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Tractor Popup Modal */}
      <AddTractorModal
        isOpen={showAddTractorModal}
        customerId={customer.id}
        onClose={() => setShowAddTractorModal(false)}
        onAddSuccess={fetchCustomerFleet}
      />

      {/* Add Attachment Popup Modal */}
      <AddAttachmentModal
        isOpen={showAddAttachmentModal}
        customerId={customer.id}
        onClose={() => setShowAddAttachmentModal(false)}
        onAddSuccess={fetchCustomerFleet}
      />
    </div>
  );
}
