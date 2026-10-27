import { getBackendBaseUrl } from "@/utils/api/apiUrl";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function PUT(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  try {
    const { provider } = params;
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const dealerId = searchParams.get("dealer_id") || searchParams.get("dealerId") || body.dealer_id || body.dealerId || "";

    const fastApiUrl = getBackendBaseUrl();
    const url = dealerId ? `${fastApiUrl}/dealer/integrations/${provider}?dealer_id=${dealerId}` : `${fastApiUrl}/dealer/integrations/${provider}`;
    const fastRes = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await fastRes.json();
    return NextResponse.json(data, { status: fastRes.status });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update integration" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  try {
    const { provider } = params;
    const body = await request.json().catch(() => ({}));
    const { searchParams } = new URL(request.url);
    const dealerId = searchParams.get("dealer_id") || searchParams.get("dealerId") || body.dealer_id || body.dealerId || "";

    const fastApiUrl = getBackendBaseUrl();
    const url = dealerId ? `${fastApiUrl}/dealer/integrations/${provider}/toggle?dealer_id=${dealerId}` : `${fastApiUrl}/dealer/integrations/${provider}/toggle`;
    const fastRes = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await fastRes.json();
    return NextResponse.json(data, { status: fastRes.status });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to toggle integration" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  try {
    const { provider } = params;
    const { searchParams } = new URL(request.url);
    const dealerId = searchParams.get("dealer_id") || searchParams.get("dealerId") || "";

    const fastApiUrl = getBackendBaseUrl();
    const url = dealerId ? `${fastApiUrl}/dealer/integrations/${provider}?dealer_id=${dealerId}` : `${fastApiUrl}/dealer/integrations/${provider}`;
    const fastRes = await fetch(url, {
      method: "DELETE",
    });

    const data = await fastRes.json();
    return NextResponse.json(data, { status: fastRes.status });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to delete integration" },
      { status: 500 }
    );
  }
}
