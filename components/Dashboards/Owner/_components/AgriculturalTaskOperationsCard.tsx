"use client";

import React, { useState, useEffect } from "react";
import {
  Tractor,
  Sparkles,
  ArrowRight,
  Plus,
  Play,
  Gauge,
  CheckCircle2,
  Radio,
  Layers,
} from "lucide-react";
import { TaskManagementService, FarmTask } from "@/utils/TaskManagementService";
import { getAuthUserId } from "@/utils/auth/clientAuth";

interface AgriculturalTaskOperationsCardProps {
  ownerId?: string;
  onOpenTaskManagement: () => void;
  onOpenCreateTask: () => void;
}

export const AgriculturalTaskOperationsCard: React.FC<AgriculturalTaskOperationsCardProps> = ({
  ownerId,
  onOpenTaskManagement,
  onOpenCreateTask,
}) => {
  const [tasks, setTasks] = useState<FarmTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchTasks = async () => {
      try {
        const activeId = ownerId || getAuthUserId();
        const data = await TaskManagementService.getOwnerTasks(activeId);
        if (isMounted) {
          setTasks(data);
        }
      } catch (e) {
        console.warn("Failed to load owner tasks for card:", e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchTasks();
    const interval = setInterval(fetchTasks, 20000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [ownerId]);

  const activeTasks = tasks.filter((t) => t.status === "IN_PROGRESS" || t.status === "PAUSED");
  const completedTasks = tasks.filter((t) => t.status === "COMPLETED");
  const totalAcresInProgress = activeTasks.reduce((acc, t) => acc + (t.total_acres || 0), 0);
  const totalCompletedAcres = tasks.reduce((acc, t) => acc + (t.completed_acres || 0), 0);

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-800 via-red-900 to-amber-950 text-white shadow-xl shadow-red-950/20 border border-white/15 p-6 md:p-8 transition-all hover:shadow-2xl">
      {/* Background Decorative Rings */}
      <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-white/5 blur-2xl pointer-events-none" />
      <div className="absolute -left-12 -bottom-12 w-48 h-48 rounded-full bg-amber-500/10 blur-xl pointer-events-none" />

      {/* Top Badge Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/25 backdrop-blur-md">
            <Tractor className="w-3.5 h-3.5 text-amber-300" />
            <span className="text-[11px] font-extrabold tracking-wider uppercase text-white">
              Multi-Tractor Dispatch
            </span>
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-400/20 border border-amber-300/30 text-amber-200">
            <Sparkles className="w-3 h-3" />
            <span className="text-[10px] font-black uppercase tracking-wide">TractorAI</span>
          </div>
        </div>

        {/* Live Status Pill */}
        {activeTasks.length > 0 ? (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-bold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <span>{activeTasks.length} Operations In-Field</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white/70 text-xs font-medium">
            <Radio className="w-3 h-3" />
            <span>Fleet Ready</span>
          </div>
        )}
      </div>

      {/* Title & Description */}
      <div className="max-w-2xl mb-6">
        <h3 className="text-2xl lg:text-3xl font-black text-white tracking-tight leading-tight">
          Agricultural Task Operations
        </h3>
        <p className="text-sm md:text-base text-red-100/85 mt-2 leading-relaxed font-medium">
          Dispatch multi-machine field operations (plowing, harrowing, seeding, spraying) with real-time GPS telemetry, acre-by-acre progress tracking, and instant financial audit reports.
        </p>
      </div>

      {/* Dynamic Metric Counter Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 mb-6">
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3.5 border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-white/70 mb-1">
            <span className="text-xs font-bold">Active Tasks</span>
            <Play className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <span className="text-2xl font-black text-white tracking-tight">
            {loading ? "..." : activeTasks.length}
          </span>
          <span className="text-[10px] text-white/60 mt-0.5">Live in Field</span>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3.5 border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-white/70 mb-1">
            <span className="text-xs font-bold">Area in Work</span>
            <Gauge className="w-3.5 h-3.5 text-amber-300" />
          </div>
          <span className="text-2xl font-black text-white tracking-tight">
            {loading ? "..." : `${Math.round(totalAcresInProgress)} ac`}
          </span>
          <span className="text-[10px] text-white/60 mt-0.5">Assigned Acres</span>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3.5 border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-white/70 mb-1">
            <span className="text-xs font-bold">Completed</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-300" />
          </div>
          <span className="text-2xl font-black text-white tracking-tight">
            {loading ? "..." : `${Math.round(totalCompletedAcres)} ac`}
          </span>
          <span className="text-[10px] text-white/60 mt-0.5">Audited Work</span>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3.5 border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-white/70 mb-1">
            <span className="text-xs font-bold">Fleet Telemetry</span>
            <Layers className="w-3.5 h-3.5 text-red-300" />
          </div>
          <span className="text-2xl font-black text-white tracking-tight">
            {activeTasks.reduce((acc, t) => acc + (t.assignments?.length || 0), 0) || (activeTasks.length > 0 ? activeTasks.length : 0)}
          </span>
          <span className="text-[10px] text-white/60 mt-0.5">Active Machines</span>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/15">
        <button
          onClick={onOpenTaskManagement}
          className="flex items-center gap-2 text-sm font-bold text-white hover:text-amber-200 transition-colors group"
        >
          <span>View Live Operations Console</span>
          <div className="w-7 h-7 rounded-full bg-white text-red-800 flex items-center justify-center shadow-md group-hover:translate-x-1 transition-transform">
            <ArrowRight className="w-4 h-4" />
          </div>
        </button>

        <button
          onClick={onOpenCreateTask}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-red-900 hover:bg-amber-100 transition-all font-black text-xs uppercase tracking-wider shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4 text-red-700 stroke-[3]" />
          <span>Dispatch New Task</span>
        </button>
      </div>
    </div>
  );
};

export default AgriculturalTaskOperationsCard;
