create function public.delete_test_company(p_company uuid)
returns void
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  if not exists (select 1 from public.companies where id = p_company and name like 'itest-%') then
    raise exception 'Only existing itest- companies can be deleted';
  end if;

  perform set_config('session_replication_role', 'replica', true);

  delete from public.app_sessions where user_id in (select id from public.profiles where company_id = p_company);
  delete from public.user_stores where company_id = p_company;
  delete from public.products where company_id = p_company;
  delete from public.categories where company_id = p_company;
  delete from public.stores where company_id = p_company;
  delete from public.sites where company_id = p_company;
  delete from public.role_company_exclusions where company_id = p_company;
  delete from public.company_admins where company_id = p_company;
  delete from public.companies where id = p_company;

  perform set_config('session_replication_role', 'origin', true);
end;
$$;

revoke execute on function public.delete_test_company(uuid) from public, anon, authenticated;
grant execute on function public.delete_test_company(uuid) to service_role;
