import { getBackendBaseUrl } from "@/utils/api/apiUrl";
import { NextRequest, NextResponse } from "next/server";
import pool from "@/utils/Database/db";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dealerId = searchParams.get("dealer_id") || "cmb7lih4v000ez5ms8nhvegf6";

    const fastApiUrl = getBackendBaseUrl();

    // 1. Try FastAPI
    try {
      const fastRes = await fetch(`${fastApiUrl}/dealer/notifications/mark-all-read?dealer_id=${dealerId}`, {
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
      await client.query(`
        UPDATE "DealerNotification"
        SET is_read = TRUE, updated_at = NOW()
        WHERE dealer_id = $1 AND is_read = FALSE;
      `, [dealerId]);

      return NextResponse.json({ success: true, message: "All notifications marked as read" });
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error("Mark all read error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
