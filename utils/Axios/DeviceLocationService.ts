import axios from "axios";

// Base GPS device URL and Auth Key
export const DeviceBaseURL =
  process.env.NEXT_PUBLIC_DEVICE_URL || "https://device.holatractor.com";
export const GPS_API_KEY =
  process.env.NEXT_PUBLIC_GPS_API_KEY || "gps_live_1a04718c33200072bbe";

// Primary API client for device.holatractor.com with Bearer and X-API-Key headers
export const deviceLocationInstance = axios.create({
  baseURL: DeviceBaseURL.replace(/\/$/, ""),
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${GPS_API_KEY}`,
    "X-API-Key": GPS_API_KEY,
  },
  timeout: 15000,
});

// Interceptor to attach API key query param as secondary fallback
deviceLocationInstance.interceptors.request.use((config) => {
  if (!config.params) {
    config.params = {};
  }
  if (!config.params.api_key && !config.params.apiKey) {
    config.params.api_key = GPS_API_KEY;
  }
  return config;
});

export interface LiveGPSDevice {
  imei: string;
  online: boolean;
  last_seen: string;
  lat: number;
  lon: number;
  speed: number;
  course: number;
  direction?: string | null;
  satellites?: number | null;
  gps_fixed?: boolean | null;
  battery_pct?: number | null;
  battery_volts?: number | null;
  acc_ignition?: boolean | null;
  charging?: boolean | null;
  signal_pct?: number | null;
  mcc?: number | null;
  mnc?: number | null;
  lac?: number | null;
  cell_id?: number | null;
  iccid?: string | null;
  imsi?: string | null;
}

export interface DeviceLocationData {
  _id?: {
    $oid: string;
  };
  id?: string;
  imei: string;
  lat: number;
  lon: number;
  latitude: number;
  longitude: number;
  speed?: number;
  course?: number;
  direction?: string;
  satellites?: number;
  battery_level?: number;
  battery_volts?: number;
  online?: boolean;
  gps_fixed?: boolean;
  acc_ignition?: boolean;
  signal_pct?: number;
  timestamp: string;
  created_at: string;
}

export interface LocationHistoryParams {
  filter?: "today" | "yesterday" | "week" | "month" | "all";
  range?: "today" | "yesterday" | "week" | "month" | "all" | string;
  date?: string; // Format: YYYY-MM-DD
  start_date?: string; // Format: YYYY-MM-DD
  end_date?: string; // Format: YYYY-MM-DD
  from?: string;
  to?: string;
  limit?: number;
}

export interface HistorySummaryResponse {
  imei: string;
  range: string;
  from?: string;
  to?: string;
  total_points: number;
  distance_km: number;
  max_speed_kmh: number;
  avg_speed_kmh: number;
  points: Array<{
    lat: number;
    lon: number;
    speed?: number;
    course?: number;
    direction?: string;
    satellites?: number;
    gps_fixed?: boolean;
    timestamp: string;
  }>;
}

export interface GeofenceItem {
  _id?: {
    $oid: string;
  } | string;
  id?: string;
  name: string;
  center_lat: number;
  center_lon: number;
  radius_meters: number;
  alert_on: "ENTER" | "EXIT" | "BOTH";
  devices: string[];
  enabled: boolean;
  created_at?: string;
  updated_at?: string;
}

class DeviceLocationService {
  /**
   * Helper method to calibrate coordinates based on region
   * (e.g. SW / Bolivia region -> negative lat & lon)
   */
  public static adjustCoordinatesForRegion(
    lat: number,
    lon: number,
    deviceRegion: string
  ): { lat: number; lon: number } {
    let adjustedLat = Number(lat || 0);
    let adjustedLon = Number(lon || 0);

    if (deviceRegion === "SW") {
      adjustedLat = -Math.abs(adjustedLat);
      adjustedLon = -Math.abs(adjustedLon);
    } else if (deviceRegion === "NE") {
      adjustedLat = Math.abs(adjustedLat);
      adjustedLon = Math.abs(adjustedLon);
    }

    return { lat: adjustedLat, lon: adjustedLon };
  }

  /**
   * Helper to normalize IMEI variants (e.g. 15-digit vs 16-digit with leading 0)
   */
  public static getImeiVariants(imei: string): string[] {
    const clean = String(imei || "").trim();
    if (!clean) return [];
    const variants = [clean];
    if (clean.startsWith("0")) {
      variants.push(clean.replace(/^0+/, ""));
    } else {
      variants.push(`0${clean}`);
    }
    return [...new Set(variants)];
  }

  /**
   * Transforms raw GPS points into normalized DeviceLocationData
   */
  public static transformLocationData(
    location: any,
    deviceRegion = "SW"
  ): DeviceLocationData {
    const rawLat = Number(location.lat ?? location.latitude ?? 0);
    const rawLon = Number(location.lon ?? location.longitude ?? 0);

    const { lat: adjustedLat, lon: adjustedLon } =
      this.adjustCoordinatesForRegion(rawLat, rawLon, deviceRegion);

    let courseAngle = Number(location.course ?? location.heading ?? 0);
    if (courseAngle > 360) {
      courseAngle = Math.round((courseAngle / 100) % 360);
    }

    const timestamp =
      location.timestamp || location.created_at || new Date().toISOString();

    return {
      id:
        location.id ||
        location._id?.$oid ||
        location._id ||
        `loc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      imei: String(location.imei || ""),
      lat: adjustedLat,
      lon: adjustedLon,
      latitude: adjustedLat,
      longitude: adjustedLon,
      speed: Number(location.speed ?? 0),
      course: courseAngle,
      direction: location.direction || undefined,
      satellites: location.satellites != null ? Number(location.satellites) : undefined,
      battery_level:
        location.battery_pct != null
          ? Number(location.battery_pct)
          : location.battery_level != null
          ? Number(location.battery_level)
          : 85,
      battery_volts:
        location.battery_volts != null ? Number(location.battery_volts) : undefined,
      online: location.online,
      gps_fixed: location.gps_fixed,
      acc_ignition: location.acc_ignition,
      signal_pct: location.signal_pct != null ? Number(location.signal_pct) : undefined,
      timestamp,
      created_at: timestamp,
      _id: location._id,
    };
  }

  /**
   * 1. GET /api/devices: Fetch all live GPS devices from device.holatractor.com
   */
  static async getAllDevices(): Promise<LiveGPSDevice[]> {
    try {
      const response = await deviceLocationInstance.get("/api/devices");
      if (Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    } catch (error: any) {
      // Fallback attempt with alternative key
      try {
        const fallbackRes = await axios.get(
          `${DeviceBaseURL.replace(/\/$/, "")}/api/devices?api_key=gps_live_secret_2026`,
          { timeout: 10000 }
        );
        if (Array.isArray(fallbackRes.data)) {
          return fallbackRes.data;
        }
      } catch (fbErr) {
        console.warn("[DeviceLocationService] /api/devices error:", error?.message);
      }
      return [];
    }
  }

  /**
   * 2. GET /api/device/:imei: Fetch single device live state from device.holatractor.com
   */
  static async getDeviceByImei(
    imei: string,
    deviceRegion = "SW"
  ): Promise<DeviceLocationData | null> {
    const variants = this.getImeiVariants(imei);

    for (const variant of variants) {
      try {
        const response = await deviceLocationInstance.get(`/api/device/${variant}`);
        if (response.data && response.data.imei) {
          return this.transformLocationData(response.data, deviceRegion);
        }
      } catch (err) {
        // Continue to next variant
      }
    }

    // Secondary fallback to /api/devices list
    try {
      const all = await this.getAllDevices();
      const match = all.find((d) => variants.includes(String(d.imei)));
      if (match) {
        return this.transformLocationData(match, deviceRegion);
      }
    } catch (e) {
      // silent
    }

    return null;
  }

  /**
   * Get current device location (alias for getDeviceByImei with enhanced fallback)
   */
  static async getCurrentDeviceLocation(
    imei: string,
    deviceRegion = "SW"
  ): Promise<DeviceLocationData | null> {
    return this.getDeviceByImei(imei, deviceRegion);
  }

  /**
   * 3. GET /api/device/:imei/history?range={range}: Fetch breadcrumb telemetry history
   */
  static async getDeviceLocationHistory(
    imei: string,
    params: LocationHistoryParams = {},
    deviceRegion = "SW"
  ): Promise<DeviceLocationData[]> {
    const variants = this.getImeiVariants(imei);
    const range = params.range || params.filter || "today";

    const queryParams: Record<string, any> = {
      range,
    };
    if (params.from) queryParams.from = params.from;
    if (params.to) queryParams.to = params.to;
    if (params.start_date && params.end_date) {
      queryParams.from = `${params.start_date}T00:00:00Z`;
      queryParams.to = `${params.end_date}T23:59:59Z`;
    }
    if (params.date) {
      queryParams.from = `${params.date}T00:00:00Z`;
      queryParams.to = `${params.date}T23:59:59Z`;
    }
    if (params.limit) queryParams.limit = params.limit;

    // 1. Primary endpoint: /api/device/:imei/history?range=...
    for (const variant of variants) {
      try {
        const res = await deviceLocationInstance.get(
          `/api/device/${variant}/history`,
          { params: queryParams }
        );

        // Check if summary object format: { imei, range, points: [...] }
        if (res.data && Array.isArray(res.data.points) && res.data.points.length > 0) {
          return res.data.points.map((p: any) =>
            this.transformLocationData({ ...p, imei: variant }, deviceRegion)
          );
        }

        // Check if array format
        if (Array.isArray(res.data) && res.data.length > 0) {
          return res.data.map((p: any) =>
            this.transformLocationData({ ...p, imei: variant }, deviceRegion)
          );
        }
      } catch (err) {
        // Continue
      }
    }

    // 2. Secondary endpoint: /api/device/:imei/locations
    for (const variant of variants) {
      try {
        const res = await deviceLocationInstance.get(
          `/api/device/${variant}/locations`,
          { params: queryParams }
        );
        if (Array.isArray(res.data) && res.data.length > 0) {
          return res.data.map((p: any) =>
            this.transformLocationData({ ...p, imei: variant }, deviceRegion)
          );
        }
      } catch (err) {
        // Continue
      }
    }

    return [];
  }

  /**
   * 4. Geofences Endpoints
   */
  static async getGeofences(): Promise<GeofenceItem[]> {
    try {
      const response = await deviceLocationInstance.get("/api/geofences");
      if (Array.isArray(response.data)) {
        return response.data.map((g: any) => ({
          ...g,
          id: g.id || g._id?.$oid || g._id,
        }));
      }
      return [];
    } catch (error: any) {
      console.warn("[DeviceLocationService] /api/geofences error:", error?.message);
      return [];
    }
  }

  static async createGeofence(data: Partial<GeofenceItem>): Promise<any> {
    const response = await deviceLocationInstance.post("/api/geofences", data);
    return response.data;
  }

  static async deleteGeofence(geofenceId: string): Promise<any> {
    const response = await deviceLocationInstance.delete(
      `/api/geofence/${geofenceId}`
    );
    return response.data;
  }

  /**
   * 5. Dispatch command to GPS device (e.g. STATUS#, RELAY,1#)
   */
  static async sendCommand(imei: string, command: string): Promise<any> {
    const response = await deviceLocationInstance.post(
      `/api/device/${imei}/command`,
      { command }
    );
    return response.data;
  }

  // Date helper utilities
  static formatDate(date: Date): string {
    return date.toISOString().split("T")[0];
  }

  static getTodayDate(): string {
    return this.formatDate(new Date());
  }

  static getYesterdayDate(): string {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return this.formatDate(yesterday);
  }

  static getWeekAgoDate(): string {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return this.formatDate(weekAgo);
  }

  static getMonthAgoDate(): string {
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    return this.formatDate(monthAgo);
  }
}

export default DeviceLocationService;
