# Supabase Backend Prompt

Use this prompt with another LLM to generate the Supabase backend implementation for Aviationstack-powered flight tracking.

```text
I have a frontend app already wired to Supabase and I need you to design and implement the backend side for flight-arrival tracking using Aviationstack.

Context:
- Frontend stack: React + Supabase JS client
- Existing Supabase tables already used by the app:
  - arrivals
  - itinerary_items
  - meals
  - logistics
- The arrivals table now needs to support backend-managed flight tracking and landing notifications.
- Goal: when a tracked guest flight lands at PHX (or another configured destination), the backend should update the arrival row and create a notification row that the frontend can subscribe to in realtime.

I want a concrete Supabase-first solution using:
- SQL migrations
- Supabase Edge Functions
- Supabase scheduled jobs / pg_cron if appropriate
- Realtime-compatible tables
- Environment secrets for Aviationstack

Please produce:
1. SQL migration(s) to extend the `arrivals` table with the fields below if missing:
   - airline_iata text
   - origin_airport text
   - destination_airport text default 'PHX'
   - flight_number text
   - flight_watch_enabled boolean default true
   - status text default 'TBD'
   - status_source text default 'manual'
   - aviationstack_status text
   - last_checked_at timestamptz
   - actual_landed_at timestamptz
   - updated_at timestamptz default now()

2. SQL migration for a new `arrival_notifications` table with fields similar to:
   - id uuid primary key default gen_random_uuid()
   - arrival_id uuid references arrivals(id) on delete cascade
   - event_type text not null
   - title text not null
   - message text not null
   - payload jsonb default '{}'::jsonb
   - created_at timestamptz default now()

3. Indexes and recommended RLS policies for both tables.
   - Assume authenticated app users should be able to read/write arrivals.
   - Assume authenticated app users should be able to read notifications.
   - Assume only the service role / edge functions should insert backend-generated notifications.

4. A Supabase Edge Function named something like `check-flight-status` that:
   - reads active rows from `arrivals` where:
     - transport = 'flight'
     - flight_watch_enabled = true
     - status not in ('Arrived')
     - flight_number is not null
   - calls Aviationstack with the configured API key
   - resolves a flight using airline IATA + flight number + arrival_date + destination_airport when possible
   - maps provider statuses into app statuses:
     - scheduled/active -> Confirmed or En Route
     - landed -> Landed
     - completed/arrived -> Arrived
   - updates `aviationstack_status`, `status`, `status_source = 'aviationstack'`, `last_checked_at`
   - sets `actual_landed_at` when the provider indicates landing
   - inserts a row into `arrival_notifications` only when a meaningful transition happens, especially:
     - first time marked Landed
     - first time marked Arrived
     - major delay/cancellation if you think it is useful
   - avoids duplicate notifications for the same event

5. A second optional Edge Function or shared utility for manually triggering a single-arrival refresh by `arrival_id`.

6. A scheduled execution approach for Supabase:
   - either pg_cron or Supabase scheduled functions
   - every 5 minutes is fine
   - include exact SQL or setup steps

7. Local development and deployment steps:
   - where to put the function files
   - how to set secrets
   - how to deploy migrations
   - how to deploy the Edge Function

8. Example TypeScript code for the Edge Function, not pseudocode.

9. Guidance on Aviationstack request shape and matching strategy:
   - how to query by flight number
   - how to avoid mismatching the wrong day’s flight
   - how to handle missing airline_iata
   - how to handle ambiguous results

10. A short section called “Frontend Contract” listing exactly what fields the frontend can rely on after backend setup.

Important constraints:
- Prefer practical simplicity over airline-industry perfection.
- This is for a private bachelor-party ops app, not an airline product.
- Avoid overengineering.
- Do not expose the Aviationstack key to the browser.
- Use service-role access only inside backend functions.
- Assume Supabase Postgres + Edge Functions are already available.

Please return:
- migration SQL
- Edge Function code
- deployment/setup commands
- brief explanation of decisions
```
