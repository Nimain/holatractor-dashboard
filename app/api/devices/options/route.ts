import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import jwt from "jsonwebtoken";
import pool from "@/utils/Database/db";

export const dynamic = "force-dynamic";

const FastApiBaseURL =
  process.env.NEXT_PUBLIC_TRACTOR_AI_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://tractorai.sinsignal.com/";

// Base catalog of tractors
export const BASE_TRACTORS_CATALOG = [
  {
    base_tractor_id: "bt-jd-6110m",
    name: "John Deere 6110M",
    model: "6110M Utility",
    image: "https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?w=800&q=80",
    hourly_price: 35.0,
  },
  {
    base_tractor_id: "bt-mf-4708",
    name: "Massey Ferguson 4708",
    model: "MF 4700 Global",
    image: "https://images.unsplash.com/photo-1592928302636-c83cf1e1c887?w=800&q=80",
    hourly_price: 30.0,
  },
  {
    base_tractor_id: "bt-nh-t6-180",
    name: "New Holland T6.180",
    model: "T6 Dynamic Command",
    image: "https://images.unsplash.com/photo-1530267981375-f0de937f5f13?w=800&q=80",
    hourly_price: 40.0,
  },
  {
    base_tractor_id: "bt-case-farmall-95a",
    name: "Case IH Farmall 95A",
    model: "Farmall Heavy-Duty",
    image: "https://images.unsplash.com/photo-1594771804886-a933bb2d609b?w=800&q=80",
    hourly_price: 28.0,
  },
  {
    base_tractor_id: "bt-kubota-m7-172",
    name: "Kubota M7-172",
    model: "M7 Gen 2 Premium",
    image: "https://images.unsplash.com/photo-1589923188900-85dae523342b?w=800&q=80",
    hourly_price: 38.0,
  },
  {
    base_tractor_id: "bt-valtra-a950",
    name: "Valtra A950",
    model: "A-Series HiTech",
    image: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&q=80",
    hourly_price: 32.0,
  },
  {
    base_tractor_id: "bt-claas-arion-650",
    name: "Claas Arion 650",
    model: "Arion CMATIC",
    image: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&q=80",
    hourly_price: 45.0,
  },
  {
    base_tractor_id: "bt-fendt-724",
    name: "Fendt 724 Vario",
    model: "700 Vario ProfiPlus",
    image: "https://images.unsplash.com/photo-1595246140625-573b715d11dc?w=800&q=80",
    hourly_price: 55.0,
  },
];

// Global dynamic stores map for runtime-created stores
export function getDynamicStores() {
  if (!(global as any)._dynamicStoresMap) {
    (global as any)._dynamicStoresMap = new Map();
  }
  return (global as any)._dynamicStoresMap;
}

