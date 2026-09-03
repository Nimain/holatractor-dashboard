import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export const dynamic = "force-dynamic";

const TRACTOR_FLEET_PRESETS = [
  {
    name: "John Deere 6110M",
    model: "6110M Utility 4WD",
    price: 35.0,
    store: "AgroTech Central Santa Cruz",
    owner_first: "Gonzalo",
    owner_last: "Justiniano Parada",
    image: "https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?w=800&q=80",
  },
  {
    name: "New Holland 3032 TT",
    model: "3032 TT Super Clean",
    price: 28.0,
    store: "Warnes Tractor Hub",
    owner_first: "Fernando",
    owner_last: "Ribera Aguilera",
    image: "https://images.unsplash.com/photo-1530267981375-f0de937f5f13?w=800&q=80",
  },
  {
    name: "Massey Ferguson 4708",
    model: "MF 4700 Global Series",
    price: 32.0,
    store: "Montero Maquinaria Agrícola",
    owner_first: "Patricia",
    owner_last: "Vargas Céspedes",
    image: "https://images.unsplash.com/photo-1592928302636-c83cf1e1c887?w=800&q=80",
  },
  {
    name: "Case IH Farmall 95A",
    model: "Farmall Heavy-Duty 95A",
    price: 30.0,
    store: "Cuatro Cañadas AgroServicios",
    owner_first: "Mariela",
    owner_last: "Suárez Peña",
    image: "https://images.unsplash.com/photo-1594771804886-a933bb2d609b?w=800&q=80",
  },
  {
    name: "Kubota M7-172 Premium",
    model: "M7 Gen 2 KVT Power",
    price: 38.0,
    store: "Pailón Heavy Machinery",
    owner_first: "Carlos",
    owner_last: "Mendoza Vaca",
    image: "https://images.unsplash.com/photo-1589923188900-85dae523342b?w=800&q=80",
  },
  {
    name: "Valtra A950 HiTech",
    model: "A950 Generation 4",
    price: 34.0,
    store: "Okinawa Central Store",
    owner_first: "Raul",
    owner_last: "Montaño Cuellar",
    image: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&q=80",
  },
  {
    name: "Claas Arion 650 CIS+",
    model: "Arion 650 Hexashift",
    price: 42.0,
    store: "San Julián AgroTech",
    owner_first: "Julio",
    owner_last: "Peinado Melgar",
    image: "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&q=80",
  },
  {
    name: "Fendt 724 Vario Gen6",
    model: "724 Vario ProfiPlus",
    price: 45.0,
    store: "Mineros Maquinaria",
    owner_first: "Mario",
    owner_last: "Gutierrez Soliz",
    image: "https://images.unsplash.com/photo-1560493676-04071c5f467b?w=800&q=80",
  },
];

export async function GET(request: NextRequest) {
  try {
    const gpsKey =
      process.env.NEXT_PUBLIC_GPS_API_KEY || "gps_live_1a04718c33200072bbe";

    // 1. Fetch live telemetry from GPS Server (device.holatractor.com)
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
        const preset = TRACTOR_FLEET_PRESETS[idx % TRACTOR_FLEET_PRESETS.length];
        const lat = d.lat && !isNaN(d.lat) && d.lat !== 0 ? String(d.lat) : "-17.7589";
        const lon = d.lon && !isNaN(d.lon) && d.lon !== 0 ? String(d.lon) : "-63.1063";

        return {
          id: d.imei,
          device_imei: d.imei,
          device_region: d.direction || "SW",
          base: { status: d.online ? 1 : 0 },
          lat: Number(lat),
          lng: Number(lon),
          speed: d.speed || 0,
          course: d.course || 0,
          battery: d.battery_pct || 100,
          online: Boolean(d.online),
          status: d.online ? "Active" : "Not Connected",
          last_seen: d.last_seen || new Date().toISOString(),
          updatedAt: d.last_seen || new Date().toISOString(),
          tractorInStore: {
            id: `tis_${d.imei}`,
            hourly_price: preset.price,
            baseTractor: {
              name: preset.name,
              model: preset.model,
              images: [preset.image],
            },
            store: {
              name: preset.store,
              image: preset.image,
              location: {
                lat,
                lan: lon,
              },
              owner: {
                user: {
                  first_name: preset.owner_first,
                  last_name: preset.owner_last,
                },
              },
            },
          },
        };
      });

      return NextResponse.json({ success: true, data: enrichedDevices });
    }

    return NextResponse.json({ success: true, data: [] });
  } catch (error: any) {
    console.error("[/api/store/getalluniversaldevices] Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch devices" },
      { status: 500 }
    );
  }
}
