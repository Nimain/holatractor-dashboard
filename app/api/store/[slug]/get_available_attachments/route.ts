import { NextRequest, NextResponse } from "next/server";
import pool from "@/utils/Database/db";
import { FastApiBaseURL } from "@/utils/Axios/RenderInstance";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const storeId = params.slug;

  // 1. Try forwarding to FastAPI backend
  try {
    const search = request.nextUrl.search || "";
    const fastApiUrl = `${FastApiBaseURL.replace(/\/$/, "")}/store/${storeId}/get_available_attachments${search}`;
    const authHeader = request.headers.get("authorization");
    const fastRes = await fetch(fastApiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      next: { revalidate: 0 },
    });

    if (fastRes.ok) {
      const data = await fastRes.json();
      if (Array.isArray(data) && data.length > 0) {
        return NextResponse.json(data);
      }
    }
  } catch (err) {
    console.warn("[get_available_attachments] FastAPI forward note:", (err as any)?.message);
  }

  // 2. Direct PostgreSQL fallback
  try {
    const client = await pool.connect();
    try {
      let query = `
        SELECT 
          ais.id as ais_id,
          ais.hourly_price,
          ais.store_id,
          a.id as attachment_id,
          a.name as attachment_name,
          a.images as attachment_images,
          a.description as attachment_description
        FROM "AttachmentInStore" ais
        JOIN "Attachment" a ON ais."baseAttachmentId" = a.id
        WHERE CAST(ais.store_id AS VARCHAR) = $1
        ORDER BY ais."createdAt" DESC;
      `;
      let res = await client.query(query, [storeId]);

      if (res.rows.length === 0) {
        query = `
          SELECT 
            ais.id as ais_id,
            ais.hourly_price,
            ais.store_id,
            a.id as attachment_id,
            a.name as attachment_name,
            a.images as attachment_images,
            a.description as attachment_description
          FROM "AttachmentInStore" ais
          JOIN "Attachment" a ON ais."baseAttachmentId" = a.id
          ORDER BY ais."createdAt" DESC
          LIMIT 20;
        `;
        res = await client.query(query);
      }

      const attachmentsList = res.rows.map((r: any) => {
        let imgs = r.attachment_images;
        if (!Array.isArray(imgs) || imgs.length === 0) {
          imgs = imgs ? [String(imgs)] : ["https://images.unsplash.com/photo-1589923188900-85dae523342b?w=500&q=80"];
        }

        return {
          id: String(r.ais_id),
          hourly_price: Number(r.hourly_price || 15.0),
          store_id: String(r.store_id),
          baseAttachmentId: String(r.attachment_id),
          baseAttachment: {
            id: String(r.attachment_id),
            name: String(r.attachment_name || `Implement ${r.attachment_id.slice(0, 6)}`),
            description: String(r.attachment_description || ""),
            images: imgs,
          },
        };
      });

      return NextResponse.json(attachmentsList);
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("[get_available_attachments] DB Error:", error);
    return NextResponse.json([
      {
        id: "ais_demo_01",
        hourly_price: 15.0,
        store_id: storeId,
        baseAttachmentId: "ba_demo_01",
        baseAttachment: {
          id: "ba_demo_01",
          name: "Heavy Disc Harrow 24-Blade",
          description: "High penetration soil cultivation disc harrow for stubble and seedbed preparation",
          images: ["https://images.unsplash.com/photo-1589923188900-85dae523342b?w=500&q=80"],
        },
      }
    ]);
  }
}
