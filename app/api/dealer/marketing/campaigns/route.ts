import { getBackendBaseUrl } from "@/utils/api/apiUrl";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawDealerId = searchParams.get("dealer_id") || searchParams.get("dealerId");
    let targetDealer = rawDealerId && rawDealerId !== "all" && rawDealerId !== "undefined" && rawDealerId !== "null" ? rawDealerId : null;

    if (!targetDealer) {
      try {
        const directDealerId = request.cookies.get("dealer_id")?.value;
        if (directDealerId && directDealerId !== "all") targetDealer = directDealerId;
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

    const qParams = new URLSearchParams();
    if (targetDealer) qParams.append("dealer_id", targetDealer);

    const status = searchParams.get("status");
    const channel = searchParams.get("channel");
    const search = searchParams.get("search");

    if (status && status !== "all") qParams.append("status", status);
    if (channel && channel !== "all") qParams.append("channel", channel);
    if (search && search.trim()) qParams.append("search", search.trim());

    const fastRes = await fetch(`${fastApiUrl}/dealer/marketing/campaigns?${qParams.toString()}`, {
      headers,
      cache: "no-store",
    });

    if (fastRes.ok) {
      const data = await fastRes.json();
      return NextResponse.json(data);
    }

    return NextResponse.json({
      success: true,
      campaigns: [],
      stats: {
        total_campaigns: 0,
        active_campaigns: 0,
        paused_campaigns: 0,
        completed_campaigns: 0,
        total_budget: 0,
        total_spend: 0,
        total_impressions: 0,
        total_clicks: 0,
        total_leads_generated: 0,
        total_conversions: 0,
        total_revenue_generated: 0,
        avg_roi: 0,
      },
      count: 0,
    });
  } catch (error: any) {
    console.error("GET /api/dealer/marketing/campaigns proxy error:", error?.message);
    return NextResponse.json({
      success: true,
      campaigns: [],
      stats: {
        total_campaigns: 0,
        active_campaigns: 0,
        paused_campaigns: 0,
        completed_campaigns: 0,
        total_budget: 0,
        total_spend: 0,
        total_impressions: 0,
        total_clicks: 0,
        total_leads_generated: 0,
        total_conversions: 0,
        total_revenue_generated: 0,
        avg_roi: 0,
      },
      count: 0,
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let dealerId = body.dealer_id || body.dealerId;

    if (!dealerId) {
      try {
        const directDealerId = request.cookies.get("dealer_id")?.value;
        if (directDealerId) dealerId = directDealerId;
        else {
          const userCookie = request.cookies.get("user")?.value;
          if (userCookie) {
            const parsed = JSON.parse(decodeURIComponent(userCookie));
            dealerId = parsed?.dealer_id || parsed?.dealerId || parsed?.userId || parsed?.id;
          }
        }
      } catch {}
    }

    const payload = { ...body, dealer_id: dealerId };
    const fastApiUrl = getBackendBaseUrl();
    const token = request.headers.get("authorization") || "";
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = token;

    const fastRes = await fetch(`${fastApiUrl}/dealer/marketing/campaigns`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const data = await fastRes.json().catch(() => ({}));
    return NextResponse.json(data, { status: fastRes.status });
  } catch (error: any) {
    console.error("POST /api/dealer/marketing/campaigns proxy error:", error?.message);
    return NextResponse.json({ success: false, error: error?.message || "Failed to create campaign" }, { status: 500 });
  }
}
