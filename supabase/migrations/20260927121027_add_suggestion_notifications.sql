-- Admin responses on suggestions, an in-app notifications table fed by a
-- trigger on suggestions, and per-user email preferences. See the
-- suggestion-notifications change's design.md.

-- ---------------------------------------------------------------------------
-- Admin response on suggestions
-- ---------------------------------------------------------------------------

-- One optional response per suggestion. null means "no response" - the
-- client sends null for a cleared/blank response, so a stored value is
-- always non-blank. admin_comment_updated_at is stamped by the trigger
-- below, never supplied by the client.
alter table suggestions
  add column admin_comment text,
  add column admin_comment_updated_at timestamptz,
  add constraint suggestions_admin_comment_valid check (
    admin_comment is null
    or (char_length(btrim(admin_comment)) > 0 and char_length(admin_comment) <= 1000)
  );

create function stamp_suggestion_admin_comment_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.admin_comment is distinct from old.admin_comment then
    new.admin_comment_updated_at := case when new.admin_comment is null then null else now() end;
  end if;
  return new;
end;
$$;

create trigger suggestions_stamp_admin_comment_updated_at
  before update on suggestions
  for each row
  execute function stamp_suggestion_admin_comment_updated_at();

-- Widens the column-level grant from create_suggestions_table (status only)
-- to also cover admin_comment. The existing "suggestions status updatable by
-- admin" policy still limits which rows - and so which users - can update
-- either column. admin_comment_updated_at needs no grant: it's only ever
-- written by the before-update trigger above, not by the UPDATE statement.
grant update (status, admin_comment) on suggestions to authenticated;

-- ---------------------------------------------------------------------------
-- Notifications
-- ---------------------------------------------------------------------------

-- suggestion_title / status / admin_comment are snapshots taken when the
-- notification is created, so a notification keeps reading correctly after
-- the suggestion is edited again. status is set for
-- suggestion_status_changed rows, admin_comment for suggestion_commented
-- rows. email_sent_at is written only by the server route that emails
-- status changes (service role), and marks a row as already emailed.
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null,
  suggestion_id uuid not null references suggestions (id) on delete cascade,
  suggestion_title text not null,
  status text,
  admin_comment text,
  read_at timestamptz,
  email_sent_at timestamptz,
  created_at timestamptz not null default now(),
  constraint notifications_type_valid check (type in ('suggestion_status_changed', 'suggestion_commented'))
);

create index notifications_user_created_idx on notifications (user_id, created_at desc);
create index notifications_user_unread_idx on notifications (user_id) where read_at is null;
create index notifications_suggestion_idx on notifications (suggestion_id);

alter table notifications enable row level security;

-- Owner-only read and update. No insert or delete policy: rows are only
-- ever created by notify_on_suggestion_update() below (security definer)
-- and only removed via the suggestion/user cascades.
create policy "notifications readable by owner"
  on notifications for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "notifications updatable by owner"
  on notifications for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Same revoke/grant narrowing as suggestions' status column: the owner can
-- mark their notifications read, and nothing else.
revoke update on notifications from authenticated;
grant update (read_at) on notifications to authenticated;

-- security definer because authenticated has no insert policy on
-- notifications - this trigger is the only writer. The author is notified
-- even when the admin making the change is the author themselves (the
-- single admin rarely submits suggestions, and a notification about your
-- own change is harmless).
create function notify_on_suggestion_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    insert into public.notifications (user_id, type, suggestion_id, suggestion_title, status)
    values (new.user_id, 'suggestion_status_changed', new.id, new.title, new.status);
  end if;

  if new.admin_comment is distinct from old.admin_comment and new.admin_comment is not null then
    insert into public.notifications (user_id, type, suggestion_id, suggestion_title, admin_comment)
    values (new.user_id, 'suggestion_commented', new.id, new.title, new.admin_comment);
  end if;

  return new;
end;
$$;

create trigger suggestions_notify_on_update
  after update of status, admin_comment on suggestions
  for each row
  execute function notify_on_suggestion_update();

-- ---------------------------------------------------------------------------
-- Email preferences
-- ---------------------------------------------------------------------------

-- One row per user, one boolean column per email type. A missing row means
-- every column's default - rows are only created (upserted) the first time
-- a user changes a toggle, so there's no sign-up trigger or backfill. A new
-- email type is one `add column ... boolean not null default true`.
-- Owner-only, unlike profiles, so a user's email settings stay private.
create table email_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  suggestion_updates boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table email_preferences enable row level security;

create policy "email_preferences readable by owner"
  on email_preferences for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "email_preferences insertable by owner"
  on email_preferences for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "email_preferences updatable by owner"
  on email_preferences for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Read view
-- ---------------------------------------------------------------------------

-- Appends the response columns; every existing column keeps its name,
-- position and definition (create or replace view can only append).
create or replace view suggestions_with_author
  with (security_invoker = true)
  as
  select
    s.id,
    s.title,
    s.body,
    s.is_anonymous,
    s.status,
    s.created_at,
    case when s.is_anonymous then null else p.username end as username,
    coalesce(vc.upvote_count, 0) as upvote_count,
    coalesce(vc.downvote_count, 0) as downvote_count,
    coalesce(vc.score, 0) as score,
    mv.is_upvote as my_vote,
    s.admin_comment,
    s.admin_comment_updated_at
  from suggestions s
  left join profiles p on p.id = s.user_id
  left join suggestion_vote_counts vc on vc.suggestion_id = s.id
  left join suggestion_votes mv on mv.suggestion_id = s.id and mv.user_id = auth.uid();

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------

-- Streams notifications changes to Supabase Realtime, so the header's unread
-- dot updates live (useNotifications().subscribeToUnread()). Realtime's
-- Postgres Changes checks each subscriber's select policy before sending a
-- change, so the owner-only policy above keeps every user to their own rows.
alter publication supabase_realtime add table notifications;
