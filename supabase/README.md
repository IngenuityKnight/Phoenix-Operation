# Supabase Notes

This directory holds schema migrations for the hosted Supabase project behind the dashboard.

## Plane Tracker Rollback

To remove the backend flight-tracking additions and return arrivals to the simple manual check-in model, apply:

- [`migrations/20260418_remove_plane_tracker_backend.sql`](/Users/cameronburden/palantir-for-family-trips/supabase/migrations/20260418_remove_plane_tracker_backend.sql:1)

That migration will:

- Drop `public.arrival_notifications`
- Remove these columns from `public.arrivals`:
  - `airline_iata`
  - `origin_airport`
  - `destination_airport`
  - `flight_watch_enabled`
  - `status_source`
  - `aviationstack_status`
  - `last_checked_at`
  - `actual_landed_at`

It intentionally keeps the base arrivals fields used by the current UI, including `name`, `transport`, `arrival_date`, `arrival_time`, `flight_number`, `pickup_needed`, `pickup_notes`, `status`, and `notes`.

## Apply

If you use the Supabase CLI from the repo root:

```bash
supabase db push
```

If you apply SQL manually, run the migration contents in the Supabase SQL editor against the target project.
