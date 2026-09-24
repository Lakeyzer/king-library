-- Lets an admin permanently remove a report (resolved/spam/trash), same
-- pattern as add_suggestions_delete_policy.sql. No column-level grant trick
-- needed here unlike the status UPDATE policy - DELETE isn't column-scoped,
-- so the using clause alone determines which rows an admin (and only an
-- admin) can remove. Nothing references reports.id via foreign key, so
-- there is nothing to cascade.
create policy "reports deletable by admin"
  on reports for delete
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
