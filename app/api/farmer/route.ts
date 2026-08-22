import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const FastApiBaseURL =
  process.env.NEXT_PUBLIC_TRACTOR_AI_URL || "http://127.0.0.1:8000/";
const NestJsBaseURL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://holatractor-backend-render.onrender.com/";

// Normalize a farmer record — handles both flat (FastAPI) and nested user formats
const normalizeFarmer = (f: any) => {
  const u = f.user || {};
  return {
    id: f.user_id || f.id || u.id,
    user_id: f.user_id || u.id || f.id,
    first_name: f.first_name || u.first_name || "",
    last_name: f.last_name || u.last_name || "",
    email: f.email || u.email || "",
    mobile: f.mobile || u.mobile || "",
    Status: f.Status ?? 1,
    createdAt: f.createdAt || u.createdAt || null,
    user: {
      id: f.user_id || u.id || f.id,
      first_name: f.first_name || u.first_name || "",
      middle_name: f.middle_name || u.middle_name || "",
      last_name: f.last_name || u.last_name || "",
      email: f.email || u.email || "",
      mobile: f.mobile || u.mobile || "",
      authType: f.authType || u.authType || "EMAIL",
      gender: f.gender || u.gender || "male",
      emailVerified: f.emailVerified ?? u.emailVerified ?? true,
      image: f.image || u.image || null,
      country_code: f.country_code || u.country_code || "+591",
    },
  };
};

export async function GET(request: NextRequest) {
  try {
    const authHeader =
      request.headers.get("authorization") ||
      `Bearer ${request.cookies.get("access_token")?.value || ""}`;
    const headers = authHeader ? { Authorization: authHeader } : {};
    const search = request.nextUrl.searchParams.get("search")?.toLowerCase() || "";

    const applySearch = (farmers: any[]) => {
      if (!search) return farmers;
      return farmers.filter((f) => {
        const name = `${f.first_name || ""} ${f.last_name || ""}`.toLowerCase();
        const email = (f.email || "").toLowerCase();
        const mobile = f.mobile || "";
        return name.includes(search) || email.includes(search) || mobile.includes(search);
      });
    };

    // 1. FastAPI – fastest, most up-to-date
    try {
      const fastApiRes = await axios.get(
        `${FastApiBaseURL.replace(/\/$/, "")}/api/v1/admin/farmers`,
        { headers, timeout: 10000 }
      );
      if (Array.isArray(fastApiRes.data) && fastApiRes.data.length > 0) {
        return NextResponse.json(applySearch(fastApiRes.data.map(normalizeFarmer)));
      }
    } catch {
      // fall through
    }

    // 2. NestJS /farmer
    try {
      const backendRes = await axios.get(`${NestJsBaseURL}farmer`, {
        headers,
        timeout: 5000,
      });
      if (Array.isArray(backendRes.data) && backendRes.data.length > 0) {
        return NextResponse.json(applySearch(backendRes.data.map(normalizeFarmer)));
      }
    } catch {
      // fall through
    }

    // 3. Aggregate from /farm and /booking owners/users
    const [farmsRes, bookingsRes] = await Promise.all([
      axios.get(`${NestJsBaseURL}farm`, { headers }).catch(() => ({ data: [] })),
      axios.get(`${NestJsBaseURL}booking`, { headers }).catch(() => ({ data: [] })),
    ]);

    const farms = Array.isArray(farmsRes.data) ? farmsRes.data : [];
    const bookings = Array.isArray(bookingsRes.data) ? bookingsRes.data : [];
    const farmersMap = new Map<string, any>();

    farms.forEach((f: any) => {
      const o = f?.Owner;
      if (o?.id && !farmersMap.has(o.id)) {
        farmersMap.set(o.id, normalizeFarmer({
          id: o.id,
          user_id: o.id,
          first_name: o.first_name || "",
          last_name: o.last_name || "",
          email: o.email || "",
          mobile: o.phone || o.mobile || "",
          authType: o.authType || "EMAIL",
          gender: o.gender || "male",
          emailVerified: o.emailVerified ?? true,
          image: o.image || null,
          country_code: o.country_code || "+591",
          createdAt: o.createdAt || f.createdAt || new Date().toISOString(),
        }));
      }
    });

    bookings.forEach((b: any) => {
      const u = b?.user;
      if (u?.id && !farmersMap.has(u.id)) {
        farmersMap.set(u.id, normalizeFarmer({
          id: u.id,
          user_id: u.id,
          first_name: u.first_name || "",
          last_name: u.last_name || "",
          email: u.email || "",
          mobile: u.phone || u.mobile || "",
          authType: u.authType || "EMAIL",
          gender: u.gender || "male",
          emailVerified: u.emailVerified ?? true,
          image: u.image || null,
          country_code: u.country_code || "+591",
          createdAt: b.createdAt || new Date().toISOString(),
        }));
      }
    });

    return NextResponse.json(applySearch(Array.from(farmersMap.values())));
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to fetch farmer data" },
      { status: 500 }
    );
  }
}
