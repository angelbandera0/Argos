select plan(23);

create temp table ctx (k text primary key, v uuid);
grant all on ctx to public;

insert into ctx values
  ('admin', tests.create_user('admin', 'ana@test.dev')),
  ('admin2', tests.create_user('admin', 'beto@test.dev')),
  ('admin3', tests.create_user('admin', 'cris@test.dev')),
  ('super', tests.create_user('superadmin', 'root@test.dev'));

update profiles set status = 'locked' where id = (select v from ctx where k = 'admin3');

insert into companies (id, name, code, founder_id) values
  ('00000000-0000-0000-0000-0000000000a1', 'Alfa', 'k7m2', (select v from ctx where k = 'admin')),
  ('00000000-0000-0000-0000-0000000000b2', 'Beta', 'p9q4', (select v from ctx where k = 'admin2'));

insert into ctx values ('op', tests.create_user('operator', 'caja1@test.dev', '00000000-0000-0000-0000-0000000000a1'));

insert into sites (id, company_id, name) values
  ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000a1', 'Norte'),
  ('00000000-0000-0000-0000-0000000000c2', '00000000-0000-0000-0000-0000000000b2', 'Sur');

insert into stores (company_id, site_id, name)
values ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c1', 'Caja');

select throws_ok($$select tests.create_user('superadmin', 'root2@test.dev')$$, '23505', null,
  'REQ-005 CA-01: a second superadmin profile is rejected');

select throws_ok($$update profiles set username = 'K7M2.Caja1' where id = (select v from ctx where k = 'op')$$, '23514', null,
  'DR-011: mixed-case username is rejected');

select throws_ok($$select tests.create_user('operator', 'CAJA1@other.dev', '00000000-0000-0000-0000-0000000000a1')$$, '23505', null,
  'DR-011: duplicate username is rejected');

select tests.create_user('operator', 'luis@test.dev', '00000000-0000-0000-0000-0000000000a1');
update profiles set deleted_at = now() where username = 'k7m2.luis';
select throws_ok($$select tests.create_user('operator', 'luis@other.dev', '00000000-0000-0000-0000-0000000000a1')$$, '23505', null,
  'DR-011: a soft-deleted username cannot be reused');

select throws_ok($$insert into companies (name, code, founder_id) values ('X', 'ABCD', (select v from ctx where k = 'admin'))$$, '23514', null,
  'DR-001: company code must be lowercase alphanumeric');

select throws_ok($$insert into companies (name, code, founder_id) values ('X', 'abc', (select v from ctx where k = 'admin'))$$, '23514', null,
  'DR-001: company code must have 4 characters');

select throws_ok($$insert into companies (name, code, founder_id) values ('X', 'k7m2', (select v from ctx where k = 'admin'))$$, '23505', null,
  'DR-001: company code is unique');

select throws_ok($$update companies set code = 'zzzz' where code = 'k7m2'$$, null, 'companies.code is immutable',
  'DR-001: company code is immutable');

select throws_ok($$insert into stores (company_id, site_id, name) values ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-0000000000c1', 'Cruzada')$$, '23503', null,
  'DR-009: a store cannot hang from a site of another company');

select throws_ok($$insert into sites (company_id, name) values ('00000000-0000-0000-0000-0000000000a1', ' norte ')$$, '23505', null,
  'DR-015: site name is unique per company among live rows');

update sites set deleted_at = now() where id = '00000000-0000-0000-0000-0000000000c1';
select lives_ok($$insert into sites (company_id, name) values ('00000000-0000-0000-0000-0000000000a1', 'Norte')$$,
  'DR-015: site name is reusable after soft delete');

select lives_ok($$insert into sites (company_id, name) values ('00000000-0000-0000-0000-0000000000a1', 'Sur')$$,
  'DR-015: the same site name is allowed in another company');

select throws_ok($$insert into stores (company_id, site_id, name) values ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-0000000000c2', 'Caja'), ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-0000000000c2', ' CAJA')$$, '23505', null,
  'DR-015: store name is unique per site among live rows');

select throws_ok($$update profiles set company_id = null where id = (select v from ctx where k = 'op')$$, '23514', null,
  'DR-009: an operator requires company_id');

select throws_ok($$update profiles set username = 'k7m2.ana' where id = (select v from ctx where k = 'admin')$$, '23514', null,
  'DR-011: an admin cannot have a username');

select tests.authenticate_as((select v from ctx where k = 'admin'));
insert into ctx select 'gamma', id from create_company('  Gamma  ');
select tests.clear_auth();

select matches((select code from companies where id = (select v from ctx where k = 'gamma')), '^[a-z0-9]{4}$',
  'DR-001: create_company assigns a 4-character code');

select ok(exists (select 1 from company_admins ca join companies c on c.id = ca.company_id
  where c.id = (select v from ctx where k = 'gamma') and ca.admin_id = c.founder_id
    and ca.admin_id = (select v from ctx where k = 'admin') and ca.granted_by = ca.admin_id),
  'DR-005: create_company inserts the founder into company_admins');

select tests.authenticate_as((select v from ctx where k = 'op'));
select throws_ok($$select create_company('Delta')$$, null, null, 'DR-005: create_company rejects an operator');
select tests.authenticate_as(gen_random_uuid());
select throws_ok($$select create_company('Delta')$$, null, null, 'DR-005: create_company rejects a user without profile');
select tests.authenticate_as((select v from ctx where k = 'admin3'));
select throws_ok($$select create_company('Delta')$$, null, null, 'DR-005: create_company rejects an inactive admin');
select tests.authenticate_as((select v from ctx where k = 'admin'));
select throws_ok($$select create_company('   ')$$, null, null, 'DR-005: create_company rejects a blank name');
select tests.clear_auth();

select is((select count(*) from pg_class where relnamespace = 'public'::regnamespace
  and relname in ('profiles', 'companies', 'company_admins', 'sites', 'stores') and relrowsecurity), 5::bigint,
  'T-04: RLS is enabled on the five core tables');

set local role anon;
select is((select count(*) from profiles) + (select count(*) from companies) + (select count(*) from company_admins)
  + (select count(*) from sites) + (select count(*) from stores), 0::bigint,
  'T-04: anon sees zero rows (RLS, no policies)');
reset role;

select * from finish();
