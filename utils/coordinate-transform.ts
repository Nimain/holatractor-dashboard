export type Region = "NE" | "SW"

export interface DeviceLocationData {
  _id: {
    $oid: string
  }
  imei: string
  lat: number
  lon: number
  speed: number
  course: number
  timestamp: string
  created_at: string
  accuracy?: number
  satellites?: number
  hdop?: number
}

export interface FilteredLocation extends DeviceLocationData {
  isFiltered?: boolean
  filterReason?: string
}

// Enhanced Location Filtering Class
export class ImprovedLocationFiltering {
  // Enhanced filtering parameters for tractors
  private static readonly MAX_SPEED_KMH = 80 // Reduced from 150 for tractors
  private static readonly MIN_TIME_DIFF_SECONDS = 15 // Increased from 30
  private static readonly MAX_DISTANCE_JUMP_METERS = 300 // Reduced from 500
  private static readonly MIN_ACCURACY_METERS = 50 // Better accuracy requirement
  private static readonly DUPLICATE_DISTANCE_METERS = 10 // Increased from 5

  static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000 // Earth's radius in meters
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  static improvedCoordinateTransform(
    lat: number,
    lon: number,
    region: string,
  ): { latitude: number; longitude: number } {
    // More sophisticated coordinate handling
    let transformedLat = lat
    let transformedLon = lon

    // Handle coordinate system based on region and actual values
    if (region === "SW") {
      // For Southwest regions, coordinates should typically be negative
      // But only transform if they seem to be in wrong format
      if (lat > 0 && lon > 0) {
        // Check if these positive coordinates make sense for SW region
        // If lat/lon are small positive numbers, they might need to be negative
        if (lat < 90 && lon < 180) {
          transformedLat = -Math.abs(lat)
          transformedLon = -Math.abs(lon)
        }
      }
    } else if (region === "NE") {
      // For Northeast regions, ensure positive coordinates
      transformedLat = Math.abs(lat)
      transformedLon = Math.abs(lon)
    }

    // Additional validation - if coordinates seem unrealistic, don't transform
    if (Math.abs(transformedLat) > 90 || Math.abs(transformedLon) > 180) {
      return { latitude: lat, longitude: lon } // Return original
    }

    return { latitude: transformedLat, longitude: transformedLon }
  }

  static enhancedLocationFiltering(allLocations: DeviceLocationData[], region: string): FilteredLocation[] {
    if (allLocations.length === 0) return []

    // Sort by timestamp first - CRITICAL for proper filtering
    const sortedLocations = [...allLocations].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    )

    const finalFiltered: FilteredLocation[] = []
    let currentFilteredOutCount = 0

    for (let i = 0; i < sortedLocations.length; i++) {
      const current = sortedLocations[i]

      // Transform coordinates using improved method
      const { latitude, longitude } = this.improvedCoordinateTransform(current.lat, current.lon, region)

      const transformedCurrent = {
        ...current,
        lat: latitude,
        lon: longitude,
      }

      // First location is always included (with quality check)
      if (i === 0) {
        const quality = this.assessLocationQuality(transformedCurrent)
        finalFiltered.push({
          ...transformedCurrent,
          isFiltered: quality.quality === "poor",
          filterReason: quality.reason,
        })
        continue
      }

      const prev = finalFiltered[finalFiltered.length - 1]
      if (!prev) {
        finalFiltered.push({ ...transformedCurrent, isFiltered: false })
        continue
      }

      // Enhanced quality assessment
      const quality = this.assessLocationQuality(transformedCurrent)
      if (quality.quality === "poor") {
        currentFilteredOutCount++
        continue // Skip poor quality locations entirely
      }

      // Calculate metrics for filtering
      const distance = this.calculateDistance(prev.lat, prev.lon, transformedCurrent.lat, transformedCurrent.lon)
      const timeDiff = (new Date(transformedCurrent.timestamp).getTime() - new Date(prev.timestamp).getTime()) / 1000

      // Enhanced filtering logic
      let shouldFilter = false
      let filterReason = ""

      // Time-based filtering - more strict
      if (timeDiff < this.MIN_TIME_DIFF_SECONDS) {
        shouldFilter = true
        filterReason = "Too frequent updates"
      }
      // Distance jump filtering - detect GPS errors
      else if (timeDiff < 60 && distance > this.MAX_DISTANCE_JUMP_METERS) {
        shouldFilter = true
        filterReason = "Unrealistic distance jump"
      }
      // Speed filtering - more realistic for tractors
      else if (timeDiff > 0) {
        const calculatedSpeed = (distance / timeDiff) * 3.6 // km/h
        if (calculatedSpeed > this.MAX_SPEED_KMH) {
          shouldFilter = true
          filterReason = `Unrealistic speed: ${calculatedSpeed.toFixed(1)} km/h`
        }
      }
      // Duplicate location filtering
      else if (distance < this.DUPLICATE_DISTANCE_METERS) {
        shouldFilter = true
        filterReason = "Duplicate location"
      }

      if (shouldFilter) {
        currentFilteredOutCount++
        continue
      }

      // Additional road-sense filtering
      if (this.isLocationOffRoad(transformedCurrent, prev, finalFiltered.slice(-5))) {
        currentFilteredOutCount++
        continue
      }

      finalFiltered.push({
        ...transformedCurrent,
        isFiltered: false,
      })
    }

