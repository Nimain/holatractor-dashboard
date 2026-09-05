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

const MECHANIC_ROLE_ID = "cmgop840100001gubpwc5ru0j";

async function fetchFromFastAPI(endpoint: string, headers: any, timeout = 3000) {
  for (const base of FASTAPI_CANDIDATES) {
    try {
      const isLocal = base.includes("127.0.0.1") || base.includes("localhost");
      const res = await axios.get(`${base}${endpoint}`, {
        headers,
        timeout: isLocal ? 2500 : timeout,
      });
      if (res.data) return { data: res.data, base };
    } catch {
      // try next
    }
  }
  return null;
}

async function patchToFastAPI(endpoint: string, payload: any, headers: any, timeout = 3000) {
  for (const base of FASTAPI_CANDIDATES) {
    try {
      const isLocal = base.includes("127.0.0.1") || base.includes("localhost");
      const res = await axios.patch(`${base}${endpoint}`, payload, {
        headers,
        timeout: isLocal ? 2500 : timeout,
      });
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

function parseSpecialization(spec: any): string[] {
  if (!spec) return [];
  if (Array.isArray(spec)) return spec;
  if (typeof spec === "string") {
    return spec
      .replace(/[{}"']/g, "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

// ── GET: List Mechanics ──────────────────────────────────────────────────────
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

    let mechanics: any[] = [];

    // 1. Try local FastAPI first (lightning fast sub-10ms)
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/v1/admin/mechanics", {
        timeout: 2500,
      });
      if (Array.isArray(res.data) && res.data.length > 0) {
        mechanics = res.data;
      }
    } catch {
      try {
        const res = await axios.get("http://127.0.0.1:8000/api/v1/admin/mechanics", {
          headers,
          timeout: 2500,
        });
        if (Array.isArray(res.data) && res.data.length > 0) {
          mechanics = res.data;
        }
      } catch {
        const fastApiResult = await fetchFromFastAPI("/api/v1/admin/mechanics", headers, 2000);
        if (fastApiResult && Array.isArray(fastApiResult.data) && fastApiResult.data.length > 0) {
          mechanics = fastApiResult.data;
        }
      }
    }

    // 2. Direct PostgreSQL fallback
    if (!mechanics.length) {
      try {
        const client = await pool.connect();
        try {
          const res = await client.query(`
            SELECT 
              m.id,
              m.user_id,
              m.role_id,
              m.dealer_id,
              m.specialization,
              m.experience_years,
              m.license_number,
              m.is_available,
              m.current_lat,
              m.current_lng,
              COALESCE(m."Status", 1) as status,
              m.base_id,
              COALESCE(m."createdAt", u."createdAt") as "createdAt",
              COALESCE(m."updatedAt", u."updatedAt") as "updatedAt",
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
            FROM "Mechanic" m
            LEFT JOIN "User" u ON u.id = m.user_id
            ORDER BY COALESCE(m."createdAt", u."createdAt") DESC
          `);

          for (const r of res.rows) {
            const uid = String(r.user_id || r.id);
            mechanics.push({
              id: String(r.id),
              user_id: uid,
              role_id: String(r.role_id || MECHANIC_ROLE_ID),
              dealer_id: r.dealer_id ? String(r.dealer_id) : null,
              specialization: parseSpecialization(r.specialization),
              experience_years: r.experience_years !== null && r.experience_years !== undefined ? Number(r.experience_years) : 0,
              license_number: r.license_number ? String(r.license_number) : "",
              is_available: r.is_available !== null ? Boolean(r.is_available) : true,
              current_lat: r.current_lat !== null ? Number(r.current_lat) : null,
              current_lng: r.current_lng !== null ? Number(r.current_lng) : null,
              status: Number(r.status ?? 1),
              Status: Number(r.status ?? 1),
              base_id: String(r.base_id || "base_scz"),
              createdAt: String(r.createdAt),
              updatedAt: String(r.updatedAt),
              user: {
                id: uid,
                first_name: String(r.first_name || "Mechanic"),
                middle_name: String(r.middle_name || ""),
                last_name: String(r.last_name || ""),
                email: String(r.email || ""),
                mobile: String(r.mobile || ""),
                gender: String(r.gender || "male"),
                image: sanitizeImageUrl(r.image),
                country_code: String(r.country_code || "+91"),
                emailVerified: r.emailVerified !== null ? Boolean(r.emailVerified) : false,
                authType: String(r.authType || "EMAIL"),
              },
            });
          }
        } finally {
          client.release();
        }
      } catch (dbErr: any) {
        console.warn("[/api/mechanic] DB Direct fallback notice:", dbErr?.message);
      }
    }

    // Normalize mechanics
    let normalized = mechanics.map((m: any) => {
      const u = m.user || {};
      return {
        id: String(m.id || m.user_id || u.id),
        user_id: String(m.user_id || u.id || m.id),
        role_id: String(m.role_id || MECHANIC_ROLE_ID),
        dealer_id: m.dealer_id ? String(m.dealer_id) : null,
        specialization: parseSpecialization(m.specialization),
        experience_years: m.experience_years !== null && m.experience_years !== undefined ? Number(m.experience_years) : 0,
        license_number: String(m.license_number || ""),
        is_available: m.is_available !== undefined ? Boolean(m.is_available) : true,
        current_lat: m.current_lat !== null && m.current_lat !== undefined ? Number(m.current_lat) : null,
        current_lng: m.current_lng !== null && m.current_lng !== undefined ? Number(m.current_lng) : null,
        status: Number(m.status ?? (m.Status ?? 1)),
        Status: Number(m.Status ?? (m.status ?? 1)),
        base_id: String(m.base_id || m.id || u.id || "base_scz"),
        createdAt: String(m.createdAt || u.createdAt || new Date().toISOString()),
        updatedAt: String(m.updatedAt || u.updatedAt || new Date().toISOString()),
        user: {
          id: String(u.id || m.user_id || m.id),
          first_name: String(u.first_name || m.first_name || "Mechanic"),
          middle_name: String(u.middle_name || m.middle_name || ""),
          last_name: String(u.last_name || m.last_name || ""),
          authType: String(u.authType || m.authType || "EMAIL"),
          gender: String(u.gender || m.gender || "male"),
          emailVerified:
            u.emailVerified !== undefined
              ? Boolean(u.emailVerified)
              : m.emailVerified !== undefined
              ? Boolean(m.emailVerified)
              : true,
          email: String(u.email || m.email || ""),
          image: sanitizeImageUrl(u.image || m.image),
          mobile: u.mobile || m.mobile ? String(u.mobile || m.mobile) : "",
          country_code: String(u.country_code || m.country_code || "+91"),
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
        const license = (item.license_number || "").toLowerCase();
        const specs = (item.specialization || []).join(" ").toLowerCase();
        return (
          fullName.includes(search) ||
          email.includes(search) ||
          mobile.includes(search) ||
          id.includes(search) ||
          license.includes(search) ||
          specs.includes(search)
        );
      });
    }

    // Apply status filter
    if (statusParam !== null && statusParam !== "" && statusParam !== "all") {
      const targetStatus = parseInt(statusParam, 10);
      if (!isNaN(targetStatus)) {
        normalized = normalized.filter((item: any) => item.status === targetStatus);
      }
    }

    // Return paginated or array
    if (isPaginatedReq) {
      const total = normalized.length;
      const totalPages = Math.max(1, Math.ceil(total / perPage));
      const start = (page - 1) * perPage;
      const paginatedMechanics = normalized.slice(start, start + perPage);

      return NextResponse.json({
        mechanics: paginatedMechanics,
        total,
        page,
        per_page: perPage,
        total_pages: totalPages,
      });
    }

    return NextResponse.json(normalized);
  } catch (error: any) {
    console.error("[/api/mechanic] GET error:", error?.message);
    return NextResponse.json([]);
  }
}

// ── PATCH: Update Mechanic Data via FastAPI & DB ─────────────────────────────
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      user_id,
      first_name,
      middle_name,
      last_name,
      email,
      mobile,
      country_code,
      gender,
      status,
      specialization,
      experience_years,
      license_number,
      is_available,
    } = body;

    const targetUserId = user_id || id;
    if (!targetUserId) {
      return NextResponse.json({ success: false, message: "Missing mechanic user_id or id" }, { status: 400 });
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
      console.warn("[/api/mechanic] FastAPI PATCH warning:", fErr?.message);
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
          await client.query(`UPDATE "User" SET ${userUpdates.join(", ")} WHERE id = $${pIdx}`, userParams);
        }

        // Update Mechanic table fields
        const mechUpdates: string[] = [];
        const mechParams: any[] = [];
        let mIdx = 1;

        if (status !== undefined) {
          mechUpdates.push(`"Status" = $${mIdx++}`);
          mechParams.push(Number(status));
        }
        if (experience_years !== undefined) {
          mechUpdates.push(`experience_years = $${mIdx++}`);
          mechParams.push(Number(experience_years));
        }
        if (license_number !== undefined) {
          mechUpdates.push(`license_number = $${mIdx++}`);
          mechParams.push(String(license_number));
        }
        if (is_available !== undefined) {
          mechUpdates.push(`is_available = $${mIdx++}`);
          mechParams.push(Boolean(is_available));
        }
        if (specialization !== undefined) {
          const specArr = Array.isArray(specialization)
            ? specialization
            : typeof specialization === "string"
            ? specialization.replace(/[{}"']/g, "").split(",").map((s: string) => s.trim()).filter(Boolean)
            : [];
          mechUpdates.push(`specialization = $${mIdx++}`);
          mechParams.push(specArr);
        }

        if (mechUpdates.length > 0) {
          mechUpdates.push(`"updatedAt" = NOW()`);
          mechParams.push(targetUserId);
          await client.query(
            `UPDATE "Mechanic" SET ${mechUpdates.join(", ")} WHERE user_id = $${mIdx} OR id = $${mIdx}`,
            mechParams
          );
        }

        return NextResponse.json({
          success: true,
          message: "Mechanic updated successfully",
          fastApiSuccess,
        });
      } finally {
        client.release();
      }
    } catch (dbErr: any) {
      console.error("[/api/mechanic] DB update error:", dbErr);
      return NextResponse.json({
        success: fastApiSuccess,
        message: fastApiSuccess ? "Updated via FastAPI" : "DB update failed: " + dbErr.message,
      });
    }
  } catch (error: any) {
    console.error("[/api/mechanic] PATCH error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// ── POST: Create New Mechanic ────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = `usr_mec_${Date.now()}`;
    const mechanicId = `mec_${Date.now()}`;

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
        VALUES ($1, $2, '', $3, $4, $5, '+91', 'male', 'EMAIL', true, true, false, $6, NOW(), NOW())
      `,
        [
          userId,
          body.user?.first_name || body.first_name || "Mechanic",
          body.user?.last_name || body.last_name || "",
          body.user?.email || body.email || "",
          body.user?.mobile || body.mobile || "",
          baseId,
        ]
      );

      const specArr = Array.isArray(body.specialization)
        ? body.specialization
        : ["Engine", "Hydraulics"];

      await client.query(
        `
        INSERT INTO "Mechanic" (
          id, base_id, user_id, role_id, specialization, experience_years,
          license_number, "Status", is_available, "createdAt", "updatedAt"
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, 1, true, NOW(), NOW())
      `,
        [
          mechanicId,
          baseId,
          userId,
          MECHANIC_ROLE_ID,
          specArr,
          Number(body.experience_years || 3),
          body.license_number || `MEC-2025-${Date.now().toString().slice(-3)}`,
        ]
      );
    } finally {
      client.release();
    }

    const newMechanic = {
      id: mechanicId,
      user_id: userId,
      role_id: MECHANIC_ROLE_ID,
      status: 1,
      Status: 1,
      specialization: body.specialization || ["Engine", "Hydraulics"],
      experience_years: Number(body.experience_years || 3),
      license_number: body.license_number || `MEC-2025-${Date.now().toString().slice(-3)}`,
      is_available: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      user: {
        id: userId,
        first_name: body.user?.first_name || body.first_name || "Mechanic",
        middle_name: "",
        last_name: body.user?.last_name || body.last_name || "",
        email: body.user?.email || body.email || "",
        mobile: body.user?.mobile || body.mobile || "",
        gender: "male",
        image: "",
        country_code: "+91",
        emailVerified: true,
        authType: "EMAIL",
      },
    };

    return NextResponse.json(newMechanic, { status: 201 });
  } catch (error: any) {
    console.error("[/api/mechanic] POST error:", error?.message);
    return NextResponse.json(
      { message: error?.message || "Failed to create mechanic", success: false },
      { status: 500 }
    );
  }
}
