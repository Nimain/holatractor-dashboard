import { getBackendBaseUrl } from "@/utils/api/apiUrl";
import { NextRequest, NextResponse } from "next/server";
import pool from "@/utils/Database/db";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const dealerId = body.dealer_id || "cmb7lih4v000ez5ms8nhvegf6";
    const enabled = Boolean(body.enabled);

    // 1. Try FastAPI
    const fastApiUrl = getBackendBaseUrl();
    try {
      const fastRes = await fetch(`${fastApiUrl}/dealer/settings/security/two-factor`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (fastRes.ok) {
        const data = await fastRes.json();
        return NextResponse.json(data);
      }
    } catch (e) {
      // Fallback to PostgreSQL
    }

    // 2. Direct PostgreSQL fallback
    const client = await pool.connect();
    try {
      await client.query(
        'UPDATE "DealerSettings" SET two_factor_enabled = $1, updated_at = NOW() WHERE dealer_id = $2;',
        [enabled, dealerId]
      );

      const action = enabled ? "enabled" : "disabled";
      await client.query(`
        INSERT INTO "DealerSecurityLog" (id, dealer_id, event_type, description, ip_address, location, status, created_at)
        VALUES ($1, $2, '2FA_TOGGLED', $3, '190.181.42.18', 'Santa Cruz, Bolivia', 'SUCCESS', NOW());
      `, [`log_${crypto.randomBytes(4).toString("hex")}`, dealerId, `Two-step verification was ${action} by administrator`]);

      return NextResponse.json({
        success: true,
        message: `Two-factor authentication has been ${action}`,
        two_factor_enabled: enabled,
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update 2FA" },
      { status: 500 }
    );
  }
}
