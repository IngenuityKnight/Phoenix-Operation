create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  description text not null,
  amount numeric not null,
  paid_by text not null,
  category text not null default 'other' check (category in ('house','golf','food','drinks','transport','activities','other')),
  split_count int not null default 14,
  notes text
);

alter table expenses enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'expenses' and policyname = 'anon full access'
  ) then
    execute 'create policy "anon full access" on expenses for all to anon using (true) with check (true)';
  end if;
end $$;

alter publication supabase_realtime add table expenses;

create table if not exists roster (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  name text not null,
  status text not null default 'Confirmed' check (status in ('Confirmed','Maybe','Ghosting')),
  arrival_window text default 'TBD',
  phone text,
  venmo_handle text,
  dietary_notes text,
  notes text
);

alter table roster enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'roster' and policyname = 'anon full access'
  ) then
    execute 'create policy "anon full access" on roster for all to anon using (true) with check (true)';
  end if;
end $$;

alter publication supabase_realtime add table roster;

create table if not exists house_info (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  category text not null default 'other' check (category in ('access','utilities','local','rules','other')),
  key text not null,
  value text not null,
  notes text
);

alter table house_info enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'house_info' and policyname = 'anon full access'
  ) then
    execute 'create policy "anon full access" on house_info for all to anon using (true) with check (true)';
  end if;
end $$;

alter publication supabase_realtime add table house_info;
