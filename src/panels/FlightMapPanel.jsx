import { useMemo } from 'react'
import { Home, Plane } from 'lucide-react'
import { useSupabaseTable } from '../hooks/useSupabaseTable'

const MAP_WIDTH = 960
const MAP_HEIGHT = 560
const PHX_POINT = { x: 662, y: 338, label: 'PHX' }
const HOUSE_POINT = { x: 702, y: 332, label: 'House' }

const AIRPORT_DB = {
  PHX: { city: 'Phoenix, AZ', x: 662, y: 338 },
  SDL: { city: 'Scottsdale, AZ', x: 702, y: 332 },
  ORD: { city: 'Chicago, IL', x: 666, y: 165 },
  MDW: { city: 'Chicago Midway, IL', x: 655, y: 176 },
  ATL: { city: 'Atlanta, GA', x: 742, y: 258 },
  DFW: { city: 'Dallas, TX', x: 596, y: 284 },
  DAL: { city: 'Dallas Love, TX', x: 589, y: 282 },
  LAX: { city: 'Los Angeles, CA', x: 134, y: 318 },
  SFO: { city: 'San Francisco, CA', x: 116, y: 165 },
  JFK: { city: 'New York, NY', x: 848, y: 132 },
  LGA: { city: 'New York LaGuardia, NY', x: 840, y: 127 },
  EWR: { city: 'Newark, NJ', x: 834, y: 138 },
  BOS: { city: 'Boston, MA', x: 874, y: 111 },
  MIA: { city: 'Miami, FL', x: 844, y: 410 },
  DEN: { city: 'Denver, CO', x: 450, y: 205 },
  SEA: { city: 'Seattle, WA', x: 104, y: 70 },
  MSP: { city: 'Minneapolis, MN', x: 563, y: 126 },
  DTW: { city: 'Detroit, MI', x: 720, y: 146 },
  BWI: { city: 'Baltimore, MD', x: 813, y: 182 },
  IAD: { city: 'Washington Dulles, DC', x: 798, y: 188 },
  DCA: { city: 'Washington Reagan, DC', x: 806, y: 190 },
  STL: { city: 'St. Louis, MO', x: 600, y: 206 },
  LAS: { city: 'Las Vegas, NV', x: 228, y: 280 },
  SAN: { city: 'San Diego, CA', x: 136, y: 354 },
  HOU: { city: 'Houston Hobby, TX', x: 612, y: 348 },
  IAH: { city: 'Houston, TX', x: 603, y: 336 },
  MSY: { city: 'New Orleans, LA', x: 684, y: 346 },
  CLT: { city: 'Charlotte, NC', x: 777, y: 244 },
  PHL: { city: 'Philadelphia, PA', x: 832, y: 158 },
  PIT: { city: 'Pittsburgh, PA', x: 776, y: 153 },
  IND: { city: 'Indianapolis, IN', x: 640, y: 189 },
  MCI: { city: 'Kansas City, MO', x: 538, y: 212 },
  MKE: { city: 'Milwaukee, WI', x: 646, y: 145 },
  OAK: { city: 'Oakland, CA', x: 114, y: 171 },
  SJC: { city: 'San Jose, CA', x: 122, y: 185 },
  PDX: { city: 'Portland, OR', x: 109, y: 94 },
  CLE: { city: 'Cleveland, OH', x: 735, y: 153 },
  CMH: { city: 'Columbus, OH', x: 715, y: 171 },
}

const STATUS_COLORS = {
  TBD: '#8B949E',
  Confirmed: '#58A6FF',
  'En Route': '#D29922',
  Landed: '#A371F7',
  Arrived: '#3FB950',
}

const US_OUTLINE_PATH = `
  M116 104
  L136 88 L165 86 L196 78 L242 74 L278 81 L310 76 L362 92 L406 93
  L450 107 L498 103 L551 119 L604 124 L666 136 L718 148 L756 155
  L804 170 L840 195 L866 233 L858 270 L883 311 L877 343 L853 364
  L844 401 L812 426 L776 425 L742 409 L694 395 L655 402 L622 393
  L572 392 L530 384 L487 377 L459 359 L429 347 L396 344 L351 330
  L327 342 L285 348 L244 336 L208 337 L184 322 L160 304 L145 280
  L126 248 L112 220 L104 184 Z
`

