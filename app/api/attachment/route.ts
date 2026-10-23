import { NextRequest, NextResponse } from "next/server";
import pool from "@/utils/Database/db";
import axios from "axios";

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
  const search = searchParams.get("search");
  const tractorId = searchParams.get("tractorId");

  try {
    const client = await pool.connect();
    try {
      let query = `
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
        WHERE 1=1
      `;
      const params: any[] = [];

      if (search) {
        params.push(`%${search}%`);
        query += ` AND (a.name ILIKE $${params.length} OR a.description ILIKE $${params.length})`;
      }

      if (tractorId) {
        params.push(tractorId);
        query += ` AND ($${params.length} = ANY(a."tractorId") OR cardinality(a."tractorId") = 0)`;
      }

      query += ` ORDER BY a."createdAt" DESC;`;

      const result = await client.query(query, params);

      const formatted = result.rows.map((r) => {
        let imgs = r.images;
        if (!Array.isArray(imgs)) {
          imgs = imgs ? [imgs] : [];
        }
        if (imgs.length === 0) {
          imgs = ["https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?w=800&q=80"];
        }

        return {
          id: r.id,
          name: r.name || "Attachment",
          description: r.description || "",
          fixedPrice: Number(r.fixedPrice) || 0,
          fixed_price: Number(r.fixedPrice) || 0,
          images: imgs,
          tractorId: Array.isArray(r.tractorId) ? r.tractorId : [],
          in_store_count: Number(r.in_store_count) || 0,
          in_dealer_store_count: Number(r.in_dealer_store_count) || 0,
          booking_count: Number(r.booking_count) || 0,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        };
      });

      return NextResponse.json(formatted);
    } finally {
      client.release();
    }
  } catch (dbErr: any) {
    console.error("[GET /api/attachment] DB error:", dbErr?.message);

    // Fast API Fallback
    try {
      const fastApiUrl =
        process.env.NEXT_PUBLIC_TRACTOR_AI_URL ||
        process.env.NEXT_PUBLIC_API_URL ||
        "https://tractorai.sinsignal.com/";
      const fastRes = await axios.get(
        `${fastApiUrl.replace(/\/$/, "")}/attachment`,
        { timeout: 5000 }
      );
      if (Array.isArray(fastRes.data)) {
        return NextResponse.json(fastRes.data);
      }
    } catch (e: any) {
      console.warn("[GET /api/attachment] FastAPI fallback notice:", e?.message);
    }

    return NextResponse.json(
      { error: dbErr?.message || "Failed to fetch attachments" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description, fixed_price, fixedPrice, images, tractorId } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Attachment name is required" }, { status: 400 });
    }

    const price = Number(fixedPrice ?? fixed_price ?? 0);
    const parsedImages = Array.isArray(images)
      ? images
      : images
      ? [images]
      : ["https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?w=800&q=80"];

    const id = generateCuid();
    const base_id = generateCuid();

    const client = await pool.connect();
    try {
      const insertRes = await client.query(
        `
        INSERT INTO "Attachment" (
          id, base_id, name, description, "fixedPrice", images, "tractorId", "createdAt", "updatedAt"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, NOW(), NOW()
        )
        RETURNING *;
      `,
        [
          id,
          base_id,
          name.trim(),
          description || "",
          price,
          parsedImages,
          Array.isArray(tractorId) ? tractorId : tractorId ? [tractorId] : [],
        ]
      );

      const r = insertRes.rows[0];
      return NextResponse.json(
        {
          id: r.id,
          name: r.name,
          description: r.description,
          fixedPrice: Number(r.fixedPrice) || 0,
          fixed_price: Number(r.fixedPrice) || 0,
          images: r.images,
          tractorId: r.tractorId,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        },
        { status: 201 }
      );
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("[POST /api/attachment] Error:", error?.message);
    return NextResponse.json(
      { error: error?.message || "Failed to create attachment" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, description, fixed_price, fixedPrice, images, tractorId } = body;

    if (!id) {
      return NextResponse.json({ error: "Attachment ID is required" }, { status: 400 });
    }

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
    console.error("[PATCH /api/attachment] Error:", error?.message);
    return NextResponse.json(
      { error: error?.message || "Failed to update attachment" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Attachment ID is required" }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      await client.query(`DELETE FROM "Attachment" WHERE id = $1`, [id]);
      return NextResponse.json({ success: true, message: "Attachment deleted" });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("[DELETE /api/attachment] Error:", error?.message);
    return NextResponse.json(
      { error: error?.message || "Failed to delete attachment" },
      { status: 500 }
    );
  }
}
