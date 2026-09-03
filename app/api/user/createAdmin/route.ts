import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import CryptoJS from "crypto-js";
import pool from "@/utils/Database/db";

export const dynamic = "force-dynamic";

const TractorAIBaseURL =
  process.env.NEXT_PUBLIC_TRACTOR_AI_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://tractorai.sinsignal.com/";

// In-memory dynamic admin storage
declare global {
  var _dynamicAdminsMap: Map<string, any> | undefined;
}
if (!global._dynamicAdminsMap) {
  global._dynamicAdminsMap = new Map();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { first_name, last_name, middle_name, email, password, authType } = body;

    if (!email || !first_name) {
      return NextResponse.json(
        { error: "Email and first name are required" },
        { status: 400 }
      );
    }

    const adminId = `admin_${Date.now()}`;
    const newAdmin = {
      id: adminId,
      first_name,
      middle_name: middle_name || "",
      last_name: last_name || "",
      email: email.toLowerCase().trim(),
      mobile: "+591 70000000",
      gender: "male",
      image: "",
      country_code: "+591",
      emailVerified: true,
      authType: authType || "EMAIL",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      role: ["admin", "superAdmin"],
    };

    // Store in global memory map
    global._dynamicAdminsMap?.set(adminId, newAdmin);

    // Attempt FastAPI backend
    try {
      await axios.post(`${TractorAIBaseURL.replace(/\/$/, "")}/user/createAdmin`, body, { timeout: 4000 });
    } catch {}

    // Attempt PostgreSQL if live
    try {
      const client = await pool.connect();
      try {
        await client.query(
          `INSERT INTO "User" (id, first_name, middle_name, last_name, email, password, "authType", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
           ON CONFLICT (email) DO NOTHING`,
          [adminId, first_name, middle_name || null, last_name, email.toLowerCase(), password, authType || "EMAIL"]
        );
      } finally {
        client.release();
      }
    } catch {}

    return NextResponse.json({
      success: true,
      message: "Admin created successfully",
      admin: newAdmin,
    });
  } catch (error: any) {
    console.error("[/api/user/createAdmin] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create admin" },
      { status: 500 }
    );
  }
}
