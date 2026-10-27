import { NextRequest, NextResponse } from "next/server";
import { getBackendBaseUrl } from "@/utils/api/apiUrl";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { user_id: string } }
) {
  try {
    const rawParam = params?.user_id;
    const { searchParams } = new URL(request.url);
    const queryDealerId = searchParams.get("dealer_id") || searchParams.get("dealerId");
    const queryUserId = searchParams.get("user_id") || searchParams.get("userId");

    let targetId = rawParam && rawParam !== "all" && rawParam !== "undefined" && rawParam !== "null" ? rawParam.trim() : null;
    if (!targetId && queryDealerId && queryDealerId !== "all") targetId = queryDealerId.trim();
    if (!targetId && queryUserId && queryUserId !== "all") targetId = queryUserId.trim();

    if (!targetId) {
      try {
        const directDealerId = request.cookies.get("dealer_id")?.value;
        if (directDealerId && directDealerId !== "all") targetId = directDealerId.trim();
        else {
          const userCookie = request.cookies.get("user")?.value;
          if (userCookie) {
            const parsed = JSON.parse(decodeURIComponent(userCookie));
            targetId = parsed?.dealer_id || parsed?.dealerId || parsed?.userId || parsed?.id || null;
          }
        }
      } catch {}
    }

    if (!targetId || targetId === "all") {
      return NextResponse.json([]);
    }

    const fastApiUrl = getBackendBaseUrl();
    const token = request.headers.get("authorization") || "";
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = token;

    const fastRes = await fetch(`${fastApiUrl}/dealer/all-stores/${encodeURIComponent(targetId)}`, {
      headers,
      cache: "no-store",
    });

    if (fastRes.ok) {
      const data = await fastRes.json();
      return NextResponse.json(data);
    }

    return NextResponse.json([]);
  } catch (error: any) {
    console.error("[/api/dealer/all-stores] Proxy error:", error?.message);
    return NextResponse.json([], { status: 500 });
  }
}
