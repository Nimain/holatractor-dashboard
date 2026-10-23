import { getBackendBaseUrl } from "@/utils/api/apiUrl";
import { NextRequest, NextResponse } from "next/server";
import pool from "@/utils/Database/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dealerId = searchParams.get("dealer_id") || "cmb7lih4v000ez5ms8nhvegf6";

    const fastApiUrl = getBackendBaseUrl();

    // 1. Try FastAPI
    try {
      const fastRes = await fetch(`${fastApiUrl}/dealer/notifications/settings?dealer_id=${dealerId}`, {
        cache: "no-store",
      });
      if (fastRes.ok) {
        const data = await fastRes.json();
        return NextResponse.json(data);
      }
    } catch (e) {
      // Fallback
    }

    // 2. Direct PostgreSQL fallback
    const client = await pool.connect();
    try {
      const res = await client.query(`
        SELECT id, dealer_id, user_id, desktop_notification, unread_badge,
               push_timeout, communication_emails, announcements_updates,
               disable_all_sounds, lead_alerts, repair_alerts, marketing_alerts,
               created_at, updated_at
        FROM "DealerNotificationSettings"
        WHERE dealer_id = $1
        LIMIT 1;
      `, [dealerId]);

      if (res.rows.length === 0) {
        return NextResponse.json({
          success: true,
          settings: {
            id: "dns_default",
            dealer_id: dealerId,
            desktopNotification: true,
            unreadBadge: true,
            pushTimeout: "10 Minutes",
            communicationEmails: true,
            announcementsUpdates: true,
            disableAllSounds: false,
            leadAlerts: true,
            repairAlerts: true,
            marketingAlerts: true,
          }
        });
      }

      const row = res.rows[0];
      return NextResponse.json({
        success: true,
        settings: {
          id: row.id,
          dealer_id: row.dealer_id,
          user_id: row.user_id,
          desktopNotification: Boolean(row.desktop_notification),
          unreadBadge: Boolean(row.unread_badge),
          pushTimeout: row.push_timeout || "10 Minutes",
          communicationEmails: Boolean(row.communication_emails),
          announcementsUpdates: Boolean(row.announcements_updates),
          disableAllSounds: Boolean(row.disable_all_sounds),
          leadAlerts: Boolean(row.lead_alerts),
          repairAlerts: Boolean(row.repair_alerts),
          marketingAlerts: Boolean(row.marketing_alerts),
          created_at: row.created_at,
          updated_at: row.updated_at,
        }
      });
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error("Notification settings GET error:", err);
    return NextResponse.json({
      success: true,
      settings: {
        desktopNotification: true,
        unreadBadge: true,
        pushTimeout: "10 Minutes",
        communicationEmails: true,
        announcementsUpdates: true,
        disableAllSounds: false,
        leadAlerts: true,
        repairAlerts: true,
        marketingAlerts: true,
      },
      fallback: true
    });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const dealerId = body.dealer_id || "cmb7lih4v000ez5ms8nhvegf6";

    const fastApiUrl = getBackendBaseUrl();

    // 1. Try FastAPI
    try {
      const fastRes = await fetch(`${fastApiUrl}/dealer/notifications/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, dealer_id: dealerId }),
      });
      if (fastRes.ok) {
        const data = await fastRes.json();
        return NextResponse.json(data);
      }
    } catch (e) {
      // Fallback
    }

    // 2. Direct PostgreSQL fallback
    const client = await pool.connect();
    try {
      const updates: string[] = [];
      const values: any[] = [];
      let idx = 1;

      if (body.desktop_notification !== undefined || body.desktopNotification !== undefined) {
        updates.push(`desktop_notification = $${idx++}`);
        values.push(body.desktop_notification ?? body.desktopNotification);
      }
      if (body.unread_badge !== undefined || body.unreadBadge !== undefined) {
        updates.push(`unread_badge = $${idx++}`);
        values.push(body.unread_badge ?? body.unreadBadge);
      }
      if (body.push_timeout !== undefined || body.pushTimeout !== undefined) {
        updates.push(`push_timeout = $${idx++}`);
        values.push(body.push_timeout ?? body.pushTimeout);
      }
      if (body.communication_emails !== undefined || body.communicationEmails !== undefined) {
        updates.push(`communication_emails = $${idx++}`);
        values.push(body.communication_emails ?? body.communicationEmails);
      }
      if (body.announcements_updates !== undefined || body.announcementsUpdates !== undefined) {
        updates.push(`announcements_updates = $${idx++}`);
        values.push(body.announcements_updates ?? body.announcementsUpdates);
      }
      if (body.disable_all_sounds !== undefined || body.disableAllSounds !== undefined) {
        updates.push(`disable_all_sounds = $${idx++}`);
        values.push(body.disable_all_sounds ?? body.disableAllSounds);
      }
      if (body.lead_alerts !== undefined || body.leadAlerts !== undefined) {
        updates.push(`lead_alerts = $${idx++}`);
        values.push(body.lead_alerts ?? body.leadAlerts);
      }
      if (body.repair_alerts !== undefined || body.repairAlerts !== undefined) {
        updates.push(`repair_alerts = $${idx++}`);
        values.push(body.repair_alerts ?? body.repairAlerts);
      }
      if (body.marketing_alerts !== undefined || body.marketingAlerts !== undefined) {
        updates.push(`marketing_alerts = $${idx++}`);
        values.push(body.marketing_alerts ?? body.marketingAlerts);
      }

      if (updates.length > 0) {
        updates.push(`updated_at = NOW()`);
        values.push(dealerId);

        await client.query(`
          UPDATE "DealerNotificationSettings"
          SET ${updates.join(", ")}
          WHERE dealer_id = $${idx};
        `, values);
      }

      return NextResponse.json({ success: true, message: "Settings saved successfully" });
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error("Notification settings PUT error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  return PUT(request);
}
