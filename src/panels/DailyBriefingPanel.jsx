import { useMemo, useState } from 'react'
import { AlertTriangle, ClipboardList, Copy, MapPin, Plane, ShieldAlert, UtensilsCrossed } from 'lucide-react'
import { useSupabaseTable } from '../hooks/useSupabaseTable'

// Keys to surface in the House Intel bar (matched against house_info.key)
const HOUSE_INTEL_KEYS = ['Airbnb Address', 'Front Door Code', 'WiFi Network', 'WiFi Password', 'Check-in Time', 'Check-out Time']

function HouseIntelBar({ items }) {
  const [copied, setCopied] = useState(null)

  function copy(key, value) {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(key)
      setTimeout(() => setCopied(null), 1500)
    })
  }

  const pinned = HOUSE_INTEL_KEYS
    .map((k) => items.find((i) => i.key === k))
    .filter(Boolean)

  if (pinned.length === 0) return null

  return (
    <div className="border-b border-[#3C1810] bg-[#140a06] px-4 py-3 md:px-6">
      <div className="mb-2 text-[9px] font-black uppercase tracking-[0.2em] text-[#5C3820]">House Intel</div>
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        {pinned.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => copy(item.key, item.value)}
            className="flex items-center gap-1.5 text-left group"
          >
            <span className="text-[10px] text-[#9A8070]">{item.key}:</span>
            <span className="font-mono text-[10px] font-semibold text-[#F2E4D0]">{item.value}</span>
            <Copy size={10} className={`shrink-0 transition-colors ${copied === item.key ? 'text-[#48B040]' : 'text-[#5C3820] group-hover:text-[#9A8070]'}`} />
          </button>
        ))}
      </div>
    </div>
  )
}

const DAYS = [
  {
    date: '2026-05-28',
    label: 'Thu 5/28',
    title: 'Arrivals + Night Out in Old Town',
    mission: 'Boys land in Scottsdale, Bertha ubers to the Airbnb, everyone pregames at the house, then Old Town hits first — Dierks Bentley, Boondocks, Wasted Grain.',
    priorities: [
      'Confirm all inbound ETAs and close the airport pickup queue before sunset.',
      'Bertha is making drinks — house stocked and pregame locked before 8pm.',
      'Keep the Old Town plan simple enough that late arrivals can still fold in.',
    ],
    watchItems: [
      'Airport pickup overlap',
      'Delayed flights into PHX',
      'TP getting cross-faded before 11pm',
    ],
  },
  {
    date: '2026-05-29',
    label: 'Fri 5/29',
    title: 'Golf · Cien Agave · Talking Stick Casino',
    mission: 'Morning workout and breakfast at the house, pool and chill (Bertha lathers Noah in sunscreen), then Top Golf, dinner at Cien Agave, and the Talking Stick Casino run.',
    priorities: [
      'Get the morning golf crew out on time — no sleeping in.',
      'Dinner reservation at Cien Agave confirmed — do not hit on the waitress.',
      'Casino: Noah and Scotty run the blackjack table and come out 10k up.',
    ],
    watchItems: [
      'Late wakeups on golf day',
      'Jack hitting on waitstaff',
      'Ride-share surge pricing after casino',
    ],
  },
  {
    date: '2026-05-30',
    label: 'Sat 5/30',
    title: 'Breweries · Uptown Phoenix · Final Night',
    mission: 'Bertha serves bacon, eggs, and freak juice to start. Afternoon brewery crawl through Old Town, then dinner and night out in Uptown Phoenix before the weekend closes.',
    priorities: [
      'Brewery route confirmed: Gold Water Brewing → Craft 64 → One Handsome Bastard Distillery.',
      'Colonary Dropout and The Bar for the final night push.',
      'Checkout Sunday — pack before you party tonight.',
    ],
    watchItems: [
      'Shaun and his supplements after 10pm',
      'House checkout in the morning',
      'Unclaimed shared expenses',
    ],
  },
]

