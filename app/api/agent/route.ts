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

// ── GET: List Agents ────────────────────────────────────────────────────────
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

    let agents: any[] = [];

    // 1. Try FastAPI candidates first
    let fastApiResult = await fetchFromFastAPI("/api/v1/admin/agents", headers, 5000);
    if (!fastApiResult || !Array.isArray(fastApiResult.data) || fastApiResult.data.length === 0) {
      fastApiResult = await fetchFromFastAPI("/admin/agents", headers, 5000);
    }
    if (!fastApiResult || !Array.isArray(fastApiResult.data) || fastApiResult.data.length === 0) {
      fastApiResult = await fetchFromFastAPI("/agents", headers, 5000);
    }
    if (fastApiResult && Array.isArray(fastApiResult.data) && fastApiResult.data.length > 0) {
      agents = fastApiResult.data;
    }

    // 2. Direct PostgreSQL fallback if FastAPI is empty
    if (!agents.length) {
      try {
        const client = await pool.connect();
        try {
          const res = await client.query(`
            SELECT 
              a.id,
              a.user_id,
              a.role_id,
              a.created_by,
              COALESCE(a.status, 1) as status,
              a.base_id,
              COALESCE(a."createdAt", u."createdAt") as "createdAt",
              COALESCE(a."updatedAt", u."updatedAt") as "updatedAt",
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
            FROM "Agent" a
            LEFT JOIN "User" u ON u.id = a.user_id
            ORDER BY COALESCE(a."createdAt", u."createdAt") DESC
          `);

          agents = res.rows.map((m: any) => ({
            id: String(m.id),
            user_id: String(m.user_id),
            role_id: String(m.role_id || "agent_role"),
            created_by: m.created_by ? String(m.created_by) : null,
            status: Number(m.status ?? 1),
            base_id: String(m.base_id || m.id),
            createdAt: String(m.createdAt),
            updatedAt: String(m.updatedAt),
            user: {
              id: String(m.user_id),
              first_name: String(m.first_name || "Agent"),
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
          }));
        } finally {
          client.release();
        }
      } catch (dbErr: any) {
        console.warn("[/api/agent] DB fallback error:", dbErr?.message);
      }
    }

    // Normalize agent items
    let normalized = agents.map((a: any) => {
      const u = a.user || {};
      return {
        id: String(a.id || a.user_id || u.id),
        user_id: String(a.user_id || u.id || a.id),
        role_id: String(a.role_id || "agent_role"),
        created_by: a.created_by ? String(a.created_by) : null,
        status: Number(a.status ?? (a.Status ?? 1)),
        base_id: String(a.base_id || a.id || u.id),
        createdAt: String(a.createdAt || u.createdAt || new Date().toISOString()),
        updatedAt: String(a.updatedAt || u.updatedAt || new Date().toISOString()),
        user: {
          id: String(u.id || a.user_id || a.id),
          first_name: String(u.first_name || a.first_name || "Agent"),
          middle_name: String(u.middle_name || a.middle_name || ""),
          last_name: String(u.last_name || a.last_name || ""),
          authType: String(u.authType || a.authType || "EMAIL"),
          gender: String(u.gender || a.gender || "male"),
          emailVerified:
            u.emailVerified !== undefined
              ? Boolean(u.emailVerified)
              : a.emailVerified !== undefined
              ? Boolean(a.emailVerified)
              : true,
          email: String(u.email || a.email || ""),
          image: sanitizeImageUrl(u.image || a.image),
          mobile: u.mobile || a.mobile ? String(u.mobile || a.mobile) : "",
          country_code: String(u.country_code || a.country_code || "+591"),
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
      const paginatedAgents = normalized.slice(start, start + perPage);

      return NextResponse.json({
        agents: paginatedAgents,
        total,
        page,
        per_page: perPage,
        total_pages: totalPages,
      });
    }

    // Default: return list of agents for full backward compatibility
    return NextResponse.json(normalized);
  } catch (error: any) {
    console.error("[/api/agent] GET error:", error);
    return NextResponse.json([]);
  }
}

// ── PATCH: Update Agent Data via FastAPI & DB ───────────────────────────────
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, user_id, first_name, middle_name, last_name, email, mobile, country_code, gender, status } = body;

    const targetUserId = user_id || id;
    if (!targetUserId) {
      return NextResponse.json({ success: false, message: "Missing agent user_id or id" }, { status: 400 });
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
      console.warn("[/api/agent] FastAPI PATCH warning:", fErr?.message);
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

        // Update Agent Status if provided
        if (status !== undefined) {
          await client.query(
            `UPDATE "Agent" SET status = $1, "updatedAt" = NOW() WHERE user_id = $2 OR id = $2`,
            [Number(status), targetUserId]
          );
        }

        return NextResponse.json({
          success: true,
          message: "Agent updated successfully",
          fastApiSuccess,
        });
      } finally {
        client.release();
      }
    } catch (dbErr: any) {
      console.error("[/api/agent] DB update error:", dbErr);
      return NextResponse.json({
        success: fastApiSuccess,
        message: fastApiSuccess ? "Updated via FastAPI" : "DB update failed: " + dbErr.message,
      });
    }
  } catch (error: any) {
    console.error("[/api/agent] PATCH error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
