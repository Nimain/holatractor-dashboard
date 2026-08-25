import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export const dynamic = "force-dynamic";

const FASTAPI_URLS = [
  "https://tractorai.sinsignal.com",
  "http://127.0.0.1:8000",
  "http://localhost:8000",
];

const NESTJS_URL = process.env.NEXT_PUBLIC_API_URL || "https://holatractor-backend-render.onrender.com";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const authHeader = req.headers.get("authorization") || "";

  // 1. Try FastAPI
  for (const baseUrl of FASTAPI_URLS) {
    try {
      const res = await axios.get(`${baseUrl}/inventory/${id}`, {
        headers: authHeader ? { Authorization: authHeader } : {},
        timeout: 5000,
      });
      if (res.status === 200) {
        return NextResponse.json(res.data);
      }
    } catch (e) {}
  }

  // 2. Try NestJS
  try {
    const res = await axios.get(`${NESTJS_URL}/inventory/${id}`, {
      headers: authHeader ? { Authorization: authHeader } : {},
      timeout: 6000,
    });
    return NextResponse.json(res.data, { status: res.status });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.response?.data?.message || err?.message || "Inventory item not found" },
      { status: err?.response?.status || 404 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const authHeader = req.headers.get("authorization") || "";

  // 1. Try FastAPI
  for (const baseUrl of FASTAPI_URLS) {
    try {
      const res = await axios.delete(`${baseUrl}/inventory/${id}`, {
        headers: authHeader ? { Authorization: authHeader } : {},
        timeout: 5000,
      });
      if (res.status === 200) {
        return NextResponse.json(res.data);
      }
    } catch (e) {}
  }

  // 2. Try NestJS
  try {
    const res = await axios.delete(`${NESTJS_URL}/inventory/${id}`, {
      headers: authHeader ? { Authorization: authHeader } : {},
      timeout: 6000,
    });
    return NextResponse.json(res.data, { status: res.status });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.response?.data?.message || err?.message || "Failed to delete inventory" },
      { status: err?.response?.status || 500 }
    );
  }
}
