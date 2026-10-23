import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import jwt from "jsonwebtoken";
import pool from "@/utils/Database/db";

import { getFastApiAuthHeaders } from "@/utils/auth/serverAuth";

export const dynamic = "force-dynamic";

function generateCuid(prefix = "dev"): string {
  const timestamp = Date.now().toString(36);
  const randChars =
    Math.random().toString(36).substring(2, 10) +
    Math.random().toString(36).substring(2, 10);
  return `${prefix}_${timestamp}${randChars}`.slice(0, 25);
}

const FastApiBaseURL =
  process.env.NEXT_PUBLIC_TRACTOR_AI_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://tractorai.sinsignal.com/";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      device_imei,
      tractor_id,
      store_id,
      device_region = "SW",
      device_name,
    } = body;

    const imeiStr = String(device_imei || "").trim();
    if (!imeiStr) {
      return NextResponse.json(
        { error: "Device IMEI number is required", success: false },
        { status: 400 }
      );
    }

    // 1. Attempt FastAPI /api/v1/admin/devices
    try {
      const fastApiRes = await axios.post(
        `${FastApiBaseURL.replace(/\/$/, "")}/api/v1/admin/devices`,
        body,
        {
          headers: getFastApiAuthHeaders(request),
          timeout: 5000,
        }
      );

      if (fastApiRes.status === 200 || fastApiRes.status === 201) {
        return NextResponse.json(fastApiRes.data, { status: fastApiRes.status });
      }
    } catch (fastErr: any) {
      console.warn(
        "[POST /api/devices] FastAPI forward notice, using direct DB handler:",
        fastErr?.response?.data?.detail || fastErr?.message
      );
    }

    // 2. Direct PostgreSQL Database Handler
    const client = await pool.connect();
    try {
      await client.query("BEGIN;");

      // A. Check if IMEI is already registered to another tractor
      const existingImeiRes = await client.query(
        'SELECT id, "tractor_store_id" FROM "DeviceInTractor" WHERE device_imei = $1 LIMIT 1;',
        [imeiStr]
      );
      const existingImei = existingImeiRes.rows[0];

      // B. Resolve base_id
      let baseId = "default_base";
      const baseRow = await client.query('SELECT id FROM "Base" LIMIT 1;');
      if (baseRow.rows[0]?.id) {
        baseId = baseRow.rows[0].id;
      }

      // C. Resolve TractorInStore ID
      let resolvedTisId = "";
      const rawTractorId = String(tractor_id || "").trim();
      const rawStoreId = String(store_id || "").trim();

      if (rawTractorId) {
        // Check if rawTractorId is directly a TractorInStore ID
        const tisRes = await client.query(
          'SELECT id, base_id FROM "TractorInStore" WHERE id = $1 LIMIT 1;',
          [rawTractorId]
        );
        if (tisRes.rows[0]?.id) {
          resolvedTisId = tisRes.rows[0].id;
          if (tisRes.rows[0].base_id) baseId = tisRes.rows[0].base_id;
        } else if (rawStoreId) {
          // Check if rawTractorId is a baseTractorId for this store
          const pairRes = await client.query(
            'SELECT id, base_id FROM "TractorInStore" WHERE store_id = $1 AND "baseTractorId" = $2 LIMIT 1;',
            [rawStoreId, rawTractorId]
          );
          if (pairRes.rows[0]?.id) {
            resolvedTisId = pairRes.rows[0].id;
            if (pairRes.rows[0].base_id) baseId = pairRes.rows[0].base_id;
          }
        }
      }

      // If TractorInStore doesn't exist yet, create one
      if (!resolvedTisId && rawStoreId) {
        let validBaseTractorId = rawTractorId;
        const btRes = await client.query('SELECT id FROM "Tractor" WHERE id = $1 LIMIT 1;', [rawTractorId]);
        if (!btRes.rows[0]?.id) {
          const firstBt = await client.query('SELECT id FROM "Tractor" LIMIT 1;');
          validBaseTractorId = firstBt.rows[0]?.id || "cmbqgcmk8001bg708ofnkm55e";
        }

        let docId = "cm8k5gx7n0007141wpl3o7ope";
        const docRow = await client.query('SELECT id FROM "Document" LIMIT 1;');
        if (docRow.rows[0]?.id) {
          docId = docRow.rows[0].id;
        } else {
          docId = generateCuid("doc");
          await client.query(
            'INSERT INTO "Document" (id, type, url, base_id, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, NOW(), NOW()) ON CONFLICT DO NOTHING;',
            [docId, "TRACTOR_DOC", "https://holatractor.com", baseId]
          );
        }

        resolvedTisId = generateCuid("tis");
        await client.query(
          `INSERT INTO "TractorInStore" (
            id, store_id, "baseTractorId", document_id, base_id, hourly_price, "createdAt", "updatedAt"
          ) VALUES (
            $1, $2, $3, $4, $5, 25.0, NOW(), NOW()
          );`,
          [resolvedTisId, rawStoreId, validBaseTractorId, docId, baseId]
        );
      }

      if (!resolvedTisId) {
        await client.query("ROLLBACK;");
        return NextResponse.json(
          { error: "Could not find or create tractor in store for device link", success: false },
          { status: 400 }
        );
      }

      let deviceRecordId = "";
      if (existingImei) {
        // Update existing device record to the new tractor
        await client.query(
          `UPDATE "DeviceInTractor"
           SET "tractor_store_id" = $1, device_region = $2, "updatedAt" = NOW()
           WHERE id = $3;`,
          [resolvedTisId, device_region, existingImei.id]
        );
        deviceRecordId = existingImei.id;
      } else {
        // Check if this tractor already had a device attached
        const existingTractorDev = await client.query(
          'SELECT id FROM "DeviceInTractor" WHERE "tractor_store_id" = $1 LIMIT 1;',
          [resolvedTisId]
        );

        if (existingTractorDev.rows[0]?.id) {
          await client.query(
            `UPDATE "DeviceInTractor"
             SET device_imei = $1, device_region = $2, "updatedAt" = NOW()
             WHERE id = $3;`,
            [imeiStr, device_region, existingTractorDev.rows[0].id]
          );
          deviceRecordId = existingTractorDev.rows[0].id;
        } else {
          deviceRecordId = generateCuid("dev");
          await client.query(
            `INSERT INTO "DeviceInTractor" (
              id, device_imei, device_region, base_id, "tractor_store_id", "createdAt", "updatedAt"
            ) VALUES (
              $1, $2, $3, $4, $5, NOW(), NOW()
            );`,
            [deviceRecordId, imeiStr, device_region, baseId, resolvedTisId]
          );
        }
      }

      await client.query("COMMIT;");

      return NextResponse.json(
        {
          success: true,
          message: `GPS Device IMEI ${imeiStr} linked to tractor successfully!`,
          data: {
            id: deviceRecordId,
            device_imei: imeiStr,
            device_region,
            tractor_store_id: resolvedTisId,
            status: "ASSIGNED",
          },
        },
        { status: 201 }
      );
    } catch (dbError: any) {
      await client.query("ROLLBACK;");
      console.error("[POST /api/devices] DB Error:", dbError);
      return NextResponse.json(
        { error: dbError?.message || "Failed to link device to tractor in database", success: false },
        { status: 500 }
      );
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("[POST /api/devices] General Error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error", success: false },
      { status: 500 }
    );
  }
}
