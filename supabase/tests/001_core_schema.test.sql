select plan(41);

create temp table ctx (k text primary key, v uuid);
grant all on ctx to public;

insert into ctx values
  ('admin', tests.create_user('admin', 'ana@test.dev')),
  ('admin2', tests.create_user('admin', 'beto@test.dev')),
  ('admin3', tests.create_user('admin', 'cris@test.dev')),
  ('admin4', tests.create_user('admin', 'dani@test.dev')),
  ('admin5', tests.create_user('admin', 'eli@test.dev')),
  ('super', tests.create_user('superadmin', 'root@test.dev'));

update profiles set status = 'locked' where id = (select v from ctx where k = 'admin3');
update profiles set status = 'deactivated' where id = (select v from ctx where k = 'admin4');
update profiles set deleted_at = now() where id = (select v from ctx where k = 'admin5');

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

select throws_ok($$update profiles set username = 'K7M2.Caja1' where id = (select v from ctx where k = 'admin2')$$, '23514', null,
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

select throws_ok($$select tests.create_user('operator', 'nocompany@test.dev')$$, '23514', null,
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
select throws_ok($$select create_company('Delta')$$, 'P0001', 'Only an active administrator can create companies', 'DR-005: create_company rejects an operator');
select tests.authenticate_as(gen_random_uuid());
select throws_ok($$select create_company('Delta')$$, 'P0001', 'Only an active administrator can create companies', 'DR-005: create_company rejects a user without profile');
select tests.authenticate_as((select v from ctx where k = 'admin3'));
select throws_ok($$select create_company('Delta')$$, 'P0001', 'Only an active administrator can create companies', 'DR-005: create_company rejects a locked admin');
select tests.authenticate_as((select v from ctx where k = 'admin4'));
select throws_ok($$select create_company('Delta')$$, 'P0001', 'Only an active administrator can create companies', 'DR-005: create_company rejects a deactivated admin');
select tests.authenticate_as((select v from ctx where k = 'admin5'));
select throws_ok($$select create_company('Delta')$$, 'P0001', 'Only an active administrator can create companies', 'DR-005: create_company rejects a soft-deleted admin');
select tests.authenticate_as((select v from ctx where k = 'admin'));
select throws_ok($$select create_company('   ')$$, 'P0001', 'Company name must be between 1 and 80 characters', 'DR-005: create_company rejects a blank name');
select throws_ok($$select create_company(repeat('x', 81))$$, 'P0001', 'Company name must be between 1 and 80 characters', 'DR-005: create_company rejects an 81-character name');
select is((select count(*) from profiles) + (select count(*) from companies) + (select count(*) from company_admins)
  + (select count(*) from sites) + (select count(*) from stores), 0::bigint,
  'T-04: authenticated admin reads zero rows (RLS, no policies)');
select throws_ok($$insert into sites (company_id, name) values ('00000000-0000-0000-0000-0000000000a1', 'Z')$$, '42501', null,
  'T-04: authenticated admin cannot insert (RLS, no policies)');
select tests.clear_auth();

select throws_ok($$select create_company('Delta')$$, 'P0001', 'Only an active administrator can create companies', 'DR-005: create_company rejects a null auth.uid()');

select is((select count(*) from pg_class where relnamespace = 'public'::regnamespace
  and relname in ('profiles', 'companies', 'company_admins', 'sites', 'stores') and relrowsecurity), 5::bigint,
  'T-04: RLS is enabled on the five core tables');

set local role anon;
select is((select count(*) from profiles) + (select count(*) from companies) + (select count(*) from company_admins)
  + (select count(*) from sites) + (select count(*) from stores), 0::bigint,
  'T-04: anon sees zero rows (RLS, no policies)');
select throws_ok($$select create_company('Delta')$$, '42501', null, 'T-04: anon cannot execute create_company');
reset role;

select is((select count(*) from unnest(array['profiles', 'companies', 'company_admins', 'sites', 'stores']) t
  where has_table_privilege('authenticated', 'public.' || t, 'truncate,references,trigger')
     or has_table_privilege('anon', 'public.' || t, 'truncate,references,trigger')), 0::bigint,
  'T-04: anon and authenticated lack truncate, references and trigger privileges');

update sites set updated_at = '2000-01-01', name = 'Sur 2' where id = '00000000-0000-0000-0000-0000000000c2';
select ok((select updated_at from sites where id = '00000000-0000-0000-0000-0000000000c2') > '2000-01-01',
  'P-02: touch_updated_at bumps updated_at');

select throws_ok($$with u as (insert into auth.users (id) values ('00000000-0000-0000-0000-0000000000f1') returning id)
  insert into profiles (id, kind, username, display_name, company_id)
  select id, 'operator', 'p9q4.caja2', 'x', '00000000-0000-0000-0000-0000000000a1' from u$$, 'P0001', null,
  'DR-011: operator username prefix must match the company code');

select throws_ok($$with u as (insert into auth.users (id) values ('00000000-0000-0000-0000-0000000000f2') returning id)
  insert into profiles (id, kind, username, display_name, company_id)
  select id, 'operator', 'noformat', 'x', '00000000-0000-0000-0000-0000000000a1' from u$$, 'P0001', null,
  'DR-011: operator username must have the code.name shape');

select throws_ok($$update profiles set username = 'k7m2.otro' where id = (select v from ctx where k = 'op')$$, 'P0001', null,
  'DR-011: a username cannot be renamed');

select throws_ok($$update profiles set company_id = '00000000-0000-0000-0000-0000000000b2' where id = (select v from ctx where k = 'op')$$, 'P0001', null,
  'DR-009: an operator cannot move to another company');

select throws_ok($$insert into company_admins (company_id, admin_id, granted_by)
  select '00000000-0000-0000-0000-0000000000a1', v, (select v from ctx where k = 'admin') from ctx where k = 'op'$$, 'P0001', null,
  'DR-005: an operator cannot be a company admin');

select throws_ok($$insert into companies (name, code, founder_id) select 'X', 'zz99', v from ctx where k = 'op'$$, 'P0001', null,
  'DR-005: an operator cannot be a company founder');

select throws_ok($$insert into companies (name, code, founder_id) values ('  ', 'zz98', (select v from ctx where k = 'admin'))$$, '23514', null,
  'DR-001: company name cannot be blank');

select throws_ok($$insert into sites (company_id, name) values ('00000000-0000-0000-0000-0000000000a1', '  ')$$, '23514', null,
  'DR-015: site name cannot be blank');

select throws_ok($$insert into stores (company_id, site_id, name) values ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c1', '  ')$$, '23514', null,
  'DR-015: store name cannot be blank');

select * from finish();
