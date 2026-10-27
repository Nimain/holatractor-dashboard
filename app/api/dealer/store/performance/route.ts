import { NextRequest, NextResponse } from "next/server";
import { getBackendBaseUrl } from "@/utils/api/apiUrl";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawDealerId = searchParams.get("dealer_id") || searchParams.get("dealerId") || "";
    let targetDealer = rawDealerId && rawDealerId !== "all" && rawDealerId !== "undefined" && rawDealerId !== "null" ? rawDealerId : null;

    if (!targetDealer) {
      try {
        const directDealerId = request.cookies.get("dealer_id")?.value;
        if (directDealerId) targetDealer = directDealerId;
        else {
          const userCookie = request.cookies.get("user")?.value;
          if (userCookie) {
            const parsed = JSON.parse(decodeURIComponent(userCookie));
            targetDealer = parsed?.dealer_id || parsed?.dealerId || parsed?.userId || parsed?.id || null;
          }
        }
      } catch {}
    }

    const fastApiUrl = getBackendBaseUrl();
    const token = request.headers.get("authorization") || "";
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = token;

    const query = targetDealer ? `?dealer_id=${encodeURIComponent(targetDealer)}` : "";
    const fastRes = await fetch(`${fastApiUrl}/dealer/store/performance${query}`, {
      headers,
      cache: "no-store",
    });

    if (fastRes.ok) {
      const data = await fastRes.json();
      return NextResponse.json(data);
    }

    // Graceful fallback response structure if backend returns an error
    return NextResponse.json({
      success: true,
      summary: {
        totalStores: 0,
        totalLeads: 0,
        recentLeads: 0,
        overallPerformanceScore: "0%",
        growthRate: "0%",
        topPerformingStore: "N/A",
      },
      chartData: [],
      intervalData: [],
      storeRankings: [],
    });
  } catch (error: any) {
    console.error("[/api/dealer/store/performance] Proxy error:", error?.message);
    return NextResponse.json({
      success: true,
      summary: {
        totalStores: 0,
        totalLeads: 0,
        recentLeads: 0,
        overallPerformanceScore: "0%",
        growthRate: "0%",
        topPerformingStore: "N/A",
      },
      chartData: [],
      intervalData: [],
      storeRankings: [],
    });
  }
}
