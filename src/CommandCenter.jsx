import { useEffect, useState } from 'react'
import { useSupabaseTable } from './hooks/useSupabaseTable'

// ─── UPDATE THIS TO THE ACTUAL WEDDING DATE ───────────────────────────────────
const WEDDING_DATE = new Date('2026-08-08T16:00:00')
// ─────────────────────────────────────────────────────────────────────────────

const LAT = 33.4942
const LON = -111.9261

const TICKER_ITEMS = [
  'No pork in the house',
  'Pool opens 8am',
  'Golf tee time 7am Friday — do not sleep in',
  'Venmo @NoahKing for the house split',
  'Steakhouse Night Friday — reservation for 14 confirmed',
  'Sunscreen is not optional in Scottsdale',
  'Quiet hours 11pm weekends per Scottsdale ordinance',
  'Checkout Saturday 11am — pack before you party Saturday night',
  'Hydrate. Scottsdale in May will humble you.',
  'Last one in the pool buys the next round',
]

const STATUS_CONFIG = {
  Arrived:    { label: 'ON SITE',     color: '#3FB950', dim: false },
  Landed:     { label: 'LANDED',      color: '#3FB950', dim: false },
  'En Route': { label: 'IN TRANSIT',  color: '#D29922', dim: false },
  Confirmed:  { label: 'CONFIRMED',   color: '#58A6FF', dim: false },
  TBD:        { label: 'TBD',         color: '#4B5563', dim: true  },
}

