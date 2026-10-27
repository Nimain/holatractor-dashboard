import { NextRequest, NextResponse } from "next/server";
import { getBackendBaseUrl } from "@/utils/api/apiUrl";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawDealerId = searchParams.get("dealer_id") || searchParams.get("dealerId") || searchParams.get("user_id") || searchParams.get("userId");
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

    const category = searchParams.get("category");
    const search = searchParams.get("search");
    if (category && category !== "all") qParams.append("category", category);
    if (search && search.trim()) qParams.append("search", search.trim());

    const fastRes = await fetch(`${fastApiUrl}/dealer/tractor-parts/all?${qParams.toString()}`, {
      headers,
      cache: "no-store",
    });

    if (fastRes.ok) {
      const data = await fastRes.json();
      return NextResponse.json(data);
    }

    return NextResponse.json({ success: true, count: 0, parts: [], data: [] });
  } catch (error: any) {
    console.error("GET /api/dealer/tractor-parts/all proxy error:", error?.message);
    return NextResponse.json({ success: true, count: 0, parts: [], data: [] });
  }
}
