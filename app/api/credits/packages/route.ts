import { NextRequest, NextResponse } from "next/server";
import pool from "@/utils/Database/db";

export const dynamic = "force-dynamic";

function generateCuid(): string {
  const timestamp = Date.now().toString(36);
  const randChars =
    Math.random().toString(36).substring(2, 10) +
    Math.random().toString(36).substring(2, 10);
  return `cp_${timestamp}${randChars}`.slice(0, 25);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const isActiveParam = searchParams.get("isActive") || searchParams.get("is_active");
  const userType = searchParams.get("user_type");

  try {
    const client = await pool.connect();
    try {
      let query = `
        SELECT 
          cp.id, cp.name, cp.base_credits, cp.bonus_credits, cp.price,
          cp.currency_id, cp.discount_percentage, cp.is_active,
          cp.user_type::text as user_type, cp.is_featured, cp.sort_order,
          cp.valid_from, cp.valid_until, cp.max_purchases,
          cp.base_id, cp."createdAt", cp."updatedAt",
          c.id as curr_id, c.code as curr_code, c.name as curr_name, c.symbol as curr_symbol
        FROM "CreditPackage" cp
        LEFT JOIN "Currency" c ON c.id = cp.currency_id
        WHERE 1=1
      `;
      const params: any[] = [];

      if (isActiveParam !== null && isActiveParam !== undefined) {
        params.push(isActiveParam === "true");
        query += ` AND cp.is_active = $${params.length}`;
      }

      if (userType) {
        params.push(userType);
        query += ` AND cp.user_type::text = $${params.length}`;
      }

      query += ` ORDER BY cp.sort_order ASC, cp."createdAt" DESC;`;

      const result = await client.query(query, params);

      const packages = result.rows.map((r) => ({
        id: r.id,
        name: r.name,
        base_credits: Number(r.base_credits || 0),
        bonus_credits: Number(r.bonus_credits || 0),
        price: parseFloat(r.price || "0"),
        currency_id: r.currency_id,
        discount_percentage: parseFloat(r.discount_percentage || "0"),
        is_active: Boolean(r.is_active),
        user_type: r.user_type,
        is_featured: Boolean(r.is_featured),
        sort_order: Number(r.sort_order || 0),
        valid_from: r.valid_from ? new Date(r.valid_from).toISOString() : null,
        valid_until: r.valid_until ? new Date(r.valid_until).toISOString() : null,
        max_purchases: r.max_purchases,
        base_id: r.base_id,
        createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : new Date().toISOString(),
        currency: r.curr_id || r.currency_id ? {
          id: r.curr_id || r.currency_id,
          code: r.curr_code || "USD",
          name: r.curr_name || "US Dollar",
          symbol: r.curr_symbol || "$",
        } : null,
      }));

      return NextResponse.json(packages);
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("Error fetching credit packages:", error);
    return NextResponse.json({ error: "Failed to fetch credit packages" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      base_credits,
      bonus_credits,
      price,
      currency_id,
      discount_percentage,
      user_type,
      is_active,
      is_featured,
      sort_order,
      valid_from,
      valid_until,
      max_purchases,
    } = body;

    if (!name || base_credits === undefined || price === undefined || !currency_id) {
      return NextResponse.json({ error: "Missing required package fields" }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      const id = generateCuid();
      const baseRow = await client.query('SELECT id FROM "Base" LIMIT 1;');
      const base_id = baseRow.rows[0]?.id || "default_base";

      const insertQuery = `
        INSERT INTO "CreditPackage" (
          id, name, base_credits, bonus_credits, price, currency_id,
          discount_percentage, is_active, user_type, is_featured,
          sort_order, valid_from, valid_until, max_purchases,
          base_id, "createdAt", "updatedAt"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9::"UserType", $10, $11, $12, $13, $14, $15, NOW(), NOW()
        ) RETURNING id;
      `;

      await client.query(insertQuery, [
        id,
        name,
        parseInt(base_credits) || 0,
        parseInt(bonus_credits) || 0,
        parseFloat(price) || 0,
        currency_id,
        parseFloat(discount_percentage) || 0,
        is_active !== undefined ? Boolean(is_active) : true,
        user_type || "FARMER",
        Boolean(is_featured),
        parseInt(sort_order) || 0,
        valid_from ? new Date(valid_from) : new Date(),
        valid_until ? new Date(valid_until) : null,
        max_purchases ? parseInt(max_purchases) : null,
        base_id,
      ]);

      return NextResponse.json({ id, message: "Credit package created successfully" }, { status: 201 });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("Error creating credit package:", error);
    return NextResponse.json({ error: error.message || "Failed to create credit package" }, { status: 500 });
  }
}
