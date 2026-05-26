-- Seed house_info with standard trip keys (safe to re-run)
INSERT INTO public.house_info (key, value)
SELECT key, value FROM (VALUES
  ('Airbnb Address',  '6543 3rd Street, Scottsdale AZ 85251'),
  ('Front Door Code', ''),
  ('WiFi Network',    ''),
  ('WiFi Password',   ''),
  ('Check-in Time',   ''),
  ('Check-out Time',  '')
) AS v(key, value)
WHERE NOT EXISTS (SELECT 1 FROM public.house_info WHERE house_info.key = v.key);
