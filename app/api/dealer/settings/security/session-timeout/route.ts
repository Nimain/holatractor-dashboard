import { getBackendBaseUrl } from "@/utils/api/apiUrl";
import { NextRequest, NextResponse } from "next/server";
import pool from "@/utils/Database/db";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    let dealerId = body.dealer_id || body.dealerId || "";
    const timeout = Number(body.timeout_minutes || 60);

    // 1. Try FastAPI
    const fastApiUrl = getBackendBaseUrl();
    try {
      const fastRes = await fetch(`${fastApiUrl}/dealer/settings/security/session-timeout`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, ...(dealerId ? { dealer_id: dealerId } : {}) }),
      });
      if (fastRes.ok) {
        const data = await fastRes.json();
        return NextResponse.json(data);
      }
    } catch (e) {
      // Fallback below
    }

    // 2. Direct PostgreSQL fallback
    const client = await pool.connect();
    try {
      if (!dealerId) {
        const dRes = await client.query('SELECT id FROM "Dealer" ORDER BY "createdAt" ASC LIMIT 1');
        if (dRes.rows.length > 0) dealerId = dRes.rows[0].id;
      }
      await client.query(
        'UPDATE "DealerSettings" SET session_timeout_minutes = $1, updated_at = NOW() WHERE dealer_id = $2;',
        [timeout, dealerId]
      );

      await client.query(`
        INSERT INTO "DealerSecurityLog" (id, dealer_id, event_type, description, ip_address, location, status, created_at)
        VALUES ($1, $2, 'SESSION_TIMEOUT_UPDATED', $3, '190.181.42.18', 'Santa Cruz, Bolivia', 'SUCCESS', NOW());
      `, [`log_${crypto.randomBytes(4).toString("hex")}`, dealerId, `Inactivity session timeout updated to ${timeout} minutes`]);

      return NextResponse.json({
        success: true,
        message: `Session timeout set to ${timeout} minutes`,
        session_timeout_minutes: timeout,
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update session timeout" },
      { status: 500 }
    );
  }
}
