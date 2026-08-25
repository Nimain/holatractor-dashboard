import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import jwt from "jsonwebtoken";

const FastApiBaseURL =
  process.env.NEXT_PUBLIC_TRACTOR_AI_URL || "https://tractorai.sinsignal.com/";
const NestJsBaseURL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://holatractor-backend-render.onrender.com/";

// In-memory challenge store (shared across serverless runtime in dev/node instances)
declare global {
  var __pushChallenges: Map<
    string,
    {
      challenge_id: string;
      email: string;
      match_number: number;
      options: number[];
      status: "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";
      token?: string;
      user?: any;
      device_info: string;
      created_at: number;
      expires_at: number;
    }
  > | undefined;
}

if (!global.__pushChallenges) {
  global.__pushChallenges = new Map();
}

const challengeStore = global.__pushChallenges;

// Helper to clean expired challenges
const cleanupExpired = () => {
  const now = Date.now();
  for (const [id, c] of challengeStore.entries()) {
    if (c.expires_at < now) {
      challengeStore.delete(id);
    }
  }
};

export async function POST(request: NextRequest) {
  try {
    cleanupExpired();
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
    const expiresInSeconds = 120;
    const expiresAt = now + expiresInSeconds * 1000;

    // 1. Attempt to dispatch push notification via backend
    let pushDispatched = false;
    try {
      const fastApiUrl = `${FastApiBaseURL.replace(/\/$/, "")}/api/v1/auth/push-challenge/create`;
      const resFast = await axios.post(
        fastApiUrl,
        {
          email,
          challenge_id: challengeId,
          match_number: matchNumber,
          options,
          device_info: deviceInfo,
        },
        { timeout: 4000 }
      );
      if (resFast.data) {
        pushDispatched = true;
      }
    } catch (e) {
      // Graceful fallback to local push management
    }

    // Save challenge record
    challengeStore.set(challengeId, {
      challenge_id: challengeId,
      email,
      match_number: matchNumber,
      options,
      status: "PENDING",
      device_info: deviceInfo,
      created_at: now,
      expires_at: expiresAt,
    });

    return NextResponse.json({
      success: true,
      challenge_id: challengeId,
      match_number: matchNumber,
      options, // available for mobile/simulator
      expires_in: expiresInSeconds,
      push_dispatched: pushDispatched,
      message: `Sign-in challenge created. Select ${matchNumber} in your HolaTractor mobile app.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to create push authentication challenge" },
      { status: 500 }
    );
  }
}
