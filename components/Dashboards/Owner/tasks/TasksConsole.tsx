"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
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
  ChevronLeft,
  DollarSign,
  Fuel,
} from "lucide-react";
import { TaskManagementService, FarmTask } from "@/utils/TaskManagementService";
import { getAuthUserId } from "@/utils/auth/clientAuth";
import { useCookie } from "next-cookie";
import { successMessage, errorMessage } from "@/utils/Toastify/Messages";
import CreateTaskModal from "../_components/CreateTaskModal";
import TaskLiveTrackingModal from "../_components/TaskLiveTrackingModal";
import TaskReportModal from "../_components/TaskReportModal";
import { detectUserCurrency } from "@/utils/currency/currencyService";

export default function TasksConsole() {
  const [tasks, setTasks] = useState<FarmTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<"ACTIVE" | "COMPLETED" | "ALL">("ACTIVE");
  const [searchQuery, setSearchQuery] = useState("");
  const [currency, setCurrency] = useState(detectUserCurrency());

  // Modal states
  const [createTaskModalOpen, setCreateTaskModalOpen] = useState(false);
  const [liveTrackingTaskId, setLiveTrackingTaskId] = useState<string | null>(null);
  const [reportTaskId, setReportTaskId] = useState<string | null>(null);

  const { cookie } = useCookie();
  let user: any = null;
  try {
    const rawUser = cookie?.get("user");
    user = typeof rawUser === "string" ? JSON.parse(rawUser) : rawUser;
  } catch (e) {
    // Client-side fallback
  }
  const ownerId = user?.userId || user?.id || getAuthUserId();

  const loadTasks = async () => {
    try {
      setLoading(true);
      const data = await TaskManagementService.getOwnerTasks(ownerId);
      setTasks(data);
    } catch (err) {
      console.warn("Failed to load tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrency(detectUserCurrency());
    loadTasks();
    const interval = setInterval(loadTasks, 15000);
    return () => clearInterval(interval);
  }, [ownerId]);

  const handleDeleteTask = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this agricultural task?")) return;
    try {
      await TaskManagementService.deleteTask(id);
      successMessage("Task removed successfully");
      loadTasks();
    } catch (err) {
      errorMessage("Failed to delete task");
    }
  };

  const filteredTasks = tasks.filter((task) => {
    if (selectedTab === "ACTIVE" && !(task.status === "IN_PROGRESS" || task.status === "PAUSED")) return false;
    if (selectedTab === "COMPLETED" && task.status !== "COMPLETED") return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = task.task_name?.toLowerCase().includes(q);
      const matchFarm = task.farm_name?.toLowerCase().includes(q);
      const matchOp = task.operation_type?.toLowerCase().includes(q);
      const matchClient = task.client_name?.toLowerCase().includes(q);
      return matchName || matchFarm || matchOp || matchClient;
    }
    return true;
  });

  const activeCount = tasks.filter((t) => t.status === "IN_PROGRESS" || t.status === "PAUSED").length;
  const completedCount = tasks.filter((t) => t.status === "COMPLETED").length;
  const totalAreaInProgress = tasks
    .filter((t) => t.status === "IN_PROGRESS" || t.status === "PAUSED")
    .reduce((acc, t) => acc + (t.total_acres || 0), 0);
  const totalCompletedAcres = tasks.reduce((acc, t) => acc + (t.completed_acres || 0), 0);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Top Header Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/owner"
            className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-100 text-red-700 border border-red-200">
                Multi-Tractor Dispatch
              </span>
              <span className="flex items-center gap-1 text-[11px] font-bold text-amber-600">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Live Fleet Telemetry
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mt-0.5">
              Agricultural Task Operations
            </h1>
            <p className="text-xs md:text-sm text-slate-500">
              Real-time agricultural telemetry, multi-machine coordination, and audited profit reports
            </p>
          </div>
        </div>

        <button
          onClick={() => setCreateTaskModalOpen(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black text-sm uppercase tracking-wider shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Plus className="w-5 h-5 stroke-[3]" />
          <span>Dispatch New Task</span>
        </button>
      </div>

      {/* Live Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Tasks</p>
            <p className="text-2xl font-black text-slate-900">{activeCount}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Gauge className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">In Progress Area</p>
            <p className="text-2xl font-black text-slate-900">{totalAreaInProgress.toFixed(1)} <span className="text-xs text-slate-500 font-semibold">ac</span></p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Completed Acres</p>
            <p className="text-2xl font-black text-slate-900">{totalCompletedAcres.toFixed(1)} <span className="text-xs text-slate-500 font-semibold">ac</span></p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Operations</p>
            <p className="text-2xl font-black text-slate-900">{tasks.length}</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-1.5 w-full sm:w-auto bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setSelectedTab("ACTIVE")}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              selectedTab === "ACTIVE"
                ? "bg-white text-red-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Active In Field ({activeCount})
          </button>
          <button
            onClick={() => setSelectedTab("COMPLETED")}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              selectedTab === "COMPLETED"
                ? "bg-white text-red-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Completed ({completedCount})
          </button>
          <button
            onClick={() => setSelectedTab("ALL")}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              selectedTab === "ALL"
                ? "bg-white text-red-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            All Tasks ({tasks.length})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tasks, fields, clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs font-medium bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
          />
        </div>
      </div>

      {/* Task List */}
      {loading ? (
        <div className="p-16 text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
          <Radio className="w-10 h-10 text-red-600 animate-spin mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-700">Loading live task telemetry...</p>
          <p className="text-xs text-slate-400 mt-1">Connecting to tractor onboard devices</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-slate-50 border border-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
            <Tractor className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No tasks found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? "No tasks match your search filter."
              : selectedTab === "ACTIVE"
              ? "No agricultural tasks are currently active in the field."
              : "Dispatch a new multi-tractor agricultural task to start field work."}
          </p>
          <button
            onClick={() => setCreateTaskModalOpen(true)}
            className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Task</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTasks.map((task) => {
            const pct = task.total_acres > 0 ? Math.min(100, Math.round((task.completed_acres / task.total_acres) * 100)) : 0;
            const isCompleted = task.status === "COMPLETED";
            const isPaused = task.status === "PAUSED";

            return (
              <div
                key={task.id}
                className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all space-y-4 relative group"
              >
                {/* Header info */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase ${
                          isCompleted
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : isPaused
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : "bg-red-100 text-red-800 border border-red-200"
                        }`}
                      >
                        {!isCompleted && <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping" />}
                        {task.status.replace("_", " ")}
                      </span>
                      <span className="text-[11px] font-bold text-slate-500">
                        {task.operation_type}
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-slate-900 mt-1">{task.task_name}</h3>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                      <span className="flex items-center gap-1 font-semibold text-slate-700">
                        <MapPin className="w-3.5 h-3.5 text-red-500" />
                        {task.farm_name || "Field #1"}
                      </span>
                      {task.client_name && (
                        <span>• Client: <strong className="text-slate-700">{task.client_name}</strong></span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={(e) => handleDeleteTask(task.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-600 transition-all rounded-lg hover:bg-red-50"
                    title="Delete task"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Acreage Progress Bar */}
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
                    <span className="flex items-center gap-1">
                      <Gauge className="w-3.5 h-3.5 text-amber-500" />
                      Field Coverage Progress
                    </span>
                    <span className="font-black text-red-700">
                      {task.completed_acres.toFixed(1)} / {task.total_acres.toFixed(1)} ac ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isCompleted
                          ? "bg-emerald-500"
                          : "bg-gradient-to-r from-red-600 to-amber-500"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* Assigned Machines & Operators */}
                <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Dispatched Fleet ({task.assignments?.length || 0})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {task.assignments && task.assignments.length > 0 ? (
                      task.assignments.map((asgn, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-xs shadow-xs"
                        >
                          <Tractor className="w-3.5 h-3.5 text-red-600" />
                          <span className="font-bold text-slate-800">{asgn.tractor_name}</span>
                          <span className="text-slate-300">|</span>
                          <span className="text-slate-500 font-medium">{asgn.operator_name}</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic">No machines assigned</span>
                    )}
                  </div>
                </div>

                {/* Bottom Action Triggers */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div className="text-xs">
                    <span className="text-slate-400">Rate: </span>
                    <strong className="text-slate-800 font-black">
                      {currency.symbol}{task.price_per_acre}/ac
                    </strong>
                  </div>

                  <div className="flex items-center gap-2">
                    {isCompleted ? (
                      <button
                        onClick={() => setReportTaskId(task.id)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs transition-colors"
                      >
                        <FileText className="w-4 h-4 text-emerald-600" />
                        <span>Audit Report</span>
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => setReportTaskId(task.id)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5 text-slate-500" />
                          <span>Report</span>
                        </button>
                        <button
                          onClick={() => setLiveTrackingTaskId(task.id)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md transition-all"
                        >
                          <Radio className="w-3.5 h-3.5 animate-pulse" />
                          <span>Live Tracking</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Embedded Modals */}
      <CreateTaskModal
        isOpen={createTaskModalOpen}
        onClose={() => setCreateTaskModalOpen(false)}
        ownerId={ownerId}
        onTaskCreated={() => {
          setCreateTaskModalOpen(false);
          loadTasks();
        }}
      />

      <TaskLiveTrackingModal
        taskId={liveTrackingTaskId}
        isOpen={!!liveTrackingTaskId}
        onClose={() => setLiveTrackingTaskId(null)}
        onOpenReport={(id) => {
          setLiveTrackingTaskId(null);
          setReportTaskId(id);
        }}
        onTaskUpdated={loadTasks}
      />

      <TaskReportModal
        taskId={reportTaskId}
        isOpen={!!reportTaskId}
        onClose={() => setReportTaskId(null)}
      />
    </div>
  );
}
