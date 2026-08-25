import { NextRequest, NextResponse } from "next/server";
import pool from "@/utils/Database/db";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const storeId = params.slug;

  if (!storeId) {
    return NextResponse.json({ error: "Store ID is required" }, { status: 400 });
  }

  try {
    const client = await pool.connect();
    try {
      // 1. Fetch Store with Location and Owner
      const storeRes = await client.query(
        `
        SELECT 
          s.id,
          s.owner_user_id,
          s.name,
          s.description,
          s.image,
          s.opening_time,
          s.closing_time,
          s.closing_days,
          s.location_id,
          s."createdAt",
          s."updatedAt",
          (SELECT json_build_object(
            'id', l.id,
            'name', l.name,
            'address', l.address,
            'city', l.city,
            'state', l.state,
            'zip_code', l.zip_code,
            'country', l.country
          ) FROM "Location" l WHERE l.id = s.location_id) as location,
          (SELECT json_build_object(
            'id', u.id,
            'first_name', u.first_name,
            'last_name', u.last_name,
            'email', u.email,
            'mobile', u.mobile,
            'image', u.image
          ) FROM "User" u WHERE u.id = s.owner_user_id) as owner
        FROM "Store" s
        WHERE s.id = $1
        LIMIT 1;
      `,
        [storeId]
      );

      if (storeRes.rows.length === 0) {
        return NextResponse.json({ error: "Store not found" }, { status: 404 });
      }

      const store = storeRes.rows[0];

      // 2. Fetch Tractors in Store
      const tractorsRes = await client.query(
        `
        SELECT 
          tis.id,
          tis."baseTractorId" as base_tractor_id,
          tis.hourly_price,
          tis.lat,
          tis.lan,
          tis."createdAt",
          (SELECT json_build_object(
            'id', t.id,
            'name', t.name,
            'model', t.model,
            'type', t.type,
            'images', t.images,
            'description', t.description,
            'year', t.year
          ) FROM "Tractor" t WHERE t.id = tis."baseTractorId") as "baseTractor"
        FROM "TractorInStore" tis
        WHERE tis.store_id = $1
        ORDER BY tis."createdAt" DESC;
      `,
        [storeId]
      );

      // 3. Fetch Attachments in Store
      const attachmentsRes = await client.query(
        `
        SELECT 
          ais.id,
          ais.hourly_price,
          ais."createdAt",
          (SELECT json_build_object(
            'id', a.id,
            'name', a.name,
            'images', a.images,
            'description', a.description,
            'fixedPrice', a."fixedPrice"
          ) FROM "Attachment" a WHERE a.id = ais."baseAttachmentId") as attachment
        FROM "AttachmentInStore" ais
        WHERE ais.store_id = $1
        ORDER BY ais."createdAt" DESC;
      `,
        [storeId]
      );

      // 4. Fetch Operators in Store
      const operatorsRes = await client.query(
        `
        SELECT 
          ois.id,
          ois.status,
          ois.cost_per_hour,
          ois.cost_per_job,
          ois.cost_per_month,
          ois.note,
          ois."createdAt",
          (SELECT json_build_object(
            'id', u.id,
            'first_name', u.first_name,
            'last_name', u.last_name,
            'email', u.email,
            'mobile', u.mobile,
            'image', u.image
          ) FROM "User" u WHERE u.id = ois.operator_id) as operator
        FROM "OperatorInStore" ois
        WHERE ois.store_id = $1
        ORDER BY ois."createdAt" DESC;
      `,
        [storeId]
      );

      return NextResponse.json({
        ...store,
        tractor_in_store: tractorsRes.rows,
        attachment_in_store: attachmentsRes.rows,
        operator_in_store: operatorsRes.rows,
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("[GET /api/store/[slug]] Error:", error?.message);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch store details" },
      { status: 500 }
    );
  }
}
