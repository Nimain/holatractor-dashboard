import { NextRequest, NextResponse } from "next/server";
import pool from "@/utils/Database/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const client = await pool.connect();
    try {
      const query = `
        SELECT 
          cp.id, cp.user_id, cp.package_id, cp.coupon_id, cp.currency_id,
          cp.credit_id, cp.credits_received, cp.original_amount,
          cp.discount_amount, cp.final_amount, cp.payment_method::text as payment_method,
          cp.payment_reference, cp.payment_proof, cp.status::text as status,
          cp.base_id, cp."createdAt", cp."updatedAt",
          u.first_name, u.last_name, u.email, u.mobile,
          pkg.name as package_name, pkg.base_credits, pkg.bonus_credits,
          curr.code as curr_code, curr.symbol as curr_symbol
        FROM "CreditPurchase" cp
        LEFT JOIN "User" u ON u.id = cp.user_id
        LEFT JOIN "CreditPackage" pkg ON pkg.id = cp.package_id
        LEFT JOIN "Currency" curr ON curr.id = cp.currency_id
        ORDER BY cp."createdAt" DESC;
      `;
      const result = await client.query(query);

      const purchases = result.rows.map((r) => {
        const userName = `${r.first_name || ""} ${r.last_name || ""}`.trim() || "User";
        return {
          id: r.id,
          user_id: r.user_id,
          package_id: r.package_id,
          coupon_id: r.coupon_id,
          currency_id: r.currency_id,
          credit_id: r.credit_id,
          credits_received: Number(r.credits_received || 0),
          original_amount: parseFloat(r.original_amount || "0"),
          discount_amount: parseFloat(r.discount_amount || "0"),
          final_amount: parseFloat(r.final_amount || "0"),
          payment_method: r.payment_method || "Qr_code",
          payment_reference: r.payment_reference,
          payment_proof: Array.isArray(r.payment_proof) ? r.payment_proof : [],
          status: r.status || "Pending",
          base_id: r.base_id,
          createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
          updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : new Date().toISOString(),
          user: {
            name: userName,
            email: r.email || "",
            mobile: r.mobile || "",
          },
          package: r.package_name ? {
            name: r.package_name,
            base_credits: Number(r.base_credits || 0),
            bonus_credits: Number(r.bonus_credits || 0),
          } : null,
          currency: r.curr_code ? {
            code: r.curr_code,
            symbol: r.curr_symbol || "$",
          } : null,
        };
      });

      return NextResponse.json(purchases);
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("Error fetching credit purchases:", error);
    return NextResponse.json({ error: "Failed to fetch purchases" }, { status: 500 });
  }
}
