select plan(8);

select ok(not has_table_privilege('anon', 'public.role_permissions', 'select'), 'anon: no access to role_permissions');
select ok(not has_table_privilege('anon', 'public.profiles', 'select'), 'anon: no access to profiles');
select ok(not has_table_privilege('authenticated', 'public.role_permissions', 'delete'), 'role_permissions: no delete');
select ok(has_table_privilege('authenticated', 'public.role_permissions', 'insert') and has_table_privilege('authenticated', 'public.role_permissions', 'update'), 'role_permissions: upsert kept');
select ok(not has_table_privilege('authenticated', 'public.app_sessions', 'delete'), 'app_sessions: no delete');
select ok(not has_table_privilege('authenticated', 'public.role_company_exclusions', 'update'), 'role_company_exclusions: no update');
select ok(not has_table_privilege('authenticated', 'public.roles', 'truncate'), 'roles: no truncate');
select ok(has_table_privilege('authenticated', 'public.roles', 'update'), 'roles: update kept');

select * from finish();
