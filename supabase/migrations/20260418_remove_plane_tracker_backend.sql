-- Roll back the backend flight-tracking schema additions.
-- This keeps the base arrivals check-in flow intact while removing the
-- notification table and the extra columns used by automated flight watch.

drop table if exists public.arrival_notifications;

alter table if exists public.arrivals
  drop column if exists airline_iata,
  drop column if exists origin_airport,
  drop column if exists destination_airport,
  drop column if exists flight_watch_enabled,
  drop column if exists status_source,
  drop column if exists aviationstack_status,
  drop column if exists last_checked_at,
  drop column if exists actual_landed_at;
