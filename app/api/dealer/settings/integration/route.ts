import { getBackendBaseUrl } from "@/utils/api/apiUrl";
import { NextRequest, NextResponse } from "next/server";
import pool from "@/utils/Database/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dealerId = searchParams.get("dealer_id") || searchParams.get("dealerId") || "";
    const category = searchParams.get("category") || "";

    // 1. Try FastAPI Backend
    const fastApiUrl = getBackendBaseUrl();
    try {
      const qs = new URLSearchParams();
      if (dealerId) qs.set("dealer_id", dealerId);
      if (category) qs.set("category", category);

      const fastRes = await fetch(`${fastApiUrl}/dealer/integrations${qs.toString() ? `?${qs.toString()}` : ''}`, {
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
      });
      if (fastRes.ok) {
        const data = await fastRes.json();
        return NextResponse.json(data);
      }
    } catch (e) {
      // Fall through to PostgreSQL fallback
    }

    // 2. Direct PostgreSQL fallback
    const client = await pool.connect();
    try {
      let resolvedDealerId = dealerId;
      if (!resolvedDealerId) {
        const dRes = await client.query('SELECT id FROM "Dealer" ORDER BY "createdAt" ASC LIMIT 1');
        if (dRes.rows.length > 0) resolvedDealerId = dRes.rows[0].id;
      }
      const q = `
        SELECT 
          id, dealer_id, provider, name, category, enabled, status,
          account_id, account_name, phone_number,
          api_key, access_token, webhook_url, webhook_secret,
          config, last_synced_at, "createdAt", "updatedAt"
        FROM "DealerIntegration"
        WHERE ($1 = '' OR dealer_id = $1);
      `;
      const res = await client.query(q, [resolvedDealerId || ""]);
      return NextResponse.json({
        success: true,
        dealer_id: resolvedDealerId,
        integrations: res.rows,
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch integrations" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const provider = body.provider?.toLowerCase();
    const dealerId = body.dealer_id || body.dealerId || "";

    if (!provider) {
      return NextResponse.json({ success: false, message: "Provider is required" }, { status: 400 });
    }

    // Forward to FastAPI
    const fastApiUrl = getBackendBaseUrl();
    const fastUrl = dealerId ? `${fastApiUrl}/dealer/integrations/${provider}?dealer_id=${dealerId}` : `${fastApiUrl}/dealer/integrations/${provider}`;
    const fastRes = await fetch(fastUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (fastRes.ok) {
      const data = await fastRes.json();
      return NextResponse.json(data);
    }

    const err = await fastRes.text();
    return NextResponse.json({ success: false, message: err }, { status: fastRes.status });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to save integration" },
      { status: 500 }
    );
  }
}
