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
    const { name, code, symbol, exchange_rate, country_codes, is_base, is_active } = body;

    const client = await pool.connect();
    try {
      const updates: string[] = [];
      const values: any[] = [id];

      if (name !== undefined) {
        values.push(name);
        updates.push(`name = $${values.length}`);
      }
      if (code !== undefined) {
        values.push(code.toUpperCase().trim());
        updates.push(`code = $${values.length}`);
      }
      if (symbol !== undefined) {
        values.push(symbol);
        updates.push(`symbol = $${values.length}`);
      }
      if (exchange_rate !== undefined) {
        values.push(parseFloat(exchange_rate));
        updates.push(`exchange_rate = $${values.length}`);
      }
      if (country_codes !== undefined) {
        const formatted = Array.isArray(country_codes)
          ? country_codes
          : typeof country_codes === "string"
          ? country_codes.split(",").map((c: string) => c.trim()).filter(Boolean)
          : [];
        values.push(formatted);
        updates.push(`country_codes = $${values.length}`);
      }
      if (is_base !== undefined) {
        values.push(Boolean(is_base));
        updates.push(`is_base = $${values.length}`);
      }
      if (is_active !== undefined) {
        values.push(Boolean(is_active));
        updates.push(`is_active = $${values.length}`);
      }

      if (updates.length === 0) {
        return NextResponse.json({ message: "No fields to update" });
      }

      updates.push(`"updatedAt" = NOW()`);

      const query = `UPDATE "Currency" SET ${updates.join(", ")} WHERE id = $1 RETURNING id;`;
      const res = await client.query(query, values);

      if (res.rowCount === 0) {
        return NextResponse.json({ error: "Currency not found" }, { status: 404 });
      }

      return NextResponse.json({ message: "Currency updated successfully" });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("Error updating currency:", error);
    return NextResponse.json({ error: error.message || "Failed to update currency" }, { status: 500 });
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
      await client.query('UPDATE "Currency" SET is_active = FALSE, "updatedAt" = NOW() WHERE id = $1;', [id]);
      return NextResponse.json({ message: "Currency deactivated successfully" });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("Error deleting currency:", error);
    return NextResponse.json({ error: error.message || "Failed to delete currency" }, { status: 500 });
  }
}
