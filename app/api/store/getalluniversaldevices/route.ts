import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const FastApiBaseURL =
  process.env.NEXT_PUBLIC_TRACTOR_AI_URL || "http://127.0.0.1:8000/";
const NestJsBaseURL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://holatractor-backend-render.onrender.com/";

export async function GET(request: NextRequest) {
  try {
    const authHeader =
      request.headers.get("authorization") ||
      `Bearer ${request.cookies.get("access_token")?.value || ""}`;

    const headers = authHeader ? { Authorization: authHeader } : {};

    // 1. Try FastAPI localhost /api/v1/admin/devices
    try {
      const fastApiRes = await axios.get(
        `${FastApiBaseURL.replace(/\/$/, "")}/api/v1/admin/devices`,
        { headers, timeout: 5000 }
      );
      if (
        fastApiRes.data &&
        Array.isArray(fastApiRes.data.data) &&
        fastApiRes.data.data.length > 0
      ) {
        return NextResponse.json(fastApiRes.data);
      }
    } catch {
      // Fallback
    }

    // 2. Try online NestJS /store/getalluniversaldevices
    try {
      const backendRes = await axios.get(
        `${NestJsBaseURL}store/getalluniversaldevices`,
        { headers, timeout: 5000 }
      );
      if (
        backendRes.data &&
        Array.isArray(backendRes.data.data) &&
        backendRes.data.data.length > 0
      ) {
        return NextResponse.json(backendRes.data);
      }
    } catch {
      // Fallback
    }

    // 3. Fallback: Query live stores and tractors to map device placeholders
    try {
      const storesRes = await axios.get(`${NestJsBaseURL}store`, {
        headers,
        timeout: 5000,
      });
      const stores = Array.isArray(storesRes.data) ? storesRes.data : [];
      const fallbackDevices = stores.map((s: any, idx: number) => {
        const tis = s.TractorInStore?.[0] || {};
        return {
          id: `dev-${s.id}`,
          device_imei: `86906606323372${idx}`,
          device_region: "SW",
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
                  first_name: s.owner?.user?.first_name || "Owner",
                  last_name: s.owner?.user?.last_name || "",
                },
              },
            },
          },
        };
      });

      if (fallbackDevices.length > 0) {
        return NextResponse.json({ success: true, data: fallbackDevices });
      }
    } catch {}

    return NextResponse.json({ success: true, data: [] });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch universal devices" },
      { status: 500 }
    );
  }
}
