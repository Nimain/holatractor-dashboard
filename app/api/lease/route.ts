import { NextRequest, NextResponse } from "next/server";
import pool from "@/utils/Database/db";
import { FastApiBaseURL } from "@/utils/Axios/RenderInstance";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id");

  // 1. Try forwarding to FastAPI backend if reachable
  try {
    const fastApiUrl = `${FastApiBaseURL.replace(/\/$/, "")}/lease${userId ? `?user_id=${encodeURIComponent(userId)}` : ""}`;
    const authHeader = request.headers.get("authorization");
    const fastRes = await fetch(fastApiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      next: { revalidate: 0 },
    });

    if (fastRes.ok) {
      const data = await fastRes.json();
      if (Array.isArray(data) && data.length > 0) {
        return NextResponse.json(data);
      }
    }
  } catch (err) {
    console.warn("[GET /api/lease] FastAPI forward notice:", (err as any)?.message);
  }

  // 2. Direct PostgreSQL query fallback
  try {
    const client = await pool.connect();
    try {
      const allLeases: any[] = [];
      const seenIds = new Set<string>();

      // Check lease_bookings table
      try {
        const bookingsRes = await client.query(`
          SELECT * FROM lease_bookings
          ${userId ? "WHERE user_id = $1" : ""}
          ORDER BY created_at DESC;
        `, userId ? [userId] : []);

        for (const r of bookingsRes.rows) {
          const lId = String(r.id);
          if (!seenIds.has(lId)) {
            seenIds.add(lId);
            allLeases.push({
              id: lId,
              user_id: String(r.user_id || ""),
              store_id: String(r.store_id || ""),
              start_date: r.start_date ? new Date(r.start_date).toISOString().split("T")[0] : "2026-09-07",
              end_date: r.end_date ? new Date(r.end_date).toISOString().split("T")[0] : "2026-10-07",
              hours_operation_per_day: String(r.hours_operation_per_day || "Eight_Hours"),
              total_cost: Number(r.total_cost || 0),
              total_tractor_cost: Number(r.total_tractor_cost || 0),
              total_attachment_cost: Number(r.total_attachment_cost || 0),
              total_tax: Number(r.total_tax || 0),
              total_service_charge: Number(r.total_service_charge || 0),
              status: String(r.status || "Confirmed"),
              location_city: String(r.location_city || "Santa Cruz"),
              location_country: String(r.location_country || "Bolivia"),
              attachment: String(r.attachment || ""),
              tractor_ids: Array.isArray(r.tractor_ids) ? r.tractor_ids : [],
              attachment_ids: Array.isArray(r.attachment_ids) ? r.attachment_ids : [],
              createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
              updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString(),
            });
          }
        }
      } catch (tableErr) {
        console.warn("[GET /api/lease] lease_bookings table query note:", (tableErr as any)?.message);
      }

      // Check legacy "Lease" table
      try {
        const legacyRes = await client.query(`
          SELECT id, user_id, status, "createdAt", "updatedAt", "monthlyPrice", "startDate", "tractorId"
          FROM "Lease"
          ${userId ? "WHERE user_id = $1" : ""}
          ORDER BY "createdAt" DESC
          LIMIT 50;
        `, userId ? [userId] : []);

        for (const r of legacyRes.rows) {
          const lId = String(r.id);
          if (!seenIds.has(lId)) {
            seenIds.add(lId);
            const stDate = r.startDate || r.createdAt || new Date();
            const mPrice = Number(r.monthlyPrice || 1100);
            allLeases.push({
              id: lId,
              user_id: String(r.user_id || ""),
              store_id: "store_primary",
              start_date: new Date(stDate).toISOString().split("T")[0],
              end_date: "2026-10-01",
              hours_operation_per_day: "Eight_Hours",
              total_cost: mPrice,
              total_tractor_cost: mPrice,
              total_attachment_cost: 0,
              total_tax: 0,
              total_service_charge: 0,
              status: String(r.status || "Confirmed"),
              location_city: "Santa Cruz",
              location_country: "Bolivia",
              attachment: "",
              tractor_ids: [String(r.tractorId || "")],
              attachment_ids: [],
              createdAt: new Date(r.createdAt || Date.now()).toISOString(),
              updatedAt: new Date(r.updatedAt || Date.now()).toISOString(),
            });
          }
        }
      } catch (legacyErr) {
        console.warn("[GET /api/lease] legacy Lease table query note:", (legacyErr as any)?.message);
      }

      return NextResponse.json(allLeases);
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("[GET /api/lease] Error:", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch leases" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const authHeader = request.headers.get("authorization");

    // 1. Try forwarding to FastAPI backend
    try {
      const fastApiUrl = `${FastApiBaseURL.replace(/\/$/, "")}/lease`;
      const fastRes = await fetch(fastApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
        body: JSON.stringify(body),
      });

      if (fastRes.ok) {
        const data = await fastRes.json();
        return NextResponse.json(data, { status: 201 });
      }
    } catch (err) {
      console.warn("[POST /api/lease] FastAPI forward notice:", (err as any)?.message);
    }

    // 2. Direct PostgreSQL fallback
    const client = await pool.connect();
    try {
      const sDate = body.start_date ? new Date(body.start_date) : new Date();
      const eDate = body.end_date ? new Date(body.end_date) : new Date(Date.now() + 30 * 86400000);
      const deltaDays = Math.max(1, Math.round((eDate.getTime() - sDate.getTime()) / (1000 * 3600 * 24)));
      const tIds = Array.isArray(body.tractor_ids) ? body.tractor_ids : [];
      const aIds = Array.isArray(body.attachment_ids) ? body.attachment_ids : [];

      const hoursPerDay = 8;
      const tHourly = (tIds.length || 1) * 25.0;
      const aHourly = aIds.length * 15.0;
      const totalTractorCost = tHourly * hoursPerDay * deltaDays;
      const totalAttachmentCost = aHourly * hoursPerDay * deltaDays;
      const subtotal = totalTractorCost + totalAttachmentCost;
      const totalTax = Math.round(subtotal * 0.13 * 100) / 100;
      const totalServiceCharge = Math.round(subtotal * 0.05 * 100) / 100;
      const totalCost = Math.round((subtotal + totalTax + totalServiceCharge) * 100) / 100;

      const leaseId = `lease_${Math.random().toString(36).substring(2, 11)}`;
      const now = new Date();

      await client.query(`
        CREATE TABLE IF NOT EXISTS lease_bookings (
          id                      VARCHAR(100) PRIMARY KEY,
          user_id                 VARCHAR(100) NOT NULL,
          store_id                VARCHAR(100) NOT NULL,
          start_date              TIMESTAMPTZ,
          end_date                TIMESTAMPTZ,
          hours_operation_per_day VARCHAR(50) DEFAULT 'Eight_Hours',
          location_name           VARCHAR(255),
          location_address        TEXT,
          location_city           VARCHAR(100),
          location_state          VARCHAR(100),
          location_zip_code       VARCHAR(50),
          location_country        VARCHAR(100),
          attachment              TEXT,
          tractor_ids             JSONB DEFAULT '[]'::jsonb,
          attachment_ids          JSONB DEFAULT '[]'::jsonb,
          total_tractor_cost      DOUBLE PRECISION DEFAULT 0.0,
          total_attachment_cost   DOUBLE PRECISION DEFAULT 0.0,
          total_distance_cost     DOUBLE PRECISION DEFAULT 0.0,
          total_service_charge    DOUBLE PRECISION DEFAULT 0.0,
          total_tax               DOUBLE PRECISION DEFAULT 0.0,
          total_cost              DOUBLE PRECISION DEFAULT 0.0,
          status                  VARCHAR(50) DEFAULT 'pending',
          user_confirm            BOOLEAN DEFAULT TRUE,
          owner_confirm           BOOLEAN DEFAULT FALSE,
          dealer_confirm          BOOLEAN DEFAULT FALSE,
          created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `);

      await client.query(`
        INSERT INTO lease_bookings (
          id, user_id, store_id, start_date, end_date,
          hours_operation_per_day, location_name, location_address,
          location_city, location_state, location_zip_code, location_country,
          attachment, tractor_ids, attachment_ids,
          total_tractor_cost, total_attachment_cost, total_distance_cost,
          total_service_charge, total_tax, total_cost,
          status, user_confirm, owner_confirm, dealer_confirm,
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8,
          $9, $10, $11, $12,
          $13, $14, $15,
          $16, $17, 0.0,
          $18, $19, $20,
          'confirmed', true, false, false,
          $21, $22
        );
      `, [
        leaseId,
        body.user_id || "user_demo",
        body.store_id || "store_demo",
        sDate,
        eDate,
        body.working_hgour_per_day || "Eight_Hours",
        body.location_name || "Agricultural Land",
        body.location_address || "",
        body.location_city || "",
        body.location_state || "",
        body.location_zip_code || "",
        body.location_country || "Bolivia",
        body.attachment || "",
        JSON.stringify(tIds),
        JSON.stringify(aIds),
        totalTractorCost,
        totalAttachmentCost,
        totalServiceCharge,
        totalTax,
        totalCost,
        now,
        now,
      ]);

      return NextResponse.json({
        id: leaseId,
        user_id: body.user_id,
        store_id: body.store_id,
        start_date: sDate.toISOString(),
        end_date: eDate.toISOString(),
        total_cost: totalCost,
        status: "Confirmed",
        confirm: true,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      }, { status: 201 });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("[POST /api/lease] Error:", error);
    return NextResponse.json({ error: error?.message || "Failed to create lease" }, { status: 500 });
  }
}
