"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Plus,
  Trash2,
  Check,
  CheckCircle2,
  Building2,
  Tractor,
  Store,
  Clock,
  DollarSign,
  Tag,
  ShieldCheck,
  Percent,
  Calendar,
  X,
  Zap,
} from "lucide-react";
import axios from "axios";
import { renderInstance } from "@/utils/Axios/RenderInstance";
import { successMessage, errorMessage } from "@/utils/Toastify/Messages";
import { CircularProgress } from "@mui/material";
import { useCookie } from "next-cookie";

export interface SubscriptionFormData {
  id?: string;
  name: string;
  type: "Basic" | "Business" | "Premium" | "Custom";
  actual_cost: number;
  discount_cost: number;
  total_days: number;
  total_stores: number;
  total_tractors: number;
  total_attachments: number;
  total_devices?: number;
  total_operators?: number;
  for_owner: boolean;
  for_dealer: boolean;
  features: string[];
  focused_features: string[];
}

interface CreateSubscriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  initialData?: SubscriptionFormData | null;
  mode?: "create" | "edit";
}

const DEFAULT_FORM: SubscriptionFormData = {
  name: "",
  type: "Basic",
  actual_cost: 99,
  discount_cost: 79,
  total_days: 30,
  total_stores: 2,
  total_tractors: 5,
  total_attachments: 5,
  total_devices: 1,
  total_operators: 3,
  for_owner: true,
  for_dealer: false,
  features: ["Fleet GPS Tracking (Standard)", "Booking & Schedule Management"],
  focused_features: ["Priority Listing in Local Searches"],
};

