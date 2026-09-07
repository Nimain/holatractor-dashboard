import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import pool from "@/utils/Database/db";
import { getFastApiAuthHeaders } from "@/utils/auth/serverAuth";

export const dynamic = "force-dynamic";

const DYNAMIC_API_BASE = [
  process.env.NEXT_PUBLIC_TRACTOR_AI_URL,
  process.env.NEXT_PUBLIC_API_URL,
  "https://tractorai.sinsignal.com",
]
  .map((u) => (u || "").replace(/\/$/, ""))
  .find((u) => Boolean(u) && !u.includes("localhost") && !u.includes("127.0.0.1")) || "https://tractorai.sinsignal.com";

type UserRole = "farmer" | "owner" | "agent" | "dealer" | "operator" | "mechanic" | "admin";

const FASTAPI_ENDPOINTS: Record<UserRole, string> = {
  farmer:   "/api/v1/admin/farmers",
  owner:    "/api/v1/admin/owners",
  agent:    "/api/v1/admin/agents",
  dealer:   "/api/v1/admin/dealers",
  operator: "/api/v1/admin/operators",
  mechanic: "/api/v1/admin/mechanics",
  admin:    "/api/v1/admin/farmers",
};

// In-memory cache for farmer role to avoid repeating large DB query / FastAPI timeout
let cachedFarmerUsers: Record<string, any>[] | null = null;
let lastFarmerUsersCacheTime = 0;
const FARMER_CACHE_TTL = 60 * 1000;

