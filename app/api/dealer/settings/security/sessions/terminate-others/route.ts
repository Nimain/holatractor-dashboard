import { getBackendBaseUrl } from "@/utils/api/apiUrl";
import { NextRequest, NextResponse } from "next/server";
import pool from "@/utils/Database/db";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const dealerId = body.dealer_id || "cmb7lih4v000ez5ms8nhvegf6";

    // 1. Try FastAPI
    const fastApiUrl = getBackendBaseUrl();
    try {
      const fastRes = await fetch(`${fastApiUrl}/dealer/settings/security/sessions/terminate-others`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (fastRes.ok) {
        const data = await fastRes.json();
        return NextResponse.json(data);
      }
    } catch (e) {
      // Fallback
    }

    // 2. Direct PostgreSQL fallback
    const client = await pool.connect();
    try {
      const res = await client.query(
        'DELETE FROM "DealerSecuritySession" WHERE dealer_id = $1 AND is_current = FALSE;',
        [dealerId]
      );

      await client.query(`
        INSERT INTO "DealerSecurityLog" (id, dealer_id, event_type, description, ip_address, location, status, created_at)
        VALUES ($1, $2, 'ALL_OTHER_SESSIONS_TERMINATED', 'Administrator signed out of all other active browser and device sessions', '190.181.42.18', 'Santa Cruz, Bolivia', 'SUCCESS', NOW());
      `, [`log_${crypto.randomBytes(4).toString("hex")}`, dealerId]);

      return NextResponse.json({
        success: true,
        message: `Successfully signed out of ${res.rowCount} other device(s)`,
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to terminate other sessions" },
      { status: 500 }
    );
  }
}
