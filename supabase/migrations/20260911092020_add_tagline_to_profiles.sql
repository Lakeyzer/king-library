alter table profiles add column tagline text;
alter table profiles add constraint profiles_tagline_length check (tagline is null or char_length(tagline) <= 50);
