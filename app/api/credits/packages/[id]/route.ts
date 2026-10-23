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

    const client = await pool.connect();
    try {
      const updates: string[] = [];
      const values: any[] = [id];

      if (name !== undefined) {
        values.push(name);
        updates.push(`name = $${values.length}`);
      }
      if (base_credits !== undefined) {
        values.push(parseInt(base_credits));
        updates.push(`base_credits = $${values.length}`);
      }
      if (bonus_credits !== undefined) {
        values.push(parseInt(bonus_credits));
        updates.push(`bonus_credits = $${values.length}`);
      }
      if (price !== undefined) {
        values.push(parseFloat(price));
        updates.push(`price = $${values.length}`);
      }
      if (currency_id !== undefined) {
        values.push(currency_id);
        updates.push(`currency_id = $${values.length}`);
      }
      if (discount_percentage !== undefined) {
        values.push(parseFloat(discount_percentage));
        updates.push(`discount_percentage = $${values.length}`);
      }
      if (user_type !== undefined) {
        values.push(user_type);
        updates.push(`user_type = $${values.length}::"UserType"`);
      }
      if (is_active !== undefined) {
        values.push(Boolean(is_active));
        updates.push(`is_active = $${values.length}`);
      }
      if (is_featured !== undefined) {
        values.push(Boolean(is_featured));
        updates.push(`is_featured = $${values.length}`);
      }
      if (sort_order !== undefined) {
        values.push(parseInt(sort_order));
        updates.push(`sort_order = $${values.length}`);
      }
      if (valid_from !== undefined) {
        values.push(valid_from ? new Date(valid_from) : null);
        updates.push(`valid_from = $${values.length}`);
      }
      if (valid_until !== undefined) {
        values.push(valid_until ? new Date(valid_until) : null);
        updates.push(`valid_until = $${values.length}`);
      }
      if (max_purchases !== undefined) {
        values.push(max_purchases ? parseInt(max_purchases) : null);
        updates.push(`max_purchases = $${values.length}`);
      }

      if (updates.length === 0) {
        return NextResponse.json({ message: "No fields to update" });
      }

      updates.push(`"updatedAt" = NOW()`);

      const query = `UPDATE "CreditPackage" SET ${updates.join(", ")} WHERE id = $1 RETURNING id;`;
      const res = await client.query(query, values);

      if (res.rowCount === 0) {
        return NextResponse.json({ error: "Credit package not found" }, { status: 404 });
      }

      return NextResponse.json({ message: "Credit package updated successfully" });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("Error updating credit package:", error);
    return NextResponse.json({ error: error.message || "Failed to update credit package" }, { status: 500 });
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
      const purCount = await client.query('SELECT COUNT(*)::int as count FROM "CreditPurchase" WHERE package_id = $1;', [id]);
      if ((purCount.rows[0]?.count || 0) > 0) {
        await client.query('UPDATE "CreditPackage" SET is_active = FALSE, "updatedAt" = NOW() WHERE id = $1;', [id]);
      } else {
        await client.query('DELETE FROM "CreditPackage" WHERE id = $1;', [id]);
      }
      return NextResponse.json({ message: "Credit package deleted successfully" });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("Error deleting credit package:", error);
    return NextResponse.json({ error: error.message || "Failed to delete credit package" }, { status: 500 });
  }
}
