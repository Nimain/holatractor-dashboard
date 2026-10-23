import { NextRequest, NextResponse } from "next/server";
import pool from "@/utils/Database/db";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
  try {
    const client = await pool.connect();
    try {
      const res = await client.query(
        'SELECT id FROM "Services" WHERE slug = $1 LIMIT 1;',
        [slug.toLowerCase().trim()]
      );
      const exists = res.rowCount !== null && res.rowCount > 0;
      return NextResponse.json({ available: !exists, exists });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("Error checking service slug:", error);
    return NextResponse.json({ available: true, exists: false });
  }
}
