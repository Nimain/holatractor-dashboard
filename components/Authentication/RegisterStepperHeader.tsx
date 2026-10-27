"use client";

import React from "react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check } from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { authTranslations, AuthLanguage } from "@/utils/translation/authTranslations";

export interface StepItem {
  id: string; // e.g. "stepone", "steptwo"
  number: number;
  label: string;
  isComplete: boolean;
  icon?: React.ReactNode;
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
  const currentLang = (useSelector(
    (state: RootState) => state.ActiveLanguage.language
  ) || "en") as AuthLanguage;

  const t = authTranslations[currentLang] || authTranslations.en;

  const badgeColors = {
    red: "bg-red-50 text-[#AB0F0C] border-red-100",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
  }[themeColor];

  const activeBg = {
    red: "data-[state=active]:bg-[#AB0F0C]",
    emerald: "data-[state=active]:bg-emerald-600",
    blue: "data-[state=active]:bg-blue-600",
    amber: "data-[state=active]:bg-amber-600",
  }[themeColor];

  return (
    <div className="w-full flex flex-col gap-2 pb-3 border-b border-slate-100 bg-white sticky top-0 z-20">
      {/* Top Meta Header - pr-12 guarantees full clearance for the absolute close (X) button */}
      <div className="flex items-center justify-between gap-2 px-0.5 pr-12">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-xs">
            {roleIcon}
          </div>
          <div className="leading-tight min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-slate-900 truncate">
                {roleTitle}
              </h3>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0 ${badgeColors}`}>
                {roleBadge}
              </span>
            </div>
            {applicantName && (
              <p className="text-[11px] text-slate-500 font-medium mt-0.5 truncate">
                {t.applicantLabel}: <span className="text-slate-800 font-semibold">{applicantName}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Slim Modern Stepper Track */}
      <TabsList className="w-full bg-slate-100/80 p-1 rounded-xl flex items-center justify-between gap-1 h-auto border border-slate-200/60 mt-1">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;

          return (
            <React.Fragment key={step.id}>
              <TabsTrigger
                value={step.id}
                className={`flex-1 group flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg transition-all duration-150 text-slate-600 data-[state=active]:text-white ${activeBg} data-[state=active]:shadow-xs text-xs font-semibold cursor-pointer`}
              >
                {/* Step Circle / Check */}
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0 transition-colors ${
                    step.isComplete
                      ? "bg-emerald-500 text-white group-data-[state=active]:bg-white group-data-[state=active]:text-emerald-700 shadow-xs"
                      : "bg-white text-slate-600 border border-slate-200 group-data-[state=active]:bg-white/20 group-data-[state=active]:text-white group-data-[state=active]:border-transparent"
                  }`}
                >
                  {step.isComplete ? (
                    <Check className="w-3 h-3 stroke-[3]" />
                  ) : (
                    <span>{step.number}</span>
                  )}
                </div>

                {/* Step Text */}
                <span className="text-[11px] sm:text-xs font-semibold truncate leading-none">
                  {step.label}
                </span>
              </TabsTrigger>

              {/* Connecting Mini Separator */}
              {!isLast && (
                <div className="hidden sm:block w-2 h-px bg-slate-300/80 shrink-0 mx-0.5" />
              )}
            </React.Fragment>
          );
        })}
      </TabsList>
    </div>
  );
};

export default RegisterStepperHeader;
