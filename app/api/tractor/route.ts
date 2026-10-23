import { NextRequest, NextResponse } from "next/server";
import pool from "@/utils/Database/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = (searchParams.get("search") || "").trim().toLowerCase();

    const client = await pool.connect();
    try {
      let query = `
        SELECT 
          t.id,
          t.name,
          t.model,
          t.type,
          t.year,
          t.description,
          t.images,
          (
            SELECT COALESCE(
              json_agg(json_build_object('fixedPrice', COALESCE(inv."fixedPrice", 50))),
              '[{"fixedPrice": 50}]'::json
            )
            FROM "Inventory" inv
            WHERE inv.tractor_id = t.id
          ) as inventory
        FROM "Tractor" t
      `;

      if (search) {
        query += ` WHERE LOWER(t.name) LIKE '%${search}%' OR LOWER(t.model) LIKE '%${search}%'`;
      }

      query += ` ORDER BY t.name ASC LIMIT 100;`;

      const result = await client.query(query);

      const tractors = result.rows.map((r: any) => {
        let imgs = r.images;
        if (!Array.isArray(imgs)) {
          imgs = imgs ? [imgs] : ["https://holadashboard.s3.amazonaws.com/1742226474478-newholland3032.jpg"];
        }
        return {
          id: String(r.id),
          name: String(r.name || "Tractor"),
          model: String(r.model || ""),
          type: String(r.type || "medium"),
          year: r.year ? new Date(r.year).toISOString() : new Date().toISOString(),
          description: String(r.description || ""),
          images: imgs,
          inventory: Array.isArray(r.inventory) && r.inventory.length > 0 ? r.inventory : [{ fixedPrice: 50 }],
        };
      });

      return NextResponse.json(tractors);
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("[/api/tractor] GET error:", error?.message);
    return NextResponse.json({ error: error?.message || "Failed to fetch tractors" }, { status: 500 });
  }
}
