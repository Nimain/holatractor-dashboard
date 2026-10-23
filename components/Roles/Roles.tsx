"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import Link from "next/link";
import { Avatar } from "@mui/material";
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
  Shield,
  ShieldCheck,
  Plus,
  Search,
  RefreshCw,
  Users,
  Edit3,
  Trash2,
  Lock,
  KeyRound,
  CheckCircle2,
  Sparkles,
  Layers,
} from "lucide-react";

export interface RoleData {
  id: string;
  name: string;
  image?: string | null;
  allowedModules?: any[];
  user_count?: number;
  createdAt?: string;
}

const Roles = () => {
  const { cookie } = useCookie();
  const access_token = cookie.get("access_token");

  const [roles, setRoles] = useState<RoleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Create Role Modal
  const [createOpen, setCreateOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleImage, setNewRoleImage] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Edit Role Modal
  const [editingRole, setEditingRole] = useState<RoleData | null>(null);
  const [editRoleName, setEditRoleName] = useState("");
  const [editRoleImage, setEditRoleImage] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch all roles
  const fetchRoles = useCallback(async () => {
    setLoading(true);
    let loaded = false;

    // 1. Next.js PostgreSQL API
    try {
      const res = await axios.get("/api/role", { timeout: 6000 });
      if (Array.isArray(res.data)) {
        setRoles(res.data);
        loaded = true;
      }
    } catch (e) {
      console.warn("Direct /api/role notice:", e);
    }

    // 2. NestJS fallback
    if (!loaded) {
      try {
        const res = await renderInstance.get("/role", {
          headers: access_token ? { Authorization: `Bearer ${access_token}` } : {},
        });
        if (Array.isArray(res.data)) {
          setRoles(res.data);
        }
      } catch (err) {
        errorMessage("Error fetching roles");
      }
    }

    setLoading(false);
  }, [access_token]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  // Create Role Handler
  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) {
      errorMessage("Please provide a role name");
      return;
    }

    setIsCreating(true);
    try {
      const res = await axios.post("/api/role", {
        name: newRoleName.trim().toLowerCase(),
        image: newRoleImage.trim(),
        allowedModules: [],
      });

      if (res.data?.id) {
        successMessage(`Role '${newRoleName}' created successfully!`);
        setNewRoleName("");
        setNewRoleImage("");
        setCreateOpen(false);
        fetchRoles();
      } else {
        errorMessage(res.data?.error || "Failed to create role");
      }
    } catch (err: any) {
      errorMessage(err?.response?.data?.error || "Error creating role");
    } finally {
      setIsCreating(false);
    }
  };

  // Edit Role Handler
  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRole) return;

    setIsUpdating(true);
    try {
      const res = await axios.patch("/api/role", {
        id: editingRole.id,
        name: editRoleName.trim().toLowerCase(),
        image: editRoleImage.trim(),
      });

      if (res.data?.id) {
        successMessage("Role updated successfully!");
        setEditingRole(null);
        fetchRoles();
      } else {
        errorMessage(res.data?.error || "Failed to update role");
      }
    } catch (err: any) {
      errorMessage(err?.response?.data?.error || "Error updating role");
    } finally {
      setIsUpdating(false);
    }
  };

  // Delete Role Handler
  const handleDeleteRole = async (role: RoleData) => {
    if (role.name === "admin") {
      errorMessage("The primary 'admin' role cannot be deleted.");
      return;
    }

    if (!window.confirm(`Are you sure you want to delete role '${role.name}'?`)) {
      return;
    }

    try {
      const res = await axios.delete(`/api/role?id=${role.id}`);
      if (res.data?.success || res.status === 200) {
        successMessage(`Role '${role.name}' deleted.`);
        fetchRoles();
      } else {
        errorMessage(res.data?.error || "Failed to delete role");
      }
    } catch (err: any) {
      errorMessage(err?.response?.data?.error || "Error deleting role");
    }
  };

  // Filtered Roles
  const filteredRoles = useMemo(() => {
    if (!searchQuery.trim()) return roles;
    const q = searchQuery.toLowerCase().trim();
    return roles.filter((r) => r.name.toLowerCase().includes(q));
  }, [roles, searchQuery]);

  return (
    <div className="w-full py-2 space-y-6 max-w-7xl mx-auto">
      {/* 1. Header with Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-slate-900 to-indigo-800 text-white flex items-center justify-center shadow-lg shadow-indigo-900/20">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              Access Roles & Authority
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                {roles.length} System Roles
              </span>
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Manage system authorization personas, assign privilege scopes, and bind modular permissions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchRoles}
            disabled={loading}
            className="rounded-xl border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 gap-2 h-9 px-3.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-indigo-600" : "text-slate-500"}`} />
            Refresh
          </Button>

          <Link href="/Permissions">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 gap-1.5 h-9 px-3.5"
            >
              <KeyRound className="w-3.5 h-3.5 text-indigo-600" /> Permissions Matrix
            </Button>
          </Link>

          {/* Create Role Modal */}
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold h-9 px-4 gap-1.5 shadow-md shadow-indigo-600/20">
                <Plus className="w-4 h-4" /> Create New Role
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-md p-6 rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                  <Shield className="w-5 h-5 text-indigo-600" />
                  Create System Role
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handleCreateRole} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase text-slate-600">Role Identifier / Name *</Label>
                  <Input
                    placeholder="e.g. technician, agronomy_lead, supervisor"
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    required
                    className="rounded-xl"
                  />
                  <p className="text-[11px] text-slate-400">Stored in lower case for permission matching.</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase text-slate-600">Role Avatar Image URL (Optional)</Label>
                  <Input
                    placeholder="https://images.unsplash.com/..."
                    value={newRoleImage}
                    onChange={(e) => setNewRoleImage(e.target.value)}
                    className="rounded-xl"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setCreateOpen(false)}
                    className="rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isCreating}
                    className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 gap-2"
                  >
                    {isCreating ? "Creating..." : "Create Role"}
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
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center font-bold">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Roles</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{roles.length}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Mapped Users</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {roles.reduce((acc, r) => acc + (r.user_count || 0), 0)}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center font-bold">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">RBAC Security</p>
            <p className="text-base font-bold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Active
            </p>
          </div>
        </div>
      </div>

      {/* 3. Search Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search roles by persona name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-xl h-10 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50"
          />
        </div>
      </div>

      {/* 4. Roles Grid */}
      {loading ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-4 shadow-sm">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
          <p className="text-sm font-medium text-slate-500">Querying roles registry...</p>
        </div>
      ) : filteredRoles.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 mx-auto flex items-center justify-center">
            <Shield className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Roles Found</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
              {searchQuery ? `No roles match "${searchQuery}".` : "No authorization roles registered."}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRoles.map((role) => {
            const isAdmin = role.name === "admin";
            const modCount = Array.isArray(role.allowedModules) ? role.allowedModules.length : 0;

            return (
              <div
                key={role.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 space-y-4 shadow-sm hover:border-indigo-500/50 hover:shadow-lg transition-all flex flex-col justify-between"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3.5">
                    <Avatar
                      src={role.image || undefined}
                      alt={role.name}
                      sx={{
                        width: 48,
                        height: 48,
                        bgcolor: isAdmin ? "#4f46e5" : "#0284c7",
                        fontWeight: "bold",
                        fontSize: "1.1rem",
                      }}
                    >
                      {role.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900 dark:text-white capitalize">
                          {role.name}
                        </h3>
                        {isAdmin && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                            Super Role
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-mono text-slate-400 mt-0.5">ID: {role.id.slice(0, 14)}...</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-xs py-2 border-y border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400" /> Active Users:
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {role.user_count || 0} accounts
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-slate-400" /> Configured Modules:
                    </span>
                    <span className="font-semibold text-indigo-600">
                      {modCount} modules
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <Link
                    href="/Permissions"
                    className="flex-1 text-center py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <KeyRound className="w-3.5 h-3.5" /> Permissions
                  </Link>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingRole(role);
                      setEditRoleName(role.name);
                      setEditRoleImage(role.image || "");
                    }}
                    className="h-8 px-2.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 border-slate-200 rounded-xl"
                    title="Edit Role"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </Button>

                  {!isAdmin && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteRole(role)}
                      className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl"
                      title="Delete Role"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* EDIT ROLE MODAL */}
      <Dialog open={!!editingRole} onOpenChange={(open) => !open && setEditingRole(null)}>
        <DialogContent className="max-w-md p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
              <Edit3 className="w-5 h-5 text-indigo-600" />
              Edit Role Details
            </DialogTitle>
          </DialogHeader>

          {editingRole && (
            <form onSubmit={handleUpdateRole} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase text-slate-600">Role Name *</Label>
                <Input
                  value={editRoleName}
                  onChange={(e) => setEditRoleName(e.target.value)}
                  required
                  disabled={editingRole.name === "admin"}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase text-slate-600">Avatar Image URL</Label>
                <Input
                  value={editRoleImage}
                  onChange={(e) => setEditRoleImage(e.target.value)}
                  placeholder="https://..."
                  className="rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setEditingRole(null)}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isUpdating}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 gap-2"
                >
                  {isUpdating ? "Saving..." : "Save Role"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Roles;
