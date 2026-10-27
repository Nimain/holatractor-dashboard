import { NextRequest, NextResponse } from "next/server";
import { getBackendBaseUrl } from "@/utils/api/apiUrl";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: customerId } = params;
    const fastApiUrl = getBackendBaseUrl();
    const res = await fetch(`${fastApiUrl}/dealer/customers/${customerId}/fleet`, {
      cache: "no-store",
      headers: {
        Authorization: request.headers.get("authorization") || "",
      },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    console.error("[/api/dealer/customers/[id]/fleet] GET proxy error:", error?.message);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch customer fleet" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: customerId } = params;
    const body = await request.json();
    const fastApiUrl = getBackendBaseUrl();

    const res = await fetch(`${fastApiUrl}/dealer/customers/${customerId}/fleet`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: request.headers.get("authorization") || "",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    console.error("[/api/dealer/customers/[id]/fleet] POST proxy error:", error?.message);
    return NextResponse.json(
      { error: error?.message || "Failed to add fleet item" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: customerId } = params;
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("itemId") || searchParams.get("id");

    if (!itemId) {
      return NextResponse.json({ error: "Missing itemId" }, { status: 400 });
    }

    const fastApiUrl = getBackendBaseUrl();
    const res = await fetch(`${fastApiUrl}/dealer/customers/${customerId}/fleet?itemId=${itemId}`, {
      method: "DELETE",
      headers: {
        Authorization: request.headers.get("authorization") || "",
      },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    console.error("[/api/dealer/customers/[id]/fleet] DELETE proxy error:", error?.message);
    return NextResponse.json(
      { error: error?.message || "Failed to delete fleet item" },
      { status: 500 }
    );
  }
}
