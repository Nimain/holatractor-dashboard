import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import pool from "@/utils/Database/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const gpsKey =
      process.env.NEXT_PUBLIC_GPS_API_KEY || "gps_live_1a04718c33200072bbe";

    // 1. Fetch real tractor/store/owner links from Render PostgreSQL
    let dbDeviceLinks: any[] = [];
    try {
      const client = await pool.connect();
      try {
        const dbRes = await client.query(`
          SELECT 
            dit.id as device_link_id,
            dit.device_imei,
            dit.device_region,
            dit.tractor_store_id,
            tis.lat as default_lat,
            tis.lan as default_lng,
            tis.hourly_price,
            t.name as tractor_name,
            t.model as tractor_model,
            t.images as tractor_images,
            s.id as store_id,
            s.name as store_name,
            s.image as store_image,
            u.id as owner_id,
            u.first_name as owner_first_name,
            u.last_name as owner_last_name,
            u.email as owner_email,
            u.mobile as owner_mobile
          FROM "DeviceInTractor" dit
          LEFT JOIN "TractorInStore" tis ON tis.id = dit.tractor_store_id
          LEFT JOIN "Tractor" t ON t.id = tis."baseTractorId"
          LEFT JOIN "Store" s ON s.id = tis.store_id
          LEFT JOIN "User" u ON u.id = s.owner_user_id OR u.id = s.created_by
          ORDER BY dit."createdAt" DESC
        `);
        dbDeviceLinks = dbRes.rows;
      } finally {
        client.release();
      }
    } catch (dbErr: any) {
      console.warn("[getalluniversaldevices] Render DB query notice:", dbErr?.message);
    }

    const dbMap = new Map<string, any>();
    dbDeviceLinks.forEach((r) => {
      if (r.device_imei) {
        dbMap.set(String(r.device_imei).trim(), r);
      }
    });

    // 2. Fetch live telemetry from GPS Server (device.holatractor.com)
    let liveGpsDevices: any[] = [];
    try {
      const devRes = await axios.get("https://device.holatractor.com/api/devices", {
        headers: {
          Authorization: `Bearer ${gpsKey}`,
          "X-API-Key": gpsKey,
        },
        params: { api_key: gpsKey },
        timeout: 8000,
      });
      if (Array.isArray(devRes.data) && devRes.data.length > 0) {
        liveGpsDevices = devRes.data;
      }
    } catch (e: any) {
      console.warn("[getalluniversaldevices] Live GPS query notice:", e?.message);
    }

    if (liveGpsDevices.length > 0) {
      const enrichedDevices = liveGpsDevices.map((d: any, idx: number) => {
        const dbRow =
          dbMap.get(String(d.imei).trim()) ||
          (dbDeviceLinks.length > 0 ? dbDeviceLinks[idx % dbDeviceLinks.length] : null);

        const lat =
          d.lat && !isNaN(d.lat) && d.lat !== 0
            ? Number(d.lat)
            : dbRow?.default_lat
            ? Number(dbRow.default_lat)
            : -17.7589;

        const lon =
          d.lon && !isNaN(d.lon) && d.lon !== 0
            ? Number(d.lon)
            : dbRow?.default_lng
            ? Number(dbRow.default_lng)
            : -63.1063;

        const tractorImages =
          Array.isArray(dbRow?.tractor_images) && dbRow?.tractor_images.length > 0
            ? dbRow.tractor_images
            : ["https://holadashboard.s3.amazonaws.com/1749554183435-Kioti%20RX%207320%20-%2075%20HP.webp"];

        return {
          id: d.imei,
          device_imei: d.imei,
          device_region: d.direction || dbRow?.device_region || "SW",
          base: { status: d.online ? 1 : 0 },
          lat: lat,
          lng: lon,
          speed: d.speed || 0,
          course: d.course || 0,
          battery: d.battery_pct || 100,
          online: Boolean(d.online),
          tractor_store: {
            id: dbRow?.tractor_store_id || `ts_${d.imei}`,
            hourly_price: Number(dbRow?.hourly_price || 30.0),
            tractor: {
              name: dbRow?.tractor_name || dbRow?.tractor_model || "Fleet Machinery",
              model: dbRow?.tractor_model || "Heavy-Duty",
              images: tractorImages,
            },
            store: {
              id: dbRow?.store_id || "store_scz",
              name: dbRow?.store_name || "Central Agro Hub",
              image:
                dbRow?.store_image ||
                "https://holadashboard.s3.amazonaws.com/1743436650571-d7edd764-d050-42e9-866a-7368017b7b69.png",
              user: {
                first_name: dbRow?.owner_first_name || "Agro",
                last_name: dbRow?.owner_last_name || "Manager",
                email: dbRow?.owner_email || "",
                mobile: dbRow?.owner_mobile || "",
              },
            },
          },
        };
      });

      return NextResponse.json(enrichedDevices);
    }

    // 3. If GPS server returned 0 or timed out, return direct Render DB devices
    if (dbDeviceLinks.length > 0) {
      const fallbackFromDb = dbDeviceLinks.map((r: any) => ({
        id: r.device_imei,
        device_imei: r.device_imei,
        device_region: r.device_region || "SW",
        base: { status: 1 },
        lat: Number(r.default_lat || -17.7833),
        lng: Number(r.default_lng || -63.1821),
        speed: 0,
        battery: 100,
        online: true,
        tractor_store: {
          id: r.tractor_store_id,
          hourly_price: Number(r.hourly_price || 30.0),
          tractor: {
            name: r.tractor_name || r.tractor_model || "Fleet Machinery",
            model: r.tractor_model || "Heavy-Duty",
            images: Array.isArray(r.tractor_images) ? r.tractor_images : [],
          },
          store: {
            id: r.store_id,
            name: r.store_name || "Hola Store",
            image: r.store_image || "",
            user: {
              first_name: r.owner_first_name || "Owner",
              last_name: r.owner_last_name || "",
              email: r.owner_email || "",
              mobile: r.owner_mobile || "",
            },
          },
        },
      }));

      return NextResponse.json(fallbackFromDb);
    }

    return NextResponse.json([]);
  } catch (error: any) {
    console.error("[getalluniversaldevices] Error:", error?.message);
    return NextResponse.json([], { status: 500 });
  }
}
