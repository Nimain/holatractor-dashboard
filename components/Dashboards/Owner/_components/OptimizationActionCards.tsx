"use client";

import React from "react";
import { TrendingUp, Route, ArrowRight, Sparkles, Layers } from "lucide-react";

interface OptimizationActionCardsProps {
  onPricingSimulatorPress?: () => void;
  onRouteChainPress?: () => void;
}

export const OptimizationActionCards: React.FC<OptimizationActionCardsProps> = ({
  onPricingSimulatorPress,
  onRouteChainPress,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
      {/* Option 1: Pricing Simulator */}
      <div
        onClick={onPricingSimulatorPress}
        className="group relative bg-white rounded-2xl p-6 border border-orange-200 shadow-sm hover:shadow-xl hover:border-orange-400 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-between"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-full -z-0 group-hover:scale-110 transition-transform" />

        <div className="relative z-10">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-xl bg-orange-600 text-white flex items-center justify-center shadow-md shadow-orange-600/30 group-hover:scale-105 transition-transform">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 font-bold text-xs rounded-full border border-orange-200">
              <Sparkles className="w-3 h-3 text-orange-600" />
              AI ROI
            </div>
          </div>

          <h4 className="text-xl font-extrabold text-slate-900 group-hover:text-orange-600 transition-colors">
            Pricing Simulator
          </h4>
          <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
            Forecast dynamic rates and maximize fleet revenue with TractorAI demand surge models.
          </p>
        </div>

        <div className="relative z-10 mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-sm font-bold text-orange-600 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1.5">
            Simulate Strategy <ArrowRight className="w-4 h-4" />
          </span>
          <span className="text-xs text-slate-400 font-medium">Interactive ROI</span>
        </div>
      </div>

      {/* Option 2: Route Chain Optimization */}
      <div
        onClick={onRouteChainPress}
        className="group relative bg-white rounded-2xl p-6 border border-red-200 shadow-sm hover:shadow-xl hover:border-red-400 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-between"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-bl-full -z-0 group-hover:scale-110 transition-transform" />

        <div className="relative z-10">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-xl bg-red-700 text-white flex items-center justify-center shadow-md shadow-red-700/30 group-hover:scale-105 transition-transform">
              <Route className="w-6 h-6" />
            </div>
            <div className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 font-bold text-xs rounded-full border border-red-200">
              <Layers className="w-3 h-3 text-red-600" />
              Multi-Farm Cluster
            </div>
          </div>

          <h4 className="text-xl font-extrabold text-slate-900 group-hover:text-red-700 transition-colors">
            Route Chaining
          </h4>
          <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
            Cluster neighbor farm bookings and eliminate deadhead miles to save up to 64% transit fuel.
          </p>
        </div>

        <div className="relative z-10 mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-sm font-bold text-red-700 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1.5">
            Optimize Route <ArrowRight className="w-4 h-4" />
          </span>
          <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
            Save 64% Diesel
          </span>
        </div>
      </div>
    </div>
  );
};

export default OptimizationActionCards;
