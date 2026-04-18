import { useEffect, useState } from 'react'
import { Cloud, CloudRain, Droplets, Sun, Thermometer, Wind } from 'lucide-react'

// Scottsdale, AZ coordinates
const LAT = 33.4942
const LON = -111.9261

const TRIP_DATES = ['2026-05-28', '2026-05-29', '2026-05-30', '2026-05-31']
const DAY_LABELS = {
  '2026-05-28': { label: 'Wed 5/28', title: 'Arrivals Day' },
  '2026-05-29': { label: 'Thu 5/29', title: 'Pool Day' },
  '2026-05-30': { label: 'Fri 5/30', title: 'Golf / Nightlife' },
  '2026-05-31': { label: 'Sat 5/31', title: 'Last Night' },
}

// WMO weather code to description + icon
function weatherInfo(code) {
  if (code === 0) return { desc: 'Clear sky', icon: 'sun' }
  if (code <= 2) return { desc: 'Partly cloudy', icon: 'cloud' }
  if (code === 3) return { desc: 'Overcast', icon: 'cloud' }
  if (code <= 49) return { desc: 'Fog', icon: 'cloud' }
  if (code <= 57) return { desc: 'Drizzle', icon: 'rain' }
  if (code <= 67) return { desc: 'Rain', icon: 'rain' }
  if (code <= 77) return { desc: 'Snow', icon: 'cloud' }
  if (code <= 82) return { desc: 'Rain showers', icon: 'rain' }
  if (code <= 99) return { desc: 'Thunderstorm', icon: 'rain' }
  return { desc: 'Unknown', icon: 'sun' }
}

function WeatherIcon({ type, size = 28 }) {
  if (type === 'rain') return <CloudRain size={size} strokeWidth={1.5} className="text-[#58A6FF]" />
  if (type === 'cloud') return <Cloud size={size} strokeWidth={1.5} className="text-[#8B949E]" />
  return <Sun size={size} strokeWidth={1.5} className="text-[#D29922]" />
}

function HeatWarning({ high }) {
  if (high < 100) return null
  return (
    <div className="mt-1.5 rounded border border-[#F85149]/30 bg-[#F85149]/10 px-2 py-1 text-[10px] font-bold text-[#F85149]">
      EXTREME HEAT — stay hydrated, limit outdoor exposure midday
    </div>
  )
}

