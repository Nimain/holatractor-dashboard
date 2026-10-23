/**
 * Utility to generate realistic SVG tractor icons for map markers with 100% transparent background
 * Features a detailed, high-fidelity top-down agricultural tractor design with:
 * - Real deep-lug chevron tire treads & heavy wheels
 * - Contoured engine hood with air intakes & headlights
 * - Realistic panoramic driver cabin with tinted glass specular reflection
 * - Dynamic vehicle heading rotation (0° - 360°)
 * - Slow subtle engine idle vibration and beacon pulse animations
 */

declare var google: any

export interface TractorIconOptions {
  course?: number // Course / heading angle in degrees (0 = North, 90 = East, 180 = South, etc.)
  steerAngle?: number // Front wheel steering angle (-18° to +18°)
  isSelected?: boolean
  isLive?: boolean
  isMoving?: boolean
  status?: "Active" | "Not Connected" | "Maintenance" | "Offline" | string
  size?: number // width & height in pixels (default 72)
}

/**
 * Returns raw SVG string for a highly accurate agricultural tractor icon with responsive motion vs idle state
 */
export function getTractorSvgString({
  course = 0,
  steerAngle = 0,
  isSelected = true,
  isLive = true,
  isMoving = false,
  status = "Active",
  size = 72,
}: TractorIconOptions = {}): string {
  const isConnected = status === "Active" || (isLive && status !== "Not Connected" && status !== "Offline")
  const activeMoving = isConnected && isMoving

  // Ensure safe numerical values for rotation & steering (guarded against NaN or out-of-range values)
  const numCourse = Number(course)
  const safeCourse = Number.isFinite(numCourse) ? Math.round(((numCourse % 360) + 360) % 360) : 0
  const numSteer = Number(steerAngle)
  const safeSteer = Number.isFinite(numSteer) ? Math.round(Math.max(-20, Math.min(20, numSteer))) : 0

  // Authentic Agricultural John Deere / Modern Farm Tractor Color Palette
  const bodyPrimary = isConnected ? "#16A34A" : "#64748B"
  const bodyDark = isConnected ? "#14532D" : "#334155"
  const bodyHighlight = isConnected ? "#4ADE80" : "#94A3B8"
  const rimColor = isConnected ? "#FACC15" : "#94A3B8"
  const rimDark = isConnected ? "#CA8A04" : "#475569"

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100" fill="none" style="overflow: visible; background: transparent; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.55));">
      <defs>
        <!-- Metallic Engine Hood Gradient -->
        <linearGradient id="hood-grad-${size}" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="${bodyDark}" />
          <stop offset="20%" stop-color="${bodyHighlight}" />
          <stop offset="50%" stop-color="${bodyPrimary}" />
          <stop offset="80%" stop-color="${bodyHighlight}" />
          <stop offset="100%" stop-color="${bodyDark}" />
        </linearGradient>

        <!-- Panoramic Cabin Windshield Glass Gradient -->
        <linearGradient id="cab-glass-grad-${size}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#38BDF8" stop-opacity="0.95" />
          <stop offset="40%" stop-color="#0284C7" stop-opacity="0.8" />
          <stop offset="100%" stop-color="#0F172A" stop-opacity="0.95" />
        </linearGradient>

        <!-- Deep Rubber Tire Tread Gradient -->
        <linearGradient id="tire-rubber-grad-${size}" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#09090B" />
          <stop offset="50%" stop-color="#27272A" />
          <stop offset="100%" stop-color="#09090B" />
        </linearGradient>

        <!-- Motion Speed Trail Gradient -->
        <linearGradient id="motion-trail-grad" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stop-color="#10B981" stop-opacity="0" />
          <stop offset="100%" stop-color="#10B981" stop-opacity="0.6" />
        </linearGradient>

        <!-- Clip Paths for Real Wheel Tires to contain continuous rolling chevron treads -->
        <clipPath id="rear-tire-left-clip-${size}">
          <rect x="18" y="47" width="14" height="34" rx="5" />
        </clipPath>
        <clipPath id="rear-tire-right-clip-${size}">
          <rect x="68" y="47" width="14" height="34" rx="5" />
        </clipPath>
        <clipPath id="front-tire-left-clip-${size}">
          <rect x="23" y="21" width="9.5" height="19" rx="3.5" />
        </clipPath>
        <clipPath id="front-tire-right-clip-${size}">
          <rect x="67.5" y="21" width="9.5" height="19" rx="3.5" />
        </clipPath>
      </defs>

      <!-- Rotation around center (50, 50) according to tractor course / heading -->
      <g transform="rotate(${safeCourse}, 50, 50)">

        <!-- Forward Heading Direction Arrow -->
        <polygon points="50,2 58,14 50,10 42,14" fill="#EF4444" stroke="#FFFFFF" stroke-width="1.2" />

        <!-- Tractor Chassis Group (Completely Stable, Pure Forward Movement) -->
        <g>

          <!-- REAR HITCH & 3-POINT LINKAGE ARMS -->
          <rect x="30" y="60" width="40" height="7" rx="2" fill="#27272A" stroke="#09090B" stroke-width="1" />
          <polygon points="44,70 56,70 53,63 47,63" fill="#3F3F46" stroke="#09090B" stroke-width="1" />
          <!-- Yellow PTO Shaft Cover -->
          <circle cx="50" cy="67" r="2.2" fill="${rimColor}" stroke="#713F12" stroke-width="0.8" />

          <!-- FRONT BALLAST WEIGHTS & BUMPER -->
          <rect x="34" y="16" width="32" height="6" rx="2" fill="#18181B" stroke="#52525B" stroke-width="1" />
          <line x1="39" y1="16" x2="39" y2="22" stroke="#71717A" stroke-width="1" />
          <line x1="44" y1="16" x2="44" y2="22" stroke="#71717A" stroke-width="1" />
          <line x1="50" y1="16" x2="50" y2="22" stroke="#71717A" stroke-width="1" />
          <line x1="56" y1="16" x2="56" y2="22" stroke="#71717A" stroke-width="1" />
          <line x1="61" y1="16" x2="61" y2="22" stroke="#71717A" stroke-width="1" />

          <!-- FRONT HEAVY STEERING AXLE -->
          <rect x="32" y="27" width="36" height="5" rx="2" fill="#27272A" stroke="#09090B" stroke-width="1" />

          <!-- ================= LEFT REAR HEAVY TIRE (Slow-Motion Rolling Treads) ================= -->
          <g clip-path="url(#rear-tire-left-clip-${size})">
            <!-- Tire Rubber Body -->
            <rect x="18" y="47" width="14" height="34" rx="5" fill="url(#tire-rubber-grad-${size})" stroke="#09090B" stroke-width="1.4" />
            <!-- Continuous Slow-Motion Chevron Lugs (Translates 7px seamlessly in 2.4s) -->
            <g>
              ${
                activeMoving
                  ? `<animateTransform attributeName="transform" type="translate" from="0, 0" to="0, -7" dur="2.4s" repeatCount="indefinite" />`
                  : ""
              }
              <path
                d="
                  M18.5 33 L26.5 37.5 M26.5 37.5 L31.5 35
                  M18.5 40 L26.5 44.5 M26.5 44.5 L31.5 42
                  M18.5 47 L26.5 51.5 M26.5 51.5 L31.5 49
                  M18.5 54 L26.5 58.5 M26.5 58.5 L31.5 56
                  M18.5 61 L26.5 65.5 M26.5 65.5 L31.5 63
                  M18.5 68 L26.5 72.5 M26.5 72.5 L31.5 70
                  M18.5 75 L26.5 79.5 M26.5 79.5 L31.5 77
                  M18.5 82 L26.5 86.5 M26.5 86.5 L31.5 84
                  M18.5 89 L26.5 93.5 M26.5 93.5 L31.5 91
                  M18.5 96 L26.5 100.5 M26.5 100.5 L31.5 98
                "
                stroke="#A1A1AA"
                stroke-width="2.2"
                stroke-linecap="round"
              />
            </g>
          </g>
          <!-- Tire Outer Perimeter Border -->
          <rect x="18" y="47" width="14" height="34" rx="5" fill="none" stroke="#09090B" stroke-width="1.4" />
          <!-- Yellow Center Wheel Rim Hub & Wheel Nuts -->
          <rect x="23" y="56" width="6" height="16" rx="2.5" fill="${rimColor}" stroke="${rimDark}" stroke-width="0.8" />
          <circle cx="26" cy="64" r="2" fill="#18181B" stroke="#52525B" stroke-width="0.6" />
          <circle cx="26" cy="60" r="0.9" fill="#FFFFFF" />
          <circle cx="26" cy="68" r="0.9" fill="#FFFFFF" />
          <circle cx="24.5" cy="64" r="0.7" fill="#FEF08A" />
          <circle cx="27.5" cy="64" r="0.7" fill="#FEF08A" />

          <!-- ================= RIGHT REAR HEAVY TIRE (Slow-Motion Rolling Treads) ================= -->
          <g clip-path="url(#rear-tire-right-clip-${size})">
            <!-- Tire Rubber Body -->
            <rect x="68" y="47" width="14" height="34" rx="5" fill="url(#tire-rubber-grad-${size})" stroke="#09090B" stroke-width="1.4" />
            <!-- Continuous Slow-Motion Chevron Lugs (Translates 7px seamlessly in 2.4s) -->
            <g>
              ${
                activeMoving
                  ? `<animateTransform attributeName="transform" type="translate" from="0, 0" to="0, -7" dur="2.4s" repeatCount="indefinite" />`
                  : ""
              }
              <path
                d="
                  M81.5 33 L73.5 37.5 M73.5 37.5 L68.5 35
                  M81.5 40 L73.5 44.5 M73.5 44.5 L68.5 42
                  M81.5 47 L73.5 51.5 M73.5 51.5 L68.5 49
                  M81.5 54 L73.5 58.5 M73.5 58.5 L68.5 56
                  M81.5 61 L73.5 65.5 M73.5 65.5 L68.5 63
                  M81.5 68 L73.5 72.5 M73.5 72.5 L68.5 70
                  M81.5 75 L73.5 79.5 M73.5 79.5 L68.5 77
                  M81.5 82 L73.5 86.5 M73.5 86.5 L68.5 84
                  M81.5 89 L73.5 93.5 M73.5 93.5 L68.5 91
                  M81.5 96 L73.5 100.5 M73.5 100.5 L68.5 98
                "
                stroke="#A1A1AA"
                stroke-width="2.2"
                stroke-linecap="round"
              />
            </g>
          </g>
          <!-- Tire Outer Perimeter Border -->
          <rect x="68" y="47" width="14" height="34" rx="5" fill="none" stroke="#09090B" stroke-width="1.4" />
          <!-- Yellow Center Wheel Rim Hub & Wheel Nuts -->
          <rect x="71" y="56" width="6" height="16" rx="2.5" fill="${rimColor}" stroke="${rimDark}" stroke-width="0.8" />
          <circle cx="74" cy="64" r="2" fill="#18181B" stroke="#52525B" stroke-width="0.6" />
          <circle cx="74" cy="60" r="0.9" fill="#FFFFFF" />
          <circle cx="74" cy="68" r="0.9" fill="#FFFFFF" />
          <circle cx="72.5" cy="64" r="0.7" fill="#FEF08A" />
          <circle cx="75.5" cy="64" r="0.7" fill="#FEF08A" />

          <!-- ================= LEFT FRONT STEERING TIRE & MUDGUARD ================= -->
          <g transform="rotate(${safeSteer}, 27.75, 30.5)">
            <path d="M23 20 C23 18, 32 18, 32 20" stroke="${bodyDark}" stroke-width="2.5" stroke-linecap="round" fill="none" />
            <g clip-path="url(#front-tire-left-clip-${size})">
              <rect x="23" y="21" width="9.5" height="19" rx="3.5" fill="url(#tire-rubber-grad-${size})" stroke="#09090B" stroke-width="1.2" />
              <!-- Slow-Motion Front Rolling Tread Lugs (Translates 4.5px seamlessly in 2.4s) -->
              <g>
                ${
                  activeMoving
                    ? `<animateTransform attributeName="transform" type="translate" from="0, 0" to="0, -4.5" dur="2.4s" repeatCount="indefinite" />`
                    : ""
                }
                <path
                  d="
                    M23.5 12 L28.5 14.5 M28.5 14.5 L32 13
                    M23.5 16.5 L28.5 19 M28.5 19 L32 17.5
                    M23.5 21 L28.5 23.5 M28.5 23.5 L32 22
                    M23.5 25.5 L28.5 28 M28.5 28 L32 26.5
                    M23.5 30 L28.5 32.5 M28.5 32.5 L32 31
                    M23.5 34.5 L28.5 37 M28.5 37 L32 35.5
                    M23.5 39 L28.5 41.5 M28.5 41.5 L32 40
                    M23.5 43.5 L28.5 46 M28.5 46 L32 44.5
                    M23.5 48 L28.5 50.5 M28.5 50.5 L32 49
                  "
                  stroke="#A1A1AA"
                  stroke-width="1.6"
                  stroke-linecap="round"
                />
              </g>
            </g>
            <rect x="23" y="21" width="9.5" height="19" rx="3.5" fill="none" stroke="#09090B" stroke-width="1.2" />
            <rect x="27" y="26.5" width="4.5" height="8" rx="1.5" fill="${rimColor}" stroke="${rimDark}" stroke-width="0.6" />
            <circle cx="29.2" cy="30.5" r="1.1" fill="#18181B" />
            <circle cx="29.2" cy="28.5" r="0.6" fill="#FFFFFF" />
            <circle cx="29.2" cy="32.5" r="0.6" fill="#FFFFFF" />
          </g>

          <!-- ================= RIGHT FRONT STEERING TIRE & MUDGUARD ================= -->
          <g transform="rotate(${safeSteer}, 72.25, 30.5)">
            <path d="M68 20 C68 18, 77 18, 77 20" stroke="${bodyDark}" stroke-width="2.5" stroke-linecap="round" fill="none" />
            <g clip-path="url(#front-tire-right-clip-${size})">
              <rect x="67.5" y="21" width="9.5" height="19" rx="3.5" fill="url(#tire-rubber-grad-${size})" stroke="#09090B" stroke-width="1.2" />
              <!-- Slow-Motion Front Rolling Tread Lugs (Translates 4.5px seamlessly in 2.4s) -->
              <g>
                ${
                  activeMoving
                    ? `<animateTransform attributeName="transform" type="translate" from="0, 0" to="0, -4.5" dur="2.4s" repeatCount="indefinite" />`
                    : ""
                }
                <path
                  d="
                    M76.5 12 L71.5 14.5 M71.5 14.5 L68 13
                    M76.5 16.5 L71.5 19 M71.5 19 L68 17.5
                    M76.5 21 L71.5 23.5 M71.5 23.5 L68 22
                    M76.5 25.5 L71.5 28 M71.5 28 L68 26.5
                    M76.5 30 L71.5 32.5 M71.5 32.5 L68 31
                    M76.5 34.5 L71.5 37 M71.5 37 L68 35.5
                    M76.5 39 L71.5 41.5 M71.5 41.5 L68 40
                    M76.5 43.5 L71.5 46 M71.5 46 L68 44.5
                    M76.5 48 L71.5 50.5 M71.5 50.5 L68 49
                  "
                  stroke="#A1A1AA"
                  stroke-width="1.6"
                  stroke-linecap="round"
                />
              </g>
            </g>
            <rect x="67.5" y="21" width="9.5" height="19" rx="3.5" fill="none" stroke="#09090B" stroke-width="1.2" />
            <rect x="68.5" y="26.5" width="4.5" height="8" rx="1.5" fill="${rimColor}" stroke="${rimDark}" stroke-width="0.6" />
            <circle cx="70.8" cy="30.5" r="1.1" fill="#18181B" />
            <circle cx="70.8" cy="28.5" r="0.6" fill="#FFFFFF" />
            <circle cx="70.8" cy="32.5" r="0.6" fill="#FFFFFF" />
          </g>

          <!-- ================= ENGINE HOOD & BONNET ================= -->
          <path d="M38 21 Q50 18 62 21 L63 47 H37 Z" fill="url(#hood-grad-${size})" stroke="#09090B" stroke-width="1.4" />

          <!-- Front Radiator Black Mesh Grille -->
          <path d="M40 21 Q50 19.5 60 21 L59.5 25 Q50 23.5 40.5 25 Z" fill="#18181B" stroke="#52525B" stroke-width="0.8" />

          <!-- Twin Crystal Halogen Headlights (with active beam glow when connected) -->
          <circle cx="41.5" cy="22.5" r="2.2" fill="#FEF08A" stroke="#FFFFFF" stroke-width="0.8" />
          <circle cx="58.5" cy="22.5" r="2.2" fill="#FEF08A" stroke="#FFFFFF" stroke-width="0.8" />
          ${
            isConnected
              ? `
            <circle cx="41.5" cy="22.5" r="3.5" fill="#FEF08A" opacity="0.3" />
            <circle cx="58.5" cy="22.5" r="3.5" fill="#FEF08A" opacity="0.3" />
          `
              : ""
          }

          <!-- Side Engine Cooling Vents -->
          <line x1="41" y1="30" x2="59" y2="30" stroke="#09090B" stroke-width="1" stroke-dasharray="2.5 1.5" />
          <line x1="41" y1="34" x2="59" y2="34" stroke="#09090B" stroke-width="1" stroke-dasharray="2.5 1.5" />
          <line x1="41" y1="38" x2="59" y2="38" stroke="#09090B" stroke-width="1" stroke-dasharray="2.5 1.5" />

          <!-- Vertical Exhaust Muffler Stack & Heat Guard -->
          <circle cx="61" cy="35" r="2.8" fill="#09090B" stroke="#D4D4D8" stroke-width="1" />
          <circle cx="61" cy="35" r="1.5" fill="#18181B" />

          <!-- ================= OPERATOR PANORAMIC CABIN ================= -->
          <rect x="34" y="44" width="32" height="24" rx="5" fill="${bodyDark}" stroke="#09090B" stroke-width="1.4" />
          
          <!-- Tinted Windshield Glass with Specular Reflection -->
          <rect x="36.5" y="46.5" width="27" height="19" rx="3.5" fill="url(#cab-glass-grad-${size})" stroke="#38BDF8" stroke-width="0.9" />

          <!-- Cab Interior: Steering Wheel Column & Driver Seat -->
          <circle cx="50" cy="51" r="2.4" fill="none" stroke="#F8FAFC" stroke-width="1.1" />
          <rect x="45.5" y="55" width="9" height="7.5" rx="2" fill="#18181B" stroke="#52525B" stroke-width="0.8" />

          <!-- Side View Exterior Mirrors -->
          <rect x="31" y="47" width="2.5" height="5" rx="1" fill="#09090B" stroke="#71717A" stroke-width="0.5" />
          <rect x="66.5" y="47" width="2.5" height="5" rx="1" fill="#09090B" stroke="#71717A" stroke-width="0.5" />

          <!-- Cab Roof Shell -->
          <path d="M37 48 Q50 45 63 48 L62 62 Q50 59 38 62 Z" fill="#F8FAFC" stroke="${bodyDark}" stroke-width="1" />

          <!-- ================= ROOF SAFETY STROBE BEACON ================= -->
          ${
            isConnected
              ? `
            <circle cx="60" cy="49" r="2.6" fill="#F59E0B" stroke="#FFFFFF" stroke-width="0.8">
              <animate
                attributeName="fill"
                values="#F59E0B;#FEF08A;#F59E0B"
                dur="${activeMoving ? "0.6s" : "2.4s"}"
                repeatCount="indefinite"
              />
              <animate
                attributeName="r"
                values="2.2;${activeMoving ? "3.4" : "2.8"};2.2"
                dur="${activeMoving ? "0.6s" : "2.4s"}"
                repeatCount="indefinite"
              />
            </circle>
          `
              : `
            <!-- Off / Inactive Beacon -->
            <circle cx="60" cy="49" r="2.2" fill="#64748B" stroke="#475569" stroke-width="0.6" />
          `
          }

          <!-- Center Status Badge -->
          <circle cx="50" cy="56" r="3" fill="${isConnected ? "#16A34A" : "#EF4444"}" stroke="#FFFFFF" stroke-width="1">
            ${
              isConnected
                ? `<animate attributeName="r" values="2.5;3.6;2.5" dur="${activeMoving ? "1.2s" : "2.8s"}" repeatCount="indefinite" />`
                : ""
            }
          </circle>
        </g>
      </g>
    </svg>
  `.trim()
}

/**
 * Generates an SVG Data URI string for Google Maps markers with transparent background
 */
export function getGoogleMapsTractorIcon(options: TractorIconOptions = {}): any {
  const size = options.size || 68
  const svgString = getTractorSvgString({ ...options, size })
  const encodedSvg = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svgString)}`

  return {
    url: encodedSvg,
    scaledSize: typeof window !== "undefined" && (window as any).google?.maps ? new (window as any).google.maps.Size(size, size) : undefined,
    anchor: typeof window !== "undefined" && (window as any).google?.maps ? new (window as any).google.maps.Point(size / 2, size / 2) : undefined,
  } as any
}

