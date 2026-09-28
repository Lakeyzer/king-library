-- Followers list, a "new follower" notification fed by a trigger on
-- user_follows, and a "New followers" email preference. See the
-- add-followers-and-settings-pages change's design.md.

-- ---------------------------------------------------------------------------
-- user_follows: the followed user can read who follows them
-- ---------------------------------------------------------------------------

-- One combined permissive policy instead of two. A follow row between two
-- other users stays invisible, so nobody can see another user's followers.
drop policy "user_follows readable by follower" on user_follows;

create policy "user_follows readable by follower or followed"
  on user_follows for select
  to authenticated
  using ((select auth.uid()) in (follower_id, followed_id));

-- Serves the Followers tab (filter on followed_id, newest first). The
-- existing unique (follower_id, followed_id) already covers the follower side.
create index user_follows_followed_created_idx on user_follows (followed_id, created_at desc);

-- ---------------------------------------------------------------------------
-- notifications: more than one subject
-- ---------------------------------------------------------------------------

-- actor_id references profiles (not auth.users) so PostgREST can embed the
-- actor's current username/avatar, and so deleting the actor's account
-- (auth.users -> profiles cascade) removes their notifications. No username
-- snapshot is stored, unlike suggestion_title.
alter table notifications
  alter column suggestion_id drop not null,
  alter column suggestion_title drop not null,
  add column actor_id uuid references profiles (id) on delete cascade,
  drop constraint notifications_type_valid,
  add constraint notifications_type_valid check (
    type in ('suggestion_status_changed', 'suggestion_commented', 'new_follower')
  ),
  add constraint notifications_subject_valid check (
    (type = 'new_follower' and actor_id is not null and suggestion_id is null)
    or (type <> 'new_follower' and suggestion_id is not null and suggestion_title is not null)
  );

-- Covers the actor cascade, notify_on_follow()'s de-duplication lookup and
-- POST /api/follows' lookup of the row it should email about.
create index notifications_actor_idx on notifications (actor_id, user_id, created_at desc)
  where actor_id is not null;

-- security definer because authenticated has no insert policy on
-- notifications, and the de-duplication lookup reads the followed user's
-- rows. Skips the insert when this follower already produced a new_follower
-- notification for this user in the last 24 hours, so unfollow/follow
-- toggling can't spam notifications (or the emails sent for them).
create function notify_on_follow()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.notifications n
    where n.type = 'new_follower'
      and n.user_id = new.followed_id
      and n.actor_id = new.follower_id
      and n.created_at > now() - interval '24 hours'
  ) then
    insert into public.notifications (user_id, type, actor_id)
    values (new.followed_id, 'new_follower', new.follower_id);
  end if;

  return new;
end;
$$;

create trigger user_follows_notify_on_insert
  after insert on user_follows
  for each row
  execute function notify_on_follow();

-- ---------------------------------------------------------------------------
-- Email preferences
-- ---------------------------------------------------------------------------

-- Existing rows read true, and a missing row still means all defaults.
alter table email_preferences
  add column new_followers boolean not null default true;
