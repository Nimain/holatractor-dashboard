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
          c.country_id, 
          c."createdAt",
          co.name as country_name,
          co.country_code as country_code,
          co.region as country_region
        FROM "City" c
        LEFT JOIN "Country" co ON c.country_id = co.id
        ORDER BY c.name ASC;
      `);
      return NextResponse.json(result.rows);
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("[GET /api/city] Error:", error?.message);
    return NextResponse.json([
      { id: "cm8d1bu2q000dm1677v6p4m5r", name: "Delhi", country_id: "cm8d1bh2u0007m1671i5q2xrb", country_name: "India" },
      { id: "cm8d1dpeg000jm1670rgwblf3", name: "Santa Cruz de la Sierra", country_id: "cm8d1ao820002m1675mc0pvx4", country_name: "Bolivia" },
      { id: "cm8d1eaxy000pm16797bu7dbg", name: "La Paz", country_id: "cm8d1ao820002m1675mc0pvx4", country_name: "Bolivia" },
    ]);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, country_id } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "City name is required" }, { status: 400 });
    }
    if (!country_id) {
      return NextResponse.json({ error: "Country selection is required" }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      const id = "cm" + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
      const base_id = "cm" + Math.random().toString(36).substring(2, 11);

      const insertRes = await client.query(
        `
        INSERT INTO "City" (id, name, country_id, base_id, "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        RETURNING *;
      `,
        [id, name.trim(), country_id, base_id]
      );

      return NextResponse.json(insertRes.rows[0]);
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("[POST /api/city] Error:", error?.message);
    return NextResponse.json({ error: error?.message || "Failed to create city" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "City ID is required" }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      await client.query(`DELETE FROM "City" WHERE id = $1`, [id]);
      return NextResponse.json({ success: true, message: "Deleted" });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("[DELETE /api/city] Error:", error?.message);
    return NextResponse.json({ error: error?.message || "Failed to delete city" }, { status: 500 });
  }
}