export default function CreateSubscriptionModal({
  open,
  onOpenChange,
  onSuccess,
  initialData,
  mode = "create",
}: CreateSubscriptionModalProps) {
  const [formData, setFormData] = useState<SubscriptionFormData>(DEFAULT_FORM);
  const [featureInput, setFeatureInput] = useState("");
  const [focusedFeatureInput, setFocusedFeatureInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "quotas" | "features">("general");

  const { cookie } = useCookie();
  const access_token = cookie.get("access_token");

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...DEFAULT_FORM,
        ...initialData,
        type: (initialData.type as any) || "Basic",
        actual_cost: Number(initialData.actual_cost) || 0,
        discount_cost: Number(initialData.discount_cost) || 0,
        total_days: Number(initialData.total_days) || 30,
        total_stores: Number(initialData.total_stores) || 1,
        total_tractors: Number(initialData.total_tractors) || 5,
        total_attachments: Number(initialData.total_attachments) || 5,
        features: Array.isArray(initialData.features) ? initialData.features : [],
        focused_features: Array.isArray(initialData.focused_features) ? initialData.focused_features : [],
        for_owner: Boolean(initialData.for_owner),
        for_dealer: Boolean(initialData.for_dealer),
      });
    } else {
      setFormData(DEFAULT_FORM);
    }
  }, [initialData, open]);

  const discountPercent =
    formData.actual_cost > 0 && formData.discount_cost < formData.actual_cost
      ? Math.round(((formData.actual_cost - formData.discount_cost) / formData.actual_cost) * 100)
      : 0;

  const handleAddFeature = () => {
    if (!featureInput.trim()) return;
    if (formData.features.includes(featureInput.trim())) return;
    setFormData((prev) => ({
      ...prev,
      features: [...prev.features, featureInput.trim()],
    }));
    setFeatureInput("");
  };

  const handleRemoveFeature = (idx: number) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== idx),
    }));
  };

  const handleAddFocusedFeature = () => {
    if (!focusedFeatureInput.trim()) return;
    if (formData.focused_features.includes(focusedFeatureInput.trim())) return;
    setFormData((prev) => ({
      ...prev,
      focused_features: [...prev.focused_features, focusedFeatureInput.trim()],
    }));
    setFocusedFeatureInput("");
  };

  const handleRemoveFocusedFeature = (idx: number) => {
    setFormData((prev) => ({
      ...prev,
      focused_features: prev.focused_features.filter((_, i) => i !== idx),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      errorMessage("Please provide a plan name");
      return;
    }
    if (!formData.for_owner && !formData.for_dealer) {
      errorMessage("Please select at least one target audience (Owner or Dealer)");
      return;
    }
    if (formData.actual_cost <= 0) {
      errorMessage("Actual cost must be greater than 0");
      return;
    }

    setLoading(true);
    let success = false;
    let lastErrDetail = "";

    try {
      if (mode === "edit" && formData.id) {
        // Try local Next.js API route first
        try {
          await axios.patch(`/api/subscription/${formData.id}`, formData, {
            headers: { Authorization: `Bearer ${access_token}` },
            timeout: 6000,
          });
          success = true;
        } catch (localErr: any) {
          lastErrDetail = localErr?.response?.data?.detail || localErr?.message || "";
          // Fallback to FastAPI renderInstance
          await renderInstance.patch(`/subscription/${formData.id}`, formData, {
            headers: { Authorization: `Bearer ${access_token}` },
          });
          success = true;
        }
        successMessage("Subscription plan updated successfully");
      } else {
        // Try local Next.js API route first
        try {
          await axios.post("/api/subscription", formData, {
            headers: { Authorization: `Bearer ${access_token}` },
            timeout: 6000,
          });
          success = true;
        } catch (localErr: any) {
          lastErrDetail = localErr?.response?.data?.detail || localErr?.message || "";
          // Fallback to FastAPI renderInstance
          await renderInstance.post("/subscription", formData, {
            headers: { Authorization: `Bearer ${access_token}` },
          });
          success = true;
        }
        successMessage("Subscription plan created successfully");
      }

      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        lastErrDetail ||
        "Failed to save subscription plan";
      errorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-full max-h-[92vh] overflow-y-auto p-0 rounded-2xl bg-white border border-slate-200 shadow-2xl">
        {/* Header with vibrant dark gradient */}
        <div className="relative bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 p-6 text-white overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shadow-inner">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  {mode === "edit" ? "Edit Subscription Plan" : "Create New Subscription Plan"}
                  <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-semibold px-2 text-xs">
                    Admin Portal
                  </Badge>
                </DialogTitle>
                <p className="text-xs text-slate-300 mt-1">
                  Configure pricing, quotas, features, and targeted user roles for HolaTractor.
                </p>
              </div>
            </div>
          </div>

          {/* Section Navigation Tabs */}
          <div className="flex gap-2 mt-5 border-b border-white/10 pb-1">
            <button
              type="button"
              onClick={() => setActiveTab("general")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "general"
                  ? "bg-emerald-500 text-white shadow-sm"
                  : "text-slate-300 hover:text-white hover:bg-white/5"
              }`}
            >
              1. Identity & Pricing
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("quotas")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "quotas"
                  ? "bg-emerald-500 text-white shadow-sm"
                  : "text-slate-300 hover:text-white hover:bg-white/5"
              }`}
            >
              2. Target Audience & Quotas
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("features")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "features"
                  ? "bg-emerald-500 text-white shadow-sm"
                  : "text-slate-300 hover:text-white hover:bg-white/5"
              }`}
            >
              3. Features & Highlights
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* TAB 1: Identity & Pricing */}
          {activeTab === "general" && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs font-bold text-slate-700">
                    Plan Name *
                  </Label>
                  <Input
                    id="name"
                    placeholder="e.g. Standard Tractor Fleet Pass"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="h-10 text-sm border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Plan Tier</Label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(["Basic", "Business", "Premium", "Custom"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setFormData({ ...formData, type: t })}
                        className={`py-2 px-1 text-xs font-bold rounded-xl border text-center transition-all ${
                          formData.type === t
                            ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Pricing Grid */}
              <div className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-800">Pricing & Billing Structure</span>
                  </div>
                  {discountPercent > 0 && (
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 font-bold text-[11px] px-2 py-0.5">
                      <Percent className="w-3 h-3 mr-1 inline" />
                      {discountPercent}% Savings applied
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="actual_cost" className="text-[11px] font-semibold text-slate-600">
                      Standard Cost (USD/Bs)
                    </Label>
                    <Input
                      id="actual_cost"
                      type="number"
                      step="any"
                      min="0"
                      value={formData.actual_cost}
                      onChange={(e) => setFormData({ ...formData, actual_cost: parseFloat(e.target.value) || 0 })}
                      className="h-9 text-sm rounded-lg"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="discount_cost" className="text-[11px] font-semibold text-slate-600">
                      Discounted Price (Offer)
                    </Label>
                    <Input
                      id="discount_cost"
                      type="number"
                      step="any"
                      min="0"
                      value={formData.discount_cost}
                      onChange={(e) => setFormData({ ...formData, discount_cost: parseFloat(e.target.value) || 0 })}
                      className="h-9 text-sm rounded-lg font-bold text-emerald-700"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="total_days" className="text-[11px] font-semibold text-slate-600">
                      Duration (Days)
                    </Label>
                    <Input
                      id="total_days"
                      type="number"
                      min="1"
                      value={formData.total_days}
                      onChange={(e) => setFormData({ ...formData, total_days: parseInt(e.target.value) || 30 })}
                      className="h-9 text-sm rounded-lg"
                    />
                  </div>
                </div>

                {/* Duration Presets */}
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-slate-400 font-medium">Quick presets:</span>
                  {[
                    { label: "1 Month (30d)", days: 30 },
                    { label: "3 Months (90d)", days: 90 },
                    { label: "6 Months (180d)", days: 180 },
                    { label: "1 Year (365d)", days: 365 },
                  ].map((p) => (
                    <button
                      key={p.days}
                      type="button"
                      onClick={() => setFormData({ ...formData, total_days: p.days })}
                      className={`text-[11px] px-2 py-0.5 rounded-md font-medium border transition-colors ${
                        formData.total_days === p.days
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Target Audience & Quotas */}
          {activeTab === "quotas" && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Target Audience Dual Selector Cards */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700">Target User Roles *</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => setFormData({ ...formData, for_owner: !formData.for_owner })}
                    className={`cursor-pointer p-4 rounded-xl border-2 transition-all flex items-start gap-3 ${
                      formData.for_owner
                        ? "border-emerald-600 bg-emerald-50/50 shadow-sm"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        formData.for_owner ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      <Tractor className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-slate-900">Tractor Owner</p>
                        {formData.for_owner && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Visible to tractor owners during registration & profile renewal.
                      </p>
                    </div>
                  </div>

                  <div
                    onClick={() => setFormData({ ...formData, for_dealer: !formData.for_dealer })}
                    className={`cursor-pointer p-4 rounded-xl border-2 transition-all flex items-start gap-3 ${
                      formData.for_dealer
                        ? "border-indigo-600 bg-indigo-50/50 shadow-sm"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        formData.for_dealer ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-slate-900">Authorized Dealer</p>
                        {formData.for_dealer && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Visible to equipment dealers and service center registrations.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Resource Quotas Grid */}
              <div className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-2xl space-y-3">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  Resource Allocation & Limits
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="total_stores" className="text-[11px] font-semibold text-slate-600">
                      Stores Allowed
                    </Label>
                    <Input
                      id="total_stores"
                      type="number"
                      min="0"
                      value={formData.total_stores}
                      onChange={(e) => setFormData({ ...formData, total_stores: parseInt(e.target.value) || 0 })}
                      className="h-9 text-sm rounded-lg"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="total_tractors" className="text-[11px] font-semibold text-slate-600">
                      Tractors Max
                    </Label>
                    <Input
                      id="total_tractors"
                      type="number"
                      min="0"
                      value={formData.total_tractors}
                      onChange={(e) => setFormData({ ...formData, total_tractors: parseInt(e.target.value) || 0 })}
                      className="h-9 text-sm rounded-lg"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="total_attachments" className="text-[11px] font-semibold text-slate-600">
                      Attachments
                    </Label>
                    <Input
                      id="total_attachments"
                      type="number"
                      min="0"
                      value={formData.total_attachments}
                      onChange={(e) => setFormData({ ...formData, total_attachments: parseInt(e.target.value) || 0 })}
                      className="h-9 text-sm rounded-lg"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="total_devices" className="text-[11px] font-semibold text-slate-600">
                      GPS Devices
                    </Label>
                    <Input
                      id="total_devices"
                      type="number"
                      min="0"
                      value={formData.total_devices || 1}
                      onChange={(e) => setFormData({ ...formData, total_devices: parseInt(e.target.value) || 0 })}
                      className="h-9 text-sm rounded-lg"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Features & Highlights */}
          {activeTab === "features" && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Standard Features */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-slate-700">General Plan Features</Label>
                  <span className="text-[11px] text-slate-400">{formData.features.length} added</span>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g. Real-Time Telemetry Tracking..."
                    value={featureInput}
                    onChange={(e) => setFeatureInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddFeature();
                      }
                    }}
                    className="h-9 text-sm rounded-xl"
                  />
                  <Button
                    type="button"
                    onClick={handleAddFeature}
                    className="h-9 px-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800"
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add
                  </Button>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {formData.features.map((feat, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 text-xs bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg border border-slate-200"
                    >
                      <Check className="w-3 h-3 text-emerald-600" />
                      {feat}
                      <button
                        type="button"
                        onClick={() => handleRemoveFeature(idx)}
                        className="text-slate-400 hover:text-red-500 ml-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  {formData.features.length === 0 && (
                    <p className="text-xs text-slate-400 italic">No standard features added yet.</p>
                  )}
                </div>
              </div>

              {/* Focused/VIP Highlights */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                    Focused VIP Highlights (Badges)
                  </Label>
                  <span className="text-[11px] text-slate-400">{formData.focused_features.length} added</span>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g. 3x More Customer Leads, Verified Partner Badge..."
                    value={focusedFeatureInput}
                    onChange={(e) => setFocusedFeatureInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddFocusedFeature();
                      }
                    }}
                    className="h-9 text-sm rounded-xl"
                  />
                  <Button
                    type="button"
                    onClick={handleAddFocusedFeature}
                    className="h-9 px-3 bg-amber-600 text-white rounded-xl hover:bg-amber-700"
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add VIP
                  </Button>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {formData.focused_features.map((feat, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 text-xs bg-amber-50 text-amber-900 px-2.5 py-1 rounded-lg border border-amber-200 font-semibold"
                    >
                      <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                      {feat}
                      <button
                        type="button"
                        onClick={() => handleRemoveFocusedFeature(idx)}
                        className="text-amber-400 hover:text-red-500 ml-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Live Preview Card */}
              <div className="p-4 bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-2xl space-y-3 mt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold tracking-wider uppercase text-emerald-400">Card Preview</span>
                    <Badge className="bg-white/10 text-white text-[10px] border-white/20">
                      {formData.type} Tier
                    </Badge>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-extrabold text-white">${formData.discount_cost}</span>
                    <span className="text-xs text-slate-400"> / {formData.total_days}d</span>
                  </div>
                </div>
                <h4 className="font-bold text-base text-white">{formData.name || "Untitled Plan"}</h4>
                <div className="flex flex-wrap gap-1">
                  {formData.focused_features.map((f, i) => (
                    <span key={i} className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
                      ★ {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Footer Controls */}
          <DialogFooter className="flex items-center justify-between border-t border-slate-100 pt-4">
            <div className="flex items-center gap-2">
              {activeTab !== "general" && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveTab(activeTab === "features" ? "quotas" : "general")}
                  className="rounded-xl h-10 text-xs font-bold"
                >
                  Back
                </Button>
              )}
              {activeTab !== "features" && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setActiveTab(activeTab === "general" ? "quotas" : "features")}
                  className="rounded-xl h-10 text-xs font-bold"
                >
                  Next Step →
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="rounded-xl h-10 text-xs text-slate-500"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="h-10 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20"
              >
                {loading ? (
                  <CircularProgress size={16} color="inherit" className="mr-2" />
                ) : mode === "edit" ? (
                  "Save Changes"
                ) : (
                  "Create Subscription Plan"
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
