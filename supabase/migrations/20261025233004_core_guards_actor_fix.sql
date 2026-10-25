create or replace function app.guard_org_actor()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  cid uuid := (to_jsonb(new) ->> case tg_table_name when 'companies' then 'id' else 'company_id' end)::uuid;
begin
  if (new.status is distinct from old.status or new.deleted_at is distinct from old.deleted_at)
     and auth.uid() is not null
     and not (
       app.is_superadmin()
       or (app.is_aal2() and exists (
         select 1 from public.companies where id = cid and founder_id = auth.uid()
       ))
     ) then
    raise exception 'Only the company founder or the superadmin can change status or delete'
      using errcode = '42501';
  end if;
  return new;
end;
$$;
