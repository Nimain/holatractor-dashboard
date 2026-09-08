/**
 * GPS Route Cleaner and Trip Segmenter for Agricultural Machinery & Fleet
 * 
 * Solves:
 * 1. Teleportation Spikes: Rejects physically impossible jumps (> 80 km/h or cross-country glitches)
 * 2. Stationary Multipath Jitter: Compresses GPS drift when parked/idling (speed < 1.5 km/h) into clean stop pins
 * 3. Disconnected Trips: Segments paths separated by > 20 min pauses or distance breaks instead of drawing straight lines across the landscape
 * 4. Road & Field Smoothing: Weighted moving average smoothing to align tracks naturally along roads and field swaths
 */

import { DeviceLocationData } from "../Axios/DeviceLocationService";

export interface CleanRoutePoint {
  lat: number;
  lng: number;
  speed: number;
  course: number;
  timestamp: string;
  timeMs: number;
  isStop?: boolean;
  dwellMinutes?: number;
}

export interface TripSegment {
  id: string;
  points: CleanRoutePoint[];
  path: { lat: number; lng: number }[];
  startTime: string;
  endTime: string;
  distanceKm: number;
  avgSpeedKmH: number;
  maxSpeedKmH: number;
  durationMinutes: number;
  startPoint: CleanRoutePoint;
  endPoint: CleanRoutePoint;
}

export interface CleanRouteResult {
  trips: TripSegment[];
  allCleanPoints: CleanRoutePoint[];
  totalDistanceKm: number;
  maxSpeedKmH: number;
  avgSpeedKmH: number;
  movingPointsCount: number;
  stoppedPointsCount: number;
  outliersDropped: number;
  stopsCount: number;
}

