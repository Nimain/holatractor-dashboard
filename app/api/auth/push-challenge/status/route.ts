import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const challengeId = searchParams.get("id");

    if (!challengeId) {
      return NextResponse.json({ error: "Challenge ID is required" }, { status: 400 });
    }

    const challengeStore = global.__pushChallenges;
    if (!challengeStore || !challengeStore.has(challengeId)) {
      return NextResponse.json(
        { status: "EXPIRED", error: "Challenge expired or not found" },
        { status: 404 }
      );
    }

    const challenge = challengeStore.get(challengeId)!;
    const now = Date.now();

    if (challenge.expires_at < now) {
      challenge.status = "EXPIRED";
      return NextResponse.json({ status: "EXPIRED" });
    }

    if (challenge.status === "APPROVED") {
      return NextResponse.json({
        status: "APPROVED",
        access_token: challenge.token,
        user: challenge.user,
      });
    }

    if (challenge.status === "REJECTED") {
      return NextResponse.json({ status: "REJECTED" });
    }

    return NextResponse.json({
      status: "PENDING",
      time_left: Math.max(0, Math.floor((challenge.expires_at - now) / 1000)),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to check challenge status" },
      { status: 500 }
    );
  }
}
