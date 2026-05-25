-- Add split_names jsonb array to expenses.
-- Existing rows keep split_count as the denominator; split_names is null until re-saved.
alter table expenses add column if not exists split_names jsonb;
