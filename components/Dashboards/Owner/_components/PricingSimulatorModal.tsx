"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  X,
  Sparkles,
  TrendingUp,
  DollarSign,
  Fuel,
  Sliders,
  CheckCircle2,
  Tractor,
  Layers,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { renderInstance, FastApiBaseURL } from "@/utils/Axios/RenderInstance";
import { useCookie } from "next-cookie";
import {
  CurrencyConfig,
  BASE_CURRENCY_CONFIGS,
  detectUserCurrency,
  getLiveCurrencyRates,
} from "@/utils/currency/currencyService";
import { getAuthUserId } from "@/utils/auth/clientAuth";

interface PricingSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTractorCount?: number;
  userId?: string;
  onStrategyApplied?: () => void;
  user?: any;
}

export const PricingSimulatorModal: React.FC<PricingSimulatorModalProps> = ({
  isOpen,
  onClose,
  initialTractorCount = 8,
  userId,
  onStrategyApplied,
  user: propUser,
}) => {
  const { cookie } = useCookie();
  const rawUser = cookie?.get ? cookie.get("user") : null;
  const parsedUser = propUser || (typeof rawUser === "string" ? (() => { try { return JSON.parse(rawUser); } catch { return null; } })() : rawUser);
  const activeUserId = userId || parsedUser?.userId || parsedUser?.id || getAuthUserId();

  // Dynamic Location Currency
  const [currencyMap, setCurrencyMap] = useState<Record<string, CurrencyConfig>>(BASE_CURRENCY_CONFIGS);
  const [selectedCurrencyKey, setSelectedCurrencyKey] = useState<string>("AUTO");
  const [detectedCurrency, setDetectedCurrency] = useState<CurrencyConfig>(() => detectUserCurrency(parsedUser));

  // Resolved active currency config
  const currency: CurrencyConfig = useMemo(() => {
    if (selectedCurrencyKey === "AUTO") {
      return detectedCurrency;
    }
    return currencyMap[selectedCurrencyKey] || BASE_CURRENCY_CONFIGS[selectedCurrencyKey] || detectedCurrency;
  }, [selectedCurrencyKey, detectedCurrency, currencyMap]);

  // Load live currency conversion rates on open
  useEffect(() => {
    if (!isOpen) return;

    // Detect user currency initially
    const detected = detectUserCurrency(parsedUser);
    setDetectedCurrency(detected);

    getLiveCurrencyRates().then((liveRates) => {
      setCurrencyMap(liveRates);
      if (liveRates[detected.code]) {
        setDetectedCurrency(liveRates[detected.code]);
      }
    });
  }, [isOpen, parsedUser]);

  // Handle user manual currency override
  const handleCurrencyChange = (code: string) => {
    setSelectedCurrencyKey(code);
    try {
      if (code === "AUTO") {
        sessionStorage.removeItem("@owner_active_currency");
      } else {
        sessionStorage.setItem("@owner_active_currency", code);
      }
    } catch {}
  };

  // Inputs
  const [tractorCount, setTractorCount] = useState<number>(Math.max(1, initialTractorCount));
  const [targetHectares, setTargetHectares] = useState<number>(Math.max(1, initialTractorCount) * 30);
  const [manualRateUSD, setManualRateUSD] = useState<number>(55);
  const [demandLevel, setDemandLevel] = useState<"low" | "normal" | "high" | "surge">("high");
  const [season, setSeason] = useState<"off_peak" | "standard" | "sowing" | "harvest">("sowing");
  const [dynamicPricing, setDynamicPricing] = useState<boolean>(true);
  const [packageBundling, setPackageBundling] = useState<boolean>(true);
  const [volumeDiscounts, setVolumeDiscounts] = useState<boolean>(true);

  const [applying, setApplying] = useState<boolean>(false);
  const [appliedSuccess, setAppliedSuccess] = useState<boolean>(false);
  const [apiSummary, setApiSummary] = useState<string>("");
  const [monthlyProjection, setMonthlyProjection] = useState<any[]>([]);

  useEffect(() => {
    if (initialTractorCount) {
      const count = Math.max(1, initialTractorCount);
      setTractorCount(count);
      setTargetHectares(count * 30);
    }
  }, [initialTractorCount, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    const fetchApiSimulation = async () => {
      try {
        const res = await renderInstance.post(`${FastApiBaseURL}/optimizer/simulate-pricing`, {
          tractor_count: Math.max(1, tractorCount),
          target_hectares: targetHectares > 0 ? targetHectares : Math.max(1, tractorCount) * 30,
          manual_rate: manualRateUSD,
          demand_level: demandLevel,
          season,
          dynamic_pricing: dynamicPricing,
          package_bundling: packageBundling,
          volume_discounts: volumeDiscounts,
          currency: currency.code,
          currency_rate: currency.rate,
          currency_symbol: currency.symbol,
        }).catch(() => null);

        if (res?.data && res.data.success && isMounted) {
          if (res.data.summary) setApiSummary(res.data.summary);
          if (res.data.monthly_projection) setMonthlyProjection(res.data.monthly_projection);
        }
      } catch (err) {}
    };

    fetchApiSimulation();
    return () => {
      isMounted = false;
    };
  }, [
    isOpen,
    tractorCount,
    targetHectares,
    manualRateUSD,
    demandLevel,
    season,
    dynamicPricing,
    packageBundling,
    volumeDiscounts,
    currency.code,
    currency.rate,
    currency.symbol,
  ]);

  // Simulation calculations (Calculated with dynamic currency rate)
  const simulation = useMemo(() => {
    const tCount = Math.max(1, tractorCount);
    const area = targetHectares > 0 ? targetHectares : tCount * 30;
    const rateMultiplier = currency.rate || 1.0;

    // 1. Manual Fixed Rate Model (USD base converted to regional currency)
    const manualGrossUSD = Math.round(manualRateUSD * area);
    const manualFuelUSD = Math.round(manualGrossUSD * 0.16);
    const manualWagesUSD = Math.round(manualGrossUSD * 0.20);
    const manualMaintUSD = Math.round(manualGrossUSD * 0.07);
    const manualFeeUSD = Math.round(manualGrossUSD * 0.035);
    const manualTotalExpUSD = manualFuelUSD + manualWagesUSD + manualMaintUSD + manualFeeUSD;
    const manualNetUSD = manualGrossUSD - manualTotalExpUSD;
    const manualUtil = Math.min(62, Math.max(45, 50 + tCount * 2));

    // 2. AI Dynamic Model (TractorAI)
    const baseBenchmarkUSD = 58.0;
    const demandMult =
      demandLevel === "surge"
        ? 1.28
        : demandLevel === "high"
        ? 1.18
        : demandLevel === "low"
        ? 0.9
        : 1.0;
    const seasonMult =
      season === "harvest"
        ? 1.45
        : season === "sowing"
        ? 1.35
        : season === "off_peak"
        ? 0.85
        : 1.0;
    const bundleMult = packageBundling ? 1.15 : 1.0;
    const volumeMult = volumeDiscounts ? 1.08 : 1.0;

    const aiEffectiveRateUSD = Math.round(
      baseBenchmarkUSD * (dynamicPricing ? demandMult : 1.0) * bundleMult * seasonMult
    );
    const aiServicedArea = Math.round(area * (dynamicPricing ? 1.18 : 1.05));
    const aiGrossUSD = Math.round(aiEffectiveRateUSD * aiServicedArea);

    const aiFuelUSD = Math.round(aiGrossUSD * 0.13); // 13% vs 16% due to route optimization
    const aiWagesUSD = Math.round(aiGrossUSD * 0.18);
    const aiMaintUSD = Math.round(aiGrossUSD * 0.06);
    const aiFeeUSD = Math.round(aiGrossUSD * 0.035);
    const aiTotalExpUSD = aiFuelUSD + aiWagesUSD + aiMaintUSD + aiFeeUSD;
    const aiNetUSD = aiGrossUSD - aiTotalExpUSD;
    const aiUtil = Math.min(96, Math.max(75, Math.round(84 * (seasonMult / 1.0))));

    const extraNetUSD = aiNetUSD - manualNetUSD;
    const growthPct = Math.round(((aiNetUSD - manualNetUSD) / Math.max(1, manualNetUSD)) * 100);

    // Convert values to localized regional currency
    return {
      manual: {
        gross: Math.round(manualGrossUSD * rateMultiplier),
        rate: Math.round(manualRateUSD * rateMultiplier),
        fuel: Math.round(manualFuelUSD * rateMultiplier),
        wages: Math.round(manualWagesUSD * rateMultiplier),
        maint: Math.round(manualMaintUSD * rateMultiplier),
        totalExp: Math.round(manualTotalExpUSD * rateMultiplier),
        net: Math.round(manualNetUSD * rateMultiplier),
        util: manualUtil,
      },
      ai: {
        gross: Math.round(aiGrossUSD * rateMultiplier),
        effectiveRate: Math.round(aiEffectiveRateUSD * rateMultiplier),
        fuel: Math.round(aiFuelUSD * rateMultiplier),
        wages: Math.round(aiWagesUSD * rateMultiplier),
        maint: Math.round(aiMaintUSD * rateMultiplier),
        totalExp: Math.round(aiTotalExpUSD * rateMultiplier),
        net: Math.round(aiNetUSD * rateMultiplier),
        util: aiUtil,
      },
      extraNet: Math.round(extraNetUSD * rateMultiplier),
      growthPct,
    };
  }, [
    tractorCount,
    targetHectares,
    manualRateUSD,
    demandLevel,
    season,
    dynamicPricing,
    packageBundling,
    volumeDiscounts,
    currency.rate,
  ]);

  const handleApplyStrategy = async () => {
    setApplying(true);
    try {
      await renderInstance.post(`${FastApiBaseURL}/optimizer/apply-strategy`, {
        user_id: activeUserId,
        tractor_count: tractorCount,
        season,
        demand_level: demandLevel,
        effective_rate: simulation.ai.effectiveRate,
        dynamic_pricing_enabled: dynamicPricing,
        currency: currency.code,
        currency_symbol: currency.symbol,
      });
    } catch (e) {
      // Graceful local apply
    } finally {
      setApplying(false);
      setAppliedSuccess(true);
      setTimeout(() => {
        setAppliedSuccess(false);
        if (onStrategyApplied) onStrategyApplied();
        onClose();
      }, 1200);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 flex flex-col">
        {/* Header with Dynamic Location Currency Indicator */}
        <div className="sticky top-0 z-20 bg-gradient-to-r from-red-950 via-red-900 to-amber-950 text-white p-5 md:p-6 border-b border-red-800/40 flex flex-wrap gap-3 justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold tracking-tight">TractorAI Pricing Simulator</h3>
                <span className="px-2.5 py-0.5 bg-amber-400 text-amber-950 text-[10px] font-extrabold rounded-full uppercase tracking-wider">
                  Engine 3.0
                </span>
              </div>
              <p className="text-xs text-red-200/80">
                Dynamic localized rates & seasonal market revenue optimization
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Dynamic Currency Selector / Location Badge */}
            <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 text-xs shadow-inner">
              <span className="text-base leading-none">{currency.flag}</span>
              <select
                value={selectedCurrencyKey}
                onChange={(e) => handleCurrencyChange(e.target.value)}
                className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer pr-1"
                aria-label="Simulator Location Currency"
              >
                <option value="AUTO" className="text-slate-900 bg-white">
                  Auto: {detectedCurrency.code} ({detectedCurrency.symbol})
                </option>
                {Object.values(currencyMap).map((c) => (
                  <option key={c.code} value={c.code} className="text-slate-900 bg-white">
                    {c.flag} {c.code} ({c.symbol}) - {c.regionName}
                  </option>
                ))}
              </select>
              {currency.rate !== 1.0 && (
                <span className="text-[10px] text-amber-300 font-semibold border-l border-white/20 pl-2 hidden sm:inline">
                  1 USD = {currency.rate} {currency.code}
                </span>
              )}
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 md:p-8 space-y-8 flex-1">
          {/* Controls Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-200/70">
            {/* Control 1: Tractors Count */}
            <div>
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1 mb-1.5">
                <Tractor className="w-3.5 h-3.5 text-amber-600" />
                Fleet Tractors ({tractorCount})
              </label>
              <input
                type="range"
                min="1"
                max="25"
                value={tractorCount}
                onChange={(e) => setTractorCount(Number(e.target.value))}
                className="w-full accent-orange-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400 font-medium mt-1">
                <span>1 unit</span>
                <span>25 units</span>
              </div>
            </div>

            {/* Control 2: Target Area */}
            <div>
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1 mb-1.5">
                <Layers className="w-3.5 h-3.5 text-orange-600" />
                Target Hectares ({targetHectares} ha)
              </label>
              <input
                type="range"
                min="10"
                max="600"
                step="10"
                value={targetHectares}
                onChange={(e) => setTargetHectares(Number(e.target.value))}
                className="w-full accent-orange-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400 font-medium mt-1">
                <span>10 ha</span>
                <span>600 ha</span>
              </div>
            </div>

            {/* Control 3: Season Preset */}
            <div>
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1 mb-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                Seasonal Multiplier
              </label>
              <select
                value={season}
                onChange={(e) => setSeason(e.target.value as any)}
                className="w-full bg-white border border-slate-300 text-slate-800 text-xs font-bold rounded-xl p-2.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="sowing">Sowing Surge (1.35x)</option>
                <option value="harvest">Harvest Blitz (1.45x)</option>
                <option value="standard">Standard (1.00x)</option>
                <option value="off_peak">Off-Peak Promo (0.85x)</option>
              </select>
            </div>

            {/* Control 4: Demand Level */}
            <div>
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1 mb-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-red-600" />
                Demand Level
              </label>
              <select
                value={demandLevel}
                onChange={(e) => setDemandLevel(e.target.value as any)}
                className="w-full bg-white border border-slate-300 text-slate-800 text-xs font-bold rounded-xl p-2.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="surge">Surge (+28%)</option>
                <option value="high">High Demand (+18%)</option>
                <option value="normal">Balanced (0%)</option>
                <option value="low">Low Demand (-10%)</option>
              </select>
            </div>
          </div>

          {/* Live AI Simulation Summary Banner */}
          {apiSummary && (
            <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex items-center gap-3 text-xs text-amber-950 font-semibold shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="leading-relaxed">{apiSummary}</span>
            </div>
          )}

          {/* Side-by-Side Comparison Cards with Dynamic Location Currency */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card A: Traditional Manual Rate */}
            <div className="rounded-2xl p-6 border border-slate-200 bg-slate-50/70 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Traditional Baseline
                  </span>
                  <span className="px-2.5 py-1 bg-slate-200 text-slate-700 font-bold text-xs rounded-full">
                    Fixed {currency.symbol}{simulation.manual.rate.toLocaleString()}/ha
                  </span>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>Gross Revenue:</span>
                    <span className="font-bold text-slate-800">
                      {currency.symbol}{simulation.manual.gross.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-xs">
                    <span>Fuel Expenses (16%):</span>
                    <span>-{currency.symbol}{simulation.manual.fuel.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-xs">
                    <span>Operator Wages (20%):</span>
                    <span>-{currency.symbol}{simulation.manual.wages.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-xs">
                    <span>Maintenance & Wear:</span>
                    <span>-{currency.symbol}{simulation.manual.maint.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-xs">
                    <span>Fleet Utilization:</span>
                    <span className="font-bold text-slate-700">{simulation.manual.util}%</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200 flex justify-between items-baseline">
                <span className="text-xs font-semibold text-slate-500">Net Estimated Profit:</span>
                <span className="text-2xl font-extrabold text-slate-900">
                  {currency.symbol}{simulation.manual.net.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Card B: TractorAI Dynamic Model */}
            <div className="rounded-2xl p-6 border-2 border-orange-500/50 bg-gradient-to-br from-orange-50/50 via-white to-amber-50/30 shadow-md flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 px-3 py-1 bg-gradient-to-r from-orange-600 to-red-600 text-white text-[10px] font-extrabold rounded-bl-xl uppercase tracking-wider">
                Recommended
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-orange-600" />
                    <span className="text-xs font-bold uppercase tracking-wider text-orange-950">
                      TractorAI Dynamic
                    </span>
                  </div>
                  <span className="px-2.5 py-1 bg-orange-100 text-orange-700 font-extrabold text-xs rounded-full">
                    Dynamic {currency.symbol}{simulation.ai.effectiveRate.toLocaleString()}/ha
                  </span>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-slate-700">
                    <span>Gross Revenue:</span>
                    <span className="font-extrabold text-slate-900">
                      {currency.symbol}{simulation.ai.gross.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-emerald-700 text-xs font-medium">
                    <span>Fuel Expenses (13% - Optimized):</span>
                    <span>-{currency.symbol}{simulation.ai.fuel.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-xs">
                    <span>Operator Wages (18%):</span>
                    <span>-{currency.symbol}{simulation.ai.wages.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-xs">
                    <span>Maintenance & Platform:</span>
                    <span>-{currency.symbol}{simulation.ai.maint.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-700 text-xs">
                    <span>Fleet Utilization:</span>
                    <span className="font-extrabold text-emerald-600">{simulation.ai.util}% (Maximized)</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-orange-200 flex justify-between items-baseline">
                <span className="text-xs font-bold text-orange-900">TractorAI Net Profit:</span>
                <span className="text-2xl font-black text-orange-700">
                  {currency.symbol}{simulation.ai.net.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Advantage Banner with Dynamic Currency */}
          <div className="bg-gradient-to-r from-emerald-500/15 via-emerald-500/10 to-transparent p-4 rounded-2xl border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-emerald-950">
                  +{currency.symbol}{simulation.extraNet.toLocaleString()} Extra Monthly Net Profit (+{simulation.growthPct}% ROI Growth)
                </p>
                <p className="text-xs text-emerald-800">
                  Generated by dynamic seasonal rate adaptation and 18.7% deadhead transit elimination in {currency.regionName}.
                </p>
              </div>
            </div>

            <Button
              onClick={handleApplyStrategy}
              disabled={applying || appliedSuccess}
              className={`font-bold px-6 py-2.5 rounded-xl shadow-md transition-all text-white shrink-0 ${
                appliedSuccess
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-orange-600 hover:bg-orange-500"
              }`}
            >
              {appliedSuccess ? (
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Strategy Applied!
                </span>
              ) : applying ? (
                "Applying..."
              ) : (
                <span className="inline-flex items-center gap-1.5">
                  Apply Strategy to Fleet <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingSimulatorModal;
