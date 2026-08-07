"use client";

import { useState } from "react";
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
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import AddTractorModal from "./AddTractorModal";
import AddAttachmentModal from "./AddAttachmentModal";
import FleetMapTracker from "./FleetMapTracker";
import { useDealerLanguage } from "@/context/DealerLanguageContext";

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
}

interface TractorItem {
  id: string;
  name: string;
  type: string;
  year: string;
  vin: string;
  hours: string;
  lastService: string;
  locationPing: string;
  locationPingStatus: "online" | "offline";
  gpsStatus: "Strong Signal" | "Weak Signal" | "No Signal";
  lastCoordinates: string;
  status: "Optimal" | "Service Due";
  image: string;
}

interface EquipmentItem {
  id: string;
  name: string;
  serial: string;
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

  // Sample fleet list for this customer
  const fleetData: TractorItem[] = [
    {
      id: "jd-8r410",
      name: "John Deere 8R 410",
      type: "Row-Crop Tractor",
      year: "2022",
      vin: "1RW8R410PCX910234",
      hours: "1,450 hrs",
      lastService: "Aug 12, 2023",
      locationPing: "Field A-12",
      locationPingStatus: "online",
      gpsStatus: "Strong Signal",
      lastCoordinates: "41.2565° N, 95.9345° W",
      status: "Service Due",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAqUWSzaRpPfaxoY0zy1eK7tLm4ijklEi9QPEkhQ4zLrebB6vzw-fKyeb7iQdfE-6QeGPP1Xk-Dp8SNF1ILktPw_2ziWWvcf73iHKX80E0KMttrG_vu10rdHaL8or8FtdGrC_jXoWZUIgaF7EQ1GddMKaaAqKMilbuZfZ0TMlHc_JikVRU6sIoYoe0c3WSVN1miSD4bhaxZUgS3d7HCscOK7bL6OhqaGXng1yXW1ufUPdvoaF0cfCQ",
    },
    {
      id: "case-340",
      name: "Case IH Magnum 340",
      type: "Row-Crop Tractor",
      year: "2021",
      vin: "ZBRM340VLC901122",
      hours: "2,100 hrs",
      lastService: "Sep 05, 2023",
      locationPing: "Barn Storage",
      locationPingStatus: "offline",
      gpsStatus: "No Signal",
      lastCoordinates: "41.2524° N, 95.9978° W",
      status: "Optimal",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuD3d8WbqM97GS2yzatUz4ssSeBFQZhhcRqvdng5WxzDziIPDq7u7aBvo6riGeylb_4B_6cWEVfequmQATfBxGdVYTpqJR86rZOw7-a-b1zNhZdHE8vWL498d_mfAZm2VQ1sFZYtdcgm7vD_b03v__PJ7Y3LcYQpL01xckvwazZ_j-wkivT_MiWB2XreHBuFPyFUrLrr24szTZglu_C4j47HsvXn_Iqhle0F8_Cswp_-ZxhYyf_iV84",
    },
  ];

  const equipmentData: EquipmentItem[] = [
    { id: "plow-1", name: "Heavy Duty Plow 4X", serial: "PL-992-BX2" },
    { id: "tiller-2", name: "Rotary Tiller 2000", serial: "RT-441-ZX9" },
  ];

  const filteredFleet = fleetData.filter((item) => {
    if (modelFilter === "John Deere") return item.name.includes("John Deere");
    if (modelFilter === "Case IH") return item.name.includes("Case");
    return true;
  });

  const initials =
    `${customer.first_name?.[0] || ""}${customer.last_name?.[0] || ""}`.toUpperCase() ||
    "RJ";

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
            <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700 border border-orange-200">
              {t("premiumCustomer")}
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
                    <p className="font-semibold text-slate-800">October 2021</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-[#790000] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">
                      {t("primaryLocation")}
                    </p>
                    <p className="font-semibold text-slate-800">
                      {customer.city || "Midwest Valley Farms, Omaha"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-[#790000] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">{t("contactPhone")}</p>
                    <p className="font-semibold text-slate-800">{customer.mobile}</p>
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
                <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> {t("activeGoodStanding")}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Stats Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">{t("totalFleet")}</p>
              <p className="text-2xl font-black text-[#790000]">{fleetData.length} Units</p>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">{t("activeAlerts")}</p>
              <p className="text-2xl font-black text-rose-600 flex items-center gap-1">
                1 <AlertTriangle className="w-4 h-4 text-rose-500" />
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

            {/* Interactive Google Fleet Map Tracker */}
            <FleetMapTracker activeView={activeMapView} />
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
                  <option value="All Models">All Models</option>
                  <option value="John Deere">John Deere</option>
                  <option value="Case IH">Case IH</option>
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
                    <button className="text-xs font-bold text-[#790000] hover:underline flex items-center gap-1">
                      View Telematics <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-2 text-xs font-bold text-slate-600 border-slate-200 hover:bg-slate-50"
                        title="GPS Config"
                      >
                        <Radio className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-2 text-xs font-bold text-slate-600 border-slate-200 hover:bg-slate-50"
                        title="Edit Tractor"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Equipment & Attachments Section */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#790000]" />
                <h3 className="text-base font-bold text-slate-800">
                  Attachments & Equipment ({equipmentData.length})
                </h3>
              </div>
              <Button
                onClick={() => setShowAddAttachmentModal(true)}
                className="bg-[#790000] hover:bg-[#570000] text-white text-xs font-bold px-4 py-1.5 rounded-xl flex items-center gap-1 shadow-sm"
              >
                <Plus className="w-4 h-4" /> Add Equipment
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {equipmentData.map((item) => (
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
                      <p className="text-xs text-slate-500">Serial: {item.serial}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-slate-700">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add Tractor Popup Modal */}
      <AddTractorModal
        isOpen={showAddTractorModal}
        onClose={() => setShowAddTractorModal(false)}
      />

      {/* Add Attachment Popup Modal */}
      <AddAttachmentModal
        isOpen={showAddAttachmentModal}
        onClose={() => setShowAddAttachmentModal(false)}
      />
    </div>
  );
}
