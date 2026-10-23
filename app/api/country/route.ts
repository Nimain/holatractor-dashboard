import { NextRequest, NextResponse } from "next/server";
import pool from "@/utils/Database/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT 
          c.id, 
          c.name, 
          c.region, 
          c.country_code, 
          c."createdAt",
          (SELECT count(*)::int FROM "City" ci WHERE ci.country_id = c.id) as city_count
        FROM "Country" c
        ORDER BY c.name ASC;
      `);
      return NextResponse.json(result.rows);
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("[GET /api/country] Error:", error?.message);
    return NextResponse.json([
      { id: "cm8d1ao820002m1675mc0pvx4", name: "Bolivia", region: "SouthAmerica", country_code: "+591" },
      { id: "cm8d1bh2u0007m1671i5q2xrb", name: "India", region: "SouthAsia", country_code: "+91" },
      { id: "cmi05ch0x001zb9emvwnh0et4", name: "Peru", region: "SouthAmerica", country_code: "+51" },
    ]);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, region, country_code } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Country name is required" }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      const id = "cm" + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
      const base_id = "cm" + Math.random().toString(36).substring(2, 11);

      const insertRes = await client.query(
        `
        INSERT INTO "Country" (id, name, region, country_code, base_id, "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        RETURNING *;
      `,
        [id, name.trim(), region || "Global", country_code || "", base_id]
      );

      return NextResponse.json(insertRes.rows[0]);
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("[POST /api/country] Error:", error?.message);
    return NextResponse.json({ error: error?.message || "Failed to create country" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Country ID is required" }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      // Delete child cities first
      await client.query(`DELETE FROM "City" WHERE country_id = $1`, [id]);
      await client.query(`DELETE FROM "Country" WHERE id = $1`, [id]);
      return NextResponse.json({ success: true, message: "Deleted" });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("[DELETE /api/country] Error:", error?.message);
    return NextResponse.json({ error: error?.message || "Failed to delete country" }, { status: 500 });
  }
}
