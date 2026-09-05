import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import pool from "@/utils/Database/db";
import { getFastApiAuthHeaders } from "@/utils/auth/serverAuth";

export const dynamic = "force-dynamic";

const FastApiEndpoints = [
  "http://127.0.0.1:8000",
  process.env.NEXT_PUBLIC_TRACTOR_AI_URL || "",
  process.env.NEXT_PUBLIC_API_URL || "",
  "https://tractorai.sinsignal.com",
].filter(Boolean);

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const farmId = params.id;
    const adminHeaders = getFastApiAuthHeaders(request);

    // 1. Try FastAPI /farm/:id (localhost first)
    for (const baseUrl of FastApiEndpoints) {
      try {
        const cleanBase = baseUrl.replace(/\/$/, "");
        const fastRes = await axios.get(`${cleanBase}/farm/${farmId}`, {
          headers: adminHeaders,
          timeout: 4000,
        });
        if (fastRes.data) {
          return NextResponse.json(fastRes.data, { status: 200 });
        }
      } catch {}
    }

    // 2. Direct PostgreSQL query
    try {
      const dbRes = await pool.query(
        `SELECT id, owner_id, name, description, location, soil_type, crops, type, boundary_coordinates, area_sqm, created_at, updated_at
         FROM farms
         WHERE id::text = $1 OR owner_id = $1
         LIMIT 1;`,
        [farmId]
      );
      if (dbRes.rows.length > 0) {
        const row = dbRes.rows[0];
        const rawCoords = row.boundary_coordinates || [];
        const coordinates = Array.isArray(rawCoords)
          ? rawCoords.map((c: any) => ({
              lat: String(c.lat ?? (Array.isArray(c) ? c[1] : "")),
              lan: String(c.lan ?? c.lng ?? (Array.isArray(c) ? c[0] : "")),
              lng: String(c.lng ?? c.lan ?? (Array.isArray(c) ? c[0] : "")),
            }))
          : [];

        const areaHa = Number(row.area_sqm || 0) / 10000;
        return NextResponse.json({
          id: String(row.id),
          owner_id: String(row.owner_id),
          name: row.name,
          description: row.description,
          location: row.location,
          soil_type: row.soil_type,
          crops: row.crops,
          type: row.type || "polygon",
          boundary: {
            coordinates,
            area: row.area_sqm,
            area_hectares: areaHa,
            point_count: coordinates.length,
          },
          created_at: row.created_at,
          updated_at: row.updated_at,
        });
      }
    } catch {}

    return NextResponse.json(
      { message: "Farm not found", success: false },
      { status: 404 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || "Internal server error", success: false },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const farmId = params.id;
    const body = await request.json();
    const adminHeaders = getFastApiAuthHeaders(request);

    // 1. Try FastAPI /farm/:id (localhost first)
    for (const baseUrl of FastApiEndpoints) {
      try {
        const cleanBase = baseUrl.replace(/\/$/, "");
        const fastRes = await axios.put(
          `${cleanBase}/farm/${farmId}`,
          body,
          { headers: adminHeaders, timeout: 6000 }
        );
        return NextResponse.json(fastRes.data, { status: fastRes.status });
      } catch {}
    }

    // 2. Direct PostgreSQL update
    try {
      await pool.query(
        `UPDATE farms SET
          name = COALESCE($1, name),
          description = COALESCE($2, description),
          location = COALESCE($3, location),
          soil_type = COALESCE($4, soil_type),
          updated_at = NOW()
        WHERE id::text = $5;`,
        [body.name, body.description, body.location, body.soil_type, farmId]
      );
    } catch {}

    return NextResponse.json({
      success: true,
      message: "Farm updated successfully",
      id: farmId,
      ...body,
    });
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || "Internal server error", success: false },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const farmId = params.id;
    const adminHeaders = getFastApiAuthHeaders(request);

    // 1. Try FastAPI /farm/:id (localhost first)
    for (const baseUrl of FastApiEndpoints) {
      try {
        const cleanBase = baseUrl.replace(/\/$/, "");
        const fastRes = await axios.delete(
          `${cleanBase}/farm/${farmId}`,
          { headers: adminHeaders, timeout: 6000 }
        );
        return NextResponse.json(fastRes.data, { status: fastRes.status });
      } catch {}
    }

    // 2. Direct PostgreSQL delete
    try {
      await pool.query(`DELETE FROM farms WHERE id::text = $1;`, [farmId]);
      await pool.query(`DELETE FROM "Farm" WHERE id = $1;`, [farmId]);
    } catch {}

    return NextResponse.json({
      success: true,
      message: "Farm deleted successfully",
      id: farmId,
    });
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || "Internal server error", success: false },
      { status: 500 }
    );
  }
}
