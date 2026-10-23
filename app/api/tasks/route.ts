import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import pool from "@/utils/Database/db";
import { getFastApiAuthHeaders } from "@/utils/auth/serverAuth";

export const dynamic = "force-dynamic";

const FASTAPI_CANDIDATES = Array.from(
  new Set(
    [
      (process.env.NEXT_PUBLIC_TRACTOR_AI_URL || "").replace(/\/$/, ""),
      (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, ""),
      "https://tractorai.sinsignal.com",
    ].filter((url) => Boolean(url) && !url.includes("localhost") && !url.includes("127.0.0.1"))
  )
);

async function getTasksFromDB(ownerId?: string | null, statusFilter?: string | null) {
  const client = await pool.connect();
  try {
    const params: any[] = [];
    let whereClauses = "WHERE 1=1";

    if (ownerId && ownerId !== "all" && ownerId !== "default_owner") {
      params.push(ownerId);
      whereClauses += ` AND (
        t.owner_id = $${params.length} 
        OR t.owner_id IN (SELECT user_id FROM "Owner" WHERE id = $${params.length}) 
        OR t.owner_id IN (SELECT id FROM "Owner" WHERE user_id = $${params.length})
      )`;
    }

    if (statusFilter && statusFilter !== "ALL") {
      params.push(statusFilter.toUpperCase());
      whereClauses += ` AND UPPER(t.status) = $${params.length}`;
    }

    const sql = `
      SELECT 
        t.id,
        t.owner_id,
        t.task_name,
        t.operation_type,
        t.farm_name,
        t.client_name,
        t.total_acres::float as total_acres,
        t.completed_acres::float as completed_acres,
        t.price_per_acre::float as price_per_acre,
        t.est_fuel_liters::float as est_fuel_liters,
        t.status,
        t.start_time,
        t.end_time,
        t.created_at,
        COALESCE(
          json_agg(
            json_build_object(
              'id', a.id,
              'task_id', a.task_id,
              'tractor_id', a.tractor_id,
              'tractor_name', a.tractor_name,
              'device_imei', a.device_imei,
              'operator_id', a.operator_id,
              'operator_name', a.operator_name,
              'operator_phone', a.operator_phone,
              'acres_covered', a.acres_covered::float,
              'engine_hours', a.engine_hours::float,
              'fuel_liters', a.fuel_liters::float,
              'status', a.status
            )
          ) FILTER (WHERE a.id IS NOT NULL),
          '[]'
        ) as assignments
      FROM farm_tasks t
      LEFT JOIN task_assignments a ON a.task_id = t.id
      ${whereClauses}
      GROUP BY t.id
      ORDER BY t.created_at DESC
    `;

    const res = await client.query(sql, params);
    return res.rows;
  } finally {
    client.release();
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ownerId = searchParams.get("owner_id") || searchParams.get("user_id");
    const status = searchParams.get("status") || searchParams.get("status_filter");

    // 1. Fetch from Render PostgreSQL Database
    let tasks: any[] = [];
    try {
      tasks = await getTasksFromDB(ownerId, status);
    } catch (dbErr: any) {
      console.warn("[/api/tasks] DB fetch warning:", dbErr?.message);
    }

    // 2. If DB returned results, return them
    if (Array.isArray(tasks) && tasks.length > 0) {
      return NextResponse.json({
        success: true,
        data: tasks,
        count: tasks.length,
      });
    }

    // 3. Fallback: Try FastAPI candidates
    const headers = getFastApiAuthHeaders(request);
    const q = ownerId ? `?owner_id=${encodeURIComponent(ownerId)}` : "";
    for (const base of FASTAPI_CANDIDATES) {
      try {
        const res = await axios.get(`${base}/tasks/owner${q}`, { headers, timeout: 3500 });
        const fastData = res?.data?.data || res?.data;
        if (Array.isArray(fastData) && fastData.length > 0) {
          return NextResponse.json({
            success: true,
            data: fastData,
            count: fastData.length,
          });
        }
      } catch {}
    }

    // 4. Return whatever DB had (even if empty)
    return NextResponse.json({
      success: true,
      data: tasks || [],
      count: tasks ? tasks.length : 0,
    });
  } catch (err: any) {
    console.error("[/api/tasks] GET error:", err);
    return NextResponse.json({ success: false, data: [], error: err?.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      task_name,
      operation_type = "PLOWING",
      farm_name = "Parcela Principal",
      client_name = "Cliente Principal",
      total_acres = 1.0,
      price_per_acre = 65.0,
      est_fuel_liters,
      assignments = [],
      owner_id = "default_owner",
    } = body;

    const taskId = `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const estFuel = est_fuel_liters || Math.round(Number(total_acres) * 3.8);

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      await client.query(
        `INSERT INTO farm_tasks 
         (id, owner_id, task_name, operation_type, farm_name, client_name, total_acres, completed_acres, price_per_acre, est_fuel_liters, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 0.0, $8, $9, 'IN_PROGRESS', NOW())`,
        [
          taskId,
          owner_id,
          task_name,
          operation_type.toUpperCase(),
          farm_name,
          client_name,
          Number(total_acres),
          Number(price_per_acre),
          Number(estFuel),
        ]
      );

      for (const a of assignments) {
        const asgnId = `asgn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        await client.query(
          `INSERT INTO task_assignments 
           (id, task_id, tractor_id, tractor_name, device_imei, operator_id, operator_name, operator_phone, acres_covered, engine_hours, fuel_liters, status, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0.0, 0.0, 0.0, 'ACTIVE', NOW())`,
          [
            asgnId,
            taskId,
            a.tractor_id || null,
            a.tractor_name || "Tractor",
            a.device_imei || null,
            a.operator_id || null,
            a.operator_name || "Conductor",
            a.operator_phone || null,
          ]
        );
      }

      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }

    // Attempt FastAPI sync in background (non-blocking)
    const headers = getFastApiAuthHeaders(request);
    for (const base of FASTAPI_CANDIDATES) {
      axios.post(`${base}/tasks/create`, { ...body, owner_id }, { headers, timeout: 3000 }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      message: "Task dispatched successfully.",
      data: {
        task_id: taskId,
        status: "IN_PROGRESS",
        total_acres,
        machines_assigned: assignments.length,
      },
    });
  } catch (err: any) {
    console.error("[/api/tasks] POST error:", err);
    return NextResponse.json({ success: false, message: err?.message || "Failed to create task" }, { status: 500 });
  }
}
