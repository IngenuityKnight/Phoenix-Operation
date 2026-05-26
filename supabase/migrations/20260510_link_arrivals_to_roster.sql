-- Link arrivals to roster via FK so each arrival record can be tied to a specific roster person
alter table arrivals add column if not exists roster_id uuid references roster(id) on delete set null;

create index if not exists arrivals_roster_id_idx on arrivals(roster_id);
