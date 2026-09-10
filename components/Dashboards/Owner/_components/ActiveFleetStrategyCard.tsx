"use client";

import React, { useState, useEffect } from "react";
import { Zap, Sparkles, TrendingUp, ChevronRight, Tractor } from "lucide-react";
import { Button } from "@/components/ui/button";
import FleetTelemetryService from "@/utils/FleetTelemetryService";
import { renderInstance, FastApiBaseURL } from "@/utils/Axios/RenderInstance";
import {
  CurrencyConfig,
  detectUserCurrency,
  getLiveCurrencyRates,
} from "@/utils/currency/currencyService";

interface ActiveFleetStrategyCardProps {
  onAdjustStrategy?: () => void;
  tractorCountOverride?: number;
  tractors?: any[];
  userId?: string;
  user?: any;
}

export const ActiveFleetStrategyCard: React.FC<ActiveFleetStrategyCardProps> = ({
  onAdjustStrategy,
  tractorCountOverride,
  tractors,
  userId,
  user,
}) => {
  const initialCount = tractorCountOverride ?? (tractors?.length ? tractors.length : 2);
  const [loading, setLoading] = useState<boolean>(false);
  const [tractorCount, setTractorCount] = useState<number>(initialCount);
  const [currency, setCurrency] = useState<CurrencyConfig>(() => detectUserCurrency(user));
  const [strategyData, setStrategyData] = useState<{
    projected_net_monthly: number;
    roi_growth_pct: number;
    dynamic_rate_pct: string;
    active_season: string;
    season_label: string;
    currency: string;
  }>({
    projected_net_monthly: Math.round(initialCount * 1980),
    roi_growth_pct: 164.4,
    dynamic_rate_pct: "+18%",
    active_season: "sowing",
    season_label: "Sowing 1.35x",
    currency: "USD",
  });

  useEffect(() => {
    let isMounted = true;
    const fetchStrategy = async () => {
      try {
        setLoading(true);
        let count = tractorCountOverride ?? (tractors?.length ? tractors.length : 0);
        if (count <= 0) {
          const fleet = await FleetTelemetryService.getFleetOverview(userId, tractors);
          if (fleet && fleet.total_tractors > 0) {
            count = fleet.total_tractors;
          }
        }
        count = Math.max(1, count);
        if (isMounted) setTractorCount(count);

        const queryParams = new URLSearchParams();
        queryParams.append("tractor_count", String(count));
        if (userId) queryParams.append("user_id", userId);

        const res = await renderInstance
          .get(`${FastApiBaseURL}/optimizer/fleet-strategy?${queryParams.toString()}`)
          .catch(() => null);

        if (res?.data && res.data.success && isMounted) {
          setStrategyData({
            projected_net_monthly: Math.round(res.data.projected_net_monthly || count * 1980),
            roi_growth_pct: Number(res.data.roi_growth_pct || 164.4),
            dynamic_rate_pct: res.data.dynamic_rate_pct || "+18%",
            active_season: res.data.active_season || "sowing",
            season_label: res.data.season_label || "Sowing 1.35x",
            currency: res.data.currency || "USD",
          });
        } else if (isMounted) {
          setStrategyData({
            projected_net_monthly: Math.round(count * 1980),
            roi_growth_pct: 164.4,
            dynamic_rate_pct: "+18%",
            active_season: "sowing",
            season_label: "Sowing 1.35x",
            currency: "USD",
          });
        }
      } catch (err) {
        // Safe fallback values retained
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchStrategy();
    return () => {
      isMounted = false;
    };
  }, [tractorCountOverride, tractors, userId]);

  const seasonLabel = strategyData.season_label ||
    (strategyData.active_season === "harvest"
      ? "Harvest 1.45x"
      : strategyData.active_season === "off_peak"
      ? "Off-Peak 0.85x"
      : "Sowing 1.35x");

  useEffect(() => {
    const detected = detectUserCurrency(user);
    setCurrency(detected);
    getLiveCurrencyRates().then((rates) => {
      if (rates[detected.code]) {
        setCurrency(rates[detected.code]);
      }
    });
  }, [user]);

  const convertedMonthlyNet = Math.round(
    strategyData.projected_net_monthly * (strategyData.currency === currency.code ? 1.0 : (currency.rate || 1.0))
  );

  return (
    <div className="w-full bg-gradient-to-r from-red-950 via-red-900 to-amber-950 rounded-2xl p-6 text-white border border-red-800/40 shadow-xl relative overflow-hidden transition-all hover:shadow-2xl">
      {/* Subtle Background Glow */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-64 h-64 bg-red-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        {/* Left Info Section */}
        <div className="space-y-3">
          {/* Badges Row */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold tracking-wide">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              LIVE
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 text-white border border-white/20 rounded-full text-xs font-semibold backdrop-blur-sm">
              <Tractor className="w-3.5 h-3.5 text-amber-300" />
              <span>{tractorCount} Tractors</span>
            </div>

            <div className="inline-flex items-center gap-1 px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-xs font-semibold">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>{strategyData.dynamic_rate_pct}</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 text-white/90 border border-white/20 rounded-full text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{seasonLabel}</span>
            </div>

            <div className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-extrabold tracking-wide">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+{strategyData.roi_growth_pct}% ROI</span>
            </div>

            <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/10 text-white/90 border border-white/20 rounded-full text-[11px] font-bold">
              <span>{currency.flag} {currency.code} ({currency.symbol})</span>
            </div>
          </div>

          {/* Title & Estimated Profit */}
          <div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <h3 className="text-xl font-bold tracking-tight text-white">Active Fleet Strategy</h3>
            </div>
            <p className="text-sm text-red-200/80 mt-1">
              Autonomous AI model optimizing pricing, multi-machine routing, and diesel efficiency in {currency.regionName}.
            </p>
          </div>

          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-xs text-red-200 uppercase tracking-wider font-semibold">
              Estimated Net Profit:
            </span>
            <span className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              {currency.symbol}{convertedMonthlyNet.toLocaleString()}
            </span>
            <span className="text-xs text-red-300 font-medium">/month</span>
          </div>
        </div>

        {/* Right CTA Button */}
        <div className="flex items-center">
          <Button
            onClick={onAdjustStrategy}
            className="w-full sm:w-auto bg-white hover:bg-slate-100 text-red-900 font-bold px-6 py-3 rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-2 transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Adjust Strategy</span>
            <ChevronRight className="w-4 h-4 text-red-800" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ActiveFleetStrategyCard;
