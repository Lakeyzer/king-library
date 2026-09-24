-- Marks the By Other Hands works that belong to the Dark Tower (Marvel's
-- Dark Tower comics and omnibuses, plus Dark Tower companion books), same
-- meaning as king_works.dark_tower. Lets the Dark Tower page show only its
-- own graphic novels and progress while /works-by-others and the profile
-- keep covering every related work (e.g. Marvel's The Stand comics).
-- Populated via supabase/seed/related_works.json.
alter table related_works
  add column dark_tower boolean not null default false;
