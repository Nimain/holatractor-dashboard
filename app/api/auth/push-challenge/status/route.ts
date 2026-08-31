import { NextRequest, NextResponse } from "next/server";
import pool from "@/utils/Database/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const challengeId = searchParams.get("id");

    if (!challengeId) {
      return NextResponse.json({ error: "Challenge ID is required" }, { status: 400 });
    }

    const now = Date.now();
    const memoryChallenges: Map<string, any> = (global as any)._pushChallengesMap || new Map();
    let row: any = memoryChallenges.get(challengeId) || null;

    let client: any = null;
    try {
      client = await pool.connect();
      const result = await client.query(
        `SELECT challenge_id, status, token, user_data, expires_at FROM _push_challenges WHERE challenge_id = $1 LIMIT 1`,
        [challengeId]
      );
      if (result.rows.length > 0) {
        row = result.rows[0];
      }
    } catch (_) {}

    if (!row) {
      if (client) client.release();
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
    }

    const expiresAt = Number(row.expires_at);

    try {
      if (row.status === "APPROVED" && row.token) {
        let userData = row.user_data;
        if (typeof userData === "string") {
          try {
            userData = JSON.parse(userData);
          } catch {}
        }
        return NextResponse.json({
          status: "APPROVED",
          access_token: row.token,
          user: userData,
          isFarmer: Boolean(userData?.isFarmer),
          isOwner: Boolean(userData?.isOwner),
          isDealer: Boolean(userData?.isDealer),
          isOperator: Boolean(userData?.isOperator),
          isAgent: Boolean(userData?.isAgent),
          isAdmin: Boolean(userData?.isAdmin),
          role: userData?.role || [],
        });
      }

      if (row.status === "REJECTED") {
        return NextResponse.json({ status: "REJECTED" });
      }

      if (now > expiresAt) {
        if (client) {
          try {
            await client.query(
              `UPDATE _push_challenges SET status = 'EXPIRED' WHERE challenge_id = $1`,
              [challengeId]
            );
          } catch (_) {}
        }
        if (memoryChallenges.has(challengeId)) {
          memoryChallenges.set(challengeId, { ...row, status: "EXPIRED" });
        }
        return NextResponse.json({ status: "EXPIRED", time_left: 0 });
      }

      return NextResponse.json({
        status: "PENDING",
        time_left: Math.max(0, Math.floor((expiresAt - now) / 1000)),
      });
    } finally {
      if (client) client.release();
    }
  } catch (error: any) {
    console.error("Check push challenge status error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to check challenge status" },
      { status: 500 }
    );
  }
}
