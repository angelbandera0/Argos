select plan(46);

create temp table ctx (k text primary key, v uuid);
grant all on ctx to public;

insert into ctx values
  ('ana', tests.create_user('admin', 'ana@test.dev')),
  ('cris', tests.create_user('admin', 'cris@test.dev')),
  ('dani', tests.create_user('admin', 'dani@test.dev')),
  ('super', tests.create_user('superadmin', 'root@test.dev'));

insert into companies (id, name, code, founder_id) values
  ('00000000-0000-0000-0000-0000000000a1', 'Alfa', 'k7m2', (select v from ctx where k = 'ana')),
  ('00000000-0000-0000-0000-0000000000d4', 'Delta', 'd4d4', (select v from ctx where k = 'ana')),
  ('00000000-0000-0000-0000-0000000000e5', 'Fresh', 'f5f5', (select v from ctx where k = 'ana')),
  ('00000000-0000-0000-0000-0000000000a6', 'Gama', 'g6g6', (select v from ctx where k = 'ana'));

insert into company_admins (company_id, admin_id, granted_by) values
  ('00000000-0000-0000-0000-0000000000a1', (select v from ctx where k = 'ana'), (select v from ctx where k = 'ana')),
  ('00000000-0000-0000-0000-0000000000a1', (select v from ctx where k = 'cris'), (select v from ctx where k = 'ana'));

insert into ctx values ('op_d', tests.create_user('operator', 'caja@test.dev', '00000000-0000-0000-0000-0000000000d4'));

insert into sites (id, company_id, name) values
  ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000a1', 'Norte'),
  ('00000000-0000-0000-0000-0000000000c2', '00000000-0000-0000-0000-0000000000a1', 'Vacia'),
  ('00000000-0000-0000-0000-0000000000c3', '00000000-0000-0000-0000-0000000000a6', 'Sede G');

