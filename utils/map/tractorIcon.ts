/**
 * Utility to generate realistic SVG tractor icons for map markers with 100% transparent background
 * Features a detailed, high-fidelity top-down agricultural tractor design with:
 * - Real deep-lug chevron tire treads & heavy wheels
 * - Contoured engine hood with air intakes & headlights
 * - Realistic panoramic driver cabin with tinted glass specular reflection
 * - Dynamic vehicle heading rotation (0° - 360°)
 * - Slow subtle engine idle vibration and beacon pulse animations
 */

export interface TractorIconOptions {
  course?: number // Course / heading angle in degrees (0 = North, 90 = East, 180 = South, etc.)
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
  isSelected = true,
  isLive = true,
  isMoving = false,
  status = "Active",
  size = 72,
}: TractorIconOptions = {}): string {
  const isConnected = status === "Active" || (isLive && status !== "Not Connected" && status !== "Offline")
  const activeMoving = isConnected && isMoving

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
      </defs>

      <!-- Rotation around center (50, 50) according to tractor course / heading -->
      <g transform="rotate(${course}, 50, 50)">

        ${
          activeMoving
            ? `
          <!-- ACTIVE MOTION: Speed Propulsion Ripple Waves behind tractor -->
          <g opacity="0.75">
            <path d="M38 78 C44 86, 56 86, 62 78" stroke="#10B981" stroke-width="2.5" stroke-linecap="round" fill="none">
              <animate attributeName="d" values="M38 78 C44 86, 56 86, 62 78; M34 88 C44 98, 56 98, 66 88; M30 96 C44 108, 56 108, 70 96" dur="0.8s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.8;0.3;0" dur="0.8s" repeatCount="indefinite" />
            </path>
            <path d="M42 74 C46 80, 54 80, 58 74" stroke="#34D399" stroke-width="2" stroke-linecap="round" fill="none">
              <animate attributeName="d" values="M42 74 C46 80, 54 80, 58 74; M38 84 C44 94, 56 94, 62 84; M34 92 C44 102, 56 102, 66 92" dur="0.8s" begin="0.25s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.8;0.3;0" dur="0.8s" begin="0.25s" repeatCount="indefinite" />
            </path>
          </g>

          <!-- ACTIVE MOTION: Live Radar Pulse Wave -->
          <circle cx="50" cy="50" r="42" stroke="#10B981" stroke-width="1.8" stroke-dasharray="6 4" opacity="0.65">
            <animate attributeName="r" values="32;46;32" dur="1.8s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.75;0.1;0.75" dur="1.8s" repeatCount="indefinite" />
          </circle>
        `
            : isConnected
            ? `
          <!-- CALM IDLE: Slow Gentle Status Wave -->
          <circle cx="50" cy="50" r="40" stroke="#3B82F6" stroke-width="1.2" stroke-dasharray="4 4" opacity="0.4">
            <animate attributeName="r" values="36;42;36" dur="3.8s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.5;0.1;0.5" dur="3.8s" repeatCount="indefinite" />
          </circle>
        `
            : ""
        }

        <!-- Forward Heading Direction Arrow -->
        <polygon points="50,2 58,14 50,10 42,14" fill="#EF4444" stroke="#FFFFFF" stroke-width="1.2" />

        <!-- Tractor Chassis Group (with motion-dependent engine vibration) -->
        <g>
          ${
            activeMoving
              ? `
            <!-- Fast engine vibration when in motion -->
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0,0; 0,-0.8; 0,0; 0,0.8; 0,0"
              dur="0.6s"
              repeatCount="indefinite"
            />
          `
              : isConnected
              ? `
            <!-- Gentle engine breathing when idle -->
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0,0; 0,-0.4; 0,0; 0,0.4; 0,0"
              dur="3.4s"
              repeatCount="indefinite"
            />
          `
              : ""
          }

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

          <!-- ================= LEFT REAR HEAVY TIRE ================= -->
          <rect x="18" y="47" width="14" height="34" rx="5" fill="url(#tire-rubber-grad-${size})" stroke="#09090B" stroke-width="1.4" />
          <!-- Deep Chevron Tire Lugs -->
          <g>
            ${
              activeMoving
                ? `<animateTransform attributeName="transform" type="translate" values="0,0; 0,-5; 0,0" dur="0.5s" repeatCount="indefinite" />`
                : ""
            }
            <path d="M19 52 L26 56 M19 58 L26 62 M19 64 L26 68 M19 70 L26 74 M19 76 L26 80" stroke="#71717A" stroke-width="2" stroke-linecap="round" />
          </g>
          <!-- Yellow Center Wheel Rim Hub & Wheel Nuts -->
          <rect x="23" y="56" width="6" height="16" rx="2.5" fill="${rimColor}" stroke="${rimDark}" stroke-width="0.8" />
          <circle cx="26" cy="64" r="1.8" fill="#18181B" />
          <circle cx="26" cy="60" r="0.8" fill="#FFFFFF" />
          <circle cx="26" cy="68" r="0.8" fill="#FFFFFF" />

          <!-- ================= RIGHT REAR HEAVY TIRE ================= -->
          <rect x="68" y="47" width="14" height="34" rx="5" fill="url(#tire-rubber-grad-${size})" stroke="#09090B" stroke-width="1.4" />
          <!-- Deep Chevron Tire Lugs -->
          <g>
            ${
              activeMoving
                ? `<animateTransform attributeName="transform" type="translate" values="0,0; 0,-5; 0,0" dur="0.5s" repeatCount="indefinite" />`
                : ""
            }
            <path d="M81 52 L74 56 M81 58 L74 62 M81 64 L74 68 M81 70 L74 74 M81 76 L74 80" stroke="#71717A" stroke-width="2" stroke-linecap="round" />
          </g>
          <!-- Yellow Center Wheel Rim Hub & Wheel Nuts -->
          <rect x="71" y="56" width="6" height="16" rx="2.5" fill="${rimColor}" stroke="${rimDark}" stroke-width="0.8" />
          <circle cx="74" cy="64" r="1.8" fill="#18181B" />
          <circle cx="74" cy="60" r="0.8" fill="#FFFFFF" />
          <circle cx="74" cy="68" r="0.8" fill="#FFFFFF" />

          <!-- ================= LEFT FRONT STEERING TIRE & MUDGUARD ================= -->
          <path d="M23 20 C23 18, 32 18, 32 20" stroke="${bodyDark}" stroke-width="2.5" stroke-linecap="round" fill="none" />
          <rect x="23" y="21" width="9.5" height="19" rx="3.5" fill="url(#tire-rubber-grad-${size})" stroke="#09090B" stroke-width="1.2" />
          <path d="M24 25 L30 27 M24 30 L30 32 M24 35 L30 37" stroke="#71717A" stroke-width="1.5" stroke-linecap="round" />
          <rect x="27" y="26.5" width="4.5" height="8" rx="1.5" fill="${rimColor}" stroke="${rimDark}" stroke-width="0.6" />

          <!-- ================= RIGHT FRONT STEERING TIRE & MUDGUARD ================= -->
          <path d="M68 20 C68 18, 77 18, 77 20" stroke="${bodyDark}" stroke-width="2.5" stroke-linecap="round" fill="none" />
          <rect x="67.5" y="21" width="9.5" height="19" rx="3.5" fill="url(#tire-rubber-grad-${size})" stroke="#09090B" stroke-width="1.2" />
          <path d="M76 25 L70 27 M76 30 L70 32 M76 35 L70 37" stroke="#71717A" stroke-width="1.5" stroke-linecap="round" />
          <rect x="68.5" y="26.5" width="4.5" height="8" rx="1.5" fill="${rimColor}" stroke="${rimDark}" stroke-width="0.6" />

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
export function getGoogleMapsTractorIcon(options: TractorIconOptions = {}): google.maps.Icon {
  const size = options.size || 68
  const svgString = getTractorSvgString({ ...options, size })
  const encodedSvg = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svgString)}`

  return {
    url: encodedSvg,
    scaledSize: typeof window !== "undefined" && window.google?.maps ? new window.google.maps.Size(size, size) : undefined,
    anchor: typeof window !== "undefined" && window.google?.maps ? new window.google.maps.Point(size / 2, size / 2) : undefined,
  } as google.maps.Icon
}

/**
 * Custom HTML Overlay View for Google Maps to render interactive animated SVG tractor with 100% transparency
 */
export class GoogleMapsTractorOverlay {
  private overlay: google.maps.OverlayView | null = null
  private div: HTMLDivElement | null = null
  private map: google.maps.Map | null = null
  private position: google.maps.LatLng | null = null
  private options: TractorIconOptions

  constructor(map: google.maps.Map, position: { lat: number; lng: number }, options: TractorIconOptions = {}) {
    this.map = map
    this.position = new google.maps.LatLng(position.lat, position.lng)
    this.options = options

    const self = this
    this.overlay = new google.maps.OverlayView()
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

