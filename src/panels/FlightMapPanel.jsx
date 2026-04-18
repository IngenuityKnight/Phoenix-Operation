import { useMemo, useState } from 'react'
import Map, { Layer, Marker, NavigationControl, Source } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'
import { Plane } from 'lucide-react'
import { useSupabaseTable } from '../hooks/useSupabaseTable'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN

const MAP_STYLES = {
  dark:      { label: 'Dark',      url: 'mapbox://styles/mapbox/dark-v11' },
  satellite: { label: 'Satellite', url: 'mapbox://styles/mapbox/satellite-streets-v12' },
  traffic:   { label: 'Traffic',   url: 'mapbox://styles/mapbox/navigation-night-v1' },
}

const PHX  = { longitude: -112.0078, latitude: 33.4373 }
const HOUSE = { longitude: -111.9141, latitude: 33.4955 }

const STATUS_COLORS = {
  TBD:        '#8B949E',
  Confirmed:  '#58A6FF',
  'En Route': '#D29922',
  Landed:     '#A371F7',
  Arrived:    '#3FB950',
}

const AIRPORT_DB = {
  PHX: { lat: 33.4373, lng: -112.0078, city: 'Phoenix, AZ' },
  SDL: { lat: 33.6229, lng: -111.9109, city: 'Scottsdale, AZ' },
  ORD: { lat: 41.9742, lng: -87.9073,  city: 'Chicago O\'Hare, IL' },
  MDW: { lat: 41.7868, lng: -87.7522,  city: 'Chicago Midway, IL' },
  ATL: { lat: 33.6367, lng: -84.4281,  city: 'Atlanta, GA' },
  DFW: { lat: 32.8998, lng: -97.0403,  city: 'Dallas/Fort Worth, TX' },
  DAL: { lat: 32.8474, lng: -96.8517,  city: 'Dallas Love Field, TX' },
  LAX: { lat: 33.9425, lng: -118.4081, city: 'Los Angeles, CA' },
  SFO: { lat: 37.6213, lng: -122.379,  city: 'San Francisco, CA' },
  JFK: { lat: 40.6413, lng: -73.7781,  city: 'New York JFK, NY' },
  LGA: { lat: 40.7769, lng: -73.874,   city: 'New York LaGuardia, NY' },
  EWR: { lat: 40.6895, lng: -74.1745,  city: 'Newark, NJ' },
  BOS: { lat: 42.3656, lng: -71.0096,  city: 'Boston, MA' },
  MIA: { lat: 25.7959, lng: -80.287,   city: 'Miami, FL' },
  DEN: { lat: 39.8561, lng: -104.6737, city: 'Denver, CO' },
  SEA: { lat: 47.4502, lng: -122.3088, city: 'Seattle, WA' },
  MSP: { lat: 44.8848, lng: -93.2223,  city: 'Minneapolis, MN' },
  DTW: { lat: 42.2162, lng: -83.3554,  city: 'Detroit, MI' },
  BWI: { lat: 39.1754, lng: -76.6684,  city: 'Baltimore, MD' },
  IAD: { lat: 38.9531, lng: -77.4565,  city: 'Washington Dulles, DC' },
  DCA: { lat: 38.8521, lng: -77.0377,  city: 'Washington Reagan, DC' },
  STL: { lat: 38.7487, lng: -90.37,    city: 'St. Louis, MO' },
  LAS: { lat: 36.084,  lng: -115.1537, city: 'Las Vegas, NV' },
  SAN: { lat: 32.7338, lng: -117.1933, city: 'San Diego, CA' },
  HOU: { lat: 29.6454, lng: -95.2789,  city: 'Houston Hobby, TX' },
  IAH: { lat: 29.9902, lng: -95.3368,  city: 'Houston, TX' },
  MSY: { lat: 29.9934, lng: -90.258,   city: 'New Orleans, LA' },
  CLT: { lat: 35.214,  lng: -80.9431,  city: 'Charlotte, NC' },
  PHL: { lat: 39.8721, lng: -75.2411,  city: 'Philadelphia, PA' },
  PIT: { lat: 40.4919, lng: -80.2329,  city: 'Pittsburgh, PA' },
  IND: { lat: 39.7173, lng: -86.2944,  city: 'Indianapolis, IN' },
  MCI: { lat: 39.2976, lng: -94.7139,  city: 'Kansas City, MO' },
  MKE: { lat: 42.9472, lng: -87.8966,  city: 'Milwaukee, WI' },
  OAK: { lat: 37.7213, lng: -122.2208, city: 'Oakland, CA' },
  SJC: { lat: 37.3626, lng: -121.9291, city: 'San Jose, CA' },
  PDX: { lat: 45.5898, lng: -122.5951, city: 'Portland, OR' },
  CLE: { lat: 41.4117, lng: -81.8498,  city: 'Cleveland, OH' },
  CMH: { lat: 39.9998, lng: -82.8919,  city: 'Columbus, OH' },
}

