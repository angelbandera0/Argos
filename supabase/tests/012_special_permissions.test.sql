select plan(20);

create temp table ctx (k text primary key, v uuid);
grant all on ctx to public;

insert into ctx values
  ('ana', tests.create_user('admin', 'ana@test.dev')),
  ('dan', tests.create_user('admin', 'dan@test.dev'));

insert into companies (id, name, code, founder_id) values
  ('00000000-0000-0000-0000-0000000000a1', 'Alfa', 'k7m2', (select v from ctx where k = 'ana')),
  ('00000000-0000-0000-0000-0000000000b2', 'Beta', 'b2b2', (select v from ctx where k = 'dan'));
insert into company_admins (company_id, admin_id, granted_by) values
  ('00000000-0000-0000-0000-0000000000a1', (select v from ctx where k = 'ana'), (select v from ctx where k = 'ana')),
  ('00000000-0000-0000-0000-0000000000b2', (select v from ctx where k = 'dan'), (select v from ctx where k = 'dan'));

insert into ctx values
  ('op1', tests.create_user('operator', 'alm@test.dev', '00000000-0000-0000-0000-0000000000a1')),
  ('op2', tests.create_user('operator', 'ver@test.dev', '00000000-0000-0000-0000-0000000000a1'));

insert into sites (id, company_id, name) values
  ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000a1', 'Norte');
insert into stores (id, company_id, site_id, name) values
  ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c1', 'Caja 1'),
  ('00000000-0000-0000-0000-0000000000f2', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c1', 'Caja 2');

insert into roles (id, owner_id, name) values
  ('00000000-0000-0000-0000-0000000000d1', (select v from ctx where k = 'ana'), 'Almacenero'),
  ('00000000-0000-0000-0000-0000000000d2', (select v from ctx where k = 'ana'), 'Visor');
insert into role_permissions (role_id, module, can_view, can_create, can_edit) values
  ('00000000-0000-0000-0000-0000000000d1', 'currencies', true, true, true),
  ('00000000-0000-0000-0000-0000000000d2', 'currencies', true, false, false);
insert into role_special_permissions (role_id, permission, warehouse) values
  ('00000000-0000-0000-0000-0000000000d1', 'transfer', true),
  ('00000000-0000-0000-0000-0000000000d1', 'see_costs', false);

insert into user_stores (user_id, store_id, company_id, role_id) values
  ((select v from ctx where k = 'op1'), '00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000d1'),
  ((select v from ctx where k = 'op2'), '00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000d2');
insert into app_sessions (session_id, user_id, active_store_id) values
  ('00000000-0000-0000-0000-0000000005a1', (select v from ctx where k = 'op1'), '00000000-0000-0000-0000-0000000000f1'),
  ('00000000-0000-0000-0000-0000000005a2', (select v from ctx where k = 'op2'), '00000000-0000-0000-0000-0000000000f1');

insert into currencies (id, company_id, code, name, symbol) values
  ('00000000-0000-0000-0000-000000000c01', '00000000-0000-0000-0000-0000000000a1', 'MXN', 'Peso', '$');

select throws_ok($$insert into role_permissions (role_id, module, can_view) values ('00000000-0000-0000-0000-0000000000d2', 'bogus', true)$$,
  '23514', null, 'an unknown module is rejected');
select lives_ok($$insert into role_permissions (role_id, module, can_view, can_create) values ('00000000-0000-0000-0000-0000000000d2', 'stock', true, true)$$,
  'the new modules are accepted');
select throws_ok($$insert into role_permissions (role_id, module, can_view, can_edit) values ('00000000-0000-0000-0000-0000000000d2', 'notifications', true, true)$$,
  '23514', null, 'notifications are view-only');
select throws_ok($$insert into role_special_permissions (role_id, permission) values ('00000000-0000-0000-0000-0000000000d2', 'fly')$$,
  '23514', null, 'an unknown special permission is rejected');
select throws_ok($$insert into role_special_permissions (role_id, permission) values ('00000000-0000-0000-0000-0000000000d1', 'transfer')$$,
  '23505', null, 'a special permission cannot repeat in a role');

select tests.authenticate_as((select v from ctx where k = 'ana'));
select lives_ok($$insert into role_special_permissions (role_id, permission) values ('00000000-0000-0000-0000-0000000000d2', 'write_off')$$,
  'the owner grants a special permission');
select is((select count(*)::int from role_special_permissions), 3, 'the owner sees the special permissions of their roles');
select ok(app.has_special('adjust_stock') and app.has_special_in_store('adjust_stock', '00000000-0000-0000-0000-0000000000f2')
  and app.has_special_warehouse('adjust_stock', '00000000-0000-0000-0000-0000000000a1'), 'a company admin has every special permission');
select tests.authenticate_as((select v from ctx where k = 'dan'));
select is(app.has_special_in_store('transfer', '00000000-0000-0000-0000-0000000000f1') or app.has_special_warehouse('transfer', '00000000-0000-0000-0000-0000000000a1'),
  false, 'an admin of another company has no special permission here');
select throws_ok($$insert into role_special_permissions (role_id, permission) values ('00000000-0000-0000-0000-0000000000d2', 'build_orders')$$,
  '42501', null, 'another admin cannot grant special permissions on a role they do not own');

select tests.authenticate_as((select v from ctx where k = 'op1'), 'aal1', '00000000-0000-0000-0000-0000000005a1');
select is((select count(*)::int from role_special_permissions), 0, 'an operator cannot read the table');
select ok(app.has_special('transfer'), 'an operator with the permission has it');
select is(app.has_special('write_off'), false, 'an operator without the permission lacks it');
select ok(app.has_special_in_store('transfer', '00000000-0000-0000-0000-0000000000f1'), 'the permission applies in an assigned store');
select is(app.has_special_in_store('transfer', '00000000-0000-0000-0000-0000000000f2'), false, 'the permission does not apply in an unassigned store');
select ok(app.has_special_warehouse('transfer', '00000000-0000-0000-0000-0000000000a1'), 'warehouse scope when the flag is set');
select is(app.has_special_warehouse('see_costs', '00000000-0000-0000-0000-0000000000a1'), false, 'no warehouse scope without the flag');
select lives_ok($$insert into currencies (company_id, code, name, symbol) values ('00000000-0000-0000-0000-0000000000a1', 'USD', 'Dólar', '$')$$,
  'an operator with currencies create writes');

select tests.authenticate_as((select v from ctx where k = 'op2'), 'aal1', '00000000-0000-0000-0000-0000000005a2');
select throws_ok($$insert into currencies (company_id, code, name, symbol) values ('00000000-0000-0000-0000-0000000000a1', 'EUR', 'Euro', '€')$$,
  '42501', null, 'an operator with only view cannot write currencies');

select tests.clear_auth();
select is((select count(*)::int from audit_log where entity_type = 'role_special_permissions' and module = 'roles'
  and entity_id = '00000000-0000-0000-0000-0000000000d1'), 2, 'special permissions are audited under roles');
select * from finish();
