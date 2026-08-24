import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export const dynamic = "force-dynamic";

const FastApiBaseURL =
  process.env.NEXT_PUBLIC_TRACTOR_AI_URL || "https://tractorai.sinsignal.com/";
const NestJsBaseURL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://holatractor-backend-render.onrender.com/";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const authHeader =
      request.headers.get("authorization") ||
      `Bearer ${request.cookies.get("access_token")?.value || ""}`;

    const headers = authHeader ? { Authorization: authHeader } : {};

    // 1. Try FastAPI localhost /api/v1/admin/devices
    try {
      const fastApiRes = await axios.post(
        `${FastApiBaseURL.replace(/\/$/, "")}/api/v1/admin/devices`,
        body,
        { headers, timeout: 20000 }
      );
      if (fastApiRes.status === 200 || fastApiRes.status === 201) {
        return NextResponse.json(fastApiRes.data, { status: fastApiRes.status });
      }
    } catch (err: any) {
      console.warn("FastAPI POST device error:", err?.response?.data || err?.message);
      if (err.response?.data) {
        return NextResponse.json(
          err.response.data,
          { status: err.response.status || 400 }
        );
      }
    }

    // 2. Fallback: NestJS /store/addDevicetoTractor
    try {
      const res = await axios.post(
        `${NestJsBaseURL}store/addDevicetoTractor`,
        {
          device_id: body.device_imei,
          tractor_store_id: body.tractor_id,
          device_region: body.device_region || "SW",
        },
        { headers, timeout: 15000 }
      );
      return NextResponse.json(res.data, { status: res.status });
    } catch (err: any) {
      console.error("NestJS POST device error:", err?.response?.data || err?.message);
      return NextResponse.json(
        {
          message:
            err?.response?.data?.message ||
            err?.message ||
            "Failed to assign device",
          success: false,
        },
        { status: err?.response?.status || 500 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || "Internal server error", success: false },
      { status: 500 }
    );
  }
}