function DayCard({ date, data, selected, onClick }) {
  const { label, title } = DAY_LABELS[date]
  const { desc, icon } = weatherInfo(data.weathercode)

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-2 rounded border p-4 text-center transition-colors ${selected ? 'border-[#58A6FF] bg-[#58A6FF]/10' : 'border-[#21262d] bg-[#0d1117] hover:border-[#30363D]'}`}
    >
      <div className={`text-[10px] font-black uppercase tracking-[0.18em] ${selected ? 'text-[#58A6FF]' : 'text-[#8B949E]'}`}>{label}</div>
      <WeatherIcon type={icon} size={24} />
      <div>
        <div className="font-mono text-lg font-black text-[#C9D1D9]">{Math.round(data.temperature_2m_max)}°</div>
        <div className="text-[10px] text-[#8B949E]">{Math.round(data.temperature_2m_min)}° low</div>
      </div>
      <div className="text-[9px] text-[#4B5563]">{desc}</div>
    </button>
  )
}

export default function WeatherPanel() {
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedDate, setSelectedDate] = useState(TRIP_DATES[0])

  useEffect(() => {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max,weathercode&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=America%2FPhoenix&start_date=2026-05-28&end_date=2026-05-31`

    fetch(url)
      .then((r) => r.json())
      .then((json) => {
        if (!json.daily) throw new Error('No data returned')
        // Index by date
        const byDate = {}
        json.daily.time.forEach((d, i) => {
          byDate[d] = {
            temperature_2m_max: json.daily.temperature_2m_max[i],
            temperature_2m_min: json.daily.temperature_2m_min[i],
            precipitation_sum: json.daily.precipitation_sum[i],
            windspeed_10m_max: json.daily.windspeed_10m_max[i],
            weathercode: json.daily.weathercode[i],
          }
        })
        setWeather(byDate)
        setLoading(false)
      })
      .catch((e) => {
        setError(e.message)
        setLoading(false)
      })
  }, [])

  const selected = weather?.[selectedDate]

  return (
    <div className="flex flex-col md:min-h-0 md:flex-1 md:overflow-hidden">
      {/* Header */}
      <div className="border-b border-[#30363D] px-4 py-4 md:px-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8B949E]">Weather Intel</div>
            <div className="mt-0.5 text-lg font-bold text-[#C9D1D9]">Scottsdale · May 28–31</div>
          </div>
          {!loading && !error && (
            <div className="text-right">
              <div className="text-[10px] text-[#4B5563]">Open-Meteo forecast</div>
              <div className="text-[9px] text-[#4B5563]">Updates daily</div>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 md:flex-1 md:overflow-auto md:p-6">
        {loading && (
          <div className="flex h-48 items-center justify-center text-[#8B949E]">
            <span className="text-[11px] uppercase tracking-widest">Fetching forecast…</span>
          </div>
        )}

        {error && (
          <div className="flex h-48 flex-col items-center justify-center gap-2 text-[#F85149]">
            <span className="text-[11px] uppercase tracking-widest">Forecast unavailable</span>
            <span className="text-[10px] text-[#8B949E]">{error}</span>
            <div className="mt-2 text-[10px] text-[#8B949E]">
              Late May in Scottsdale: expect 105–110°F highs, near-zero precipitation, sunny skies.
            </div>
          </div>
        )}

        {weather && !loading && (
          <div className="flex flex-col gap-6">
            {/* 4-day overview grid */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {TRIP_DATES.map((date) => weather[date] ? (
                <DayCard
                  key={date}
                  date={date}
                  data={weather[date]}
                  selected={date === selectedDate}
                  onClick={() => setSelectedDate(date)}
                />
              ) : null)}
            </div>

            {/* Selected day detail */}
            {selected && (
              <div className="rounded border border-[#30363D] bg-[#11161d] p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[#58A6FF]">
                      {DAY_LABELS[selectedDate].label}
                    </div>
                    <div className="mt-0.5 text-base font-semibold text-[#C9D1D9]">
                      {DAY_LABELS[selectedDate].title}
                    </div>
                  </div>
                  <WeatherIcon type={weatherInfo(selected.weathercode).icon} size={36} />
                </div>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-[#8B949E]">
                      <Thermometer size={10} /> High / Low
                    </div>
                    <div className="font-mono text-2xl font-black text-[#F85149]">{Math.round(selected.temperature_2m_max)}°F</div>
                    <div className="font-mono text-sm text-[#8B949E]">{Math.round(selected.temperature_2m_min)}°F low</div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-[#8B949E]">
                      <Droplets size={10} /> Precipitation
                    </div>
                    <div className="font-mono text-2xl font-black text-[#58A6FF]">
                      {selected.precipitation_sum > 0 ? `${selected.precipitation_sum.toFixed(2)}"` : '0"'}
                    </div>
                    <div className="text-[10px] text-[#8B949E]">Expected rain</div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-[#8B949E]">
                      <Wind size={10} /> Wind
                    </div>
                    <div className="font-mono text-2xl font-black text-[#C9D1D9]">{Math.round(selected.windspeed_10m_max)}</div>
                    <div className="text-[10px] text-[#8B949E]">mph max</div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-[#8B949E]">
                      <Sun size={10} /> Conditions
                    </div>
                    <div className="mt-1 text-sm font-semibold text-[#C9D1D9]">{weatherInfo(selected.weathercode).desc}</div>
                  </div>
                </div>

                <HeatWarning high={selected.temperature_2m_max} />

                {/* Scottsdale-specific tips */}
                <div className="mt-4 border-t border-[#21262d] pt-4">
                  <div className="mb-2 text-[9px] font-black uppercase tracking-[0.18em] text-[#8B949E]">Planning Notes</div>
                  <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                    {selected.temperature_2m_max >= 100 && (
                      <div className="text-[10px] text-[#D29922]">Golf: tee off before 9am or after 5pm to avoid peak heat</div>
                    )}
                    {selected.temperature_2m_max >= 95 && (
                      <div className="text-[10px] text-[#8B949E]">Pool time: best 9am–noon and 5pm+; midday sun is brutal</div>
                    )}
                    <div className="text-[10px] text-[#8B949E]">Hydration: 1 gallon/person/day minimum in this heat</div>
                    {selected.precipitation_sum < 0.05 && (
                      <div className="text-[10px] text-[#3FB950]">Clear skies expected — sunset views will be excellent</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="text-[10px] text-[#4B5563]">
              Note: Open-Meteo forecasts beyond 14 days become statistical estimates. Data updates automatically as the trip approaches.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
