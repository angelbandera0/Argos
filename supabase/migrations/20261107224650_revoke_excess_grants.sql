revoke all on public.app_sessions, public.companies, public.company_admins, public.profiles, public.role_company_exclusions,
  public.role_permissions, public.role_special_permissions, public.roles, public.sites, public.stores, public.user_stores from anon;

revoke truncate, references, trigger on public.companies, public.company_admins, public.profiles, public.role_special_permissions,
  public.roles, public.sites, public.stores, public.user_stores from authenticated;

revoke all on public.app_sessions from authenticated;
grant select on public.app_sessions to authenticated;
grant insert (session_id, user_id) on public.app_sessions to authenticated;
grant update (active_store_id, ended_at) on public.app_sessions to authenticated;

revoke all on public.role_permissions from authenticated;
grant select, insert, update on public.role_permissions to authenticated;

revoke all on public.role_company_exclusions from authenticated;
grant select, insert, delete on public.role_company_exclusions to authenticated;
