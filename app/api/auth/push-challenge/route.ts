import { NextRequest, NextResponse } from "next/server";
import pool from "@/utils/Database/db";
import axios from "axios";

export const dynamic = "force-dynamic";

const FastApiBaseURL =
  process.env.NEXT_PUBLIC_TRACTOR_AI_URL || "https://tractorai.sinsignal.com/";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = body?.email?.trim()?.toLowerCase();
    const deviceInfo = body?.device_info || "Chrome on Desktop";

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email address is required" },
        { status: 400 }
      );
    }

    const challengeId = `push_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const matchNumber = Math.floor(10 + Math.random() * 89); // e.g. 47

    // Generate 2 decoy numbers for the 3-number mobile matching prompt
    const generateDecoy = (original: number): number => {
      let n = Math.floor(10 + Math.random() * 89);
      while (n === original) {
        n = Math.floor(10 + Math.random() * 89);
      }
      return n;
    };

    const decoy1 = generateDecoy(matchNumber);
    let decoy2 = generateDecoy(matchNumber);
    while (decoy2 === decoy1) {
      decoy2 = generateDecoy(matchNumber);
    }

    // Shuffle options
    const options = [matchNumber, decoy1, decoy2].sort(() => Math.random() - 0.5);

    const now = Date.now();
    const expiresInSeconds = 180; // 3 minutes for comfortable mobile interaction
    const expiresAt = now + expiresInSeconds * 1000;

    // Global in-memory fallback store
    if (!(global as any)._pushChallengesMap) {
      (global as any)._pushChallengesMap = new Map();
    }
    (global as any)._pushChallengesMap.set(challengeId, {
      challenge_id: challengeId,
      email,
      match_number: matchNumber,
      options,
      status: "PENDING",
      device_info: deviceInfo,
      created_at: now,
      expires_at: expiresAt,
    });

    // 1. Save challenge to PostgreSQL database (if connected)
    try {
      const client = await pool.connect();
      try {
        await client.query(
          `
          INSERT INTO _push_challenges (
            challenge_id, email, match_number, options, status, device_info, created_at, expires_at
          ) VALUES ($1, $2, $3, $4, 'PENDING', $5, $6, $7)
          ON CONFLICT (challenge_id) DO UPDATE SET
            email = EXCLUDED.email,
            match_number = EXCLUDED.match_number,
            options = EXCLUDED.options,
            status = 'PENDING',
            expires_at = EXCLUDED.expires_at;
        `,
          [challengeId, email, matchNumber, options, deviceInfo, now, expiresAt]
        );
      } finally {
        client.release();
      }
    } catch (dbErr: any) {
      console.warn("[push-challenge] PostgreSQL challenge save notice:", dbErr?.message);
    }

    // 2. Dispatch FCM push notification ONCE to the active FastAPI backend
    let pushDispatched = false;
    const targetEndpoint = `${FastApiBaseURL.replace(/\/$/, "")}/api/v1/auth/push-challenge/create`;

    try {
      const resFast = await axios.post(
        targetEndpoint,
        {
          email,
          challenge_id: challengeId,
          match_number: matchNumber,
          options,
          device_info: deviceInfo,
        },
        { timeout: 4000 }
      );
      if (resFast.data?.success || resFast.data?.challenge_id) {
        pushDispatched = true;
      }
    } catch (remoteErr: any) {
      // Local fallback only if remote primary endpoint failed
      try {
        const resLocal = await axios.post(
          "http://localhost:8000/api/v1/auth/push-challenge/create",
          {
            email,
            challenge_id: challengeId,
            match_number: matchNumber,
            options,
            device_info: deviceInfo,
          },
          { timeout: 2000 }
        );
        if (resLocal.data?.success || resLocal.data?.challenge_id) {
          pushDispatched = true;
        }
      } catch (_) {}
    }

    return NextResponse.json({
      success: true,
      challenge_id: challengeId,
      match_number: matchNumber,
      options,
      expires_in: expiresInSeconds,
      push_dispatched: pushDispatched,
      message: `Sign-in challenge created. Select ${matchNumber} in your HolaTractor mobile app.`,
    });
  } catch (error: any) {
    console.error("Create push challenge error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create push authentication challenge" },
      { status: 500 }
    );
  }
}
