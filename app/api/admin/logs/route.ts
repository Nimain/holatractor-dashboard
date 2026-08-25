import { NextRequest, NextResponse } from "next/server";
import pool from "@/utils/Database/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(100, Math.max(5, parseInt(searchParams.get("pageSize") || "20", 10)));
    const offset = (page - 1) * pageSize;
    const query = searchParams.get("q")?.trim() || "";
    const category = searchParams.get("category")?.trim() || "all";
    const actionFilter = searchParams.get("action")?.trim() || "";

    const client = await pool.connect();
    try {
      const conditions: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      // 1. Text search
      if (query) {
        conditions.push(`(
          l.action ILIKE $${paramIndex} OR 
          l.email ILIKE $${paramIndex} OR 
          l.details ILIKE $${paramIndex} OR 
          l."userId" ILIKE $${paramIndex}
        )`);
        values.push(`%${query}%`);
        paramIndex++;
      }

      // 2. Specific Action Filter
      if (actionFilter) {
        conditions.push(`l.action = $${paramIndex}`);
        values.push(actionFilter);
        paramIndex++;
      }

      // 3. Category Filter
      if (category && category !== "all") {
        if (category === "auth") {
          conditions.push(`(l.action ILIKE '%login%' OR l.action ILIKE '%auth%' OR l.action ILIKE '%token%' OR l.action ILIKE '%verification%')`);
        } else if (category === "booking") {
          conditions.push(`(l.action ILIKE '%booking%')`);
        } else if (category === "machinery") {
          conditions.push(`(l.action ILIKE '%tractor%' OR l.action ILIKE '%attachment%' OR l.action ILIKE '%store%' OR l.action ILIKE '%inventory%')`);
        } else if (category === "operator") {
          conditions.push(`(l.action ILIKE '%operator%' OR l.action ILIKE '%job%')`);
        } else if (category === "admin") {
          conditions.push(`(l.action ILIKE '%admin%' OR l.action ILIKE '%role%' OR l.action ILIKE '%city%' OR l.action ILIKE '%country%')`);
        }
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

      // Query total count matching filter
      const countSql = `SELECT count(*)::int as total FROM "Log" l ${whereClause}`;
      const countRes = await client.query(countSql, values);
      const total = countRes.rows[0]?.total || 0;

      // Query paginated log entries
      const logsSql = `
        SELECT 
          l.id,
          l.action,
          l.email,
          l."userId" as user_id,
          l.details,
          l."createdAt" as created_at,
          (SELECT json_build_object(
            'id', u.id,
            'first_name', u.first_name,
            'last_name', u.last_name,
            'image', u.image
          ) FROM "User" u WHERE u.id = l."userId" OR u.email = l.email LIMIT 1) as user_profile
        FROM "Log" l
        ${whereClause}
        ORDER BY l."createdAt" DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      const logsRes = await client.query(logsSql, [...values, pageSize, offset]);

      // Query fast overview KPI statistics
      const statsRes = await client.query(`
        SELECT 
          (SELECT count(*)::int FROM "Log") as total_logs,
          (SELECT count(*)::int FROM "Log" WHERE action ILIKE '%login%' OR action ILIKE '%auth%' OR action ILIKE '%token%') as auth_logs,
          (SELECT count(*)::int FROM "Log" WHERE action ILIKE '%booking%') as booking_logs,
          (SELECT count(DISTINCT email)::int FROM "Log" WHERE email IS NOT NULL AND email != '') as unique_users
      `);
      const stats = statsRes.rows[0] || {
        total_logs: total,
        auth_logs: 0,
        booking_logs: 0,
        unique_users: 0,
      };

      return NextResponse.json({
        success: true,
        data: logsRes.rows,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize) || 1,
        },
        stats: {
          totalLogs: stats.total_logs,
          authLogs: stats.auth_logs,
          bookingLogs: stats.booking_logs,
          uniqueUsers: stats.unique_users,
        },
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("[GET /api/admin/logs] Error:", error?.message);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch audit logs" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/logs - Delete single log entry
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Log ID is required" }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      await client.query(`DELETE FROM "Log" WHERE id = $1`, [id]);
      return NextResponse.json({ success: true, message: "Log entry deleted" });
    } finally {
      client.release();
    }
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal error" }, { status: 500 });
  }
}
