import { NextRequest, NextResponse } from "next/server";
import pool from "@/utils/Database/db";

export const dynamic = "force-dynamic";

// ── GET /api/subscription/[id] ─────────────────────────────────────────────
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const client = await pool.connect();
    try {
      const res = await client.query(
        `SELECT * FROM "Subscriptions" WHERE id = $1 LIMIT 1;`,
        [id]
      );
      if (!res.rows.length) {
        return NextResponse.json(
          { detail: "Subscription plan not found" },
          { status: 404 }
        );
      }
      return NextResponse.json(res.rows[0]);
    } finally {
      client.release();
    }
  } catch (error: any) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
}

// ── PATCH / PUT /api/subscription/[id] ─────────────────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return handleUpdate(req, params.id);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return handleUpdate(req, params.id);
}

async function handleUpdate(req: NextRequest, id: string) {
  try {
    const payload = await req.json();
    const setClauses: string[] = [];
    const values: any[] = [id];

    if ("name" in payload) {
      values.push(String(payload.name).trim());
      setClauses.push(`name = $${values.length}`);
    }

    if ("type" in payload) {
      let st = String(payload.type).trim();
      values.push(st);
      setClauses.push(`type = $${values.length}::"SubscriptionType"`);
    }

    if ("actual_cost" in payload) {
      values.push(parseFloat(payload.actual_cost) || 0.0);
      setClauses.push(`actual_cost = $${values.length}`);
    }

    if ("discount_cost" in payload) {
      values.push(parseFloat(payload.discount_cost) || 0.0);
      setClauses.push(`discount_cost = $${values.length}`);
    }

    if ("total_days" in payload) {
      values.push(parseFloat(payload.total_days) || 30.0);
      setClauses.push(`total_days = $${values.length}`);
    }

    if ("total_stores" in payload) {
      values.push(parseFloat(payload.total_stores) || 1.0);
      setClauses.push(`total_stores = $${values.length}`);
    }

    if ("total_tractors" in payload) {
      values.push(parseFloat(payload.total_tractors) || 5.0);
      setClauses.push(`total_tractors = $${values.length}`);
    }

    if ("total_attachments" in payload) {
      values.push(parseFloat(payload.total_attachments) || 5.0);
      setClauses.push(`total_attachments = $${values.length}`);
    }

    if ("for_owner" in payload) {
      values.push(Boolean(payload.for_owner));
      setClauses.push(`for_owner = $${values.length}`);
    }

    if ("for_dealer" in payload) {
      values.push(Boolean(payload.for_dealer));
      setClauses.push(`for_dealer = $${values.length}`);
    }

    if ("features" in payload) {
      const raw = payload.features || [];
      const feats = Array.isArray(raw)
        ? raw.map((f: any) => String(f).trim()).filter(Boolean)
        : [];
      values.push(feats);
      setClauses.push(`features = $${values.length}`);
    }

    if ("focused_features" in payload) {
      const raw = payload.focused_features || [];
      const focs = Array.isArray(raw)
        ? raw.map((f: any) => String(f).trim()).filter(Boolean)
        : [];
      values.push(focs);
      setClauses.push(`focused_features = $${values.length}`);
    }

    if (setClauses.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No fields to update",
        id,
      });
    }

    setClauses.push(`"updatedAt" = NOW()`);
    const sql = `UPDATE "Subscriptions" SET ${setClauses.join(", ")} WHERE id = $1 RETURNING *;`;

    const client = await pool.connect();
    try {
      const res = await client.query(sql, values);
      if (!res.rows.length) {
        return NextResponse.json(
          { detail: "Subscription plan not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        message: "Subscription plan updated successfully",
        data: res.rows[0],
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("Error in update /api/subscription/[id]:", error);
    return NextResponse.json(
      { detail: error.message || "Failed to update subscription plan" },
      { status: 500 }
    );
  }
}

// ── DELETE /api/subscription/[id] ──────────────────────────────────────────
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const client = await pool.connect();
    try {
      await client.query(`DELETE FROM "Subscriptions" WHERE id = $1;`, [id]);
      return NextResponse.json({
        success: true,
        message: "Subscription plan deleted successfully",
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("Error in DELETE /api/subscription/[id]:", error);
    return NextResponse.json(
      { detail: error.message || "Failed to delete subscription plan" },
      { status: 500 }
    );
  }
}
