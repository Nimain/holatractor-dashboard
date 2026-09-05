import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import pool from "@/utils/Database/db";
import { getFastApiAuthHeaders } from "@/utils/auth/serverAuth";

export const dynamic = "force-dynamic";

const FASTAPI_CANDIDATES = [
  "http://127.0.0.1:8000",
  "http://localhost:8000",
  (process.env.NEXT_PUBLIC_TRACTOR_AI_URL || "").replace(/\/$/, ""),
  (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, ""),
  "https://tractorai.sinsignal.com",
].filter(Boolean);

async function fetchFromFastAPI(endpoint: string, headers: any, timeout = 5000) {
  for (const base of FASTAPI_CANDIDATES) {
    try {
      const res = await axios.get(`${base}${endpoint}`, { headers, timeout });
      if (res.data) return { data: res.data, base };
    } catch {
      // try next candidate
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
  if (
    t.startsWith("file://") ||
    t.startsWith("file:/") ||
    t === "NO" ||
    t.toLowerCase() === "null" ||
    t.toLowerCase() === "undefined"
  ) {
    return "";
  }
  return t;
}

// ── GET: List Farmers ────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = (searchParams.get("search") || "").trim().toLowerCase();
    const statusParam = searchParams.get("status");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const perPage = Math.max(1, parseInt(searchParams.get("per_page") || "20", 10));
    const isPaginatedReq =
      searchParams.has("page") ||
      searchParams.has("per_page") ||
      searchParams.get("format") === "paginated";

    const headers = getFastApiAuthHeaders(request);

    let farmers: any[] = [];

    // 1. Try FastAPI candidates first
    let fastApiResult = await fetchFromFastAPI("/api/v1/admin/farmers", headers, 5000);
    if (!fastApiResult || !Array.isArray(fastApiResult.data) || fastApiResult.data.length === 0) {
      fastApiResult = await fetchFromFastAPI("/admin/farmers", headers, 5000);
    }
    if (!fastApiResult || !Array.isArray(fastApiResult.data) || fastApiResult.data.length === 0) {
      fastApiResult = await fetchFromFastAPI("/farmers", headers, 5000);
    }
    if (fastApiResult && Array.isArray(fastApiResult.data) && fastApiResult.data.length > 0) {
      farmers = fastApiResult.data;
    }

    // 2. Direct PostgreSQL fallback if FastAPI is empty
    if (!farmers.length) {
      try {
        const client = await pool.connect();
        try {
          const res = await client.query(`
            SELECT 
              COALESCE(f.id, u.id) as farmer_id,
              u.id as user_id,
              COALESCE(f.role_id, 'farmer_role') as role_id,
              f.created_by,
              COALESCE(f."Status", 1) as "Status",
              COALESCE(f.base_id, u.id) as base_id,
              f.device_type,
              f.device_id,
              f.home_location_id,
              f.farm_location_id,
              COALESCE(f.currency, 'USD') as currency,
              COALESCE(f.currency_code, '$') as currency_code,
              COALESCE(f."createdAt", u."createdAt") as "createdAt",
              COALESCE(f."updatedAt", u."updatedAt") as "updatedAt",
              u.first_name, 
              u.middle_name, 
              u.last_name, 
              u.email, 
              u.mobile, 
              u.gender, 
              u.image, 
              u.country_code, 
              u."emailVerified", 
              u."authType"
            FROM "User" u
            LEFT JOIN "Farmer" f ON f.user_id = u.id
            WHERE u.id IN (SELECT user_id FROM "Farmer")
               OR u.id IN (SELECT owner_id FROM "Farm") 
               OR u.id IN (SELECT user_id FROM "Booking")
            ORDER BY COALESCE(f."createdAt", u."createdAt") DESC
          `);

          farmers = res.rows.map((r: any) => ({
            id: String(r.farmer_id),
            user_id: String(r.user_id),
            role_id: String(r.role_id),
            created_by: r.created_by ? String(r.created_by) : null,
            Status: Number(r.Status || 1),
            base_id: String(r.base_id),
            device_type: r.device_type ? String(r.device_type) : null,
            device_id: r.device_id ? String(r.device_id) : null,
            home_location_id: r.home_location_id ? String(r.home_location_id) : null,
            farm_location_id: r.farm_location_id ? String(r.farm_location_id) : null,
            currency: String(r.currency),
            currency_code: String(r.currency_code),
            createdAt: r.createdAt ? String(r.createdAt) : null,
            updatedAt: r.updatedAt ? String(r.updatedAt) : null,
            user: {
              id: String(r.user_id),
              first_name: String(r.first_name || "Farmer"),
              middle_name: String(r.middle_name || ""),
              last_name: String(r.last_name || ""),
              authType: String(r.authType || "EMAIL"),
              gender: String(r.gender || "male"),
              emailVerified: r.emailVerified !== null ? Boolean(r.emailVerified) : true,
              image: sanitizeImageUrl(r.image),
              mobile: r.mobile ? String(r.mobile) : null,
              country_code: String(r.country_code || "+591"),
            },
          }));
        } finally {
          client.release();
        }
      } catch (dbErr: any) {
        console.warn("[/api/farmer] DB fallback error:", dbErr?.message);
      }
    }

    // Normalize farmer items
    let normalized = farmers.map((f: any) => {
      const u = f.user || {};
      return {
        id: String(f.id || f.user_id || u.id),
        user_id: String(f.user_id || u.id || f.id),
        role_id: String(f.role_id || "farmer_role"),
        created_by: f.created_by ? String(f.created_by) : null,
        Status: Number(f.Status ?? (f.status ?? 1)),
        base_id: String(f.base_id || f.id || u.id),
        device_type: f.device_type ? String(f.device_type) : null,
        device_id: f.device_id ? String(f.device_id) : null,
        home_location_id: f.home_location_id ? String(f.home_location_id) : null,
        farm_location_id: f.farm_location_id ? String(f.farm_location_id) : null,
        currency: String(f.currency || "USD"),
        currency_code: String(f.currency_code || "$"),
        createdAt: String(f.createdAt || u.createdAt || new Date().toISOString()),
        updatedAt: String(f.updatedAt || u.updatedAt || new Date().toISOString()),
        user: {
          id: String(u.id || f.user_id || f.id),
          first_name: String(u.first_name || f.first_name || "Farmer"),
          middle_name: String(u.middle_name || f.middle_name || ""),
          last_name: String(u.last_name || f.last_name || ""),
          authType: String(u.authType || f.authType || "EMAIL"),
          gender: String(u.gender || f.gender || "male"),
          emailVerified:
            u.emailVerified !== undefined
              ? Boolean(u.emailVerified)
              : f.emailVerified !== undefined
              ? Boolean(f.emailVerified)
              : true,
          email: String(u.email || f.email || ""),
          image: sanitizeImageUrl(u.image || f.image),
          mobile: u.mobile || f.mobile ? String(u.mobile || f.mobile) : null,
          country_code: String(u.country_code || f.country_code || "+591"),
        },
      };
    });

    // Apply filtering
    if (search) {
      normalized = normalized.filter((item: any) => {
        const fullName = `${item.user.first_name} ${item.user.middle_name} ${item.user.last_name}`.toLowerCase();
        const email = (item.user.email || "").toLowerCase();
        const mobile = (item.user.mobile || "").toLowerCase();
        const id = item.id.toLowerCase();
        return fullName.includes(search) || email.includes(search) || mobile.includes(search) || id.includes(search);
      });
    }

    if (statusParam !== null && statusParam !== "" && statusParam !== "all") {
      const targetStatus = parseInt(statusParam, 10);
      if (!isNaN(targetStatus)) {
        normalized = normalized.filter((item: any) => item.Status === targetStatus);
      }
    }

    // Return paginated object or full array depending on request
    if (isPaginatedReq) {
      const total = normalized.length;
      const totalPages = Math.max(1, Math.ceil(total / perPage));
      const start = (page - 1) * perPage;
      const paginatedFarmers = normalized.slice(start, start + perPage);

      return NextResponse.json({
        farmers: paginatedFarmers,
        total,
        page,
        per_page: perPage,
        total_pages: totalPages,
      });
    }

    // Default: return list of farmers for full compatibility
    return NextResponse.json(normalized);
  } catch (error: any) {
    console.error("[/api/farmer] GET error:", error);
    return NextResponse.json([]);
  }
}

