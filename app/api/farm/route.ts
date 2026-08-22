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

    // 1. Try NestJS /farm
    try {
      const response = await axios.get(`${NestJsBaseURL}farm`, {
        headers,
        timeout: 10000,
      });
      if (Array.isArray(response.data)) {
        return NextResponse.json(response.data);
      }
      if (response.data && Array.isArray(response.data.data)) {
        return NextResponse.json(response.data.data);
      }
    } catch (e: any) {
      console.warn("NestJS /farm failed, checking FastAPI /farm:", e?.message);
    }

    // 2. Fallback to FastAPI /farm
    try {
      const fastRes = await axios.get(
        `${FastApiBaseURL.replace(/\/$/, "")}/farm`,
        { headers, timeout: 10000 }
      );
      if (fastRes.data && Array.isArray(fastRes.data.farms)) {
        return NextResponse.json(fastRes.data.farms);
      }
      if (Array.isArray(fastRes.data)) {
        return NextResponse.json(fastRes.data);
      }
    } catch (fastErr: any) {
      console.warn("FastAPI /farm fallback error:", fastErr?.message);
    }

    return NextResponse.json([]);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to fetch farms" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const authHeader =
      request.headers.get("authorization") ||
      `Bearer ${request.cookies.get("access_token")?.value || ""}`;

    const headers = authHeader ? { Authorization: authHeader } : {};

    const normalizedCoordinates = Array.isArray(body?.boundary?.coordinates)
      ? body.boundary.coordinates.map((c: any) => {
          if (Array.isArray(c)) {
            return { lat: String(c[1]), lan: String(c[0]), lng: String(c[0]) };
          }
          return {
            lat: String(c.lat ?? ""),
            lan: String(c.lan ?? c.lng ?? ""),
            lng: String(c.lng ?? c.lan ?? ""),
          };
        })
      : [];

    const formattedPayload = {
      owner_id: body.owner_id,
      name: body.name?.trim(),
      type: body.type || "polygon",
      location: body.location?.trim() || "Santa Cruz, Bolivia",
      soil_type: body.soil_type?.trim() || "Franco / Loamy",
      crops: Array.isArray(body.crops) ? body.crops : [],
      description: body.description?.trim() || "",
      boundary: {
        coordinates: normalizedCoordinates,
        area: parseFloat(body?.boundary?.area) || 0,
      },
    };

    // 1. Try FastAPI /farm
    try {
      const fastRes = await axios.post(
        `${FastApiBaseURL.replace(/\/$/, "")}/farm`,
        formattedPayload,
        { headers, timeout: 20000 }
      );
      return NextResponse.json(fastRes.data, { status: 201 });
    } catch (fastErr: any) {
      console.warn("FastAPI POST /farm error, trying NestJS:", fastErr?.response?.data || fastErr?.message);

      // 2. Try NestJS /farm
      try {
        const nestRes = await axios.post(
          `${NestJsBaseURL}farm`,
          formattedPayload,
          { headers, timeout: 20000 }
        );
        return NextResponse.json(nestRes.data, { status: nestRes.status });
      } catch (nestErr: any) {
        return NextResponse.json(
          {
            message:
              fastErr?.response?.data?.detail ||
              nestErr?.response?.data?.message ||
              "Failed to create farm",
            success: false,
          },
          { status: fastErr?.response?.status || nestErr?.response?.status || 500 }
        );
      }
    }
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || "Internal server error", success: false },
      { status: 500 }
    );
  }
}
