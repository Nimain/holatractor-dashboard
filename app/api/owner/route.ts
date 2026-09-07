import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import pool from "@/utils/Database/db";
import { getFastApiAuthHeaders } from "@/utils/auth/serverAuth";

export const dynamic = "force-dynamic";

const FASTAPI_CANDIDATES = Array.from(
  new Set(
    [
      (process.env.NEXT_PUBLIC_TRACTOR_AI_URL || "").replace(/\/$/, ""),
      (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, ""),
      "https://tractorai.sinsignal.com",
    ].filter((url) => Boolean(url) && !url.includes("localhost") && !url.includes("127.0.0.1"))
  )
);

async function fetchFromFastAPI(endpoint: string, headers: any, timeout = 5000) {
  for (const base of FASTAPI_CANDIDATES) {
    try {
      const res = await axios.get(`${base}${endpoint}`, { headers, timeout });
      if (res.data) return { data: res.data, base };
    } catch {
      // try next
    }
  }
  return null;
}

async function patchToFastAPI(endpoint: string, payload: any, headers: any, timeout = 6000) {
  for (const base of FASTAPI_CANDIDATES) {
    try {
      const res = await axios.patch(`${base}${endpoint}`, payload, { headers, timeout });
      if (res.data) return { data: res.data, base };
    } catch {
      // try next
    }
  }
  return null;
}

function sanitizeImageUrl(img?: string | null): string {
  if (!img || typeof img !== "string") return "";
  const t = img.trim();
  if (t.startsWith("file://") || t.startsWith("file:/") || t === "NO" || t.toLowerCase() === "null" || t.toLowerCase() === "undefined") return "";
  return t;
}

