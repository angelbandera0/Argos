select plan(15);

create temp table ctx (k text primary key, v uuid);
grant all on ctx to public;

insert into ctx values
  ('ana', tests.create_user('admin', 'ana@test.dev')),
  ('cris', tests.create_user('admin', 'cris@test.dev'));

insert into companies (id, name, code, founder_id) values
  ('00000000-0000-0000-0000-0000000000a1', 'Alfa', 'k7m2', (select v from ctx where k = 'ana'));
insert into company_admins (company_id, admin_id, granted_by) values
  ('00000000-0000-0000-0000-0000000000a1', (select v from ctx where k = 'ana'), (select v from ctx where k = 'ana')),
  ('00000000-0000-0000-0000-0000000000a1', (select v from ctx where k = 'cris'), (select v from ctx where k = 'ana'));

insert into ctx values
  ('op1', tests.create_user('operator', 'caja1@test.dev', '00000000-0000-0000-0000-0000000000a1')),
  ('op2', tests.create_user('operator', 'caja2@test.dev', '00000000-0000-0000-0000-0000000000a1'));

insert into sites (id, company_id, name) values ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000a1', 'Norte');
insert into stores (id, company_id, site_id, name) values
  ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c1', 'Caja 1'),
  ('00000000-0000-0000-0000-0000000000f2', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c1', 'Caja 2');
insert into roles (id, owner_id, name, session_seconds) values
  ('00000000-0000-0000-0000-0000000000d1', (select v from ctx where k = 'ana'), 'Cajero', 3600),
  ('00000000-0000-0000-0000-0000000000d2', (select v from ctx where k = 'ana'), 'Otro', null),
  ('00000000-0000-0000-0000-0000000000d4', (select v from ctx where k = 'cris'), 'De Cris', null);
insert into role_permissions (role_id, module, can_view, can_create) values
  ('00000000-0000-0000-0000-0000000000d1', 'products', true, true);
insert into user_stores (user_id, store_id, company_id, role_id) values
  ((select v from ctx where k = 'op1'), '00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000d1'),
  ((select v from ctx where k = 'op1'), '00000000-0000-0000-0000-0000000000f2', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000d1');
insert into app_sessions (session_id, user_id, started_at, active_store_id) values
  ('00000000-0000-0000-0000-0000000005b1', (select v from ctx where k = 'op1'), now(), '00000000-0000-0000-0000-0000000000f2');

select tests.authenticate_as((select v from ctx where k = 'op1'), 'aal1');
select is((select count(*)::int from my_store_access()), 2, 'my_store_access lists the operator assignments');
select is((select permissions -> 'products' ->> 'create' from my_store_access('00000000-0000-0000-0000-0000000000f1')), 'true', 'my_store_access returns the role permissions');
select is((select role_session_seconds from my_store_access('00000000-0000-0000-0000-0000000000f1')), 3600, 'my_store_access returns the role session seconds');

select tests.authenticate_as((select v from ctx where k = 'ana'));
select is((select count(*)::int from my_store_access()), 0, 'an admin gets no rows from my_store_access');
select throws_ok($$select assign_user_stores((select v from ctx where k = 'op1'), '[{"store_id":"00000000-0000-0000-0000-0000000000f1","role_id":"00000000-0000-0000-0000-0000000000d1"},{"store_id":"00000000-0000-0000-0000-0000000000f1","role_id":"00000000-0000-0000-0000-0000000000d2"}]'::jsonb)$$,
  '23505', null, 'duplicate stores are rejected');
select lives_ok($$select assign_user_stores((select v from ctx where k = 'op1'), '[{"store_id":"00000000-0000-0000-0000-0000000000f1","role_id":"00000000-0000-0000-0000-0000000000d2"}]'::jsonb)$$,
  'the role owner replaces the assignments');
select is((select count(*)::int from user_stores where user_id = (select v from ctx where k = 'op1') and role_id = '00000000-0000-0000-0000-0000000000d2'), 1, 'assignment kept with the new role');
select is((select count(*)::int from user_stores where user_id = (select v from ctx where k = 'op1')), 1, 'removed assignment is gone');

select tests.clear_auth();
select is((select active_store_id from app_sessions where session_id = '00000000-0000-0000-0000-0000000005b1'), null, 'the session on a removed store loses its active store');

select tests.authenticate_as((select v from ctx where k = 'cris'));
select throws_ok($$select assign_user_stores((select v from ctx where k = 'op1'), '[]'::jsonb)$$, '42501', null, 'REQ-007 CA-11: another admin cannot wipe assignments using a role they do not own');
delete from user_stores where user_id = (select v from ctx where k = 'op1');
select tests.clear_auth();
select is((select count(*)::int from user_stores where user_id = (select v from ctx where k = 'op1')), 1, 'a non-owner admin cannot delete an assignment');

select tests.authenticate_as((select v from ctx where k = 'op1'), 'aal1');
select throws_ok($$select assign_user_stores((select v from ctx where k = 'op2'), '[]'::jsonb)$$, '42501', null, 'an operator cannot assign stores');

select tests.authenticate_as((select v from ctx where k = 'ana'));
select lives_ok($$select set_operator_status((select v from ctx where k = 'op2'), 'deactivated')$$, 'an admin deactivates an operator');
select throws_ok($$select set_operator_status((select v from ctx where k = 'op2'), 'active')$$, '22023', null, 'a deactivated operator cannot be reactivated');
select throws_ok($$select set_operator_status((select v from ctx where k = 'op1'), 'active')$$, '22023', null, 'unlock requires a locked operator');

select tests.clear_auth();
select * from finish();
