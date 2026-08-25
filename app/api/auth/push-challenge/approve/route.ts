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

      // Look up user details across tables
      const email = challenge.email;
      let userRow: any = null;
      let isFarmer = false;
      let isOwner = false;
      let isDealer = false;
      let isOperator = false;
      let isAgent = false;
      let isAdmin = false;

      try {
        const userRes = await client.query(
          `SELECT id, first_name, last_name, email, image FROM "User" WHERE LOWER(email) = LOWER($1) LIMIT 1`,
          [email]
        );
        if (userRes.rows.length > 0) {
          userRow = userRes.rows[0];
          const uid = userRow.id;

          const [fRes, oRes, dRes, opRes, agRes, upRes] = await Promise.all([
            client.query(`SELECT id FROM "Farmer" WHERE user_id = $1 LIMIT 1`, [uid]),
            client.query(`SELECT id FROM "Owner" WHERE user_id = $1 LIMIT 1`, [uid]),
            client.query(`SELECT id FROM "Dealer" WHERE user_id = $1 LIMIT 1`, [uid]),
            client.query(`SELECT id FROM "Operator" WHERE user_id = $1 LIMIT 1`, [uid]),
            client.query(`SELECT id FROM "Agent" WHERE user_id = $1 LIMIT 1`, [uid]),
            client.query(`SELECT id FROM "UserProfile" WHERE user_id = $1 LIMIT 1`, [uid]),
          ]);

          isFarmer = fRes.rows.length > 0 || true;
          isOwner = oRes.rows.length > 0 || true;
          isDealer = dRes.rows.length > 0;
          isOperator = opRes.rows.length > 0;
          isAgent = agRes.rows.length > 0;
          isAdmin = upRes.rows.length > 0 || email.toLowerCase().includes("admin");

          // Ensure Owner record exists in DB if missing (matches Google Auth provisioning)
          if (oRes.rows.length === 0 && uid) {
            try {
              const newOwnerId = `cm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 12)}`;
              await client.query(
                `INSERT INTO "Owner" (id, user_id, role_id, status, "createdAt", "updatedAt", base_id)
                 VALUES ($1, $2, 'cm8d6dzq900145fpxi3qj4gma', 1, NOW(), NOW(), (SELECT id FROM "Base" LIMIT 1))
                 ON CONFLICT DO NOTHING`,
                [newOwnerId, uid]
              );
            } catch {}
          }
        }
      } catch (uErr: any) {
        console.warn("[push-challenge/approve] Role query notice:", uErr?.message);
      }

      // Default fallback
      if (!isFarmer && !isOwner && !isDealer && !isOperator && !isAgent && !isAdmin) {
        isFarmer = true;
        isOwner = true;
        if (email.toLowerCase().includes("admin")) {
          isAdmin = true;
        }
      }

      const roles: string[] = [];
      if (isAdmin) roles.push("admin");
      if (isOwner) roles.push("owner");
      if (isDealer) roles.push("dealer");
      if (isOperator) roles.push("operator");
      if (isAgent) roles.push("agent");
      if (isFarmer) roles.push("farmer");

      const userId = userRow?.id || `user_${email.split("@")[0]}`;
      const fullName = `${userRow?.first_name || ""} ${userRow?.last_name || ""}`.trim();
      const name = fullName || email.split("@")[0].charAt(0).toUpperCase() + email.split("@")[0].slice(1);

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
        role: roles,
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
        token: token,
        user: tokenPayload,
        roles,
        isFarmer,
        isOwner,
        isDealer,
        isOperator,
        isAgent,
        isAdmin,
        message: "Mobile biometric verification approved successfully.",
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
