import { NextRequest, NextResponse } from "next/server";
import pool from "@/utils/Database/db";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

// ── GET /api/subscription ──────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const target = searchParams.get("target");
    const forOwnerParam = searchParams.get("for_owner");
    const forDealerParam = searchParams.get("for_dealer");

    let query = `
      SELECT 
        id, name, type, actual_cost, discount_cost, total_days,
        total_stores, total_tractors, total_attachments, total_devices, total_operators,
        for_owner, for_dealer, features, focused_features, base_id, created_by,
        "createdAt", "updatedAt"
      FROM "Subscriptions"
      WHERE 1=1
    `;
    const params: any[] = [];

    if (forOwnerParam === "true" || target === "owner") {
      params.push(true);
      query += ` AND for_owner = $${params.length}`;
    }

    if (forDealerParam === "true" || target === "dealer") {
      params.push(true);
      query += ` AND for_dealer = $${params.length}`;
    }

    query += ` ORDER BY "discount_cost" ASC, "createdAt" DESC;`;

    const client = await pool.connect();
    try {
      const res = await client.query(query, params);
      const plans = res.rows.map((r) => ({
        id: r.id,
        name: r.name,
        type: r.type,
        price: Number(r.discount_cost || 0),
        actual_cost: Number(r.actual_cost || 0),
        discount_cost: Number(r.discount_cost || 0),
        total_days: Number(r.total_days || 30),
        total_stores: Number(r.total_stores || 1),
        total_tractors: Number(r.total_tractors || 5),
        total_attachments: Number(r.total_attachments || 5),
        total_devices: Number(r.total_devices || 1),
        total_operators: Number(r.total_operators || 5),
        for_owner: Boolean(r.for_owner),
        for_dealer: Boolean(r.for_dealer),
        features: Array.isArray(r.features) ? r.features : [],
        focused_features: Array.isArray(r.focused_features) ? r.focused_features : [],
        base_id: r.base_id,
        created_by: r.created_by,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      }));
      return NextResponse.json(plans);
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("Error in GET /api/subscription:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscriptions", detail: error.message },
      { status: 500 }
    );
  }
}

// ── POST /api/subscription ─────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const name = String(payload.name || "").trim();

    if (!name) {
      return NextResponse.json(
        { detail: "Subscription plan name is required." },
        { status: 400 }
      );
    }

    let subType = String(payload.type || "Basic").trim();
    const validTypes = ["Basic", "Business", "Premium", "Custom"];
    const matchedType = validTypes.find(
      (t) => t.toLowerCase() === subType.toLowerCase()
    );
    subType = matchedType || "Basic";

    const actualCost = parseFloat(payload.actual_cost) || 0.0;
    const discountCost =
      payload.discount_cost !== undefined
        ? parseFloat(payload.discount_cost) || 0.0
        : actualCost;
    const totalDays = parseFloat(payload.total_days) || 30.0;
    const totalStores = parseFloat(payload.total_stores) || 1.0;
    const totalTractors = parseFloat(payload.total_tractors) || 5.0;
    const totalAttachments = parseFloat(payload.total_attachments) || 5.0;
    const totalDevices = parseFloat(payload.total_devices) || 1.0;
    const totalOperators = parseFloat(payload.total_operators) || 5.0;

    const forOwner = Boolean(payload.for_owner);
    const forDealer = Boolean(payload.for_dealer);

    const rawFeatures = payload.features || [];
    const features = Array.isArray(rawFeatures)
      ? rawFeatures.map((f: any) => String(f).trim()).filter(Boolean)
      : [];

    const rawFocused = payload.focused_features || [];
    const focusedFeatures = Array.isArray(rawFocused)
      ? rawFocused.map((f: any) => String(f).trim()).filter(Boolean)
      : [];

    const planId = String(payload.id || randomUUID());

    const client = await pool.connect();
    try {
      // 1. Resolve created_by user
      let createdBy = payload.created_by;
      if (!createdBy) {
        const uRes = await client.query(
          `SELECT id FROM "User" ORDER BY "createdAt" ASC LIMIT 1;`
        );
        createdBy = uRes.rows[0]?.id || "cmgwm8lqk07rz1198sz75s0r9";
      }

      // 2. Resolve base_id from Base table
      let baseId = payload.base_id;
      if (!baseId) {
        const bRes = await client.query(
          `SELECT id FROM "Base" ORDER BY id ASC LIMIT 1;`
        );
        baseId = bRes.rows[0]?.id || "cm89t43ky00034wft9fiixpc7";
      }

      // 3. Insert into Subscriptions
      const insertSql = `
        INSERT INTO "Subscriptions" (
          id, name, type, actual_cost, discount_cost, total_days,
          total_stores, total_tractors, total_attachments, total_devices, total_operators,
          for_owner, for_dealer, features, focused_features, base_id, created_by,
          "createdAt", "updatedAt"
        ) VALUES (
          $1, $2, $3::"SubscriptionType", $4, $5, $6,
          $7, $8, $9, $10, $11,
          $12, $13, $14, $15, $16, $17,
          NOW(), NOW()
        ) RETURNING *;
      `;

      const values = [
        planId,
        name,
        subType,
        actualCost,
        discountCost,
        totalDays,
        totalStores,
        totalTractors,
        totalAttachments,
        totalDevices,
        totalOperators,
        forOwner,
        forDealer,
        features,
        focusedFeatures,
        baseId,
        createdBy,
      ];

      const result = await client.query(insertSql, values);
      const row = result.rows[0];

      return NextResponse.json(
        {
          success: true,
          message: "Subscription plan created successfully",
          data: {
            id: row.id,
            name: row.name,
            type: row.type,
            price: Number(row.discount_cost),
            actual_cost: Number(row.actual_cost),
            discount_cost: Number(row.discount_cost),
            total_days: Number(row.total_days),
            total_stores: Number(row.total_stores),
            total_tractors: Number(row.total_tractors),
            total_attachments: Number(row.total_attachments),
            total_devices: Number(row.total_devices),
            total_operators: Number(row.total_operators),
            for_owner: Boolean(row.for_owner),
            for_dealer: Boolean(row.for_dealer),
            features: row.features || [],
            focused_features: row.focused_features || [],
          },
        },
        { status: 201 }
      );
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("Error in POST /api/subscription:", error);
    return NextResponse.json(
      { detail: error.message || "Failed to create subscription plan" },
      { status: 500 }
    );
  }
}
