select plan(32);

create temp table ctx (k text primary key, v uuid);
grant all on ctx to public;

insert into ctx values
  ('sup', tests.create_user('superadmin', 'root@test.dev')),
  ('ana', tests.create_user('admin', 'ana@test.dev')),
  ('cris', tests.create_user('admin', 'cris@test.dev')),
  ('dan', tests.create_user('admin', 'dan@test.dev'));

insert into companies (id, name, code, founder_id) values
  ('00000000-0000-0000-0000-0000000000a1', 'Alfa', 'k7m2', (select v from ctx where k = 'ana')),
  ('00000000-0000-0000-0000-0000000000b2', 'Beta', 'b2b2', (select v from ctx where k = 'dan')),
  ('00000000-0000-0000-0000-0000000000c3', 'Gama', 'g3g3', (select v from ctx where k = 'ana'));

insert into company_admins (company_id, admin_id, granted_by) values
  ('00000000-0000-0000-0000-0000000000a1', (select v from ctx where k = 'ana'), (select v from ctx where k = 'ana')),
  ('00000000-0000-0000-0000-0000000000a1', (select v from ctx where k = 'cris'), (select v from ctx where k = 'ana')),
  ('00000000-0000-0000-0000-0000000000b2', (select v from ctx where k = 'dan'), (select v from ctx where k = 'dan')),
  ('00000000-0000-0000-0000-0000000000c3', (select v from ctx where k = 'ana'), (select v from ctx where k = 'ana'));

insert into ctx values
  ('op1', tests.create_user('operator', 'viewer@test.dev', '00000000-0000-0000-0000-0000000000a1')),
  ('op3', tests.create_user('operator', 'noview@test.dev', '00000000-0000-0000-0000-0000000000a1')),
  ('op4', tests.create_user('operator', 'full@test.dev', '00000000-0000-0000-0000-0000000000a1'));

insert into sites (id, company_id, name) values
  ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000a1', 'Norte');
insert into stores (id, company_id, site_id, name) values
  ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c1', 'Caja 1');

insert into roles (id, owner_id, name) values
  ('00000000-0000-0000-0000-0000000000d1', (select v from ctx where k = 'ana'), 'Viewer'),
  ('00000000-0000-0000-0000-0000000000d3', (select v from ctx where k = 'ana'), 'NoView'),
  ('00000000-0000-0000-0000-0000000000d4', (select v from ctx where k = 'ana'), 'Full');
insert into role_permissions (role_id, module, can_view, can_create, can_edit, can_delete) values
  ('00000000-0000-0000-0000-0000000000d1', 'products', true, false, false, false),
  ('00000000-0000-0000-0000-0000000000d4', 'products', true, true, true, true);

insert into user_stores (user_id, store_id, company_id, role_id) values
  ((select v from ctx where k = 'op1'), '00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000d1'),
  ((select v from ctx where k = 'op3'), '00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000d3'),
  ((select v from ctx where k = 'op4'), '00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000d4');

insert into app_sessions (session_id, user_id, active_store_id) values
  ('00000000-0000-0000-0000-0000000005a1', (select v from ctx where k = 'op1'), '00000000-0000-0000-0000-0000000000f1'),
  ('00000000-0000-0000-0000-0000000005a3', (select v from ctx where k = 'op3'), '00000000-0000-0000-0000-0000000000f1'),
  ('00000000-0000-0000-0000-0000000005a4', (select v from ctx where k = 'op4'), '00000000-0000-0000-0000-0000000000f1');

insert into categories (id, company_id, name) values
  ('00000000-0000-0000-0000-000000000e01', '00000000-0000-0000-0000-0000000000a1', 'Pan');
