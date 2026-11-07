select plan(5);

create temp table ctx (k text primary key, v uuid);
grant all on ctx to public;

insert into ctx values ('ana', tests.create_user('admin', 'ana13@test.dev'));
insert into companies (id, name, code, founder_id) values
  ('00000000-0000-0000-0000-0000000013a1', 'Alfa13', 'k713', (select v from ctx where k = 'ana'));
insert into company_admins (company_id, admin_id, granted_by) values
  ('00000000-0000-0000-0000-0000000013a1', (select v from ctx where k = 'ana'), (select v from ctx where k = 'ana'));
insert into ctx values ('op', tests.create_user('operator', 'op13@test.dev', '00000000-0000-0000-0000-0000000013a1'));
insert into sites (id, company_id, name) values ('00000000-0000-0000-0000-0000000013c1', '00000000-0000-0000-0000-0000000013a1', 'Norte');
insert into stores (id, company_id, site_id, name) values
  ('00000000-0000-0000-0000-0000000013f1', '00000000-0000-0000-0000-0000000013a1', '00000000-0000-0000-0000-0000000013c1', 'T1'),
  ('00000000-0000-0000-0000-0000000013f2', '00000000-0000-0000-0000-0000000013a1', '00000000-0000-0000-0000-0000000013c1', 'T2'),
  ('00000000-0000-0000-0000-0000000013f3', '00000000-0000-0000-0000-0000000013a1', '00000000-0000-0000-0000-0000000013c1', 'T3'),
  ('00000000-0000-0000-0000-0000000013f4', '00000000-0000-0000-0000-0000000013a1', '00000000-0000-0000-0000-0000000013c1', 'T4');
insert into roles (id, owner_id, name) values
  ('00000000-0000-0000-0000-0000000013d1', (select v from ctx where k = 'ana'), 'Con especiales'),
  ('00000000-0000-0000-0000-0000000013d2', (select v from ctx where k = 'ana'), 'Sin especiales'),
  ('00000000-0000-0000-0000-0000000013d3', (select v from ctx where k = 'ana'), 'Borrado'),
  ('00000000-0000-0000-0000-0000000013d4', (select v from ctx where k = 'ana'), 'Excluido');
insert into role_special_permissions (role_id, permission, warehouse) values
  ('00000000-0000-0000-0000-0000000013d1', 'transfer', true),
  ('00000000-0000-0000-0000-0000000013d1', 'see_costs', false),
  ('00000000-0000-0000-0000-0000000013d3', 'transfer', true),
  ('00000000-0000-0000-0000-0000000013d4', 'transfer', true);
insert into user_stores (user_id, store_id, company_id, role_id) values
  ((select v from ctx where k = 'op'), '00000000-0000-0000-0000-0000000013f1', '00000000-0000-0000-0000-0000000013a1', '00000000-0000-0000-0000-0000000013d1'),
  ((select v from ctx where k = 'op'), '00000000-0000-0000-0000-0000000013f2', '00000000-0000-0000-0000-0000000013a1', '00000000-0000-0000-0000-0000000013d2'),
  ((select v from ctx where k = 'op'), '00000000-0000-0000-0000-0000000013f3', '00000000-0000-0000-0000-0000000013a1', '00000000-0000-0000-0000-0000000013d3'),
  ((select v from ctx where k = 'op'), '00000000-0000-0000-0000-0000000013f4', '00000000-0000-0000-0000-0000000013a1', '00000000-0000-0000-0000-0000000013d4');
update roles set deleted_at = now() where id = '00000000-0000-0000-0000-0000000013d3';
insert into role_company_exclusions (role_id, company_id) values
  ('00000000-0000-0000-0000-0000000013d4', '00000000-0000-0000-0000-0000000013a1');

select tests.authenticate_as((select v from ctx where k = 'op'), 'aal1');
select is((select special from my_store_access('00000000-0000-0000-0000-0000000013f1')),
  '[{"permission":"see_costs","warehouse":false},{"permission":"transfer","warehouse":true}]'::jsonb, 'special permissions carry the warehouse flag');
select is((select special from my_store_access('00000000-0000-0000-0000-0000000013f2')), '[]'::jsonb, 'a role without special permissions gets an empty array');
select is((select special from my_store_access('00000000-0000-0000-0000-0000000013f3')), '[]'::jsonb, 'a deleted role gets an empty array');
select is((select special from my_store_access('00000000-0000-0000-0000-0000000013f4')), '[]'::jsonb, 'an excluded company gets an empty array');

select tests.authenticate_as((select v from ctx where k = 'ana'));
select is((select count(*)::int from my_store_access()), 0, 'an admin still gets no rows');

select tests.clear_auth();
select * from finish();
