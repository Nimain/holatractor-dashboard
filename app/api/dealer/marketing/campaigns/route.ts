import { getBackendBaseUrl } from "@/utils/api/apiUrl";
import { NextRequest, NextResponse } from "next/server";
import pool from "@/utils/Database/db";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dealerId = searchParams.get("dealer_id") || searchParams.get("dealerId") || "cmb7lih4v000ez5ms8nhvegf6";
    const status = searchParams.get("status");
    const channel = searchParams.get("channel");
    const search = (searchParams.get("search") || "").trim().toLowerCase();

    // Try FastAPI first
    const fastApiUrl = getBackendBaseUrl();
    try {
      const qParams = new URLSearchParams();
      if (dealerId) qParams.append("dealer_id", dealerId);
      if (status) qParams.append("status", status);
      if (channel) qParams.append("channel", channel);
      if (search) qParams.append("search", search);

      const fastRes = await fetch(`${fastApiUrl}/dealer/marketing/campaigns?${qParams.toString()}`, {
        cache: "no-store",
      });
      if (fastRes.ok) {
        const data = await fastRes.json();
        return NextResponse.json(data);
      }
    } catch (e) {
      // fallback to direct Postgres
    }

    const client = await pool.connect();
    try {
      const whereClauses: string[] = ["(dealer_id = $1 OR dealer_id IS NULL)"];
      const params: any[] = [dealerId];
      let pIdx = 2;

      if (status && status.toLowerCase() !== "all") {
        whereClauses.push(`LOWER(status) = $${pIdx++}`);
        params.push(status.toLowerCase());
      }

      if (channel && channel.toLowerCase() !== "all") {
        whereClauses.push(`channel ILIKE $${pIdx++}`);
        params.push(`%${channel}%`);
      }

      if (search) {
        whereClauses.push(`(name ILIKE $${pIdx} OR target_audience ILIKE $${pIdx} OR description ILIKE $${pIdx})`);
        params.push(`%${search}%`);
        pIdx++;
      }

      const whereSql = whereClauses.join(" AND ");
      const listSql = `
        SELECT 
          id, dealer_id, name, type, channel, target_audience, status,
          budget, spend, start_date, end_date, impressions, clicks,
          leads_generated, conversions, revenue_generated, roi,
          description, creative_image_url, created_at, updated_at
        FROM "DealerMarketingCampaign"
        WHERE ${whereSql}
        ORDER BY created_at DESC;
      `;
      const listRes = await client.query(listSql, params);

      const statsSql = `
        SELECT 
          COUNT(*) as total_campaigns,
          COUNT(*) FILTER (WHERE LOWER(status) = 'active') as active_count,
          COUNT(*) FILTER (WHERE LOWER(status) = 'paused') as paused_count,
          COUNT(*) FILTER (WHERE LOWER(status) = 'completed') as completed_count,
          COALESCE(SUM(budget), 0) as total_budget,
          COALESCE(SUM(spend), 0) as total_spend,
          COALESCE(SUM(impressions), 0) as total_impressions,
          COALESCE(SUM(clicks), 0) as total_clicks,
          COALESCE(SUM(leads_generated), 0) as total_leads,
          COALESCE(SUM(conversions), 0) as total_conversions,
          COALESCE(SUM(revenue_generated), 0) as total_revenue,
          COALESCE(AVG(roi), 0) as avg_roi
        FROM "DealerMarketingCampaign"
        WHERE dealer_id = $1 OR dealer_id IS NULL;
      `;
      const statsRes = await client.query(statsSql, [dealerId]);
      const s = statsRes.rows[0] || {};

      const campaigns = listRes.rows.map((r: any) => ({
        id: String(r.id),
        dealer_id: String(r.dealer_id),
        name: String(r.name),
        type: String(r.type || "Social Media Ads"),
        channel: String(r.channel || "Meta (Facebook & Instagram)"),
        target_audience: String(r.target_audience || "Tractor Owners"),
        status: String(r.status || "ACTIVE").toUpperCase(),
        budget: parseFloat(r.budget || "0"),
        spend: parseFloat(r.spend || "0"),
        start_date: r.start_date ? new Date(r.start_date).toISOString() : new Date().toISOString(),
        end_date: r.end_date ? new Date(r.end_date).toISOString() : null,
        impressions: parseInt(r.impressions || "0", 10),
        clicks: parseInt(r.clicks || "0", 10),
        leads_generated: parseInt(r.leads_generated || "0", 10),
        conversions: parseInt(r.conversions || "0", 10),
        revenue_generated: parseFloat(r.revenue_generated || "0"),
        roi: parseFloat(r.roi || "0"),
        description: r.description ? String(r.description) : "",
        creative_image_url: r.creative_image_url ? String(r.creative_image_url) : "",
        created_at: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
      }));

      const stats = {
        total_campaigns: parseInt(s.total_campaigns || "0", 10),
        active_campaigns: parseInt(s.active_count || "0", 10),
        paused_campaigns: parseInt(s.paused_count || "0", 10),
        completed_campaigns: parseInt(s.completed_count || "0", 10),
        total_budget: parseFloat(s.total_budget || "0"),
        total_spend: parseFloat(s.total_spend || "0"),
        total_impressions: parseInt(s.total_impressions || "0", 10),
        total_clicks: parseInt(s.total_clicks || "0", 10),
        total_leads_generated: parseInt(s.total_leads || "0", 10),
        total_conversions: parseInt(s.total_conversions || "0", 10),
        total_revenue_generated: parseFloat(s.total_revenue || "0"),
        avg_roi: parseFloat(parseFloat(s.avg_roi || "0").toFixed(1)),
      };

      return NextResponse.json({
        success: true,
        campaigns,
        stats,
        count: campaigns.length,
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("GET /api/dealer/marketing/campaigns error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      dealer_id = "cmb7lih4v000ez5ms8nhvegf6",
      name,
      type = "Social Media Ads",
      channel = "Meta (Facebook & Instagram)",
      target_audience = "Tractor Owners & Farmers",
      budget = 10000.0,
      spend = 0.0,
      start_date,
      end_date,
      status = "ACTIVE",
      description = "",
      creative_image_url = "",
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: "Campaign name is required" }, { status: 400 });
    }

    const campaignId = `cmp_${crypto.randomBytes(5).toString("hex")}`;
    const sDate = start_date ? new Date(start_date) : new Date();
    const eDate = end_date ? new Date(end_date) : new Date(Date.now() + 30 * 86400000);
    const imgUrl = creative_image_url || "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=600&auto=format&fit=crop&q=80";

    const client = await pool.connect();
    try {
      const sql = `
        INSERT INTO "DealerMarketingCampaign" (
          id, dealer_id, name, type, channel, target_audience, status,
          budget, spend, start_date, end_date, impressions, clicks,
          leads_generated, conversions, revenue_generated, roi,
          description, creative_image_url, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11, 0, 0, 0, 0, 0, 0,
          $12, $13, NOW(), NOW()
        ) RETURNING id;
      `;
      const res = await client.query(sql, [
        campaignId,
        dealer_id,
        name.trim(),
        type,
        channel,
        target_audience,
        status.toUpperCase(),
        parseFloat(budget) || 10000.0,
        parseFloat(spend) || 0.0,
        sDate,
        eDate,
        description,
        imgUrl,
      ]);

      return NextResponse.json({
        success: true,
        message: "Campaign launched successfully",
        campaign_id: res.rows[0].id,
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("POST /api/dealer/marketing/campaigns error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
