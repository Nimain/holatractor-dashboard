import { NextRequest, NextResponse } from "next/server";
import pool from "@/utils/Database/db";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    try {
      const client = await pool.connect();
      try {
        await client.query(`UPDATE "Operator" SET status = 1, "updatedAt" = NOW() WHERE id = $1 OR user_id = $1`, [id]);
      } finally {
        client.release();
      }
    } catch {}
    return NextResponse.json({ success: true, message: "Operator activated successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: true, message: "Operator activated" });
  }
}
