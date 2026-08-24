import axios from "axios";

// Use your existing base URLs
export const DeviceBaseURL = "https://device.holatractor.com/";

export const deviceLocationInstance = axios.create({
  baseURL: DeviceBaseURL,
  headers: {
    "Content-Type": "application/json",
  },
})

export interface DeviceLocationData {
  _id?: {
    $oid: string
  }
  id?: string
  imei: string
  lat: number
  lon: number
  latitude: number
  longitude: number
  speed?: number
  course?: number
  timestamp: string
  created_at: string
  battery_level?: number
}

export interface LocationHistoryParams {
  filter?: "today" | "yesterday" | "week" | "month"
  date?: string // Format: YYYY-MM-DD
  start_date?: string // Format: YYYY-MM-DD
  end_date?: string // Format: YYYY-MM-DD
  limit?: number
}

class DeviceLocationService {
  // Helper method to adjust coordinates based on device region
  private static adjustCoordinatesForRegion(
    lat: number,
    lon: number,
    deviceRegion: string,
  ): { lat: number; lon: number } {
    let adjustedLat = lat
    let adjustedLon = lon

    // If device region is SW (Southwest), make coordinates negative
    if (deviceRegion === "SW") {
      adjustedLat = Math.abs(lat) * -1 // Make latitude negative
      adjustedLon = Math.abs(lon) * -1 // Make longitude negative
    }
    // If device region is NE (Northeast) or any other region, keep coordinates as positive
    else {
      adjustedLat = Math.abs(lat) // Ensure latitude is positive
      adjustedLon = Math.abs(lon) // Ensure longitude is positive
    }

    console.log(
      `[DeviceLocationService] Region: ${deviceRegion}, Original: (${lat}, ${lon}), Adjusted: (${adjustedLat}, ${adjustedLon})`,
    )

    return { lat: adjustedLat, lon: adjustedLon }
  }

  // Helper to normalize IMEI variants (e.g. 15-digit vs 16-digit with leading 0)
  private static getImeiVariants(imei: string): string[] {
    const clean = String(imei || "").trim()
    if (!clean) return []
    const variants = [clean]
    if (clean.startsWith("0")) {
      variants.push(clean.replace(/^0+/, ""))
    } else {
      variants.push(`0${clean}`)
    }
    return [...new Set(variants)]
  }

  // Transform location data with region-based coordinate adjustment
  private static transformLocationData(location: any, deviceRegion: string): DeviceLocationData {
    const originalLat = Number(location.lat || location.latitude || 0)
    const originalLon = Number(location.lon || location.longitude || 0)

    const { lat: adjustedLat, lon: adjustedLon } = this.adjustCoordinatesForRegion(
      originalLat,
      originalLon,
      deviceRegion,
    )

    // Decode course if stored in centidegrees (e.g. 6307 -> 63.07 degrees)
    let courseAngle = Number(location.course || location.heading || 0)
    if (courseAngle > 360) {
      courseAngle = Math.round((courseAngle / 100) % 360)
    }

    return {
      id: location.id || location._id?.$oid || `loc_${Date.now()}_${Math.random()}`,
      imei: location.imei,
      lat: adjustedLat,
      lon: adjustedLon,
      latitude: adjustedLat,
      longitude: adjustedLon,
      speed: Number(location.speed || 0),
      course: courseAngle,
      timestamp: location.timestamp || location.created_at || new Date().toISOString(),
      created_at: location.created_at || location.timestamp || new Date().toISOString(),
      battery_level: location.battery_level || 85,
      _id: location._id,
    }
  }

  // Filter locations array by date/time criteria (client-side verification/fallback)
  private static filterLocationsByTime(locations: any[], params: LocationHistoryParams): any[] {
    if (!Array.isArray(locations) || locations.length === 0) return []

    const now = new Date()

    if (params.filter === "today") {
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
      return locations.filter((loc) => {
        const time = new Date(loc.timestamp || loc.created_at).getTime()
        return time >= todayStart
      })
    }

    if (params.filter === "yesterday") {
      const yesterday = new Date(now)
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStart = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate()).getTime()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
      return locations.filter((loc) => {
        const time = new Date(loc.timestamp || loc.created_at).getTime()
        return time >= yesterdayStart && time < todayStart
      })
    }

