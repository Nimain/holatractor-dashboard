"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import {
  Briefcase,
  AlertTriangle,
  CheckCircle2,
  Ban,
  Eye,
  RefreshCw,
  Search,
  Layers,
  ShieldAlert,
  MapPin,
  Tractor,
  X,
  Trash2,
  Sparkles,
} from "lucide-react";
import { jobsTranslations, type TranslationDict } from "./JobsTranslations";

interface JobItem {
  id: string;
  store_id: string;
  store_name: string;
  heading: string;
  heading_en?: string | null;
  operation: string;
  operation_en?: string | null;
  machinery: string;
  machinery_specs: string;
  machinery_specs_en?: string | null;
  category: string;
  crop: string;
  crop_en?: string | null;
  hectares: number;
  rate_per_hour: number;
  rate_per_job: number;
  rate_per_month: number;
  location_name: string;
  location_name_en?: string | null;
  latitude: number | null;
  longitude: number | null;
  image: string;
  description: string;
  description_en?: string | null;
  budget_type: string;
  budget_type_en?: string | null;
  experience_level: string;
  experience_level_en?: string | null;
  urgent: boolean;
  rtk: boolean;
  tags: string[];
  tags_en?: string[];
  created_at: string;
  is_active: boolean;
  status: string;
  is_suspicious: boolean;
  suspicion_reason?: string | null;
  deactivation_reason?: string | null;
  deactivated_at?: string | null;
  deactivated_by?: string | null;
}

interface SummaryStats {
  total_jobs: number;
  active_jobs: number;
  suspicious_jobs: number;
  deactivated_jobs: number;
  total_hectares: number;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  tillage: { bg: "bg-amber-100", text: "text-amber-800" },
  seeding: { bg: "bg-emerald-100", text: "text-emerald-800" },
  spraying: { bg: "bg-blue-100", text: "text-blue-800" },
  harvest: { bg: "bg-purple-100", text: "text-purple-800" },
  drone: { bg: "bg-cyan-100", text: "text-cyan-800" },
  transportation: { bg: "bg-slate-100", text: "text-slate-800" },
  transport: { bg: "bg-slate-100", text: "text-slate-800" },
  season: { bg: "bg-orange-100", text: "text-orange-800" },
  special: { bg: "bg-indigo-100", text: "text-indigo-800" },
};

