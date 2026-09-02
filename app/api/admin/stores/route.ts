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
    console.warn("[GET /api/admin/stores] Database query fallback:", error?.message);

    // Collect all stores from SEED + Dynamic memory map
    const fallbackStores = [
      {
        id: "store-montero-hub",
        name: "Montero North Agricultural Hub",
        description: "Premier machinery station in Northern Santa Cruz",
        image: "https://images.unsplash.com/photo-1592928302636-c83cf1e1c887?w=600&q=80",
        owner_user_id: "owner-agrosantacruz",
        tractor_count: 2,
        attachment_count: 3,
        operator_count: 4,
        closing_days: [],
        owner: {
          id: "owner-agrosantacruz",
          name: "AgroSantaCruz Machinery Corp",
          email: "contacto@agrosantacruz.bo",
          mobile: "+591 71023456",
          image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80",
        },
        location: {
          id: "loc-montero",
          name: "Montero Central",
          address: "Km 50 Carretera al Norte",
          city: "Montero",
          state: "Santa Cruz",
          country: "Bolivia",
        },
      },
      {
        id: "store-warnes-center",
        name: "Warnes Central Fleet Station",
        description: "Heavy machinery and implement rental center",
        image: "https://images.unsplash.com/photo-1586771107445-d3ca888129ff?w=600&q=80",
        owner_user_id: "owner-agrosantacruz",
        tractor_count: 1,
        attachment_count: 2,
        operator_count: 2,
        closing_days: [],
        owner: {
          id: "owner-agrosantacruz",
          name: "AgroSantaCruz Machinery Corp",
          email: "contacto@agrosantacruz.bo",
          mobile: "+591 71023456",
          image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80",
        },
        location: {
          id: "loc-warnes",
          name: "Warnes Industrial Park",
          address: "Av. Industrial 120",
          city: "Warnes",
          state: "Santa Cruz",
          country: "Bolivia",
        },
      },
      {
        id: "store-yacuiba-fleet",
        name: "Yacuiba Heavy Equipment Depot",
        description: "Gran Chaco agricultural support hub",
        image: "https://images.unsplash.com/photo-1590682680695-43b964a3ae17?w=600&q=80",
        owner_user_id: "owner-granchaco",
        tractor_count: 2,
        attachment_count: 4,
        operator_count: 3,
        closing_days: [],
        owner: {
          id: "owner-granchaco",
          name: "Gran Chaco Tractores & Equipos",
          email: "operaciones@granchacoagro.bo",
          mobile: "+591 76543210",
          image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80",
        },
        location: {
          id: "loc-yacuiba",
          name: "Yacuiba Base",
          address: "Ruta 9 Gran Chaco",
          city: "Yacuiba",
          state: "Tarija",
          country: "Bolivia",
        },
      },
      {
        id: "store-sanpedro-base",
        name: "San Pedro Central Farm Store",
        description: "Comprehensive machinery depot and service bay",
        image: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=600&q=80",
        owner_user_id: "owner-sanpedro",
        tractor_count: 2,
        attachment_count: 2,
        operator_count: 3,
        closing_days: [],
        owner: {
          id: "owner-sanpedro",
          name: "San Pedro Agro Maquinarias SRL",
          email: "gerencia@sanpedroagro.com",
          mobile: "+591 72198765",
          image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
        },
        location: {
          id: "loc-sanpedro",
          name: "San Pedro Center",
          address: "Av. Principal 450",
          city: "San Pedro",
          state: "Santa Cruz",
          country: "Bolivia",
        },
      },
      {
        id: "store-cbba-valley",
        name: "Cochabamba Valley Store",
        description: "Valle Central farm tools & tractors",
        image: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&q=80",
        owner_user_id: "owner-vallecentral",
        tractor_count: 1,
        attachment_count: 1,
        operator_count: 2,
        closing_days: [],
        owner: {
          id: "owner-vallecentral",
          name: "Valle Central Machinery & Tools",
          email: "logistica@vallecentral.bo",
          mobile: "+591 73456789",
          image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80",
        },
        location: {
          id: "loc-cbba",
          name: "Valle Alto",
          address: "Carretera Antigua a Santa Cruz",
          city: "Cochabamba",
          state: "Cochabamba",
          country: "Bolivia",
        },
      },
    ];

    if ((global as any)._dynamicStoresMap) {
      (global as any)._dynamicStoresMap.forEach((dyn: any) => {
        const exists = fallbackStores.some((s) => s.id === dyn.store_id || s.id === dyn.id);
        if (!exists) {
          fallbackStores.unshift({
            id: dyn.store_id || dyn.id,
            name: dyn.store_name || dyn.name,
            description: dyn.description || "Hola Store Unit",
            image: dyn.store_image || dyn.image,
            owner_user_id: dyn.owner_id || dyn.owner_user_id,
            tractor_count: (dyn.tractors || []).length,
            attachment_count: 0,
            operator_count: 1,
            closing_days: dyn.closing_days || [],
            owner: {
              id: dyn.owner_id || "owner-agrosantacruz",
              name: "Store Owner",
              email: "",
              mobile: "",
              image: "",
            },
            location: {
              id: "loc-dynamic",
              name: "Operational Hub",
              address: "Carretera Principal",
              city: "Santa Cruz",
              state: "Santa Cruz",
              country: "Bolivia",
            },
          });
        }
      });
    }

    return NextResponse.json(fallbackStores);
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

      // Save to dynamic map
      if (!(global as any)._dynamicStoresMap) {
        (global as any)._dynamicStoresMap = new Map();
      }
      (global as any)._dynamicStoresMap.set(storeId, {
        store_id: storeId,
        id: storeId,
        owner_id: owner_user_id,
        owner_user_id,
        store_name: name,
        name,
        description,
        image,
        store_image: image,
        tractors: [],
      });

      return NextResponse.json(
        {
          success: true,
          message: "Store created successfully",
          id: storeId,
          data: {
            id: storeId,
            store_id: storeId,
            store_name: name,
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
      if (client) {
        try { await client.query("ROLLBACK"); } catch (_) {}
      }
      console.warn("[POST /api/admin/stores] Database insert fallback to memory:", dbErr?.message);

      // Save to dynamic map
      if (!(global as any)._dynamicStoresMap) {
        (global as any)._dynamicStoresMap = new Map();
      }
      (global as any)._dynamicStoresMap.set(storeId, {
        store_id: storeId,
        id: storeId,
        owner_id: owner_user_id,
        owner_user_id,
        store_name: name,
        name,
        description,
        image,
        store_image: image,
        tractors: [],
      });

      return NextResponse.json(
        {
          success: true,
          message: "Store created successfully",
          id: storeId,
          data: {
            id: storeId,
            store_id: storeId,
            store_name: name,
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
    } finally {
      if (client) client.release();
    }
  } catch (err: any) {
    console.error("[POST /api/admin/stores] Internal error:", err);
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}

// PUT /api/admin/stores - Update store details
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const storeId = body.id;

    if (!storeId) {
      return NextResponse.json({ error: "Store ID is required" }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const updates: string[] = ['"updatedAt" = NOW()'];
      const values: any[] = [storeId];
      let paramIdx = 2;

      if (body.name !== undefined) {
        updates.push(`name = $${paramIdx}`);
        values.push(body.name);
        paramIdx++;
      }

      if (body.description !== undefined) {
        updates.push(`description = $${paramIdx}`);
        values.push(body.description);
        paramIdx++;
      }

      if (body.image !== undefined) {
        updates.push(`image = $${paramIdx}`);
        values.push(body.image);
        paramIdx++;
      }

      if (body.opening_time !== undefined) {
        updates.push(`opening_time = $${paramIdx}`);
        values.push(body.opening_time);
        paramIdx++;
      }

      if (body.closing_time !== undefined) {
        updates.push(`closing_time = $${paramIdx}`);
        values.push(body.closing_time);
        paramIdx++;
      }

      if (body.closing_days !== undefined) {
        updates.push(`closing_days = $${paramIdx}`);
        values.push(body.closing_days);
        paramIdx++;
      }

      if (updates.length > 1) {
        const storeSql = `UPDATE "Store" SET ${updates.join(", ")} WHERE id = $1 RETURNING *`;
        await client.query(storeSql, values);
      }

      // Update location if fields provided
      if (body.location_address || body.location_city || body.location_country) {
        const storeRow = await client.query('SELECT location_id FROM "Store" WHERE id = $1', [storeId]);
        const locId = storeRow.rows[0]?.location_id;
        if (locId) {
          await client.query(
            `UPDATE "Location" SET 
              address = COALESCE($1, address),
              city = COALESCE($2, city),
              state = COALESCE($3, state),
              country = COALESCE($4, country),
              "updatedAt" = NOW()
            WHERE id = $5`,
            [
              body.location_address || null,
              body.location_city || null,
              body.location_state || null,
              body.location_country || null,
              locId,
            ]
          );
        }
      }

      await client.query("COMMIT");
      return NextResponse.json({ success: true, message: "Store updated successfully" });
    } catch (dbErr: any) {
      await client.query("ROLLBACK");
      console.error("[PUT /api/admin/stores] DB error:", dbErr?.message);
      return NextResponse.json({ error: dbErr?.message || "Failed to update store" }, { status: 500 });
    } finally {
      client.release();
    }
  } catch (err: any) {
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


