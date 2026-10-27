"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  CircleCheck,
  PlusCircle,
  Trash2,
  Edit3,
  Tractor,
  Building2,
  Sparkles,
  ShieldCheck,
  Zap,
  Tag,
  Clock,
  Layers,
  Filter,
} from "lucide-react";
import axios from "axios";
import { Subscriptions, SubscriptionType } from "@/utils/Types/types";
import { renderInstance } from "@/utils/Axios/RenderInstance";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";
import { useCookie } from "next-cookie";
import { errorMessage, successMessage } from "@/utils/Toastify/Messages";
import { CircularProgress } from "@mui/material";
import CreateSubscriptionModal, { SubscriptionFormData } from "./CreateSubscriptionModal";

interface SubscriptionsPageProps {
  embedded?: boolean;
}

export default function SubscriptionsPage({ embedded = false }: SubscriptionsPageProps) {
  const [subscriptions, setSubscriptions] = useState<Subscriptions[]>([]);
  const [fetchSubscriptions, setFetchSubscriptions] = useState(false);
  const [roleFilter, setRoleFilter] = useState<"all" | "owner" | "dealer">("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionFormData | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { cookie } = useCookie();
  const access_token = cookie.get("access_token");

  // Fetch subscriptions from API with optional filtering (tries local Next.js API first, then FastAPI)
  const fetchAllSubscriptions = async (role = roleFilter) => {
    setFetchSubscriptions(true);
    let queryParam = "";
    if (role === "owner") queryParam = "?for_owner=true";
    if (role === "dealer") queryParam = "?for_dealer=true";

    try {
      const localRes = await axios.get(`/api/subscription${queryParam}`, { timeout: 5000 });
      if (Array.isArray(localRes.data)) {
        setSubscriptions(localRes.data);
        return;
      }
    } catch {}

    // Fallback to FastAPI
    try {
      const res = await renderInstance.get(`/subscription${queryParam}`);
      const list = Array.isArray(res.data) ? res.data : [];
      setSubscriptions(list);
    } catch (err: any) {
      console.error("Failed to fetch subscriptions:", err);
    } finally {
      setFetchSubscriptions(false);
    }
  };

  useEffect(() => {
    fetchAllSubscriptions(roleFilter);
  }, [roleFilter]);

  const handleOpenCreate = () => {
    setModalMode("create");
    setSelectedPlan(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (sub: Subscriptions) => {
    setModalMode("edit");
    setSelectedPlan({
      id: sub.id,
      name: sub.name,
      type: (sub.type as any) || "Basic",
      actual_cost: Number(sub.actual_cost) || 0,
      discount_cost: Number(sub.discount_cost) || 0,
      total_days: Number(sub.total_days) || 30,
      total_stores: Number(sub.total_stores) || 1,
      total_tractors: Number(sub.total_tractors) || 5,
      total_attachments: Number(sub.total_attachments) || 5,
      total_devices: Number((sub as any).total_devices) || 1,
      total_operators: Number((sub as any).total_operators) || 3,
      for_owner: Boolean(sub.for_owner),
      for_dealer: Boolean(sub.for_dealer),
      features: Array.isArray(sub.features) ? sub.features : [],
      focused_features: Array.isArray(sub.focused_features) ? sub.focused_features : [],
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    let deleted = false;

    try {
      await axios.delete(`/api/subscription/${id}`, {
        headers: { Authorization: `Bearer ${access_token}` },
        timeout: 5000,
      });
      deleted = true;
    } catch {
      try {
        await renderInstance.delete(`/subscription/${id}`, {
          headers: { Authorization: `Bearer ${access_token}` },
        });
        deleted = true;
      } catch (err: any) {
        console.error("Delete subscription error:", err);
      }
    }

    setIsDeleting(false);
    if (deleted) {
      successMessage("Subscription plan deleted");
      fetchAllSubscriptions();
      setDeleteDialogOpen(false);
      setDeletingId(null);
    } else {
      errorMessage("Error deleting subscription plan");
    }
  };

  const ownerCount = subscriptions.filter((s) => s.for_owner).length;
  const dealerCount = subscriptions.filter((s) => s.for_dealer).length;

  return (
    <div className={embedded ? "w-full" : "container mx-auto px-4 py-6"}>
      {/* Top Banner & Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Subscription Plans
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs font-bold">
              {subscriptions.length} Plans
            </Badge>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage membership tiers, quotas, and feature perks for Tractor Owners and Dealers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Role Filter Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setRoleFilter("all")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                roleFilter === "all"
                  ? "bg-white text-slate-900 shadow-sm font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setRoleFilter("owner")}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                roleFilter === "owner"
                  ? "bg-white text-emerald-700 shadow-sm font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Tractor className="w-3.5 h-3.5" />
              Owners
            </button>
            <button
              onClick={() => setRoleFilter("dealer")}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                roleFilter === "dealer"
                  ? "bg-white text-indigo-700 shadow-sm font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              Dealers
            </button>
          </div>

          {/* Create Button */}
          <Button
            onClick={handleOpenCreate}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 h-10 px-4"
          >
            <PlusCircle className="mr-1.5 h-4 w-4" />
            Create Subscription
          </Button>
        </div>
      </div>

      {/* Plans Grid */}
      {fetchSubscriptions ? (
        <div className="w-full h-64 flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-200">
          <CircularProgress size={32} className="text-emerald-600 mb-2" />
          <p className="text-xs text-slate-500 font-medium">Fetching subscription plans...</p>
        </div>
      ) : subscriptions.length === 0 ? (
        <div className="w-full py-16 flex flex-col items-center justify-center bg-white rounded-2xl border border-dashed border-slate-200 text-center p-6">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
            <Sparkles className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No subscription plans found</h3>
          <p className="text-xs text-slate-500 max-w-sm mt-1">
            Get started by creating a membership plan tailored for tractor owners or equipment dealers.
          </p>
          <Button onClick={handleOpenCreate} className="mt-4 bg-emerald-600 text-white rounded-xl text-xs font-bold">
            <PlusCircle className="mr-1.5 h-4 w-4" />
            Create First Plan
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subscriptions.map((sub) => {
            const disc = Number(sub.discount_cost) || 0;
            const act = Number(sub.actual_cost) || disc;
            const savings = act > disc ? Math.round(((act - disc) / act) * 100) : 0;

            return (
              <Card
                key={sub.id}
                className="group relative flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden"
              >
                {/* Top Role & Tier Bar */}
                <div className="p-5 pb-3 flex items-start justify-between gap-2 border-b border-slate-100 bg-slate-50/50">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-lg group-hover:text-emerald-600 transition-colors">
                      {sub.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      {sub.for_owner && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-200">
                          <Tractor className="w-3 h-3" /> Owner
                        </span>
                      )}
                      {sub.for_dealer && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-200">
                          <Building2 className="w-3 h-3" /> Dealer
                        </span>
                      )}
                    </div>
                  </div>

                  <Badge
                    className={`font-bold text-xs uppercase px-2.5 py-0.5 ${
                      sub.type === "Premium"
                        ? "bg-amber-100 text-amber-800 border-amber-200"
                        : sub.type === "Business"
                        ? "bg-blue-100 text-blue-800 border-blue-200"
                        : "bg-slate-200 text-slate-800"
                    }`}
                  >
                    {sub.type || "Basic"}
                  </Badge>
                </div>

                {/* Price Display */}
                <CardContent className="p-5 flex-grow space-y-4">
                  <div className="flex items-baseline justify-between pb-3 border-b border-slate-100">
                    <div>
                      <span className="text-3xl font-extrabold text-slate-900">${disc}</span>
                      <span className="text-xs text-slate-500 font-medium"> / {sub.total_days} days</span>
                    </div>
                    {savings > 0 && (
                      <div className="text-right">
                        <span className="text-xs text-slate-400 line-through block">${act}</span>
                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] font-bold">
                          Save {savings}%
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Quotas Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Stores</span>
                      <span className="font-bold text-slate-800">{sub.total_stores ?? 1} Max</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Tractors</span>
                      <span className="font-bold text-slate-800">{sub.total_tractors ?? 5} Max</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Attachments</span>
                      <span className="font-bold text-slate-800">{sub.total_attachments ?? 5} Max</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Duration</span>
                      <span className="font-bold text-slate-800">{sub.total_days ?? 30} Days</span>
                    </div>
                  </div>

                  {/* Focused VIP Features */}
                  {Array.isArray(sub.focused_features) && sub.focused_features.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      {sub.focused_features.map((feat, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs font-semibold text-amber-700 bg-amber-50/80 px-2.5 py-1 rounded-lg border border-amber-200/60">
                          <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* General Features */}
                  {Array.isArray(sub.features) && sub.features.length > 0 && (
                    <div className="space-y-1 pt-1">
                      {sub.features.map((feat, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-slate-600">
                          <CircleCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>

                {/* Actions Footer */}
                <CardFooter className="p-4 pt-0 border-t border-slate-100 flex items-center justify-between gap-2 mt-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEdit(sub)}
                    className="flex-1 rounded-xl text-xs font-semibold border-slate-200 hover:bg-slate-50"
                  >
                    <Edit3 className="w-3.5 h-3.5 mr-1 text-slate-600" />
                    Edit Plan
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDeletingId(sub.id);
                      setDeleteDialogOpen(true);
                    }}
                    className="rounded-xl text-xs font-semibold text-red-500 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modern Create/Edit Modal */}
      <CreateSubscriptionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={() => fetchAllSubscriptions()}
        initialData={selectedPlan}
        mode={modalMode}
      />

      {/* Delete Confirmation Dialog */}
      {deleteDialogOpen && deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">Delete Subscription Plan?</h3>
            <p className="text-xs text-slate-500">
              Are you sure you want to delete this subscription plan? Existing subscribed users will retain their active period, but no new users will be able to purchase it.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteDialogOpen(false)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={isDeleting}
                onClick={() => handleDelete(deletingId)}
                className="rounded-xl text-xs font-bold"
              >
                {isDeleting ? "Deleting..." : "Delete Plan"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const logger = {
  error: (msg: any) => console.error(msg),
};
