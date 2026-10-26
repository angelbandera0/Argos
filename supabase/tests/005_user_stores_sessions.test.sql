select plan(22);

create temp table ctx (k text primary key, v uuid);
grant all on ctx to public;

insert into ctx values
  ('ana', tests.create_user('admin', 'ana@test.dev')),
  ('cris', tests.create_user('admin', 'cris@test.dev'));

insert into companies (id, name, code, founder_id, session_cap_seconds) values
  ('00000000-0000-0000-0000-0000000000a1', 'Alfa', 'k7m2', (select v from ctx where k = 'ana'), 86400),
  ('00000000-0000-0000-0000-0000000000b2', 'Beta', 'b2b2', (select v from ctx where k = 'ana'), 7200);

insert into company_admins (company_id, admin_id, granted_by) values
  ('00000000-0000-0000-0000-0000000000a1', (select v from ctx where k = 'ana'), (select v from ctx where k = 'ana')),
  ('00000000-0000-0000-0000-0000000000a1', (select v from ctx where k = 'cris'), (select v from ctx where k = 'ana')),
  ('00000000-0000-0000-0000-0000000000b2', (select v from ctx where k = 'ana'), (select v from ctx where k = 'ana'));

insert into ctx values
  ('op1', tests.create_user('operator', 'caja1@test.dev', '00000000-0000-0000-0000-0000000000a1')),
  ('op2', tests.create_user('operator', 'caja2@test.dev', '00000000-0000-0000-0000-0000000000a1')),
  ('op3', tests.create_user('operator', 'caja3@test.dev', '00000000-0000-0000-0000-0000000000b2'));

insert into sites (id, company_id, name) values
  ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000a1', 'Norte'),
  ('00000000-0000-0000-0000-0000000000c2', '00000000-0000-0000-0000-0000000000b2', 'Sede B');

