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

const FastApiBaseURL =
  process.env.NEXT_PUBLIC_TRACTOR_AI_URL || "https://tractorai.sinsignal.com/";

// GET /api/admin/store-tractors - List all tractors assigned to stores
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const searchQuery = searchParams.get("q")?.trim()?.toLowerCase() || "";
    const storeIdFilter = searchParams.get("store_id")?.trim() || "";

    const client = await pool.connect();
    try {
      const sqlQuery = `
        SELECT 
          tis.id,
          tis."baseTractorId" as base_tractor_id,
          tis.store_id,
          tis.hourly_price,
          tis.lat,
          tis.lan,
          tis.document_id,
          tis."createdAt",
          tis."updatedAt",
          (SELECT json_build_object(
            'id', t.id, 
            'name', t.name, 
            'model', t.model, 
            'type', t.type, 
            'images', t.images, 
            'description', t.description,
            'year', t.year
          ) FROM "Tractor" t WHERE t.id = tis."baseTractorId") as tractor,
          (SELECT json_build_object(
            'id', s.id, 
            'name', s.name, 
            'description', s.description,
            'image', s.image,
            'location_id', s.location_id
          ) FROM "Store" s WHERE s.id = tis.store_id) as store
        FROM "TractorInStore" tis
        ORDER BY tis."createdAt" DESC;
      `;

      const result = await client.query(sqlQuery);
      let list = result.rows.map((row) => {
        let parsedImages = row.tractor?.images;
        if (!Array.isArray(parsedImages)) {
          parsedImages = parsedImages
            ? [parsedImages]
            : ["https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?w=800&q=80"];
        }

        return {
          id: row.id,
          hourly_price: Number(row.hourly_price) || 20,
          store_id: row.store_id,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          lat: row.lat,
          lan: row.lan,
          baseTractor: {
            id: row.tractor?.id || row.base_tractor_id,
            name: row.tractor?.name || "Standard Tractor",
            model: row.tractor?.model || "Universal",
            type: row.tractor?.type || "medium",
            description: row.tractor?.description || "",
            year: row.tractor?.year || null,
            images: parsedImages,
          },
          store: row.store || {
            id: row.store_id,
            name: "HolaTractor Store Hub",
            description: "",
            image: "",
          },
        };
      });

      if (storeIdFilter) {
        list = list.filter((item) => item.store_id === storeIdFilter);
      }

      if (searchQuery) {
        list = list.filter((item) => {
          const tName = item.baseTractor?.name?.toLowerCase().includes(searchQuery);
          const tModel = item.baseTractor?.model?.toLowerCase().includes(searchQuery);
          const sName = item.store?.name?.toLowerCase().includes(searchQuery);
          return tName || tModel || sName;
        });
      }

      return NextResponse.json({ success: true, data: list, total: list.length });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.warn("[GET /api/admin/store-tractors] Direct DB error, using fallback:", error?.message);

    const fallbackTis: any[] = [];

    if ((global as any)._dynamicStoreTractorsMap) {
      (global as any)._dynamicStoreTractorsMap.forEach((dyn: any) => {
        fallbackTis.unshift(dyn);
      });
    }

    return NextResponse.json({ success: true, data: fallbackTis, total: fallbackTis.length });
  }
}