    console.log(`[enhancedLocationFiltering] Filtered out ${currentFilteredOutCount} locations`)
    return finalFiltered
  }

  private static assessLocationQuality(loc: DeviceLocationData): { quality: "good" | "poor"; reason?: string } {
    // Enhanced quality assessment
    if (loc.accuracy && loc.accuracy > this.MIN_ACCURACY_METERS) {
      return { quality: "poor", reason: `Low GPS accuracy: ${loc.accuracy}m` }
    }
    if (loc.satellites && loc.satellites < 4) {
      return { quality: "poor", reason: `Insufficient satellites: ${loc.satellites}` }
    }
    if (loc.hdop && loc.hdop > 2.0) {
      return { quality: "poor", reason: `Poor GPS geometry: ${loc.hdop}` }
    }
    if (loc.speed && loc.speed > this.MAX_SPEED_KMH) {
      return { quality: "poor", reason: `Unrealistic speed: ${loc.speed} km/h` }
    }

    // Check for obviously invalid coordinates
    if (Math.abs(loc.lat) < 0.001 && Math.abs(loc.lon) < 0.001) {
      return { quality: "poor", reason: "Near-zero coordinates" }
    }

    return { quality: "good" }
  }

  private static isLocationOffRoad(
    current: DeviceLocationData,
    previous: DeviceLocationData,
    recentLocations: FilteredLocation[],
  ): boolean {
    if (recentLocations.length < 3) return false

    // Check if current location creates a sharp deviation from recent path
    const recentValidLocations = recentLocations.filter((loc) => !loc.isFiltered).slice(-3)
    if (recentValidLocations.length < 2) return false

    // Calculate average direction from recent locations
    let totalBearing = 0
    let bearingCount = 0

    for (let i = 1; i < recentValidLocations.length; i++) {
      const bearing = this.calculateBearing(
        recentValidLocations[i - 1].lat,
        recentValidLocations[i - 1].lon,
        recentValidLocations[i].lat,
        recentValidLocations[i].lon,
      )
      totalBearing += bearing
      bearingCount++
    }

    if (bearingCount === 0) return false

    const avgBearing = totalBearing / bearingCount
    const currentBearing = this.calculateBearing(previous.lat, previous.lon, current.lat, current.lon)

    // Check for sharp direction changes (> 90 degrees)
    const bearingDiff = Math.abs(avgBearing - currentBearing)
    const normalizedDiff = Math.min(bearingDiff, 360 - bearingDiff)

    return normalizedDiff > 90 // Sharp turn indicates possible GPS error
  }

  private static calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const lat1Rad = (lat1 * Math.PI) / 180
    const lat2Rad = (lat2 * Math.PI) / 180

    const y = Math.sin(dLon) * Math.cos(lat2Rad)
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon)

    const bearing = (Math.atan2(y, x) * 180) / Math.PI
    return (bearing + 360) % 360
  }

  // Smooth the path by removing obvious outliers
  static smoothPath(locations: FilteredLocation[]): FilteredLocation[] {
    if (locations.length < 3) return locations

    const smoothed: FilteredLocation[] = []

    for (let i = 0; i < locations.length; i++) {
      const current = locations[i]

      if (current.isFiltered) continue // Skip already filtered locations

      // Always include first and last points
      if (i === 0 || i === locations.length - 1) {
        smoothed.push(current)
        continue
      }

      // For middle points, check if they create unrealistic paths
      const prev = smoothed[smoothed.length - 1]
      if (!prev) {
        smoothed.push(current)
        continue
      }

      // Look ahead to next valid location
      let nextValid = null
      for (let j = i + 1; j < locations.length; j++) {
        if (!locations[j].isFiltered) {
          nextValid = locations[j]
          break
        }
      }

      if (nextValid) {
        // Check if current point creates a detour
        const directDistance = this.calculateDistance(prev.lat, prev.lon, nextValid.lat, nextValid.lon)
        const viaCurrentDistance =
          this.calculateDistance(prev.lat, prev.lon, current.lat, current.lon) +
          this.calculateDistance(current.lat, current.lon, nextValid.lat, nextValid.lon)

        const detourRatio = viaCurrentDistance / Math.max(directDistance, 1)

        // If detour is too large, skip this point
        if (detourRatio > 2.5) {
          continue
        }
      }

      smoothed.push(current)
    }

    return smoothed
  }
}

