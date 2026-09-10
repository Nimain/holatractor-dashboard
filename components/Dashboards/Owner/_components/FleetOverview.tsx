"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  TrendingUp,
  ArrowRight,
  Activity,
  Fuel,
  Gauge,
  Sparkles,
  Tractor,
  Radio,
  Plus,
  TabletSmartphone,
  CheckCircle2,
  AlertCircle,
  Clock,
  Leaf,
} from "lucide-react";
import FleetTelemetryService, { type FleetOverviewData, type TractorEfficiency } from "@/utils/FleetTelemetryService";
import { getAuthUserId } from "@/utils/auth/clientAuth";

interface FleetOverviewProps {
  ownerId?: string;
  tractors?: any[];
  stores?: any[];
  devices?: any[];
  bookings?: any[];
  onViewAll?: () => void;
}

export const FleetOverview: React.FC<FleetOverviewProps> = ({
  ownerId,
  tractors,
  stores,
  devices,
  bookings,
  onViewAll,
}) => {
  const [fleetData, setFleetData] = useState<FleetOverviewData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const fetchFleet = async () => {
      try {
        const data = await FleetTelemetryService.getFleetOverview(
          ownerId || getAuthUserId(),
          tractors,
          stores,
          devices,
          bookings
        );
        if (isMounted && data) {
          setFleetData(data);
        }
      } catch (err) {
        console.warn("Failed to fetch fleet overview in web dashboard:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchFleet();
    const interval = setInterval(fetchFleet, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [ownerId, tractors, stores, devices, bookings]);

  const totalTractors = fleetData?.total_tractors ?? 0;
  const onlineCount = fleetData?.online_tractors ?? 0;
  const idleCount = fleetData?.idle_tractors ?? 0;
  const fuelVal = Number(fleetData?.total_fuel_usage_litres ?? 0);
  const fuelDisplay = `${fuelVal.toLocaleString()}L`;

  const co2Tons = Number(fleetData?.total_co2_emissions_tons ?? 0);
  const co2Display = `${co2Tons.toFixed(2)} Tons`;

  const indAvgDisplay =
    fuelVal === 0
      ? "0.00T"
      : fleetData?.industrial_avg_co2_tons != null
      ? `${fleetData.industrial_avg_co2_tons.toFixed(2)}T`
      : `${(co2Tons * 1.15).toFixed(2)}T`;

  const savingsKg = fleetData?.co2_savings_kg ?? Math.max(0, Math.round((co2Tons * 0.15) * 1000));

  const effPct =
    totalTractors === 0 || fuelVal === 0
      ? 0
      : Math.min(100, Math.max(0, Number(fleetData?.avg_fleet_efficiency_pct ?? 0)));

  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * effPct) / 100;

  const trendVal = fleetData?.fuel_trend_pct ?? 0;
  const trendText =
    trendVal === 0 ? "Steady" : `${trendVal > 0 ? "+" : ""}${trendVal}%`;

  // Dynamic 7-Day Sparkline
  const fuelHistory =
    Array.isArray(fleetData?.weekly_fuel_history) && fleetData.weekly_fuel_history.length > 0
      ? fleetData.weekly_fuel_history
      : [0, 0, 0, 0, 0, 0, 0];

  const minVal = Math.min(...fuelHistory);
  const maxVal = Math.max(...fuelHistory);
  const range = maxVal - minVal > 0 ? maxVal - minVal : 1;

  const sparkPoints = fuelHistory.map((val, idx) => {
    const x = Math.round((idx / Math.max(fuelHistory.length - 1, 1)) * 140);
    const y = Math.round(42 - ((val - minVal) / range) * 32);
    return { x, y, val };
  });

  const sparkLinePath = sparkPoints.reduce(
    (acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`),
    ""
  );
  const sparkAreaPath = `${sparkLinePath} L 140 50 L 0 50 Z`;

  const dayLabels = fleetData?.weekly_day_labels || ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const tractorList = fleetData?.tractors || [];

  return (
    <div className="w-full space-y-6">
      {/* Title Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-700 flex items-center justify-center shadow-xs">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Fleet Overview</h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-100 text-red-800 border border-red-200">
                {totalTractors} {totalTractors === 1 ? "Tractor" : "Tractors"}
              </span>
            </div>
            <p className="text-xs text-slate-500">Live fuel telematics, carbon footprint & machine health</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {totalTractors > 0 && (
            <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <Radio className="w-3 h-3 text-emerald-600 animate-pulse" />
              <span>{onlineCount} Active Telematics</span>
            </span>
          )}

          {onViewAll ? (
            <button
              onClick={onViewAll}
              className="text-xs font-bold text-red-700 hover:text-red-800 flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-red-50 transition-colors group"
            >
              <span>View All Telematics</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>
          ) : (
            <Link
              href="/owner/devicestractors"
              className="text-xs font-bold text-red-700 hover:text-red-800 flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-red-50 transition-colors group"
            >
              <span>View All Telematics</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          )}
        </div>
      </div>

      {/* Dynamic State Rendering */}
      {totalTractors === 0 ? (
        /* Zero Tractor Clean Interactive State */
        <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center mx-auto shadow-xs">
            <Tractor className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h4 className="text-lg font-black text-slate-900">No Tractors Registered in Fleet</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              You haven&apos;t added any tractor inventory to your stores or paired onboard GPS devices yet. Add a tractor to start streaming live fuel telemetry, CO2 calculations, and engine diagnostics.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/owner/stores"
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-red-700 hover:bg-red-600 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Tractor to Store</span>
            </Link>
            <Link
              href="/owner/devicestractors"
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all"
            >
              <TabletSmartphone className="w-4 h-4 text-slate-500" />
              <span>Connect GPS Device</span>
            </Link>
          </div>

          {/* Zero Metrics Row Preview */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-100 max-w-lg mx-auto text-center">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Fuel</p>
              <p className="text-base font-black text-slate-700">0.0 L</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">CO2 Emissions</p>
              <p className="text-base font-black text-slate-700">0.00 Tons</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Efficiency</p>
              <p className="text-base font-black text-slate-700">0%</p>
            </div>
          </div>
        </div>
      ) : (
        /* Dynamic 3-Card Executive KPI Grid */
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Total Fuel Usage & Dynamic 7-Day Sparkline */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-black tracking-wider uppercase text-slate-500 flex items-center gap-1.5">
                    <Fuel className="w-4 h-4 text-orange-600" />
                    Total Fuel Usage
                  </span>
                  <span
                    className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${
                      trendVal <= 0
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}
                  >
                    {trendText} vs prev days
                  </span>
                </div>

                <div className="flex items-baseline justify-between mt-2">
                  <span className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
                    {loading && !fleetData ? "..." : fuelDisplay}
                  </span>
                  <span className="text-xs font-bold text-slate-400">
                    across {totalTractors} {totalTractors === 1 ? "tractor" : "tractors"}
                  </span>
                </div>
              </div>

              {/* Sparkline Canvas with Day Labels */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">7-Day Dynamic Consumption</span>
                  <span className="text-[11px] font-bold text-orange-600">
                    ~{fleetData?.avg_fuel_burn_rate_l_hr || (fuelVal / Math.max(1, totalTractors * 8.5)).toFixed(1)} L/hr avg
                  </span>
                </div>

                <svg width="100%" height="52" viewBox="0 0 140 50" preserveAspectRatio="none" className="overflow-visible">
                  <defs>
                    <linearGradient id="webFuelGradientDynamic" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#EA580C" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#EA580C" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <path d={sparkAreaPath} fill="url(#webFuelGradientDynamic)" />
                  <path
                    d={sparkLinePath}
                    fill="none"
                    stroke="#EA580C"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {sparkPoints.map((p, idx) => (
                    <circle key={idx} cx={p.x} cy={p.y} r="2.5" fill="#EA580C" className="hover:scale-150 transition-transform" />
                  ))}
                </svg>

                <div className="flex justify-between text-[9px] font-bold text-slate-400 px-0.5">
                  {dayLabels.map((lbl, idx) => (
                    <span key={idx}>{lbl}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Card 2: CO2 Emissions & Environmental Savings */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4">
              <div>
                <div className="flex justify-between items-start">
                  <span className="text-xs font-black tracking-wider uppercase text-slate-500 flex items-center gap-1.5">
                    <Gauge className="w-4 h-4 text-emerald-600" />
                    CO2 Emissions
                  </span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Leaf className="w-3 h-3 text-emerald-600" />
                    EPA Diesel 2.68 kg/L
                  </span>
                </div>

                <div className="mt-2">
                  <h4 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
                    {loading && !fleetData ? "..." : co2Display}
                  </h4>
                  <p className="text-xs font-bold text-orange-600 mt-1">
                    Industrial Benchmark: {indAvgDisplay}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">Environmental Savings</span>
                  <span className="text-xs font-black text-emerald-600">
                    -{savingsKg} kg CO2 Saved
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                    style={{ width: `${Math.min(100, Math.max(15, (savingsKg / Math.max(savingsKg + co2Tons * 1000, 1)) * 100))}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Optimization Tag</span>
                  <span className="font-bold text-slate-700">{fleetData?.route_optimization_tag}</span>
                </div>
              </div>
            </div>

            {/* Card 3: Fleet Engine Efficiency Gauge */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-black tracking-wider uppercase text-slate-500 flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-red-600" />
                    Fleet Engine Health
                  </span>
                  <h4 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight mt-2">
                    {Math.round(effPct)}%
                  </h4>
                  <p className="text-xs font-bold text-slate-500 mt-1">
                    {effPct >= 88
                      ? "Optimal Fleet Performance"
                      : effPct >= 78
                      ? "Moderate Load Ratio"
                      : "Inspection Recommended"}
                  </p>
                </div>

                {/* Circular Efficiency Gauge */}
                <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
                  <svg width="76" height="76" viewBox="0 0 76 76" className="rotate-[-90deg]">
                    <circle
                      cx="38"
                      cy="38"
                      r={radius}
                      fill="transparent"
                      stroke="#F1F5F9"
                      strokeWidth="6"
                    />
                    <circle
                      cx="38"
                      cy="38"
                      r={radius}
                      fill="transparent"
                      stroke={effPct >= 85 ? "#10B981" : effPct >= 75 ? "#F59E0B" : "#EF4444"}
                      strokeWidth="6"
                      strokeDasharray={`${circumference} ${circumference}`}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-sm font-black text-slate-800">{Math.round(effPct)}%</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Onboard Telematics</span>
                  <span className="font-black text-slate-800">
                    {onlineCount} of {totalTractors} Active
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-red-600 to-amber-500 rounded-full transition-all duration-700"
                    style={{ width: `${Math.round((onlineCount / Math.max(totalTractors, 1)) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Engine Efficiency By Tractor (Full Width Table / Cards) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <span>Engine Efficiency by Tractor</span>
                  <span className="text-xs font-bold text-slate-400">({totalTractors} machines)</span>
                </h4>
                <p className="text-xs text-slate-400">Live operational load, fuel burn, and engine diagnostics per machine</p>
              </div>
              <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full w-fit">
                Dynamic Telemetry Stream
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tractorList.map((tractor, index) => {
                const pct = Number(tractor.engine_efficiency_pct || 90);
                const isOnline = tractor.telemetry_status === "online";
                const fuelL = tractor.total_fuel_litres || Math.round(fuelVal / totalTractors);

                return (
                  <div
                    key={tractor.tractor_id || index}
                    className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 hover:bg-white hover:shadow-xs transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-red-700 flex items-center justify-center shrink-0 shadow-2xs">
                          <Tractor className="w-4 h-4" />
                        </div>
                        <div>
                          <h5 className="text-sm font-bold text-slate-900 truncate max-w-[200px]">
                            {tractor.name || `Tractor Unit ${index + 1}`}
                          </h5>
                          <p className="text-[11px] text-slate-500 truncate max-w-[200px]">
                            {tractor.store_name || "Central Store"} • {tractor.model || "Standard"}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            isOnline
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : "bg-slate-100 text-slate-600 border border-slate-200"
                          }`}
                        >
                          {isOnline && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />}
                          {isOnline ? "Online" : "Standby"}
                        </span>
                        <p className="text-xs font-black text-slate-900 mt-1">{pct.toFixed(1)}%</p>
                      </div>
                    </div>

                    {/* Efficiency Progress Bar */}
                    <div className="space-y-1">
                      <div className="w-full bg-slate-200/80 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            pct >= 85
                              ? "bg-emerald-500"
                              : pct >= 75
                              ? "bg-amber-500"
                              : "bg-rose-500"
                          }`}
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                        <span>Burn: ~{fuelL}L consumed</span>
                        <span>{pct >= 85 ? "Optimal Load" : pct >= 75 ? "Moderate" : "Check Diagnostics"}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FleetOverview;
