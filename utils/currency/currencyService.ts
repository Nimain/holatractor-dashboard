import axios from "axios";
import { TractorAIBaseURL } from "@/utils/Axios/RenderInstance";

export interface CurrencyConfig {
  code: string;
  symbol: string;
  rate: number;
  regionName: string;
  flag: string;
  countryCode?: string;
}

export const BASE_CURRENCY_CONFIGS: Record<string, CurrencyConfig> = {
  BOB: { code: "BOB", symbol: "Bs.", rate: 6.96, regionName: "Bolivia (BOB)", flag: "🇧🇴", countryCode: "+591" },
  INR: { code: "INR", symbol: "₹", rate: 86.5, regionName: "India (INR)", flag: "🇮🇳", countryCode: "+91" },
  USD: { code: "USD", symbol: "$", rate: 1.0, regionName: "United States (USD)", flag: "🇺🇸", countryCode: "+1" },
  MXN: { code: "MXN", symbol: "MX$", rate: 18.2, regionName: "Mexico (MXN)", flag: "🇲🇽", countryCode: "+52" },
  BRL: { code: "BRL", symbol: "R$", rate: 5.6, regionName: "Brazil (BRL)", flag: "🇧🇷", countryCode: "+55" },
  PEN: { code: "PEN", symbol: "S/.", rate: 3.75, regionName: "Peru (PEN)", flag: "🇵🇪", countryCode: "+51" },
  COP: { code: "COP", symbol: "COP$", rate: 4100.0, regionName: "Colombia (COP)", flag: "🇨🇴", countryCode: "+57" },
  ARS: { code: "ARS", symbol: "ARS$", rate: 940.0, regionName: "Argentina (ARS)", flag: "🇦🇷", countryCode: "+54" },
  CLP: { code: "CLP", symbol: "CLP$", rate: 930.0, regionName: "Chile (CLP)", flag: "🇨🇱", countryCode: "+56" },
  PYG: { code: "PYG", symbol: "₲", rate: 7550.0, regionName: "Paraguay (PYG)", flag: "🇵🇾", countryCode: "+595" },
  EUR: { code: "EUR", symbol: "€", rate: 0.92, regionName: "Europe (EUR)", flag: "🇪🇺", countryCode: "+34" },
};

/**
 * Resolves currency config from latitude and longitude coordinates
 */
export function resolveCurrencyFromCoordinates(lat: number, lon: number): CurrencyConfig | null {
  if (typeof lat !== "number" || typeof lon !== "number" || isNaN(lat) || isNaN(lon)) return null;

  // Bolivia
  if (lat >= -23 && lat <= -9 && lon >= -70 && lon <= -57) return BASE_CURRENCY_CONFIGS.BOB;
  // India
  if (lat >= 8 && lat <= 37 && lon >= 68 && lon <= 97) return BASE_CURRENCY_CONFIGS.INR;
  // Mexico
  if (lat >= 14 && lat <= 33 && lon >= -118 && lon <= -86) return BASE_CURRENCY_CONFIGS.MXN;
  // Brazil
  if (lat >= -34 && lat <= 5 && lon >= -74 && lon <= -34) return BASE_CURRENCY_CONFIGS.BRL;
  // Peru
  if (lat >= -19 && lat <= 0 && lon >= -82 && lon <= -68) return BASE_CURRENCY_CONFIGS.PEN;
  // Colombia
  if (lat >= -4 && lat <= 13 && lon >= -79 && lon <= -66) return BASE_CURRENCY_CONFIGS.COP;
  // Argentina
  if (lat >= -55 && lat <= -21 && lon >= -73 && lon <= -53) return BASE_CURRENCY_CONFIGS.ARS;
  // Chile
  if (lat >= -56 && lat <= -17 && lon >= -76 && lon <= -66) return BASE_CURRENCY_CONFIGS.CLP;
  // Paraguay
  if (lat >= -28 && lat <= -19 && lon >= -63 && lon <= -54) return BASE_CURRENCY_CONFIGS.PYG;
  // USA / Canada
  if (lat >= 24 && lat <= 50 && lon >= -125 && lon <= -65) return BASE_CURRENCY_CONFIGS.USD;
  // Europe
  if (lat >= 35 && lat <= 71 && lon >= -25 && lon <= 40) return BASE_CURRENCY_CONFIGS.EUR;

  return null;
}

/**
 * Resolves currency from browser timezone
 */