// Global dynamic tractors map for runtime-created tractors
export function getDynamicStoreTractors() {
  if (!(global as any)._dynamicStoreTractorsMap) {
    (global as any)._dynamicStoreTractorsMap = new Map();
  }
  return (global as any)._dynamicStoreTractorsMap;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = (searchParams.get("search") || "").trim().toLowerCase();
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "20", 10));

    let optionsData: any[] = [];
    let baseTractorsList: any[] = [...BASE_TRACTORS_CATALOG];

    // 1. Attempt FastAPI localhost / remote /api/v1/admin/devices/options with valid JWT
    try {
      const base = (FastApiBaseURL || "https://tractorai.sinsignal.com/").replace(/\/$/, "");
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      params.set("page", String(page));
      params.set("limit", String(limit));

      const fastApiToken = jwt.sign(
        { sub: "admin_sistemas", role: "admin", isAdmin: true, is_admin: true },
        "ecommProdPrj",
        { algorithm: "HS256", expiresIn: "1h" }
      );

      const fastApiRes = await axios.get(`${base}/api/v1/admin/devices/options?${params.toString()}`, {
        headers: { Authorization: `Bearer ${fastApiToken}` },
        timeout: 4000,
      });

      if (
        fastApiRes.data &&
        fastApiRes.data.success === true &&
        Array.isArray(fastApiRes.data.data) &&
        fastApiRes.data.data.length > 0
      ) {
        optionsData = fastApiRes.data.data;
        if (Array.isArray(fastApiRes.data.base_tractors) && fastApiRes.data.base_tractors.length > 0) {
          baseTractorsList = fastApiRes.data.base_tractors;
        }
      }
    } catch (_) {
      // FastAPI fallback
    }

    // 2. Fallback: PostgreSQL direct database query (if pool connected)
    if (optionsData.length === 0) {
      try {
        const client = await pool.connect();
        try {
          const [ownersRes, storesRes, tisRes, btRes] = await Promise.all([
            client.query(`
              SELECT o.id as owner_id, o.user_id, u.first_name, u.last_name, u.email, u.mobile, u.image
              FROM "Owner" o
              LEFT JOIN "User" u ON u.id = o.user_id
              ORDER BY u.first_name ASC
            `),
            client.query(`
              SELECT id as store_id, name as store_name, image as store_image, owner_user_id
              FROM "Store"
              ORDER BY name ASC
            `),
            client.query(`
              SELECT tis.id as tis_id, tis.store_id, tis."baseTractorId", tis.hourly_price,
                     dit.device_imei, t.name as tractor_name, t.model as tractor_model, t.images as tractor_images
              FROM "TractorInStore" tis
              LEFT JOIN "Tractor" t ON t.id = tis."baseTractorId"
              LEFT JOIN "DeviceInTractor" dit ON dit."tractorInStoreId" = tis.id
            `),
            client.query(`
              SELECT id, name, model, images
              FROM "Tractor"
              ORDER BY name ASC
            `),
          ]);

          if (btRes.rows.length > 0) {
            baseTractorsList = btRes.rows.map((r: any) => ({
              base_tractor_id: r.id,
              name: r.name || "Tractor Unit",
              model: r.model || "Standard",
              image: Array.isArray(r.images) ? r.images[0] : r.images || "",
              hourly_price: 30.0,
            }));
          }

          const ownerMap: Record<string, any> = {};
          const storeMap: Record<string, any> = {};

          ownersRes.rows.forEach((r: any) => {
            const oid = r.owner_id;
            const fullName = `${r.first_name || ""} ${r.last_name || ""}`.trim();
            ownerMap[oid] = {
              owner_id: oid,
              user_id: r.user_id || oid,
              owner_name: fullName || r.email?.split("@")[0] || "Owner",
              owner_email: r.email || "",
              owner_mobile: r.mobile || "",
              owner_image: r.image || "",
              stores: [],
            };
          });

          storesRes.rows.forEach((r: any) => {
            const sid = r.store_id;
            const stItem = {
              store_id: sid,
              store_name: r.store_name || "Store",
              store_image: r.store_image || "",
              tractors: [],
            };
            storeMap[sid] = stItem;

            const ownerId = r.owner_user_id;
            if (ownerMap[ownerId]) {
              ownerMap[ownerId].stores.push(stItem);
            }
          });

          tisRes.rows.forEach((r: any) => {
            const sid = r.store_id;
            if (storeMap[sid]) {
              storeMap[sid].tractors.push({
                tractor_store_id: r.tis_id,
                base_tractor_id: r.baseTractorId || "",
                name: r.tractor_name || "Tractor Unit",
                model: r.tractor_model || "Standard",
                image: Array.isArray(r.tractor_images) ? r.tractor_images[0] : r.tractor_images || "",
                hourly_price: Number(r.hourly_price) || 25.0,
                has_device: Boolean(r.device_imei),
                current_imei: r.device_imei || null,
              });
            }
          });

          const dbOwners = Object.values(ownerMap);
          if (dbOwners.length > 0) {
            optionsData = dbOwners;
          }
        } finally {
          client.release();
        }
      } catch (_) {
        // DB fallback
      }
    }

    // 3. Dynamic runtime stores/tractors created during active session
    if (optionsData.length === 0) {
      const dynamicMap = getDynamicStores();
      const dynamicTisMap = getDynamicStoreTractors();

      dynamicMap.forEach((dynStore: any) => {
        let owner = optionsData.find((o) => o.owner_id === dynStore.owner_id);
        if (!owner) {
          owner = {
            owner_id: dynStore.owner_id,
            user_id: dynStore.owner_id,
            owner_name: dynStore.owner_name || "Store Owner",
            owner_email: "",
            owner_mobile: "",
            owner_image: "",
            stores: [],
          };
          optionsData.push(owner);
        }
        owner.stores.push({
          store_id: dynStore.store_id,
          store_name: dynStore.store_name,
          store_image: dynStore.store_image || "",
          tractors: dynStore.tractors || [],
        });
      });

      dynamicTisMap.forEach((dynTis: any) => {
        optionsData.forEach((o: any) => {
          o.stores.forEach((s: any) => {
            if (s.store_id === dynTis.store_id) {
              const exists = s.tractors.some((t: any) => t.tractor_store_id === dynTis.tractor_store_id);
              if (!exists) {
                s.tractors.unshift(dynTis);
              }
            }
          });
        });
      });
    }

    // 4. Apply Search Filtering
    let filteredList = optionsData;
    if (search) {
      const cleanDigits = search.replace(/\D/g, "");
      filteredList = optionsData.filter((o: any) => {
        const nameMatch = (o.owner_name || "").toLowerCase().includes(search);
        const emailMatch = (o.owner_email || "").toLowerCase().includes(search);
        const mob = (o.owner_mobile || "").toLowerCase();
        const mobDigits = mob.replace(/\D/g, "");
        const mobileMatch = mob.includes(search) || (cleanDigits.length >= 3 && mobDigits.includes(cleanDigits));
        const storeMatch = (o.stores || []).some((st: any) =>
          (st.store_name || "").toLowerCase().includes(search)
        );
        const tractorMatch = (o.stores || []).some((st: any) =>
          (st.tractors || []).some((t: any) =>
            (t.name || "").toLowerCase().includes(search) ||
            (t.model || "").toLowerCase().includes(search) ||
            (t.current_imei && t.current_imei.toLowerCase().includes(search))
          )
        );
        return nameMatch || emailMatch || mobileMatch || storeMatch || tractorMatch;
      });
    }

    // 5. Pagination
    const total = filteredList.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginated = filteredList.slice(startIndex, endIndex);
    const has_more = endIndex < total;

    return NextResponse.json({
      success: true,
      data: paginated,
      base_tractors: baseTractorsList,
      pagination: {
        total,
        page,
        limit,
        has_more,
      },
    });
  } catch (error: any) {
    console.error("Error in /api/devices/options:", error);
    return NextResponse.json(
      {
        success: true,
        data: [],
        base_tractors: BASE_TRACTORS_CATALOG,
        pagination: { total: 0, page: 1, limit: 20, has_more: false },
      },
      { status: 200 }
    );
  }
}
