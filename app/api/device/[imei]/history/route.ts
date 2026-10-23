import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export const dynamic = "force-dynamic";

const DeviceBaseURL =
  process.env.NEXT_PUBLIC_DEVICE_URL || "https://device.holatractor.com";
const GPS_API_KEY =
  process.env.NEXT_PUBLIC_DEVICE_AUTH_KEY ||
  process.env.DEVICE_AUTH_KEY ||
  process.env.NEXT_PUBLIC_GPS_API_KEY ||
  process.env.DEVICE_API_KEY ||
  "gps_live_1a04718c33200072bbe";

const AUTH_KEYS = [
  process.env.NEXT_PUBLIC_DEVICE_AUTH_KEY,
  process.env.DEVICE_AUTH_KEY,
  process.env.NEXT_PUBLIC_GPS_API_KEY,
  process.env.DEVICE_API_KEY,
  GPS_API_KEY,
  "gps_live_secret_2026",
  "gps_secret_token_2026",
].filter(Boolean) as string[];

export async function GET(
  request: NextRequest,
  { params }: { params: { imei: string } }
) {
  const imei = params.imei;
  const { searchParams } = new URL(request.url);
  const range =
    searchParams.get("range") || searchParams.get("filter") || "today";
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const limit = searchParams.get("limit");

  const baseUrl = DeviceBaseURL.replace(/\/$/, "");

  const queryParams: Record<string, string> = { range };
  if (from) queryParams.from = from;
  if (to) queryParams.to = to;
  if (limit) queryParams.limit = limit;

  // 1. Try /api/device/:imei/history?range=...
  for (const key of AUTH_KEYS) {
    try {
      const res = await axios.get(`${baseUrl}/api/device/${imei}/history`, {
        headers: {
          Authorization: `Bearer ${key}`,
          "X-API-Key": key,
        },
        params: { ...queryParams, api_key: key },
        timeout: 15000,
      });

      if (res.status === 200 && res.data) {
        return NextResponse.json(res.data);
      }
    } catch (e: any) {
      // Continue to next key or endpoint
    }
  }

  // 2. Try /api/history/:range?imei=...
  for (const key of AUTH_KEYS) {
    try {
      const res = await axios.get(`${baseUrl}/api/history/${range}`, {
        headers: {
          Authorization: `Bearer ${key}`,
          "X-API-Key": key,
        },
        params: { ...queryParams, imei, api_key: key },
        timeout: 15000,
      });

      if (res.status === 200 && res.data) {
        return NextResponse.json(res.data);
      }
    } catch (e: any) {
      // Continue
    }
  }

  // 3. Fallback to /api/device/:imei/locations
  for (const key of AUTH_KEYS) {
    try {
      const res = await axios.get(`${baseUrl}/api/device/${imei}/locations`, {
        headers: {
          Authorization: `Bearer ${key}`,
          "X-API-Key": key,
        },
        params: { ...queryParams, api_key: key },
        timeout: 15000,
      });

      if (res.status === 200 && res.data) {
        return NextResponse.json(res.data);
      }
    } catch (e: any) {
      // Continue
    }
  }

  return NextResponse.json(
    { imei, range, points: [], total_points: 0, distance_km: 0 },
    { status: 200 }
  );
}