const CATEGORY_COLOR = {
  nightlife:  '#A371F7',
  food:       '#D29922',
  golf:       '#3FB950',
  pool:       '#58A6FF',
  transport:  '#F78166',
  activity:   '#39D353',
  activities: '#39D353',
  other:      '#8B949E',
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
    <div className="shrink-0 border-b-2 border-[#58A6FF]/40 bg-[#080a0d] px-8 py-3">
      <div className="flex items-center justify-between">
        <div className="text-4xl font-black uppercase tracking-[0.18em] text-[#58A6FF]">
          Phoenix Operation
        </div>
        <div className="text-center">
          <div className="text-2xl font-black uppercase tracking-[0.25em] text-[#F0F6FC]">
            Scottsdale · May 28–31
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-3xl font-black tabular-nums text-[#F0F6FC]">{clock}</div>
        </div>
      </div>
      {/* Wedding countdown bar */}
      <div className="mt-2 flex items-center justify-center gap-3 border-t border-[#21262d] pt-2">
        <span className="text-lg font-black uppercase tracking-[0.18em] text-[#C9D1D9]">
          Noah King — Bachelor
        </span>
        <span className="text-[#30363D]">·</span>
        <span className="font-mono text-2xl font-black text-[#F85149]">{cdText}</span>
        <span className="text-lg font-black uppercase tracking-[0.12em] text-[#4B5563]">
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
    <div className="flex h-full flex-col border-r border-[#30363D]">
      {/* Section header */}
      <div className="shrink-0 border-b border-[#30363D] bg-[#0d1117] px-6 py-3">
        <div className="text-[10px] font-black uppercase tracking-[0.35em] text-[#4B5563]">Live Arrivals</div>
        <div className="text-2xl font-black uppercase tracking-[0.08em] text-[#F0F6FC]">PHX Inbound</div>
      </div>
      {/* Column headers */}
      <div className="shrink-0 grid grid-cols-[1fr_80px_72px_100px] gap-3 border-b border-[#21262d] bg-[#080a0d] px-6 py-2">
        {['Passenger', 'Flight', 'ETA', 'Status'].map((h) => (
          <div key={h} className="text-[9px] font-black uppercase tracking-[0.3em] text-[#4B5563]">{h}</div>
        ))}
      </div>
      {/* Rows */}
      <div className="flex-1 overflow-hidden">
        {sorted.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <span className="text-sm uppercase tracking-widest text-[#4B5563]">No arrivals logged</span>
          </div>
        ) : (
          sorted.map((a) => {
            const cfg = STATUS_CONFIG[a.status] || STATUS_CONFIG.TBD
            const arrived = a.status === 'Arrived'
            return (
              <div
                key={a.id}
                className={`grid grid-cols-[1fr_80px_72px_100px] items-center gap-3 border-b border-[#21262d] px-6 py-3 transition-opacity ${arrived ? 'opacity-40' : ''}`}
              >
                <div>
                  <div className="text-xl font-black leading-tight text-[#F0F6FC]">{a.name}</div>
                  {a.pickup_needed && !arrived && (
                    <div className="mt-0.5 inline-block rounded bg-[#F85149]/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-[#F85149]">
                      Needs Ride
                    </div>
                  )}
                </div>
                <div className="font-mono text-base font-semibold text-[#8B949E]">
                  {a.flight_number || '—'}
                </div>
                <div className="font-mono text-lg font-black text-[#C9D1D9]">
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

function MissionCenter({ itinerary, weather }) {
  const today = todayStr()
  const tomorrow = tomorrowStr()
  const nowTime = nowTimeStr()

  const todayItems = [...itinerary]
    .filter((i) => i.day_date === today)
    .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''))

  // Tonight: next upcoming event today (prefer nightlife/food/activity)
  const upcoming = todayItems.filter((i) => (i.start_time || '23:59') >= nowTime)
  const tonightEvent =
    upcoming.find((i) => ['nightlife', 'food', 'activity', 'activities'].includes(i.category)) ||
    upcoming[upcoming.length - 1] ||
    todayItems[todayItems.length - 1]

  const tomorrowFirst = [...itinerary]
    .filter((i) => i.day_date === tomorrow)
    .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''))[0]

  return (
    <div className="flex h-full flex-col border-r border-[#30363D]">
      {/* Tonight header */}
      <div className="shrink-0 border-b border-[#30363D] bg-[#0d1117] px-6 py-3">
        <div className="text-[10px] font-black uppercase tracking-[0.35em] text-[#4B5563]">Tonight's Mission</div>
        <div className="text-2xl font-black uppercase tracking-[0.08em] text-[#F0F6FC]">Primary Objective</div>
      </div>

      {/* Tonight's event — big card */}
      <div className="shrink-0 border-b border-[#30363D] p-6">
        {tonightEvent ? (
          <>
            <div
              className="text-[10px] font-black uppercase tracking-[0.3em]"
              style={{ color: CATEGORY_COLOR[tonightEvent.category] || '#8B949E' }}
            >
              {tonightEvent.category}
            </div>
            <div className="mt-2 text-3xl font-black leading-tight text-[#F0F6FC]">
              {tonightEvent.title}
            </div>
            {tonightEvent.location_name && (
              <div className="mt-1.5 text-base text-[#8B949E]">{tonightEvent.location_name}</div>
            )}
            {tonightEvent.start_time && (
              <div className="mt-3 font-mono text-6xl font-black leading-none" style={{ color: CATEGORY_COLOR[tonightEvent.category] || '#58A6FF' }}>
                {tonightEvent.start_time.slice(0, 5)}
              </div>
            )}
            {tonightEvent.notes && (
              <div className="mt-2 text-sm italic text-[#4B5563]">{tonightEvent.notes}</div>
            )}
          </>
        ) : (
          <div className="text-lg text-[#4B5563]">No events scheduled for today</div>
        )}
      </div>

      {/* Tomorrow header */}
      <div className="shrink-0 border-b border-[#30363D] bg-[#0d1117] px-6 py-2.5">
        <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#4B5563]">Tomorrow — First Move</div>
      </div>

      {/* Tomorrow's first event */}
      <div className="shrink-0 border-b border-[#30363D] px-6 py-4">
        {tomorrowFirst ? (
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-xl font-black text-[#C9D1D9]">{tomorrowFirst.title}</div>
              {tomorrowFirst.location_name && (
                <div className="text-sm text-[#8B949E]">{tomorrowFirst.location_name}</div>
              )}
            </div>
            {tomorrowFirst.start_time && (
              <div className="shrink-0 font-mono text-2xl font-black text-[#8B949E]">
                {tomorrowFirst.start_time.slice(0, 5)}
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-[#4B5563]">Nothing logged yet</div>
        )}
      </div>

      {/* Weather */}
      <div className="shrink-0 border-b border-[#30363D] bg-[#0d1117] px-6 py-2.5">
        <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#4B5563]">Scottsdale Conditions</div>
      </div>
      <div className="flex-1 p-6">
        {weather ? (
          <>
            <div className="flex items-end gap-5">
              <div className="font-mono text-8xl font-black leading-none text-[#F0F6FC]">
                {Math.round(weather.temp)}°
              </div>
              <div className="mb-2">
                <div className="text-xl font-bold text-[#C9D1D9]">{weather.desc}</div>
                <div className="text-sm text-[#8B949E]">{Math.round(weather.wind)} mph wind</div>
              </div>
            </div>
            {weather.temp >= 95 && (
              <div className="mt-4 rounded border border-[#F85149]/50 bg-[#F85149]/10 px-4 py-2.5">
                <div className="text-sm font-black uppercase tracking-wider text-[#F85149]">
                  ⚠ Extreme Heat Alert — Hydrate. Limit midday exposure.
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-sm text-[#4B5563]">Fetching conditions…</div>
        )}
      </div>
    </div>
  )
}

// ─── STATS PANEL ─────────────────────────────────────────────────────────────

function StatsPanel({ arrivals, itinerary }) {
  const today = todayStr()
  const nowTime = nowTimeStr()

  const onSite     = arrivals.filter((a) => a.status === 'Arrived').length
  const inTransit  = arrivals.filter((a) => ['En Route', 'Landed'].includes(a.status)).length
  const tbd        = arrivals.filter((a) => a.status === 'TBD').length
  const confirmed  = arrivals.filter((a) => a.status === 'Confirmed').length
  const needsRide  = arrivals.filter((a) => a.pickup_needed && a.status !== 'Arrived')

  // Countdown to next event today
  const nextEvent = [...itinerary]
    .filter((i) => i.day_date === today && i.start_time && i.start_time > nowTime)
    .sort((a, b) => a.start_time.localeCompare(b.start_time))[0]

  let countdownLabel = null
  let countdownTime = null
  if (nextEvent?.start_time) {
    const [h, m] = nextEvent.start_time.split(':').map(Number)
    const target = new Date()
    target.setHours(h, m, 0, 0)
    const diff = target - new Date()
    if (diff > 0) {
      const hrs = Math.floor(diff / 3600000)
      const mins = Math.floor((diff % 3600000) / 60000)
      const secs = Math.floor((diff % 60000) / 1000)
      countdownLabel = nextEvent.title
      countdownTime = hrs > 0 ? `${hrs}h ${pad(mins)}m` : `${mins}m ${pad(secs)}s`
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Section header */}
      <div className="shrink-0 border-b border-[#30363D] bg-[#0d1117] px-6 py-3">
        <div className="text-[10px] font-black uppercase tracking-[0.35em] text-[#4B5563]">Live Stats</div>
        <div className="text-2xl font-black uppercase tracking-[0.08em] text-[#F0F6FC]">Headcount</div>
      </div>

      {/* Status 2×2 grid */}
      <div className="shrink-0 grid grid-cols-2 gap-px bg-[#21262d]">
        {[
          { label: 'On Site',    value: onSite,    color: '#3FB950' },
          { label: 'In Transit', value: inTransit, color: '#D29922' },
          { label: 'TBD',        value: tbd,        color: '#4B5563' },
          { label: 'Confirmed',  value: confirmed,  color: '#58A6FF' },
        ].map(({ label, value, color }) => (
          <div key={label} className="flex flex-col items-center justify-center bg-[#0d1117] py-5">
            <div className="font-mono text-5xl font-black" style={{ color }}>{value}</div>
            <div className="mt-1 text-[9px] font-black uppercase tracking-widest text-[#4B5563]">{label}</div>
          </div>
        ))}
      </div>

      {/* Ride needed */}
      <div className="shrink-0 border-t border-[#30363D] bg-[#0d1117] px-6 py-2.5">
        <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#F85149]">
          Needs a Ride {needsRide.length > 0 ? `(${needsRide.length})` : ''}
        </div>
      </div>
      <div className="shrink-0 border-b border-[#30363D] px-6 py-4 min-h-[80px]">
        {needsRide.length === 0 ? (
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-[#3FB950]" />
            <span className="text-base font-semibold text-[#3FB950]">All rides covered</span>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {needsRide.map((a) => (
              <div key={a.id} className="flex items-center justify-between">
                <div className="text-lg font-black text-[#F0F6FC]">{a.name}</div>
                <div className="font-mono text-base font-semibold text-[#D29922]">
                  {a.arrival_time ? a.arrival_time.slice(0, 5) : 'TBD'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Countdown to next event */}
      <div className="shrink-0 border-b border-[#30363D] bg-[#0d1117] px-6 py-2.5">
        <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#4B5563]">Next Up Today</div>
      </div>
      <div className="flex-1 flex flex-col justify-center px-6 py-4">
        {countdownLabel ? (
          <>
            <div className="text-sm font-semibold uppercase tracking-wider text-[#8B949E] truncate">
              {countdownLabel}
            </div>
            <div className="mt-2 font-mono text-5xl font-black text-[#A371F7]">
              {countdownTime}
            </div>
            <div className="mt-1 text-[10px] uppercase tracking-widest text-[#4B5563]">Away</div>
          </>
        ) : (
          <div className="text-sm text-[#4B5563]">No more events today</div>
        )}
      </div>
    </div>
  )
}

// ─── BOTTOM TICKER ───────────────────────────────────────────────────────────

function BottomTicker() {
  const text = TICKER_ITEMS.join('     ·     ')
  // Duplicate for seamless loop
  const full = `${text}     ·     ${text}`
  return (
    <div className="shrink-0 flex items-center border-t-2 border-[#58A6FF]/30 bg-[#080a0d]" style={{ height: '48px' }}>
      <div className="shrink-0 flex h-full items-center bg-[#58A6FF] px-5">
        <span className="text-[10px] font-black uppercase tracking-[0.35em] text-[#080a0d] whitespace-nowrap">
          Ops Feed
        </span>
      </div>
      <div className="flex-1 overflow-hidden">
        <div
          className="whitespace-nowrap font-mono text-sm font-semibold uppercase tracking-widest text-[#8B949E]"
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
        className="h-1.5 w-1.5 rounded-full bg-[#3FB950]"
        style={{ animation: 'pulse-dot 2s ease-in-out infinite' }}
      />
      <span className="font-mono text-[9px] text-[#21262d]">
        {lastUpdated < 60 ? `${lastUpdated}s ago` : `${Math.floor(lastUpdated / 60)}m ago`}
      </span>
    </div>
  )
}

// ─── COMMAND CENTER ──────────────────────────────────────────────────────────

export default function CommandCenter() {
  const { rows: arrivals }  = useSupabaseTable('arrivals', { orderBy: 'arrival_time', ascending: true })
  const { rows: itinerary } = useSupabaseTable('itinerary_items', { orderBy: 'start_time' })

  const [clock, setClock]       = useState(formatClock(new Date()))
  const [cdText, setCdText]     = useState(weddingCountdown())
  const [weather, setWeather]   = useState(null)
  const [lastUpdated, setLastUpdated] = useState(0)
  const [tick, setTick]         = useState(0) // forces StatsPanel re-render for live countdown

  // 1-second clock + countdown
  useEffect(() => {
    const t = setInterval(() => {
      setClock(formatClock(new Date()))
      setCdText(weddingCountdown())
      setLastUpdated((s) => s + 1)
      setTick((n) => n + 1)
    }, 1000)
    return () => clearInterval(t)
  }, [])

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

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-[#0a0c10] text-[#C9D1D9]">
      <TopBar clock={clock} cdText={cdText} />

      <div className="flex min-h-0 flex-1">
        {/* Left 40% — Arrivals */}
        <div className="w-[40%] overflow-hidden">
          <ArrivalsBoard arrivals={arrivals} />
        </div>

        {/* Center 35% — Mission */}
        <div className="w-[35%] overflow-hidden">
          <MissionCenter itinerary={itinerary} weather={weather} />
        </div>

        {/* Right 25% — Stats */}
        <div className="w-[25%] overflow-hidden">
          {/* key={tick} forces countdown seconds to re-render every second */}
          <StatsPanel key={tick} arrivals={arrivals} itinerary={itinerary} />
        </div>
      </div>

      <BottomTicker />
      <LiveIndicator lastUpdated={lastUpdated} />
    </div>
  )
}
