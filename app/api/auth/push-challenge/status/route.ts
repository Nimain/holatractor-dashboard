import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export const dynamic = "force-dynamic";

const FastApiBaseURL =
  process.env.NEXT_PUBLIC_TRACTOR_AI_URL || "https://tractorai.sinsignal.com/";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const challengeId = searchParams.get("id");

    if (!challengeId) {
      return NextResponse.json({ error: "Challenge ID is required" }, { status: 400 });
    }

    const challengeStore = global.__pushChallenges;
    const localChallenge = challengeStore?.get(challengeId);

    // 1. Check local Next.js memory challenge store first
    if (localChallenge && localChallenge.status === "APPROVED") {
      return NextResponse.json({
        status: "APPROVED",
        access_token: localChallenge.token,
        user: localChallenge.user,
      });
    }
    if (localChallenge && localChallenge.status === "REJECTED") {
      return NextResponse.json({ status: "REJECTED" });
    }

    // 2. Query FastAPI status endpoints (local & remote)
    const statusEndpoints = [
      `http://localhost:8000/api/v1/auth/push-challenge/status/${challengeId}`,
      `http://127.0.0.1:8000/api/v1/auth/push-challenge/status/${challengeId}`,
      `${FastApiBaseURL.replace(/\/$/, "")}/api/v1/auth/push-challenge/status/${challengeId}`,
    ];

    for (const url of statusEndpoints) {
      try {
        const res = await axios.get(url, { timeout: 2000 });
        if (res.data?.status === "APPROVED" && res.data?.access_token) {
          if (localChallenge) {
            localChallenge.status = "APPROVED";
            localChallenge.token = res.data.access_token;
            localChallenge.user = res.data.user;
          }
          return NextResponse.json({
            status: "APPROVED",
            access_token: res.data.access_token,
            user: res.data.user,
          });
        }
        if (res.data?.status === "REJECTED") {
          return NextResponse.json({ status: "REJECTED" });
        }
      } catch (err) {}
    }

    // 3. Check expiration
    const now = Date.now();
    if (localChallenge && localChallenge.expires_at < now) {
      localChallenge.status = "EXPIRED";
      return NextResponse.json({ status: "EXPIRED" });
    }

    return NextResponse.json({
      status: "PENDING",
      time_left: localChallenge ? Math.max(0, Math.floor((localChallenge.expires_at - now) / 1000)) : 60,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to check challenge status" },
      { status: 500 }
    );
  }
}
