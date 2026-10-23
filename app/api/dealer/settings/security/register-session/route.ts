import { getBackendBaseUrl } from "@/utils/api/apiUrl";
import { NextRequest, NextResponse } from "next/server";
import pool from "@/utils/Database/db";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const dealerId = body.dealer_id || "cmb7lih4v000ez5ms8nhvegf6";

    // 1. Try FastAPI
    const fastApiUrl = getBackendBaseUrl();
    try {
      const fastRes = await fetch(`${fastApiUrl}/dealer/settings/security/register-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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
      const existing = await client.query(`
        SELECT id FROM "DealerSecuritySession"
        WHERE dealer_id = $1 AND browser = $2 AND os = $3 AND is_current = TRUE
        LIMIT 1;
      `, [dealerId, body.browser || "Chrome", body.os || "macOS"]);

      if (existing.rows.length > 0) {
        await client.query(`
          UPDATE "DealerSecuritySession"
          SET last_active = NOW(), ip_address = $1, location = $2
          WHERE id = $3;
        `, [body.ip_address || "190.181.42.18", body.location || "Santa Cruz, Bolivia", existing.rows[0].id]);

        return NextResponse.json({
          success: true,
          session_id: existing.rows[0].id,
          is_current: true,
        });
      }

      const newId = `ses_${crypto.randomBytes(4).toString("hex")}`;
      await client.query(`
        INSERT INTO "DealerSecuritySession" (
          id, dealer_id, device_name, device_type, browser, os, ip_address, location, is_current, last_active, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, TRUE, NOW(), NOW()
        );
      `, [
        newId,
        dealerId,
        body.device_name || "MacBook Pro",
        body.device_type || "Desktop",
        body.browser || "Chrome",
        body.os || "macOS",
        body.ip_address || "190.181.42.18",
        body.location || "Santa Cruz, Bolivia",
      ]);

      return NextResponse.json({
        success: true,
        session_id: newId,
        is_current: true,
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to register session" },
      { status: 500 }
    );
  }
}
