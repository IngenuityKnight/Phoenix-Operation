-- ============================================================
-- TABLES
-- ============================================================

create table if not exists meals (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  day_date date not null,
  meal_type text not null check (meal_type in ('breakfast','lunch','dinner','snacks')),
  name text,
  organizer text,
  plan_type text not null default 'TBD' check (plan_type in ('TBD','cook','restaurant','delivery','catered')),
  headcount int default 14,
  dietary_notes text,
  location_name text,
  cost_estimate numeric,
  notes text
);

create table if not exists logistics (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  category text not null check (category in ('groceries','supplies','transport','activities','other')),
  title text not null,
  assignee text,
  notes text,
  done boolean not null default false
);

create table if not exists arrivals (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  name text not null,
  transport text not null default 'flight' check (transport in ('flight','drive','rideshare','TBD')),
  arrival_date date,
  arrival_time time,
  flight_number text,
  pickup_needed boolean not null default false,
  pickup_notes text,
  status text not null default 'TBD' check (status in ('TBD','Confirmed','En Route','Landed','Arrived')),
  notes text
);

create table if not exists itinerary_items (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  day_date date not null,
  start_time time,
  end_time time,
  title text not null,
  category text not null default 'other' check (category in ('pool','nightlife','golf','food','transport','activity','other')),
  location_name text,
  address text,
  notes text
);

-- ============================================================
-- ENABLE ROW LEVEL SECURITY (open read/write for anon key)
-- ============================================================

alter table meals enable row level security;
alter table logistics enable row level security;
alter table arrivals enable row level security;
alter table itinerary_items enable row level security;

create policy "anon full access" on meals for all to anon using (true) with check (true);
create policy "anon full access" on logistics for all to anon using (true) with check (true);
create policy "anon full access" on arrivals for all to anon using (true) with check (true);
create policy "anon full access" on itinerary_items for all to anon using (true) with check (true);

-- ============================================================
-- SEED: ARRIVALS (14 guys)
-- ============================================================

insert into arrivals (name, transport, arrival_date, arrival_time, flight_number, pickup_needed, status) values
  ('Cameron', 'flight', '2026-05-28', '11:30', 'WN 1234', false, 'TBD'),
  ('Guy 2', 'flight', '2026-05-28', '12:15', 'AA 567', true, 'TBD'),
  ('Guy 3', 'flight', '2026-05-28', '13:00', 'DL 890', false, 'TBD'),
  ('Guy 4', 'drive', '2026-05-28', '14:00', null, false, 'TBD'),
  ('Guy 5', 'flight', '2026-05-28', '14:45', 'WN 2211', true, 'TBD'),
  ('Guy 6', 'flight', '2026-05-28', '15:30', 'UA 334', false, 'TBD'),
  ('Guy 7', 'flight', '2026-05-28', '15:30', 'UA 334', false, 'TBD'),
  ('Guy 8', 'rideshare', '2026-05-28', '16:00', null, false, 'TBD'),
  ('Guy 9', 'flight', '2026-05-28', '16:45', 'AA 778', true, 'TBD'),
  ('Guy 10', 'flight', '2026-05-28', '17:00', 'WN 5599', false, 'TBD'),
  ('Guy 11', 'drive', '2026-05-28', '17:30', null, false, 'TBD'),
  ('Guy 12', 'flight', '2026-05-28', '18:15', 'DL 223', false, 'TBD'),
  ('Guy 13', 'flight', '2026-05-28', '19:00', 'AA 991', true, 'TBD'),
  ('Guy 14', 'flight', '2026-05-28', '20:30', 'WN 7788', false, 'TBD');

-- ============================================================
-- SEED: MEALS
-- ============================================================

insert into meals (day_date, meal_type, name, plan_type, headcount, location_name, notes) values
  ('2026-05-28', 'dinner', 'Welcome Cookout', 'cook', 14, '6543 East 3rd Street, Scottsdale', 'Burgers, dogs, beers on the patio'),
  ('2026-05-29', 'breakfast', 'Bagels & Coffee', 'delivery', 14, 'House', 'Order night before'),
  ('2026-05-29', 'lunch', 'Pool Snacks', 'cook', 14, 'House Pool', 'Chips, sandwiches, easy stuff'),
  ('2026-05-29', 'dinner', 'Old Town Dinner', 'restaurant', 14, 'Old Town Scottsdale', 'TBD — need reservation for 14'),
  ('2026-05-30', 'breakfast', 'Golf Morning Fuel', 'cook', 14, 'House', 'Early start — eggs and toast'),
  ('2026-05-30', 'lunch', 'Clubhouse Lunch', 'restaurant', 14, 'Golf Course', 'At the course'),
  ('2026-05-30', 'dinner', 'Steakhouse Night', 'restaurant', 14, 'Scottsdale', 'Pre-going out dinner'),
  ('2026-05-31', 'breakfast', 'Big Group Breakfast', 'cook', 14, 'House', 'Last morning'),
  ('2026-05-31', 'lunch', 'Pool & Leftovers', 'cook', 14, 'House', 'Clean out the fridge'),
  ('2026-05-31', 'dinner', 'Final Night Out', 'restaurant', 14, 'Scottsdale', 'Go big for the last night');

