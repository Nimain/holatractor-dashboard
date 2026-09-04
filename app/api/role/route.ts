import { NextRequest, NextResponse } from "next/server";
import pool from "@/utils/Database/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT 
          r.id, 
          r.name, 
          r.image, 
          r."allowedModules", 
          r."createdAt",
          (SELECT count(*)::int FROM "UserProfile" up WHERE up.role_id = r.id) as user_count
        FROM "Role" r
        ORDER BY r."createdAt" ASC;
      `);
      return NextResponse.json(result.rows);
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("[GET /api/role] Error:", error?.message);
    return NextResponse.json({ error: error?.message || "Failed to fetch roles" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, image, allowedModules } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Role name is required" }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      const id = "cm" + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
      const base_id = "cm" + Math.random().toString(36).substring(2, 11);
      
      const insertRes = await client.query(
        `
        INSERT INTO "Role" (id, name, image, base_id, "allowedModules", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5::jsonb, NOW(), NOW())
        RETURNING *;
      `,
        [id, name.trim().toLowerCase(), image || "", base_id, JSON.stringify(allowedModules || [])]
      );

      return NextResponse.json(insertRes.rows[0]);
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("[POST /api/role] Error:", error?.message);
    return NextResponse.json({ error: error?.message || "Failed to create role" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, image, allowedModules } = body;

    if (!id) {
      return NextResponse.json({ error: "Role ID is required" }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      const updateRes = await client.query(
        `
        UPDATE "Role"
        SET 
          name = COALESCE($1, name),
          image = COALESCE($2, image),
          "allowedModules" = CASE WHEN $3::text IS NOT NULL THEN $3::jsonb ELSE "allowedModules" END,
          "updatedAt" = NOW()
        WHERE id = $4
        RETURNING *;
      `,
        [
          name ? name.trim().toLowerCase() : null,
          image !== undefined ? image : null,
          allowedModules !== undefined ? JSON.stringify(allowedModules) : null,
          id,
        ]
      );

      return NextResponse.json(updateRes.rows[0]);
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("[PATCH /api/role] Error:", error?.message);
    return NextResponse.json({ error: error?.message || "Failed to update role" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Role ID is required" }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      await client.query(`DELETE FROM "Role" WHERE id = $1`, [id]);
      return NextResponse.json({ success: true, message: "Deleted" });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("[DELETE /api/role] Error:", error?.message);
    return NextResponse.json({ error: error?.message || "Failed to delete role" }, { status: 500 });
  }
}

