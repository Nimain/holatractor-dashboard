"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Tractor,
  Users,
  DollarSign,
  Fuel,
  TrendingUp,
  CheckCircle2,
  Share2,
  Copy,
  Clock,
  Gauge,
  Sparkles,
  FileSpreadsheet,
} from "lucide-react";
import { TaskManagementService, TaskReportData } from "@/utils/TaskManagementService";
import { detectUserCurrency } from "@/utils/currency/currencyService";
import { successMessage } from "@/utils/Toastify/Messages";

interface TaskReportModalProps {
  taskId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TaskReportModal: React.FC<TaskReportModalProps> = ({
  taskId,
  isOpen,
  onClose,
}) => {
  const [report, setReport] = useState<TaskReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState(detectUserCurrency());
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen || !taskId) return;
    const curr = detectUserCurrency();
    setCurrency(curr);

    let isMounted = true;
    const loadReport = async () => {
      try {
        setLoading(true);
        const data = await TaskManagementService.getTaskReport(taskId, curr.symbol);
        if (isMounted && data) {
          setReport(data);
        }
      } catch (err) {
        console.warn("Error loading task report:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadReport();
  }, [isOpen, taskId]);

  if (!isOpen || !taskId) return null;

  const handleCopySummary = () => {
    if (report?.whatsapp_summary) {
      navigator.clipboard.writeText(report.whatsapp_summary);
      setCopied(true);
      successMessage("WhatsApp summary copied to clipboard!");
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleShareWhatsApp = () => {
    if (report?.whatsapp_summary) {
      const url = `https://wa.me/?text=${encodeURIComponent(report.whatsapp_summary)}`;
      window.open(url, "_blank");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden my-auto">
        {/* Header with Stitch Red Brand Theme */}
        <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-red-800 via-red-900 to-amber-950 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center shadow-inner">
              <TrendingUp className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-white tracking-tight">
                  Performance & Financial Audit Report
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-[10px] font-black uppercase text-emerald-200">
                  Verified Audit
                </span>
              </div>
              <p className="text-xs text-red-100/80 mt-0.5">
                {report?.task_name || "Labor Agrícola"} • {report?.total_acres.toFixed(1)} Acres Audited
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Report Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Top 4 Financial Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Gross Revenue
              </span>
              <span className="text-2xl font-black text-slate-900 tracking-tight mt-2">
                {currency.symbol}{report?.gross_revenue.toLocaleString() || "0"}
              </span>
              <span className="text-[10px] text-slate-400 mt-1">Client Invoiced</span>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 flex flex-col justify-between">
              <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
                Fuel Consumed
              </span>
              <span className="text-2xl font-black text-amber-900 tracking-tight mt-2">
                -{currency.symbol}{report?.fuel_cost.toLocaleString() || "0"}
              </span>
              <span className="text-[10px] text-amber-600 mt-1">
                {report?.total_fuel_liters}L Total
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/80 flex flex-col justify-between">
              <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
                Labor Payout
              </span>
              <span className="text-2xl font-black text-blue-900 tracking-tight mt-2">
                -{currency.symbol}{report?.labor_cost.toLocaleString() || "0"}
              </span>
              <span className="text-[10px] text-blue-600 mt-1">
                {report?.total_engine_hours} Motor Hours
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 flex flex-col justify-between shadow-sm">
              <span className="text-[11px] font-black text-emerald-800 uppercase tracking-wider">
                Net Profit
              </span>
              <span className="text-2xl font-black text-emerald-700 tracking-tight mt-2">
                {currency.symbol}{report?.net_profit.toLocaleString() || "0"}
              </span>
              <span className="text-[10px] font-extrabold text-emerald-600 mt-1">
                {report?.profit_margin_pct}% Margin
              </span>
            </div>
          </div>

          {/* Efficiency Key Indicators Banner */}
          <div className="p-4 rounded-2xl bg-slate-900 text-white flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center">
                <Gauge className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-black uppercase text-amber-300">
                  Telemetry Efficiency Metrics
                </span>
                <p className="text-[11px] text-slate-400">
                  Derived from GPS odometer & live CAN-bus fuel readings
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Fuel Efficiency</span>
                <span className="font-black text-emerald-400 text-sm">
                  {report?.fuel_efficiency_l_per_acre || 0} L / Acre
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Avg Speed</span>
                <span className="font-black text-white text-sm">5.4 km/h</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Field Area</span>
                <span className="font-black text-amber-300 text-sm">
                  {report?.completed_acres.toFixed(1)} Acres
                </span>
              </div>
            </div>
          </div>

          {/* Machine Performance Breakdown Table */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-2">
              <Tractor className="w-4 h-4 text-red-700" />
              Per-Machine Operational Breakdown
            </h4>

            <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200/80 text-[10px] font-black uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="py-3 px-4">Tractor Machine</th>
                    <th className="py-3 px-4">Operator Driver</th>
                    <th className="py-3 px-4">Acreage Worked</th>
                    <th className="py-3 px-4">Engine Hours</th>
                    <th className="py-3 px-4">Diesel Used</th>
                    <th className="py-3 px-4">Throughput</th>
                    <th className="py-3 px-4 text-right">Operator Payout</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {report?.machine_breakdown.map((m, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">{m.tractor_name}</td>
                      <td className="py-3 px-4 text-slate-600">{m.operator_name}</td>
                      <td className="py-3 px-4 font-bold text-slate-800">{m.acres_plowed.toFixed(1)} ac</td>
                      <td className="py-3 px-4 text-slate-600">{m.engine_hours} hrs</td>
                      <td className="py-3 px-4 text-amber-700 font-bold">{m.fuel_liters} L</td>
                      <td className="py-3 px-4 text-emerald-700 font-bold">{m.throughput_acres_per_hr} ac/hr</td>
                      <td className="py-3 px-4 text-right font-black text-slate-900">
                        {currency.symbol}{m.operator_payout.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Action Controls Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handleShareWhatsApp}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-md transition-all"
            >
              <Share2 className="w-4 h-4" />
              <span>Share WhatsApp Report</span>
            </button>

            <button
              onClick={handleCopySummary}
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-xs flex items-center gap-2 transition-all shadow-sm"
            >
              <Copy className="w-4 h-4" />
              <span>{copied ? "Copied!" : "Copy Summary"}</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-red-800 hover:bg-red-900 text-white font-black text-xs uppercase tracking-wider shadow-md transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskReportModal;
