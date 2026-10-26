create or replace function public.delete_test_company(p_company uuid)
returns void
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  if not exists (select 1 from public.companies where id = p_company and name like 'itest-%') then
    raise exception 'Only existing itest- companies can be deleted';
  end if;

  alter table public.company_admins disable trigger company_admins_guard_founder;

  delete from public.app_sessions where user_id in (select id from public.profiles where company_id = p_company);
  delete from public.user_stores where company_id = p_company;
  delete from public.products where company_id = p_company;
  delete from public.categories where company_id = p_company;
  delete from public.stores where company_id = p_company;
  delete from public.sites where company_id = p_company;
  delete from public.role_company_exclusions where company_id = p_company;
  delete from public.company_admins where company_id = p_company;
  delete from public.companies where id = p_company;

  alter table public.company_admins enable trigger company_admins_guard_founder;
end;
$$;
