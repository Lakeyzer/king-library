-- Folds the parallel By Other Hands tables (related_works, user_related_works,
-- user_related_work_editions, related_work_omnibus_works, related_work_stats)
-- into their King counterparts. One `works` table now holds every book, each
-- row labelled `kind = 'king'` or `kind = 'related'`, and queries decide which
-- kind a page or statistic covers. See merge-related-works-into-works's
-- design.md.
--
-- Deliberately one file: hosted already has real related-works user data,
-- and a partial apply (tables dropped but functions not yet recreated, say)
-- would be far worse than one long migration. The verification block near
-- the end compares old and new row counts and raises on any mismatch, so a
-- bad copy rolls the whole thing back and leaves hosted untouched. Every id
-- is kept, so URLs, seed files, related_work_king_works rows, and reports
-- keep pointing at the same rows.

-- ---------------------------------------------------------------------------
-- 1. Renames: king_works -> works, king_work_id -> work_id
-- ---------------------------------------------------------------------------
-- Constraint names are renamed too, since PostgREST embed hints in the
-- composables (e.g. `works!user_books_work_id_fkey`) spell them out.

alter table king_works rename to works;
alter table works rename constraint king_works_pkey to works_pkey;
alter table works rename constraint king_works_slug_key to works_slug_key;
alter table works rename constraint king_works_shuffle_position_key to works_shuffle_position_key;
alter table works rename constraint king_works_edition_year_range_check to works_edition_year_range_check;
alter table works rename constraint king_works_counts_with_id_fkey to works_counts_with_id_fkey;
alter policy "king_works readable by everyone" on works rename to "works readable by everyone";
alter trigger king_works_assign_shuffle_position on works rename to works_assign_shuffle_position;

alter table user_books rename column king_work_id to work_id;
alter table user_books rename constraint user_books_king_work_id_fkey to user_books_work_id_fkey;
alter table user_books rename constraint user_books_user_id_king_work_id_key to user_books_user_id_work_id_key;

alter table user_book_reads rename column king_work_id to work_id;
alter table user_book_reads rename constraint user_book_reads_king_work_id_fkey to user_book_reads_work_id_fkey;

alter table user_book_editions rename column king_work_id to work_id;
alter table user_book_editions rename constraint user_book_editions_king_work_id_fkey to user_book_editions_work_id_fkey;

alter table series_works rename column king_work_id to work_id;
alter table series_works rename constraint series_works_king_work_id_fkey to series_works_work_id_fkey;
alter table series_works rename constraint series_works_series_id_king_work_id_key to series_works_series_id_work_id_key;

alter table adaptation_works rename column king_work_id to work_id;
alter table adaptation_works rename constraint adaptation_works_king_work_id_fkey to adaptation_works_work_id_fkey;
alter table adaptation_works rename constraint adaptation_works_adaptation_id_king_work_id_key to adaptation_works_adaptation_id_work_id_key;

alter table king_short_story_collections rename column king_work_id to work_id;
alter table king_short_story_collections rename constraint king_short_story_collections_king_work_id_fkey to king_short_story_collections_work_id_fkey;
alter table king_short_story_collections rename constraint king_short_story_collections_short_story_id_king_work_id_key to king_short_story_collections_short_story_id_work_id_key;

alter table reports rename column king_work_id to work_id;
alter table reports rename constraint reports_king_work_id_fkey to reports_work_id_fkey;

alter table king_work_omnibus_works rename to work_omnibus_works;
alter table work_omnibus_works rename column omnibus_king_work_id to omnibus_work_id;
alter table work_omnibus_works rename column component_king_work_id to component_work_id;
alter table work_omnibus_works rename constraint king_work_omnibus_works_pkey to work_omnibus_works_pkey;
alter table work_omnibus_works rename constraint king_work_omnibus_works_omnibus_king_work_id_fkey to work_omnibus_works_omnibus_work_id_fkey;
alter table work_omnibus_works rename constraint king_work_omnibus_works_component_king_work_id_fkey to work_omnibus_works_component_work_id_fkey;
alter table work_omnibus_works rename constraint king_work_omnibus_works_omnibus_king_work_id_component_king_key to work_omnibus_works_omnibus_work_id_component_work_id_key;
alter policy "king_work_omnibus_works readable by everyone" on work_omnibus_works rename to "work_omnibus_works readable by everyone";

-- ---------------------------------------------------------------------------
-- 2. The kind label and the related-only columns
-- ---------------------------------------------------------------------------
-- No default on `kind`: every insert (and every seed row) has to say which
-- kind it is, so a missing label fails loudly instead of quietly becoming
-- King. Related-only details are nullable columns tied to their kind by
-- works_kind_shape_check. A related omnibus is `type = 'omnibus'` (replacing
-- related_works.is_omnibus), which lets the King omnibus cascade triggers
-- below cover both kinds. shuffle_position is King-only, so the Book of the
-- week rotation and its contiguous range never include a related work.

