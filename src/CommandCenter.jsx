import { useEffect, useState } from 'react'
import { useSupabaseTable } from './hooks/useSupabaseTable'

const OPS_CATEGORY_CONFIG = {
  INFO:      { color: '#BA1323' },
  ARRIVAL:   { color: '#48B040' },
  TRANSPORT: { color: '#C4952A' },
  FOOD:      { color: '#D4601A' },
  ALERT:     { color: '#E83025' },
  HYPE:      { color: '#C4952A' },
}

// ─── UPDATE THIS TO THE ACTUAL WEDDING DATE ───────────────────────────────────
const WEDDING_DATE = new Date('2026-08-08T16:00:00')
// ─────────────────────────────────────────────────────────────────────────────

const LAT = 33.4942
const LON = -111.9261

const TICKER_ITEMS = [
  'Bertha makes the drinks — do not argue with Bertha',
  'Sunscreen is mandatory — Scottsdale will cook you',
  'Golf tee time Friday morning — DO NOT sleep in',
  'Cien Agave dinner Friday night — do not hit on the waitress',
  'Talking Stick Casino Friday night — Scotty runs the blackjack table',
  'Gold Water Brewing → Craft 64 → One Handsome Bastard Saturday',
  'Colonary Dropout → The Bar Saturday night',
  'Freakman gets bacon, eggs, and freak juice every morning',
  'What happens in Scottsdale stays in Scottsdale (mostly)',
  'No supplements in the bathroom after 10pm, Shaun',
]

const STATUS_CONFIG = {
  Arrived:    { label: 'ON SITE',     color: '#48B040', dim: false },
  Landed:     { label: 'LANDED',      color: '#48B040', dim: false },
  'En Route': { label: 'IN TRANSIT',  color: '#C4952A', dim: false },
  Confirmed:  { label: 'CONFIRMED',   color: '#BA1323', dim: false },
  TBD:        { label: 'TBD',         color: '#5C3820', dim: true  },
}