-- ============================================================
-- SEED: LOGISTICS
-- ============================================================

insert into logistics (category, title, assignee, notes, done) values
  ('groceries', 'Beer & seltzers run', '', 'Two 30-packs minimum, seltzers, mixers', false),
  ('groceries', 'Cookout groceries (burgers, dogs, buns)', '', 'For Thursday welcome night', false),
  ('groceries', 'Breakfast supplies', '', 'Eggs, bacon, bread, OJ, coffee', false),
  ('groceries', 'Pool snack haul', '', 'Chips, dips, fruit, waters', false),
  ('supplies', 'Sunscreen & aloe stock', '', 'Full days in the Arizona sun', false),
  ('supplies', 'Cornhole / yard games', '', 'Check if house has them, otherwise rent', false),
  ('supplies', 'Bluetooth speaker', '', 'Pool playlist ready', false),
  ('supplies', 'Solo cups, plates, napkins', '', 'Stock up at Costco', false),
  ('transport', 'Book airport pickups for guys needing rides', '', '4 guys need pickup — coordinate drivers', false),
  ('transport', 'Book party bus / sprinter for going out', '', 'Fri + Sat nights, fits 14', false),
  ('transport', 'Confirm golf cart situation at course', '', 'One cart per 2 guys', false),
  ('activities', 'Book tee times (golf, Fri 5/30)', '', 'Need course + time — early morning preferred', false),
  ('activities', 'Reserve dinner for 14 (Old Town, Thu)', '', 'Call ahead — most places need 48hr notice for large party', false),
  ('activities', 'Steakhouse reservation Fri night', '', 'Post-golf dinner', false),
  ('activities', 'Plan Saturday night activities', '', 'Bars/clubs in Old Town or Scottsdale Quarter', false),
  ('other', 'Collect house address + entry code', '', '6543 East 3rd Street, Scottsdale AZ — confirm check-in time', false),
  ('other', 'Venmo split setup', '', 'Decide on group fund or itemized splits', false);

-- ============================================================
-- SEED: ITINERARY
-- ============================================================

insert into itinerary_items (day_date, start_time, end_time, title, category, location_name, address, notes) values
  -- Wed 5/28 Arrivals Day
  ('2026-05-28', '11:00', '20:30', 'Arrivals — guys trickling in all day', 'transport', 'PHX Sky Harbor', 'Phoenix, AZ', 'Last arrival ~8:30pm'),
  ('2026-05-28', '15:00', null, 'House opens — check in, settle in', 'other', '6543 East 3rd St', '6543 East 3rd Street, Scottsdale AZ', 'Confirm key/code with host'),
  ('2026-05-28', '18:00', '21:00', 'Welcome cookout on the patio', 'food', 'The House', '6543 East 3rd Street, Scottsdale AZ', 'Burgers, dogs, beers. Chill night.'),
  ('2026-05-28', '21:00', null, 'Low-key first night — pool, drinks, games', 'pool', 'The House Pool', null, null),

  -- Thu 5/29 Pool Day
  ('2026-05-29', '09:00', '10:00', 'Breakfast delivery', 'food', 'House', null, 'Bagels & coffee'),
  ('2026-05-29', '10:00', '17:00', 'Pool day — all day', 'pool', 'The House Pool', '6543 East 3rd Street, Scottsdale AZ', 'Music, drinks, yard games'),
  ('2026-05-29', '13:00', '14:00', 'Pool snacks & lunch', 'food', 'House', null, 'Laid back — sandwiches and chips'),
  ('2026-05-29', '18:00', '19:30', 'Get ready, pre-game', 'other', 'House', null, null),
  ('2026-05-29', '19:30', null, 'Old Town Scottsdale dinner', 'food', 'Old Town Scottsdale', 'Old Town Scottsdale, AZ', 'Need reservation for 14'),
  ('2026-05-29', '21:30', null, 'Old Town bar crawl', 'nightlife', 'Old Town Scottsdale', null, 'Bars TBD'),

  -- Fri 5/30 Golf + Nightlife
  ('2026-05-30', '07:00', '08:00', 'Early breakfast', 'food', 'House', null, 'Fuel up before golf'),
  ('2026-05-30', '08:30', null, 'Depart for golf course', 'transport', null, null, 'All 14 guys — carpool or sprinter'),
  ('2026-05-30', '09:00', '14:00', 'Golf — 18 holes', 'golf', 'TBD Golf Course', 'Scottsdale, AZ', 'Book tee times ASAP'),
  ('2026-05-30', '13:00', '14:00', 'Clubhouse lunch', 'food', 'Golf Clubhouse', null, 'At the course'),
  ('2026-05-30', '15:00', '17:00', 'Pool recovery', 'pool', 'The House Pool', null, 'Decompress after golf'),
  ('2026-05-30', '18:30', '20:00', 'Steakhouse dinner', 'food', 'TBD Steakhouse', 'Scottsdale, AZ', 'Big dinner, pre-night out'),
  ('2026-05-30', '21:00', null, 'Big night out — bars/clubs', 'nightlife', 'Scottsdale', null, 'Book sprinter/party bus'),

  -- Sat 5/31 Last Night
  ('2026-05-31', '09:00', '10:30', 'Big group breakfast', 'food', 'House', null, 'Last morning together'),
  ('2026-05-31', '11:00', '15:00', 'Final pool hang', 'pool', 'The House Pool', null, 'Soak it up, last day'),
  ('2026-05-31', '15:00', '16:00', 'Pack up, check out prep', 'other', 'House', null, 'Clean up, luggage out'),
  ('2026-05-31', '18:00', '20:00', 'Final dinner out', 'food', 'Scottsdale', null, 'Go big for the last night'),
  ('2026-05-31', '21:00', null, 'Last night out', 'nightlife', 'Scottsdale', null, 'Send it');

