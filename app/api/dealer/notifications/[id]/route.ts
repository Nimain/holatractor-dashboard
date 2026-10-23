import { getBackendBaseUrl } from "@/utils/api/apiUrl";
import { NextRequest, NextResponse } from "next/server";
import pool from "@/utils/Database/db";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await params;
    const notificationId = decodeURIComponent(rawId);
    const body = await request.json();

    const fastApiUrl = getBackendBaseUrl();

    // 1. Try FastAPI
    try {
      const fastRes = await fetch(`${fastApiUrl}/dealer/notifications/${encodeURIComponent(notificationId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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
      const updates: string[] = [];
      const values: any[] = [];
      let idx = 1;

      if (body.status !== undefined) {
        updates.push(`status = $${idx++}`);
        values.push(body.status);
      }
      if (body.is_read !== undefined) {
        updates.push(`is_read = $${idx++}`);
        values.push(body.is_read);
      }
      if (body.title !== undefined) {
        updates.push(`title = $${idx++}`);
        values.push(body.title);
      }
      if (body.message !== undefined) {
        updates.push(`message = $${idx++}`);
        values.push(body.message);
      }
      if (body.target_audience !== undefined) {
        updates.push(`target_audience = $${idx++}`);
        values.push(body.target_audience);
      }

      if (updates.length === 0) {
        return NextResponse.json({ success: true, message: "No updates provided" });
      }

      updates.push(`updated_at = NOW()`);
      values.push(notificationId);

      const query = `
        UPDATE "DealerNotification"
        SET ${updates.join(", ")}
        WHERE id = $${idx}
      `;

      const res = await client.query(query, values);
      if (res.rowCount === 0) {
        return NextResponse.json({ success: false, error: "Notification not found" }, { status: 404 });
      }

      return NextResponse.json({ success: true, message: `Notification ${notificationId} updated` });
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error("Notification PATCH error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await params;
    const notificationId = decodeURIComponent(rawId);

    const fastApiUrl = getBackendBaseUrl();

    // 1. Try FastAPI
    try {
      const fastRes = await fetch(`${fastApiUrl}/dealer/notifications/${encodeURIComponent(notificationId)}`, {
        method: "DELETE",
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
      const res = await client.query(`DELETE FROM "DealerNotification" WHERE id = $1`, [notificationId]);
      if (res.rowCount === 0) {
        return NextResponse.json({ success: false, error: "Notification not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, message: `Notification ${notificationId} deleted` });
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error("Notification DELETE error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
