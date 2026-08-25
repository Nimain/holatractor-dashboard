"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import axios from "axios";
import Link from "next/link";
import { useCookie } from "next-cookie";
import { renderInstance } from "@/utils/Axios/RenderInstance";
import { errorMessage, successMessage } from "@/utils/Toastify/Messages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Globe,
  Plus,
  Search,
  RefreshCw,
  Trash2,
  MapPin,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";

export interface CityItem {
  id: string;
  name: string;
  country_id: string;
  country_name?: string;
  country_code?: string;
  createdAt?: string;
}

export interface CountryItem {
  id: string;
  name: string;
  country_code?: string;
}

const CitySection = () => {
  const { cookie } = useCookie();
  const access_token = cookie.get("access_token");

  const [cities, setCities] = useState<CityItem[]>([]);
  const [countries, setCountries] = useState<CountryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountryFilter, setSelectedCountryFilter] = useState("all");

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(18);

  // Add City Dialog
  const [addOpen, setAddOpen] = useState(false);
  const [newCityName, setNewCityName] = useState("");
  const [newCityCountryId, setNewCityCountryId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch Cities and Countries
  const fetchData = useCallback(async () => {
    setLoading(true);

    // 1. Fetch Countries
    try {
      const countryRes = await axios.get("/api/country", { timeout: 6000 });
      if (Array.isArray(countryRes.data)) {
        setCountries(countryRes.data);
        if (countryRes.data.length > 0 && !newCityCountryId) {
          setNewCityCountryId(countryRes.data[0].id);
        }
      }
    } catch (e) {
      console.warn("Fetch countries notice:", e);
    }

    // 2. Fetch Cities
    let loadedCities = false;
    try {
      const cityRes = await axios.get("/api/city", { timeout: 6000 });
      if (Array.isArray(cityRes.data)) {
        setCities(cityRes.data);
        loadedCities = true;
      }
    } catch (e) {
      console.warn("Direct /api/city notice:", e);
    }

    // 3. NestJS fallback
    if (!loadedCities) {
      try {
        const res = await renderInstance.get("/city", {
          headers: access_token ? { Authorization: `Bearer ${access_token}` } : {},
        });
        if (Array.isArray(res.data)) {
          setCities(res.data);
        }
      } catch (err) {
        errorMessage("Error fetching cities");
      }
    }

    setLoading(false);
  }, [access_token, newCityCountryId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Add City Handler
  const handleAddCity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCityName.trim()) {
      errorMessage("Please enter a city name");
      return;
    }
    if (!newCityCountryId) {
      errorMessage("Please select a parent country");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await axios.post("/api/city", {
        name: newCityName.trim(),
        country_id: newCityCountryId,
      });

      if (res.data?.id) {
        successMessage(`City '${newCityName}' added successfully!`);
        setNewCityName("");
        setAddOpen(false);
        fetchData();
      } else {
        errorMessage("Failed to add city");
      }
    } catch (err: any) {
      errorMessage(err?.response?.data?.error || "Error adding city");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete City Handler
  const handleDeleteCity = async (c: CityItem) => {
    if (!window.confirm(`Are you sure you want to delete ${c.name}?`)) {
      return;
    }

    try {
      const res = await axios.delete(`/api/city?id=${c.id}`);
      if (res.data?.success || res.status === 200) {
        successMessage(`City '${c.name}' deleted.`);
        fetchData();
      } else {
        errorMessage(res.data?.error || "Failed to delete city");
      }
    } catch (err: any) {
      errorMessage(err?.response?.data?.error || "Error deleting city");
    }
  };

  // Filtered Cities
  const filteredCities = useMemo(() => {
    return cities.filter((c) => {
      const matchesCountry =
        selectedCountryFilter === "all" || c.country_id === selectedCountryFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        c.name.toLowerCase().includes(q) ||
        (c.country_name && c.country_name.toLowerCase().includes(q));
      return matchesCountry && matchesQuery;
    });
  }, [cities, searchQuery, selectedCountryFilter]);

  const totalPages = Math.ceil(filteredCities.length / pageSize) || 1;
  const paginatedCities = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredCities.slice(start, start + pageSize);
  }, [filteredCities, page, pageSize]);

  return (
    <div className="w-full py-2 space-y-6 max-w-7xl mx-auto">
      {/* 1. Header with Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-slate-900 to-blue-800 text-white flex items-center justify-center shadow-lg shadow-blue-900/20">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              Municipalities & Service Cities
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
                {cities.length} Cities
              </span>
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Configure localized service territories, machinery store deployment hubs, and logistics zones.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
            className="rounded-xl border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 gap-2 h-9 px-3.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-blue-600" : "text-slate-500"}`} />
            Refresh
          </Button>

          <Link href="/Country">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 gap-1.5 h-9 px-3.5"
            >
              <Globe className="w-3.5 h-3.5 text-blue-600" /> View Countries
            </Button>
          </Link>

          {/* Add City Dialog */}
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold h-9 px-4 gap-1.5 shadow-md shadow-blue-600/20">
                <Plus className="w-4 h-4" /> Add City
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-md p-6 rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  Add New City / Municipality
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handleAddCity} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase text-slate-600">Parent Country *</Label>
                  <select
                    value={newCityCountryId}
                    onChange={(e) => setNewCityCountryId(e.target.value)}
                    required
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {countries.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.country_code ? `(${c.country_code})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase text-slate-600">City Name *</Label>
                  <Input
                    placeholder="e.g. Santa Cruz, Cordoba, Rosario, Salta"
                    value={newCityName}
                    onChange={(e) => setNewCityName(e.target.value)}
                    required
                    className="rounded-xl"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setAddOpen(false)}
                    className="rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 gap-2"
                  >
                    {isSubmitting ? "Adding..." : "Add City"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 2. KPI Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center font-bold">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Mapped Cities</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{cities.length}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center font-bold">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Country Jurisdictions</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{countries.length}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center font-bold">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Geo Routing</p>
            <p className="text-base font-bold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Operational
            </p>
          </div>
        </div>
      </div>

      {/* 3. Search & Country Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search cities or territories..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="pl-10 rounded-xl h-10 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Filter Country:</span>
          <select
            value={selectedCountryFilter}
            onChange={(e) => {
              setSelectedCountryFilter(e.target.value);
              setPage(1);
            }}
            className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium focus:outline-none"
          >
            <option value="all">All Countries ({cities.length})</option>
            {countries.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 4. Cities Grid */}
      {loading ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-4 shadow-sm">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
          <p className="text-sm font-medium text-slate-500">Querying city database...</p>
        </div>
      ) : filteredCities.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 mx-auto flex items-center justify-center">
            <Building2 className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Cities Found</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
              {searchQuery ? `No cities match "${searchQuery}".` : "No municipalities registered."}
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {paginatedCities.map((c) => (
              <div
                key={c.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 space-y-3 shadow-sm hover:border-blue-500/50 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center text-xs border border-blue-100 dark:border-blue-900">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate">
                        {c.name}
                      </h4>
                      <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1 truncate">
                        <Globe className="w-3 h-3 text-slate-400" />
                        {c.country_name || "Country Linked"}
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteCity(c)}
                    className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl shrink-0"
                    title="Delete City"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm text-xs">
              <span className="text-slate-500">
                Showing {(page - 1) * pageSize + 1} to{" "}
                {Math.min(page * pageSize, filteredCities.length)} of{" "}
                {filteredCities.length} cities
              </span>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className="rounded-xl h-8 px-2.5"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <Button
                    key={p}
                    variant={page === p ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPage(p)}
                    className={`rounded-xl h-8 w-8 p-0 ${
                      page === p ? "bg-blue-600 hover:bg-blue-700 text-white font-semibold" : ""
                    }`}
                  >
                    {p}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  disabled={page === totalPages}
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
  );
};

export default CitySection;