import { getBackendBaseUrl } from "@/utils/api/apiUrl";
import { NextRequest, NextResponse } from "next/server";
import pool from "@/utils/Database/db";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dealerId = searchParams.get("dealer_id") || searchParams.get("dealerId") || "";

    const fastApiUrl = getBackendBaseUrl();

    // 1. Try FastAPI
    try {
      const fastUrl = dealerId ? `${fastApiUrl}/dealer/notifications/mark-all-read?dealer_id=${dealerId}` : `${fastApiUrl}/dealer/notifications/mark-all-read`;
      const fastRes = await fetch(fastUrl, {
        method: "POST",
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
      let resolvedDealerId = dealerId;
      if (!resolvedDealerId) {
        const dRes = await client.query('SELECT id FROM "Dealer" ORDER BY "createdAt" ASC LIMIT 1');
        if (dRes.rows.length > 0) resolvedDealerId = dRes.rows[0].id;
      }
      await client.query(`
        UPDATE "DealerNotification"
        SET is_read = TRUE, updated_at = NOW()
        WHERE ($1 = '' OR dealer_id = $1) AND is_read = FALSE;
      `, [resolvedDealerId || ""]);

      return NextResponse.json({ success: true, message: "All notifications marked as read" });
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error("Mark all read error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
