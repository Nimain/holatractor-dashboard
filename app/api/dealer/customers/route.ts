import { NextRequest, NextResponse } from "next/server";
import { getBackendBaseUrl } from "@/utils/api/apiUrl";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawDealerId = searchParams.get("dealer_id") || searchParams.get("dealerId") || "";
    const search = searchParams.get("search") || "";

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

    if (!targetDealer) {
      targetDealer = "all";
    }

    const fastApiUrl = getBackendBaseUrl();
    const token = request.headers.get("authorization") || "";
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = token;

    const url = new URL(`${fastApiUrl}/dealer/customers`);
    url.searchParams.set("dealer_id", targetDealer);
    if (search) url.searchParams.set("search", search);

    const fastRes = await fetch(url.toString(), {
      headers,
      cache: "no-store",
    });

    if (fastRes.ok) {
      const data = await fastRes.json();
      return NextResponse.json(data);
    }

    return NextResponse.json([]);
  } catch (error: any) {
    console.error("[/api/dealer/customers] Proxy error:", error?.message);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const fastApiUrl = getBackendBaseUrl();
    const token = request.headers.get("authorization") || "";
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = token;

    const endpoint = (Array.isArray(body) || Array.isArray(body?.customers))
      ? `${fastApiUrl}/dealer/customers/bulk`
      : `${fastApiUrl}/dealer/customers`;

    const fastRes = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const data = await fastRes.json();
    return NextResponse.json(data, { status: fastRes.status });
  } catch (error: any) {
    console.error("[/api/dealer/customers] POST proxy error:", error?.message);
    return NextResponse.json({ error: error?.message || "Failed to create customer" }, { status: 500 });
  }
}
