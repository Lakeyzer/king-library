alter table king_works alter column shuffle_position set not null;
alter table king_works add constraint king_works_shuffle_position_key unique (shuffle_position);

-- Assigns the next available shuffle_position automatically when a new
-- king_work is inserted without one, so adding a book to the seed file never
-- needs to know (or update) the current max - see design.md "Book of the
-- week: shuffle_position + ISO week modulo".
create function assign_shuffle_position()
returns trigger
language plpgsql
as $$
begin
  if new.shuffle_position is null then
    select coalesce(max(shuffle_position), -1) + 1 into new.shuffle_position from king_works;
  end if;
  return new;
end;
$$;

create trigger king_works_assign_shuffle_position
  before insert on king_works
  for each row
  execute function assign_shuffle_position();
