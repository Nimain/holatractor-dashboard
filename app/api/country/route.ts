import { NextRequest, NextResponse } from "next/server";
import pool from "@/utils/Database/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT id, name, code, currency_id, "createdAt"
        FROM "Country"
        ORDER BY name ASC;
      `);
      return NextResponse.json(result.rows);
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("[GET /api/country] Error:", error?.message);
    return NextResponse.json([
      { id: "ar", name: "Argentina", code: "AR" },
      { id: "br", name: "Brazil", code: "BR" },
      { id: "py", name: "Paraguay", code: "PY" },
      { id: "uy", name: "Uruguay", code: "UY" },
    ]);
  }
}