/**
 * Custom HTML Overlay View for Google Maps to render interactive animated SVG tractor with 100% transparency
 */
export class GoogleMapsTractorOverlay {
  private overlay: any = null
  private div: HTMLDivElement | null = null
  private map: any = null
  private position: any = null
  private options: TractorIconOptions

  constructor(map: any, position: { lat: number; lng: number }, options: TractorIconOptions = {}) {
    this.map = map
    this.position = typeof window !== "undefined" && (window as any).google?.maps ? new (window as any).google.maps.LatLng(position.lat, position.lng) : null
    this.options = options

    const self = this
    this.overlay = typeof window !== "undefined" && (window as any).google?.maps ? new (window as any).google.maps.OverlayView() : null
    if (!this.overlay) return
    this.overlay.onAdd = function () {
      self.div = document.createElement("div")
      self.div.style.position = "absolute"
      self.div.style.cursor = "pointer"
      self.div.style.transform = "translate(-50%, -50%)"
      self.div.style.zIndex = "100"
      self.div.style.pointerEvents = "auto"
      self.div.style.background = "transparent"
      self.div.innerHTML = getTractorSvgString(self.options)

      const panes = this.getPanes()
      panes?.overlayMouseTarget.appendChild(self.div)
    }

    this.overlay.draw = function () {
      if (!self.div || !self.position) return
      const overlayProjection = this.getProjection()
      if (!overlayProjection) return
      const point = overlayProjection.fromLatLngToDivPixel(self.position)
      if (point) {
        self.div.style.left = `${point.x}px`
        self.div.style.top = `${point.y}px`
      }
    }

    this.overlay.onRemove = function () {
      if (self.div?.parentNode) {
        self.div.parentNode.removeChild(self.div)
        self.div = null
      }
    }

    this.overlay.setMap(map)
  }

  setPosition(pos: { lat: number; lng: number }, options?: TractorIconOptions) {
    this.position = new google.maps.LatLng(pos.lat, pos.lng)
    if (options) {
      this.options = options
      if (this.div) {
        this.div.innerHTML = getTractorSvgString(options)
      }
    }
    this.overlay?.draw()
  }

  destroy() {
    this.overlay?.setMap(null)
    this.overlay = null
    this.div = null
  }
}

/**
 * Generates a Leaflet DivIcon with transparent background and realistic tractor icon
 */
export function getLeafletTractorDivIcon(L: any, options: TractorIconOptions = {}) {
  const size = options.size || 68
  const svgString = getTractorSvgString({ ...options, size })

  return L.divIcon({
    html: `<div class="transparent-tractor-marker" style="width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center; background: transparent !important; border: none !important; box-shadow: none !important; pointer-events: auto;">
      ${svgString}
    </div>`,
    className: "custom-transparent-tractor-icon",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  })
}

