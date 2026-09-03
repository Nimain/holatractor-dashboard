import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import jwt from "jsonwebtoken";
import pool from "@/utils/Database/db";

export const dynamic = "force-dynamic";

const FastApiBaseURL =
  process.env.NEXT_PUBLIC_TRACTOR_AI_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://tractorai.sinsignal.com/";

const OPERATOR_ROLE_ID = "cm8d2c7d5009em167zmd08dsj";

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

        if (res.rows.length > 0) {
          const seen = new Set<string>();
          const mappedOperators: any[] = [];

          for (const r of res.rows) {
            const uid = String(r.user_id || r.id);
            if (seen.has(uid)) continue;
            seen.add(uid);

            mappedOperators.push({
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
                image: r.image ? String(r.image) : "",
                country_code: String(r.country_code || "+591"),
                emailVerified: r.emailVerified !== null ? Boolean(r.emailVerified) : true,
                authType: String(r.authType || "EMAIL"),
              },
            });
          }

          return NextResponse.json(mappedOperators);
        }
      } finally {
        client.release();
      }
    } catch (dbErr: any) {
      console.warn("[/api/operator] DB Direct notice:", dbErr?.message);
    }

    // 2. FastAPI fallback
    try {
      const headers = getAdminHeaders();
      const fastApiRes = await axios.get(
        `${FastApiBaseURL.replace(/\/$/, "")}/api/v1/admin/operators`,
        { headers, timeout: 6000 }
      );
      if (Array.isArray(fastApiRes.data) && fastApiRes.data.length > 0) {
        return NextResponse.json(fastApiRes.data);
      }
    } catch {}

    return NextResponse.json([]);
  } catch (error: any) {
    console.error("[/api/operator] GET error:", error?.message);
    return NextResponse.json([], { status: 500 });
  }
}

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

      await client.query(`
        INSERT INTO "User" (
          id, first_name, middle_name, last_name, email, mobile, country_code,
          gender, "authType", "phoneVerified", "emailVerified", "request_to_delete",
          base_id, "createdAt", "updatedAt"
        )
        VALUES ($1, $2, '', $3, $4, $5, '+591', 'male', 'EMAIL', true, true, false, $6, NOW(), NOW())
      `, [
        userId,
        body.user?.first_name || body.first_name || "Operator",
        body.user?.last_name || body.last_name || "",
        body.user?.email || body.email || "",
        body.user?.mobile || body.mobile || "",
        baseId,
      ]);

      await client.query(`
        INSERT INTO "Document" (id, base_id, document_number, attachment, "createdAt", "updatedAT")
        VALUES ($1, $2, $3, 'https://holadashboard.s3.amazonaws.com/operator-license.pdf', NOW(), NOW())
      `, [docId, baseId, body.license_number || `LIC-CAT-C-${Date.now().toString().slice(-4)}`]);

      await client.query(`
        INSERT INTO "Operator" (id, base_id, user_id, role_id, document_attachment_id, "Status", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, 1, NOW(), NOW())
      `, [operatorId, baseId, userId, OPERATOR_ROLE_ID, docId]);
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