alter table works add column kind text;
update works set kind = 'king';
alter table works
  alter column kind set not null,
  add constraint works_kind_check check (kind in ('king', 'related'));

alter table works
  add column creator text,
  add column category text check (category in ('comic', 'reference', 'tie_in_novel')),
  add column relation_note text,
  alter column type drop not null,
  alter column shuffle_position drop not null;

alter table works
  add constraint works_kind_shape_check check (
    (
      kind = 'king'
      and type is not null
      and creator is null
      and category is null
      and relation_note is null
      and shuffle_position is not null
    )
    or (
      kind = 'related'
      and creator is not null
      and category is not null
      and (type is null or type = 'omnibus')
      and shuffle_position is null
    )
  );

create index works_kind_idx on works (kind);

-- ---------------------------------------------------------------------------
-- 3. Functions that name the old tables/columns
-- ---------------------------------------------------------------------------
-- A rename doesn't rewrite plpgsql bodies, so each one is recreated against
-- the new names. assign_shuffle_position() has to be replaced before the
-- related rows are copied in, or it would hand them a position.

create or replace function assign_shuffle_position()
returns trigger
language plpgsql
as $$
begin
  if new.kind = 'king' and new.shuffle_position is null then
    select coalesce(max(shuffle_position), -1) + 1 into new.shuffle_position
    from works
    where kind = 'king';
  end if;
  return new;
end;
$$;

create or replace function cascade_book_reads_on_omnibus_read()
returns trigger
language plpgsql
as $$
begin
  if new.read = true and (tg_op = 'INSERT' or old.read is distinct from true) then
    if exists (select 1 from works where id = new.work_id and type = 'omnibus') then
      insert into user_books (user_id, work_id, read, via_omnibus_id)
      select new.user_id, wow.component_work_id, true, new.work_id
      from work_omnibus_works wow
      where wow.omnibus_work_id = new.work_id
      on conflict (user_id, work_id) do update
        set read = true,
            via_omnibus_id = excluded.via_omnibus_id
        where user_books.read = false;
    end if;
  end if;
  return new;
end;
$$;

create or replace function uncascade_book_reads_on_omnibus_unread()
returns trigger
language plpgsql
as $$
begin
  if old.read = true and new.read = false then
    if exists (select 1 from works where id = new.work_id and type = 'omnibus') then
      update user_books ub
      set read = false,
          via_omnibus_id = null
      from work_omnibus_works wow
      where wow.omnibus_work_id = old.work_id
        and wow.component_work_id = ub.work_id
        and ub.user_id = new.user_id
        and ub.via_omnibus_id = old.work_id
        and not exists (
          select 1
          from work_omnibus_works other_wow
          join user_books other_ub
            on other_ub.work_id = other_wow.omnibus_work_id
            and other_ub.user_id = new.user_id
            and other_ub.read = true
          where other_wow.component_work_id = ub.work_id
            and other_wow.omnibus_work_id <> old.work_id
        );
    end if;
  end if;
  return new;
end;
$$;

create or replace function cascade_short_story_reads_on_collection_read()
returns trigger
language plpgsql
as $$
begin
  if new.read = true and (tg_op = 'INSERT' or old.read is distinct from true) then
    if exists (select 1 from works where id = new.work_id and type = 'collection') then
      insert into user_short_story_reads (user_id, short_story_id, via_collection_id)
      select new.user_id, ksc.short_story_id, new.work_id
      from king_short_story_collections ksc
      where ksc.work_id = new.work_id
      on conflict (user_id, short_story_id) do nothing;
    end if;
  end if;
  return new;
end;
$$;

create or replace function uncascade_short_story_reads_on_collection_unread()
returns trigger
language plpgsql
as $$
begin
  if old.read = true and new.read = false then
    if exists (select 1 from works where id = new.work_id and type = 'collection') then
      delete from user_short_story_reads r
      using king_short_story_collections ksc
      where r.short_story_id = ksc.short_story_id
        and ksc.work_id = old.work_id
        and r.user_id = new.user_id
        and r.via_collection_id = old.work_id
        and not exists (
          select 1
          from king_short_story_collections other_ksc
          join user_books other_ub
            on other_ub.work_id = other_ksc.work_id
            and other_ub.user_id = new.user_id
            and other_ub.read = true
          where other_ksc.short_story_id = r.short_story_id
            and other_ksc.work_id <> old.work_id
        );
    end if;
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. Copy the related catalog into works / work_omnibus_works
-- ---------------------------------------------------------------------------

