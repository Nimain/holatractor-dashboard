import { NextRequest, NextResponse } from "next/server";
import pool from "@/utils/Database/db";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dealerId = searchParams.get("dealer_id") || searchParams.get("dealerId") || "";
    const search = (searchParams.get("search") || "").trim().toLowerCase();

    const client = await pool.connect();
    try {
      let query = `
        SELECT 
          id, first_name, middle_name, last_name, mobile, email,
          gender, image, city, base_id, dealer_id, status, "createdAt", "updatedAt"
        FROM "DealerCustomer"
      `;
      const params: any[] = [];

      if (dealerId && dealerId !== "all") {
        query += `
          WHERE (
            dealer_id = $1 
            OR dealer_id IN (SELECT id FROM "Dealer" WHERE user_id = $1)
            OR dealer_id IN (SELECT user_id FROM "Dealer" WHERE id = $1)
          )
        `;
        params.push(dealerId);
      }

      query += ` ORDER BY "createdAt" DESC LIMIT 500;`;

      const result = await client.query(query, params);
      let customers = result.rows.map((r: any) => ({
        id: String(r.id),
        first_name: String(r.first_name || ""),
        middle_name: String(r.middle_name || ""),
        last_name: String(r.last_name || ""),
        mobile: String(r.mobile || ""),
        email: String(r.email || ""),
        gender: String(r.gender || "Male"),
        image: String(r.image || ""),
        city: String(r.city || ""),
        base_id: String(r.base_id || ""),
        dealer_id: String(r.dealer_id || ""),
        status: String(r.status || "Active"),
        createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : new Date().toISOString(),
      }));

      if (search) {
        customers = customers.filter((c: any) => {
          const full = `${c.first_name} ${c.last_name} ${c.email} ${c.mobile} ${c.city}`.toLowerCase();
          return full.includes(search);
        });
      }

      return NextResponse.json(customers);
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("[/api/dealer/customers] GET error:", error?.message);
    return NextResponse.json({ error: error?.message || "Failed to fetch customers" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const client = await pool.connect();

    try {
      // 1. Bulk insertion support
      if (Array.isArray(body) || Array.isArray(body.customers)) {
        const list: any[] = Array.isArray(body) ? body : body.customers;
        const defaultDealerId = body.dealer_id || body.dealerId || null;
        const defaultBaseId = body.base_id || body.baseId || "default";

        const inserted: any[] = [];
        for (const item of list) {
          if (!item.first_name && !item.last_name && !item.mobile && !item.email) {
            continue;
          }
          const id = `cm${crypto.randomBytes(12).toString("hex").slice(0, 23)}`;
          const did = item.dealer_id || item.dealerId || defaultDealerId || "default_dealer";
          const bid = item.base_id || item.baseId || defaultBaseId;

          const res = await client.query(
            `
            INSERT INTO "DealerCustomer" (
              id, first_name, middle_name, last_name, mobile, email,
              gender, image, city, dealer_id, base_id, status, "createdAt", "updatedAt"
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW()
            ) RETURNING *;
            `,
            [
              id,
              item.first_name || "",
              item.middle_name || "",
              item.last_name || "",
              item.mobile || "",
              item.email || "",
              item.gender || "Male",
              item.image || "",
              item.city || "",
              did,
              bid,
              item.status || "Active",
            ]
          );
          if (res.rows[0]) {
            inserted.push(res.rows[0]);
          }
        }

        return NextResponse.json({
          success: true,
          imported: inserted.length,
          count: inserted.length,
          customers: inserted,
        });
      }

      // 2. Single customer creation
      const {
        first_name,
        middle_name = "",
        last_name = "",
        email = "",
        mobile = "",
        gender = "Male",
        image = "",
        city = "",
        dealer_id,
        base_id = "default",
        status = "Active",
      } = body;

      let targetDealerId = dealer_id;
      let targetBaseId = base_id;

      if (!targetDealerId) {
        const dealerCheck = await client.query('SELECT id, base_id FROM "Dealer" LIMIT 1;');
        if (dealerCheck.rows[0]) {
          targetDealerId = dealerCheck.rows[0].id;
          targetBaseId = dealerCheck.rows[0].base_id || targetBaseId;
        }
      }

      const id = `cm${crypto.randomBytes(12).toString("hex").slice(0, 23)}`;
      const result = await client.query(
        `
        INSERT INTO "DealerCustomer" (
          id, first_name, middle_name, last_name, mobile, email,
          gender, image, city, dealer_id, base_id, status, "createdAt", "updatedAt"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW()
        ) RETURNING *;
        `,
        [
          id,
          first_name,
          middle_name,
          last_name,
          mobile,
          email,
          gender,
          image,
          city,
          targetDealerId || "default_dealer",
          targetBaseId,
          status,
        ]
      );

      return NextResponse.json(result.rows[0], { status: 201 });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("[/api/dealer/customers] POST error:", error?.message);
    return NextResponse.json({ error: error?.message || "Failed to create customer" }, { status: 500 });
  }
}
