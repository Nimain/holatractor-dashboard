"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useCookie } from "next-cookie";
import {
  LayoutDashboard,
  Zap,
  History,
  LandPlot,
  Store,
  CreditCard,
  Activity,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Plus,
  Tractor,
  Wheat,
  ShieldCheck,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useFarmContext } from "@/components/wrappers/FarmProvider";
import TranslatedText from "@/components/Menubar/TranslatedText";
import { sidebarTranslations } from "../FarmerTranslation";

export default function FarmerSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(true);
  const [showFarmList, setShowFarmList] = useState(false);

  const { farms, fetching, fetchFarmer } = useFarmContext();

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
  const user: any = parsedUser || {};
  const userId = parsedUser?.userId || parsedUser?.id || parsedUser?.sub || parsedUser?._id;

  function handleLogOut() {
    const cookiesToRemove = [
      "access_token",
      "user",
      "isFarmer",
      "isOperator",
      "isAgent",
      "isOwner",
      "isDealer",
      "isODealer",
      "active_role",
    ];

    cookiesToRemove.forEach((name) => {
      cookie.remove(name, { path: "/" });
      cookie.remove(name);
      if (typeof document !== "undefined") {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      }
    });

    router.push("/login");
  }

  useEffect(() => {
    if (userId) {
      fetchFarmer();
    }
  }, [userId]);

  if (!userId) return null;

  const NAV_ITEMS = [
    {
      title: "Dashboard",
      href: "/farmer",
      icon: LayoutDashboard,
      active: pathname === "/farmer",
    },
    {
      title: "3-Tap Booking",
      href: "/farmer/new-booking",
      icon: Zap,
      active: pathname === "/farmer/new-booking",
      badge: "Fast",
    },
    {
      title: "Booking History",
      href: "/farmer/bookinghistory",
      icon: History,
      active: pathname.startsWith("/farmer/bookinghistory"),
    },
    {
      title: "Machinery Stores",
      href: "/farmer/stores",
      icon: Store,
      active: pathname.startsWith("/farmer/stores"),
    },
    {
      title: "Payments",
      href: "/farmer/paymenthistory",
      icon: CreditCard,
      active: pathname.startsWith("/farmer/paymenthistory"),
    },
    {
      title: "Activity Logs",
      href: "/farmer/logs",
      icon: Activity,
      active: pathname.startsWith("/farmer/logs"),
    },
  ];

  return (
    <TooltipProvider delayDuration={150}>
      <aside
        className={`relative flex flex-col justify-between transition-all duration-300 ease-in-out my-3 rounded-3xl bg-slate-900 border border-slate-800 text-slate-200 shadow-2xl z-30 ${
          isExpanded ? "w-64" : "w-20"
        } h-[calc(100vh-1.5rem)]`}
      >
        {/* ── TOP: BRAND LOGO & COLLAPSE TOGGLE ── */}
        <div>
          <div className="p-4 flex items-center justify-between border-b border-slate-800/80">
            <Link href="/farmer" className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                  <Tractor className="w-5 h-5 text-emerald-400" />
                </div>
              </div>
              {isExpanded && (
                <div className="leading-tight">
                  <span className="font-black text-sm text-white tracking-tight flex items-center gap-1.5">
                    HolaTractor
                    <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[9px] font-black px-1.5 py-0">
                      Farmer
                    </Badge>
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold block">Agri-Hub Dispatch</span>
                </div>
              )}
            </Link>

            <Button
              size="icon"
              variant="ghost"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl"
            >
              {isExpanded ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>

          {/* ── NAVIGATION LIST ── */}
          <nav className="p-3 space-y-1.5 overflow-y-auto max-h-[calc(100vh-16rem)]">
            {/* Standard Nav Items */}
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl font-bold text-xs transition-all ${
                        item.active
                          ? "bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-lg shadow-emerald-600/25"
                          : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
                      } ${!isExpanded ? "justify-center px-0" : ""}`}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          item.active ? "text-white" : "text-slate-400 group-hover:text-emerald-400"
                        }`}
                      />
                      {isExpanded && (
                        <span className="flex-1 truncate text-xs">{item.title}</span>
                      )}
                      {isExpanded && item.badge && (
                        <Badge className="bg-emerald-400/20 text-emerald-300 text-[9px] font-black uppercase px-1.5 py-0">
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  </TooltipTrigger>
                  {!isExpanded && <TooltipContent side="right">{item.title}</TooltipContent>}
                </Tooltip>
              );
            })}

            {/* Collapsible Farms Menu */}
            <Collapsible open={showFarmList} onOpenChange={setShowFarmList} className="space-y-1">
              <CollapsibleTrigger asChild>
                <button
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl font-bold text-xs transition-all ${
                    pathname.startsWith("/farmer/farm")
                      ? "bg-slate-800 text-emerald-400 border border-slate-700/60"
                      : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
                  } ${!isExpanded ? "justify-center px-0" : ""}`}
                >
                  <LandPlot className="w-4 h-4 shrink-0 text-emerald-400" />
                  {isExpanded && (
                    <>
                      <span className="flex-1 text-left truncate text-xs">My Farms ({farms.length})</span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                          showFarmList ? "rotate-180" : ""
                        }`}
                      />
                    </>
                  )}
                </button>
              </CollapsibleTrigger>

              <CollapsibleContent className="space-y-1 pl-4">
                {isExpanded && (
                  <>
                    <Link
                      href="/farmer/farm"
                      className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/80"
                    >
                      <span>🗺️ Farm Map Overview</span>
                    </Link>

                    {farms.slice(0, 5).map((f) => (
                      <Link
                        key={f.id}
                        href={`/farmer/farm/${f.id}`}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/80 truncate"
                      >
                        <Wheat className="w-3 h-3 text-emerald-500 shrink-0" />
                        <span className="truncate">{f.name}</span>
                      </Link>
                    ))}

                    <Link
                      href="/farmer/farm/new"
                      className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-400 hover:bg-emerald-950/40"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add New Field</span>
                    </Link>
                  </>
                )}
              </CollapsibleContent>
            </Collapsible>
          </nav>
        </div>

        {/* ── BOTTOM: LIVE SYSTEM STATUS & USER LOGOUT ── */}
        <div className="p-3 border-t border-slate-800/80 space-y-2">
          {/* TractorAI Live Status */}
          {isExpanded && (
            <div className="p-2.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-slate-300">TractorAI Live Network</span>
              </div>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            </div>
          )}

          {/* User Profile Card & Sign Out */}
          <div className="flex items-center justify-between gap-2 p-1.5 rounded-2xl">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-xs font-black text-white shrink-0">
                {(user.name || "F").substring(0, 1).toUpperCase()}
              </div>
              {isExpanded && (
                <div className="leading-tight truncate">
                  <p className="font-bold text-xs text-white truncate">{user.name || "Farmer"}</p>
                  <p className="text-[10px] text-slate-400 truncate">{user.email || "farmer@holatractor.com"}</p>
                </div>
              )}
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleLogOut}
                  className="h-8 w-8 text-slate-400 hover:text-red-400 hover:bg-red-950/30 rounded-xl shrink-0"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Sign Out</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
}