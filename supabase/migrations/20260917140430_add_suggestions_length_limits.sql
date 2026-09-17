alter table suggestions
  add constraint suggestions_title_max_length check (char_length(title) <= 100),
  add constraint suggestions_body_max_length check (char_length(body) <= 1000);
