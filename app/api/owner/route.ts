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

    // 1. Try FastAPI localhost for instant live updates (98 dynamic owners)
    try {
      const fastApiRes = await axios.get(
        `${FastApiBaseURL.replace(/\/$/, "")}/api/v1/admin/owners`,
        { headers, timeout: 5000 }
      );
      if (Array.isArray(fastApiRes.data) && fastApiRes.data.length > 0) {
        return NextResponse.json(fastApiRes.data);
      }
    } catch {}

    // 2. Try online NestJS /owner
    try {
      const backendRes = await axios.get(`${NestJsBaseURL}owner`, {
        headers,
        timeout: 5000,
      });
      if (Array.isArray(backendRes.data) && backendRes.data.length > 0) {
        return NextResponse.json(backendRes.data);
      }
    } catch {}

    // 3. Fallback: Query live stores and extract owners
    try {
      const storesRes = await axios.get(`${NestJsBaseURL}store`, {
        headers,
        timeout: 5000,
      });
      const stores = Array.isArray(storesRes.data) ? storesRes.data : [];
      const ownersMap = new Map();
      stores.forEach((s: any) => {
        const o = s.owner;
        if (o && o.id && !ownersMap.has(o.id)) {
          ownersMap.set(o.id, {
            id: o.id,
            user_id: o.user_id || o.id,
            role_id: o.role_id || "owner_role",
            created_by: null,
            status: 1,
            base_id: o.base_id || o.id,
            createdAt: o.createdAt || new Date().toISOString(),
            updatedAt: o.updatedAt || new Date().toISOString(),
            user: {
              id: o.user?.id || o.user_id || o.id,
              first_name: o.user?.first_name || "Owner",
              middle_name: o.user?.middle_name || "",
              last_name: o.user?.last_name || "",
              email: o.user?.email || "",
              mobile: o.user?.mobile || o.user?.phone || "",
              gender: o.user?.gender || "male",
              image: o.user?.image || "",
              country_code: o.user?.country_code || "+591",
              emailVerified: o.user?.emailVerified ?? true,
              authType: o.user?.authType || "EMAIL",
            },
          });
        }
      });

      if (ownersMap.size > 0) {
        return NextResponse.json(Array.from(ownersMap.values()));
      }
    } catch {}

    return NextResponse.json([]);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to fetch owners" },
      { status: 500 }
    );
  }
}
