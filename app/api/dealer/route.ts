import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const FastApiBaseURL =
  process.env.NEXT_PUBLIC_TRACTOR_AI_URL || "https://tractorai.sinsignal.com/";
const NestJsBaseURL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://holatractor-backend-render.onrender.com/";

export async function GET(request: NextRequest) {
  try {
    const authHeader =
      request.headers.get("authorization") ||
      `Bearer ${request.cookies.get("access_token")?.value || ""}`;

    const headers = authHeader ? { Authorization: authHeader } : {};

    // 1. Try FastAPI localhost for instant live updates (10 dynamic dealers)
    try {
      const fastApiRes = await axios.get(
        `${FastApiBaseURL.replace(/\/$/, "")}/api/v1/admin/dealers`,
        { headers, timeout: 5000 }
      );
      if (Array.isArray(fastApiRes.data) && fastApiRes.data.length > 0) {
        return NextResponse.json(fastApiRes.data);
      }
    } catch {}

    // 2. Try online NestJS /dealer
    try {
      const backendRes = await axios.get(`${NestJsBaseURL}dealer`, {
        headers,
        timeout: 5000,
      });
      if (Array.isArray(backendRes.data) && backendRes.data.length > 0) {
        return NextResponse.json(backendRes.data);
      }
    } catch {}

    return NextResponse.json([]);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to fetch dealers" },
      { status: 500 }
    );
  }
}
