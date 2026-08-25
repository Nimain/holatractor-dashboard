import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import axios from "axios";

export const dynamic = "force-dynamic";

const NestJsBaseURL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://holatractor-backend-render.onrender.com/";
const FastApiBaseURL =
  process.env.NEXT_PUBLIC_TRACTOR_AI_URL || "https://tractorai.sinsignal.com/";
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

    const challengeStore = global.__pushChallenges;
    if (!challengeStore || !challengeStore.has(challengeId)) {
      return NextResponse.json(
        { error: "Challenge not found or expired" },
        { status: 404 }
      );
    }

    const challenge = challengeStore.get(challengeId)!;

    if (Date.now() > challenge.expires_at) {
      challenge.status = "EXPIRED";
      return NextResponse.json(
        { error: "Challenge has expired. Please initiate a new login request." },
        { status: 400 }
      );
    }

    // Validate matching number
    if (selectedNumber !== challenge.match_number) {
      challenge.status = "REJECTED";
      return NextResponse.json(
        { error: "Incorrect matching number selected. Login request rejected for security." },
        { status: 403 }
      );
    }

    // Build or query user details
    const email = challenge.email;
    let userPayload: any = null;

    // 1. Try to fetch user from FastAPI endpoints (where first_name/last_name are stored)
    const fastApiEndpoints = [
      `http://localhost:8000/api/v1/auth/user-by-email?email=${encodeURIComponent(email)}`,
      `http://127.0.0.1:8000/api/v1/auth/user-by-email?email=${encodeURIComponent(email)}`,
      `${FastApiBaseURL.replace(/\/$/, "")}/api/v1/auth/user-by-email?email=${encodeURIComponent(email)}`,
    ];

    for (const ep of fastApiEndpoints) {
      try {
        const res = await axios.get(ep, { timeout: 2000 });
        if (res.data?.name || res.data?.id) {
          userPayload = res.data;
          break;
        }
      } catch (e) {}
    }

    // 2. Fallback to NestJS
    if (!userPayload) {
      try {
        const res = await axios.get(`${NestJsBaseURL}user?email=${encodeURIComponent(email)}`, {
          timeout: 3000,
        });
        if (res.data) {
          userPayload = res.data;
        }
      } catch {}
    }

    // Fallback user object
    const userId = userPayload?.userId || userPayload?.id || `user_${email.split("@")[0]}`;
    const userFullName = userPayload?.name || (userPayload?.first_name ? `${userPayload.first_name} ${userPayload.last_name || ""}`.trim() : "");
    const name = userFullName || email.split("@")[0].charAt(0).toUpperCase() + email.split("@")[0].slice(1);
    const isFarmer = userPayload?.isFarmer ?? true;
    const isOwner = userPayload?.isOwner ?? false;
    const isDealer = userPayload?.isDealer ?? false;
    const isOperator = userPayload?.isOperator ?? false;
    const isAgent = userPayload?.isAgent ?? false;

    const tokenPayload = {
      userId,
      id: userId,
      sub: userId,
      email,
      name,
      image: userPayload?.image || "",
      isFarmer,
      isOwner,
      isDealer,
      isOperator,
      isAgent,
      role: isFarmer ? ["farmer"] : ["user"],
      authType: "MOBILE_PUSH_PASSWORDLESS",
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: "7d" });

    // Mark challenge as APPROVED
    challenge.status = "APPROVED";
    challenge.token = token;
    challenge.user = tokenPayload;

    return NextResponse.json({
      success: true,
      status: "APPROVED",
      access_token: token,
      user: tokenPayload,
      message: "Mobile biometric & number verification approved successfully.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to approve push challenge" },
      { status: 500 }
    );
  }
}
