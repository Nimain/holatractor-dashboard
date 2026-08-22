import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const FastApiBaseURL =
  process.env.NEXT_PUBLIC_TRACTOR_AI_URL || "https://tractorai.sinsignal.com/";
const NestJsBaseURL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://holatractor-backend-render.onrender.com/";

export async function GET(request: NextRequest) {
  try {
    const authHeader =
      request.headers.get("authorization") ||
      `Bearer ${request.cookies.get("access_token")?.value || ""}`;
    const headers = authHeader ? { Authorization: authHeader } : {};

    // 1. Primary: NestJS /store/getalluniversaldevices (proven endpoint)
    try {
      const nestRes = await axios.get(
        `${NestJsBaseURL.replace(/\/$/, "")}/store/getalluniversaldevices`,
        { headers, timeout: 12000 }
      );
      const d = nestRes.data;
      // NestJS returns { success, data: [...] } or plain array
      if (d && Array.isArray(d.data) && d.data.length > 0) {
        return NextResponse.json(d);
      }
      if (Array.isArray(d) && d.length > 0) {
        return NextResponse.json({ success: true, data: d });
      }
    } catch (e: any) {
      console.warn("NestJS getalluniversaldevices failed:", e?.message);
    }

    // 2. FastAPI /api/v1/admin/devices (optional — only if available)
    try {
      const fastApiRes = await axios.get(
        `${FastApiBaseURL.replace(/\/$/, "")}/api/v1/admin/devices`,
        { headers, timeout: 8000 }
      );
      const d = fastApiRes.data;
      if (d && Array.isArray(d.data) && d.data.length > 0) {
        return NextResponse.json(d);
      }
      if (Array.isArray(d) && d.length > 0) {
        return NextResponse.json({ success: true, data: d });
      }
    } catch {
      // FastAPI endpoint may not exist — silently skip
    }

    // 3. Fallback: Build device list from /store endpoint
    try {
      const storesRes = await axios.get(
        `${NestJsBaseURL.replace(/\/$/, "")}/store`,
        { headers, timeout: 10000 }
      );
      const stores = Array.isArray(storesRes.data) ? storesRes.data : [];
      const fallbackDevices: any[] = [];

      stores.forEach((s: any) => {
        const tractors: any[] = s.TractorInStore || [];
        tractors.forEach((tis: any, idx: number) => {
          if (tis?.device_imei || tis?.device_id) {
            fallbackDevices.push({
              id: tis.device_imei || tis.device_id || `dev-${s.id}-${idx}`,
              device_imei: tis.device_imei || tis.device_id || `86906606323372${idx}`,
              device_region: tis.device_region || "SW",
              base: { status: 1 },
              tractorInStore: {
                hourly_price: tis.hourly_price || 25.0,
                baseTractor: {
                  name: tis.baseTractor?.name || "Tractor",
                  model: tis.baseTractor?.model || "N/A",
                  images: tis.baseTractor?.images || [],
                },
                store: {
                  name: s.name || "Store",
                  image: s.image || "",
                  location: {
                    lat: s.location?.lat || "-17.8230",
                    lan: s.location?.lan || "-63.2026",
                  },
                  owner: {
                    user: {
                      first_name: s.owner?.user?.first_name || s.Owner?.user?.first_name || "Owner",
                      last_name: s.owner?.user?.last_name || s.Owner?.user?.last_name || "",
                    },
                  },
                },
              },
            });
          }
        });
      });

      if (fallbackDevices.length > 0) {
        return NextResponse.json({ success: true, data: fallbackDevices });
      }
    } catch (e: any) {
      console.warn("Store fallback failed:", e?.message);
    }

    // No devices found — return empty success so UI shows empty state (not error)
    return NextResponse.json({ success: true, data: [] });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch devices" },
      { status: 500 }
    );
  }
}
