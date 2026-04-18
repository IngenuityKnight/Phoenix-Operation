import { useMemo, useState } from 'react'
import { AlertTriangle, ClipboardList, MapPin, Plane, ShieldAlert, UtensilsCrossed } from 'lucide-react'
import { useSupabaseTable } from '../hooks/useSupabaseTable'

const DAYS = [
  {
    date: '2026-05-28',
    label: 'Wed 5/28',
    title: 'Touchdown + House Activation',
    mission: 'Absorb arrivals cleanly, get bags dropped, and establish the command house without burning the group on night one.',
    priorities: [
      'Confirm every inbound ETA and close the pickup queue before sunset.',
      'Get the house stocked, rooms claimed, and the first dinner decision locked.',
      'Keep the first-night plan simple enough that late arrivals can still fold in.',
    ],
    watchItems: [
      'Airport pickup overlap',
      'Delayed flights into PHX',
      'House access and early grocery gaps',
    ],
  },
  {
    date: '2026-05-29',
    label: 'Thu 5/29',
    title: 'Pool Day + Momentum Build',
    mission: 'Run a low-friction daytime operation that keeps the group together and leaves enough energy for the evening.',
    priorities: [
      'Lock pool, food, and drink supply coverage before noon.',
      'Keep transport plans obvious if the group splits before dinner.',
      'Use the afternoon to confirm Friday golf and nightlife commitments.',
    ],
    watchItems: [
      'Heat management',
      'Ice and drink restocks',
      'Fragmented transport back to the house',
    ],
  },
  {
    date: '2026-05-30',
    label: 'Fri 5/30',
    title: 'Golf + Old Town Push',
    mission: 'Execute the highest-complexity day with clean tee-time timing, no transport confusion, and enough margin for the night move.',
    priorities: [
      'Get the morning golf crew out on time with pairings, rides, and payment settled.',
      'Protect the reset window between day activity and Old Town.',
      'Keep dinner, table plans, and venue order fixed before the nightlife migration starts.',
    ],
    watchItems: [
      'Late wakeups',
      'Ride-share surge pricing',
      'Split groups losing the main plan',
    ],
  },
  {
    date: '2026-05-31',
    label: 'Sat 5/31',
    title: 'Checkout + Final Wave',
    mission: 'Run a controlled exfil: bags packed, house cleared, tabs closed, and every outbound traveler pointed at the right airport plan.',
    priorities: [
      'Stage checkout labor early so it does not collide with departures.',
      'Make airport runs and rideshare windows explicit.',
      'Close open meal, supply, and reimbursement loose ends before wheels-up.',
    ],
    watchItems: [
      'House reset bottlenecks',
      'Missed departures',
      'Unclaimed shared expenses',
    ],
  },
]

