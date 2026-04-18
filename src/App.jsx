import { useMemo, useState } from 'react'
import {
  BriefcaseBusiness,
  ClipboardList,
  Map,
  Plane,
  ScrollText,
  UtensilsCrossed,
} from 'lucide-react'
import ArrivalsPanel from './panels/ArrivalsPanel'
import DailyBriefingPanel from './panels/DailyBriefingPanel'
import FlightMapPanel from './panels/FlightMapPanel'
import ItineraryPanel from './panels/ItineraryPanel'
import LogisticsPanel from './panels/LogisticsPanel'
import MealsPanel from './panels/MealsPanel'

const NAV_ITEMS = [
  { id: 'briefing', label: 'Daily Briefing', icon: ScrollText },
  { id: 'itinerary', label: 'Itinerary', icon: BriefcaseBusiness },
  { id: 'arrivals', label: 'Arrivals', icon: Plane },
  { id: 'map', label: 'Ops Map', icon: Map },
  { id: 'meals', label: 'Meals', icon: UtensilsCrossed },
  { id: 'logistics', label: 'Logistics', icon: ClipboardList },
]

function ShellNav({ selectedPage, onSelectPage }) {
  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-[#30363D] bg-[#0d1117] md:w-72 md:border-b-0 md:border-r">
      <div className="border-b border-[#30363D] px-5 py-5">
        <div className="text-[10px] font-black uppercase tracking-[0.24em] text-[#58A6FF]">
          Phoenix Bachelor Command
        </div>
        <div className="mt-2 text-xl font-black uppercase tracking-[0.08em] text-[#F0F6FC]">
          Scottsdale Ops
        </div>
        <div className="mt-2 text-[11px] leading-relaxed text-[#8B949E]">
          May 28 to May 31. One house, one roster, one clean command surface.
        </div>
      </div>

      <nav className="grid grid-cols-2 gap-2 p-3 md:grid-cols-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const active = item.id === selectedPage

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectPage(item.id)}
              className={`flex items-center gap-3 border px-3 py-3 text-left text-[11px] font-black uppercase tracking-[0.16em] transition-colors ${
                active
                  ? 'border-[#58A6FF] bg-[#58A6FF]/10 text-[#58A6FF]'
                  : 'border-[#30363D] bg-[#161b22] text-[#8B949E] hover:border-[#58A6FF]/40 hover:text-[#C9D1D9]'
              }`}
            >
              <Icon size={15} />
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>
    </aside>
  )
}

function AppHeader({ selectedPage }) {
  const current = useMemo(
    () => NAV_ITEMS.find((item) => item.id === selectedPage) || NAV_ITEMS[0],
    [selectedPage],
  )

  return (
    <header className="flex items-center justify-between border-b border-[#30363D] bg-[#11161d] px-6 py-4">
      <div>
        <div className="text-[10px] font-black uppercase tracking-[0.22em] text-[#8B949E]">
          Phoenix Command Center
        </div>
        <div className="mt-1 text-lg font-black uppercase tracking-[0.08em] text-[#F0F6FC]">
          {current.label}
        </div>
      </div>
      <div className="text-right">
        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#58A6FF]">
          Theater
        </div>
        <div className="mt-1 text-sm font-semibold text-[#C9D1D9]">
          Scottsdale / Phoenix Metro
        </div>
      </div>
    </header>
  )
}

export default function App() {
  const [selectedPage, setSelectedPage] = useState('briefing')

  let content = <DailyBriefingPanel />
  if (selectedPage === 'itinerary') content = <ItineraryPanel />
  if (selectedPage === 'arrivals') content = <ArrivalsPanel />
  if (selectedPage === 'map') content = <FlightMapPanel />
  if (selectedPage === 'meals') content = <MealsPanel />
  if (selectedPage === 'logistics') content = <LogisticsPanel />

  return (
    <div className="flex min-h-screen bg-[#0b0f14] text-[#C9D1D9] md:h-screen md:min-h-0">
      <ShellNav selectedPage={selectedPage} onSelectPage={setSelectedPage} />
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <AppHeader selectedPage={selectedPage} />
        <div className="flex min-h-0 flex-1 overflow-hidden">{content}</div>
      </main>
    </div>
  )
}