function formatDateTime(value) {
  if (!value) return '—'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleString('en-US', {
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function buildArcPath(from, to) {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const midpointX = from.x + dx / 2
  const midpointY = from.y + dy / 2
  const distance = Math.hypot(dx, dy)
  const lift = Math.max(28, Math.min(110, distance * 0.18))
  const controlY = midpointY - lift
  return `M ${from.x} ${from.y} Q ${midpointX} ${controlY} ${to.x} ${to.y}`
}

function FlightPath({ from, to, color }) {
  return (
    <>
      <path d={buildArcPath(from, to)} fill="none" stroke={`${color}28`} strokeWidth="8" />
      <path
        d={buildArcPath(from, to)}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeDasharray="6 6"
        strokeLinecap="round"
      />
    </>
  )
}

export default function FlightMapPanel() {
  const { rows: arrivals } = useSupabaseTable('arrivals', { orderBy: 'arrival_date', ascending: true })

  const groupedOrigins = useMemo(() => {
    const groups = new Map()

    arrivals.forEach((arrival) => {
      const code = (arrival.origin_airport || '').toUpperCase().trim()
      const airport = AIRPORT_DB[code]
      if (!airport || code === 'PHX' || code === 'SDL') return

      if (!groups.has(code)) {
        groups.set(code, {
          code,
          airport,
          people: [],
          strongestStatus: arrival.status || 'TBD',
        })
      }

      const entry = groups.get(code)
      entry.people.push(arrival)

      const score = ['TBD', 'Confirmed', 'En Route', 'Landed', 'Arrived']
      if (score.indexOf(arrival.status || 'TBD') > score.indexOf(entry.strongestStatus)) {
        entry.strongestStatus = arrival.status || 'TBD'
      }
    })

    return [...groups.values()].sort((left, right) => left.code.localeCompare(right.code))
  }, [arrivals])

  const stats = useMemo(
    () => ({
      arrived: arrivals.filter((item) => item.status === 'Arrived').length,
      landed: arrivals.filter((item) => item.status === 'Landed').length,
      enRoute: arrivals.filter((item) => item.status === 'En Route').length,
      tracked: arrivals.filter((item) => item.transport === 'flight').length,
    }),
    [arrivals],
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-[#30363D] px-6 py-4">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8B949E]">Ops Map</div>
          <div className="mt-0.5 text-lg font-bold text-[#C9D1D9]">Inbound Command Board</div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="font-mono text-xl font-black text-[#3FB950]">{stats.arrived}</div>
            <div className="text-[9px] uppercase tracking-widest text-[#8B949E]">Arrived</div>
          </div>
          <div className="text-center">
            <div className="font-mono text-xl font-black text-[#A371F7]">{stats.landed}</div>
            <div className="text-[9px] uppercase tracking-widest text-[#8B949E]">Landed</div>
          </div>
          <div className="text-center">
            <div className="font-mono text-xl font-black text-[#D29922]">{stats.enRoute}</div>
            <div className="text-[9px] uppercase tracking-widest text-[#8B949E]">En Route</div>
          </div>
          <div className="text-center">
            <div className="font-mono text-xl font-black text-[#58A6FF]">{stats.tracked}</div>
            <div className="text-[9px] uppercase tracking-widest text-[#8B949E]">Tracked</div>
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="relative flex-1 overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(88,166,255,0.14),transparent_36%),linear-gradient(180deg,#091019,#06090f)]">
          <div className="absolute inset-0 bg-[radial-gradient(rgba(88,166,255,0.08)_1px,transparent_1px)] [background-size:26px_26px]" />
          <svg viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} className="h-full w-full">
            <defs>
              <linearGradient id="commandGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#58A6FF" stopOpacity="0.26" />
                <stop offset="100%" stopColor="#58A6FF" stopOpacity="0.02" />
              </linearGradient>
            </defs>

            <path d={US_OUTLINE_PATH} fill="url(#commandGlow)" stroke="#24313D" strokeWidth="2" />

            {groupedOrigins.map((group) => (
              <FlightPath
                key={group.code}
                from={group.airport}
                to={PHX_POINT}
                color={STATUS_COLORS[group.strongestStatus] || STATUS_COLORS.TBD}
              />
            ))}

            {groupedOrigins.map((group) => (
              <g key={`${group.code}-origin`}>
                <circle
                  cx={group.airport.x}
                  cy={group.airport.y}
                  r="6"
                  fill={STATUS_COLORS[group.strongestStatus] || STATUS_COLORS.TBD}
                  stroke="#0B0F14"
                  strokeWidth="2"
                />
                <text x={group.airport.x + 10} y={group.airport.y - 8} fill="#8B949E" fontSize="11" fontWeight="700">
                  {group.code}
                </text>
              </g>
            ))}

            <g>
              <circle cx={PHX_POINT.x} cy={PHX_POINT.y} r="10" fill="#F85149" stroke="#FF7B72" strokeWidth="3" />
              <text x={PHX_POINT.x + 16} y={PHX_POINT.y - 10} fill="#F0F6FC" fontSize="13" fontWeight="900">
                PHX
              </text>
              <text x={PHX_POINT.x + 16} y={PHX_POINT.y + 8} fill="#8B949E" fontSize="11" fontWeight="700">
                Phoenix Sky Harbor
              </text>
            </g>

            <g>
              <circle cx={HOUSE_POINT.x} cy={HOUSE_POINT.y} r="8" fill="#3FB950" stroke="#8AE6A0" strokeWidth="2" />
              <text x={HOUSE_POINT.x + 14} y={HOUSE_POINT.y + 4} fill="#C9D1D9" fontSize="11" fontWeight="800">
                Scottsdale House
              </text>
            </g>
          </svg>

          <div className="absolute bottom-4 left-4 border border-[#30363D] bg-[#0D1117]/92 px-4 py-3 backdrop-blur">
            <div className="text-[8px] font-black uppercase tracking-[0.2em] text-[#58A6FF]">Map Layer</div>
            <div className="mt-2 space-y-2 text-[10px] text-[#8B949E]">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#F85149]" />
                PHX arrival hub
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#3FB950]" />
                Scottsdale command house
              </div>
              <div className="flex items-center gap-2">
                <svg width="16" height="4">
                  <line x1="0" y1="2" x2="16" y2="2" stroke="#58A6FF" strokeWidth="2" strokeDasharray="5 4" />
                </svg>
                inbound flight lane
              </div>
            </div>
          </div>
        </div>

        <div className="flex w-80 flex-col overflow-auto border-l border-[#30363D] bg-[#0D1117]">
          <div className="border-b border-[#30363D] px-4 py-3">
            <div className="text-[9px] font-black uppercase tracking-[0.2em] text-[#58A6FF]">Origin Feed</div>
          </div>

          {!groupedOrigins.length ? (
            <div className="flex flex-1 items-center justify-center px-6 text-center text-[10px] uppercase tracking-widest text-[#4B5563]">
              No flight arrivals are currently tracked.
            </div>
          ) : (
            <div className="divide-y divide-[#21262D]">
              {groupedOrigins.map((group) => (
                <div key={group.code} className="px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Plane size={12} className="text-[#58A6FF]" />
                        <span className="font-mono text-[12px] font-black text-[#58A6FF]">{group.code}</span>
                      </div>
                      <div className="mt-1 text-[10px] text-[#8B949E]">{group.airport.city}</div>
                    </div>
                    <div
                      className="rounded px-2 py-0.5 text-[9px] font-black uppercase tracking-wider"
                      style={{
                        color: STATUS_COLORS[group.strongestStatus] || STATUS_COLORS.TBD,
                        backgroundColor: `${STATUS_COLORS[group.strongestStatus] || STATUS_COLORS.TBD}1A`,
                      }}
                    >
                      {group.strongestStatus}
                    </div>
                  </div>

                  <div className="mt-3 space-y-2">
                    {group.people.map((person) => (
                      <div key={person.id} className="border border-[#30363D] bg-[#11161D] px-3 py-2">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-[11px] font-bold text-[#C9D1D9]">{person.name}</div>
                          <div className="text-[10px] text-[#8B949E]">{person.flight_number || 'Flight TBD'}</div>
                        </div>
                        <div className="mt-1 text-[10px] text-[#8B949E]">
                          {person.arrival_date || 'Date TBD'} {person.arrival_time || ''}
                        </div>
                        {person.actual_landed_at ? (
                          <div className="mt-1 text-[10px] text-[#A371F7]">
                            Landed {formatDateTime(person.actual_landed_at)}
                          </div>
                        ) : null}
                        <div className="mt-2 flex items-center gap-2 text-[10px] text-[#8B949E]">
                          {person.pickup_needed ? <Home size={11} className="text-[#D29922]" /> : null}
                          <span>{person.pickup_needed ? 'Pickup required' : 'Self-transport / TBD'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
