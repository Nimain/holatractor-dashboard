import { NextRequest, NextResponse } from "next/server";
import { getBackendBaseUrl } from "@/utils/api/apiUrl";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const fastApiUrl = getBackendBaseUrl();
    const token = request.headers.get("authorization") || "";
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = token;

    const fastRes = await fetch(`${fastApiUrl}/dealer/store`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await fastRes.json().catch(() => ({}));
    return NextResponse.json(data, { status: fastRes.status });
  } catch (error: any) {
    console.error("[/api/dealer/store] POST proxy error:", error?.message);
    return NextResponse.json({ error: error?.message || "Failed to create dealer store" }, { status: 500 });
  }
}

function getDealerIdFromRequest(request: NextRequest, explicit?: string | null): string {
  if (explicit && explicit !== "all" && explicit !== "undefined" && explicit !== "null") {
    return explicit;
  }
  try {
    const direct = request.cookies.get("dealer_id")?.value;
    if (direct && direct !== "all") return direct;
    const userCookie = request.cookies.get("user")?.value;
    if (userCookie) {
      const parsed = JSON.parse(decodeURIComponent(userCookie));
      const found = parsed?.dealer_id || parsed?.dealerId || parsed?.userId || parsed?.id;
      if (found) return found;
    }
  } catch {}
  return "";
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawDealerId = searchParams.get("dealer_id") || searchParams.get("dealerId") || searchParams.get("user_id") || searchParams.get("userId") || "";
    const effectiveDealerId = getDealerIdFromRequest(request, rawDealerId);

    const fastApiUrl = getBackendBaseUrl();
    const token = request.headers.get("authorization") || "";
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = token;

    // Call FastAPI directly with dealer_id
    const endpoint = effectiveDealerId && effectiveDealerId !== "all"
      ? `${fastApiUrl}/dealer/stores?dealer_id=${encodeURIComponent(effectiveDealerId)}`
      : `${fastApiUrl}/dealer/stores`;

    const fastRes = await fetch(endpoint, {
      headers,
      cache: "no-store",
    });

    const data = await fastRes.json().catch(() => []);
    
    // Sort so Central Santa Cruz is always primary
    if (Array.isArray(data)) {
      data.sort((a: any, b: any) => {
        if (a.name?.includes("Central Santa Cruz")) return -1;
        if (b.name?.includes("Central Santa Cruz")) return 1;
        return 0;
      });
    }

    return NextResponse.json(data, { status: fastRes.status });
  } catch (error: any) {
    console.error("[/api/dealer/store] GET proxy error:", error?.message);
    return NextResponse.json({ error: error?.message || "Failed to fetch stores" }, { status: 500 });
  }
}
