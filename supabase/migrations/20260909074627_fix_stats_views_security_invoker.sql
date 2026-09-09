-- work_stats and adaptation_stats were created without security_invoker, so
-- Postgres checks permissions against the view owner (the migration role,
-- which bypasses RLS on hosted Supabase) rather than the querying user. That
-- flags as "Security Definer View" in Supabase's linter, and in practice
-- means these "anonymous aggregate" views currently include private-profile
-- users' rows too, not just public-profile + own rows as intended.
--
-- security_invoker = true makes the view run with the querying role's own
-- permissions instead, so it's subject to the same RLS policies as a direct
-- query against user_books/user_adaptations would be.
alter view work_stats set (security_invoker = true);
alter view adaptation_stats set (security_invoker = true);