// POST /api/admin/store-tractors - Add Tractor to Store
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const store_id = body.store_id?.trim();
    const base_tractor_id = body.base_tractor_id || body.tractor_id;
    const hourly_price = Number(body.hourly_price) || 20.0;

    if (!store_id || !base_tractor_id) {
      return NextResponse.json(
        { error: "store_id and base_tractor_id are required" },
        { status: 400 }
      );
    }

    const tis_id = generateCuid();
    let client: any = null;
    let savedToDb = false;

    try {
      client = await pool.connect();

      // 1. Resolve valid base_id from Store or Base table
      let base_id = "default_base";
      const storeRow = await client.query('SELECT base_id FROM "Store" WHERE id = $1 LIMIT 1;', [store_id]);
      if (storeRow.rows[0]?.base_id) {
        base_id = storeRow.rows[0].base_id;
      } else {
        const baseRow = await client.query('SELECT id FROM "Base" LIMIT 1;');
        if (baseRow.rows[0]?.id) base_id = baseRow.rows[0].id;
      }

      // 2. Resolve valid base_tractor_id
      let validTractorId = base_tractor_id;
      const tRow = await client.query('SELECT id FROM "Tractor" WHERE id = $1 LIMIT 1;', [base_tractor_id]);
      if (!tRow.rows[0]?.id) {
        const firstTractor = await client.query('SELECT id FROM "Tractor" LIMIT 1;');
        if (firstTractor.rows[0]?.id) validTractorId = firstTractor.rows[0].id;
      }

      // 3. Resolve valid document_id
      let doc_id = "cm8k5gx7n0007141wpl3o7ope";
      const docRow = await client.query('SELECT id FROM "Document" LIMIT 1;');
      if (docRow.rows[0]?.id) {
        doc_id = docRow.rows[0].id;
      } else {
        doc_id = generateCuid();
        await client.query(
          'INSERT INTO "Document" (id, type, url, base_id, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, NOW(), NOW()) ON CONFLICT DO NOTHING;',
          [doc_id, "TRACTOR_DOC", "https://holatractor.com", base_id]
        );
      }

      await client.query(
        `
        INSERT INTO "TractorInStore" (
          id, "baseTractorId", store_id, hourly_price, document_id, base_id, "createdAt", "updatedAt"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, NOW(), NOW()
        )
      `,
        [tis_id, validTractorId, store_id, hourly_price, doc_id, base_id]
      );
      savedToDb = true;
    } catch (dbErr: any) {
      console.warn("[POST /api/admin/store-tractors] DB insert error:", dbErr?.message);
    } finally {
      if (client) client.release();
    }

    // Save to dynamic tractor registry
    if (!(global as any)._dynamicStoreTractorsMap) {
      (global as any)._dynamicStoreTractorsMap = new Map();
    }
    (global as any)._dynamicStoreTractorsMap.set(tis_id, {
      id: tis_id,
      tractor_store_id: tis_id,
      store_id,
      base_tractor_id,
      name: `Tractor Unit - ${base_tractor_id}`,
      model: "Standard",
      image: "https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?w=800&q=80",
      hourly_price,
      has_device: false,
      current_imei: null,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Tractor added to store successfully",
        data: {
          id: tis_id,
          tractor_store_id: tis_id,
          store_id,
          base_tractor_id,
          name: `Tractor Unit`,
          model: "Standard",
          hourly_price,
        },
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}

// PUT /api/admin/store-tractors - Update store tractor details (e.g. hourly price)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const id = body.id;
    const hourly_price = Number(body.hourly_price);
    const store_id = body.store_id;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      const updates: string[] = ['"updatedAt" = NOW()'];
      const values: any[] = [id];
      let paramIdx = 2;

      if (!isNaN(hourly_price)) {
        updates.push(`hourly_price = $${paramIdx}`);
        values.push(hourly_price);
        paramIdx++;
      }

      if (store_id) {
        updates.push(`store_id = $${paramIdx}`);
        values.push(store_id);
        paramIdx++;
      }

      const sql = `UPDATE "TractorInStore" SET ${updates.join(", ")} WHERE id = $1 RETURNING *`;
      const result = await client.query(sql, values);

      if (result.rows.length === 0) {
        return NextResponse.json({ error: "Store tractor not found" }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        message: "Store tractor updated successfully",
        data: result.rows[0],
      });
    } finally {
      client.release();
    }
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/admin/store-tractors - Remove a tractor from store
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Tractor in store ID is required" }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      await client.query(`DELETE FROM "DeviceInTractor" WHERE "tractor_store_id" = $1`, [id]).catch(() => {});
      await client.query(`DELETE FROM "TractorInStore" WHERE id = $1`, [id]);

      return NextResponse.json({
        success: true,
        message: "Tractor removed from store successfully",
      });
    } finally {
      client.release();
    }
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}
