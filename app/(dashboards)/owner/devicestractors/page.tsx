"use client";

import { useState } from "react";
import { DeviceList } from "@/components/Dashboards/Owner/devices/DeviceList";
import MechanicsDashboard from "@/components/Dashboards/Owner/mechanics/MechanicsDashboard";
import { Cpu, Wrench } from "lucide-react";

export default function DevicesAndMechanicsPage() {
  const [activeTab, setActiveTab] = useState<"mechanics" | "devices">("mechanics");

  return (
    <div className="w-full py-4 mb-4 space-y-6">
      {/* Top Tab Bar */}
      <div className="flex gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab("mechanics")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all ${
            activeTab === "mechanics"
              ? "bg-[#800000] text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Wrench className="w-4 h-4" /> Mechanics & Repairs
        </button>
        <button
          onClick={() => setActiveTab("devices")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all ${
            activeTab === "devices"
              ? "bg-[#800000] text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Cpu className="w-4 h-4" /> Devices Telemetry
        </button>
      </div>

      {/* Active Tab View */}
      {activeTab === "mechanics" ? <MechanicsDashboard /> : <DeviceList />}
    </div>
  );
}
