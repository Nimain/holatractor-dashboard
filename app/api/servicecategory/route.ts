import { NextRequest, NextResponse } from "next/server";
import pool from "@/utils/Database/db";

export const dynamic = "force-dynamic";

function generateCuid(): string {
  const timestamp = Date.now().toString(36);
  const randChars =
    Math.random().toString(36).substring(2, 10) +
    Math.random().toString(36).substring(2, 10);
  return `cm${timestamp}${randChars}`.slice(0, 25);
}

export async function GET(req: NextRequest) {
  try {
    const client = await pool.connect();
    try {
      const query = `
        SELECT 
          sc.id,
          sc.name,
          sc.slug,
          sc.image,
          sc.base_id,
          sc."createdAt",
          sc."updatedAt",
          (SELECT count(*)::int FROM "Services" s WHERE s.category_id = sc.id) as service_count
        FROM "Servicecategory" sc
        ORDER BY sc."createdAt" ASC;
      `;
      const result = await client.query(query);

      const categories = result.rows.map((r) => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        image: r.image || "",
        status: 1,
        is_active: true,
        base_id: r.base_id,
        service_count: r.service_count || 0,
        createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : new Date().toISOString(),
      }));

      return NextResponse.json(categories);
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("Error fetching service categories:", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, slug, image } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: "Name and slug are required" }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      const id = generateCuid();
      const baseRow = await client.query('SELECT id FROM "Base" LIMIT 1;');
      const base_id = baseRow.rows[0]?.id || "default_base";

      const insertQuery = `
        INSERT INTO "Servicecategory" (
          id, name, slug, image, base_id, "createdAt", "updatedAt"
        ) VALUES (
          $1, $2, $3, $4, $5, NOW(), NOW()
        ) RETURNING id, name, slug, image, "createdAt", "updatedAt";
      `;

      const res = await client.query(insertQuery, [
        id,
        name.trim(),
        slug.trim().toLowerCase(),
        image || null,
        base_id,
      ]);

      const newCat = res.rows[0];
      return NextResponse.json({
        id: newCat.id,
        name: newCat.name,
        slug: newCat.slug,
        image: newCat.image,
        status: 1,
        createdAt: newCat.createdAt ? new Date(newCat.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: newCat.updatedAt ? new Date(newCat.updatedAt).toISOString() : new Date().toISOString(),
      }, { status: 201 });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("Error creating service category:", error);
    if (error.code === "23505") {
      return NextResponse.json({ error: "A category with this name or slug already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message || "Failed to create category" }, { status: 500 });
  }
}
