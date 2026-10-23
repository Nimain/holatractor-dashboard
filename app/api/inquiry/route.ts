import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import jwt from "jsonwebtoken";
import pool from "@/utils/Database/db";

import { getFastApiAuthHeaders } from "@/utils/auth/serverAuth";

export const dynamic = "force-dynamic";

const FastApiBaseURL =
  process.env.NEXT_PUBLIC_TRACTOR_AI_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://tractorai.sinsignal.com/";

export async function GET(request: NextRequest) {
  try {
    // 1. Direct Render PostgreSQL DB Query
    try {
      const client = await pool.connect();
      try {
        const list: any[] = [];

        // 1. inquiry table
        const inq = await client.query('SELECT * FROM inquiry ORDER BY "createdAt" DESC');
        inq.rows.forEach((r) => {
          list.push({
            id: String(r.id),
            first_name: r.first_name || "Inquirer",
            last_name: r.last_name || "",
            email: r.email || "",
            phone: r.phone || "",
            tractor_type: r.tractor_type || "Machinery Booking",
            budget: r.budget ? `$${r.budget}` : "Quote on Request",
            message: r.message || "Machinery reservation request",
            city: r.city || "Santa Cruz",
            createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
            updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : new Date().toISOString(),
          });
        });

        // 2. TractorLead table
        const tl = await client.query(`
          SELECT tl.*, t.name as tractor_name, t.model as tractor_model, u.email as user_email
          FROM "TractorLead" tl
          LEFT JOIN "Tractor" t ON t.id = tl."tractorId"
          LEFT JOIN "User" u ON u.id = tl.user_id
          ORDER BY tl."createdAt" DESC
        `);
        tl.rows.forEach((r) => {
          const parts = (r.name || "Customer").trim().split(" ");
          list.push({
            id: String(r.id),
            first_name: parts[0] || "Customer",
            last_name: parts.slice(1).join(" ") || "",
            email: r.user_email || "lead@holatractor.com",
            phone: r.mobile || "",
            tractor_type: r.tractor_name || r.tractor_model || "Tractor Rental Inquiry",
            budget: r.timeframe ? `Timeline: ${r.timeframe}` : "Direct Rental",
            message: `Tractor lead inquiry for ${r.tractor_name || r.tractor_model || "machinery"}. Delivery City: ${r.city || "Santa Cruz"}.`,
            city: r.city || "Santa Cruz",
            createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
            updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : new Date().toISOString(),
          });
        });

        // 3. BookingserviceLead table
        const bsl = await client.query(`
          SELECT bsl.*, s.name as service_name, u.first_name, u.last_name, u.email, u.mobile
          FROM "BookingserviceLead" bsl
          LEFT JOIN "Services" s ON s.id = bsl.service_id
          LEFT JOIN "User" u ON u.id = bsl.farmer_id
          ORDER BY bsl."createdAt" DESC
        `);
        bsl.rows.forEach((r) => {
          list.push({
            id: String(r.id),
            first_name: r.first_name || "Farmer",
            last_name: r.last_name || "Lead",
            email: r.email || "service@holatractor.com",
            phone: r.mobile || "",
            tractor_type: r.service_name || "Farm Service Lead",
            budget: r.farm_area ? `${r.farm_area} m² Area` : "Custom Service",
            message: `Booking service request for crop: ${r.crops || "Standard"}. Target date: ${new Date(r.start_date).toLocaleDateString()}.`,
            city: "Santa Cruz",
            createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
            updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : new Date().toISOString(),
          });
        });

        if (list.length > 0) {
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          return NextResponse.json(list);
        }
      } finally {
        client.release();
      }
    } catch (dbErr: any) {
      console.warn("[/api/inquiry] DB direct notice:", dbErr?.message);
    }

    // 2. FastAPI fallback
    try {
      const headers = getAdminHeaders();
      const fastApiRes = await axios.get(
        `${FastApiBaseURL.replace(/\/$/, "")}/api/v1/admin/inquiries`,
        { headers, timeout: 6000 }
      );
      if (Array.isArray(fastApiRes.data) && fastApiRes.data.length > 0) {
        return NextResponse.json(fastApiRes.data);
      }
    } catch {}

    return NextResponse.json([]);
  } catch (error: any) {
    console.error("[/api/inquiry] GET error:", error?.message);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const id = `inq_${Date.now()}`;

    // Safely map tractor_type to valid Postgres TractorType enum ('large' | 'medium' | 'small')
    const rawType = String(body.tractor_type || "").toLowerCase();
    let sanitizedTractorType = "medium";
    if (rawType === "large" || rawType.includes("large") || rawType.includes("heavy") || (body.hp && Number(body.hp) > 85)) {
      sanitizedTractorType = "large";
    } else if (rawType === "small" || rawType.includes("small") || rawType.includes("compact") || rawType.includes("implement") || (body.hp && Number(body.hp) < 45)) {
      sanitizedTractorType = "small";
    }

    // Preserve full equipment details in message
    const equipmentLabel = body.equipment_name || body.tractor_type;
    let fullMessage = (body.message || "").trim();
    if (equipmentLabel && !fullMessage.includes(equipmentLabel)) {
      fullMessage = `[Equipment: ${equipmentLabel}] ${fullMessage}`.trim();
    }

    const client = await pool.connect();
    try {
      const baseRes = await client.query('SELECT id FROM "Base" LIMIT 1');
      const baseId = baseRes.rows[0]?.id || "cm89t43ky00034wft9fiixpc7";

      await client.query(
        `
        INSERT INTO inquiry (
          id, first_name, last_name, email, phone, tractor_type, budget, message, city, base_id, "createdAt", "updatedAt"
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      `,
        [
          id,
          body.first_name || "Inquirer",
          body.last_name || "",
          body.email || "",
          body.phone || "",
          sanitizedTractorType,
          body.budget || "50000",
          fullMessage,
          body.city || "Santa Cruz",
          baseId,
        ]
      );
    } finally {
      client.release();
    }

    return NextResponse.json(
      {
        id,
        first_name: body.first_name || "Inquirer",
        last_name: body.last_name || "",
        email: body.email || "",
        phone: body.phone || "",
        tractor_type: sanitizedTractorType,
        equipment_name: equipmentLabel || sanitizedTractorType,
        budget: body.budget || "50000",
        message: fullMessage,
        city: body.city || "Santa Cruz",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[/api/inquiry] POST error:", error?.message);
    return NextResponse.json(
      { message: error?.message || "Failed to create inquiry", success: false },
      { status: 500 }
    );
  }
}