// Exact column names confirmed from DB schema inspection
const ROLE_DB_QUERIES: Record<UserRole, string> = {
  farmer: `
    SELECT
      COALESCE(f.id, u.id)          AS id,
      u.id                          AS user_id,
      u.first_name, u.middle_name, u.last_name,
      u.email, u.mobile, u.gender, u.image, u.country_code,
      u."emailVerified", u."authType",
      COALESCE(f."createdAt", u."createdAt") AS "createdAt",
      COALESCE(f."updatedAt", u."updatedAt") AS "updatedAt",
      COALESCE(f."Status", 1)       AS "Status",
      COALESCE(f.currency, 'USD')   AS currency
    FROM "User" u
    LEFT JOIN "Farmer" f ON f.user_id = u.id
    WHERE u.id IN (SELECT user_id FROM "Farmer")
       OR u.id IN (SELECT owner_id FROM "Farm")
       OR u.id IN (SELECT user_id FROM "Booking")
    ORDER BY COALESCE(f."createdAt", u."createdAt") DESC
  `,
  owner: `
    SELECT
      o.id, o.user_id,
      u.first_name, u.middle_name, u.last_name,
      u.email, u.mobile, u.gender, u.image, u.country_code,
      u."emailVerified", u."authType",
      COALESCE(o."createdAt", u."createdAt") AS "createdAt",
      COALESCE(o."updatedAt", u."updatedAt") AS "updatedAt",
      COALESCE(o.status, 1)         AS "Status",
      json_build_object(
        'id', l.id,
        'name', COALESCE(NULLIF(l.name, ''), 'NA'),
        'address', COALESCE(NULLIF(l.address, ''), 'NA'),
        'city', COALESCE(NULLIF(l.city, ''), 'NA'),
        'state', COALESCE(NULLIF(l.state, ''), 'NA'),
        'zip_code', COALESCE(NULLIF(l.zip_code, ''), 'NA'),
        'country', COALESCE(NULLIF(l.country, ''), 'NA'),
        'lat', l.lat,
        'lan', l.lan,
        'lng', l.lan
      ) AS location
    FROM "Owner" o
    LEFT JOIN "User" u ON u.id = o.user_id
    LEFT JOIN "Location" l ON l.id = COALESCE(o.loaction_id, u.location_id)
    ORDER BY COALESCE(o."createdAt", u."createdAt") DESC
    LIMIT 500
  `,
  agent: `
    SELECT
      a.id, a.user_id,
      u.first_name, u.middle_name, u.last_name,
      u.email, u.mobile, u.gender, u.image, u.country_code,
      u."emailVerified", u."authType",
      COALESCE(a."createdAt", u."createdAt") AS "createdAt",
      COALESCE(a."updatedAt", u."updatedAt") AS "updatedAt",
      COALESCE(a.status, 1)         AS "Status"
    FROM "Agent" a
    LEFT JOIN "User" u ON u.id = a.user_id
    ORDER BY COALESCE(a."createdAt", u."createdAt") DESC
    LIMIT 500
  `,
  dealer: `
    SELECT
      d.id, d.user_id,
      u.first_name, u.middle_name, u.last_name,
      u.email, u.mobile, u.gender, u.image, u.country_code,
      u."emailVerified", u."authType",
      COALESCE(d."createdAt", u."createdAt") AS "createdAt",
      COALESCE(d."updatedAt", u."updatedAt") AS "updatedAt",
      COALESCE(d."Status", 1)       AS "Status"
    FROM "Dealer" d
    LEFT JOIN "User" u ON u.id = d.user_id
    ORDER BY COALESCE(d."createdAt", u."createdAt") DESC
    LIMIT 500
  `,
  operator: `
    SELECT
      op.id, op.user_id,
      u.first_name, u.middle_name, u.last_name,
      u.email, u.mobile, u.gender, u.image, u.country_code,
      u."emailVerified", u."authType",
      COALESCE(op."createdAt", u."createdAt") AS "createdAt",
      COALESCE(op."updatedAt", u."updatedAt") AS "updatedAt",
      COALESCE(op."Status", 1)      AS "Status"
    FROM "Operator" op
    LEFT JOIN "User" u ON u.id = op.user_id
    ORDER BY COALESCE(op."createdAt", u."createdAt") DESC
    LIMIT 500
  `,
  mechanic: `
    SELECT
      m.id, m.user_id,
      u.first_name, u.middle_name, u.last_name,
      u.email, u.mobile, u.gender, u.image, u.country_code,
      u."emailVerified", u."authType",
      COALESCE(m."createdAt", u."createdAt") AS "createdAt",
      COALESCE(m."updatedAt", u."updatedAt") AS "updatedAt",
      COALESCE(m."Status", 1)     AS "Status",
      m.specialization,
      m.experience_years,
      m.license_number,
      m.is_available
    FROM "Mechanic" m
    LEFT JOIN "User" u ON u.id = m.user_id
    ORDER BY COALESCE(m."createdAt", u."createdAt") DESC
    LIMIT 500
  `,
  admin: `
    SELECT
      up.id, up.user_id,
      u.first_name, u.middle_name, u.last_name,
      u.email, u.mobile, u.gender, u.image, u.country_code,
      u."emailVerified", u."authType",
      COALESCE(up."createdAt", u."createdAt") AS "createdAt",
      COALESCE(up."updatedAt", u."updatedAt") AS "updatedAt",
      1 AS "Status"
    FROM "UserProfile" up
    LEFT JOIN "User" u ON u.id = up.user_id
    WHERE up.is_admin = TRUE
       OR up."isAdmin" = TRUE
       OR u.id IN (
           SELECT u2.id FROM "User" u2
           WHERE LOWER(COALESCE(u2."authType",'')) = 'admin'
       )
    ORDER BY COALESCE(up."createdAt", u."createdAt") DESC
    LIMIT 200
  `,
};

// Simpler admin query fallback — all users with admin role assigned
const ADMIN_FALLBACK_QUERY = `
  SELECT
    u.id, u.id AS user_id,
    u.first_name, u.middle_name, u.last_name,
    u.email, u.mobile, u.gender, u.image, u.country_code,
    u."emailVerified", u."authType",
    u."createdAt", u."updatedAt",
    1 AS "Status"
  FROM "User" u
  JOIN "Role" r ON r.id IN (
      SELECT role_id FROM "Farmer" WHERE user_id = u.id
      UNION SELECT role_id FROM "Owner" WHERE user_id = u.id
      UNION SELECT role_id FROM "Agent" WHERE user_id = u.id
      UNION SELECT role_id FROM "Dealer" WHERE user_id = u.id
      UNION SELECT role_id FROM "Operator" WHERE user_id = u.id
  )
  WHERE LOWER(r.name) LIKE '%admin%'
  ORDER BY u."createdAt" DESC
  LIMIT 200
`;

function sanitizeImg(img?: string | null): string | null {
  if (!img || typeof img !== "string") return null;
  const t = img.trim();
  if (t.startsWith("file://") || t.startsWith("file:/") || t === "NO" || t.toLowerCase() === "null" || t.toLowerCase() === "undefined") return null;
  return t;
}

