"use client";

import React, { useEffect, useState } from "react";
import { useCookie } from "next-cookie";
import { useRouter, usePathname } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Tractor,
  Sprout,
  Store,
  ShieldCheck,
  Wrench,
  CheckCircle2,
  ArrowRight,
  UserCheck,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";

export interface RoleConfig {
  id: "owner" | "farmer" | "dealer" | "agent" | "operator";
  title: string;
  subtitle: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  badgeBg: string;
  badgeBorder: string;
  gradient: string;
}

export const ALL_ROLES: RoleConfig[] = [
  {
    id: "owner",
    title: "Tractor Owner",
    subtitle: "Manage fleet GPS tracking, store listings, and equipment rental",
    path: "/owner",
    icon: Tractor,
    color: "text-amber-700 dark:text-amber-400",
    badgeBg: "bg-amber-50 dark:bg-amber-950/40",
    badgeBorder: "border-amber-200 dark:border-amber-800/60",
    gradient: "from-amber-500/10 to-orange-500/10 hover:border-amber-400",
  },
  {
    id: "farmer",
    title: "Farmer Dashboard",
    subtitle: "Book agricultural machinery, manage farms, and track work orders",
    path: "/farmer",
    icon: Sprout,
    color: "text-emerald-700 dark:text-emerald-400",
    badgeBg: "bg-emerald-50 dark:bg-emerald-950/40",
    badgeBorder: "border-emerald-200 dark:border-emerald-800/60",
    gradient: "from-emerald-500/10 to-green-500/10 hover:border-emerald-400",
  },
  {
    id: "dealer",
    title: "Equipment Dealer",
    subtitle: "Manage dealerships, parts inventory, repairs, and sales pipelines",
    path: "/dealer",
    icon: Store,
    color: "text-blue-700 dark:text-blue-400",
    badgeBg: "bg-blue-50 dark:bg-blue-950/40",
    badgeBorder: "border-blue-200 dark:border-blue-800/60",
    gradient: "from-blue-500/10 to-cyan-500/10 hover:border-blue-400",
  },
  {
    id: "agent",
    title: "Support Agent",
    subtitle: "Coordinate bookings, customer leads, and platform administration",
    path: "/agent",
    icon: ShieldCheck,
    color: "text-purple-700 dark:text-purple-400",
    badgeBg: "bg-purple-50 dark:bg-purple-950/40",
    badgeBorder: "border-purple-200 dark:border-purple-800/60",
    gradient: "from-purple-500/10 to-indigo-500/10 hover:border-purple-400",
  },
  {
    id: "operator",
    title: "Machine Operator",
    subtitle: "Accept job assignments, field routes, and submit working hours",
    path: "/operator",
    icon: Wrench,
    color: "text-orange-700 dark:text-orange-400",
    badgeBg: "bg-orange-50 dark:bg-orange-950/40",
    badgeBorder: "border-orange-200 dark:border-orange-800/60",
    gradient: "from-orange-500/10 to-amber-500/10 hover:border-orange-400",
  },
];

interface SwitchAccountModalProps {
  isOpen: boolean;
  onClose?: () => void;
  isMandatorySelection?: boolean; // When true (e.g. immediately after login), cannot close without selecting
  title?: string;
  description?: string;
  onSelectRole?: (role: RoleConfig) => void;
}