// ── PATCH: Update Farmer Data via FastAPI & DB ──────────────────────────────
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, user_id, first_name, middle_name, last_name, email, mobile, country_code, gender, status } = body;

    const targetUserId = user_id || id;
    if (!targetUserId) {
      return NextResponse.json({ success: false, message: "Missing farmer user_id or id" }, { status: 400 });
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
    if (status !== undefined) fastApiPayload.Status = Number(status);

    let fastApiSuccess = false;
    try {
      const patchResult = await patchToFastAPI(`/api/v1/admin/users/${targetUserId}`, fastApiPayload, headers, 5000);
      if (patchResult?.data) {
        fastApiSuccess = true;
      }
    } catch (fErr: any) {
      console.warn("[/api/farmer] FastAPI PATCH warning:", fErr?.message);
    }

    // 2. Direct DB Sync to ensure database is updated
    try {
      const client = await pool.connect();
      try {
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
          await client.query(
            `UPDATE "User" SET ${userUpdates.join(", ")} WHERE id = $${pIdx}`,
            userParams
          );
        }

        // Update Farmer Status if provided
        if (status !== undefined) {
          await client.query(
            `UPDATE "Farmer" SET "Status" = $1, "updatedAt" = NOW() WHERE user_id = $2 OR id = $2`,
            [Number(status), targetUserId]
          );
        }

        return NextResponse.json({
          success: true,
          message: "Farmer updated successfully",
          fastApiSuccess,
        });
      } finally {
        client.release();
      }
    } catch (dbErr: any) {
      console.error("[/api/farmer] DB update error:", dbErr);
      return NextResponse.json({
        success: fastApiSuccess,
        message: fastApiSuccess ? "Updated via FastAPI" : "DB update failed: " + dbErr.message,
      });
    }
  } catch (error: any) {
    console.error("[/api/farmer] PATCH error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
