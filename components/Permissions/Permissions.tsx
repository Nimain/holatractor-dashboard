"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Link from "next/link";
import { Avatar } from "@mui/material";
import { useCookie } from "next-cookie";
import { renderInstance } from "@/utils/Axios/RenderInstance";
import { errorMessage, successMessage } from "@/utils/Toastify/Messages";
import { Button } from "@/components/ui/button";
import { allModuleList } from "./AllModule";
import {
  KeyRound,
  Shield,
  CheckCircle2,
  RefreshCw,
  ArrowLeft,
  Save,
  Layers,
  Sparkles,
  Check,
  X,
} from "lucide-react";

type PermissionType = "create" | "read" | "update" | "delete";

interface ModulePermission {
  name: string;
  create?: boolean;
  read?: boolean;
  update?: boolean;
  delete?: boolean;
}

interface RoleWithPermissions {
  id: string;
  name: string;
  image?: string | null;
  allowedModules: ModulePermission[];
}

const Permissions = () => {
  const { cookie } = useCookie();
  const access_token = cookie.get("access_token");

  const [roles, setRoles] = useState<RoleWithPermissions[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [activePermissions, setActivePermissions] = useState<ModulePermission[]>([]);
  const [fetchingRoles, setFetchingRoles] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch Roles
  const fetchAllRoles = useCallback(async () => {
    setFetchingRoles(true);
    let loaded = false;

    // 1. Next.js API
    try {
      const res = await axios.get("/api/role", { timeout: 6000 });
      if (Array.isArray(res.data) && res.data.length > 0) {
        const formatted = res.data.map((r: any) => ({
          id: r.id,
          name: r.name,
          image: r.image,
          allowedModules: Array.isArray(r.allowedModules) ? r.allowedModules : [],
        }));
        setRoles(formatted);
        if (!selectedRoleId) {
          const nonAdmin = formatted.find((r) => r.name !== "admin") || formatted[0];
          setSelectedRoleId(nonAdmin.id);
          setActivePermissions(nonAdmin.allowedModules);
        }
        loaded = true;
      }
    } catch (e) {
      console.warn("Direct /api/role notice:", e);
    }

    // 2. NestJS Fallback
    if (!loaded) {
      try {
        const res = await renderInstance.get("/role", {
          headers: access_token ? { Authorization: `Bearer ${access_token}` } : {},
        });
        if (Array.isArray(res.data)) {
          setRoles(res.data);
          if (!selectedRoleId && res.data.length > 0) {
            const nonAdmin = res.data.find((r) => r.name !== "admin") || res.data[0];
            setSelectedRoleId(nonAdmin.id);
            setActivePermissions(nonAdmin.allowedModules || []);
          }
        }
      } catch (err) {
        errorMessage("Error fetching roles");
      }
    }

    setFetchingRoles(false);
  }, [access_token, selectedRoleId]);

  useEffect(() => {
    fetchAllRoles();
  }, [fetchAllRoles]);

  // When selected role changes
  const handleSelectRole = (role: RoleWithPermissions) => {
    setSelectedRoleId(role.id);
    setActivePermissions(role.allowedModules || []);
  };

  const currentRole = roles.find((r) => r.id === selectedRoleId);

  // Toggle single permission
  const handleToggle = (moduleName: string, type: PermissionType) => {
    setActivePermissions((prev) => {
      const existing = prev.find((m) => m.name === moduleName);
      if (existing) {
        const currentVal = !!existing[type];
        const updated = { ...existing, [type]: !currentVal };
        return prev.map((m) => (m.name === moduleName ? updated : m));
      } else {
        return [...prev, { name: moduleName, [type]: true }];
      }
    });
  };

  // Bulk Grant/Revoke for all modules
  const handleBulkSet = (action: "all" | "readOnly" | "clear") => {
    if (action === "all") {
      setActivePermissions(
        allModuleList.map((mod) => ({
          name: mod,
          create: true,
          read: true,
          update: true,
          delete: true,
        }))
      );
    } else if (action === "readOnly") {
      setActivePermissions(
        allModuleList.map((mod) => ({
          name: mod,
          create: false,
          read: true,
          update: false,
          delete: false,
        }))
      );
    } else {
      setActivePermissions([]);
    }
  };

  // Save Role Permissions
  const handleSave = async () => {
    if (!selectedRoleId) return;
    setSaving(true);

    try {
      const res = await axios.patch("/api/role", {
        id: selectedRoleId,
        allowedModules: activePermissions,
      });

      if (res.data?.id) {
        successMessage(`Permissions updated for role '${currentRole?.name}'!`);
        // Update local state
        setRoles((prev) =>
          prev.map((r) => (r.id === selectedRoleId ? { ...r, allowedModules: activePermissions } : r))
        );
      } else {
        errorMessage("Failed to update permissions");
      }
    } catch (err: any) {
      errorMessage(err?.response?.data?.error || "Error saving permissions");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full py-2 space-y-6 max-w-7xl mx-auto">
      {/* 1. Header Navigation Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-slate-900 to-indigo-800 text-white flex items-center justify-center shadow-lg shadow-indigo-900/20">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              Permissions Matrix & Module Scopes
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Configure granular Create, Read, Update, and Delete privileges across all system dashboards and service modules.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/Roles">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 gap-1.5 h-9 px-3.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Roles
            </Button>
          </Link>

          <Button
            onClick={handleSave}
            disabled={saving || !currentRole || currentRole.name === "admin"}
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold h-9 px-5 gap-2 shadow-md shadow-indigo-600/20"
          >
            <Save className={`w-3.5 h-3.5 ${saving ? "animate-spin" : ""}`} />
            {saving ? "Saving Changes..." : "Save Matrix"}
          </Button>
        </div>
      </div>

      {/* 2. Select Role Tabs */}
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
          1. Select Role Persona to Configure:
        </p>
        <div className="flex flex-wrap gap-2.5">
          {fetchingRoles ? (
            <p className="text-xs text-slate-400">Loading roles...</p>
          ) : (
            roles.map((role) => {
              const isSelected = selectedRoleId === role.id;
              const isAdmin = role.name === "admin";

              return (
                <button
                  key={role.id}
                  onClick={() => handleSelectRole(role)}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2.5 border ${
                    isSelected
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md border-transparent ring-2 ring-indigo-500/40"
                      : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-800 hover:bg-slate-50"
                  }`}
                >
                  <Avatar
                    src={role.image || undefined}
                    alt={role.name}
                    sx={{ width: 22, height: 22, fontSize: "10px" }}
                  >
                    {role.name.charAt(0).toUpperCase()}
                  </Avatar>
                  <span className="capitalize">{role.name}</span>
                  {isAdmin && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 font-semibold">
                      Full Admin
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* 3. Permissions Matrix Table */}
      {currentRole && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm space-y-4 p-6">
          {/* Header & Quick Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-600" />
                Configuring Permissions for <span className="capitalize text-indigo-600">{currentRole.name}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {currentRole.name === "admin"
                  ? "Administrator has full unconstrained access across all modules by system design."
                  : "Click the checkboxes below to toggle CRUD privileges for this persona."}
              </p>
            </div>

            {currentRole.name !== "admin" && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkSet("all")}
                  className="rounded-xl text-xs h-8 px-2.5 text-indigo-600 border-slate-200"
                >
                  Grant All CRUD
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkSet("readOnly")}
                  className="rounded-xl text-xs h-8 px-2.5 text-slate-600 border-slate-200"
                >
                  Read Only
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleBulkSet("clear")}
                  className="rounded-xl text-xs h-8 px-2.5 text-rose-600 hover:bg-rose-50"
                >
                  Clear All
                </Button>
              </div>
            )}
          </div>

          {/* Matrix Grid */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase">
                  <th className="py-3 px-4">System Module</th>
                  <th className="py-3 px-4 text-center">Create</th>
                  <th className="py-3 px-4 text-center">Read / View</th>
                  <th className="py-3 px-4 text-center">Update / Edit</th>
                  <th className="py-3 px-4 text-center">Delete / Purge</th>
                  <th className="py-3 px-4 text-right">Access Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {allModuleList.map((moduleName) => {
                  const isAdmin = currentRole.name === "admin";
                  const perm = activePermissions.find((m) => m.name === moduleName) || {};

                  const c = isAdmin ? true : !!perm.create;
                  const r = isAdmin ? true : !!perm.read;
                  const u = isAdmin ? true : !!perm.update;
                  const d = isAdmin ? true : !!perm.delete;

                  const isFull = c && r && u && d;
                  const isNone = !c && !r && !u && !d;
                  const isReadOnly = !c && r && !u && !d;

                  return (
                    <tr key={moduleName} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      {/* Module Name */}
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Layers className="w-3.5 h-3.5 text-indigo-500" />
                        {moduleName}
                      </td>

                      {/* Create */}
                      <td className="py-3 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={c}
                          disabled={isAdmin}
                          onChange={() => handleToggle(moduleName, "create")}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 accent-indigo-600 cursor-pointer"
                        />
                      </td>

                      {/* Read */}
                      <td className="py-3 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={r}
                          disabled={isAdmin}
                          onChange={() => handleToggle(moduleName, "read")}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 accent-indigo-600 cursor-pointer"
                        />
                      </td>

                      {/* Update */}
                      <td className="py-3 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={u}
                          disabled={isAdmin}
                          onChange={() => handleToggle(moduleName, "update")}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 accent-indigo-600 cursor-pointer"
                        />
                      </td>

                      {/* Delete */}
                      <td className="py-3 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={d}
                          disabled={isAdmin}
                          onChange={() => handleToggle(moduleName, "delete")}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 accent-indigo-600 cursor-pointer"
                        />
                      </td>

                      {/* Access Status Badge */}
                      <td className="py-3 px-4 text-right">
                        {isFull ? (
                          <span className="inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                            <Check className="w-3 h-3" /> Full Access
                          </span>
                        ) : isReadOnly ? (
                          <span className="font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                            Read Only
                          </span>
                        ) : isNone ? (
                          <span className="font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800">
                            No Access
                          </span>
                        ) : (
                          <span className="font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                            Custom Scopes
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              onClick={handleSave}
              disabled={saving || currentRole.name === "admin"}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold h-10 px-6 gap-2 shadow-md shadow-indigo-600/20"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving Permissions..." : `Save Changes for ${currentRole.name}`}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Permissions;
