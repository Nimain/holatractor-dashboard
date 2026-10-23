import { NextRequest, NextResponse } from "next/server";
import pool from "@/utils/Database/db";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { store_id, inventory_tractor_id, price, lat, lan } = body;

    if (!store_id) {
      return NextResponse.json({ message: "Store not found" }, { status: 404 });
    }

    const client = await pool.connect();
    try {
      let isStoreTable = false;
      let storeRes = await client.query('SELECT id, base_id FROM "DealerStore" WHERE id = $1 LIMIT 1;', [store_id]);
      if (storeRes.rows.length === 0) {
        storeRes = await client.query('SELECT id, base_id FROM "Store" WHERE id = $1 LIMIT 1;', [store_id]);
        if (storeRes.rows.length > 0) {
          isStoreTable = true;
        }
      }

      if (storeRes.rows.length === 0) {
        return NextResponse.json({ message: "Store not found" }, { status: 404 });
      }

      let baseId = storeRes.rows[0].base_id;
      if (!baseId) {
        const anyBase = await client.query('SELECT id FROM "Base" LIMIT 1;');
        baseId = anyBase.rows[0]?.id;
      }

      const id = `cm${crypto.randomBytes(12).toString("hex").slice(0, 23)}`;
      const priceVal = Number(price || 0);

      let tractorId = inventory_tractor_id;
      if (tractorId) {
        const tCheck = await client.query('SELECT id FROM "Tractor" WHERE id = $1 LIMIT 1;', [tractorId]);
        if (tCheck.rows.length === 0) {
          tractorId = null;
        }
      }

      if (!tractorId) {
        const anyTractor = await client.query('SELECT id FROM "Tractor" LIMIT 1;');
        tractorId = anyTractor.rows[0]?.id;
      }

      if (tractorId) {
        if (isStoreTable) {
          const docRes = await client.query('SELECT id FROM "Document" LIMIT 1;');
          const docId = docRes.rows[0]?.id || `cm${crypto.randomBytes(12).toString("hex").slice(0, 23)}`;
          const latNum = Number(lat || -17.7833);
          const lanNum = Number(lan || -63.1821);

          await client.query(
            `
            INSERT INTO "TractorInStore" (
              id, "baseTractorId", base_id, hourly_price, store_id, lat, lan, document_id, "createdAt", "updatedAt"
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()
            );
            `,
            [id, tractorId, baseId, priceVal, store_id, latNum, lanNum, docId]
          );
        } else {
          await client.query(
            `
            INSERT INTO "TractorInDealerStore" (
              id, "baseTractorId", base_id, price, store_id, lat, lan, "createdAt", "updatedAt"
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, NOW(), NOW()
            );
            `,
            [id, tractorId, baseId, priceVal, store_id, String(lat || "-17.7833"), String(lan || "-63.1821")]
          );
        }
      }

      return NextResponse.json({
        success: true,
        message: "Tractor added successfully",
        id,
        store_id,
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("[/api/dealer/store/addTractorToDealerStore] PATCH error:", error?.message);
    return NextResponse.json({ error: error?.message || "Failed to add tractor" }, { status: 500 });
  }
}
