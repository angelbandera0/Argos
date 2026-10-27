select plan(15);

create temp table ctx (k text primary key, v uuid);
grant all on ctx to public;

insert into ctx values
  ('ana', tests.create_user('admin', 'ana@test.dev')),
  ('cris', tests.create_user('admin', 'cris@test.dev')),
  ('super', tests.create_user('superadmin', 'root@test.dev'));

insert into companies (id, name, code, founder_id) values
  ('00000000-0000-0000-0000-0000000000a1', 'Alfa', 'k7m2', (select v from ctx where k = 'ana'));

insert into company_admins (company_id, admin_id, granted_by) values
  ('00000000-0000-0000-0000-0000000000a1', (select v from ctx where k = 'ana'), (select v from ctx where k = 'ana')),
  ('00000000-0000-0000-0000-0000000000a1', (select v from ctx where k = 'cris'), (select v from ctx where k = 'ana'));

insert into ctx values ('op', tests.create_user('operator', 'caja@test.dev', '00000000-0000-0000-0000-0000000000a1'));

insert into roles (id, owner_id, name) values
  ('00000000-0000-0000-0000-0000000000b1', (select v from ctx where k = 'ana'), 'Cajero');
insert into role_permissions (role_id, module, can_view) values
  ('00000000-0000-0000-0000-0000000000b1', 'products', true);

select tests.authenticate_as((select v from ctx where k = 'ana'));
select is((select count(*)::int from roles), 1, 'the owner sees their role');
select is((select count(*)::int from role_permissions), 1, 'the owner sees their permissions');
select lives_ok($$insert into role_company_exclusions values ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000a1')$$,
  'the owner can exclude a company');
select throws_ok($$insert into roles (owner_id, name) values ((select v from ctx where k = 'ana'), ' cajero ')$$,
  '23505', null, 'role name is unique per owner among non-deleted roles');
select lives_ok($$update roles set deleted_at = now() where id = '00000000-0000-0000-0000-0000000000b1'$$,
  'the owner can soft-delete a role');
select lives_ok($$insert into roles (owner_id, name) values ((select v from ctx where k = 'ana'), 'Cajero')$$,
  'the name is reusable once the previous role is deleted');
select throws_ok($$insert into role_permissions (role_id, module, can_create) values ('00000000-0000-0000-0000-0000000000b1', 'products', true)$$,
  '23514', null, 'can_create without can_view fails');

select tests.authenticate_as((select v from ctx where k = 'ana'), 'aal1');
select is((select count(*)::int from roles), 0, 'the owner at aal1 sees no roles');

select tests.authenticate_as((select v from ctx where k = 'cris'));
select is((select count(*)::int from roles), 0, 'REQ-007 CA-10: another admin of the same company sees 0 roles');
select is((select count(*)::int from role_permissions), 0, 'another admin sees no permissions');
select is((select count(*)::int from role_company_exclusions), 0, 'another admin sees no exclusions');
select throws_ok($$insert into roles (owner_id, name) values ((select v from ctx where k = 'ana'), 'Intruso')$$,
  '42501', null, 'an admin cannot create roles for another owner');
select throws_ok($$insert into role_permissions (role_id, module, can_view) values ('00000000-0000-0000-0000-0000000000b1', 'products', true)$$,
  '42501', null, 'an admin cannot add permissions to another owner role');

select tests.authenticate_as((select v from ctx where k = 'op'));
select is((select count(*)::int from roles), 0, 'an operator sees no roles');

select tests.authenticate_as((select v from ctx where k = 'super'));
select is((select count(*)::int from roles where owner_id = (select v from ctx where k = 'ana')), 0, 'the superadmin sees no roles');

select tests.clear_auth();
select * from finish();