const CATEGORY_COLOR = {
  nightlife:  '#BA1323',
  food:       '#C4952A',
  golf:       '#48B040',
  pool:       '#D4601A',
  transport:  '#9A8070',
  activity:   '#C4952A',
  activities: '#C4952A',
  other:      '#9A8070',
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function pad(n) { return String(n).padStart(2, '0') }

function formatClock(d) {
  const h = d.getHours() % 12 || 12
  return `${pad(h)}:${pad(d.getMinutes())}:${pad(d.getSeconds())} ${d.getHours() >= 12 ? 'PM' : 'AM'}`
}

function weddingCountdown() {
  const diff = WEDDING_DATE - new Date()
  if (diff <= 0) return '0d 0h'
  const days = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  return `${days}d ${hours}h`
}

function weatherDesc(code) {
  if (code === 0)  return 'Clear Skies'
  if (code <= 2)   return 'Partly Cloudy'
  if (code === 3)  return 'Overcast'
  if (code <= 49)  return 'Foggy'
  if (code <= 67)  return 'Rain'
  if (code <= 82)  return 'Showers'
  if (code <= 99)  return 'Thunderstorm'
  return 'Clear'
}

function todayStr()    { return new Date().toLocaleDateString('en-CA') }
function tomorrowStr() { return new Date(Date.now() + 86400000).toLocaleDateString('en-CA') }
function nowTimeStr()  { const n = new Date(); return `${pad(n.getHours())}:${pad(n.getMinutes())}` }

// ─── TOP BAR ─────────────────────────────────────────────────────────────────

function TopBar({ clock, cdText }) {
  return (
    <div className="shrink-0 border-b-2 border-[#BA1323]/40 bg-[#0A0604] px-8 py-3">
      <div className="flex items-center justify-between">
        <div className="text-4xl font-black uppercase tracking-[0.18em] text-[#BA1323]">
          Freakman Operation
        </div>
        <div className="text-center">
          <div className="text-2xl font-black uppercase tracking-[0.25em] text-[#FAF0E8]">
            Scottsdale · May 29–31
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-3xl font-black tabular-nums text-[#FAF0E8]">{clock}</div>
        </div>
      </div>
      {/* Wedding countdown bar */}
      <div className="mt-2 flex items-center justify-center gap-3 border-t border-[#281408] pt-2">
        <span className="text-lg font-black uppercase tracking-[0.18em] text-[#F2E4D0]">
          Freakman — Bachelor
        </span>
        <span className="text-[#3C1810]">·</span>
        <span className="font-mono text-2xl font-black text-[#E83025]">{cdText}</span>
        <span className="text-lg font-black uppercase tracking-[0.12em] text-[#5C3820]">
          until he belongs to someone else
        </span>
      </div>
    </div>
  )
}

// ─── ARRIVALS BOARD ───────────────────────────────────────────────────────────

function ArrivalsBoard({ arrivals }) {
  const sorted = [...arrivals].sort((a, b) => {
    if (!a.arrival_time && !b.arrival_time) return 0
    if (!a.arrival_time) return 1
    if (!b.arrival_time) return -1
    return a.arrival_time.localeCompare(b.arrival_time)
  })

  return (
    <div className="flex h-full flex-col border-r border-[#3C1810]">
      {/* Section header */}
      <div className="shrink-0 border-b border-[#3C1810] bg-[#140A06] px-6 py-3">
        <div className="text-[10px] font-black uppercase tracking-[0.35em] text-[#5C3820]">Live Arrivals</div>
        <div className="text-2xl font-black uppercase tracking-[0.08em] text-[#FAF0E8]">PHX Inbound</div>
      </div>
      {/* Column headers */}
      <div className="shrink-0 grid grid-cols-[1fr_80px_72px_100px] gap-3 border-b border-[#281408] bg-[#0A0604] px-6 py-2">
        {['Passenger', 'Flight', 'ETA', 'Status'].map((h) => (
          <div key={h} className="text-[9px] font-black uppercase tracking-[0.3em] text-[#5C3820]">{h}</div>
        ))}
      </div>
      {/* Rows */}
      <div className="flex-1 overflow-hidden">
        {sorted.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <span className="text-sm uppercase tracking-widest text-[#5C3820]">No arrivals logged</span>
          </div>
        ) : (
          sorted.map((a) => {
            const cfg = STATUS_CONFIG[a.status] || STATUS_CONFIG.TBD
            const arrived = a.status === 'Arrived'
            return (
              <div
                key={a.id}
                className={`grid grid-cols-[1fr_80px_72px_100px] items-center gap-3 border-b border-[#281408] px-6 py-3 transition-opacity ${arrived ? 'opacity-40' : ''}`}
              >
                <div>
                  <div className="text-xl font-black leading-tight text-[#FAF0E8]">{a.name}</div>
                  {a.pickup_needed && !arrived && (
                    <div className="mt-0.5 inline-block rounded bg-[#E83025]/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-[#E83025]">
                      Needs Ride
                    </div>
                  )}
                </div>
                <div className="font-mono text-base font-semibold text-[#9A8070]">
                  {a.flight_number || '—'}
                </div>
                <div className="font-mono text-lg font-black text-[#F2E4D0]">
                  {a.arrival_time ? a.arrival_time.slice(0, 5) : '—'}
                </div>
                <div
                  className="rounded px-2 py-1 text-[10px] font-black uppercase tracking-wider text-center"
                  style={{ color: cfg.color, background: `${cfg.color}20` }}
                >
                  {cfg.label}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

// ─── MISSION CENTER ──────────────────────────────────────────────────────────

function MissionCenter({ itinerary, weather, now }) {
  const today    = now.toLocaleDateString('en-CA')
  const tomorrow = new Date(now.getTime() + 86400000).toLocaleDateString('en-CA')
  const nowTime  = `${pad(now.getHours())}:${pad(now.getMinutes())}`

  const todayItems = [...itinerary]
    .filter((i) => i.day_date === today)
    .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''))

  const upcoming = todayItems.filter((i) => (i.start_time || '23:59') >= nowTime)
  const tonightEvent =
    upcoming.find((i) => ['nightlife', 'food', 'activity', 'activities'].includes(i.category)) ||
    upcoming[upcoming.length - 1] ||
    todayItems[todayItems.length - 1]

  const tomorrowFirst = [...itinerary]
    .filter((i) => i.day_date === tomorrow)
    .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''))[0]

  return (
    <div className="flex h-full flex-col border-r border-[#3C1810]">
      {/* Tonight header */}
      <div className="shrink-0 border-b border-[#3C1810] bg-[#140A06] px-6 py-3">
        <div className="text-[10px] font-black uppercase tracking-[0.35em] text-[#5C3820]">Tonight's Plan</div>
        <div className="text-2xl font-black uppercase tracking-[0.08em] text-[#FAF0E8]">Primary Objective</div>
      </div>

      {/* Tonight's event — big card */}
      <div className="shrink-0 border-b border-[#3C1810] p-6">
        {tonightEvent ? (
          <>
            <div
              className="text-[10px] font-black uppercase tracking-[0.3em]"
              style={{ color: CATEGORY_COLOR[tonightEvent.category] || '#9A8070' }}
            >
              {tonightEvent.category}
            </div>
            <div className="mt-2 text-3xl font-black leading-tight text-[#FAF0E8]">
              {tonightEvent.title}
            </div>
            {tonightEvent.location_name && (
              <div className="mt-1.5 text-base text-[#9A8070]">{tonightEvent.location_name}</div>
            )}
            {tonightEvent.start_time && (
              <div className="mt-3 font-mono text-6xl font-black leading-none" style={{ color: CATEGORY_COLOR[tonightEvent.category] || '#BA1323' }}>
                {tonightEvent.start_time.slice(0, 5)}
              </div>
            )}
            {tonightEvent.notes && (
              <div className="mt-2 text-sm italic text-[#5C3820]">{tonightEvent.notes}</div>
            )}
          </>
        ) : (
          <div className="text-lg text-[#5C3820]">No events scheduled for today</div>
        )}
      </div>

      {/* Tomorrow header */}
      <div className="shrink-0 border-b border-[#3C1810] bg-[#140A06] px-6 py-2.5">
        <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#5C3820]">Tomorrow — First Move</div>
      </div>

      {/* Tomorrow's first event */}
      <div className="shrink-0 border-b border-[#3C1810] px-6 py-4">
        {tomorrowFirst ? (
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-xl font-black text-[#F2E4D0]">{tomorrowFirst.title}</div>
              {tomorrowFirst.location_name && (
                <div className="text-sm text-[#9A8070]">{tomorrowFirst.location_name}</div>
              )}
            </div>
            {tomorrowFirst.start_time && (
              <div className="shrink-0 font-mono text-2xl font-black text-[#9A8070]">
                {tomorrowFirst.start_time.slice(0, 5)}
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-[#5C3820]">Nothing logged yet</div>
        )}
      </div>

      {/* Weather */}
      <div className="shrink-0 border-b border-[#3C1810] bg-[#140A06] px-6 py-2.5">
        <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#5C3820]">Scottsdale Conditions</div>
      </div>
      <div className="flex-1 p-6">
        {weather ? (
          <>
            <div className="flex items-end gap-5">
              <div className="font-mono text-8xl font-black leading-none text-[#FAF0E8]">
                {Math.round(weather.temp)}°
              </div>
              <div className="mb-2">
                <div className="text-xl font-bold text-[#F2E4D0]">{weather.desc}</div>
                <div className="text-sm text-[#9A8070]">{Math.round(weather.wind)} mph wind</div>
              </div>
            </div>
            {weather.temp >= 95 && (
              <div className="mt-4 rounded border border-[#E83025]/50 bg-[#E83025]/10 px-4 py-2.5">
                <div className="text-sm font-black uppercase tracking-wider text-[#E83025]">
                  ⚠ Extreme Heat Alert — Hydrate. Limit midday exposure.
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-sm text-[#5C3820]">Fetching conditions…</div>
        )}
      </div>
    </div>
  )
}

// ─── STATS PANEL ─────────────────────────────────────────────────────────────

function StatsPanel({ arrivals, now }) {
  const onSite    = arrivals.filter((a) => a.status === 'Arrived').length
  const inTransit = arrivals.filter((a) => ['En Route', 'Landed'].includes(a.status)).length
  const tbd       = arrivals.filter((a) => a.status === 'TBD').length
  const confirmed = arrivals.filter((a) => a.status === 'Confirmed').length
  const needsRide = arrivals.filter((a) => a.pickup_needed && a.status !== 'Arrived')

  return (
    <div className="flex flex-col shrink-0">
      <div className="border-b border-[#3C1810] bg-[#140A06] px-5 py-2.5">
        <div className="text-[10px] font-black uppercase tracking-[0.35em] text-[#5C3820]">Live Headcount</div>
      </div>

      {/* Compact 2×2 */}
      <div className="grid grid-cols-2 gap-px bg-[#281408]">
        {[
          { label: 'On Site',    value: onSite,    color: '#48B040' },
          { label: 'In Transit', value: inTransit, color: '#C4952A' },
          { label: 'TBD',        value: tbd,        color: '#5C3820' },
          { label: 'Confirmed',  value: confirmed,  color: '#BA1323' },
        ].map(({ label, value, color }) => (
          <div key={label} className="flex flex-col items-center justify-center bg-[#140A06] py-3">
            <div className="font-mono text-4xl font-black" style={{ color }}>{value}</div>
            <div className="mt-0.5 text-[9px] font-black uppercase tracking-widest text-[#5C3820]">{label}</div>
          </div>
        ))}
      </div>

      {/* Ride needed */}
      <div className="border-t border-[#3C1810] bg-[#140A06] px-5 py-2">
        <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#E83025]">
          Needs a Ride {needsRide.length > 0 ? `(${needsRide.length})` : ''}
        </div>
      </div>
      <div className="border-b border-[#3C1810] px-5 py-3">
        {needsRide.length === 0 ? (
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-[#48B040]" />
            <span className="text-sm font-semibold text-[#48B040]">All covered</span>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {needsRide.map((a) => (
              <div key={a.id} className="flex items-center justify-between">
                <div className="text-base font-black text-[#FAF0E8]">{a.name}</div>
                <div className="font-mono text-sm font-semibold text-[#C4952A]">
                  {a.arrival_time ? a.arrival_time.slice(0, 5) : 'TBD'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── OPS FEED ────────────────────────────────────────────────────────────────

function OpsFeed({ feed }) {
  const now = new Date()
  const active = [...feed]
    .filter((e) => !e.expires_at || new Date(e.expires_at) > now)
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      return new Date(b.created_at) - new Date(a.created_at)
    })
    .slice(0, 7)

  function relTime(ts) {
    const diff = Date.now() - new Date(ts)
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    return `${Math.floor(mins / 60)}h ago`
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="shrink-0 border-b border-[#3C1810] bg-[#140A06] px-5 py-2.5">
        <div className="flex items-center gap-2">
          <div
            className="h-1.5 w-1.5 rounded-full bg-[#48B040]"
            style={{ animation: 'pulse-dot 2s ease-in-out infinite' }}
          />
          <div className="text-[10px] font-black uppercase tracking-[0.35em] text-[#5C3820]">Messages</div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {active.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <span className="text-xs uppercase tracking-widest text-[#281408]">No messages</span>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-[#281408]">
            {active.map((entry) => {
              const c = OPS_CATEGORY_CONFIG[entry.category] || OPS_CATEGORY_CONFIG.INFO
              const isAlert = entry.category === 'ALERT'
              return (
                <div
                  key={entry.id}
                  className="px-5 py-3"
                  style={isAlert ? {
                    animation: 'alert-flash 1.5s ease-in-out infinite',
                    borderLeft: `3px solid ${c.color}`,
                    background: `${c.color}08`,
                  } : {
                    borderLeft: `3px solid ${c.color}40`,
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      {entry.pinned && (
                        <div className="mb-1 text-[9px] font-black uppercase tracking-widest text-[#C4952A]">
                          📌 Pinned
                        </div>
                      )}
                      <div className="text-base font-bold leading-snug text-[#FAF0E8]">
                        {entry.message}
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <span
                          className="rounded px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider"
                          style={{ color: c.color, background: `${c.color}20` }}
                        >
                          {entry.category}
                        </span>
                        <span className="font-mono text-[10px] text-[#5C3820]">
                          {relTime(entry.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── EMERGENCY OVERLAY ───────────────────────────────────────────────────────

function EmergencyOverlay({ entry }) {
  if (!entry) return null
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center px-16 text-center"
      style={{ animation: 'emergency-bg 1.2s ease-in-out infinite, emergency-border 1.2s ease-in-out infinite' }}
    >
      {/* Top label */}
      <div className="mb-8 flex items-center gap-4">
        <div className="h-px w-24 bg-[#E83025]/60" />
        <div className="text-[13px] font-black uppercase tracking-[0.6em] text-[#E83025]">
          ⚠ Emergency Alert
        </div>
        <div className="h-px w-24 bg-[#E83025]/60" />
      </div>

      {/* Message */}
      <div
        className="max-w-5xl text-7xl font-black uppercase leading-tight text-white"
        style={{ animation: 'emergency-text 1.2s ease-in-out infinite', letterSpacing: '0.04em' }}
      >
        {entry.message}
      </div>

      {/* Bottom label */}
      <div className="mt-10 text-[11px] font-black uppercase tracking-[0.4em] text-[#E83025]/60">
        Freakman Operation · War Room
      </div>
    </div>
  )
}

// ─── BOTTOM TICKER ───────────────────────────────────────────────────────────

function BottomTicker({ items }) {
  const text = (items && items.length > 0 ? items : TICKER_ITEMS).join('     ·     ')
  const full = `${text}     ·     ${text}`
  return (
    <div className="shrink-0 flex items-center border-t-2 border-[#BA1323]/30 bg-[#0A0604]" style={{ height: '48px' }}>
      <div className="shrink-0 flex h-full items-center bg-[#BA1323] px-5">
        <span className="text-[10px] font-black uppercase tracking-[0.35em] text-[#FAF0E8] whitespace-nowrap">
          Messages
        </span>
      </div>
      <div className="flex-1 overflow-hidden">
        <div
          className="whitespace-nowrap font-mono text-sm font-semibold uppercase tracking-widest text-[#9A8070]"
          style={{ animation: 'ticker 80s linear infinite', display: 'inline-block', paddingLeft: '3rem' }}
        >
          {full}
        </div>
      </div>
    </div>
  )
}

// ─── LIVE INDICATOR ──────────────────────────────────────────────────────────

function LiveIndicator({ lastUpdated }) {
  return (
    <div className="absolute bottom-14 right-3 flex items-center gap-1.5">
      <div
        className="h-1.5 w-1.5 rounded-full bg-[#48B040]"
        style={{ animation: 'pulse-dot 2s ease-in-out infinite' }}
      />
      <span className="font-mono text-[9px] text-[#281408]">
        {lastUpdated < 60 ? `${lastUpdated}s ago` : `${Math.floor(lastUpdated / 60)}m ago`}
      </span>
    </div>
  )
}

// ─── COMMAND CENTER ──────────────────────────────────────────────────────────

export default function CommandCenter() {
  const { rows: arrivals,  refetch: refetchArrivals }  = useSupabaseTable('arrivals', { orderBy: 'arrival_time', ascending: true })
  const { rows: itinerary, refetch: refetchItinerary } = useSupabaseTable('itinerary_items', { orderBy: 'start_time' })
  const { rows: opsFeed,   refetch: refetchOpsFeed }   = useSupabaseTable('ops_feed', { orderBy: 'created_at', ascending: false })
  const { rows: houseInfo } = useSupabaseTable('house_info', { orderBy: 'key' })

  const [clock, setClock]             = useState(formatClock(new Date()))
  const [cdText, setCdText]           = useState(weddingCountdown())
  const [now, setNow]                 = useState(new Date())
  const [weather, setWeather]         = useState(null)
  const [lastUpdated, setLastUpdated] = useState(0)

  // 1-second clock + countdown — no component remounting
  useEffect(() => {
    const t = setInterval(() => {
      const d = new Date()
      setClock(formatClock(d))
      setCdText(weddingCountdown())
      setNow(d)
      setLastUpdated((s) => s + 1)
    }, 1000)
    return () => clearInterval(t)
  }, [])

  // 30-second polling fallback — keeps data fresh if WebSocket drops
  useEffect(() => {
    const t = setInterval(() => {
      refetchArrivals()
      refetchItinerary()
      setLastUpdated(0)
    }, 30000)
    return () => clearInterval(t)
  }, [refetchArrivals, refetchItinerary])

  // 15-second ops feed polling
  useEffect(() => {
    const t = setInterval(() => { refetchOpsFeed() }, 15000)
    return () => clearInterval(t)
  }, [refetchOpsFeed])

  // Weather — fetch on mount, refresh every 30 min
  useEffect(() => {
    function fetch30() {
      fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}` +
        `&current=temperature_2m,weathercode,windspeed_10m` +
        `&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=America%2FPhoenix`
      )
        .then((r) => r.json())
        .then((j) => {
          if (j.current) {
            setWeather({
              temp: j.current.temperature_2m,
              desc: weatherDesc(j.current.weathercode),
              wind: j.current.windspeed_10m,
            })
            setLastUpdated(0)
          }
        })
        .catch(() => {})
    }
    fetch30()
    const t = setInterval(fetch30, 30 * 60 * 1000)
    return () => clearInterval(t)
  }, [])

  const emergencyAlert = opsFeed.find(
    (e) => e.category === 'ALERT' && e.pinned && (!e.expires_at || new Date(e.expires_at) > new Date())
  ) || null

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-[#0C0605] text-[#F2E4D0]">
      <EmergencyOverlay entry={emergencyAlert} />
      <TopBar clock={clock} cdText={cdText} />

      <div className="flex min-h-0 flex-1">
        {/* Left 40% — Arrivals */}
        <div className="w-[40%] overflow-hidden">
          <ArrivalsBoard arrivals={arrivals} />
        </div>

        {/* Center 35% — Mission */}
        <div className="w-[35%] overflow-hidden">
          <MissionCenter itinerary={itinerary} weather={weather} now={now} />
        </div>

        {/* Right 25% — Stats + Ops Feed */}
        <div className="flex w-[25%] flex-col overflow-hidden">
          <StatsPanel arrivals={arrivals} now={now} />
          <OpsFeed feed={opsFeed} />
        </div>
      </div>

      <BottomTicker items={houseInfo.find(r => r.key === 'Ticker Messages')?.value?.split('\n').filter(Boolean)} />
      <LiveIndicator lastUpdated={lastUpdated} />
    </div>
  )
}
