import { NextRequest, NextResponse } from "next/server";
import pool from "@/utils/Database/db";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const campaignId = params.id;
    const body = await request.json();
    const { status, name, budget, spend, target_audience, description } = body;

    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (status) {
      updates.push(`status = $${idx++}`);
      values.push(status.toUpperCase());
    }
    if (name) {
      updates.push(`name = $${idx++}`);
      values.push(name);
    }
    if (budget !== undefined) {
      updates.push(`budget = $${idx++}`);
      values.push(parseFloat(budget));
    }
    if (spend !== undefined) {
      updates.push(`spend = $${idx++}`);
      values.push(parseFloat(spend));
    }
    if (target_audience) {
      updates.push(`target_audience = $${idx++}`);
      values.push(target_audience);
    }
    if (description !== undefined) {
      updates.push(`description = $${idx++}`);
      values.push(description);
    }

    if (updates.length === 0) {
      return NextResponse.json({ success: true, message: "No updates requested" });
    }

    updates.push(`updated_at = NOW()`);
    values.push(campaignId);

    const client = await pool.connect();
    try {
      const sql = `UPDATE "DealerMarketingCampaign" SET ${updates.join(", ")} WHERE id = $${idx} RETURNING id;`;
      const res = await client.query(sql, values);
      if (res.rowCount === 0) {
        return NextResponse.json({ success: false, error: "Campaign not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, message: "Campaign updated successfully" });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("PATCH campaign error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const campaignId = params.id;
    const client = await pool.connect();
    try {
      const res = await client.query('DELETE FROM "DealerMarketingCampaign" WHERE id = $1 RETURNING id;', [campaignId]);
      if (res.rowCount === 0) {
        return NextResponse.json({ success: false, error: "Campaign not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, message: "Campaign deleted successfully" });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("DELETE campaign error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
