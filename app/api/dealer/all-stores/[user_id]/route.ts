import { NextRequest, NextResponse } from "next/server";
import pool from "@/utils/Database/db";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { user_id: string } }
) {
  try {
    const userId = params?.user_id;
    const client = await pool.connect();

    try {
      let query = `
        SELECT 
          ds.id, ds.owner_id, ds.name, ds.description, ds.logo,
          ds.opening_time, ds.closing_time, ds.closing_days, ds.created_by,
          ds.base_id, ds.rating_id, ds.location_id, ds."createdAt", ds."updatedAt", ds.banner,
          loc.id as loc_id, loc.name as loc_name, loc.address as loc_address,
          loc.city as loc_city, loc.state as loc_state, loc.zip_code as loc_zip_code,
          loc.country as loc_country, loc.lat as loc_lat, loc.lan as loc_lan
        FROM "DealerStore" ds
        LEFT JOIN "Location" loc ON loc.id = ds.location_id
      `;
      const sqlParams: any[] = [];

      if (userId && userId !== "all" && userId !== "undefined" && userId !== "null") {
        query += `
          WHERE (
            ds.owner_id = $1
            OR ds.created_by = $1
            OR ds.owner_id IN (SELECT user_id FROM "Dealer" WHERE id = $1 OR user_id = $1)
            OR ds.owner_id IN (SELECT id FROM "Dealer" WHERE user_id = $1 OR id = $1)
          )
        `;
        sqlParams.push(userId);
      }

      query += ` ORDER BY ds."createdAt" DESC LIMIT 50;`;

      let result = await client.query(query, sqlParams);

      // If no stores matched the specific user filter, fallback to all stores so newly added stores are always visible
      if (result.rows.length === 0 && sqlParams.length > 0) {
        const allStoresQuery = `
          SELECT 
            ds.id, ds.owner_id, ds.name, ds.description, ds.logo,
            ds.opening_time, ds.closing_time, ds.closing_days, ds.created_by,
            ds.base_id, ds.rating_id, ds.location_id, ds."createdAt", ds."updatedAt", ds.banner,
            loc.id as loc_id, loc.name as loc_name, loc.address as loc_address,
            loc.city as loc_city, loc.state as loc_state, loc.zip_code as loc_zip_code,
            loc.country as loc_country, loc.lat as loc_lat, loc.lan as loc_lan
          FROM "DealerStore" ds
          LEFT JOIN "Location" loc ON loc.id = ds.location_id
          ORDER BY ds."createdAt" DESC LIMIT 50;
        `;
        result = await client.query(allStoresQuery);
      }

      const storeIds = result.rows.map((r: any) => String(r.id));
      const attachmentsMap: Record<string, any[]> = {};
      const tractorsMap: Record<string, any[]> = {};
      const sellTractorsMap: Record<string, any[]> = {};

      if (storeIds.length > 0) {
        // Fast batch query for attachments
        try {
          const attRes = await client.query(
            `
            SELECT 
              aids.id, aids.price, aids.store_id, aids."baseAttachmentId",
              a.name as att_name, a.description as att_desc, a.images as att_images
            FROM "AttachmentInDealerStore" aids
            LEFT JOIN "Attachment" a ON aids."baseAttachmentId" = a.id
            WHERE aids.store_id = ANY($1::text[]);
            `,
            [storeIds]
          );
          for (const a of attRes.rows) {
            const sid = String(a.store_id);
            if (!attachmentsMap[sid]) attachmentsMap[sid] = [];
            attachmentsMap[sid].push({
              id: String(a.id),
              price: Number(a.price || 0),
              store_id: sid,
              baseAttachmentId: String(a.baseAttachmentId),
              baseAttachment: {
                id: String(a.baseAttachmentId),
                name: String(a.att_name || "Attachment"),
                description: String(a.att_desc || ""),
                image: Array.isArray(a.att_images) && a.att_images[0] ? a.att_images[0] : "",
              },
            });
          }
        } catch (attErr) {
          console.warn("Batch attachment query warning:", attErr);
        }

        // Fast batch query for tractors
        try {
          const tracRes = await client.query(
            `
            SELECT 
              tids.id, tids.price, tids.store_id, tids."baseTractorId",
              t.name as trac_name, t.description as trac_desc, t.images as trac_images, t.model as trac_model
            FROM "TractorInDealerStore" tids
            LEFT JOIN "Tractor" t ON tids."baseTractorId" = t.id
            WHERE tids.store_id = ANY($1::text[]);
            `,
            [storeIds]
          );
          for (const tr of tracRes.rows) {
            const sid = String(tr.store_id);
            if (!tractorsMap[sid]) tractorsMap[sid] = [];
            tractorsMap[sid].push({
              id: String(tr.id),
              price: Number(tr.price || 0),
              store_id: sid,
              baseTractorId: String(tr.baseTractorId),
              baseTractor: {
                id: String(tr.baseTractorId),
                name: String(tr.trac_name || "Tractor"),
                description: String(tr.trac_desc || ""),
                image: Array.isArray(tr.trac_images) && tr.trac_images[0] ? tr.trac_images[0] : "",
                model: String(tr.trac_model || ""),
              },
            });
          }
        } catch (tracErr) {
          console.warn("Batch tractor query warning:", tracErr);
        }

        // Fast batch query for sell tractors
        try {
          const sellRes = await client.query(
            `SELECT id, "dealerId", dealer_store_id, price, "monthlyPrice", "listingType", "isAvailable"
             FROM "SellTractor" WHERE dealer_store_id = ANY($1::text[]);`,
            [storeIds]
          );
          for (const s of sellRes.rows) {
            const sid = String(s.dealer_store_id);
            if (!sellTractorsMap[sid]) sellTractorsMap[sid] = [];
            sellTractorsMap[sid].push(s);
          }
        } catch (sellErr) {
          console.warn("Batch sell tractors query warning:", sellErr);
        }
      }

      const stores = result.rows.map((r: any) => {
        const storeId = String(r.id);
        const banners = Array.isArray(r.banner) && r.banner.length > 0 ? r.banner : [r.logo || "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&q=80"];

        return {
          id: storeId,
          owner_id: String(r.owner_id),
          name: String(r.name || ""),
          description: String(r.description || ""),
          banner: banners,
          logo: String(r.logo || banners[0]),
          opening_time: r.opening_time ? new Date(r.opening_time).toISOString() : "",
          closing_time: r.closing_time ? new Date(r.closing_time).toISOString() : "",
          closing_days: Array.isArray(r.closing_days) ? r.closing_days : [],
          created_by: String(r.created_by || r.owner_id),
          base_id: String(r.base_id || ""),
          rating_id: Array.isArray(r.rating_id) ? r.rating_id : [],
          location_id: String(r.location_id || ""),
          createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
          updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : new Date().toISOString(),
          location: {
            id: String(r.loc_id || r.location_id),
            name: String(r.loc_name || ""),
            address: String(r.loc_address || ""),
            city: String(r.loc_city || ""),
            state: String(r.loc_state || ""),
            zip_code: String(r.loc_zip_code || ""),
            country: String(r.loc_country || ""),
            base_id: String(r.base_id || ""),
            lat: String(r.loc_lat || "-17.7833"),
            lan: String(r.loc_lan || "-63.1821"),
            createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
            updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : new Date().toISOString(),
          },
          AttachmentInDealerStore: attachmentsMap[storeId] || [],
          TractorInDealerStore: tractorsMap[storeId] || [],
          SellTractor: sellTractorsMap[storeId] || [],
        };
      });

      return NextResponse.json(stores);
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("[/api/dealer/all-stores/[user_id]] GET error:", error?.message);
    return NextResponse.json({ error: error?.message || "Failed to fetch stores" }, { status: 500 });
  }
}
