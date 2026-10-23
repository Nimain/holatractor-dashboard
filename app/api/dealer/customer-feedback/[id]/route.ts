import { NextRequest, NextResponse } from "next/server";
import pool from "@/utils/Database/db";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const feedbackId = params.id;
    const body = await request.json();
    const { status, sentiment, title, comment } = body;

    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (status) {
      updates.push(`status = $${idx++}`);
      values.push(status.toUpperCase());
    }
    if (sentiment) {
      updates.push(`sentiment = $${idx++}`);
      values.push(sentiment.toUpperCase());
    }
    if (title) {
      updates.push(`title = $${idx++}`);
      values.push(title);
    }
    if (comment) {
      updates.push(`comment = $${idx++}`);
      values.push(comment);
    }

    if (updates.length === 0) {
      return NextResponse.json({ success: true, message: "No updates requested" });
    }

    updates.push(`updated_at = NOW()`);
    values.push(feedbackId);

    const client = await pool.connect();
    try {
      const sql = `UPDATE "DealerCustomerFeedback" SET ${updates.join(", ")} WHERE id = $${idx} RETURNING id;`;
      const res = await client.query(sql, values);
      if (res.rowCount === 0) {
        return NextResponse.json({ success: false, error: "Feedback not found" }, { status: 404 });
      }

      return NextResponse.json({ success: true, message: "Feedback updated successfully" });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("PATCH feedback error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const feedbackId = params.id;
    const client = await pool.connect();
    try {
      const res = await client.query('DELETE FROM "DealerCustomerFeedback" WHERE id = $1 RETURNING id;', [feedbackId]);
      if (res.rowCount === 0) {
        return NextResponse.json({ success: false, error: "Feedback not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, message: "Feedback deleted successfully" });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("DELETE feedback error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
