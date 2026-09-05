import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import pool from "@/utils/Database/db";
import { getFastApiAuthHeaders } from "@/utils/auth/serverAuth";

export const dynamic = "force-dynamic";

const FastApiBaseURL =
  process.env.NEXT_PUBLIC_TRACTOR_AI_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://tractorai.sinsignal.com/";

export async function GET(request: NextRequest) {
  try {
    const headers = getFastApiAuthHeaders(request);
    const fastApiBase = FastApiBaseURL.replace(/\/$/, "");

    // 1. Primary: Fetch Live Dynamic Counts from FastAPI (/dashboard-counts or /stats)
    try {
      const fastApiRes = await axios.get(
        `${fastApiBase}/api/v1/admin/dashboard-counts`,
        { headers, timeout: 6000 }
      );

      const s = fastApiRes.data;
      if (s && typeof s === "object" && (s.farmers !== undefined || s.farmers_count !== undefined)) {
        return NextResponse.json({
          farmers: Number(s.farmers ?? s.farmers_count ?? 0),
          operators: Number(s.operators ?? s.operators_count ?? 0),
          agents: Number(s.agents ?? s.dealers ?? s.agents_count ?? 0),
          owners: Number(s.owners ?? s.owners_count ?? 0),
          maleFarmers: Number(s.maleFarmers ?? s.male_farmers ?? s.male_farmers_count ?? 0),
          femaleFarmers: Number(s.femaleFarmers ?? s.female_farmers ?? s.female_farmers_count ?? 0),
          otherFarmers: Number(s.otherFarmers ?? s.other_farmers ?? s.other_farmers_count ?? 0),
        });
      }
    } catch (fastErr: any) {
      // Try alternative stats endpoint
      try {
        const statsRes = await axios.get(
          `${fastApiBase}/api/v1/admin/stats`,
          { headers, timeout: 6000 }
        );
        const s = statsRes.data;
        if (s && typeof s === "object" && s.farmers_count !== undefined) {
          return NextResponse.json({
            farmers: Number(s.farmers_count ?? 0),
            operators: Number(s.operators_count ?? 0),
            agents: Number(s.agents_count ?? 0),
            owners: Number(s.owners_count ?? 0),
            maleFarmers: Number(s.male_farmers_count ?? 0),
            femaleFarmers: Number(s.female_farmers_count ?? 0),
            otherFarmers: Number(s.other_farmers_count ?? 0),
          });
        }
      } catch (_) {}
    }

    // 2. Secondary: Direct Dynamic Database Query (No Hardcoded Fallbacks)
    try {
      const client = await pool.connect();
      try {
        const res = await client.query(`
          SELECT 
            (SELECT COUNT(*) FROM "Operator") as operators,
            (SELECT COUNT(*) FROM "Dealer") as dealers,
            (SELECT COUNT(*) FROM "Agent") as agents,
            (SELECT COUNT(*) FROM "Owner") as owners,
            (SELECT COUNT(DISTINCT user_id) FROM "Farmer") as farmers_count,
            (SELECT COUNT(*) FROM "User" u WHERE LOWER(COALESCE(u.gender, '')) = 'female' AND (u.id IN (SELECT user_id FROM "Farmer") OR u.id IN (SELECT owner_id FROM "Farm"))) as female_farmers,
            (SELECT COUNT(*) FROM "User" u WHERE LOWER(COALESCE(u.gender, '')) = 'male' AND (u.id IN (SELECT user_id FROM "Farmer") OR u.id IN (SELECT owner_id FROM "Farm"))) as male_farmers
        `);

        if (res.rows.length > 0) {
          const row = res.rows[0];
          const totalFarmers = Number(row.farmers_count || 0);
          const male = Number(row.male_farmers || 0);
          const female = Number(row.female_farmers || 0);
          const other = Math.max(0, totalFarmers - (male + female));

          return NextResponse.json({
            farmers: totalFarmers,
            operators: Number(row.operators || 0),
            agents: Number(row.dealers || row.agents || 0),
            owners: Number(row.owners || 0),
            maleFarmers: male,
            femaleFarmers: female,
            otherFarmers: other,
          });
        }
      } finally {
        client.release();
      }
    } catch (dbErr: any) {
      console.warn("[/api/user/charts/userCounts] DB query notice:", dbErr?.message);
    }

    return NextResponse.json({
      farmers: 0,
      operators: 0,
      agents: 0,
      owners: 0,
      maleFarmers: 0,
      femaleFarmers: 0,
      otherFarmers: 0,
    });
  } catch (error: any) {
    console.error("[/api/user/charts/userCounts] Error:", error?.message);
    return NextResponse.json(
      {
        farmers: 0,
        operators: 0,
        agents: 0,
        owners: 0,
        maleFarmers: 0,
        femaleFarmers: 0,
        otherFarmers: 0,
      },
      { status: 500 }
    );
  }
}

