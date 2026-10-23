import { NextRequest, NextResponse } from "next/server";
import pool from "@/utils/Database/db";
import { getBackendBaseUrl } from "@/utils/Axios/RenderInstance";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const dealerId = params.id;
  const baseUrl = getBackendBaseUrl();

  try {
    const fastRes = await fetch(`${baseUrl}/dealer/leads/lease?dealer_id=${dealerId}`, {
      cache: "no-store",
    });
    if (fastRes.ok) {
      const data = await fastRes.json();
      return NextResponse.json(data.leads || data);
    }
  } catch (e) {
    // Fallback to PostgreSQL database query
  }

  try {
    const client = await pool.connect();
    try {
      const sql = `
        SELECT 
          tll.id as lead_id,
          tll.name as lead_name,
          tll.city as lead_city,
          tll.mobile as lead_mobile,
          tll.timeframe as lead_timeframe,
          tll."createdAt" as lead_created_at,
          tll."tractorId" as tractor_id,
          tll.user_id as user_id,
          lt.id as lt_id,
          lt."monthlyPrice" as monthly_price,
          ts.brand as tractor_brand,
          ts.model as tractor_model
        FROM "TractorLeaseLead" tll
        LEFT JOIN "LeaseTractor" lt ON tll."tractorId" = lt.id
        LEFT JOIN "TractorSpecification" ts ON lt."tractorSpecificationId" = ts.id
        WHERE lt."dealerId" = $1 OR lt."dealerId" IS NULL OR $1 = 'all'
        ORDER BY tll."createdAt" DESC
        LIMIT 50;
      `;
      const res = await client.query(sql, [dealerId]);
      return NextResponse.json(res.rows);
    } finally {
      client.release();
    }
  } catch (dbErr: any) {
    return NextResponse.json([]);
  }
}
