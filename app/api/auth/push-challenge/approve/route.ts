import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import pool from "@/utils/Database/db";

export const dynamic = "force-dynamic";

const JWT_SECRET = process.env.JWT_SECRET || "holatractor_secure_jwt_secret_2026";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const challengeId = body?.challenge_id;
    const selectedNumber = Number(body?.selected_number);

    if (!challengeId) {
      return NextResponse.json(
        { error: "challenge_id is required" },
        { status: 400 }
      );
    }

    const now = Date.now();
    const client = await pool.connect();

    try {
      const result = await client.query(
        `SELECT challenge_id, email, match_number, options, status, expires_at FROM _push_challenges WHERE challenge_id = $1 LIMIT 1`,
        [challengeId]
      );

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: "Challenge not found or expired" },
          { status: 404 }
        );
      }

      const challenge = result.rows[0];
      const expiresAt = Number(challenge.expires_at);

      if (now > expiresAt) {
        await client.query(
          `UPDATE _push_challenges SET status = 'EXPIRED' WHERE challenge_id = $1`,
          [challengeId]
        );
        return NextResponse.json(
          { error: "Challenge has expired. Please initiate a new login request." },
          { status: 400 }
        );
      }

      // Validate matching number
      if (selectedNumber !== challenge.match_number) {
        await client.query(
          `UPDATE _push_challenges SET status = 'REJECTED' WHERE challenge_id = $1`,
          [challengeId]
        );
        return NextResponse.json(
          { error: "Incorrect matching number selected. Login request rejected for security." },
          { status: 403 }
        );
      }

      // Build or query user details from PostgreSQL User table
      const email = challenge.email;
      let userRow: any = null;

      try {
        const userRes = await client.query(
          `SELECT id, name, "isFarmer", "isOwner", "isDealer", "isOperator", "isAgent", image FROM "User" WHERE LOWER(email) = LOWER($1) LIMIT 1`,
          [email]
        );
        if (userRes.rows.length > 0) {
          userRow = userRes.rows[0];
        }
      } catch (uErr: any) {
        console.warn("[push-challenge/approve] User DB query notice:", uErr?.message);
      }

      const userId = userRow?.id || `user_${email.split("@")[0]}`;
      const name = userRow?.name || email.split("@")[0].charAt(0).toUpperCase() + email.split("@")[0].slice(1);
      const isFarmer = userRow?.isFarmer ?? true;
      const isOwner = userRow?.isOwner ?? false;
      const isDealer = userRow?.isDealer ?? false;
      const isOperator = userRow?.isOperator ?? false;
      const isAgent = userRow?.isAgent ?? false;

      const tokenPayload = {
        userId,
        id: userId,
        sub: userId,
        email,
        name,
        image: userRow?.image || "",
        isFarmer,
        isOwner,
        isDealer,
        isOperator,
        isAgent,
        role: isFarmer ? ["farmer"] : ["user"],
        authType: "MOBILE_PUSH_PASSWORDLESS",
      };

      const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: "7d" });

      // Update challenge as APPROVED in database
      await client.query(
        `UPDATE _push_challenges SET status = 'APPROVED', token = $1, user_data = $2 WHERE challenge_id = $3`,
        [token, JSON.stringify(tokenPayload), challengeId]
      );

      return NextResponse.json({
        success: true,
        status: "APPROVED",
        access_token: token,
        user: tokenPayload,
        message: "Mobile biometric & number verification approved successfully.",
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("Approve push challenge error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to approve push challenge" },
      { status: 500 }
    );
  }
}
