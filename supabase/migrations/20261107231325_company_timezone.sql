alter table public.companies add column timezone text not null default 'UTC';

create function app.companies_check_timezone() returns trigger
language plpgsql set search_path = '' as $$
begin
  if not exists (select 1 from pg_catalog.pg_timezone_names n where n.name = new.timezone) then
    raise exception 'invalid time zone: %', new.timezone using errcode = '22023';
  end if;
  return new;
end $$;

create trigger companies_check_timezone before insert or update of timezone on public.companies
  for each row execute function app.companies_check_timezone();