-- ============================================================
-- TABLE: expenses (Budget / Cost Split)
-- ============================================================

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
create policy "anon full access" on expenses for all to anon using (true) with check (true);

alter publication supabase_realtime add table expenses;

-- ============================================================
-- TABLE: roster (Headcount / RSVP)
-- ============================================================

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
create policy "anon full access" on roster for all to anon using (true) with check (true);

alter publication supabase_realtime add table roster;

-- ============================================================
-- TABLE: house_info (House Info Board)
-- ============================================================

create table if not exists house_info (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  category text not null default 'other' check (category in ('access','utilities','local','rules','other')),
  key text not null,
  value text not null,
  notes text
);

alter table house_info enable row level security;
create policy "anon full access" on house_info for all to anon using (true) with check (true);

alter publication supabase_realtime add table house_info;

-- ============================================================
-- SEED: HOUSE INFO (starter entries — update with real values)
-- ============================================================

insert into house_info (category, key, value, notes) values
  ('access',    'Front Door Code',   'TBD — confirm with host',    'Usually a keypad on front door'),
  ('access',    'Check-in Time',     '3:00 PM on Wed 5/28',        'Host will confirm'),
  ('access',    'Check-out Time',    '11:00 AM on Sat 5/31',       'Leave keys inside'),
  ('access',    'Airbnb Address',    '6543 E 3rd St, Scottsdale AZ 85251', null),
  ('utilities', 'WiFi Network',      'TBD — check router on arrival', null),
  ('utilities', 'WiFi Password',     'TBD — check router on arrival', null),
  ('utilities', 'Pool Hours',        'Dawn to dusk (HOA rules vary)', 'Check with host for specifics'),
  ('local',     'Nearest Urgent Care', 'Honor Health Urgent Care — 9520 E Talking Stick Way', '3 min drive from house'),
  ('local',     'Nearest Grocery',  'Fry''s Food Store — 4726 E Shea Blvd',   '8 min drive'),
  ('local',     'Nearest Costco',   'Costco — 3801 N Arizona Ave, Chandler',  '15 min drive'),
  ('local',     'Alcohol Delivery',  'Drizly or Total Wine delivery',          'Drizly fastest in Scottsdale'),
  ('local',     'Uber/Lyft',         'Both active in Scottsdale — surge on weekends', '10–15 min wait on weekend nights'),
  ('rules',     'Quiet Hours',       'Check with host',             'Scottsdale noise ordinance: 10pm weekdays, 11pm weekends'),
  ('rules',     'Max Guests',        '14 confirmed',                'Do not exceed Airbnb max occupancy'),
  ('rules',     'Parking',           'Check with host for garage/driveway spots', null),
  ('other',     'Host Contact',      'TBD — Airbnb messaging',     'Message through Airbnb app for fastest response');
