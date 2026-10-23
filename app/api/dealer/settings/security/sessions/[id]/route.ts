import { getBackendBaseUrl } from "@/utils/api/apiUrl";
import { NextRequest, NextResponse } from "next/server";
import pool from "@/utils/Database/db";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const dealerId = searchParams.get("dealer_id") || "cmb7lih4v000ez5ms8nhvegf6";

    // 1. Try FastAPI
    const fastApiUrl = getBackendBaseUrl();
    try {
      const fastRes = await fetch(`${fastApiUrl}/dealer/settings/security/sessions/${id}?dealer_id=${dealerId}`, {
        method: "DELETE",
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
      const row = await client.query(
        'SELECT device_name FROM "DealerSecuritySession" WHERE id = $1 AND dealer_id = $2;',
        [id, dealerId]
      );
      const devName = row.rows[0]?.device_name || "Device";

      await client.query(
        'DELETE FROM "DealerSecuritySession" WHERE id = $1 AND dealer_id = $2;',
        [id, dealerId]
      );

      await client.query(`
        INSERT INTO "DealerSecurityLog" (id, dealer_id, event_type, description, ip_address, location, status, created_at)
        VALUES ($1, $2, 'SESSION_TERMINATED', $3, '190.181.42.18', 'Santa Cruz, Bolivia', 'SUCCESS', NOW());
      `, [`log_${crypto.randomBytes(4).toString("hex")}`, dealerId, `Session for '${devName}' terminated`]);

      return NextResponse.json({
        success: true,
        message: `Session for ${devName} terminated successfully`,
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to terminate session" },
      { status: 500 }
    );
  }
}
