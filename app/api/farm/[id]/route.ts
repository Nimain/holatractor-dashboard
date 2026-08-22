import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const FastApiBaseURL =
  process.env.NEXT_PUBLIC_TRACTOR_AI_URL || "https://tractorai.sinsignal.com/";
const NestJsBaseURL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://holatractor-backend-render.onrender.com/";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const farmId = params.id;
    const body = await request.json();
    const authHeader =
      request.headers.get("authorization") ||
      `Bearer ${request.cookies.get("access_token")?.value || ""}`;

    const headers = authHeader ? { Authorization: authHeader } : {};

    // 1. Try NestJS /farm/:id
    try {
      const res = await axios.patch(`${NestJsBaseURL}farm/${farmId}`, body, {
        headers,
        timeout: 15000,
      });
      return NextResponse.json(res.data, { status: res.status });
    } catch (nestErr: any) {
      console.warn(`NestJS PATCH /farm/${farmId} error:`, nestErr?.response?.data || nestErr?.message);

      // 2. Try FastAPI /farm/:id
      try {
        const fastRes = await axios.put(
          `${FastApiBaseURL.replace(/\/$/, "")}/farm/${farmId}`,
          body,
          { headers, timeout: 15000 }
        );
        return NextResponse.json(fastRes.data, { status: fastRes.status });
      } catch (fastErr: any) {
        return NextResponse.json(
          {
            message:
              nestErr?.response?.data?.message ||
              fastErr?.response?.data?.detail ||
              "Failed to update farm",
            success: false,
          },
          { status: nestErr?.response?.status || 500 }
        );
      }
    }
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || "Internal server error", success: false },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const farmId = params.id;
    const authHeader =
      request.headers.get("authorization") ||
      `Bearer ${request.cookies.get("access_token")?.value || ""}`;

    const headers = authHeader ? { Authorization: authHeader } : {};

    // 1. Try NestJS /farm/:id
    try {
      const res = await axios.delete(`${NestJsBaseURL}farm/${farmId}`, {
        headers,
        timeout: 15000,
      });
      return NextResponse.json(res.data, { status: res.status });
    } catch (nestErr: any) {
      console.warn(`NestJS DELETE /farm/${farmId} error:`, nestErr?.response?.data || nestErr?.message);

      // 2. Try FastAPI /farm/:id
      try {
        const fastRes = await axios.delete(
          `${FastApiBaseURL.replace(/\/$/, "")}/farm/${farmId}`,
          { headers, timeout: 15000 }
        );
        return NextResponse.json(fastRes.data, { status: fastRes.status });
      } catch (fastErr: any) {
        return NextResponse.json(
          {
            message:
              nestErr?.response?.data?.message ||
              fastErr?.response?.data?.detail ||
              "Failed to delete farm",
            success: false,
          },
          { status: nestErr?.response?.status || 500 }
        );
      }
    }
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || "Internal server error", success: false },
      { status: 500 }
    );
  }
}