insert into stores (id, company_id, site_id, name) values
  ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c1', 'Caja 1'),
  ('00000000-0000-0000-0000-0000000000f2', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c1', 'Caja 2'),
  ('00000000-0000-0000-0000-0000000000f4', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c1', 'Caja 4'),
  ('00000000-0000-0000-0000-0000000000f9', '00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-0000000000c2', 'Caja B');

insert into roles (id, owner_id, name, session_seconds) values
  ('00000000-0000-0000-0000-0000000000d1', (select v from ctx where k = 'ana'), 'Cajero', null),
  ('00000000-0000-0000-0000-0000000000d2', (select v from ctx where k = 'ana'), 'Turno corto', 3600),
  ('00000000-0000-0000-0000-0000000000d3', (select v from ctx where k = 'ana'), 'Excluido', null),
  ('00000000-0000-0000-0000-0000000000d4', (select v from ctx where k = 'cris'), 'De Cris', null);
insert into role_permissions (role_id, module, can_view, can_create) values
  ('00000000-0000-0000-0000-0000000000d1', 'products', true, false),
  ('00000000-0000-0000-0000-0000000000d2', 'products', true, true);
insert into role_company_exclusions values ('00000000-0000-0000-0000-0000000000d3', '00000000-0000-0000-0000-0000000000a1');

select throws_ok($$insert into user_stores (user_id, store_id, company_id, role_id) values ((select v from ctx where k = 'op1'), '00000000-0000-0000-0000-0000000000f9', '00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-0000000000d1')$$,
  '23503', null, 'assigning a user to a store of another company fails');
select throws_ok($$insert into user_stores (user_id, store_id, company_id, role_id) values ((select v from ctx where k = 'op1'), '00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000d3')$$,
  'P0001', 'ROLE_EXCLUDED', 'ROLE_EXCLUDED: a role excluded from the company cannot be assigned');

insert into user_stores (user_id, store_id, company_id, role_id) values
  ((select v from ctx where k = 'op1'), '00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000d1'),
  ((select v from ctx where k = 'op1'), '00000000-0000-0000-0000-0000000000f2', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000d2'),
  ((select v from ctx where k = 'op1'), '00000000-0000-0000-0000-0000000000f4', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000d1'),
  ((select v from ctx where k = 'op2'), '00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000d1'),
  ((select v from ctx where k = 'op3'), '00000000-0000-0000-0000-0000000000f9', '00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-0000000000d1');

insert into app_sessions (session_id, user_id, started_at, active_store_id, ended_at) values
  ('00000000-0000-0000-0000-0000000005a1', (select v from ctx where k = 'op1'), now(), '00000000-0000-0000-0000-0000000000f1', null),
  ('00000000-0000-0000-0000-0000000005a2', (select v from ctx where k = 'op1'), now(), '00000000-0000-0000-0000-0000000000f2', null),
  ('00000000-0000-0000-0000-0000000005a3', (select v from ctx where k = 'op3'), now(), '00000000-0000-0000-0000-0000000000f9', null),
  ('00000000-0000-0000-0000-0000000005a4', (select v from ctx where k = 'op1'), now(), '00000000-0000-0000-0000-0000000000f1', now()),
  ('00000000-0000-0000-0000-0000000005a5', (select v from ctx where k = 'op1'), now() - interval '2 days', '00000000-0000-0000-0000-0000000000f1', null),
  ('00000000-0000-0000-0000-0000000005a6', (select v from ctx where k = 'op1'), now(), null, null),
  ('00000000-0000-0000-0000-0000000005a7', (select v from ctx where k = 'op1'), now(), '00000000-0000-0000-0000-0000000000f4', null),
  ('00000000-0000-0000-0000-0000000005a8', (select v from ctx where k = 'op2'), now(), '00000000-0000-0000-0000-0000000000f1', null);

select is(app.session_expiry('00000000-0000-0000-0000-0000000005a1'), (select started_at + interval '1 day' from app_sessions where session_id = '00000000-0000-0000-0000-0000000005a1'),
  'expiry with cap 86400 and null role is started_at + 1 day');
select is(app.session_expiry('00000000-0000-0000-0000-0000000005a2'), (select started_at + interval '1 hour' from app_sessions where session_id = '00000000-0000-0000-0000-0000000005a2'),
  'expiry with a 3600 s role is +1 h');
select is(app.session_expiry('00000000-0000-0000-0000-0000000005a3'), (select started_at + interval '2 hours' from app_sessions where session_id = '00000000-0000-0000-0000-0000000005a3'),
  'expiry with a 7200 s company cap is +2 h');
select is(app.session_expiry('00000000-0000-0000-0000-0000000005a6'), (select started_at + interval '1 day' from app_sessions where session_id = '00000000-0000-0000-0000-0000000005a6'),
  'expiry without an active store is started_at + 1 day');

update stores set status = 'inactive', status_reason_code = 'otro', status_reason_text = 'cierre' where id = '00000000-0000-0000-0000-0000000000f4';

select tests.authenticate_as((select v from ctx where k = 'op1'), 'aal1', '00000000-0000-0000-0000-0000000005a1');
select is(app.session_active(), true, 'a live session is active');
select is((select count(*)::int from stores), 3, 'with an active session the operator sees all assigned non-deleted stores');
select is(app.can('00000000-0000-0000-0000-0000000000a1', 'products', 'view'), true, 'can view with the role of the active store');
select is(app.can('00000000-0000-0000-0000-0000000000a1', 'products', 'create'), false, 'cannot create when the role lacks it');
select is(app.can('00000000-0000-0000-0000-0000000000b2', 'products', 'view'), false, 'cannot for another company');
select is((select count(*)::int from user_stores where user_id <> (select v from ctx where k = 'op1')), 0, 'an operator sees only their own user_stores');
select is((select count(*)::int from app_sessions where user_id <> (select v from ctx where k = 'op1')), 0, 'an operator sees only their own sessions');

select tests.authenticate_as((select v from ctx where k = 'op1'), 'aal1', '00000000-0000-0000-0000-0000000005a2');
select is(app.can('00000000-0000-0000-0000-0000000000a1', 'products', 'create'), true, 'changing the active store changes the role used');

select tests.authenticate_as((select v from ctx where k = 'op1'), 'aal1', '00000000-0000-0000-0000-0000000005a4');
select is(app.session_active(), false, 'Review Focus 3: ended_at set makes the session inactive');
select is((select count(*)::int from stores), 0, 'Review Focus 3: a valid JWT with an ended session reads 0 stores');

select tests.authenticate_as((select v from ctx where k = 'op1'), 'aal1', '00000000-0000-0000-0000-0000000005a5');
select is(app.session_active(), false, 'a session past its expiry is inactive');
select is((select count(*)::int from stores), 0, 'an expired session reads 0 stores');

select tests.authenticate_as((select v from ctx where k = 'op1'), 'aal1', '00000000-0000-0000-0000-0000000005a6');
select is(app.can('00000000-0000-0000-0000-0000000000a1', 'products', 'view'), false, 'cannot without an active store');

select tests.authenticate_as((select v from ctx where k = 'op1'), 'aal1', '00000000-0000-0000-0000-0000000005a7');
select is(app.can('00000000-0000-0000-0000-0000000000a1', 'products', 'view'), false, 'cannot when the store is not operational');
select throws_ok($$update app_sessions set active_store_id = '00000000-0000-0000-0000-0000000000f4' where session_id = '00000000-0000-0000-0000-0000000005a6'$$,
  'P0001', 'STORE_NOT_OPERATIONAL', 'an inactive store cannot be made active');

select tests.authenticate_as((select v from ctx where k = 'cris'));
select throws_ok($$insert into user_stores (user_id, store_id, company_id, role_id) values ((select v from ctx where k = 'op2'), '00000000-0000-0000-0000-0000000000f2', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000d1')$$,
  '42501', null, 'only the role owner can assign that role');

select tests.clear_auth();
select * from finish();
