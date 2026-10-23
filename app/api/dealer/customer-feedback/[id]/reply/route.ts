import { NextRequest, NextResponse } from "next/server";
import pool from "@/utils/Database/db";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const feedbackId = params.id;
    const body = await request.json();
    const { reply } = body;

    if (!reply || !reply.trim()) {
      return NextResponse.json(
        { success: false, error: "Reply message cannot be empty" },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      const updateSql = `
        UPDATE "DealerCustomerFeedback"
        SET dealer_reply = $1,
            dealer_replied_at = NOW(),
            updated_at = NOW()
        WHERE id = $2
        RETURNING dealer_reply, dealer_replied_at;
      `;
      const res = await client.query(updateSql, [reply.trim(), feedbackId]);
      if (res.rowCount === 0) {
        return NextResponse.json(
          { success: false, error: "Customer feedback not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Dealer reply posted successfully",
        dealer_reply: res.rows[0].dealer_reply,
        dealer_replied_at: res.rows[0].dealer_replied_at,
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("POST reply error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to post dealer reply" },
      { status: 500 }
    );
  }
}
