select plan(7);

insert into auth.users (id, instance_id, aud, role, email, created_at, updated_at) values
  ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'del@test.dev', now(), now());
insert into profiles (id, kind, display_name) values ('00000000-0000-0000-0000-0000000000d1', 'admin', 'del');

insert into companies (id, name, code, founder_id) values
  ('00000000-0000-0000-0000-0000000000e1', 'itest-del', 'de11', '00000000-0000-0000-0000-0000000000d1'),
  ('00000000-0000-0000-0000-0000000000e2', 'Real', 're22', '00000000-0000-0000-0000-0000000000d1');
insert into company_admins (company_id, admin_id, granted_by) values
  ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000d1');
insert into sites (id, company_id, name) values ('00000000-0000-0000-0000-0000000000e3', '00000000-0000-0000-0000-0000000000e1', 'S');
insert into stores (id, company_id, site_id, name) values ('00000000-0000-0000-0000-0000000000e4', '00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000e3', 'T');

set local role anon;
select throws_ok($$select public.delete_test_company('00000000-0000-0000-0000-0000000000e1')$$, '42501');
reset role;
set local role authenticated;
select throws_ok($$select public.delete_test_company('00000000-0000-0000-0000-0000000000e1')$$, '42501');
reset role;

set local role service_role;
select throws_ok($$select public.delete_test_company('00000000-0000-0000-0000-0000000000e2')$$, 'P0001', 'Only existing itest- companies can be deleted');
select throws_ok($$select public.delete_test_company('00000000-0000-0000-0000-0000000000ff')$$, 'P0001', 'Only existing itest- companies can be deleted');
select lives_ok($$select public.delete_test_company('00000000-0000-0000-0000-0000000000e1')$$);
reset role;

select is((select count(*)::int from companies where id = '00000000-0000-0000-0000-0000000000e1')
  + (select count(*)::int from company_admins where company_id = '00000000-0000-0000-0000-0000000000e1')
  + (select count(*)::int from sites where company_id = '00000000-0000-0000-0000-0000000000e1')
  + (select count(*)::int from stores where company_id = '00000000-0000-0000-0000-0000000000e1'), 0);
select is((select count(*)::int from companies where id = '00000000-0000-0000-0000-0000000000e2'), 1);

select * from finish();
