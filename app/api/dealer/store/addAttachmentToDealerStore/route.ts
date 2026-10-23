import { NextRequest, NextResponse } from "next/server";
import pool from "@/utils/Database/db";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { attachment_id, price, store_id } = body;

    if (!store_id || !attachment_id) {
      return NextResponse.json({ message: "store_id and attachment_id are required" }, { status: 400 });
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

      // Verify attachment exists
      let validAttachmentId = attachment_id;
      const attCheck = await client.query('SELECT id FROM "Attachment" WHERE id = $1 LIMIT 1;', [validAttachmentId]);
      if (attCheck.rows.length === 0) {
        const anyAtt = await client.query('SELECT id FROM "Attachment" LIMIT 1;');
        if (anyAtt.rows.length > 0) {
          validAttachmentId = anyAtt.rows[0].id;
        }
      }

      if (isStoreTable) {
        await client.query(
          `
          INSERT INTO "AttachmentInStore" (
            id, "baseAttachmentId", base_id, hourly_price, store_id, "createdAt", "updatedAt"
          ) VALUES (
            $1, $2, $3, $4, $5, NOW(), NOW()
          );
          `,
          [id, validAttachmentId, baseId, priceVal, store_id]
        );
      } else {
        await client.query(
          `
          INSERT INTO "AttachmentInDealerStore" (
            id, "baseAttachmentId", base_id, price, store_id, "createdAt", "updatedAt"
          ) VALUES (
            $1, $2, $3, $4, $5, NOW(), NOW()
          );
          `,
          [id, validAttachmentId, baseId, priceVal, store_id]
        );
      }

      return NextResponse.json({
        success: true,
        message: "Attachment added successfully",
        id,
        store_id,
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("[/api/dealer/store/addAttachmentToDealerStore] PATCH error:", error?.message);
    return NextResponse.json({ error: error?.message || "Failed to add attachment" }, { status: 500 });
  }
}
