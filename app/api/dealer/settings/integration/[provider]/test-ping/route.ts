import { getBackendBaseUrl } from "@/utils/api/apiUrl";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  try {
    const { provider } = params;
    const { searchParams } = new URL(request.url);
    const dealerId = searchParams.get("dealer_id") || searchParams.get("dealerId") || "";

    const fastApiUrl = getBackendBaseUrl();
    const url = dealerId ? `${fastApiUrl}/dealer/integrations/${provider}/test-ping?dealer_id=${dealerId}` : `${fastApiUrl}/dealer/integrations/${provider}/test-ping`;
    const fastRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    const data = await fastRes.json();
    return NextResponse.json(data, { status: fastRes.status });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Test ping failed" },
      { status: 500 }
    );
  }
}
