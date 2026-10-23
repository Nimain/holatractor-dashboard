import { NextRequest, NextResponse } from "next/server";
import pool from "@/utils/Database/db";

export const dynamic = "force-dynamic";

function generateCuid(): string {
  const timestamp = Date.now().toString(36);
  const randChars =
    Math.random().toString(36).substring(2, 10) +
    Math.random().toString(36).substring(2, 10);
  return `cpn_${timestamp}${randChars}`.slice(0, 25);
}

export async function GET(req: NextRequest) {
  try {
    const client = await pool.connect();
    try {
      const query = `
        SELECT 
          id, code, name, discount_percentage, minimum_purchase,
          maximum_discount, usage_limit, usage_per_user,
          user_type::text[] as user_type, is_active,
          valid_from, valid_until, "createdAt", "updatedAt"
        FROM "DiscountCoupon"
        ORDER BY "createdAt" DESC;
      `;
      const result = await client.query(query);

      const coupons = result.rows.map((r) => ({
        id: r.id,
        code: r.code,
        name: r.name,
        discount_percentage: parseFloat(r.discount_percentage || "0"),
        minimum_purchase: r.minimum_purchase !== null ? parseFloat(r.minimum_purchase) : null,
        maximum_discount: r.maximum_discount !== null ? parseFloat(r.maximum_discount) : null,
        usage_limit: r.usage_limit !== null ? Number(r.usage_limit) : null,
        usage_per_user: r.usage_per_user !== null ? Number(r.usage_per_user) : 1,
        user_type: Array.isArray(r.user_type) ? r.user_type : [],
        is_active: Boolean(r.is_active),
        valid_from: r.valid_from ? new Date(r.valid_from).toISOString() : null,
        valid_until: r.valid_until ? new Date(r.valid_until).toISOString() : null,
        createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : new Date().toISOString(),
      }));

      return NextResponse.json(coupons);
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("Error fetching coupons from DB:", error);
    return NextResponse.json({ error: "Failed to fetch coupons" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      code,
      name,
      discount_percentage,
      minimum_purchase,
      maximum_discount,
      usage_limit,
      usage_per_user,
      user_type,
      is_active,
      valid_from,
      valid_until,
    } = body;

    if (!code || !name || discount_percentage === undefined) {
      return NextResponse.json({ error: "Missing required coupon fields" }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      const id = generateCuid();
      const baseRow = await client.query('SELECT id FROM "Base" LIMIT 1;');
      const base_id = baseRow.rows[0]?.id || "default_base";

      const userTypeArr = Array.isArray(user_type) && user_type.length > 0
        ? user_type
        : ["FARMER"];

      const insertQuery = `
        INSERT INTO "DiscountCoupon" (
          id, code, name, discount_percentage, minimum_purchase,
          maximum_discount, usage_limit, usage_per_user,
          user_type, is_active, valid_from, valid_until,
          base_id, "createdAt", "updatedAt"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9::"UserType"[], $10, $11, $12,
          $13, NOW(), NOW()
        ) RETURNING id;
      `;

      await client.query(insertQuery, [
        id,
        code.toUpperCase().trim(),
        name,
        parseFloat(discount_percentage) || 0,
        minimum_purchase !== undefined && minimum_purchase !== "" ? parseFloat(minimum_purchase) : null,
        maximum_discount !== undefined && maximum_discount !== "" ? parseFloat(maximum_discount) : null,
        usage_limit !== undefined && usage_limit !== "" ? parseInt(usage_limit) : null,
        usage_per_user !== undefined && usage_per_user !== "" ? parseInt(usage_per_user) : 1,
        userTypeArr,
        is_active !== undefined ? Boolean(is_active) : true,
        valid_from ? new Date(valid_from) : new Date(),
        valid_until ? new Date(valid_until) : null,
        base_id,
      ]);

      return NextResponse.json({ id, message: "Coupon created successfully" }, { status: 201 });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("Error creating coupon in DB:", error);
    return NextResponse.json({ error: error.message || "Failed to create coupon" }, { status: 500 });
  }
}
