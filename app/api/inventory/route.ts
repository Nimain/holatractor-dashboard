import { NextRequest, NextResponse } from "next/server";
import pool from "@/utils/Database/db";
import axios from "axios";

export const dynamic = "force-dynamic";

function generateCuid(): string {
  const timestamp = Date.now().toString(36);
  const randChars =
    Math.random().toString(36).substring(2, 10) +
    Math.random().toString(36).substring(2, 10);
  return `c${timestamp}${randChars}`.slice(0, 25);
}

export async function GET(req: NextRequest) {
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
        ORDER BY inv."createdAt" DESC
        LIMIT 100;
      `;
      const result = await client.query(query);

      const inventoryList = result.rows.map((r) => {
        let parsedImgs = r.tractor_images;
        if (!Array.isArray(parsedImgs)) {
          parsedImgs = parsedImgs
            ? [parsedImgs]
            : ["https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?w=900&q=80"];
        }
        return {
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
        };
      });

      return NextResponse.json(inventoryList);
    } finally {
      client.release();
    }
  } catch (dbErr: any) {
    console.error("Direct DB fetch error:", dbErr?.message);
    // Fallback to NestJS / FastAPI
    try {
      const nestRes = await axios.get(
        "https://holatractor-backend-render.onrender.com/inventory",
        { timeout: 5000 }
      );
      return NextResponse.json(nestRes.data);
    } catch (e: any) {
      return NextResponse.json({ error: "Failed to load inventory" }, { status: 500 });
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const tractor_name = body.tractor_name || body.name || "HolaTractor Model";
    const tractor_model = body.tractor_model || body.model || "Standard";
    const tractor_desc = body.tractor_description || body.description || "";
    let tractor_type = (body.tractor_type || body.type || "medium").toLowerCase();
    if (!["small", "medium", "large"].includes(tractor_type)) {
      tractor_type = "medium";
    }

    let tractor_images = body.tractor_images || body.images || [];
    if (typeof tractor_images === "string") {
      tractor_images = [tractor_images];
    } else if (!Array.isArray(tractor_images) || tractor_images.length === 0) {
      tractor_images = ["https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?w=900&q=80"];
    }

    const city = body.city || "Buenos Aires";
    const fixed_price = Number(body.fixed_price || body.fixedPrice) || 50;
    const min_price = Number(body.min_price) || 20;
    const max_price = Number(body.max_price) || 1000;

    const creator_id = "cm8czs7az0006ai057wi3qob8";
    const t_id = generateCuid();
    const t_base_id = generateCuid();
    const inv_id = generateCuid();
    const inv_base_id = generateCuid();

    let tractor_year = null;
    if (body.tractor_year) {
      try {
        tractor_year = new Date(body.tractor_year);
      } catch (e) {
        tractor_year = null;
      }
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      await client.query(
        `
        INSERT INTO "Tractor" (
          id, base_id, created_by, name, model, description, images, type, year, "createdAt", "updatedAt"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8::"TractorType", $9, NOW(), NOW()
        )
      `,
        [
          t_id,
          t_base_id,
          creator_id,
          tractor_name,
          tractor_model,
          tractor_desc,
          tractor_images,
          tractor_type,
          tractor_year,
        ]
      );

      await client.query(
        `
        INSERT INTO "Inventory" (
          id, base_id, created_by, tractor_id, "fixedPrice", min_price, max_price, city, "createdAt", "updatedAt"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()
        )
      `,
        [
          inv_id,
          inv_base_id,
          creator_id,
          t_id,
          fixed_price,
          min_price,
          max_price,
          city,
        ]
      );

      await client.query("COMMIT");

      return NextResponse.json(
        {
          success: true,
          id: inv_id,
          message: "Inventory created successfully",
          data: {
            id: inv_id,
            fixedPrice: fixed_price,
            min_price: min_price,
            max_price: max_price,
            city: city,
            tractor: {
              id: t_id,
              name: tractor_name,
              model: tractor_model,
              description: tractor_desc,
              images: tractor_images,
              type: tractor_type,
            },
          },
        },
        { status: 201 }
      );
    } catch (dbErr: any) {
      await client.query("ROLLBACK");
      console.error("Direct DB create error:", dbErr?.message);
      return NextResponse.json(
        { error: dbErr?.message || "Database insert error" },
        { status: 500 }
      );
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error("Payload parse error:", err);
    return NextResponse.json(
      { error: err?.message || "Invalid payload" },
      { status: 400 }
    );
  }
}
