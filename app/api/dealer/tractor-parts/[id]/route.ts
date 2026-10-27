import { NextRequest, NextResponse } from "next/server";
import { getBackendBaseUrl } from "@/utils/api/apiUrl";

export const dynamic = "force-dynamic";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return handleForward(request, params.id, "PUT");
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return handleForward(request, params.id, "PATCH");
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return handleForward(request, params.id, "DELETE");
}

async function handleForward(request: NextRequest, id: string, method: string) {
  try {
    const fastApiUrl = getBackendBaseUrl();
    const token = request.headers.get("authorization") || "";
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = token;

    const body = method !== "DELETE" ? await request.text() : undefined;

    const fastRes = await fetch(`${fastApiUrl}/dealer/tractor-parts/${encodeURIComponent(id)}`, {
      method,
      headers,
      body: body && body.trim() ? body : undefined,
      cache: "no-store",
    });

    const data = await fastRes.json().catch(() => ({}));
    return NextResponse.json(data, { status: fastRes.status });
  } catch (error: any) {
    console.error(`${method} /api/dealer/tractor-parts/[id] proxy error:`, error?.message);
    return NextResponse.json({ success: false, error: error?.message || "Proxy request failed" }, { status: 500 });
  }
}
