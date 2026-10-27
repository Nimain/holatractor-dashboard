"use client";

import React from "react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check } from "lucide-react";

export interface StepItem {
  id: string; // e.g. "stepone", "steptwo"
  number: number;
  label: string;
  sublabel?: string;
  isComplete: boolean;
  icon: React.ReactNode;
}

interface RegisterStepperHeaderProps {
  roleTitle: string;
  roleBadge: string;
  roleIcon: React.ReactNode;
  applicantName: string;
  steps: StepItem[];
  themeColor?: "red" | "emerald" | "blue" | "amber";
}

export const RegisterStepperHeader: React.FC<RegisterStepperHeaderProps> = ({
  roleTitle,
  roleBadge,
  roleIcon,
  applicantName,
  steps,
  themeColor = "red",
}) => {
  const badgeColors = {
    red: "bg-red-50 text-[#AB0F0C] border-red-100",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
  }[themeColor];

  const activeRingColor = {
    red: "data-[state=active]:ring-red-200 data-[state=active]:bg-[#AB0F0C]",
    emerald: "data-[state=active]:ring-emerald-200 data-[state=active]:bg-emerald-600",
    blue: "data-[state=active]:ring-blue-200 data-[state=active]:bg-blue-600",
    amber: "data-[state=active]:ring-amber-200 data-[state=active]:bg-amber-600",
  }[themeColor];

  return (
    <div className="w-full flex flex-col gap-4 pb-4 border-b border-slate-100 bg-white sticky top-0 z-20">
      {/* Top Meta Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-sm">
            {roleIcon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                {roleTitle}
              </h3>
              <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${badgeColors}`}>
                {roleBadge}
              </span>
            </div>
            {applicantName && (
              <p className="text-xs text-slate-500 font-medium">
                Applicant: <span className="text-slate-800 font-semibold">{applicantName}</span>
              </p>
            )}
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400">
          <span>Click any step to navigate</span>
        </div>
      </div>

      {/* Modern Stepper Tabs */}
      <TabsList className="w-full bg-slate-50/80 p-2 rounded-2xl flex items-center justify-between gap-1 md:gap-2 h-auto border border-slate-200/70 overflow-x-auto">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;

          return (
            <React.Fragment key={step.id}>
              <TabsTrigger
                value={step.id}
                className={`group flex items-center gap-2.5 py-2 px-3 md:px-4 rounded-xl transition-all duration-200 text-slate-600 data-[state=active]:text-white ${activeRingColor} data-[state=active]:shadow-md data-[state=active]:ring-4 shrink-0 hover:text-slate-900 cursor-pointer`}
              >
                {/* Step Circle / Check */}
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-all duration-200 shrink-0 ${
                    step.isComplete
                      ? "bg-emerald-500 text-white group-data-[state=active]:bg-white group-data-[state=active]:text-emerald-700 shadow-sm"
                      : "bg-white text-slate-700 border border-slate-200 group-data-[state=active]:bg-white/20 group-data-[state=active]:text-white group-data-[state=active]:border-transparent"
                  }`}
                >
                  {step.isComplete ? (
                    <Check className="w-4 h-4 stroke-[3]" />
                  ) : (
                    <span>{step.number}</span>
                  )}
                </div>

                {/* Step Text */}
                <div className="text-left hidden md:block">
                  <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70 leading-none mb-0.5">
                    Step {step.number}
                  </p>
                  <p className="text-xs font-bold leading-none whitespace-nowrap">
                    {step.label}
                  </p>
                </div>
              </TabsTrigger>

              {/* Connecting Divider */}
              {!isLast && (
                <div className="flex-1 h-0.5 min-w-3 md:min-w-6 bg-slate-200 rounded-full mx-1 shrink" />
              )}
            </React.Fragment>
          );
        })}
      </TabsList>
    </div>
  );
};

export default RegisterStepperHeader;
