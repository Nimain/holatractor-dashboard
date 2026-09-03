import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import jwt from "jsonwebtoken";
import pool from "@/utils/Database/db";

export const dynamic = "force-dynamic";

const FastApiBaseURL =
  process.env.NEXT_PUBLIC_TRACTOR_AI_URL || "https://tractorai.sinsignal.com/";
const NestJsBaseURL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://holatractor-backend-render.onrender.com/";

function getAdminHeaders() {
  try {
    const adminToken = jwt.sign(
      {
        sub: "admin_master",
        id: "admin_master",
        email: "sistemas@holatractor.com",
        role: "admin",
        isAdmin: true,
      },
      "ecommProdPrj",
      { expiresIn: "1h" }
    );
    return { Authorization: `Bearer ${adminToken}` };
  } catch {
    return {};
  }
}

// Normalize a farmer record — handles both flat (FastAPI) and nested user formats
const normalizeFarmer = (f: any) => {
  const u = f.user || {};
  return {
    id: f.user_id || f.id || u.id,
    user_id: f.user_id || u.id || f.id,
    first_name: f.first_name || u.first_name || "",
    last_name: f.last_name || u.last_name || "",
    email: f.email || u.email || "",
    mobile: f.mobile || u.mobile || "",
    Status: f.Status ?? 1,
    createdAt: f.createdAt || u.createdAt || null,
    user: {
      id: f.user_id || u.id || f.id,
      first_name: f.first_name || u.first_name || "",
      middle_name: f.middle_name || u.middle_name || "",
      last_name: f.last_name || u.last_name || "",
      email: f.email || u.email || "",
      mobile: f.mobile || u.mobile || "",
      authType: f.authType || u.authType || "EMAIL",
      gender: f.gender || u.gender || "male",
      emailVerified: f.emailVerified ?? u.emailVerified ?? true,
      image: f.image || u.image || null,
      country_code: f.country_code || u.country_code || "+591",
    },
  };
};

export async function GET(request: NextRequest) {
  try {
    const headers = getAdminHeaders();
    const search = request.nextUrl.searchParams.get("search")?.toLowerCase() || "";

    const applySearch = (farmers: any[]) => {
      if (!search) return farmers;
      return farmers.filter((f) => {
        const name = `${f.first_name || ""} ${f.last_name || ""}`.toLowerCase();
        const email = (f.email || "").toLowerCase();
        const mobile = f.mobile || "";
        return name.includes(search) || email.includes(search) || mobile.includes(search);
      });
    };

    // 1. FastAPI – instant live update with admin JWT
    try {
      const fastApiRes = await axios.get(
        `${FastApiBaseURL.replace(/\/$/, "")}/api/v1/admin/farmers`,
        { headers, timeout: 8000 }
      );
      if (Array.isArray(fastApiRes.data)) {
        return NextResponse.json(applySearch(fastApiRes.data.map(normalizeFarmer)));
      }
    } catch (fastErr: any) {
      console.warn("[/api/farmer] FastAPI query error:", fastErr?.message);
    }

    // 2. Direct PostgreSQL fallback if pool is accessible
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
          LIMIT 1000
        `);

        const list = res.rows.map((r: any) => ({
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
            image: r.image ? String(r.image) : null,
            mobile: r.mobile ? String(r.mobile) : null,
            country_code: String(r.country_code || "+591"),
          },
        }));

        return NextResponse.json(applySearch(list));
      } finally {
        client.release();
      }
    } catch (dbErr: any) {
      console.warn("[/api/farmer] Database query fallback:", dbErr?.message);
    }

    // 3. NestJS /farmer
    try {
      const backendRes = await axios.get(`${NestJsBaseURL}farmer`, {
        headers,
        timeout: 4000,
      });
      if (Array.isArray(backendRes.data)) {
        return NextResponse.json(applySearch(backendRes.data.map(normalizeFarmer)));
      }
    } catch {}

    return NextResponse.json([]);
  } catch (error: any) {
    console.error("[/api/farmer] Fatal error:", error);
    return NextResponse.json([]);
  }
}
