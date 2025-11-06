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

  // Transform location data with region-based coordinate adjustment
  private static transformLocationData(location: any, deviceRegion: string): DeviceLocationData {
    const originalLat = Number(location.lat)
    const originalLon = Number(location.lon)

    const { lat: adjustedLat, lon: adjustedLon } = this.adjustCoordinatesForRegion(
      originalLat,
      originalLon,
      deviceRegion,
    )

    return {
      id: location.id || location._id?.$oid || `loc_${Date.now()}_${Math.random()}`,
      imei: location.imei,
      lat: adjustedLat,
      lon: adjustedLon,
      latitude: adjustedLat,
      longitude: adjustedLon,
      speed: location.speed || 0,
      course: location.course || 0,
      timestamp: location.timestamp,
      created_at: location.created_at,
      battery_level: location.battery_level,
      _id: location._id,
    }
  }

  // Get current/today device location
  static async getCurrentDeviceLocation(imei: string, deviceRegion = "NE"): Promise<DeviceLocationData | null> {
    try {
      const todayDate = this.getTodayDate()
      console.log(
        "[DeviceLocationService] Fetching current location for IMEI:",
        imei,
        "Date:",
        todayDate,
        "Region:",
        deviceRegion,
      )

      const response = await deviceLocationInstance.get(`/api/device/${imei}/history?date=${todayDate}`)
      console.log("[DeviceLocationService] Current location response:", response.data)

      // Get the most recent location from today's data
      let locations: any[] = []
      if (Array.isArray(response.data)) {
        locations = response.data
      } else if (response.data && Array.isArray(response.data.locations)) {
        locations = response.data.locations
      } else if (response.data && Array.isArray(response.data.data)) {
        locations = response.data.data
      }

      if (locations.length > 0) {
        // Sort by timestamp to get the most recent
        const sortedLocations = locations.sort(
          (a, b) => new Date(b.timestamp || b.created_at).getTime() - new Date(a.timestamp || a.created_at).getTime(),
        )

        const currentLocation = sortedLocations[0]
        console.log("[DeviceLocationService] Current location found:", currentLocation)

        // Transform with region-based coordinate adjustment
        return this.transformLocationData(currentLocation, deviceRegion)
      }

      console.log("[DeviceLocationService] No current location found for today")
      return null
    } catch (error) {
      console.error("[DeviceLocationService] Error fetching current device location:", error)
      return null
    }
  }

  // Get device location history with dynamic filters and region support
  static async getDeviceLocationHistory(
    imei: string,
    params: LocationHistoryParams = {},
    deviceRegion = "NE",
  ): Promise<DeviceLocationData[]> {
    try {
      // Build query parameters
      const queryParams = new URLSearchParams()

      if (params.filter) {
        queryParams.append("filter", params.filter)
      }

      if (params.date) {
        queryParams.append("date", params.date)
      }

      if (params.start_date && params.end_date) {
        queryParams.append("start_date", params.start_date)
        queryParams.append("end_date", params.end_date)
      }

      if (params.limit) {
        queryParams.append("limit", params.limit.toString())
      }

      const queryString = queryParams.toString()
      const url = `/api/device/${imei}/history${queryString ? `?${queryString}` : ""}`

      console.log("[DeviceLocationService] Fetching location history:", url, "Region:", deviceRegion)

      const response = await deviceLocationInstance.get(url)

      // Handle different response formats
      let locations: any[] = []

      if (Array.isArray(response.data)) {
        locations = response.data
      } else if (response.data && Array.isArray(response.data.locations)) {
        locations = response.data.locations
      } else if (response.data && Array.isArray(response.data.data)) {
        locations = response.data.data
      }

      // Transform the data with region-based coordinate adjustment
      return locations.map((location: any) => this.transformLocationData(location, deviceRegion))
    } catch (error) {
      console.error("Error fetching device location history:", error)
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
