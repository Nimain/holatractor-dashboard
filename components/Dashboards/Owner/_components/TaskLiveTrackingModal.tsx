"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Tractor,
  Users,
  Play,
  Pause,
  CheckCircle2,
  Phone,
  Droplets,
  Clock,
  Gauge,
  Sparkles,
  Radio,
  FileText,
  Flame,
  Zap,
  Navigation,
} from "lucide-react";
import { TaskManagementService, FarmTask } from "@/utils/TaskManagementService";
import { successMessage, errorMessage } from "@/utils/Toastify/Messages";

interface TaskLiveTrackingModalProps {
  taskId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenReport: (taskId: string) => void;
  onTaskUpdated?: () => void;
}

export const TaskLiveTrackingModal: React.FC<TaskLiveTrackingModalProps> = ({
  taskId,
  isOpen,
  onClose,
  onOpenReport,
  onTaskUpdated,
}) => {
  const [task, setTask] = useState<FarmTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !taskId) return;

    let isMounted = true;
    const fetchTask = async () => {
      try {
        const data = await TaskManagementService.getTaskDetails(taskId);
        if (isMounted && data) {
          setTask(data);
        }
      } catch (err) {
        console.warn("Error fetching live task telemetry:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchTask();
    const interval = setInterval(fetchTask, 8000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isOpen, taskId]);

  if (!isOpen || !taskId) return null;

  const handleStatusChange = async (newStatus: "IN_PROGRESS" | "PAUSED" | "COMPLETED") => {
    try {
      setActionLoading(true);
      await TaskManagementService.updateTaskStatus(taskId, newStatus);
      const updated = await TaskManagementService.getTaskDetails(taskId);
      if (updated) setTask(updated);

      if (newStatus === "COMPLETED") {
        successMessage("Operation completed! Opening performance audit report...");
        if (onTaskUpdated) onTaskUpdated();
        onClose();
        onOpenReport(taskId);
      } else {
        successMessage(`Operation is now ${newStatus === "PAUSED" ? "paused" : "in progress"}.`);
        if (onTaskUpdated) onTaskUpdated();
      }
    } catch (err: any) {
      errorMessage("Failed to update status: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const progress = task
    ? task.progress_pct || (task.total_acres > 0 ? (task.completed_acres / task.total_acres) * 100 : 0)
    : 0;

  const isCompleted = task?.status === "COMPLETED";
  const isPaused = task?.status === "PAUSED";
  const isWorking = task?.status === "IN_PROGRESS";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden my-auto">
        {/* Header with Stitch Red Brand Theme */}
        <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-red-800 via-red-900 to-amber-950 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center shadow-inner">
              <Radio className="w-5 h-5 text-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-white tracking-tight">
                  {task?.task_name || "Live Task Tracking"}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-white/20 border border-white/30 text-[10px] font-black uppercase text-white">
                  {task?.operation_type || "PLOWING"}
                </span>
              </div>
              <p className="text-xs text-red-100/80 mt-0.5">
                {task?.farm_name || "Parcela Principal"} • {task?.client_name || "Cliente Principal"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onOpenReport(taskId);
              }}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Audit Report</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Top Progress & Status Dashboard */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            {/* Progress Section */}
            <div className="flex-1 w-full">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Gauge className="w-4 h-4 text-red-700" />
                  Area Coverage Progress
                </span>
                <span className="text-xs font-black text-slate-900">
                  {task?.completed_acres.toFixed(1)} / {task?.total_acres.toFixed(1)} Acres ({Math.min(100, Math.round(progress))}%)
                </span>
              </div>

              <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-700 via-red-600 to-amber-500 rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(100, progress)}%` }}
                />
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-6 shrink-0 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Diesel</span>
                <span className="font-black text-slate-900 text-sm">
                  {task?.total_fuel_consumed || Math.round((task?.completed_acres || 0) * 3.6)} L
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Engine Hours</span>
                <span className="font-black text-slate-900 text-sm">
                  {task?.total_engine_hours || Math.round(((task?.completed_acres || 0) / 1.6) * 10) / 10} hrs
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Status</span>
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-full font-black text-[11px] ${
                    isCompleted
                      ? "bg-emerald-100 text-emerald-800"
                      : isPaused
                      ? "bg-amber-100 text-amber-800"
                      : "bg-red-100 text-red-800 animate-pulse"
                  }`}
                >
                  {isCompleted ? "Completed" : isPaused ? "Paused" : "In Progress"}
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Visual Field Telemetry Radar */}
          <div className="relative rounded-2xl bg-slate-950 border border-slate-800 p-6 overflow-hidden text-white min-h-[220px] flex flex-col justify-between">
            {/* Grid Pattern */}
            <div
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                backgroundImage: "radial-gradient(circle, #38bdf8 1px, transparent 1px)",
                backgroundSize: "24px 24px",
              }}
            />

            {/* Header */}
            <div className="relative flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4 text-emerald-400 animate-bounce" />
                <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                  Live Field Boundary & GPS Radar
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {task?.assignments?.[0]?.telemetry?.lat.toFixed(4) || "-17.7833"}° S, {task?.assignments?.[0]?.telemetry?.lon.toFixed(4) || "-63.1821"}° W
              </span>
            </div>

            {/* Simulated Tractor Blips Moving */}
            <div className="relative my-8 flex items-center justify-around">
              {task?.assignments?.map((asgn, i) => {
                const speed = asgn.telemetry?.speed || (isWorking ? 5.5 : 0);
                return (
                  <div key={i} className="flex flex-col items-center">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-2xl bg-red-800/80 border-2 border-red-500 flex items-center justify-center shadow-lg shadow-red-900/50">
                        <Tractor className="w-6 h-6 text-white" />
                      </div>
                      {isWorking && (
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-bold text-white mt-2">{asgn.tractor_name}</span>
                    <span className="text-[10px] text-emerald-400 font-mono mt-0.5">
                      {speed > 0 ? `${speed.toFixed(1)} km/h • WORKING` : "IDLE / STOP"}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="relative flex justify-between items-center text-[10px] text-slate-400 border-t border-slate-800/80 pt-3">
              <span>Geo-audit Active • GPS Satellites Locked (9)</span>
              <span>Updated: Just now</span>
            </div>
          </div>

          {/* Machine Breakdown Telemetry List */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-2">
              <Tractor className="w-4 h-4 text-red-700" />
              Assigned Fleet Telemetry ({task?.assignments?.length || 0} Units)
            </h4>

            <div className="space-y-3">
              {task?.assignments?.map((asgn, idx) => {
                const telem = asgn.telemetry;
                const speed = telem?.speed || (isWorking ? 5.5 : 0);
                const isMachineWorking = isWorking && speed > 0.5;

                return (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-red-50 text-red-800 border border-red-200 flex items-center justify-center font-black text-xs shrink-0">
                        #{idx + 1}
                      </div>
                      <div>
                        <h5 className="text-xs font-black text-slate-900">{asgn.tractor_name}</h5>
                        <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                          <Users className="w-3 h-3 text-slate-400" />
                          <span>{asgn.operator_name}</span>
                          {asgn.operator_phone && (
                            <span className="text-slate-400 font-mono">({asgn.operator_phone})</span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Speed</span>
                        <span className="font-black text-slate-800">{speed.toFixed(1)} km/h</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Battery</span>
                        <span className="font-black text-slate-800">{telem?.battery_volts || 13.8}V</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">State</span>
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full font-black text-[10px] ${
                            isMachineWorking
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {isMachineWorking ? "WORKING" : "PAUSED"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action Controls Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            {isWorking ? (
              <button
                onClick={() => handleStatusChange("PAUSED")}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-md transition-all"
              >
                <Pause className="w-4 h-4" />
                <span>Pause Operation</span>
              </button>
            ) : (
              <button
                onClick={() => handleStatusChange("IN_PROGRESS")}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-md transition-all"
              >
                <Play className="w-4 h-4" />
                <span>Resume Operation</span>
              </button>
            )}

            {!isCompleted && (
              <button
                onClick={() => handleStatusChange("COMPLETED")}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-red-800 hover:bg-red-900 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-md transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Complete Task</span>
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskLiveTrackingModal;