insert into products (id, company_id, category_id, name) values
  ('00000000-0000-0000-0000-000000000f01', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000e01', 'Leche'),
  ('00000000-0000-0000-0000-000000000f02', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000e01', 'Queso');

select ok((select count(*) from audit_log where entity_type = 'companies' and action = 'create' and actor_id is null and channel = 'system' and entity_id in ('00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000b2','00000000-0000-0000-0000-0000000000c3')) = 3,
  'writes without auth.uid() are logged as system with null actor');
select is((select count(*)::int from audit_log where entity_type = 'role_permissions' and entity_id in ('00000000-0000-0000-0000-0000000000d1','00000000-0000-0000-0000-0000000000d4')), 2, 'every audited table logs inserts');

select tests.authenticate_as((select v from ctx where k = 'op4'), 'aal1', '00000000-0000-0000-0000-0000000005a4');
update products set name = 'Leche entera' where id = '00000000-0000-0000-0000-000000000f01';
select tests.clear_auth();

select is((select count(*)::int from audit_log where entity_id = '00000000-0000-0000-0000-000000000f01' and action = 'update'), 1, 'REQ-009 CA-01: renaming a product logs one update');
select is((select before ->> 'name' from audit_log where entity_id = '00000000-0000-0000-0000-000000000f01' and action = 'update'), 'Leche', 'CA-01: before.name');
select is((select after ->> 'name' from audit_log where entity_id = '00000000-0000-0000-0000-000000000f01' and action = 'update'), 'Leche entera', 'CA-01: after.name');
select is((select actor_id from audit_log where entity_id = '00000000-0000-0000-0000-000000000f01' and action = 'update'), (select v from ctx where k = 'op4'), 'CA-01: actor_id');
select is((select store_id from audit_log where entity_id = '00000000-0000-0000-0000-000000000f01' and action = 'update'), '00000000-0000-0000-0000-0000000000f1'::uuid, 'CA-01: store_id from the session');
select is((select channel from audit_log where entity_id = '00000000-0000-0000-0000-000000000f01' and action = 'update'), 'ui', 'channel defaults to ui');
select ok((select created_at is not null from audit_log where entity_id = '00000000-0000-0000-0000-000000000f01' and action = 'update'), 'CA-01: created_at');

select tests.authenticate_as((select v from ctx where k = 'op4'), 'aal1', '00000000-0000-0000-0000-0000000005a4');
select set_config('request.jwt.claims', jsonb_build_object('sub', (select v from ctx where k = 'op4'), 'role', 'authenticated', 'aal', 'aal1', 'session_id', '00000000-0000-0000-0000-0000000005a4', 'client_id', 'abc')::text, true);
update products set description = 'x' where id = '00000000-0000-0000-0000-000000000f02';
select tests.clear_auth();
select is((select channel from audit_log where entity_id = '00000000-0000-0000-0000-000000000f02' and action = 'update'), 'api', 'a JWT with client_id is not the ui channel');

update products set active = false where id = '00000000-0000-0000-0000-000000000f01';
select is((select count(*)::int from audit_log where entity_id = '00000000-0000-0000-0000-000000000f01' and action = 'deactivate'), 1, 'active false logs deactivate');
update products set active = true where id = '00000000-0000-0000-0000-000000000f01';
select is((select count(*)::int from audit_log where entity_id = '00000000-0000-0000-0000-000000000f01' and action = 'reactivate'), 1, 'active true logs reactivate');
update products set deleted_at = now() where id = '00000000-0000-0000-0000-000000000f01';
select is((select count(*)::int from audit_log where entity_id = '00000000-0000-0000-0000-000000000f01' and action = 'delete'), 1, 'CA-01: deleted_at logs delete');
update profiles set status = 'locked' where id = (select v from ctx where k = 'op3');
select is((select count(*)::int from audit_log where entity_id = (select v from ctx where k = 'op3') and action = 'deactivate'), 1, 'a status change to locked logs deactivate');

select is((select count(*)::int from audit_log where entity_type = 'roles' and company_id is null and entity_id in ('00000000-0000-0000-0000-0000000000d1','00000000-0000-0000-0000-0000000000d3','00000000-0000-0000-0000-0000000000d4')), 3, 'roles carry no company');

select throws_ok($$update audit_log set module = 'x'$$, 'P0001', 'AUDIT_LOG_IMMUTABLE', 'CA-03: postgres cannot update audit_log');
select throws_ok($$delete from audit_log$$, 'P0001', 'AUDIT_LOG_IMMUTABLE', 'CA-03: postgres cannot delete from audit_log');
select throws_ok($$truncate audit_log$$, 'P0001', 'AUDIT_LOG_IMMUTABLE', 'CA-03: postgres cannot truncate audit_log');

select tests.authenticate_as((select v from ctx where k = 'ana'));
select throws_ok($$update audit_log set module = 'x'$$, '42501', null, 'CA-03: an administrator cannot update audit_log');
select throws_ok($$delete from audit_log$$, '42501', null, 'CA-03: an administrator cannot delete from audit_log');
select throws_ok($$insert into audit_log (module, entity_type, entity_id, action, channel) values ('x', 'x', gen_random_uuid(), 'create', 'ui')$$,
  '42501', null, 'nobody inserts into audit_log directly');
select ok((select count(*) from audit_log where company_id = '00000000-0000-0000-0000-0000000000a1') > 0
  and (select count(*) from audit_log where company_id = '00000000-0000-0000-0000-0000000000c3') > 0
  and (select count(*) from audit_log where company_id = '00000000-0000-0000-0000-0000000000b2') = 0,
  'CA-10: an administrator sees all of their companies and nothing of another');
select tests.clear_auth();

select tests.authenticate_as((select v from ctx where k = 'cris'));
select ok((select count(*) from audit_log where company_id = '00000000-0000-0000-0000-0000000000a1') > 0
  and (select count(*) from audit_log where company_id = '00000000-0000-0000-0000-0000000000c3') = 0,
  'CA-10: an administrator without access to a company does not see its history');
select tests.clear_auth();

select tests.authenticate_as((select v from ctx where k = 'sup'));
select ok((select count(*) from audit_log where company_id = '00000000-0000-0000-0000-0000000000b2') > 0, 'CA-10: the superadmin sees everything');
select tests.clear_auth();

select tests.authenticate_as((select v from ctx where k = 'op1'), 'aal1', '00000000-0000-0000-0000-0000000005a1');
select ok((select count(*) from audit_log where module = 'products') > 0, 'CA-04: an operator with view sees the products rows');
select is((select count(*)::int from audit_log where module <> 'products'), 0, 'CA-04: ... and none of other modules');
select tests.clear_auth();

select tests.authenticate_as((select v from ctx where k = 'op3'), 'aal1', '00000000-0000-0000-0000-0000000005a3');
select is((select count(*)::int from audit_log), 0, 'CA-05: an operator without view sees nothing');
select tests.clear_auth();

update profiles set failed_pin_attempts = 3 where id = (select v from ctx where k = 'op1');
select is((select count(*)::int from audit_log where entity_id = (select v from ctx where k = 'op1') and entity_type = 'profiles'), 1, 'pin counter changes are not logged');
select is((select count(*)::int from audit_log a, lateral jsonb_object_keys(coalesce(a.before, '{}') || coalesce(a.after, '{}')) k
  where a.created_at >= transaction_timestamp() and k ~* 'pin|password|credential'), 0, 'Review Focus 2: no sensitive keys in before/after');

insert into auth_events (user_id, event, channel) values
  ((select v from ctx where k = 'op1'), 'login_failed', 'system');

select tests.authenticate_as((select v from ctx where k = 'op4'), 'aal1', '00000000-0000-0000-0000-0000000005a4');
select is((select count(*)::int from auth_events), 0, 'an operator does not read auth_events');
select tests.clear_auth();

select tests.authenticate_as((select v from ctx where k = 'cris'));
select is((select count(*)::int from auth_events), 1, 'an administrator reads the events of the users of their companies');
select tests.clear_auth();

select tests.authenticate_as((select v from ctx where k = 'dan'));
select is((select count(*)::int from auth_events), 0, 'an administrator of another company reads none');
select tests.clear_auth();

select * from finish();