export function resolveCurrencyFromTimezone(): CurrencyConfig | null {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    if (tz.includes("La_Paz") || tz.includes("Bolivia")) return BASE_CURRENCY_CONFIGS.BOB;
    if (tz.includes("Kolkata") || tz.includes("Calcutta") || tz.includes("Colombo")) return BASE_CURRENCY_CONFIGS.INR;
    if (tz.includes("Mexico") || tz.includes("Monterrey") || tz.includes("Cancun") || tz.includes("Tijuana")) return BASE_CURRENCY_CONFIGS.MXN;
    if (tz.includes("Lima")) return BASE_CURRENCY_CONFIGS.PEN;
    if (tz.includes("Sao_Paulo") || tz.includes("Brazil") || tz.includes("Manaus")) return BASE_CURRENCY_CONFIGS.BRL;
    if (tz.includes("Bogota")) return BASE_CURRENCY_CONFIGS.COP;
    if (tz.includes("Buenos_Aires") || tz.includes("Argentina")) return BASE_CURRENCY_CONFIGS.ARS;
    if (tz.includes("Santiago")) return BASE_CURRENCY_CONFIGS.CLP;
    if (tz.includes("Asuncion")) return BASE_CURRENCY_CONFIGS.PYG;
    if (tz.startsWith("Europe/")) return BASE_CURRENCY_CONFIGS.EUR;
    if (tz.startsWith("America/New_York") || tz.startsWith("America/Chicago") || tz.startsWith("America/Los_Angeles") || tz.startsWith("America/Denver")) return BASE_CURRENCY_CONFIGS.USD;
  } catch {}
  return null;
}

/**
 * Synchronously detects the best currency config using available hints
 */
export function detectUserCurrency(user?: any): CurrencyConfig {
  if (typeof window !== "undefined") {
    // 1. Check explicitly saved manual preference
    try {
      const saved = sessionStorage.getItem("@owner_active_currency") || localStorage.getItem("@owner_active_currency");
      if (saved && BASE_CURRENCY_CONFIGS[saved]) {
        return BASE_CURRENCY_CONFIGS[saved];
      }
    } catch {}

    // 2. Check cached coordinates
    try {
      const cachedCoords = sessionStorage.getItem("last_owner_coords") || localStorage.getItem("last_owner_coords");
      if (cachedCoords) {
        const { latitude, longitude } = JSON.parse(cachedCoords);
        const resolved = resolveCurrencyFromCoordinates(latitude, longitude);
        if (resolved) return resolved;
      }
    } catch {}
  }

  // 3. Check authenticated user profile object
  if (user) {
    const rawCc = String(user.country_code || user.countryCode || "").trim();
    const rawPhone = String(user.mobile || user.phone || user.phone_number || "").trim();
    const rawCountry = String(user.country || "").toUpperCase().trim();

    if (rawCc === "+591" || rawCc === "BO" || rawPhone.startsWith("+591") || rawCountry === "BOLIVIA") return BASE_CURRENCY_CONFIGS.BOB;
    if (rawCc === "+91" || rawCc === "IN" || rawPhone.startsWith("+91") || rawCountry === "INDIA") return BASE_CURRENCY_CONFIGS.INR;
    if (rawCc === "+52" || rawCc === "MX" || rawPhone.startsWith("+52") || rawCountry === "MEXICO") return BASE_CURRENCY_CONFIGS.MXN;
    if (rawCc === "+51" || rawCc === "PE" || rawPhone.startsWith("+51") || rawCountry === "PERU") return BASE_CURRENCY_CONFIGS.PEN;
    if (rawCc === "+55" || rawCc === "BR" || rawPhone.startsWith("+55") || rawCountry === "BRAZIL") return BASE_CURRENCY_CONFIGS.BRL;
    if (rawCc === "+57" || rawCc === "CO" || rawPhone.startsWith("+57") || rawCountry === "COLOMBIA") return BASE_CURRENCY_CONFIGS.COP;
    if (rawCc === "+54" || rawCc === "AR" || rawPhone.startsWith("+54") || rawCountry === "ARGENTINA") return BASE_CURRENCY_CONFIGS.ARS;
    if (rawCc === "+56" || rawCc === "CL" || rawPhone.startsWith("+56") || rawCountry === "CHILE") return BASE_CURRENCY_CONFIGS.CLP;
    if (rawCc === "+595" || rawCc === "PY" || rawPhone.startsWith("+595") || rawCountry === "PARAGUAY") return BASE_CURRENCY_CONFIGS.PYG;
    if (rawCc === "+1" || rawCc === "US" || rawPhone.startsWith("+1") || rawCountry === "UNITED STATES" || rawCountry === "USA") return BASE_CURRENCY_CONFIGS.USD;
  }

  // 4. Check browser timezone
  const tzResolved = resolveCurrencyFromTimezone();
  if (tzResolved) return tzResolved;

  // Default fallback to BOB (Bolivia, core operating market) or USD
  return BASE_CURRENCY_CONFIGS.BOB;
}

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
  decimals: number = 0
): string {
  const rate = currency?.rate || 1.0;
  const converted = Math.round(Number(usdAmount || 0) * rate);
  return `${currency?.symbol || "$"}${converted.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

/**
 * Formats rate per unit using dynamic currency rate
 */
export function formatDynamicRate(
  usdRate: number,
  currency: CurrencyConfig,
  unit: string = "ha"
): string {
  const rate = currency?.rate || 1.0;
  const converted = Math.round(Number(usdRate || 0) * rate);
  return `${currency?.symbol || "$"}${converted.toLocaleString()}/${unit}`;
}
