-- Canonical, manually-curated list of "By Other Hands" works: material
-- connected to King's world but not written by him (Dark Tower comics,
-- companion/reference books, authorized tie-in novels). Deliberately a
-- separate table from king_works, not a discriminator column on it - see
-- add-by-other-hands's design.md "Why not fold these into
-- king_works/user_books with a discriminator column?".
create table related_works (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  creator text not null,
  category text not null check (category in ('comic', 'reference', 'tie_in_novel')),
  publish_date date,
  slug text not null unique,
  open_library_work_key text,
  cover_id integer,
  description text,
  relation_note text,
  active boolean not null default true,
  -- Same overloaded-flag pattern as king_works.type = 'omnibus': true for a
  -- row that collects other related_works rows (see
  -- related_work_omnibus_works) rather than being independently authored
  -- content of its own. Orthogonal to `category` - an omnibus of comics is
  -- still category = 'comic', just also an omnibus.
  is_omnibus boolean not null default false
);

alter table related_works enable row level security;

create policy "related_works readable by everyone"
  on related_works for select
  using (true);
