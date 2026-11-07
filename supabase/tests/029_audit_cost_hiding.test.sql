select plan(4);

create temp table ctx (k text primary key, v uuid);
grant all on ctx to public;

insert into ctx values ('ana', tests.create_user('admin', 'ach-ana@test.dev'));
insert into companies (id, name, code, founder_id) values
  ('00000000-0000-0000-0000-0000000000a1', 'Alfa', 'k7m3', (select v from ctx where k = 'ana'));
insert into company_admins (company_id, admin_id, granted_by) values
  ('00000000-0000-0000-0000-0000000000a1', (select v from ctx where k = 'ana'), (select v from ctx where k = 'ana'));
insert into ctx values
  ('y1', tests.create_user('operator', 'ach-y1@test.dev', '00000000-0000-0000-0000-0000000000a1')),
  ('n1', tests.create_user('operator', 'ach-n1@test.dev', '00000000-0000-0000-0000-0000000000a1'));
insert into sites (id, company_id, name) values ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000a1', 'Norte');
insert into stores (id, company_id, site_id, name) values
  ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c1', 'Caja 1');
insert into roles (id, owner_id, name) values
  ('00000000-0000-0000-0000-0000000000d1', (select v from ctx where k = 'ana'), 'Ve costos'),
  ('00000000-0000-0000-0000-0000000000d2', (select v from ctx where k = 'ana'), 'Sin costos');
insert into role_permissions (role_id, module, can_view) values
  ('00000000-0000-0000-0000-0000000000d1', 'orders', true),
  ('00000000-0000-0000-0000-0000000000d2', 'orders', true);
insert into role_special_permissions (role_id, permission, warehouse) values
  ('00000000-0000-0000-0000-0000000000d1', 'see_costs', false);
insert into user_stores (user_id, store_id, company_id, role_id) values
  ((select v from ctx where k = 'y1'), '00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000d1'),
  ((select v from ctx where k = 'n1'), '00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000d2');
insert into app_sessions (session_id, user_id, active_store_id) values
  ('00000000-0000-0000-0000-0000000005e1', (select v from ctx where k = 'y1'), '00000000-0000-0000-0000-0000000000f1'),
  ('00000000-0000-0000-0000-0000000005e2', (select v from ctx where k = 'n1'), '00000000-0000-0000-0000-0000000000f1');
insert into audit_log (id, company_id, module, entity_type, entity_id, action, channel, after) values
  ('00000000-0000-0000-0000-00000000ee01', '00000000-0000-0000-0000-0000000000a1', 'orders', 'order_lines', '00000000-0000-0000-0000-000000000b01', 'create', 'system',
   '{"qty": 2, "unit_cost": 9, "lines": [{"price": 3, "name": "x"}]}');

select tests.authenticate_as((select v from ctx where k = 'n1'), 'aal2', '00000000-0000-0000-0000-0000000005e2');
select is((select after from audit_history where id = '00000000-0000-0000-0000-00000000ee01'), '{"qty": 2, "lines": [{"name": "x"}]}'::jsonb, 'no see_costs: costs stripped at source');
select throws_ok($$select after from audit_log$$, '42501', null, 'no direct read of audit_log.after');
select tests.authenticate_as((select v from ctx where k = 'y1'), 'aal2', '00000000-0000-0000-0000-0000000005e1');
select ok((select after ? 'unit_cost' from audit_history where id = '00000000-0000-0000-0000-00000000ee01'), 'see_costs sees costs');
select tests.authenticate_as((select v from ctx where k = 'ana'));
select ok((select after ? 'unit_cost' from audit_history where id = '00000000-0000-0000-0000-00000000ee01'), 'admin sees costs');
select tests.clear_auth();

select * from finish();
