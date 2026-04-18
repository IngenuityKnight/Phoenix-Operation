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
      <div className="border-b border-[#30363D] px-4 py-4 md:px-5 md:py-5">
        <div className="text-[10px] font-black uppercase tracking-[0.24em] text-[#58A6FF]">
          Phoenix Bachelor Command
        </div>
        <div className="mt-1 text-lg font-black uppercase tracking-[0.08em] text-[#F0F6FC] md:mt-2 md:text-xl">
          Scottsdale Ops
        </div>
        <div className="mt-1 hidden text-[11px] leading-relaxed text-[#8B949E] md:mt-2 md:block">
          May 28 to May 31. One house, one roster, one clean command surface.
        </div>
      </div>

      <nav className="grid grid-cols-3 gap-1.5 p-2 md:grid-cols-1 md:gap-2 md:p-3">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const active = item.id === selectedPage

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectPage(item.id)}
              className={`flex items-center justify-center gap-2 border px-2 py-3 text-center text-[10px] font-black uppercase tracking-[0.12em] transition-colors md:justify-start md:px-3 md:py-3 md:text-[11px] md:tracking-[0.16em] ${
                active
                  ? 'border-[#58A6FF] bg-[#58A6FF]/10 text-[#58A6FF]'
                  : 'border-[#30363D] bg-[#161b22] text-[#8B949E] hover:border-[#58A6FF]/40 hover:text-[#C9D1D9]'
              }`}
            >
              <Icon size={16} />
              <span className="leading-tight">{item.label}</span>
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
    <header className="hidden items-center justify-between border-b border-[#30363D] bg-[#11161d] px-6 py-4 md:flex">
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
    <div className="flex flex-col bg-[#0b0f14] text-[#C9D1D9] md:h-screen md:flex-row">
      <ShellNav selectedPage={selectedPage} onSelectPage={setSelectedPage} />
      <main className="flex flex-1 flex-col md:min-h-0 md:overflow-hidden">
        <AppHeader selectedPage={selectedPage} />
        <div className="flex flex-1 md:min-h-0 md:overflow-hidden">{content}</div>
      </main>
    </div>
  )
}
