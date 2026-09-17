-- Closes voting entirely once a suggestion is triaged off "new" - a full
-- lock on mutation (insert/update/delete), not just blocking a first-time
-- vote. Existing votes/scores on a triaged suggestion stay visible; only
-- the SELECT-side view/policy is untouched. See design.md "Voting closes
-- once a suggestion leaves 'new'".
drop policy "suggestion_votes writable by owner" on suggestion_votes;
drop policy "suggestion_votes updatable by owner" on suggestion_votes;
drop policy "suggestion_votes deletable by owner" on suggestion_votes;

create policy "suggestion_votes writable by owner"
  on suggestion_votes for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (select 1 from suggestions s where s.id = suggestion_id and s.status = 'new')
  );

create policy "suggestion_votes updatable by owner"
  on suggestion_votes for update
  to authenticated
  using (
    user_id = auth.uid()
    and exists (select 1 from suggestions s where s.id = suggestion_id and s.status = 'new')
  );

create policy "suggestion_votes deletable by owner"
  on suggestion_votes for delete
  to authenticated
  using (
    user_id = auth.uid()
    and exists (select 1 from suggestions s where s.id = suggestion_id and s.status = 'new')
  );
