-- Reports move from a private owner-only inbox to a browsable, triageable
-- queue - same shape as `suggestions`: authenticated-read, admin-only status
-- update via a column-level grant, status always resolved through a
-- security_invoker view that never selects user_id (see
-- create_suggestions_table's "Admin identification via JWT app_metadata role
-- claim" / "Resolves the display name server-side" comments). Unlike
-- suggestions, reports have no per-row anonymous toggle - they're always
-- anonymous on the public view, so the view never joins profiles at all.
alter table reports add column status text not null default 'new';
alter table reports add constraint reports_status_valid check (status in ('new', 'rejected', 'applied'));

drop policy "reports readable by owner" on reports;

create policy "reports readable by authenticated users"
  on reports for select
  to authenticated
  using (true);

create policy "reports status updatable by admin"
  on reports for update
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

revoke update on reports from authenticated;
grant update (status) on reports to authenticated;

-- Resolves each report's single item reference (per
-- reports_item_reference_matches_type - at most one of the four FKs is ever
-- set) into a title/slug pair for display and linking, and never selects
-- user_id, keeping every report anonymous on this view regardless of who
-- queries it.
create view reports_public
  with (security_invoker = true)
  as
  select
    r.id,
    r.type,
    r.content_area,
    r.description,
    r.status,
    r.created_at,
    coalesce(kw.title, ss.title, a.title, rw.title) as item_title,
    coalesce(kw.slug, ss.slug, a.slug, rw.slug) as item_slug
  from reports r
  left join king_works kw on kw.id = r.king_work_id
  left join king_short_stories ss on ss.id = r.short_story_id
  left join adaptations a on a.id = r.adaptation_id
  left join related_works rw on rw.id = r.related_work_id;
