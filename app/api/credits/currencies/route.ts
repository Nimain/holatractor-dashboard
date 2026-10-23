import { NextRequest, NextResponse } from "next/server";
import pool from "@/utils/Database/db";

export const dynamic = "force-dynamic";

function generateCuid(): string {
  const timestamp = Date.now().toString(36);
  const randChars =
    Math.random().toString(36).substring(2, 10) +
    Math.random().toString(36).substring(2, 10);
  return `curr_${timestamp}${randChars}`.slice(0, 25);
}

export async function GET(req: NextRequest) {
  try {
    const client = await pool.connect();
    try {
      const query = `
        SELECT 
          id, code, name, symbol, exchange_rate, is_base, is_active, country_codes, "createdAt", "updatedAt"
        FROM "Currency"
        ORDER BY is_base DESC, code ASC;
      `;
      const result = await client.query(query);

      const currencies = result.rows.map((r) => ({
        id: r.id,
        code: r.code,
        name: r.name,
        symbol: r.symbol,
        exchange_rate: parseFloat(r.exchange_rate || "1.0"),
        is_base: Boolean(r.is_base),
        is_active: Boolean(r.is_active),
        country_codes: Array.isArray(r.country_codes) ? r.country_codes : [],
        createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : new Date().toISOString(),
      }));

      return NextResponse.json(currencies);
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("Error fetching currencies from DB:", error);
    return NextResponse.json({ error: "Failed to fetch currencies" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, code, symbol, exchange_rate, country_codes, is_base, is_active } = body;

    if (!name || !code || !symbol) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      const id = generateCuid();
      const baseRow = await client.query('SELECT id FROM "Base" LIMIT 1;');
      const base_id = baseRow.rows[0]?.id || "default_base";

      const insertQuery = `
        INSERT INTO "Currency" (
          id, code, name, symbol, exchange_rate, is_base, is_active, country_codes, base_id, "createdAt", "updatedAt"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()
        ) RETURNING id;
      `;

      const formattedCountryCodes = Array.isArray(country_codes)
        ? country_codes
        : typeof country_codes === "string"
        ? country_codes.split(",").map((c) => c.trim()).filter(Boolean)
        : [];

      await client.query(insertQuery, [
        id,
        code.toUpperCase().trim(),
        name,
        symbol,
        parseFloat(exchange_rate) || 1.0,
        Boolean(is_base),
        is_active !== undefined ? Boolean(is_active) : true,
        formattedCountryCodes,
        base_id,
      ]);

      return NextResponse.json({ id, message: "Currency created successfully" }, { status: 201 });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("Error creating currency in DB:", error);
    return NextResponse.json({ error: error.message || "Failed to create currency" }, { status: 500 });
  }
}
