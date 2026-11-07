create function public.is_eligible_buyer(p_company uuid, p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select (app.is_company_admin(p_company) or app.has_special('build_orders')) and app.is_eligible_buyer(p_company, p_user)
$$;

revoke execute on function public.is_eligible_buyer(uuid, uuid) from public, anon;
grant execute on function public.is_eligible_buyer(uuid, uuid) to authenticated;
