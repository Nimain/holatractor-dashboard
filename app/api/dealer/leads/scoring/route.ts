import { getBackendBaseUrl } from "@/utils/api/apiUrl";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dealerId = searchParams.get("dealer_id") || searchParams.get("dealerId") || "cmb7lih4v000ez5ms8nhvegf6";

    const fastApiUrl = getBackendBaseUrl();
    const fastRes = await fetch(`${fastApiUrl}/dealer/leads/scoring?dealer_id=${dealerId}`, {
      cache: "no-store",
    });
    if (fastRes.ok) {
      const data = await fastRes.json();
      return NextResponse.json(data);
    }
    return NextResponse.json({ success: false, error: "Failed to fetch scoring from FastAPI" }, { status: 500 });
  } catch (error: any) {
    console.error("GET /api/dealer/leads/scoring error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
