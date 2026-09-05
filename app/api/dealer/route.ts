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

const DEALER_ROLE_ID = "cm8d2cvhv009sm167p1c89vrs";

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

// ── GET: List Dealers ────────────────────────────────────────────────────────
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

    let dealers: any[] = [];

    // 1. Try FastAPI candidates first
    let fastApiResult = await fetchFromFastAPI("/api/v1/admin/dealers", headers, 5000);
    if (!fastApiResult || !Array.isArray(fastApiResult.data) || fastApiResult.data.length === 0) {
      fastApiResult = await fetchFromFastAPI("/admin/dealers", headers, 5000);
    }
    if (!fastApiResult || !Array.isArray(fastApiResult.data) || fastApiResult.data.length === 0) {
      fastApiResult = await fetchFromFastAPI("/dealers", headers, 5000);
    }
    if (fastApiResult && Array.isArray(fastApiResult.data) && fastApiResult.data.length > 0) {
      dealers = fastApiResult.data;
    }

    // 2. Direct PostgreSQL fallback if FastAPI returned nothing
    if (!dealers.length) {
      try {
        const client = await pool.connect();
        try {
          const res = await client.query(`
            SELECT 
              d.id,
              d.user_id,
              d.role_id,
              d.created_by,
              COALESCE(d."Status", 1) as status,
              d.base_id,
              COALESCE(d."createdAt", u."createdAt") as "createdAt",
              COALESCE(d."updatedAt", u."updatedAt") as "updatedAt",
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
            FROM "Dealer" d
            LEFT JOIN "User" u ON u.id = d.user_id
            ORDER BY COALESCE(d."createdAt", u."createdAt") DESC
          `);

          const seen = new Set<string>();
          for (const r of res.rows) {
            const uid = String(r.user_id || r.id);
            if (seen.has(uid)) continue;
            seen.add(uid);

            dealers.push({
              id: String(r.id),
              user_id: uid,
              role_id: String(r.role_id || DEALER_ROLE_ID),
              created_by: r.created_by ? String(r.created_by) : null,
              status: Number(r.status ?? 1),
              Status: Number(r.status ?? 1),
              base_id: String(r.base_id || "base_scz"),
              createdAt: String(r.createdAt),
              updatedAt: String(r.updatedAt),
              user: {
                id: uid,
                first_name: String(r.first_name || "Dealer"),
                middle_name: String(r.middle_name || ""),
                last_name: String(r.last_name || ""),
                email: String(r.email || ""),
                mobile: String(r.mobile || ""),
                gender: String(r.gender || "male"),
                image: sanitizeImageUrl(r.image),
                country_code: String(r.country_code || "+591"),
                emailVerified: r.emailVerified !== null ? Boolean(r.emailVerified) : true,
                authType: String(r.authType || "EMAIL"),
              },
            });
          }
        } finally {
          client.release();
        }
      } catch (dbErr: any) {
        console.warn("[/api/dealer] DB Direct fallback notice:", dbErr?.message);
      }
    }

    // Normalize dealer items
    let normalized = dealers.map((d: any) => {
      const u = d.user || {};
      return {
        id: String(d.id || d.user_id || u.id),
        user_id: String(d.user_id || u.id || d.id),
        role_id: String(d.role_id || DEALER_ROLE_ID),
        created_by: d.created_by ? String(d.created_by) : null,
        status: Number(d.status ?? (d.Status ?? 1)),
        Status: Number(d.Status ?? (d.status ?? 1)),
        base_id: String(d.base_id || d.id || u.id || "base_scz"),
        createdAt: String(d.createdAt || u.createdAt || new Date().toISOString()),
        updatedAt: String(d.updatedAt || u.updatedAt || new Date().toISOString()),
        user: {
          id: String(u.id || d.user_id || d.id),
          first_name: String(u.first_name || d.first_name || "Dealer"),
          middle_name: String(u.middle_name || d.middle_name || ""),
          last_name: String(u.last_name || d.last_name || ""),
          authType: String(u.authType || d.authType || "EMAIL"),
          gender: String(u.gender || d.gender || "male"),
          emailVerified:
            u.emailVerified !== undefined
              ? Boolean(u.emailVerified)
              : d.emailVerified !== undefined
              ? Boolean(d.emailVerified)
              : true,
          email: String(u.email || d.email || ""),
          image: sanitizeImageUrl(u.image || d.image),
          mobile: u.mobile || d.mobile ? String(u.mobile || d.mobile) : "",
          country_code: String(u.country_code || d.country_code || "+591"),
        },
      };
    });

    // Apply search filter
    if (search) {
      normalized = normalized.filter((item: any) => {
        const fullName = `${item.user.first_name} ${item.user.middle_name} ${item.user.last_name}`.toLowerCase();
        const email = (item.user.email || "").toLowerCase();
        const mobile = (item.user.mobile || "").toLowerCase();
        const id = item.id.toLowerCase();
        return fullName.includes(search) || email.includes(search) || mobile.includes(search) || id.includes(search);
      });
    }

    // Apply status filter
    if (statusParam !== null && statusParam !== "" && statusParam !== "all") {
      const targetStatus = parseInt(statusParam, 10);
      if (!isNaN(targetStatus)) {
        normalized = normalized.filter((item: any) => item.status === targetStatus);
      }
    }

    // Return paginated object or full array depending on request
    if (isPaginatedReq) {
      const total = normalized.length;
      const totalPages = Math.max(1, Math.ceil(total / perPage));
      const start = (page - 1) * perPage;
      const paginatedDealers = normalized.slice(start, start + perPage);

      return NextResponse.json({
        dealers: paginatedDealers,
        total,
        page,
        per_page: perPage,
        total_pages: totalPages,
      });
    }

    // Default: return list of dealers for backward compatibility
    return NextResponse.json(normalized);
  } catch (error: any) {
    console.error("[/api/dealer] GET error:", error?.message);
    return NextResponse.json([]);
  }
}

