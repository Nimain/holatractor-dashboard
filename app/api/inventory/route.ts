import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export const dynamic = "force-dynamic";

const FASTAPI_URLS = [
  "https://tractorai.sinsignal.com",
  "http://127.0.0.1:8000",
  "http://localhost:8000",
];

const NESTJS_URL = process.env.NEXT_PUBLIC_API_URL || "https://holatractor-backend-render.onrender.com";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization") || "";

  // 1. Try FastAPI endpoints first
  for (const baseUrl of FASTAPI_URLS) {
    try {
      const res = await axios.get(`${baseUrl}/inventory`, {
        headers: authHeader ? { Authorization: authHeader } : {},
        timeout: 5000,
      });
      if (res.status === 200 && Array.isArray(res.data)) {
        return NextResponse.json(res.data);
      }
    } catch (e: any) {
      // Continue to next candidate
    }
  }

  // 2. Fallback to NestJS
  try {
    const res = await axios.get(`${NESTJS_URL}/inventory`, {
      headers: authHeader ? { Authorization: authHeader } : {},
      timeout: 6000,
    });
    return NextResponse.json(res.data, { status: res.status });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.response?.data?.message || err?.message || "Failed to fetch inventory" },
      { status: err?.response?.status || 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const authHeader = req.headers.get("authorization") || "";

    // 1. Try FastAPI endpoints
    for (const baseUrl of FASTAPI_URLS) {
      try {
        const res = await axios.post(`${baseUrl}/inventory`, body, {
          headers: authHeader ? { Authorization: authHeader } : {},
          timeout: 8000,
        });
        if (res.status === 201 || res.status === 200) {
          return NextResponse.json(res.data, { status: 201 });
        }
      } catch (e: any) {
        if (e.response && (e.response.status === 400 || e.response.status === 422)) {
          return NextResponse.json(e.response.data, { status: e.response.status });
        }
      }
    }

    // 2. Try NestJS fallback
    try {
      const res = await axios.post(`${NESTJS_URL}/inventory`, body, {
        headers: authHeader ? { Authorization: authHeader } : {},
        timeout: 8000,
      });
      return NextResponse.json(res.data, { status: res.status });
    } catch (nestErr: any) {
      return NextResponse.json(
        { error: nestErr?.response?.data?.message || nestErr?.message || "Failed to create inventory" },
        { status: nestErr?.response?.status || 500 }
      );
    }
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Invalid inventory payload" },
      { status: 400 }
    );
  }
}
