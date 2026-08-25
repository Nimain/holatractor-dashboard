import { NextRequest, NextResponse } from "next/server";
import pool from "@/utils/Database/db";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    const client = await pool.connect();
    try {
      const query = `
        SELECT 
          inv.id as inv_id,
          inv."fixedPrice" as fixed_price,
          inv.min_price as min_price,
          inv.max_price as max_price,
          inv.city as city,
          inv.tractor_id as tractor_id,
          t.name as tractor_name,
          t.model as tractor_model,
          t.description as tractor_desc,
          t.images as tractor_images,
          t.type as tractor_type,
          t.year as tractor_year
        FROM "Inventory" inv
        LEFT JOIN "Tractor" t ON inv.tractor_id = t.id
        WHERE inv.id = $1
        LIMIT 1;
      `;
      const result = await client.query(query, [id]);
      if (result.rows.length === 0) {
        return NextResponse.json({ error: "Inventory item not found" }, { status: 404 });
      }

      const r = result.rows[0];
      let parsedImgs = r.tractor_images;
      if (!Array.isArray(parsedImgs)) {
        parsedImgs = parsedImgs
          ? [parsedImgs]
          : ["https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?w=900&q=80"];
      }

      return NextResponse.json({
        id: r.inv_id,
        fixedPrice: Number(r.fixed_price) || 50,
        min_price: Number(r.min_price) || 20,
        max_price: Number(r.max_price) || 1000,
        city: r.city || "",
        tractor: {
          id: r.tractor_id,
          name: r.tractor_name || "Tractor",
          images: parsedImgs,
          model: r.tractor_model || "Model",
          description: r.tractor_desc || "",
          type: r.tractor_type || "medium",
          year: r.tractor_year || "",
        },
      });
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error("Fetch single inventory error:", err);
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const findRes = await client.query('SELECT tractor_id FROM "Inventory" WHERE id = $1', [id]);
      if (findRes.rows.length === 0) {
        await client.query("ROLLBACK");
        return NextResponse.json({ error: "Inventory not found" }, { status: 404 });
      }

      const tractorId = findRes.rows[0].tractor_id;
      await client.query('DELETE FROM "Inventory" WHERE id = $1', [id]);
      if (tractorId) {
        await client.query('DELETE FROM "Tractor" WHERE id = $1', [tractorId]);
      }
      await client.query("COMMIT");

      return NextResponse.json({ success: true, message: "Inventory deleted successfully" });
    } catch (dbErr) {
      await client.query("ROLLBACK");
      throw dbErr;
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error("Delete inventory error:", err);
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
