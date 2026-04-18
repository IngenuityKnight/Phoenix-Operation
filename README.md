# Phoenix Bachelor Command Center

Realtime-style ops UI for a Scottsdale bachelor party weekend.

The application is organized around six surfaces:

- `Daily Briefing` for the day-by-day command summary
- `Itinerary` for events, venues, and timing
- `Arrivals` for inbound travel and airport pickup control
- `Ops Map` for PHX flight arcs and command-house context
- `Meals` for food planning and headcount
- `Logistics` for shared task execution

## Development

```bash
npm install
npm run dev
```

## Data

The current UI reads and writes against Supabase tables used by the panel components:

- `arrivals`
- `itinerary_items`
- `meals`
- `logistics`

## Product Direction

This codebase is intentionally scoped to one use case: a bachelor-party command center for Phoenix / Scottsdale. Legacy trip-planning code from the older concept has been removed.
