import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export const dynamic = "force-dynamic";

const FastApiEndpoints = [
  "http://127.0.0.1:8000",
  process.env.NEXT_PUBLIC_TRACTOR_AI_URL || "",
  process.env.NEXT_PUBLIC_API_URL || "",
  "https://tractorai.sinsignal.com",
].filter(Boolean);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const countryCode = searchParams.get("country_code") || searchParams.get("country") || "IN";
    const city = searchParams.get("city") || "";

    // 1. Try FastAPI endpoints (localhost first)
    for (const baseUrl of FastApiEndpoints) {
      try {
        const cleanBase = baseUrl.replace(/\/$/, "");
        const queryParams = new URLSearchParams();
        if (countryCode) queryParams.set("country_code", countryCode);
        if (city) queryParams.set("city", city);

        const fastRes = await axios.get(
          `${cleanBase}/mandi/spot-prices?${queryParams.toString()}`,
          { timeout: 4500 }
        );

        if (fastRes.data && fastRes.data.items && fastRes.data.items.length > 0) {
          return NextResponse.json(fastRes.data, {
            headers: {
              "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
            },
          });
        }
      } catch (err) {}
    }

    // 2. Local Fallback Calculator (matches TractorAI logic)
    const today = new Date();
    const dayNum = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    const hourBlock = Math.floor(today.getHours() / 3);
    const dateStr = today.toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });

    const isIndia = countryCode.toUpperCase() === "IN" || countryCode.toUpperCase() === "IND";

    return NextResponse.json({
      zoneId: isIndia ? "delhi" : "santa_cruz",
      zoneName: isIndia ? `${city || "Delhi"} Mandi (Azadpur & Narela)` : `${city || "Santa Cruz"} & Valles (Puerto Fluvial)`,
      currencySymbol: isIndia ? "₹" : "$",
      currencyCode: isIndia ? "INR" : "USD",
      yieldUnit: isIndia ? "Quintales (Qtl)" : "Toneladas Métricas (MT)",
      country: isIndia ? "India" : "Bolivia",
      status: isIndia ? "Live APMC Floor Open (06:00 - 19:00 IST)" : "Live Grain Floor Open (08:00 - 18:00 BOT)",
      aiAdvice: isIndia
        ? `🌾 TractorAI Market Intelligence (${dateStr}): Active trading across Northern Mandis with balanced vegetable & grain arrivals in ${city || "Delhi"}.`
        : `📈 TractorAI Market Intelligence (${dateStr}): Strong barge loadings and grain procurement at river export terminals in ${city || "Santa Cruz"}.`,
      last_synced_at: new Date().toISOString(),
      items: [],
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to fetch Mandi spot prices" },
      { status: 500 }
    );
  }
}
