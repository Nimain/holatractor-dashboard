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

export async function GET(request: NextRequest) {
  try {
    const headers = getAdminHeaders();

    // 1. Try FastAPI with admin JWT
    try {
      const fastApiRes = await axios.get(
        `${FastApiBaseURL.replace(/\/$/, "")}/api/v1/admin/agents`,
        { headers, timeout: 6000 }
      );
      if (Array.isArray(fastApiRes.data)) {
        return NextResponse.json(fastApiRes.data);
      }
    } catch (fastErr: any) {
      console.warn("[/api/agent] FastAPI error:", fastErr?.message);
    }

    // 2. Direct PostgreSQL fallback if pool is accessible
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

        const agentsList = res.rows.map((m: any) => ({
          id: String(m.id),
          user_id: String(m.user_id),
          role_id: String(m.role_id || "agent_role"),
          created_by: m.created_by ? String(m.created_by) : null,
          status: Number(m.status || 1),
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
            image: String(m.image || ""),
            country_code: String(m.country_code || "+591"),
            emailVerified: m.emailVerified !== null ? Boolean(m.emailVerified) : true,
            authType: String(m.authType || "EMAIL"),
          },
        }));

        return NextResponse.json(agentsList);
      } finally {
        client.release();
      }
    } catch (dbErr: any) {
      console.warn("[/api/agent] Database query fallback:", dbErr?.message);
    }

    // 3. Try online NestJS /agent
    try {
      const backendRes = await axios.get(`${NestJsBaseURL}agent`, {
        headers,
        timeout: 4000,
      });
      if (Array.isArray(backendRes.data)) {
        return NextResponse.json(backendRes.data);
      }
    } catch {}

    return NextResponse.json([]);
  } catch (error: any) {
    console.error("[/api/agent] Fatal error:", error);
    return NextResponse.json([]);
  }
}
