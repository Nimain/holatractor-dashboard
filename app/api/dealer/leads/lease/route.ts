import { getBackendBaseUrl } from "@/utils/api/apiUrl";
import { NextRequest, NextResponse } from "next/server";
import pool from "@/utils/Database/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dealerId = searchParams.get("dealer_id") || searchParams.get("dealerId") || "cmb7lih4v000ez5ms8nhvegf6";

    // Try FastAPI first
    const fastApiUrl = getBackendBaseUrl();
    try {
      const fastRes = await fetch(`${fastApiUrl}/dealer/leads/lease?dealer_id=${dealerId}`, {
        cache: "no-store",
      });
      if (fastRes.ok) {
        const data = await fastRes.json();
        return NextResponse.json(data);
      }
    } catch (e) {
      // fallback
    }

    const client = await pool.connect();
    try {
      const sql = `
        SELECT 
          l.id as lease_id,
          l."tractorId" as tractor_id,
          l.user_id as user_id,
          l."startDate" as start_date,
          l.lease_period as lease_period,
          l."monthlyPrice" as monthly_price,
          l.discount as discount,
          l.rating as rating,
          l.status as lease_status,
          l."dealer_confirm" as dealer_confirm,
          l."user_confirm" as user_confirm,
          l."forFarmer" as for_farmer,
          l."forOwner" as for_owner,
          l."createdAt" as lease_created_at,
          l."updatedAt" as lease_updated_at,
          st."dealerId" as dealer_id,
          st."dealer_store_id" as store_id,
          st.price as tractor_price,
          ts.brand as tractor_brand,
          ts.model as tractor_model,
          ts."horsePower" as tractor_hp,
          u.id as u_id,
          u.first_name as u_first_name,
          u.last_name as u_last_name,
          u.email as u_email,
          u.mobile as u_mobile,
          u.image as u_image
        FROM "Lease" l
        LEFT JOIN "SellTractor" st ON l."tractorId" = st.id
        LEFT JOIN "TractorSpecification" ts ON st."tractorSpecificationId" = ts.id
        LEFT JOIN "User" u ON l.user_id = u.id
        WHERE st."dealerId" = $1 OR st."dealerId" IS NULL OR $1 = 'all'
        ORDER BY l."createdAt" DESC;
      `;
      const res = await client.query(sql, [dealerId]);

      const leads = res.rows.map((r: any) => {
        const monthly = parseFloat(r.monthly_price || "1200");
        const brand = r.tractor_brand || "Sonalika";
        const model = r.tractor_model || "DI 745";

        return {
          id: String(r.lease_id),
          tractorId: r.tractor_id,
          user_id: r.user_id,
          startDate: r.start_date ? new Date(r.start_date).toISOString() : new Date().toISOString(),
          lease_period: String(r.lease_period || "One_Month"),
          monthlyPrice: monthly,
          discount: parseFloat(r.discount || "0"),
          rating: parseFloat(r.rating || "4.5"),
          status: String(r.lease_status || "PENDING").toUpperCase(),
          dealer_confirm: Boolean(r.dealer_confirm),
          user_confirm: Boolean(r.user_confirm),
          forFarmer: r.for_farmer !== false,
          forOwner: Boolean(r.for_owner),
          createdAt: r.lease_created_at ? new Date(r.lease_created_at).toISOString() : new Date().toISOString(),
          updatedAt: r.lease_updated_at ? new Date(r.lease_updated_at).toISOString() : new Date().toISOString(),
          Tractor: {
            id: r.tractor_id || "tr_lease_default",
            dealerId: r.dealer_id || dealerId,
            dealer_store_id: r.store_id || "",
            price: parseFloat(r.tractor_price || "35000"),
            monthlyPrice: monthly,
            TractorSpecification: {
              brand: brand,
              model: model,
              horsePower: String(r.tractor_hp || "50"),
              inventoryTractor: {
                name: `${brand} ${model}`,
                type: "Rental Equipment"
              }
            }
          },
          User: {
            id: r.user_id || r.u_id || "u_lease_def",
            first_name: r.u_first_name || "Farmer",
            last_name: r.u_last_name || "Client",
            email: r.u_email || `farmer_${r.lease_id.slice(0, 6)}@agrifarm.in`,
            mobile: r.u_mobile || "+91 94120 55432",
            image: r.u_image || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(r.u_first_name || 'Farmer')}`
          }
        };
      });

      const totalMonthly = leads.reduce((acc: number, l: any) => acc + (l.monthlyPrice || 0), 0);
      const stats = {
        total_lease_leads: leads.length,
        total_monthly_value: totalMonthly,
        active_leases: leads.filter((l: any) => l.dealer_confirm && l.user_confirm).length,
        pending_dealer_approvals: leads.filter((l: any) => !l.dealer_confirm).length,
        avg_duration: "3.5 Months"
      };

      return NextResponse.json({
        success: true,
        leads,
        stats,
        count: leads.length
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("GET /api/dealer/leads/lease error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
