import { getBackendBaseUrl } from "@/utils/api/apiUrl";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const fastApiUrl = getBackendBaseUrl();
    const token = request.headers.get("authorization") || "";
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = token;

    const fastRes = await fetch(`${fastApiUrl}/dealer/marketing/workflows/ai-inference`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await fastRes.json().catch(() => ({}));
    return NextResponse.json(data, { status: fastRes.status });
  } catch (error: any) {
    console.error("POST /api/dealer/marketing/workflows/ai-inference error:", error?.message);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to execute AI inference" },
      { status: 500 }
    );
  }
}
