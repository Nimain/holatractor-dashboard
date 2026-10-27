import { NextRequest, NextResponse } from "next/server";
import pool from "@/utils/Database/db";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawDealerId = searchParams.get("dealer_id") || searchParams.get("dealerId") || "";
    let dealerId = rawDealerId && rawDealerId !== "all" && rawDealerId !== "undefined" && rawDealerId !== "null" ? rawDealerId : "";

    if (!dealerId) {
      try {
        const directDealerId = request.cookies.get("dealer_id")?.value;
        if (directDealerId && directDealerId !== "all") dealerId = directDealerId;
        else {
          const userCookie = request.cookies.get("user")?.value;
          if (userCookie) {
            const parsed = JSON.parse(decodeURIComponent(userCookie));
            dealerId = parsed?.dealer_id || parsed?.dealerId || parsed?.userId || parsed?.id || "";
          }
        }
      } catch {}
    }

    const ratingParam = searchParams.get("rating");
    const sentiment = searchParams.get("sentiment");
    const status = searchParams.get("status");
    const serviceType = searchParams.get("service_type");
    const search = (searchParams.get("search") || "").trim().toLowerCase();

    const client = await pool.connect();
    try {
      const whereClauses: string[] = [
        dealerId
          ? `(
              dealer_id = $1 
              OR dealer_id = CONCAT('dlr_', $1::text)
              OR dealer_id IN (SELECT id FROM "Dealer" WHERE user_id = $1 OR id = $1)
              OR dealer_id IN (SELECT user_id FROM "Dealer" WHERE id = $1 OR user_id = $1)
            )`
          : "1=0"
      ];
      const params: any[] = dealerId ? [dealerId] : [];
      let pIdx = dealerId ? 2 : 1;

      if (ratingParam) {
        whereClauses.push(`rating >= $${pIdx++}`);
        params.push(parseFloat(ratingParam));
      }

      if (sentiment && sentiment.toLowerCase() !== "all") {
        whereClauses.push(`LOWER(sentiment) = $${pIdx++}`);
        params.push(sentiment.toLowerCase());
      }

      if (status && status.toLowerCase() !== "all") {
        whereClauses.push(`LOWER(status) = $${pIdx++}`);
        params.push(status.toLowerCase());
      }

      if (serviceType && serviceType.toLowerCase() !== "all") {
        whereClauses.push(`LOWER(service_type) = $${pIdx++}`);
        params.push(serviceType.toLowerCase());
      }

      if (search) {
        whereClauses.push(`(
          customer_name ILIKE $${pIdx} OR 
          title ILIKE $${pIdx} OR 
          comment ILIKE $${pIdx} OR 
          customer_email ILIKE $${pIdx}
        )`);
        params.push(`%${search}%`);
        pIdx++;
      }

      const whereSql = whereClauses.join(" AND ");

      const listSql = `
        SELECT 
          id, dealer_id, customer_id, customer_name, customer_email, customer_phone,
          customer_avatar, store_id, service_type, rating, title, comment,
          sentiment, status, dealer_reply, dealer_replied_at, created_at, updated_at
        FROM "DealerCustomerFeedback"
        WHERE ${whereSql}
        ORDER BY created_at DESC;
      `;

      const listRes = await client.query(listSql, params);

      const statsSql = `
        SELECT 
          COUNT(*) as total_reviews,
          COALESCE(AVG(rating), 0) as average_rating,
          COUNT(*) FILTER (WHERE rating >= 4.5) as star_5,
          COUNT(*) FILTER (WHERE rating >= 3.5 AND rating < 4.5) as star_4,
          COUNT(*) FILTER (WHERE rating >= 2.5 AND rating < 3.5) as star_3,
          COUNT(*) FILTER (WHERE rating >= 1.5 AND rating < 2.5) as star_2,
          COUNT(*) FILTER (WHERE rating < 1.5) as star_1,
          COUNT(*) FILTER (WHERE LOWER(sentiment) = 'positive') as positive_count,
          COUNT(*) FILTER (WHERE LOWER(sentiment) = 'neutral') as neutral_count,
          COUNT(*) FILTER (WHERE LOWER(sentiment) = 'negative') as negative_count,
          COUNT(*) FILTER (WHERE dealer_reply IS NOT NULL AND dealer_reply != '') as replied_count
        FROM "DealerCustomerFeedback"
        WHERE dealer_id = $1 OR dealer_id IS NULL;
      `;
      const statsRes = await client.query(statsSql, [dealerId]);
      const s = statsRes.rows[0] || {};
      const totalRevs = parseInt(s.total_reviews || "0", 10);
      const avgRating = parseFloat(parseFloat(s.average_rating || "0").toFixed(1));
      const repliedCount = parseInt(s.replied_count || "0", 10);
      const responseRate = totalRevs > 0 ? parseFloat(((repliedCount / totalRevs) * 100).toFixed(1)) : 0;

      const feedbacks = listRes.rows.map((r: any) => ({
        id: String(r.id),
        dealer_id: String(r.dealer_id || ""),
        customer_id: r.customer_id ? String(r.customer_id) : null,
        customer_name: String(r.customer_name || ""),
        customer_email: r.customer_email ? String(r.customer_email) : null,
        customer_phone: r.customer_phone ? String(r.customer_phone) : null,
        customer_avatar: r.customer_avatar ? String(r.customer_avatar) : null,
        store_id: r.store_id ? String(r.store_id) : null,
        service_type: String(r.service_type || "General Service"),
        rating: parseFloat(r.rating || 5),
        title: String(r.title || ""),
        comment: String(r.comment || ""),
        sentiment: String(r.sentiment || "POSITIVE"),
        status: String(r.status || "PUBLISHED"),
        dealer_reply: r.dealer_reply ? String(r.dealer_reply) : null,
        dealer_replied_at: r.dealer_replied_at ? new Date(r.dealer_replied_at).toISOString() : null,
        created_at: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
        updated_at: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString(),
      }));

      const stats = {
        total_reviews: totalRevs,
        average_rating: avgRating,
        response_rate: responseRate,
        pending_replies: totalRevs - repliedCount,
        distribution: {
          "5": parseInt(s.star_5 || "0", 10),
          "4": parseInt(s.star_4 || "0", 10),
          "3": parseInt(s.star_3 || "0", 10),
          "2": parseInt(s.star_2 || "0", 10),
          "1": parseInt(s.star_1 || "0", 10),
        },
        sentiment_breakdown: {
          positive: parseInt(s.positive_count || "0", 10),
          neutral: parseInt(s.neutral_count || "0", 10),
          negative: parseInt(s.negative_count || "0", 10),
        },
      };

      return NextResponse.json({
        success: true,
        feedbacks,
        stats,
        count: feedbacks.length,
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("GET /api/dealer/customer-feedback error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch customer feedback" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      dealer_id = "cmb7lih4v000ez5ms8nhvegf6",
      customer_id = null,
      customer_name,
      customer_email = null,
      customer_phone = null,
      customer_avatar = null,
      store_id = null,
      service_type = "General Service",
      rating = 5.0,
      title = null,
      comment,
      status = "PUBLISHED",
    } = body;

    if (!customer_name || !comment) {
      return NextResponse.json(
        { success: false, error: "customer_name and comment are required" },
        { status: 400 }
      );
    }

    const numRating = parseFloat(rating) || 5.0;
    let sentiment = body.sentiment;
    if (!sentiment) {
      if (numRating >= 4.0) sentiment = "POSITIVE";
      else if (numRating >= 3.0) sentiment = "NEUTRAL";
      else sentiment = "NEGATIVE";
    }

    const id = `fb_${crypto.randomBytes(6).toString("hex")}`;
    const avatar = customer_avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(customer_name)}`;
    const reviewTitle = title || `Review by ${customer_name}`;

    const client = await pool.connect();
    try {
      const insertSql = `
        INSERT INTO "DealerCustomerFeedback" (
          id, dealer_id, customer_id, customer_name, customer_email, customer_phone,
          customer_avatar, store_id, service_type, rating, title, comment,
          sentiment, status, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW()
        ) RETURNING id;
      `;
      const res = await client.query(insertSql, [
        id, dealer_id, customer_id, customer_name, customer_email, customer_phone,
        avatar, store_id, service_type, numRating, reviewTitle, comment,
        sentiment.toUpperCase(), status.toUpperCase()
      ]);

      return NextResponse.json({
        success: true,
        message: "Customer feedback recorded successfully",
        feedback_id: res.rows[0].id,
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("POST /api/dealer/customer-feedback error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create customer feedback" },
      { status: 500 }
    );
  }
}
