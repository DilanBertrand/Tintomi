-- New accounts get a readable username derived from their email address
-- (bob.green@x.com -> "Bob green", BobGreen42@x.com -> "Bob green").
-- Explicit signup metadata (username / full_name) still wins when present.

create or replace function public.username_from_email(email_addr text)
returns text
language plpgsql
immutable
as $$
declare
  s text;
begin
  s := split_part(coalesce(email_addr, ''), '@', 1);
  s := regexp_replace(s, '([a-z])([A-Z])', '\1 \2', 'g');   -- camelCase -> words
  s := regexp_replace(s, '[^A-Za-z]+', ' ', 'g');            -- dots, digits, symbols -> space
  s := trim(regexp_replace(s, '\s+', ' ', 'g'));
  if s = '' then
    return null;
  end if;
  return upper(left(s, 1)) || lower(substr(s, 2));
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_name text;
  candidate text;
  n int := 1;
begin
  base_name := nullif(trim(coalesce(new.raw_user_meta_data->>'username', '')), '');
  if base_name is null then
    base_name := public.username_from_email(new.email);
  end if;

  candidate := base_name;
  -- username is unique: append a counter until it is free.
  while candidate is not null
    and exists (select 1 from public.profiles where lower(username) = lower(candidate)) loop
    n := n + 1;
    candidate := base_name || ' ' || n;
  end loop;

  insert into public.profiles (id, full_name, username)
  values (
    new.id,
    nullif(trim(coalesce(new.raw_user_meta_data->>'full_name', '')), ''),
    candidate
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
