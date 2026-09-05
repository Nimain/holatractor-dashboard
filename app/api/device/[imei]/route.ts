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
  const baseUrl = DeviceBaseURL.replace(/\/$/, "");

  for (const key of AUTH_KEYS) {
    try {
      const res = await axios.get(`${baseUrl}/api/device/${imei}`, {
        headers: {
          Authorization: `Bearer ${key}`,
          "X-API-Key": key,
        },
        params: { api_key: key },
        timeout: 10000,
      });

      if (res.status === 200 && res.data) {
        return NextResponse.json(res.data);
      }
    } catch (e: any) {
      if (e.response?.status === 404) {
        continue;
      }
    }
  }

  return NextResponse.json(
    { error: "Device not found or offline", imei },
    { status: 404 }
  );
}
