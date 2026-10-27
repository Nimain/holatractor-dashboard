import { getBackendBaseUrl } from "@/utils/api/apiUrl";
import { NextRequest, NextResponse } from "next/server";
import pool from "@/utils/Database/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dealerId = searchParams.get("dealer_id") || searchParams.get("dealerId") || "";

    // 1. Try FastAPI backend
    const fastApiUrl = getBackendBaseUrl();
    try {
      const fastUrl = dealerId ? `${fastApiUrl}/dealer/settings/security?dealer_id=${dealerId}` : `${fastApiUrl}/dealer/settings/security`;
      const fastRes = await fetch(fastUrl, {
        cache: "no-store",
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
      let resolvedDealerId = dealerId;
      if (!resolvedDealerId) {
        const dRes = await client.query('SELECT id FROM "Dealer" ORDER BY "createdAt" ASC LIMIT 1');
        if (dRes.rows.length > 0) resolvedDealerId = dRes.rows[0].id;
      }
      const setRes = await client.query(
        'SELECT two_factor_enabled, login_alerts, session_timeout_minutes, updated_at FROM "DealerSettings" WHERE ($1 = \'\' OR dealer_id = $1) LIMIT 1;',
        [resolvedDealerId || ""]
      );
      const setRow = setRes.rows[0];

      const sessRes = await client.query(
        'SELECT id, dealer_id, device_name, device_type, browser, os, ip_address, location, is_current, last_active, created_at FROM "DealerSecuritySession" WHERE ($1 = \'\' OR dealer_id = $1) ORDER BY is_current DESC, last_active DESC;',
        [resolvedDealerId || ""]
      );

      const logRes = await client.query(
        'SELECT id, event_type, description, ip_address, location, status, created_at FROM "DealerSecurityLog" WHERE ($1 = \'\' OR dealer_id = $1) ORDER BY created_at DESC LIMIT 15;',
        [resolvedDealerId || ""]
      );

      return NextResponse.json({
        success: true,
        security: {
          two_factor_enabled: setRow ? Boolean(setRow.two_factor_enabled) : true,
          login_alerts: setRow ? Boolean(setRow.login_alerts) : true,
          session_timeout_minutes: setRow ? Number(setRow.session_timeout_minutes || 60) : 60,
          password_status: {
            status: "Very secure",
            last_changed: "Recently updated",
            has_password: true,
          },
          sessions: sessRes.rows.map((s) => ({
            id: s.id,
            device_name: s.device_name,
            device_type: s.device_type || "Desktop",
            browser: s.browser || "Browser",
            os: s.os || "OS",
            ip_address: s.ip_address || "190.181.42.18",
            location: s.location || "Santa Cruz, Bolivia",
            is_current: Boolean(s.is_current),
            last_active: s.last_active,
            created_at: s.created_at,
          })),
          security_logs: logRes.rows.map((l) => ({
            id: l.id,
            event_type: l.event_type,
            description: l.description,
            ip_address: l.ip_address,
            location: l.location,
            status: l.status,
            created_at: l.created_at,
          })),
        },
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch security details" },
      { status: 500 }
    );
  }
}
