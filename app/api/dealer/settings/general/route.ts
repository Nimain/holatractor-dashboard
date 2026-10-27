import { getBackendBaseUrl } from "@/utils/api/apiUrl";
import { NextRequest, NextResponse } from "next/server";
import pool from "@/utils/Database/db";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dealerId = searchParams.get("dealer_id") || searchParams.get("dealerId") || "";

    // 1. Try FastAPI backend
    const fastApiUrl = getBackendBaseUrl();
    try {
      const fastUrl = dealerId ? `${fastApiUrl}/dealer/settings/general?dealer_id=${dealerId}` : `${fastApiUrl}/dealer/settings/general`;
      const fastRes = await fetch(fastUrl, {
        cache: "no-store",
      });
      if (fastRes.ok) {
        const data = await fastRes.json();
        return NextResponse.json(data);
      }
    } catch (e) {
      // Fallback to PostgreSQL pool
    }

    // 2. Direct PostgreSQL query
    const client = await pool.connect();
    try {
      let resolvedDealerId = dealerId;
      if (!resolvedDealerId) {
        const dRes = await client.query('SELECT id FROM "Dealer" ORDER BY "createdAt" ASC LIMIT 1');
        if (dRes.rows.length > 0) resolvedDealerId = dRes.rows[0].id;
      }
      const query = `
        SELECT 
          s.id,
          s.dealer_id,
          s.user_id,
          s.display_name,
          s.business_name,
          s.email,
          s.phone,
          s.timezone,
          s.currency,
          s.blocked_ips,
          s.api_token,
          s.two_factor_enabled,
          s.login_alerts,
          s.session_timeout_minutes,
          s.created_at,
          s.updated_at,
          u.first_name,
          u.last_name,
          u.email as user_email,
          u.mobile as user_mobile
        FROM "DealerSettings" s
        LEFT JOIN "Dealer" d ON s.dealer_id = d.id
        LEFT JOIN "User" u ON d.user_id = u.id
        WHERE ($1 = '' OR s.dealer_id = $1)
        LIMIT 1;
      `;
      const res = await client.query(query, [resolvedDealerId || ""]);

      if (res.rows.length > 0) {
        const row = res.rows[0];
        return NextResponse.json({
          success: true,
          settings: {
            id: row.id,
            dealer_id: row.dealer_id,
            user_id: row.user_id || "",
            display_name: row.display_name || "AgroTractor Dealership",
            business_name: row.business_name || "AgroTractor Equipos y Servicios S.R.L.",
            email: row.email || row.user_email || "dealer@holatractor.com",
            phone: row.phone || row.user_mobile || "+591 7761 3811",
            timezone: row.timezone || "America/La_Paz (UTC-04:00)",
            currency: row.currency || "USD",
            blocked_ips: row.blocked_ips || "",
            api_token: row.api_token || `ht_sec_live_${crypto.randomBytes(6).toString("hex")}`,
            two_factor_enabled: Boolean(row.two_factor_enabled),
            login_alerts: Boolean(row.login_alerts),
            session_timeout_minutes: Number(row.session_timeout_minutes || 60),
            updated_at: row.updated_at,
          },
        });
      }

      // Initialize default settings if not exists
      const dUserRes = await client.query(`
        SELECT d.id as dealer_id, d.user_id, u.first_name, u.last_name, u.email, u.mobile
        FROM "Dealer" d
        LEFT JOIN "User" u ON d.user_id = u.id
        WHERE d.id = $1 OR d.user_id = $1
        LIMIT 1;
      `, [dealerId]);

      const dUser = dUserRes.rows[0];
      const realDealerId = dUser?.dealer_id || dealerId;
      const realUserId = dUser?.user_id || `usr_${dealerId.slice(-8)}`;
      const dName = dUser ? `${dUser.first_name || "AgroTractor"} ${dUser.last_name || "Dealer"}`.trim() : "AgroTractor Central";
      const dEmail = dUser?.email || "dealer@holatractor.com";
      const dPhone = dUser?.mobile || "+591 7761 3811";
      const token = `ht_sec_live_${crypto.randomBytes(8).toString("hex")}`;
      const newId = `set_${crypto.randomBytes(4).toString("hex")}`;

      const insertRes = await client.query(`
        INSERT INTO "DealerSettings" (
          id, dealer_id, user_id, display_name, business_name, email, phone, timezone, currency, blocked_ips, api_token, two_factor_enabled, login_alerts, session_timeout_minutes
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, 'America/La_Paz (UTC-04:00)', 'USD', '', $8, TRUE, TRUE, 60
        ) ON CONFLICT (dealer_id) DO UPDATE SET updated_at = NOW()
        RETURNING *;
      `, [newId, realDealerId, realUserId, dName, `${dName} S.R.L.`, dEmail, dPhone, token]);

      return NextResponse.json({
        success: true,
        settings: insertRes.rows[0],
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  return handleUpdate(request);
}

export async function PATCH(request: NextRequest) {
  return handleUpdate(request);
}

async function handleUpdate(request: NextRequest) {
  try {
    const body = await request.json();
    let dealerId = body.dealer_id || body.dealerId || "";

    // 1. Try FastAPI backend
    const fastApiUrl = getBackendBaseUrl();
    try {
      const fastRes = await fetch(`${fastApiUrl}/dealer/settings/general`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, ...(dealerId ? { dealer_id: dealerId } : {}) }),
      });
      if (fastRes.ok) {
        const data = await fastRes.json();
        return NextResponse.json(data);
      }
    } catch (e) {
      // Fallback to PostgreSQL
    }

    // 2. Direct PostgreSQL fallback
    const client = await pool.connect();
    try {
      if (!dealerId) {
        const dRes = await client.query('SELECT id FROM "Dealer" ORDER BY "createdAt" ASC LIMIT 1');
        if (dRes.rows.length > 0) dealerId = dRes.rows[0].id;
      }
      await client.query("BEGIN");
      const updates: string[] = [];
      const values: any[] = [dealerId];
      let pIdx = 2;

      if (body.display_name !== undefined) {
        updates.push(`display_name = $${pIdx++}`);
        values.push(body.display_name);
      }
      if (body.business_name !== undefined) {
        updates.push(`business_name = $${pIdx++}`);
        values.push(body.business_name);
      }
      if (body.email !== undefined) {
        updates.push(`email = $${pIdx++}`);
        values.push(body.email);
      }
      if (body.phone !== undefined) {
        updates.push(`phone = $${pIdx++}`);
        values.push(body.phone);
      }
      if (body.timezone !== undefined) {
        updates.push(`timezone = $${pIdx++}`);
        values.push(body.timezone);
      }
      if (body.currency !== undefined) {
        updates.push(`currency = $${pIdx++}`);
        values.push(body.currency);
      }
      if (body.blocked_ips !== undefined) {
        updates.push(`blocked_ips = $${pIdx++}`);
        values.push(body.blocked_ips);
      }
      if (body.regenerate_token) {
        const newTok = `ht_sec_live_${crypto.randomBytes(8).toString("hex")}`;
        updates.push(`api_token = $${pIdx++}`);
        values.push(newTok);

        await client.query(`
          INSERT INTO "DealerSecurityLog" (id, dealer_id, event_type, description, ip_address, location, status, created_at)
          VALUES ($1, $2, 'API_KEY_ROTATED', 'Dealership API secret token rotated and reissued', '190.181.42.18', 'Santa Cruz, Bolivia', 'SUCCESS', NOW());
        `, [`log_${crypto.randomBytes(4).toString("hex")}`, dealerId]);
      }

      if (updates.length > 0) {
        updates.push("updated_at = NOW()");
        const sql = `UPDATE "DealerSettings" SET ${updates.join(", ")} WHERE dealer_id = $1 RETURNING *;`;
        await client.query(sql, values);
      }

      if (body.delete_account) {
        const dRow = await client.query('SELECT user_id FROM "Dealer" WHERE id = $1 LIMIT 1;', [dealerId]);
        if (dRow.rows[0]?.user_id) {
          await client.query('UPDATE "User" SET request_to_delete = TRUE, "updatedAt" = NOW() WHERE id = $1;', [dRow.rows[0].user_id]);
        }
      }

      await client.query("COMMIT");

      const fresh = await client.query('SELECT * FROM "DealerSettings" WHERE dealer_id = $1 LIMIT 1;', [dealerId]);
      return NextResponse.json({
        success: true,
        message: "Settings updated successfully",
        settings: fresh.rows[0] || {},
      });
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update settings" },
      { status: 500 }
    );
  }
}
