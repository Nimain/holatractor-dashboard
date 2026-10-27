import { NextRequest, NextResponse } from "next/server";
import { getBackendBaseUrl } from "@/utils/api/apiUrl";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const campaignId = params.id;
    const body = await request.json();
    const fastApiUrl = getBackendBaseUrl();
    const token = request.headers.get("authorization") || "";
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = token;

    const fastRes = await fetch(`${fastApiUrl}/dealer/marketing/campaigns/${encodeURIComponent(campaignId)}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await fastRes.json().catch(() => ({}));
    return NextResponse.json(data, { status: fastRes.status });
  } catch (error: any) {
    console.error("PATCH /api/dealer/marketing/campaigns/[id] proxy error:", error?.message);
    return NextResponse.json({ success: false, error: error?.message || "Failed to update campaign" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const campaignId = params.id;
    const fastApiUrl = getBackendBaseUrl();
    const token = request.headers.get("authorization") || "";
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = token;

    const fastRes = await fetch(`${fastApiUrl}/dealer/marketing/campaigns/${encodeURIComponent(campaignId)}`, {
      method: "DELETE",
      headers,
      cache: "no-store",
    });

    const data = await fastRes.json().catch(() => ({}));
    return NextResponse.json(data, { status: fastRes.status });
  } catch (error: any) {
    console.error("DELETE /api/dealer/marketing/campaigns/[id] proxy error:", error?.message);
    return NextResponse.json({ success: false, error: error?.message || "Failed to delete campaign" }, { status: 500 });
  }
}