export default function SwitchAccountModal({
  isOpen,
  onClose,
  isMandatorySelection = false,
  title = "Select Account Dashboard",
  description = "Your account has multiple authorized roles. Choose which dashboard you would like to open:",
  onSelectRole,
}: SwitchAccountModalProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { cookie } = useCookie();

  const [availableRoles, setAvailableRoles] = useState<RoleConfig[]>([]);
  const [currentRole, setCurrentRole] = useState<string>("");

  useEffect(() => {
    // Detect available roles from cookies
    const isOwner = cookie.get("isOwner") === "true";
    const isFarmer = cookie.get("isFarmer") === "true";
    const isDealer = cookie.get("isDealer") === "true";
    const isAgent = cookie.get("isAgent") === "true";
    const isOperator = cookie.get("isOperator") === "true";

    const userObjStr = cookie.get("user");
    let jwtRoles: string[] = [];
    if (userObjStr) {
      try {
        const parsed = typeof userObjStr === "string" ? JSON.parse(userObjStr) : userObjStr;
        if (Array.isArray(parsed?.isAdmin)) jwtRoles = parsed.isAdmin.map((r: string) => r.toLowerCase());
        if (Array.isArray(parsed?.role)) jwtRoles = [...jwtRoles, ...parsed.role.map((r: string) => r.toLowerCase())];
      } catch {}
    }

    const roles = ALL_ROLES.filter((r) => {
      if (r.id === "owner" && (isOwner || jwtRoles.includes("owner"))) return true;
      if (r.id === "farmer" && (isFarmer || jwtRoles.includes("farmer"))) return true;
      if (r.id === "dealer" && (isDealer || jwtRoles.includes("dealer"))) return true;
      if (r.id === "agent" && (isAgent || jwtRoles.includes("agent"))) return true;
      if (r.id === "operator" && (isOperator || jwtRoles.includes("operator"))) return true;
      return false;
    });

    setAvailableRoles(roles.length > 0 ? roles : ALL_ROLES.slice(0, 2));

    // Detect current role based on path or cookie
    const activeCookie = cookie.get("active_role");
    if (pathname.startsWith("/owner")) setCurrentRole("owner");
    else if (pathname.startsWith("/farmer")) setCurrentRole("farmer");
    else if (pathname.startsWith("/dealer")) setCurrentRole("dealer");
    else if (pathname.startsWith("/agent")) setCurrentRole("agent");
    else if (pathname.startsWith("/operator")) setCurrentRole("operator");
    else if (activeCookie) setCurrentRole(activeCookie);
  }, [pathname, isOpen]);

  const handleSelect = (role: RoleConfig) => {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7);

    // Save active_role in cookies & localStorage
    cookie.set("active_role", role.id, { path: "/", expires: expiryDate });
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("active_role", role.id);
        document.cookie = `active_role=${role.id}; path=/; expires=${expiryDate.toUTCString()};`;
      } catch {}
    }

    if (onSelectRole) {
      onSelectRole(role);
    }

    if (onClose) {
      onClose();
    }

    // Navigate to selected dashboard
    if (typeof window !== "undefined") {
      window.location.href = role.path;
    } else {
      router.push(role.path);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && isMandatorySelection) return; // Prevent closing if required selection
        if (!open && onClose) onClose();
      }}
    >
      <DialogContent className="max-w-md md:max-w-lg bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 shadow-2xl rounded-2xl p-6">
        <DialogHeader className="text-left space-y-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 px-2.5 py-1 rounded-full w-fit">
            <Sparkles className="w-3.5 h-3.5" />
            Switch Account & Role
          </div>
          <DialogTitle className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {title}
          </DialogTitle>
          <DialogDescription className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-3 max-h-[60vh] overflow-y-auto pr-1">
          {availableRoles.map((role) => {
            const isCurrent = currentRole === role.id;
            const Icon = role.icon;

            return (
              <motion.button
                key={role.id}
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                onClick={() => handleSelect(role)}
                className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-center justify-between gap-4 group ${
                  isCurrent
                    ? "bg-emerald-50/60 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-600 shadow-sm"
                    : `bg-slate-50/80 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/80 hover:bg-white dark:hover:bg-slate-800 hover:shadow-md ${role.gradient}`
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center border shadow-sm shrink-0 ${role.badgeBg} ${role.badgeBorder} ${role.color}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm md:text-base text-slate-900 dark:text-white truncate">
                        {role.title}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-700/60 shrink-0">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                      {role.subtitle}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 flex items-center">
                  {isCurrent ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700/60 flex items-center justify-center text-slate-400 group-hover:text-emerald-600 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/60 transition-colors">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>

        {!isMandatorySelection && onClose && (
          <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300"
            >
              Cancel
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