// Helper to query PostgreSQL directly
async function getOwnersFromDB() {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT 
        o.id,
        o.user_id,
        o.role_id,
        o.created_by,
        COALESCE(o.status, 1) as status,
        o.base_id,
        COALESCE(o."createdAt", u."createdAt") as "createdAt",
        COALESCE(o."updatedAt", u."updatedAt") as "updatedAt",
        u.first_name,
        u.middle_name,
        u.last_name,
        u.email,
        u.mobile,
        u.gender,
        u.image,
        u.country_code,
        u."emailVerified",
        u."authType",
        l.id as location_id,
        l.name as location_name,
        l.address as location_address,
        l.city as location_city,
        l.state as location_state,
        l.zip_code as location_zip_code,
        l.country as location_country,
        l.lat as location_lat,
        l.lan as location_lan
      FROM "Owner" o
      LEFT JOIN "User" u ON u.id = o.user_id
      LEFT JOIN "Location" l ON (l.id = o.loaction_id OR l.id = u.location_id)
      ORDER BY COALESCE(o."createdAt", u."createdAt") DESC
    `);

    return res.rows.map((m: any) => {
      let locCountry = String(m.location_country || "").trim();
      if (!locCountry || locCountry.toLowerCase() === "null" || locCountry.toLowerCase() === "undefined" || locCountry.toLowerCase() === "n/a") {
        locCountry = "NA";
      }

      return {
        id: String(m.id),
        user_id: String(m.user_id),
        role_id: String(m.role_id || "owner_role"),
        created_by: m.created_by ? String(m.created_by) : null,
        status: Number(m.status ?? 1),
        base_id: String(m.base_id || m.id),
        createdAt: String(m.createdAt),
        updatedAt: String(m.updatedAt),
        user: {
          id: String(m.user_id),
          first_name: String(m.first_name || "Owner"),
          middle_name: String(m.middle_name || ""),
          last_name: String(m.last_name || ""),
          email: String(m.email || ""),
          mobile: String(m.mobile || ""),
          gender: String(m.gender || "male"),
          image: sanitizeImageUrl(m.image),
          country_code: String(m.country_code || "+591"),
          emailVerified: m.emailVerified !== null ? Boolean(m.emailVerified) : true,
          authType: String(m.authType || "EMAIL"),
        },
        location: {
          id: m.location_id ? String(m.location_id) : undefined,
          name: m.location_name ? String(m.location_name) : "NA",
          address: m.location_address ? String(m.location_address) : "NA",
          city: m.location_city ? String(m.location_city) : "NA",
          state: m.location_state ? String(m.location_state) : "NA",
          zip_code: m.location_zip_code ? String(m.location_zip_code) : "NA",
          country: locCountry,
          lat: m.location_lat ? String(m.location_lat) : "NA",
          lng: m.location_lan ? String(m.location_lan) : "NA",
        },
      };
    });
  } finally {
    client.release();
  }
}

// ── GET: List Owners ────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = (searchParams.get("search") || "").trim().toLowerCase();
    const statusParam = searchParams.get("status");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const perPage = Math.max(1, parseInt(searchParams.get("per_page") || "20", 10));
    const isPaginatedReq = searchParams.has("page") || searchParams.has("per_page") || searchParams.get("format") === "paginated";

    const headers = getFastApiAuthHeaders(request);

    let owners: any[] = [];

    // 1. Try FastAPI candidates first
    let fastApiResult = await fetchFromFastAPI("/api/v1/admin/owners", headers, 3000);
    if (!fastApiResult || !Array.isArray(fastApiResult.data) || fastApiResult.data.length === 0) {
      fastApiResult = await fetchFromFastAPI("/api/v1/owners", headers, 3000);
    }
    if (!fastApiResult || !Array.isArray(fastApiResult.data) || fastApiResult.data.length === 0) {
      fastApiResult = await fetchFromFastAPI("/owners", headers, 3000);
    }
    if (fastApiResult && Array.isArray(fastApiResult.data) && fastApiResult.data.length > 0) {
      owners = fastApiResult.data;
    }

    // 2. Fallback to PostgreSQL
    if (!owners.length) {
      try {
        owners = await getOwnersFromDB();
      } catch (dbErr: any) {
        console.warn("[/api/owner] DB fallback error:", dbErr?.message);
      }
    } else {
      // 3. If FastAPI returns owners with missing or NA location, enrich with real DB location
      try {
        const dbOwners = await getOwnersFromDB();
        const dbLocMap = new Map<string, any>();
        dbOwners.forEach((dbo: any) => {
          if (dbo.location && dbo.location.country && dbo.location.country !== "NA" && dbo.location.country !== "Bolivia") {
            dbLocMap.set(dbo.id, dbo.location);
            dbLocMap.set(dbo.user_id, dbo.location);
          }
        });
        owners = owners.map((o: any) => {
          const matchedDbLoc = dbLocMap.get(o.id) || dbLocMap.get(o.user_id);
          if (matchedDbLoc && (!o.location || !o.location.country || o.location.country === "NA" || o.location.country === "Bolivia")) {
            return { ...o, location: matchedDbLoc };
          }
          return o;
        });
      } catch (e: any) {
        console.warn("[/api/owner] DB location enrichment error:", e?.message);
      }
    }

    // Normalize format
    let normalized = owners.map((o: any) => {
      const u = o.user || {};
      const loc = o.location || {};
      let co = String(loc.country || "").trim();
      if (!co || co.toLowerCase() === "null" || co.toLowerCase() === "undefined" || co.toLowerCase() === "n/a") {
        co = "NA";
      }

      return {
        id: String(o.id || o.user_id),
        user_id: String(o.user_id || o.id),
        role_id: String(o.role_id || "owner_role"),
        status: Number(o.status ?? (o.Status ?? 1)),
        createdAt: String(o.createdAt || new Date().toISOString()),
        updatedAt: String(o.updatedAt || new Date().toISOString()),
        user: {
          id: String(u.id || o.user_id || o.id),
          first_name: String(u.first_name || o.first_name || ""),
          middle_name: String(u.middle_name || o.middle_name || ""),
          last_name: String(u.last_name || o.last_name || ""),
          email: String(u.email || o.email || ""),
          mobile: u.mobile || o.mobile ? String(u.mobile || o.mobile) : "",
          gender: String(u.gender || o.gender || "male"),
          image: sanitizeImageUrl(u.image || o.image),
          country_code: String(u.country_code || o.country_code || "+591"),
          emailVerified: u.emailVerified !== undefined ? Boolean(u.emailVerified) : true,
          authType: String(u.authType || o.authType || "EMAIL"),
        },
        location: {
          id: loc.id || undefined,
          name: loc.name || "NA",
          address: loc.address || "NA",
          city: loc.city || "NA",
          state: loc.state || "NA",
          zip_code: loc.zip_code || "NA",
          country: co,
          lat: loc.lat || "NA",
          lng: loc.lng || loc.lan || "NA",
        },
      };
    });

    // Apply filtering
    if (search) {
      normalized = normalized.filter((o: any) => {
        const fullName = `${o.user.first_name} ${o.user.middle_name} ${o.user.last_name}`.toLowerCase();
        const email = o.user.email.toLowerCase();
        const mobile = (o.user.mobile || "").toLowerCase();
        const id = o.id.toLowerCase();
        return fullName.includes(search) || email.includes(search) || mobile.includes(search) || id.includes(search);
      });
    }

    if (statusParam !== null && statusParam !== "" && statusParam !== "all") {
      const targetStatus = parseInt(statusParam, 10);
      if (!isNaN(targetStatus)) {
        normalized = normalized.filter((o: any) => o.status === targetStatus);
      }
    }

    // Return paginated object or full array depending on request
    if (isPaginatedReq) {
      const total = normalized.length;
      const totalPages = Math.max(1, Math.ceil(total / perPage));
      const start = (page - 1) * perPage;
      const paginatedUsers = normalized.slice(start, start + perPage);

      return NextResponse.json({
        owners: paginatedUsers,
        total,
        page,
        per_page: perPage,
        total_pages: totalPages,
      });
    }

    // Default: return list of owners (preserves compatibility with Store.tsx)
    return NextResponse.json(normalized);
  } catch (error: any) {
    console.error("[/api/owner] GET error:", error);
    return NextResponse.json([]);
  }
}

// ── PATCH / PUT: Update Owner Data via FastAPI & DB ─────────────────────────
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      id, user_id, first_name, middle_name, last_name, email, mobile, country_code, gender, status,
      location_name, address, city, state, country, zip_code, lat, lan, lng, name
    } = body;

    const targetUserId = user_id || id;
    if (!targetUserId) {
      return NextResponse.json({ success: false, message: "Missing owner user_id or id" }, { status: 400 });
    }

    const headers = getFastApiAuthHeaders(request);

    // 1. Send update to FastAPI
    const fastApiPayload: any = {};
    if (first_name !== undefined) fastApiPayload.first_name = first_name;
    if (middle_name !== undefined) fastApiPayload.middle_name = middle_name;
    if (last_name !== undefined) fastApiPayload.last_name = last_name;
    if (email !== undefined) fastApiPayload.email = email;
    if (mobile !== undefined) fastApiPayload.mobile = mobile;
    if (country_code !== undefined) fastApiPayload.country_code = country_code;
    if (gender !== undefined) fastApiPayload.gender = gender;
    if (status !== undefined) fastApiPayload.status = Number(status);

    const locCountry = country !== undefined ? (String(country).trim() || "NA") : undefined;
    if (location_name !== undefined || name !== undefined) fastApiPayload.name = location_name || name;
    if (location_name !== undefined) fastApiPayload.location_name = location_name;
    if (address !== undefined) fastApiPayload.address = address;
    if (city !== undefined) fastApiPayload.city = city;
    if (state !== undefined) fastApiPayload.state = state;
    if (locCountry !== undefined) fastApiPayload.country = locCountry;
    if (zip_code !== undefined) fastApiPayload.zip_code = zip_code;
    if (lat !== undefined) fastApiPayload.lat = lat;
    if (lan !== undefined || lng !== undefined) fastApiPayload.lan = lan || lng;

    let fastApiSuccess = false;
    try {
      let patchResult = await patchToFastAPI(`/owner-profile-patch/${targetUserId}`, fastApiPayload, headers, 5000);
      if (!patchResult?.data?.success) {
        patchResult = await patchToFastAPI(`/api/v1/admin/users/${targetUserId}`, fastApiPayload, headers, 5000);
      }
      if (patchResult?.data?.success) {
        fastApiSuccess = true;
      }
    } catch (fErr: any) {
      console.warn("[/api/owner] FastAPI PATCH warning:", fErr?.message);
    }

    // 2. Direct DB Sync to ensure database is always in sync
    try {
      const client = await pool.connect();
      try {
        // Update User table
        const userUpdates: string[] = [];
        const userParams: any[] = [];
        let pIdx = 1;

        if (first_name !== undefined) {
          userUpdates.push(`first_name = $${pIdx++}`);
          userParams.push(first_name);
        }
        if (middle_name !== undefined) {
          userUpdates.push(`middle_name = $${pIdx++}`);
          userParams.push(middle_name);
        }
        if (last_name !== undefined) {
          userUpdates.push(`last_name = $${pIdx++}`);
          userParams.push(last_name);
        }
        if (email !== undefined) {
          userUpdates.push(`email = $${pIdx++}`);
          userParams.push(email);
        }
        if (mobile !== undefined) {
          userUpdates.push(`mobile = $${pIdx++}`);
          userParams.push(mobile);
        }
        if (country_code !== undefined) {
          userUpdates.push(`country_code = $${pIdx++}`);
          userParams.push(country_code);
        }
        if (gender !== undefined) {
          userUpdates.push(`gender = $${pIdx++}`);
          userParams.push(gender);
        }

        if (userUpdates.length > 0) {
          userUpdates.push(`"updatedAt" = NOW()`);
          userParams.push(targetUserId);
          const uSql = `UPDATE "User" SET ${userUpdates.join(", ")} WHERE id = $${pIdx} OR id IN (SELECT user_id FROM "Owner" WHERE id = $${pIdx})`;
          await client.query(uSql, userParams);
        }

        // Update Owner table status
        if (status !== undefined) {
          await client.query(
            `UPDATE "Owner" SET status = $1, "updatedAt" = NOW() WHERE user_id = $2 OR id = $2`,
            [Number(status), targetUserId]
          );
        }

        // Update Location table if location fields are passed
        const hasLocationFields = [location_name, address, city, state, locCountry, zip_code, lat, lng, lan].some(
          (v) => v !== undefined
        );

        if (hasLocationFields) {
          // Check existing location id for User or Owner
          const locCheck = await client.query(
            `SELECT location_id FROM "User" WHERE id = $1 UNION SELECT loaction_id FROM "Owner" WHERE user_id = $1 OR id = $1`,
            [targetUserId]
          );
          let existingLocId = locCheck.rows.find((r) => r.location_id || r.loaction_id)?.location_id ||
            locCheck.rows.find((r) => r.location_id || r.loaction_id)?.loaction_id;

          if (existingLocId) {
            const locUpdates: string[] = [];
            const locParams: any[] = [];
            let lIdx = 1;

            if (location_name !== undefined || name !== undefined) {
              locUpdates.push(`name = $${lIdx++}`);
              locParams.push(location_name || name || "NA");
            }
            if (address !== undefined) {
              locUpdates.push(`address = $${lIdx++}`);
              locParams.push(address || "NA");
            }
            if (city !== undefined) {
              locUpdates.push(`city = $${lIdx++}`);
              locParams.push(city || "NA");
            }
            if (state !== undefined) {
              locUpdates.push(`state = $${lIdx++}`);
              locParams.push(state || "NA");
            }
            if (locCountry !== undefined) {
              locUpdates.push(`country = $${lIdx++}`);
              locParams.push(locCountry || "NA");
            }
            if (zip_code !== undefined) {
              locUpdates.push(`zip_code = $${lIdx++}`);
              locParams.push(zip_code || "NA");
            }
            if (lat !== undefined) {
              locUpdates.push(`lat = $${lIdx++}`);
              locParams.push(lat || "NA");
            }
            if (lan !== undefined || lng !== undefined) {
              locUpdates.push(`lan = $${lIdx++}`);
              locParams.push(lan || lng || "NA");
            }

            if (locUpdates.length > 0) {
              locUpdates.push(`"updatedAt" = NOW()`);
              locParams.push(existingLocId);
              await client.query(
                `UPDATE "Location" SET ${locUpdates.join(", ")} WHERE id = $${lIdx}`,
                locParams
              );
            }
          } else {
            // Create new Location and link
            const newLocId = `loc_${Math.random().toString(36).substring(2, 11)}`;
            await client.query(
              `INSERT INTO "Location" (id, name, address, city, state, zip_code, country, lat, lan, "createdAt", "updatedAt")
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
              [
                newLocId,
                location_name || name || "NA",
                address || "NA",
                city || "NA",
                state || "NA",
                zip_code || "NA",
                locCountry || "NA",
                lat || "NA",
                lan || lng || "NA",
              ]
            );
            await client.query(
              `UPDATE "User" SET location_id = $1, "updatedAt" = NOW() WHERE id = $2`,
              [newLocId, targetUserId]
            );
            await client.query(
              `UPDATE "Owner" SET loaction_id = $1, "updatedAt" = NOW() WHERE user_id = $2 OR id = $2`,
              [newLocId, targetUserId]
            );
          }
        }
      } finally {
        client.release();
      }
    } catch (dbErr: any) {
      console.warn("[/api/owner] Direct DB update sync error:", dbErr?.message);
    }

    return NextResponse.json({
      success: true,
      message: "Owner updated successfully",
      fastApiSynced: fastApiSuccess,
    });
  } catch (err: any) {
    console.error("[/api/owner] PATCH error:", err);
    return NextResponse.json({ success: false, message: err?.message || "Failed to update owner" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  return PATCH(request);
}

// ── POST: Actions (Activate, Inactivate, Delete) ───────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, id, user_id } = body;
    const targetId = id || user_id;

    if (!targetId) {
      return NextResponse.json({ success: false, message: "Missing owner ID" }, { status: 400 });
    }

    const headers = getFastApiAuthHeaders(request);

    if (action === "activate" || action === "inactivate") {
      const newStatus = action === "activate" ? 1 : 0;
      const endpoint = action === "activate" ? `/owner/activate_owner/${targetId}` : `/owner/inactivate_owner/${targetId}`;

      // Try FastAPI
      await patchToFastAPI(endpoint, {}, headers, 4000);

      // Sync DB
      try {
        const client = await pool.connect();
        try {
          await client.query(`UPDATE "Owner" SET status = $1, "updatedAt" = NOW() WHERE id = $2 OR user_id = $2`, [newStatus, targetId]);
        } finally {
          client.release();
        }
      } catch {}

      return NextResponse.json({
        success: true,
        message: `Owner ${action === "activate" ? "activated" : "deactivated"} successfully`,
      });
    }

    if (action === "delete") {
      // Try FastAPI
      for (const base of FASTAPI_CANDIDATES) {
        try {
          await axios.delete(`${base}/owner/delete_owner/${targetId}`, { headers, timeout: 4000 });
          break;
        } catch {}
      }

      // Sync DB
      try {
        const client = await pool.connect();
        try {
          await client.query(`DELETE FROM "Owner" WHERE id = $1 OR user_id = $1`, [targetId]);
        } finally {
          client.release();
        }
      } catch {}

      return NextResponse.json({
        success: true,
        message: "Owner deleted successfully",
      });
    }

    // Default fallback to update
    return PATCH(request);
  } catch (err: any) {
    console.error("[/api/owner] POST error:", err);
    return NextResponse.json({ success: false, message: err?.message || "Action failed" }, { status: 500 });
  }
}
