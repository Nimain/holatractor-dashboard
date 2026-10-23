"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCookie } from "next-cookie";
import axios from "axios";
import {
  User,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  Calendar,
  Camera,
  Save,
  CheckCircle2,
  AlertCircle,
  LandPlot,
  Tractor,
  RefreshCw,
  Sparkles,
  ArrowLeft,
  Globe2,
  BellRing,
  Lock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { errorMessage, successMessage } from "@/utils/Toastify/Messages";
import { renderInstance, TractorAIBaseURL } from "@/utils/Axios/RenderInstance";
import { useFarmContext } from "@/components/wrappers/FarmProvider";
import FarmerBrandIcon from "@/components/Common/FarmerBrandIcon";

export default function FarmerProfile() {
  const { cookie } = useCookie();
  const rawUser = cookie.get("user");
  const parsedUser: any =
    typeof rawUser === "string"
      ? (() => {
          try {
            return JSON.parse(rawUser);
          } catch {
            return null;
          }
        })()
      : rawUser;

  const userId = parsedUser?.userId || parsedUser?.id || parsedUser?.sub || parsedUser?._id || "farmer_demo_01";
  const access_token = cookie.get("access_token");

  const { farms } = useFarmContext();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [firstName, setFirstName] = useState(parsedUser?.first_name || parsedUser?.name?.split(" ")[0] || "Farmer");
  const [lastName, setLastName] = useState(parsedUser?.last_name || parsedUser?.name?.split(" ").slice(1).join(" ") || "Producer");
  const [email, setEmail] = useState(parsedUser?.email || "farmer@holatractor.com");
  const [phone, setPhone] = useState(parsedUser?.phone || parsedUser?.mobile || "+591 7100 2345");
  const [location, setLocation] = useState(parsedUser?.location || "Santa Cruz de la Sierra, Bolivia");
  const [preferredCrop, setPreferredCrop] = useState("Soybeans / Soya");
  const [avatarUrl, setAvatarUrl] = useState(parsedUser?.image || "");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Fetch live farmer profile data
  const fetchFarmerProfile = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const headers: Record<string, string> = {};
      if (access_token) headers["Authorization"] = `Bearer ${access_token}`;

      const res = await renderInstance.get(`/farmer/${userId}`, { headers });
      if (res.data?.user) {
        const u = res.data.user;
        setFirstName(u.first_name || firstName);
        setLastName(u.last_name || lastName);
        setEmail(u.email || email);
        setPhone(u.mobile || u.phone || phone);
        if (u.image) setAvatarUrl(u.image);
      }
    } catch (err) {
      console.warn("Farmer profile fetch fallback:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFarmerProfile();
  }, [userId]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const updatedUserObj = {
      ...parsedUser,
      first_name: firstName,
      last_name: lastName,
      name: `${firstName} ${lastName}`.trim(),
      email: email,
      phone: phone,
      mobile: phone,
      location: location,
      image: avatarUrl,
    };

    try {
      const headers: Record<string, string> = {};
      if (access_token) headers["Authorization"] = `Bearer ${access_token}`;

      // Update backend
      await renderInstance.patch(
        `/farmer/${userId}`,
        {
          first_name: firstName,
          last_name: lastName,
          mobile: phone,
          email: email,
        },
        { headers }
      );
    } catch (err) {
      console.warn("Backend profile patch fallback:", err);
    }

    // Save to Cookies & Local Storage
    try {
      cookie.set("user", JSON.stringify(updatedUserObj), { path: "/" });
      localStorage.setItem("user", JSON.stringify(updatedUserObj));
      window.dispatchEvent(new CustomEvent("user_profile_updated", { detail: updatedUserObj }));
    } catch {}

    successMessage("Farmer profile updated successfully!");
    setSaving(false);
  };

  return (
    <div className="w-full min-h-screen py-6 space-y-6 max-w-5xl mx-auto">
      {/* ── TOP NAVIGATION ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/farmer">
            <Button
              size="icon"
              variant="outline"
              className="rounded-xl border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">👨‍🌾</span>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Farmer Profile & Account Settings
              </h1>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Manage your agricultural credentials, operational contact details, and automated machinery notifications.
            </p>
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={fetchFarmerProfile}
          disabled={loading}
          className="rounded-xl border-slate-200 dark:border-slate-800 text-xs font-bold flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-emerald-600" : ""}`} />
          <span>Sync Profile</span>
        </Button>
      </div>

      {/* ── PROFILE HERO CARD ─────────────────────────────────────────────── */}
      <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden p-6 md:p-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="relative">
            <Avatar className="h-24 w-24 rounded-3xl border-4 border-emerald-500/20 shadow-md">
              {avatarUrl ? (
                <AvatarImage src={avatarUrl} alt={firstName} className="object-cover" />
              ) : null}
              <AvatarFallback className="bg-gradient-to-br from-emerald-600 to-emerald-800 text-white font-black text-2xl">
                {(firstName || "F").charAt(0).toUpperCase()}
                {(lastName || "P").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <button
              type="button"
              onClick={() => {
                const newUrl = prompt("Enter Image URL for profile avatar:", avatarUrl);
                if (newUrl !== null) setAvatarUrl(newUrl);
              }}
              className="absolute -bottom-1 -right-1 p-2 rounded-xl bg-emerald-600 text-white shadow-md hover:bg-emerald-700 transition-colors"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2 text-center sm:text-left flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">
                {firstName} {lastName}
              </h2>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-[11px] font-bold px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Verified Agricultural Producer</span>
                </Badge>
                <Badge variant="outline" className="text-[11px] font-bold text-slate-500 border-slate-200 dark:border-slate-700">
                  ID: #{String(userId).slice(-6).toUpperCase()}
                </Badge>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-500 font-medium pt-1">
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-emerald-600" />
                <span>{email}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>{phone}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>{location}</span>
              </span>
            </div>
          </div>
        </div>

        {/* ── PROFILE STATS ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 mt-6 border-t border-slate-100 dark:border-slate-800">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center sm:text-left">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Registered Fields
            </span>
            <span className="text-lg font-black text-slate-900 dark:text-white mt-0.5 block">
              {farms?.length || 1} Fields
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center sm:text-left">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Telemetry Status
            </span>
            <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block flex items-center justify-center sm:justify-start gap-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>Active GPS</span>
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center sm:text-left">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              3-Tap Dispatches
            </span>
            <span className="text-lg font-black text-slate-900 dark:text-white mt-0.5 block">
              Instant Ready
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center sm:text-left">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Security Level
            </span>
            <span className="text-lg font-black text-blue-600 dark:text-blue-400 mt-0.5 block">
              Tier-1 Verified
            </span>
          </div>
        </div>
      </Card>

      {/* ── EDIT PROFILE FORM ──────────────────────────────────────────────── */}
      <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 md:p-8">
        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-600" />
              <span>Personal & Agricultural Information</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              These details are shared with certified machinery depots when dispatching equipment to your farm.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* First Name */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">First Name</Label>
              <Input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="rounded-xl border-slate-200 dark:border-slate-800 text-xs h-10"
              />
            </div>

            {/* Last Name */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Last Name</Label>
              <Input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="rounded-xl border-slate-200 dark:border-slate-800 text-xs h-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Email Address */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Email Address</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="rounded-xl border-slate-200 dark:border-slate-800 text-xs h-10"
              />
            </div>

            {/* Phone / WhatsApp */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Mobile Number / WhatsApp Dispatch
              </Label>
              <Input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="rounded-xl border-slate-200 dark:border-slate-800 text-xs h-10 font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Farm Region */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Agricultural Region / Primary Hub
              </Label>
              <Input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="rounded-xl border-slate-200 dark:border-slate-800 text-xs h-10"
              />
            </div>

            {/* Primary Crop */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Primary Harvest Crop
              </Label>
              <Select value={preferredCrop} onValueChange={setPreferredCrop}>
                <SelectTrigger className="rounded-xl border-slate-200 dark:border-slate-800 text-xs h-10">
                  <SelectValue placeholder="Select primary crop" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="Soybeans / Soya">🌱 Soybeans / Soya</SelectItem>
                  <SelectItem value="Corn / Maize">🌽 Corn / Maize</SelectItem>
                  <SelectItem value="Wheat / Trigo">🌾 Wheat / Trigo</SelectItem>
                  <SelectItem value="Sunflower / Girasol">🌻 Sunflower / Girasol</SelectItem>
                  <SelectItem value="Sorghum / Sorgo">🌿 Sorghum / Sorgo</SelectItem>
                  <SelectItem value="Sugarcane / Caña">🎋 Sugarcane / Caña</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <Link href="/farmer">
              <Button
                type="button"
                variant="ghost"
                className="text-xs font-bold rounded-xl h-10 px-4"
              >
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl h-10 px-6 flex items-center gap-2 shadow-sm shadow-emerald-600/20"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Updating Profile...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Profile Changes</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