function greatCirclePoints(from, to, steps = 80) {
  const toRad = (d) => (d * Math.PI) / 180
  const toDeg = (r) => (r * 180) / Math.PI
  const lat1 = toRad(from.lat), lng1 = toRad(from.lng)
  const lat2 = toRad(to.lat),   lng2 = toRad(to.lng)
  const d = 2 * Math.asin(Math.sqrt(
    Math.sin((lat2 - lat1) / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin((lng2 - lng1) / 2) ** 2
  ))
  if (d === 0) return [from]
  return Array.from({ length: steps + 1 }, (_, i) => {
    const f = i / steps
    const A = Math.sin((1 - f) * d) / Math.sin(d)
    const B = Math.sin(f * d) / Math.sin(d)
    const x = A * Math.cos(lat1) * Math.cos(lng1) + B * Math.cos(lat2) * Math.cos(lng2)
    const y = A * Math.cos(lat1) * Math.sin(lng1) + B * Math.cos(lat2) * Math.sin(lng2)
    const z = A * Math.sin(lat1) + B * Math.sin(lat2)
    return { lat: toDeg(Math.atan2(z, Math.sqrt(x ** 2 + y ** 2))), lng: toDeg(Math.atan2(y, x)) }
  })
}

export default function FlightMapPanel() {
  const { rows: arrivals } = useSupabaseTable('arrivals', { orderBy: 'arrival_date', ascending: true })
  const [styleKey, setStyleKey] = useState('dark')

  const stats = useMemo(() => ({
    arrived:   arrivals.filter((a) => a.status === 'Arrived').length,
    landed:    arrivals.filter((a) => a.status === 'Landed').length,
    enRoute:   arrivals.filter((a) => a.status === 'En Route').length,
    confirmed: arrivals.filter((a) => a.status === 'Confirmed').length,
  }), [arrivals])

  // GeoJSON arc lines — one feature per arrival with an origin airport
  const arcGeoJSON = useMemo(() => {
    const features = arrivals.flatMap((arrival) => {
      const code = (arrival.origin_airport || '').toUpperCase().trim()
      const airport = AIRPORT_DB[code]
      if (!airport || code === 'PHX' || code === 'SDL') return []
      const pts = greatCirclePoints(airport, { lat: PHX.latitude, lng: PHX.longitude })
      return [{
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: pts.map((p) => [p.lng, p.lat]) },
        properties: { color: STATUS_COLORS[arrival.status] || STATUS_COLORS.TBD },
      }]
    })
    return { type: 'FeatureCollection', features }
  }, [arrivals])

  // Unique origin airports for dot markers
  const originMarkers = useMemo(() => {
    const seen = new Set()
    return arrivals.flatMap((arrival) => {
      const code = (arrival.origin_airport || '').toUpperCase().trim()
      const airport = AIRPORT_DB[code]
      if (!airport || code === 'PHX' || code === 'SDL' || seen.has(code)) return []
      seen.add(code)
      return [{ code, ...airport, color: STATUS_COLORS[arrival.status] || STATUS_COLORS.TBD }]
    })
  }, [arrivals])

  // Sidebar grouped by origin
  const byOrigin = useMemo(() => arrivals.reduce((acc, a) => {
    const code = (a.origin_airport || '').toUpperCase().trim() || '—'
    if (!acc[code]) acc[code] = []
    acc[code].push(a)
    return acc
  }, {}), [arrivals])

  if (!MAPBOX_TOKEN) {
    return (
      <div className="flex flex-1 items-center justify-center text-[#4B5563]">
        <span className="text-[11px] uppercase tracking-widest">Mapbox token not configured</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col md:min-h-0 md:flex-1 md:overflow-hidden">

      {/* Header */}
      <div className="border-b border-[#30363D] px-4 py-4 md:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8B949E]">Ops Map</div>
            <div className="mt-0.5 text-lg font-bold text-[#C9D1D9]">Inbound Flights · PHX</div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            {/* Stats */}
            {[
              { count: stats.arrived,   color: '#3FB950', label: 'Arrived' },
              { count: stats.landed,    color: '#A371F7', label: 'Landed' },
              { count: stats.enRoute,   color: '#D29922', label: 'En Route' },
              { count: stats.confirmed, color: '#58A6FF', label: 'Confirmed' },
            ].map(({ count, color, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: color }} />
                <span className="font-mono text-sm font-black" style={{ color }}>{count}</span>
                <span className="text-[9px] uppercase tracking-widest text-[#8B949E]">{label}</span>
              </div>
            ))}
            {/* Style switcher */}
            <div className="flex gap-1">
              {Object.entries(MAP_STYLES).map(([key, { label }]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setStyleKey(key)}
                  className={`border px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition-colors ${
                    styleKey === key
                      ? 'border-[#58A6FF] bg-[#58A6FF]/10 text-[#58A6FF]'
                      : 'border-[#30363D] bg-[#161b22] text-[#8B949E] hover:border-[#58A6FF]/40 hover:text-[#C9D1D9]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Map + Sidebar */}
      <div className="flex flex-1 md:min-h-0 md:overflow-hidden">
        {/* Map */}
        <div className="relative min-h-[60vw] flex-1 md:min-h-0">
          <Map
            mapboxAccessToken={MAPBOX_TOKEN}
            mapStyle={MAP_STYLES[styleKey].url}
            initialViewState={{ longitude: -98.35, latitude: 39.5, zoom: 3.2 }}
            style={{ width: '100%', height: '100%' }}
          >
            <NavigationControl position="top-right" />

            {/* Arc lines */}
            <Source id="arcs" type="geojson" data={arcGeoJSON}>
              <Layer
                id="arc-lines"
                type="line"
                paint={{
                  'line-color': ['get', 'color'],
                  'line-width': 1.5,
                  'line-opacity': 0.85,
                  'line-dasharray': [4, 2],
                }}
              />
            </Source>

            {/* PHX airport */}
            <Marker longitude={PHX.longitude} latitude={PHX.latitude} anchor="center">
              <div
                className="h-4 w-4 rounded-full border-2 border-[#ff7b72] bg-[#F85149] shadow-lg"
                title="PHX — Phoenix Sky Harbor"
              />
            </Marker>

            {/* Command house */}
            <Marker longitude={HOUSE.longitude} latitude={HOUSE.latitude} anchor="center">
              <div
                className="h-3.5 w-3.5 rounded-full border-2 border-[#56d364] bg-[#3FB950] shadow-lg"
                title="Command House — Scottsdale"
              />
            </Marker>

            {/* Origin airport dots */}
            {originMarkers.map((ap) => (
              <Marker key={ap.code} longitude={ap.lng} latitude={ap.lat} anchor="center">
                <div
                  className="h-2.5 w-2.5 rounded-full border border-[#0b0f14]"
                  style={{ background: ap.color }}
                  title={`${ap.code} — ${ap.city}`}
                />
              </Marker>
            ))}
          </Map>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 rounded border border-[#30363D] bg-[#0d1117]/90 p-3 backdrop-blur-sm">
            <div className="mb-2 text-[8px] font-black uppercase tracking-[0.2em] text-[#4B5563]">Legend</div>
            <div className="space-y-1.5">
              {[
                { color: '#F85149', label: 'PHX Airport', dot: true },
                { color: '#3FB950', label: 'Command House', dot: true },
                { color: '#3FB950', label: 'Arrived' },
                { color: '#A371F7', label: 'Landed' },
                { color: '#D29922', label: 'En Route' },
                { color: '#58A6FF', label: 'Confirmed' },
                { color: '#8B949E', label: 'TBD' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  {item.dot ? (
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: item.color }} />
                  ) : (
                    <svg width="16" height="4" className="shrink-0">
                      <line x1="0" y1="2" x2="16" y2="2" stroke={item.color} strokeWidth="2" strokeDasharray="4 2" />
                    </svg>
                  )}
                  <span className="text-[9px] text-[#8B949E]">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar — desktop only */}
        <div className="hidden w-56 flex-col overflow-auto border-l border-[#30363D] md:flex">
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
                    <div className="mb-1.5 flex items-center gap-2">
                      <Plane size={10} className="shrink-0 text-[#58A6FF]" />
                      <span className="font-mono text-[11px] font-black text-[#58A6FF]">{code}</span>
                      {airport && <span className="truncate text-[9px] text-[#4B5563]">{airport.city}</span>}
                    </div>
                    {people.map((person) => (
                      <div key={person.id} className="flex items-center justify-between py-0.5">
                        <span className="text-[11px] text-[#C9D1D9]">{person.name}</span>
                        <span
                          className="rounded px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider"
                          style={{
                            color: STATUS_COLORS[person.status] || STATUS_COLORS.TBD,
                            background: `${STATUS_COLORS[person.status] || STATUS_COLORS.TBD}20`,
                          }}
                        >
                          {person.status}
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
