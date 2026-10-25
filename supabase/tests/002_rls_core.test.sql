select plan(32);

create temp table ctx (k text primary key, v uuid);
grant all on ctx to public;

insert into ctx values
  ('ana', tests.create_user('admin', 'ana@test.dev')),
  ('beto', tests.create_user('admin', 'beto@test.dev')),
  ('cris', tests.create_user('admin', 'cris@test.dev')),
  ('super', tests.create_user('superadmin', 'root@test.dev')),
  ('new_op', gen_random_uuid()),
  ('new_op_b', gen_random_uuid()),
  ('new_admin', gen_random_uuid()),
  ('new_admin2', gen_random_uuid());

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at)
select v, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', k || '@test.dev', '', now(), now()
from ctx where k like 'new_%';

insert into companies (id, name, code, founder_id) values
  ('00000000-0000-0000-0000-0000000000a1', 'Alfa', 'k7m2', (select v from ctx where k = 'ana')),
  ('00000000-0000-0000-0000-0000000000b2', 'Beta', 'p9q4', (select v from ctx where k = 'beto'));

insert into company_admins (company_id, admin_id, granted_by) values
  ('00000000-0000-0000-0000-0000000000a1', (select v from ctx where k = 'ana'), (select v from ctx where k = 'ana')),
  ('00000000-0000-0000-0000-0000000000b2', (select v from ctx where k = 'beto'), (select v from ctx where k = 'beto'));

insert into ctx values
  ('op', tests.create_user('operator', 'caja1@test.dev', '00000000-0000-0000-0000-0000000000a1')),
  ('op_b', tests.create_user('operator', 'caja2@test.dev', '00000000-0000-0000-0000-0000000000b2'));

insert into sites (id, company_id, name) values
  ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000a1', 'Norte'),
  ('00000000-0000-0000-0000-0000000000c2', '00000000-0000-0000-0000-0000000000b2', 'Sur');

insert into stores (company_id, site_id, name) values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c1', 'Caja Norte'),
  ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-0000000000c2', 'Caja Sur');

select tests.authenticate_as((select v from ctx where k = 'ana'));
select is((select array_agg(name) from companies), array['Alfa'],
  'P-01: an administrator sees only the companies of their company_admins');
select is((select array_agg(name order by name) from stores), array['Caja Norte'],
  'P-01: an administrator sees only the stores of their companies');
select is((select count(*) from profiles where id = (select v from ctx where k = 'op_b')), 0::bigint,
  'P-01: an administrator cannot see profiles of another company');
select is((select count(*) from profiles where id = (select v from ctx where k = 'op')), 1::bigint,
  'an administrator sees the operators of their companies');

select tests.authenticate_as((select v from ctx where k = 'cris'));
select is((select count(*) from companies), 0::bigint,
  'P-01: an administrator without access sees no companies');

select tests.authenticate_as((select v from ctx where k = 'ana'), 'aal1');
select is((select count(*) from companies), 0::bigint,
  'ADR-007: an administrator with aal1 sees no companies');
select is((select count(*) from sites), 0::bigint,
  'ADR-007: an administrator with aal1 sees no sites');

