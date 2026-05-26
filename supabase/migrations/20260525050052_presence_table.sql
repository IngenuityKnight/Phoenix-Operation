CREATE TABLE IF NOT EXISTS presence (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'Unknown' CHECK (status IN ('At the house', 'At the pool', 'Out / bars', 'Golf', 'On the way', 'Crashed', 'Unknown')),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE presence ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "anon full access" ON presence FOR ALL TO anon USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE presence;
EXCEPTION WHEN others THEN NULL; END $$;