insert into works (
  id, kind, title, creator, category, type, publish_date, slug,
  open_library_work_key, cover_id, description, relation_note, active, dark_tower
)
select
  id, 'related', title, creator, category, case when is_omnibus then 'omnibus' end, publish_date, slug,
  open_library_work_key, cover_id, description, relation_note, active, dark_tower
from related_works;

insert into work_omnibus_works (id, omnibus_work_id, component_work_id)
select id, omnibus_related_work_id, component_related_work_id
from related_work_omnibus_works;

-- ---------------------------------------------------------------------------
-- 5. Copy user tracking
-- ---------------------------------------------------------------------------
-- user_books' triggers are switched off for the copy: rows are moved exactly
-- as they are. Left on, clear_read_states_on_progress() would clear
-- currently_reading on a reread in progress (read and currently_reading both
-- true), and the omnibus cascade would try to re-mark components that
-- already carry their own via_omnibus_id.
--
-- user_books.format means the in-progress session's format (see
-- 20260916120320_add_format_to_user_books.sql), so it's only carried over
-- for a currently-reading row. Every read that wasn't only cascaded from an
-- omnibus becomes one logged read in user_book_reads - the same rule King's
-- own cascade has always followed, which keeps cascaded comics off the
-- timeline. On a reread in progress, started_on and format describe the
-- current session rather than the finished read, so the logged read leaves
-- them empty.

alter table user_books disable trigger user;

insert into user_books (
  user_id, work_id, owned, wishlisted, want_to_read, currently_reading,
  started_on, read, finished_on, read_year, format, via_omnibus_id
)
select
  user_id, related_work_id, owned, false, want_to_read, currently_reading,
  started_on, read, finished_on, null, case when currently_reading then format end, via_omnibus_id
from user_related_works;

alter table user_books enable trigger user;

insert into user_book_reads (user_id, work_id, read_on, read_year, started_on, note, format, rating)
select
  user_id,
  related_work_id,
  finished_on,
  null,
  case when currently_reading then null else started_on end,
  note,
  case when currently_reading then null else format end,
  rating
from user_related_works
where read = true and via_omnibus_id is null;

-- A user holding the same Open Library edition against both a King work and
-- a related work would break user_book_editions' unique (user_id,
-- edition_id); that copy is skipped, and the verification below allows for
-- exactly those skipped rows.
insert into user_book_editions (id, user_id, work_id, edition_id, edition_title, added_at)
select id, user_id, related_work_id, edition_id, edition_title, added_at
from user_related_work_editions
on conflict (user_id, edition_id) do nothing;

-- ---------------------------------------------------------------------------
-- 6. Reports: related_work_id folds into work_id
-- ---------------------------------------------------------------------------

drop view reports_public;

alter table reports drop constraint reports_item_reference_matches_type;

update reports set work_id = related_work_id where related_work_id is not null;

alter table reports
  drop column related_work_id,
  add constraint reports_item_reference_matches_type check (
    (type = 'missing_content' and work_id is null and short_story_id is null and adaptation_id is null)
    or (type = 'issue' and (
      (work_id is not null)::int + (short_story_id is not null)::int + (adaptation_id is not null)::int = 1
    ))
  );

-- Same shape as 20260923151656's reports_public, minus the related_works
-- join: a report on a related work now resolves through works like any other.
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
    coalesce(w.title, ss.title, a.title) as item_title,
    coalesce(w.slug, ss.slug, a.slug) as item_slug
  from reports r
  left join works w on w.id = r.work_id
  left join king_short_stories ss on ss.id = r.short_story_id
  left join adaptations a on a.id = r.adaptation_id;

grant select on reports_public to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 7. related_work_king_works points at works on both sides
-- ---------------------------------------------------------------------------
-- The table and its columns keep their names: related_work_id and
-- king_work_id name each side's role in the link, not a table. king_work_id's
-- FK already followed the table rename.

alter table related_work_king_works
  drop constraint related_work_king_works_related_work_id_fkey,
  add constraint related_work_king_works_related_work_id_fkey
    foreign key (related_work_id) references works (id) on delete cascade;

-- ---------------------------------------------------------------------------
-- 8. Stats views
-- ---------------------------------------------------------------------------
-- work_stats now covers both kinds and exposes `kind`, so a King leaderboard
-- filters on kind = 'king' without a join and a related work's detail page
-- reads its own row (replacing related_work_stats). Dropped rather than
-- replaced, since the output column is renamed.

drop view work_stats;

