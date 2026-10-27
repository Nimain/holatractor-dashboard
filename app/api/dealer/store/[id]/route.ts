import { NextRequest, NextResponse } from "next/server";
import { getBackendBaseUrl } from "@/utils/api/apiUrl";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const storeId = params?.id;
    if (!storeId) {
      return NextResponse.json({ message: "Store ID is required" }, { status: 400 });
    }

    const fastApiUrl = getBackendBaseUrl();
    const token = request.headers.get("authorization") || "";
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = token;

    const fastRes = await fetch(`${fastApiUrl}/dealer/store/${encodeURIComponent(storeId)}`, {
      headers,
      cache: "no-store",
    });

    const data = await fastRes.json().catch(() => ({}));
    return NextResponse.json(data, { status: fastRes.status });
  } catch (error: any) {
    console.error("[/api/dealer/store/[id]] Proxy error:", error?.message);
    return NextResponse.json({ error: error?.message || "Failed to fetch store" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const storeId = params?.id;
    if (!storeId) {
      return NextResponse.json({ message: "Store ID is required" }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const fastApiUrl = getBackendBaseUrl();
    const token = request.headers.get("authorization") || "";
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = token;

    const fastRes = await fetch(`${fastApiUrl}/dealer/store/${encodeURIComponent(storeId)}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await fastRes.json().catch(() => ({}));
    return NextResponse.json(data, { status: fastRes.status });
  } catch (error: any) {
    console.error("[/api/dealer/store/[id]] PUT Proxy error:", error?.message);
    return NextResponse.json({ error: error?.message || "Failed to update store" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const storeId = params?.id;
    if (!storeId) {
      return NextResponse.json({ message: "Store ID is required" }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const fastApiUrl = getBackendBaseUrl();
    const token = request.headers.get("authorization") || "";
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = token;

    const fastRes = await fetch(`${fastApiUrl}/dealer/store/${encodeURIComponent(storeId)}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await fastRes.json().catch(() => ({}));
    return NextResponse.json(data, { status: fastRes.status });
  } catch (error: any) {
    console.error("[/api/dealer/store/[id]] PATCH Proxy error:", error?.message);
    return NextResponse.json({ error: error?.message || "Failed to update store" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const storeId = params?.id;
    if (!storeId) {
      return NextResponse.json({ message: "Store ID is required" }, { status: 400 });
    }

    const fastApiUrl = getBackendBaseUrl();
    const token = request.headers.get("authorization") || "";
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = token;

    const fastRes = await fetch(`${fastApiUrl}/dealer/store/${encodeURIComponent(storeId)}`, {
      method: "DELETE",
      headers,
      cache: "no-store",
    });

    const data = await fastRes.json().catch(() => ({}));
    return NextResponse.json(data, { status: fastRes.status });
  } catch (error: any) {
    console.error("[/api/dealer/store/[id]] DELETE Proxy error:", error?.message);
    return NextResponse.json({ error: error?.message || "Failed to delete store" }, { status: 500 });
  }
}
