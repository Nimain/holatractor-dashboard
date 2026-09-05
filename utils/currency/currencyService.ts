import axios from "axios";
import { TractorAIBaseURL } from "@/utils/Axios/RenderInstance";

export interface CurrencyConfig {
  code: string;
  symbol: string;
  rate: number;
  regionName: string;
  flag: string;
}

export const BASE_CURRENCY_CONFIGS: Record<string, CurrencyConfig> = {
  INR: { code: "INR", symbol: "₹", rate: 94.0, regionName: "India (INR)", flag: "🇮🇳" },
  BOB: { code: "BOB", symbol: "Bs.", rate: 6.91, regionName: "Bolivia (BOB)", flag: "🇧🇴" },
  USD: { code: "USD", symbol: "$", rate: 1.0, regionName: "International (USD)", flag: "🇺🇸" },
  PEN: { code: "PEN", symbol: "S/.", rate: 3.75, regionName: "Peru (PEN)", flag: "🇵🇪" },
  BRL: { code: "BRL", symbol: "R$", rate: 5.4, regionName: "Brazil (BRL)", flag: "🇧🇷" },
  EUR: { code: "EUR", symbol: "€", rate: 0.92, regionName: "Europe (EUR)", flag: "🇪🇺" },
};

/**
 * Fetches dynamic, real-time currency conversion rates from TractorAI engine / API
 */
export async function getLiveCurrencyRates(): Promise<Record<string, CurrencyConfig>> {
  const result: Record<string, CurrencyConfig> = { ...BASE_CURRENCY_CONFIGS };

  try {
    // 1. Try local proxy route /api/currency/rates (which calls TractorAI FastAPI)
    const res = await axios.get("/api/currency/rates?base=USD", { timeout: 4000 });
    if (res.data && res.data.rates) {
      const rates = res.data.rates;
      Object.keys(result).forEach((code) => {
        if (rates[code] !== undefined && Number(rates[code]) > 0) {
          result[code] = {
            ...result[code],
            rate: Number(rates[code]),
          };
        }
      });
      return result;
    }
  } catch {}

  try {
    // 2. Direct TractorAI FastAPI fallback
    const fastApiBase = (TractorAIBaseURL || "https://tractorai.sinsignal.com").replace(/\/$/, "");
    const res = await axios.get(`${fastApiBase}/credits/currencies`, { timeout: 4000 });
    if (Array.isArray(res.data) && res.data.length > 0) {
      res.data.forEach((c: any) => {
        if (c.code && c.exchange_rate && result[c.code]) {
          result[c.code] = {
            ...result[c.code],
            rate: Number(c.exchange_rate),
            symbol: c.symbol || result[c.code].symbol,
          };
        }
      });
    }
  } catch {}

  return result;
}

/**
 * Formats an amount using dynamic currency rate
 */
export function formatDynamicPrice(
  usdAmount: number,
  currency: CurrencyConfig,
  decimals: number = 2
): string {
  const rate = currency?.rate || 1.0;
  const converted = Number(usdAmount || 0) * rate;
  return `${currency?.symbol || "$"}${converted.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}
