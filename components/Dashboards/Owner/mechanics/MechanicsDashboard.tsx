"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  MapPin,
  Store as StoreIcon,
  Check,
  Search,
  Wrench,
  ArrowRight,
  Edit2,
  Star,
  Clock,
  Plus,
  User,
  Shield,
  Phone,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCookie } from "next-cookie";
import { renderInstance } from "@/utils/Axios/RenderInstance";
import { errorMessage } from "@/utils/Toastify/Messages";
import AddMechanicModal from "@/components/Dashboards/Dealer/Repairs/AddMechanics";

interface ApiMechanic {
  id: string;
  specialization: string[];
  experience_years: number;
  Status: number;
  user: {
    first_name: string;
    last_name: string;
    mobile: string;
    email: string;
    image?: string;
  };
}

export default function MechanicsDashboard() {
  const { cookie } = useCookie();
  const access_token = cookie?.get("access_token");

  const [activeTab, setActiveTab] = useState<"book" | "manage">("book");
  const [mechanicList, setMechanicList] = useState<ApiMechanic[]>([]);
  const [fetchingMechanics, setFetchingMechanics] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedTractor, setSelectedTractor] = useState("nh3032");
  const [selectedCategory, setSelectedCategory] = useState("Engine");
  const [priorityLevel, setPriorityLevel] = useState("MEDIUM");
  const [selectedIssues, setSelectedIssues] = useState<string[]>([
    "Engine not Starting",
    "Heavy Engine Sound",
  ]);
  const [searchQuery, setSearchQuery] = useState("");
  const [additionalDetails, setAdditionalDetails] = useState("");

  const fetchMechanics = () => {
    if (!access_token) return;
    setFetchingMechanics(true);
    renderInstance
      .get("/dealer/mechanic", {
        headers: { Authorization: `Bearer ${access_token}` },
      })
      .then((res) => {
        const mechanicsData =
          res.data?.mechanics ||
          res.data?.data ||
          (Array.isArray(res.data) ? res.data : []);
        setMechanicList(Array.isArray(mechanicsData) ? mechanicsData : []);
      })
      .catch(() => {
        setMechanicList([]);
      })
      .finally(() => setFetchingMechanics(false));
  };

  useEffect(() => {
    fetchMechanics();
  }, [access_token]);

  const tractors = [
    {
      id: "nh3032",
      name: "New Holland 3032",
      model: "3032",
      type: "Medium",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuADTtWfZhxK-ijdwWb_165BxZhfyOQ-0jHy-rE7RJAstr-_Gc6y4DzPKC9JCdyH7fqZpxKGlzho2rMfM6suP0LDYaNF22g5ctd77eP4Wsb-B7mlAlu7uYOPaAnHatBcSoiWhP_rpiv3PEOghenxROMfMkTAJZDkiYG5uCBi_ucwvM4o8bnOnpqr_gwW0_e5CMtM6ZJTdS7jVGBu9YPBlJnFLcgL52J2e3vNwRjOUkwXFHl7Jl7xrB8",
    },
    {
      id: "mf245",
      name: "MF 245 DI - 50 HP",
      model: "245 DI",
      type: "Medium",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuCwMZJUde5Z39KKLyEQ1J46l5URtKNHEvrtnWQbMo66ySTVTUF5A2_cSefVtjlqmwIroz76s2fzV1adsYMr3uK7YouB37ieOlZ9gwc7ZcUHpG0makY4NCrhn54nLEY3yYpsemwwrqT5dAvSV96MHI0emph8RDcTolYoMm8x6YWm5eJKTUPsvPFh2rHntgGJrUBpKZy0Y3IXv1Wo8dpI1svQLCIy8EqnO-ZCCLlA0ycjMvFO6K5Ka-M",
    },
  ];

  const categories = ["Engine", "Tyre", "Hydraulic", "Electrical"];

  const issueOptions = [
    "Engine not Starting",
    "Gear Not Working Properly",
    "Heavy Engine Sound",
    "Excessive Smoke from Exhaust",
  ];

  const toggleIssue = (issue: string) => {
    if (selectedIssues.includes(issue)) {
      setSelectedIssues(selectedIssues.filter((i) => i !== issue));
    } else {
      setSelectedIssues([...selectedIssues, issue]);
    }
  };

  const filteredTractors = tractors.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMechanics = mechanicList.filter(
    (mech) =>
      `${mech.user?.first_name || ""} ${mech.user?.last_name || ""}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      mech.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-2xl font-extrabold text-[#800000] tracking-tight">
            Mechanics & Repairs
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Book repair services or manage your certified mechanic team
          </p>
        </div>

        {/* Tab Switcher & Add Mechanic CTA */}
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("book")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === "book"
                  ? "bg-[#800000] text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Book Service
            </button>
            <button
              onClick={() => setActiveTab("manage")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === "manage"
                  ? "bg-[#800000] text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Manage Mechanics ({mechanicList.length})
            </button>
          </div>

          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-md"
          >
            <Plus className="w-4 h-4" /> Add Mechanic
          </Button>
        </div>
      </div>

      {activeTab === "manage" ? (
        /* Mechanics Management View */
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-slate-800">
              Mechanic Roster
            </h3>
            <div className="relative w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search mechanics..."
                className="pl-9 text-xs rounded-xl bg-slate-50 border-slate-200"
              />
            </div>
          </div>

          {fetchingMechanics ? (
            <div className="space-y-3 py-6">
              <div className="h-12 bg-slate-100 rounded-xl animate-pulse" />
              <div className="h-12 bg-slate-100 rounded-xl animate-pulse" />
              <div className="h-12 bg-slate-100 rounded-xl animate-pulse" />
            </div>
          ) : filteredMechanics.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl">
              <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-slate-700">No Mechanics Found</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Add mechanics to your store roster to assign service requests and track equipment repairs.
              </p>
              <Button
                onClick={() => setIsModalOpen(true)}
                className="mt-4 bg-[#800000] text-white text-xs font-bold px-5 py-2 rounded-xl"
              >
                Add First Mechanic
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMechanics.map((mech) => (
                <div
                  key={mech.id}
                  className="p-4 rounded-xl border border-slate-200 hover:border-[#800000]/40 bg-slate-50/50 space-y-3 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#800000] text-white flex items-center justify-center font-bold text-sm">
                      {mech.user?.first_name?.[0] || "M"}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">
                        {mech.user?.first_name} {mech.user?.last_name}
                      </h4>
                      <p className="text-xs text-emerald-600 font-semibold">
                        {mech.Status === 1 ? "Active Status" : "Inactive"}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1 text-xs text-slate-600 border-t border-slate-100 pt-2">
                    <p className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {mech.user?.mobile || "N/A"}
                    </p>
                    <p className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      {mech.user?.email}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Repair Service Booking View (Stitch Design 1:1) */
        <div className="grid grid-cols-12 gap-6">
          {/* Left Column: Repair Booking Flow (8 Cols) */}
          <div className="col-span-12 xl:col-span-8 space-y-6">
            {/* Progress Stepper */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
              <div className="flex items-center justify-between max-w-xl mx-auto">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                    <Check className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-slate-700">Location</span>
                </div>
                <div className="flex-1 h-[2px] bg-slate-200 mx-3" />
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#800000] text-white flex items-center justify-center font-bold text-xs shadow-md">
                    2
                  </div>
                  <span className="text-xs font-bold text-[#800000]">Details</span>
                </div>
                <div className="flex-1 h-[2px] bg-slate-200 mx-3" />
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center font-bold text-xs">
                    3
                  </div>
                  <span className="text-xs font-semibold text-slate-400">Review</span>
                </div>
              </div>
            </div>

            {/* Service Location & Provider Card */}
            <div className="bg-white rounded-2xl border-l-4 border-l-orange-500 border border-slate-200/80 p-5 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-base font-bold text-slate-800 mb-3">
                    Service Location & Provider
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-[#800000] shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-slate-800">Current Location</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Coordinates: 28.6284, 77.0292
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <StoreIcon className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-slate-800">Store1</p>
                        <p className="text-xs text-slate-500 mt-0.5">Dealer ID: cmb935...</p>
                      </div>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs font-bold text-[#800000] hover:bg-slate-100 flex items-center gap-1"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit
                </Button>
              </div>
            </div>

            {/* Tractor Selection Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
              <h3 className="text-base font-bold text-slate-800 mb-4">
                Select Your Tractor
              </h3>

              <div className="relative mb-5">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for your tractor model..."
                  className="pl-9 text-xs rounded-xl bg-slate-50 border-slate-200 focus:border-[#800000]"
                />
              </div>

              <div className="space-y-3">
                {filteredTractors.map((tractor) => {
                  const isSelected = selectedTractor === tractor.id;
                  return (
                    <div
                      key={tractor.id}
                      onClick={() => setSelectedTractor(tractor.id)}
                      className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? "border-[#800000] bg-red-950/5 shadow-sm"
                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center p-2 border border-slate-100 shadow-inner">
                          <Image
                            src={tractor.image}
                            alt={tractor.name}
                            width={64}
                            height={64}
                            className="w-full h-full object-contain"
                            unoptimized
                          />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-800">{tractor.name}</h4>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Model: {tractor.model} • Type: {tractor.type}
                          </p>
                        </div>
                      </div>
                      <input
                        type="radio"
                        name="tractor"
                        checked={isSelected}
                        onChange={() => setSelectedTractor(tractor.id)}
                        className="h-4 w-4 text-[#800000] focus:ring-[#800000]"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Issue Categorization Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Problem Category */}
                <div>
                  <h3 className="text-sm font-bold text-slate-800 mb-3">
                    Problem Category
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                          selectedCategory === cat
                            ? "bg-[#800000] text-white shadow-sm"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Priority Level */}
                <div>
                  <h3 className="text-sm font-bold text-slate-800 mb-3">
                    Priority Level
                  </h3>
                  <div className="flex gap-2">
                    {["LOW", "MEDIUM", "HIGH"].map((level) => (
                      <button
                        key={level}
                        onClick={() => setPriorityLevel(level)}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                          priorityLevel === level
                            ? level === "MEDIUM"
                              ? "bg-orange-600 border-orange-600 text-white shadow-md"
                              : level === "HIGH"
                              ? "bg-red-600 border-red-600 text-white shadow-md"
                              : "bg-slate-700 border-slate-700 text-white shadow-md"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Specific Issues List */}
              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-3">Select Issues</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {issueOptions.map((issue) => {
                    const isChecked = selectedIssues.includes(issue);
                    return (
                      <label
                        key={issue}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          isChecked
                            ? "border-[#800000]/50 bg-red-950/5 font-semibold text-slate-900"
                            : "border-slate-200 hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleIssue(issue)}
                          className="h-4 w-4 rounded text-[#800000] focus:ring-[#800000]"
                        />
                        <span className="text-xs">{issue}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Additional Details */}
              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-2">
                  Additional Details (Optional)
                </h3>
                <textarea
                  value={additionalDetails}
                  onChange={(e) => setAdditionalDetails(e.target.value)}
                  placeholder="Describe the problem in detail..."
                  rows={4}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:ring-1 focus:ring-[#800000] focus:bg-white transition-all outline-none resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
                <Button variant="ghost" className="text-xs text-slate-500 font-bold px-5">
                  Cancel
                </Button>
                <Button className="bg-[#800000] hover:bg-[#570000] text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-sm flex items-center gap-2">
                  Continue to Review <ArrowRight className="w-4 h-4" />
                </Button>
                <Button className="bg-orange-600 hover:bg-orange-500 text-white text-xs font-extrabold px-6 py-2.5 rounded-xl shadow-md uppercase tracking-wider flex items-center gap-2">
                  <Wrench className="w-4 h-4" /> Book Mechanic
                </Button>
              </div>
            </div>
          </div>

          {/* Right Column: Context & Summary (4 Cols) */}
          <div className="col-span-12 xl:col-span-4 space-y-6">
            {/* Nearby Repair Stores Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="h-44 bg-slate-800 relative">
                <Image
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDM2DNZoWZ_ZgYQGfw9lIZ6vwC46uKYu_RFzpCeiWrlyGw-Fbm9Iw-vitXCYhEQfNmScooue83e7oE1E0cs6Pi4Uu-cVceZSGQywL7P5i3W8A6d5Yjh6neienxOyotCSZnn1iWcRYbs86nq-2u4W-jk49Ydm5CGEQlyx9gNqTBp2S5jhVU_9o-xeY934N4nZa_m3ehCzRQGzOh2EUCiOf-5xdarEVg-c9LIPFHSV0X54JnDHGPSyEo"
                  alt="Map View"
                  fill
                  className="object-cover opacity-80"
                  unoptimized
                />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                  <div className="bg-[#800000] text-white p-2.5 rounded-full shadow-lg">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <span className="bg-white/90 backdrop-blur-md px-2.5 py-0.5 mt-1.5 rounded-md shadow text-[10px] font-extrabold text-slate-800">
                    Live
                  </span>
                </div>
              </div>

              <div className="p-5">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="text-base font-bold text-slate-800">
                    Nearby Repair Stores (15)
                  </h3>
                  <Link
                    href="/owner/stores"
                    className="text-xs font-bold text-[#800000] hover:underline flex items-center gap-1"
                  >
                    See All <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
                <p className="text-xs text-slate-500 mb-4">
                  Showing service centers near your current location.
                </p>

                {/* Store List Mini Card */}
                <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                  <div className="border border-slate-200 rounded-xl p-4 hover:border-[#800000]/40 transition-all cursor-pointer bg-slate-50/50">
                    <div className="flex justify-between items-start mb-1.5">
                      <h4 className="text-sm font-bold text-[#800000]">Store1</h4>
                      <span className="flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-100">
                        4.5 <Star className="w-3 h-3 fill-orange-500 text-orange-500" />
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mb-3 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" /> 5.4 km away
                    </p>
                    <Button
                      variant="outline"
                      className="w-full text-xs font-bold py-1.5 h-auto text-[#800000] hover:bg-[#800000] hover:text-white transition-all"
                    >
                      Details
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Active Repairs / Status Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-bold text-slate-800">Active Repairs</h3>
              </div>

              <div className="space-y-4">
                {/* Repair Item 1 */}
                <div className="flex gap-3.5 p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                  <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                    <Wrench className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xs font-bold text-slate-800">Hydraulic Leak Fix</h4>
                    <p className="text-[11px] text-slate-500">MF 9563 Smart 4WD</p>
                    <div className="mt-2 w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-orange-500 h-1.5 rounded-full" style={{ width: "60%" }} />
                    </div>
                    <p className="text-[10px] font-semibold text-orange-600 mt-1 text-right">
                      In Progress
                    </p>
                  </div>
                </div>

                {/* Repair Item 2 */}
                <div className="flex gap-3.5 p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xs font-bold text-slate-800">Regular Maintenance</h4>
                    <p className="text-[11px] text-slate-500">New Holland 3032</p>
                    <p className="text-[10px] font-bold text-blue-600 mt-1">
                      Scheduled for Tomorrow
                    </p>
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full mt-4 text-xs font-bold py-2 h-auto text-slate-600 hover:text-[#800000] border-slate-200"
              >
                View History
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Mechanic Modal */}
      <AddMechanicModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddSuccess={() => {
          setIsModalOpen(false);
          fetchMechanics();
        }}
      />
    </div>
  );
}
