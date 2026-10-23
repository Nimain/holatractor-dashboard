"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Tractor,
  Users,
  Plus,
  Play,
  Pause,
  CheckCircle2,
  Clock,
  Gauge,
  Sparkles,
  ArrowRight,
  Radio,
  FileText,
  Search,
  Trash2,
  Layers,
  MapPin,
} from "lucide-react";
import { TaskManagementService, FarmTask } from "@/utils/TaskManagementService";
import { getAuthUserId } from "@/utils/auth/clientAuth";
import { successMessage, errorMessage } from "@/utils/Toastify/Messages";

interface TaskManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCreateTask: () => void;
  onOpenLiveTracking: (taskId: string) => void;
  onOpenReport: (taskId: string) => void;
  ownerId?: string;
}

export const TaskManagementModal: React.FC<TaskManagementModalProps> = ({
  isOpen,
  onClose,
  onOpenCreateTask,
  onOpenLiveTracking,
  onOpenReport,
  ownerId,
}) => {
  const [tasks, setTasks] = useState<FarmTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<"ACTIVE" | "COMPLETED" | "ALL">("ACTIVE");
  const [searchQuery, setSearchQuery] = useState("");

  const loadTasks = async () => {
    try {
      setLoading(true);
      const activeId = ownerId || getAuthUserId();
      const data = await TaskManagementService.getOwnerTasks(activeId);
      setTasks(data);
    } catch (err) {
      console.warn("Failed to load tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    loadTasks();
    const interval = setInterval(loadTasks, 15000);
    return () => clearInterval(interval);
  }, [isOpen, ownerId]);

  if (!isOpen) return null;

  const activeTasks = tasks.filter((t) => t.status === "IN_PROGRESS" || t.status === "PAUSED");
  const completedTasks = tasks.filter((t) => t.status === "COMPLETED");

  const displayedTasks = (
    selectedTab === "ACTIVE"
      ? activeTasks
      : selectedTab === "COMPLETED"
      ? completedTasks
      : tasks
  ).filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.task_name.toLowerCase().includes(q) ||
      (t.farm_name && t.farm_name.toLowerCase().includes(q)) ||
      t.operation_type.toLowerCase().includes(q) ||
      (t.assignments && t.assignments.some((a) => a.tractor_name.toLowerCase().includes(q) || a.operator_name.toLowerCase().includes(q)))
    );
  });

  const totalAcresInProgress = activeTasks.reduce((acc, t) => acc + (t.total_acres || 0), 0);
  const totalCompletedAcres = tasks.reduce((acc, t) => acc + (t.completed_acres || 0), 0);

  const handleStatusToggle = async (task: FarmTask) => {
    const nextStatus = task.status === "IN_PROGRESS" ? "PAUSED" : "IN_PROGRESS";
    await TaskManagementService.updateTaskStatus(task.id, nextStatus);
    successMessage(`Task ${task.task_name} is now ${nextStatus === "PAUSED" ? "paused" : "in progress"}.`);
    loadTasks();
  };

  const handleCompleteTask = async (taskId: string) => {
    await TaskManagementService.updateTaskStatus(taskId, "COMPLETED");
    successMessage("Task completed! Opening performance audit report...");
    loadTasks();
    onOpenReport(taskId);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (confirm("Are you sure you want to delete this field task?")) {
      await TaskManagementService.deleteTask(taskId);
      successMessage("Task deleted successfully.");
      loadTasks();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-slate-50 rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden my-auto">
        {/* Header with Stitch Red Brand Theme */}
        <div className="flex flex-wrap items-center justify-between px-6 py-5 bg-gradient-to-r from-red-800 via-red-900 to-amber-950 text-white shrink-0 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center shadow-inner">
              <Tractor className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-white tracking-tight">
                  Agricultural Task Operations Console
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-300/30 text-[10px] font-black uppercase text-amber-200">
                  TractorAI
                </span>
              </div>
              <p className="text-xs text-red-100/80 mt-0.5">
                Multi-machine field dispatch, live GPS progress, and post-operation financial audits
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                onOpenCreateTask();
              }}
              className="px-4 py-2 rounded-xl bg-white text-red-900 hover:bg-amber-100 font-black text-xs uppercase tracking-wider shadow-lg flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>New Field Task</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Top Summary Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-6 pb-2 shrink-0">
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Active In-Field
              </span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">
                {activeTasks.length} Operations
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <Play className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Area in Progress
              </span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">
                {Math.round(totalAcresInProgress)} Acres
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <Gauge className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Total Completed
              </span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">
                {Math.round(totalCompletedAcres)} Acres
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Navigation Tabs & Search Row */}
        <div className="px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-2xl w-full sm:w-auto">
            <button
              onClick={() => setSelectedTab("ACTIVE")}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedTab === "ACTIVE"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Active ({activeTasks.length})
            </button>
            <button
              onClick={() => setSelectedTab("COMPLETED")}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedTab === "COMPLETED"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Completed ({completedTasks.length})
            </button>
            <button
              onClick={() => setSelectedTab("ALL")}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedTab === "ALL"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All Tasks ({tasks.length})
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, farm, tractor..."
              className="w-full pl-8 pr-3.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-700"
            />
          </div>
        </div>

        {/* Scrollable Tasks List */}
        <div className="flex-1 overflow-y-auto px-6 py-2 pb-6 space-y-4">
          {loading && tasks.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              Loading agricultural operations...
            </div>
          ) : displayedTasks.length === 0 ? (
            <div className="py-16 bg-white rounded-3xl border border-slate-200/80 text-center flex flex-col items-center justify-center p-6">
              <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                <Tractor className="w-8 h-8" />
              </div>
              <h4 className="text-base font-black text-slate-800">
                {searchQuery ? "No matching operations found" : "No tasks in this section"}
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
                Dispatch your first multi-machine agricultural task to track live GPS acreage and operator performance.
              </p>
              <button
                onClick={onOpenCreateTask}
                className="px-5 py-2.5 rounded-xl bg-red-800 hover:bg-red-900 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-md transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Task</span>
              </button>
            </div>
          ) : (
            displayedTasks.map((task) => {
              const progress =
                task.progress_pct ||
                (task.total_acres > 0 ? (task.completed_acres / task.total_acres) * 100 : 0);
              const isDone = task.status === "COMPLETED";
              const isPaused = task.status === "PAUSED";
              const isRunning = task.status === "IN_PROGRESS";

              return (
                <div
                  key={task.id}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between gap-4"
                >
                  {/* Top Card Row */}
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-800 font-extrabold text-[10px] uppercase tracking-wider flex items-center gap-1">
                          <Tractor className="w-3 h-3" />
                          {task.operation_type}
                        </span>

                        <span
                          className={`px-2.5 py-0.5 rounded-full font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5 ${
                            isDone
                              ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                              : isPaused
                              ? "bg-amber-50 border border-amber-200 text-amber-700"
                              : "bg-red-50 border border-red-200 text-red-700"
                          }`}
                        >
                          {isRunning && (
                            <span className="relative flex h-1.5 w-1.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-600" />
                            </span>
                          )}
                          {isDone ? "Completed" : isPaused ? "Paused" : "In Field"}
                        </span>
                      </div>

                      <h4 className="text-base font-black text-slate-900 mt-1.5">
                        {task.task_name}
                      </h4>

                      <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{task.farm_name || "Parcela Principal"}</span>
                        {task.client_name && <span>• {task.client_name}</span>}
                      </p>
                    </div>

                    {/* Machine & Operator Count Badges */}
                    <div className="flex items-center gap-2">
                      <div className="px-3 py-1 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Tractor className="w-3.5 h-3.5 text-red-700" />
                        <span>
                          {task.assignments?.length || 1}{" "}
                          {task.assignments?.length === 1 ? "Machine" : "Machines"}
                        </span>
                      </div>
                      <div className="px-3 py-1 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-blue-700" />
                        <span>
                          {task.assignments?.length || 1}{" "}
                          {task.assignments?.length === 1 ? "Driver" : "Drivers"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between items-center text-xs font-bold text-slate-700 mb-1.5">
                      <span>Area Covered</span>
                      <span>
                        {task.completed_acres.toFixed(1)} / {task.total_acres.toFixed(1)} Acres (
                        {Math.min(100, Math.round(progress))}%)
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          isDone
                            ? "bg-emerald-500"
                            : "bg-gradient-to-r from-red-700 to-amber-500"
                        }`}
                        style={{ width: `${Math.min(100, progress)}%` }}
                      />
                    </div>
                  </div>

                  {/* Assigned Fleet Pills */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {task.assignments?.map((asgn, idx) => (
                      <div
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/80 text-[11px] font-bold text-slate-700 flex items-center gap-1.5"
                      >
                        <Tractor className="w-3 h-3 text-red-700" />
                        <span>{asgn.tractor_name}</span>
                        <span className="text-slate-400">({asgn.operator_name})</span>
                      </div>
                    ))}
                  </div>

                  {/* Card Action Buttons Footer */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onOpenLiveTracking(task.id)}
                        className="px-3.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-800 font-bold text-xs flex items-center gap-1.5 transition-all"
                      >
                        <Radio className="w-3.5 h-3.5" />
                        <span>Live GPS Tracking</span>
                      </button>

                      {!isDone && (
                        <button
                          onClick={() => handleStatusToggle(task)}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                            isRunning
                              ? "bg-amber-50 hover:bg-amber-100 text-amber-800"
                              : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                          <span>{isRunning ? "Pause" : "Resume"}</span>
                        </button>
                      )}

                      {!isDone && (
                        <button
                          onClick={() => handleCompleteTask(task.id)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Complete Task</span>
                        </button>
                      )}

                      {isDone && (
                        <button
                          onClick={() => onOpenReport(task.id)}
                          className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Audit Report</span>
                        </button>
                      )}
                    </div>

                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-700 hover:bg-red-50 transition-colors"
                      title="Delete task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskManagementModal;
