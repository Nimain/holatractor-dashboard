import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export const dynamic = "force-dynamic";

const FastApiBaseURL =
  process.env.NEXT_PUBLIC_TRACTOR_AI_URL || "https://tractorai.sinsignal.com/";
const NestJsBaseURL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://holatractor-backend-render.onrender.com/";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const page = searchParams.get("page") || "1";
    const limit = searchParams.get("limit") || "20";

    let token = "";
    const rawAuth = request.headers.get("authorization");
    if (rawAuth) {
      token = rawAuth.replace(/^Bearer\s+/i, "").trim();
    }
    if (!token) {
      token = request.cookies.get("access_token")?.value || "";
    }
    if (!token) {
      const rawCookie = request.headers.get("cookie") || "";
      const match = rawCookie.match(/(?:^|;\s*)access_token=([^;]+)/);
      if (match) token = decodeURIComponent(match[1]);
    }

    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // 1. Try FastAPI localhost /api/v1/admin/devices/options
    try {
      const base = (FastApiBaseURL || "https://tractorai.sinsignal.com/").replace(/\/$/, "");
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (page) params.set("page", page);
      if (limit) params.set("limit", limit);

      const fastApiUrl = `${base}/api/v1/admin/devices/options?${params.toString()}`;
      const fastApiRes = await axios.get(fastApiUrl, {
        headers,
        timeout: 15000,
      });

      if (fastApiRes.data && fastApiRes.data.success === true && Array.isArray(fastApiRes.data.data)) {
        return NextResponse.json(fastApiRes.data);
      }
    } catch (err: any) {
      console.warn("FastAPI options endpoint error:", err?.response?.status, err?.response?.data || err?.message);
    }

    // 2. Fallback: Query NestJS /store and construct hierarchical owner -> store -> tractor tree
    try {
      const resStores = await axios.get(`${NestJsBaseURL}store`, {
        headers,
        timeout: 6000,
      });
      const storesList = Array.isArray(resStores.data) ? resStores.data : [];
      const ownerMap: Record<string, any> = {};

      storesList.forEach((s: any) => {
        const o = s.owner || {};
        const u = o.user || {};
        const ownerId = o.id || s.owner_user_id || "unknown";
        const ownerName =
          `${u.first_name || ""} ${u.last_name || ""}`.trim() ||
          s.name ||
          "Store Owner";
        const ownerEmail = u.email || "";
        const ownerMobile = u.mobile || u.phone || "";

        if (!ownerMap[ownerId]) {
          ownerMap[ownerId] = {
            owner_id: ownerId,
            user_id: u.id || ownerId,
            owner_name: ownerName,
            owner_email: ownerEmail,
            owner_mobile: ownerMobile,
            owner_image: u.image || "",
            stores: [],
          };
        }

        const tractors = (s.TractorInStore || []).map((tis: any) => ({
          tractor_store_id: tis.id,
          base_tractor_id: tis.baseTractorId || "",
          name: tis.baseTractor?.name || "Tractor Unit",
          model: tis.baseTractor?.model || "Standard",
          image: tis.baseTractor?.images?.[0] || "",
          hourly_price: tis.hourly_price || 20,
          has_device: Boolean(tis.DeviceInTractor?.device_imei),
          current_imei: tis.DeviceInTractor?.device_imei || null,
        }));

        ownerMap[ownerId].stores.push({
          store_id: s.id,
          store_name: s.name || "Main Store",
          store_image: s.image || "",
          tractors,
        });
      });

      let optionsData = Object.values(ownerMap);

      // Apply dynamic search filter if requested
      if (search) {
        const term = search.toLowerCase().trim();
        const cleanDigits = term.replace(/\D/g, "");
        optionsData = optionsData.filter((o: any) => {
          const nameMatch = (o.owner_name || "").toLowerCase().includes(term);
          const emailMatch = (o.owner_email || "").toLowerCase().includes(term);
          const mob = (o.owner_mobile || "").toLowerCase();
          const mobDigits = mob.replace(/\D/g, "");
          const mobMatch =
            mob.includes(term) ||
            (cleanDigits.length >= 3 && mobDigits.includes(cleanDigits));
          const storeMatch = (o.stores || []).some((st: any) =>
            (st.store_name || "").toLowerCase().includes(term)
          );
          return nameMatch || emailMatch || mobMatch || storeMatch;
        });
      }

      return NextResponse.json({ success: true, data: optionsData });
    } catch (errRender: any) {
      console.error("RenderInstance fallback error:", errRender?.message || errRender);
    }

    return NextResponse.json({ success: true, data: [] });
  } catch (error: any) {
    console.error("Error in /api/devices/options:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
