import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import pool from "@/utils/Database/db";
import { getFastApiAuthHeaders } from "@/utils/auth/serverAuth";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const FastApiEndpoints = [
  "http://127.0.0.1:8000",
  process.env.NEXT_PUBLIC_TRACTOR_AI_URL || "",
  process.env.NEXT_PUBLIC_API_URL || "",
  "https://tractorai.sinsignal.com",
].filter(Boolean);

function parseSoilAndCrops(desc: string | null | undefined) {
  let soilType = "Franco (Loamy - Balanced)";
  let crops = ["Soy (Soya)"];

  if (!desc) return { soilType, crops };

  const soilMatch = desc.match(/\(([^()]+)\)$/);
  if (soilMatch && soilMatch[1]) {
    soilType = soilMatch[1].trim();
  }

  const cropsMatch = desc.match(/Field with ([^(]+)/i);
  if (cropsMatch && cropsMatch[1]) {
    crops = cropsMatch[1]
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);
  }

  return { soilType, crops };
}

export async function GET(request: NextRequest) {
  try {
    const adminHeaders = getFastApiAuthHeaders(request);
    const { searchParams } = new URL(request.url);
    const ownerId = searchParams.get("owner_id");
    const isRefresh = searchParams.get("refresh") === "true";

    const allFetchedFarmsMap = new Map<string, any>();

    // 1. Fetch real universal farms from primary "Farm" PostgreSQL table
    try {
      const dbRes = await pool.query(
        `
        SELECT f.id, f.owner_id, f.base_id, f.type, f.name, f.description, f.boundary, f."createdAt", f."updatedAt",
               u.first_name, u.middle_name, u.last_name, u.email, u.mobile, u.country_code, u.gender, u."authType", u."phoneVerified", u."emailVerified", u.request_to_delete
        FROM "Farm" f
        LEFT JOIN "User" u ON u.id = f.owner_id
        ${ownerId ? "WHERE f.owner_id = $1" : ""}
        ORDER BY f."createdAt" DESC;
      `,
        ownerId ? [ownerId] : []
      );

      if (dbRes.rows.length > 0) {
        dbRes.rows.forEach((r: any) => {
          const fid = String(r.id);
          const rawBoundary = r.boundary || {};
          const rawCoords = rawBoundary.coordinates || [];
          const coordinates = Array.isArray(rawCoords)
            ? rawCoords.map((c: any) => {
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

          let areaSqm = 50000;
          if (rawBoundary.area) {
            areaSqm = Number(rawBoundary.area);
          } else if (rawBoundary.area_hectares) {
            areaSqm = Number(rawBoundary.area_hectares) * 10000;
          }

          const { soilType, crops } = parseSoilAndCrops(r.description);

          allFetchedFarmsMap.set(fid, {
            id: fid,
            owner_id: String(r.owner_id || ""),
            base_id: String(r.base_id || "base_default"),
            type: String(r.type || "polygon"),
            name: String(r.name || "Farm"),
            description: String(r.description || ""),
            location: "Santa Cruz, Bolivia",
            soil_type: soilType,
            crops: crops,
            boundary: {
              area: areaSqm,
              coordinates: coordinates,
            },
            createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
            updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : new Date().toISOString(),
            Owner: {
              id: String(r.owner_id || ""),
              first_name: String(r.first_name || "Farmer"),
              middle_name: String(r.middle_name || ""),
              last_name: String(r.last_name || ""),
              email: String(r.email || ""),
              mobile: r.mobile ? String(r.mobile) : null,
              country_code: r.country_code ? String(r.country_code) : "+591",
              gender: String(r.gender || "male"),
              authType: String(r.authType || "EMAIL"),
              phoneVerified: Boolean(r.phoneVerified),
              emailVerified: r.emailVerified !== null ? Boolean(r.emailVerified) : true,
              request_to_delete: Boolean(r.request_to_delete),
            },
          });
        });
      }
    } catch (pgErr: any) {
      console.warn("[/api/farm] Error querying \"Farm\" table:", pgErr?.message);
    }

    // 2. Query fallback "farms" table if any additional records exist
    try {
      const res = await pool.query(
        `
        SELECT f.id, f.owner_id, f.name, f.description, f.location, f.soil_type, f.crops, f.type, 
               f.boundary_coordinates, f.area_sqm, f.created_at, f.updated_at,
               u.first_name, u.last_name, u.email, u.mobile, u.country_code
        FROM farms f
        LEFT JOIN "User" u ON u.id = f.owner_id
        ${ownerId ? "WHERE f.owner_id = $1" : ""}
        ORDER BY f.created_at DESC
        LIMIT 500;
      `,
        ownerId ? [ownerId] : []
      );

      if (res.rows.length > 0) {
        res.rows.forEach((row: any) => {
          const fid = String(row.id);
          if (!allFetchedFarmsMap.has(fid)) {
            const rawCoords = row.boundary_coordinates || [];
            const coordinates = Array.isArray(rawCoords)
              ? rawCoords.map((c: any) => {
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

            const areaSqm = Number(row.area_sqm || 50000);

            allFetchedFarmsMap.set(fid, {
              id: fid,
              owner_id: String(row.owner_id || ""),
              base_id: "base_default",
              type: String(row.type || "polygon"),
              name: String(row.name || "Farm"),
              description: String(row.description || ""),
              location: row.location || "Santa Cruz, Bolivia",
              soil_type: row.soil_type || "Franco (Loamy - Balanced)",
              crops: Array.isArray(row.crops) ? row.crops : ["Soy (Soya)"],
              boundary: {
                area: areaSqm,
                coordinates,
              },
              createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
              updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
              Owner: {
                id: String(row.owner_id || ""),
                first_name: String(row.first_name || "Farmer"),
                middle_name: "",
                last_name: String(row.last_name || ""),
                email: String(row.email || ""),
                mobile: row.mobile ? String(row.mobile) : null,
                country_code: row.country_code ? String(row.country_code) : "+591",
                gender: "male",
                authType: "EMAIL",
                phoneVerified: true,
                emailVerified: true,
                request_to_delete: false,
              },
            });
          }
        });
      }
    } catch {}

    // 3. Fetch real farms and farmers concurrently from FastAPI endpoints and merge
    const fastApiPromises = FastApiEndpoints.map(async (baseUrl) => {
      const cleanBase = baseUrl.replace(/\/$/, "");
      const farmUrl = ownerId ? `${cleanBase}/farm?owner_id=${ownerId}` : `${cleanBase}/farm/all`;
      const farmersUrl = `${cleanBase}/api/v1/admin/farmers`;

      const [farmsRes, farmersRes] = await Promise.all([
        axios
          .get(farmUrl, {
            headers: {
              ...adminHeaders,
              "x-admin-key": adminHeaders.Authorization.replace(/^Bearer\s+/i, ""),
              "x-api-key": adminHeaders.Authorization.replace(/^Bearer\s+/i, ""),
            },
            timeout: isRefresh ? 4000 : 2500,
          })
          .catch(() => null),
        axios
          .get(farmersUrl, {
            headers: {
              ...adminHeaders,
              "x-admin-key": adminHeaders.Authorization.replace(/^Bearer\s+/i, ""),
              "x-api-key": adminHeaders.Authorization.replace(/^Bearer\s+/i, ""),
            },
            timeout: isRefresh ? 4000 : 2500,
          })
          .catch(() => null),
      ]);

      const rawFarms: any[] =
        farmsRes?.data?.farms || (Array.isArray(farmsRes?.data) ? farmsRes.data : []);

      if (rawFarms && rawFarms.length > 0) {
        const farmersMap = new Map<string, any>();
        if (farmersRes?.data && Array.isArray(farmersRes.data)) {
          farmersRes.data.forEach((f: any) => {
            const u = f.user || f;
            if (f.id) farmersMap.set(String(f.id), u);
            if (f.user_id) farmersMap.set(String(f.user_id), u);
            if (u.id) farmersMap.set(String(u.id), u);
          });
        }

        rawFarms.forEach((fm: any) => {
          const fid = String(fm.id);
          const ownerUser = farmersMap.get(String(fm.owner_id)) || {};

          let areaSqm = 50000;
          if (fm.boundary?.area) {
            areaSqm = Number(fm.boundary.area);
          } else if (fm.boundary?.area_hectares) {
            areaSqm = Number(fm.boundary.area_hectares) * 10000;
          } else if (fm.area_sqm) {
            areaSqm = Number(fm.area_sqm);
          }

          const rawCoords = fm.boundary?.coordinates || fm.boundary_coordinates || [];
          const coordinates = Array.isArray(rawCoords)
            ? rawCoords.map((c: any) => {
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

          const existing = allFetchedFarmsMap.get(fid);
          allFetchedFarmsMap.set(fid, {
            id: fid,
            owner_id: String(fm.owner_id || existing?.owner_id || ""),
            base_id: String(fm.base_id || existing?.base_id || "base_default"),
            type: String(fm.type || existing?.type || "polygon"),
            name: String(fm.name || existing?.name || "Farm"),
            description: String(fm.description || existing?.description || ""),
            location: fm.location ? String(fm.location) : existing?.location || "Santa Cruz, Bolivia",
            soil_type: fm.soil_type ? String(fm.soil_type) : existing?.soil_type || "Franco (Loamy - Balanced)",
            crops: Array.isArray(fm.crops) ? fm.crops : existing?.crops || ["Soy (Soya)"],
            boundary: {
              area: areaSqm,
              coordinates: coordinates.length > 0 ? coordinates : existing?.boundary?.coordinates || [],
            },
            createdAt: String(fm.created_at || fm.createdAt || existing?.createdAt || new Date().toISOString()),
            updatedAt: String(fm.updated_at || fm.updatedAt || existing?.updatedAt || new Date().toISOString()),
            Owner: {
              id: String(fm.owner_id || existing?.Owner?.id || ""),
              first_name: String(ownerUser.first_name || existing?.Owner?.first_name || "Farmer"),
              middle_name: String(ownerUser.middle_name || existing?.Owner?.middle_name || ""),
              last_name: String(ownerUser.last_name || existing?.Owner?.last_name || ""),
              email: String(ownerUser.email || existing?.Owner?.email || ""),
              mobile: ownerUser.mobile ? String(ownerUser.mobile) : existing?.Owner?.mobile || null,
              country_code: ownerUser.country_code ? String(ownerUser.country_code) : existing?.Owner?.country_code || "+591",
              gender: String(ownerUser.gender || existing?.Owner?.gender || "male"),
              authType: String(ownerUser.authType || existing?.Owner?.authType || "EMAIL"),
              phoneVerified: true,
              emailVerified: ownerUser.emailVerified !== null ? Boolean(ownerUser.emailVerified) : true,
              request_to_delete: false,
            },
          });
        });
      }
    });

    await Promise.allSettled(fastApiPromises);

    const universalFarms = Array.from(allFetchedFarmsMap.values());
    return NextResponse.json(universalFarms);
  } catch (error: any) {
    console.error("[/api/farm] Error fetching universal farms:", error?.message);
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const adminHeaders = getFastApiAuthHeaders(request);

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

    const numArea = parseFloat(body?.boundary?.area) || 50000;
    const formattedType = body.type === "rectangle" ? "rectangle" : "polygon";
    const generatedId = "cm" + crypto.randomBytes(11).toString("hex");
    const generatedBaseId = "cm" + crypto.randomBytes(11).toString("hex");

    const formattedPayload = {
      id: generatedId,
      owner_id: body.owner_id || "cm8x7w4xn001vu5w3xq9nvfjz",
      base_id: generatedBaseId,
      name: body.name?.trim() || "Nueva Finca",
      type: formattedType,
      location: body.location?.trim() || "Santa Cruz, Bolivia",
      soil_type: body.soil_type?.trim() || "Franco (Loamy - Balanced)",
      crops: Array.isArray(body.crops) ? body.crops : ["Soy (Soya)"],
      description: body.description?.trim() || `Field with ${Array.isArray(body.crops) ? body.crops.join(", ") : "Soy (Soya)"} (${body.soil_type || "Franco (Loamy - Balanced)"})`,
      boundary: {
        coordinates: normalizedCoordinates,
        area: numArea,
      },
    };

    // 1. Direct PostgreSQL creation in "Farm" table
    try {
      const dbRes = await pool.query(
        `INSERT INTO "Farm" (id, owner_id, base_id, type, name, description, boundary, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
         RETURNING *;`,
        [
          formattedPayload.id,
          formattedPayload.owner_id,
          formattedPayload.base_id,
          formattedPayload.type,
          formattedPayload.name,
          formattedPayload.description,
          JSON.stringify(formattedPayload.boundary),
        ]
      );

      // Also mirror into farms table if it exists
      try {
        await pool.query(
          `INSERT INTO farms (owner_id, name, description, location, soil_type, crops, type, boundary_coordinates, area_sqm, point_count, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW());`,
          [
            formattedPayload.owner_id,
            formattedPayload.name,
            formattedPayload.description,
            formattedPayload.location,
            formattedPayload.soil_type,
            JSON.stringify(formattedPayload.crops),
            formattedPayload.type,
            JSON.stringify(normalizedCoordinates),
            formattedPayload.boundary.area,
            normalizedCoordinates.length,
          ]
        );
      } catch {}

      // Background notify FastAPI endpoints
      FastApiEndpoints.forEach(async (baseUrl) => {
        try {
          const cleanBase = baseUrl.replace(/\/$/, "");
          await axios.post(`${cleanBase}/farm`, formattedPayload, {
            headers: adminHeaders,
            timeout: 3000,
          });
        } catch {}
      });

      if (dbRes.rows.length > 0) {
        const saved = dbRes.rows[0];
        return NextResponse.json(
          {
            id: saved.id,
            owner_id: saved.owner_id,
            base_id: saved.base_id,
            name: saved.name,
            description: saved.description,
            location: formattedPayload.location,
            soil_type: formattedPayload.soil_type,
            crops: formattedPayload.crops,
            type: saved.type,
            boundary: saved.boundary,
            createdAt: saved.createdAt,
            updatedAt: saved.updatedAt,
          },
          { status: 201 }
        );
      }
    } catch (pgErr: any) {
      console.error("[/api/farm] Direct PostgreSQL creation error in \"Farm\":", pgErr?.message);
    }

    // 2. FastAPI fallback creation
    for (const baseUrl of FastApiEndpoints) {
      try {
        const cleanBase = baseUrl.replace(/\/$/, "");
        const fastRes = await axios.post(`${cleanBase}/farm`, formattedPayload, {
          headers: adminHeaders,
          timeout: 5000,
        });

        if (fastRes.data) {
          return NextResponse.json(fastRes.data, { status: 201 });
        }
      } catch {}
    }

    return NextResponse.json(
      {
        message: "Failed to create farm in database",
        success: false,
      },
      { status: 500 }
    );
  } catch (error: any) {
    console.error("[/api/farm] Error in POST /api/farm:", error?.message);
    return NextResponse.json(
      {
        message: error?.message || "Internal server error",
        success: false,
      },
      { status: 500 }
    );
  }
}