insert into stores (id, company_id, site_id, name) values
  ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c1', 'Caja 1'),
  ('00000000-0000-0000-0000-0000000000f2', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c1', 'Caja 2'),
  ('00000000-0000-0000-0000-0000000000f3', '00000000-0000-0000-0000-0000000000a6', '00000000-0000-0000-0000-0000000000c3', 'Caja G');

select throws_ok($$delete from company_admins where company_id = '00000000-0000-0000-0000-0000000000a1' and admin_id = (select v from ctx where k = 'ana')$$,
  'P0001', null, 'REQ-005 CA-05: the founder cannot be removed from company_admins, not even by postgres');
select lives_ok($$delete from company_admins where company_id = '00000000-0000-0000-0000-0000000000a1' and admin_id = (select v from ctx where k = 'cris')$$,
  'a non-founder administrator can be removed');
select throws_ok($$update profiles set deleted_at = now() where id = (select v from ctx where k = 'ana')$$,
  'P0001', null, 'REQ-006 CA-06: a founder administrator cannot be soft-deleted');
select throws_ok($$update profiles set status = 'deactivated' where id = (select v from ctx where k = 'ana')$$,
  'P0001', null, 'DR-006: a founder administrator cannot be deactivated');
select lives_ok($$update profiles set deleted_at = now() where id = (select v from ctx where k = 'dani')$$,
  'a non-founder administrator can be soft-deleted');

select throws_ok($$update companies set status = 'inactive' where id = '00000000-0000-0000-0000-0000000000a6'$$,
  'P0001', null, 'REQ-005 CA-08: deactivating a company requires a reason code');
select throws_ok($$update companies set status = 'inactive', status_reason_code = 'otro' where id = '00000000-0000-0000-0000-0000000000a6'$$,
  'P0001', null, 'REQ-005 CA-08: reason otro requires a text');
select throws_ok($$update sites set status = 'inactive' where id = '00000000-0000-0000-0000-0000000000c3'$$,
  'P0001', null, 'REQ-005 CA-08: deactivating a site requires a reason code');
select throws_ok($$update stores set status = 'inactive', status_reason_code = 'otro', status_reason_text = '  ' where id = '00000000-0000-0000-0000-0000000000f3'$$,
  'P0001', null, 'REQ-005 CA-08: deactivating a store with otro and blank text fails');
select lives_ok($$update companies set status = 'inactive', status_reason_code = 'otro', status_reason_text = 'cierre temporal' where id = '00000000-0000-0000-0000-0000000000a6'$$,
  'REQ-005 CA-08: deactivating with otro and a text works (service path)');
select is((select status_reason_text from companies where id = '00000000-0000-0000-0000-0000000000a6'), 'cierre temporal',
  'the reason is stored');
select lives_ok($$update companies set status = 'active' where id = '00000000-0000-0000-0000-0000000000a6'$$,
  'reactivating needs no reason');
select is((select status_reason_code from companies where id = '00000000-0000-0000-0000-0000000000a6'), null,
  'reactivating clears the reason');

select throws_ok($$update companies set deleted_at = now() where id = '00000000-0000-0000-0000-0000000000a1'$$,
  'P0001', 'HAS_DATA', 'REQ-005 CA-06: a company with a live site cannot be deleted');
select throws_ok($$update companies set deleted_at = now() where id = '00000000-0000-0000-0000-0000000000d4'$$,
  'P0001', 'HAS_DATA', 'a company with a live user cannot be deleted');
select throws_ok($$update sites set deleted_at = now() where id = '00000000-0000-0000-0000-0000000000c1'$$,
  'P0001', 'HAS_DATA', 'a site with a live store cannot be deleted');
select lives_ok($$update companies set deleted_at = now() where id = '00000000-0000-0000-0000-0000000000e5'$$,
  'REQ-005 CA-06: a freshly created company can be deleted');
select lives_ok($$update sites set deleted_at = now() where id = '00000000-0000-0000-0000-0000000000c2'$$,
  'a site without stores can be deleted');
select lives_ok($$update stores set deleted_at = now() where id = '00000000-0000-0000-0000-0000000000f2'$$,
  'a store can be deleted');
select throws_ok($$select app.has_data('bogus', gen_random_uuid())$$, 'P0001', null,
  'has_data rejects an unknown level');

insert into companies (name, code, founder_id)
select 'T' || i, 'tt0' || i, (select v from ctx where k = 'ana') from generate_series(0, 7) i;
insert into sites (company_id, name) select id, 'S' from companies where code like 'tt0%';
insert into stores (company_id, site_id, name) select company_id, id, 'C' from sites where company_id in (select id from companies where code like 'tt0%');
update companies set status = 'inactive', status_reason_code = 'x' where code like 'tt0%' and (right(code, 1)::int & 1) > 0;
update sites set status = 'inactive', status_reason_code = 'x' where company_id in (select id from companies where code like 'tt0%') and (right((select code from companies c where c.id = sites.company_id), 1)::int & 2) > 0;
update stores set status = 'inactive', status_reason_code = 'x' where company_id in (select id from companies where code like 'tt0%') and (right((select code from companies c where c.id = stores.company_id), 1)::int & 4) > 0;

select is((select array_agg(app.is_operational(st.id) order by c.code) from stores st join companies c on c.id = st.company_id where c.code like 'tt0%'),
  array[true, false, false, false, false, false, false, false],
  'REQ-005 CA-13: operational only when store, site and company are all active (8 combinations)');

insert into companies (id, name, code, founder_id, deleted_at) values
  ('00000000-0000-0000-0000-0000000000b1', 'Borrada', 'bb01', (select v from ctx where k = 'ana'), now());
insert into sites (id, company_id, name, deleted_at) values
  ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-0000000000b1', 'S', null),
  ('00000000-0000-0000-0000-0000000000b3', '00000000-0000-0000-0000-0000000000a6', 'Sede borrada', now());
insert into stores (id, company_id, site_id, name, deleted_at) values
  ('00000000-0000-0000-0000-0000000000b4', '00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000b2', 'C', null),
  ('00000000-0000-0000-0000-0000000000b5', '00000000-0000-0000-0000-0000000000a6', '00000000-0000-0000-0000-0000000000c3', 'Tienda borrada', now());
insert into stores (id, company_id, site_id, name) values
  ('00000000-0000-0000-0000-0000000000b6', '00000000-0000-0000-0000-0000000000a6', '00000000-0000-0000-0000-0000000000b3', 'En sede borrada');

select is(app.is_operational('00000000-0000-0000-0000-0000000000b4'), false, 'a store of a deleted company is not operational');
select is(app.is_operational('00000000-0000-0000-0000-0000000000b6'), false, 'a store of a deleted site is not operational');
select is(app.is_operational('00000000-0000-0000-0000-0000000000b5'), false, 'a deleted store is not operational');

select tests.authenticate_as((select v from ctx where k = 'ana'));
select lives_ok($$update stores set status = 'inactive', status_reason_code = 'cierre' where id = '00000000-0000-0000-0000-0000000000f1'$$,
  'the founder deactivates a store');
select is((select status_changed_by from stores where id = '00000000-0000-0000-0000-0000000000f1'), (select v from ctx where k = 'ana'),
  'deactivating sets status_changed_by to auth.uid()');
select lives_ok($$update stores set status = 'active' where id = '00000000-0000-0000-0000-0000000000f1'$$,
  'the founder reactivates a store');
select is((select status_changed_by from stores where id = '00000000-0000-0000-0000-0000000000f1'), (select v from ctx where k = 'ana'),
  'reactivating sets status_changed_by to auth.uid()');
select lives_ok($$update sites set status = 'inactive', status_reason_code = 'cierre' where id = '00000000-0000-0000-0000-0000000000c1'$$,
  'the founder deactivates a site');
select lives_ok($$update companies set status = 'inactive', status_reason_code = 'cierre' where id = '00000000-0000-0000-0000-0000000000a1'$$,
  'the founder deactivates a company');
select tests.clear_auth();

insert into company_admins (company_id, admin_id, granted_by) values
  ('00000000-0000-0000-0000-0000000000a1', (select v from ctx where k = 'cris'), (select v from ctx where k = 'ana'));
insert into companies (id, name, code, founder_id) values
  ('00000000-0000-0000-0000-0000000000b9', 'Beta', 'be9b', (select v from ctx where k = 'cris'));
insert into company_admins (company_id, admin_id, granted_by) values
  ('00000000-0000-0000-0000-0000000000b9', (select v from ctx where k = 'cris'), (select v from ctx where k = 'cris'));
insert into sites (id, company_id, name) values
  ('00000000-0000-0000-0000-0000000000c9', '00000000-0000-0000-0000-0000000000a1', 'Movil');
select tests.authenticate_as((select v from ctx where k = 'cris'));
select throws_ok($$update companies set status = 'active' where id = '00000000-0000-0000-0000-0000000000a1'$$,
  '42501', null, 'I1: a non-founder administrator cannot deactivate or reactivate a company');
select throws_ok($$update companies set deleted_at = now() where id = '00000000-0000-0000-0000-0000000000a1'$$,
  '42501', null, 'I1: a non-founder administrator cannot delete a company');
select throws_ok($$update sites set status = 'active' where id = '00000000-0000-0000-0000-0000000000c1'$$,
  '42501', null, 'I1: a non-founder administrator cannot change a site status');
select throws_ok($$update sites set deleted_at = now() where id = '00000000-0000-0000-0000-0000000000c1'$$,
  '42501', null, 'I1: a non-founder administrator cannot delete a site');
select throws_ok($$update stores set status = 'inactive', status_reason_code = 'x' where id = '00000000-0000-0000-0000-0000000000f1'$$,
  '42501', null, 'I1: a non-founder administrator cannot change a store status');
select throws_ok($$update stores set deleted_at = now() where id = '00000000-0000-0000-0000-0000000000f1'$$,
  '42501', null, 'I1: a non-founder administrator cannot delete a store');
select throws_ok($$update sites set company_id = '00000000-0000-0000-0000-0000000000b9', status = 'inactive', status_reason_code = 'x' where id = '00000000-0000-0000-0000-0000000000c9'$$,
  'P0001', null, 'I1 fix: moving a site to a company the actor founded to change its status is rejected');
select throws_ok($$update sites set company_id = '00000000-0000-0000-0000-0000000000b9' where id = '00000000-0000-0000-0000-0000000000c9'$$,
  'P0001', null, 'I1 fix: sites.company_id is immutable');
select lives_ok($$update stores set status_changed_by = gen_random_uuid(), status_changed_at = '2000-01-01', status_reason_code = 'x', status_reason_text = 'y' where id = '00000000-0000-0000-0000-0000000000f1'$$,
  'I2 fix: an administrator can update audit fields without changing status');
select is((select status_changed_by from stores where id = '00000000-0000-0000-0000-0000000000f1'), (select v from ctx where k = 'ana'),
  'I2 fix: status_changed_by cannot be forged');
select is((select status_changed_at < '2001-01-01' from stores where id = '00000000-0000-0000-0000-0000000000f1'), false,
  'I2 fix: status_changed_at cannot be forged');
select is((select status_reason_code from stores where id = '00000000-0000-0000-0000-0000000000f1'), null,
  'I2 fix: status_reason_code cannot be set on an active entity');
select throws_ok($$insert into sites (company_id, name, status) values ('00000000-0000-0000-0000-0000000000a1', 'Nace inactiva', 'inactive')$$,
  'P0001', null, 'I2 fix: a site cannot be inserted inactive without a reason');
select lives_ok($$insert into sites (id, company_id, name, status_changed_by, status_changed_at) values ('00000000-0000-0000-0000-0000000000ca', '00000000-0000-0000-0000-0000000000a1', 'Forjada', gen_random_uuid(), '2000-01-01')$$,
  'I2 fix: an administrator can insert a site');
select is((select status_changed_by from sites where id = '00000000-0000-0000-0000-0000000000ca'), null,
  'I2 fix: status_changed_by is nulled on insert');
select tests.clear_auth();

select tests.authenticate_as((select v from ctx where k = 'super'));
select lives_ok($$update sites set status = 'active' where id = '00000000-0000-0000-0000-0000000000c1'$$,
  'I1: the superadmin can reactivate a site');
select tests.clear_auth();

select * from finish();