function normalizeRow(r: Record<string, any>, role: UserRole): Record<string, any> {
  return {
    id: String(r.id || r.user_id || ""),
    user_id: String(r.user_id || r.id || ""),
    role,
    first_name: String(r.first_name || "User"),
    middle_name: String(r.middle_name || ""),
    last_name: String(r.last_name || ""),
    email: String(r.email || ""),
    mobile: r.mobile ? String(r.mobile) : null,
    country_code: String(r.country_code || "+591"),
    gender: String(r.gender || "male"),
    image: sanitizeImg(r.image),
    authType: String(r.authType || "EMAIL"),
    emailVerified: Boolean(r.emailVerified ?? true),
    Status: Number(r.Status ?? r.status ?? 1),
    currency: String(r.currency || "USD"),
    createdAt: String(r.createdAt || new Date().toISOString()),
    updatedAt: String(r.updatedAt || new Date().toISOString()),
    specialization: Array.isArray(r.specialization)
      ? r.specialization
      : typeof r.specialization === "string"
      ? r.specialization.replace(/[{}"']/g, "").split(",").map((s: string) => s.trim()).filter(Boolean)
      : [],
    experience_years: r.experience_years !== undefined && r.experience_years !== null ? Number(r.experience_years) : 0,
    license_number: r.license_number ? String(r.license_number) : null,
    is_available: r.is_available !== undefined ? Boolean(r.is_available) : true,
    dealer_id: r.dealer_id ? String(r.dealer_id) : null,
    location: r.location && typeof r.location === "object" ? {
      id: r.location.id || null,
      name: r.location.name && r.location.name !== "null" ? r.location.name : "NA",
      address: r.location.address && r.location.address !== "null" ? r.location.address : "NA",
      city: r.location.city && r.location.city !== "null" ? r.location.city : "NA",
      state: r.location.state && r.location.state !== "null" ? r.location.state : "NA",
      zip_code: r.location.zip_code && r.location.zip_code !== "null" ? r.location.zip_code : "NA",
      country: r.location.country && r.location.country !== "null" ? r.location.country : "NA",
      lat: r.location.lat ?? null,
      lan: r.location.lan ?? r.location.lng ?? null,
      lng: r.location.lan ?? r.location.lng ?? null,
    } : {
      id: null,
      name: "NA",
      address: "NA",
      city: "NA",
      state: "NA",
      zip_code: "NA",
      country: "NA",
      lat: null,
      lan: null,
      lng: null,
    },
  };
}

function normalizeFastApiUser(u: any, role: UserRole): Record<string, any> {
  const user = u.user || u;
  return normalizeRow(
    {
      id: u.id,
      user_id: u.user_id || user.id || u.id,
      first_name: user.first_name || u.first_name,
      middle_name: user.middle_name || u.middle_name,
      last_name: user.last_name || u.last_name,
      email: user.email || u.email,
      mobile: user.mobile || u.mobile,
      country_code: user.country_code || u.country_code,
      gender: user.gender || u.gender,
      image: user.image || u.image,
      authType: user.authType || u.authType,
      emailVerified: user.emailVerified ?? u.emailVerified,
      Status: u.Status ?? u.status ?? 1,
      currency: u.currency,
      createdAt: u.createdAt || u.created_at,
      updatedAt: u.updatedAt || u.updated_at,
      specialization: u.specialization || user.specialization,
      experience_years: u.experience_years ?? user.experience_years,
      license_number: u.license_number || user.license_number,
      is_available: u.is_available ?? user.is_available,
      dealer_id: u.dealer_id || user.dealer_id,
      location: u.location || user.location,
    },
    role
  );
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = (searchParams.get("role") || "farmer") as UserRole;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const perPage = Math.min(100, Math.max(5, parseInt(searchParams.get("per_page") || "20")));
    const search = (searchParams.get("search") || "").toLowerCase().trim();

    const authHeaders = getFastApiAuthHeaders(request);
    const bearerToken = authHeaders.Authorization?.replace(/^Bearer\s+/i, "") || "";
    const fastApiHeaders = {
      ...authHeaders,
      "x-admin-key": bearerToken,
      "x-api-key": bearerToken,
    };

    let users: Record<string, any>[] = [];

    // For farmer, check cache first to ensure instant response (< 5ms)
    if (role === "farmer" && cachedFarmerUsers && cachedFarmerUsers.length > 0 && Date.now() - lastFarmerUsersCacheTime < FARMER_CACHE_TTL) {
      users = [...cachedFarmerUsers];
    }

    // 1. Try dynamic FastAPI endpoint for non-farmer roles
    // Note: For 'farmer', FastAPI /api/v1/admin/farmers streams 2.1MB unpaginated taking 15+ seconds over WAN,
    // which always times out a 4000ms window. DB query for farmer takes only ~1.5s.
    if (users.length === 0 && role !== "farmer") {
      try {
        const endpoint = FASTAPI_ENDPOINTS[role];
        let res: any = null;
        try {
          res = await axios.get(`${DYNAMIC_API_BASE}${endpoint}`, {
            headers: fastApiHeaders,
            timeout: 4000,
          });
        } catch (err) {
          if (role === "owner") {
            try {
              res = await axios.get(`${DYNAMIC_API_BASE}/owners`, {
                headers: fastApiHeaders,
                timeout: 3500,
              });
            } catch {}
          }
        }
        const rawList = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.data?.data) ? res.data.data : [];
        if (rawList.length > 0) {
          users = rawList.map((u: any) => normalizeFastApiUser(u, role));
          // If owner role, enrich missing locations from DB
          if (role === "owner") {
            try {
              const dbRes = await pool.query(ROLE_DB_QUERIES.owner);
              const dbLocMap = new Map<string, any>();
              dbRes.rows.forEach((r: any) => {
                if (r.location && r.location.country && r.location.country !== "NA" && r.location.country !== "Bolivia") {
                  dbLocMap.set(String(r.id), r.location);
                  dbLocMap.set(String(r.user_id), r.location);
                }
              });
              users = users.map((u: any) => {
                const matched = dbLocMap.get(String(u.id)) || dbLocMap.get(String(u.user_id));
                if (matched && (!u.location || !u.location.country || u.location.country === "NA" || u.location.country === "Bolivia")) {
                  return { ...u, location: matched };
                }
                return u;
              });
            } catch {}
          }
        }
      } catch (e: any) {
        // FastAPI not available or auth failed — fall through to DB
      }
    }

    // 2. PostgreSQL direct query fallback (or primary for farmer)
    if (users.length === 0) {
      try {
        let query = ROLE_DB_QUERIES[role];
        if (!query) throw new Error(`No query for role: ${role}`);

        let rows: Record<string, any>[] = [];
        try {
          const res = await pool.query(query);
          rows = res.rows;
        } catch (qErr: any) {
          // Some tables (e.g. UserProfile.is_admin) might not exist — try the admin fallback
          if (role === "admin") {
            const fallback = await pool.query(ADMIN_FALLBACK_QUERY);
            rows = fallback.rows;
          } else {
            throw qErr;
          }
        }

        users = rows.map((r) => normalizeRow(r, role));
        if (role === "farmer" && users.length > 0) {
          cachedFarmerUsers = users;
          lastFarmerUsersCacheTime = Date.now();
        }
      } catch (err: any) {
        console.warn(`[/api/admin/users] DB error for role=${role}:`, err?.message?.slice(0, 120));
        // Last resort: return an empty paginated response rather than 500
        users = [];
      }
    }

    // Deduplicate users by ID
    const seenUserKeys = new Set<string>();
    users = users.filter((u) => {
      const key = String(u.id || u.user_id);
      if (!key || seenUserKeys.has(key)) return false;
      seenUserKeys.add(key);
      return true;
    });

    // Search filter (client-side on the full fetched list)
    if (search) {
      users = users.filter((u) => {
        const name = `${u.first_name} ${u.last_name}`.toLowerCase();
        const email = (u.email || "").toLowerCase();
        const mobile = (u.mobile || "").toLowerCase();
        return name.includes(search) || email.includes(search) || mobile.includes(search);
      });
    }

    const total = users.length;
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const start = (page - 1) * perPage;
    const paginated = users.slice(start, start + perPage);

    return NextResponse.json({
      users: paginated,
      total,
      page,
      per_page: perPage,
      total_pages: totalPages,
      role,
    });
  } catch (error: any) {
    console.error("[/api/admin/users] Unhandled error:", error?.message);
    return NextResponse.json({ users: [], total: 0, page: 1, per_page: 20, total_pages: 0 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, user_id, role, first_name, last_name, email, mobile, status } = body;
    const targetUserId = user_id || id;

    if (!targetUserId) {
      return NextResponse.json({ success: false, message: "Missing user_id or id" }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      // 1. Update User table
      const userUpdates: string[] = [];
      const userParams: any[] = [];
      let pIdx = 1;

      if (first_name !== undefined) {
        userUpdates.push(`first_name = $${pIdx++}`);
        userParams.push(first_name);
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

      if (userUpdates.length > 0) {
        userUpdates.push(`"updatedAt" = NOW()`);
        userParams.push(targetUserId);
        await client.query(`UPDATE "User" SET ${userUpdates.join(", ")} WHERE id = $${pIdx}`, userParams);
      }

      // 2. Update role status in respective table
      if (status !== undefined) {
        const stNum = Number(status);
        const r = (role || "").toLowerCase();

        if (r === "operator") {
          await client.query(`UPDATE "Operator" SET "Status" = $1, "updatedAt" = NOW() WHERE user_id = $2 OR id = $2`, [stNum, targetUserId]);
        } else if (r === "mechanic") {
          await client.query(`UPDATE "Mechanic" SET "Status" = $1, "updatedAt" = NOW() WHERE user_id = $2 OR id = $2`, [stNum, targetUserId]);
        } else if (r === "dealer") {
          await client.query(`UPDATE "Dealer" SET "Status" = $1, "updatedAt" = NOW() WHERE user_id = $2 OR id = $2`, [stNum, targetUserId]);
        } else if (r === "agent") {
          await client.query(`UPDATE "Agent" SET status = $1, "updatedAt" = NOW() WHERE user_id = $2 OR id = $2`, [stNum, targetUserId]);
        } else if (r === "owner") {
          await client.query(`UPDATE "Owner" SET status = $1, "updatedAt" = NOW() WHERE user_id = $2 OR id = $2`, [stNum, targetUserId]);
        } else if (r === "farmer") {
          await client.query(`UPDATE "Farmer" SET "Status" = $1, "updatedAt" = NOW() WHERE user_id = $2 OR id = $2`, [stNum, targetUserId]);
        } else {
          // If role not specified or multiple roles, try updating any matching record
          await client.query(`UPDATE "Operator" SET "Status" = $1, "updatedAt" = NOW() WHERE user_id = $2 OR id = $2`, [stNum, targetUserId]);
          await client.query(`UPDATE "Mechanic" SET "Status" = $1, "updatedAt" = NOW() WHERE user_id = $2 OR id = $2`, [stNum, targetUserId]);
          await client.query(`UPDATE "Dealer" SET "Status" = $1, "updatedAt" = NOW() WHERE user_id = $2 OR id = $2`, [stNum, targetUserId]);
          await client.query(`UPDATE "Agent" SET status = $1, "updatedAt" = NOW() WHERE user_id = $2 OR id = $2`, [stNum, targetUserId]);
          await client.query(`UPDATE "Owner" SET status = $1, "updatedAt" = NOW() WHERE user_id = $2 OR id = $2`, [stNum, targetUserId]);
          await client.query(`UPDATE "Farmer" SET "Status" = $1, "updatedAt" = NOW() WHERE user_id = $2 OR id = $2`, [stNum, targetUserId]);
        }
      }

      // 3. Update Location if provided
      const locObj = body.location || {};
      const locName = body.location_name !== undefined ? body.location_name : locObj.name;
      const locAddr = body.address !== undefined ? body.address : locObj.address;
      const locCity = body.city !== undefined ? body.city : locObj.city;
      const locState = body.state !== undefined ? body.state : locObj.state;
      const locCountry = body.country !== undefined ? body.country : locObj.country;
      const locZip = body.zip_code !== undefined ? body.zip_code : locObj.zip_code;
      const locLat = body.lat !== undefined ? body.lat : locObj.lat;
      const locLan = body.lan !== undefined ? body.lan : (body.lng !== undefined ? body.lng : (locObj.lan ?? locObj.lng));

      const hasLocationUpdate =
        locName !== undefined ||
        locAddr !== undefined ||
        locCity !== undefined ||
        locState !== undefined ||
        locCountry !== undefined ||
        locZip !== undefined ||
        locLat !== undefined ||
        locLan !== undefined;

      if (hasLocationUpdate) {
        const locCheck = await client.query(
          `SELECT location_id FROM "User" WHERE id = $1 UNION SELECT loaction_id FROM "Owner" WHERE user_id = $1 OR id = $1`,
          [targetUserId]
        );
        let existingLocId = locCheck.rows.find((r) => r.location_id || r.loaction_id)?.location_id ||
          locCheck.rows.find((r) => r.location_id || r.loaction_id)?.loaction_id;

        const safeCountry = locCountry === undefined || locCountry === null || String(locCountry).trim() === "" ? "NA" : String(locCountry).trim();

        if (existingLocId) {
          const locUpdates: string[] = [];
          const locParams: any[] = [];
          let lIdx = 1;

          if (locName !== undefined) { locUpdates.push(`name = $${lIdx++}`); locParams.push(locName); }
          if (locAddr !== undefined) { locUpdates.push(`address = $${lIdx++}`); locParams.push(locAddr); }
          if (locCity !== undefined) { locUpdates.push(`city = $${lIdx++}`); locParams.push(locCity); }
          if (locState !== undefined) { locUpdates.push(`state = $${lIdx++}`); locParams.push(locState); }
          if (locCountry !== undefined) { locUpdates.push(`country = $${lIdx++}`); locParams.push(safeCountry); }
          if (locZip !== undefined) { locUpdates.push(`zip_code = $${lIdx++}`); locParams.push(locZip); }
          if (locLat !== undefined) { locUpdates.push(`lat = $${lIdx++}`); locParams.push(locLat ? Number(locLat) : null); }
          if (locLan !== undefined) { locUpdates.push(`lan = $${lIdx++}`); locParams.push(locLan ? Number(locLan) : null); }

          if (locUpdates.length > 0) {
            locUpdates.push(`"updatedAt" = NOW()`);
            locParams.push(existingLocId);
            await client.query(`UPDATE "Location" SET ${locUpdates.join(", ")} WHERE id = $${lIdx}`, locParams);
          }
          await client.query(`UPDATE "User" SET location_id = $1, "updatedAt" = NOW() WHERE id = $2 AND (location_id IS NULL OR location_id != $1)`, [existingLocId, targetUserId]);
          await client.query(`UPDATE "Owner" SET loaction_id = $1, "updatedAt" = NOW() WHERE (user_id = $2 OR id = $2) AND (loaction_id IS NULL OR loaction_id != $1)`, [existingLocId, targetUserId]);
        } else {
          const newLocId = `loc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          await client.query(
            `INSERT INTO "Location" (id, name, address, city, state, zip_code, country, lat, lan, "createdAt", "updatedAt")
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
            [
              newLocId,
              locName || "NA",
              locAddr || "NA",
              locCity || "NA",
              locState || "NA",
              locZip || "NA",
              safeCountry,
              locLat ? Number(locLat) : null,
              locLan ? Number(locLan) : null,
            ]
          );
          await client.query(`UPDATE "User" SET location_id = $1, "updatedAt" = NOW() WHERE id = $2`, [newLocId, targetUserId]);
          await client.query(`UPDATE "Owner" SET loaction_id = $1, "updatedAt" = NOW() WHERE user_id = $2 OR id = $2`, [newLocId, targetUserId]);
        }
      }
    } finally {
      client.release();
    }

    // 4. Notify FastAPI
    try {
      await axios.patch(`${DYNAMIC_API_BASE}/api/v1/admin/users/${targetUserId}`, body, { timeout: 4000 });
    } catch {}
    try {
      await axios.patch(`${DYNAMIC_API_BASE}/owner-profile-patch/${targetUserId}`, body, { timeout: 4000 });
    } catch {}

    return NextResponse.json({ success: true, message: "User updated successfully" });
  } catch (error: any) {
    console.error("[/api/admin/users] PATCH error:", error?.message);
    return NextResponse.json({ success: false, message: error?.message || "Failed to update user" }, { status: 500 });
  }
}

