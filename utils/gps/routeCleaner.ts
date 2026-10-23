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
  continuousPath: { lat: number; lng: number }[];
  workingFieldPoints: { lat: number; lng: number }[];
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

// Computes spherical polygon area in hectares (1 ha = 10,000 m²)
export function computePolygonAreaHectares(coords: { lat: number; lng: number }[]): number {
  if (!Array.isArray(coords) || coords.length < 3) return 0;
  const R = 6378137; // Earth's mean radius in meters
  let area = 0;
  const len = coords.length;
  for (let i = 0; i < len; i++) {
    const j = (i + 1) % len;
    const p1 = coords[i];
    const p2 = coords[j];
    const lat1 = (p1.lat * Math.PI) / 180;
    const lat2 = (p2.lat * Math.PI) / 180;
    const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;
    area += dLng * (2 + Math.sin(lat1) + Math.sin(lat2));
  }
  area = Math.abs((area * R * R) / 4);
  const ha = area / 10000;
  return Number(ha.toFixed(1));
}

// Andrew's Monotone Chain Convex Hull algorithm (O(N log N))
export function computeConvexHull(pts: { lat: number; lng: number }[]): { lat: number; lng: number }[] {
  const n = pts.length;
  if (n < 3) return pts;

  const seen = new Set<string>();
  const unique: { lat: number; lng: number }[] = [];
  for (let i = 0; i < n; i++) {
    const key = `${pts[i].lat.toFixed(6)},${pts[i].lng.toFixed(6)}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(pts[i]);
    }
  }
  if (unique.length < 3) return unique;

  unique.sort((a, b) => (a.lat === b.lat ? a.lng - b.lng : a.lat - b.lat));

  const cross = (o: { lat: number; lng: number }, a: { lat: number; lng: number }, b: { lat: number; lng: number }) =>
    (a.lng - o.lng) * (b.lat - o.lat) - (a.lat - o.lat) * (b.lng - o.lng);

  const lower: { lat: number; lng: number }[] = [];
  for (let i = 0; i < unique.length; i++) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], unique[i]) <= 0) {
      lower.pop();
    }
    lower.push(unique[i]);
  }

  const upper: { lat: number; lng: number }[] = [];
  for (let i = unique.length - 1; i >= 0; i--) {
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], unique[i]) <= 0) {
      upper.pop();
    }
    upper.push(unique[i]);
  }

  lower.pop();
  upper.pop();

  return lower.concat(upper);
}

// Extract only points belonging to the actual operating field (excluding long transit roads)
export function getFieldOperatingPoints(pts: { lat: number; lng: number }[]): { lat: number; lng: number }[] {
  if (pts.length < 6) return pts;

  const threshold = 0.0025; // ~250m spatial cluster window
  const counts = new Int32Array(pts.length);

  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 1; j < pts.length; j++) {
      const dLat = Math.abs(pts[i].lat - pts[j].lat);
      const dLng = Math.abs(pts[i].lng - pts[j].lng);
      if (dLat < threshold && dLng < threshold) {
        counts[i]++;
        counts[j]++;
      }
    }
  }

  const fieldPts = pts.filter((_, idx) => counts[idx] >= 3);
  return fieldPts.length >= 3 ? fieldPts : pts;
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

// Fast non-recursive Douglas-Peucker path simplification
export function simplifyPath(
  points: { lat: number; lng: number }[],
  toleranceMeters = 1.8
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

    const dLat = (p.lat - y) * 111320;
    const dLng = (p.lng - x) * 111320 * Math.cos((p.lat * Math.PI) / 180);
    return dLat * dLat + dLng * dLng;
  }

  const stack: [number, number][] = [[0, points.length - 1]];
  const keep = new Uint8Array(points.length);
  keep[0] = 1;
  keep[points.length - 1] = 1;

  while (stack.length > 0) {
    const [first, last] = stack.pop()!;
    let maxSqDist = sqTolerance;
    let index = -1;

    for (let i = first + 1; i < last; i++) {
      const sqDist = getSqDist(points[i], points[first], points[last]);
      if (sqDist > maxSqDist) {
        index = i;
        maxSqDist = sqDist;
      }
    }

    if (index !== -1) {
      keep[index] = 1;
      if (index - first > 1) stack.push([first, index]);
      if (last - index > 1) stack.push([index, last]);
    }
  }

  const simplified: { lat: number; lng: number }[] = [];
  for (let i = 0; i < points.length; i++) {
    if (keep[i]) simplified.push(points[i]);
  }
  return simplified;
}

/**
 * Main cleaning and trip segmentation pipeline
 */
export function cleanAndSegmentRoute(
  rawPoints: DeviceLocationData[],
  options?: {
    isIndia?: boolean;
    maxSpeedKmH?: number; // default 80 km/h
    tripGapMinutes?: number; // default 20 minutes
    tripDistanceGapMeters?: number; // default 1800 meters
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
      continuousPath: [],
      workingFieldPoints: [],
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

    const timeMs =
      (pt as any)._timeMs ||
      parseGpsTime(
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
    if (points.length === 0) return;
    if (points.length === 1) {
      const p = points[0];
      trips.push({
        id: `trip_${trips.length + 1}_${p.timeMs}`,
        points,
        path: [{ lat: p.lat, lng: p.lng }],
        startTime: p.timestamp,
        endTime: p.timestamp,
        distanceKm: 0,
        avgSpeedKmH: Math.round(p.speed || 0),
        maxSpeedKmH: Math.round(p.speed || 0),
        durationMinutes: 1,
        startPoint: p,
        endPoint: p,
      });
      return;
    }

    // Smooth and simplify path for this trip
    const smoothed = smoothCoordinates(points);
    const simplified = simplifyPath(smoothed, 1.6);

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

  const validCleanPoints: CleanRoutePoint[] = [];

  for (let i = 0; i < sanitized.length; i++) {
    const pt = sanitized[i];

    if (currentTripPoints.length === 0) {
      currentTripPoints.push(pt);
      validCleanPoints.push(pt);
      continue;
    }

    const prev = currentTripPoints[currentTripPoints.length - 1];
    const distMeters = haversineMeters(prev.lat, prev.lng, pt.lat, pt.lng);
    const dtSeconds = Math.max(0.5, (pt.timeMs - prev.timeMs) / 1000);
    const impliedSpeedKmH = (distMeters / dtSeconds) * 3.6;

    // 1. Check for temporary spike / multipath bounce glitch (jumps into river or cell tower and returns back)
    if (impliedSpeedKmH > maxAllowedSpeed || (distMeters > 500 && dtSeconds < 120)) {
      let isBounceGlitch = false;
      for (let k = 1; k <= 8 && i + k < sanitized.length; k++) {
        const futurePt = sanitized[i + k];
        const distBackToPrev = haversineMeters(prev.lat, prev.lng, futurePt.lat, futurePt.lng);
        const dtFutureSec = Math.max(0.5, (futurePt.timeMs - prev.timeMs) / 1000);
        // If within the next few points it is back near prev (< 250m or normal tractor speed < 45 km/h)
        if (distBackToPrev < 250 || (distBackToPrev / dtFutureSec) * 3.6 < 45) {
          isBounceGlitch = true;
          break;
        }
      }

      if (isBounceGlitch) {
        outliersDropped++;
        continue; // Reject temporary bounce glitch entirely
      }

      // If it does not return back, check if subsequent points confirm this genuine new location
      let lookaheadSimilar = 0;
      for (let k = 1; k <= 4 && i + k < sanitized.length; k++) {
        const nextPt = sanitized[i + k];
        const dNext = haversineMeters(pt.lat, pt.lng, nextPt.lat, nextPt.lng);
        if (dNext < 2000) {
          lookaheadSimilar++;
        }
      }

      if (lookaheadSimilar >= 2 || sanitized.length - i <= 2) {
        // Genuine new location (e.g. transport to new farm/city) -> End current trip and start new trip!
        finalizeTrip(currentTripPoints);
        currentTripPoints = [pt];
        validCleanPoints.push(pt);
        continue;
      } else {
        // Isolated single-point glitch -> drop outlier
        outliersDropped++;
        continue;
      }
    }

    // 2. Check for trip break: long time gap (> 15 min) AND moved distance (> 250m), or long distance break (> 800m).
    // Pauses in the same field (< 150m) keep the route and working area continuous!
    if ((pt.timeMs - prev.timeMs > tripGapMs && distMeters > 250) || (distMeters > tripDistGapMeters && dtSeconds > 120)) {
      finalizeTrip(currentTripPoints);
      currentTripPoints = [pt];
      validCleanPoints.push(pt);
      continue;
    }

    // Stationary jitter compression (when parked/idling)
    if (distMeters < stationaryRadius && pt.speed < stationarySpeed && prev.speed < stationarySpeed) {
      const dwell = Math.round((pt.timeMs - prev.timeMs) / 60000);
      prev.isStop = true;
      prev.dwellMinutes = (prev.dwellMinutes || 0) + dwell;
      prev.timestamp = pt.timestamp;
      prev.timeMs = pt.timeMs;
      stopsCount++;
      continue;
    }

    currentTripPoints.push(pt);
    validCleanPoints.push(pt);
  }

  // Finalize remaining trip
  if (currentTripPoints.length >= 1) {
    finalizeTrip(currentTripPoints);
  }

  // Fallback: If trips is still empty but validCleanPoints or sanitized has points, ensure a trip exists
  if (trips.length === 0 && validCleanPoints.length >= 1) {
    finalizeTrip(validCleanPoints);
  } else if (trips.length === 0 && sanitized.length >= 1) {
    finalizeTrip(sanitized);
  }

  // Compute aggregate statistics across all clean trips
  let totalDistanceKm = 0;
  let overallMaxSpeed = 0;
  let totalSpeedPoints = 0;
  let speedSum = 0;
  let movingCount = 0;
  let stoppedCount = 0;
  const allCleanPoints: CleanRoutePoint[] = validCleanPoints.length > 0 ? validCleanPoints : sanitized;

  for (const trip of trips) {
    totalDistanceKm += trip.distanceKm;
    if (trip.maxSpeedKmH > overallMaxSpeed) overallMaxSpeed = trip.maxSpeedKmH;
  }

  const continuousCoords: { lat: number; lng: number }[] = [];
  const workingFieldPoints: { lat: number; lng: number }[] = [];

  for (const p of allCleanPoints) {
    speedSum += p.speed;
    totalSpeedPoints++;
    if (p.speed > 1.0) movingCount++;
    else stoppedCount++;

    continuousCoords.push({ lat: p.lat, lng: p.lng });

    // Mark working field points: tractor working implement speed (0.3 km/h to 24 km/h)
    if (p.speed >= 0.3 && p.speed <= 25) {
      workingFieldPoints.push({ lat: p.lat, lng: p.lng });
    }
  }

  // If no points had speed sensor data, use all coordinates for field marking
  const effectiveFieldPoints =
    workingFieldPoints.length >= 3 ? workingFieldPoints : continuousCoords.length >= 3 ? continuousCoords : [];

  // Build unified continuous path from legitimate trips (never bridging across gaps > 250m)
  let continuousPath: { lat: number; lng: number }[] = [];
  if (trips.length === 1) {
    continuousPath = trips[0].path;
  } else if (trips.length > 1) {
    for (let tIdx = 0; tIdx < trips.length; tIdx++) {
      const tPath = trips[tIdx].path;
      if (continuousPath.length === 0) {
        continuousPath.push(...tPath);
      } else {
        const lastPt = continuousPath[continuousPath.length - 1];
        const nextPt = tPath[0];
        const gapDist = haversineMeters(lastPt.lat, lastPt.lng, nextPt.lat, nextPt.lng);
        // Only bridge if points are in the same localized working area (< 250m)
        if (gapDist < 250) {
          continuousPath.push(...tPath);
        }
      }
    }
  }

  const avgSpeed = totalSpeedPoints > 0 ? Math.round(speedSum / totalSpeedPoints) : 0;

  return {
    trips,
    allCleanPoints,
    continuousPath,
    workingFieldPoints: effectiveFieldPoints,
    totalDistanceKm: Number(totalDistanceKm.toFixed(2)),
    maxSpeedKmH: overallMaxSpeed,
    avgSpeedKmH: avgSpeed,
    movingPointsCount: movingCount,
    stoppedPointsCount: stoppedCount,
    outliersDropped,
    stopsCount,
  };
}