    if (params.filter === "week") {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).getTime()
      return locations.filter((loc) => {
        const time = new Date(loc.timestamp || loc.created_at).getTime()
        return time >= weekAgo
      })
    }

    if (params.filter === "month") {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).getTime()
      return locations.filter((loc) => {
        const time = new Date(loc.timestamp || loc.created_at).getTime()
        return time >= monthAgo
      })
    }

    if (params.date) {
      const targetDate = params.date
      return locations.filter((loc) => {
        const locDate = (loc.timestamp || loc.created_at || "").split("T")[0]
        return locDate === targetDate
      })
    }

    if (params.start_date && params.end_date) {
      const start = new Date(params.start_date).getTime()
      const end = new Date(params.end_date).setHours(23, 59, 59, 999)
      return locations.filter((loc) => {
        const time = new Date(loc.timestamp || loc.created_at).getTime()
        return time >= start && time <= end
      })
    }

    return locations
  }

  // Get current/real-time device location from device.holatractor.com
  static async getCurrentDeviceLocation(imei: string, deviceRegion = "NE"): Promise<DeviceLocationData | null> {
    try {
      const variants = this.getImeiVariants(imei)
      console.log(
        "[DeviceLocationService] Fetching current location for IMEI variants:",
        variants,
        "Region:",
        deviceRegion
      )

      let locations: any[] = []

      // 1. Try querying /api/device/${variant}/locations?filter=today for each variant
      for (const variant of variants) {
        try {
          const response = await deviceLocationInstance.get(`/api/device/${variant}/locations`, {
            params: { filter: "today" },
            timeout: 10000,
          })
          if (Array.isArray(response.data) && response.data.length > 0) {
            locations = response.data
            break
          } else if (response.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
            locations = response.data.data
            break
          }
        } catch (err) {
          // continue to next variant
        }
      }

      // If no locations today, try querying without filter for latest position
      if (locations.length === 0) {
        for (const variant of variants) {
          try {
            const response = await deviceLocationInstance.get(`/api/device/${variant}/locations`, {
              timeout: 10000,
            })
            if (Array.isArray(response.data) && response.data.length > 0) {
              locations = response.data
              break
            } else if (response.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
              locations = response.data.data
              break
            }
          } catch (err) {
            // continue
          }
        }
      }

      // 2. Fallback: Query /api/devices summary endpoint
      if (locations.length === 0) {
        try {
          const devicesRes = await deviceLocationInstance.get("/api/devices", { timeout: 10000 })
          if (Array.isArray(devicesRes.data)) {
            const match = devicesRes.data.find((d: any) => variants.includes(String(d.imei)))
            if (match && match.lat !== 0 && match.lon !== 0) {
              return this.transformLocationData(match, deviceRegion)
            }
          }
        } catch (err) {
          console.warn("[DeviceLocationService] /api/devices query error:", err)
        }
      }

      if (locations.length > 0) {
        // Sort by timestamp descending
        const sortedLocations = locations.sort(
          (a, b) => new Date(b.timestamp || b.created_at).getTime() - new Date(a.timestamp || a.created_at).getTime()
        )

        // Find the most recent location with valid non-zero GPS coordinates
        const validLocation = sortedLocations.find(
          (l) => Number(l.lat || l.latitude || 0) !== 0 && Number(l.lon || l.longitude || 0) !== 0
        ) || sortedLocations[0]

        console.log("[DeviceLocationService] Current location resolved:", validLocation)
        return this.transformLocationData(validLocation, deviceRegion)
      }

      console.log("[DeviceLocationService] No current location found for IMEI:", imei)
      return null
    } catch (error) {
      console.error("[DeviceLocationService] Error fetching current device location:", error)
      return null
    }
  }

  // Get device location history & route with enhanced API filtering and region support
  static async getDeviceLocationHistory(
    imei: string,
    params: LocationHistoryParams = {},
    deviceRegion = "NE"
  ): Promise<DeviceLocationData[]> {
    try {
      const variants = this.getImeiVariants(imei)
      console.log("[DeviceLocationService] Fetching history for IMEI variants:", variants, "Params:", params)

      // Build query parameter dictionary for device.holatractor.com ENHANCED API
      const queryParams: Record<string, string> = {}
      if (params.filter) {
        queryParams.filter = params.filter
      }
      if (params.date) {
        queryParams.date = params.date
      }
      if (params.start_date && params.end_date) {
        queryParams.start_date = params.start_date
        queryParams.end_date = params.end_date
      }

      let rawLocations: any[] = []

      // 1. Primary: Query /api/device/${variant}/locations with query params
      for (const variant of variants) {
        try {
          const response = await deviceLocationInstance.get(`/api/device/${variant}/locations`, {
            params: queryParams,
            timeout: 15000,
          })

          if (Array.isArray(response.data)) {
            rawLocations = response.data
            break
          } else if (response.data && Array.isArray(response.data.data)) {
            rawLocations = response.data.data
            break
          }
        } catch (err) {
          // continue
        }
      }

      // 2. Fallback: Query /api/device/${variant}/history if /locations returned nothing and no filter was given
      if (rawLocations.length === 0 && !params.filter && !params.date && !params.start_date) {
        for (const variant of variants) {
          try {
            const histRes = await deviceLocationInstance.get(`/api/device/${variant}/history`, {
              params: queryParams,
              timeout: 15000,
            })
            if (Array.isArray(histRes.data) && histRes.data.length > 0) {
              rawLocations = histRes.data
              break
            }
          } catch (err) {
            // continue
          }
        }
      }

      if (rawLocations.length === 0) {
        return []
      }

      // Ensure client-side filter alignment
      const filtered = this.filterLocationsByTime(rawLocations, params)

      // Filter only points with non-zero coordinates
      const validPoints = filtered.filter(
        (loc) => Number(loc.lat || loc.latitude || 0) !== 0 && Number(loc.lon || loc.longitude || 0) !== 0
      )

      const finalLocations = validPoints.length > 0 ? validPoints : filtered

      // Sort chronological descending (newest first)
      const sorted = finalLocations.sort(
        (a, b) => new Date(b.timestamp || b.created_at).getTime() - new Date(a.timestamp || a.created_at).getTime()
      )

      const limited = params.limit ? sorted.slice(0, params.limit) : sorted

      // Transform coordinates with region calibration (SW -> negative, NE -> positive)
      return limited.map((location: any) => this.transformLocationData(location, deviceRegion))
    } catch (error) {
      console.error("[DeviceLocationService] Error fetching device location history:", error)
      return []
    }
  }

  // Helper method to get today's locations
  static async getTodayLocations(imei: string, deviceRegion = "NE"): Promise<DeviceLocationData[]> {
    return this.getDeviceLocationHistory(imei, { filter: "today" }, deviceRegion)
  }

  // Helper method to get yesterday's locations
  static async getYesterdayLocations(imei: string, deviceRegion = "NE"): Promise<DeviceLocationData[]> {
    return this.getDeviceLocationHistory(imei, { filter: "yesterday" }, deviceRegion)
  }

  // Helper method to get this week's locations
  static async getWeekLocations(imei: string, deviceRegion = "NE"): Promise<DeviceLocationData[]> {
    return this.getDeviceLocationHistory(imei, { filter: "week" }, deviceRegion)
  }

  // Helper method to get this month's locations
  static async getMonthLocations(imei: string, deviceRegion = "NE"): Promise<DeviceLocationData[]> {
    return this.getDeviceLocationHistory(imei, { filter: "month" }, deviceRegion)
  }

  // Helper method to get locations for a specific date
  static async getLocationsByDate(imei: string, date: string, deviceRegion = "NE"): Promise<DeviceLocationData[]> {
    return this.getDeviceLocationHistory(imei, { date }, deviceRegion)
  }

  // Helper method to get locations for a date range
  static async getLocationsByDateRange(
    imei: string,
    startDate: string,
    endDate: string,
    deviceRegion = "NE",
  ): Promise<DeviceLocationData[]> {
    return this.getDeviceLocationHistory(
      imei,
      {
        start_date: startDate,
        end_date: endDate,
      },
      deviceRegion,
    )
  }

  // Format date to YYYY-MM-DD
  static formatDate(date: Date): string {
    return date.toISOString().split("T")[0]
  }

  // Get today's date
  static getTodayDate(): string {
    return this.formatDate(new Date())
  }

  // Get date for yesterday
  static getYesterdayDate(): string {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    return this.formatDate(yesterday)
  }

  // Get date for a week ago
  static getWeekAgoDate(): string {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return this.formatDate(weekAgo)
  }

  // Get date for a month ago
  static getMonthAgoDate(): string {
    const monthAgo = new Date()
    monthAgo.setMonth(monthAgo.getMonth() - 1)
    return this.formatDate(monthAgo)
  }
}

export default DeviceLocationService
