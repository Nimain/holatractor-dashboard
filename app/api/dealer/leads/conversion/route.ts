import { getBackendBaseUrl } from "@/utils/api/apiUrl";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dealerId = searchParams.get("dealer_id") || searchParams.get("dealerId") || "";
    const period = searchParams.get("period") || "30D";

    const fastApiUrl = getBackendBaseUrl();
    try {
      const q = new URLSearchParams({ period });
      if (dealerId && dealerId !== "all" && dealerId !== "undefined") {
        q.set("dealer_id", dealerId);
      }
      const fastRes = await fetch(`${fastApiUrl}/dealer/leads/conversion?${q.toString()}`, {
        cache: "no-store",
      });
      if (fastRes.ok) {
        const data = await fastRes.json();
        return NextResponse.json(data);
      }
      if (!fastRes.ok) {
        return NextResponse.json(
          { success: false, error: `FastAPI responded with status ${fastRes.status}` },
          { status: fastRes.status }
        );
      }
    } catch (e: any) {
      return NextResponse.json(
        { success: false, error: `FastAPI connection error: ${e.message}` },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Conversion data unavailable" },
      { status: 404 }
    );
  } catch (error: any) {
    console.error("GET /api/dealer/leads/conversion error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
