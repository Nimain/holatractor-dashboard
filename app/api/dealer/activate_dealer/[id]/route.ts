import { NextRequest, NextResponse } from "next/server";
import pool from "@/utils/Database/db";
import axios from "axios";

export const dynamic = "force-dynamic";

const FASTAPI_CANDIDATES = [
  "http://127.0.0.1:8000",
  "http://localhost:8000",
  (process.env.NEXT_PUBLIC_TRACTOR_AI_URL || "").replace(/\/$/, ""),
  (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, ""),
  "https://tractorai.sinsignal.com",
].filter(Boolean);

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    // 1. Direct DB Update
    const client = await pool.connect();
    try {
      await client.query(
        `UPDATE "Dealer" SET "Status" = 1, "updatedAt" = NOW() WHERE id = $1 OR user_id = $1`,
        [id]
      );
    } finally {
      client.release();
    }

    // 2. Notify FastAPI if running
    for (const base of FASTAPI_CANDIDATES) {
      try {
        await axios.patch(`${base}/api/v1/admin/dealers/${id}/status`, { status: 1 }, { timeout: 3000 });
        break;
      } catch {}
    }

    return NextResponse.json({ success: true, message: "Dealer activated successfully" });
  } catch (error: any) {
    console.error("[activate_dealer] Error:", error?.message);
    return NextResponse.json({ success: false, message: error?.message || "Failed to activate dealer" }, { status: 500 });
  }
}
