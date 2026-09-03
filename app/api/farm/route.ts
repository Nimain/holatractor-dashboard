import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import jwt from "jsonwebtoken";

export const dynamic = "force-dynamic";

const FastApiBaseURL =
  process.env.NEXT_PUBLIC_TRACTOR_AI_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://tractorai.sinsignal.com/";

function getAdminHeaders() {
  try {
    const adminToken = jwt.sign(
      {
        sub: "admin_master",
        id: "admin_master",
        email: "sistemas@holatractor.com",
        role: "admin",
        isAdmin: true,
        is_admin: true,
      },
      "ecommProdPrj",
      { expiresIn: "1h" }
    );
    return { Authorization: `Bearer ${adminToken}` };
  } catch {
    return {};
  }
}

export async function GET(request: NextRequest) {
  try {
    const adminHeaders = getAdminHeaders();

    // 1. Fetch real farms and farmers from Render DB via FastAPI
    const [farmsRes, farmersRes] = await Promise.all([
      axios
        .get(`${FastApiBaseURL.replace(/\/$/, "")}/farm/all`, {
          headers: adminHeaders,
          timeout: 10000,
        })
        .catch((e) => ({ data: null })),
      axios
        .get(`${FastApiBaseURL.replace(/\/$/, "")}/api/v1/admin/farmers`, {
          headers: adminHeaders,
          timeout: 10000,
        })
        .catch((e) => ({ data: null })),
    ]);

    const farmersMap = new Map<string, any>();
    if (farmersRes?.data && Array.isArray(farmersRes.data)) {
      farmersRes.data.forEach((f: any) => {
        const u = f.user || f;
        if (f.id) farmersMap.set(String(f.id), u);
        if (f.user_id) farmersMap.set(String(f.user_id), u);
        if (u.id) farmersMap.set(String(u.id), u);
      });
    }

    const rawFarms: any[] =
      farmsRes?.data?.farms || (Array.isArray(farmsRes?.data) ? farmsRes.data : []);

    if (rawFarms.length > 0) {
      const resolvedFarms = rawFarms.map((fm: any) => {
        const ownerUser = farmersMap.get(String(fm.owner_id)) || {};
        
        let areaHa = 10.0;
        if (fm.boundary?.area_hectares) {
          areaHa = Number(fm.boundary.area_hectares);
        } else if (fm.boundary?.area) {
          areaHa = Number(fm.boundary.area) > 1000 ? Number(fm.boundary.area) / 10000 : Number(fm.boundary.area);
        }

        const coordinates = Array.isArray(fm.boundary?.coordinates)
          ? fm.boundary.coordinates.map((c: any) => {
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

        return {
          id: String(fm.id),
          owner_id: String(fm.owner_id || ""),
          base_id: String(fm.base_id || "base_default"),
          type: String(fm.type || "polygon"),
          name: String(fm.name || "Farm"),
          description: String(fm.description || ""),
          location: fm.location ? String(fm.location) : "Santa Cruz, Bolivia",
          soil_type: fm.soil_type ? String(fm.soil_type) : "Franco Limoso",
          crops: Array.isArray(fm.crops) ? fm.crops : [],
          boundary: {
            area: areaHa,
            coordinates,
          },
          createdAt: String(fm.created_at || fm.createdAt || new Date().toISOString()),
          updatedAt: String(fm.updated_at || fm.updatedAt || new Date().toISOString()),
          Owner: {
            id: String(fm.owner_id || ""),
            first_name: String(ownerUser.first_name || "Farmer"),
            middle_name: String(ownerUser.middle_name || ""),
            last_name: String(ownerUser.last_name || ""),
            email: String(ownerUser.email || ""),
            mobile: ownerUser.mobile ? String(ownerUser.mobile) : null,
            country_code: ownerUser.country_code ? String(ownerUser.country_code) : "+591",
            gender: String(ownerUser.gender || "male"),
            authType: String(ownerUser.authType || "EMAIL"),
            phoneVerified: true,
            emailVerified: ownerUser.emailVerified !== null ? Boolean(ownerUser.emailVerified) : true,
            request_to_delete: false,
          },
        };
      });

      return NextResponse.json(resolvedFarms);
    }

    return NextResponse.json([]);
  } catch (error: any) {
    console.error("[/api/farm] Error fetching real farms from Render DB:", error?.message);
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const adminHeaders = getAdminHeaders();

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
      name: body.name?.trim() || "Nueva Finca",
      type: body.type || "polygon",
      location: body.location?.trim() || "Santa Cruz, Bolivia",
      soil_type: body.soil_type?.trim() || "Franco Arcilloso",
      crops: Array.isArray(body.crops) ? body.crops : [],
      description: body.description?.trim() || "",
      boundary: {
        coordinates: normalizedCoordinates,
        area: parseFloat(body?.boundary?.area) || 0,
      },
    };

    // Save directly to Render database via FastAPI
    const fastRes = await axios.post(
      `${FastApiBaseURL.replace(/\/$/, "")}/farm`,
      formattedPayload,
      { headers: adminHeaders, timeout: 15000 }
    );

    return NextResponse.json(fastRes.data, { status: 201 });
  } catch (error: any) {
    console.error("[/api/farm] Error creating farm in Render DB:", error?.response?.data || error?.message);
    return NextResponse.json(
      {
        message:
          error?.response?.data?.detail ||
          error?.response?.data?.message ||
          "Failed to create farm in database",
        success: false,
      },
      { status: error?.response?.status || 500 }
    );
  }
}
