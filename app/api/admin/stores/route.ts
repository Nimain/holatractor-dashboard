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

// GET /api/admin/stores - List all stores with rich stats, owner, and location data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const querySearch = searchParams.get("q")?.trim()?.toLowerCase() || "";
    const countryFilter = searchParams.get("country")?.trim() || "";

    const client = await pool.connect();
    try {
      const sqlQuery = `
        SELECT 
          s.id,
          s.name,
          s.description,
          s.image,
          s.opening_time,
          s.closing_time,
          s.closing_days,
          s.owner_user_id,
          s.location_id,
          s.base_id,
          s."createdAt",
          s."updatedAt",
          (SELECT count(*)::int FROM "TractorInStore" tis WHERE tis.store_id = s.id) as tractor_count,
          (SELECT count(*)::int FROM "AttachmentInStore" ais WHERE ais.store_id = s.id) as attachment_count,
          (SELECT count(*)::int FROM "OperatorInStore" ois WHERE ois.store_id = s.id) as operator_count,
          (SELECT json_build_object(
            'id', u.id, 
            'name', trim(concat(coalesce(u.first_name, ''), ' ', coalesce(u.last_name, ''))), 
            'email', u.email, 
            'mobile', u.mobile,
            'image', u.image
          ) FROM "User" u WHERE u.id = s.owner_user_id) as owner,
          (SELECT json_build_object(
            'id', l.id,
            'name', l.name,
            'address', l.address, 
            'city', l.city,
            'state', l.state,
            'zip_code', l.zip_code,
            'country', l.country
          ) FROM "Location" l WHERE l.id = s.location_id) as location
        FROM "Store" s
        ORDER BY s."createdAt" DESC;
      `;

      const result = await client.query(sqlQuery);
      let stores = result.rows.map((row) => ({
        ...row,
        tractor_count: Number(row.tractor_count) || 0,
        attachment_count: Number(row.attachment_count) || 0,
        operator_count: Number(row.operator_count) || 0,
        closing_days: Array.isArray(row.closing_days) ? row.closing_days : [],
      }));

      // Filter in memory if search query or country filter provided
      if (querySearch) {
        stores = stores.filter((st) => {
          const nameMatch = st.name?.toLowerCase().includes(querySearch);
          const descMatch = st.description?.toLowerCase().includes(querySearch);
          const cityMatch = st.location?.city?.toLowerCase().includes(querySearch);
          const addrMatch = st.location?.address?.toLowerCase().includes(querySearch);
          const ownerMatch = st.owner?.name?.toLowerCase().includes(querySearch) || st.owner?.email?.toLowerCase().includes(querySearch);
          return nameMatch || descMatch || cityMatch || addrMatch || ownerMatch;
        });
      }

      if (countryFilter) {
        stores = stores.filter((st) => 
          st.location?.country?.toLowerCase() === countryFilter.toLowerCase()
        );
      }

      return NextResponse.json(stores);
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("[GET /api/admin/stores] Database query error:", error?.message);

    // Fallback to FastAPI or NestJS if PostgreSQL direct query fails
    try {
      const nestRes = await axios.get("https://holatractor-backend-render.onrender.com/store", { timeout: 4000 });
      return NextResponse.json(nestRes.data);
    } catch (e: any) {
      return NextResponse.json({ error: "Failed to fetch stores", details: error?.message }, { status: 500 });
    }
  }
}

// POST /api/admin/stores - Create new store directly in PostgreSQL
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const name = body.name?.trim();
    const description = body.description?.trim() || "";
    const image = body.image || "https://images.unsplash.com/photo-1592928302636-c83cf1e1c887?w=600&q=80";
    const owner_user_id = body.owner_user_id || body.owner_id || "cm8x7w4xn001vu5w3xq9nvfjz";
    const closing_days = Array.isArray(body.closing_days) ? body.closing_days : [];

    if (!name) {
      return NextResponse.json({ error: "Store name is required" }, { status: 400 });
    }

    const storeId = generateCuid();
    const baseId = generateCuid();
    const locationId = generateCuid();
    const locationBaseId = generateCuid();

    const opening_time = body.opening_time ? new Date(body.opening_time) : new Date("1970-01-01T08:00:00.000Z");
    const closing_time = body.closing_time ? new Date(body.closing_time) : new Date("1970-01-01T20:00:00.000Z");

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // 1. Create Location record if address details provided
      await client.query(
        `
        INSERT INTO "Location" (
          id, base_id, name, address, city, state, zip_code, country, "createdAt", "updatedAt"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()
        )
      `,
        [
          locationId,
          locationBaseId,
          body.location_name || name,
          body.location_address || "Hub Center",
          body.location_city || "Buenos Aires",
          body.location_state || "Buenos Aires",
          body.location_zip_code || "1000",
          body.location_country || "Argentina",
        ]
      );

      // 2. Create Store record
      await client.query(
        `
        INSERT INTO "Store" (
          id, base_id, created_by, owner_user_id, location_id, name, description, image, opening_time, closing_time, closing_days, "createdAt", "updatedAt"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW()
        )
      `,
        [
          storeId,
          baseId,
          owner_user_id,
          owner_user_id,
          locationId,
          name,
          description,
          image,
          opening_time,
          closing_time,
          closing_days,
        ]
      );

      await client.query("COMMIT");

      return NextResponse.json(
        {
          success: true,
          message: "Store created successfully",
          id: storeId,
          data: {
            id: storeId,
            name,
            description,
            image,
            owner_user_id,
            location_id: locationId,
            closing_days,
          },
        },
        { status: 201 }
      );
    } catch (dbErr: any) {
      await client.query("ROLLBACK");
      console.error("[POST /api/admin/stores] Database insert error:", dbErr?.message);
      return NextResponse.json({ error: dbErr?.message || "Failed to create store" }, { status: 500 });
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error("[POST /api/admin/stores] Internal error:", err);
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/admin/stores - Delete a store by ID
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get("id");

    if (!storeId) {
      return NextResponse.json({ error: "Store ID is required" }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Clear relationships first
      await client.query(`DELETE FROM "TractorInStore" WHERE store_id = $1`, [storeId]);
      await client.query(`DELETE FROM "AttachmentInStore" WHERE store_id = $1`, [storeId]);
      await client.query(`DELETE FROM "OperatorInStore" WHERE store_id = $1`, [storeId]);

      // Delete the Store
      await client.query(`DELETE FROM "Store" WHERE id = $1`, [storeId]);

      await client.query("COMMIT");
      return NextResponse.json({ success: true, message: "Store deleted successfully" });
    } catch (dbErr: any) {
      await client.query("ROLLBACK");
      console.error("[DELETE /api/admin/stores] DB error:", dbErr?.message);
      return NextResponse.json({ error: dbErr?.message || "Failed to delete store" }, { status: 500 });
    } finally {
      client.release();
    }
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}
