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
      const result = await client.query(
        `
        SELECT 
          a.id,
          a.name,
          a.description,
          a."fixedPrice" as "fixedPrice",
          a.images,
          a."tractorId",
          a."createdAt",
          a."updatedAt",
          (SELECT count(*)::int FROM "AttachmentInStore" ais WHERE ais."baseAttachmentId" = a.id) as in_store_count,
          (SELECT count(*)::int FROM "AttachmentInDealerStore" aids WHERE aids."baseAttachmentId" = a.id) as in_dealer_store_count,
          (SELECT count(*)::int FROM "BookingStandaloneAttachment" bsa WHERE bsa."attachmentId" = a.id) as booking_count
        FROM "Attachment" a
        WHERE a.id = $1
      `,
        [id]
      );

      if (result.rows.length === 0) {
        return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
      }

      const r = result.rows[0];
      return NextResponse.json({
        id: r.id,
        name: r.name || "Attachment",
        description: r.description || "",
        fixedPrice: Number(r.fixedPrice) || 0,
        fixed_price: Number(r.fixedPrice) || 0,
        images: Array.isArray(r.images) && r.images.length > 0 ? r.images : ["https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?w=800&q=80"],
        tractorId: Array.isArray(r.tractorId) ? r.tractorId : [],
        in_store_count: Number(r.in_store_count) || 0,
        in_dealer_store_count: Number(r.in_dealer_store_count) || 0,
        booking_count: Number(r.booking_count) || 0,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("[GET /api/attachment/[id]] Error:", error?.message);
    return NextResponse.json({ error: error?.message || "Failed to fetch attachment" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  try {
    const body = await req.json();
    const { name, description, fixed_price, fixedPrice, images, tractorId } = body;

    const price = fixedPrice !== undefined ? Number(fixedPrice) : fixed_price !== undefined ? Number(fixed_price) : null;

    const client = await pool.connect();
    try {
      const updateRes = await client.query(
        `
        UPDATE "Attachment"
        SET
          name = COALESCE($1, name),
          description = COALESCE($2, description),
          "fixedPrice" = COALESCE($3, "fixedPrice"),
          images = COALESCE($4, images),
          "tractorId" = COALESCE($5, "tractorId"),
          "updatedAt" = NOW()
        WHERE id = $6
        RETURNING *;
      `,
        [
          name ? name.trim() : null,
          description !== undefined ? description : null,
          price,
          Array.isArray(images) ? images : null,
          Array.isArray(tractorId) ? tractorId : null,
          id,
        ]
      );

      if (updateRes.rows.length === 0) {
        return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
      }

      const r = updateRes.rows[0];
      return NextResponse.json({
        id: r.id,
        name: r.name,
        description: r.description,
        fixedPrice: Number(r.fixedPrice) || 0,
        fixed_price: Number(r.fixedPrice) || 0,
        images: r.images,
        tractorId: r.tractorId,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("[PATCH /api/attachment/[id]] Error:", error?.message);
    return NextResponse.json({ error: error?.message || "Failed to update attachment" }, { status: 500 });
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
      await client.query(`DELETE FROM "Attachment" WHERE id = $1`, [id]);
      return NextResponse.json({ success: true, message: "Deleted" });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("[DELETE /api/attachment/[id]] Error:", error?.message);
    return NextResponse.json({ error: error?.message || "Failed to delete attachment" }, { status: 500 });
  }
}
