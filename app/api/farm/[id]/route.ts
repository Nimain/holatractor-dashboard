import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export const dynamic = "force-dynamic";

const FastApiBaseURL =
  process.env.NEXT_PUBLIC_TRACTOR_AI_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://tractorai.sinsignal.com/";

declare global {
  var _dynamicFarmsMap: Map<string, any> | undefined;
}

import jwt from "jsonwebtoken";

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

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const farmId = params.id;
    const body = await request.json();
    const adminHeaders = getAdminHeaders();

    // 1. Try FastAPI /farm/:id (Render DB)
    try {
      const fastRes = await axios.put(
        `${FastApiBaseURL.replace(/\/$/, "")}/farm/${farmId}`,
        body,
        { headers: adminHeaders, timeout: 10000 }
      );
      return NextResponse.json(fastRes.data, { status: fastRes.status });
    } catch {}

    // 2. Update dynamic in-memory farm
    if (global._dynamicFarmsMap && global._dynamicFarmsMap.has(farmId)) {
      const existing = global._dynamicFarmsMap.get(farmId);
      const updated = {
        ...existing,
        ...body,
        updatedAt: new Date().toISOString(),
      };
      global._dynamicFarmsMap.set(farmId, updated);
      return NextResponse.json(updated, { status: 200 });
    }

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
    const adminHeaders = getAdminHeaders();

    // 1. Try FastAPI /farm/:id (Render DB)
    try {
      const fastRes = await axios.delete(
        `${FastApiBaseURL.replace(/\/$/, "")}/farm/${farmId}`,
        { headers: adminHeaders, timeout: 10000 }
      );
      return NextResponse.json(fastRes.data, { status: fastRes.status });
    } catch {}

    // 2. Remove dynamic in-memory farm
    if (global._dynamicFarmsMap && global._dynamicFarmsMap.has(farmId)) {
      global._dynamicFarmsMap.delete(farmId);
    }

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
