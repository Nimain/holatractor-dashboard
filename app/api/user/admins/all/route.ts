import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import jwt from "jsonwebtoken";
import pool from "@/utils/Database/db";

import { getFastApiAuthHeaders } from "@/utils/auth/serverAuth";

export const dynamic = "force-dynamic";

const FastApiBaseURL =
  process.env.NEXT_PUBLIC_TRACTOR_AI_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://tractorai.sinsignal.com/";

export async function GET(request: NextRequest) {
  try {
    const headers = getFastApiAuthHeaders(request);

    // 1. Direct PostgreSQL query for Admins
    try {
      const client = await pool.connect();
      try {
        const res = await client.query(`
          SELECT 
            u.id,
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
            u."createdAt",
            u."updatedAt",
            r.name as role_name
          FROM "User" u
          JOIN "UserRole" ur ON ur.user_id = u.id
          JOIN "Role" r ON ur.role_id = r.id
          WHERE LOWER(r.name) IN ('admin', 'superadmin')
             OR LOWER(u.email) IN ('sistemas@holatractor.com', 'admin@holatractor.com', 'admin@gmail.com')
          ORDER BY u."createdAt" DESC
        `);

        if (res.rows.length > 0) {
          const adminsList = res.rows.map((u: any) => ({
            id: String(u.id),
            first_name: String(u.first_name || "Admin"),
            middle_name: String(u.middle_name || ""),
            last_name: String(u.last_name || ""),
            email: String(u.email || ""),
            mobile: String(u.mobile || ""),
            gender: String(u.gender || "male"),
            image: String(u.image || ""),
            country_code: String(u.country_code || "+591"),
            emailVerified: u.emailVerified !== null ? Boolean(u.emailVerified) : true,
            authType: String(u.authType || "EMAIL"),
            createdAt: String(u.createdAt),
            updatedAt: String(u.updatedAt),
            role: [String(u.role_name || "admin")],
          }));

        return NextResponse.json(adminsList);
        }
      } finally {
        client.release();
      }
    } catch (dbErr: any) {
      console.warn("[/api/user/admins/all] DB fallback:", dbErr?.message);
    }

    // 3. Fallback: Return primary default system admin + dynamic admins
    const defaultList = [
      {
        id: "admin_sistemas",
        first_name: "Sistemas",
        middle_name: "",
        last_name: "HolaTractor",
        email: "sistemas@holatractor.com",
        mobile: "+591 70000000",
        gender: "male",
        image: "",
        country_code: "+591",
        emailVerified: true,
        authType: "EMAIL",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        role: ["admin", "superAdmin"],
      },
    ];

    if ((global as any)._dynamicAdminsMap) {
      (global as any)._dynamicAdminsMap.forEach((adm: any) => {
        if (!defaultList.some((d) => d.email === adm.email || d.id === adm.id)) {
          defaultList.push(adm);
        }
      });
    }

    return NextResponse.json(defaultList);
  } catch (error: any) {
    console.error("[/api/user/admins/all] Fatal error:", error);
    return NextResponse.json([]);
  }
}
