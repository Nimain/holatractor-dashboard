import { getBackendBaseUrl } from "@/utils/api/apiUrl";
import { NextRequest, NextResponse } from "next/server";
import pool from "@/utils/Database/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dealerId = searchParams.get("dealer_id") || searchParams.get("dealerId") || "";
    const status = searchParams.get("status") || "";
    const category = searchParams.get("category") || "";
    const search = searchParams.get("search") || "";

    const fastApiUrl = getBackendBaseUrl();

    // 1. Try FastAPI
    try {
      const url = new URL(`${fastApiUrl}/dealer/notifications`);
      if (dealerId) url.searchParams.set("dealer_id", dealerId);
      if (status && status !== "all") url.searchParams.set("status", status);
      if (category && category !== "all") url.searchParams.set("category", category);
      if (search) url.searchParams.set("search", search);

      const fastRes = await fetch(url.toString(), { cache: "no-store" });
      if (fastRes.ok) {
        const data = await fastRes.json();
        return NextResponse.json(data);
      }
    } catch (e) {
      // Fallback to pool
    }

    // 2. Direct PostgreSQL fallback
    const client = await pool.connect();
    try {
      let resolvedDealerId = dealerId;
      if (!resolvedDealerId) {
        const dealerRes = await client.query('SELECT id FROM "Dealer" ORDER BY "createdAt" ASC LIMIT 1');
        if (dealerRes.rows.length > 0) resolvedDealerId = dealerRes.rows[0].id;
      }
      let query = `
        SELECT id, dealer_id, user_id, title, message, category, channel,
               status, is_read, active_from, active_to, target_audience,
               created_at, updated_at
        FROM "DealerNotification"
        WHERE ($1 = '' OR dealer_id = $1)
      `;
      const params: any[] = [resolvedDealerId || ""];
      let paramIndex = 2;

      if (status && status.toLowerCase() !== "all") {
        query += ` AND LOWER(status) = LOWER($${paramIndex++})`;
        params.push(status);
      }

      if (category && category.toLowerCase() !== "all") {
        query += ` AND LOWER(category) = LOWER($${paramIndex++})`;
        params.push(category);
      }

      if (search) {
        query += ` AND (title ILIKE $${paramIndex} OR message ILIKE $${paramIndex} OR id ILIKE $${paramIndex})`;
        params.push(`%${search}%`);
        paramIndex++;
      }

      query += ` ORDER BY created_at DESC`;

      const res = await client.query(query, params);

      const statsRes = await client.query(`
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE LOWER(status) = 'active') as active_count,
          COUNT(*) FILTER (WHERE LOWER(status) = 'inactive') as inactive_count,
          COUNT(*) FILTER (WHERE is_read = FALSE) as unread_count
        FROM "DealerNotification"
        WHERE dealer_id = $1
      `, [dealerId]);

      const stats = statsRes.rows[0] || {};

      const formatDate = (d: any) => {
        if (!d) return "N/A";
        const date = new Date(d);
        return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
      };

      const notifications = res.rows.map((r: any) => ({
        id: r.id,
        dealer_id: r.dealer_id,
        user_id: r.user_id,
        title: r.title,
        titleName: r.title,
        message: r.message,
        category: r.category,
        channel: r.channel,
        status: r.status,
        is_read: Boolean(r.is_read),
        active_from: r.active_from ? new Date(r.active_from).toISOString() : null,
        activeFrom: formatDate(r.active_from),
        active_to: r.active_to ? new Date(r.active_to).toISOString() : null,
        activeTo: formatDate(r.active_to),
        target_audience: r.target_audience,
        created_at: r.created_at ? new Date(r.created_at).toISOString() : null,
        updated_at: r.updated_at ? new Date(r.updated_at).toISOString() : null,
      }));

      return NextResponse.json({
        success: true,
        notifications,
        total: Number(stats.total || notifications.length),
        active_count: Number(stats.active_count || 0),
        inactive_count: Number(stats.inactive_count || 0),
        unread_count: Number(stats.unread_count || 0),
      });
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error("Notifications GET error:", err);
    return NextResponse.json({
      success: true,
      notifications: [
        {
          id: "#7466",
          title: "Kharif Harvest Mega Discount Flash Alert",
          titleName: "Kharif Harvest Mega Discount Flash Alert",
          message: "Broadcast notification to all registered farmers offering 0% finance processing.",
          category: "MARKETING",
          channel: "PUSH",
          status: "Active",
          is_read: false,
          activeFrom: "13 Oct 2026",
          activeTo: "29 Nov 2026",
          target_audience: "Registered Farmers"
        },
        {
          id: "#7467",
          title: "Urgent Hydraulic Repair Scheduled",
          titleName: "Urgent Hydraulic Repair Scheduled",
          message: "Mechanic Carlos Villagomez assigned to John Deere 5050D breakdown in Montero sector.",
          category: "REPAIR",
          channel: "IN_APP",
          status: "Active",
          is_read: false,
          activeFrom: "14 Oct 2026",
          activeTo: "22 Oct 2026",
          target_audience: "Dealership Mechanics"
        }
      ],
      total: 2,
      active_count: 2,
      inactive_count: 0,
      unread_count: 2,
      fallback: true
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let dealerId = body.dealer_id || body.dealerId || "";
    let userId = body.user_id || body.userId || "";

    const fastApiUrl = getBackendBaseUrl();

    // 1. Try FastAPI
    try {
      const fastRes = await fetch(`${fastApiUrl}/dealer/notifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, ...(dealerId ? { dealer_id: dealerId } : {}), ...(userId ? { user_id: userId } : {}) }),
      });
      if (fastRes.ok) {
        const data = await fastRes.json();
        return NextResponse.json(data);
      }
    } catch (e) {
      // Fallback
    }

    // 2. Direct PostgreSQL fallback
    const client = await pool.connect();
    try {
      if (!dealerId) {
        const dRes = await client.query('SELECT id FROM "Dealer" ORDER BY "createdAt" ASC LIMIT 1');
        if (dRes.rows.length > 0) dealerId = dRes.rows[0].id;
      }
      if (!userId) {
        const uRes = await client.query('SELECT id FROM "User" ORDER BY "createdAt" ASC LIMIT 1');
        if (uRes.rows.length > 0) userId = uRes.rows[0].id;
      }
      const idRes = await client.query(`
        SELECT id FROM "DealerNotification"
        WHERE id LIKE '#%'
        ORDER BY created_at DESC
        LIMIT 10;
      `);
      let nextNum = 7472;
      for (const r of idRes.rows) {
        const num = parseInt(r.id.replace("#", ""), 10);
        if (!isNaN(num) && num >= nextNum) {
          nextNum = num + 1;
        }
      }
      const newId = `#${nextNum}`;
      const activeFrom = body.active_from ? new Date(body.active_from) : new Date();
      const activeTo = body.active_to ? new Date(body.active_to) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

      await client.query(`
        INSERT INTO "DealerNotification" (
          id, dealer_id, user_id, title, message, category, channel,
          status, is_read, active_from, active_to, target_audience,
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, FALSE, $9, $10, $11,
          NOW(), NOW()
        );
      `, [
        newId,
        dealerId,
        userId,
        body.title,
        body.message || "",
        (body.category || "GENERAL").toUpperCase(),
        (body.channel || "PUSH").toUpperCase(),
        body.status || "Active",
        activeFrom,
        activeTo,
        body.target_audience || "All Farmers"
      ]);

      return NextResponse.json({
        success: true,
        message: "Notification created successfully",
        notification: {
          id: newId,
          title: body.title,
          titleName: body.title,
          message: body.message,
          category: body.category,
          channel: body.channel,
          status: body.status || "Active",
          is_read: false,
          activeFrom: activeFrom.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
          activeTo: activeTo.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
          target_audience: body.target_audience
        }
      });
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error("Notifications POST error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