export default function JobsModerationSection() {
  const { language: activeLanguage } = useSelector((state: RootState) => state.ActiveLanguage);
  const langKey = activeLanguage === "en" ? "en" : "es";
  const t: TranslationDict = jobsTranslations[langKey];

  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [summary, setSummary] = useState<SummaryStats>({
    total_jobs: 0,
    active_jobs: 0,
    suspicious_jobs: 0,
    deactivated_jobs: 0,
    total_hectares: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"all" | "active" | "suspicious" | "deactivated">("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Modals state
  const [selectedJob, setSelectedJob] = useState<JobItem | null>(null);
  const [deactivatingJob, setDeactivatingJob] = useState<JobItem | null>(null);
  const [deactivationReason, setDeactivationReason] = useState<string>("");
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `/api/jobs?status=${activeTab}&category=${selectedCategory}&search=${encodeURIComponent(
          searchTerm
        )}&_t=${Date.now()}`
      );
      if (res.data) {
        setJobs(res.data.jobs || []);
        if (res.data.summary) {
          setSummary(res.data.summary);
        }
      }
    } catch (err) {
      console.error("Failed to load jobs:", err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, selectedCategory, searchTerm]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Handle Deactivate / Suspend
  const handleConfirmDeactivate = async () => {
    if (!deactivatingJob) return;
    setActionLoading(true);
    try {
      const finalReason = deactivationReason.trim() || t.presetReasons[0];
      const res = await axios.patch("/api/jobs", {
        job_id: deactivatingJob.id,
        is_active: false,
        status: "suspended",
        reason: finalReason,
        admin_by: "Admin Panel",
      });

      if (res.data?.success) {
        showToast(t.alerts.deactivatedSuccess(deactivatingJob.heading));
        setDeactivatingJob(null);
        setDeactivationReason("");
        fetchJobs();
      }
    } catch (err: any) {
      alert(`${t.alerts.errorDeactivate} ${err.message || err}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Reactivate
  const handleReactivate = async (job: JobItem) => {
    if (!confirm(t.alerts.confirmReactivate(job.heading))) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await axios.patch("/api/jobs", {
        job_id: job.id,
        is_active: true,
        status: "active",
      });
      if (res.data?.success) {
        showToast(t.alerts.reactivatedSuccess(job.heading));
        fetchJobs();
      }
    } catch (err: any) {
      alert(`${t.alerts.errorReactivate} ${err.message || err}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Permanent Delete
  const handleDeleteJob = async (job: JobItem) => {
    if (!confirm(t.alerts.confirmDelete(job.heading))) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await axios.delete(`/api/jobs?id=${job.id}`);
      if (res.data?.success) {
        showToast(t.alerts.deletedSuccess);
        if (selectedJob?.id === job.id) setSelectedJob(null);
        fetchJobs();
      }
    } catch (err: any) {
      alert(`${t.alerts.errorDelete} ${err.message || err}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Category translation helper
  const getCategoryLabel = (catKey: string) => {
    const key = catKey.toLowerCase();
    const categoriesMap = t.categories as Record<string, string>;
    return categoriesMap[key] || catKey.charAt(0).toUpperCase() + catKey.slice(1);
  };

  return (
    <div className="w-full space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-emerald-700 animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header & Subtitle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-bold rounded-full uppercase tracking-wider">
              {t.headerBadge}
            </span>
            <span className="text-xs text-gray-500 font-medium">{t.liveDb}</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 mt-2 flex items-center gap-2">
            <ShieldAlert className="w-7 h-7 text-red-600" />
            {t.mainHeading}
          </h1>
          <p className="text-sm text-gray-600 mt-1 max-w-4xl">{t.subtitle}</p>
        </div>

        <button
          onClick={fetchJobs}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-xl text-sm transition-colors border border-gray-300 self-start md:self-center"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-red-600" : ""}`} />
          {t.refresh}
        </button>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Total Jobs */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase">{t.kpi.totalJobs}</span>
            <div className="p-2 bg-gray-100 rounded-lg">
              <Briefcase className="w-4 h-4 text-gray-700" />
            </div>
          </div>
          <p className="text-3xl font-black text-gray-900 mt-2">{summary.total_jobs}</p>
          <span className="text-xs text-gray-500 font-medium mt-1 inline-block">
            {t.kpi.totalJobsSub}
          </span>
        </div>

        {/* Active Jobs */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm bg-gradient-to-br from-white to-emerald-50/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 uppercase">{t.kpi.activeJobs}</span>
            <div className="p-2 bg-emerald-100 rounded-lg">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            </div>
          </div>
          <p className="text-3xl font-black text-emerald-800 mt-2">{summary.active_jobs}</p>
          <span className="text-xs text-emerald-600 font-medium mt-1 inline-block">
            {t.kpi.activeJobsSub}
          </span>
        </div>

        {/* Suspicious Jobs */}
        <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-sm bg-gradient-to-br from-white to-amber-50/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 uppercase">
              {t.kpi.suspiciousJobs}
            </span>
            <div className="p-2 bg-amber-100 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-amber-700" />
            </div>
          </div>
          <p className="text-3xl font-black text-amber-700 mt-2">{summary.suspicious_jobs}</p>
          <span className="text-xs text-amber-600 font-medium mt-1 inline-block">
            {t.kpi.suspiciousJobsSub}
          </span>
        </div>

        {/* Deactivated Jobs */}
        <div className="bg-white p-5 rounded-2xl border border-red-200 shadow-sm bg-gradient-to-br from-white to-red-50/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-700 uppercase">
              {t.kpi.deactivatedJobs}
            </span>
            <div className="p-2 bg-red-100 rounded-lg">
              <Ban className="w-4 h-4 text-red-700" />
            </div>
          </div>
          <p className="text-3xl font-black text-red-700 mt-2">{summary.deactivated_jobs}</p>
          <span className="text-xs text-red-600 font-medium mt-1 inline-block">
            {t.kpi.deactivatedJobsSub}
          </span>
        </div>

        {/* Total Area */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm col-span-2 md:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase">{t.kpi.totalArea}</span>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Layers className="w-4 h-4 text-blue-700" />
            </div>
          </div>
          <p className="text-3xl font-black text-gray-900 mt-2">{summary.total_hectares} Ha</p>
          <span className="text-xs text-gray-500 font-medium mt-1 inline-block">
            {t.kpi.totalAreaSub}
          </span>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex items-center bg-gray-100 p-1.5 rounded-xl gap-1 w-full md:w-auto overflow-x-auto">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "all"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {t.tabs.all} ({summary.total_jobs})
          </button>
          <button
            onClick={() => setActiveTab("active")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "active"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            {t.tabs.active} ({summary.active_jobs})
          </button>
          <button
            onClick={() => setActiveTab("suspicious")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "suspicious"
                ? "bg-amber-600 text-white shadow-sm"
                : "text-gray-600 hover:text-amber-800"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            {t.tabs.suspicious} ({summary.suspicious_jobs})
          </button>
          <button
            onClick={() => setActiveTab("deactivated")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "deactivated"
                ? "bg-red-600 text-white shadow-sm"
                : "text-gray-600 hover:text-red-800"
            }`}
          >
            <Ban className="w-3.5 h-3.5" />
            {t.tabs.deactivated} ({summary.deactivated_jobs})
          </button>
        </div>

        {/* Search & Category dropdown */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="all">{t.categories.all}</option>
            <option value="tillage">{t.categories.tillage}</option>
            <option value="seeding">{t.categories.seeding}</option>
            <option value="spraying">{t.categories.spraying}</option>
            <option value="harvest">{t.categories.harvest}</option>
            <option value="drone">{t.categories.drone}</option>
            <option value="transportation">{t.categories.transportation}</option>
            <option value="season">{t.categories.season}</option>
            <option value="special">{t.categories.special}</option>
          </select>
        </div>
      </div>

      {/* Main Jobs Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">{t.tableHeaders.jobStore}</th>
                <th className="py-3.5 px-4">{t.tableHeaders.categoryCrop}</th>
                <th className="py-3.5 px-4">{t.tableHeaders.machineryArea}</th>
                <th className="py-3.5 px-4">{t.tableHeaders.compensation}</th>
                <th className="py-3.5 px-4">{t.tableHeaders.riskLevel}</th>
                <th className="py-3.5 px-4">{t.tableHeaders.status}</th>
                <th className="py-3.5 px-4 text-right">{t.tableHeaders.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500 font-medium">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-red-600 mb-2" />
                    {t.tableRows.loading}
                  </td>
                </tr>
              ) : jobs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500 font-medium">
                    <Briefcase className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    {t.tableRows.noResults}
                  </td>
                </tr>
              ) : (
                jobs.map((job) => {
                  const catKey = job.category.toLowerCase();
                  const catColor = CATEGORY_COLORS[catKey] || {
                    bg: "bg-gray-100",
                    text: "text-gray-800",
                  };
                  const catLabel = getCategoryLabel(job.category);

                  const displayHeading =
                    langKey === "en" ? job.heading_en || job.heading : job.heading;
                  const displayCrop =
                    langKey === "en" ? job.crop_en || job.crop : job.crop || t.tableRows.notSpecified;
                  const displaySpecs =
                    langKey === "en"
                      ? job.machinery_specs_en || job.machinery_specs
                      : job.machinery_specs;
                  const displayBudgetType =
                    langKey === "en"
                      ? job.budget_type_en || job.budget_type
                      : job.budget_type;

                  return (
                    <tr
                      key={job.id}
                      className={`hover:bg-gray-50/80 transition-colors ${
                        !job.is_active ? "bg-red-50/30" : job.is_suspicious ? "bg-amber-50/30" : ""
                      }`}
                    >
                      {/* Job & Store info */}
                      <td className="py-4 px-4">
                        <div className="flex items-start gap-3">
                          <img
                            src={
                              job.image ||
                              "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=300"
                            }
                            alt={displayHeading}
                            className="w-12 h-12 rounded-xl object-cover border border-gray-200 shrink-0"
                          />
                          <div>
                            <span className="font-bold text-gray-900 block text-sm leading-snug">
                              {displayHeading}
                            </span>
                            <div className="flex items-center gap-2 mt-1 text-gray-500">
                              <span className="font-semibold text-gray-700">{job.store_name}</span>
                              <span>•</span>
                              <span className="font-mono text-[11px] text-gray-400">{job.id}</span>
                            </div>
                            <span className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-gray-400" />
                              {job.location_name || t.tableRows.noLocation}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Category & Crop */}
                      <td className="py-4 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full font-bold text-[11px] ${catColor.bg} ${catColor.text}`}
                        >
                          {catLabel}
                        </span>
                        <div className="font-semibold text-gray-800 mt-1.5 flex items-center gap-1">
                          {t.tableRows.crop}:{" "}
                          <span className="font-medium text-gray-600">{displayCrop}</span>
                        </div>
                      </td>

                      {/* Machinery & Area */}
                      <td className="py-4 px-4">
                        <span className="font-bold text-gray-900 block flex items-center gap-1.5">
                          <Tractor className="w-3.5 h-3.5 text-gray-600" />
                          {job.machinery}
                        </span>
                        <span className="text-gray-500 block text-[11px] mt-0.5">
                          {job.hectares} {t.tableRows.hectares}
                        </span>
                        {job.rtk ? (
                          <span className="inline-flex items-center gap-1.5 mt-1 px-2 py-0.5 bg-sky-50 text-sky-800 border border-sky-200 rounded-md text-[10px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse"></span>
                            {t.tableRows.rtkActive}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-gray-100 text-gray-600 border border-gray-200 rounded-md text-[10px] font-medium">
                            {t.tableRows.standardGps}
                          </span>
                        )}
                      </td>

                      {/* Rates */}
                      <td className="py-4 px-4">
                        <div className="font-extrabold text-gray-900 text-sm">
                          ${job.rate_per_hour}/hr
                        </div>
                        <span className="text-gray-500 text-[11px] block">
                          ${job.rate_per_job} {t.tableRows.totalPerJob}
                        </span>
                        <span className="text-[10px] text-gray-400 uppercase font-bold">
                          {displayBudgetType}
                        </span>
                      </td>

                      {/* Risk Indicator */}
                      <td className="py-4 px-4">
                        {job.is_suspicious ? (
                          <div className="space-y-1">
                            <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full font-bold text-[11px] inline-flex items-center gap-1 border border-amber-300">
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              {t.tableRows.suspicious}
                            </span>
                            {job.suspicion_reason && (
                              <p className="text-[10px] text-amber-700 max-w-[180px] leading-tight">
                                {job.suspicion_reason}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[11px] inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            {t.tableRows.safe}
                          </span>
                        )}
                      </td>

                      {/* Status badge */}
                      <td className="py-4 px-4">
                        {job.is_active ? (
                          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[11px] inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            {t.tableRows.active}
                          </span>
                        ) : (
                          <div>
                            <span className="px-2.5 py-1 bg-red-100 text-red-800 rounded-full font-bold text-[11px] inline-flex items-center gap-1 border border-red-200">
                              <Ban className="w-3 h-3 text-red-600" />
                              {t.tableRows.deactivated}
                            </span>
                            {job.deactivation_reason && (
                              <p className="text-[10px] text-red-600 max-w-[150px] mt-1 leading-tight line-clamp-2">
                                {job.deactivation_reason}
                              </p>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Action buttons */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedJob(job)}
                            className="p-2 text-gray-500 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                            title={t.tableRows.viewDetails}
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {job.is_active ? (
                            <button
                              onClick={() => {
                                setDeactivatingJob(job);
                                setDeactivationReason(job.suspicion_reason || "");
                              }}
                              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                            >
                              <Ban className="w-3.5 h-3.5" />
                              {t.tableRows.deactivate}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleReactivate(job)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              {t.tableRows.reactivate}
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteJob(job)}
                            className="p-2 text-red-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                            title={t.tableRows.deletePermanently}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal 1: Deactivate Confirmation & Reason ────────────────── */}
      {deactivatingJob && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-red-100 text-red-600 rounded-2xl">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900">{t.deactivateModal.title}</h3>
                  <p className="text-xs text-gray-500">{t.deactivateModal.subtitle}</p>
                </div>
              </div>
              <button
                onClick={() => setDeactivatingJob(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200">
                <span className="text-xs font-bold text-gray-500 uppercase block">
                  {t.deactivateModal.jobToSuspend}
                </span>
                <span className="font-extrabold text-sm text-gray-900 block mt-0.5">
                  {langKey === "en" ? deactivatingJob.heading_en || deactivatingJob.heading : deactivatingJob.heading}
                </span>
                <span className="text-xs text-gray-600">
                  {deactivatingJob.store_name} • {deactivatingJob.location_name}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
                  {t.deactivateModal.selectReason}
                </label>
                <div className="space-y-2">
                  {t.presetReasons.map((reason, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setDeactivationReason(reason)}
                      className={`w-full text-left p-3 rounded-xl border text-xs font-medium transition-all ${
                        deactivationReason === reason
                          ? "bg-red-50 border-red-500 text-red-900 font-bold"
                          : "bg-white border-gray-200 hover:border-gray-300 text-gray-700"
                      }`}
                    >
                      {reason}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  {t.deactivateModal.orWriteReason}
                </label>
                <textarea
                  rows={2}
                  value={deactivationReason}
                  onChange={(e) => setDeactivationReason(e.target.value)}
                  placeholder={t.deactivateModal.placeholder}
                  className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setDeactivatingJob(null)}
                className="px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-50"
              >
                {t.deactivateModal.cancel}
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleConfirmDeactivate}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2"
              >
                {actionLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
                {t.deactivateModal.confirm}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal 2: Full Job Inspector ──────────────────────────────── */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-gray-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <span className="p-2.5 bg-gray-100 rounded-2xl">
                  <Briefcase className="w-6 h-6 text-gray-800" />
                </span>
                <div>
                  <h3 className="text-lg font-black text-gray-900">
                    {langKey === "en" ? selectedJob.heading_en || selectedJob.heading : selectedJob.heading}
                  </h3>
                  <span className="text-xs text-gray-500">ID: {selectedJob.id}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-5 space-y-5 text-xs">
              <img
                src={
                  selectedJob.image ||
                  "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=800"
                }
                alt={selectedJob.heading}
                className="w-full h-48 rounded-2xl object-cover border border-gray-200"
              />

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-200">
                <div>
                  <span className="text-gray-400 uppercase font-bold text-[10px]">
                    {t.inspectorModal.store}
                  </span>
                  <p className="font-bold text-gray-900 mt-0.5">{selectedJob.store_name}</p>
                </div>
                <div>
                  <span className="text-gray-400 uppercase font-bold text-[10px]">
                    {t.inspectorModal.rateHour}
                  </span>
                  <p className="font-extrabold text-gray-900 text-sm mt-0.5">
                    ${selectedJob.rate_per_hour} USD
                  </p>
                </div>
                <div>
                  <span className="text-gray-400 uppercase font-bold text-[10px]">
                    {t.inspectorModal.rateJob}
                  </span>
                  <p className="font-extrabold text-gray-900 text-sm mt-0.5">
                    ${selectedJob.rate_per_job} USD
                  </p>
                </div>
                <div>
                  <span className="text-gray-400 uppercase font-bold text-[10px]">
                    {t.inspectorModal.area}
                  </span>
                  <p className="font-bold text-gray-900 mt-0.5">
                    {selectedJob.hectares} {t.tableRows.hectares}
                  </p>
                </div>
              </div>

              <div>
                <span className="text-gray-500 uppercase font-bold text-[10px] block mb-1">
                  {t.inspectorModal.description}
                </span>
                <p className="text-gray-800 bg-gray-50 p-3.5 rounded-xl border border-gray-200 leading-relaxed">
                  {langKey === "en"
                    ? selectedJob.description_en || selectedJob.description
                    : selectedJob.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <span className="text-gray-400 uppercase font-bold text-[10px] block">
                    {t.inspectorModal.specs}
                  </span>
                  <p className="font-semibold text-gray-900 mt-1">{selectedJob.machinery}</p>
                  <p className="text-gray-600 mt-0.5">
                    {langKey === "en"
                      ? selectedJob.machinery_specs_en || selectedJob.machinery_specs
                      : selectedJob.machinery_specs}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <span className="text-gray-400 uppercase font-bold text-[10px] block">
                    {t.inspectorModal.locationCrop}
                  </span>
                  <p className="font-semibold text-gray-900 mt-1">{selectedJob.location_name}</p>
                  <p className="text-gray-600 mt-0.5">
                    {t.tableRows.crop}:{" "}
                    {langKey === "en" ? selectedJob.crop_en || selectedJob.crop : selectedJob.crop} •{" "}
                    {getCategoryLabel(selectedJob.category)}
                  </p>
                </div>
              </div>

              {/* GNSS / RTK Telemetry Guidance Status */}
              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200">
                <span className="text-gray-400 uppercase font-bold text-[10px] block">
                  {t.inspectorModal.telemetryTitle}
                </span>
                <div className="flex items-center gap-2 mt-1.5">
                  {selectedJob.rtk ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-sky-100 text-sky-900 border border-sky-300 rounded-lg text-xs font-bold">
                      <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></span>
                      {t.inspectorModal.rtkRequired}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-200 text-gray-700 border border-gray-300 rounded-lg text-xs font-medium">
                      {t.inspectorModal.standardGpsRequired}
                    </span>
                  )}
                </div>
              </div>

              {/* Moderation audit banner */}
              <div
                className={`p-4 rounded-2xl border ${
                  selectedJob.is_active
                    ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                    : "bg-red-50 border-red-200 text-red-900"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold uppercase text-[11px]">
                    {t.inspectorModal.platformStatus}:{" "}
                    {selectedJob.is_active
                      ? t.inspectorModal.activePublished
                      : t.inspectorModal.deactivatedHidden}
                  </span>
                  <span className="text-[10px] font-semibold">{selectedJob.created_at}</span>
                </div>
                {selectedJob.deactivation_reason && (
                  <p className="mt-2 text-xs font-semibold text-red-800">
                    {t.inspectorModal.deactivationReason}: {selectedJob.deactivation_reason} (
                    {t.inspectorModal.by} {selectedJob.deactivated_by || "admin"})
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setSelectedJob(null)}
                className="px-4 py-2 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-50"
              >
                {t.inspectorModal.close}
              </button>
              {selectedJob.is_active ? (
                <button
                  type="button"
                  onClick={() => {
                    setDeactivatingJob(selectedJob);
                    setSelectedJob(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all"
                >
                  {t.inspectorModal.deactivateJob}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    handleReactivate(selectedJob);
                    setSelectedJob(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all"
                >
                  {t.inspectorModal.reactivateJob}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
