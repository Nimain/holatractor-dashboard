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
    const base = (searchParams.get("base") || "USD").toUpperCase();

    // 1. Try TractorAI FastAPI endpoints
    for (const baseUrl of FastApiEndpoints) {
      try {
        const cleanBase = baseUrl.replace(/\/$/, "");
        const fastRes = await axios.get(`${cleanBase}/api/v1/currency/rates?base=${base}`, {
          timeout: 3500,
        });

        if (fastRes.data && fastRes.data.rates) {
          return NextResponse.json(
            {
              success: true,
              source: "tractorai-live",
              base: fastRes.data.base || base,
              rates: fastRes.data.rates,
              timestamp: fastRes.data.timestamp || new Date().toISOString(),
            },
            {
              headers: {
                "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
              },
            }
          );
        }
      } catch (err) {}
    }

    // 2. Fetch live real-time rates from live FX engine
    try {
      const fxRes = await axios.get(`https://open.er-api.com/v6/latest/${base}`, {
        timeout: 4000,
      });

      if (fxRes.data && fxRes.data.rates) {
        const rawRates = fxRes.data.rates;
        const filteredRates = {
          USD: 1.0,
          INR: Number(rawRates.INR) || 94.0,
          BOB: Number(rawRates.BOB) || 6.91,
          PEN: Number(rawRates.PEN) || 3.75,
          BRL: Number(rawRates.BRL) || 5.4,
          EUR: Number(rawRates.EUR) || 0.92,
          GBP: Number(rawRates.GBP) || 0.79,
          CAD: Number(rawRates.CAD) || 1.38,
          AUD: Number(rawRates.AUD) || 1.52,
        };

        return NextResponse.json(
          {
            success: true,
            source: "fx-engine-live",
            base,
            rates: filteredRates,
            all_rates: rawRates,
            timestamp: new Date().toISOString(),
          },
          {
            headers: {
              "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
            },
          }
        );
      }
    } catch (fxErr) {}

    // 3. Fallback Dynamic Estimate
    return NextResponse.json({
      success: true,
      source: "tractorai-fallback",
      base: "USD",
      rates: {
        USD: 1.0,
        INR: 94.0,
        BOB: 6.91,
        PEN: 3.75,
        BRL: 5.4,
        EUR: 0.92,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to fetch dynamic currency rates" },
      { status: 500 }
    );
  }
}
