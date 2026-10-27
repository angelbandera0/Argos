create function public.revoke_user_sessions(p_user_id uuid)
returns void
language sql
security definer
set search_path = pg_catalog
as $$
  delete from auth.sessions where user_id = p_user_id;
$$;

revoke execute on function public.revoke_user_sessions(uuid) from public, anon, authenticated;
grant execute on function public.revoke_user_sessions(uuid) to service_role;
