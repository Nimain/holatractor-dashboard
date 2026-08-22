import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const FastApiBaseURL =
  process.env.NEXT_PUBLIC_TRACTOR_AI_URL || "http://127.0.0.1:8000/";
const NestJsBaseURL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://holatractor-backend-render.onrender.com/";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    let token = "";
    const rawAuth = request.headers.get("authorization");
    if (rawAuth) {
      token = rawAuth.replace(/^Bearer\s+/i, "").trim();
    }
    if (!token) {
      token = request.cookies.get("access_token")?.value || "";
    }
    if (!token) {
      const rawCookie = request.headers.get("cookie") || "";
      const match = rawCookie.match(/(?:^|;\s*)access_token=([^;]+)/);
      if (match) token = decodeURIComponent(match[1]);
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // 1. Try FastAPI admin store tractor assignment
    try {
      const base = (FastApiBaseURL || "http://127.0.0.1:8000/").replace(/\/$/, "");
      const fastApiRes = await axios.post(
        `${base}/api/v1/admin/store-tractors`,
        body,
        { headers, timeout: 15000 }
      );
      if (fastApiRes.data?.success) {
        return NextResponse.json(fastApiRes.data, { status: 201 });
      }
    } catch (errFastApi: any) {
      console.warn(
        "FastAPI admin store-tractor error:",
        errFastApi?.response?.status,
        errFastApi?.response?.data || errFastApi?.message
      );
    }

    // 2. Fallback to NestJS backend /store/tractor
    try {
      const nestRes = await axios.post(
        `${NestJsBaseURL}store/tractor`,
        {
          store_id: body.store_id,
          tractor_id: body.base_tractor_id,
          hourly_price: body.hourly_price || 20.0,
        },
        { headers, timeout: 10000 }
      );
      return NextResponse.json(
        {
          success: true,
          message: "Tractor added to store successfully via fallback",
          data: nestRes.data,
        },
        { status: 201 }
      );
    } catch (errNest: any) {
      console.error(
        "NestJS fallback add store tractor error:",
        errNest?.response?.data || errNest?.message
      );
      return NextResponse.json(
        {
          success: false,
          message:
            errNest?.response?.data?.message ||
            errNest?.message ||
            "Failed to add tractor to store",
        },
        { status: errNest?.response?.status || 500 }
      );
    }
  } catch (err: any) {
    console.error("Internal server error in POST /api/admin/store-tractors:", err);
    return NextResponse.json(
      { success: false, message: err?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
