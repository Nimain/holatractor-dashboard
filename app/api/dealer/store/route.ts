import { NextRequest, NextResponse } from "next/server";
import pool from "@/utils/Database/db";
import crypto from "crypto";

export const dynamic = "force-dynamic";

function parseTime(val: any, defaultHour = 8): string {
  if (!val) return `1970-01-01T${String(defaultHour).padStart(2, "0")}:00:00.000Z`;
  if (typeof val === "string") {
    if (val.includes("T")) return val;
    const parts = val.split(":");
    const h = String(parts[0] || defaultHour).padStart(2, "0");
    const m = String(parts[1] || "00").padStart(2, "0");
    return `1970-01-01T${h}:${m}:00.000Z`;
  }
  return new Date(val).toISOString();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const client = await pool.connect();

    try {
      let rawOwnerId = body.owner_id || body.ownerId || body.userId;

      // Extract from Authorization Bearer token if rawOwnerId is missing or default placeholder
      if (!rawOwnerId || rawOwnerId === "cm_dealer_default" || rawOwnerId === "all") {
        try {
          const authHdr = request.headers.get("authorization") || request.headers.get("Authorization");
          if (authHdr && authHdr.toLowerCase().startsWith("bearer ")) {
            const token = authHdr.split(" ")[1];
            const parts = token.split(".");
            if (parts.length === 3) {
              const payload = JSON.parse(Buffer.from(parts[1], "base64").toString());
              rawOwnerId = payload.userId || payload.id || payload.sub;
            }
          }
        } catch {}

        if (!rawOwnerId || rawOwnerId === "cm_dealer_default") {
          try {
            const userCookie = request.cookies.get("user")?.value;
            if (userCookie) {
              const parsed = JSON.parse(decodeURIComponent(userCookie));
              rawOwnerId = parsed?.userId || parsed?.id;
            }
          } catch {}
        }
      }

      let ownerId: string | null = null;

      if (rawOwnerId && rawOwnerId !== "cm_dealer_default") {
        const uRes = await client.query('SELECT id FROM "User" WHERE id = $1 LIMIT 1;', [rawOwnerId]);
        if (uRes.rows.length > 0) {
          ownerId = uRes.rows[0].id;
        } else {
          const dRes = await client.query('SELECT user_id FROM "Dealer" WHERE id = $1 OR user_id = $1 LIMIT 1;', [rawOwnerId]);
          if (dRes.rows.length > 0 && dRes.rows[0].user_id) {
            ownerId = dRes.rows[0].user_id;
          }
        }
      }

      if (!ownerId) {
        const dealerRes = await client.query('SELECT user_id FROM "Dealer" WHERE user_id IS NOT NULL LIMIT 1;');
        if (dealerRes.rows.length > 0 && dealerRes.rows[0].user_id) {
          ownerId = dealerRes.rows[0].user_id;
        } else {
          const userRes = await client.query('SELECT id FROM "User" LIMIT 1;');
          ownerId = userRes.rows[0]?.id || "cmdefaultuser";
        }
      }

      // Ensure Dealer entry exists for ownerId so queries linking Dealer match immediately
      try {
        const dCheck = await client.query('SELECT id FROM "Dealer" WHERE user_id = $1 LIMIT 1;', [ownerId]);
        if (dCheck.rows.length === 0) {
          const newDealerId = `dlr_${ownerId.slice(0, 20)}`;
          await client.query(
            'INSERT INTO "Dealer" (id, user_id, "createdAt", "updatedAt") VALUES ($1, $2, NOW(), NOW()) ON CONFLICT DO NOTHING;',
            [newDealerId, ownerId]
          );
        }
      } catch {}

      // Check or create Base record
      let baseId = body.base_id || body.baseId;
      if (baseId) {
        const bExists = await client.query('SELECT id FROM "Base" WHERE id = $1 LIMIT 1;', [baseId]);
        if (bExists.rows.length === 0) {
          baseId = null;
        }
      }

      if (!baseId) {
        const baseRes = await client.query(
          'SELECT base_id FROM "Dealer" WHERE user_id = $1 OR id = $1 LIMIT 1;',
          [ownerId]
        );
        if (baseRes.rows.length > 0 && baseRes.rows[0].base_id) {
          baseId = baseRes.rows[0].base_id;
        } else {
          const anyBase = await client.query('SELECT id FROM "Base" LIMIT 1;');
          if (anyBase.rows.length > 0) {
            baseId = anyBase.rows[0].id;
          } else {
            baseId = `cm${crypto.randomBytes(12).toString("hex").slice(0, 23)}`;
            await client.query(
              'INSERT INTO "Base" (id, created_by, status, created, updated) VALUES ($1, $2, 1, NOW(), NOW());',
              [baseId, ownerId]
            );
          }
        }
      }

      // Location
      const locId = `cm${crypto.randomBytes(12).toString("hex").slice(0, 23)}`;
      const latVal = String(body.store_lat || body.lat || "-17.7833");
      const lanVal = String(body.store_lan || body.lan || "-63.1821");
      const addressVal = body.address || `${body.name || "Dealer Store"} Location`;
      const cityVal = body.city || "Santa Cruz";
      const stateVal = body.state || "Santa Cruz";
      const countryVal = body.country || "Bolivia";

      await client.query(
        `INSERT INTO "Location" (
          id, name, address, city, state, country, base_id, lat, lan, "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW());`,
        [locId, `${body.name || "Dealer Store"} Location`, addressVal, cityVal, stateVal, countryVal, baseId, latVal, lanVal]
      );

      // Store
      const storeId = `cm${crypto.randomBytes(12).toString("hex").slice(0, 23)}`;
      const openingTime = parseTime(body.opening_time, 8);
      const closingTime = parseTime(body.closing_time, 20);
      
      let bannerList: string[] = [];
      if (Array.isArray(body.banner)) {
        bannerList = body.banner.filter(Boolean);
      } else if (typeof body.banner === "string" && body.banner) {
        bannerList = [body.banner];
      }
      if (bannerList.length === 0 && body.logo) {
        bannerList = [body.logo];
      }
      if (bannerList.length === 0) {
        bannerList = ["https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&q=80"];
      }

      const closingDays = Array.isArray(body.closing_days) ? body.closing_days : [];

      const storeInsert = await client.query(
        `INSERT INTO "DealerStore" (
          id, owner_id, name, description, logo, opening_time, closing_time,
          closing_days, created_by, base_id, rating_id, location_id,
          "createdAt", "updatedAt", banner
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11, $12,
          NOW(), NOW(), $13
        ) RETURNING *;`,
        [
          storeId,
          ownerId,
          body.name || "Dealer Store",
          body.description || "",
          body.logo || bannerList[0],
          openingTime,
          closingTime,
          closingDays,
          ownerId,
          baseId,
          [],
          locId,
          bannerList,
        ]
      );

      const created = storeInsert.rows[0];

      return NextResponse.json(
        {
          id: storeId,
          owner_id: ownerId,
          name: created.name,
          description: created.description,
          banner: bannerList,
          logo: created.logo,
          opening_time: new Date(created.opening_time).toISOString(),
          closing_time: new Date(created.closing_time).toISOString(),
          closing_days: closingDays,
          created_by: ownerId,
          base_id: baseId,
          rating_id: [],
          location_id: locId,
          createdAt: new Date(created.createdAt).toISOString(),
          updatedAt: new Date(created.updatedAt).toISOString(),
          location: {
            id: locId,
            name: `${body.name} Location`,
            address: addressVal,
            city: cityVal,
            state: stateVal,
            zip_code: null,
            country: countryVal,
            base_id: baseId,
            lat: latVal,
            lan: lanVal,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          AttachmentInDealerStore: [],
          TractorInDealerStore: [],
          SellTractor: [],
        },
        { status: 201 }
      );
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("[/api/dealer/store] POST error:", error?.message);
    return NextResponse.json({ error: error?.message || "Failed to create dealer store" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id") || searchParams.get("userId") || "";

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
      const params: any[] = [];
      if (userId && userId !== "all") {
        query += `
          WHERE (
            ds.owner_id = $1
            OR ds.owner_id IN (SELECT user_id FROM "Dealer" WHERE id = $1)
            OR ds.owner_id IN (SELECT id FROM "Dealer" WHERE user_id = $1)
          )
        `;
        params.push(userId);
      }
      query += ` ORDER BY ds."createdAt" DESC LIMIT 50;`;

      const result = await client.query(query, params);
      const stores = result.rows.map((r: any) => ({
        id: String(r.id),
        owner_id: String(r.owner_id),
        name: String(r.name || ""),
        description: String(r.description || ""),
        banner: Array.isArray(r.banner) && r.banner.length > 0 ? r.banner : [r.logo || ""],
        logo: String(r.logo || ""),
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
        AttachmentInDealerStore: [],
        TractorInDealerStore: [],
        SellTractor: [],
      }));

      return NextResponse.json(stores);
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("[/api/dealer/store] GET error:", error?.message);
    return NextResponse.json({ error: error?.message || "Failed to fetch stores" }, { status: 500 });
  }
}
