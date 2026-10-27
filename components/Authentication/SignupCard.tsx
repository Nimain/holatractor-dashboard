"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import OperatorRegister from "./OperatorRegister";
import OwnerRegister from "./OwnerRegister";
import DealerRegister from "./DealerRegister";
import Link from "next/link";
import {
  Tractor,
  Store,
  UserCheck,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";

interface SignupCardProps {
  name: string;
}

const SignupCard = ({ name }: SignupCardProps) => {
  const [open, setOpen] = useState(false);

  // Extract first name for friendly personalized greeting
  const firstName = name.trim().split(/\s+/)[0] || name.trim() || "Partner";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          name="Name_next_button"
          className="p-[10px] w-[30%] flex items-center justify-center gap-1.5 bg-[#AB0F0C] hover:bg-[#8F0C09] text-white font-semibold transition-all duration-300 rounded-r-full shadow-md"
          onClick={() => setOpen(true)}
        >
          <span>Next</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </DialogTrigger>

      <DialogContent
        className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl p-0 max-w-[640px] w-[94vw] overflow-hidden sm:max-w-[640px]"
        style={{ scrollbarWidth: "none" }}
      >
        {/* Top Accent Gradient Bar */}
        <div className="h-2 w-full bg-gradient-to-r from-red-600 via-amber-500 to-emerald-600" />

        <div className="p-6 md:p-8 flex flex-col gap-6 max-h-[88vh] overflow-y-auto">
          {/* Header */}
          <DialogHeader className="text-left space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-[#AB0F0C] text-xs font-bold uppercase tracking-wider border border-red-100/80 w-fit">
              <Sparkles className="w-3.5 h-3.5" />
              <span>HolaTractor Ecosystem</span>
            </div>

            <DialogTitle className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              Welcome, <span className="text-[#AB0F0C]">{firstName}</span>!
            </DialogTitle>

            <DialogDescription className="text-sm md:text-base text-slate-600 leading-relaxed">
              Select how you will be using HolaTractor. We will customize your workspace, telemetry tools, and dashboards based on your role.
            </DialogDescription>
          </DialogHeader>

          {/* Role Cards List */}
          <div className="flex flex-col gap-3.5">
            {/* 1. Tractor Fleet Owner */}
            <OwnerRegister
              name={name}
              inPage={false}
              trigger={
                <button
                  type="button"
                  className="group relative w-full p-4 md:p-5 rounded-2xl border-2 border-slate-200/80 hover:border-emerald-500 bg-white hover:bg-emerald-50/30 transition-all duration-300 shadow-sm hover:shadow-md text-left flex items-start gap-4 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-300">
                    <Tractor className="w-6 h-6" />
                  </div>

                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h4 className="text-base md:text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                        Tractor Fleet Owner
                      </h4>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                        Popular
                      </span>
                    </div>
                    <p className="text-xs md:text-sm text-slate-500 leading-snug">
                      Manage tractor fleet, track machinery with IoT GPS, dispatch field operations, and monitor earnings.
                    </p>
                  </div>

                  <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-emerald-500 group-hover:text-white text-slate-400 flex items-center justify-center shrink-0 mt-1 transition-all duration-300">
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>
              }
            />

            {/* 2. Machinery Dealer & Workshop */}
            <DealerRegister
              name={name}
              inPage={false}
              trigger={
                <button
                  type="button"
                  className="group relative w-full p-4 md:p-5 rounded-2xl border-2 border-slate-200/80 hover:border-blue-500 bg-white hover:bg-blue-50/30 transition-all duration-300 shadow-sm hover:shadow-md text-left flex items-start gap-4 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform duration-300">
                    <Store className="w-6 h-6" />
                  </div>

                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h4 className="text-base md:text-lg font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                        Dealer & Workshop
                      </h4>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800">
                        Sales & Service
                      </span>
                    </div>
                    <p className="text-xs md:text-sm text-slate-500 leading-snug">
                      Sell agricultural machinery, manage spare parts inventory, and offer certified mechanic repairs.
                    </p>
                  </div>

                  <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-blue-600 group-hover:text-white text-slate-400 flex items-center justify-center shrink-0 mt-1 transition-all duration-300">
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>
              }
            />

            {/* 3. Certified Operator */}
            <OperatorRegister
              nameOfOperator={name}
              inPage={false}
              trigger={
                <button
                  type="button"
                  className="group relative w-full p-4 md:p-5 rounded-2xl border-2 border-slate-200/80 hover:border-amber-500 bg-white hover:bg-amber-50/30 transition-all duration-300 shadow-sm hover:shadow-md text-left flex items-start gap-4 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform duration-300">
                    <UserCheck className="w-6 h-6" />
                  </div>

                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h4 className="text-base md:text-lg font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                        Tractor Operator
                      </h4>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800">
                        Field Tasks
                      </span>
                    </div>
                    <p className="text-xs md:text-sm text-slate-500 leading-snug">
                      Receive agricultural work jobs, execute field operations with route navigation, and earn daily payouts.
                    </p>
                  </div>

                  <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-amber-500 group-hover:text-white text-slate-400 flex items-center justify-center shrink-0 mt-1 transition-all duration-300">
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>
              }
            />
          </div>

          {/* Footer Info */}
          <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-1.5 text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Safe & Secure 256-bit SSL encryption</span>
            </div>

            <div className="text-slate-600">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-[#AB0F0C] hover:text-[#8F0C09] font-bold hover:underline transition-colors"
                onClick={() => setOpen(false)}
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SignupCard;