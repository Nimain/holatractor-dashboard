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
import subcontinentRegions, { countryArray } from "@/utils/AllSubContinentDetails";
import {
  Globe,
  Plus,
  Search,
  RefreshCw,
  Building2,
  Trash2,
  MapPin,
  CheckCircle2,
  Sparkles,
  Phone,
} from "lucide-react";

export interface CountryItem {
  id: string;
  name: string;
  region?: string;
  country_code?: string;
  city_count?: number;
  createdAt?: string;
}

const CountrySection = () => {
  const { cookie } = useCookie();
  const access_token = cookie.get("access_token");

  const [countries, setCountries] = useState<CountryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Add Country Dialog
  const [addOpen, setAddOpen] = useState(false);
  const [selectedCountryName, setSelectedCountryName] = useState("");
  const [callingCode, setCallingCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Derive Continent/Region from country name
  function getContinentByCountry(name: string): string {
    for (const [continent, list] of Object.entries(subcontinentRegions)) {
      if ((list as string[]).includes(name)) {
        return continent;
      }
    }
    return "Global";
  }

  // Fetch Countries
  const fetchCountries = useCallback(async () => {
    setLoading(true);
    let loaded = false;

    // 1. Next.js PostgreSQL API
    try {
      const res = await axios.get("/api/country", { timeout: 6000 });
      if (Array.isArray(res.data)) {
        setCountries(res.data);
        loaded = true;
      }
    } catch (e) {
      console.warn("Direct /api/country notice:", e);
    }

    // 2. NestJS Fallback
    if (!loaded) {
      try {
        const res = await renderInstance.get("/country", {
          headers: access_token ? { Authorization: `Bearer ${access_token}` } : {},
        });
        if (Array.isArray(res.data)) {
          setCountries(res.data);
        }
      } catch (err) {
        errorMessage("Error fetching countries");
      }
    }

    setLoading(false);
  }, [access_token]);

  useEffect(() => {
    fetchCountries();
  }, [fetchCountries]);

  // Add Country Handler
  const handleAddCountry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCountryName.trim()) {
      errorMessage("Please choose or enter a country");
      return;
    }

    setIsSubmitting(true);
    const region = getContinentByCountry(selectedCountryName.trim());

    try {
      const res = await axios.post("/api/country", {
        name: selectedCountryName.trim(),
        region,
        country_code: callingCode.trim(),
      });

      if (res.data?.id) {
        successMessage(`Country '${selectedCountryName}' added successfully!`);
        setSelectedCountryName("");
        setCallingCode("");
        setAddOpen(false);
        fetchCountries();
      } else {
        errorMessage("Failed to add country");
      }
    } catch (err: any) {
      errorMessage(err?.response?.data?.error || "Error adding country");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Country Handler
  const handleDeleteCountry = async (c: CountryItem) => {
    if (!window.confirm(`Are you sure you want to delete ${c.name}? This will also delete any linked cities.`)) {
      return;
    }

    try {
      const res = await axios.delete(`/api/country?id=${c.id}`);
      if (res.data?.success || res.status === 200) {
        successMessage(`Country '${c.name}' deleted.`);
        fetchCountries();
      } else {
        errorMessage(res.data?.error || "Failed to delete country");
      }
    } catch (err: any) {
      errorMessage(err?.response?.data?.error || "Error deleting country");
    }
  };

  // Filtered Countries
  const filteredCountries = useMemo(() => {
    if (!searchQuery.trim()) return countries;
    const q = searchQuery.toLowerCase().trim();
    return countries.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.region && c.region.toLowerCase().includes(q)) ||
        (c.country_code && c.country_code.toLowerCase().includes(q))
    );
  }, [countries, searchQuery]);

  const totalCities = useMemo(() => {
    return countries.reduce((acc, c) => acc + (c.city_count || 0), 0);
  }, [countries]);

  return (
    <div className="w-full py-2 space-y-6 max-w-7xl mx-auto">
      {/* 1. Header with Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-slate-900 to-emerald-800 text-white flex items-center justify-center shadow-lg shadow-emerald-900/20">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              Operating Countries & Regions
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                {countries.length} Jurisdictions
              </span>
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Manage supported international territories, regional currency contexts, and phone prefixes.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchCountries}
            disabled={loading}
            className="rounded-xl border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 gap-2 h-9 px-3.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-emerald-600" : "text-slate-500"}`} />
            Refresh
          </Button>

          <Link href="/City">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 gap-1.5 h-9 px-3.5"
            >
              <Building2 className="w-3.5 h-3.5 text-emerald-600" /> Manage Cities
            </Button>
          </Link>

          {/* Add Country Dialog */}
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-9 px-4 gap-1.5 shadow-md shadow-emerald-600/20">
                <Plus className="w-4 h-4" /> Add Country
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-md p-6 rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                  <Globe className="w-5 h-5 text-emerald-600" />
                  Add Operating Territory
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handleAddCountry} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase text-slate-600">Country Name *</Label>
                  <Input
                    list="country-suggestions"
                    placeholder="e.g. Argentina, Bolivia, India, Peru"
                    value={selectedCountryName}
                    onChange={(e) => setSelectedCountryName(e.target.value)}
                    required
                    className="rounded-xl"
                  />
                  <datalist id="country-suggestions">
                    {countryArray.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase text-slate-600">International Dialing Code</Label>
                  <Input
                    placeholder="e.g. +54, +591, +91, +51"
                    value={callingCode}
                    onChange={(e) => setCallingCode(e.target.value)}
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
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 gap-2"
                  >
                    {isSubmitting ? "Adding..." : "Add Country"}
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
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center font-bold">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Active Countries</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{countries.length}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center font-bold">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Cities Mapped</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalCities}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center font-bold">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Coverage Status</p>
            <p className="text-base font-bold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Global Hub
            </p>
          </div>
        </div>
      </div>

      {/* 3. Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search countries, dialing code, region..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-xl h-10 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50"
          />
        </div>
      </div>

      {/* 4. Countries Grid */}
      {loading ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-4 shadow-sm">
          <RefreshCw className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
          <p className="text-sm font-medium text-slate-500">Querying country database...</p>
        </div>
      ) : filteredCountries.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 mx-auto flex items-center justify-center">
            <Globe className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Countries Found</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
              {searchQuery ? `No country matching "${searchQuery}".` : "No operating countries registered."}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCountries.map((c) => (
            <div
              key={c.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 space-y-4 shadow-sm hover:border-emerald-500/50 hover:shadow-lg transition-all flex flex-col justify-between"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center text-base border border-emerald-100 dark:border-emerald-900">
                    {c.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {c.name}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Region: {c.region || "Global"}
                    </p>
                  </div>
                </div>

                {c.country_code && (
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {c.country_code}
                  </span>
                )}
              </div>

              <div className="space-y-2 text-xs py-2 border-y border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" /> Registered Cities:
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {c.city_count || 0} cities
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <Link
                  href="/City"
                  className="flex-1 text-center py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <Building2 className="w-3.5 h-3.5" /> View Cities
                </Link>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteCountry(c)}
                  className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl"
                  title="Delete Country"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CountrySection;