function StatCard({ icon: Icon, label, value, tone = 'red' }) {
  const tones = {
    red:   'border-[#BA1323]/30 bg-[#BA1323]/10 text-[#BA1323]',
    green: 'border-[#48B040]/30 bg-[#48B040]/10 text-[#48B040]',
    amber: 'border-[#C4952A]/30 bg-[#C4952A]/10 text-[#C4952A]',
    warn:  'border-[#E83025]/30 bg-[#E83025]/10 text-[#E83025]',
  }

  return (
    <div className="border border-[#3C1810] bg-[#180C07] p-4">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center border ${tones[tone] || tones.red}`}>
          <Icon size={16} />
        </div>
        <div>
          <div className="text-[9px] font-black uppercase tracking-[0.18em] text-[#9A8070]">{label}</div>
          <div className="mt-1 text-2xl font-black text-[#FAF0E8]">{value}</div>
        </div>
      </div>
    </div>
  )
}

function PanelSection({ eyebrow, title, children }) {
  return (
    <section className="border border-[#3C1810] bg-[#180C07]">
      <div className="border-b border-[#3C1810] px-5 py-4">
        <div className="text-[9px] font-black uppercase tracking-[0.2em] text-[#BA1323]">{eyebrow}</div>
        <div className="mt-1 text-[15px] font-black uppercase tracking-[0.08em] text-[#FAF0E8]">{title}</div>
      </div>
      <div className="p-5">{children}</div>
    </section>
  )
}

export default function DailyBriefingPanel() {
  const { rows: arrivals } = useSupabaseTable('arrivals', { orderBy: 'arrival_date', ascending: true })
  const { rows: itinerary } = useSupabaseTable('itinerary_items', { orderBy: 'start_time' })
  const { rows: meals } = useSupabaseTable('meals', { orderBy: 'day_date' })
  const { rows: logistics } = useSupabaseTable('logistics', { orderBy: 'created_at' })
  const { rows: houseInfo } = useSupabaseTable('house_info', { orderBy: 'category' })
  const todayStr = new Date().toLocaleDateString('en-CA')
  const defaultDate = DAYS.find((d) => d.date === todayStr)?.date ?? DAYS[0].date
  const [selectedDate, setSelectedDate] = useState(defaultDate)

  const briefingDay = useMemo(
    () => DAYS.find((day) => day.date === selectedDate) || DAYS[0],
    [selectedDate],
  )

  const dayItinerary = useMemo(
    () => itinerary.filter((item) => item.day_date === briefingDay.date),
    [briefingDay.date, itinerary],
  )
  const dayMeals = useMemo(
    () => meals.filter((item) => item.day_date === briefingDay.date),
    [briefingDay.date, meals],
  )
  const dayArrivals = useMemo(
    () => arrivals.filter((item) => item.arrival_date === briefingDay.date),
    [arrivals, briefingDay.date],
  )

  const pendingPickups = arrivals.filter((item) => item.pickup_needed && item.status !== 'Arrived').length
  const arrivedCount = arrivals.filter((item) => item.status === 'Arrived').length
  const openTasks = logistics.filter((item) => !item.done).length

  return (
    <div className="flex flex-col bg-[#100805] md:min-h-0 md:flex-1 md:overflow-auto">
      <HouseIntelBar items={houseInfo} />
      <div className="border-b border-[#3C1810] px-6 py-5">
        <div className="text-[10px] font-black uppercase tracking-[0.22em] text-[#BA1323]">
          Today
        </div>
        <div className="mt-2 text-2xl font-black uppercase tracking-[0.08em] text-[#FAF0E8]">
          Freakman's Bachelor Party — Situation Report
        </div>
        <div className="mt-2 max-w-3xl text-[12px] leading-relaxed text-[#9A8070]">
          All weekend we'll be indulged in delicious Freakman Cuisine, Freakman Entertainment, and Unforgettable Freakman Moments.
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 px-4 py-4 md:px-6 md:py-6 lg:grid-cols-4">
        <StatCard icon={Plane} label="Tracked Arrivals" value={arrivals.length} />
        <StatCard icon={ShieldAlert} label="Need Pickup" value={pendingPickups} tone="amber" />
        <StatCard icon={ClipboardList} label="Open Tasks" value={openTasks} tone="warn" />
        <StatCard icon={UtensilsCrossed} label="Arrived On Site" value={arrivedCount} tone="green" />
      </div>

      <div className="px-4 md:px-6">
        <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
          {DAYS.map((day) => {
            const active = day.date === briefingDay.date
            return (
              <button
                key={day.date}
                type="button"
                onClick={() => setSelectedDate(day.date)}
                className={`border px-3 py-3 text-[10px] font-black uppercase tracking-[0.18em] transition-colors sm:px-4 sm:py-2 ${
                  active
                    ? 'border-[#BA1323] bg-[#BA1323]/10 text-[#BA1323]'
                    : 'border-[#3C1810] bg-[#180C07] text-[#9A8070] hover:border-[#BA1323]/40 hover:text-[#F2E4D0]'
                }`}
              >
                {day.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid gap-6 px-4 py-6 md:px-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="space-y-6">
          <PanelSection eyebrow={briefingDay.label} title={briefingDay.title}>
            <div className="text-[13px] leading-7 text-[#F2E4D0]">{briefingDay.mission}</div>
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <div>
                <div className="text-[9px] font-black uppercase tracking-[0.18em] text-[#9A8070]">Priority Moves</div>
                <div className="mt-3 space-y-3">
                  {briefingDay.priorities.map((item) => (
                    <div key={item} className="border border-[#3C1810] bg-[#140a06] px-4 py-3 text-[11px] leading-relaxed text-[#F2E4D0]">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[9px] font-black uppercase tracking-[0.18em] text-[#9A8070]">Watch Items</div>
                <div className="mt-3 space-y-3">
                  {briefingDay.watchItems.map((item) => (
                    <div key={item} className="flex items-center gap-3 border border-[#E83025]/20 bg-[#E83025]/10 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#F07060]">
                      <AlertTriangle size={14} />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </PanelSection>

          <PanelSection eyebrow="Schedule" title="Itinerary Stack">
            {dayItinerary.length ? (
              <div className="space-y-3">
                {dayItinerary.map((item) => (
                  <div key={item.id} className="border border-[#3C1810] bg-[#140a06] px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-[12px] font-bold text-[#FAF0E8]">{item.title}</div>
                      <div className="font-mono text-[11px] text-[#BA1323]">
                        {item.start_time ? item.start_time.slice(0, 5) : 'TBD'}
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-3 text-[10px] uppercase tracking-[0.12em] text-[#9A8070]">
                      <span>{item.category || 'other'}</span>
                      {item.location_name ? (
                        <span className="inline-flex items-center gap-1">
                          <MapPin size={11} />
                          {item.location_name}
                        </span>
                      ) : null}
                    </div>
                    {item.notes ? <div className="mt-2 text-[11px] leading-relaxed text-[#9A8070]">{item.notes}</div> : null}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[11px] text-[#9A8070]">No itinerary items are scheduled for this day yet.</div>
            )}
          </PanelSection>
        </div>

        <div className="space-y-6">
          <PanelSection eyebrow="Support" title="Arrival Control">
            {dayArrivals.length ? (
              <div className="space-y-3">
                {dayArrivals.map((arrival) => (
                  <div key={arrival.id} className="border border-[#3C1810] bg-[#140a06] px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-[12px] font-bold text-[#FAF0E8]">{arrival.name}</div>
                      <div className="text-[10px] font-black uppercase tracking-[0.12em] text-[#BA1323]">{arrival.status}</div>
                    </div>
                    <div className="mt-2 text-[11px] text-[#9A8070]">
                      {(arrival.origin_airport || 'TBD').toUpperCase()} {arrival.flight_number ? `· ${arrival.flight_number}` : ''}
                    </div>
                    <div className="mt-1 text-[11px] text-[#9A8070]">
                      {arrival.arrival_time ? arrival.arrival_time.slice(0, 5) : 'Time TBD'}
                      {arrival.pickup_needed ? ' · Pickup required' : ' · Self-transport'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[11px] text-[#9A8070]">No arrivals logged for this day.</div>
            )}
          </PanelSection>

          <PanelSection eyebrow="Food" title="Meal Coverage">
            {dayMeals.length ? (
              <div className="space-y-3">
                {dayMeals.map((meal) => (
                  <div key={meal.id} className="border border-[#3C1810] bg-[#140a06] px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-[12px] font-bold text-[#FAF0E8]">{meal.name || `${meal.meal_type} pending`}</div>
                      <div className="text-[10px] font-black uppercase tracking-[0.12em] text-[#C4952A]">
                        {meal.plan_type || 'TBD'}
                      </div>
                    </div>
                    <div className="mt-2 text-[11px] text-[#9A8070]">
                      {meal.meal_type} {meal.headcount ? `· ${meal.headcount} pax` : ''}
                      {meal.organizer ? ` · ${meal.organizer}` : ''}
                    </div>
                    {meal.location_name ? <div className="mt-1 text-[11px] text-[#9A8070]">{meal.location_name}</div> : null}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[11px] text-[#9A8070]">No meals planned for this day yet.</div>
            )}
          </PanelSection>
        </div>
      </div>
    </div>
  )
}
