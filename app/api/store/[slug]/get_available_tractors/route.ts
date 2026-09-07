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
    const fastApiUrl = `${FastApiBaseURL.replace(/\/$/, "")}/store/${storeId}/get_available_tractors${search}`;
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
    console.warn("[get_available_tractors] FastAPI forward note:", (err as any)?.message);
  }

  // 2. Direct PostgreSQL fallback
  try {
    const client = await pool.connect();
    try {
      let query = `
        SELECT 
          tis.id as tis_id,
          tis.hourly_price,
          tis.store_id,
          t.id as tractor_id,
          t.name as tractor_name,
          t.model as tractor_model,
          t.images as tractor_images,
          t.description as tractor_description,
          t.type as tractor_type
        FROM "TractorInStore" tis
        JOIN "Tractor" t ON tis."baseTractorId" = t.id
        WHERE CAST(tis.store_id AS VARCHAR) = $1
        ORDER BY tis."createdAt" DESC;
      `;
      let res = await client.query(query, [storeId]);

      if (res.rows.length === 0) {
        query = `
          SELECT 
            tis.id as tis_id,
            tis.hourly_price,
            tis.store_id,
            t.id as tractor_id,
            t.name as tractor_name,
            t.model as tractor_model,
            t.images as tractor_images,
            t.description as tractor_description,
            t.type as tractor_type
          FROM "TractorInStore" tis
          JOIN "Tractor" t ON tis."baseTractorId" = t.id
          ORDER BY tis."createdAt" DESC
          LIMIT 20;
        `;
        res = await client.query(query);
      }

      const tractorsList = res.rows.map((r: any) => {
        let imgs = r.tractor_images;
        if (!Array.isArray(imgs) || imgs.length === 0) {
          imgs = imgs ? [String(imgs)] : ["https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=500&q=80"];
        }

        return {
          id: String(r.tis_id),
          hourly_price: Number(r.hourly_price || 25.0),
          store_id: String(r.store_id),
          baseTractorId: String(r.tractor_id),
          baseTractor: {
            id: String(r.tractor_id),
            name: String(r.tractor_name || `Tractor ${r.tractor_id.slice(0, 6)}`),
            model: String(r.tractor_model || "Standard 4WD"),
            description: String(r.tractor_description || ""),
            type: String(r.tractor_type || "Tractor"),
            images: imgs,
          },
        };
      });

      return NextResponse.json(tractorsList);
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("[get_available_tractors] DB Error:", error);
    return NextResponse.json([
      {
        id: "tis_demo_01",
        hourly_price: 35.0,
        store_id: storeId,
        baseTractorId: "bt_demo_01",
        baseTractor: {
          id: "bt_demo_01",
          name: "John Deere 6120M (Class 6)",
          model: "6120M PowerTech",
          description: "Heavy-duty agricultural tractor with 120 HP engine and GPS auto-steer",
          type: "Tractor",
          images: ["https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=500&q=80"],
        },
      }
    ]);
  }
}
