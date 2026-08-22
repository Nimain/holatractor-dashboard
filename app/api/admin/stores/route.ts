import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const FastApiBaseURL =
  process.env.NEXT_PUBLIC_TRACTOR_AI_URL || "https://tractorai.sinsignal.com/";
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

    // 1. Try FastAPI admin store creation
    try {
      const base = (FastApiBaseURL || "https://tractorai.sinsignal.com/").replace(/\/$/, "");
      const fastApiRes = await axios.post(
        `${base}/api/v1/admin/stores`,
        body,
        { headers, timeout: 15000 }
      );
      if (fastApiRes.data?.success) {
        return NextResponse.json(fastApiRes.data, { status: 201 });
      }
    } catch (errFastApi: any) {
      console.warn(
        "FastAPI admin store create error:",
        errFastApi?.response?.status,
        errFastApi?.response?.data || errFastApi?.message
      );
    }

    // 2. Fallback to NestJS backend /store
    try {
      const nestRes = await axios.post(
        `${NestJsBaseURL}store`,
        {
          name: body.name,
          description: body.description || "Hola Store Unit",
          image: body.image || "https://images.unsplash.com/photo-1592928302636-c83cf1e1c887?w=600&q=80",
          owner_user_id: body.owner_id,
        },
        { headers, timeout: 10000 }
      );
      return NextResponse.json(
        {
          success: true,
          message: "Store created successfully via fallback",
          data: nestRes.data,
        },
        { status: 201 }
      );
    } catch (errNest: any) {
      console.error(
        "NestJS fallback create store error:",
        errNest?.response?.data || errNest?.message
      );
      return NextResponse.json(
        {
          success: false,
          message:
            errNest?.response?.data?.message ||
            errNest?.message ||
            "Failed to create store",
        },
        { status: errNest?.response?.status || 500 }
      );
    }
  } catch (err: any) {
    console.error("Internal server error in POST /api/admin/stores:", err);
    return NextResponse.json(
      { success: false, message: err?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