create view work_stats as
select
  w.id as work_id,
  w.kind,
  count(ub.id) filter (where ub.want_to_read) as want_to_read_count,
  count(ub.id) filter (where ub.currently_reading) as currently_reading_count,
  count(ub.id) filter (where ub.read) as read_count,
  count(ub.id) filter (where ub.owned) as owner_count,
  count(ub.id) filter (where ub.owned and ub.read) as owners_who_read_count,
  case
    when count(ub.id) filter (where ub.owned) > 0
    then count(ub.id) filter (where ub.owned and ub.read)::numeric / count(ub.id) filter (where ub.owned)
    else null
  end as read_through_rate
from works w
left join user_books ub on ub.work_id = w.id
group by w.id;

grant select on work_stats to anon, authenticated;

-- Related works share the dark_tower flag (Marvel's Dark Tower comics), so
-- the core-series journey counts have to be scoped to King works explicitly.
create or replace view dark_tower_journey_stats as
with per_user_progress as (
  select
    ub.user_id,
    count(distinct coalesce(w.counts_with_id, w.id)) filter (where ub.read) as read_count
  from user_books ub
  join works w on w.id = ub.work_id
  where w.dark_tower = true and w.kind = 'king'
  group by ub.user_id
),
core_total as (
  select count(distinct coalesce(counts_with_id, id)) as total
  from works
  where dark_tower = true and kind = 'king'
)
select
  count(*) filter (where p.read_count = c.total) as finished_count,
  count(*) filter (where p.read_count > 0 and p.read_count < c.total) as on_the_way_count,
  greatest(
    (select count(*) from profiles where is_public = true or id = auth.uid())
    - count(*) filter (where p.read_count > 0),
    0
  ) as not_started_count
from per_user_progress p
cross join core_total c;

-- ---------------------------------------------------------------------------
-- 9. Verify the copy before anything is dropped
-- ---------------------------------------------------------------------------

do $$
declare
  expected bigint;
  actual bigint;
  skipped_editions bigint;
begin
  select count(*) into expected from related_works;
  select count(*) into actual from works where kind = 'related';
  if actual <> expected then
    raise exception 'works: expected % related rows, found %', expected, actual;
  end if;

  select count(*) into expected from related_work_omnibus_works;
  select count(*) into actual
  from work_omnibus_works wow
  join works w on w.id = wow.omnibus_work_id
  where w.kind = 'related';
  if actual <> expected then
    raise exception 'work_omnibus_works: expected % related links, found %', expected, actual;
  end if;

  select count(*) into expected from user_related_works;
  select count(*) into actual
  from user_books ub
  join works w on w.id = ub.work_id
  where w.kind = 'related';
  if actual <> expected then
    raise exception 'user_books: expected % related rows, found %', expected, actual;
  end if;

  select count(*) into actual
  from user_related_works urw
  join user_books ub on ub.user_id = urw.user_id and ub.work_id = urw.related_work_id
  where ub.owned is distinct from urw.owned
    or ub.want_to_read is distinct from urw.want_to_read
    or ub.currently_reading is distinct from urw.currently_reading
    or ub.read is distinct from urw.read
    or ub.started_on is distinct from urw.started_on
    or ub.finished_on is distinct from urw.finished_on
    or ub.via_omnibus_id is distinct from urw.via_omnibus_id;
  if actual <> 0 then
    raise exception 'user_books: % related rows differ from user_related_works', actual;
  end if;

  select count(*) into expected from user_related_works where read = true and via_omnibus_id is null;
  select count(*) into actual
  from user_book_reads ubr
  join works w on w.id = ubr.work_id
  where w.kind = 'related';
  if actual <> expected then
    raise exception 'user_book_reads: expected % related reads, found %', expected, actual;
  end if;

  select count(*) into skipped_editions
  from user_related_work_editions urwe
  where exists (
    select 1 from user_book_editions ube
    where ube.user_id = urwe.user_id
      and ube.edition_id = urwe.edition_id
      and ube.work_id <> urwe.related_work_id
  );
  select count(*) into expected from user_related_work_editions;
  select count(*) into actual
  from user_book_editions ube
  join works w on w.id = ube.work_id
  where w.kind = 'related';
  if actual + skipped_editions <> expected then
    raise exception 'user_book_editions: expected % related editions (% skipped), found %',
      expected, skipped_editions, actual;
  end if;
  if skipped_editions > 0 then
    raise notice 'user_book_editions: skipped % related editions already held against a King work', skipped_editions;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 10. Drop the old related tables, views, and functions
-- ---------------------------------------------------------------------------
-- user_related_works' own triggers go with the table.

drop view related_work_stats;
drop table user_related_work_editions;
drop table user_related_works;
drop table related_work_omnibus_works;
drop table related_works;
drop function cascade_related_work_reads_on_omnibus_read();
drop function uncascade_related_work_reads_on_omnibus_unread();
