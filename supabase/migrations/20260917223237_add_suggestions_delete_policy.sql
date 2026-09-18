-- Lets an admin permanently remove a suggestion (spam/trash). No
-- column-level grant trick is needed here unlike the status UPDATE policy -
-- DELETE isn't column-scoped, so the using clause alone determines which
-- rows an admin (and only an admin) can remove. suggestion_votes.suggestion_id
-- already has `on delete cascade`, so a deleted suggestion's votes are
-- cleaned up automatically.
create policy "suggestions deletable by admin"
  on suggestions for delete
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
