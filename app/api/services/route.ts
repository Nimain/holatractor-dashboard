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
  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get("category_id") || searchParams.get("categoryId");

  try {
    const client = await pool.connect();
    try {
      let query = `
        SELECT 
          s.id,
          s.name,
          s.description,
          s.slug,
          s.price,
          s.image,
          s.base_id,
          s.category_id,
          s."createdAt",
          s."updatedAt",
          sc.id as cat_id,
          sc.name as cat_name,
          sc.slug as cat_slug,
          sc.image as cat_image
        FROM "Services" s
        LEFT JOIN "Servicecategory" sc ON sc.id = s.category_id
        WHERE 1=1
      `;
      const params: any[] = [];

      if (categoryId) {
        params.push(categoryId);
        query += ` AND s.category_id = $${params.length}`;
      }

      query += ` ORDER BY s."createdAt" ASC;`;

      const result = await client.query(query, params);

      const services = result.rows.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        slug: r.slug,
        price: r.price,
        image: r.image,
        base_id: r.base_id,
        category_id: r.category_id,
        createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : new Date().toISOString(),
        category: r.cat_id || r.category_id ? {
          id: r.cat_id || r.category_id,
          name: r.cat_name || "General Agriculture",
          slug: r.cat_slug || "general",
          image: r.cat_image || "",
        } : null,
      }));

      return NextResponse.json(services);
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("Error fetching services from DB:", error);
    return NextResponse.json({ error: "Failed to fetch services" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, slug, description, price, category_id, image } = body;

    if (!name || !slug || !description || !price || !category_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      const id = generateCuid();
      const baseRow = await client.query('SELECT id FROM "Base" LIMIT 1;');
      const base_id = baseRow.rows[0]?.id || "default_base";

      const insertQuery = `
        INSERT INTO "Services" (
          id, name, description, slug, price, image, category_id, base_id, "createdAt", "updatedAt"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()
        ) RETURNING id, name, description, slug, price, image, category_id, base_id, "createdAt", "updatedAt";
      `;

      const res = await client.query(insertQuery, [
        id,
        name.trim(),
        description.trim(),
        slug.trim().toLowerCase(),
        price.toString().replace("$", "").trim(),
        image || "",
        category_id,
        base_id,
      ]);

      const newService = res.rows[0];

      // Fetch category info
      const catRes = await client.query('SELECT id, name, slug, image FROM "Servicecategory" WHERE id = $1;', [category_id]);
      const cat = catRes.rows[0];

      return NextResponse.json({
        id: newService.id,
        name: newService.name,
        description: newService.description,
        slug: newService.slug,
        price: newService.price,
        image: newService.image,
        category_id: newService.category_id,
        createdAt: newService.createdAt ? new Date(newService.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: newService.updatedAt ? new Date(newService.updatedAt).toISOString() : new Date().toISOString(),
        category: cat ? {
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          image: cat.image || "",
        } : null,
      }, { status: 201 });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("Error creating service in DB:", error);
    if (error.code === "23505") {
      return NextResponse.json({ error: "A service with this name or slug already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message || "Failed to create service" }, { status: 500 });
  }
}