select tests.authenticate_as((select v from ctx where k = 'super'));
select is((select count(*) from companies where id in ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000b2')), 2::bigint,
  'the superadmin sees every company');
select is((select count(*) from profiles where id in (select v from ctx where k in ('op', 'op_b', 'ana', 'beto'))), 4::bigint,
  'the superadmin sees every profile');

select tests.authenticate_as((select v from ctx where k = 'super'), 'aal1');
select is((select count(*) from companies), 0::bigint,
  'ADR-007: the superadmin with aal1 sees no companies');

select tests.clear_auth();
set local role anon;
select is((select count(*) from companies) + (select count(*) from profiles) + (select count(*) from stores), 0::bigint,
  'anon sees nothing');

select tests.authenticate_as((select v from ctx where k = 'op'), 'aal1');
select is((select array_agg(name) from companies), array['Alfa'],
  'an operator sees only their company');
select is((select count(*) from sites), 0::bigint,
  'an operator sees no sites');
select is((select count(*) from stores where company_id = '00000000-0000-0000-0000-0000000000b2'), 0::bigint,
  'an operator sees no store of another company');
select is((select array_agg(id) from profiles), array[(select v from ctx where k = 'op')],
  'an operator sees only their own profile');
select throws_ok($$insert into companies (name, code, founder_id) values ('X', 'zz11', (select v from ctx where k = 'ana'))$$, '42501', null,
  'an operator cannot insert into companies');
select throws_ok($$insert into sites (company_id, name) values ('00000000-0000-0000-0000-0000000000a1', 'Oeste')$$, '42501', null,
  'an operator cannot insert into sites');

select tests.authenticate_as((select v from ctx where k = 'ana'));
select lives_ok($$insert into company_admins (company_id, admin_id, granted_by) values ('00000000-0000-0000-0000-0000000000a1', (select v from ctx where k = 'cris'), (select v from ctx where k = 'ana'))$$,
  'REQ-005: an administrator of the company can grant access');

select tests.authenticate_as((select v from ctx where k = 'beto'));
select throws_ok($$insert into company_admins (company_id, admin_id, granted_by) values ('00000000-0000-0000-0000-0000000000a1', (select v from ctx where k = 'beto'), (select v from ctx where k = 'beto'))$$, '42501', null,
  'REQ-005: an administrator without access cannot grant access');

select tests.authenticate_as((select v from ctx where k = 'cris'));
delete from company_admins where admin_id = (select v from ctx where k = 'cris');
select is((select count(*) from company_admins where admin_id = (select v from ctx where k = 'cris')), 1::bigint,
  'REQ-005: a non-founder administrator cannot revoke access');

select tests.authenticate_as((select v from ctx where k = 'ana'));
delete from company_admins where admin_id = (select v from ctx where k = 'ana');
select is((select count(*) from company_admins where admin_id = (select v from ctx where k = 'ana')), 1::bigint,
  'REQ-005: the founder row cannot be revoked');
delete from company_admins where admin_id = (select v from ctx where k = 'cris');
select is((select count(*) from company_admins where admin_id = (select v from ctx where k = 'cris')), 0::bigint,
  'REQ-005: the founder can revoke access');
select lives_ok($$insert into sites (company_id, name) values ('00000000-0000-0000-0000-0000000000a1', 'Oeste')$$,
  'an administrator with access can create a site');
select throws_ok($$insert into sites (company_id, name) values ('00000000-0000-0000-0000-0000000000b2', 'Oeste')$$, '42501', null,
  'an administrator cannot create a site in another company');
select lives_ok($$insert into stores (company_id, site_id, name) values ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c1', 'Caja 2')$$,
  'an administrator with access can create a store');
update companies set name = 'Alfa 2' where id = '00000000-0000-0000-0000-0000000000a1';
select is((select name from companies where id = '00000000-0000-0000-0000-0000000000a1'), 'Alfa 2',
  'an administrator with access can update their company');
update companies set name = 'Beta 2' where id = '00000000-0000-0000-0000-0000000000b2';
select lives_ok($$insert into profiles (id, kind, username, display_name, company_id) values ((select v from ctx where k = 'new_op'), 'operator', 'k7m2.nuevo', 'nuevo', '00000000-0000-0000-0000-0000000000a1')$$,
  'an administrator can create an operator of their company');
select throws_ok($$insert into profiles (id, kind, username, display_name, company_id) values ((select v from ctx where k = 'new_op_b'), 'operator', 'p9q4.nuevo', 'nuevo', '00000000-0000-0000-0000-0000000000b2')$$, '42501', null,
  'an administrator cannot create an operator of another company');
select throws_ok($$insert into profiles (id, kind, display_name) values ((select v from ctx where k = 'new_admin2'), 'admin', 'otro')$$, '42501', null,
  'an administrator cannot create administrators');

select tests.authenticate_as((select v from ctx where k = 'super'));
select lives_ok($$insert into profiles (id, kind, display_name) values ((select v from ctx where k = 'new_admin'), 'admin', 'nuevo')$$,
  'the superadmin can create administrators');
select throws_ok($$insert into sites (company_id, name) values ('00000000-0000-0000-0000-0000000000a1', 'Este')$$, '42501', null,
  'REQ-005: the superadmin cannot create sites');

select tests.clear_auth();
select is((select name from companies where id = '00000000-0000-0000-0000-0000000000b2'), 'Beta',
  'an administrator cannot update another company');
select * from finish();
