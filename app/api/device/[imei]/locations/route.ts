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
  const baseUrl = DeviceBaseURL.replace(/\/$/, "");

  const queryParams: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    queryParams[key] = value;
  });

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

      if (res.status === 200 && Array.isArray(res.data)) {
        return NextResponse.json(res.data);
      }
    } catch (e: any) {
      // Continue
    }
  }

  return NextResponse.json([], { status: 200 });
}
