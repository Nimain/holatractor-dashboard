import { NextRequest, NextResponse } from "next/server";
import pool from "@/utils/Database/db";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { tractorId: string } }
) {
  const { tractorId } = params;

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
          a."updatedAt"
        FROM "Attachment" a
        WHERE $1 = ANY(a."tractorId") OR cardinality(a."tractorId") = 0
        ORDER BY a."createdAt" DESC;
      `,
        [tractorId]
      );

      const formatted = result.rows.map((r) => ({
        id: r.id,
        name: r.name || "Attachment",
        description: r.description || "",
        fixedPrice: Number(r.fixedPrice) || 0,
        fixed_price: Number(r.fixedPrice) || 0,
        images: Array.isArray(r.images) && r.images.length > 0 ? r.images : ["https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?w=800&q=80"],
        tractorId: Array.isArray(r.tractorId) ? r.tractorId : [],
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      }));

      return NextResponse.json(formatted);
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("[GET /api/attachment/AttachmentsWithTractors] Error:", error?.message);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch attachments for tractor" },
      { status: 500 }
    );
  }
}
