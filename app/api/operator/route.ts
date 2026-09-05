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

const OPERATOR_ROLE_ID = "cm8d2c7d5009em167zmd08dsj";

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

// ── GET: List Operators ──────────────────────────────────────────────────────
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

    let operators: any[] = [];

    // 1. Try FastAPI candidates first
    let fastApiResult = await fetchFromFastAPI("/api/v1/admin/operators", headers, 5000);
    if (!fastApiResult || !Array.isArray(fastApiResult.data) || fastApiResult.data.length === 0) {
      fastApiResult = await fetchFromFastAPI("/admin/operators", headers, 5000);
    }
    if (!fastApiResult || !Array.isArray(fastApiResult.data) || fastApiResult.data.length === 0) {
      fastApiResult = await fetchFromFastAPI("/operators", headers, 5000);
    }
    if (fastApiResult && Array.isArray(fastApiResult.data) && fastApiResult.data.length > 0) {
      operators = fastApiResult.data;
    }

    // 2. Direct PostgreSQL fallback if FastAPI returned nothing
    if (!operators.length) {
      try {
        const client = await pool.connect();
        try {
          const res = await client.query(`
            SELECT 
              op.id,
              op.user_id,
              op.role_id,
              op.created_by,
              op.document_attachment_id,
              COALESCE(op."Status", 1) as status,
              op.base_id,
              COALESCE(op."createdAt", u."createdAt") as "createdAt",
              COALESCE(op."updatedAt", u."updatedAt") as "updatedAt",
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
            FROM "Operator" op
            LEFT JOIN "User" u ON u.id = op.user_id
            ORDER BY COALESCE(op."createdAt", u."createdAt") DESC
          `);

          const seen = new Set<string>();
          for (const r of res.rows) {
            const uid = String(r.user_id || r.id);
            if (seen.has(uid)) continue;
            seen.add(uid);

            operators.push({
              id: String(r.id),
              user_id: uid,
              role_id: String(r.role_id || OPERATOR_ROLE_ID),
              created_by: r.created_by ? String(r.created_by) : null,
              status: Number(r.status ?? 1),
              Status: Number(r.status ?? 1),
              base_id: String(r.base_id || "base_scz"),
              document_attachment_id: r.document_attachment_id ? String(r.document_attachment_id) : null,
              createdAt: String(r.createdAt),
              updatedAt: String(r.updatedAt),
              user: {
                id: uid,
                first_name: String(r.first_name || "Operator"),
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
        console.warn("[/api/operator] DB Direct fallback notice:", dbErr?.message);
      }
    }

    // Normalize operator items
    let normalized = operators.map((op: any) => {
      const u = op.user || {};
      return {
        id: String(op.id || op.user_id || u.id),
        user_id: String(op.user_id || u.id || op.id),
        role_id: String(op.role_id || OPERATOR_ROLE_ID),
        created_by: op.created_by ? String(op.created_by) : null,
        status: Number(op.status ?? (op.Status ?? 1)),
        Status: Number(op.Status ?? (op.status ?? 1)),
        base_id: String(op.base_id || op.id || u.id || "base_scz"),
        document_attachment_id: op.document_attachment_id ? String(op.document_attachment_id) : null,
        createdAt: String(op.createdAt || u.createdAt || new Date().toISOString()),
        updatedAt: String(op.updatedAt || u.updatedAt || new Date().toISOString()),
        user: {
          id: String(u.id || op.user_id || op.id),
          first_name: String(u.first_name || op.first_name || "Operator"),
          middle_name: String(u.middle_name || op.middle_name || ""),
          last_name: String(u.last_name || op.last_name || ""),
          authType: String(u.authType || op.authType || "EMAIL"),
          gender: String(u.gender || op.gender || "male"),
          emailVerified:
            u.emailVerified !== undefined
              ? Boolean(u.emailVerified)
              : op.emailVerified !== undefined
              ? Boolean(op.emailVerified)
              : true,
          email: String(u.email || op.email || ""),
          image: sanitizeImageUrl(u.image || op.image),
          mobile: u.mobile || op.mobile ? String(u.mobile || op.mobile) : "",
          country_code: String(u.country_code || op.country_code || "+591"),
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
      const paginatedOperators = normalized.slice(start, start + perPage);

      return NextResponse.json({
        operators: paginatedOperators,
        total,
        page,
        per_page: perPage,
        total_pages: totalPages,
      });
    }

    // Default: return list of operators for backward compatibility
    return NextResponse.json(normalized);
  } catch (error: any) {
    console.error("[/api/operator] GET error:", error?.message);
    return NextResponse.json([]);
  }
}

// ── PATCH: Update Operator Data via FastAPI & DB ────────────────────────────
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, user_id, first_name, middle_name, last_name, email, mobile, country_code, gender, status } = body;

    const targetUserId = user_id || id;
    if (!targetUserId) {
      return NextResponse.json({ success: false, message: "Missing operator user_id or id" }, { status: 400 });
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
      console.warn("[/api/operator] FastAPI PATCH warning:", fErr?.message);
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

        // Update Operator Status if provided (note: column is "Status" with capital S in PostgreSQL)
        if (status !== undefined) {
          await client.query(
            `UPDATE "Operator" SET "Status" = $1, "updatedAt" = NOW() WHERE user_id = $2 OR id = $2`,
            [Number(status), targetUserId]
          );
        }

        return NextResponse.json({
          success: true,
          message: "Operator updated successfully",
          fastApiSuccess,
        });
      } finally {
        client.release();
      }
    } catch (dbErr: any) {
      console.error("[/api/operator] DB update error:", dbErr);
      return NextResponse.json({
        success: fastApiSuccess,
        message: fastApiSuccess ? "Updated via FastAPI" : "DB update failed: " + dbErr.message,
      });
    }
  } catch (error: any) {
    console.error("[/api/operator] PATCH error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// ── POST: Create New Operator ────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = `usr_op_${Date.now()}`;
    const operatorId = `op_${Date.now()}`;
    const docId = `doc_op_${Date.now()}`;

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
          body.user?.first_name || body.first_name || "Operator",
          body.user?.last_name || body.last_name || "",
          body.user?.email || body.email || "",
          body.user?.mobile || body.mobile || "",
          baseId,
        ]
      );

      await client.query(
        `
        INSERT INTO "Document" (id, base_id, document_number, attachment, "createdAt", "updatedAT")
        VALUES ($1, $2, $3, 'https://holadashboard.s3.amazonaws.com/operator-license.pdf', NOW(), NOW())
      `,
        [docId, baseId, body.license_number || `LIC-CAT-C-${Date.now().toString().slice(-4)}`]
      );

      await client.query(
        `
        INSERT INTO "Operator" (id, base_id, user_id, role_id, document_attachment_id, "Status", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, 1, NOW(), NOW())
      `,
        [operatorId, baseId, userId, OPERATOR_ROLE_ID, docId]
      );
    } finally {
      client.release();
    }

    const newOperator = {
      id: operatorId,
      user_id: userId,
      role_id: OPERATOR_ROLE_ID,
      created_by: "admin",
      status: 1,
      Status: 1,
      base_id: "base_scz",
      document_attachment_id: docId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      user: {
        id: userId,
        first_name: body.user?.first_name || body.first_name || "Operator",
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

    return NextResponse.json(newOperator, { status: 201 });
  } catch (error: any) {
    console.error("[/api/operator] POST error:", error?.message);
    return NextResponse.json(
      { message: error?.message || "Failed to create operator", success: false },
      { status: 500 }
    );
  }
}
