-- Audit log: server-side write auditing via Edge Function
-- IP address is captured by the Edge Function from request headers (not client-supplied)

CREATE TABLE audit_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  ip_address text,
  user_agent text,
  action text NOT NULL CHECK (action IN ('insert', 'update', 'delete')),
  table_name text NOT NULL,
  record_id text,
  payload jsonb
);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Anon can read (admin dashboard uses anon key to display logs)
CREATE POLICY "anon read audit_log" ON audit_log
  FOR SELECT TO anon USING (true);

-- Only service_role can insert — direct client writes are blocked
CREATE POLICY "service_role insert audit_log" ON audit_log
  FOR INSERT TO service_role WITH CHECK (true);
