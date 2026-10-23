import { NextRequest, NextResponse } from "next/server";
import pool from "@/utils/Database/db";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
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

    const client = await pool.connect();
    try {
      const updates: string[] = [];
      const values: any[] = [id];

      if (code !== undefined) {
        values.push(code.toUpperCase().trim());
        updates.push(`code = $${values.length}`);
      }
      if (name !== undefined) {
        values.push(name);
        updates.push(`name = $${values.length}`);
      }
      if (discount_percentage !== undefined) {
        values.push(parseFloat(discount_percentage));
        updates.push(`discount_percentage = $${values.length}`);
      }
      if (minimum_purchase !== undefined) {
        values.push(minimum_purchase !== null && minimum_purchase !== "" ? parseFloat(minimum_purchase) : null);
        updates.push(`minimum_purchase = $${values.length}`);
      }
      if (maximum_discount !== undefined) {
        values.push(maximum_discount !== null && maximum_discount !== "" ? parseFloat(maximum_discount) : null);
        updates.push(`maximum_discount = $${values.length}`);
      }
      if (usage_limit !== undefined) {
        values.push(usage_limit !== null && usage_limit !== "" ? parseInt(usage_limit) : null);
        updates.push(`usage_limit = $${values.length}`);
      }
      if (usage_per_user !== undefined) {
        values.push(usage_per_user !== null && usage_per_user !== "" ? parseInt(usage_per_user) : 1);
        updates.push(`usage_per_user = $${values.length}`);
      }
      if (user_type !== undefined) {
        const userTypeArr = Array.isArray(user_type) ? user_type : [user_type];
        values.push(userTypeArr);
        updates.push(`user_type = $${values.length}::"UserType"[]`);
      }
      if (is_active !== undefined) {
        values.push(Boolean(is_active));
        updates.push(`is_active = $${values.length}`);
      }
      if (valid_from !== undefined) {
        values.push(valid_from ? new Date(valid_from) : null);
        updates.push(`valid_from = $${values.length}`);
      }
      if (valid_until !== undefined) {
        values.push(valid_until ? new Date(valid_until) : null);
        updates.push(`valid_until = $${values.length}`);
      }

      if (updates.length === 0) {
        return NextResponse.json({ message: "No fields to update" });
      }

      updates.push(`"updatedAt" = NOW()`);

      const query = `UPDATE "DiscountCoupon" SET ${updates.join(", ")} WHERE id = $1 RETURNING id;`;
      const res = await client.query(query, values);

      if (res.rowCount === 0) {
        return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
      }

      return NextResponse.json({ message: "Coupon updated successfully" });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("Error updating coupon:", error);
    return NextResponse.json({ error: error.message || "Failed to update coupon" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  try {
    const client = await pool.connect();
    try {
      await client.query('DELETE FROM "DiscountCoupon" WHERE id = $1;', [id]);
      return NextResponse.json({ message: "Coupon deleted successfully" });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("Error deleting coupon:", error);
    return NextResponse.json({ error: error.message || "Failed to delete coupon" }, { status: 500 });
  }
}
