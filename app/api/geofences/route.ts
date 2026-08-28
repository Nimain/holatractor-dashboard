import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export const dynamic = "force-dynamic";

const DeviceBaseURL =
  process.env.NEXT_PUBLIC_DEVICE_URL || "https://device.holatractor.com";
const GPS_API_KEY =
  process.env.NEXT_PUBLIC_GPS_API_KEY || "gps_live_1a04718c33200072bbe";

const AUTH_KEYS = [GPS_API_KEY, "gps_live_secret_2026", "gps_secret_token_2026"];

export async function GET(request: NextRequest) {
  const baseUrl = DeviceBaseURL.replace(/\/$/, "");

  for (const key of AUTH_KEYS) {
    try {
      const res = await axios.get(`${baseUrl}/api/geofences`, {
        headers: {
          Authorization: `Bearer ${key}`,
          "X-API-Key": key,
        },
        params: { api_key: key },
        timeout: 10000,
      });

      if (res.status === 200 && Array.isArray(res.data)) {
        return NextResponse.json(res.data);
      }
    } catch (e: any) {
      // Continue
    }
  }

  return NextResponse.json([], { status: 200 });
}

export async function POST(request: NextRequest) {
  const baseUrl = DeviceBaseURL.replace(/\/$/, "");
  const body = await request.json();

  for (const key of AUTH_KEYS) {
    try {
      const res = await axios.post(`${baseUrl}/api/geofences`, body, {
        headers: {
          Authorization: `Bearer ${key}`,
          "X-API-Key": key,
        },
        params: { api_key: key },
        timeout: 10000,
      });

      if (res.status === 200 || res.status === 201) {
        return NextResponse.json(res.data);
      }
    } catch (e: any) {
      // Continue
    }
  }

  return NextResponse.json({ error: "Failed to create geofence" }, { status: 500 });
}
