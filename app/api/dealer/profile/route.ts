import { getBackendBaseUrl } from "@/utils/api/apiUrl";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dealerId = searchParams.get("dealer_id") || searchParams.get("dealerId") || "";
    const userId = searchParams.get("user_id") || searchParams.get("userId") || "";
    const email = searchParams.get("email") || "";

    const fastApiUrl = getBackendBaseUrl();

    const url = new URL(`${fastApiUrl}/dealer/profile`);
    if (dealerId) url.searchParams.set("dealer_id", dealerId);
    if (userId) url.searchParams.set("user_id", userId);
    if (email) url.searchParams.set("email", email);

    const fastRes = await fetch(url.toString(), { cache: "no-store" });
    if (fastRes.ok) {
      const data = await fastRes.json();
      return NextResponse.json(data);
    }

    return NextResponse.json(
      { error: "Failed to fetch profile from FastAPI" },
      { status: fastRes.status }
    );
  } catch (err: any) {
    console.error("GET /api/dealer/profile error:", err);
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const fastApiUrl = getBackendBaseUrl();

    const fastRes = await fetch(`${fastApiUrl}/dealer/profile`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (fastRes.ok) {
      const data = await fastRes.json();
      return NextResponse.json(data);
    }

    const errData = await fastRes.json().catch(() => ({}));
    return NextResponse.json(
      { error: errData.detail || "Failed to update profile via FastAPI" },
      { status: fastRes.status }
    );
  } catch (err: any) {
    console.error("PUT /api/dealer/profile error:", err);
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  return PUT(request);
}
