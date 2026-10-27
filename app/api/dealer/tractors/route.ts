import { NextRequest, NextResponse } from "next/server";
import { getBackendBaseUrl } from "@/utils/api/apiUrl";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fastApiUrl = getBackendBaseUrl();
    const token = request.headers.get("authorization") || "";
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = token;

    const qParams = new URLSearchParams();
    const customerId = searchParams.get("customer_id") || searchParams.get("customerId") || searchParams.get("user_id") || searchParams.get("userId");
    if (customerId) qParams.append("customer_id", customerId);

    const dealerId = searchParams.get("dealer_id") || searchParams.get("dealerId");
    if (dealerId) qParams.append("dealer_id", dealerId);

    const search = searchParams.get("search");
    if (search && search.trim()) qParams.append("search", search.trim());

    const fastRes = await fetch(`${fastApiUrl}/dealer/tractors?${qParams.toString()}`, {
      headers,
      cache: "no-store",
    });

    if (fastRes.ok) {
      const data = await fastRes.json();
      return NextResponse.json(data);
    }

    return NextResponse.json({ success: true, count: 0, tractors: [], data: [] });
  } catch (error: any) {
    console.error("GET /api/dealer/tractors proxy error:", error?.message);
    return NextResponse.json({ success: true, count: 0, tractors: [], data: [] });
  }
}
