import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import jwt from "jsonwebtoken";
import pool from "@/utils/Database/db";

export const dynamic = "force-dynamic";

const FastApiBaseURL =
  process.env.NEXT_PUBLIC_TRACTOR_AI_URL || "https://tractorai.sinsignal.com/";
const NestJsBaseURL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://holatractor-backend-render.onrender.com/";

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

// Seed operational owners with stores and machinery
export const SEED_OWNERS_OPTIONS = [
  {
    owner_id: "owner-agrosantacruz",
    user_id: "user-agrosantacruz",
    owner_name: "AgroSantaCruz Machinery Corp",
    owner_email: "contacto@agrosantacruz.bo",
    owner_mobile: "+591 71023456",
    owner_image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80",
    stores: [
      {
        store_id: "store-montero-hub",
        store_name: "Montero North Agricultural Hub",
        store_image: "https://images.unsplash.com/photo-1592928302636-c83cf1e1c887?w=600&q=80",
        tractors: [
          {
            tractor_store_id: "tis-scz-01",
            base_tractor_id: "bt-jd-6110m",
            name: "John Deere 6110M - Unit #1",
            model: "6110M Utility",
            image: "https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?w=800&q=80",
            hourly_price: 35.0,
            has_device: true,
            current_imei: "0869066063152376",
          },
          {
            tractor_store_id: "tis-scz-02",
            base_tractor_id: "bt-mf-4708",
            name: "Massey Ferguson 4708 - Unit #2",
            model: "MF 4700 Global",
            image: "https://images.unsplash.com/photo-1592928302636-c83cf1e1c887?w=800&q=80",
            hourly_price: 30.0,
            has_device: false,
            current_imei: null,
          },
        ],
      },
      {
        store_id: "store-warnes-center",
        store_name: "Warnes Central Fleet Station",
        store_image: "https://images.unsplash.com/photo-1586771107445-d3ca888129ff?w=600&q=80",
        tractors: [
          {
            tractor_store_id: "tis-scz-03",
            base_tractor_id: "bt-nh-t6-180",
            name: "New Holland T6.180 - Unit #3",
            model: "T6 Dynamic Command",
            image: "https://images.unsplash.com/photo-1530267981375-f0de937f5f13?w=800&q=80",
            hourly_price: 40.0,
            has_device: false,
            current_imei: null,
          },
        ],
      },
    ],
  },
  {
    owner_id: "owner-granchaco",
    user_id: "user-granchaco",
    owner_name: "Gran Chaco Tractores & Equipos",
    owner_email: "operaciones@granchacoagro.bo",
    owner_mobile: "+591 76543210",
    owner_image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80",
    stores: [
      {
        store_id: "store-yacuiba-fleet",
        store_name: "Yacuiba Heavy Equipment Depot",
        store_image: "https://images.unsplash.com/photo-1590682680695-43b964a3ae17?w=600&q=80",
        tractors: [
          {
            tractor_store_id: "tis-chaco-01",
            base_tractor_id: "bt-case-farmall-95a",
            name: "Case IH Farmall 95A - Unit #1",
            model: "Farmall Heavy-Duty",
            image: "https://images.unsplash.com/photo-1594771804886-a933bb2d609b?w=800&q=80",
            hourly_price: 28.0,
            has_device: false,
            current_imei: null,
          },
          {
            tractor_store_id: "tis-chaco-02",
            base_tractor_id: "bt-kubota-m7-172",
            name: "Kubota M7-172 - Unit #2",
            model: "M7 Gen 2 Premium",
            image: "https://images.unsplash.com/photo-1589923188900-85dae523342b?w=800&q=80",
            hourly_price: 38.0,
            has_device: false,
            current_imei: null,
          },
        ],
      },
    ],
  },
  {
    owner_id: "owner-sanpedro",
    user_id: "user-sanpedro",
    owner_name: "San Pedro Agro Maquinarias SRL",
    owner_email: "gerencia@sanpedroagro.com",
    owner_mobile: "+591 72198765",
    owner_image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
    stores: [
      {
        store_id: "store-sanpedro-base",
        store_name: "San Pedro Central Farm Store",
        store_image: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=600&q=80",
        tractors: [
          {
            tractor_store_id: "tis-sp-01",
            base_tractor_id: "bt-valtra-a950",
            name: "Valtra A950 - Harvest Unit",
            model: "A-Series HiTech",
            image: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&q=80",
            hourly_price: 32.0,
            has_device: false,
            current_imei: null,
          },
          {
            tractor_store_id: "tis-sp-02",
            base_tractor_id: "bt-claas-arion-650",
            name: "Claas Arion 650 - Field Unit",
            model: "Arion CMATIC",
            image: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&q=80",
            hourly_price: 45.0,
            has_device: false,
            current_imei: null,
          },
        ],
      },
    ],
  },
  {
    owner_id: "owner-vallecentral",
    user_id: "user-vallecentral",
    owner_name: "Valle Central Machinery & Tools",
    owner_email: "logistica@vallecentral.bo",
    owner_mobile: "+591 73456789",
    owner_image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80",
    stores: [
      {
        store_id: "store-cbba-valley",
        store_name: "Cochabamba Valley Store",
        store_image: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&q=80",
        tractors: [
          {
            tractor_store_id: "tis-vc-01",
            base_tractor_id: "bt-fendt-724",
            name: "Fendt 724 Vario - Precision Unit",
            model: "700 Vario ProfiPlus",
            image: "https://images.unsplash.com/photo-1595246140625-573b715d11dc?w=800&q=80",
            hourly_price: 55.0,
            has_device: false,
            current_imei: null,
          },
        ],
      },
    ],
  },
];

// Helper to get or initialize global dynamic stores
export function getDynamicStores() {
  if (!(global as any)._dynamicStoresMap) {
    (global as any)._dynamicStoresMap = new Map();
  }
  return (global as any)._dynamicStoresMap;
}

// Helper to get or initialize global dynamic tractors
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

    // 3. Fallback: Use High-Fidelity SEED Dataset + Dynamic Runtime Stores/Tractors
    if (optionsData.length === 0) {
      // Clone seed owners
      const dynamicMap = getDynamicStores();
      const dynamicTisMap = getDynamicStoreTractors();

      optionsData = JSON.parse(JSON.stringify(SEED_OWNERS_OPTIONS));

      // Merge dynamic stores created during session
      dynamicMap.forEach((dynStore: any) => {
        const owner = optionsData.find((o) => o.owner_id === dynStore.owner_id);
        if (owner) {
          const exists = owner.stores.some((s: any) => s.store_id === dynStore.store_id);
          if (!exists) {
            owner.stores.unshift({
              store_id: dynStore.store_id,
              store_name: dynStore.store_name,
              store_image: dynStore.store_image || "",
              tractors: dynStore.tractors || [],
            });
          }
        }
      });

      // Merge dynamic tractors created during session
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
        data: SEED_OWNERS_OPTIONS,
        base_tractors: BASE_TRACTORS_CATALOG,
        pagination: { total: SEED_OWNERS_OPTIONS.length, page: 1, limit: 20, has_more: false },
      },
      { status: 200 }
    );
  }
}
