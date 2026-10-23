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
    const fastRes = await fetch(`${baseUrl}/dealer/leads/sales?dealer_id=${dealerId}`, {
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
          tl.id as lead_id,
          tl.name as lead_name,
          tl.city as lead_city,
          tl.mobile as lead_mobile,
          tl.timeframe as lead_timeframe,
          tl."createdAt" as lead_created_at,
          tl."tractorId" as tractor_id,
          tl.user_id as user_id,
          st.id as st_id,
          st.price as tractor_price,
          ts.brand as tractor_brand,
          ts.model as tractor_model
        FROM "TractorLead" tl
        LEFT JOIN "SellTractor" st ON tl."tractorId" = st.id
        LEFT JOIN "TractorSpecification" ts ON st."tractorSpecificationId" = ts.id
        WHERE st."dealerId" = $1 OR st."dealerId" IS NULL OR $1 = 'all'
        ORDER BY tl."createdAt" DESC
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
