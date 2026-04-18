import { useEffect, useRef, useState } from 'react'
import { importLibrary, setOptions } from '@googlemaps/js-api-loader'
import { Plane } from 'lucide-react'
import { useSupabaseTable } from '../hooks/useSupabaseTable'

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
const HAS_CONFIGURED_MAPS_KEY =
  Boolean(GOOGLE_MAPS_API_KEY) && GOOGLE_MAPS_API_KEY !== 'your_browser_maps_key_here'

const DARK_MAP_STYLES = [
  { elementType: 'geometry', stylers: [{ color: '#0b0f14' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0b0f14' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8b949e' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#30363d' }] },
  { featureType: 'administrative.country', elementType: 'geometry.stroke', stylers: [{ color: '#3d4a57' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#11161d' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#0f1712' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1f2a34' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#24313d' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#58a6ff' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#1b2028' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#08111d' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#58a6ff' }] },
]

const PHX = { lat: 33.4373, lng: -112.0078 }
const HOUSE = { lat: 33.4955, lng: -111.9141 }

// IATA → coordinates + display name
const AIRPORT_DB = {
  PHX: { lat: 33.4373, lng: -112.0078, city: 'Phoenix, AZ' },
  SDL: { lat: 33.6229, lng: -111.9109, city: 'Scottsdale, AZ' },
  ORD: { lat: 41.9742, lng: -87.9073, city: 'Chicago, IL' },
  MDW: { lat: 41.7868, lng: -87.7522, city: 'Chicago Midway, IL' },
  ATL: { lat: 33.6367, lng: -84.4281, city: 'Atlanta, GA' },
  DFW: { lat: 32.8998, lng: -97.0403, city: 'Dallas, TX' },
  DAL: { lat: 32.8474, lng: -96.8517, city: 'Dallas Love, TX' },
  LAX: { lat: 33.9425, lng: -118.4081, city: 'Los Angeles, CA' },
  SFO: { lat: 37.6213, lng: -122.379, city: 'San Francisco, CA' },
  JFK: { lat: 40.6413, lng: -73.7781, city: 'New York, NY' },
  LGA: { lat: 40.7769, lng: -73.874, city: 'New York LaGuardia, NY' },
  EWR: { lat: 40.6895, lng: -74.1745, city: 'Newark, NJ' },
  BOS: { lat: 42.3656, lng: -71.0096, city: 'Boston, MA' },
  MIA: { lat: 25.7959, lng: -80.287, city: 'Miami, FL' },
  DEN: { lat: 39.8561, lng: -104.6737, city: 'Denver, CO' },
  SEA: { lat: 47.4502, lng: -122.3088, city: 'Seattle, WA' },
  MSP: { lat: 44.8848, lng: -93.2223, city: 'Minneapolis, MN' },
  DTW: { lat: 42.2162, lng: -83.3554, city: 'Detroit, MI' },
  BWI: { lat: 39.1754, lng: -76.6684, city: 'Baltimore, MD' },
  IAD: { lat: 38.9531, lng: -77.4565, city: 'Washington Dulles, DC' },
  DCA: { lat: 38.8521, lng: -77.0377, city: 'Washington Reagan, DC' },
  STL: { lat: 38.7487, lng: -90.37, city: 'St. Louis, MO' },
  LAS: { lat: 36.084, lng: -115.1537, city: 'Las Vegas, NV' },
  SAN: { lat: 32.7338, lng: -117.1933, city: 'San Diego, CA' },
  HOU: { lat: 29.6454, lng: -95.2789, city: 'Houston Hobby, TX' },
  IAH: { lat: 29.9902, lng: -95.3368, city: 'Houston, TX' },
  MSY: { lat: 29.9934, lng: -90.258, city: 'New Orleans, LA' },
  CLT: { lat: 35.214, lng: -80.9431, city: 'Charlotte, NC' },
  PHL: { lat: 39.8721, lng: -75.2411, city: 'Philadelphia, PA' },
  PIT: { lat: 40.4919, lng: -80.2329, city: 'Pittsburgh, PA' },
  IND: { lat: 39.7173, lng: -86.2944, city: 'Indianapolis, IN' },
  MCI: { lat: 39.2976, lng: -94.7139, city: 'Kansas City, MO' },
  MKE: { lat: 42.9472, lng: -87.8966, city: 'Milwaukee, WI' },
  OAK: { lat: 37.7213, lng: -122.2208, city: 'Oakland, CA' },
  SJC: { lat: 37.3626, lng: -121.9291, city: 'San Jose, CA' },
  PDX: { lat: 45.5898, lng: -122.5951, city: 'Portland, OR' },
  CLE: { lat: 41.4117, lng: -81.8498, city: 'Cleveland, OH' },
  CMH: { lat: 39.9998, lng: -82.8919, city: 'Columbus, OH' },
}

// Compute great-circle arc as array of LatLng-like points
function greatCirclePoints(from, to, steps = 80) {
  const toRad = (d) => (d * Math.PI) / 180
  const toDeg = (r) => (r * 180) / Math.PI

  const lat1 = toRad(from.lat), lng1 = toRad(from.lng)
  const lat2 = toRad(to.lat), lng2 = toRad(to.lng)

  const d = 2 * Math.asin(Math.sqrt(
    Math.sin((lat2 - lat1) / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin((lng2 - lng1) / 2) ** 2
  ))

  const points = []
  for (let i = 0; i <= steps; i++) {
    const f = i / steps
    const A = Math.sin((1 - f) * d) / Math.sin(d)
    const B = Math.sin(f * d) / Math.sin(d)
    const x = A * Math.cos(lat1) * Math.cos(lng1) + B * Math.cos(lat2) * Math.cos(lng2)
    const y = A * Math.cos(lat1) * Math.sin(lng1) + B * Math.cos(lat2) * Math.sin(lng2)
    const z = A * Math.sin(lat1) + B * Math.sin(lat2)
    points.push({ lat: toDeg(Math.atan2(z, Math.sqrt(x ** 2 + y ** 2))), lng: toDeg(Math.atan2(y, x)) })
  }
  return points
}

const STATUS_COLORS = {
  TBD: '#8B949E',
  Confirmed: '#58A6FF',
  'En Route': '#D29922',
  Arrived: '#3FB950',
}

export default function FlightMapPanel() {
  const { rows: arrivals } = useSupabaseTable('arrivals', { orderBy: 'arrival_date', ascending: true })
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const overlaysRef = useRef([])
  const [mapReady, setMapReady] = useState(false)
  const [mapError, setMapError] = useState('')

  // Initialize map
  useEffect(() => {
    if (!HAS_CONFIGURED_MAPS_KEY || mapInstanceRef.current || !mapRef.current) return

    let cancelled = false

    async function initMap() {
      try {
        setMapError('')
        setOptions({ apiKey: GOOGLE_MAPS_API_KEY, version: 'weekly' })
        const mapsLib = await importLibrary('maps')
        if (cancelled) return

        const map = new mapsLib.Map(mapRef.current, {
          center: { lat: 39.5, lng: -98.35 },
          zoom: 4,
          mapTypeId: 'roadmap',
          disableDefaultUI: true,
          zoomControl: true,
          styles: DARK_MAP_STYLES,
          backgroundColor: '#0b0f14',
        })
        mapInstanceRef.current = map
        setMapReady(true)

        // PHX marker
        new mapsLib.Marker({
          map,
          position: PHX,
          title: 'PHX — Phoenix Sky Harbor',
          icon: {
            path: mapsLib.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#F85149',
            fillOpacity: 1,
            strokeColor: '#ff7b72',
            strokeWeight: 2,
          },
          zIndex: 10,
        })

        // Command House marker
        new mapsLib.Marker({
          map,
          position: HOUSE,
          title: 'Command House — Scottsdale',
          icon: {
            path: mapsLib.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#3FB950',
            fillOpacity: 1,
            strokeColor: '#56d364',
            strokeWeight: 2,
          },
          zIndex: 10,
        })
      } catch (error) {
        if (!cancelled) {
          setMapError(error instanceof Error ? error.message : 'Failed to load Google Maps')
        }
      }
    }

    initMap()

    return () => {
      cancelled = true
    }
  }, [])

  // Draw arcs whenever arrivals change and map is ready
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !HAS_CONFIGURED_MAPS_KEY) return

    const map = mapInstanceRef.current

    // Clear old overlays
    overlaysRef.current.forEach((o) => o.setMap(null))
    overlaysRef.current = []

    importLibrary('maps').then((mapsLib) => {
      const seen = new Map() // airport code → polyline (deduplicate)

      arrivals.forEach((arrival) => {
        const code = (arrival.origin_airport || '').toUpperCase().trim()
        if (!code || code === 'PHX' || code === 'SDL') return
        const airport = AIRPORT_DB[code]
        if (!airport) return
        if (seen.has(code)) return // already drew this arc

        const arcPoints = greatCirclePoints(airport, PHX)
        const color = STATUS_COLORS[arrival.status] || STATUS_COLORS.TBD

        const poly = new mapsLib.Polyline({
          map,
          path: arcPoints,
          strokeColor: color,
          strokeOpacity: 0,
          strokeWeight: 0,
          icons: [
            {
              icon: {
                path: 'M 0,-1 0,1',
                strokeOpacity: 0.7,
                scale: 2,
                strokeColor: color,
              },
              offset: '0',
              repeat: '12px',
            },
          ],
        })

        overlaysRef.current.push(poly)
        seen.set(code, poly)

        // Origin airport marker
        const marker = new mapsLib.Marker({
          map,
          position: airport,
          title: `${code} — ${airport.city}`,
          icon: {
            path: mapsLib.SymbolPath.CIRCLE,
            scale: 5,
            fillColor: color,
            fillOpacity: 0.9,
            strokeColor: '#0b0f14',
            strokeWeight: 1,
          },
        })
        overlaysRef.current.push(marker)
      })
    })
  }, [arrivals, mapReady])

  // Group arrivals by origin for the legend
  const byOrigin = arrivals.reduce((acc, a) => {
    const code = (a.origin_airport || '').toUpperCase().trim() || '—'
    if (!acc[code]) acc[code] = []
    acc[code].push(a)
    return acc
  }, {})

  const arrived = arrivals.filter((a) => a.status === 'Arrived').length
  const enRoute = arrivals.filter((a) => a.status === 'En Route').length
  const confirmed = arrivals.filter((a) => a.status === 'Confirmed').length

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#30363D] px-6 py-4">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8B949E]">Ops Map</div>
          <div className="mt-0.5 text-lg font-bold text-[#C9D1D9]">Inbound Flights · PHX</div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#3FB950]" />
            <span className="font-mono text-sm font-black text-[#3FB950]">{arrived}</span>
            <span className="text-[9px] uppercase tracking-widest text-[#8B949E]">Arrived</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#D29922]" />
            <span className="font-mono text-sm font-black text-[#D29922]">{enRoute}</span>
            <span className="text-[9px] uppercase tracking-widest text-[#8B949E]">En Route</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#58A6FF]" />
            <span className="font-mono text-sm font-black text-[#58A6FF]">{confirmed}</span>
            <span className="text-[9px] uppercase tracking-widest text-[#8B949E]">Confirmed</span>
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Map */}
        <div className="relative flex-1">
          {!HAS_CONFIGURED_MAPS_KEY && (
            <div className="absolute inset-0 flex items-center justify-center text-[#4B5563]">
              <span className="text-[11px] uppercase tracking-widest">Maps API key not configured</span>
            </div>
          )}
          {mapError ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0b0f14]/90 px-6 text-center">
              <div>
                <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[#F85149]">Google Maps Error</div>
                <div className="mt-2 text-[12px] text-[#8B949E]">{mapError}</div>
              </div>
            </div>
          ) : null}
          <div ref={mapRef} className="h-full w-full" />

          {/* Map legend overlay */}
          <div className="absolute bottom-4 left-4 flex flex-col gap-1.5 rounded border border-[#30363D] bg-[#0d1117]/90 p-3 backdrop-blur-sm">
            <div className="text-[8px] font-black uppercase tracking-[0.2em] text-[#4B5563]">Legend</div>
            {[
              { color: '#F85149', label: 'PHX Airport' },
              { color: '#3FB950', label: 'Command House' },
              { color: '#3FB950', label: 'Arrived', dashed: true },
              { color: '#D29922', label: 'En Route', dashed: true },
              { color: '#58A6FF', label: 'Confirmed', dashed: true },
              { color: '#8B949E', label: 'TBD', dashed: true },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                {item.dashed ? (
                  <svg width="16" height="4" className="shrink-0">
                    <line x1="0" y1="2" x2="16" y2="2" stroke={item.color} strokeWidth="2" strokeDasharray="3 2" />
                  </svg>
                ) : (
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: item.color }} />
                )}
                <span className="text-[9px] text-[#8B949E]">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar — who's coming from where */}
        <div className="flex w-64 flex-col border-l border-[#30363D] overflow-auto">
          <div className="border-b border-[#30363D] px-4 py-3">
            <div className="text-[9px] font-black uppercase tracking-[0.2em] text-[#4B5563]">Flight Origins</div>
          </div>
          {arrivals.length === 0 ? (
            <div className="flex flex-1 items-center justify-center text-[10px] uppercase tracking-widest text-[#4B5563]">
              No arrivals tracked
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-[#21262d]">
              {Object.entries(byOrigin).map(([code, people]) => {
                const airport = AIRPORT_DB[code]
                return (
                  <div key={code} className="px-4 py-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Plane size={10} className="text-[#58A6FF] shrink-0" />
                      <span className="font-mono text-[11px] font-black text-[#58A6FF]">{code}</span>
                      {airport && <span className="text-[9px] text-[#4B5563] truncate">{airport.city}</span>}
                    </div>
                    {people.map((p) => (
                      <div key={p.id} className="flex items-center justify-between py-0.5">
                        <span className="text-[11px] text-[#C9D1D9]">{p.name}</span>
                        <span
                          className="rounded px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider"
                          style={{
                            color: STATUS_COLORS[p.status] || STATUS_COLORS.TBD,
                            background: (STATUS_COLORS[p.status] || STATUS_COLORS.TBD) + '20',
                          }}
                        >
                          {p.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