// Haversine distance in meters
export function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Calculate compass bearing in degrees (0-360) from point 1 to point 2
export function calculateBearing(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): number {
  const dLat = (to.lat - from.lat) * (Math.PI / 180);
  const dLng = (to.lng - from.lng) * (Math.PI / 180);
  const y = Math.sin(dLng) * Math.cos(to.lat * (Math.PI / 180));
  const x =
    Math.cos(from.lat * (Math.PI / 180)) * Math.sin(to.lat * (Math.PI / 180)) -
    Math.sin(from.lat * (Math.PI / 180)) * Math.cos(to.lat * (Math.PI / 180)) * Math.cos(dLng);
  return Math.round((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

// Parse various timestamp formats into milliseconds
export function parseGpsTime(val: any): number {
  if (!val) return 0;
  if (typeof val === "number") {
    return val < 1e11 ? val * 1000 : val;
  }
  const str = String(val).trim();
  const num = Number(str);
  if (!isNaN(num) && num > 1e8) {
    return num < 1e11 ? num * 1000 : num;
  }
  const parsed = new Date(str).getTime();
  return isNaN(parsed) ? 0 : parsed;
}

// 3-point weighted moving average smoothing along road/field path
export function smoothCoordinates(
  points: CleanRoutePoint[],
  smoothingWindow = 3
): { lat: number; lng: number }[] {
  if (points.length <= 2) {
    return points.map((p) => ({ lat: p.lat, lng: p.lng }));
  }

  const result: { lat: number; lng: number }[] = [];
  result.push({ lat: points[0].lat, lng: points[0].lng });

  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const next = points[i + 1];

    // Preserve stationary stop points exactly
    if (curr.isStop || curr.speed < 1.0) {
      result.push({ lat: curr.lat, lng: curr.lng });
      continue;
    }

    // Weighted average (0.22 prev, 0.56 curr, 0.22 next)
    const smoothLat = 0.22 * prev.lat + 0.56 * curr.lat + 0.22 * next.lat;
    const smoothLng = 0.22 * prev.lng + 0.56 * curr.lng + 0.22 * next.lng;

    result.push({ lat: smoothLat, lng: smoothLng });
  }

  result.push({
    lat: points[points.length - 1].lat,
    lng: points[points.length - 1].lng,
  });

  return result;
}

// Douglas-Peucker path simplification
export function simplifyPath(
  points: { lat: number; lng: number }[],
  toleranceMeters = 2.0
): { lat: number; lng: number }[] {
  if (points.length <= 2) return points;

  const sqTolerance = toleranceMeters * toleranceMeters;

  function getSqDist(
    p: { lat: number; lng: number },
    p1: { lat: number; lng: number },
    p2: { lat: number; lng: number }
  ) {
    let x = p1.lng;
    let y = p1.lat;
    let dx = p2.lng - x;
    let dy = p2.lat - y;

    if (dx !== 0 || dy !== 0) {
      const t = ((p.lng - x) * dx + (p.lat - y) * dy) / (dx * dx + dy * dy);
      if (t > 1) {
        x = p2.lng;
        y = p2.lat;
      } else if (t > 0) {
        x += dx * t;
        y += dy * t;
      }
    }

    // Convert degree distance to approximate meters squared
    const dLat = (p.lat - y) * 111320;
    const dLng = (p.lng - x) * 111320 * Math.cos((p.lat * Math.PI) / 180);
    return dLat * dLat + dLng * dLng;
  }

  function simplifyDPStep(
    pts: { lat: number; lng: number }[],
    first: number,
    last: number,
    sqTol: number,
    simplified: { lat: number; lng: number }[]
  ) {
    let maxSqDist = sqTol;
    let index = -1;

    for (let i = first + 1; i < last; i++) {
      const sqDist = getSqDist(pts[i], pts[first], pts[last]);
      if (sqDist > maxSqDist) {
        index = i;
        maxSqDist = sqDist;
      }
    }

    if (maxSqDist > sqTol && index !== -1) {
      if (index - first > 1) simplifyDPStep(pts, first, index, sqTol, simplified);
      simplified.push(pts[index]);
      if (last - index > 1) simplifyDPStep(pts, index, last, sqTol, simplified);
    }
  }

  const simplified: { lat: number; lng: number }[] = [points[0]];
  simplifyDPStep(points, 0, points.length - 1, sqTolerance, simplified);
  simplified.push(points[points.length - 1]);

  return simplified;
}

/**
 * Main cleaning and trip segmentation pipeline
 */
export function cleanAndSegmentRoute(
  rawPoints: DeviceLocationData[],
  options?: {
    isIndia?: boolean;
    maxSpeedKmH?: number; // default 75 km/h
    tripGapMinutes?: number; // default 20 minutes
    tripDistanceGapMeters?: number; // default 1500 meters
    stationarySpeedThresholdKmH?: number; // default 1.5 km/h
    stationaryRadiusMeters?: number; // default 18 meters
  }
): CleanRouteResult {
  const isIndia = options?.isIndia ?? false;
  const maxAllowedSpeed = options?.maxSpeedKmH ?? 80;
  const tripGapMs = (options?.tripGapMinutes ?? 20) * 60 * 1000;
  const tripDistGapMeters = options?.tripDistanceGapMeters ?? 1800;
  const stationarySpeed = options?.stationarySpeedThresholdKmH ?? 1.5;
  const stationaryRadius = options?.stationaryRadiusMeters ?? 18;

  if (!Array.isArray(rawPoints) || rawPoints.length === 0) {
    return {
      trips: [],
      allCleanPoints: [],
      totalDistanceKm: 0,
      maxSpeedKmH: 0,
      avgSpeedKmH: 0,
      movingPointsCount: 0,
      stoppedPointsCount: 0,
      outliersDropped: 0,
      stopsCount: 0,
    };
  }

  // 1. Sanitize, calibrate, and sort chronologically
  const sanitized: CleanRoutePoint[] = [];
  for (const pt of rawPoints) {
    const rawLat = Number(pt.lat ?? (pt as any).latitude ?? 0);
    const rawLon = Number(pt.lon ?? (pt as any).longitude ?? 0);

    if (isNaN(rawLat) || isNaN(rawLon) || (rawLat === 0 && rawLon === 0)) {
      continue;
    }

    // Hemisphere calibration
    const lat = isIndia ? Math.abs(rawLat) : rawLat > 0 ? -Math.abs(rawLat) : rawLat;
    const lng = isIndia ? Math.abs(rawLon) : rawLon > 0 ? -Math.abs(rawLon) : rawLon;

    const timeMs = parseGpsTime(
      pt.timestamp || (pt as any).created_at || (pt as any).time || (pt as any).datetime
    );
    const speed = Math.max(0, Number(pt.speed ?? 0));
    const course = Number(pt.course ?? 0);

    sanitized.push({
      lat,
      lng,
      speed,
      course,
      timestamp: pt.timestamp || new Date(timeMs || Date.now()).toISOString(),
      timeMs,
    });
  }

  // Ensure strict chronological order
  sanitized.sort((a, b) => a.timeMs - b.timeMs);

  // 2. Outlier rejection, stationary clustering, and trip segmentation
  const trips: TripSegment[] = [];
  let currentTripPoints: CleanRoutePoint[] = [];
  let outliersDropped = 0;
  let stopsCount = 0;

  function finalizeTrip(points: CleanRoutePoint[]) {
    if (points.length < 2) return;

    // Smooth and simplify path for this trip
    const smoothed = smoothCoordinates(points);
    const simplified = simplifyPath(smoothed, 1.8);

    let tripDistMeters = 0;
    let maxSp = 0;
    let sumSp = 0;

    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      if (p.speed > maxSp) maxSp = p.speed;
      sumSp += p.speed;

      if (i > 0) {
        const prev = points[i - 1];
        const d = haversineMeters(prev.lat, prev.lng, p.lat, p.lng);
        tripDistMeters += d;
      }
    }

    const startP = points[0];
    const endP = points[points.length - 1];
    const durationMin = Math.max(1, Math.round((endP.timeMs - startP.timeMs) / 60000));
    const distanceKm = Number((tripDistMeters / 1000).toFixed(2));

    trips.push({
      id: `trip_${trips.length + 1}_${startP.timeMs}`,
      points,
      path: simplified.length >= 2 ? simplified : points.map((p) => ({ lat: p.lat, lng: p.lng })),
      startTime: startP.timestamp,
      endTime: endP.timestamp,
      distanceKm,
      avgSpeedKmH: Math.round(sumSp / points.length),
      maxSpeedKmH: Math.round(maxSp),
      durationMinutes: durationMin,
      startPoint: startP,
      endPoint: endP,
    });
  }

  for (let i = 0; i < sanitized.length; i++) {
    const pt = sanitized[i];

    if (currentTripPoints.length === 0) {
      currentTripPoints.push(pt);
      continue;
    }

    const prev = currentTripPoints[currentTripPoints.length - 1];
    const distMeters = haversineMeters(prev.lat, prev.lng, pt.lat, pt.lng);
    const dtSeconds = Math.max(0.5, (pt.timeMs - prev.timeMs) / 1000);
    const impliedSpeedKmH = (distMeters / dtSeconds) * 3.6;

    // Check for impossible teleportation spike (e.g. 600km jump to Lima or Peru->Bolivia in seconds)
    if (impliedSpeedKmH > maxAllowedSpeed || (distMeters > 3000 && dtSeconds < 120)) {
      // Look ahead to see if the device genuinely relocated (session split) or if it's an isolated glitch
      let lookaheadSimilar = 0;
      for (let k = 1; k <= 3 && i + k < sanitized.length; k++) {
        const nextPt = sanitized[i + k];
        const dNext = haversineMeters(pt.lat, pt.lng, nextPt.lat, nextPt.lng);
        if (dNext < 2000) {
          lookaheadSimilar++;
        }
      }

      if (lookaheadSimilar >= 2) {
        // Genuine new location (e.g. transport to new farm) -> End current trip and start new trip!
        finalizeTrip(currentTripPoints);
        currentTripPoints = [pt];
        continue;
      } else {
        // Isolated single-point glitch -> drop outlier
        outliersDropped++;
        continue;
      }
    }

    // Check for trip break: long time gap (> 20 min) or distance break
    if (pt.timeMs - prev.timeMs > tripGapMs || (distMeters > tripDistGapMeters && dtSeconds > 300)) {
      finalizeTrip(currentTripPoints);
      currentTripPoints = [pt];
      continue;
    }

    // Stationary jitter compression (when parked/idling)
    if (distMeters < stationaryRadius && pt.speed < stationarySpeed && prev.speed < stationarySpeed) {
      // Tractor is stationary; do NOT draw zigzag lines back and forth.
      // Update dwell time on the anchor point
      const dwell = Math.round((pt.timeMs - prev.timeMs) / 60000);
      prev.isStop = true;
      prev.dwellMinutes = (prev.dwellMinutes || 0) + dwell;
      prev.timestamp = pt.timestamp;
      prev.timeMs = pt.timeMs;
      stopsCount++;
      continue;
    }

    currentTripPoints.push(pt);
  }

  // Finalize remaining trip
  if (currentTripPoints.length >= 2) {
    finalizeTrip(currentTripPoints);
  }

  // Compute aggregate statistics across all clean trips
  let totalDistanceKm = 0;
  let overallMaxSpeed = 0;
  let totalSpeedPoints = 0;
  let speedSum = 0;
  let movingCount = 0;
  let stoppedCount = 0;
  const allCleanPoints: CleanRoutePoint[] = [];

  for (const trip of trips) {
    totalDistanceKm += trip.distanceKm;
    if (trip.maxSpeedKmH > overallMaxSpeed) overallMaxSpeed = trip.maxSpeedKmH;

    for (const p of trip.points) {
      allCleanPoints.push(p);
      speedSum += p.speed;
      totalSpeedPoints++;
      if (p.speed > 1.0) movingCount++;
      else stoppedCount++;
    }
  }

  const avgSpeed = totalSpeedPoints > 0 ? Math.round(speedSum / totalSpeedPoints) : 0;

  return {
    trips,
    allCleanPoints,
    totalDistanceKm: Number(totalDistanceKm.toFixed(2)),
    maxSpeedKmH: overallMaxSpeed,
    avgSpeedKmH: avgSpeed,
    movingPointsCount: movingCount,
    stoppedPointsCount: stoppedCount,
    outliersDropped,
    stopsCount,
  };
}
