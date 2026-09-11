alter table profiles drop constraint profiles_username_format;
alter table profiles add constraint profiles_username_format check (
  username is null or username ~ '^[a-zA-Z0-9_]{3,24}$'
);

alter table profiles drop constraint profiles_username_key;
alter table profiles add column username_lower text generated always as (lower(username)) stored;
alter table profiles add constraint profiles_username_lower_unique unique (username_lower);
