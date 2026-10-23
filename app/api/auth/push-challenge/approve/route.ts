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
    const memoryChallenges: Map<string, any> = (global as any)._pushChallengesMap || new Map();
    let challenge: any = memoryChallenges.get(challengeId) || null;

    let client: any = null;
    try {
      client = await pool.connect();
      const result = await client.query(
        `SELECT challenge_id, email, match_number, options, status, expires_at FROM _push_challenges WHERE challenge_id = $1 LIMIT 1`,
        [challengeId]
      );
      if (result.rows.length > 0) {
        challenge = result.rows[0];
      }
    } catch (dbErr) {
      console.warn("[push-challenge/approve] Database connection fallback to memory store");
    }

    if (!challenge) {
      if (client) client.release();
      return NextResponse.json(
        { error: "Challenge not found or expired" },
        { status: 404 }
      );
    }

    const expiresAt = Number(challenge.expires_at);

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
        memoryChallenges.set(challengeId, { ...challenge, status: "EXPIRED" });
      }
      if (client) client.release();
      return NextResponse.json(
        { error: "Challenge has expired. Please initiate a new login request." },
        { status: 400 }
      );
    }

    // Validate matching number
    if (selectedNumber !== challenge.match_number) {
      if (client) {
        try {
          await client.query(
            `UPDATE _push_challenges SET status = 'REJECTED' WHERE challenge_id = $1`,
            [challengeId]
          );
        } catch (_) {}
      }
      if (memoryChallenges.has(challengeId)) {
        memoryChallenges.set(challengeId, { ...challenge, status: "REJECTED" });
      }
      if (client) client.release();
      return NextResponse.json(
        { error: "Incorrect matching number selected. Login request rejected for security." },
        { status: 403 }
      );
    }

    // Look up user details across tables
    const email = challenge.email;
    let userRow: any = null;
    let isFarmer = false;
    let isOwner = false;
    let isDealer = false;
    let isOperator = false;
    let isAgent = false;
    let isAdmin =
      email.toLowerCase() === "sistemas@holatractor.com" ||
      email.toLowerCase() === "admin@holatractor.com" ||
      email.toLowerCase().startsWith("admin@") ||
      email.toLowerCase().startsWith("sistemas@");

    if (client) {
      try {
        const userRes = await client.query(
          `SELECT id, first_name, last_name, email, image FROM "User" WHERE LOWER(email) = LOWER($1) LIMIT 1`,
          [email]
        );
        if (userRes.rows.length > 0) {
          userRow = userRes.rows[0];
          const uid = userRow.id;

          const [fRes, oRes, dRes, opRes, agRes] = await Promise.all([
            client.query(`SELECT id FROM "Farmer" WHERE user_id = $1 LIMIT 1`, [uid]).catch(() => ({ rows: [] })),
            client.query(`SELECT id FROM "Owner" WHERE user_id = $1 LIMIT 1`, [uid]).catch(() => ({ rows: [] })),
            client.query(`SELECT id FROM "Dealer" WHERE user_id = $1 LIMIT 1`, [uid]).catch(() => ({ rows: [] })),
            client.query(`SELECT id FROM "Operator" WHERE user_id = $1 LIMIT 1`, [uid]).catch(() => ({ rows: [] })),
            client.query(`SELECT id FROM "Agent" WHERE user_id = $1 LIMIT 1`, [uid]).catch(() => ({ rows: [] })),
          ]);

          isFarmer = fRes.rows.length > 0;
          isOwner = oRes.rows.length > 0;
          isDealer = dRes.rows.length > 0;
          isOperator = opRes.rows.length > 0;
          isAgent = agRes.rows.length > 0;
        }
      } catch (uErr: any) {
        console.warn("[push-challenge/approve] Role query notice:", uErr?.message);
      }
    }

    // Default fallback if no roles exist in database
    if (!isFarmer && !isOwner && !isDealer && !isOperator && !isAgent && !isAdmin) {
      isFarmer = true;
    }

    const roles: string[] = [];
    if (isAdmin) {
      roles.push("admin");
      roles.push("superAdmin");
    }
    if (isOwner) roles.push("owner");
    if (isFarmer) roles.push("farmer");
    if (isDealer) roles.push("dealer");
    if (isOperator) roles.push("operator");
    if (isAgent) roles.push("agent");

    const userId = userRow?.id || (isAdmin ? "admin_sistemas" : `user_${email.split("@")[0]}`);
    const fullName = `${userRow?.first_name || ""} ${userRow?.last_name || ""}`.trim();
    const name =
      fullName ||
      (isAdmin
        ? "Sistemas HolaTractor"
        : email.split("@")[0].charAt(0).toUpperCase() + email.split("@")[0].slice(1));

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
      isAdmin,
      isSuperAdmin: isAdmin,
      role: roles,
      authType: "MOBILE_PUSH_PASSWORDLESS",
      email_varified: true,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: "7d" });

    if (memoryChallenges.has(challengeId)) {
      memoryChallenges.set(challengeId, {
        ...challenge,
        status: "APPROVED",
        token,
        user_data: tokenPayload,
      });
    }

    // Update challenge as APPROVED in database if client is connected
    if (client) {
      try {
        await client.query(
          `UPDATE _push_challenges SET status = 'APPROVED', token = $1, user_data = $2 WHERE challenge_id = $3`,
          [token, JSON.stringify(tokenPayload), challengeId]
        );
      } catch (_) {}
      client.release();
    }

    return NextResponse.json({
      success: true,
      status: "APPROVED",
      access_token: token,
      token: token,
      user: tokenPayload,
      roles,
      isFarmer,
      isOwner,
      isDealer,
      isOperator,
      isAgent,
      isAdmin,
      isSuperAdmin: isAdmin,
      message: "Mobile biometric verification approved successfully.",
    });
  } catch (error: any) {
    console.error("Approve push challenge error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to approve push challenge" },
      { status: 500 }
    );
  }
}
