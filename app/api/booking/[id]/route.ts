import { NextRequest, NextResponse } from "next/server";
import pool from "@/utils/Database/db";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bookingId = params.id;
    if (!bookingId) {
      return NextResponse.json({ message: "Booking ID is required" }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      const res = await client.query(
        `
        SELECT 
          b.id,
          b.user_id,
          b.store_id,
          b.start_date,
          b.end_date,
          b.booking_hours,
          b.total_cost,
          b.total_tractor_cost,
          b.total_attachment_cost,
          b.total_service_charge,
          b.total_distance_cost,
          b.total_service_cost,
          b.total_tax,
          b.distance,
          b."bookingStatus",
          b."bookingType",
          b.confirm,
          b.owner_confirm,
          b."createdAt",
          b."updatedAt",
          b.farm_id,
          b.operator_id,
          b.task_type,
          b.checkin_otp,
          -- Farmer User
          u.id as farmer_id,
          u.first_name as farmer_first_name,
          u.middle_name as farmer_middle_name,
          u.last_name as farmer_last_name,
          u.email as farmer_email,
          u.mobile as farmer_mobile,
          u.image as farmer_image,
          -- Store
          s.id as store_real_id,
          s.name as store_name,
          s.image as store_image,
          s.description as store_description,
          -- Store Owner
          so.id as owner_id,
          so.first_name as owner_first_name,
          so.last_name as owner_last_name,
          so.email as owner_email,
          so.mobile as owner_mobile,
          -- Farm
          COALESCE(fm.name, f.name, 'Farm') as farm_name,
          COALESCE(fm.description, f.description, '') as farm_description,
          COALESCE(f.area_sqm, 0) as farm_area
        FROM "Booking" b
        LEFT JOIN "User" u ON u.id = b.user_id
        LEFT JOIN "Store" s ON s.id = b.store_id
        LEFT JOIN "User" so ON so.id = s.owner_user_id OR so.id = s.created_by
        LEFT JOIN "Farm" fm ON fm.id = b.farm_id
        LEFT JOIN farms f ON f.id::text = b.farm_id
        WHERE b.id = $1
      `,
        [bookingId]
      );

      if (res.rows.length === 0) {
        return NextResponse.json({ message: "Booking not found" }, { status: 404 });
      }

      const r = res.rows[0];

      // Sub-items
      const stRes = await client.query(
        `SELECT bst.*, t.name, t.model, t.images, t.type FROM "BookingStandaloneTractor" bst LEFT JOIN "Tractor" t ON t.id = bst."tractorId" WHERE bst."bookingId" = $1`,
        [bookingId]
      );

      const saRes = await client.query(
        `SELECT bsa.*, a.name, a.description, a.images FROM "BookingStandaloneAttachment" bsa LEFT JOIN "Attachment" a ON a.id = bsa."attachmentId" WHERE bsa."bookingId" = $1`,
        [bookingId]
      );

      const btRes = await client.query(
        `SELECT bt.*, tis.lat, tis.lan as lng, tis.hourly_price, t.name, t.model, t.images FROM "BookingTractor" bt LEFT JOIN "TractorInStore" tis ON tis.id = bt."tractorId" LEFT JOIN "Tractor" t ON t.id = tis."baseTractorId" WHERE bt."bookingId" = $1`,
        [bookingId]
      );

      const baRes = await client.query(
        `SELECT ba.*, ais.hourly_price, a.name, a.description, a.images FROM "BookingAttachment" ba LEFT JOIN "AttachmentInStore" ais ON ais.id = ba."attachmentId" LEFT JOIN "Attachment" a ON a.id = ais."baseAttachmentId" WHERE ba."bookingId" = $1`,
        [bookingId]
      );

      const bookingDetail = {
        id: String(r.id),
        user_id: r.user_id ? String(r.user_id) : "",
        store_id: r.store_id ? String(r.store_id) : "",
        start_date: r.start_date ? new Date(r.start_date).toISOString() : new Date().toISOString(),
        end_date: r.end_date ? new Date(r.end_date).toISOString() : null,
        booking_hours: r.booking_hours ? String(r.booking_hours) : "Eight_Hours",
        total_cost: Number(r.total_cost || 0),
        total_tractor_cost: Number(r.total_tractor_cost || 0),
        total_attachment_cost: Number(r.total_attachment_cost || 0),
        total_service_charge: Number(r.total_service_charge || 0),
        total_distance_cost: Number(r.total_distance_cost || 0),
        total_service_cost: Number(r.total_service_cost || 0),
        total_tax: Number(r.total_tax || 0),
        distance: Number(r.distance || 0),
        bookingStatus: r.bookingStatus || "Open",
        bookingType: r.bookingType || "store",
        confirm: Boolean(r.confirm),
        owner_confirm: Boolean(r.owner_confirm),
        createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : new Date().toISOString(),
        farm_id: r.farm_id ? String(r.farm_id) : null,
        operator_id: r.operator_id ? String(r.operator_id) : null,
        task_type: r.task_type || null,
        checkin_otp: r.checkin_otp || null,
        user: {
          id: r.farmer_id || r.user_id || "farmer_id",
          first_name: r.farmer_first_name || "Farmer",
          middle_name: r.farmer_middle_name || "",
          last_name: r.farmer_last_name || "",
          email: r.farmer_email || "farmer@holatractor.com",
          mobile: r.farmer_mobile || "",
          image: r.farmer_image || "",
        },
        store: r.store_name
          ? {
              id: r.store_real_id || r.store_id,
              name: r.store_name,
              image: r.store_image || "",
              description: r.store_description || "",
              user: {
                id: r.owner_id || "owner_id",
                first_name: r.owner_first_name || "Store",
                last_name: r.owner_last_name || "Owner",
                email: r.owner_email || "",
                mobile: r.owner_mobile || "",
              },
            }
          : null,
        farm: {
          name: r.farm_name,
          description: r.farm_description,
          area_sqm: Number(r.farm_area || 0),
        },
        BookingStandaloneTractor: stRes.rows,
        BookingStandaloneAttachment: saRes.rows,
        BookingTractor: btRes.rows,
        BookingAttachment: baRes.rows,
      };

      return NextResponse.json(bookingDetail);
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("[/api/booking/[id]] GET error:", error?.message);
    return NextResponse.json({ message: error?.message || "Internal server error" }, { status: 500 });
  }
}