function StatCard({ icon: Icon, label, value, tone = 'blue' }) {
  const tones = {
    blue: 'border-[#58A6FF]/30 bg-[#58A6FF]/10 text-[#58A6FF]',
    green: 'border-[#3FB950]/30 bg-[#3FB950]/10 text-[#3FB950]',
    amber: 'border-[#D29922]/30 bg-[#D29922]/10 text-[#D29922]',
    red: 'border-[#F85149]/30 bg-[#F85149]/10 text-[#F85149]',
  }

  return (
    <div className="border border-[#30363D] bg-[#11161d] p-4">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center border ${tones[tone] || tones.blue}`}>
          <Icon size={16} />
        </div>
        <div>
          <div className="text-[9px] font-black uppercase tracking-[0.18em] text-[#8B949E]">{label}</div>
          <div className="mt-1 text-2xl font-black text-[#F0F6FC]">{value}</div>
        </div>
      </div>
    </div>
  )
}

function PanelSection({ eyebrow, title, children }) {
  return (
    <section className="border border-[#30363D] bg-[#11161d]">
      <div className="border-b border-[#30363D] px-5 py-4">
        <div className="text-[9px] font-black uppercase tracking-[0.2em] text-[#58A6FF]">{eyebrow}</div>
        <div className="mt-1 text-[15px] font-black uppercase tracking-[0.08em] text-[#F0F6FC]">{title}</div>
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
  const [selectedDate, setSelectedDate] = useState(DAYS[0].date)

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
    <div className="flex min-h-0 flex-1 flex-col overflow-auto bg-[#0b0f14]">
      <div className="border-b border-[#30363D] px-6 py-5">
        <div className="text-[10px] font-black uppercase tracking-[0.22em] text-[#58A6FF]">
          Daily Briefing
        </div>
        <div className="mt-2 text-2xl font-black uppercase tracking-[0.08em] text-[#F0F6FC]">
          Bachelor Party Situation Report
        </div>
        <div className="mt-2 max-w-3xl text-[12px] leading-relaxed text-[#8B949E]">
          Use this page as the command layer before the group moves. It summarizes the day objective, live risks,
          and the operational load already recorded in arrivals, itinerary, meals, and logistics.
        </div>
      </div>

      <div className="grid gap-4 px-6 py-6 lg:grid-cols-4">
        <StatCard icon={Plane} label="Tracked Arrivals" value={arrivals.length} />
        <StatCard icon={ShieldAlert} label="Need Pickup" value={pendingPickups} tone="amber" />
        <StatCard icon={ClipboardList} label="Open Tasks" value={openTasks} tone="red" />
        <StatCard icon={UtensilsCrossed} label="Arrived On Site" value={arrivedCount} tone="green" />
      </div>

      <div className="px-6">
        <div className="flex flex-wrap gap-2">
          {DAYS.map((day) => {
            const active = day.date === briefingDay.date
            return (
              <button
                key={day.date}
                type="button"
                onClick={() => setSelectedDate(day.date)}
                className={`border px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] transition-colors ${
                  active
                    ? 'border-[#58A6FF] bg-[#58A6FF]/10 text-[#58A6FF]'
                    : 'border-[#30363D] bg-[#11161d] text-[#8B949E] hover:border-[#58A6FF]/40 hover:text-[#C9D1D9]'
                }`}
              >
                {day.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid gap-6 px-6 py-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="space-y-6">
          <PanelSection eyebrow={briefingDay.label} title={briefingDay.title}>
            <div className="text-[13px] leading-7 text-[#C9D1D9]">{briefingDay.mission}</div>
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <div>
                <div className="text-[9px] font-black uppercase tracking-[0.18em] text-[#8B949E]">Priority Moves</div>
                <div className="mt-3 space-y-3">
                  {briefingDay.priorities.map((item) => (
                    <div key={item} className="border border-[#30363D] bg-[#0d1117] px-4 py-3 text-[11px] leading-relaxed text-[#C9D1D9]">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[9px] font-black uppercase tracking-[0.18em] text-[#8B949E]">Watch Items</div>
                <div className="mt-3 space-y-3">
                  {briefingDay.watchItems.map((item) => (
                    <div key={item} className="flex items-center gap-3 border border-[#F85149]/20 bg-[#F85149]/10 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#FF7B72]">
                      <AlertTriangle size={14} />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </PanelSection>

          <PanelSection eyebrow="Mission Load" title="Itinerary Stack">
            {dayItinerary.length ? (
              <div className="space-y-3">
                {dayItinerary.map((item) => (
                  <div key={item.id} className="border border-[#30363D] bg-[#0d1117] px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-[12px] font-bold text-[#F0F6FC]">{item.title}</div>
                      <div className="font-mono text-[11px] text-[#58A6FF]">
                        {item.start_time ? item.start_time.slice(0, 5) : 'TBD'}
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-3 text-[10px] uppercase tracking-[0.12em] text-[#8B949E]">
                      <span>{item.category || 'other'}</span>
                      {item.location_name ? (
                        <span className="inline-flex items-center gap-1">
                          <MapPin size={11} />
                          {item.location_name}
                        </span>
                      ) : null}
                    </div>
                    {item.notes ? <div className="mt-2 text-[11px] leading-relaxed text-[#8B949E]">{item.notes}</div> : null}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[11px] text-[#8B949E]">No itinerary items are scheduled for this day yet.</div>
            )}
          </PanelSection>
        </div>

        <div className="space-y-6">
          <PanelSection eyebrow="Support" title="Arrival Control">
            {dayArrivals.length ? (
              <div className="space-y-3">
                {dayArrivals.map((arrival) => (
                  <div key={arrival.id} className="border border-[#30363D] bg-[#0d1117] px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-[12px] font-bold text-[#F0F6FC]">{arrival.name}</div>
                      <div className="text-[10px] font-black uppercase tracking-[0.12em] text-[#58A6FF]">{arrival.status}</div>
                    </div>
                    <div className="mt-2 text-[11px] text-[#8B949E]">
                      {(arrival.origin_airport || 'TBD').toUpperCase()} {arrival.flight_number ? `· ${arrival.flight_number}` : ''}
                    </div>
                    <div className="mt-1 text-[11px] text-[#8B949E]">
                      {arrival.arrival_time ? arrival.arrival_time.slice(0, 5) : 'Time TBD'}
                      {arrival.pickup_needed ? ' · Pickup required' : ' · Self-transport'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[11px] text-[#8B949E]">No arrivals logged for this day.</div>
            )}
          </PanelSection>

          <PanelSection eyebrow="Food" title="Meal Coverage">
            {dayMeals.length ? (
              <div className="space-y-3">
                {dayMeals.map((meal) => (
                  <div key={meal.id} className="border border-[#30363D] bg-[#0d1117] px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-[12px] font-bold text-[#F0F6FC]">{meal.name || `${meal.meal_type} pending`}</div>
                      <div className="text-[10px] font-black uppercase tracking-[0.12em] text-[#D29922]">
                        {meal.plan_type || 'TBD'}
                      </div>
                    </div>
                    <div className="mt-2 text-[11px] text-[#8B949E]">
                      {meal.meal_type} {meal.headcount ? `· ${meal.headcount} pax` : ''}
                      {meal.organizer ? ` · ${meal.organizer}` : ''}
                    </div>
                    {meal.location_name ? <div className="mt-1 text-[11px] text-[#8B949E]">{meal.location_name}</div> : null}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[11px] text-[#8B949E]">No meals planned for this day yet.</div>
            )}
          </PanelSection>
        </div>
      </div>
    </div>
  )
}