// Keep your existing functions but improve them
export const transformCoordinatesByRegion = (
  lat: number,
  lon: number,
  regionParam?: Region,
): { latitude: number; longitude: number } => {
  const effectiveRegion = (regionParam || "SW").toUpperCase()
  console.log(
    `[transformCoordinatesByRegion] Input: lat=${lat}, lon=${lon}, regionParam=${regionParam}, effectiveRegion=${effectiveRegion}`,
  )

  // Use improved coordinate transformation
  return ImprovedLocationFiltering.improvedCoordinateTransform(lat, lon, effectiveRegion)
}

export const isValidLocation = (loc: DeviceLocationData): boolean => {
  return (
    loc &&
    typeof loc.lat === "number" &&
    typeof loc.lon === "number" &&
    !isNaN(loc.lat) &&
    !isNaN(loc.lon) &&
    loc.lat !== 0 &&
    loc.lon !== 0 &&
    Math.abs(loc.lat) <= 90 &&
    Math.abs(loc.lon) <= 180
  )
}

export const assessLocationQuality = (loc: DeviceLocationData): { quality: "good" | "poor"; reason?: string } => {
  if (loc.accuracy && loc.accuracy > 50) {
    return { quality: "poor", reason: "Low GPS accuracy" }
  }
  if (loc.satellites && loc.satellites < 4) {
    return { quality: "poor", reason: "Insufficient satellites" }
  }
  if (loc.hdop && loc.hdop > 2.0) {
    return { quality: "poor", reason: "Poor GPS geometry" }
  }
  if (loc.speed && loc.speed > 120) {
    return { quality: "poor", reason: "Unrealistic speed" }
  }
  return { quality: "good" }
}

export const calculateDistance = ImprovedLocationFiltering.calculateDistance

// Helper function to validate coordinates before creating LatLng objects
export const validateAndTransformCoordinates = (
  lat: number | undefined | null,
  lon: number | undefined | null,
  region: Region = "SW",
): { latitude: number; longitude: number } | null => {
  // First check if coordinates exist and are numbers
  if (
    lat === undefined ||
    lat === null ||
    lon === undefined ||
    lon === null ||
    typeof lat !== "number" ||
    typeof lon !== "number" ||
    isNaN(lat) ||
    isNaN(lon)
  ) {
    console.warn("[validateAndTransformCoordinates] Invalid coordinates:", { lat, lon })
    return null
  }

  // Check if coordinates are within valid bounds
  if (Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    console.warn("[validateAndTransformCoordinates] Coordinates out of bounds:", { lat, lon })
    return null
  }

  // Check for zero coordinates (often indicates GPS error)
  if (lat === 0 && lon === 0) {
    console.warn("[validateAndTransformCoordinates] Zero coordinates detected:", { lat, lon })
    return null
  }

  // Transform coordinates based on region
  return ImprovedLocationFiltering.improvedCoordinateTransform(lat, lon, region)
}