// ── PATCH: Update Dealer Data via FastAPI & DB ──────────────────────────────
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, user_id, first_name, middle_name, last_name, email, mobile, country_code, gender, status } = body;

    const targetUserId = user_id || id;
    if (!targetUserId) {
      return NextResponse.json({ success: false, message: "Missing dealer user_id or id" }, { status: 400 });
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

    let fastApiSuccess = false;
    try {
      const patchResult = await patchToFastAPI(`/api/v1/admin/users/${targetUserId}`, fastApiPayload, headers, 5000);
      if (patchResult?.data) {
        fastApiSuccess = true;
      }
    } catch (fErr: any) {
      console.warn("[/api/dealer] FastAPI PATCH warning:", fErr?.message);
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

        // Update Dealer Status if provided (note: column is "Status" with capital S in PostgreSQL)
        if (status !== undefined) {
          await client.query(
            `UPDATE "Dealer" SET "Status" = $1, "updatedAt" = NOW() WHERE user_id = $2 OR id = $2`,
            [Number(status), targetUserId]
          );
        }

        return NextResponse.json({
          success: true,
          message: "Dealer updated successfully",
          fastApiSuccess,
        });
      } finally {
        client.release();
      }
    } catch (dbErr: any) {
      console.error("[/api/dealer] DB update error:", dbErr);
      return NextResponse.json({
        success: fastApiSuccess,
        message: fastApiSuccess ? "Updated via FastAPI" : "DB update failed: " + dbErr.message,
      });
    }
  } catch (error: any) {
    console.error("[/api/dealer] PATCH error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// ── POST: Create New Dealer ─────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = `usr_dlr_${Date.now()}`;
    const dealerId = `dlr_${Date.now()}`;

    const client = await pool.connect();
    try {
      const baseRes = await client.query('SELECT id FROM "Base" LIMIT 1');
      const baseId = baseRes.rows[0]?.id || "cm89t43ky00034wft9fiixpc7";

      await client.query(
        `
        INSERT INTO "User" (
          id, first_name, middle_name, last_name, email, mobile, country_code,
          gender, "authType", "phoneVerified", "emailVerified", "request_to_delete",
          base_id, "createdAt", "updatedAt"
        )
        VALUES ($1, $2, '', $3, $4, $5, '+591', 'male', 'EMAIL', true, true, false, $6, NOW(), NOW())
      `,
        [
          userId,
          body.user?.first_name || body.first_name || "Dealer",
          body.user?.last_name || body.last_name || "",
          body.user?.email || body.email || "",
          body.user?.mobile || body.mobile || "",
          baseId,
        ]
      );

      await client.query(
        `
        INSERT INTO "Dealer" (id, base_id, user_id, role_id, "Status", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, 1, NOW(), NOW())
      `,
        [dealerId, baseId, userId, DEALER_ROLE_ID]
      );
    } finally {
      client.release();
    }

    const newDealer = {
      id: dealerId,
      user_id: userId,
      role_id: DEALER_ROLE_ID,
      created_by: "admin",
      status: 1,
      Status: 1,
      base_id: "base_scz",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      user: {
        id: userId,
        first_name: body.user?.first_name || body.first_name || "Dealer",
        middle_name: "",
        last_name: body.user?.last_name || body.last_name || "",
        email: body.user?.email || body.email || "",
        mobile: body.user?.mobile || body.mobile || "",
        gender: "male",
        image: "",
        country_code: "+591",
        emailVerified: true,
        authType: "EMAIL",
      },
    };

    return NextResponse.json(newDealer, { status: 201 });
  } catch (error: any) {
    console.error("[/api/dealer] POST error:", error?.message);
    return NextResponse.json(
      { message: error?.message || "Failed to create dealer", success: false },
      { status: 500 }
    );
  }
}
