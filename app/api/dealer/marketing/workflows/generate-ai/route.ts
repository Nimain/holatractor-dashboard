import { getBackendBaseUrl } from "@/utils/api/apiUrl";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

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
  return "d_001";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const dealerId = getDealerIdFromRequest(request, body.dealer_id || body.dealerId);

    const payload = { ...body, dealer_id: dealerId };
    const fastApiUrl = getBackendBaseUrl();
    const token = request.headers.get("authorization") || "";
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = token;

    const fastRes = await fetch(`${fastApiUrl}/dealer/marketing/workflows/generate-ai`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const data = await fastRes.json().catch(() => ({}));
    return NextResponse.json(data, { status: fastRes.status });
  } catch (error: any) {
    console.error("POST /api/dealer/marketing/workflows/generate-ai error:", error?.message);
    return NextResponse.json({ success: false, error: error?.message || "Failed to generate AI workflow" }, { status: 500 });
  }
}
