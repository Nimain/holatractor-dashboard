import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import jwt from "jsonwebtoken";
import pool from "@/utils/Database/db";

export const dynamic = "force-dynamic";

const FastApiBaseURL =
  process.env.NEXT_PUBLIC_TRACTOR_AI_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://tractorai.sinsignal.com/";

const DEALER_ROLE_ID = "cm8d2cvhv009sm167p1c89vrs";

function getAdminHeaders() {
  try {
    const adminToken = jwt.sign(
      {
        sub: "admin_master",
        id: "admin_master",
        email: "sistemas@holatractor.com",
        role: "admin",
        isAdmin: true,
        is_admin: true,
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
    // 1. Direct Render PostgreSQL DB Query
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

        if (res.rows.length > 0) {
          const seen = new Set<string>();
          const mappedDealers: any[] = [];

          for (const r of res.rows) {
            const uid = String(r.user_id || r.id);
            if (seen.has(uid)) continue;
            seen.add(uid);

            mappedDealers.push({
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
                image: r.image ? String(r.image) : "",
                country_code: String(r.country_code || "+591"),
                emailVerified: r.emailVerified !== null ? Boolean(r.emailVerified) : true,
                authType: String(r.authType || "EMAIL"),
              },
            });
          }

          return NextResponse.json(mappedDealers);
        }
      } finally {
        client.release();
      }
    } catch (dbErr: any) {
      console.warn("[/api/dealer] DB Direct notice:", dbErr?.message);
    }

    // 2. FastAPI fallback
    try {
      const headers = getAdminHeaders();
      const fastApiRes = await axios.get(
        `${FastApiBaseURL.replace(/\/$/, "")}/api/v1/admin/dealers`,
        { headers, timeout: 6000 }
      );
      if (Array.isArray(fastApiRes.data) && fastApiRes.data.length > 0) {
        return NextResponse.json(fastApiRes.data);
      }
    } catch {}

    return NextResponse.json([]);
  } catch (error: any) {
    console.error("[/api/dealer] GET error:", error?.message);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = `usr_dlr_${Date.now()}`;
    const dealerId = `dlr_${Date.now()}`;

    const client = await pool.connect();
    try {
      const baseRes = await client.query('SELECT id FROM "Base" LIMIT 1');
      const baseId = baseRes.rows[0]?.id || "cm89t43ky00034wft9fiixpc7";

      await client.query(`
        INSERT INTO "User" (
          id, first_name, middle_name, last_name, email, mobile, country_code,
          gender, "authType", "phoneVerified", "emailVerified", "request_to_delete",
          base_id, "createdAt", "updatedAt"
        )
        VALUES ($1, $2, '', $3, $4, $5, '+591', 'male', 'EMAIL', true, true, false, $6, NOW(), NOW())
      `, [
        userId,
        body.user?.first_name || body.first_name || "Dealer",
        body.user?.last_name || body.last_name || "",
        body.user?.email || body.email || "",
        body.user?.mobile || body.mobile || "",
        baseId,
      ]);

      await client.query(`
        INSERT INTO "Dealer" (id, base_id, user_id, role_id, "Status", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, 1, NOW(), NOW())
      `, [dealerId, baseId, userId, DEALER_ROLE_ID]);
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
