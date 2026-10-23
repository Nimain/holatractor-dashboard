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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await params;
    const taskId = resolvedParams.id;
    const body = await request.json();
    const status = (body.status || "IN_PROGRESS").toUpperCase();

    const client = await pool.connect();
    try {
      if (status === "COMPLETED") {
        await client.query(
          "UPDATE farm_tasks SET status = $1, completed_acres = total_acres, end_time = NOW() WHERE id = $2",
          [status, taskId]
        );
      } else {
        await client.query("UPDATE farm_tasks SET status = $1 WHERE id = $2", [status, taskId]);
      }
    } finally {
      client.release();
    }

    const headers = getFastApiAuthHeaders(request);
    for (const base of FASTAPI_CANDIDATES) {
      axios.patch(`${base}/tasks/${taskId}/status`, { status }, { headers, timeout: 3000 }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      message: `Task status updated to ${status}`,
      data: { status },
    });
  } catch (err: any) {
    console.error("[/api/tasks/[id]/status] PATCH error:", err);
    return NextResponse.json({ success: false, message: err?.message }, { status: 500 });
  }
}
