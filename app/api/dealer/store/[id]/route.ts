import { NextRequest, NextResponse } from "next/server";
import pool from "@/utils/Database/db";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const storeId = params?.id;
    if (!storeId) {
      return NextResponse.json({ message: "Store ID is required" }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      // 1. First attempt: DealerStore
      let storeRes = await client.query(
        `
        SELECT 
          ds.id, ds.owner_id, ds.name, ds.description, ds.logo,
          ds.opening_time, ds.closing_time, ds.closing_days, ds.created_by,
          ds.base_id, ds.rating_id, ds.location_id, ds."createdAt", ds."updatedAt", ds.banner,
          loc.id as loc_id, loc.name as loc_name, loc.address as loc_address,
          loc.city as loc_city, loc.state as loc_state, loc.zip_code as loc_zip_code,
          loc.country as loc_country, loc.lat as loc_lat, loc.lan as loc_lan
        FROM "DealerStore" ds
        LEFT JOIN "Location" loc ON loc.id = ds.location_id
        WHERE ds.id = $1
        LIMIT 1;
        `,
        [storeId]
      );

      // 2. Second attempt: Store table fallback
      let isDealerStore = true;
      if (storeRes.rows.length === 0) {
        isDealerStore = false;
        storeRes = await client.query(
          `
          SELECT 
            s.id, s.owner_user_id as owner_id, s.name, s.description, s.image as logo,
            s.opening_time, s.closing_time, s.closing_days, s.created_by,
            s.base_id, s.rating_id, s.location_id, s."createdAt", s."updatedAt", s.image as banner,
            loc.id as loc_id, loc.name as loc_name, loc.address as loc_address,
            loc.city as loc_city, loc.state as loc_state, loc.zip_code as loc_zip_code,
            loc.country as loc_country, loc.lat as loc_lat, loc.lan as loc_lan
          FROM "Store" s
          LEFT JOIN "Location" loc ON loc.id = s.location_id
          WHERE s.id = $1
          LIMIT 1;
          `,
          [storeId]
        );
      }

      if (storeRes.rows.length === 0) {
        return NextResponse.json({ message: "Store not found" }, { status: 404 });
      }

      const r = storeRes.rows[0];

      // Query Attachments from AttachmentInDealerStore + AttachmentInStore
      const attRes = await client.query(
        `
        SELECT 
          aids.id, aids.price, aids.store_id, aids."baseAttachmentId",
          a.name as att_name, a.description as att_desc, a.images as att_images
        FROM "AttachmentInDealerStore" aids
        LEFT JOIN "Attachment" a ON aids."baseAttachmentId" = a.id
        WHERE aids.store_id = $1
        UNION ALL
        SELECT 
          ais.id, ais.hourly_price as price, ais.store_id, ais."baseAttachmentId",
          a.name as att_name, a.description as att_desc, a.images as att_images
        FROM "AttachmentInStore" ais
        LEFT JOIN "Attachment" a ON ais."baseAttachmentId" = a.id
        WHERE ais.store_id = $1;
        `,
        [storeId]
      );

      const attachments = attRes.rows.map((a: any) => ({
        id: String(a.id),
        price: Number(a.price || 0),
        store_id: String(a.store_id),
        baseAttachmentId: String(a.baseAttachmentId),
        baseAttachment: {
          id: String(a.baseAttachmentId),
          name: String(a.att_name || "Attachment"),
          description: String(a.att_desc || ""),
          image: Array.isArray(a.att_images) && a.att_images[0] ? a.att_images[0] : "",
        },
      }));

      // Query Tractors from TractorInDealerStore + TractorInStore
      const tracRes = await client.query(
        `
        SELECT 
          tids.id, tids.price, tids.store_id, tids."baseTractorId",
          t.name as trac_name, t.description as trac_desc, t.images as trac_images, t.model as trac_model
        FROM "TractorInDealerStore" tids
        LEFT JOIN "Tractor" t ON tids."baseTractorId" = t.id
        WHERE tids.store_id = $1
        UNION ALL
        SELECT 
          tis.id, tis.hourly_price as price, tis.store_id, tis."baseTractorId",
          t.name as trac_name, t.description as trac_desc, t.images as trac_images, t.model as trac_model
        FROM "TractorInStore" tis
        LEFT JOIN "Tractor" t ON tis."baseTractorId" = t.id
        WHERE tis.store_id = $1;
        `,
        [storeId]
      );

      const tractors = tracRes.rows.map((tr: any) => ({
        id: String(tr.id),
        price: Number(tr.price || 0),
        store_id: String(tr.store_id),
        baseTractorId: String(tr.baseTractorId),
        baseTractor: {
          id: String(tr.baseTractorId),
          name: String(tr.trac_name || "Tractor"),
          description: String(tr.trac_desc || ""),
          image: Array.isArray(tr.trac_images) && tr.trac_images[0] ? tr.trac_images[0] : "",
          model: String(tr.trac_model || ""),
        },
      }));

      // SellTractor
      const sellRes = await client.query(
        `SELECT id, "dealerId", dealer_store_id, price, "monthlyPrice", "listingType", "isAvailable"
         FROM "SellTractor" WHERE dealer_store_id = $1;`,
        [storeId]
      );

      let banners: string[] = [];
      if (Array.isArray(r.banner) && r.banner.length > 0) {
        banners = r.banner;
      } else if (typeof r.banner === "string" && r.banner) {
        banners = [r.banner];
      } else {
        banners = [r.logo || "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&q=80"];
      }

      return NextResponse.json({
        id: storeId,
        owner_id: String(r.owner_id || ""),
        name: String(r.name || ""),
        description: String(r.description || ""),
        banner: banners,
        logo: String(r.logo || banners[0]),
        opening_time: r.opening_time ? new Date(r.opening_time).toISOString() : new Date().toISOString(),
        closing_time: r.closing_time ? new Date(r.closing_time).toISOString() : new Date().toISOString(),
        closing_days: Array.isArray(r.closing_days) ? r.closing_days : ["Sunday"],
        created_by: String(r.created_by || r.owner_id || ""),
        base_id: String(r.base_id || ""),
        rating_id: Array.isArray(r.rating_id) ? r.rating_id : [],
        location_id: String(r.location_id || ""),
        createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : new Date().toISOString(),
        location: {
          id: String(r.loc_id || r.location_id || "loc_default"),
          name: String(r.loc_name || r.name || "Store Location"),
          address: String(r.loc_address || ""),
          city: String(r.loc_city || "Santa Cruz"),
          state: String(r.loc_state || ""),
          zip_code: String(r.loc_zip_code || ""),
          country: String(r.loc_country || "Bolivia"),
          base_id: String(r.base_id || ""),
          lat: String(r.loc_lat || "-17.7833"),
          lan: String(r.loc_lan || "-63.1821"),
          createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
          updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : new Date().toISOString(),
        },
        AttachmentInDealerStore: attachments,
        TractorInDealerStore: tractors,
        SellTractor: sellRes.rows,
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("[/api/dealer/store/[id]] GET error:", error?.message);
    return NextResponse.json({ error: error?.message || "Failed to fetch store" }, { status: 500 });
  }
}
